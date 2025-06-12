



let finalChartInstance = null;
let pieChartInstance = null;
let radarChartInstance = null;

function renderVisualization() {
    console.log("▶️ [renderVisualization] Được gọi");
    console.log("🔍 tableFinalScores:", tableFinalScores);
    console.log("🔍 tableCriteriaWeights:", tableCriteriaWeights);
    console.log("🔍 tableAlternativeWeights:", tableAlternativeWeights);
  if (!tableFinalScores?.length || !tableCriteriaWeights?.length || !tableAlternativeWeights?.length) {
    alert("⚠️ Dữ liệu chưa sẵn sàng. Vui lòng tính AHP trước.");
    return;
  }

  renderFinalScoreBarChart();
  renderCriteriaWeightPieChart();
  renderAlternativeRadarChart();
}
function renderFinalScoreBarChart() {
  const ctx = document.getElementById('finalChart').getContext('2d');
  if (finalChartInstance) finalChartInstance.destroy();

  const labels = tableFinalScores.map(item => item.name);
  const data = tableFinalScores.map(item => item.score);

  finalChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tổng điểm AHP',
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context) {
              return `Điểm: ${context.parsed.y.toFixed(4)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Tổng điểm AHP'
          }
        }
      }
    }
  });
}


function renderCriteriaWeightPieChart() {
  const ctx = document.getElementById('criteriaPieChart').getContext('2d');
  if (pieChartInstance) pieChartInstance.destroy();

  const labels = tableCriteriaWeights.map(c => c.name);
  const data = tableCriteriaWeights.map(c => c.weight);

  pieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        label: 'Trọng số tiêu chí',
        data: data,
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
          '#9966FF', '#FF9F40', '#C9CBCF', '#84E1BC'
        ]
      }]
    },
    options: {
      responsive: false
    }
  });
}

function renderAlternativeRadarChart() {
  const ctx = document.getElementById('radarChart').getContext('2d');
  if (radarChartInstance) radarChartInstance.destroy();

  const labels = Object.keys(tableAlternativeWeights[0]).filter(k => k !== 'name');

  const datasets = tableAlternativeWeights.map(alt => ({
    label: alt.name,
    data: labels.map(label => alt[label]),
    fill: true,
    borderWidth: 2,
    pointRadius: 3
  }));

//   radarChartInstance = new Chart(ctx, {
//     type: 'radar',
//     data: {
//       labels: labels,
//       datasets: datasets
//     },
//     options: {
//       responsive: false,
//       elements: {
//         line: {
//           borderWidth: 2
//         }
//       },
//       scales: {
//         r: {
//           beginAtZero: true
//         }
//       }
//     }
//   });
  radarChartInstance = new Chart(ctx, {
  type: 'radar',
  data: {
    labels: labels,
    datasets: datasets
  },
  options: {
    responsive: false,
    interaction: {
      mode: 'nearest',
      axis: 'xy',
      intersect: false
    },
    plugins: {
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.formattedValue}`;
          }
        }
      },
      legend: {
        display: true,
        position: 'top'
      }
    },
    elements: {
      line: {
        borderWidth: 2
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        pointLabels: {
          font: {
            size: 14
          }
        }
      }
    }
  }
});

}