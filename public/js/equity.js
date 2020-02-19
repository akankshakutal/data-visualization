const chartSize = { width: 1420, height: 700 };
const margin = { left: 100, right: 10, top: 30, bottom: 70 };
const width = chartSize.width - margin.left - margin.right;
const height = chartSize.height - margin.top - margin.bottom;
let startingDate;
let endingDate;

const applyUserPreferance = quotes => {
  const period = 100;
  const offset = 1;
  d3.select("#period").on("input", function() {
    assignMovingAverage(quotes, +this.value, offset);
    update(quotes);
  });

  d3.select("#offset").on("input", function() {
    assignMovingAverage(quotes, period, +this.value);
    update(quotes);
  });
};

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

  const closePath = d3.selectAll("path.close");
  closePath.remove();
  const smaPath = d3.selectAll("path.sma");
  smaPath.remove();

  g.append("path")
    .attr("class", "close")
    .attr("d", line("Close")(quotes));

  g.append("path")
    .attr("class", "sma")
    .attr("d", line("sma")(_.filter(quotes, "sma")));
};

const getRequiredQuotes = (quotes, startingDate, endingDate) => {
  return quotes.filter(
    element => startingDate <= element.date && element.date <= endingDate
  );
};

const drawSlider = quotes => {
  const firstDate = new Date(_.first(quotes)["date"]);
  const lastDate = new Date(_.last(quotes)["date"]);
  const startingTime = firstDate.getTime();
  const endingTime = lastDate.getTime();
  const slider = createD3RangeSlider(
    startingTime,
    endingTime,
    "#slider-container"
  );

  slider.onChange(newRange => {
    startingDate = new Date(newRange.begin).toJSON().split("T")[0];
    endingDate = new Date(newRange.end).toJSON().split("T")[0];
    const requiredQuotes = getRequiredQuotes(quotes, startingDate, endingDate);
    update(requiredQuotes);
    d3.select("#range-label").text(startingDate + " - " + endingDate);
  });

  slider.range(startingTime, endingTime);
  applyUserPreferance(quotes);
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

const assignMovingAverage = (quotes, period, offset) => {
  for (i = period + offset; i <= quotes.length; i++) {
    const sets = _.slice(quotes, i - period - offset, i - offset);
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
  assignMovingAverage(quotes, 100, 1);
  const buy = _.filter(quotes, element => {
    return _.round(element.Close) > element.sma;
  });

  const sales = _.filter(quotes, element => {
    return _.round(element.Close) < element.sma;
  });

  return { buy, sales };
};

const startVisualization = quotes => {
  analyzeData(quotes);
  drawSlider(quotes);
  initChart();
  update(quotes);
};

const main = () => {
  d3.csv("data/nifty.csv", parseNumerics).then(startVisualization);
};

window.onload = main;
