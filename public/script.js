
/* ==========================================
   CATCARE HUB
   Frontend: HTML + CSS + JavaScript
   Backend: TypeScript + Express API
========================================== */

const API_URL = "";

let catProfile = null;
let feedingRecords = [];
let waterRecords = [];

const $ = (id) => document.getElementById(id);


// ==========================================
// 1. DATE HELPERS
// ==========================================

// Get today's date using the computer's local timezone.
function getLocalDate() {
    const now = new Date();

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function formatDate(dateValue) {
    if (!dateValue) return "";

    const parts = dateValue.split("-");

    if (parts.length !== 3) return dateValue;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}


// ==========================================
// 2. API CONNECTION
// ==========================================

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            ...(options.body
                ? { "Content-Type": "application/json" }
                : {}),
            ...options.headers
        }
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success === false) {
        throw new Error(
            result.message || `Request failed: ${response.status}`
        );
    }

    return result;
}


// ==========================================
// 3. MESSAGE DISPLAY
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
// 4. NAVIGATION
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

    if ($("page-name")) {
        $("page-name").textContent =
            pageName.charAt(0).toUpperCase() + pageName.slice(1);
    }

    if (pageName === "dashboard") {
        updateDashboard();
    }

    if (pageName === "profile") {
        loadCat();
    }

    if (pageName === "feeding") {
        renderFeeding();
    }

    if (pageName === "water") {
        renderWater();
    }

    if (pageName === "wellness") {
        loadWellness();
    }
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.dataset.page);
    });
});

// Also support buttons with data-page.
document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.page);
    });
});


// ==========================================
// 5. CAT PROFILE
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


// Update cat profile.
if ($("profile-form")) {
    $("profile-form").addEventListener("submit", async event => {
        event.preventDefault();

        const form = event.currentTarget;

        const input = {
            name: form.elements.name.value.trim(),
            age: Number(form.elements.age.value),
            weightKg: Number(form.elements.weightKg.value),
            favoriteFood: form.elements.favoriteFood.value.trim(),
            activity: form.elements.activity.value.trim()
        };

        if (
            !input.name ||
            !Number.isFinite(input.age) ||
            input.age < 0 ||
            !Number.isFinite(input.weightKg) ||
            input.weightKg <= 0
        ) {
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
// 6. FEEDING TRACKER
// ==========================================

// Load all feeding records.
// Date filtering is performed in the browser.
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


// Get feeding records for the selected filter date.
function getFilteredFeeding() {
    const selectedDate = $("feeding-date-filter")?.value;

    if (!selectedDate) {
        return feedingRecords;
    }

    return feedingRecords.filter(
        record => record.recordDate === selectedDate
    );
}


// Display feeding table.
function renderFeeding() {
    const table = $("feeding-table");

    if (!table) return;

    table.innerHTML = "";

    const records = getFilteredFeeding();

    if (records.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7">No feeding records found.</td>
            </tr>
        `;
        return;
    }

    const sortedRecords = [...records].sort((a, b) =>
        (b.recordDate || "").localeCompare(a.recordDate || "") ||
        b.id - a.id
    );

    sortedRecords.forEach(record => {
        const row = document.createElement("tr");

        const values = [
            record.id,
            record.foodName,
            `${record.quantityGrams} g`,
            record.mealTime,
            formatDate(record.recordDate),
            record.notes || ""
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = String(value ?? "");
            row.appendChild(cell);
        });

        const actions = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.textContent = "Edit";
        editButton.type = "button";
        editButton.addEventListener("click", () => {
            editFeeding(record.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.type = "button";
        deleteButton.addEventListener("click", () => {
            deleteFeeding(record.id);
        });

        actions.append(editButton, deleteButton);
        row.appendChild(actions);

        table.appendChild(row);
    });
}


// Add feeding record.
if ($("feeding-form")) {
    $("feeding-form").addEventListener("submit", async event => {
        event.preventDefault();

        const form = event.currentTarget;

        const input = {
            recordDate: form.elements.recordDate.value,
            foodName: form.elements.foodName.value.trim(),
            quantityGrams: Number(form.elements.quantityGrams.value),
            mealTime: form.elements.mealTime.value,
            notes: form.elements.notes.value.trim()
        };

        if (
            !input.recordDate ||
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


// Edit feeding record, including its date.
async function editFeeding(id) {
    const record = feedingRecords.find(item => item.id === id);

    if (!record) return;

    const recordDate = prompt(
        "Record date (YYYY-MM-DD):",
        record.recordDate
    );

    if (recordDate === null) return;

    const foodName = prompt(
        "Food name:",
        record.foodName
    );

    if (foodName === null) return;

    const quantity = prompt(
        "Quantity in grams:",
        record.quantityGrams
    );

    if (quantity === null) return;

    const mealTime = prompt(
        "Meal time:",
        record.mealTime
    );

    if (mealTime === null) return;

    const notes = prompt(
        "Notes:",
        record.notes || ""
    );

    if (notes === null) return;

    const input = {
        recordDate: recordDate.trim(),
        foodName: foodName.trim(),
        quantityGrams: Number(quantity),
        mealTime: mealTime.trim(),
        notes: notes.trim()
    };

    if (
        !input.recordDate ||
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

        showMessage("Feeding record updated successfully!");

    } catch (error) {
        showMessage(error.message, "error");
    }
}


// Delete feeding record.
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


// Feeding date filter.
if ($("feeding-date-filter")) {
    $("feeding-date-filter").addEventListener("change", renderFeeding);
}

if ($("feeding-clear-filter")) {
    $("feeding-clear-filter").addEventListener("click", () => {
        $("feeding-date-filter").value = "";
        renderFeeding();
    });
}


// ==========================================
// 7. WATER TRACKER
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


// Filter water records by selected date.
function getFilteredWater() {
    const selectedDate = $("water-date-filter")?.value;

    if (!selectedDate) {
        return waterRecords;
    }

    return waterRecords.filter(
        record => record.recordDate === selectedDate
    );
}


// Display water table and totals.
function renderWater() {
    const table = $("water-table");

    if (!table) return;

    table.innerHTML = "";

    const records = getFilteredWater();

    if (records.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7">No water records found.</td>
            </tr>
        `;
    } else {
        const sortedRecords = [...records].sort((a, b) =>
            (b.recordDate || "").localeCompare(a.recordDate || "") ||
            b.id - a.id
        );

        sortedRecords.forEach(record => {
            const row = document.createElement("tr");

            const values = [
                record.id,
                `${record.offeredMl} ml`,
                record.measured
                    ? `${record.consumedMl} ml`
                    : "Not measured",
                record.measured ? "Yes" : "No",
                formatDate(record.recordDate),
                record.notes || ""
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = String(value ?? "");
                row.appendChild(cell);
            });

            const actions = document.createElement("td");

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.type = "button";
            editButton.addEventListener("click", () => {
                editWater(record.id);
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.type = "button";
            deleteButton.addEventListener("click", () => {
                deleteWater(record.id);
            });

            actions.append(editButton, deleteButton);
            row.appendChild(actions);

            table.appendChild(row);
        });
    }

    // Calculate totals using only currently filtered records.
    const totalOffered = records.reduce(
        (sum, record) => sum + Number(record.offeredMl || 0),
        0
    );

    const totalConsumed = records.reduce(
        (sum, record) =>
            sum + (
                record.measured
                    ? Number(record.consumedMl || 0)
                    : 0
            ),
        0
    );

    if ($("water-total-offered")) {
        $("water-total-offered").textContent =
            `${totalOffered} ml`;
    }

    if ($("water-total-consumed")) {
        $("water-total-consumed").textContent =
            `${totalConsumed} ml`;
    }
}


// Add water record.
if ($("water-form")) {
    $("water-form").addEventListener("submit", async event => {
        event.preventDefault();

        const form = event.currentTarget;

        const measured = form.elements.measured.value === "true";

        const input = {
            recordDate: form.elements.recordDate.value,
            offeredMl: Number(form.elements.offeredMl.value),
            measured,
            consumedMl: measured
                ? Number(form.elements.consumedMl.value)
                : null,
            notes: form.elements.notes.value.trim()
        };

        if (
            !input.recordDate ||
            !Number.isFinite(input.offeredMl) ||
            input.offeredMl < 0 ||
            (
                measured &&
                (
                    !Number.isFinite(input.consumedMl) ||
                    input.consumedMl < 0
                )
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


// Edit water record, including its date.
async function editWater(id) {
    const record = waterRecords.find(item => item.id === id);

    if (!record) return;

    const recordDate = prompt(
        "Record date (YYYY-MM-DD):",
        record.recordDate
    );

    if (recordDate === null) return;

    const offered = prompt(
        "Water offered (ml):",
        record.offeredMl
    );

    if (offered === null) return;

    const measured = confirm(
        "Do you have a measured consumption value?"
    );

    let consumed = null;

    if (measured) {
        consumed = prompt(
            "Water consumed (ml):",
            record.consumedMl ?? ""
        );

        if (consumed === null) return;

        consumed = Number(consumed);
    }

    const notes = prompt(
        "Notes:",
        record.notes || ""
    );

    if (notes === null) return;

    const input = {
        recordDate: recordDate.trim(),
        offeredMl: Number(offered),
        measured,
        consumedMl: measured ? consumed : null,
        notes: notes.trim()
    };

    if (
        !input.recordDate ||
        !Number.isFinite(input.offeredMl) ||
        input.offeredMl < 0 ||
        (
            measured &&
            (!Number.isFinite(consumed) || consumed < 0)
        )
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

        showMessage("Water record updated successfully!");

    } catch (error) {
        showMessage(error.message, "error");
    }
}


// Delete water record.
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


// Water date filter.
if ($("water-date-filter")) {
    $("water-date-filter").addEventListener("change", renderWater);
}

if ($("water-clear-filter")) {
    $("water-clear-filter").addEventListener("click", () => {
        $("water-date-filter").value = "";
        renderWater();
    });
}


// ==========================================
// 8. DASHBOARD
// ==========================================

function updateDashboard() {
    const selectedDate =
        $("dashboard-date-filter")?.value || getLocalDate();

    const selectedFeeding = feedingRecords.filter(
        record => record.recordDate === selectedDate
    );

    const selectedWater = waterRecords.filter(
        record => record.recordDate === selectedDate
    );

    const foodTotal = selectedFeeding.reduce(
        (sum, record) =>
            sum + Number(record.quantityGrams || 0),
        0
    );

    const waterOffered = selectedWater.reduce(
        (sum, record) =>
            sum + Number(record.offeredMl || 0),
        0
    );

    const waterConsumed = selectedWater.reduce(
        (sum, record) =>
            sum + (
                record.measured
                    ? Number(record.consumedMl || 0)
                    : 0
            ),
        0
    );

    if ($("stat-food")) {
        $("stat-food").textContent = `${foodTotal} g`;
    }

    if ($("stat-feeding-count")) {
        $("stat-feeding-count").textContent =
            selectedFeeding.length;
    }

    if ($("stat-water")) {
        $("stat-water").textContent = `${waterOffered} ml`;
    }

    if ($("stat-water-count")) {
        $("stat-water-count").textContent =
            selectedWater.length;
    }

    if ($("stat-consumed")) {
        $("stat-consumed").textContent = `${waterConsumed} ml`;
    }

    if (catProfile && $("stat-weight")) {
        $("stat-weight").textContent =
            `${catProfile.weightKg} kg`;
    }

    if ($("dashboard-date")) {
        $("dashboard-date").textContent =
            `Showing records for ${formatDate(selectedDate)}`;
    }

    renderRecentFeeding(selectedFeeding);
}


// Show the five most recent feeding records for selected date.
function renderRecentFeeding(records) {
    const container = $("recent-feeding");

    if (!container) return;

    container.innerHTML = "";

    if (records.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="4">No feeding activity for this date.</td>
            </tr>
        `;
        return;
    }

    const recentRecords = [...records]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);

    recentRecords.forEach(record => {
        const row = document.createElement("tr");

        const values = [
            record.foodName,
            `${record.quantityGrams} g`,
            record.mealTime,
            formatDate(record.recordDate)
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = String(value ?? "");
            row.appendChild(cell);
        });

        container.appendChild(row);
    });
}


// Dashboard date selection.
if ($("dashboard-date-filter")) {
    $("dashboard-date-filter").addEventListener(
        "change",
        updateDashboard
    );
}


// ==========================================
// 9. WELLNESS REPORT
// ==========================================

async function loadWellness() {
    const date =
        $("wellness-date")?.value || getLocalDate();

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
        ["Date", formatDate(report.date)],
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

        item.append(
            strong,
            document.createTextNode(String(value))
        );

        container.appendChild(item);
    });
}


if ($("wellness-date")) {
    $("wellness-date").addEventListener("change", loadWellness);
}


// ==========================================
// 10. MODAL HELPERS
// ==========================================

function openModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.style.display = "flex";

    // Set the form date when opening a new record form.
    if (id === "feeding-modal" && $("feeding-record-date")) {
        $("feeding-record-date").value =
            $("dashboard-date-filter")?.value || getLocalDate();
    }

    if (id === "water-modal" && $("water-record-date")) {
        $("water-record-date").value =
            $("dashboard-date-filter")?.value || getLocalDate();
    }
}


function closeModal(id) {
    const modal = $(id);

    if (modal) {
        modal.style.display = "none";
    }
}


// Open modal buttons.
document.querySelectorAll("[data-open-modal]").forEach(button => {
    button.addEventListener("click", () => {
        openModal(button.dataset.openModal);
    });
});


// Close modal buttons.
document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => {
        closeModal(button.dataset.closeModal);
    });
});


// ==========================================
// 11. REFRESH APPLICATION
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
// 12. START APPLICATION
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    const today = getLocalDate();

    if ($("dashboard-date-filter")) {
        $("dashboard-date-filter").value = today;
    }

    if ($("wellness-date")) {
        $("wellness-date").value = today;
    }

    if ($("feeding-record-date")) {
        $("feeding-record-date").value = today;
    }

    if ($("water-record-date")) {
        $("water-record-date").value = today;
    }

    await refreshApp();
});
