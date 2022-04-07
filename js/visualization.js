// ------------------------------ SET UP ------------------------------ //
// Set margins and dimensions 
const margin = { top: 50, right: 50, bottom: 250, left: 150 };
const width = 900;
const height = 800;
const yTooltipOffset = 15;
const axisExtension = 1.05;

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

// Define global variables
let players;
let teams;
let selectedSeason;
let selectedTeams = Array();

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

  updateScatter();
  updateBar();
});

// Detect updates on mode filter
d3.select("#mode").on("change", function (d) {
  // TODO
});

// ------------------------------ EXECUTION ------------------------------ //

createScatter();
createBar();

// ------------------------------ FUNCTIONS ------------------------------ //

/**
 * Redraws any elements that can change in the scatter plot.
 */
function updateScatter() {
  scatterPlot.selectAll("*").remove();
  createScatter();
}

/**
 * Redraws any elements that can change in the bar plot.
 */
function updateBar() {
  barPlot.selectAll("*").remove();
  createBar();
}

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
    "<b>Team: </b>" + team.Squad +
    "<br> <b>xG: </b>" + team.xG +
    "<br> <b>xG Against: </b>" + team["xG Against"]
  );
}

/**
 * Create the scatter plot.
 */
function createScatter() {
  d3.csv("data/team_data.csv").then((data) => {
    xKeyScatter = "xG";
    yKeyScatter = "xG Against";

    let seasonData = data.filter(team => team.Season === selectedSeason);

    // Find axis metrics
    let xMaxScatter = d3.max(data, (d) => { return d[xKeyScatter]; });
    let yMaxScatter = d3.max(data, (d) => { return d[yKeyScatter]; });
    let xMeanScatter = d3.median(seasonData, (d) => { return d[xKeyScatter]; });
    let yMeanScatter = d3.median(seasonData, (d) => { return d[yKeyScatter]; });

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
        .attr("x", width - margin.right)
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
        .attr("x", 0)
        .attr("y", margin.top)
        .attr("fill", "black")
        .attr("text-anchor", "end")
        .text(yKeyScatter)
      );

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
        .style("top", (event.pageY + yTooltipOffset) + "px")
    };

    // Return tooltip to transparent when mouse leaves
    const hideTeamTooltip = function (event, d) {
      teamTooltip.style("opacity", 0);
    };

    // Add the labels to each rectangle
    scatterPlot.append("text")
      .attr("x", width - margin.right - 10)
      .attr("y", margin.top + 20)
      .attr("text-anchor", "end")
      .text("Strong attack, poor defense");

    scatterPlot.append("text")
      .attr("x", margin.left + 10)
      .attr("y", margin.top + 20)
      .attr("text-anchor", "start")
      .text("Poor attack, poor defense");

    scatterPlot.append("text")
      .attr("x", margin.left + 10)
      .attr("y", height - margin.bottom - 10)
      .attr("text-anchor", "start")
      .text("Poor attack, strong defense");

    scatterPlot.append("text")
      .attr("x", width - margin.right - 10)
      .attr("y", height - margin.bottom - 10)
      .attr("text-anchor", "end")
      .text("Strong attack, strong defense");

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

  // Define a brush
  teamSelector = d3.brush().extent([[0, 0], [width, height]])

  // Add brush to scatter plot
  scatterPlot.call(teamSelector);
};

/**
 * Create the bar chart.
 */
function createBar() {
  d3.csv("data/player_data.csv").then((data) => {
    data = data.sort((a, b) => (a.xG < b.xG) ? 1 : -1);  // Sort players by xG
    seasonData = data.filter(player => player.Season === selectedSeason);
    topTen = seasonData.slice(0, 10); // Restrict chart to top 10 players

    xKeyBar = "Player";
    yKeyBar = "xG";
    colorKeyBar = "xG per 90";

    // Create X scale
    xScaleBar = d3.scaleBand()
      .domain(topTen.map(d => d.Player))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    // Add x axis 
    testX = barPlot.append("g")
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

    // Find max y 
    let maxY = d3.max(data, (d) => { return d[yKeyBar]; });

    // Create Y scale
    yScaleBar = d3.scaleLinear()
      .domain([0, maxY])
      .range([height - margin.bottom, margin.top]);

    // Add y axis 
    barPlot.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(yScaleBar))
      .attr("font-size", "20px")
      .call((g) => g.append("text")
        .attr("x", 0)
        .attr("y", margin.top)
        .attr("fill", "black")
        .attr("text-anchor", "end")
        .text(yKeyBar)
      );

    // Create color scale
    let maxColorScale = d3.max(data, (d) => { return d[colorKeyBar]; });

    let colorScale = d3.scaleLinear()
      .domain([0, maxColorScale])
      .range(["white", "blue"]);

    // Tooltip to show on hover
    const playerTooltip = d3.select("body")
      .append("div")
      .attr("id", "playerTooltip")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Add values to tooltip on mouseover and show the tooltip
    const showPlayerTooltip = function (event, d) {
      playerTooltip.html(
        "<b>Name: </b>" + d.Player +
        "<br> <b>Team: </b>" + d.Team +
        "<br> <b>Nationality: </b>" + d.Nation +
        "<br> <b>Position: </b>" + d.Position
      )
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
  });
};