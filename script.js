const quizJsonEl = document.getElementById("quizJson");
const loadSampleBtn = document.getElementById("loadSampleBtn");
const startQuizBtn = document.getElementById("startQuizBtn");
const inputErrorEl = document.getElementById("inputError");
const inputStatusEl = document.getElementById("inputStatus");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const quizFileEl = document.getElementById("quizFile");
const pickFileBtn = document.getElementById("pickFileBtn");
const dropZoneEl = document.getElementById("dropZone");
const shuffleToggleEl = document.getElementById("shuffleToggle");

const inputSection = document.getElementById("inputSection");
const quizSection = document.getElementById("quizSection");
const resultSection = document.getElementById("resultSection");

const quizTitleEl = document.getElementById("quizTitle");
const progressEl = document.getElementById("progress");
const progressTrackEl = document.getElementById("progressTrack");
const progressBarEl = document.getElementById("progressBar");
const progressPercentEl = document.getElementById("progressPercent");
const questionCardEl = document.getElementById("questionCard");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const finishBtn = document.getElementById("finishBtn");
const restartBtn = document.getElementById("restartBtn");
const backToStartFromResultsBtn = document.getElementById("backToStartFromResultsBtn");

const exitModalEl = document.getElementById("exitModal");
const cancelExitBtn = document.getElementById("cancelExitBtn");
const confirmExitBtn = document.getElementById("confirmExitBtn");

const scoreLineEl = document.getElementById("scoreLine");
const reviewListEl = document.getElementById("reviewList");

const THEME_STORAGE_KEY = "quiz-studio-theme";

const sampleQuiz = {
  title: "Capitale e geografia",
  questions: [
    {
      id: "q1",
      text: "Qual e la capitale d'Italia?",
      options: ["Milano", "Roma", "Napoli", "Torino"],
      correctIndex: 1
    },
    {
      id: "q2",
      text: "In quale continente si trova il Brasile?",
      options: ["Africa", "Europa", "Sud America", "Asia"],
      correctIndex: 2
    }
  ]
};

let quizData = null;
let currentIndex = 0;
let answers = [];

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(nextTheme);
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
});

loadSampleBtn.addEventListener("click", () => {
  quizJsonEl.value = JSON.stringify(sampleQuiz, null, 2);
  inputErrorEl.textContent = "";
  inputStatusEl.textContent = "Esempio caricato con successo.";
});

pickFileBtn.addEventListener("click", () => {
  quizFileEl.click();
});

quizFileEl.addEventListener("change", () => {
  const selectedFile = quizFileEl.files && quizFileEl.files[0];
  if (selectedFile) {
    importQuizFromFile(selectedFile);
  }
});

dropZoneEl.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropZoneEl.classList.add("drag-over");
});

dropZoneEl.addEventListener("dragleave", () => {
  dropZoneEl.classList.remove("drag-over");
});

dropZoneEl.addEventListener("drop", (event) => {
  event.preventDefault();
  dropZoneEl.classList.remove("drag-over");
  const droppedFile = event.dataTransfer && event.dataTransfer.files ? event.dataTransfer.files[0] : null;
  if (droppedFile) {
    importQuizFromFile(droppedFile);
  }
});

dropZoneEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    quizFileEl.click();
  }
});

startQuizBtn.addEventListener("click", () => {
  inputErrorEl.textContent = "";
  inputStatusEl.textContent = "";
  const parsed = parseAndValidateQuiz(quizJsonEl.value);
  if (!parsed.ok) {
    inputErrorEl.textContent = parsed.error;
    return;
  }

  quizData = buildPlayableQuiz(parsed.value, shuffleToggleEl.checked);
  currentIndex = 0;
  answers = new Array(quizData.questions.length).fill(null);

  quizTitleEl.textContent = quizData.title;
  inputSection.classList.add("hidden");
  resultSection.classList.add("hidden");
  quizSection.classList.remove("hidden");
  renderQuestion();
});

prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex -= 1;
    renderQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentIndex < quizData.questions.length - 1) {
    currentIndex += 1;
    renderQuestion();
  }
});

finishBtn.addEventListener("click", () => {
  showResults();
});

restartBtn.addEventListener("click", () => {
  openExitModal();
});

backToStartFromResultsBtn.addEventListener("click", () => {
  resetToStart();
});

cancelExitBtn.addEventListener("click", () => {
  closeExitModal();
});

confirmExitBtn.addEventListener("click", () => {
  closeExitModal();
  resetToStart();
});

exitModalEl.addEventListener("click", (event) => {
  if (event.target === exitModalEl) {
    closeExitModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !exitModalEl.classList.contains("hidden")) {
    closeExitModal();
  }
});

function parseAndValidateQuiz(raw) {
  if (!raw.trim()) {
    return { ok: false, error: "Incolla un JSON prima di creare il quiz." };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "JSON non valido. Controlla parentesi e virgole." };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Il root JSON deve essere un oggetto." };
  }

  if (typeof parsed.title !== "string" || !parsed.title.trim()) {
    return { ok: false, error: "Manca un titolo valido in 'title'." };
  }

  if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    return { ok: false, error: "Serve almeno una domanda in 'questions'." };
  }

  for (let i = 0; i < parsed.questions.length; i += 1) {
    const q = parsed.questions[i];
    if (typeof q !== "object" || q === null) {
      return { ok: false, error: `La domanda ${i + 1} non e un oggetto valido.` };
    }

    if (typeof q.text !== "string" || !q.text.trim()) {
      return { ok: false, error: `La domanda ${i + 1} ha 'text' mancante o vuoto.` };
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      return { ok: false, error: `La domanda ${i + 1} deve avere almeno 2 opzioni.` };
    }

    if (!q.options.every((opt) => typeof opt === "string" && opt.trim())) {
      return { ok: false, error: `La domanda ${i + 1} contiene opzioni non valide.` };
    }

    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length) {
      return { ok: false, error: `La domanda ${i + 1} ha 'correctIndex' fuori range.` };
    }
  }

  return { ok: true, value: parsed };
}

function renderQuestion() {
  const question = quizData.questions[currentIndex];
  const currentQuestion = currentIndex + 1;
  const totalQuestions = quizData.questions.length;

  progressEl.textContent = `Domanda ${currentQuestion} di ${totalQuestions}`;
  updateProgressByAnswers();

  const optionsMarkup = question.options
    .map((option, idx) => {
      const isSelected = answers[currentIndex] === idx;
      return `
        <label class="option ${isSelected ? "selected" : ""}" data-option-index="${idx}">
          <input class="option-input" type="radio" name="question-${currentIndex}" value="${idx}" ${isSelected ? "checked" : ""} />
          <span>${escapeHtml(option)}</span>
        </label>
      `;
    })
    .join("");

  questionCardEl.innerHTML = `
    <h3>${escapeHtml(question.text)}</h3>
    <div class="option-list">${optionsMarkup}</div>
  `;

  questionCardEl.querySelectorAll(".option").forEach((optionLabel) => {
    optionLabel.addEventListener("click", () => {
      const selectedIndex = Number(optionLabel.dataset.optionIndex);
      answers[currentIndex] = selectedIndex;
      updateProgressByAnswers();
      renderQuestion();
    });
  });

  prevBtn.disabled = currentIndex === 0;
  nextBtn.classList.toggle("hidden", currentIndex === quizData.questions.length - 1);
  finishBtn.classList.toggle("hidden", currentIndex !== quizData.questions.length - 1);
}

function showResults() {
  let score = 0;
  const reviewHtml = quizData.questions
    .map((question, idx) => {
      const userAnswer = answers[idx];
      const isCorrect = userAnswer === question.correctIndex;
      if (isCorrect) score += 1;

      const userAnswerText = userAnswer === null ? "Nessuna risposta" : question.options[userAnswer];
      const correctText = question.options[question.correctIndex];

      return `
        <div class="review-item ${isCorrect ? "ok" : "ko"}">
          <p><strong>${idx + 1}. ${escapeHtml(question.text)}</strong></p>
          <p>Tua risposta: ${escapeHtml(userAnswerText)}</p>
          <p>Risposta corretta: <strong>${escapeHtml(correctText)}</strong></p>
        </div>
      `;
    })
    .join("");

  scoreLineEl.textContent = `Hai risposto correttamente a ${score} su ${quizData.questions.length} domande.`;
  reviewListEl.innerHTML = reviewHtml;

  quizSection.classList.add("hidden");
  resultSection.classList.remove("hidden");
}

function openExitModal() {
  if (!quizData || quizSection.classList.contains("hidden")) {
    return;
  }

  exitModalEl.classList.remove("hidden");
}

function closeExitModal() {
  exitModalEl.classList.add("hidden");
}

function resetToStart() {
  quizData = null;
  answers = [];
  currentIndex = 0;
  closeExitModal();
  quizSection.classList.add("hidden");
  resultSection.classList.add("hidden");
  inputSection.classList.remove("hidden");
}

function importQuizFromFile(selectedFile) {
  inputErrorEl.textContent = "";
  inputStatusEl.textContent = "";

  if (!selectedFile) {
    inputErrorEl.textContent = "Seleziona prima un file JSON da importare.";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const content = typeof reader.result === "string" ? reader.result : "";
    quizJsonEl.value = content;
    inputStatusEl.textContent = `File ${selectedFile.name} caricato nella textarea.`;
  };
  reader.onerror = () => {
    inputErrorEl.textContent = "Impossibile leggere il file selezionato.";
  };

  reader.readAsText(selectedFile);
}

function updateProgressByAnswers() {
  if (!quizData || !quizData.questions.length) {
    progressTrackEl.setAttribute("aria-valuenow", "0");
    progressBarEl.style.width = "0%";
    progressPercentEl.textContent = "0% completato";
    return;
  }

  const totalQuestions = quizData.questions.length;
  const answeredCount = answers.filter((answer) => answer !== null).length;
  const percent = Math.round((answeredCount / totalQuestions) * 100);

  progressTrackEl.setAttribute("aria-valuenow", String(percent));
  progressBarEl.style.width = `${percent}%`;
  progressPercentEl.textContent = `${percent}% completato`;
}

function buildPlayableQuiz(baseQuiz, shouldShuffle) {
  let questions = baseQuiz.questions.map((question, index) => ({
    id: typeof question.id === "string" && question.id.trim() ? question.id : `q${index + 1}`,
    text: question.text,
    options: [...question.options],
    correctIndex: question.correctIndex
  }));

  if (!shouldShuffle) {
    return {
      title: baseQuiz.title,
      questions
    };
  }

  questions = shuffleArray(questions).map((question) => shuffleOptionsKeepAnswer(question));

  return {
    title: baseQuiz.title,
    questions
  };
}

function shuffleOptionsKeepAnswer(question) {
  const optionsWithMeta = question.options.map((option, index) => ({
    option,
    isCorrect: index === question.correctIndex
  }));

  const shuffledOptions = shuffleArray(optionsWithMeta);
  const newCorrectIndex = shuffledOptions.findIndex((item) => item.isCorrect);

  return {
    ...question,
    options: shuffledOptions.map((item) => item.option),
    correctIndex: newCorrectIndex
  };
}

function shuffleArray(values) {
  const cloned = [...values];

  for (let i = cloned.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cloned[i], cloned[j]] = [cloned[j], cloned[i]];
  }

  return cloned;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggleBtn.textContent = theme === "dark" ? "Tema chiaro" : "Tema scuro";
}

function getInitialTheme() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

quizJsonEl.value = JSON.stringify(sampleQuiz, null, 2);
progressPercentEl.textContent = "0% completato";
applyTheme(getInitialTheme());
