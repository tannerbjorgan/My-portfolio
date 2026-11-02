const projects = [
  {
    name: 'Scribeist',
    url: 'https://scribeist.com',
    image: 'assets/projects/scribeist.png',
    imageAlt: 'Scribeist editor with Mythos character tracking',
    description: 'Writing platform with dedicated workspaces for books, blogs, research, and AI-assisted editing.'
  },
  {
    name: 'LogBook',
    image: 'assets/projects/logbook.webp',
    imageAlt: 'Equipment used by construction and mining crews',
    description: 'Offline-first equipment inspections and requests for mining and construction crews.'
  },
  {
    name: 'RAG Service',
    id: 'rag-service',
    image: 'assets/projects/rag-service.svg',
    imageAlt: 'Diagram of vector and lexical retrieval feeding ranked evidence',
    description: 'Research retrieval pipeline that finds supporting passages and returns evidence-linked context for AI tools.'
  }
];

const skills = [
  ['React', 'react.svg'],
  ['TypeScript', 'typescript.svg'],
  ['Node.js', 'nodedotjs.svg'],
  ['Express', 'express.svg'],
  ['Docker', 'docker.svg'],
  ['PostgreSQL', 'postgresql.svg'],
  ['SQLite', 'sqlite.svg'],
  ['Prisma', 'prisma.svg'],
  ['Git', 'git.svg'],
  ['GitHub', 'github.svg'],
  ['AWS S3', 'amazons3.svg'],
  ['Google Cloud', 'googlecloud.svg'],
  ['CloudFront', 'amazoncloudfront.svg'],
  ['Claude Code', 'claude.svg'],
  ['Codex', 'codex.png']
];

const $ = (selector) => document.querySelector(selector);
const html = document.documentElement;
const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme === 'light' || savedTheme === 'dark') html.dataset.theme = savedTheme;
$('#theme-toggle').addEventListener('click', () => {
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('portfolio-theme', html.dataset.theme);
});

const avatarDialog = $('#avatar-dialog');
$('#avatar-button').addEventListener('click', () => avatarDialog.showModal());
$('#close-avatar').addEventListener('click', () => avatarDialog.close());
avatarDialog.addEventListener('click', (event) => {
  if (event.target === avatarDialog) avatarDialog.close();
});

document.querySelectorAll('.job-heading').forEach(button => button.addEventListener('click', () => {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  button.nextElementSibling.hidden = expanded;
}));

$('#project-grid').innerHTML = projects.map((project) => {
  const tag = project.url ? 'a' : 'article';
  const linkAttributes = project.url ? ` href="${project.url}" target="_blank" rel="noopener noreferrer"` : '';
  return `<${tag} class="project-card"${project.id ? ` id="${project.id}"` : ''}${linkAttributes}>
    <img src="${project.image}" alt="${project.imageAlt}" loading="lazy" />
    <div class="project-card-info">
      <div class="project-name-row"><span class="project-name">${project.name}</span>${project.url ? '<span class="project-arrow" aria-hidden="true">↗</span>' : ''}</div>
      <p class="project-description">${project.description}</p>
    </div>
  </${tag}>`;
}).join('');

function renderContributions(data) {
  const days = new Map(data.days.map(day => [day.date, day]));
  const first = new Date(`${data.days[0].date}T00:00:00Z`);
  first.setUTCDate(first.getUTCDate() - first.getUTCDay());
  const last = data.days[data.days.length - 1].date;
  const calendar = $('#calendar');
  const monthLabels = $('#month-labels');
  const cells = [];
  const months = [];
  let previousMonth = -1;

  for (let index = 0; index < 53 * 7; index++) {
    const current = new Date(first);
    current.setUTCDate(first.getUTCDate() + index);
    const date = current.toISOString().slice(0, 10);
    const month = current.getUTCMonth();
    if (index % 7 === 0 && month !== previousMonth && Math.floor(index / 7) < 51) {
      months.push(`<span style="grid-column:${Math.floor(index / 7) + 1}">${current.toLocaleString('en-US', {month:'short', timeZone:'UTC'})}</span>`);
      previousMonth = month;
    }
    const day = days.get(date);
    const count = day?.count ?? 0;
    const label = `${count} contribution${count === 1 ? '' : 's'} on ${current.toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric', timeZone:'UTC'})}`;
    cells.push(`<span class="calendar-cell${!day || date > last ? ' empty' : ''}" data-level="${day?.level ?? 0}" title="${label}"></span>`);
  }
  calendar.innerHTML = cells.join('');
  monthLabels.innerHTML = months.join('');
  calendar.setAttribute('aria-label', `${data.total} GitHub contributions in the last year`);
  $('#contribution-count').textContent = `${data.total} contributions in the last year ↗`;
}

fetch('contributions.json')
  .then(response => {
    if (!response.ok) throw new Error(`Contribution data: ${response.status}`);
    return response.json();
  })
  .then(renderContributions)
  .catch(() => {
    $('#calendar').innerHTML = '<span class="calendar-unavailable">GitHub activity is temporarily unavailable.</span>';
  });

const toolMarkup = skills.map(([name, file]) => `<div class="tool"><span class="tool-mark"><img src="assets/skills/${file}" alt="" /></span><span class="tool-name">${name}</span></div>`).join('');
$('#marquee-track').innerHTML = toolMarkup + toolMarkup;
