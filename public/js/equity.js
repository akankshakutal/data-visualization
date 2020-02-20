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

const detectTransactions = quotes => {
  const transactions = _.filter(quotes, "sma").reduce(
    (acc, quote) => {
      const last = acc[acc.length - 1];
      if (quote.Close > quote.sma && last.buy == undefined) {
        last.buy = quote;
      }
      if (
        quote.Close < quote.sma &&
        last.buy != undefined &&
        last.sale == undefined
      ) {
        last.sale = quote;
        acc.push({});
      }
      return acc;
    },
    [{}]
  );
  transactions[transactions.length - 1].sale = _.last(quotes);
  return transactions;
};

const analyzeData = quotes => {
  assignMovingAverage(quotes, 100, 1);
  const transactions = detectTransactions(quotes);
  return transactions;
};

const titles = ["Sr. No.", "Buy Date", "Buy Price", "Sale Date", "Sale Price"];

const getMappedValue = (quote, title, index) => {
  console.log(quote);
  switch (title) {
    case "Sr. No.":
      return index;
    case "Buy Date":
      return quote.buy.date;
    case "Buy Price":
      return quote.buy.Close;
    case "Sale Date":
      return quote.sale.date;
    case "Sale Price":
      return quote.sale.Close;
  }
};

const drawTable = quotes => {
  const table = d3.select("#chart-data").append("table");
  table
    .append("thead")
    .append("tr")
    .selectAll("th")
    .data(titles)
    .enter()
    .append("th")
    .text(d => d);

  const rows = table
    .append("tbody")
    .selectAll("tr")
    .data(quotes)
    .enter()
    .append("tr");

  rows
    .selectAll("td")
    .data((d, i) => {
      return titles.map(k => {
        return { value: getMappedValue(d, k, i), name: k };
      });
    })
    .enter()
    .append("td")
    .attr("data-th", d => d.name)
    .text(d => d.value);
};

const startVisualization = quotes => {
  const transactions = analyzeData(quotes);
  drawTable(transactions);
  drawSlider(quotes);
  initChart();
  update(quotes);
};

const main = () => {
  d3.csv("data/nifty.csv", parseNumerics).then(startVisualization);
};

window.onload = main;
