// ------------------------------ SET UP ------------------------------ //
// Set margins and dimensions 
const margin = { top: 50, right: 50, bottom: 250, left: 150 };
const width = 900;
const height = 1000;
const yTooltipOffset = 15;

// Initialize global variables
let players;  // All player elements
let teams;  // All team elements
let selectedSeason;  // The currently selected season
let scatterBrush;  // Brush on the scatter plot
let selectedTeams = new Array();  // The currently brushed teams
let yKeyScatter = "xG Against";  // The metric to use for the y axis on the scatter plot
let yKeyBar = "xG";  // The metric to use for the y axis on the bar chart
let xScaleScatter;  // The x scale of the scatter plot
let yScaleScatter;  // The y scale of the scatter plot

// Append svg object to the body of the page to house the scatter plot
const scatterPlot = d3.select("#vis-container")
  .append("svg")
  .attr("width", width - margin.left - margin.right)
  .attr("height", height - margin.top - margin.bottom)
  .attr("viewBox", [0, 0, width, height]);

// Append svg object to the body of the page to house the bar plot
const barPlot = d3.select("#vis-container")
  .append("svg")
  .attr("width", width - margin.left - margin.right)
  .attr("height", height - margin.top - margin.bottom)
  .attr("viewBox", [0, 0, width, height]);

// Append svg object to house the legend
const legendPlot = d3.select("#legend")
  .append("svg")
  .attr("width", 260)
  .attr("height", 60)
  .attr("viewBox", [0, 0, 260, 60]);

// An initial data read to the set global variables
d3.csv("data/team_data.csv").then((data) => {
  let seasons = Array.from(new Set(data.map(x => x["Season"])));  // Find all seasons

  // Set the options for the season selector
  d3.select("#season")
    .selectAll("option")
    .data(seasons)
    .enter()
    .append("option")
    .text(function (d) { return d; })
    .attr("value", function (d) { return d; });

  // Set the selected season to the current season selected
  selectedSeason = d3.select("#season").property("value");
});

// Detect updates on season filter
d3.select("#season").on("change", function (d) {
  // Update the selected season
  selectedSeason = d3.select(this).property("value");

  d3.selectAll(".tooltip").remove();

  updateScatter();
  updateBar();
});

// Detect updates on mode filter
d3.select("#performance").on("change", function (d) {
  mode = d3.select(this).property("value");

  if (mode === "expected") {
    yKeyScatter = "xG Against";
    yKeyBar = "xG";
  } else {
    yKeyScatter = "Goals";
    yKeyBar = "Goals";
  }

  updateScatter();
  updateBar();
});

// ------------------------------ EXECUTION ------------------------------ //

createScatter();
createBar();

// ------------------------------ FUNCTIONS ------------------------------ //

/**
 * Redraws any elements that can change in the scatter plot.
 */
function updateScatter() {
  // Clear the brush and selected teams
  selectedTeams = new Array();
  scatterPlot.call(scatterBrush.move, null);

  scatterPlot.selectAll("*").remove();
  createScatter();
}

/**
 * Redraws any elements that can change in the bar plot.
 */
function updateBar() {
  barPlot.selectAll("*").remove();
  legendPlot.selectAll("*").remove();
  createBar();
};

/**
 * Returns the name of team logo file.
 * 
 * @param {string} teamName The name of the team to return the logo for
 * @return {string} The name of the file for the given teams logo
 */
function teamLogoFile(teamName) {
  return "data/logos/" + teamName + ".svg";
};

/**
 * Returns a HTML string to show in the tool tip box.
 * 
 * @param {object} team A team object with information about the team 
 * @returns {string} HTML content to display
 */
function teamTooltipContent(team) {
  return (
    "<b>" + team.Squad + "</b>" +
    "<br> <b>xG: </b>" + team.xG +
    "<br> <b>" + yKeyScatter + ": </b>" + team[yKeyScatter]
  );
};

/**
 * Returns a HTML string to show in the tool tip box.
 * 
 * @param {object} player A player object with information about the player
 * @returns HTML content to display
 */
function playerTooltipContent(player) {
  return (
    "<b>" + player.Player + "</b>" +
    "<br> <b>Team: </b>" + player.Team +
    "<br> <b>" + yKeyBar + ": </b>" + player[yKeyBar] +
    "<br> <b>xG/90: </b>" + player['xG per 90']
  );
};

/**
 * Create the scatter plot.
 */
function createScatter() {
  d3.csv("data/team_data.csv").then((data) => {
    xKeyScatter = "xG";

    seasonData = data.filter(team => team.Season === selectedSeason);  // Filter data

    // Find axis metrics
    let xMaxScatter = d3.max(data, (d) => { return d[xKeyScatter]; });
    let yMaxScatter = d3.max(data, (d) => { return parseFloat(d[yKeyScatter]); });
    let xMeanScatter = d3.mean(seasonData, (d) => { return d[xKeyScatter]; });
    let yMeanScatter = d3.mean(seasonData, (d) => { return d[yKeyScatter]; });

    // Make plot square when comparing goals
    if (yKeyScatter === 'Goals') {
      overallMax = d3.max([xMaxScatter, yMaxScatter]);
      xMaxScatter = overallMax;
      yMaxScatter = overallMax;
    }

    // Create scales
    xScaleScatter = d3.scaleLinear()
      .domain([0, xMaxScatter])
      .range([margin.left, width - margin.right]);

    yScaleScatter = d3.scaleLinear()
      .domain([0, yMaxScatter])
      .range([height - margin.bottom, margin.top]);

    // Add axes
    xAxisScatter = scatterPlot.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScaleScatter))
      .attr("font-size", "20px")
      .call((g) => g.append("text")
        .attr("x", xScaleScatter(xMaxScatter / 2))
        .attr("y", 50)
        .attr("fill", "black")
        .attr("text-anchor", "end")
        .text(xKeyScatter)
      );

    yAxisScatter = scatterPlot.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScaleScatter))
      .attr("font-size", "20px")
      .call((g) => g.append("text")
        .attr("x", - 400)
        .attr("y", - margin.top)
        .attr("fill", "black")
        .attr('transform', 'rotate(-90)')
        .attr("text-anchor", "middle")
        .text(yKeyScatter)
      );

    // Add guidelines depending on current mode
    if (yKeyScatter === 'Goals') {
      // Add diagonal line across the graph
      scatterPlot.append('line')
        .style("stroke", "black")
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,15")
        .style("opacity", "0.5")
        .attr("x1", xScaleScatter(0))
        .attr("y1", yScaleScatter(0))
        .attr("x2", xScaleScatter(xMaxScatter))
        .attr("y2", yScaleScatter(yMaxScatter));

      scatterPlot.append("text")
        .attr("transform", `translate(${xScaleScatter(xMaxScatter)}, ${yScaleScatter(yMaxScatter)+20})rotate(-46)`)
        .attr("text-anchor", "end")
        .attr("fill", "black")
        .attr("opacity", 0.5)
        .text("xG = Goals");
    } else {  // Mode is "expected"
      // Add line for average on x and y axis
      scatterPlot.append('line')
        .style("stroke", "black")
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,15")
        .style("opacity", "0.5")
        .attr("x1", xScaleScatter(xMeanScatter))
        .attr("y1", yScaleScatter(0))
        .attr("x2", xScaleScatter(xMeanScatter))
        .attr("y2", yScaleScatter(yMaxScatter));

      scatterPlot.append('line')
        .style("stroke", "black")
        .style("stroke-width", 2)
        .style("stroke-dasharray", "5,15")
        .style("opacity", "0.5")
        .attr("x1", xScaleScatter(0))
        .attr("y1", yScaleScatter(yMeanScatter))
        .attr("x2", xScaleScatter(xMaxScatter))
        .attr("y2", yScaleScatter(yMeanScatter));

      scatterPlot.append("text")
        .attr("x", xScaleScatter(xMaxScatter))
        .attr("y", yScaleScatter(yMeanScatter) - 10)
        .attr("text-anchor", "end")
        .attr("fill", "black")
        .attr("opacity", 0.5)
        .text("Season Avg.");
    }

    // Tooltip to show on hover
    let teamTooltip = d3.select("body")
      .append("div")
      .attr("id", "teamTooltip")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Add values to tooltip on mouseover and show the tooltip
    const showTeamTooltip = function (event, team) {
      teamTooltip.html(teamTooltipContent(team))
        .style("opacity", 1);
    };

    // Position tooltip to follow mouse 
    const moveTeamTooltip = function (event, d) {
      teamTooltip.style("left", (event.pageX) + "px")
        .style("top", (event.pageY + yTooltipOffset) + "px");
    };

    // Return tooltip to transparent when mouse leaves
    const hideTeamTooltip = function (event, d) {
      teamTooltip.style("opacity", 0);
    };

    // Define a brush
    scatterBrush = d3.brush().extent([[0, 0], [width, height]]);

    // Add brush to scatter plot before points to get layers right
    scatterPlot.call(scatterBrush
      .on("end", handleBrush));

    // Add points
    teams = scatterPlot.selectAll("logo")
      .data(seasonData)
      .enter()
      .append("image")
      .attr("xlink:href", (d) => teamLogoFile(d.Squad))
      .attr("width", 40)
      .attr("height", 40)
      .on("mouseover", showTeamTooltip)
      .on("mousemove", moveTeamTooltip)
      .on("mouseleave", hideTeamTooltip)
      .attr("x", (d) => xScaleScatter(d[xKeyScatter]) - 20)
      .attr("y", (d) => yScaleScatter(d[yKeyScatter]) - 20);
  });
};

/**
 * Create the bar chart.
 */
function createBar() {
  d3.csv("data/player_data.csv").then((data) => {
    data = data.filter(player => player.Min > 180); // Set minimum on playing time
    seasonData = data.filter(player => player.Season === selectedSeason);  // Filter data by season
    seasonData = seasonData.sort((a, b) => b[yKeyBar] - a[yKeyBar]); // Sort players by xG

    // Filter players based on teams, as part of brushing of scatter plot
    if (selectedTeams.length > 0) {
      teamData = seasonData.filter(player => selectedTeams.includes(player.Team));
      topTen = teamData.slice(0, 10);
    } else {
      topTen = seasonData.slice(0, 10); // Restrict chart to top 10 players
    }

    xKeyBar = "Player";
    colorKeyBar = "xG per 90";

    // Find axis metrics
    let yMaxBar = d3.max(data, (d) => { return parseFloat(d[yKeyBar]); });

    // Create scales
    xScaleBar = d3.scaleBand()
      .domain(topTen.map(d => d.Player))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    yScaleBar = d3.scaleLinear()
      .domain([0, yMaxBar])
      .range([height - margin.bottom, margin.top]);

    // Add axes
    barPlot.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(xScaleBar))
      .attr("font-size", "20px")
      .call((g) => g.append("text")
        .attr("x", width - margin.right)
        .attr("y", margin.bottom - 4)
        .attr("fill", "black")
        .attr("text-anchor", "end")
        .text(xKeyBar)
      )
      .selectAll("text")
      .attr("text-anchor", "end")
      .attr("dx", "-0.8em")
      .attr("dy", "-.15em")
      .attr("transform", "rotate(-90)");

    barPlot.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScaleBar))
      .attr("font-size", "20px")
      .call((g) => g.append("text")
        .attr("x", - 400)
        .attr("y", - margin.top)
        .attr("fill", "black")
        .attr('transform', 'rotate(-90)')
        .attr("text-anchor", "middle")
        .text(yKeyBar)
      );

    //  Create color scale
    let maxColorScale = d3.max(data, (d) => { return d[colorKeyBar]; });

    let colorScale = d3.scaleLinear()
      .domain([0, maxColorScale])
      .range(["#f7fbff", "blue"]);

    // Tooltip to show on hover
    let playerTooltip = d3.select("body")
      .append("div")
      .attr("id", "playerTooltip")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Add values to tooltip on mouseover and show the tooltip
    const showPlayerTooltip = function (event, player) {
      playerTooltip.html(playerTooltipContent(player))
        .style("opacity", 1);
    };

    // Position tooltip to follow mouse 
    const movePlayerTooltip = function (event, d) {
      playerTooltip.style("left", (event.pageX) + "px")
        .style("top", (event.pageY + yTooltipOffset) + "px")
    };

    // Return tooltip to transparent when mouse leaves
    const hidePlayerTooltip = function (event, d) {
      playerTooltip.style("opacity", 0);
    };

    // Add points
    players = barPlot.selectAll(".bar")
      .data(topTen)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScaleBar(d[xKeyBar]))
      .attr("y", (d) => yScaleBar(d[yKeyBar]))
      .attr("height", (d) => (height - margin.bottom) - yScaleBar(d[yKeyBar]))
      .attr("width", xScaleBar.bandwidth())
      .style("fill", (d) => colorScale(d[colorKeyBar]))
      .style("opacity", 0.5)
      .on("mouseover", showPlayerTooltip)
      .on("mousemove", movePlayerTooltip)
      .on("mouseleave", hidePlayerTooltip);

    // Create legend
    legendPlot.append("g")
      .attr("class", "legend")
      .attr("transform", "translate(0,20)");

    let legend = d3.legendColor()
      .labelFormat(d3.format(".2f"))
      .orient('horizontal')
      .shapeWidth(50)
      .scale(colorScale);

    legendPlot.select(".legend")
      .call(legend);
  });
};


/**
 * Handles the brush actions on the scatter plot.
 * @param {*} brushEvent The event emitted by the brush 
 */
function handleBrush(brushEvent) {
  extent = brushEvent.selection;

  selectedTeams = new Array();

  teams.attr("class", "");

  if (extent) {  // Only run if there is a selection    
    teams.classed("not-selected", function (d) {
      is_selected = isBrushed(extent, xScaleScatter(d['xG']), yScaleScatter(d[yKeyScatter]));

      if (is_selected) {
        selectedTeams.push(d['Squad']);
      }

      return !is_selected;
    });
  }

  updateBar();
}

/**
 * Checks whether a point is within the brushed area.
 * @param {Array} brush_coords Array of integers
 * @param {Integer} cx x-coordinate of point
 * @param {Integer} cy y-coordinate of point
 * @returns 
 */
function isBrushed(brush_coords, cx, cy) {
  if (brush_coords === null) return;

  var x0 = brush_coords[0][0],
    x1 = brush_coords[1][0],
    y0 = brush_coords[0][1],
    y1 = brush_coords[1][1];
  return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1; // This return TRUE or FALSE depending on if the points is in the selected area
}