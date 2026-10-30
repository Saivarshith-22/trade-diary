const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "trades.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, "[]", "utf8");

function readTrades() {
  const trades = JSON.parse(fs.readFileSync(DATA_FILE, "utf8") || "[]");
  return Array.isArray(trades) ? trades : [];
}

function writeTrades(trades) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(trades, null, 2), "utf8");
}

function calculatePL(direction, entry, exit, quantity) {
  const difference = direction === "Buy" ? exit - entry : entry - exit;
  return Number((difference * quantity).toFixed(2));
}

app.get("/api/trades", (req, res) => {
  try { res.json(readTrades()); }
  catch (error) { res.status(500).json({ error: "Could not read data/trades.json." }); }
});

app.post("/api/trades", (req, res) => {
  const { date, symbol, direction, entry, exit, quantity, notes } = req.body;
  if (!date || !symbol || !["Buy", "Sell"].includes(direction) ||
      entry === "" || exit === "" || quantity === "" ||
      entry == null || exit == null || quantity == null) {
    return res.status(400).json({ error: "Please fill in date, symbol, direction, entry, exit, and quantity." });
  }

  const entryNum = Number(entry);
  const exitNum = Number(exit);
  const quantityNum = Number(quantity);
  if (![entryNum, exitNum, quantityNum].every(Number.isFinite) || entryNum < 0 || exitNum < 0 || quantityNum <= 0) {
    return res.status(400).json({ error: "Enter valid prices and a quantity greater than zero." });
  }

  const trade = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: String(date),
    symbol: String(symbol).trim(),
    direction,
    entry: entryNum,
    exit: exitNum,
    quantity: quantityNum,
    result: calculatePL(direction, entryNum, exitNum, quantityNum),
    notes: String(notes || "").trim(),
    createdAt: new Date().toISOString()
  };

  try {
    const trades = readTrades();
    trades.unshift(trade);
    writeTrades(trades);
    res.status(201).json(trade);
  } catch (error) {
    res.status(500).json({ error: "Could not save the trade." });
  }
});

app.delete("/api/trades/:id", (req, res) => {
  try {
    const trades = readTrades();
    const updated = trades.filter(trade => trade.id !== req.params.id);
    if (updated.length === trades.length) return res.status(404).json({ error: "Trade not found." });
    writeTrades(updated);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Could not delete the trade." });
  }
});

app.get("/api/stats", (req, res) => {
  try {
    const trades = readTrades();
    const total = trades.length;
    const wins = trades.filter(t => Number(t.result) > 0).length;
    const losses = trades.filter(t => Number(t.result) < 0).length;
    const totalPL = trades.reduce((sum, t) => sum + Number(t.result || 0), 0);
    res.json({ total, wins, losses, totalPL, winRate: total ? wins / total * 100 : 0 });
  } catch (error) {
    res.status(500).json({ error: "Could not calculate statistics." });
  }
});

app.listen(PORT, () => {
  console.log(`Trade Journal running at http://localhost:${PORT}`);
  console.log(`Trades are saved in ${DATA_FILE}`);
});
