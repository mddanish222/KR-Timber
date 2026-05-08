/*script.js*/
// ================== GLOBAL API ==================
const API = "https://kr-timber-backendd.onrender.com";

// ================== PWA SERVICE WORKER ==================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
// ================== TOAST POPUP ==================
function showToast(message) {
  let toast = document.getElementById("toastPopup");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastPopup";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// ================== LOADER ==================
function showLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) {
    loader.classList.remove("hidden");
  }
}

function hideLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) {
    loader.classList.add("hidden");
  }
}

// ================== COMMON API ==================
async function fetchWoodData(key) {
  const user = localStorage.getItem("currentUser");

  showLoader();
  try {
    const res = await fetch(API + "/get", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, type: key })
    });
    return await res.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  } finally {
    hideLoader();
  }
}

function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace("index.html");
  setTimeout(() => {
    window.location.reload();
  }, 100);
}

async function saveWoodData(key, data) {
  const user = localStorage.getItem("currentUser");

  showLoader();
  try {
    await fetch(API + "/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, type: key, data })
    });
  } catch (err) {
    console.error("Save error:", err);
  } finally {
    hideLoader();
  }
}

// ================== STRICT AUTH ==================
(function () {
  const path = window.location.pathname.split("/").pop();
  const isIndexPage = path === "" || path === "index.html";
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  if (!isIndexPage && !isLoggedIn) {
    window.location.replace("index.html");
  }
})();

// 🚫 Prevent back cache access
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    window.location.reload();
  }
});

// ================== HAMBURGER ==================
function initHamburger() {
  const hamburger = document.getElementById("hamburger");
  const sideMenu = document.getElementById("sideMenu");
  const closeMenu = document.getElementById("closeMenu");

  if (!hamburger || !sideMenu || !closeMenu) return;

  hamburger.onclick = () => sideMenu.classList.add("open");
  closeMenu.onclick = () => sideMenu.classList.remove("open");
}
document.addEventListener("DOMContentLoaded", initHamburger);

// ===========================================================
// 🌲 WOOD PAGE HANDLER

async function initWoodPage(WOOD_TYPE, LS_KEY) {

  const purchaseBtn = document.getElementById("purchaseBtn");
  const salesBtn = document.getElementById("salesBtn");
  const popupContainer = document.getElementById("popupContainer");
  const popupForm = document.getElementById("popupForm");
  const closePopupBtn = document.getElementById("closePopup");

  const sizeEl = document.getElementById("size");
  const qtyEl = document.getElementById("qty");
  const amountEl = document.getElementById("amount");
  const dateEl = document.getElementById("txDate");

  const historyListEl = document.getElementById("historyList");
  const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
  const editSelectedBtn = document.getElementById("editSelectedBtn");

  deleteSelectedBtn.style.display = "none";
  editSelectedBtn.style.display = "none";

  let state = await fetchWoodData(LS_KEY);
  state = state || { history: [] };

  // ================== BACK BUTTON ==================
  const backToStock = document.getElementById("backToStock");
  if (backToStock) {
    backToStock.onclick = () => {
      popupContainer.style.display = "none";
      popupForm.reset();
    };
  }

  // ================== DELETE and EDIT BUTTON TOGGLE ==================
  function toggleActionButtons() {
    const checked = document.querySelectorAll(".select-tx:checked");
    if (checked.length > 0) {
      deleteSelectedBtn.style.display = "inline-block";
      editSelectedBtn.style.display = "inline-block";
    } else {
      deleteSelectedBtn.style.display = "none";
      editSelectedBtn.style.display = "none";
    }
  }

  // ================== RENDER ==================
  function render(data = state.history) {
    data = [...data].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    historyListEl.innerHTML = "";

    const unitLabel = WOOD_TYPE === "Silver" ? "CFT" : "Units";

    // 🔥 GROUP BY MONTH
    const grouped = {};

    data.forEach((item, index) => {
      if (!item.date) return;

      const d = new Date(item.date);
      const monthKey = d.toLocaleString("en-US", {
        month: "long",
        year: "numeric"
      });

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          items: [],
          purchaseTotal: 0,
          salesTotal: 0
        };
      }

      grouped[monthKey].items.push({ item, index });

      if (item.type === "Purchase") {
        grouped[monthKey].purchaseTotal += item.amount;
      } else {
        grouped[monthKey].salesTotal += item.amount;
      }
    });

    // 🔥 RENDER MONTHS
    Object.keys(grouped).forEach(month => {
      const group = grouped[month];

      // 🟡 MONTH HEADER
      const header = document.createElement("div");
      header.className = "month-header";
      header.innerHTML = `
        <h3>${month}</h3>
        <div>
          Purchase Amount: ₹${group.purchaseTotal} |
          Sales Amount: ₹${group.salesTotal}
        </div>
      `;
      historyListEl.appendChild(header);

      // 🟢 ENTRIES
      group.items.forEach(({ item, index }) => {

        let total = item.totalUnits;
        let totalAmount = item.totalAmount;

        if (total === undefined || totalAmount === undefined) {
          total = 0;
          totalAmount = 0;

          for (let i = state.history.length - 1; i >= index; i--) {
            const tx = state.history[i];
            if (tx.type === "Purchase") {
              total += tx.qty;
              totalAmount -= tx.amount;
            } else {
              total -= tx.qty;
              totalAmount += tx.amount;
            }
          }
        }

        const date = item.date
          ? new Date(item.date).toLocaleDateString("en-GB")
          : "";

        const li = document.createElement("li");
        li.className = `tx-item ${item.type.toLowerCase()}`;

        li.innerHTML = `
          <input type="checkbox" class="select-tx" data-id="${item.id}" style="display:none;" />
          <div class="tx-date">${date}</div>
          <div class="tx-type">${item.type}</div>
          <div class="tx-details">
            Size: ${item.size}, ${unitLabel}: ${item.qty}, Amount: ₹${item.amount}
          </div>`;

        li.onclick = function () {
          const cb = this.querySelector(".select-tx");
          if (!cb) return;

          cb.checked = !cb.checked;

          this.style.outline = "";
          this.style.boxShadow = "";
          this.style.transform = "";

          if (cb.checked) {
            if (this.classList.contains("purchase")) {
              this.style.boxShadow =
                "0 0 0 2px #2e7d32, 0 4px 12px rgba(46,125,50,0.4)";
            } else if (this.classList.contains("sales")) {
              this.style.boxShadow =
                "0 0 0 2px #c62828, 0 4px 12px rgba(198,40,40,0.4)";
            } else {
              this.style.boxShadow =
                "0 0 0 2px #000, 0 4px 10px rgba(0,0,0,0.3)";
            }
            this.style.transform = "scale(0.98)";
          }

          toggleActionButtons();
        };

        historyListEl.appendChild(li);
      });
    });

    updateStockBySize();
    toggleActionButtons();
  }

  // ================== STOCK FILTER ==================
  function updateStockBySize() {
    const sizeFilter = document.getElementById("sizeFilter");
    const selectedSize = sizeFilter.value;

    let purchaseUnits = 0;
    let saleUnits = 0;

    state.history.forEach(item => {
      if (selectedSize !== "all" && item.size !== selectedSize) return;
      if (item.type === "Purchase") purchaseUnits += item.qty;
      else saleUnits += item.qty;
    });

    document.getElementById("purchaseUnits").textContent =
      "Purchase Units: " + purchaseUnits;
    document.getElementById("saleUnits").textContent =
      "Sale Units: " + saleUnits;
    document.getElementById("remainingUnits").textContent =
      "Remaining Units: " + (purchaseUnits - saleUnits);
  }

  // ================== SAVE ==================
  async function save(tx) {
    let last = state.history[0];

    let prevUnits = last ? last.totalUnits : 0;
    let prevAmount = last ? last.totalAmount : 0;

    if (tx.type === "Sales") {
      if (tx.qty > prevUnits) {
        alert("Insufficient stock");
        return false;
      }
    }

    if (tx.type === "Purchase") {
      tx.totalUnits = prevUnits + tx.qty;
      tx.totalAmount = prevAmount - tx.amount;
    } else {
      tx.totalUnits = prevUnits - tx.qty;
      tx.totalAmount = prevAmount + tx.amount;
    }

    state.units = tx.totalUnits;
    state.amount = tx.totalAmount;

    state.history.unshift(tx);

    await saveWoodData(LS_KEY, state);
    return true;
  }

  // ================== EVENTS ==================
  purchaseBtn.onclick = () => {
    popupContainer.style.display = "block";
    popupContainer.dataset.mode = "Purchase";
  };

  salesBtn.onclick = () => {
    popupContainer.style.display = "block";
    popupContainer.dataset.mode = "Sales";
  };

  closePopupBtn.onclick = () => {
    popupContainer.style.display = "none";
    popupForm.reset();
  };

  popupForm.onsubmit = async (e) => {
    e.preventDefault();

    const tx = {
      id: Date.now(),
      type: popupContainer.dataset.mode || "Purchase",
      size: sizeEl.value,
      qty: parseFloat(qtyEl.value),
      amount: parseFloat(amountEl.value),
      date: dateEl.value
    };

    if (await save(tx)) {
      render();
      popupForm.reset();
      popupContainer.style.display = "none";
      showToast("✅ Entry added successfully!");
    }
  };

  // ================== DELETE ==================
  deleteSelectedBtn?.addEventListener("click", async () => {
    const checked = [...document.querySelectorAll(".select-tx:checked")];
    const ids = checked.map(c => +c.dataset.id);
    const count = ids.length;

    state.history = state.history.filter(item => !ids.includes(item.id));

    let runningUnits = 0;
    let runningAmount = 0;

    for (let i = state.history.length - 1; i >= 0; i--) {
      const tx = state.history[i];
      if (tx.type === "Purchase") {
        runningUnits += tx.qty;
        runningAmount -= tx.amount;
      } else {
        runningUnits -= tx.qty;
        runningAmount += tx.amount;
      }
      tx.totalUnits = runningUnits;
      tx.totalAmount = runningAmount;
    }

    state.units = runningUnits;
    state.amount = runningAmount;

    await saveWoodData(LS_KEY, state);

    toggleActionButtons();
    render();
    showToast(`🗑️ ${count} entr${count > 1 ? "ies" : "y"} deleted successfully!`);
  });

  // ================== EDIT ==================
  editSelectedBtn?.addEventListener("click", () => {
    const checked = [...document.querySelectorAll(".select-tx:checked")];

    if (checked.length !== 1) {
      alert("Select only ONE item to edit");
      return;
    }

    const id = +checked[0].dataset.id;
    const index = state.history.findIndex(item => item.id === id);
    const tx = state.history[index];

    popupContainer.style.display = "block";
    popupContainer.dataset.mode = tx.type;

    sizeEl.value = tx.size;
    qtyEl.value = tx.qty;
    amountEl.value = tx.amount;
    dateEl.value = tx.date;

    state.history.splice(index, 1);
    saveWoodData(LS_KEY, state);

    render();
    showToast("✏️ Entry ready to edit — update and save!");
  });

  document.getElementById("sizeFilter")?.addEventListener("change", updateStockBySize);

  // ================== DATE FILTER ==================
  const fromDateEl = document.getElementById("fromDate");
  const toDateEl = document.getElementById("toDate");
  const filterBtnEl = document.getElementById("filterBtn");
  const resetFilterBtnEl = document.getElementById("resetFilterBtn");

  if (filterBtnEl && resetFilterBtnEl) {
    filterBtnEl.addEventListener("click", () => {
      const from = fromDateEl.value ? new Date(fromDateEl.value) : null;
      const to = toDateEl.value ? new Date(toDateEl.value) : null;

      if (from) from.setHours(0, 0, 0, 0);
      if (to) to.setHours(23, 59, 59, 999);

      const filtered = state.history.filter(entry => {
        if (!entry.date) return false;
        const d = new Date(entry.date);
        return (!from || d >= from) && (!to || d <= to);
      });

      render(filtered);
    });

    resetFilterBtnEl.addEventListener("click", () => {
      fromDateEl.value = "";
      toDateEl.value = "";
      render();
    });
  }

  render(); // ✅ initial load
}

// ================== AUTO LOAD ==================
(async function () {
  const woodType = document.body.dataset.wood;
  if (!woodType) return;

  const map = {
    Silver: "woodapp_silver_v1",
    Poles: "woodapp_poles_v1",
    Plywood: "woodapp_plywood_v1",
    "Old Playwood": "woodapp_oldplaywood_v1"
  };

  await initWoodPage(woodType, map[woodType]);
})();

// ================== DATE FILTER TOGGLE ==================
const toggleSearch = document.getElementById("toggleSearch");
const dateFilterBox = document.getElementById("dateFilterBox");

if (toggleSearch && dateFilterBox) {
  toggleSearch.addEventListener("click", () => {
    dateFilterBox.classList.toggle("hidden");
  });
}

// ================== OVERALL CALCULATION (HOME) ==================
(async function () {
  try {
    const totalPurchaseEl = document.getElementById("totalPurchase");
    if (!totalPurchaseEl) return;

    const WOOD_KEYS = [
      { key: "woodapp_silver_v1", name: "Silver" },
      { key: "woodapp_poles_v1", name: "Poles" },
      { key: "woodapp_plywood_v1", name: "Plywood" },
      { key: "woodapp_oldplaywood_v1", name: "Old Playwood" }
    ];

    async function calculateTotals(selected) {
      let totalPurchase = 0;
      let totalSales = 0;

      const woods =
        selected === "overall"
          ? WOOD_KEYS
          : WOOD_KEYS.filter((w) => w.name === selected);

      for (let wood of woods) {
        const data = await fetchWoodData(wood.key);
        if (!data) continue;

        (data.history || []).forEach((item) => {
          if (item.type === "Purchase") totalPurchase += item.amount;
          if (item.type === "Sales") totalSales += item.amount;
        });
      }

      document.getElementById("totalPurchase").textContent =
        "₹" + totalPurchase.toLocaleString("en-IN");

      document.getElementById("totalSales").textContent =
        "₹" + totalSales.toLocaleString("en-IN");

      const profit = totalSales - totalPurchase;

      const profitEl = document.getElementById("profitLoss");
      profitEl.textContent = "₹" + profit.toLocaleString("en-IN");

      if (profit < 0) {
        profitEl.classList.add("loss");
      } else {
        profitEl.classList.remove("loss");
      }
    }

    document
      .getElementById("woodSelect")
      ?.addEventListener("change", (e) => {
        calculateTotals(e.target.value);
      });

    calculateTotals("overall");

  } catch (err) {
    console.error("Home calculation error:", err);
  }
})();

// ================== EXPENDITURE (MONGODB VERSION) ==================
document.addEventListener("DOMContentLoaded", async () => {

  const expForm = document.getElementById('expForm');
  if (!expForm) return;

  const expDate = document.getElementById('expDate');
  const expAmount = document.getElementById('expAmount');
  const expDesc = document.getElementById('expDesc');
  const expHistory = document.getElementById('expHistory');
  const resetExp = document.getElementById('resetExp');

  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const editSelectedBtn = document.getElementById('editSelectedBtn');

  const dailyEl = document.getElementById('dailyExp');
  const monthlyEl = document.getElementById('monthlyExp');
  const yearlyEl = document.getElementById('yearlyExp');
  const dailyDate = document.getElementById('dailyDate');
  const monthSelect = document.getElementById('monthSelect');
  const yearSelect = document.getElementById('yearSelect');

  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  const filterBtn = document.getElementById('filterBtn');
  const resetFilterBtn = document.getElementById('resetFilterBtn');

  const toggleSearchExp = document.getElementById("toggleSearch");
  const dateFilterBoxExp = document.getElementById("dateFilterBox");

  // Back button for expenditure
  const backToHome = document.getElementById("backToHome");
  if (backToHome) {
    backToHome.onclick = () => {
      window.location.href = "home.html";
    };
  }

  const KEY = "woodapp_expenditure_v1";

  let state = await fetchWoodData(KEY);
  state = state || { history: [] };

  let editingIndex = null;

  deleteSelectedBtn.style.display = "none";
  editSelectedBtn.style.display = "none";

  function inr(n) {
    return "₹" + (Number(n) || 0).toLocaleString("en-IN");
  }

  function formatDate(d) {
    const dt = new Date(d);
    return isNaN(dt)
      ? ""
      : `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
  }

  function toggleButtons() {
    const selected = document.querySelector("#expHistory li.selected");
    if (selected) {
      deleteSelectedBtn.style.display = "inline-block";
      editSelectedBtn.style.display = "inline-block";
    } else {
      deleteSelectedBtn.style.display = "none";
      editSelectedBtn.style.display = "none";
    }
  }

  function render(data = state.history) {
    data = [...data].sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    expHistory.innerHTML = "";

    data.forEach((x) => {
      const li = document.createElement("li");
      li.dataset.id = x.id;
      li.innerHTML = `
        <div class="tx-date">${formatDate(x.date)}</div>
        <div class="tx-details">${x.desc}</div>
        <div class="tx-amount">${inr(x.amount)}</div>
      `;

      li.addEventListener("click", () => {
        li.classList.toggle("selected");
        toggleButtons();
      });

      expHistory.appendChild(li);
    });

    toggleButtons();
  }

  // ===== SAVE / UPDATE =====
  expForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const d = expDate.value;
    const a = parseFloat(expAmount.value);
    const t = expDesc.value.trim();

    if (!d || !a || !t) return alert("Fill all details");

    if (editingIndex !== null) {
      state.history[editingIndex] = { ...state.history[editingIndex], date: d, amount: a, desc: t };
      editingIndex = null;
      await saveWoodData(KEY, state);
      render();
      calcTotals();
      expForm.reset();
      showToast("✏️ Entry updated successfully!");
    } else {
      state.history.push({ id: Date.now(), date: d, amount: a, desc: t });
      await saveWoodData(KEY, state);
      render();
      calcTotals();
      expForm.reset();
      showToast("✅ Entry added successfully!");
    }
  });

  // ===== RESET =====
  resetExp.addEventListener("click", () => {
    expForm.reset();
    editingIndex = null;
  });

  // ===== DELETE =====
  deleteSelectedBtn.addEventListener("click", async () => {
    const selected = document.querySelectorAll("#expHistory li.selected");
    if (selected.length === 0) return;

    const ids = [...selected].map(li => li.dataset.id);
    const count = ids.length;

    state.history = state.history.filter(item =>
      !ids.includes(String(item.id))
    );

    await saveWoodData(KEY, state);

    render();
    calcTotals();
    showToast(`🗑️ ${count} entr${count > 1 ? "ies" : "y"} deleted successfully!`);
  });

  // ===== EDIT =====
  editSelectedBtn.addEventListener("click", () => {
    const selected = document.querySelectorAll("#expHistory li.selected");

    if (selected.length === 0) {
      alert("Select one entry to edit");
      return;
    }

    if (selected.length > 1) {
      alert("Select only ONE entry to edit");
      return;
    }

    const li = selected[0];
    const id = Number(li.dataset.id);
    const tx = state.history.find(item => item.id === id);
    editingIndex = state.history.findIndex(item => item.id === id);

    expDate.value = tx.date;
    expAmount.value = tx.amount;
    expDesc.value = tx.desc;

    showToast("✏️ Entry loaded — make changes and save!");
  });

  // ===== FILTER =====
  if (filterBtn && resetFilterBtn) {
    filterBtn.addEventListener("click", () => {
      const from = fromDate.value ? new Date(fromDate.value) : null;
      const to = toDate.value ? new Date(toDate.value) : null;

      if (from) from.setHours(0, 0, 0, 0);
      if (to) to.setHours(23, 59, 59, 999);

      const filtered = state.history.filter((x) => {
        const d = new Date(x.date);
        return (!from || d >= from) && (!to || d <= to);
      });

      render(filtered);
    });

    resetFilterBtn.addEventListener("click", () => {
      fromDate.value = "";
      toDate.value = "";
      render();
    });
  }

  // ===== SEARCH TOGGLE =====
  if (toggleSearchExp && dateFilterBoxExp) {
    dateFilterBoxExp.style.display = "none";

    toggleSearchExp.addEventListener("click", () => {
      dateFilterBoxExp.style.display =
        dateFilterBoxExp.style.display === "none" ? "block" : "none";
    });
  }

  // ===== TOTALS =====
  function calcTotals() {
    const today = new Date();

    const todayStr =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0");

    const monthStr = todayStr.slice(0, 7);
    const yearNum = today.getFullYear();

    const dTotal = state.history
      .filter((x) => x.date === todayStr)
      .reduce((s, x) => s + x.amount, 0);

    const mTotal = state.history
      .filter((x) => x.date.startsWith(monthStr))
      .reduce((s, x) => s + x.amount, 0);

    const yTotal = state.history
      .filter((x) => new Date(x.date).getFullYear() === yearNum)
      .reduce((s, x) => s + x.amount, 0);

    dailyDate.value = todayStr;
    monthSelect.value = monthStr;
    yearSelect.value = yearNum;

    dailyEl.textContent = inr(dTotal);
    monthlyEl.textContent = inr(mTotal);
    yearlyEl.textContent = inr(yTotal);
  }

  render();
  calcTotals();
});

