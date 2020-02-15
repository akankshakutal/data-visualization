const CHART_SIZE = {
  width: 800,
  height: 600
};
const MARGIN = {
  left: 150,
  right: 10,
  top: 10,
  bottom: 150
};

const HEIGHT = CHART_SIZE.height - MARGIN.top - MARGIN.bottom;
const WIDTH = CHART_SIZE.width - MARGIN.left - MARGIN.right;
const c = d3.scaleOrdinal(d3.schemeRdPu[7]);
const percentageFormat = d => `${d}%`;
const rupeeFormat = d => `${d} ₹`;
const kCroreFormat = d => rupeeFormat(`${d}k Cr`);
const fieldsWithFormats = [
  ["CMP", rupeeFormat],
  ["PE"],
  ["MarketCap", kCroreFormat],
  ["ROCE", percentageFormat]
];

const makeCycler = function(elements) {
  let counter = 0;
  return function() {
    return elements[counter++ % elements.length];
  };
};

const cycler = makeCycler(fieldsWithFormats);

const drawCompanies = function(companies) {
  const [fieldname, format] = cycler();

  dummyCompanies = companies;
  const container = d3.select("#chart-area svg");
  const MAX_HEIGHT_OF_THE_DOMAIN = _.maxBy(companies, fieldname)[fieldname];

  const y = d3
    .scaleLinear()
    .domain([0, MAX_HEIGHT_OF_THE_DOMAIN])
    .range([HEIGHT, 0]);

  const x = d3
    .scaleBand()
    .range([0, WIDTH])
    .domain(_.map(companies, "Name"))
    .padding(0.3);

  const svg = container
    .attr("width", CHART_SIZE.width)
    .attr("height", CHART_SIZE.height);

  const g = svg
    .append("g")
    .attr("class", "companies")
    .attr("transform", `translate(${MARGIN.left},${MARGIN.right})`);

  const rectangles = g.selectAll("rect").data(companies);

  rectangles
    .enter()
    .append("rect")
    .attr("y", b => y(b[fieldname]))
    .attr("x", (b, i) => x(b.Name))
    .attr("width", x.bandwidth)
    .attr("height", b => y(0) - y(b[fieldname]))
    .attr("fill", b => c(b.Name));

  g.append("text")
    .attr("class", "x axis-label")
    .attr("x", WIDTH / 2)
    .attr("y", HEIGHT + 140)
    .text("Companies");

  g.append("text")
    .attr("class", "y axis-label")
    .attr("x", -HEIGHT / 2)
    .attr("transform", "rotate(-90)")
    .attr("y", -60)
    .text(`${fieldname}`);

  const yAxis = d3
    .axisLeft(y)
    .tickFormat(format)
    .ticks(10);

  g.append("g")
    .call(yAxis)
    .attr("class", "y axis");

  const xAxis = d3.axisBottom(x);
  g.append("g")
    .call(xAxis)
    .attr("class", "x axis")
    .attr("transform", `translate(0,${HEIGHT})`);

  g.selectAll(".x.axis text")
    .attr("transform", "rotate(-40)")
    .attr("text-anchor", "end")
    .attr("x", -5)
    .attr("y", 10);
};

const updateCompanies = function(companies, field) {
  const [fieldname, format] = field;
  const svg = d3.select("#chart-area svg");
  svg.select(".y.axis-label").text(fieldname);

  const MAX_HEIGHT_OF_THE_DOMAIN = _.get(
    _.maxBy(companies, fieldname),
    fieldname,
    0
  );
  const y = d3
    .scaleLinear()
    .domain([0, MAX_HEIGHT_OF_THE_DOMAIN])
    .range([HEIGHT, 0]);
  const yAxis = d3
    .axisLeft(y)
    .tickFormat(format)
    .ticks(5);
  svg.select(".y.axis").call(yAxis);

  const x = d3
    .scaleBand()
    .range([0, WIDTH])
    .domain(_.map(companies, "Name"))
    .padding(0.3);
  const xAxis = d3.axisBottom(x);
  svg.select(".x.axis").call(xAxis);

  const t = d3
    .transition()
    .duration(1000)
    .ease(d3.easeLinear);
  svg
    .selectAll("g rect")
    .data(companies, c => c.Name)
    .exit()
    .remove();

  d3.select(".companies")
    .selectAll("rect")
    .data(companies)
    .enter()
    .append("rect")
    .attr("y", b => y(0))
    .attr("x", (b, i) => x(b.Name))
    .attr("width", x.bandwidth)
    .attr("fill", b => c(b.Name));

  svg
    .selectAll("g rect")
    .data(companies)
    .transition(t)
    .attr("y", b => y(b[fieldname]))
    .attr("x", (b, i) => x(b.Name))
    .attr("height", b => y(0) - y(b[fieldname]))
    .attr("width", x.bandwidth);
};

const parseCompany = function({ Name, ...rest }) {
  _.forEach(rest, (val, key) => {
    rest[key] = +val;
  });
  return { Name, ...rest };
};

const frequentlyMoveCompanies = (src, dest) => {
  setInterval(() => {
    const c = src.shift();
    if (c) dest.push(c);
    else [src, dest] = [dest, src];
  }, 1000);
};

const initializeVizualization = function(companies) {
  drawCompanies(companies);
  setInterval(() => {
    updateCompanies(companies, cycler());
  }, 1000);
  frequentlyMoveCompanies(companies, []);
};

const main = () => {
  d3.csv("data/companies.csv", parseCompany).then(initializeVizualization);
};

window.onload = main;
