const levelQuizForms = document.querySelectorAll("[data-level-quiz]");

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

levelQuizForms.forEach((form) => {
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
  });
});
