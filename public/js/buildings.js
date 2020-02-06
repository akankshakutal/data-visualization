const drawBuildings = buildings => {
  const container = d3.select("#chart-area");
  const height = 400;
  const width = 400;
  const maxHeight = _.maxBy(buildings, building => building.height);
  const x = d3
    .scaleBand()
    .domain(_.map(buildings, "name"))
    .range([0, width])
    .padding(0.3);

  const y = d3
    .scaleLinear()
    .domain([0, maxHeight.height])
    .range([0, height]);

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const rectangle = svg.selectAll("rect").data(buildings);

  const newRects = rectangle
    .enter()
    .append("rect")
    .attr("x", b => x(b.name))
    .attr("width", 40)
    .attr("height", b => y(b.height));
};

const main = () => {
  d3.json("data/buildings.json").then(drawBuildings);
};

window.onload = main;
