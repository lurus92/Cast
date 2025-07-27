# Cast

Cast (short for **Forecast**) helps visualize how your wealth could grow over time and estimates when you might reach financial independence. It is entirely client side and uses vanilla JavaScript with [Chart.js](https://www.chartjs.org/) and Google Charts.

## Features

- **Interactive forecast graph** – A line chart displays best, average and worst case projections for the total value of your assets. You can choose the number of years to display.
- **Asset management** – Add your assets (cash, investment accounts, real estate, etc.) with starting value, expected increase, compounding options and portfolio weight. Selecting an asset shows its individual growth on the graph.
- **Money flows** – Define recurring transfers from one asset to another. A Sankey diagram visualises these flows.
- **Expense tracking and retirement estimate** – Enter yearly expenses to calculate your _time to retire_ based on the 4% rule. The forecast table highlights when each scenario reaches financial independence.
- **Asset distribution** – A pie chart summarises how your total wealth is split between assets.
- **Local storage persistence** – Your data is saved automatically in the browser.

## Running

Open `index.html` in a modern browser. No server is required, but you can run a simple static server if you prefer:

```bash
# Using Python
python3 -m http.server
```
Then visit `http://localhost:8000`.

## Technology

- **Vanilla JavaScript** – no frameworks.
- **Chart.js** – line and pie charts.
- **Google Charts** – Sankey diagram for money flows.
- **Font Awesome** – icons.

All data stays in your browser; there is no backend or authentication.
