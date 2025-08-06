// Updated script.js for new endpoints

const API_BASE = "https://mt5bot.tilinshop.com";

async function fetchJSON(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
  return await res.json();
}

function updateSummary(data) {
  document.getElementById("balance").innerText = `$${data.balance}`;
  document.getElementById("equity").innerText = `$${data.equity}`;
  document.getElementById("unrealized_pnl").innerText = `${data.unrealized_pct.toFixed(2)}%`;
  document.getElementById("margin_free").innerText = `$${data.margin_free}`;
  document.getElementById("margin").innerText = `$${data.margin}`;
}

function updateTrades(trades) {
  const container = document.getElementById("trades");
  container.innerHTML = "";
  trades.forEach(t => {
    container.innerHTML += `
      <tr>
        <td>${t.symbol}</td>
        <td>${t.type}</td>
        <td>${t.volume}</td>
        <td>${t.open_price}</td>
        <td>${t.close_price}</td>
        <td>${t.open_time}</td>
        <td>${t.duration}</td>
        <td>${t.profit_usd}</td>
        <td>${t.profit_pct}%</td>
      </tr>`;
  });
}

function updateHistory(history) {
  const container = document.getElementById("history");
  container.innerHTML = "";
  history.forEach(t => {
    container.innerHTML += `
      <tr>
        <td>${t.symbol}</td>
        <td>${t.entry_type}</td>
        <td>${t.volume}</td>
        <td>${t.open_price}</td>
        <td>${t.close_price}</td>
        <td>${t.open_time}</td>
        <td>${t.close_time}</td>
        <td>${t.duration}</td>
        <td>${t.profit_usd}</td>
      </tr>`;
  });
}

function renderEquityChart(data) {
  const labels = data.map(d => d.timestamp);
  const pnl = data.map(d => d.daily_pnl);

  const ctx = document.getElementById("equityChart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Daily PnL ($)",
        data: pnl,
        fill: false,
        borderWidth: 2
      }]
    },
    options: {
      scales: {
        x: { title: { display: true, text: "Date" } },
        y: { title: { display: true, text: "PnL ($)" } }
      }
    }
  });
}

async function refreshDashboard() {
  try {
    const [summary, trades, history, equityData] = await Promise.all([
      fetchJSON("/summary"),
      fetchJSON("/trades"),
      fetchJSON("/history"),
      fetchJSON("/equity_chart")
    ]);

    updateSummary(summary);
    updateTrades(trades);
    updateHistory(history);
    renderEquityChart(equityData);
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

window.onload = refreshDashboard;
