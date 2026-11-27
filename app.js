const rubricData = [
  {
    id: "dominio",
    name: "Dominio Conceptual y Técnico",
    weight: 0.35,
    levels: [
      { score: 5, label: "En Inicio", desc: "Lee diapositivas sin explicar los conceptos base.", feedback: "Reforzar la comprensión teórica de los conceptos centrales antes de exponer." },
      { score: 11, label: "En Proceso", desc: "Explica parcialmente el tema pero duda ante preguntas.", feedback: "Profundizar en el porqué técnico de cada componente del proyecto." },
      { score: 16, label: "Logrado", desc: "Sustenta con claridad y responde preguntas clave.", feedback: "Buen manejo conceptual; puedes enriquecerlo con ejemplos aplicados." },
      { score: 20, label: "Destacado", desc: "Domina el tema con profundidad, ejemplos y solvencia.", feedback: "Excelente dominio técnico y claridad argumentativa." }
    ]
  },
  {
    id: "prototipo",
    name: "Funcionalidad del Prototipo / Maqueta",
    weight: 0.40,
    levels: [
      { score: 5, label: "En Inicio", desc: "El prototipo no funciona o está incompleto.", feedback: "Priorizar un flujo mínimo funcional antes de agregar detalles visuales." },
      { score: 11, label: "En Proceso", desc: "Funciona con fallos frecuentes durante la demo.", feedback: "Realizar pruebas de validación previas para corregir errores críticos." },
      { score: 16, label: "Logrado", desc: "Cumple las funciones principales sin interrupciones.", feedback: "Prototipo sólido y funcional; optimizar tiempos de respuesta." },
      { score: 20, label: "Destacado", desc: "Funciona con fluidez, es intuitivo y resuelve el problema real.", feedback: "Implementación sobresaliente, estable y bien estructurada." }
    ]
  },
  {
    id: "comunicacion",
    name: "Claridad Expositiva y Gestión del Tiempo",
    weight: 0.25,
    levels: [
      { score: 5, label: "En Inicio", desc: "Exposición desordenada y fuera del tiempo asignado.", feedback: "Estructurar la presentación en problema, solución y demostración." },
      { score: 11, label: "En Proceso", desc: "Falta fluidez o se extiende demasiado en la introducción.", feedback: "Sintetizar la introducción para dar más protagonismo a la demo." },
      { score: 16, label: "Logrado", desc: "Secuencia lógica clara y buen uso del tiempo.", feedback: "Buena estructura comunicativa y ritmo adecuado." },
      { score: 20, label: "Destacado", desc: "Comunicación persuasiva, precisa y ajustada al tiempo.", feedback: "Excelente capacidad de síntesis y conexión con la audiencia." }
    ]
  }
];

let currentSelections = {};
let evaluationsHistory = JSON.parse(localStorage.getItem("rubric_evaluations")) || [];
let radarChart = null;

document.addEventListener("DOMContentLoaded", () => {
  renderRubric();
  updateWeightBadge();
  initChart();
  renderHistory();
  updateDashboard();
});

function updateWeightBadge() {
  const sumPercent = rubricData.reduce((acc, c) => acc + Math.round(c.weight * 100), 0);
  const badge = document.getElementById("totalWeightBadge");
  badge.textContent = `Peso total: ${sumPercent}%`;
  badge.style.background = sumPercent === 100 ? "#dcfce7" : "#fef3c7";
  badge.style.color = sumPercent === 100 ? "#166534" : "#92400e";
}

function renderRubric() {
  const container = document.getElementById("rubricContainer");
  container.innerHTML = "";

  rubricData.forEach((criterion) => {
    const card = document.createElement("div");
    card.className = "criterion-card";

    const levelsHTML = criterion.levels.map((lvl, idx) => `
      <button type="button" class="level-btn" data-criterion="${criterion.id}" data-index="${idx}">
        <div class="level-title">
          <span>${lvl.label}</span>
          <span>${lvl.score} pts</span>
        </div>
        <div class="level-desc">${lvl.desc}</div>
      </button>
    `).join("");

    card.innerHTML = `
      <div class="criterion-header">
        <h3>${criterion.name}</h3>
        <span class="weight-tag">Peso: ${Math.round(criterion.weight * 100)}%</span>
      </div>
      <div class="levels-row">${levelsHTML}</div>
    `;

    container.appendChild(card);
  });

  document.querySelectorAll(".level-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const critId = btn.dataset.criterion;
      const idx = parseInt(btn.dataset.index, 10);

      document.querySelectorAll(`.level-btn[data-criterion="${critId}"]`)
        .forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");

      currentSelections[critId] = idx;
      updateDashboard();
    });
  });
}

function calculateWeightedScore() {
  const totalWeight = rubricData.reduce((acc, c) => acc + c.weight, 0) || 1;
  let weightedSum = 0;

  rubricData.forEach((crit) => {
    const idx = currentSelections[crit.id];
    if (idx !== undefined) {
      weightedSum += crit.levels[idx].score * (crit.weight / totalWeight);
    }
  });

  return weightedSum;
}

function updateDashboard() {
  const chartValues = [];
  const feedbackLines = [];
  let evaluatedCount = 0;

  const student = document.getElementById("studentName").value.trim() || "Estudiante / Equipo";
  const extraNote = document.getElementById("extraFeedback").value.trim();

  rubricData.forEach((crit) => {
    const selectedIdx = currentSelections[crit.id];
    if (selectedIdx !== undefined) {
      const level = crit.levels[selectedIdx];
      evaluatedCount++;
      chartValues.push(level.score);
      feedbackLines.push(`• ${crit.name} [${level.label} - ${level.score}/20]: ${level.feedback}`);
    } else {
      chartValues.push(0);
    }
  });

  const finalScore = calculateWeightedScore();
  const finalScoreEl = document.getElementById("finalScore");
  const statusEl = document.getElementById("scoreStatus");

  if (evaluatedCount === 0) {
    finalScoreEl.textContent = "0.0";
    statusEl.textContent = "Sin evaluar";
  } else {
    finalScoreEl.textContent = finalScore.toFixed(1);
    statusEl.textContent = finalScore >= 11 ? "Aprobado" : "Requiere mejora";
  }

  if (radarChart) {
    radarChart.data.labels = rubricData.map((c) => `${c.name.slice(0, 14)} (${Math.round(c.weight * 100)}%)`);
    radarChart.data.datasets[0].data = chartValues;
    radarChart.update();
  }

  if (evaluatedCount > 0) {
    let report = `INFORME DE RETROALIMENTACIÓN FORMATIVA\n`;
    report += `Evaluado: ${student}\n`;
    report += `Calificación Final: ${finalScore.toFixed(1)} / 20\n\n`;
    report += `Desglose por criterios:\n${feedbackLines.join("\n")}`;
    if (extraNote) report += `\n\nObservación del docente:\n${extraNote}`;
    document.getElementById("feedbackPreview").textContent = report;
  }
}

function initChart() {
  const ctx = document.getElementById("skillsChart").getContext("2d");
  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: rubricData.map((c) => `${c.name.slice(0, 14)} (${Math.round(c.weight * 100)}%)`),
      datasets: [{
        label: "Puntaje obtenido (0-20)",
        data: rubricData.map(() => 0),
        backgroundColor: "rgba(30, 64, 175, 0.2)",
        borderColor: "#1e40af",
        pointBackgroundColor: "#1e40af",
        borderWidth: 2
      }]
    },
    options: {
      scales: {
        r: { min: 0, max: 20, ticks: { stepSize: 5 } }
      }
    }
  });
}

document.getElementById("criterionForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("critName").value.trim();
  const weightPct = parseInt(document.getElementById("critWeight").value, 10);
  const focus = document.getElementById("critFocus").value.trim() || name.toLowerCase();

  if (!name || isNaN(weightPct) || weightPct <= 0) return;

  rubricData.push({
    id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${Date.now()}`,
    name,
    weight: weightPct / 100,
    levels: [
      { score: 5, label: "En Inicio", desc: `Cumplimiento incipiente en ${focus}.`, feedback: `Reforzar ${focus} con ejemplos claros.` },
      { score: 11, label: "En Proceso", desc: `Cumplimiento parcial en ${focus}.`, feedback: `Consolidar ${focus} para lograr mayor consistencia.` },
      { score: 16, label: "Logrado", desc: `Buen desempeño en ${focus}.`, feedback: `Buen nivel en ${focus}; mantener el estándar.` },
      { score: 20, label: "Destacado", desc: `Dominio sobresaliente en ${focus}.`, feedback: `Excelente desempeño en ${focus}.` }
    ]
  });

  currentSelections = {};
  renderRubric();
  updateWeightBadge();
  updateDashboard();
  e.target.reset();
  document.getElementById("critWeight").value = 20;
});

document.getElementById("btnDemoData").addEventListener("click", () => {
  document.getElementById("studentName").value = "Equipo Innovación - Prototipo IoT";
  document.getElementById("studentEmail").value = "equipo.innovacion@unibagua.edu.pe";
  document.getElementById("extraFeedback").value = "Excelente funcionamiento en tiempo real; detallar mejor el consumo energético.";

  rubricData.forEach((crit, idx) => {
    const levelIndex = idx === 1 ? 3 : 2;
    currentSelections[crit.id] = levelIndex;
    const buttons = document.querySelectorAll(`.level-btn[data-criterion="${crit.id}"]`);
    buttons.forEach((b) => b.classList.remove("selected"));
    if (buttons[levelIndex]) buttons[levelIndex].classList.add("selected");
  });

  updateDashboard();
});

document.getElementById("btnSaveEval").addEventListener("click", () => {
  const student = document.getElementById("studentName").value.trim();
  if (!student) {
    alert("Ingresa el nombre del estudiante o equipo antes de guardar.");
    return;
  }
  if (Object.keys(currentSelections).length < rubricData.length) {
    alert("Selecciona un nivel de logro en todos los criterios.");
    return;
  }

  const total = calculateWeightedScore();
  let bestCrit = { name: "", score: -1 };
  let weakestCrit = { name: "", score: 21 };

  rubricData.forEach((crit) => {
    const lvl = crit.levels[currentSelections[crit.id]];
    if (lvl.score > bestCrit.score) bestCrit = { name: crit.name, score: lvl.score };
    if (lvl.score < weakestCrit.score) weakestCrit = { name: crit.name, score: lvl.score };
  });

  evaluationsHistory.push({
    student,
    email: document.getElementById("studentEmail").value.trim(),
    score: total.toFixed(1),
    status: total >= 11 ? "Aprobado" : "En proceso",
    strength: `${bestCrit.name} (${bestCrit.score})`,
    improvement: `${weakestCrit.name} (${weakestCrit.score})`
  });

  localStorage.setItem("rubric_evaluations", JSON.stringify(evaluationsHistory));
  renderHistory();

  document.getElementById("studentName").value = "";
  document.getElementById("studentEmail").value = "";
  document.getElementById("extraFeedback").value = "";
  currentSelections = {};
  document.querySelectorAll(".level-btn").forEach((b) => b.classList.remove("selected"));
  updateDashboard();
});

document.getElementById("btnSendFeedback").addEventListener("click", () => {
  const email = document.getElementById("studentEmail").value.trim();
  const body = document.getElementById("feedbackPreview").textContent;
  if (email) {
    window.location.href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Retroalimentación de Evaluación")}&body=${encodeURIComponent(body)}`;
  } else {
    navigator.clipboard.writeText(body);
    alert("Retroalimentación copiada al portapapeles lista para enviar.");
  }
});

function renderHistory() {
  const tbody = document.getElementById("historyBody");
  document.getElementById("evalCount").textContent = evaluationsHistory.length;
  tbody.innerHTML = evaluationsHistory.map((item) => `
    <tr>
      <td><strong>${item.student}</strong></td>
      <td>${item.score}</td>
      <td>${item.status}</td>
      <td>${item.strength}</td>
      <td>${item.improvement}</td>
    </tr>
  `).join("");
}

document.getElementById("btnExportCSV").addEventListener("click", () => {
  if (evaluationsHistory.length === 0) {
    alert("Aún no hay evaluaciones guardadas para exportar.");
    return;
  }

 const sep = ";"; // Punto y coma para que Excel en español separe columnas limpiamente
  const headers = ["Estudiante/Equipo", "Correo", "Nota Final (0-20)", "Estado", "Fortaleza Principal", "Aspecto a Mejorar"];
  const rows = evaluationsHistory.map((e) => [
    `"${e.student}"`,
    `"${e.email}"`,
    `"${e.score.replace(".", ",")}"`, // Coma decimal para Excel en español
    `"${e.status}"`,
    `"${e.strength}"`,
    `"${e.improvement}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(sep), ...rows.map((r) => r.join(sep))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "acta_evaluacion_rubrica.csv";
  link.click();
  URL.revokeObjectURL(url);
});

document.getElementById("btnClearHistory").addEventListener("click", () => {
  if (evaluationsHistory.length === 0) return;
  if (confirm("¿Deseas borrar todas las evaluaciones guardadas en el acta?")) {
    evaluationsHistory = [];
    localStorage.removeItem("rubric_evaluations");
    renderHistory();
  }
});