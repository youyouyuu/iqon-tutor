const levelQuizForms = document.querySelectorAll("[data-level-quiz]");
const levelTabTriggers = document.querySelectorAll("[data-level-tab-trigger]");
const levelTabPanels = document.querySelectorAll("[data-level-tab-panel]");
const levelQuizPanel = document.querySelector("#level-quiz-panel");
const levelQuizCurrentSubject = document.querySelector("#level-quiz-current-subject");
const levelQuizProgressCount = document.querySelector("#level-quiz-progress-count");
const levelQuizProgressFill = document.querySelector("#level-quiz-progress-fill");
const levelQuizProgressHint = document.querySelector("#level-quiz-progress-hint");
const levelTestStartButtons = document.querySelectorAll("[data-level-test-start]");
const levelTestIntro = document.querySelector("[data-level-test-intro]");
const levelTestPanel = document.querySelector("[data-level-test-panel]");
let levelTestPrep = document.querySelector("[data-level-test-prep]");

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

const getQuizMessages = () => {
  const isEnglish = document.documentElement.lang === "en";

  return {
    next: isEnglish ? "Next question" : "ข้อถัดไป",
    prev: isEnglish ? "Previous" : "ย้อนกลับ",
    finish: isEnglish ? "See my level" : "ดูระดับของฉัน",
    unanswered: isEnglish ? "Please choose an answer first." : "กรุณาเลือกคำตอบก่อน",
    prepTitle: isEnglish ? "Let's begin with the foundation questions first." : "มาเริ่มจากคำถามระดับพื้นฐานกันก่อน",
    prepButton: isEnglish ? "Continue" : "ดำเนินการต่อ",
    resultTitle: isEnglish ? "Your estimated level" : "ระดับที่เหมาะกับคุณตอนนี้",
    restart: isEnglish ? "Try again" : "ทำแบบทดสอบใหม่",
    backToSubjects: isEnglish ? "Back to subjects" : "กลับไปเลือกวิชา",
    progress: isEnglish ? "Question" : "ข้อ",
    of: isEnglish ? "of" : "จาก",
    starterLevel: isEnglish ? "Foundation" : "พื้นฐาน",
    intermediateLevel: isEnglish ? "Intermediate" : "กลาง",
    advancedLevel: isEnglish ? "Advanced" : "สูง",
    starterAdvice: isEnglish
      ? "Recommended start: focus on foundation review before moving into an intensive course."
      : "คำแนะนำ: ควรเริ่มจากคอร์สปูพื้นฐานก่อน แล้วค่อยต่อยอดไปคอร์สที่เข้มขึ้น",
    intermediateAdvice: isEnglish
      ? "Recommended start: continue with a content-boosting plan and fix specific weak spots."
      : "คำแนะนำ: สามารถต่อยอดด้วยคอร์สเพิ่มเนื้อหาและเก็บจุดอ่อนเฉพาะเรื่องได้",
    advancedAdvice: isEnglish
      ? "Recommended start: you are ready for intensive practice, exam prep, or higher-level lessons."
      : "คำแนะนำ: พร้อมต่อยอดสู่คอร์สเข้มข้น ตะลุยโจทย์ หรือเตรียมสอบได้เลย",
    scoreLabel: isEnglish ? "Score" : "คะแนน",
  };
};

const ensurePrepScreen = () => {
  if (levelTestPrep || !levelTestPanel) {
    return levelTestPrep;
  }

  const quizCard = levelTestPanel.querySelector(".level-quiz-card[data-subject-label]");
  const subjectLabel = quizCard?.dataset.subjectLabel || "Level Test";
  const questionCount = quizCard?.querySelectorAll(".level-quiz-question").length || 0;
  const messages = getQuizMessages();
  const prepText =
    document.documentElement.lang === "en"
      ? `Let's begin with ${questionCount} foundation questions for ${subjectLabel}.`
      : `มาเริ่มจากคำถามระดับพื้นฐาน ${questionCount} ข้อของวิชา${subjectLabel} กันก่อน`;

  levelTestPrep = document.createElement("section");
  levelTestPrep.className = "subject-test-prep is-hidden";
  levelTestPrep.setAttribute("data-level-test-prep", "");
  levelTestPrep.innerHTML = `
    <div class="container subject-test-prep-shell">
      <div class="subject-test-prep-mark" aria-hidden="true">2</div>
      <div class="subject-test-prep-copy">
        <h2>${prepText}</h2>
        <button class="button button-primary subject-test-prep-button" type="button" data-level-test-continue>${messages.prepButton}</button>
      </div>
    </div>
  `;

  levelTestPanel.insertAdjacentElement("beforebegin", levelTestPrep);

  const continueButton = levelTestPrep.querySelector("[data-level-test-continue]");
  continueButton?.addEventListener("click", () => {
    document.body.classList.add("subject-test-started");
    levelTestPrep?.classList.add("is-hidden");
    levelTestPanel.classList.remove("is-hidden-before-start");
    levelTestPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  return levelTestPrep;
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
  const activePanel =
    document.querySelector('[data-level-tab-panel].is-active') ||
    document.querySelector(".level-quiz-card[data-subject-label]");
  const activeForm = activePanel?.querySelector("[data-level-quiz]");
  const subjectLabel = activePanel?.dataset.subjectLabel || "Level Test";
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
        ? "ตอบครบแล้ว กดดูผลระดับได้เลย"
        : "ทำทีละข้อให้ครบ ระบบจะสรุประดับให้เมื่อจบแบบทดสอบ";
  }
};

const getResultContent = (score, total, messages) => {
  if (score >= total) {
    return {
      level: messages.advancedLevel,
      advice: messages.advancedAdvice,
    };
  }

  if (score >= Math.max(2, total - 1)) {
    return {
      level: messages.intermediateLevel,
      advice: messages.intermediateAdvice,
    };
  }

  return {
    level: messages.starterLevel,
    advice: messages.starterAdvice,
  };
};

const buildResultCard = ({ subjectLabel, score, total }) => {
  const messages = getQuizMessages();
  const resultContent = getResultContent(score, total, messages);
  const resultSection = document.createElement("section");
  resultSection.className = "subject-test-result";
  resultSection.innerHTML = `
    <div class="container subject-test-result-shell">
      <article class="subject-test-result-card">
        <span class="subject-test-result-chip">${subjectLabel}</span>
        <h1>${messages.resultTitle}</h1>
        <div class="subject-test-result-level">${resultContent.level}</div>
        <p class="subject-test-result-score">${messages.scoreLabel}: ${score}/${total}</p>
        <p class="subject-test-result-copy">${resultContent.advice}</p>
        <div class="subject-test-result-actions">
          <button class="button button-primary" type="button" data-level-test-restart>${messages.restart}</button>
          <a class="button button-secondary" href="/level-test.html">${messages.backToSubjects}</a>
        </div>
      </article>
    </div>
  `;

  return resultSection;
};

const setupSubjectQuizFlow = (form) => {
  const questions = Array.from(form.querySelectorAll(".level-quiz-question"));
  const answerField = form.querySelector('input[name="answers"]');
  const result = form.querySelector(".level-quiz-result");
  const actions = form.querySelector(".level-quiz-actions");
  const submitButton = actions?.querySelector('button[type="submit"]');
  const backLink = actions?.querySelector("a");
  const quizCard = form.closest(".level-quiz-card");

  if (!questions.length || !answerField || !result || !actions || !submitButton || !quizCard) {
    return;
  }

  let currentIndex = 0;
  let resultSection = null;

  const messages = getQuizMessages();
  const subjectLabel = quizCard.dataset.subjectLabel || "Level Test";

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.className = "button button-secondary level-quiz-prev";
  previousButton.textContent = messages.prev;
  actions.insertBefore(previousButton, submitButton);

  const stepLabel = document.createElement("p");
  stepLabel.className = "level-quiz-step-label";
  form.insertBefore(stepLabel, questions[0]);

  const updateQuestionView = () => {
    questions.forEach((question, index) => {
      question.hidden = index !== currentIndex;
      question.classList.toggle("is-current", index === currentIndex);
    });

    stepLabel.textContent = `${messages.progress} ${currentIndex + 1} ${messages.of} ${questions.length}`;
    previousButton.hidden = currentIndex === 0;
    submitButton.textContent = currentIndex === questions.length - 1 ? messages.finish : messages.next;
    result.textContent = "";
    result.className = "level-quiz-result";
    updateActiveQuizProgress();
  };

  const showResultView = (score, total) => {
    resultSection?.remove();
    document.body.classList.add("subject-test-showing-result");
    levelTestPanel?.classList.add("is-hidden");
    resultSection = buildResultCard({ subjectLabel, score, total });
    levelTestPanel?.insertAdjacentElement("afterend", resultSection);

    const restartButton = resultSection.querySelector("[data-level-test-restart]");
    restartButton?.addEventListener("click", () => {
      form.reset();
      currentIndex = 0;
      resultSection?.remove();
      resultSection = null;
      document.body.classList.remove("subject-test-showing-result");
      levelTestPanel?.classList.remove("is-hidden");
      updateQuestionView();
      levelTestPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  previousButton.addEventListener("click", () => {
    if (currentIndex <= 0) {
      return;
    }

    currentIndex -= 1;
    updateQuestionView();
  });

  form.addEventListener("change", () => {
    updateActiveQuizProgress();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const currentQuestion = questions[currentIndex];
    const selectedAnswer = currentQuestion.querySelector('input[type="radio"]:checked');

    if (!selectedAnswer) {
      result.textContent = messages.unanswered;
      result.className = "level-quiz-result is-error";
      return;
    }

    if (currentIndex < questions.length - 1) {
      currentIndex += 1;
      updateQuestionView();
      return;
    }

    const expectedAnswers = answerField.value.split(",");
    const selectedAnswers = questions.map((question) => {
      const checked = question.querySelector('input[type="radio"]:checked');
      return checked ? checked.value : "";
    });

    const score = selectedAnswers.reduce((total, value, index) => {
      return total + (value === expectedAnswers[index] ? 1 : 0);
    }, 0);

    showResultView(score, expectedAnswers.length);
  });

  if (backLink && document.body.classList.contains("subject-test-page")) {
    backLink.textContent = "กลับไปเลือกวิชา";
  }

  updateQuestionView();
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

if (levelTabTriggers.length && levelTabPanels.length) {
  setActiveLevelTab(getSubjectFromHash() || "math");
} else {
  updateActiveQuizProgress();
}

levelQuizForms.forEach((form) => {
  setupSubjectQuizFlow(form);
});

levelTestStartButtons.forEach((button) => {
  button.addEventListener("click", () => {
    levelTestIntro?.classList.add("is-hidden");
    const prepScreen = ensurePrepScreen();
    prepScreen?.classList.remove("is-hidden");
    prepScreen?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});
