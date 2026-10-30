TRADE DIARY — NODE.JS + JSON FILE, AUTOMATIC P/L

No MongoDB required. You need Node.js.

RUN:
1. Extract this ZIP.
2. Open the folder containing package.json in VS Code.
3. Open Terminal > New Terminal.
4. Run: npm.cmd install
5. Run: npm.cmd start
6. Open http://localhost:3000

HOW P/L IS CALCULATED:
Buy: (Exit Price - Entry Price) x Quantity
Sell: (Entry Price - Exit Price) x Quantity

Example: Buy at 100, exit at 110, quantity 5 = +50.
Example: Sell at 100, exit at 95, quantity 5 = +25.

This basic calculation does not include commissions, taxes, spread, or forex/CFD contract-size and pip-value rules. For forex and CFDs, enter a quantity only if multiplying the price difference by that quantity matches your broker's P/L calculation. Otherwise, those instruments need a contract/pip-value formula.

Trades are stored locally in data/trades.json and remain after closing the browser or shutting down the computer. Start the server again with npm.cmd start to use the site. Back up data/trades.json occasionally.
