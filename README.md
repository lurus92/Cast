# Cast

Cast (abbreviation of Forecast) is an application that allows people to understand their future wealth and when they can retire.

The UI is mainly composed of a line graph with the evolution of the wealth and a section where the users can specify the various assets they have.
* The graph should  have 3 lines: best case scenario, average, worst case scenario
* In the asset part, we can imagine a vertical list of cards that have the icon of the asset and a name. A card can be opened and editable. When edited, the user can:
    * Change the icon of the asset
    * Specify its name 
    * Specify its type (cash, investing account, real estate)
    * Specify monthly expected increase in value - this can be both in absolute terms or in percentage, and in 3 scenarios
    * Specify eventual dividends/rental income, also this can be both in absolute terms or in percentage and in 3 scenarios
    * Specify compounding: if daily/weekly/monthly/yearly
* There should be an add button that will allow the user to add a new
* A different section of the app should allow the user to specify “flows”: flow of money from one asset to another.

Any operation will result in the update of the main graph.
There should also be a section in which the user can write how much they spend yearly. Using the 4% rule (time to retire = yearly expenses / 4%), the main graph should also highlight the point at which the user can retire. Below the graph, we can specify “X” years to retirement. 

This project should be built for the web, so only web technologies should be used. Prefer a clean approach with vanilla JS (no React, no Angular, etc.).
For now, we can just use localstorage to store data

## Layout

The application is organized in four main sections that can be reached via a sidebar on desktop screens or through a bottom tab bar on mobile devices.

1. **Forecast** – Displays the main graph along with a summary table.
2. **Assets** – Shows total wealth, individual assets and an "Add Asset" button.
3. **Flows** – Lists the defined flows and an "Add Flow" button.
4. **Expenses** – Allows editing of the yearly expense value.

The sidebar is hidden on small screens while the bottom navigation becomes visible, providing a mobile friendly, iOS-style experience.
