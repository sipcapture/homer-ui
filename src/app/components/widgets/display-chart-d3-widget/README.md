# D3 chart widget

_(WIP)_ - **Homer-UI Stats donut chart widget developed with D3 Library**

![](D3%20chart%20widget/Screenshot%202020-03-27%20at%2009.28.26.png)

_This widget works with the Proto Search Widget for displaying results_

**Actual features status:**

* Takes the mapped data query from Proto Search and displays the keys in a select.

* Calculates  sum statistics from the data of each key.

* Generates tags for each stat value with a name, color and count.

* Assigns a random hex color to each tag to be displayed.

* Displays the data in the donut chart with its color and value.

* Displays the tags in a column that auto shows a scrollbar to see all the tags depending in the amount of variables.

* The chart and tags size auto adjust depending on the size of the tags.

* Toggle button to show/hide the tags.

* Auto update when selecting another key.

### How to use it:

1. Set the settings in a **Proto Search** widget. If don’t have one active, add a new one with a _Results container_ field in the settings of the widget

2. Open a D3 chart widget from the tab of **Visualise** --> **Display Chart D3**

3. A new option will appear in the **Results container** select with the name of the D3 chart widget  that will be your Statistics chart.

4. Once the search params are set, press on **search** button in the Proto Search.

5. The stats with the params you set will appear in the D3 chart widget. Be sure to resize to see it well.

6. If want to see the stats of another key, just select it from the _Display key stats_ select from the chart widget.

**Coming up next:**

These are some of the features that this widget will have:

* Select the colours of each tag from the settings of the widget

* Set the min count of each key to be displayed

* Set the max amount of tags to compare

* Select the keys to display in the select of the chart

* Show the tags data when hover on chart

**Suggestions and or new features for this chart are welcomed**

## *Credits:*
**Homer wiki:** [Home · sipcapture/homer Wiki · GitHub](https://github.com/sipcapture/homer/wiki)

**Homer license:** [homer-ui/LICENSE at master · sipcapture/homer-ui · GitHub](https://github.com/sipcapture/homer-ui/blob/master/LICENSE)

**D3 library:**  [D3.js - Data-Driven Documents](https://d3js.org/)

**D3 License:**  [d3/LICENSE at master · d3/d3 · GitHub](https://github.com/d3/d3/blob/master/LICENSE)