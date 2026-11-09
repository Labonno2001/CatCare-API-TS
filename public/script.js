
const API_URL = "https://catcare-api-ts.onrender.com";

let catProfile = null;
let feedingRecords = [];
let waterRecords = [];

const $ = (id) => document.getElementById(id);

function getLocalDate() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
}

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(result.message || `HTTP error ${response.status}`);
    }

    return result;
}

function showMessage(message) {
    const element = $("message");
    element.textContent = message;
    element.classList.add("show");

    setTimeout(() => element.classList.remove("show"), 3000);
}

function showError(error) {
    console.error(error);
    showMessage(error.message || "Something went wrong.");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "-"
        : date.toLocaleString();
}

// NAVIGATION

function showPage(page) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active-page");
    });

    document.querySelectorAll(".nav-link").forEach(button => {
        button.classList.remove("active");
    });

    $(page).classList.add("active-page");

    document.querySelector(
        `.nav-link[data-page="${page}"]`
    ).classList.add("active");

    $("page-name").textContent =
        page.charAt(0).toUpperCase() + page.slice(1);
}

document.querySelectorAll(".nav-link").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});

// LOAD CAT PROFILE

async function loadCat() {
    const result = await apiRequest("/api/cat");

    // Your current TypeScript controller returns { success, data }
    catProfile = result.data;

    if (!catProfile) {
        throw new Error("Cat profile was not returned by the API.");
    }

    $("profile-name").textContent = catProfile.name;
    $("profile-age").textContent = catProfile.age;
    $("profile-weight").textContent = catProfile.weightKg;

    $("cat-name").value = catProfile.name;
    $("cat-age").value = catProfile.age;
    $("cat-weight").value = catProfile.weightKg;
    $("cat-food").value = catProfile.favoriteFood;
    $("cat-activity").value = catProfile.activity;

    $("stat-weight").textContent = `${catProfile.weightKg} kg`;
}

// LOAD FEEDING RECORDS

async function loadFeeding() {
    const result = await apiRequest("/api/feeding");

    feedingRecords = result.records || [];

    renderFeeding();
}

function renderFeeding() {
    const table = $("feeding-table");

    if (!feedingRecords.length) {
        table.innerHTML = `
            <tr>
                <td colspan="6">No feeding records found.</td>
            </tr>`;
    } else {
        table.innerHTML = feedingRecords.map(record => `
            <tr>
                <td>${escapeHTML(record.foodName)}</td>
                <td>${record.quantityGrams} g</td>
                <td>${escapeHTML(record.mealTime)}</td>
                <td>${formatDate(record.createdAt)}</td>
                <td>${escapeHTML(record.notes || "-")}</td>
                <td>
                    <button onclick="editFeeding(${record.id})">Edit</button>
                    <button onclick="deleteFeeding(${record.id})">Delete</button>
                </td>
            </tr>
        `).join("");
    }

    $("recent-feeding").innerHTML = feedingRecords.length
        ? feedingRecords.slice(0, 5).map(record => `
            <p class="recent-record">
                ${escapeHTML(record.foodName)}
                <strong>${record.quantityGrams} g</strong>
            </p>
        `).join("")
        : `<p>No feeding records yet.</p>`;
}

// ADD FEEDING RECORD

$("feeding-form").addEventListener("submit", async event => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);

    const data = {
        foodName: String(form.get("foodName")).trim(),
        quantityGrams: Number(form.get("quantityGrams")),
        mealTime: String(form.get("mealTime")),
        notes: String(form.get("notes") || "")
    };

    try {
        await apiRequest("/api/feeding", {
            method: "POST",
            body: JSON.stringify(data)
        });

        closeModal("feeding-modal");
        event.currentTarget.reset();

        await refreshApp();
        showMessage("Feeding record saved successfully!");

    } catch (error) {
        showError(error);
    }
});

// EDIT FEEDING RECORD

async function editFeeding(id) {
    const record = feedingRecords.find(item => item.id === id);
    if (!record) return;

    const foodName = prompt("Food name:", record.foodName);
    if (foodName === null) return;

    const quantity = prompt("Quantity in grams:", record.quantityGrams);
    if (quantity === null) return;

    const mealTime = prompt("Meal time:", record.mealTime);
    if (mealTime === null) return;

    const notes = prompt("Notes:", record.notes || "");
    if (notes === null) return;

    if (
        !foodName.trim() ||
        !mealTime.trim() ||
        !Number.isFinite(Number(quantity)) ||
        Number(quantity) <= 0
    ) {
        showMessage("Please enter valid feeding details.");
        return;
    }

    try {
        await apiRequest(`/api/feeding/${id}`, {
            method: "PATCH",
            body: JSON.stringify({
                foodName: foodName.trim(),
                quantityGrams: Number(quantity),
                mealTime: mealTime.trim(),
                notes
            })
        });

        await refreshApp();
        showMessage("Feeding record updated!");

    } catch (error) {
        showError(error);
    }
}

// DELETE FEEDING RECORD

async function deleteFeeding(id) {
    if (!confirm("Delete this feeding record?")) return;

    try {
        await apiRequest(`/api/feeding/${id}`, {
            method: "DELETE"
        });

        await refreshApp();
        showMessage("Feeding record deleted!");

    } catch (error) {
        showError(error);
    }
}

// LOAD WATER RECORDS

async function loadWater() {
    const result = await apiRequest("/api/water");

    waterRecords = result.records || [];

    renderWater();
}

function renderWater() {
    const table = $("water-table");

    if (!waterRecords.length) {
        table.innerHTML = `
            <tr>
                <td colspan="6">No water records found.</td>
            </tr>`;
    } else {
        table.innerHTML = waterRecords.map(record => `
            <tr>
                <td>${record.offeredMl} ml</td>
                <td>${record.measured ? `${record.consumedMl} ml` : "Not measured"}</td>
                <td>${record.measured ? "Yes" : "No"}</td>
                <td>${formatDate(record.createdAt)}</td>
                <td>${escapeHTML(record.notes || "-")}</td>
                <td>
                    <button onclick="editWater(${record.id})">Edit</button>
                    <button onclick="deleteWater(${record.id})">Delete</button>
                </td>
            </tr>
        `).join("");
    }

    const offered = waterRecords.reduce(
        (sum, record) => sum + Number(record.offeredMl), 0
    );

    const consumed = waterRecords.reduce(
        (sum, record) => sum +
            (record.measured ? Number(record.consumedMl || 0) : 0), 0
    );

    $("water-total-offered").textContent = `${offered} ml`;
    $("water-total-consumed").textContent = `${consumed} ml`;
}

// ADD WATER RECORD

$("measured-select").addEventListener("change", event => {
    const measured = event.target.value === "true";

    $("consumed-input").disabled = !measured;
    $("consumed-input").required = measured;

    if (!measured) {
        $("consumed-input").value = "";
    }
});

$("water-form").addEventListener("submit", async event => {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const measured = form.get("measured") === "true";

    const data = {
        offeredMl: Number(form.get("offeredMl")),
        consumedMl: measured ? Number(form.get("consumedMl")) : null,
        measured,
        notes: String(form.get("notes") || "")
    };

    if (
        measured &&
        (!Number.isFinite(data.consumedMl) || data.consumedMl < 0)
    ) {
        showMessage("Enter a valid consumed water amount.");
        return;
    }

    try {
        await apiRequest("/api/water", {
            method: "POST",
            body: JSON.stringify(data)
        });

        closeModal("water-modal");
        event.currentTarget.reset();

        $("consumed-input").disabled = false;
        $("consumed-input").required = true;

        await refreshApp();
        showMessage("Water record saved!");

    } catch (error) {
        showError(error);
    }
});

// EDIT WATER RECORD

async function editWater(id) {
    const record = waterRecords.find(item => item.id === id);
    if (!record) return;

    const offered = prompt("Water offered (ml):", record.offeredMl);
    if (offered === null) return;

    const measuredAnswer = prompt(
        "Was consumption measured? Enter yes or no:",
        record.measured ? "yes" : "no"
    );

    if (measuredAnswer === null) return;

    const answer = measuredAnswer.trim().toLowerCase();

    if (answer !== "yes" && answer !== "no") {
        showMessage("Please enter yes or no.");
        return;
    }

    const measured = answer === "yes";
    let consumed = null;

    if (measured) {
        const value = prompt(
            "Water consumed (ml):",
            record.consumedMl ?? ""
        );

        if (value === null) return;

        consumed = Number(value);

        if (!Number.isFinite(consumed) || consumed < 0) {
            showMessage("Enter a valid consumed amount.");
            return;
        }
    }

    const notes = prompt("Notes:", record.notes || "");
    if (notes === null) return;

    if (!Number.isFinite(Number(offered)) || Number(offered) < 0) {
        showMessage("Enter a valid offered amount.");
        return;
    }

    try {
        await apiRequest(`/api/water/${id}`, {
            method: "PATCH",
            body: JSON.stringify({
                offeredMl: Number(offered),
                consumedMl: consumed,
                measured,
                notes
            })
        });

        await refreshApp();
        showMessage("Water record updated!");

    } catch (error) {
        showError(error);
    }
}

// DELETE WATER RECORD

async function deleteWater(id) {
    if (!confirm("Delete this water record?")) return;

    try {
        await apiRequest(`/api/water/${id}`, {
            method: "DELETE"
        });

        await refreshApp();
        showMessage("Water record deleted!");

    } catch (error) {
        showError(error);
    }
}

// DASHBOARD

async function updateDashboard() {
    const selectedDate = $("dashboard-date").value || getLocalDate();

    const feedings = feedingRecords.filter(record =>
        record.createdAt?.slice(0, 10) === selectedDate
    );

    const waters = waterRecords.filter(record =>
        record.createdAt?.slice(0, 10) === selectedDate
    );

    const foodTotal = feedings.reduce(
        (sum, record) => sum + Number(record.quantityGrams), 0
    );

    const offeredTotal = waters.reduce(
        (sum, record) => sum + Number(record.offeredMl), 0
    );

    const consumedTotal = waters.reduce(
        (sum, record) => sum +
            (record.measured ? Number(record.consumedMl || 0) : 0), 0
    );

    $("stat-food").textContent = `${foodTotal} g`;
    $("stat-water").textContent = `${offeredTotal} ml`;
    $("stat-consumed").textContent = `${consumedTotal} ml`;

    $("stat-feeding-count").textContent =
        `${feedings.length} feeding records`;

    $("stat-water-count").textContent =
        `${waters.length} water records`;

    $("wellness-feeding").textContent = feedings.length;
    $("wellness-water").textContent = waters.length;
    $("wellness-food").textContent = `${foodTotal} g`;
    $("wellness-offered").textContent = `${offeredTotal} ml`;
}

// WELLNESS REPORT

async function loadWellness() {
    const date = $("wellness-date").value;

    if (!date) {
        showMessage("Please select a date.");
        return;
    }

    try {
        const result = await apiRequest(
            `/api/wellness/daily?date=${encodeURIComponent(date)}`
        );

        const report = result;

        $("wellness-report").innerHTML = `
            <div class="report-card">
                <p>Cat Name</p>
                <h2>${escapeHTML(report.cat.name)}</h2>
            </div>

            <div class="report-card">
                <p>Cat Weight</p>
                <h2>${report.cat.weightKg} kg</h2>
            </div>

            <div class="report-card">
                <p>Feeding Records</p>
                <h2>${report.feeding.totalRecords}</h2>
            </div>

            <div class="report-card">
                <p>Total Food</p>
                <h2>${report.feeding.totalGrams} g</h2>
            </div>

            <div class="report-card">
                <p>Water Records</p>
                <h2>${report.water.totalRecords}</h2>
            </div>

            <div class="report-card">
                <p>Water Offered</p>
                <h2>${report.water.totalOfferedMl} ml</h2>
            </div>

            <div class="report-card">
                <p>Measured Water Consumption</p>
                <h2>${report.water.totalMeasuredConsumedMl} ml</h2>
            </div>
        `;

        showMessage("Wellness report generated!");

    } catch (error) {
        showError(error);
    }
}

// MODALS

function openModal(id) {
    $(id).classList.add("show");
}

function closeModal(id) {
    $(id).classList.remove("show");
}

// REFRESH ALL DATA

async function refreshApp() {
    $("connection-status").textContent = "Connecting...";

    try {
        await Promise.all([
            loadCat(),
            loadFeeding(),
            loadWater()
        ]);

        await updateDashboard();

        $("connection-status").textContent = "● API Connected";

    } catch (error) {
        $("connection-status").textContent = "● Connection Error";
        showError(error);
    }
}

// INITIALIZE

$("dashboard-date").value = getLocalDate();
$("wellness-date").value = getLocalDate();

$("dashboard-date").addEventListener("change", updateDashboard);

$("refresh-btn").addEventListener("click", refreshApp);

refreshApp();
