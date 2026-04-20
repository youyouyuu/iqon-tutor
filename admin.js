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

function setLoginErrorMessage(error) {
  if (!loginStatus) {
    return;
  }

  loginStatus.textContent =
    error?.status === 401
      ? "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
      : "ไม่สามารถเชื่อมต่อระบบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง";
  loginStatus.className = "form-status is-error";
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
        <td colspan="8" class="empty-state">ยังไม่มีข้อมูลในระบบ</td>
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
          <td>${item.preferred_time || "-"}</td>
          <td>${item.consent_contact && item.consent_terms ? "ครบ" : "ไม่ครบ"}</td>
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

  if (totalMetric) {
    totalMetric.textContent = String(statsPayload.stats.total_inquiries);
  }

  if (todayMetric) {
    todayMetric.textContent = String(statsPayload.stats.today_inquiries);
  }

  if (latestMetric) {
    latestMetric.textContent = formatDate(statsPayload.stats.latest_inquiry_at);
  }

  renderTable(inquiriesPayload.inquiries);
}

async function startDashboard() {
  if (!authToken) {
    return;
  }

  try {
    await loadDashboard();

    if (loginCard) {
      loginCard.classList.add("hidden");
    }

    if (dashboard) {
      dashboard.classList.remove("hidden");
    }

    if (refreshHandle) {
      window.clearInterval(refreshHandle);
    }

    refreshHandle = window.setInterval(async () => {
      try {
        await loadDashboard();
      } catch (error) {
        window.clearInterval(refreshHandle);
        refreshHandle = null;
        sessionStorage.removeItem("adminAuthToken");
        authToken = null;

        if (dashboard) {
          dashboard.classList.add("hidden");
        }

        if (loginCard) {
          loginCard.classList.remove("hidden");
        }

        setLoginErrorMessage(error);
      }
    }, 15000);
  } catch (error) {
    sessionStorage.removeItem("adminAuthToken");
    authToken = null;

    if (dashboard) {
      dashboard.classList.add("hidden");
    }

    if (loginCard) {
      loginCard.classList.remove("hidden");
    }

    setLoginErrorMessage(error);
  }
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (loginStatus) {
      loginStatus.textContent = "กำลังตรวจสอบข้อมูลเข้าสู่ระบบ...";
      loginStatus.className = "form-status";
    }

    try {
      await loginRequest(usernameInput.value, passwordInput.value);
      authToken = btoa(`${usernameInput.value}:${passwordInput.value}`);
      sessionStorage.setItem("adminAuthToken", authToken);
      await startDashboard();
    } catch (error) {
      sessionStorage.removeItem("adminAuthToken");
      authToken = null;
      setLoginErrorMessage(error);
      return;
    }

    if (dashboard?.classList.contains("hidden")) {
      return;
    }

    if (loginStatus) {
      loginStatus.textContent = "";
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

startDashboard();
