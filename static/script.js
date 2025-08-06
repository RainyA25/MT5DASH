const API_BASE = "https://mt5bot.tilinshop.com";

let fullEquityData = [];

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return await res.json();
}

function formatCurrency(value) {
  return `$${parseFloat(value).toFixed(2)}`;
}

function colorize(value) {
  return `<span style="color:${value < 0 ? 'red' : 'lightgreen'}">${value}</span>`;
}

async function loadSummary() {
  const data = await fetchJSON(`${API_BASE}/summary`);
  document.getElementById("balance").innerHTML = formatCurrency(data.balance);
  document.getElementById("equity").innerHTML = formatCurrency(data.equity);
  document.getElementById("unrealized_pnl").innerHTML = colorize(data.unrealized_pnl_pct.toFixed(2) + "%");
  document.getElementById("margin_free").innerHTML = formatCurrency(data.margin_free);
  document.getElementById("margin").innerHTML = formatCurrency(data.margin);
}

async function loadTrades() {
  const trades = await fetchJSON(`${API_BASE}/trades`);
  const tbody = document.getElementById("trades");
  tbody.innerHTML = "";

  trades.forEach(t => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.symbol}</td>
      <td>${t.open_price > t.close_price ? "Sell" : "Buy"}</td>
      <td>${t.volume}</td>
      <td>${t.open_price}</td>
      <td>${t.close_price}</td>
      <td>${t.open_time}</td>
      <td>${t.duration}</td>
      <td>${colorize(t.profit_usd)}</td>
      <td>${colorize(t.profit_pct + "%")}</td>
    `;
    tbody.appendChild(row);
  });
}

async function loadHistory() {
  const history = await fetchJSON(`${API_BASE}/history`);
  const tbody = document.getElementById("history");
  tbody.innerHTML = "";

  history.forEach(t => {
    const type = t.open_price > t.close_price ? "Sell" : "Buy";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.symbol}</td>
      <td>${type}</td>
      <td>${t.volume}</td>
      <td>${t.open_price}</td>
      <td>${t.close_price}</td>
      <td>${t.open_time}</td>
      <td>${t.close_time}</td>
      <td>${t.duration}</td>
      <td>${colorize(t.profit_usd)}</td>
    `;
    tbody.appendChild(row);
  });
}

function renderEquityChart(data) {
  const ctx = document.getElementById("equityChart").getContext("2d");
  const labels = data.map(d => d.timestamp);
  const pnl = data.map(d => d.daily_pnl);

  if (window.equityChart) window.equityChart.destroy();

  window.equityChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Daily PnL ($)",
        data: pnl,
        borderColor: "rgba(0, 200, 255, 0.9)",
        backgroundColor: "rgba(0, 200, 255, 0.2)",
        tension: 0.3,
        pointRadius: 3
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#ccc" }
        }
      },
      scales: {
        x: {
          ticks: { color: "#ccc" }
        },
        y: {
          ticks: { color: "#ccc" },
          beginAtZero: false
        }
      }
    }
  });
}

function filterChart(range) {
  const now = new Date();
  let cutoff;

  if (range === "1h") cutoff = new Date(now.getTime() - 1 * 60 * 60 * 1000);
  else if (range === "1d") cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  else if (range === "7d") cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  else cutoff = new Date(0); // All time

  const filtered = fullEquityData.filter(d => new Date(d.timestamp) >= cutoff);
  renderEquityChart(filtered);
}

async function loadEquityChart() {
  fullEquityData = await fetchJSON(`${API_BASE}/equity_chart`);
  renderEquityChart(fullEquityData);
}

function attachChartFilters() {
  document.querySelectorAll(".chart-controls button").forEach(btn => {
    btn.addEventListener("click", () => {
      const range = btn.dataset.range;
      filterChart(range);
    });
  });
}

async function refreshDashboard() {
  try {
    await loadSummary();
    await loadTrades();
    await loadHistory();
    await loadEquityChart();
    attachChartFilters();
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

refreshDashboard();
setInterval(refreshDashboard, 60000); // refresh every minute
