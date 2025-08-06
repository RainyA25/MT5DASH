const TRADES_URL = '/api/trades';
const CHART_URL  = '/api/chart';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

function formatTimeISO(ts) {
  if (!ts || ts === "-") return "-";
  return new Date(ts).toLocaleString();
}

// --- Trade Tables ---
function renderTrades(trades, isOpen) {
  const tbody = document.getElementById(isOpen ? 'trades-body' : 'history-body');
  tbody.innerHTML = '';

  trades.forEach(t => {
    const profit = parseFloat(t.pnl);
    const profitClass = profit >= 0 ? 'profit-positive' : 'profit-negative';
    const tr = document.createElement('tr');

    tr.innerHTML = isOpen ? `
      <td>${t.symbol}</td>
      <td>${formatTimeISO(t.date_opened)}</td>
      <td>${t.type}</td>
      <td>${parseFloat(t.volume).toFixed(3)}</td>
      <td>${t.price_opened} → ${t.price_closed}</td>
      <td class="${profitClass}">${profit.toFixed(2)}</td>
    ` : `
      <td>${t.symbol}</td>
      <td>${formatTimeISO(t.date_opened)}</td>
      <td>${formatTimeISO(t.date_closed)}</td>
      <td>${t.type}</td>
      <td>${parseFloat(t.volume).toFixed(3)}</td>
      <td class="${profitClass}">${profit.toFixed(2)}</td>
    `;

    tbody.appendChild(tr);
  });
}

// --- Chart Setup ---
let equityChart;

function renderChart(data) {
  const ctx = document.getElementById('equityChart').getContext('2d');

  const timestamps = data.map(d => new Date(d.timestamp).toLocaleString());
  const equity = data.map(d => d.equity);
  const balance = data.map(d => d.balance);
  const maxLoss = data.map(d => d.max_loss_threshold);
  const dailyLoss = data.map(d => d.daily_loss_threshold);

  if (equityChart) equityChart.destroy();

  equityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: timestamps,
      datasets: [
        { label: 'Equity', data: equity, borderColor: 'lime', borderWidth: 2 },
        { label: 'Balance', data: balance, borderColor: 'cyan', borderWidth: 2 },
        { label: 'Max Loss', data: maxLoss, borderColor: 'red', borderWidth: 1, borderDash: [5, 5] },
        { label: 'Daily Loss', data: dailyLoss, borderColor: 'orange', borderWidth: 1, borderDash: [5, 5] },
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#fff' } },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        x: { ticks: { color: '#aaa' } },
        y: { ticks: { color: '#aaa' }, beginAtZero: false }
      }
    }
  });
}

function filterChartData(data, range) {
  const now = Date.now();
  let cutoff;

  switch (range) {
    case '1h': cutoff = now - 1 * 60 * 60 * 1000; break;
    case '1d': cutoff = now - 24 * 60 * 60 * 1000; break;
    case '7d': cutoff = now - 7 * 24 * 60 * 60 * 1000; break;
    default: return data;
  }

  return data.filter(d => new Date(d.timestamp).getTime() >= cutoff);
}

function setupChartControls(chartData) {
  document.querySelectorAll('.chart-controls button').forEach(btn => {
    btn.addEventListener('click', () => {
      const range = btn.getAttribute('data-range');
      const filtered = filterChartData(chartData, range);
      renderChart(filtered);
    });
  });
}

// --- Bootstrap ---
async function refreshDashboard() {
  try {
    const [trades, chartData] = await Promise.all([
      fetchJSON(TRADES_URL),
      fetchJSON(CHART_URL),
    ]);

    const openTrades = trades.filter(t => t.price_closed === "-" || t.pnl === "-");
    const closedTrades = trades.filter(t => t.price_closed !== "-" && t.pnl !== "-");

    renderTrades(openTrades, true);
    renderTrades(closedTrades, false);

    renderChart(chartData.reverse()); // chronological order
    setupChartControls(chartData);
  } catch (e) {
    console.error('Dashboard error:', e);
  }
}

refreshDashboard();
setInterval(refreshDashboard, 15_000); // 15 sec refresh
