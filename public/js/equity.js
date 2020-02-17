const chartSize = { width: 1420, height: 700 };
const margin = { left: 100, right: 10, top: 30, bottom: 70 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;

const showData = quotes => {
  const toLine = b => `<strong>${b.date}</strong> <i>${b.Close}</i>`;
  document.querySelector("#chart-data").innerHTML = quotes.buy
    .map(toLine)
    .join("<hr/>");
};

const parseNumerics = ({ date, Volume, AdjClose, ...rest }) => {
  _.forEach(rest, (v, k) => (rest[k] = +v));
  const Time = new window.Date(date);
  return { date, Time, ...rest };
};

const update = quotes => {
  const svg = d3.select("#chart-area svg");
  const date = "date";
  const firstDate = new Date(_.first(quotes)[date]);
  const lastDate = new Date(_.last(quotes)[date]);
  const maxDomain = _.maxBy(quotes, "Close")["Close"];
  const minDomain = _.minBy(quotes, "Close")["Close"];

  const y = d3
    .scaleLinear()
    .domain([minDomain, maxDomain])
    .range([height, 0]);

  const yAxis = d3.axisLeft(y).ticks(10);

  const x = d3
    .scaleTime()
    .domain([firstDate, lastDate])
    .range([0, width]);

  const xAxis = d3.axisBottom(x);

  svg.select(".x.axis").call(xAxis);
  svg.select(".y.axis").call(yAxis);
  svg.select(".x.axis-label").text("Time");
  svg.select(".y.axis-label").text("Close");

  const g = d3.select(".prices");

  const line = field =>
    d3
      .line()
      .x(q => x(q.Time))
      .y(q => y(q[field]));

  g.append("path")
    .attr("class", "close")
    .attr("d", line("Close")(quotes));

  g.append("path")
    .attr("class", "sma")
    .attr("d", line("sma")(_.filter(quotes, "sma")));
};

const initChart = () => {
  const svg = d3
    .select("#chart-area svg")
    .attr("height", chartSize.height)
    .attr("width", chartSize.width);

  const g = svg
    .append("g")
    .attr("class", "prices")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  g.append("text")
    .attr("class", "x axis-label")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - margin.top);

  g.append("text")
    .attr("class", "y axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height / 2))
    .attr("y", -60);

  g.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0,${height})`);

  g.append("g").attr("class", "y axis");
};

const assignMovingAverage = (quotes, period) => {
  for (i = period; i <= quotes.length; i++) {
    const sets = _.slice(quotes, i - period, i);
    const sma = _.round(
      _.reduce(
        sets,
        (acc, element) => {
          return acc + element.Close;
        },
        0
      ) / period
    );
    quotes[i - 1].sma = sma;
  }
};

const analyzeData = quotes => {
  assignMovingAverage(quotes, 100);
  const buy = _.filter(quotes, element => {
    return _.round(element.Close) > element.sma;
  });

  const sales = _.filter(quotes, element => {
    return _.round(element.Close) < element.sma;
  });

  return { buy, sales };
};

const startVisualization = quotes => {
  const transaction = analyzeData(quotes);
  // showData(transaction);
  initChart();
  update(quotes);
};

const main = () => {
  d3.csv("data/nifty.csv", parseNumerics).then(startVisualization);
};

window.onload = main;
