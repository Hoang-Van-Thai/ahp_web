let lastAlternativeResults = []
let criteriaNames = [];
let isAlternativeCRValid = false;
let alternativeNames = [];  
let alternativeComparisonMatrices = {};
let detailedAlternativeResults = {};
let tableAlternativeWeights = [];  
let tableCriteriaWeights = [];   
let tableFinalScores = [];       

  const defaultAlternativeMatrixData = {
    "Thổ nhưỡng": [
      [1, 3, 5, 7],
      [0.333, 1, 3, 5],
      [0.2, 0.333, 1, 3],
      [0.143, 0.2, 0.333, 1]
    ],
    "Độ dốc": [
      [1, 2, 5, 6],
      [0.5, 1, 4, 5],
      [0.2, 0.25, 1, 3],
      [0.167, 0.2, 0.333, 1]
    ],
    "Độ cao": [
      [1, 2, 3, 4],
      [0.5, 1, 2, 3],
      [0.333, 0.5, 1, 2],
      [0.25, 0.333, 0.5, 1]
    ],
    "Độ dày tầng đất": [
      [1, 1.5, 2, 4],
      ["2/3", 1, 1.5, 3],
      ["1/2", "2/3", 1, 2],
      ["1/4", "1/3", "1/2", 1]
    ],
    "Khả năng tưới": [
      [1, 2, 3, 4],
      ["1/2", 1, 2, 3],
      ["1/3", "1/2", 1, 2],
      ["1/4", "1/3", "1/2", 1]
    ],
    "Độ pH": [
      [1, 2, 3, 2],
      ["1/2", 1, 2, 1.5],
      ["1/3", "1/2", 1, 1],
      ["1/2", "2/3", 1, 1]
    ],
    "Độ sét": [
      [1, 2, 2, 3],
      ["1/2", 1, 2, 2],
      ["1/2", "1/2", 1, 2],
      ["1/3", "1/2", "1/2", 1]
    ],
    "Độ tơi xốp": [
      [1, 2, 2.5, 3],
      ["1/2", 1, 2, 2.5],
      ["2/5", "1/2", 1, 2],
      ["1/3", "2/5", "1/2", 1]
    ]
  };
  
  // Phương án mặc định
  const defaultAlternatives = [
    "Đất nâu đỏ trên đá mácma bazơ",
    "Đất nâu vàng trên đá mácma bazơ",
    "Đất phù sa ngòi suối",
    "Đất thung lũng"
  ];
  
  // Giai đoạn 1: Sinh danh sách nhập tên phương án
  function generateAlternatives() {
    const m = parseInt(document.getElementById("numAlternatives").value);
    const container = document.getElementById("alternativesNamesContainer");
    const matrixArea = document.getElementById("alternativesMatrixContainer");
    container.innerHTML = "";
    matrixArea.innerHTML = "";
  
    let html = `<h4>Nhập tên các phương án:</h4>`;
    for (let i = 0; i < m; i++) {
      const defaultName = defaultAlternatives[i] || `Phương án ${i + 1}`;
      html += `<input type='text' id='alt-name-${i}' value='${defaultName}' style='width: 100%; margin-bottom: 10px;'>`;
    }
  
    html += `<button onclick="confirmAlternativeNames(${m})" style="margin-top: 10px;">Xác nhận tên phương án</button>`;
    container.innerHTML = html;
  }
  
  // Giai đoạn 2: Sau khi xác nhận tên → sinh các ma trận theo tiêu chí
  function confirmAlternativeNames(m) {
    const names = [];
    for (let i = 0; i < m; i++) {
      const val = document.getElementById(`alt-name-${i}`).value.trim();
      names.push(val || `Phương án ${i + 1}`);
    }
   alternativeNames = names; 
    const matrixArea = document.getElementById("alternativesMatrixContainer");
    matrixArea.innerHTML = "";
  
    criteriaNames.forEach((critName, critIdx) => {
      const matrix = defaultAlternativeMatrixData[critName] || [];
      let html = `<h4>Tiêu chí ${critIdx + 1}: ${critName}</h4>`;
      html += "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; text-align: center;'>";
      html += "<tr><th></th>" + names.map(n => `<th>${n}</th>`).join('') + "</tr>";
  
      for (let i = 0; i < m; i++) {
        html += `<tr><th>${names[i]}</th>`;
       
        for (let j = 0; j < m; j++) {
          const id = `alt-${critIdx}-${i}-${j}`;
          let val = "1";
          if (matrix[i] && matrix[i][j] !== undefined) {
            val = matrix[i][j];
          }
        
          if (i === j) {
            // Đường chéo chính: readonly luôn là 1
            html += `<td><input type='text' id='${id}' value='1' style='width: 60px; background-color: #f0f0f0;' readonly /></td>`;
          } else if (i < j) {
            // Phía trên đường chéo: cho phép nhập
            const onInput = `onchange="handleAlternativeInput(${critIdx}, ${i}, ${j}, this.value)"`;
            html += `<td><input type='text' id='${id}' value='${val}' style='width: 60px;' ${onInput}></td>`;
          } else {
            // Phía dưới đường chéo: readonly tự động
            html += `<td><input type='text' id='${id}' value='${val}' style='width: 60px; background-color: #f0f0f0;' readonly /></td>`;
          }
        }
        
        html += "</tr>";
      }
      html += "</table><br/>";
      matrixArea.innerHTML += html;
    });
    matrixArea.innerHTML += `
  <button onclick="submitAlternativeMatrices()" style="margin-top: 20px;">Tính AHP phương án</button>
`;



  }
  
  
  function handleAlternativeInput(critIdx, i, j, val) {
    const cellA = document.getElementById(`alt-${critIdx}-${i}-${j}`);
    const cellB = document.getElementById(`alt-${critIdx}-${j}-${i}`);
  
    function toFloat(v) {
      if (typeof v === 'string' && v.includes('/')) {
        const [num, den] = v.split('/').map(Number);
        return num / den;
      }
      return parseFloat(v);
    }
  
    const v = toFloat(val);
    const validFractions = ["1", "1/2", "1/3", "1/4", "1/5", "1/6", "1/7", "1/8", "1/9"];
    const validValues = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
    if (
      (!isNaN(v) && (validValues.includes(v) || validFractions.includes(val.trim())))
    ) {
      const reciprocal = 1 / v;
      const formatted = toFraction(reciprocal);
      if (cellB !== document.activeElement) {
        cellB.value = formatted;
      }
    } else {
      alert("❌ Giá trị chỉ được nhập từ 1 đến 9 hoặc nghịch đảo như 1/2, 1/3,... 1/9.");
      cellA.value = "1";
      cellB.value = "1";
    }
  }
  
  // Chuyển số thực về phân số nếu gần giống
  function toFraction(value) {
    const fracMap = {
      "1": "1", "0.5": "1/2", "0.3333": "1/3", "0.25": "1/4", "0.2": "1/5",
      "0.1667": "1/6", "0.1429": "1/7", "0.125": "1/8", "0.1111": "1/9"
    };
    for (let k in fracMap) {
      if (Math.abs(parseFloat(k) - value) < 0.0001) return fracMap[k];
    }
    return parseFloat(value.toFixed(4)).toString();
  }
  function submitAlternativeMatrices() {
    
    const m = parseInt(document.getElementById("numAlternatives").value);
    const alternatives = [];
    for (let i = 0; i < m; i++) {
      const val = document.getElementById(`alt-name-${i}`).value.trim();
      alternatives.push(val || `Phương án ${i + 1}`);
    }
  
    const payload = [];
  
    criteriaNames.forEach((critName, critIdx) => {
      const matrix = [];
      for (let i = 0; i < m; i++) {
        const row = [];
        for (let j = 0; j < m; j++) {
          const val = document.getElementById(`alt-${critIdx}-${i}-${j}`).value;
          row.push(val);
        }
        matrix.push(row);
        if (!alternativeComparisonMatrices[critName]) {
          alternativeComparisonMatrices[critName] = [];
        }
        alternativeComparisonMatrices[critName] = matrix;
      }
  
      payload.push({
        criterion: critName,
        names: alternatives,
        matrix: matrix
      });
    });
  
    fetch('/calculate-alternatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(results => {
        lastAlternativeResults = results;
        renderFinalResults();

      
      const resultPanel = document.getElementById("alternativesMatrixContainer");
  
      resultPanel.insertAdjacentHTML("beforeend", `<h2 style="margin-top: 40px;">Kết quả đánh giá phương án theo từng tiêu chí</h2>`);


      results.forEach(result => {
        detailedAlternativeResults[result.criterion] = {
        lambda_max: result.lambda_max,
        ci: result.ci,
        cr: result.cr,
        rows: result.details.map(d => ({
          name: d.name,
          weight: d.weight,
          weightSum: d.weightSum,
          consistencyVector: d.consistencyVector,
          rank: d.rank
        }))
      };
        isAlternativeCRValid = true; 

        results.forEach(result => {
          if (result.cr > 0.1) {
            isAlternativeCRValid = false;  
          }

        });

        resultPanel.insertAdjacentHTML("beforeend", `<h3>Tiêu chí: ${result.criterion}</h3>
          <table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse;'>
            <thead><tr><th>Phương án</th><th>Weight</th><th>Weight Sum</th><th>Consistency Vector</th><th>Rank</th></tr></thead>
            <tbody>
              ${result.details.map(d => `
                <tr>
                  <td>${d.name}</td>
                  <td>${d.weight}</td>
                  <td>${d.weightSum}</td>
                  <td>${d.consistencyVector}</td>
                  <td>${d.rank}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <p><strong>λ<sub>max</sub>:</strong> ${result.lambda_max}</p>
          <p><strong>CI:</strong> ${result.ci}</p>
          <p><strong>CR:</strong> ${result.cr}</p>
          
          <hr/>
        `);

      const crColor = result.cr > 0.1 ? 'red' : 'green';
      const crMessage = result.cr > 0.1
        ? `⚠️ CR = ${(result.cr * 100).toFixed(2)}% > 10%. Ma trận chưa nhất quán!`
        : `✅ CR = ${(result.cr * 100).toFixed(2)}%. Ma trận đạt mức nhất quán.`;

      resultPanel.insertAdjacentHTML("beforeend", `<p style="color: ${crColor}; font-weight: bold;">${crMessage}</p>`);
      });
      
    console.log("Tên phương án:", alternativeNames);
    console.log("Ma trận so sánh phương án theo tiêu chí:", alternativeComparisonMatrices);
    console.log("Bảng kết quả chi tiết AHP:", detailedAlternativeResults);
    console.log("Bảng 1 – Trọng số phương án:", tableAlternativeWeights);
    console.log("Bảng 2 – Trọng số tiêu chí:", tableCriteriaWeights);
    console.log("Bảng 3 – Tổng điểm và xếp hạng:", tableFinalScores);

    })
    .catch(err => {
      console.error("Lỗi gửi dữ liệu ma trận:", err);
      alert("Lỗi xử lý ma trận. Vui lòng kiểm tra đầu vào.");
    });
  }
  function renderFinalResults() {
  
    
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = `<button onclick="exportToExcel()" style="margin-bottom: 20px;">📤 Xuất kết quả ra Excel</button>
     <button onclick="saveToDatabase()">💾 Lưu vào Database</button>
    `;
    
    const altNames = lastAlternativeResults[0].details.map(d => d.name);
    const critNames = lastAlternativeResults.map(r => r.criterion);
  
    // Bảng 1: Ma trận phương án theo tiêu chí
    let table1 = `<h4>Trọng số phương án theo từng tiêu chí</h4><table border='1'><tr><th>Phương án</th>`;
    table1 += critNames.map(c => `<th>${c}</th>`).join('') + "</tr>";
    // altNames.forEach((altName, i) => {
    //   table1 += `<tr><td>${altName}</td>`;
    //   lastAlternativeResults.forEach(res => {
    //     table1 += `<td>${res.details[i].weight}</td>`;
    //   });
    //   table1 += "</tr>";
    //   tableAlternativeWeights.push(row); 
    // });
    tableAlternativeWeights = [];  // reset

    altNames.forEach((altName, i) => {
      const row = { name: altName };
      table1 += `<tr><td>${altName}</td>`;
      lastAlternativeResults.forEach(res => {
        table1 += `<td>${res.details[i].weight}</td>`;
        row[res.criterion] = res.details[i].weight;
      });
      table1 += "</tr>";
      tableAlternativeWeights.push(row);  // ✅ đặt ở đây là đúng
    });

    table1 += "</table>";
  
    // Bảng 2: Trọng số tiêu chí
    let table2 = `<h4>Trọng số các tiêu chí</h4><table border='1'><tr><th>Tiêu chí</th><th>Trọng số</th></tr>`;
    tableCriteriaWeights = []; 
    lastCriteriaWeights.forEach(c => {
      table2 += `<tr><td>${c.name}</td><td>${c.weight}</td></tr>`;
      tableCriteriaWeights.push({ name: c.name, weight: c.weight });
    });
    table2 += "</table>";
  
    // Bảng 3: Tổng điểm phương án
    const finalScores = altNames.map((name, i) => {
      let sum = 0;
      lastAlternativeResults.forEach((res, j) => {
        sum += res.details[i].weight * lastCriteriaWeights[j].weight;
      });
      return { name, score: sum };
    }).sort((a, b) => b.score - a.score);
  
    let table3 = `<h4>Điểm tổng hợp phương án</h4><table border='1'><tr><th>Phương án</th><th>Điểm tổng</th><th>Xếp hạng</th></tr>`;
    tableFinalScores = [];
    finalScores.forEach((row, idx) => {
      table3 += `<tr><td>${row.name}</td><td>${row.score.toFixed(6)}</td><td>${idx + 1}</td></tr>`;
      tableFinalScores.push({ name: row.name, score: row.score, rank: idx + 1 });
    });
    table3 += "</table>";

    resultsDiv.innerHTML += table1 + "<br/>" + table2 + "<br/>" + table3;
  }
  function exportToExcel() {
    const altNames = lastAlternativeResults[0].details.map(d => d.name);
    const critWeights = lastCriteriaWeights.map(c => ({ name: c.name, weight: c.weight }));
    const altMatrix = altNames.map((altName, i) => {
      return lastAlternativeResults.map(res => res.details[i].weight);
    });
  
    fetch('/export-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alternatives: altNames,
        criteria_weights: critWeights,
        alt_results: altMatrix
      })
    })
    .then(response => response.blob())
    .then(blob => {
      const url = window.URL.createObjectURL(new Blob([blob]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AHP_Result.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => {
      console.error("Lỗi xuất Excel:", err);
      alert("Lỗi khi xuất file Excel");
    });
  }


function exportToExcel() {
  const data = {
    criteriaNames,
    criteriaMatrix,
    criteriaWeights: lastCriteriaWeights,
    criteriaResults,

    alternativeNames,
    alternativeMatrices: alternativeComparisonMatrices,
    altWeightsPerCriterion: tableAlternativeWeights,
    criteriaWeightsTable: tableCriteriaWeights,
    finalScores: tableFinalScores,
    detailedAlternativeResults // thêm phần chi tiết cho từng tiêu chí
  };

  fetch('/export-excel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AHP_Full_Report.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
  })
  .catch(err => {
    console.error("❌ Lỗi xuất Excel:", err);
    alert("Lỗi khi xuất file Excel");
  });
}
function saveToDatabase() {
    if (!isCRValid || !isAlternativeCRValid) {
        alert("⚠️ Ma trận tiêu chí hoặc phương án chưa nhất quán (CR > 10%). Vui lòng điều chỉnh trước khi lưu.");
        return;
    }

    const data = {
        criteriaNames,
        criteriaMatrix,
        criteriaWeights: lastCriteriaWeights,
        criteriaResults,
        alternativeNames,
        alternativeMatrices: alternativeComparisonMatrices,
        altWeightsPerCriterion: tableAlternativeWeights,
        criteriaWeightsTable: tableCriteriaWeights,
        finalScores: tableFinalScores,
        detailedAlternativeResults
    };

    fetch('/save-to-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            alert("✅ Dữ liệu đã được lưu vào cơ sở dữ liệu thành công!");
        } else {
            alert("❌ Lỗi khi lưu vào cơ sở dữ liệu: " + result.message);
        }
    })
    .catch(err => {
        console.error("❌ Lỗi khi lưu vào cơ sở dữ liệu:", err);
        alert("Lỗi khi lưu vào cơ sở dữ liệu");
    });
}

