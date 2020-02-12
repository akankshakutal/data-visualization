const drawBuildings = companies => {
  const container = d3.select("#chart-area");
  const maxHeight = _.maxBy(companies, company => +company.CMP);
  const chartSize = { width: 800, height: 600 };
  const margin = { left: 100, right: 100, top: 10, bottom: 150 };
  const width = chartSize.width - (margin.left + margin.right);
  const height = chartSize.height - (margin.top + margin.bottom);

  const x = d3
    .scaleBand()
    .domain(_.map(companies, "Name"))
    .range([0, width])
    .padding(0.3);

  const y = d3
    .scaleLinear()
    .domain([0, maxHeight.CMP])
    .range([height, 0]);

  const y_axis = d3
    .axisLeft(y)
    .tickFormat(d => "₹" + d)
    .ticks(10);

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
    .text("Companies");

  group
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", `rotate(-90)`)
    .attr("x", -height / 2)
    .attr("y", -60)
    .text("CMP(RS)");

  const rectangle = group.selectAll("rect").data(companies);

  const newRects = rectangle
    .enter()
    .append("rect")
    .attr("y", b => y(b.CMP))
    .attr("x", b => x(b.Name))
    .attr("width", 60)
    .attr("height", b => y(0) - y(b.CMP));
};

const main = () => {
  d3.csv("data/companies.csv").then(drawBuildings);
};

window.onload = main;
