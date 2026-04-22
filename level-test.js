const levelQuizForms = document.querySelectorAll("[data-level-quiz]");
const levelTabTriggers = document.querySelectorAll("[data-level-tab-trigger]");
const levelTabPanels = document.querySelectorAll("[data-level-tab-panel]");
const levelQuizPanel = document.querySelector("#level-quiz-panel");
const levelQuizCurrentSubject = document.querySelector("#level-quiz-current-subject");
const levelQuizProgressCount = document.querySelector("#level-quiz-progress-count");
const levelQuizProgressFill = document.querySelector("#level-quiz-progress-fill");
const levelQuizProgressHint = document.querySelector("#level-quiz-progress-hint");

const getSubjectFromHash = () => {
  const subjectByHash = {
    "#test-math": "math",
    "#test-science": "science",
    "#test-english": "english",
    "#test-physics": "physics",
    "#test-chemistry": "chemistry",
    "#test-biology": "biology",
  };

  return subjectByHash[window.location.hash] || "";
};

const setActiveLevelTab = (subject) => {
  if (!subject) {
    return;
  }

  levelTabTriggers.forEach((trigger) => {
    const isActive = trigger.dataset.levelTabTrigger === subject;
    trigger.classList.toggle("is-active", isActive);
    trigger.closest(".level-test-card")?.classList.toggle("is-active", isActive);

    if (trigger.getAttribute("role") === "tab") {
      trigger.setAttribute("aria-selected", String(isActive));
      trigger.tabIndex = isActive ? 0 : -1;
    }
  });

  levelTabPanels.forEach((panel) => {
    const isActive = panel.dataset.levelTabPanel === subject;
    panel.classList.toggle("is-active", isActive);
    panel.hidden = !isActive;
  });

  updateActiveQuizProgress();
};

const updateActiveQuizProgress = () => {
  const activePanel = document.querySelector('[data-level-tab-panel].is-active');
  const activeForm = activePanel?.querySelector("[data-level-quiz]");
  const subjectLabel = activePanel?.dataset.subjectLabel || "คณิตศาสตร์";
  const questions = activeForm ? Array.from(activeForm.querySelectorAll(".level-quiz-question")) : [];
  const answered = questions.filter((question) => question.querySelector('input[type="radio"]:checked')).length;
  const total = questions.length || 0;
  const progressPercent = total ? (answered / total) * 100 : 0;

  if (levelQuizCurrentSubject) {
    levelQuizCurrentSubject.textContent = subjectLabel;
  }

  if (levelQuizProgressCount) {
    levelQuizProgressCount.textContent = `ตอบแล้ว ${answered}/${total} ข้อ`;
  }

  if (levelQuizProgressFill) {
    levelQuizProgressFill.style.width = `${progressPercent}%`;
  }

  if (levelQuizProgressHint) {
    levelQuizProgressHint.textContent =
      answered === total && total > 0
        ? "ตอบครบแล้ว กดตรวจคำตอบเพื่อดูผลได้เลย"
        : "เลือกคำตอบให้ครบก่อนตรวจผล ระบบจะสรุประดับให้ทันที";
  }
};

const getLevelQuizMessages = () => {
  const isEnglish = document.documentElement.lang === "en";

  return {
    empty: isEnglish
      ? "Please answer all questions before checking the result."
      : "กรุณาเลือกคำตอบให้ครบทุกข้อก่อนตรวจผล",
    starter: isEnglish
      ? "Starter level: a foundation-focused course would be the best place to begin."
      : "ระดับเริ่มต้น: แนะนำให้เริ่มจากคอร์สปูพื้นฐานเพื่อเก็บความเข้าใจให้แน่นก่อน",
    intermediate: isEnglish
      ? "Intermediate level: you already have some understanding and can move into a content-boosting plan."
      : "ระดับกลาง: มีพื้นฐานอยู่แล้ว สามารถต่อยอดด้วยคอร์สเพิ่มเนื้อหาหรือเก็บจุดอ่อนเฉพาะเรื่องได้",
    advanced: isEnglish
      ? "Advanced level: you are ready for intensive practice or an exam-prep style course."
      : "ระดับค่อนข้างดี: พร้อมต่อยอดด้วยคอร์สติวเข้มหรือเตรียมสอบได้เลย",
    scoreLabel: isEnglish ? "Score" : "คะแนน",
  };
};

levelTabTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    const subject = trigger.dataset.levelTabTrigger || "";
    if (!subject) {
      return;
    }

    setActiveLevelTab(subject);

    if (trigger.classList.contains("level-test-card-action")) {
      event.preventDefault();
      levelQuizPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

setActiveLevelTab(getSubjectFromHash() || "math");

levelQuizForms.forEach((form) => {
  form.addEventListener("change", () => {
    updateActiveQuizProgress();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const result = form.querySelector(".level-quiz-result");
    const answerField = form.querySelector('input[name="answers"]');
    if (!result || !answerField) {
      return;
    }

    const expectedAnswers = answerField.value.split(",");
    const questions = form.querySelectorAll(".level-quiz-question");
    const selectedAnswers = Array.from(questions).map((question) => {
      const checked = question.querySelector('input[type="radio"]:checked');
      return checked ? checked.value : "";
    });

    const messages = getLevelQuizMessages();
    if (selectedAnswers.some((value) => !value)) {
      result.textContent = messages.empty;
      result.className = "level-quiz-result is-error";
      return;
    }

    const score = selectedAnswers.reduce((total, value, index) => {
      return total + (value === expectedAnswers[index] ? 1 : 0);
    }, 0);

    let guidance = messages.starter;
    if (score === expectedAnswers.length - 1) {
      guidance = messages.intermediate;
    } else if (score === expectedAnswers.length) {
      guidance = messages.advanced;
    }

    result.textContent = `${messages.scoreLabel}: ${score}/${expectedAnswers.length} - ${guidance}`;
    result.className = "level-quiz-result is-success";
    updateActiveQuizProgress();
  });
});
