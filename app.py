
from flask import Flask, render_template, request, jsonify, send_file
import numpy as np
import pandas as pd
import io
import psycopg2
from psycopg2 import pool
import uuid

app = Flask(__name__)

# Database connection pool
db_pool = pool.SimpleConnectionPool(
    1, 20,
    host="localhost",
    database="ahp_database",
    user="postgres",
    password="a"
)

def parse_fraction(val):
    try:
        if '/' in val:
            num, den = map(float, val.split('/'))
            return num / den
        return float(val)
    except:
        return 1.0

def ahp_calculate(matrix_raw, names):
    n = len(matrix_raw)
    matrix = np.array([[parse_fraction(cell) for cell in row] for row in matrix_raw])

    col_sum = matrix.sum(axis=0)
    norm_matrix = matrix / col_sum
    weights = norm_matrix.mean(axis=1)

    weighted_sum = matrix @ weights
    consistency_vector = weighted_sum / weights
    lambda_max = consistency_vector.mean()

    ci = (lambda_max - n) / (n - 1)

    ri_table = {
        1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12, 6: 1.24,
        7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
        11: 1.51, 12: 1.48, 13: 1.56, 14: 1.57, 15: 1.59
    }
    ri = ri_table.get(n, 1.59)
    cr = ci / ri if ri else 0

    ranked_idx = np.argsort(weights)[::-1]
    ranks = np.empty_like(ranked_idx)
    ranks[ranked_idx] = np.arange(1, n + 1)

    details = []
    for i in range(n):
        details.append({
            'name': names[i],
            'weight': round(weights[i], 6),
            'weightSum': round(weighted_sum[i], 6),
            'consistencyVector': round(consistency_vector[i], 6),
            'rank': int(ranks[i])
        })

    return {
        'details': details,
        'lambda_max': round(lambda_max, 6),
        'ci': round(ci, 6),
        'cr': round(cr, 6)
    }

@app.route("/")
def index():
    return render_template("index.html")

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    matrix_raw = data['matrix']
    names = data['names']
    result = ahp_calculate(matrix_raw, names)
    return jsonify(result)

@app.route('/calculate-alternatives', methods=['POST'])
def calculate_alternatives():
    data = request.get_json()
    all_results = []
    for entry in data:  
        matrix_raw = entry['matrix']
        names = entry['names']
        criterion = entry['criterion']
        result = ahp_calculate(matrix_raw, names)
        result['criterion'] = criterion
        all_results.append(result)
    return jsonify(all_results)

@app.route("/export-excel", methods=["POST"])
def export_excel():
    data = request.json
    rows = []

    # === 1. MA TRẬN TIÊU CHÍ ===
    rows.append(["📌 BÁO CÁO AHP – TỔNG HỢP TOÀN BỘ"])
    rows.append([])
    rows.append(["🔸 Ma trận tiêu chí"])
    crit_names = data.get("criteriaNames", [])
    crit_matrix = data.get("criteriaMatrix", [])
    rows.append([""] + crit_names)
    for i in range(len(crit_matrix)):
        rows.append([crit_names[i]] + crit_matrix[i])
    rows.append([])

    # === 2. TRỌNG SỐ TIÊU CHÍ CHI TIẾT ===
    rows.append(["🔸 Trọng số tiêu chí & chỉ số nhất quán"])
    rows.append(["Tiêu chí", "Trọng số", "Tổng", "Vector nhất quán", "Xếp hạng"])
    for item in data.get("criteriaWeights", []):
        rows.append([
            item.get("name"),
            item.get("weight"),
            item.get("weightSum"),
            item.get("consistencyVector"),
            item.get("rank")
        ])
    rows.append([])

    # === 3. Chỉ số CR tổng ===
    results = data.get("criteriaResults", {})
    rows.append(["🔸 Chỉ số nhất quán (CR, CI, λ_max)"])
    rows.append(["λ_max", results.get("lambda_max"), "CI", results.get("ci"), "CR", results.get("cr")])
    rows.append([])

    # === 4. TRỌNG SỐ PHƯƠNG ÁN THEO TIÊU CHÍ ===
    rows.append(["🔸 Trọng số phương án theo từng tiêu chí"])
    alt_weights = data.get("altWeightsPerCriterion", [])
    if alt_weights:
        headers = ["Phương án"] + [k for k in alt_weights[0] if k != "name"]
        rows.append(headers)
        for item in alt_weights:
            row = [item["name"]] + [item.get(k, "") for k in headers[1:]]
            rows.append(row)
    rows.append([])

    # === 5. KẾT QUẢ ĐÁNH GIÁ THEO TỪNG TIÊU CHÍ ===
    rows.append(["🔸 Kết quả chi tiết AHP từng tiêu chí"])
    detailed = data.get("detailedAlternativeResults", {})
    for crit, result in detailed.items():
        rows.append([f"🔹 Tiêu chí: {crit}"])
        rows.append(["Phương án", "Trọng số", "Tổng", "Vector nhất quán", "Xếp hạng"])
        for row in result.get("rows", []):
            rows.append([
                row.get("name"),
                row.get("weight"),
                row.get("weightSum"),
                row.get("consistencyVector"),
                row.get("rank")
            ])
        rows.append([
            "λ_max", result.get("lambda_max"), "CI", result.get("ci"), "CR", result.get("cr")
        ])
        rows.append([])

    # === 6. TỔNG ĐIỂM & XẾP HẠNG ===
    rows.append(["🔸 Tổng điểm & xếp hạng phương án"])
    rows.append(["Phương án", "Điểm tổng", "Xếp hạng"])
    for item in data.get("finalScores", []):
        rows.append([item["name"], item["score"], item["rank"]])
    rows.append([])

    # === 7. Xuất ra file Excel ===
    df = pd.DataFrame(rows)
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="xlsxwriter") as writer:
        df.to_excel(writer, sheet_name="AHP_Report", index=False, header=False)
    output.seek(0)

    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name="AHP_Full_Report.xlsx"
    )

@app.route("/save-to-database", methods=["POST"])
def save_to_database():
    data = request.json
    conn = None
    try:
        conn = db_pool.getconn()
        cur = conn.cursor()

        # Insert new project
        cur.execute("INSERT INTO Projects (project_name) VALUES (%s) RETURNING project_id", ('AHP Analysis',))
        project_id = cur.fetchone()[0]

        # Insert criteria and get criterion IDs
        criterion_ids = {}
        for item in data.get("criteriaWeights", []):
            cur.execute(
                "INSERT INTO Criteria (project_id, name, weight, weight_sum, consistency_vector, rank) VALUES (%s, %s, %s, %s, %s, %s) RETURNING criterion_id",
                (project_id, item["name"], item["weight"], item["weightSum"], item["consistencyVector"], item["rank"])
            )
            criterion_ids[item["name"]] = cur.fetchone()[0]

        # Insert criteria matrix
        crit_matrix = data.get("criteriaMatrix", [])
        for i, row in enumerate(crit_matrix):
            for j, value in enumerate(row):
                cur.execute(
                    "INSERT INTO CriteriaMatrix (project_id, row_criterion_id, col_criterion_id, value) VALUES (%s, %s, %s, %s)",
                    (project_id, criterion_ids[data["criteriaNames"][i]], criterion_ids[data["criteriaNames"][j]], parse_fraction(value))
                )

        # Insert consistency metrics for criteria
        results = data.get("criteriaResults", {})
        cur.execute(
            "INSERT INTO ConsistencyMetrics (project_id, lambda_max, ci, cr) VALUES (%s, %s, %s, %s)",
            (project_id, results["lambda_max"], results["ci"], results["cr"])
        )

        # Insert alternatives and get alternative IDs
        alternative_ids = {}
        for alt in data.get("alternativeNames", []):
            cur.execute(
                "INSERT INTO Alternatives (project_id, name) VALUES (%s, %s) RETURNING alternative_id",
                (project_id, alt)
            )
            alternative_ids[alt] = cur.fetchone()[0]

        # Insert alternative matrices and weights
        alt_matrices = data.get("alternativeMatrices", {})
        detailed_results = data.get("detailedAlternativeResults", {})
        for crit, matrix in alt_matrices.items():
            criterion_id = criterion_ids.get(crit)
            if not criterion_id:
                continue
            # Insert alternative matrix
            for i, row in enumerate(matrix):
                for j, value in enumerate(row):
                    cur.execute(
                        "INSERT INTO AlternativeMatrices (project_id, criterion_id, row_alternative_id, col_alternative_id, value) VALUES (%s, %s, %s, %s, %s)",
                        (project_id, criterion_id, alternative_ids[data["alternativeNames"][i]], alternative_ids[data["alternativeNames"][j]], parse_fraction(value))
                    )
            # Insert alternative weights and detailed results
            crit_results = detailed_results.get(crit, {})
            for row in crit_results.get("rows", []):
                cur.execute(
                    """
                    INSERT INTO DetailedAlternativeResults (project_id, criterion_id, alternative_id, weight, weight_sum, consistency_vector, rank, lambda_max, ci, cr)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        project_id, criterion_id, alternative_ids[row["name"]],
                        row["weight"], row["weightSum"], row["consistencyVector"], row["rank"],
                        crit_results["lambda_max"], crit_results["ci"], crit_results["cr"]
                    )
                )
            # Insert alternative weights (for tableAlternativeWeights)
            for item in data.get("altWeightsPerCriterion", []):
                if crit in item:
                    cur.execute(
                        "INSERT INTO AlternativeWeights (project_id, criterion_id, alternative_id, weight) VALUES (%s, %s, %s, %s)",
                        (project_id, criterion_id, alternative_ids[item["name"]], item[crit])
                    )

        # Insert final scores
        for item in data.get("finalScores", []):
            cur.execute(
                "INSERT INTO FinalScores (project_id, alternative_id, score, rank) VALUES (%s, %s, %s, %s)",
                (project_id, alternative_ids[item["name"]], item["score"], item["rank"])
            )

        conn.commit()
        return jsonify({"status": "success", "message": "Data saved to database successfully"})
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if conn:
            cur.close()
            db_pool.putconn(conn)


if __name__ == "__main__":
    app.run(debug=True)