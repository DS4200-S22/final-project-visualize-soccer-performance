d3.csv("data/team_data.csv").then((data) => {
  // Log the first 10 rows of team data to the console
  console.log(data.slice(0, 10));
});

d3.csv("data/player_data.csv").then((data) => {
  // Log the first 10 rows of player data to the console
  console.log(data.slice(0, 10));
});

// Set margins and dimensions 
const margin = { top: 50, right: 50, bottom: 250, left: 200 };
const width = 900; //- margin.left - margin.right;
const height = 800; //- margin.top - margin.bottom;
const yTooltipOffset = 15;

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

let teams;
let players;

// Plot scatter plot
d3.csv("data/team_data.csv").then((data) => {
  xKeyScatter = "xG";
  yKeyScatter = "xG Against";

  const seasons = Array.from(new Set(data.map(x => x['Season'])));  // Find all seasons

  // Add seasons to season filter
  d3.select("#season")
    .selectAll('myOptions')
    .data(seasons)
    .enter()
    .append('option')
    .text(function (d) { return d; })
    .attr("value", function (d) { return d; });

  // Find max x
  let maxX = d3.max(data, (d) => { return d[xKeyScatter]; });

  // Create X scale
  xScale = d3.scaleLinear()
    .domain([0, maxX])
    .range([margin.left, width - margin.right]);

  // Add x axis 
  scatterPlot.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .attr("font-size", '20px')
    .call((g) => g.append("text")
      .attr("x", width - margin.right)
      .attr("y", 50)
      .attr("fill", "black")
      .attr("text-anchor", "end")
      .text(xKeyScatter)
    );

  // Find max y 
  let maxY = d3.max(data, (d) => { return d[yKeyScatter]; });

  // Create Y scale
  yScale = d3.scaleLinear()
    .domain([0, maxY])
    .range([height - margin.bottom, margin.top]);

  // Add y axis 
  scatterPlot.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale))
    .attr("font-size", '20px')
    .call((g) => g.append("text")
      .attr("x", 0)
      .attr("y", margin.top)
      .attr("fill", "black")
      .attr("text-anchor", "end")
      .text(yKeyScatter)
    );

  // Tooltip to show on hover
  const teamTooltip = d3.select("body")
    .append("div")
    .attr('id', "teamTooltip")
    .attr("class", "tooltip")
    .style("opacity", 0);

  // Add values to tooltip on mouseover and show the tooltip
  const showTeamTooltip = function (event, d) {
    teamTooltip.html(
      "<b>Team: </b>" + d.Squad +
      "<br> <b>xG: </b>" + d.xG +
      "<br> <b>xG Against: </b>" + d['xG Against']
    )
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

  // Add points
  teams = scatterPlot.selectAll("circle")
    .data(data.filter(team => team.Season === seasons[0]))
    .enter()
    .append("circle")
    .attr("cx", (d) => xScale(d[xKeyScatter]))
    .attr("cy", (d) => yScale(d[yKeyScatter]))
    .attr("r", 8)
    .style("fill", "red")
    .style("opacity", 0.5)
    .on("mouseover", showTeamTooltip)
    .on("mousemove", moveTeamTooltip)
    .on("mouseleave", hideTeamTooltip);

  // Define a brush
  teamSelector = d3.brush().extent([[0, 0], [width, height]])

  // Add brush to scatter plot
  scatterPlot.call(teamSelector);

  // Update the scatter plot based on new filter data
  function updateScatter(selectedSeason) {
    var filteredData = data.filter(team => team.Season === selectedSeason);

    // TODO: Update scatterplot

    console.log(selectedSeason);
  };

  // Detect updates on season filter
  d3.select("#season").on("change", function (d) {
    selectedSeason = d3.select(this).property("value");
    updateScatter(selectedSeason);
  });
});

// Plot bar chart
d3.csv("data/player_data.csv").then((data) => {
  data = data.sort((a, b) => (a.xG < b.xG) ? 1 : -1)  // Sort players by xG
  data = data.slice(0, 10); // Restrict chart to top 10 players

  xKeyBar = "Player";
  yKeyBar = "xG";

  // Create X scale
  xScale = d3.scaleBand()
    .domain(data.map(d => d.Player))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  // Add x axis 
  barPlot.append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale))
    .attr("font-size", '20px')
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
  yScale = d3.scaleLinear()
    .domain([0, maxY])
    .range([height - margin.bottom, margin.top]);

  // Add y axis 
  barPlot.append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale))
    .attr("font-size", '20px')
    .call((g) => g.append("text")
      .attr("x", 0)
      .attr("y", margin.top)
      .attr("fill", "black")
      .attr("text-anchor", "end")
      .text(yKeyBar)
    );

  // Tooltip to show on hover
  const playerTooltip = d3.select("body")
    .append("div")
    .attr('id', "playerTooltip")
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
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d[xKeyBar]))
    .attr("y", (d) => yScale(d[yKeyBar]))
    .attr("height", (d) => (height - margin.bottom) - yScale(d[yKeyBar]))
    .attr("width", xScale.bandwidth())
    .style("fill", "blue")
    .style("opacity", 0.5)
    .on("mouseover", showPlayerTooltip)
    .on("mousemove", movePlayerTooltip)
    .on("mouseleave", hidePlayerTooltip);
});
