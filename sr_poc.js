function appendScript (src) {
  return new Promise((resolve, _reject) => {
    const script = document.createElement('script')
    script.addEventListener('load', () => {
      resolve(script)
    })
    script.src = src
    document.querySelector('head').appendChild(script)
  })
}

const WEIGHTS = [
  0,
  10,
  20,
  30,
  40,
  50,
  60,
  70,
  80,
  90,
  100,
  200,
  300,
  400,
  500,
  600,
  700,
  800,
  900,
  1000,
  2000,
  3000,
  4000,
  5000,
  6000,
  7000,
  8000,
  9000,
  10000,
  20000,
  30000,
  40000,
  50000,
  60000,
  70000,
  80000,
  90000,
  100000,
  200000,
  300000,
  400000,
  500000,
  600000,
  700000,
  800000,
  900000,
  1000000,
  2000000,
  3000000,
  4000000,
  5000000,
  2 * 5000000
]
function getWeightedAvgFromRow (values) {
  if (WEIGHTS.length != values.length + 1) {
    console.error('not enough values')
    return null
  }
  // get sum of uniformly distributed samples from each bucket
  const row_weighted_sum = values
    .map((n, i) =>
      n > 0 ? n * WEIGHTS[i] + ((WEIGHTS[i + 1] - WEIGHTS[i]) * (n - 1)) / 2 : 0
    )
    .reduce((acc, v) => acc + v)
  const row_sum = values.reduce((acc, n) => acc + n)
  return row_weighted_sum / row_sum
}

function getQuantile (values, q) {
  if (WEIGHTS.length != values.length + 1) {
    console.error('not enough values')
    return null
  }
  const samples = values.flatMap((n, i) =>
    [...Array(n)].map((_, j) => lerp(j / n, WEIGHTS[i], WEIGHTS[i + 1]))
  )
  return samples[Math.floor(q * (samples.length - 1))]
}

/// 0 <= t <= 1
function lerp (t, a, b) {
  return (1 - t) * a + t * b
}

/// 0 <= t <= 1
function pickColor (s) {
  const COLORS = {
    violet: [112, 54, 157],
    indigo: [75, 54, 157],
    blue: [72, 125, 231],
    green: [121, 195, 20],
    yellow: [250, 235, 54],
    orange: [255, 165, 0],
    red: [232, 20, 22]
  }
  const RAINBOW = [
    COLORS.red,
    COLORS.orange,
    COLORS.yellow,
    COLORS.green,
    COLORS.blue,
    COLORS.indigo,
    COLORS.violet
  ]
  if (s <= 0) return RAINBOW[0]
  else if (s >= 1) return RAINBOW[RAINBOW.length - 1]
  const t = s * (RAINBOW.length - 1)
  const i = Math.floor(t)
  const r = t % 1
  return [
    lerp(r, RAINBOW[i][0], RAINBOW[i + 1][0]),
    lerp(r, RAINBOW[i][1], RAINBOW[i + 1][1]),
    lerp(r, RAINBOW[i][2], RAINBOW[i + 1][2])
  ]
}

function pickColorForRowByName (row_name) {
  const ROWS = [
    'SC SR pre launch queued',
    'SC SR pre task queued',
    'SC SR Connect time',
    'SC SR header send time',
    'SC SR body transfer',
    'Ghost preprocess HTTP parse + MDT',
    'Ghost High Preceision rtt',
    'Ghost Origin Think time',
    'Ghost Origin RTT',
    'Ghost response transfer',
    'SR over all time'
  ]
  const ROWS_TO_COLORS = Object.fromEntries(
    ROWS.map((name, i) => [name, pickColor(i / (ROWS.length - 1))])
  )
  return row_name in ROWS_TO_COLORS ? ROWS_TO_COLORS[row_name] : null
}

function formatColor ([r, g, b], opacity) {
  if (typeof opacity === 'number') {
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  } else {
    return `rgb(${r}, ${g}, ${b})`
  }
}

function createPieChartElement ({ title, data }) {
  const chart_wrapper = document.createElement('div')
  chart_wrapper.style.width = '30vw'
  chart_wrapper.style['margin-left'] = window.innerWidth / 4

  const chart = document.createElement('canvas')
  chart_wrapper.appendChild(chart)

  const keys = Object.keys(data)
  const values = Object.values(data)

  new Chart(chart, {
    type: 'pie',
    data: {
      labels: Object.keys(data),
      datasets: [
        {
          data: values,
          backgroundColor: values.map((_, i) =>
            formatColor(pickColor(i / (values.length - 1)))
          )
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          // display: false,
          position: 'right'
        },
        title: {
          display: true,
          text: title
        }
      }
    }
  })
  return chart_wrapper
}

function getTableNumRequests (table) {
  return [...table.querySelectorAll('tbody tr')]
    .slice(1)
    .map(row => parseInt(row.querySelectorAll('td')[1].innerText, 10))
    .reduce((p, v) => Math.max(p, v))
}

function getPhantomNumRequests () {
  return [...document.querySelectorAll('pre')]
    .filter(el => el.innerText.includes('Time breakdown for phantom'))
    .map(el => {
      const next = el.nextElementSibling
      if (next?.tagName === 'TABLE') {
        return getTableNumRequests(next)
      } else {
        return 0
      }
    })
}

function createPhantomDistributionChart () {
  const distribution = getPhantomNumRequests()
  const sum = distribution.reduce((a, v) => a + v)
  const distribution_pct = distribution.map(v => (v / sum) * 100)

  const el_list = document.querySelectorAll('hr')
  const el = el_list[el_list.length - 1]

  el.before(
    createPieChartElement({
      title: 'Phantom Request Distribution',
      data: Object.fromEntries(
        distribution_pct.map((v, i) => [`Phantom ${i}`, v])
      )
    })
  )
}

function collateTableByStageName (table) {
  return [...table.querySelectorAll('tbody tr')]
    .slice(1)
    .map(row => [
      row.children[0].innerText,
      [...row.children].slice(2).map(td => parseInt(td.innerText, 10))
    ])
}

function createHistogramDistributionElementList (table) {
  const collated_table = collateTableByStageName(table)

  // const data = [{
  //   type: "bar",
  //   x: collated_table.map(([name, _]) => name),
  //   y: collated_table.map(([_, data]) => getOptimisticWeightedAvgFromRow(data)),
  //   marker: {
  //     color: formatColor(pickColor(i / (collated_table.length - 1))),
  //   }
  // }];
  const graphParams = [
    { title: 'Average', aggFunc: getWeightedAvgFromRow },
    { title: '95th Percentile', aggFunc: v => getQuantile(v, 0.95) },
    { title: '99th Percentile', aggFunc: v => getQuantile(v, 0.99) }
  ]
  return graphParams.map(({ title, aggFunc }) => {
    const data = collated_table
      .map(([name, data], i) => ({
        type: 'bar',
        name: name,
        x: [aggFunc(data) / 1000],
        // y: [name],
        opacity: 0.5,
        marker: {
          color: formatColor(
            pickColorForRowByName(name) ??
              pickColor(i / (collated_table.length - 1))
          )
        }
      }))
      .reverse()
    const layout = {
      title: { text: title },
      legend: { traceorder: 'reversed' },
      xaxis: {
        title: 'Duration (ms)'
      },
      yaxis: { showticklabels: false }
    }

    const chart = document.createElement('div')
    Plotly.newPlot(chart, data, layout)

    return chart
  })
}

function createOverlaidHistogramElement (table) {
  const collated_table = collateTableByStageName(table)

  const chart = document.createElement('div')

  const data = collated_table.map(([name, data], i) => ({
    type: 'bar',
    name: name,
    y: data,
    opacity: 0.5,
    marker: {
      color: formatColor(
        pickColorForRowByName(name) ??
          pickColor(i / (collated_table.length - 1))
      )
    }
  }))
  const layout = {
    title: { text: 'Overlaid Histogram' },
    barmode: 'overlay',
    xaxis: {
      showticklabels: false
    },
    yaxis: {
      title: 'Count'
    }
  }

  Plotly.newPlot(chart, data, layout)

  return chart
}

function onDocumentReady () {
  const tables = document.querySelectorAll('table')
  for (const table of tables) {
    // prepend "total" column
    const tbody = table.children[0]
    for (let i = 0; i < tbody.children.length; i++) {
      const row = tbody.children[i]
      let new_col
      if (i == 0) {
        new_col = document.createElement('th')
        new_col.innerText = 'Total'
        new_col.align = 'center'
      } else {
        const row_sum = [...row.querySelectorAll('td:not(:first-child)')]
          .map(el => parseInt(el.innerText, 10))
          .reduce((acc, cur) => acc + cur)
        new_col = document.createElement('td')
        new_col.innerText = row_sum
        new_col.align = 'right'

        // console.log(row.children[0].innerText);
        // console.log(pickColorForRowByName(row.children[0].innerText))
        // row.style["background-color"] = formatColor(pickColorForRowByName(row.children[0].innerText), 0.5);
      }
      new_col.colSpan = 1
      row.insertBefore(new_col, row.children[1])
    }
    const chart_container = $('<div></div>')
    for (const el of [
      ...createHistogramDistributionElementList(table),
      createOverlaidHistogramElement(table)
    ]) {
      $("<div style='display:inline-block; width: 50%'></div>")
        .append(el)
        .appendTo(chart_container)
    }
    $(table).after(chart_container)
  }
  createPhantomDistributionChart()
}

Promise.all([
  appendScript('https://code.jquery.com/jquery-3.7.1.slim.min.js'),
  appendScript(
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
  ),
  appendScript('https://cdn.plot.ly/plotly-2.27.0.min.js')
]).then(() => {
  onDocumentReady()
})
