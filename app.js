const form = document.getElementById("tradeForm");
const message = document.getElementById("message");
const search = document.getElementById("search");
const dateInput = document.getElementById("date");
let trades = [];

dateInput.value = new Date().toISOString().slice(0, 10);

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function loadTrades() {
  try {
    const response = await fetch("/api/trades");
    if (!response.ok) throw new Error("Could not load saved trades.");
    trades = await response.json();
    renderTrades();
    await loadStats();
  } catch (error) {
    message.textContent = error.message + " Make sure the Node.js server is running.";
    message.style.color = "#b42323";
  }
}

async function loadStats() {
  const response = await fetch("/api/stats");
  if (!response.ok) return;
  const stats = await response.json();
  document.getElementById("totalTrades").textContent = stats.total;
  document.getElementById("wins").textContent = stats.wins;
  document.getElementById("losses").textContent = stats.losses;
  document.getElementById("winRate").textContent = `${stats.winRate.toFixed(1)}%`;
  const totalPL = document.getElementById("totalPL");
  totalPL.textContent = money(stats.totalPL);
  totalPL.className = stats.totalPL > 0 ? "positive" : stats.totalPL < 0 ? "negative" : "";
}

function renderTrades() {
  const query = search.value.trim().toLowerCase();
  const filtered = trades.filter(t => String(t.symbol).toLowerCase().includes(query) || String(t.notes || "").toLowerCase().includes(query));
  const tbody = document.getElementById("tradeRows");
  tbody.replaceChildren();

  if (!filtered.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 9;
    cell.className = "empty";
    cell.textContent = trades.length ? "No matching trades." : "No trades saved yet.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  filtered.forEach(trade => {
    const row = document.createElement("tr");
    const values = [trade.date, trade.symbol, trade.direction, money(trade.entry), money(trade.exit),Number(trade.quantity).toFixed(2), money(trade.result), trade.notes || "—"];
    values.forEach((value, index) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      if (index === 6) cell.className = Number(trade.result) > 0 ? "positive" : Number(trade.result) < 0 ? "negative" : "";
      if (index === 7) cell.className = "notes";
      row.appendChild(cell);
    });
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteTrade(trade.id));
    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);
    tbody.appendChild(row);
  });
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  message.textContent = "Saving trade...";
  message.style.color = "#687386";

  const trade = {
    date: dateInput.value,
    symbol: document.getElementById("symbol").value,
    direction: document.getElementById("direction").value,
    entry: document.getElementById("entry").value,
    exit: document.getElementById("exit").value,
    quantity: document.getElementById("quantity").value,
    notes: document.getElementById("notes").value
  };

  try {
    const response = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trade)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not save trade.");
    form.reset();
    dateInput.value = new Date().toISOString().slice(0, 10);
    message.textContent = `Trade saved. Calculated P/L: ${money(data.result)}`;
    message.style.color = "#267144";
    await loadTrades();
  } catch (error) {
    message.textContent = error.message;
    message.style.color = "#b42323";
  }
});

async function deleteTrade(id) {
  if (!confirm("Delete this trade?")) return;
  try {
    const response = await fetch(`/api/trades/${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not delete the trade.");
    message.textContent = "Trade deleted.";
    message.style.color = "#267144";
    await loadTrades();
  } catch (error) {
    message.textContent = error.message;
    message.style.color = "#b42323";
  }
}

search.addEventListener("input", renderTrades);
document.getElementById("refreshBtn").addEventListener("click", loadTrades);
loadTrades();
