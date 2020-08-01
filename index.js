// Set up the stepper
const steps = [
  {
    step: "National Unemployment",
    explainer: [
      "During the past few months, the coronavirus has brought economic recession and has sent the unemployment rate soaring in the US.",
      "You can click the buttons above the chart to see how the impact has affected different demographics.",
    ],
    annotations: [
      {
        name: "The national unemployment rate",
        properties: {
          age: "All ages",
          gender: "All genders",
          race: "All races",
        },
        valueYOffset: {
          first: 0,
          last: 0,
        }, // Offset is used to make sure annotation values don't overlap
        labelPosition: {
          date: 3, // x pixel position will be margin.left + x(data.dates[date])
          value: 7, // y Pixel position will be margin.top + y(value)
        },
      },
    ],
    showFilter: false,
    showTooltip: false,
  },
  {
    step: "Unemployment by Race",
    explainer: [
      "Black and Hispanic workers experienced a bigger impact compared to White workers.",
    ],
    annotations: [
      {
        name: "The unemployment rate for White workers",
        properties: {
          age: "All ages",
          gender: "All genders",
          race: "White",
        },
        valueYOffset: {
          first: 0,
          last: 0,
        },
        labelPosition: {
          date: 3,
          value: 4,
        },
      },
      {
        name: "The unemployment rate for Black workers",
        properties: {
          age: "All ages",
          gender: "All genders",
          race: "Black or African American",
        },
        valueYOffset: {
          first: 3,
          last: 7,
        },
        labelPosition: {
          date: 0,
          value: 8,
        },
      },
      {
        name: "The unemployment rate for Hispanic workers",
        properties: {
          age: "All ages",
          gender: "All genders",
          race: "Hispanic or Latino",
        },
        valueYOffset: {
          first: 0,
          last: 0,
        },
        labelPosition: {
          date: 3,
          value: 19,
        },
      },
    ],
    showFilter: false,
    showTooltip: false,
  },
  {
    step: "Unemployment by Age",
    explainer: [
      "Young workers (ages 24 and below) have seen steeper declines compared to older workers (ages 25 and over).",
    ],
    annotations: [
      {
        name: "The unemployment rate for workers ages 16 to 24",
        properties: {
          age: "16 to 24 years",
          gender: "All genders",
          race: "All races",
        },
        valueYOffset: {
          first: 0,
          last: 0,
        },
        labelPosition: {
          date: 2,
          value: 28,
        },
      },
      {
        name: "The unemployment rate for workers ages 25 to 54",
        properties: {
          age: "25 to 54 years",
          gender: "All genders",
          race: "All races",
        },
        valueYOffset: {
          first: 10,
          last: -7,
        },
        labelPosition: {
          date: 3,
          value: 4,
        },
      },
      {
        name: "The unemployment rate for workers ages 55 and over",
        properties: {
          age: "55 years and over",
          gender: "All genders",
          race: "All races",
        },
        valueYOffset: {
          first: 0,
          last: 7,
        },
        labelPosition: {
          date: 3,
          value: 15,
        },
      },
    ],
    showFilter: false,
    showTooltip: false,
  },
  {
    step: "Explore on Your Own",
    explainer: [
      "Explore how the unemployment rates of different demographics are affected differently.",
      "Hover over a line in the chart to see which combination of demographics it represents.",
      "Toggle filters below the chart to show only a subset.",
    ],
    annotations: [],
    showFilter: true,
    showTooltip: true,
  },  
];
const stepButton = d3
  .select(".stepper")
  .selectAll("button")
  .data(steps)
  .join("button")
  .attr("class", "step-button")
  .classed("active", (d, i) => i === 0)
  .text((d) => d.step)
  .on("click", (d) => {
    stepButton.classed("active", (e) => e === d);
    updateStep(d);
  });

// Line chart
// https://observablehq.com/@d3/multi-line-chart
let data, filtered, gLines, gTooltip, gAnnotations;
const container = d3.select(".canvas");
const svgWidth = container.node().clientWidth;
const svgHeight = 360;
const margin = { top: 25, right: 45, bottom: 25, left: 45 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const x = d3.scaleUtc().range([0, width]);
const y = d3.scaleLinear().range([0, height]);

const line = d3
  .line()
  .curve(d3.curveMonotoneX)
  .x((d, i) => x(data.dates[i]))
  .y((d) => y(d));

const svg = container
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const g = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

function xAxis(g) {
  g.call(
    d3
      .axisTop(x)
      .ticks(width / 80)
      .tickFormat(formatDate)
  );
}

function yAxisLeft(g) {
  g.call(
    d3
      .axisLeft(y)
      .ticks(height / 60)
      .tickFormat(formatPercentage)
  ).call((g) => g.select(".domain").remove());
}

function yAxisRight(g) {
  g.attr("transform", `translate(${width},0)`)
    .call(
      d3
        .axisRight(y)
        .ticks(height / 60)
        .tickFormat(formatPercentage)
    )
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .append("text")
        .attr("y", height + 20)
        .attr("x", margin.right)
        .attr("text-anchor", "end")
        .attr("fill", "currentColor")
        .text(data.y)
    );
}

function formatDate(d, i) {
  if (i === 0) {
    return d3.utcFormat("%b %Y")(d);
  } else {
    return d3.utcFormat("%b")(d);
  }
}

function formatPercentage(d) {
  return `${d}%`;
}

function renderLines() {
  gLines
    .selectAll("path")
    .data(filtered)
    .join("path")
    .attr("class", "line")
    .attr("d", (d) => line(d.values));
}

// Tooltip
const tooltip = d3.select(".tooltip").style("display", "none");
svg.on("mousemove", moved).on("mouseenter", entered).on("mouseleave", left);

function moved() {
  d3.event.preventDefault();
  const mouse = d3.mouse(g.node());
  const xm = x.invert(mouse[0]);
  const ym = y.invert(mouse[1]);
  const i1 = d3.bisectLeft(data.dates, xm, 1);
  const i0 = i1 - 1;
  const i = xm - data.dates[i0] > data.dates[i1] - xm ? i1 : i0;
  const s = d3.least(filtered, (d) => Math.abs(d.values[i] - ym));
  if (gTooltip.datum() !== s) {
    gTooltip.datum(s);

    // Line and value
    gTooltip
      .selectAll(".tooltip-g")
      .data([s])
      .join((enter) =>
        enter
          .append("g")
          .attr("class", "tooltip-g")
          .call((g) => g.append("path").attr("class", "tooltip-line"))
          .call((g) =>
            g
              .append("rect")
              .attr("class", "tooltip-rect first")
              .attr("x", -margin.left)
              .attr("width", margin.left)
              .attr("height", 16)
              .attr("fill", "#ffffff")
          )
          .call((g) =>
            g
              .append("text")
              .attr("class", "tooltip-value first")
              .attr("text-anchor", "end")
              .attr("dy", "0.32em")
              .attr("x", -9)
          )
          .call((g) =>
            g
              .append("rect")
              .attr("class", "tooltip-rect last")
              .attr("x", width)
              .attr("width", margin.right)
              .attr("height", 16)
              .attr("fill", "#ffffff")
          )
          .call((g) =>
            g
              .append("text")
              .attr("class", "tooltip-value last")
              .attr("text-anchor", "start")
              .attr("dy", "0.32em")
              .attr("x", width + 9)
          )
      )
      .call((g) => g.select(".tooltip-line").attr("d", (d) => line(d.values)))
      .call((g) =>
        g.select(".tooltip-rect.first").attr("y", (d, i) => y(d.values[0]) - 8)
      )
      .call((g) =>
        g
          .select(".tooltip-value.first")
          .attr("y", (d, i) => y(d.values[0]))
          .text((d) => formatPercentage(d.values[0]))
      )
      .call((g) =>
        g
          .select(".tooltip-rect.last")
          .attr("y", (d, i) => y(d.values[d.values.length - 1]) - 8)
      )
      .call((g) =>
        g
          .select(".tooltip-value.last")
          .attr("y", (d, i) => y(d.values[d.values.length - 1]))
          .text((d) => formatPercentage(d.values[d.values.length - 1]))
      );

    // Tooltip label
    tooltip.html(s.name);
    let [left, top] = d3.mouse(container.node());
    if (left < svgWidth / 2) {
      // Tooltip on the right of the mouse
      left = left + 10;
    } else {
      // Tooltip on the left of the mouse
      left = left - 220;
    }
    tooltip.style("transform", `translate(${left}px,${top}px)`);
  }
}

function entered() {
  tooltip.style("display", "block");
}

function left() {
  gTooltip.datum(null).select("*").remove();
  tooltip.style("display", "none");
}

// Initial render
d3.csv("unemployment.csv").then((csv) => {
  // CSV extracted from https://data.bls.gov/PDQWeb/ln
  data = processData(csv);
  filtered = filterData();

  x.domain(d3.extent(data.dates));
  y.domain([0, d3.max(data.series, (d) => d3.max(d.values))]).nice();

  g.append("g").attr("class", "axis").call(xAxis);
  g.append("g").attr("class", "axis").call(yAxisLeft);
  g.append("g").attr("class", "axis").call(yAxisRight);

  const gMain = g
    .append("g")
    .attr("fill", "none")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");

  gLines = gMain.append("g"); // Actual lines container
  renderLines();

  gTooltip = gMain.append("g"); // Tooltip hovering line container

  gAnnotations = gMain.append("g"); // Annotation lines container

  updateStep(steps[0]);
});

// Process data
function processData(data) {
  const properties = data.columns.slice(1, 4);
  const columns = data.columns.slice(4);
  return {
    y: "Unemployment",
    series: data.map((d) => ({
      name: `The unemployment rate for ${properties
        .map((p) => d[p])
        .join(", ")}`,
      properties: properties.reduce((properties, p) => {
        properties[p.toLowerCase()] = d[p];
        return properties;
      }, {}),
      values: columns.map((k) => +d[k]),
    })),
    dates: columns.map(d3.utcParse("%b-%y")),
  };
}

function updateStep(step) {
  updateExplainer(step.explainer);
  updateAnnotations(step.annotations);
  svg.style("pointer-events", step.showTooltip ? "all" : "none");
  filtersContainer.style("display", step.showFilter ? "flex" : "none");
}

function updateExplainer(texts) {
  d3.select(".explainer")
    .selectAll("p")
    .data(texts)
    .join("p")
    .text((d) => d);
}

// Filters
const filters = {
  gender: {
    "All genders": true,
    Men: true,
    Women: true,
  },
  race: {
    "All races": true,
    Asian: true,
    "Black or African American": true,
    White: true,
    "Hispanic or Latino": true,
  },
  age: {
    "All ages": true,
    "16 to 24 years": true,
    "25 to 54 years": true,
    "55 years and over": true,
  },
};
const filtersContainer = d3.select(".filters");
const filterButton = filtersContainer
  .selectAll(".filter-group")
  .data(Object.keys(filters).map((key) => ({ key: key, value: filters[key] })))
  .join("div")
  .attr("class", "filter-group")
  .selectAll(".filter-button")
  .data((d) => Object.keys(d.value))
  .join("button")
  .attr("class", "filter-button active")
  .text((d) => d)
  .on("click", function (d) {
    const filterCategory = d3.select(this.parentNode).datum().key;
    filters[filterCategory][d] = !filters[filterCategory][d];
    d3.select(this).classed("active", filters[filterCategory][d]);
    filtered = filterData();
    renderLines();
  });

function filterData() {
  return data.series.filter((d) => {
    return Object.keys(d.properties).every((p) => {
      return filters[p][d.properties[p]];
    });
  });
}

// Annotations
function updateAnnotations(annotations) {
  // Lines and values
  const annotationSeries = annotations.map((a) => {
    return data.series.find((d) => {
      return Object.keys(a.properties).every((p) => {
        return d.properties[p] === a.properties[p];
      });
    });
  });
  gAnnotations
    .selectAll(".annotation-g")
    .data(annotationSeries)
    .join((enter) =>
      enter
        .append("g")
        .attr("class", "annotation-g")
        .call((g) =>
          g
            .append("path")
            .attr("class", "annotation-line")
            .attr("stroke", "currentColor")
        )
        .call((g) =>
          g
            .append("rect")
            .attr("class", "annotation-rect first")
            .attr("x", -margin.left)
            .attr("width", margin.left)
            .attr("height", 16)
            .attr("fill", "#ffffff")
        )
        .call((g) =>
          g
            .append("text")
            .attr("class", "annotation-value first")
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .attr("dy", "0.32em")
            .attr("x", -9)
        )
        .call((g) =>
          g
            .append("rect")
            .attr("class", "annotation-rect last")
            .attr("x", width)
            .attr("width", margin.right)
            .attr("height", 16)
            .attr("fill", "#ffffff")
        )
        .call((g) =>
          g
            .append("text")
            .attr("class", "annotation-value last")
            .attr("fill", "currentColor")
            .attr("text-anchor", "start")
            .attr("dy", "0.32em")
            .attr("x", width + 9)
        )
    )
    .attr("class", (d, i) => `annotation-g annotation-${i}`)
    .call((g) => g.select(".annotation-line").attr("d", (d) => line(d.values)))
    .call((g) =>
      g
        .select(".annotation-rect.first")
        .attr(
          "y",
          (d, i) => y(d.values[0]) - 8 + annotations[i].valueYOffset.first
        )
    )
    .call((g) =>
      g
        .select(".annotation-value.first")
        .attr("y", (d, i) => y(d.values[0]) + annotations[i].valueYOffset.first)
        .text((d) => formatPercentage(d.values[0]))
    )
    .call((g) =>
      g
        .select(".annotation-rect.last")
        .attr(
          "y",
          (d, i) =>
            y(d.values[d.values.length - 1]) -
            8 +
            annotations[i].valueYOffset.last
        )
    )
    .call((g) =>
      g
        .select(".annotation-value.last")
        .attr(
          "y",
          (d, i) =>
            y(d.values[d.values.length - 1]) + annotations[i].valueYOffset.last
        )
        .text((d) => formatPercentage(d.values[d.values.length - 1]))
    );

  // Labels
  d3.select(".annotations")
    .selectAll(".annotation")
    .data(annotations)
    .join((enter) =>
      enter
        .append("div")
        .attr("class", "annotation")
        .call((div) => div.append("div").attr("class", "annotation-label"))
    )
    .attr("class", (d, i) => `annotation annotation-${i}`)
    .style(
      "transform",
      (d) =>
        `translate(${margin.left + x(data.dates[d.labelPosition.date])}px,${
          margin.top + y(d.labelPosition.value)
        }px)`
    )
    .call((div) => div.select(".annotation-label").text((d) => d.name));
}
