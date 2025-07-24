const form = document.getElementById("reportForm");
const messages = document.getElementById("messages");

if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    messages.innerText = "";

    const channel = document.getElementById("channel").value;
    const targetTimeRaw = document.getElementById("targetTime").value;
    const landingTimeRaw = document.getElementById("landingTime").value;
    const type = document.getElementById("type").value;
    const multi = document.getElementById("multiple").checked;
    const email = document.getElementById("email").value;

    const targetTime = new Date(targetTimeRaw);
    const landingTime = new Date(landingTimeRaw);
    const now = new Date();

    var errors = [];

    if (!channel) errors.push("שדה 'מספר תעלה' הוא חובה.");
    if (!email.includes("@") || !email.includes(".", email.indexOf("@"))) {
      errors.push("כתובת אימייל לא תקינה.");
    }
    if (!type) errors.push("יש לבחור תיאור תקלה.");

    if (isNaN(targetTime.getTime())) {
      errors.push("יש להזין זמן יעד תקין.");
    } else if (targetTime <= now) {
      errors.push("זמן היעד חייב להיות עתידי.");
    }

    if (isNaN(landingTime.getTime())) {
      errors.push("יש להזין זמן נחיתה תקין.");
    } else if (landingTime <= now) {
      errors.push("זמן הנחיתה חייבת להיות עתידית.");
    }

    if (errors.length > 0) {
      messages.innerText = errors.join("\n");
      return;
    }

    var report = {
      id: crypto.randomUUID(), 
      channel: channel,
      targetTime: targetTime.toISOString(),
      landingTime: landingTime.toISOString(),
      type: type,
      multi: multi,
      email: email,
      status: "פתוחה",
    };

    var reports = loadReports();
    reports.push(report);
    localStorage.setItem("reports", JSON.stringify(reports));

    messages.innerText = "התקלה נרשמה בהצלחה!";
    form.reset();
  });
}
function loadReports() {
  return JSON.parse(localStorage.getItem("reports")) || [];
}

function filterReports(reports) {
  var typeFilter = document.getElementById("filterType")?.value || "";
  var statusFilter = document.getElementById("filterStatus")?.value || "";
  var startDateStr = document.getElementById("filterStart")?.value;
  var endDateStr = document.getElementById("filterEnd")?.value;

  var startDate = startDateStr ? new Date(startDateStr) : null;
  var endDate = endDateStr ? new Date(endDateStr) : null;

  return reports.filter(function (report) {
    var targetDate = new Date(report.targetTime);

    var matchType = !typeFilter || report.type === typeFilter;
    var matchStatus = !statusFilter || (report.status || "פתוחה") === statusFilter;
    var matchStart = !startDate || targetDate >= startDate;
    var matchEnd = !endDate || targetDate <= endDate;

    return matchType && matchStatus && matchStart && matchEnd;
  });
}
function calculateAverage(reports) {
  var total = 0;
  var count = 0;

  reports.forEach(function (report) {
    var target = new Date(report.targetTime);
    var landing = new Date(report.landingTime);
    var diff = (landing - target) / 60000;

    if (!isNaN(diff)) {
      total += diff;
      count++;
    }
  });

  if (count === 0) return null;
  return (total / count).toFixed(2);
}
function renderReports(reports) {
  var container = document.getElementById("reportList");
  container.innerHTML = "";

  if (reports.length === 0) {
    container.innerText = "אין דיווחים התואמים לסינון.";
    return;
  }

  var options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  };

  reports.forEach(function (report) {
    var card = document.createElement("div");
    card.className = "report-card";

    var targetStr = new Date(report.targetTime).toLocaleString("he-IL", options);
    var landingStr = new Date(report.landingTime).toLocaleString("he-IL", options);

    card.innerHTML = `
      <p><strong>מספר תעלה:</strong> ${report.channel}</p>
      <p><strong>זמן יעד:</strong> ${targetStr}</p>
      <p><strong>זמן נחיתה בפועל:</strong> ${landingStr}</p>
      <p><strong>תיאור תקלה:</strong> ${report.type}</p>
      <p><strong>יותר מאדם אחד חצה?</strong> ${report.multi ? "כן" : "לא"}</p>
      <p><strong>כתובת אימייל:</strong> ${report.email}</p>
      <p><strong>סטטוס:</strong> ${report.status || "פתוחה"}</p>
      <div class="card-buttons">
        <button class="status-btn" data-id="${report.id}">שנה סטטוס</button>
        <button class="delete-btn" data-id="${report.id}">מחק</button>
      </div>
      <hr>
    `;

    container.appendChild(card);
  });

  var avg = calculateAverage(reports);
  var resultDiv = document.getElementById("averageResult");
  if (resultDiv && avg !== null) {
    resultDiv.innerText = "ממוצע ההפרש בין זמן יעד לנחיתה: " + avg + " דקות";
  }

  setupButtons();
}
function setupButtons() {
  var deleteButtons = document.querySelectorAll(".delete-btn");
  var statusButtons = document.querySelectorAll(".status-btn");

  for (var i = 0; i < deleteButtons.length; i++) {
    deleteButtons[i].addEventListener("click", function () {
      var id = this.getAttribute("data-id");
      var reports = loadReports();
      var index = reports.findIndex(function (r) {
        return r.id === id;
      });
      if (index !== -1) {
        reports.splice(index, 1);
        localStorage.setItem("reports", JSON.stringify(reports));
        displayReports();
      }
    });
  }

  for (var i = 0; i < statusButtons.length; i++) {
    statusButtons[i].addEventListener("click", function () {
      var id = this.getAttribute("data-id");
      var reports = loadReports();
      var index = reports.findIndex(function (r) {
        return r.id === id;
      });
      if (index !== -1) {
        reports[index].status = reports[index].status === "טופלה" ? "פתוחה" : "טופלה";
        localStorage.setItem("reports", JSON.stringify(reports));
        displayReports();
      }
    });
  }
}
if (document.getElementById("reportList")) {
  displayReports();
  var applyFiltersBtn = document.getElementById("applyFilters");
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", displayReports);
  }
}

function displayReports() {
  var reports = loadReports();
  var filtered = filterReports(reports);
  renderReports(filtered);
}
