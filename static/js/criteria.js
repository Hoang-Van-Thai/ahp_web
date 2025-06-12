let lastCriteriaWeights = []
let isCRValid = false;

let criteriaMatrix = [];
let criteriaResults = {};

function showTab(tabId) {
    if ((tabId === 'datasets' || tabId === 'results') && !isCRValid) {
      alert("❌ Ma trận tiêu chí chưa đạt mức nhất quán (CR > 10%). Vui lòng điều chỉnh trước khi tiếp tục.");
      return;  // chặn chuyển tab
    }
    if (tabId === 'results' && !isAlternativeCRValid) {
      alert("❌ Một hoặc nhiều ma trận phương án chưa đạt mức nhất quán (CR > 10%). Vui lòng điều chỉnh.");
      return;
    }
  
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    if (tabId === 'results') {
        renderFinalResults();
    }
    if (tabId === 'visualization') renderVisualization();
  }
  
  const defaultNames = ["Thổ nhưỡng", "Độ dốc", "Độ cao", "Độ dày tầng đất", "Khả năng tưới", "Độ pH", "Độ sét", "Độ tơi xốp"];
  const defaultValues = [[1,2,2,2,2.5,3,4,4],["1/2",1,1.5,1.5,2,2.5,3,3],["1/2","2/3",1,1.5,2,2.5,3,3.5],["1/2","2/3","2/3",1,1.5,2,2.5,3],["2/5","1/2","1/2","2/3",1,1.5,2,2.5],["1/3","2/5","2/5","1/2","2/3",1,1.5,2],["1/4","1/3","1/3","2/5","1/2","2/3",1,1.5],["1/4","1/3","2/7","1/3","2/5","1/2","2/3",1]];
  
  function toFraction(value) {
    const fracMap = {"1": "1", "0.5": "1/2", "0.3333": "1/3", "0.25": "1/4", "0.2": "1/5", "0.1667": "1/6", "0.1429": "1/7", "0.125": "1/8", "0.1111": "1/9"};
    for (let k in fracMap) {
      if (Math.abs(parseFloat(k) - value) < 0.0001) return fracMap[k];
    }
    return parseFloat(value.toFixed(4)).toString();
  }
  

  function generateMatrix() {

    const input = document.getElementById("numCriteria").value;
    const n = parseFloat(input);  // Dùng parseFloat để kiểm tra số thực
    const errorMsg = document.getElementById("criteriaError");

    if (isNaN(n) || n < 3 || n > 15 || !Number.isInteger(n)) {
      errorMsg.style.display = "block";
      errorMsg.textContent = "Vui lòng nhập một số nguyên từ 3 đến 15.";
      return;
    } else {
      errorMsg.style.display = "none";
    }
    const criteriaContainer = document.getElementById("criteriaNamesContainer");
    const matrixContainer = document.getElementById("matrixContainer");
    const confirmContainer = document.getElementById("confirmCriteriaNames");
  
    let nameInputs = "<h3>Tên các tiêu chí</h3><table style='border-collapse: collapse;'>";
    for (let i = 0; i < n; i += 2) {
      nameInputs += "<tr>";
      const name1 = defaultNames[i] || `Tiêu chí ${i + 1}`;
      nameInputs += `<td style="padding: 4px;"><input type='text' id='crit-name-${i}' value='${name1}' style='width: 250px; font-size: 14px; padding: 6px;' /></td>`;
  
      if (i + 1 < n) {
        const name2 = defaultNames[i + 1] || `Tiêu chí ${i + 2}`;
        nameInputs += `<td style="padding: 4px;"><input type='text' id='crit-name-${i + 1}' value='${name2}' style='width: 250px; font-size: 14px; padding: 6px;' /></td>`;
      } else {
        nameInputs += `<td></td>`;
      }
      nameInputs += "</tr>";
    }
    nameInputs += `</table><div style='margin-top: 10px;'><button onclick='confirmNames(${n})' style='padding: 6px 16px; font-size: 14px;'>Xác nhận</button></div>`;
  
    criteriaContainer.innerHTML = nameInputs;
    confirmContainer.innerHTML = "";
    matrixContainer.innerHTML = "";
  }
    
 
  function confirmNames(n) {
    const names = [];
    const confirmContainer = document.getElementById("confirmCriteriaNames");
    const matrixContainer = document.getElementById("matrixContainer");
  
    for (let i = 0; i < n; i++) {
      const val = document.getElementById(`crit-name-${i}`).value.trim();
      names.push(val || `Criteria ${i + 1}`);
    }
  
    confirmContainer.innerHTML = `<p><strong>Xác nhận tên tiêu chí:</strong> ${names.join(', ')}</p>`;
  
    let table = "<table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; text-align: center;'>";
    table += "<tr><th></th>" + names.map(n => `<th>${n}</th>`).join('') + "</tr>";
  

    for (let i = 0; i < n; i++) {
      table += `<tr><th>${names[i]}</th>`;
      for (let j = 0; j < n; j++) {
        const id = `cell-${i}-${j}`;
        if (i === j) {
          table += `<td><input type='text' value='1' id='${id}' style='width: 60px;' readonly /></td>`;
        } else if (i < j) {
          const val = defaultValues[i] && defaultValues[i][j] ? defaultValues[i][j] : "1";
          table += `<td><input type='text' value='${val}' id='${id}' style='width: 60px;' onchange='handleInput(${i}, ${j}, this.value)' /></td>`;
        } else {
          const reverseVal = defaultValues[j] && defaultValues[j][i] ? toFraction(1 / parseFloat(defaultValues[j][i])) : "1";
          table += `<td><input type='text' value='${reverseVal}' id='${id}' style='width: 60px; background-color: #f0f0f0;' readonly /></td>`;
        }
      }
      table += "</tr>";
    }
    
    criteriaNames = [...names];

    
    const scale = n > 12 ? 0.6 : n > 10 ? 0.7 : n > 8 ? 0.8 : n > 6 ? 0.9 : 1;


    matrixContainer.innerHTML = `
    <div id="matrix-table-wrapper" style="transform: scale(${scale}); transform-origin: top left; display: inline-block;">
      ${table}
    </div>
    `;

    matrixContainer.insertAdjacentHTML(
      "beforeend",
      `<div style="margin-top: 20px;">
         <button onclick="submitMatrixToServer()" style="font-size: 15px;">Tính toán AHP</button>
         <div id="cr-warning" style="display: none;margin-top: 15px; font-weight: bold;"></div>
       </div>`
    );
    
 

  }
  
 
  function handleInput(i, j, val) {
  const allowedValues = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "1/2", "1/3", "1/4", "1/5", "1/6", "1/7", "1/8", "1/9",
    "2", "3", "4", "5", "6", "7", "8", "9",
    "0.5", "0.3333", "0.25","0.2", "0.1667", "0.1429", "0.125", "0.1111"
  ];

  const cellA = document.getElementById(`cell-${i}-${j}`);
  const cellB = document.getElementById(`cell-${j}-${i}`);
  const raw = val.trim();

  function isValidFraction(str) {
    return /^([1-9])\/([1-9])$/.test(str) && str !== "1/1";
  }

  function toFloat(v) {
    if (typeof v === "string" && v.includes("/")) {
      const [num, den] = v.split("/").map(Number);
      return num / den;
    }
    return parseFloat(v);
  }

  function toFraction(value) {
    const fractions = {
      "1": "1",
      "0.5": "1/2",
      "0.3333": "1/3",
      "0.25": "1/4",
      "0.2": "1/5",
      "0.1667": "1/6",
      "0.1429": "1/7",
      "0.125": "1/8",
      "0.1111": "1/9"
    };
    for (let key in fractions) {
      if (Math.abs(value - parseFloat(key)) < 0.01) {
        return fractions[key];
      }
    }
    return value.toFixed(3);
  }

  if (
    !allowedValues.includes(raw) &&
    !(isValidFraction(raw) && allowedValues.includes(raw))
  ) {
    alert("⚠️ Chỉ được nhập giá trị 1-9 hoặc nghịch đảo (1/2 đến 1/9).");
    cellA.value = "1";
    cellB.value = "1";
    return;
  }

  const floatVal = toFloat(raw);
  if (isNaN(floatVal) || floatVal <= 0) {
    alert("⚠️ Giá trị không hợp lệ.");
    cellA.value = "1";
    cellB.value = "1";
    return;
  }

  cellA.value = raw;
  cellB.value = toFraction(1 / floatVal);
}

  
  
  function submitMatrixToServer() {
  const n = parseInt(document.getElementById("numCriteria").value);
  criteriaMatrix = [];
  criteriaNames = [];

  for (let i = 0; i < n; i++) {
    const row = [];
    criteriaNames.push(document.getElementById(`crit-name-${i}`).value.trim());
    for (let j = 0; j < n; j++) {
      row.push(document.getElementById(`cell-${i}-${j}`).value);
    }
    criteriaMatrix.push(row);
  }

  fetch('/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ matrix: criteriaMatrix, names: criteriaNames })
  })
    .then(res => res.json())
    .then(data => {
      lastCriteriaWeights = data.details;
      isCRValid = data.cr <= 0.1;

      criteriaResults = {
        weights: data.details,
        lambda_max: data.lambda_max,
        ci: data.ci,
        cr: data.cr
      };

      const crWarning = document.getElementById("cr-warning");
      crWarning.style.color = data.cr > 0.1 ? "red" : "green";
      crWarning.innerHTML = data.cr > 0.1
        ? `⚠️ CR = ${(data.cr * 100).toFixed(2)}% > 10%. Ma trận chưa nhất quán. Vui lòng điều chỉnh lại.`
        : `✅ CR = ${(data.cr * 100).toFixed(2)}%. Ma trận đạt mức nhất quán.`;

      const matrixContainer = document.getElementById("matrixContainer");
      const oldResult = document.getElementById("ahp-results");
      if (oldResult) oldResult.remove();

      const resultHTML = `
        <div id="ahp-results" style="margin-top: 30px;">
          <h2>Kết quả AHP</h2>
          <table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; margin-top: 10px;'>
            <thead><tr><th>Tiêu chí</th><th>Trọng số tiêu chí</th><th>Tổng giá trị trọng số</th><th>Vector nhất quán</th><th>Xếp hạng</th></tr></thead>
            <tbody>
              ${data.details.map(d => `<tr><td>${d.name}</td><td>${d.weight}</td><td>${d.weightSum}</td><td>${d.consistencyVector}</td><td>${d.rank}</td></tr>`).join('')}
            </tbody>
          </table>
          <p style="margin-top: 10px;"><strong>λ<sub>max</sub>:</strong> ${data.lambda_max}</p>
          <p><strong>CI:</strong> ${data.ci}</p>
          <p><strong>CR:</strong> ${data.cr}</p>
          <p style="margin-top: 5px; font-weight: bold; color: ${data.cr > 0.1 ? 'red' : 'green'};">
            ${data.cr > 0.1 
              ? `⚠️ CR = ${(data.cr * 100).toFixed(2)}% > 10%. Ma trận chưa nhất quán! Vui lòng điều chỉnh lại.`
              : `✅ CR = ${(data.cr * 100).toFixed(2)}%. Ma trận đạt mức nhất quán.`}
          </p>
          <canvas id="weightChart" height="200" style="margin-top: 20px;"></canvas>
        </div>
      `;

      matrixContainer.insertAdjacentHTML('beforeend', resultHTML);
      const ctx = document.getElementById('weightChart').getContext('2d');
      // Bạn có thể thêm mã Chart.js tại đây nếu cần vẽ biểu đồ
          
    console.log("📦 Tổng kết AHP:");
    console.log("🔹 Tên tiêu chí:", criteriaNames);
    console.log("🔹 Ma trận tiêu chí:", criteriaMatrix);
    console.log("🔹 Trọng số tiêu chí:", lastCriteriaWeights);
    console.log("🔹 Kết quả chi tiết:", criteriaResults);
    })
    .catch(error => {
      console.error("Lỗi khi gửi dữ liệu AHP:", error);
      alert("Lỗi tính toán. Vui lòng kiểm tra dữ liệu đầu vào.");
    });
}
document.getElementById("excelUpload").addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length < 2 || rows[0].length !== rows.length - 1) {
      alert("❌ File Excel không hợp lệ. Hàng đầu là tên tiêu chí, các hàng sau là ma trận vuông.");
      return;
    }

    const names = rows[0].map(n => String(n).trim());
    const matrix = rows.slice(1);

    // 1. Gán số lượng tiêu chí
    document.getElementById("numCriteria").value = names.length;

    // 2. Tạo lại giao diện bảng
    generateMatrix();

    // 3. Đợi DOM cập nhật xong, điền tên tiêu chí
    setTimeout(() => {
      for (let i = 0; i < names.length; i++) {
        document.getElementById(`crit-name-${i}`).value = names[i];
      }

      // 4. Xác nhận và sinh bảng ma trận
      confirmNames(names.length);

      // 5. Đợi sinh bảng xong rồi mới điền ma trận
      setTimeout(() => {
        for (let i = 0; i < matrix.length; i++) {
          for (let j = 0; j < matrix.length; j++) {
            if (i === j) continue;
            const val = matrix[i][j];
            const cell = document.getElementById(`cell-${i}-${j}`);
            if (cell) {
              const text = typeof val === "number" ? toFraction(val) : String(val).trim();
              cell.value = text;
              if (i < j) handleInput(i, j, text);
            }
          }
        }
      }, 100);
    }, 100);
  };

  reader.readAsArrayBuffer(file);
  console.log("📥 Đã đọc Excel:", rows);

});
