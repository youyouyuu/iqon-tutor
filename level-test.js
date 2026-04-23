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
let levelTestAuthenticatedUser = null;
let levelTestAuthModal = null;
let levelTestAuthForm = null;
let levelTestAuthStatus = null;
let levelTestAuthNameField = null;
let levelTestAuthNameInput = null;
let levelTestAuthEmailInput = null;
let levelTestAuthPasswordInput = null;
let levelTestAuthSubmit = null;
let levelTestAuthTabs = [];
let levelTestAuthMode = "login";
let pendingLevelTestResult = null;

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
    prepButton: isEnglish ? "Continue" : "ดำเนินการต่อ",
    resultTitle: isEnglish ? "Your estimated level" : "ระดับที่เหมาะกับคุณตอนนี้",
    restart: isEnglish ? "Try again" : "ทำแบบทดสอบใหม่",
    backToSubjects: isEnglish ? "Back to subjects" : "กลับไปเลือกวิชา",
    progress: isEnglish ? "Question" : "ข้อ",
    of: isEnglish ? "of" : "จาก",
    starterLevel: isEnglish ? "Foundation" : "พื้นฐาน",
    intermediateLevel: isEnglish ? "Intermediate" : "กลาง",
    advancedLevel: isEnglish ? "Advanced" : "สูง",
    a1Level: "A1",
    a2Level: "A2",
    b1Level: "B1",
    b2Level: "B2",
    c1Level: "C1",
    starterAdvice: isEnglish
      ? "Recommended start: focus on foundation review before moving into an intensive course."
      : "คำแนะนำ: ควรเริ่มจากคอร์สปูพื้นฐานก่อน แล้วค่อยต่อยอดไปคอร์สที่เข้มขึ้น",
    intermediateAdvice: isEnglish
      ? "Recommended start: continue with a content-boosting plan and fix specific weak spots."
      : "คำแนะนำ: สามารถต่อยอดด้วยคอร์สเพิ่มเนื้อหาและเก็บจุดอ่อนเฉพาะเรื่องได้",
    advancedAdvice: isEnglish
      ? "Recommended start: you are ready for intensive practice, exam prep, or higher-level lessons."
      : "คำแนะนำ: พร้อมต่อยอดสู่คอร์สเข้มข้น ตะลุยโจทย์ หรือเตรียมสอบได้เลย",
    a1Advice: isEnglish
      ? "Approximate level A1: start with basic sentence patterns, daily vocabulary, and simple grammar."
      : "ระดับโดยประมาณ A1: ควรเริ่มจากประโยคพื้นฐาน คำศัพท์ในชีวิตประจำวัน และ grammar ระดับเริ่มต้น",
    a2Advice: isEnglish
      ? "Approximate level A2: continue with common grammar, short reading, and more everyday communication."
      : "ระดับโดยประมาณ A2: ควรต่อยอด grammar ที่ใช้บ่อย การอ่านสั้น ๆ และการสื่อสารในชีวิตประจำวัน",
    b1Advice: isEnglish
      ? "Approximate level B1: you can move into longer reading, structured writing, and intermediate grammar."
      : "ระดับโดยประมาณ B1: สามารถต่อยอดสู่การอ่านยาวขึ้น การเขียนเป็นระบบ และ grammar ระดับกลาง",
    b2Advice: isEnglish
      ? "Approximate level B2: you are ready for intensive practice, exam-style tasks, and more complex structures."
      : "ระดับโดยประมาณ B2: พร้อมสำหรับโจทย์เข้มขึ้น ข้อสอบแนวสอบ และโครงสร้างภาษาที่ซับซ้อนกว่าเดิม",
    c1Advice: isEnglish
      ? "Approximate level C1: you already have strong control and can focus on advanced accuracy and fluency."
      : "ระดับโดยประมาณ C1: มีพื้นฐานค่อนข้างแข็งแรงแล้ว ควรเน้นความแม่นยำและความลื่นไหลในระดับสูง",
    scoreLabel: isEnglish ? "Score" : "คะแนน",
    authTitle: isEnglish ? "Sign in before seeing your result" : "ล็อกอินก่อนดูผลแบบทดสอบ",
    authCopy: isEnglish
      ? "Sign in or create an account so we can save your test result and connect it to your profile."
      : "เข้าสู่ระบบหรือสมัครสมาชิกก่อน เพื่อบันทึกผลแบบทดสอบและผูกผลกับโปรไฟล์ของคุณ",
    authLoginTab: isEnglish ? "Sign In" : "เข้าสู่ระบบ",
    authRegisterTab: isEnglish ? "Create Account" : "สมัครใหม่",
    authNameLabel: isEnglish ? "Display name" : "ชื่อที่ใช้ติดต่อ",
    authEmailLabel: isEnglish ? "Email" : "อีเมล",
    authPasswordLabel: isEnglish ? "Password" : "รหัสผ่าน",
    authNamePlaceholder: isEnglish ? "Your name" : "เช่น น้องมินต์",
    authEmailPlaceholder: "name@email.com",
    authPasswordPlaceholder: isEnglish ? "At least 8 characters" : "อย่างน้อย 8 ตัวอักษร",
    authLoginSubmit: isEnglish ? "Sign in to view result" : "เข้าสู่ระบบเพื่อดูผล",
    authRegisterSubmit: isEnglish ? "Create account and view result" : "สมัครสมาชิกและดูผล",
    authCancel: isEnglish ? "Back to test" : "กลับไปทำข้อสอบ",
    authRequired: isEnglish ? "Please sign in before viewing your result." : "กรุณาล็อกอินก่อนดูผลแบบทดสอบ",
    authSending: isEnglish ? "Checking your account..." : "กำลังตรวจสอบข้อมูล...",
    authRequiredName: isEnglish ? "Please enter your name" : "กรุณากรอกชื่อให้ครบถ้วน",
    authRequiredEmail: isEnglish ? "Please enter a valid email" : "กรุณากรอกอีเมลให้ถูกต้อง",
    authRequiredPassword: isEnglish ? "Password must be at least 8 characters" : "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
    authLoginFailed: isEnglish ? "Incorrect email or password" : "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    authRegisterFailed: isEnglish ? "Could not create your account right now" : "ยังไม่สามารถสมัครสมาชิกได้ในขณะนี้",
  };
};

const setLevelTestAuthStatus = (message = "", variant = "") => {
  if (!levelTestAuthStatus) {
    return;
  }

  levelTestAuthStatus.textContent = message;
  levelTestAuthStatus.className = variant
    ? `level-test-auth-status ${variant}`
    : "level-test-auth-status";
};

const setLevelTestAuthMode = (mode = "login") => {
  const messages = getQuizMessages();
  levelTestAuthMode = mode === "register" ? "register" : "login";

  levelTestAuthTabs.forEach((button) => {
    const isActive = button.dataset.authMode === levelTestAuthMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (levelTestAuthNameField) {
    levelTestAuthNameField.hidden = levelTestAuthMode !== "register";
  }

  if (levelTestAuthSubmit) {
    levelTestAuthSubmit.textContent =
      levelTestAuthMode === "register" ? messages.authRegisterSubmit : messages.authLoginSubmit;
    levelTestAuthSubmit.disabled = false;
  }

  setLevelTestAuthStatus(messages.authRequired, "");
};

const closeLevelTestAuthModal = () => {
  levelTestAuthModal?.classList.add("hidden");
  document.body.classList.remove("modal-open");
};

const openLevelTestAuthModal = () => {
  ensureLevelTestAuthModal();
  if (!levelTestAuthModal) {
    return;
  }

  levelTestAuthModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  setLevelTestAuthMode(levelTestAuthMode);

  if (levelTestAuthMode === "register") {
    levelTestAuthNameInput?.focus();
    return;
  }

  levelTestAuthEmailInput?.focus();
};

const ensureLevelTestAuthModal = () => {
  if (levelTestAuthModal) {
    return levelTestAuthModal;
  }

  const messages = getQuizMessages();
  const wrapper = document.createElement("div");
  wrapper.className = "level-test-auth-backdrop hidden";
  wrapper.innerHTML = `
    <div class="level-test-auth-dialog" role="dialog" aria-modal="true" aria-labelledby="level-test-auth-title">
      <div class="level-test-auth-tabs" role="tablist" aria-label="Level test authentication">
        <button type="button" class="level-test-auth-tab is-active" data-auth-mode="login">${messages.authLoginTab}</button>
        <button type="button" class="level-test-auth-tab" data-auth-mode="register">${messages.authRegisterTab}</button>
      </div>
      <div class="level-test-auth-copy">
        <h2 id="level-test-auth-title">${messages.authTitle}</h2>
        <p>${messages.authCopy}</p>
      </div>
      <form class="level-test-auth-form" novalidate>
        <label class="level-test-auth-field" data-level-test-auth-name-field hidden>
          <span>${messages.authNameLabel}</span>
          <input type="text" name="full_name" autocomplete="name" placeholder="${messages.authNamePlaceholder}">
        </label>
        <label class="level-test-auth-field">
          <span>${messages.authEmailLabel}</span>
          <input type="email" name="email" autocomplete="email" placeholder="${messages.authEmailPlaceholder}">
        </label>
        <label class="level-test-auth-field">
          <span>${messages.authPasswordLabel}</span>
          <input type="password" name="password" autocomplete="current-password" placeholder="${messages.authPasswordPlaceholder}">
        </label>
        <div class="level-test-auth-actions">
          <button type="submit" class="button button-primary level-test-auth-submit">${messages.authLoginSubmit}</button>
          <button type="button" class="button button-secondary level-test-auth-cancel">${messages.authCancel}</button>
        </div>
      </form>
      <p class="level-test-auth-status"></p>
    </div>
  `;

  document.body.appendChild(wrapper);
  levelTestAuthModal = wrapper;
  levelTestAuthForm = wrapper.querySelector(".level-test-auth-form");
  levelTestAuthStatus = wrapper.querySelector(".level-test-auth-status");
  levelTestAuthNameField = wrapper.querySelector("[data-level-test-auth-name-field]");
  levelTestAuthNameInput = wrapper.querySelector('input[name="full_name"]');
  levelTestAuthEmailInput = wrapper.querySelector('input[name="email"]');
  levelTestAuthPasswordInput = wrapper.querySelector('input[name="password"]');
  levelTestAuthSubmit = wrapper.querySelector(".level-test-auth-submit");
  levelTestAuthTabs = Array.from(wrapper.querySelectorAll("[data-auth-mode]"));

  levelTestAuthTabs.forEach((button) => {
    button.addEventListener("click", () => {
      setLevelTestAuthMode(button.dataset.authMode || "login");
    });
  });

  wrapper.querySelector(".level-test-auth-cancel")?.addEventListener("click", () => {
    closeLevelTestAuthModal();
  });

  wrapper.addEventListener("click", (event) => {
    if (event.target === wrapper) {
      closeLevelTestAuthModal();
    }
  });

  levelTestAuthForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formMessages = getQuizMessages();
    const fullName = String(levelTestAuthNameInput?.value || "").trim();
    const email = String(levelTestAuthEmailInput?.value || "").trim();
    const password = String(levelTestAuthPasswordInput?.value || "");

    if (levelTestAuthMode === "register" && fullName.length < 2) {
      setLevelTestAuthStatus(formMessages.authRequiredName, "is-error");
      levelTestAuthNameInput?.focus();
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLevelTestAuthStatus(formMessages.authRequiredEmail, "is-error");
      levelTestAuthEmailInput?.focus();
      return;
    }

    if (password.length < 8) {
      setLevelTestAuthStatus(formMessages.authRequiredPassword, "is-error");
      levelTestAuthPasswordInput?.focus();
      return;
    }

    setLevelTestAuthStatus(formMessages.authSending, "");
    if (levelTestAuthSubmit) {
      levelTestAuthSubmit.disabled = true;
    }

    try {
      const endpoint = levelTestAuthMode === "register" ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(
          payload.error ||
            (levelTestAuthMode === "register"
              ? formMessages.authRegisterFailed
              : formMessages.authLoginFailed),
        );
      }

      levelTestAuthenticatedUser = payload.user || null;
      levelTestAuthForm?.reset();
      closeLevelTestAuthModal();

      const pendingAction = pendingLevelTestResult;
      pendingLevelTestResult = null;
      if (typeof pendingAction === "function") {
        pendingAction();
      }
    } catch (error) {
      setLevelTestAuthStatus(
        error instanceof Error && error.message
          ? error.message
          : levelTestAuthMode === "register"
            ? formMessages.authRegisterFailed
            : formMessages.authLoginFailed,
        "is-error",
      );
    } finally {
      if (levelTestAuthSubmit) {
        levelTestAuthSubmit.disabled = false;
      }
    }
  });

  return levelTestAuthModal;
};

const syncLevelTestAuthentication = async () => {
  try {
    const response = await fetch("/api/auth/me", {
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await response.json();
    if (response.ok && payload.ok && payload.authenticated) {
      levelTestAuthenticatedUser = payload.user || null;
      return;
    }
  } catch (error) {
    // Ignore auth check errors and treat as logged out.
  }

  levelTestAuthenticatedUser = null;
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
  const subjectLabel =
    document.querySelector(".level-quiz-card[data-subject-label]")?.dataset.subjectLabel || "";
  const isEnglishSubject =
    subjectLabel.toLowerCase().includes("english") || subjectLabel.includes("ภาษาอังกฤษ");

  if (isEnglishSubject && total >= 10) {
    if (score >= 11) {
      return { level: messages.c1Level, advice: messages.c1Advice };
    }

    if (score >= 9) {
      return { level: messages.b2Level, advice: messages.b2Advice };
    }

    if (score >= 6) {
      return { level: messages.b1Level, advice: messages.b1Advice };
    }

    if (score >= 3) {
      return { level: messages.a2Level, advice: messages.a2Advice };
    }

    return { level: messages.a1Level, advice: messages.a1Advice };
  }

  if (score >= total) {
    return { level: messages.advancedLevel, advice: messages.advancedAdvice };
  }

  if (score >= Math.max(2, total - 1)) {
    return { level: messages.intermediateLevel, advice: messages.intermediateAdvice };
  }

  return { level: messages.starterLevel, advice: messages.starterAdvice };
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

  form.addEventListener("submit", async (event) => {
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

    await syncLevelTestAuthentication();
    if (!levelTestAuthenticatedUser) {
      pendingLevelTestResult = () => showResultView(score, expectedAnswers.length);
      openLevelTestAuthModal();
      result.textContent = messages.authRequired;
      result.className = "level-quiz-result is-error";
      return;
    }

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

ensureLevelTestAuthModal();
void syncLevelTestAuthentication();
