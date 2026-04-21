const loginForm = document.querySelector("#admin-login-form");
const loginCard = document.querySelector("#login-card");
const dashboard = document.querySelector("#admin-dashboard");
const loginStatus = document.querySelector("#admin-login-status");
const usernameInput = document.querySelector("#admin-username");
const passwordInput = document.querySelector("#admin-password");
const passwordToggle = document.querySelector("#password-toggle");
const totalMetric = document.querySelector("#metric-total");
const todayMetric = document.querySelector("#metric-today");
const latestMetric = document.querySelector("#metric-latest");
const chatsMetric = document.querySelector("#metric-chats");
const tableBody = document.querySelector("#inquiry-table-body");
const conversationList = document.querySelector("#chat-conversation-list");
const chatRoomTitle = document.querySelector("#chat-room-title");
const chatRoomMeta = document.querySelector("#chat-room-meta");
const chatThread = document.querySelector("#admin-chat-thread");
const chatForm = document.querySelector("#admin-chat-form");
const chatInput = document.querySelector("#admin-chat-input");
const chatSend = document.querySelector("#admin-chat-send");
const chatStatus = document.querySelector("#admin-chat-status");

const AUTH_STORAGE_KEY = "adminAuthToken";
const CHAT_STORAGE_KEY = "adminSelectedConversationId";
const REFRESH_INTERVAL = 2500;

let authToken = sessionStorage.getItem(AUTH_STORAGE_KEY);
let refreshHandle = null;
let selectedConversationId = sessionStorage.getItem(CHAT_STORAGE_KEY) || "";
let latestConversationIds = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncateText(value, maxLength = 96) {
  const text = String(value ?? "").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  try {
    return new Date(value).toLocaleString("th-TH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch (error) {
    return value;
  }
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  try {
    return new Date(value).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return value;
  }
}

function formatPageLabel(pathname) {
  const path = String(pathname || "").trim();

  if (!path || path === "/" || path === "/index.html") {
    return "หน้าแรก";
  }

  if (path === "/courses.html") {
    return "หน้าคอร์สเรียน";
  }

  if (path === "/admin" || path === "/admin.html") {
    return "หลังบ้าน";
  }

  return path;
}

function setLoginStatus(message = "", variant = "") {
  if (!loginStatus) {
    return;
  }

  loginStatus.textContent = message;
  loginStatus.className = variant ? `form-status ${variant}` : "form-status";
}

function setChatStatus(message = "", variant = "") {
  if (!chatStatus) {
    return;
  }

  chatStatus.textContent = message;
  chatStatus.className = variant ? `form-status ${variant}` : "form-status";
}

function setDashboardVisibility(isVisible) {
  loginCard?.classList.toggle("hidden", isVisible);
  dashboard?.classList.toggle("hidden", !isVisible);
}

function setReplyState(enabled) {
  if (chatInput) {
    chatInput.disabled = !enabled;
  }

  if (chatSend) {
    chatSend.disabled = !enabled;
  }
}

async function loginRequest(username, password) {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    const error = new Error(payload.error || "Login failed");
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function fetchJson(path, options = {}) {
  const requestOptions = {
    method: options.method || "GET",
    headers: {
      ...(authToken
        ? {
            Authorization: `Basic ${authToken}`,
          }
        : {}),
      ...(options.body
        ? {
            "Content-Type": "application/json",
          }
        : {}),
    },
  };

  if (options.body) {
    requestOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(path, requestOptions);
  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    const error = new Error(payload.error || "Request failed");
    error.status = response.status;
    throw error;
  }

  return payload;
}

function handleAuthFailure(error) {
  if (refreshHandle) {
    window.clearInterval(refreshHandle);
    refreshHandle = null;
  }

  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  authToken = null;
  setDashboardVisibility(false);
  setReplyState(false);
  setLoginStatus(
    error?.status === 401
      ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาเข้าสู่ระบบอีกครั้ง"
      : "ไม่สามารถเชื่อมต่อระบบหลังบ้านได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
    "is-error",
  );
}

function renderTable(inquiries) {
  if (!tableBody) {
    return;
  }

  if (!inquiries.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">ยังไม่มีข้อมูลในระบบ</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = inquiries
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(formatDateTime(item.created_at))}</td>
          <td>${escapeHtml(item.name)}</td>
          <td><span class="badge">${escapeHtml(item.level)}</span></td>
          <td>${escapeHtml(item.subject)}</td>
          <td>${escapeHtml(item.phone)}</td>
          <td>${escapeHtml(item.preferred_time || "-")}</td>
          <td>${item.consent_contact && item.consent_terms ? "ครบ" : "ไม่ครบ"}</td>
          <td>${escapeHtml(item.message || "-")}</td>
        </tr>
      `,
    )
    .join("");
}

function renderEmptyChatState(message) {
  if (chatThread) {
    chatThread.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
  }

  if (chatRoomTitle) {
    chatRoomTitle.textContent = "เลือกห้องแชต";
  }

  if (chatRoomMeta) {
    chatRoomMeta.textContent = "เมื่อมีข้อความจากหน้าเว็บ รายการจะขึ้นที่นี่";
  }

  setReplyState(false);
}

function persistSelectedConversation(id) {
  selectedConversationId = id || "";

  if (selectedConversationId) {
    sessionStorage.setItem(CHAT_STORAGE_KEY, selectedConversationId);
  } else {
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
  }
}

function renderConversations(conversations) {
  if (!conversationList) {
    return;
  }

  if (!conversations.length) {
    conversationList.innerHTML = `<div class="empty-state">ยังไม่มีห้องแชต</div>`;
    renderEmptyChatState("ยังไม่มีห้องแชต");
    persistSelectedConversation("");
    latestConversationIds = [];
    return;
  }

  latestConversationIds = conversations.map((conversation) => conversation.id);

  if (!selectedConversationId || !latestConversationIds.includes(selectedConversationId)) {
    persistSelectedConversation(conversations[0].id);
  }

  conversationList.innerHTML = conversations
    .map((conversation) => {
      const isActive = conversation.id === selectedConversationId;
      const preview = truncateText(conversation.latest_message || "ยังไม่มีข้อความ");
      const title = conversation.user_name || formatPageLabel(conversation.source_page);
      const metaParts = [formatDateTime(conversation.updated_at)];
      if (conversation.user_email) {
        metaParts.unshift(conversation.user_email);
      }
      const senderText =
        conversation.latest_sender === "admin"
          ? "ทีมงานตอบล่าสุด"
          : conversation.latest_sender === "user"
            ? "ลูกค้าส่งล่าสุด"
            : "ห้องแชตใหม่";

      return `
        <button
          class="admin-chat-conversation${isActive ? " is-active" : ""}"
          type="button"
          data-conversation-id="${escapeHtml(conversation.id)}"
        >
          <div class="admin-chat-conversation-top">
            <div>
              <div class="admin-chat-conversation-title">${escapeHtml(title)}</div>
              <div class="admin-chat-conversation-meta">${escapeHtml(metaParts.join(" • "))}</div>
            </div>
            <span class="admin-chat-badge">${escapeHtml(String(conversation.message_count || 0))}</span>
          </div>
          <div class="admin-chat-conversation-preview">${escapeHtml(senderText)}: ${escapeHtml(preview)}</div>
        </button>
      `;
    })
    .join("");

  conversationList.querySelectorAll("[data-conversation-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      const conversationId = button.dataset.conversationId || "";
      if (!conversationId || conversationId === selectedConversationId) {
        return;
      }

      persistSelectedConversation(conversationId);
      renderConversations(conversations);
      setChatStatus("");
      await loadSelectedConversation();
    });
  });
}

function renderChatMessages(conversation, messages) {
  if (!chatThread || !chatRoomTitle || !chatRoomMeta) {
    return;
  }

  const roomTitle = conversation.user_name || formatPageLabel(conversation.source_page);
  const roomMetaParts = [`รหัสห้อง ${conversation.id}`];
  if (conversation.user_email) {
    roomMetaParts.push(conversation.user_email);
  }
  roomMetaParts.push(`เริ่ม ${formatDateTime(conversation.created_at)}`);
  roomMetaParts.push(`อัปเดตล่าสุด ${formatDateTime(conversation.updated_at)}`);

  chatRoomTitle.textContent = `ห้องแชต: ${roomTitle}`;
  chatRoomMeta.textContent = roomMetaParts.join(" • ");

  if (!messages.length) {
    chatThread.innerHTML = `<div class="empty-state">ห้องนี้ยังไม่มีข้อความ</div>`;
  } else {
    chatThread.innerHTML = messages
      .map((item) => {
        const senderClass = item.sender === "admin" ? "admin-chat-message-admin" : "admin-chat-message-user";
        const senderLabel =
          item.sender === "admin"
            ? "ทีมงาน IQON"
            : conversation.user_name || conversation.user_email || "สมาชิกเว็บไซต์";

        return `
          <article class="admin-chat-message ${senderClass}">
            <div class="admin-chat-message-meta">
              <strong>${escapeHtml(senderLabel)}</strong>
              <span>${escapeHtml(formatTime(item.created_at))}</span>
            </div>
            <div class="admin-chat-message-body">${escapeHtml(item.message)}</div>
          </article>
        `;
      })
      .join("");
  }

  chatThread.scrollTop = chatThread.scrollHeight;
  setReplyState(true);
}

async function loadSelectedConversation() {
  if (!selectedConversationId) {
    renderEmptyChatState("ยังไม่มีห้องแชต");
    return;
  }

  try {
    const payload = await fetchJson(
      `/api/admin/chat/messages?conversation_id=${encodeURIComponent(selectedConversationId)}`,
    );
    renderChatMessages(payload.conversation, payload.messages || []);
  } catch (error) {
    if (error?.status === 404) {
      persistSelectedConversation("");
      renderEmptyChatState("ห้องแชตนี้ไม่พบแล้ว");
      return;
    }

    throw error;
  }
}

async function loadDashboard() {
  const [statsPayload, inquiriesPayload, conversationsPayload] = await Promise.all([
    fetchJson("/api/admin/stats"),
    fetchJson("/api/admin/inquiries"),
    fetchJson("/api/admin/chat/conversations"),
  ]);

  if (totalMetric) {
    totalMetric.textContent = String(statsPayload.stats.total_inquiries || 0);
  }

  if (todayMetric) {
    todayMetric.textContent = String(statsPayload.stats.today_inquiries || 0);
  }

  if (latestMetric) {
    latestMetric.textContent = formatDateTime(statsPayload.stats.latest_inquiry_at);
  }

  if (chatsMetric) {
    chatsMetric.textContent = String(statsPayload.stats.chat_conversations || 0);
  }

  renderTable(inquiriesPayload.inquiries || []);
  renderConversations(conversationsPayload.conversations || []);

  if (selectedConversationId) {
    await loadSelectedConversation();
  }
}

async function startDashboard() {
  if (!authToken) {
    return;
  }

  try {
    await loadDashboard();
    setDashboardVisibility(true);
    setLoginStatus("");

    if (refreshHandle) {
      window.clearInterval(refreshHandle);
    }

    refreshHandle = window.setInterval(async () => {
      try {
        await loadDashboard();
      } catch (error) {
        handleAuthFailure(error);
      }
    }, REFRESH_INTERVAL);
  } catch (error) {
    handleAuthFailure(error);
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = String(usernameInput?.value || "").trim();
    const password = String(passwordInput?.value || "");

    setLoginStatus("กำลังตรวจสอบข้อมูลเข้าสู่ระบบ...", "");

    try {
      await loginRequest(username, password);
      authToken = btoa(`${username}:${password}`);
      sessionStorage.setItem(AUTH_STORAGE_KEY, authToken);
      await startDashboard();
    } catch (error) {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      authToken = null;
      setDashboardVisibility(false);
      setLoginStatus(
        error?.status === 401
          ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
          : "ไม่สามารถเชื่อมต่อระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
        "is-error",
      );
    }
  });
}

if (chatForm && chatInput) {
  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = String(chatInput.value || "").trim();
    if (!selectedConversationId) {
      setChatStatus("กรุณาเลือกห้องแชตก่อนส่งข้อความ", "is-error");
      return;
    }

    if (!message) {
      setChatStatus("กรุณาพิมพ์ข้อความก่อนส่ง", "is-error");
      chatInput.focus();
      return;
    }

    setReplyState(false);
    setChatStatus("กำลังส่งข้อความตอบกลับ...", "");

    try {
      await fetchJson("/api/admin/chat/messages", {
        method: "POST",
        body: {
          conversation_id: selectedConversationId,
          message,
        },
      });

      chatInput.value = "";
      setChatStatus("ส่งข้อความเรียบร้อยแล้ว", "is-success");
      await loadDashboard();
      chatInput.focus();
    } catch (error) {
      setChatStatus("ยังไม่สามารถส่งข้อความได้ กรุณาลองอีกครั้ง", "is-error");
      setReplyState(true);
    }
  });
}

if (passwordToggle && passwordInput) {
  passwordToggle.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    passwordToggle.setAttribute("aria-pressed", String(isHidden));
    passwordToggle.setAttribute("aria-label", isHidden ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน");
    passwordToggle.classList.toggle("is-active", isHidden);
  });
}

renderEmptyChatState("ยังไม่มีห้องแชต");
startDashboard();
