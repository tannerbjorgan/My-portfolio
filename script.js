const projects = [
  { name: 'Forge UI', url: 'https://forgeui.in', stars: '209', description: 'A library of React components for smooth, fast front-end development.' },
  { name: 'Statsio', url: 'https://statsio.amanshakya.in', stars: '7', description: 'Developer-friendly analytics for quick, private, and actionable website insights.' },
  { name: 'Discuze', url: 'https://discuze.amanshakya.in', description: 'Discuze allows creating, engaging, and sharing tech discussions easily.' },
  { name: 'Talko', url: 'https://talko.amanshakya.in', description: 'Real-time chat with instant messages and live activity indicators.' },
  { name: 'Snip.AI', url: 'https://snip-ai.amanshakya.in', description: 'Turn ideas into engaging social media posts effortlessly with SnipAI.' },
  { name: 'CodeCraftr', url: 'https://codecraftr.amanshakya.in', description: 'Create visually appealing, shareable code snippets quickly with Codecraftr.' }
];

const skills = ['JavaScript','TypeScript','HTML5','CSS3','Java','React.js','Next.js','Vite','Tailwind CSS','Radix UI','Framer Motion','Node.js','Express','REST APIs','GraphQL','PostgreSQL','MySQL','Prisma','Drizzle','Git','GitHub','ESLint','Prettier','Docker','Vercel','Jest'];
const marks = {'JavaScript':'JS','TypeScript':'TS','HTML5':'5','CSS3':'CSS','Java':'♨','React.js':'⚛','Next.js':'N','Vite':'⚡','Tailwind CSS':'≈','Radix UI':'◈','Framer Motion':'M','Node.js':'⬡','Express':'ex','REST APIs':'{}','GraphQL':'◇','PostgreSQL':'♘','MySQL':'◉','Prisma':'◭','Drizzle':'◌','Git':'◆','GitHub':'◔','ESLint':'⬡','Prettier':'▥','Docker':'▥','Vercel':'▲','Jest':'♧'};

const $ = (selector) => document.querySelector(selector);
const html = document.documentElement;
const savedTheme = localStorage.getItem('portfolio-theme');
if (savedTheme === 'light' || savedTheme === 'dark') html.dataset.theme = savedTheme;
$('#theme-toggle').addEventListener('click', () => { html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark'; localStorage.setItem('portfolio-theme', html.dataset.theme); });

const avatarDialog = $('#avatar-dialog');
$('#avatar-button').addEventListener('click', () => avatarDialog.showModal());
$('#close-avatar').addEventListener('click', () => avatarDialog.close());
avatarDialog.addEventListener('click', (event) => { if (event.target === avatarDialog) avatarDialog.close(); });

document.querySelectorAll('.job-heading').forEach(button => button.addEventListener('click', () => {
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!expanded));
  button.nextElementSibling.hidden = expanded;
}));

let showAll = false;
function renderProjects() {
  $('#project-grid').innerHTML = projects.slice(0, showAll ? projects.length : 4).map(project => `
    <a class="project-card" href="${project.url}" target="_blank" rel="noopener noreferrer" aria-label="${project.name}">
      <img src="assets/gradient.jpg" alt="" loading="lazy" />
      <div class="project-card-info"><div class="project-name-row"><span class="project-name">${project.name}</span>${project.stars ? `<span class="stars"><span aria-hidden="true">★</span> ${project.stars}</span>` : ''}</div><p class="project-description">${project.description}</p></div>
    </a>`).join('');
  $('#show-more').innerHTML = `${showAll ? 'Show Less' : 'Show More'} <span aria-hidden="true">↗</span>`;
  $('#show-more').setAttribute('aria-expanded', String(showAll));
}
$('#show-more').addEventListener('click', () => { showAll = !showAll; renderProjects(); });
renderProjects();

// Snapshot of the reference contribution pattern; replace this with personal data later.
const contributionLevels = '02121002211323211122222111111113132123100011000011221221232321211101010112212111111011001011110010122110011210100111111222010101110001232221131111102311232201201101003110001001001400000000000000141011010010003111111142434421111333100422243411121131122413123111111421134234223111100413334401311121222001122102012111121221120111111111201211111011111213113112311132221';
function levelFor(week, day) { return Number(contributionLevels[week * 7 + day] || 0); }
const calendar = $('#calendar');
for (let week = 0; week < 53; week++) for (let day = 0; day < 7; day++) {
  const cell = document.createElement('span');
  cell.className = 'calendar-cell'; cell.dataset.level = levelFor(week, day);
  cell.title = `${cell.dataset.level === '0' ? 'No' : cell.dataset.level} contributions`;
  calendar.appendChild(cell);
}

const toolMarkup = skills.map((skill) => `<div class="tool"><span class="tool-mark ${['JavaScript','TypeScript','CSS3'].includes(skill) ? 'box' : skill === 'ESLint' ? 'hex' : ''}"><span>${marks[skill]}</span></span><span class="tool-name">${skill}</span></div>`).join('');
$('#marquee-track').innerHTML = toolMarkup + toolMarkup;
