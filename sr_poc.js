function appendScript (src) {
  const script = document.createElement('script')
  script.src = src
  document.querySelector('head').appendChild(script)
}

function getWeightedTimeFromRow (row) {
  const WEIGHTS = [
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
  const row_values = [...row.querySelectorAll('td')]
    .slice(2)
    .map(el => parseInt(el.innerText, 10))
  const row_weighted_sum = row_values
    .map((v, i) => v * WEIGHTS[i])
    .reduce((acc, v) => acc + v)
  const row_sum = row_values.reduce((acc, v) => acc + v)
  return row_weighted_sum / row_sum
}

function createPieChart (table) {
  const CHART_COLORS = {
    red: 'rgb(255, 99, 132)',
    orange: 'rgb(255, 159, 64)',
    yellow: 'rgb(255, 205, 86)',
    green: 'rgb(75, 192, 192)',
    blue: 'rgb(54, 162, 235)',
    purple: 'rgb(153, 102, 255)',
    grey: 'rgb(201, 203, 207)'
  }
  const chart_wrapper = document.createElement('canvas')
  chart_wrapper.style['margin-left'] = document.body.clientWidth / 8
  chart_wrapper.style.width = '25vw'
  new Chart(chart_wrapper, {
    type: 'pie',
    data: {
      labels: ['Red', 'Orange'],
      datasets: [
        {
          data: [1, 2, 3],
          backgroundColor: Object.values(CHART_COLORS)
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          position: 'top'
        },
        title: {
          display: true,
          text: 'Chart.js Pie Chart'
        }
      }
    }
  })
  table.after(chart_wrapper)
}

function onDocumentReady () {
  for (const table of document.querySelectorAll('table')) {
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
      }
      new_col.colSpan = 1
      row.insertBefore(new_col, row.children[1])
    }
  }
}

appendScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js')

window.addEventListener('load', onDocumentReady, false)
