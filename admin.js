const loginForm = document.querySelector("#admin-login-form");
const loginCard = document.querySelector("#login-card");
const dashboard = document.querySelector("#admin-dashboard");
const loginStatus = document.querySelector("#admin-login-status");
const usernameInput = document.querySelector("#admin-username");
const passwordInput = document.querySelector("#admin-password");
const passwordToggle = document.querySelector("#password-toggle");
const rememberDeviceInput = document.querySelector("#admin-remember-device");

const totalMetric = document.querySelector("#metric-total");
const todayMetric = document.querySelector("#metric-today");
const latestMetric = document.querySelector("#metric-latest");
const chatsMetric = document.querySelector("#metric-chats");
const tableBody = document.querySelector("#inquiry-table-body");

const conversationList = document.querySelector("#chat-conversation-list");
const chatRoomTitle = document.querySelector("#chat-room-title");
const chatRoomMeta = document.querySelector("#chat-room-meta");
const chatRoomAvatar = document.querySelector("#chat-room-avatar");
const chatThread = document.querySelector("#admin-chat-thread");
const chatForm = document.querySelector("#admin-chat-form");
const chatInput = document.querySelector("#admin-chat-input");
const chatSend = document.querySelector("#admin-chat-send");
const chatStatus = document.querySelector("#admin-chat-status");
const chatSearchInput = document.querySelector("#chat-search-input");
const chatRefreshButton = document.querySelector("#chat-refresh-button");
const chatTotalBadge = document.querySelector("#chat-total-badge");
const chatSideAvatar = document.querySelector("#chat-side-avatar");
const chatSideTitle = document.querySelector("#chat-side-title");
const chatSideSubtitle = document.querySelector("#chat-side-subtitle");
const chatSideEmail = document.querySelector("#chat-side-email");
const chatSideSource = document.querySelector("#chat-side-source");
const chatSideCreated = document.querySelector("#chat-side-created");
const chatSideUpdated = document.querySelector("#chat-side-updated");
const chatSideCount = document.querySelector("#chat-side-count");
const chatSidePreview = document.querySelector("#chat-side-preview");

const adminTabs = Array.from(document.querySelectorAll("[data-admin-tab]"));
const adminPanels = Array.from(document.querySelectorAll("[data-admin-panel]"));

const AUTH_STORAGE_KEY = "adminAuthToken";
const REMEMBER_DEVICE_KEY = "adminRememberDevice";
const CHAT_STORAGE_KEY = "adminSelectedConversationId";
const TAB_STORAGE_KEY = "adminSelectedTab";
const REFRESH_INTERVAL = 2500;

let authToken = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY) || "";
let refreshHandle = null;
let selectedConversationId = sessionStorage.getItem(CHAT_STORAGE_KEY) || "";
let activeAdminTab = sessionStorage.getItem(TAB_STORAGE_KEY) || "overview";
let allConversations = [];
let notificationAudioContext = null;
let conversationSnapshot = new Map();
let hasConversationSnapshot = false;

function persistRememberDevicePreference(shouldRemember) {
  localStorage.setItem(REMEMBER_DEVICE_KEY, shouldRemember ? "true" : "false");
}

function persistAuthToken(token, shouldRemember = false) {
  if (!token) {
    return;
  }

  sessionStorage.setItem(AUTH_STORAGE_KEY, token);
  if (shouldRemember) {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  persistRememberDevicePreference(shouldRemember);
}

function clearPersistedAuthToken() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

const rememberedDevicePreference =
  localStorage.getItem(REMEMBER_DEVICE_KEY) === "true" || Boolean(localStorage.getItem(AUTH_STORAGE_KEY));

if (rememberDeviceInput) {
  rememberDeviceInput.checked = rememberedDevicePreference;
  rememberDeviceInput.addEventListener("change", () => {
    persistRememberDevicePreference(Boolean(rememberDeviceInput.checked));
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncateText(value, maxLength = 84) {
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
    return String(value);
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
    return String(value);
  }
}

function ensureNotificationAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!notificationAudioContext) {
    notificationAudioContext = new AudioContextClass();
  }

  if (notificationAudioContext.state === "suspended") {
    notificationAudioContext.resume().catch(() => {});
  }

  return notificationAudioContext;
}

function playNotificationSound() {
  const audioContext = ensureNotificationAudioContext();
  if (!audioContext) {
    return;
  }

  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.16);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.2);
}

function updateConversationSnapshot(conversations) {
  const nextSnapshot = new Map();
  let shouldNotify = false;

  conversations.forEach((conversation) => {
    const signature = [
      conversation.message_count || 0,
      conversation.updated_at || "",
      conversation.latest_sender || "",
      conversation.latest_message || "",
    ].join("|");

    const previousSignature = conversationSnapshot.get(conversation.id);
    nextSnapshot.set(conversation.id, signature);

    if (!hasConversationSnapshot) {
      return;
    }

    const hasIncomingUpdate =
      previousSignature !== signature &&
      conversation.latest_sender !== "admin";

    if (hasIncomingUpdate) {
      shouldNotify = true;
    }
  });

  conversationSnapshot = nextSnapshot;
  hasConversationSnapshot = true;

  if (shouldNotify) {
    playNotificationSound();
  }
}

document.addEventListener(
  "pointerdown",
  () => {
    ensureNotificationAudioContext();
  },
  { passive: true },
);

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

function getConversationDisplayTitle(conversation) {
  return conversation?.user_name || formatPageLabel(conversation?.source_page);
}

function getConversationAvatarLabel(conversation) {
  const source = String(conversation?.user_name || conversation?.user_email || "IQ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return source || "IQ";
}

function updateConversationBadge(total) {
  if (chatTotalBadge) {
    chatTotalBadge.textContent = String(total || 0);
  }
}

function persistSelectedConversation(id) {
  selectedConversationId = id || "";

  if (selectedConversationId) {
    sessionStorage.setItem(CHAT_STORAGE_KEY, selectedConversationId);
  } else {
    sessionStorage.removeItem(CHAT_STORAGE_KEY);
  }
}

function setAdminTab(tab) {
  activeAdminTab = tab === "messages" ? "messages" : "overview";
  sessionStorage.setItem(TAB_STORAGE_KEY, activeAdminTab);

  adminTabs.forEach((button) => {
    const isActive = button.dataset.adminTab === activeAdminTab;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  adminPanels.forEach((panel) => {
    const isActive = panel.dataset.adminPanel === activeAdminTab;
    panel.classList.toggle("hidden", !isActive);
  });
}

function getFilteredConversations() {
  const keyword = String(chatSearchInput?.value || "").trim().toLowerCase();
  if (!keyword) {
    return allConversations;
  }

  return allConversations.filter((conversation) => {
    const haystacks = [
      conversation.user_name,
      conversation.user_email,
      conversation.latest_message,
      formatPageLabel(conversation.source_page),
      conversation.id,
    ];

    return haystacks.some((value) => String(value || "").toLowerCase().includes(keyword));
  });
}

function renderChatInfoPanel(conversation = null, messages = []) {
  if (!chatSideTitle) {
    return;
  }

  if (!conversation) {
    if (chatSideAvatar) {
      chatSideAvatar.textContent = "IQ";
    }
    chatSideTitle.textContent = "เลือกห้องแชต";
    if (chatSideSubtitle) {
      chatSideSubtitle.textContent = "เลือกห้องจากรายการด้านซ้ายเพื่อดูข้อมูลบทสนทนา";
    }
    if (chatSideEmail) {
      chatSideEmail.textContent = "-";
    }
    if (chatSideSource) {
      chatSideSource.textContent = "-";
    }
    if (chatSideCreated) {
      chatSideCreated.textContent = "-";
    }
    if (chatSideUpdated) {
      chatSideUpdated.textContent = "-";
    }
    if (chatSideCount) {
      chatSideCount.textContent = "0";
    }
    if (chatSidePreview) {
      chatSidePreview.textContent = "ยังไม่มีข้อความ";
    }
    return;
  }

  const roomTitle = getConversationDisplayTitle(conversation);
  const lastMessage = messages.length ? messages[messages.length - 1] : null;
  const lastSenderLabel =
    lastMessage?.sender === "admin"
      ? "ทีมงาน IQON"
      : conversation.user_name || conversation.user_email || "สมาชิกเว็บไซต์";

  const resolvedLastSenderLabel = lastMessage?.sender === "assistant" ? "IQON AI" : lastSenderLabel;

  if (chatSideAvatar) {
    chatSideAvatar.textContent = getConversationAvatarLabel(conversation);
  }
  chatSideTitle.textContent = roomTitle;
  if (chatSideSubtitle) {
    chatSideSubtitle.textContent = `${resolvedLastSenderLabel} • อัปเดต ${formatTime(conversation.updated_at) || "-"}`;
  }
  if (chatSideEmail) {
    chatSideEmail.textContent = conversation.user_email || "-";
  }
  if (chatSideSource) {
    chatSideSource.textContent = formatPageLabel(conversation.source_page);
  }
  if (chatSideCreated) {
    chatSideCreated.textContent = formatDateTime(conversation.created_at);
  }
  if (chatSideUpdated) {
    chatSideUpdated.textContent = formatDateTime(conversation.updated_at);
  }
  if (chatSideCount) {
    chatSideCount.textContent = String(messages.length || conversation.message_count || 0);
  }
  if (chatSidePreview) {
    chatSidePreview.textContent = lastMessage?.message || conversation.latest_message || "ยังไม่มีข้อความ";
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
  const isUnauthorized = error?.status === 401;

  if (!isUnauthorized) {
    setDashboardVisibility(Boolean(authToken));
    setLoginStatus("");
    setChatStatus("การเชื่อมต่อสะดุดชั่วคราว ระบบจะลองเชื่อมต่อให้อัตโนมัติ", "is-error");
    return;
  }

  if (refreshHandle) {
    window.clearInterval(refreshHandle);
    refreshHandle = null;
  }

  clearPersistedAuthToken();
  authToken = "";
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

  if (chatRoomAvatar) {
    chatRoomAvatar.textContent = "IQ";
  }

  renderChatInfoPanel(null, []);
  setReplyState(false);
}

function renderConversations(conversations) {
  if (!conversationList) {
    return;
  }

  updateConversationBadge(conversations.length);

  if (!conversations.length) {
    const emptyLabel = allConversations.length ? "ไม่พบห้องแชตตามคำค้นหา" : "ยังไม่มีห้องแชต";
    conversationList.innerHTML = `<div class="empty-state">${escapeHtml(emptyLabel)}</div>`;
    renderEmptyChatState(emptyLabel);
    if (!allConversations.length) {
      persistSelectedConversation("");
    }
    return;
  }

  const visibleConversationIds = conversations.map((conversation) => conversation.id);

  if (!selectedConversationId || !visibleConversationIds.includes(selectedConversationId)) {
    persistSelectedConversation(conversations[0].id);
  }

  conversationList.innerHTML = conversations
    .map((conversation) => {
      const isActive = conversation.id === selectedConversationId;
      const preview = truncateText(conversation.latest_message || "ยังไม่มีข้อความ");
      const title = getConversationDisplayTitle(conversation);
      const avatar = getConversationAvatarLabel(conversation);
      const metaParts = [formatDateTime(conversation.updated_at)];

      if (conversation.user_email) {
        metaParts.unshift(conversation.user_email);
      }

      const senderText =
        conversation.latest_sender === "admin"
          ? "ทีมงานตอบล่าสุด"
          : conversation.latest_sender === "user"
            ? "ผู้ใช้ส่งล่าสุด"
            : "ห้องแชตใหม่";

      const previewSenderText =
        conversation.latest_sender === "assistant" ? "IQON AI ตอบล่าสุด" : senderText;

      return `
        <button
          class="admin-chat-conversation${isActive ? " is-active" : ""}"
          type="button"
          data-conversation-id="${escapeHtml(conversation.id)}"
        >
          <div class="admin-chat-conversation-media">
            <div class="admin-chat-conversation-avatar" aria-hidden="true">${escapeHtml(avatar)}</div>
            <div class="admin-chat-conversation-copy">
              <div class="admin-chat-conversation-top">
                <div>
                  <div class="admin-chat-conversation-title">${escapeHtml(title)}</div>
                  <div class="admin-chat-conversation-meta">${escapeHtml(metaParts.join(" • "))}</div>
                </div>
                <span class="admin-chat-badge">${escapeHtml(String(conversation.message_count || 0))}</span>
              </div>
              <div class="admin-chat-conversation-preview">${escapeHtml(previewSenderText)}: ${escapeHtml(preview)}</div>
            </div>
          </div>
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
      renderConversations(getFilteredConversations());
      setChatStatus("");
      await loadSelectedConversation();
    });
  });
}

function renderChatMessages(conversation, messages) {
  if (!chatThread || !chatRoomTitle || !chatRoomMeta) {
    return;
  }

  const roomTitle = getConversationDisplayTitle(conversation);
  const roomMetaParts = [`รหัสห้อง ${conversation.id}`];

  if (conversation.user_email) {
    roomMetaParts.push(conversation.user_email);
  }

  roomMetaParts.push(`เริ่ม ${formatDateTime(conversation.created_at)}`);
  roomMetaParts.push(`อัปเดตล่าสุด ${formatDateTime(conversation.updated_at)}`);

  chatRoomTitle.textContent = roomTitle;
  chatRoomMeta.textContent = roomMetaParts.join(" • ");

  if (chatRoomAvatar) {
    chatRoomAvatar.textContent = getConversationAvatarLabel(conversation);
  }

  renderChatInfoPanel(conversation, messages);

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

        const resolvedSenderClass =
          item.sender === "assistant" ? "admin-chat-message-assistant" : senderClass;
        const resolvedSenderLabel = item.sender === "assistant" ? "IQON AI" : senderLabel;

        return `
          <article class="admin-chat-message ${resolvedSenderClass}">
            <div class="admin-chat-message-meta">
              <strong>${escapeHtml(resolvedSenderLabel)}</strong>
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

async function loadChatConversationsOnly({ silentSelection = false } = {}) {
  const conversationsPayload = await fetchJson("/api/admin/chat/conversations");

  allConversations = conversationsPayload.conversations || [];
  updateConversationSnapshot(allConversations);
  renderConversations(getFilteredConversations());

  if (selectedConversationId) {
    await loadSelectedConversation();
  } else if (!silentSelection) {
    renderEmptyChatState(allConversations.length ? "เลือกห้องแชตเพื่อดูบทสนทนา" : "ยังไม่มีห้องแชต");
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

  allConversations = conversationsPayload.conversations || [];
  updateConversationSnapshot(allConversations);
  renderConversations(getFilteredConversations());

  if (selectedConversationId) {
    await loadSelectedConversation();
  } else {
    renderEmptyChatState(allConversations.length ? "เลือกห้องแชตเพื่อดูบทสนทนา" : "ยังไม่มีห้องแชต");
  }
}

async function startDashboard() {
  if (!authToken) {
    return;
  }

  setDashboardVisibility(true);
  setAdminTab(activeAdminTab);
  setLoginStatus("");

  if (refreshHandle) {
    window.clearInterval(refreshHandle);
  }

  refreshHandle = window.setInterval(async () => {
    try {
      if (activeAdminTab === "messages") {
        await loadChatConversationsOnly({
          silentSelection: true,
        });
      } else {
        await loadDashboard();
      }
    } catch (error) {
      handleAuthFailure(error);
    }
  }, REFRESH_INTERVAL);

  try {
    await loadDashboard();
    setChatStatus("");
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
      persistAuthToken(authToken, Boolean(rememberDeviceInput?.checked));
      await startDashboard();
    } catch (error) {
      clearPersistedAuthToken();
      authToken = "";
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
      await loadChatConversationsOnly({
        silentSelection: true,
      });
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

if (chatSearchInput) {
  chatSearchInput.addEventListener("input", async () => {
    renderConversations(getFilteredConversations());
    if (selectedConversationId) {
      await loadSelectedConversation();
    }
  });
}

if (chatRefreshButton) {
  chatRefreshButton.addEventListener("click", async () => {
    setChatStatus("กำลังรีเฟรชข้อมูล...", "");
    try {
      if (activeAdminTab === "messages") {
        await loadChatConversationsOnly({
          silentSelection: true,
        });
      } else {
        await loadDashboard();
      }
      setChatStatus("อัปเดตรายการแชตแล้ว", "is-success");
    } catch (error) {
      setChatStatus("ยังรีเฟรชข้อมูลไม่ได้ กรุณาลองใหม่อีกครั้ง", "is-error");
    }
  });
}

adminTabs.forEach((button) => {
  button.addEventListener("click", () => {
    setAdminTab(button.dataset.adminTab || "overview");
  });
});

renderEmptyChatState("ยังไม่มีห้องแชต");
setAdminTab(activeAdminTab);
startDashboard();
