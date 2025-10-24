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

  // Optional: close menu when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === sideMenu) {
      sideMenu.classList.remove("open");
    }
  });
}

// ===========================================================

/* ========== HOME PAGE SUMMARY ========== */
(function () {
  if (!document.getElementById("totalPurchase")) return;

  const WOOD_KEYS = [
    { key: "woodapp_silver_v1" },
    { key: "woodapp_poles_v1" },
    { key: "woodapp_plywood_v1" },
    { key: "woodapp_oldplaywood_v1" }
  ];

  function fetchWoodData(key) {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : { units: 0, amount: 0, history: [] };
  }

  function loadSummary() {
    let totalPurchase = 0, totalSales = 0, totalStock = 0;

    WOOD_KEYS.forEach(wood => {
      const data = fetchWoodData(wood.key);
      (data.history || []).forEach(item => {
        if (item.type === "Purchase") totalPurchase += item.amount;
        if (item.type === "Sales") totalSales += item.amount;
      });
      totalStock += data.units || 0;
    });

    document.getElementById("totalPurchase").textContent = "₹" + totalPurchase.toLocaleString("en-IN");
    document.getElementById("totalSales").textContent = "₹" + totalSales.toLocaleString("en-IN");
    document.getElementById("profitLoss").textContent = "₹" + (totalSales - totalPurchase).toLocaleString("en-IN");
    document.getElementById("totalStock").textContent = totalStock + " units";
  }

  loadSummary();
})();

/* ========== GENERIC WOOD PAGE HANDLER ========== */
function initWoodPage(WOOD_TYPE, LS_KEY) {
  const purchaseBtn = document.getElementById("purchaseBtn");
  if (!purchaseBtn) return;

  const salesBtn = document.getElementById("salesBtn");
  const popupContainer = document.getElementById("popupContainer");
  const popupTitle = document.getElementById("popupTitle");
  const closePopupBtn = document.getElementById("closePopup");
  const popupForm = document.getElementById("popupForm");
  const sizeEl = document.getElementById("size");
  const qtyEl = document.getElementById("qty");
  const amountEl = document.getElementById("amount");
  const stockUnitsEl = document.getElementById("stockUnits");
  const stockAmountEl = document.getElementById("stockAmount");
  const historyListEl = document.getElementById("historyList");
  const backBtn = document.getElementById("backToStock");
  const qtyLabelSpan = document.getElementById("qtyLabel");

  const isSilver = WOOD_TYPE.toLowerCase() === "silver";

  let successPopup = document.createElement("div");
  successPopup.id = "successPopup";
  successPopup.textContent = "✅ Data updated successfully!";
  document.body.appendChild(successPopup);

  let raw = localStorage.getItem(LS_KEY);
  let state = raw ? JSON.parse(raw) : { woodType: WOOD_TYPE, units: 0, amount: 0, history: [] };

  function inr(n) {
    return "₹" + (Number(n) || 0).toLocaleString("en-IN");
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function render(data = state.history) {
    const qtyLabel = isSilver ? "CFT" : "Quantity";
    const unitLabel = isSilver ? "CFT" : "Units";

    stockUnitsEl.textContent = `${unitLabel}: ${state.units}`;
    stockAmountEl.textContent = `Amount: ${inr(state.amount)}`;

    if (qtyLabelSpan) qtyLabelSpan.textContent = qtyLabel;

    historyListEl.innerHTML = "";
    data.forEach((item, index) => {
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
  }

  function save(tx) {
    if (tx.type === "Purchase") {
      state.units += tx.qty;
      state.amount += tx.amount;
    } else {
      if (tx.qty > state.units) {
        alert("Cannot sell more than current stock!");
        return false;
      }
      state.units -= tx.qty;
      state.amount -= tx.amount;
    }
    state.history.unshift({ ...tx, totalUnits: state.units, totalAmount: state.amount });
    localStorage.setItem(LS_KEY, JSON.stringify(state));

    successPopup.style.display = "block";
    setTimeout(() => { successPopup.style.display = "none"; }, 2000);

    return true;
  }

  function openPopup(type) {
    popupTitle.textContent = type === "Purchase" ? "Purchase Wood" : "Sell Wood";
    popupContainer.dataset.mode = type;
    popupContainer.style.display = "block";

    qtyEl.value = "";
    amountEl.value = "";

    const dateInput = document.getElementById("txDate");
    if (dateInput) {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      dateInput.value = `${year}-${month}-${day}`;
    }

    setTimeout(() => qtyEl.focus(), 100);
  }

  function cancelOnly() {
    qtyEl.value = "";
    amountEl.value = "";
  }

  function closePopupAndBack() {
    qtyEl.value = "";
    amountEl.value = "";
    popupContainer.style.display = "none";
    document.getElementById("stockSection")?.scrollIntoView({ behavior: "smooth" });
  }

  purchaseBtn.addEventListener("click", () => openPopup("Purchase"));
  salesBtn.addEventListener("click", () => openPopup("Sales"));
  closePopupBtn.addEventListener("click", cancelOnly);
  if (backBtn) backBtn.addEventListener("click", closePopupAndBack);

  popupForm.addEventListener("submit", e => {
    e.preventDefault();

    const qtyVal = parseFloat(qtyEl.value);
    const amountVal = parseFloat(amountEl.value);

    if (isNaN(qtyVal) || qtyVal <= 0 || isNaN(amountVal) || amountVal <= 0) {
      alert("Enter valid quantity and amount");
      return;
    }

    const dateInput = document.getElementById("txDate");

    const tx = {
      type: popupContainer.dataset.mode,
      size: sizeEl.value,
      qty: qtyVal,
      amount: amountVal,
      date: dateInput ? dateInput.value : "",
      ts: Date.now()
    };

    if (save(tx)) {
      render();
      qtyEl.value = "";
      amountEl.value = "";
    }
  });

  const fromDateEl = document.getElementById("fromDate");
  const toDateEl = document.getElementById("toDate");
  const filterBtn = document.getElementById("filterBtn");
  const resetFilterBtn = document.getElementById("resetFilterBtn");

  function renderFilteredRange(from, to) {
    const filtered = state.history.filter(item => {
      if (!from && !to) return true;
      const txDate = new Date(item.date);
      const fromD = from ? new Date(from) : null;
      const toD = to ? new Date(to) : null;
      if (fromD && toD) return txDate >= fromD && txDate <= toD;
      if (fromD) return txDate >= fromD;
      if (toD) return txDate <= toD;
      return true;
    });
    render(filtered);
  }

  filterBtn?.addEventListener("click", () => {
    renderFilteredRange(fromDateEl.value, toDateEl.value);
  });

  resetFilterBtn?.addEventListener("click", () => {
    fromDateEl.value = "";
    toDateEl.value = "";
    render();
  });

  const deleteBtn = document.getElementById("deleteSelectedBtn");

  deleteBtn?.addEventListener("click", () => {
    const selected = Array.from(document.querySelectorAll(".select-tx:checked"));
    if (selected.length === 0) {
      alert("No entries selected!");
      return;
    }

    if (!confirm(`Delete ${selected.length} selected transaction(s)?`)) return;

    const indexesToDelete = selected.map(cb => parseInt(cb.dataset.index));
    state.history = state.history.filter((_, idx) => !indexesToDelete.includes(idx));
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    render();
  });

  render();
}

/* ========== AUTO-DETECT PAGE WOOD TYPE ========== */
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

/* ========== EXPENDITURE SCRIPT ========== */
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

  // ✅ Success Popup
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

    // ✅ Show success message
    successPopup.style.display = "block";
    setTimeout(() => {
      successPopup.style.display = "none";
    }, 2000);
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
document.getElementById("backToHome").addEventListener("click", function() {
  window.location.href = "index.html"; // ✅ updated for GitHub Pages
});
