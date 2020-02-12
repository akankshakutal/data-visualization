const drawBuildings = buildings => {
  const container = d3.select("#chart-area");
  const maxHeight = _.maxBy(buildings, building => building.height);
  const chartSize = { width: 600, height: 400 };
  const margin = { left: 100, right: 10, top: 10, bottom: 150 };
  const width = chartSize.width - (margin.left + margin.right);
  const height = chartSize.height - (margin.top + margin.bottom);

  const x = d3
    .scaleBand()
    .domain(_.map(buildings, "name"))
    .range([0, width])
    .padding(0.3);

  const y = d3
    .scaleLinear()
    .domain([0, maxHeight.height])
    .range([0, height]);

  const y_axis = d3
    .axisLeft(y)
    .tickFormat(d => d + "m")
    .ticks(3);

  const x_axis = d3.axisBottom(x);

  const svg = container
    .append("svg")
    .attr("width", chartSize.width)
    .attr("height", chartSize.height);

  const group = svg
    .append("g")
    .attr("transform", `translate (${margin.left},${margin.top})`);

  group
    .append("g")
    .attr("class", "y-axis")
    .call(y_axis);

  group
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate (0,${height})`)
    .call(x_axis);

  group
    .selectAll(".x-axis text")
    .attr("y", 10)
    .attr("x", 5)
    .attr("transform", "rotate(-40)")
    .attr("text-anchor", "end");

  group
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 140)
    .attr("class", "axis-label")
    .text("Tall Building");

  group
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", `rotate(-90)`)
    .attr("x", -height / 2)
    .attr("y", -60)
    .text("Height(m)");

  const rectangle = group.selectAll("rect").data(buildings);

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
