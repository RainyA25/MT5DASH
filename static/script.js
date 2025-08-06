const API_BASE = "https://mt5bot.tilinshop.com";

async function fetchJSON(endpoint) {
  const res = await fetch(API_BASE + endpoint);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
  return res.json();
}

function formatCurrency(val) {
  return `$${parseFloat(val).toFixed(2)}`;
}

function colorize(val) {
  // val might end with '%' or be numeric
  const num = parseFloat(val);
  const cls = num > 0 ? "text-green" : num < 0 ? "text-red" : "";
  return `<span class="${cls}">${val}</span>`;
}

// Load Account Summary
async function loadSummary() {
  const d = await fetchJSON("/summary");
  document.getElementById("balance").textContent      = formatCurrency(d.balance);
  document.getElementById("equity").textContent       = formatCurrency(d.equity);
  document.getElementById("unrealized_pnl").innerHTML = colorize(d.unrealized_pct.toFixed(2) + "%");
  document.getElementById("margin_free").textContent  = formatCurrency(d.margin_free);
  document.getElementById("margin").textContent       = formatCurrency(d.margin);
}

// Load Open Trades
async function loadTrades() {
  const trades = await fetchJSON("/trades");
  const tbody = document.getElementById("trades-body");
  tbody.innerHTML = "";
  trades.forEach(t => {
    const r = document.createElement("tr");
    r.innerHTML = `
      <td>${t.symbol}</td>
      <td>${t.type}</td>
      <td>${t.volume}</td>
      <td>${formatCurrency(t.open_price)}</td>
      <td>${formatCurrency(t.close_price)}</td>
      <td>${t.open_time}</td>
      <td>${t.duration}</td>
      <td>${colorize(t.profit_usd.toFixed(2))}</td>
      <td>${colorize(t.profit_pct.toFixed(2) + "%")}</td>
    `;
    tbody.appendChild(r);
  });
}

// Load Trade History
async function loadHistory() {
  const history = await fetchJSON("/history");
  const tbody = document.getElementById("history-body");
  tbody.innerHTML = "";
  history.forEach(t => {
    const r = document.createElement("tr");
    r.innerHTML = `
      <td>${t.symbol}</td>
      <td>${t.entry_type}</td>
      <td>${t.volume}</td>
      <td>${formatCurrency(t.open_price)}</td>
      <td>${formatCurrency(t.close_price)}</td>
      <td>${t.open_time}</td>
      <td>${t.close_time}</td>
      <td>${t.duration}</td>
      <td>${colorize(t.profit_usd.toFixed(2))}</td>
    `;
    tbody.appendChild(r);
  });
}

// Table Sorting
let sortDirections = {};
function sortTable(bodyId, colIndex, type, asc) {
  const tbody = document.getElementById(bodyId);
  const rows = Array.from(tbody.querySelectorAll("tr"));
  rows.sort((a, b) => {
    let aVal = a.children[colIndex].textContent.replace(/[$,%]/g, "");
    let bVal = b.children[colIndex].textContent.replace(/[$,%]/g, "");
    if (type === "number") {
      return asc ? aVal - bVal : bVal - aVal;
    }
    if (type === "date") {
      return asc ? new Date(aVal) - new Date(bVal) : new Date(bVal) - new Date(aVal);
    }
    return asc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });
  tbody.innerHTML = "";
  rows.forEach(r => tbody.appendChild(r));
}

function setupSorting() {
  document.querySelectorAll("th[data-sort]").forEach(th => {
    th.addEventListener("click", () => {
      const field   = th.getAttribute("data-sort");
      const table   = th.closest("table");
      const bodyId  = table.id === "trades-table" ? "trades-body" : "history-body";
      const headers = Array.from(th.parentElement.children);
      const colIdx  = headers.indexOf(th);

      let type = "string";
      if (field.includes("time")) type = "date";
      else if (["volume","open_price","close_price","profit_usd","profit_pct"].includes(field)) type = "number";

      const key = `${bodyId}-${field}`;
      const asc = sortDirections[key] = !sortDirections[key];
      sortTable(bodyId, colIdx, type, asc);
    });
  });
}

// Refresh Dashboard
async function refreshDashboard() {
  try {
    await loadSummary();
    await loadTrades();
    await loadHistory();
    setupSorting();
  } catch (e) {
    console.error("Dashboard error:", e);
  }
}

refreshDashboard();
setInterval(refreshDashboard, 10000);
