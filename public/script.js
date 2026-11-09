
/* ==========================================
   CATCARE - FRONTEND APPLICATION
   HTML + CSS + JavaScript + Express API
========================================== */

// Empty URL means use the same server as the webpage.
const API_URL = "";

// Store application data
let catProfile = null;
let feedingRecords = [];
let waterRecords = [];

// DOM helper
const $ = (id) => document.getElementById(id);


// ==========================================
// 1. API CONNECTION
// ==========================================

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...options.headers
        }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
        throw new Error(result.message || `Request failed: ${response.status}`);
    }

    return result;
}


// ==========================================
// 2. MESSAGE DISPLAY
// ==========================================

function showMessage(message, type = "success") {
    const element = $("message");

    if (!element) {
        alert(message);
        return;
    }

    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = "block";

    window.setTimeout(() => {
        element.style.display = "none";
    }, 4000);
}


// ==========================================
// 3. NAVIGATION
// ==========================================

function showPage(pageName) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    const selectedPage = $(`${pageName}-page`);

    if (selectedPage) {
        selectedPage.classList.add("active-page");
    }

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === pageName
        );
    });

    const pageNameElement = $("page-name");

    if (pageNameElement) {
        pageNameElement.textContent =
            pageName.charAt(0).toUpperCase() + pageName.slice(1);
    }

    if (pageName === "dashboard") {
        refreshApp();
    }

    if (pageName === "profile") {
        loadCat();
    }

    if (pageName === "feeding") {
        loadFeeding();
    }

    if (pageName === "water") {
        loadWater();
    }

    if (pageName === "wellness") {
        loadWellness();
    }
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
        showPage(link.dataset.page);
    });
});


// ==========================================
// 4. CAT PROFILE
// ==========================================

async function loadCat() {
    try {
        const result = await apiRequest("/api/cat");

        catProfile = result.data || result.cat || result;

        if (!catProfile) {
            throw new Error("Cat profile not found.");
        }

        displayCatProfile();

        return catProfile;
    } catch (error) {
        showMessage(error.message, "error");
        throw error;
    }
}


function displayCatProfile() {
    if (!catProfile) return;

    if ($("profile-name")) {
        $("profile-name").textContent = catProfile.name;
    }

    if ($("profile-age")) {
        $("profile-age").textContent = catProfile.age;
    }

    if ($("profile-weight")) {
        $("profile-weight").textContent =
            `${catProfile.weightKg} kg`;
    }

    if ($("cat-name")) {
        $("cat-name").value = catProfile.name || "";
    }

    if ($("cat-age")) {
        $("cat-age").value = catProfile.age ?? "";
    }

    if ($("cat-weight")) {
        $("cat-weight").value = catProfile.weightKg ?? "";
    }

    if ($("cat-food")) {
        $("cat-food").value = catProfile.favoriteFood || "";
    }

    if ($("cat-activity")) {
        $("cat-activity").value = catProfile.activity || "";
    }

    if ($("stat-weight")) {
        $("stat-weight").textContent =
            `${catProfile.weightKg} kg`;
    }
}


// Update cat profile
if ($("profile-form")) {
    $("profile-form").addEventListener("submit", async event => {
        event.preventDefault();

        const input = {
            name: $("cat-name").value.trim(),
            age: Number($("cat-age").value),
            weightKg: Number($("cat-weight").value),
            favoriteFood: $("cat-food").value.trim(),
            activity: $("cat-activity").value.trim()
        };

        if (!input.name || input.age < 0 || input.weightKg <= 0) {
            showMessage("Please enter valid cat information.", "error");
            return;
        }

        try {
            await apiRequest("/api/cat", {
                method: "PATCH",
                body: JSON.stringify(input)
            });

            await loadCat();

            showMessage("Cat profile updated successfully!");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}


// ==========================================
// 5. FEEDING TRACKER
// ==========================================

async function loadFeeding() {
    try {
        const result = await apiRequest("/api/feeding");

        feedingRecords = result.records || result.data || [];

        renderFeeding();
        updateDashboard();

        return feedingRecords;
    } catch (error) {
        showMessage(error.message, "error");
        throw error;
    }
}


function renderFeeding() {
    const table = $("feeding-table");

    if (!table) return;

    table.innerHTML = "";

    if (feedingRecords.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">No feeding records found.</td>
            </tr>
        `;
        return;
    }

    feedingRecords.forEach(record => {
        const row = document.createElement("tr");

        const values = [
            record.foodName,
            `${record.quantityGrams} g`,
            record.mealTime,
            record.notes || ""
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "";
            row.appendChild(cell);
        });

        const actions = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.type = "button";
        editButton.addEventListener("click", () => editFeeding(record.id));

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => deleteFeeding(record.id));

        actions.append(editButton, deleteButton);
        row.appendChild(actions);

        table.appendChild(row);
    });
}


// Add feeding record
if ($("feeding-form")) {
    $("feeding-form").addEventListener("submit", async event => {
        event.preventDefault();

        const form = event.currentTarget;

        const input = {
            foodName: form.elements.foodName.value.trim(),
            quantityGrams: Number(form.elements.quantityGrams.value),
            mealTime: form.elements.mealTime.value,
            notes: form.elements.notes.value.trim()
        };

        if (
            !input.foodName ||
            !Number.isFinite(input.quantityGrams) ||
            input.quantityGrams <= 0 ||
            !input.mealTime
        ) {
            showMessage("Please enter valid feeding information.", "error");
            return;
        }

        try {
            await apiRequest("/api/feeding", {
                method: "POST",
                body: JSON.stringify(input)
            });

            form.reset();

            closeModal("feeding-modal");

            await loadFeeding();

            showMessage("Feeding record saved successfully!");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}


// Edit feeding record
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

    const input = {
        foodName: foodName.trim(),
        quantityGrams: Number(quantity),
        mealTime: mealTime.trim(),
        notes: notes.trim()
    };

    if (
        !input.foodName ||
        !Number.isFinite(input.quantityGrams) ||
        input.quantityGrams <= 0 ||
        !input.mealTime
    ) {
        showMessage("Invalid feeding information.", "error");
        return;
    }

    try {
        await apiRequest(`/api/feeding/${id}`, {
            method: "PATCH",
            body: JSON.stringify(input)
        });

        await loadFeeding();

        showMessage("Feeding record updated!");
    } catch (error) {
        showMessage(error.message, "error");
    }
}


// Delete feeding record
async function deleteFeeding(id) {
    if (!confirm("Are you sure you want to delete this feeding record?")) {
        return;
    }

    try {
        await apiRequest(`/api/feeding/${id}`, {
            method: "DELETE"
        });

        await loadFeeding();

        showMessage("Feeding record deleted!");
    } catch (error) {
        showMessage(error.message, "error");
    }
}


// ==========================================
// 6. WATER TRACKER
// ==========================================

async function loadWater() {
    try {
        const result = await apiRequest("/api/water");

        waterRecords = result.records || result.data || [];

        renderWater();
        updateDashboard();

        return waterRecords;
    } catch (error) {
        showMessage(error.message, "error");
        throw error;
    }
}


function renderWater() {
    const table = $("water-table");

    if (!table) return;

    table.innerHTML = "";

    if (waterRecords.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5">No water records found.</td>
            </tr>
        `;
        return;
    }

    waterRecords.forEach(record => {
        const row = document.createElement("tr");

        const values = [
            `${record.offeredMl} ml`,
            record.measured ? `${record.consumedMl} ml` : "Not measured",
            record.measured ? "Yes" : "No",
            record.notes || ""
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "";
            row.appendChild(cell);
        });

        const actions = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.type = "button";
        editButton.addEventListener("click", () => editWater(record.id));

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => deleteWater(record.id));

        actions.append(editButton, deleteButton);
        row.appendChild(actions);

        table.appendChild(row);
    });

    const totalOffered = waterRecords.reduce(
        (sum, record) => sum + Number(record.offeredMl || 0), 0
    );

    const totalConsumed = waterRecords.reduce(
        (sum, record) =>
            sum + (record.measured ? Number(record.consumedMl || 0) : 0),
        0
    );

    if ($("water-total-offered")) {
        $("water-total-offered").textContent = `${totalOffered} ml`;
    }

    if ($("water-total-consumed")) {
        $("water-total-consumed").textContent = `${totalConsumed} ml`;
    }
}


// Add water record
if ($("water-form")) {
    $("water-form").addEventListener("submit", async event => {
        event.preventDefault();

        const form = event.currentTarget;

        const measured = form.elements.measured.value === "true";

        const input = {
            offeredMl: Number(form.elements.offeredMl.value),
            measured,
            consumedMl: measured
                ? Number(form.elements.consumedMl.value)
                : null,
            notes: form.elements.notes.value.trim()
        };

        if (
            !Number.isFinite(input.offeredMl) ||
            input.offeredMl < 0 ||
            (
                measured &&
                (!Number.isFinite(input.consumedMl) ||
                 input.consumedMl < 0)
            )
        ) {
            showMessage("Please enter valid water information.", "error");
            return;
        }

        try {
            await apiRequest("/api/water", {
                method: "POST",
                body: JSON.stringify(input)
            });

            form.reset();

            closeModal("water-modal");

            await loadWater();

            showMessage("Water record saved successfully!");
        } catch (error) {
            showMessage(error.message, "error");
        }
    });
}


// Edit water record
async function editWater(id) {
    const record = waterRecords.find(item => item.id === id);

    if (!record) return;

    const offered = prompt("Water offered (ml):", record.offeredMl);
    if (offered === null) return;

    const measured = confirm("Do you have a measured consumption value?");

    let consumed = null;

    if (measured) {
        consumed = prompt(
            "Water consumed (ml):",
            record.consumedMl ?? ""
        );

        if (consumed === null) return;

        consumed = Number(consumed);
    }

    const notes = prompt("Notes:", record.notes || "");
    if (notes === null) return;

    const input = {
        offeredMl: Number(offered),
        measured,
        consumedMl: measured ? consumed : null,
        notes: notes.trim()
    };

    if (
        !Number.isFinite(input.offeredMl) ||
        input.offeredMl < 0 ||
        (measured && (!Number.isFinite(consumed) || consumed < 0))
    ) {
        showMessage("Invalid water information.", "error");
        return;
    }

    try {
        await apiRequest(`/api/water/${id}`, {
            method: "PATCH",
            body: JSON.stringify(input)
        });

        await loadWater();

        showMessage("Water record updated!");
    } catch (error) {
        showMessage(error.message, "error");
    }
}


// Delete water record
async function deleteWater(id) {
    if (!confirm("Are you sure you want to delete this water record?")) {
        return;
    }

    try {
        await apiRequest(`/api/water/${id}`, {
            method: "DELETE"
        });

        await loadWater();

        showMessage("Water record deleted!");
    } catch (error) {
        showMessage(error.message, "error");
    }
}


// ==========================================
// 7. DASHBOARD
// ==========================================

function isToday(dateValue) {
    if (!dateValue) return false;

    const date = new Date(dateValue);

    const today = new Date();

    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
}


function updateDashboard() {
    const todayFeeding = feedingRecords.filter(
        record => isToday(record.createdAt)
    );

    const todayWater = waterRecords.filter(
        record => isToday(record.createdAt)
    );

    const foodTotal = todayFeeding.reduce(
        (sum, record) => sum + Number(record.quantityGrams || 0),
        0
    );

    const waterOffered = todayWater.reduce(
        (sum, record) => sum + Number(record.offeredMl || 0),
        0
    );

    const waterConsumed = todayWater.reduce(
        (sum, record) =>
            sum + (record.measured ? Number(record.consumedMl || 0) : 0),
        0
    );

    if ($("stat-food")) {
        $("stat-food").textContent = `${foodTotal} g`;
    }

    if ($("stat-feeding-count")) {
        $("stat-feeding-count").textContent = todayFeeding.length;
    }

    if ($("stat-water")) {
        $("stat-water").textContent = `${waterOffered} ml`;
    }

    if ($("stat-water-count")) {
        $("stat-water-count").textContent = todayWater.length;
    }

    if ($("stat-consumed")) {
        $("stat-consumed").textContent = `${waterConsumed} ml`;
    }

    if (catProfile && $("stat-weight")) {
        $("stat-weight").textContent = `${catProfile.weightKg} kg`;
    }

    if ($("dashboard-date")) {
        $("dashboard-date").textContent =
            new Date().toLocaleDateString();
    }

    renderRecentFeeding(todayFeeding);
}


function renderRecentFeeding(records) {
    const container = $("recent-feeding");

    if (!container) return;

    container.innerHTML = "";

    if (records.length === 0) {
        container.textContent = "No feeding activity recorded today.";
        return;
    }

    records.slice(-5).reverse().forEach(record => {
        const item = document.createElement("p");

        item.textContent =
            `${record.foodName} — ${record.quantityGrams} g (${record.mealTime})`;

        container.appendChild(item);
    });
}


// ==========================================
// 8. WELLNESS REPORT
// ==========================================

async function loadWellness() {
    const date = $("wellness-date")?.value ||
        new Date().toISOString().slice(0, 10);

    try {
        const result = await apiRequest(
            `/api/wellness/daily?date=${encodeURIComponent(date)}`
        );

        const report = result.data || result;

        renderWellness(report);

        return report;
    } catch (error) {
        showMessage(error.message, "error");
        throw error;
    }
}


function renderWellness(report) {
    const container = $("wellness-report");

    if (!container) return;

    if (!report) {
        container.textContent = "No wellness report available.";
        return;
    }

    const feeding = report.feeding || {};
    const water = report.water || {};
    const cat = report.cat || {};

    container.innerHTML = "";

    const details = [
        ["Date", report.date || ""],
        ["Cat", cat.name || "Not available"],
        ["Food records", feeding.totalRecords ?? 0],
        ["Total food", `${feeding.totalGrams ?? 0} g`],
        ["Water records", water.totalRecords ?? 0],
        ["Water offered", `${water.totalOfferedMl ?? 0} ml`],
        [
            "Measured water consumed",
            `${water.totalMeasuredConsumedMl ?? 0} ml`
        ]
    ];

    details.forEach(([label, value]) => {
        const item = document.createElement("p");

        const strong = document.createElement("strong");
        strong.textContent = `${label}: `;

        item.append(strong, document.createTextNode(String(value)));

        container.appendChild(item);
    });
}


if ($("wellness-date")) {
    $("wellness-date").addEventListener("change", loadWellness);
}


// ==========================================
// 9. MODAL HELPERS
// ==========================================

function openModal(id) {
    const modal = $(id);

    if (modal) {
        modal.style.display = "flex";
    }
}


function closeModal(id) {
    const modal = $(id);

    if (modal) {
        modal.style.display = "none";
    }
}


// Connect buttons with modal IDs
document.querySelectorAll("[data-open-modal]").forEach(button => {
    button.addEventListener("click", () => {
        openModal(button.dataset.openModal);
    });
});

document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => {
        closeModal(button.dataset.closeModal);
    });
});


// ==========================================
// 10. REFRESH APPLICATION
// ==========================================

async function refreshApp() {
    const status = $("connection-status");

    if (status) {
        status.textContent = "Connecting...";
    }

    try {
        await Promise.all([
            loadCat(),
            loadFeeding(),
            loadWater()
        ]);

        updateDashboard();

        if (status) {
            status.textContent = "Connected";
        }
    } catch (error) {
        if (status) {
            status.textContent = "Connection error";
        }

        console.error("CatCare loading error:", error);
    }
}


if ($("refresh-btn")) {
    $("refresh-btn").addEventListener("click", refreshApp);
}


// ==========================================
// 11. START APPLICATION
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    if ($("dashboard-date")) {
        $("dashboard-date").textContent =
            new Date().toLocaleDateString();
    }

    if ($("wellness-date")) {
        $("wellness-date").value =
            new Date().toISOString().slice(0, 10);
    }

    await refreshApp();
});
