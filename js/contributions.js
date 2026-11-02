// GitHub has no public, unauthenticated endpoint for the contribution calendar, so the page
// reads it from a community mirror of the public profile and falls back to the snapshot that
// scripts/update-contributions.py commits daily.
const LIVE_URL = (username) => `https://github-contributions-api.jogruber.de/v4/${username}?y=last`;
const SNAPSHOT_URL = 'data/contributions.json';
const WEEKS = 53;

async function fetchLive(username) {
  const response = await fetch(LIVE_URL(username));
  if (!response.ok) throw new Error(`Live contributions: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.contributions) || data.contributions.length < 300) throw new Error('Live contributions incomplete');
  return { total: data.total.lastYear, days: data.contributions };
}

async function fetchSnapshot() {
  const response = await fetch(SNAPSHOT_URL);
  if (!response.ok) throw new Error(`Contribution snapshot: ${response.status}`);
  return response.json();
}

const formatDate = (date, options) => date.toLocaleDateString('en-US', { timeZone: 'UTC', ...options });

function render({ total, days }, { calendar, months, count }) {
  const byDate = new Map(days.map((day) => [day.date, day]));
  const lastDate = days[days.length - 1].date;
  const start = new Date(`${days[0].date}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  const cells = [];
  const labels = [];
  let previousMonth = -1;

  for (let index = 0; index < WEEKS * 7; index++) {
    const current = new Date(start);
    current.setUTCDate(start.getUTCDate() + index);
    const date = current.toISOString().slice(0, 10);
    const week = Math.floor(index / 7);

    if (index % 7 === 0 && current.getUTCMonth() !== previousMonth && week < WEEKS - 2) {
      labels.push(`<span style="grid-column:${week + 1}">${formatDate(current, { month: 'short' })}</span>`);
      previousMonth = current.getUTCMonth();
    }

    const day = byDate.get(date);
    const contributions = day?.count ?? 0;
    const label = `${contributions} contribution${contributions === 1 ? '' : 's'} on ${formatDate(current, { month: 'long', day: 'numeric', year: 'numeric' })}`;
    const empty = !day || date > lastDate ? ' is-empty' : '';
    cells.push(`<span class="calendar-cell${empty}" data-level="${day?.level ?? 0}" title="${label}"></span>`);
  }

  calendar.innerHTML = cells.join('');
  months.innerHTML = labels.join('');
  calendar.setAttribute('aria-label', `${total} GitHub contributions in the last year`);
  count.textContent = `${total} contributions in the last year ↗`;
}

export async function loadContributions(username, elements) {
  try {
    const data = await fetchLive(username).catch(fetchSnapshot);
    render(data, elements);
  } catch {
    elements.calendar.innerHTML = '<span class="calendar-unavailable">GitHub activity is temporarily unavailable.</span>';
  }
}
