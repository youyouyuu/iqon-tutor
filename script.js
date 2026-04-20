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
const consentInlineToggles = document.querySelectorAll(".consent-inline-toggle");
const storyOverlay = document.querySelector("#story-media-overlay");
const storyOverlayClose = document.querySelector(".story-overlay-close");
const supportWidget = document.querySelector("[data-support-widget]");
const supportPanel = document.querySelector("[data-support-panel]");
const supportOpen = document.querySelector("[data-support-open]");
const supportClose = document.querySelector("[data-support-close]");
const supportForm = document.querySelector("[data-support-form]");
const supportInput = supportForm?.querySelector('input[name="support_message"]');
const supportThread = document.querySelector("[data-support-thread]");
const supportStatus = document.querySelector("[data-support-status]");
const supportQuickButtons = document.querySelectorAll("[data-quick-message]");
const contactMenu = document.querySelector("[data-contact-menu]");
const contactMenuOpen = document.querySelector("[data-contact-open]");
const contactMenuLinks = document.querySelector("[data-contact-links]");
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
const languageButtons = document.querySelectorAll("[data-lang-option]");

const LINE_OA_ID = "@iqon";
const lineAddFriendUrl = `https://line.me/R/ti/p/${encodeURIComponent(LINE_OA_ID)}`;
const buildLineMessageUrl = (message) =>
  `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OA_ID)}/?${encodeURIComponent(message)}`;
const buildQrImageUrl = (targetUrl) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=960x960&margin=24&data=${encodeURIComponent(targetUrl)}`;

const SUPPORT_CONVERSATION_KEY = "iqonSupportConversationId";
const SUPPORT_POLL_INTERVAL = 2000;
const LANGUAGE_STORAGE_KEY = "iqonPreferredLanguage";

const contactFields = [
  nameInput,
  levelInput,
  subjectInput,
  phoneInput,
  messageInput,
  preferredTimeInput,
].filter(Boolean);

let supportPollHandle = null;
let supportConversationId = "";
let currentLanguage = "th";

const safeStorage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Ignore storage write failures.
    }
  },
};

const translations = {
  th: {
    brand_tagline: "สถาบันกวดวิชาไอคิวออน",
    menu: "เมนู",
    nav_programs: "หลักสูตร",
    nav_approach: "แนวทางการสอน",
    nav_courses: "ข้อมูลคอร์ส",
    nav_contact: "ติดต่อ",
    book_consultation: "นัดหมายปรึกษา",
    ask_via_line: "สอบถามผ่าน Line",
    ask_about_courses: "สอบถามคอร์สเรียน",
    view_courses: "ดูข้อมูลคอร์สเรียน",
    view_programs: "ดูหลักสูตร",
    talk_to_institute: "คุยกับสถาบัน",
    apply_now: "สมัครเรียนเลย",
    view_facebook_page: "ดู Facebook Page",
    support_header_subtitle: "แชตสอบถามคอร์สและโปรโมชันได้แบบเรียลไทม์",
    support_quick_math: "คอร์สคณิต",
    support_quick_promo: "โปรโมชัน",
    support_quick_solo: "แพ็กเกจเดี่ยว",
    support_quick_pair: "แพ็กเกจคู่",
    support_quick_recommend: "แนะนำคอร์ส",
    support_input_placeholder: "พิมพ์คำถาม เช่น สนใจคอร์สคณิต ม.ปลาย",
    send: "ส่ง",
    line: "Line",
    facebook: "Facebook",
    phone: "เบอร์โทร",
    chat_with_iqon: "แชตกับ IQON",
    open_line_chat: "เปิดแชตพร้อมข้อความแพ็กเกจนี้",
    add_line_friend: "เพิ่มเพื่อนทาง LINE",
    save_line_qr: "บันทึก QR Code LINE",
    support_status_connected: "เชื่อมต่อกับห้องแชตแล้ว",
    support_status_start: "เริ่มต้นถามคำถามได้เลย ทีมงานจะเห็นข้อความนี้ในหลังบ้าน",
    support_status_load_error: "ยังไม่สามารถโหลดข้อความได้ในขณะนี้",
    support_error_empty: "กรุณาพิมพ์ข้อความก่อนส่ง",
    support_status_sending: "กำลังส่งข้อความ...",
    support_status_sent: "ส่งข้อความแล้ว ทีมงานจะตอบกลับในห้องแชตนี้",
    support_status_send_error: "ยังส่งข้อความไม่สำเร็จ กรุณาลองอีกครั้ง",
    form_status_sending: "กำลังส่งข้อมูลเข้าสู่ระบบ...",
    form_error_name: "กรุณากรอกชื่อผู้ปกครองหรือนักเรียน",
    form_error_level: "กรุณาเลือกระดับชั้น",
    form_error_subject: "กรุณาเลือกรายวิชาที่สนใจ",
    form_error_phone: "กรุณากรอกเบอร์โทรศัพท์ไทย 10 หลัก เช่น 0941748919",
    form_error_time: "กรุณาเลือกเวลาที่สะดวกให้เจ้าหน้าที่ติดต่อกลับ",
    form_error_consent_contact: "กรุณายินยอมให้สถาบันติดต่อกลับก่อนส่งข้อมูล",
    form_error_consent_terms: "กรุณายอมรับข้อกำหนดและนโยบายความเป็นส่วนตัว",
    form_success_submit: "บันทึกข้อมูลเรียบร้อยแล้ว เจ้าหน้าที่จะติดต่อกลับโดยเร็วที่สุด",
    form_error_submit: "ไม่สามารถส่งข้อมูลได้ในขณะนี้ กรุณาตรวจสอบข้อมูลและลองใหม่อีกครั้ง",
    title_home: "สถาบันกวดวิชา IQON - ไอคิวออน",
    title_courses: "ข้อมูลคอร์สเรียน | สถาบันกวดวิชา IQON - ไอคิวออน",
  },
  en: {
    brand_tagline: "IQON Academic Institute",
    menu: "Menu",
    nav_programs: "Programs",
    nav_approach: "Approach",
    nav_courses: "Courses",
    nav_contact: "Contact",
    book_consultation: "Book Consultation",
    ask_via_line: "Ask via Line",
    ask_about_courses: "Ask About Courses",
    view_courses: "View Courses",
    view_programs: "View Programs",
    talk_to_institute: "Talk to IQON",
    apply_now: "Apply Now",
    view_facebook_page: "View Facebook Page",
    support_header_subtitle: "Chat with us about courses and promotions in real time",
    support_quick_math: "Math Course",
    support_quick_promo: "Promotion",
    support_quick_solo: "Solo Package",
    support_quick_pair: "Pair Package",
    support_quick_recommend: "Recommend Course",
    support_input_placeholder: "Type a question, for example: interested in upper secondary math",
    send: "Send",
    line: "Line",
    facebook: "Facebook",
    phone: "Phone",
    chat_with_iqon: "Chat with IQON",
    open_line_chat: "Open chat with this package message",
    add_line_friend: "Add Friend on LINE",
    save_line_qr: "Save LINE QR Code",
    support_status_connected: "Connected to the chat room",
    support_status_start: "Start typing your question. Our team can see it from the admin dashboard.",
    support_status_load_error: "Unable to load messages right now",
    support_error_empty: "Please type a message before sending",
    support_status_sending: "Sending your message...",
    support_status_sent: "Message sent. Our team will reply in this chat.",
    support_status_send_error: "Message could not be sent. Please try again.",
    form_status_sending: "Sending your information...",
    form_error_name: "Please enter the parent or student name",
    form_error_level: "Please select the student level",
    form_error_subject: "Please select the subject of interest",
    form_error_phone: "Please enter a valid 10-digit Thai phone number, for example 0941748919",
    form_error_time: "Please select a preferred contact time",
    form_error_consent_contact: "Please allow the institute to contact you before submitting",
    form_error_consent_terms: "Please accept the terms and privacy policy",
    form_success_submit: "Your information has been saved. Our team will contact you as soon as possible.",
    form_error_submit: "We could not submit the form right now. Please try again.",
    title_home: "IQON Tutor Academy",
    title_courses: "Course Information | IQON Tutor Academy",
  },
};

const getText = (key) => translations[currentLanguage]?.[key] || translations.th[key] || "";

const setText = (selector, value) => {
  if (value === undefined) {
    return;
  }

  const element = document.querySelector(selector);
  if (element) {
    element.textContent = value;
  }
};

const setTexts = (selector, values) => {
  if (!Array.isArray(values)) {
    return;
  }

  document.querySelectorAll(selector).forEach((element, index) => {
    if (values[index] !== undefined) {
      element.textContent = values[index];
    }
  });
};

const setHtml = (selector, value) => {
  if (value === undefined) {
    return;
  }

  const element = document.querySelector(selector);
  if (element) {
    element.innerHTML = value;
  }
};

const setAttributeValue = (selector, attribute, value) => {
  if (value === undefined) {
    return;
  }

  const element = document.querySelector(selector);
  if (element) {
    element.setAttribute(attribute, value);
  }
};

const setLabelText = (selector, value) => {
  const label = document.querySelector(selector);
  if (!label || value === undefined) {
    return;
  }

  const textNode = Array.from(label.childNodes).find(
    (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
  );

  if (textNode) {
    textNode.textContent = `\n            ${value}\n            `;
  }
};

const setLeadingText = (selector, value) => {
  const element = document.querySelector(selector);
  if (!element || value === undefined) {
    return;
  }

  const textNode = Array.from(element.childNodes).find(
    (node) => node.nodeType === Node.TEXT_NODE,
  );

  if (textNode) {
    textNode.textContent = `${value} `;
  }
};

const setSelectOptions = (selector, values) => {
  const select = document.querySelector(selector);
  if (!select || !Array.isArray(values)) {
    return;
  }

  Array.from(select.options).forEach((option, index) => {
    if (values[index] !== undefined) {
      option.textContent = values[index];
    }
  });
};

const localizedPages = {
  th: {
    home: {
      newsHeading: "ข่าวสารล่าสุดและพื้นที่โปรโมต",
      newsCards: [
        ["เปิดรับสมัคร | รอบใหม่", "คอร์สเรียนปรับพื้นฐานและเพิ่มเนื้อหา", "ใช้บล็อกนี้เป็นข่าวสารอัปเดตล่าสุดของสถาบัน หรือโปสเตอร์ประชาสัมพันธ์รอบเรียนใหม่"],
        ["กิจกรรม | วิดีโอ", "คลิปรีวิวบรรยากาศการเรียนหรือผลงานนักเรียน", "ตำแหน่งนี้เหมาะสำหรับภาพนิ่งหรือวิดีโอแนวนอน เพื่อสร้างความน่าเชื่อถือและความมีชีวิตชีวาให้หน้าเว็บ"],
        ["โปรโมชัน | เปิดสถาบัน", "อัปเดตราคาใหม่ พร้อมทดลองเรียนวัดระดับฟรี", "แพ็กเกจเริ่มต้นคอร์สเดี่ยว 4,599 บาท และคอร์สคู่ 3,899 บาท พร้อมราคาพิเศษสำหรับนักเรียนเก่า"],
      ],
      story: {
        eyebrow: "Teaching Experience",
        title: "การเรียนการสอนของ IQON ออกแบบให้เข้าใจง่าย เป็นระบบ และต่อยอดผลลัพธ์ได้จริง",
        paragraphs: [
          "เราเน้นการสอนที่ช่วยให้นักเรียนเข้าใจบทเรียนอย่างเป็นขั้นตอน ทั้งการปูพื้นฐาน การเพิ่มเนื้อหา และการเตรียมตัวสอบ โดยให้ความสำคัญกับการอธิบายที่ชัดเจน การฝึกทำโจทย์อย่างเหมาะสม และการติดตามพัฒนาการของผู้เรียนอย่างต่อเนื่อง",
          "รูปแบบคอร์สของ IQON ถูกจัดให้เหมาะกับเป้าหมายที่แตกต่างกัน ไม่ว่าจะเป็นการเตรียมสอบเข้า การเสริมเกรดในโรงเรียน หรือการพัฒนาความมั่นใจในรายวิชาที่ต้องการเน้นเป็นพิเศษ",
        ],
        overlayTitle: "วิดีโอแนะนำสถาบัน IQON",
        overlayBody: "คลิปนี้ดึงมาจากไฟล์ Video Feature.mp4 ในโฟลเดอร์วิดีโอของโปรเจกต์แล้ว",
      },
      promo: {
        title: "พื้นที่โปรโมตใหญ่สำหรับคอร์สเด่นหรือภาพรวมการรับสมัครของคุณ",
        body: "บล็อกนี้ตั้งใจทำให้เด่นมากเป็นพิเศษคล้ายหน้าโปรโมตเกมหรืออีเวนต์ใหญ่ สามารถใช้กับคอร์สเปิดเทอม ตารางติวสอบเข้า โปรโมชั่นรอบใหม่ หรือแนะนำจุดเด่นของ IQON ได้เต็มที่",
        features: [
          "วางรูปหลักหรือโปสเตอร์โปรโมชันได้ 2 จุด",
          "ใช้เป็นส่วนดันปุ่มสมัครเรียนหรือช่องทางติดต่อได้ชัดเจน",
          "คุมโทนสีฟ้า เหลือง ส้ม แดง ให้ตรงกับแบรนด์ IQON",
        ],
      },
      programs: {
        title: "วิชาและคอร์สที่เปิดสอนในสถาบัน",
        body: "สถาบัน IQON เปิดสอนวิชาหลักที่นักเรียนต้องการใช้จริงทั้งในการเรียนที่โรงเรียน และการเตรียมสอบ พร้อมจัดคอร์สให้เลือกตามเป้าหมายของผู้เรียน",
        cards: [
          ["คอร์สพื้นฐาน", "ปูพื้นฐานและเพิ่มความเข้าใจ", "เหมาะสำหรับนักเรียนที่ต้องการจัดระเบียบความรู้เดิมให้แน่นขึ้นและตามบทเรียนได้ทัน", ["คณิตศาสตร์", "วิทยาศาสตร์", "ภาษาอังกฤษ"]],
          ["คอร์สเสริมเนื้อหา", "เพิ่มเนื้อหาให้พร้อมก่อนเรียนจริง", "ช่วยให้นักเรียนเตรียมพร้อมล่วงหน้าและเข้าใจบทเรียนใหม่ได้เร็วขึ้น", ["ฟิสิกส์", "เคมี", "ชีวะ"]],
          ["คอร์สติวสอบเข้า", "เตรียมสอบอย่างมั่นใจ", "เหมาะสำหรับนักเรียนที่ต้องการทบทวนเนื้อหา ฝึกโจทย์ และเตรียมความพร้อมก่อนสอบจริง", ["ติวสอบเข้า", "วัดระดับก่อนเรียนฟรี", "มีสื่อการเรียนรู้ประกอบ"]],
        ],
      },
      approach: {
        title: "แนวทางการเรียนของ IQON",
        body: "สถาบันออกแบบคอร์สให้ตอบโจทย์ทั้งนักเรียนที่ต้องการปูพื้นฐาน เพิ่มเนื้อหา และเตรียมสอบ โดยเริ่มจากการวัดระดับก่อนเรียนเพื่อให้เลือกคอร์สได้เหมาะสม",
        items: [
          ["ฟรี วัดระดับก่อนเรียน", "ช่วยประเมินความพร้อมเบื้องต้นและเลือกแนวทางการเรียนให้เหมาะกับผู้เรียน"],
          ["เรียนได้หลายเป้าหมาย", "รองรับทั้งผู้ที่ต้องการติวสอบเข้า เพิ่มเนื้อหา และปูพื้นฐานใหม่อย่างเป็นขั้นตอน"],
          ["มีสื่อการเรียนรู้ฟรี", "ผู้เรียนได้รับสื่อประกอบการเรียนตามโปรโมชันเปิดสถาบัน"],
          ["สอบถามสะดวกหลายช่องทาง", "โทร, Line, Instagram และ Facebook ได้โดยตรงเพื่อสอบถามรอบเรียนและรายละเอียดเพิ่มเติม"],
        ],
      },
      contact: {
        title: "ติดต่อสถาบันกวดวิชา IQON",
        body: "ใช้แบบฟอร์มนี้เพื่อสอบถามและลงทะเบียนความสนใจเรียนได้ทันที หรือเลือกติดต่อผ่านโทรศัพท์ Line, Instagram และ Facebook ของสถาบันได้เช่นกัน",
        details: [
          "<strong>โทรศัพท์:</strong> 094 174 8919",
          '<strong>Line:</strong> <a href="https://lin.ee/fOA2NDf2" target="_blank" rel="noreferrer">https://lin.ee/fOA2NDf2</a>',
          '<strong>Instagram:</strong> <a href="https://www.instagram.com/iqon_tutor" target="_blank" rel="noreferrer">@iqon_tutor</a>',
          '<strong>Email:</strong> <a href="mailto:iqonchanthaburi@gmail.com">iqonchanthaburi@gmail.com</a>',
          '<strong>Facebook:</strong> <a href="https://www.facebook.com/profile.php?id=61578446523794&locale=th_TH" target="_blank" rel="noreferrer">สถาบันกวดวิชา IQON - ไอคิวออน</a>',
          "<strong>ที่ตั้ง:</strong> 90/9 ถนนท่าหลวง ตำบลวัดใหม่ จังหวัดจันทบุรี 22000",
          "<strong>เวลาเปิดทำการ:</strong> Always open",
        ],
        extraTitle: "ช่องทางสอบถามเพิ่มเติม",
        extraBody: "หากต้องการทราบรอบเรียน รายละเอียดคอร์ส หรือเงื่อนไขโปรโมชันเพิ่มเติม สามารถทักสอบถามได้โดยตรงผ่าน Line และ Facebook Page ของสถาบัน",
        formTitle: "ลงทะเบียนสอบถามคอร์สเรียน",
        labels: ["ชื่อผู้ปกครองหรือนักเรียน", "ระดับชั้น", "รายวิชาที่สนใจ", "เบอร์โทรศัพท์", "รายละเอียดเพิ่มเติม", "เวลาที่สะดวกเพื่อติดต่อ"],
        placeholders: {
          name: "กรอกชื่อ",
          message: "เช่น สนใจคอร์สปูพื้นฐาน หรืออยากสอบถามโปรโมชันเปิดสถาบัน",
        },
        levelOptions: ["เลือกระดับชั้น", "ประถมศึกษา", "มัธยมศึกษาตอนต้น", "มัธยมศึกษาตอนปลาย"],
        subjectOptions: ["เลือกรายวิชา", "คณิตศาสตร์", "วิทยาศาสตร์", "อังกฤษ", "ฟิสิกส์", "เคมี", "ชีวะ", "ติวสอบเข้า", "เพิ่มเนื้อหา", "ปูพื้นฐาน"],
        timeOptions: ["เลือกช่วงเวลาที่สะดวก", "สะดวกทันที", "9 AM - 12 PM", "12 PM - 3 PM", "3 PM - 6 PM", "6 PM - 8 PM"],
        consentContact: "ข้าพเจ้ายินยอมให้สถาบันเก็บข้อมูลเพื่อให้เจ้าหน้าที่ติดต่อกลับเพื่อนำเสนอ",
        consentMore: "รายละเอียดเพิ่มเติม",
        consentContactDetails: [
          "สถาบันจะใช้ข้อมูลที่คุณกรอกไว้เพื่อการติดต่อกลับเกี่ยวกับคอร์สเรียน โปรโมชัน รอบเรียน และการให้คำแนะนำที่เหมาะกับผู้เรียนเท่านั้น",
          "ข้อมูลที่ใช้ได้แก่ ชื่อ ระดับชั้น วิชาที่สนใจ เบอร์โทรศัพท์ เวลาที่สะดวก และรายละเอียดที่คุณพิมพ์เพิ่มเติม โดยจะไม่ถูกนำไปใช้เพื่อวัตถุประสงค์อื่นที่ไม่เกี่ยวข้องกับการให้บริการของ IQON",
        ],
        consentTermsLead: "ข้าพเจ้าได้อ่านและยอมรับ",
        consentTermsButton: "ข้อกำหนดและนโยบายความเป็นส่วนตัว",
        consentTermsDetails: [
          "<strong>ข้อกำหนดการใช้งาน</strong> การส่งแบบฟอร์มนี้ถือว่าผู้กรอกยืนยันว่าข้อมูลที่ให้ไว้เป็นข้อมูลจริง เพื่อให้สถาบันสามารถติดต่อกลับและแนะนำคอร์สเรียนได้อย่างเหมาะสม",
          "<strong>นโยบายความเป็นส่วนตัว</strong> IQON จะเก็บข้อมูลเฉพาะที่จำเป็นต่อการติดต่อกลับและการให้บริการด้านการเรียนการสอนเท่านั้น และจะดูแลข้อมูลอย่างเหมาะสม ไม่เผยแพร่ต่อสาธารณะโดยไม่ได้รับอนุญาต",
          "<strong>ระยะเวลาการเก็บข้อมูล</strong> ข้อมูลจะถูกเก็บไว้ในระบบเท่าที่จำเป็นต่อการติดตามผลการติดต่อและการให้บริการของสถาบัน",
        ],
        responseTitle: "ระยะเวลาติดต่อกลับ",
        responseBody: "เจ้าหน้าที่จะพยายามติดต่อกลับภายใน 1-3 ชั่วโมงในช่วงเวลาทำการที่เลือกไว้ และไม่เกิน 24 ชั่วโมงในกรณีส่งข้อมูลนอกช่วงเวลาทำการ",
        submitButton: "ส่งข้อมูลเพื่อให้สถาบันติดต่อกลับ",
        formNote: 'ข้อมูลจะถูกส่งเข้าสู่ระบบ และสามารถใช้สำหรับติดตามการติดต่อกลับจากสถาบันได้ หากต้องการสอบถามทันทีสามารถติดต่อผ่าน <a class="inline-link" href="https://www.facebook.com/profile.php?id=61578446523794&locale=th_TH" target="_blank" rel="noreferrer">Facebook</a> หรือ <a class="inline-link" href="https://lin.ee/fOA2NDf2" target="_blank" rel="noreferrer">Line</a>',
      },
      footer: {
        title: "สถาบันกวดวิชา IQON - ไอคิวออน",
        body: "เปิดสอนคณิตศาสตร์ วิทยาศาสตร์ อังกฤษ ฟิสิกส์ เคมี และชีวะ พร้อมคอร์สติวสอบเข้า เพิ่มเนื้อหา และปูพื้นฐาน",
        copyright: "© 2026 IQON Tutor. All rights reserved.",
      },
    },
    courses: {
      heroTitle: "เลือกแพ็กเกจคอร์สเรียนที่เหมาะกับเป้าหมายของคุณ",
      heroBody: "หน้าแยกนี้รวบรวมแพ็กเกจคอร์สเดี่ยวและคอร์สคู่ของ IQON ให้ดูง่ายขึ้นแบบคอร์ส catalogue พร้อมราคาเต็ม ราคานักเรียนเก่า และข้อมูลติดต่อสำหรับผู้ที่ต้องการสอบถามรายละเอียดเพิ่มเติม",
      stripLabels: ["ทดลองเรียน", "รวมแล้ว"],
      stripValues: ["วัดระดับฟรี 1 ชั่วโมง / วิชา", "ค่าเอกสารประกอบการเรียน"],
      panelBadge: "Recommended",
      panelTitle: "แพ็กเกจคอร์สคู่",
      panelBody: "เหมาะสำหรับผู้เรียนที่ต้องการความคุ้มค่าและเรียนต่อเนื่องเป็นระบบ",
      panelPriceStrong: "เริ่มต้น 3,899",
      panelPriceUnit: "บาท",
      panelList: ["15 ชั่วโมง / 1 วิชา", "นักเรียนเก่า 3,700 บาท", "เหมาะกับผู้ที่ต้องการปูพื้นฐานและพัฒนาผลการเรียน"],
      catalogTitle: "คอร์สราคาเรียนของ IQON",
      catalogBody: "เลือกดูแพ็กเกจคอร์สเดี่ยวและคอร์สคู่ของสถาบันได้ในหน้านี้ พร้อมราคาเต็ม ราคานักเรียนเก่า และรายละเอียดชั่วโมงเรียนแบบอ่านง่าย เพื่อให้ตัดสินใจได้สะดวกขึ้นก่อนทักมาสอบถามเพิ่มเติม",
      groupHeadings: [
        ["คอร์สเดี่ยว", "แพ็กเกจสำหรับผู้เรียนที่ต้องการโฟกัสรายวิชาแบบชัดเจน"],
        ["คอร์สคู่", "แพ็กเกจสำหรับผู้เรียนที่ต้องการความคุ้มค่าและเรียนต่อเนื่องเป็นระบบ"],
      ],
      ctaTitle: "สอบถามคอร์สที่เหมาะกับคุณ พร้อมทดลองเรียนวัดระดับฟรี",
      ctaBody: "ถ้ายังไม่แน่ใจว่าควรเริ่มที่แพ็กเกจไหน สามารถทักสอบถามกับสถาบันได้ทันที ทีมงานจะช่วยแนะนำแนวทางที่เหมาะกับเป้าหมายของผู้เรียนมากที่สุด",
      ctaButtons: ["ปรึกษาผ่าน Line", "สอบถามผ่าน Facebook", "กลับไปหน้าแบบฟอร์มหลัก"],
      modalTag: "LINE PACKAGE CONNECT",
      modalSummary: "เตรียมเปิดแชต Line พร้อมข้อความแพ็กเกจที่เลือกไว้ให้แล้ว",
      modalMeta: ["ชั่วโมงเรียน", "ราคา"],
      modalNote: "ถ้าเปิดจากมือถือ กดเพิ่มเพื่อนและเปิดแชตได้ทันที ถ้าเปิดจากคอม สามารถสแกนหรือบันทึก QR Code ด้านขวาไว้ใช้ได้",
      modalQr: "สแกน QR นี้เพื่อเพิ่มเพื่อน แล้วเปิดแชตพร้อมข้อความแพ็กเกจที่สนใจได้ทันที",
      footer: {
        title: "สถาบันกวดวิชา IQON - ไอคิวออน",
        body: "เปิดสอนคณิตศาสตร์ วิทยาศาสตร์ อังกฤษ ฟิสิกส์ เคมี และชีวะ พร้อมคอร์สติวสอบเข้า เพิ่มเนื้อหา และปูพื้นฐาน",
        copyright: "© 2026 IQON Tutor. All rights reserved.",
      },
      cards: [
        ["คอร์สเดี่ยว", "เหมาะสำหรับ 1 วิชา", "แพ็กเกจเดี่ยว", "เหมาะสำหรับผู้เรียนที่ต้องการเก็บพื้นฐานหรือเพิ่มความแม่นยำในวิชาเดียวแบบเข้มข้น", "12 ชั่วโมง", "1 วิชา", "4,599 บาท", "นักเรียนเก่า 4,350 บาท", "สอบถามแพ็กเกจนี้", "แพ็กเกจเดี่ยว", "12 ชั่วโมง / 1 วิชา", "4,599 บาท", "นักเรียนเก่า 4,350 บาท", "สวัสดีค่ะ สนใจแพ็กเกจเดี่ยว 12 ชั่วโมง / 1 วิชา ราคา 4,599 บาท รบกวนขอรายละเอียดเพิ่มเติมของคอร์สนี้ค่ะ"],
        ["คอร์สเดี่ยว", "เรียน 2 วิชา", "แพ็กเกจเดี่ยว 2 คอร์ส", "เหมาะกับผู้เรียนที่ต้องการเรียนต่อเนื่องหลายวิชา พร้อมชั่วโมงโบนัสเพิ่มเติม", "24 (+6) ชั่วโมง", "รวมชั่วโมงโบนัส", "9,200 บาท", "นักเรียนเก่า 9,000 บาท", "สอบถามแพ็กเกจนี้", "แพ็กเกจเดี่ยว 2 คอร์ส", "24 (+6) ชั่วโมง", "9,200 บาท", "นักเรียนเก่า 9,000 บาท", "สวัสดีค่ะ สนใจแพ็กเกจเดี่ยว 2 คอร์ส 24 (+6) ชั่วโมง ราคา 9,200 บาท รบกวนขอรายละเอียดเพิ่มเติมของคอร์สนี้ค่ะ"],
        ["คอร์สเดี่ยว", "เรียน 3 วิชา", "แพ็กเกจเดี่ยว 3 คอร์ส", "เหมาะกับผู้ที่ต้องการจัดแผนเรียนหลายวิชาในรอบเดียว เพื่อเตรียมสอบหรือเร่งผลลัพธ์", "36 (+9) ชั่วโมง", "รวมชั่วโมงโบนัส", "13,500 บาท", "นักเรียนเก่า 13,300 บาท", "สอบถามแพ็กเกจนี้", "แพ็กเกจเดี่ยว 3 คอร์ส", "36 (+9) ชั่วโมง", "13,500 บาท", "นักเรียนเก่า 13,300 บาท", "สวัสดีค่ะ สนใจแพ็กเกจเดี่ยว 3 คอร์ส 36 (+9) ชั่วโมง ราคา 13,500 บาท รบกวนขอรายละเอียดเพิ่มเติมของคอร์สนี้ค่ะ"],
        ["คอร์สคู่", "เหมาะสำหรับ 1 วิชา", "แพ็กเกจคู่", "เหมาะกับผู้เรียนที่ต้องการเรียนแบบเป็นคอร์สคุ้มค่า พร้อมชั่วโมงเรียนต่อเนื่อง", "15 ชั่วโมง", "1 วิชา", "3,899 บาท", "นักเรียนเก่า 3,700 บาท", "สอบถามแพ็กเกจนี้", "แพ็กเกจคู่", "15 ชั่วโมง / 1 วิชา", "3,899 บาท", "นักเรียนเก่า 3,700 บาท", "สวัสดีค่ะ สนใจแพ็กเกจคู่ 15 ชั่วโมง / 1 วิชา ราคา 3,899 บาท รบกวนขอรายละเอียดเพิ่มเติมของคอร์สนี้ค่ะ"],
        ["คอร์สคู่", "เรียน 2 วิชา", "แพ็กเกจคู่ 2 คอร์ส", "ทางเลือกสำหรับผู้เรียนที่ต้องการกระจายเวลาเรียนใน 2 วิชาอย่างสมดุล", "30 ชั่วโมง", "2 วิชา", "7,500 บาท", "นักเรียนเก่า 7,400 บาท", "สอบถามแพ็กเกจนี้", "แพ็กเกจคู่ 2 คอร์ส", "30 ชั่วโมง / 2 วิชา", "7,500 บาท", "นักเรียนเก่า 7,400 บาท", "สวัสดีค่ะ สนใจแพ็กเกจคู่ 2 คอร์ส 30 ชั่วโมง / 2 วิชา ราคา 7,500 บาท รบกวนขอรายละเอียดเพิ่มเติมของคอร์สนี้ค่ะ"],
        ["คอร์สคู่", "เรียน 3 วิชา", "แพ็กเกจคู่ 3 คอร์ส", "เหมาะกับผู้เรียนที่ต้องการแผนเรียนหลายวิชาในราคาแพ็กเกจที่คุ้มค่ามากขึ้น", "45 ชั่วโมง", "3 วิชา", "11,000 บาท", "นักเรียนเก่า 10,000 บาท", "สอบถามแพ็กเกจนี้", "แพ็กเกจคู่ 3 คอร์ส", "45 ชั่วโมง / 3 วิชา", "11,000 บาท", "นักเรียนเก่า 10,000 บาท", "สวัสดีค่ะ สนใจแพ็กเกจคู่ 3 คอร์ส 45 ชั่วโมง / 3 วิชา ราคา 11,000 บาท รบกวนขอรายละเอียดเพิ่มเติมของคอร์สนี้ค่ะ"],
      ],
    },
  },
  en: {
    home: {
      newsHeading: "Latest Highlights and Promotion Area",
      newsCards: [
        ["Enrollment Open | New Term", "Foundation and lesson extension courses", "Use this block for the latest institute news or a poster for a new intake."],
        ["Activities | Video", "A short video review of the classroom atmosphere or student achievements", "This position works well for a still image or a landscape video to make the website feel more alive and trustworthy."],
        ["Promotion | Grand Opening", "Updated prices with a free placement trial", "Packages start at 4,599 THB for solo courses and 3,899 THB for pair packages, with special pricing for returning students."],
      ],
      story: {
        eyebrow: "Teaching Experience",
        title: "IQON learning is designed to be clear, structured, and effective for real outcomes",
        paragraphs: [
          "We focus on helping students understand lessons step by step, from strengthening foundations and extending content to exam preparation, with clear explanations and guided practice.",
          "IQON courses are arranged to match different goals, whether students want to prepare for entrance exams, improve school grades, or build confidence in a specific subject.",
        ],
        overlayTitle: "IQON introduction video",
        overlayBody: "This clip is loaded from the Video Feature.mp4 file in the project video folder.",
      },
      promo: {
        title: "A large campaign zone for your featured course or enrollment campaign",
        body: "This block is designed to stand out like a premium campaign section. It can highlight a new term opening, exam-prep schedule, special promotion, or the core strengths of IQON.",
        features: [
          "Display two major visual spots for posters or campaign images",
          "Use this area to drive enrollment and contact actions clearly",
          "Keep the blue, yellow, orange, and red IQON brand palette consistent",
        ],
      },
      programs: {
        title: "Subjects and course formats available at IQON",
        body: "IQON teaches the core subjects students truly need for school learning and exam preparation, with course formats matched to each learner's goal.",
        cards: [
          ["Foundation Course", "Build foundations and understanding", "Designed for students who need to strengthen prior knowledge and keep up with current lessons.", ["Mathematics", "Science", "English"]],
          ["Content Boost Course", "Advance before the next lesson", "Helps students prepare ahead and understand new school content more quickly.", ["Physics", "Chemistry", "Biology"]],
          ["Exam Preparation", "Prepare with confidence", "Ideal for students who need review, practice, and strong preparation before real exams.", ["Entrance Exam Prep", "Free Placement Trial", "Free learning materials included"]],
        ],
      },
      approach: {
        title: "The IQON teaching approach",
        body: "Our courses are designed for students who need foundation building, content extension, or exam preparation, beginning with a placement check to choose the most suitable path.",
        items: [
          ["Free placement before studying", "Helps assess readiness and choose the right study plan for each learner."],
          ["Built for multiple goals", "Supports entrance exam prep, content extension, and fresh foundation building step by step."],
          ["Free learning materials", "Students receive supporting materials based on the institute opening promotion."],
          ["Easy to contact through many channels", "Reach us directly by phone, Line, Instagram, or Facebook for schedules and details."],
        ],
      },
      contact: {
        title: "Contact IQON Tutor Academy",
        body: "Use this form to register your interest immediately, or contact the institute directly by phone, Line, Instagram, or Facebook.",
        details: [
          "<strong>Phone:</strong> 094 174 8919",
          '<strong>Line:</strong> <a href="https://lin.ee/fOA2NDf2" target="_blank" rel="noreferrer">https://lin.ee/fOA2NDf2</a>',
          '<strong>Instagram:</strong> <a href="https://www.instagram.com/iqon_tutor" target="_blank" rel="noreferrer">@iqon_tutor</a>',
          '<strong>Email:</strong> <a href="mailto:iqonchanthaburi@gmail.com">iqonchanthaburi@gmail.com</a>',
          '<strong>Facebook:</strong> <a href="https://www.facebook.com/profile.php?id=61578446523794&locale=th_TH" target="_blank" rel="noreferrer">IQON Tutor Academy</a>',
          "<strong>Location:</strong> 90/9 Tha Luang Road, Wat Mai, Chanthaburi 22000",
          "<strong>Opening Hours:</strong> Always open",
        ],
        extraTitle: "More ways to ask us",
        extraBody: "If you would like to know more about schedules, course details, or current promotions, you can message us directly through Line and Facebook Page.",
        formTitle: "Course inquiry form",
        labels: ["Parent or student name", "Student level", "Subject of interest", "Phone number", "Additional details", "Preferred contact time"],
        placeholders: {
          name: "Enter your name",
          message: "For example: interested in a foundation course or asking about the opening promotion",
        },
        levelOptions: ["Select student level", "Primary School", "Lower Secondary", "Upper Secondary"],
        subjectOptions: ["Select a subject", "Mathematics", "Science", "English", "Physics", "Chemistry", "Biology", "Entrance Exam Prep", "Content Boost", "Foundation"],
        timeOptions: ["Select a preferred time", "Any time now", "9 AM - 12 PM", "12 PM - 3 PM", "3 PM - 6 PM", "6 PM - 8 PM"],
        consentContact: "I allow the institute to store my information so a staff member can contact me with suitable recommendations and details",
        consentMore: "More details",
        consentContactDetails: [
          "The institute will use your submitted information only to contact you about courses, promotions, schedules, and suitable academic recommendations.",
          "This may include your name, level, interested subject, phone number, preferred time, and any extra details you type, and it will not be used for unrelated purposes.",
        ],
        consentTermsLead: "I have read and accept the",
        consentTermsButton: "terms and privacy policy",
        consentTermsDetails: [
          "<strong>Terms of Use</strong> By submitting this form, you confirm that the information provided is accurate so the institute can contact you and recommend the right course.",
          "<strong>Privacy Policy</strong> IQON stores only the information necessary for contact and educational service support, and does not disclose it publicly without permission.",
          "<strong>Retention Period</strong> Your information will be stored only as long as needed for follow-up and institute service purposes.",
        ],
        responseTitle: "Expected reply time",
        responseBody: "Our staff will try to contact you within 1-3 hours during your selected working period, and within 24 hours if the form is submitted outside working hours.",
        submitButton: "Send inquiry for staff follow-up",
        formNote: 'Your information will be saved in the system for follow-up. If you need immediate help, contact us via <a class="inline-link" href="https://www.facebook.com/profile.php?id=61578446523794&locale=th_TH" target="_blank" rel="noreferrer">Facebook</a> or <a class="inline-link" href="https://lin.ee/fOA2NDf2" target="_blank" rel="noreferrer">Line</a>',
      },
      footer: {
        title: "IQON Tutor Academy",
        body: "We teach Mathematics, Science, English, Physics, Chemistry, and Biology, with entrance exam prep, content extension, and foundation courses.",
        copyright: "© 2026 IQON Tutor. All rights reserved.",
      },
    },
    courses: {
      heroTitle: "Choose the course package that matches your goal",
      heroBody: "This page collects IQON solo and pair course packages in a clearer catalogue format, including full price, returning-student price, and contact options for further details.",
      stripLabels: ["Trial Class", "Included"],
      stripValues: ["Free 1-hour placement class / subject", "Learning document package"],
      panelBadge: "Recommended",
      panelTitle: "Pair Course Package",
      panelBody: "Recommended for learners who want better value and continuous study in a clear structure.",
      panelPriceStrong: "Starts at 3,899",
      panelPriceUnit: "THB",
      panelList: ["15 hours / 1 subject", "Returning student 3,700 THB", "Great for foundation building and steady academic growth"],
      catalogTitle: "IQON course price catalogue",
      catalogBody: "Browse all solo and pair course packages in one place with readable study hours, full price, and returning-student price before you contact us for details.",
      groupHeadings: [
        ["Solo Course", "Packages for learners who want a clear single-subject focus"],
        ["Pair Course", "Packages for learners who want better value and continuous study"],
      ],
      ctaTitle: "Ask about the best course for you and enjoy a free placement trial",
      ctaBody: "If you are not sure which package to start with, message the institute directly and our team will recommend the best fit for your learning goal.",
      ctaButtons: ["Consult via Line", "Ask via Facebook", "Back to the main contact form"],
      modalTag: "LINE PACKAGE CONNECT",
      modalSummary: "Prepare to open Line chat with your selected package message.",
      modalMeta: ["Study Hours", "Price"],
      modalNote: "On mobile, you can add the account and open chat instantly. On desktop, you can scan or save the QR Code on the right.",
      modalQr: "Scan this QR to add the account and continue to the package chat instantly.",
      footer: {
        title: "IQON Tutor Academy",
        body: "We teach Mathematics, Science, English, Physics, Chemistry, and Biology, with entrance exam prep, content extension, and foundation courses.",
        copyright: "© 2026 IQON Tutor. All rights reserved.",
      },
      cards: [
        ["Solo Course", "For 1 subject", "Solo Package", "Perfect for learners who want to strengthen foundations or improve accuracy in one subject intensively.", "12 hours", "1 subject", "4,599 THB", "Returning student 4,350 THB", "Ask about this package", "Solo Package", "12 hours / 1 subject", "4,599 THB", "Returning student 4,350 THB", "Hello, I am interested in the Solo Package, 12 hours / 1 subject, priced at 4,599 THB. Could you please share more details?"],
        ["Solo Course", "Study 2 subjects", "Solo Package 2 Courses", "Ideal for learners who want to study several subjects continuously with bonus hours included.", "24 (+6) hours", "Bonus hours included", "9,200 THB", "Returning student 9,000 THB", "Ask about this package", "Solo Package 2 Courses", "24 (+6) hours", "9,200 THB", "Returning student 9,000 THB", "Hello, I am interested in the Solo Package 2 Courses, 24 (+6) hours, priced at 9,200 THB. Could you please share more details?"],
        ["Solo Course", "Study 3 subjects", "Solo Package 3 Courses", "Suitable for learners who need a multi-subject study plan in one round to prepare for exams or accelerate results.", "36 (+9) hours", "Bonus hours included", "13,500 THB", "Returning student 13,300 THB", "Ask about this package", "Solo Package 3 Courses", "36 (+9) hours", "13,500 THB", "Returning student 13,300 THB", "Hello, I am interested in the Solo Package 3 Courses, 36 (+9) hours, priced at 13,500 THB. Could you please share more details?"],
        ["Pair Course", "For 1 subject", "Pair Package", "Great for learners who want a more cost-effective package with continuous study hours.", "15 hours", "1 subject", "3,899 THB", "Returning student 3,700 THB", "Ask about this package", "Pair Package", "15 hours / 1 subject", "3,899 THB", "Returning student 3,700 THB", "Hello, I am interested in the Pair Package, 15 hours / 1 subject, priced at 3,899 THB. Could you please share more details?"],
        ["Pair Course", "Study 2 subjects", "Pair Package 2 Courses", "A balanced option for learners who want to divide study time across two subjects.", "30 hours", "2 subjects", "7,500 THB", "Returning student 7,400 THB", "Ask about this package", "Pair Package 2 Courses", "30 hours / 2 subjects", "7,500 THB", "Returning student 7,400 THB", "Hello, I am interested in the Pair Package 2 Courses, 30 hours / 2 subjects, priced at 7,500 THB. Could you please share more details?"],
        ["Pair Course", "Study 3 subjects", "Pair Package 3 Courses", "Ideal for learners who want a multi-subject plan with stronger overall value.", "45 hours", "3 subjects", "11,000 THB", "Returning student 10,000 THB", "Ask about this package", "Pair Package 3 Courses", "45 hours / 3 subjects", "11,000 THB", "Returning student 10,000 THB", "Hello, I am interested in the Pair Package 3 Courses, 45 hours / 3 subjects, priced at 11,000 THB. Could you please share more details?"],
      ],
    },
  },
};

const syncLocalizedContent = () => {
  const pageSet = localizedPages[currentLanguage];
  if (!pageSet) {
    return;
  }

  if (document.body.classList.contains("courses-page")) {
    const content = pageSet.courses;
    setText(".courses-hero-copy .eyebrow", currentLanguage === "en" ? "Courses" : "คอร์สเรียน");
    setText(".courses-hero-copy h1", content.heroTitle);
    setText(".courses-hero-text", content.heroBody);
    setTexts(".courses-info-strip .meta-label", content.stripLabels);
    setTexts(".courses-info-strip strong", content.stripValues);
    setText(".courses-panel-badge", content.panelBadge);
    setText(".courses-panel-card h2", content.panelTitle);
    setText(".courses-panel-card p", content.panelBody);
    setText(".courses-panel-price strong", content.panelPriceStrong);
    setText(".courses-panel-price span", content.panelPriceUnit);
    setTexts(".courses-panel-list li", content.panelList);
    setText(".courses-catalog .section-heading .eyebrow", currentLanguage === "en" ? "Course Catalog" : "ตารางคอร์ส");
    setText(".courses-catalog .section-heading h2", content.catalogTitle);
    setText(".courses-catalog .section-heading p:last-child", content.catalogBody);
    setTexts(".course-group-heading .schedule-badge", content.groupHeadings.map((item) => item[0]));
    setTexts(".course-group-heading h3", content.groupHeadings.map((item) => item[1]));

    const cards = document.querySelectorAll(".course-card");
    const triggers = document.querySelectorAll(".course-line-trigger");
    cards.forEach((card, index) => {
      const item = content.cards[index];
      if (!item) {
        return;
      }

      const [chip, level, title, desc, hoursStrong, hoursSub, priceStrong, priceSub, buttonText, dataPackage, dataHours, dataPrice, dataOldPrice, dataMessage] = item;
      const chipElement = card.querySelector(".course-chip");
      const levelElement = card.querySelector(".course-level");
      const titleElement = card.querySelector("h3");
      const descElement = card.querySelector("p");
      const strongElements = card.querySelectorAll(".course-detail-list strong");
      const subElements = card.querySelectorAll(".course-detail-list span");
      const button = triggers[index];

      if (chipElement) chipElement.textContent = chip;
      if (levelElement) levelElement.textContent = level;
      if (titleElement) titleElement.textContent = title;
      if (descElement) descElement.textContent = desc;
      if (strongElements[0]) strongElements[0].textContent = hoursStrong;
      if (subElements[0]) subElements[0].textContent = hoursSub;
      if (strongElements[1]) strongElements[1].textContent = priceStrong;
      if (subElements[1]) subElements[1].textContent = priceSub;

      if (button) {
        button.textContent = buttonText;
        button.dataset.package = dataPackage;
        button.dataset.hours = dataHours;
        button.dataset.price = dataPrice;
        button.dataset.oldPrice = dataOldPrice;
        button.dataset.message = dataMessage;
      }
    });

    setText(".courses-cta-copy .eyebrow", currentLanguage === "en" ? "Free Assessment" : "ทดลองเรียนฟรี");
    setText(".courses-cta-copy h2", content.ctaTitle);
    setText(".courses-cta-copy p:last-child", content.ctaBody);
    setTexts(".courses-cta-actions .button", content.ctaButtons);
    setText(".line-package-tag", content.modalTag);
    setText("#line-package-summary", content.modalSummary);
    setTexts(".line-package-meta span", content.modalMeta);
    setText(".line-package-note", content.modalNote);
    setText(".line-package-qr-card p", content.modalQr);
    setText(".site-footer strong", content.footer.title);
    setText(".site-footer .footer-grid div p", content.footer.body);
    setText(".site-footer .footer-grid > p", content.footer.copyright);

    const coursesQuickButtons = document.querySelectorAll(".support-quick-actions button");
    if (coursesQuickButtons[0]) coursesQuickButtons[0].dataset.quickMessage = currentLanguage === "en" ? "I am interested in the solo package." : "สนใจแพ็กเกจเดี่ยวค่ะ";
    if (coursesQuickButtons[1]) coursesQuickButtons[1].dataset.quickMessage = currentLanguage === "en" ? "I am interested in the pair package." : "สนใจแพ็กเกจคู่ค่ะ";
    if (coursesQuickButtons[2]) coursesQuickButtons[2].dataset.quickMessage = currentLanguage === "en" ? "Please recommend the best package for me." : "ช่วยแนะนำแพ็กเกจที่เหมาะกับฉันหน่อยค่ะ";
    return;
  }

  const content = pageSet.home;
  setTexts(".news-hub-header .eyebrow, .story-copy .eyebrow, .promo-copy .eyebrow, #programs .section-heading .eyebrow, #approach .section-heading .eyebrow, .contact-copy .eyebrow", currentLanguage === "en"
    ? ["Latest Highlights", "Teaching Experience", "Your Campaign Zone", "Academic Programs", "Teaching Approach", "Contact & Registration"]
    : ["ไฮไลต์ล่าสุด", "ประสบการณ์การสอน", "พื้นที่โปรโมตหลัก", "หลักสูตรวิชาที่เปิดสอน", "แนวทางการสอน", "ติดต่อและลงทะเบียน"]);
  setTexts(".news-card-media span", currentLanguage === "en"
    ? ["News / Poster 01", "Video / Activity 02", "Promotion 03"]
    : ["ข่าว / โปสเตอร์ 01", "วิดีโอ / กิจกรรม 02", "โปรโมชัน 03"]);
  setText(".news-hub-header h2", content.newsHeading);
  document.querySelectorAll(".news-card").forEach((card, index) => {
    const item = content.newsCards[index];
    if (!item) {
      return;
    }

    const [meta, title, body] = item;
    const metaEl = card.querySelector(".news-meta");
    const titleEl = card.querySelector("h3");
    const bodyEl = card.querySelector("p:last-child");
    if (metaEl) metaEl.textContent = meta;
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = body;
  });

  setText(".story-copy h2", content.story.title);
  const storyParagraphs = document.querySelectorAll(".story-copy > p");
  if (storyParagraphs[1]) storyParagraphs[1].textContent = content.story.paragraphs[0];
  if (storyParagraphs[2]) storyParagraphs[2].textContent = content.story.paragraphs[1];
  setText(".story-media-tag", currentLanguage === "en" ? "Image or Video Feature" : "ภาพหรือวิดีโอแนะนำ");
  setText(".story-media-overlay strong", content.story.overlayTitle);
  setText(".story-media-overlay p", content.story.overlayBody);

  setText(".promo-copy h2", content.promo.title);
  setText(".promo-copy p:last-of-type", content.promo.body);
  setTexts(".promo-feature-list li", content.promo.features);

  setText("#programs .section-heading h2", content.programs.title);
  setText("#programs .section-heading p:last-child", content.programs.body);
  document.querySelectorAll(".program-card").forEach((card, index) => {
    const item = content.programs.cards[index];
    if (!item) {
      return;
    }

    const [tag, title, body, list] = item;
    const tagEl = card.querySelector(".card-tag");
    const titleEl = card.querySelector("h3");
    const bodyEl = card.querySelector("p");
    const listEls = card.querySelectorAll("li");
    if (tagEl) tagEl.textContent = tag;
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = body;
    listEls.forEach((li, i) => {
      if (list[i] !== undefined) {
        li.textContent = list[i];
      }
    });
  });

  setText("#approach .section-heading h2", content.approach.title);
  setText("#approach .section-heading p:last-child", content.approach.body);
  document.querySelectorAll(".approach-item").forEach((item, index) => {
    const pair = content.approach.items[index];
    if (!pair) {
      return;
    }
    const [title, body] = pair;
    const titleEl = item.querySelector("h3");
    const bodyEl = item.querySelector("p");
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = body;
  });

  setText(".contact-copy h2", content.contact.title);
  setText(".contact-copy > p:last-of-type", content.contact.body);
  document.querySelectorAll(".contact-details p").forEach((p, index) => {
    if (content.contact.details[index] !== undefined) {
      p.innerHTML = content.contact.details[index];
    }
  });
  setText(".contact-box h3", content.contact.extraTitle);
  setText(".contact-box p", content.contact.extraBody);
  setText("#contact-form h3", content.contact.formTitle);
  setLabelText('#contact-form label:nth-of-type(1)', content.contact.labels[0]);
  setLabelText('#contact-form label:nth-of-type(2)', content.contact.labels[1]);
  setLabelText('#contact-form label:nth-of-type(3)', content.contact.labels[2]);
  setLabelText('#contact-form label:nth-of-type(4)', content.contact.labels[3]);
  setLabelText('#contact-form label:nth-of-type(5)', content.contact.labels[4]);
  setLabelText('#contact-form label:nth-of-type(6)', content.contact.labels[5]);
  setAttributeValue('input[name="name"]', "placeholder", content.contact.placeholders.name);
  setAttributeValue('textarea[name="message"]', "placeholder", content.contact.placeholders.message);
  setSelectOptions('select[name="level"]', content.contact.levelOptions);
  setSelectOptions('select[name="subject"]', content.contact.subjectOptions);
  setSelectOptions('select[name="preferred_time"]', content.contact.timeOptions);
  setLeadingText('.consent-row:nth-of-type(1) span', content.contact.consentContact);
  setText('[data-toggle-target="consent-contact-details"]', content.contact.consentMore);
  setHtml('#consent-contact-details p:nth-of-type(1)', content.contact.consentContactDetails[0]);
  setHtml('#consent-contact-details p:nth-of-type(2)', content.contact.consentContactDetails[1]);
  setLeadingText('.consent-row:nth-of-type(2) span', content.contact.consentTermsLead);
  setText('[data-toggle-target="consent-terms-details"]', content.contact.consentTermsButton);
  setHtml('#consent-terms-details p:nth-of-type(1)', content.contact.consentTermsDetails[0]);
  setHtml('#consent-terms-details p:nth-of-type(2)', content.contact.consentTermsDetails[1]);
  setHtml('#consent-terms-details p:nth-of-type(3)', content.contact.consentTermsDetails[2]);
  setText('.contact-response-note strong', content.contact.responseTitle);
  setText('.contact-response-note p', content.contact.responseBody);
  setText('#contact-form .button-primary[type="submit"]', content.contact.submitButton);
  setHtml('.form-note', content.contact.formNote);
  setText('.site-footer strong', content.footer.title);
  setText('.site-footer .footer-grid div p', content.footer.body);
  setText('.site-footer .footer-grid > p', content.footer.copyright);

  const homeQuickButtons = document.querySelectorAll(".support-quick-actions button");
  if (homeQuickButtons[0]) homeQuickButtons[0].dataset.quickMessage = currentLanguage === "en" ? "I am interested in Mathematics." : "สนใจคอร์สคณิตศาสตร์ค่ะ";
  if (homeQuickButtons[1]) homeQuickButtons[1].dataset.quickMessage = currentLanguage === "en" ? "I would like to know the latest promotion." : "อยากทราบโปรโมชันล่าสุดค่ะ";
  if (homeQuickButtons[2]) homeQuickButtons[2].dataset.quickMessage = currentLanguage === "en" ? "Please recommend a course suitable for my level." : "ขอให้ทีมงานแนะนำคอร์สที่เหมาะกับระดับชั้นค่ะ";
};

const getInitialLanguage = () => {
  const savedLanguage = safeStorage.get(LANGUAGE_STORAGE_KEY);
  return savedLanguage === "en" ? "en" : "th";
};

const applyLanguage = (language) => {
  currentLanguage = language === "en" ? "en" : "th";
  safeStorage.set(LANGUAGE_STORAGE_KEY, currentLanguage);
  document.documentElement.lang = currentLanguage;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const value = translations[currentLanguage][key];
    if (value) {
      element.textContent = value;
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    const value = translations[currentLanguage][key];
    if (value) {
      element.setAttribute("placeholder", value);
    }
  });

  languageButtons.forEach((button) => {
    const isActive = button.dataset.langOption === currentLanguage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  if (window.location.pathname.includes("courses")) {
    document.title = translations[currentLanguage].title_courses;
  } else {
    document.title = translations[currentLanguage].title_home;
  }

  syncLocalizedContent();

  if (supportConversationId) {
    loadSupportMessages({
      silent: true,
    });
  }
};

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

const createConversationId = () => {
  const uuid =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now()}${Math.random().toString(36).slice(2, 12)}`;
  return `iqon_${uuid}`.slice(0, 80);
};

const ensureSupportConversationId = () => {
  let conversationId = safeStorage.get(SUPPORT_CONVERSATION_KEY);
  if (!conversationId) {
    conversationId = createConversationId();
    safeStorage.set(SUPPORT_CONVERSATION_KEY, conversationId);
  }
  return conversationId;
};

const getSourcePage = () => window.location.pathname || "/";

const setSupportStatus = (message = "", variant = "") => {
  if (!supportStatus) {
    return;
  }

  supportStatus.textContent = message;
  supportStatus.className = variant ? `support-status ${variant}` : "support-status";
};

const formatChatTime = (value) => {
  if (!value) {
    return "ตอนนี้";
  }

  try {
    return new Date(value).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return value;
  }
};

const buildSystemGreeting = () => {
  const isCoursesPage = window.location.pathname.includes("courses");
  if (currentLanguage === "en") {
    return isCoursesPage
      ? "Hello. If you are not sure which package fits you, send us a message here and our team can reply directly from the admin dashboard."
      : "Hello. If you are interested in IQON courses or promotions, leave your question here and our team can reply directly in this chat.";
  }

  return isCoursesPage
    ? "สวัสดีค่ะ หากยังไม่แน่ใจว่าจะเลือกแพ็กเกจไหน สามารถพิมพ์ถามไว้ได้เลย ทีมงานจะตอบกลับจากหลังบ้านในเว็บนี้โดยตรงค่ะ"
    : "สวัสดีค่ะ หากสนใจคอร์สเรียนหรือโปรโมชันของ IQON สามารถพิมพ์คำถามไว้ได้เลย ทีมงานจะตอบกลับจากหลังบ้านในเว็บนี้โดยตรงค่ะ";
};

const createSupportMessageElement = ({ sender, message, created_at: createdAt }) => {
  const bubble = document.createElement("div");
  bubble.className = `support-message support-message-${sender}`;
  const meta = document.createElement("div");
  meta.className = "support-message-meta";

  const senderLabel = document.createElement("span");
  senderLabel.className = "support-sender";
  senderLabel.textContent =
    sender === "admin" ? "ทีมงาน IQON" : sender === "user" ? "คุณ" : "IQON Assistant";

  const timeLabel = document.createElement("span");
  timeLabel.className = "support-time";
  timeLabel.textContent = sender === "system" ? "วันนี้" : formatChatTime(createdAt);

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  meta.appendChild(senderLabel);
  meta.appendChild(timeLabel);
  bubble.appendChild(meta);
  bubble.appendChild(paragraph);
  return bubble;
};

const renderSupportMessages = (messages) => {
  if (!supportThread) {
    return;
  }

  supportThread.innerHTML = "";
  supportThread.appendChild(
    createSupportMessageElement({
      sender: "system",
      message: buildSystemGreeting(),
    }),
  );

  messages.forEach((item) => {
    supportThread.appendChild(createSupportMessageElement(item));
  });

  supportThread.scrollTop = supportThread.scrollHeight;
};

const fetchSupportMessages = async () => {
  const response = await fetch(
    `/api/chat/messages?conversation_id=${encodeURIComponent(supportConversationId)}`,
  );
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Chat load failed");
  }

  return payload.messages || [];
};

const loadSupportMessages = async ({ silent = false } = {}) => {
  if (!supportThread || !supportConversationId) {
    return;
  }

  try {
    const messages = await fetchSupportMessages();
    renderSupportMessages(messages);

    if (!silent && messages.length) {
      setSupportStatus(getText("support_status_connected"), "is-success");
    } else if (!messages.length && !silent) {
      setSupportStatus(getText("support_status_start"), "");
    }
  } catch (error) {
    if (!silent) {
      setSupportStatus(getText("support_status_load_error"), "is-error");
    }
  }
};

const sendSupportMessage = async (message) => {
  const response = await fetch("/api/chat/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      conversation_id: supportConversationId,
      source_page: getSourcePage(),
      message,
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Send failed");
  }

  return payload;
};

if (contactForm) {
  contactForm.noValidate = true;
}

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.langOption || "th");
  });
});

applyLanguage(getInitialLanguage());

consentInlineToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    const targetId = String(toggle.dataset.toggleTarget || "").trim();
    if (!targetId) {
      return;
    }

    const targetPanel = document.getElementById(targetId);
    if (!targetPanel) {
      return;
    }

    const isHidden = targetPanel.classList.toggle("hidden");
    toggle.setAttribute("aria-expanded", String(!isHidden));
  });
});

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

if (supportWidget && supportPanel && supportOpen) {
  supportConversationId = ensureSupportConversationId();

  const setSupportState = (isOpen) => {
    supportPanel.classList.toggle("hidden", !isOpen);
    supportOpen.setAttribute("aria-expanded", String(isOpen));

    if (isOpen) {
      loadSupportMessages({
        silent: true,
      });
    }
  };

  const setContactMenuState = (isOpen) => {
    if (!contactMenuOpen || !contactMenuLinks) {
      return;
    }

    contactMenuLinks.classList.toggle("hidden", !isOpen);
    contactMenuOpen.setAttribute("aria-expanded", String(isOpen));
  };

  supportOpen.addEventListener("click", () => {
    const isOpen = supportPanel.classList.contains("hidden");
    setSupportState(isOpen);
    setContactMenuState(false);
  });

  supportClose?.addEventListener("click", () => {
    setSupportState(false);
  });

  contactMenuOpen?.addEventListener("click", () => {
    const isOpen = contactMenuLinks?.classList.contains("hidden");
    setContactMenuState(Boolean(isOpen));
    setSupportState(false);
  });

  contactMenuLinks?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      setContactMenuState(false);
    });
  });

  supportQuickButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!supportInput) {
        return;
      }

      supportInput.value = String(button.dataset.quickMessage || "").trim();
      supportInput.focus();
    });
  });

  supportForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = String(supportInput?.value || "").trim();

    if (!message) {
      setSupportStatus(getText("support_error_empty"), "is-error");
      supportInput?.focus();
      return;
    }

    if (supportInput) {
      supportInput.disabled = true;
    }

    const submitButton = supportForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
    }

    setSupportStatus(getText("support_status_sending"), "");

    try {
      await sendSupportMessage(message);
      if (supportInput) {
        supportInput.value = "";
      }
      await loadSupportMessages({
        silent: true,
      });
      setSupportStatus(getText("support_status_sent"), "is-success");
    } catch (error) {
      setSupportStatus(getText("support_status_send_error"), "is-error");
    } finally {
      if (supportInput) {
        supportInput.disabled = false;
        supportInput.focus();
      }

      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (!supportWidget.contains(event.target)) {
      setSupportState(false);
      setContactMenuState(false);
    }
  });

  loadSupportMessages({
    silent: true,
  });

  if (supportPollHandle) {
    window.clearInterval(supportPollHandle);
  }

  supportPollHandle = window.setInterval(() => {
    loadSupportMessages({
      silent: true,
    });
  }, SUPPORT_POLL_INTERVAL);
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

    formStatus.textContent = getText("form_status_sending");
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
      formStatus.textContent = getText("form_error_name");
      formStatus.className = "form-status is-error";
      focusFieldError(nameInput);
      return;
    }

    if (!payload.level) {
      formStatus.textContent = getText("form_error_level");
      formStatus.className = "form-status is-error";
      focusFieldError(levelInput);
      return;
    }

    if (!payload.subject) {
      formStatus.textContent = getText("form_error_subject");
      formStatus.className = "form-status is-error";
      focusFieldError(subjectInput);
      return;
    }

    if (!/^0\d{9}$/.test(payload.phone)) {
      formStatus.textContent = getText("form_error_phone");
      formStatus.className = "form-status is-error";
      focusFieldError(phoneInput);
      return;
    }

    if (!payload.preferred_time) {
      formStatus.textContent = getText("form_error_time");
      formStatus.className = "form-status is-error";
      focusFieldError(preferredTimeInput);
      return;
    }

    if (!payload.consent_contact) {
      formStatus.textContent = getText("form_error_consent_contact");
      formStatus.className = "form-status is-error";
      consentContactInput?.focus();
      return;
    }

    if (!payload.consent_terms) {
      formStatus.textContent = getText("form_error_consent_terms");
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
      formStatus.textContent = getText("form_success_submit");
      formStatus.className = "form-status is-success";
    } catch (error) {
      formStatus.textContent = getText("form_error_submit");
      formStatus.className = "form-status is-error";
    }
  });
}
