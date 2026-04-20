const menuToggle = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector(".site-menu");
const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");
const nameInput = contactForm?.querySelector('input[name="name"]');
const levelInput = contactForm?.querySelector('select[name="level"]');
const subjectInput = contactForm?.querySelector('select[name="subject"]');
const phoneInput = contactForm?.querySelector('input[name="phone"]');
const messageInput = contactForm?.querySelector('textarea[name="message"]');
const preferredTimeInput = contactForm?.querySelector('select[name="preferred_time"]');
const consentContactInput = contactForm?.querySelector('input[name="consent_contact"]');
const consentTermsInput = contactForm?.querySelector('input[name="consent_terms"]');
const storyOverlay = document.querySelector("#story-media-overlay");
const storyOverlayClose = document.querySelector(".story-overlay-close");
const heroFloatingCard = document.querySelector("#hero-floating-card");
const heroFloatingClose = document.querySelector(".hero-floating-close");
const heroFloatingOpen = document.querySelector("#hero-floating-open");
const supportWidget = document.querySelector("[data-support-widget]");
const supportPanel = document.querySelector("[data-support-panel]");
const supportOpen = document.querySelector("[data-support-open]");
const supportClose = document.querySelector("[data-support-close]");
const supportForm = document.querySelector("[data-support-form]");
const courseLineTriggers = document.querySelectorAll(".course-line-trigger");
const linePackageModal = document.querySelector("#line-package-modal");
const linePackageTitle = document.querySelector("#line-package-title");
const linePackageSummary = document.querySelector("#line-package-summary");
const linePackageHours = document.querySelector("#line-package-hours");
const linePackagePrice = document.querySelector("#line-package-price");
const linePackageOldPrice = document.querySelector("#line-package-old-price");
const lineAddFriendLink = document.querySelector("#line-add-friend-link");
const lineMessageLink = document.querySelector("#line-message-link");
const lineQrImage = document.querySelector("#line-package-qr-image");
const lineQrDownload = document.querySelector("#line-qr-download");
const linePackageClosers = document.querySelectorAll("[data-line-package-close]");

const LINE_OA_ID = "@iqon";
const lineAddFriendUrl = `https://line.me/R/ti/p/${encodeURIComponent(LINE_OA_ID)}`;
const buildLineMessageUrl = (message) =>
  `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OA_ID)}/?${encodeURIComponent(message)}`;
const buildQrImageUrl = (targetUrl) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=960x960&margin=24&data=${encodeURIComponent(targetUrl)}`;

const contactFields = [
  nameInput,
  levelInput,
  subjectInput,
  phoneInput,
  messageInput,
  preferredTimeInput,
].filter(Boolean);

const clearFieldError = (field) => {
  if (!field) {
    return;
  }

  field.classList.remove("field-error");
  field.removeAttribute("aria-invalid");
};

const focusFieldError = (field) => {
  if (!field) {
    return;
  }

  field.classList.add("field-error");
  field.setAttribute("aria-invalid", "true");
  field.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });

  window.setTimeout(() => {
    try {
      field.focus({
        preventScroll: true,
      });
    } catch (error) {
      field.focus();
    }
  }, 120);
};

if (contactForm) {
  contactForm.noValidate = true;
}

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

if (storyOverlay && storyOverlayClose) {
  storyOverlayClose.addEventListener("click", () => {
    storyOverlay.classList.add("is-hidden");
  });
}

if (heroFloatingCard && heroFloatingClose && heroFloatingOpen) {
  heroFloatingClose.addEventListener("click", () => {
    heroFloatingCard.classList.add("is-hidden");
    heroFloatingOpen.classList.remove("hidden");
  });

  heroFloatingOpen.addEventListener("click", () => {
    heroFloatingCard.classList.remove("is-hidden");
    heroFloatingOpen.classList.add("hidden");
  });
}

if (supportWidget && supportPanel && supportOpen) {
  const setSupportState = (isOpen) => {
    supportPanel.classList.toggle("hidden", !isOpen);
    supportOpen.setAttribute("aria-expanded", String(isOpen));
  };

  supportOpen.addEventListener("click", () => {
    const isOpen = supportPanel.classList.contains("hidden");
    setSupportState(isOpen);
  });

  supportClose?.addEventListener("click", () => {
    setSupportState(false);
  });

  document.addEventListener("click", (event) => {
    if (!supportWidget.contains(event.target)) {
      setSupportState(false);
    }
  });
}

if (supportForm) {
  supportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = supportForm.querySelector('input[name="support_message"]');
    const message = String(input?.value || "").trim();
    const lineUrl = "https://lin.ee/fOA2NDf2";

    if (message && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(message);
      } catch (error) {
        // Ignore clipboard failures and still continue to Line.
      }
    }

    window.open(lineUrl, "_blank", "noopener,noreferrer");
    supportForm.reset();
  });
}

if (
  linePackageModal &&
  linePackageTitle &&
  linePackageSummary &&
  linePackageHours &&
  linePackagePrice &&
  linePackageOldPrice &&
  lineAddFriendLink &&
  lineMessageLink &&
  lineQrImage
) {
  const openLinePackageModal = (trigger) => {
    const packageName = String(trigger.dataset.package || "แพ็กเกจที่สนใจ").trim();
    const hours = String(trigger.dataset.hours || "-").trim();
    const price = String(trigger.dataset.price || "-").trim();
    const oldPrice = String(trigger.dataset.oldPrice || "").trim();
    const message =
      String(trigger.dataset.message || "").trim() ||
      `สวัสดีค่ะ สนใจ${packageName} ${hours} ${price} รบกวนขอรายละเอียดเพิ่มเติมค่ะ`;
    const qrUrl = buildQrImageUrl(lineAddFriendUrl);

    linePackageTitle.textContent = packageName;
    linePackageSummary.textContent = "เลือกเพิ่มเพื่อนหรือเปิดแชตพร้อมข้อความแพ็กเกจนี้ได้ทันที";
    linePackageHours.textContent = hours;
    linePackagePrice.textContent = price;
    linePackageOldPrice.textContent = oldPrice;
    lineAddFriendLink.href = lineAddFriendUrl;
    lineMessageLink.href = buildLineMessageUrl(message);
    lineQrImage.src = qrUrl;
    lineQrImage.dataset.downloadUrl = qrUrl;
    lineQrImage.dataset.filename = `${packageName.replace(/\s+/g, "-")}-line-qr.png`;

    linePackageModal.classList.remove("hidden");
    linePackageModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeLinePackageModal = () => {
    linePackageModal.classList.add("hidden");
    linePackageModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  courseLineTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      openLinePackageModal(trigger);
    });
  });

  linePackageClosers.forEach((closer) => {
    closer.addEventListener("click", closeLinePackageModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !linePackageModal.classList.contains("hidden")) {
      closeLinePackageModal();
    }
  });

  lineQrDownload?.addEventListener("click", async () => {
    const qrUrl = lineQrImage.dataset.downloadUrl || lineQrImage.src;
    const filename = lineQrImage.dataset.filename || "iqon-line-qr.png";

    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      window.open(qrUrl, "_blank", "noopener,noreferrer");
    }
  });
}

if (phoneInput) {
  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 10);
    clearFieldError(phoneInput);
  });
}

contactFields.forEach((field) => {
  const eventName = field.tagName === "SELECT" ? "change" : "input";
  field.addEventListener(eventName, () => {
    clearFieldError(field);
  });
});

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    contactFields.forEach((field) => {
      clearFieldError(field);
    });

    formStatus.textContent = "กำลังส่งข้อมูลเข้าสู่ระบบ...";
    formStatus.className = "form-status";

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());
    payload.name = String(payload.name || "").trim();
    payload.level = String(payload.level || "").trim();
    payload.subject = String(payload.subject || "").trim();
    payload.phone = String(payload.phone || "").replace(/\D/g, "").slice(0, 10);
    payload.message = String(payload.message || "").trim();
    payload.preferred_time = String(payload.preferred_time || "").trim();
    payload.consent_contact = Boolean(consentContactInput?.checked);
    payload.consent_terms = Boolean(consentTermsInput?.checked);

    if (!payload.name) {
      formStatus.textContent = "กรุณากรอกชื่อผู้ปกครองหรือนักเรียน";
      formStatus.className = "form-status is-error";
      focusFieldError(nameInput);
      return;
    }

    if (!payload.level) {
      formStatus.textContent = "กรุณาเลือกระดับชั้น";
      formStatus.className = "form-status is-error";
      focusFieldError(levelInput);
      return;
    }

    if (!payload.subject) {
      formStatus.textContent = "กรุณาเลือกรายวิชาที่สนใจ";
      formStatus.className = "form-status is-error";
      focusFieldError(subjectInput);
      return;
    }

    if (!/^0\d{9}$/.test(payload.phone)) {
      formStatus.textContent = "กรุณากรอกเบอร์โทรศัพท์ไทย 10 หลัก เช่น 0941748919";
      formStatus.className = "form-status is-error";
      focusFieldError(phoneInput);
      return;
    }

    if (!payload.preferred_time) {
      formStatus.textContent = "กรุณาเลือกเวลาที่สะดวกให้เจ้าหน้าที่ติดต่อกลับ";
      formStatus.className = "form-status is-error";
      focusFieldError(preferredTimeInput);
      return;
    }

    if (!payload.consent_contact) {
      formStatus.textContent = "กรุณายินยอมให้สถาบันติดต่อกลับก่อนส่งข้อมูล";
      formStatus.className = "form-status is-error";
      consentContactInput?.focus();
      return;
    }

    if (!payload.consent_terms) {
      formStatus.textContent = "กรุณายอมรับข้อกำหนดและนโยบายความเป็นส่วนตัว";
      formStatus.className = "form-status is-error";
      consentTermsInput?.focus();
      return;
    }

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
      contactFields.forEach((field) => {
        clearFieldError(field);
      });
      formStatus.textContent = "บันทึกข้อมูลเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด";
      formStatus.className = "form-status is-success";
    } catch (error) {
      formStatus.textContent = "ไม่สามารถส่งข้อมูลได้ในขณะนี้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง";
      formStatus.className = "form-status is-error";
    }
  });
}
