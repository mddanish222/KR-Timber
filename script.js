// ================== HAMBURGER MENU LOGIC ==================
const hamburger = document.getElementById("hamburger");
const sideMenu = document.getElementById("sideMenu");
const closeMenu = document.getElementById("closeMenu");

if (hamburger && sideMenu && closeMenu) {
  hamburger.addEventListener("click", () => {
    sideMenu.classList.add("open");
  });

  closeMenu.addEventListener("click", () => {
    sideMenu.classList.remove("open");
  });

  window.addEventListener("click", (e) => {
    if (e.target === sideMenu) {
      sideMenu.classList.remove("open");
    }
  });
}

// =================home page calculation==========================================
(function () {
  const totalPurchaseEl = document.getElementById("totalPurchase");
  const totalSalesEl = document.getElementById("totalSales");
  const profitLossEl = document.getElementById("profitLoss");
  const woodSelect = document.getElementById("woodSelect");
  if (!totalPurchaseEl || !totalSalesEl || !profitLossEl || !woodSelect) return;

  const WOOD_KEYS = [
    { key: "woodapp_silver_v1", name: "Silver" },
    { key: "woodapp_poles_v1", name: "Poles" },
    { key: "woodapp_plywood_v1", name: "Plywood" },
    { key: "woodapp_oldplaywood_v1", name: "Old Playwood" }
  ];

  function fetchWoodData(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : { units: 0, amount: 0, history: [] };
  }

  function calculateTotals(selected) {
    if (!selected) return;

    let totalPurchase = 0, totalSales = 0;

    const woods = selected === "overall"
      ? WOOD_KEYS
      : WOOD_KEYS.filter(w => w.name.toLowerCase() === selected.toLowerCase());

    if (woods.length === 0) return;

    woods.forEach(wood => {
      const data = fetchWoodData(wood.key);
      (data.history || []).forEach(item => {
        if (item.type === "Purchase") totalPurchase += item.amount;
        if (item.type === "Sales") totalSales += item.amount;
      });
    });

    totalPurchaseEl.textContent = "₹" + totalPurchase.toLocaleString("en-IN");
    totalSalesEl.textContent = "₹" + totalSales.toLocaleString("en-IN");
    profitLossEl.textContent = "₹" + (totalSales - totalPurchase).toLocaleString("en-IN");

    // Add class for loss
    const value = totalSales - totalPurchase;
    if (value < 0) profitLossEl.classList.add("loss");
    else profitLossEl.classList.remove("loss");
  }

  // Update totals when user changes selection
  woodSelect.addEventListener("change", () => {
    calculateTotals(woodSelect.value);
  });

  // Display Overall totals on page load AND when returning to page
  window.addEventListener("pageshow", () => {
    woodSelect.value = "overall";       // Always show Overall in dropdown
    calculateTotals("overall");         // Display Overall totals
  });

})();
// ===========================================================
// GENERIC WOOD PAGE HANDLER
function initWoodPage(WOOD_TYPE, LS_KEY) {
  const purchaseBtn = document.getElementById("purchaseBtn");
  const salesBtn = document.getElementById("salesBtn");
  const popupContainer = document.getElementById("popupContainer");
  const popupTitle = document.getElementById("popupTitle");
  const closePopupBtn = document.getElementById("closePopup");
  const popupForm = document.getElementById("popupForm");
  const sizeEl = document.getElementById("size");
  const qtyEl = document.getElementById("qty");
  const amountEl = document.getElementById("amount");
  const historyListEl = document.getElementById("historyList");
  const backBtn = document.getElementById("backToStock");
  const qtyLabelSpan = document.getElementById("qtyLabel");
  const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");

  const isSilver = WOOD_TYPE.toLowerCase() === "silver";
if (!document.getElementById("successPopup")) {
  const successPopup = document.createElement("div");
  successPopup.id = "successPopup";
  successPopup.textContent = "✅ Data updated successfully!";
  successPopup.style.display = "none";
  document.body.appendChild(successPopup);
}


  let raw = localStorage.getItem(LS_KEY);
  let state = raw ? JSON.parse(raw) : { woodType: WOOD_TYPE, units: 0, amount: 0, history: [] };

  function inr(n) { return "₹" + (Number(n) || 0).toLocaleString("en-IN"); }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  // ================== CURRENT STOCK ONLY UNITS / CFT ==================
  function updateCurrentStock() {
    let totalPurchase = 0;
    let totalSales = 0;

    state.history.forEach(entry => {
      if (entry.type === "Purchase") totalPurchase += entry.qty;
      if (entry.type === "Sales") totalSales += entry.qty;
    });

    const labelPurchase = isSilver ? "Purchase CFT: " : "Purchase Units: ";
    const labelSales = isSilver ? "Sale CFT: " : "Sale Units: ";
    const labelRemaining = isSilver ? "Remaining CFT: " : "Remaining Units: ";

    document.getElementById("purchaseUnits").textContent = labelPurchase + totalPurchase;
    document.getElementById("saleUnits").textContent = labelSales + totalSales;
    document.getElementById("remainingUnits").textContent = labelRemaining + (totalPurchase - totalSales);
  }

  // ================== RENDER TRANSACTION HISTORY ==================
  function render(data = state.history) {
    if (!historyListEl) return;

    updateCurrentStock(); // update current stock

    const qtyLabel = isSilver ? "CFT" : "Quantity";
    const unitLabel = isSilver ? "CFT" : "Units";

    historyListEl.innerHTML = "";

    let runningUnits = 0;
    let runningAmount = 0;

    const sortedData = [...data].reverse();

    const cumulative = sortedData.map(item => {
      if (item.type === "Purchase") {
        runningUnits += item.qty;
        runningAmount -= item.amount;
      } else if (item.type === "Sales") {
        runningUnits -= item.qty;
        runningAmount += item.amount;
      }
      return { ...item, totalUnits: runningUnits, totalAmount: runningAmount };
    });

    cumulative.reverse().forEach((item, index) => {
      const li = document.createElement("li");
      li.className = `tx-item ${item.type.toLowerCase()}`;
      li.innerHTML = `
        <input type="checkbox" class="select-tx" data-index="${index}" />
        <div class="tx-date">${item.date ? formatDate(item.date) : ""}</div>
        <div class="tx-type">${item.type}</div>
        <div class="tx-details">
          Size: ${item.size}, ${qtyLabel}: ${item.qty}, Amount: ${inr(item.amount)}
        </div>
        <div class="tx-total">
          Total: ${unitLabel} ${item.totalUnits}, Amount ${inr(item.totalAmount)}
        </div>
      `;
      historyListEl.appendChild(li);
    });

    if (qtyLabelSpan) qtyLabelSpan.textContent = qtyLabel;
  }

  // ================== SAVE TRANSACTION ==================
  function save(tx) {
    if (tx.type === "Purchase") {
      state.units += tx.qty;
      state.amount -= tx.amount;
    } else {
      if (tx.qty > state.units) {
        alert("Cannot sell more than current stock!");
        return false;
      }
      state.units -= tx.qty;
      state.amount += tx.amount;
    }

    state.history.unshift({ ...tx, totalUnits: state.units, totalAmount: state.amount });
    localStorage.setItem(LS_KEY, JSON.stringify(state));

    const successPopup = document.getElementById("successPopup");
    if (successPopup) {
      successPopup.style.display = "block";
      setTimeout(() => { successPopup.style.display = "none"; }, 2000);
    }

    return true;
  }

  // ================== POPUP HANDLER ==================
  function openPopup(type) {
    if (!popupContainer) return;
    if (!popupTitle) return;

    popupTitle.textContent = type === "Purchase" ? "Purchase Wood" : "Sell Wood";
    popupContainer.dataset.mode = type;
    popupContainer.style.display = "block";

    if (qtyEl) qtyEl.value = "";
    if (amountEl) amountEl.value = "";

    const dateInput = document.getElementById("txDate");
    if (dateInput) {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      dateInput.value = `${year}-${month}-${day}`;
    }

    setTimeout(() => { if (qtyEl) qtyEl.focus(); }, 100);
  }

  if (purchaseBtn) purchaseBtn.addEventListener("click", () => openPopup("Purchase"));
  if (salesBtn) salesBtn.addEventListener("click", () => openPopup("Sales"));
  if (closePopupBtn) closePopupBtn.addEventListener("click", () => {
    if (qtyEl) qtyEl.value = "";
    if (amountEl) amountEl.value = "";
  });
  if (backBtn) backBtn.addEventListener("click", () => {
    if (popupContainer) popupContainer.style.display = "none";
    document.getElementById("stockSection")?.scrollIntoView({ behavior: "smooth" });
  });

  if (popupForm) {
    popupForm.addEventListener("submit", e => {
      e.preventDefault();
      const qtyVal = parseFloat(qtyEl?.value);
      const amountVal = parseFloat(amountEl?.value);
      if (isNaN(qtyVal) || qtyVal <= 0 || isNaN(amountVal) || amountVal <= 0) {
        alert("Enter valid quantity and amount");
        return;
      }

      const dateInput = document.getElementById("txDate");
      const tx = {
        type: popupContainer.dataset.mode,
        size: sizeEl?.value,
        qty: qtyVal,
        amount: amountVal,
        date: dateInput ? dateInput.value : "",
        ts: Date.now()
      };

      if (save(tx)) {
        render();
      }
    });
  }

  // ================== DELETE SELECTED TRANSACTIONS ==================
   // ================== DELETE SELECTED TRANSACTIONS ==================
  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener("click", () => {
      const checked = [...document.querySelectorAll(".select-tx:checked")];
      if (checked.length === 0) return alert("No entries selected.");
      if (!confirm("Delete selected transactions?")) return;

      const indexes = checked.map(chk => parseInt(chk.dataset.index));
      state.history = state.history.filter((_, i) => !indexes.includes(i));
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      render(); // update current stock & history
    });
  }

  // ================== DATE FILTER (WORKS FOR ALL WOOD PAGES) ==================
  (function applyWoodFilter() {
    const fromDateEl = document.getElementById("fromDate");
    const toDateEl = document.getElementById("toDate");
    const filterBtnEl = document.getElementById("filterBtn");
    const resetFilterBtnEl = document.getElementById("resetFilterBtn");

    if (!filterBtnEl || !resetFilterBtnEl) return;

    filterBtnEl.addEventListener("click", () => {
      const from = fromDateEl.value ? new Date(fromDateEl.value) : null;
      const to = toDateEl.value ? new Date(toDateEl.value) : null;

      const filtered = state.history.filter(entry => {
        if (!entry.date) return false;
        const d = new Date(entry.date);
        d.setHours(0, 0, 0, 0);

        const afterFrom = from ? d >= new Date(from.setHours(0,0,0,0)) : true;
        const beforeTo = to ? d <= new Date(to.setHours(0,0,0,0)) : true;

        return afterFrom && beforeTo;
      });

      render(filtered);
    });

    resetFilterBtnEl.addEventListener("click", () => {
      fromDateEl.value = "";
      toDateEl.value = "";
      render();   // show all again
    });
  })();

  render();
}
// ===========================================================
// AUTO-DETECT WOOD PAGE
(function () {
  const body = document.body;
  const woodType = body.dataset.wood?.trim();
  if (!woodType) return;

  const woodMap = {
    "Silver": "woodapp_silver_v1",
    "Poles": "woodapp_poles_v1",
    "Plywood": "woodapp_plywood_v1",
    "Old Playwood": "woodapp_oldplaywood_v1"
  };

  const key = woodMap[woodType];
  if (key) initWoodPage(woodType, key);
})();
// ===========================================================
// EXPENDITURE SCRIPT (UNCHANGED)
(function () {
  const expForm = document.getElementById('expForm');
  if (!expForm) return;

  const expDate = document.getElementById('expDate');
  const expAmount = document.getElementById('expAmount');
  const expDesc = document.getElementById('expDesc');
  const expHistory = document.getElementById('expHistory');
  const resetExp = document.getElementById('resetExp');

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
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');

  const LS_KEY = 'woodapp_expenditure_v1';
  let data = JSON.parse(localStorage.getItem(LS_KEY)) || [];

  const successPopup = document.createElement("div");
  successPopup.id = "successPopup";
  successPopup.textContent = "✅ Data updated successfully!";
  document.body.appendChild(successPopup);
  successPopup.style.display = "none";

  function saveData() { localStorage.setItem(LS_KEY, JSON.stringify(data)); }
  function inr(n) { return "₹" + (Number(n)||0).toLocaleString("en-IN"); }
  function formatDate(d) {
    const dt = new Date(d);
    return isNaN(dt) ? "" : `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`;
  }

  function render(filtered = data) {
    expHistory.innerHTML = "";
    filtered.sort((a,b)=>new Date(b.date)-new Date(a.date));
    filtered.forEach((x,i)=>{
      const li=document.createElement('li');
      li.innerHTML=`
        <input type="checkbox" class="selectEntry" data-index="${i}">
        <div class="tx-date">${formatDate(x.date)}</div>
        <div class="tx-details">${x.desc}</div>
        <div class="tx-amount">${inr(x.amount)}</div>`;
      expHistory.appendChild(li);
    });
  }

  expForm.addEventListener('submit', e=>{
    e.preventDefault();
    const d=expDate.value, a=parseFloat(expAmount.value), t=expDesc.value.trim();
    if(!d||!a||!t)return alert("Fill all details");
    data.push({date:d, amount:a, desc:t});
    saveData(); render(); calcTotals(); expForm.reset();

    successPopup.style.display = "block";
    setTimeout(() => { successPopup.style.display = "none"; }, 2000);
  });

  resetExp.addEventListener('click',()=>expForm.reset());

  deleteSelectedBtn.addEventListener('click',()=>{
    const sel=[...document.querySelectorAll('.selectEntry:checked')];
    if(sel.length===0)return alert("No entries selected.");
    if(!confirm("Delete selected entries?"))return;
    const idx=sel.map(x=>+x.dataset.index);
    data=data.filter((_,i)=>!idx.includes(i));
    saveData(); render(); calcTotals();
  });

  filterBtn.addEventListener('click',()=>{
    const f=fromDate.value?new Date(fromDate.value):null;
    const t=toDate.value?new Date(toDate.value):null;
    const filtered=data.filter(x=>{
      const d=new Date(x.date);
      return (!f||d>=f)&&(!t||d<=t);
    });
    render(filtered);
  });

  resetFilterBtn.addEventListener('click',()=>{fromDate.value=toDate.value=""; render();});

  function calcTotals(){
    const today=new Date();
    const todayStr=today.toISOString().split("T")[0];
    const monthStr=todayStr.slice(0,7);
    const yearNum=today.getFullYear();

    const dTotal=data.filter(x=>x.date===todayStr).reduce((s,x)=>s+x.amount,0);
    const mTotal=data.filter(x=>x.date.startsWith(monthStr)).reduce((s,x)=>s+x.amount,0);
    const yTotal=data.filter(x=>new Date(x.date).getFullYear()===yearNum).reduce((s,x)=>s+x.amount,0);

    dailyDate.value=todayStr; monthSelect.value=monthStr; yearSelect.value=yearNum;
    dailyEl.textContent=inr(dTotal); monthlyEl.textContent=inr(mTotal); yearlyEl.textContent=inr(yTotal);
  }

  dailyDate.addEventListener('change',()=>{
    const val=dailyDate.value;
    dailyEl.textContent=inr(data.filter(x=>x.date===val).reduce((s,x)=>s+x.amount,0));
  });

  monthSelect.addEventListener('change',()=>{
    const [y,m]=monthSelect.value.split('-').map(Number);
    monthlyEl.textContent=inr(data.filter(x=>{
      const d=new Date(x.date); return d.getMonth()+1===m&&d.getFullYear()===y;
    }).reduce((s,x)=>s+x.amount,0));
  });

  yearSelect.addEventListener('input',()=>{
    const y=parseInt(yearSelect.value);
    yearlyEl.textContent=inr(data.filter(x=>new Date(x.date).getFullYear()===y).reduce((s,x)=>s+x.amount,0));
  });

  render(); calcTotals();
})();

/*back button in expenditure*/
document.getElementById("backToHome")?.addEventListener("click", function() {
  window.location.href = "index.html";
});
// ================= DYNAMIC CHECKBOX HANDLER (MULTI-SELECT ON CLICK) =================
function enableMultiSelectOnClick(listSelector, checkboxSelector, itemSelector) {
  const listEl = document.querySelector(listSelector);
  if (!listEl) return;

  // Hide all checkboxes initially
  listEl.querySelectorAll(checkboxSelector).forEach(cb => cb.style.display = 'none');

  // Show checkbox and toggle selection when clicking an entry
  listEl.addEventListener('click', (e) => {
    const li = e.target.closest(itemSelector);
    if (!li) return;

    const cb = li.querySelector(checkboxSelector);
    if (cb) {
      cb.style.display = 'inline-block';
      cb.checked = !cb.checked; // toggle check
    }
  });

  // Optional: hide all checkboxes when clicking outside the list
  document.addEventListener('click', (e) => {
    if (!e.target.closest(listSelector)) {
      listEl.querySelectorAll(checkboxSelector).forEach(cb => {
        cb.style.display = 'none';
      });
    }
  });
}

// ================= APPLY TO EXPENDITURE =================
enableMultiSelectOnClick('#expHistory', '.selectEntry', 'li');

// ================= APPLY TO WOOD HISTORY =================
enableMultiSelectOnClick('#historyList', '.select-tx', '.tx-item');
