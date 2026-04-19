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
const tableBody = document.querySelector("#inquiry-table-body");

let authToken = sessionStorage.getItem("adminAuthToken");
let refreshHandle = null;

async function fetchJson(path) {
  const response = await fetch(path, {
    headers: {
      Authorization: `Basic ${authToken}`,
    },
  });

  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    const error = new Error(payload.error || "Request failed");
    error.status = response.status;
    throw error;
  }
  return payload;
}

function formatDate(value) {
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

function renderTable(inquiries) {
  if (!tableBody) {
    return;
  }

  if (!inquiries.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">ยังไม่มีข้อมูลในระบบ</td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = inquiries
    .map(
      (item) => `
        <tr>
          <td>${formatDate(item.created_at)}</td>
          <td>${item.name}</td>
          <td><span class="badge">${item.level}</span></td>
          <td>${item.subject}</td>
          <td>${item.phone}</td>
          <td>${item.message || "-"}</td>
        </tr>
      `,
    )
    .join("");
}

async function loadDashboard() {
  const [statsPayload, inquiriesPayload] = await Promise.all([
    fetchJson("/api/admin/stats"),
    fetchJson("/api/admin/inquiries"),
  ]);

  totalMetric.textContent = String(statsPayload.stats.total_inquiries);
  todayMetric.textContent = String(statsPayload.stats.today_inquiries);
  latestMetric.textContent = formatDate(statsPayload.stats.latest_inquiry_at);
  renderTable(inquiriesPayload.inquiries);
}

async function startDashboard() {
  if (!authToken) {
    return;
  }

  try {
    await loadDashboard();
    loginCard.classList.add("hidden");
    dashboard.classList.remove("hidden");

    if (refreshHandle) {
      window.clearInterval(refreshHandle);
    }
    refreshHandle = window.setInterval(loadDashboard, 15000);
  } catch (error) {
    sessionStorage.removeItem("adminAuthToken");
    authToken = null;
    dashboard.classList.add("hidden");
    loginCard.classList.remove("hidden");
    loginStatus.textContent =
      error.status === 401
        ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
        : "ไม่สามารถเชื่อมต่อระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง";
    loginStatus.className = "form-status is-error";
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginStatus.textContent = "กำลังตรวจสอบข้อมูลเข้าสู่ระบบ...";
    loginStatus.className = "form-status";

    authToken = btoa(`${usernameInput.value}:${passwordInput.value}`);
    sessionStorage.setItem("adminAuthToken", authToken);
    await startDashboard();

    if (dashboard.classList.contains("hidden")) {
      return;
    }

    loginStatus.textContent = "";
  });
}

if (passwordToggle && passwordInput) {
  passwordToggle.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    passwordToggle.setAttribute("aria-pressed", String(isHidden));
    passwordToggle.setAttribute(
      "aria-label",
      isHidden ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน",
    );
    passwordToggle.classList.toggle("is-active", isHidden);
  });
}

startDashboard();
