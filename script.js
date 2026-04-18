const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector(".site-menu");
const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");

if (menuToggle && siteMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteMenu.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      siteMenu.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    formStatus.textContent = "กำลังส่งข้อมูลเข้าสู่ระบบ...";
    formStatus.className = "form-status";

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Request failed");
      }

      contactForm.reset();
      formStatus.textContent = "บันทึกข้อมูลเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด";
      formStatus.className = "form-status is-success";
    } catch (error) {
      formStatus.textContent = "ไม่สามารถส่งข้อมูลได้ในขณะนี้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง";
      formStatus.className = "form-status is-error";
    }
  });
}
