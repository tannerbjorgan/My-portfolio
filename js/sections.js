import { technologies } from './content.js';

const escape = (text) => text.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

const icon = (name) => `assets/skills/${technologies[name]}`;

function techTag(name) {
  return `<span class="tag"><img src="${icon(name)}" alt="" />${escape(name)}</span>`;
}

function jobLogo(logo) {
  if (logo.image) return `<img class="job-logo" src="${logo.image}" alt="" />`;
  return `<span class="job-logo job-logo--text" style="background:${logo.color}" aria-hidden="true">${escape(logo.text)}</span>`;
}

export function renderExperience(container, jobs) {
  container.innerHTML = jobs.map((job) => `
    <article class="job">
      <button class="job-heading" type="button" aria-expanded="false">
        ${jobLogo(job.logo)}
        <span class="job-main"><strong>${escape(job.company)}</strong><em>${escape(job.role)}</em></span>
        <span class="job-meta">${escape(job.period)}<small>${escape(job.note)}</small></span>
        <span class="chevron" aria-hidden="true">›</span>
      </button>
      <div class="job-details" hidden>
        <div class="tag-list">${job.stack.map(techTag).join('')}</div>
        <ul>${job.highlights.map((item) => `<li>${item}</li>`).join('')}</ul>
      </div>
    </article>`).join('');

  container.addEventListener('click', (event) => {
    const heading = event.target.closest('.job-heading');
    if (!heading) return;
    const expanded = heading.getAttribute('aria-expanded') === 'true';
    heading.setAttribute('aria-expanded', String(!expanded));
    heading.nextElementSibling.hidden = expanded;
  });
}

export function renderProjects(container, projects) {
  container.innerHTML = projects.map((project) => {
    const tag = project.url ? 'a' : 'article';
    const id = project.id ? ` id="${project.id}"` : '';
    const link = project.url ? ` href="${project.url}" target="_blank" rel="noopener noreferrer"` : '';
    const arrow = project.url ? '<span class="project-arrow" aria-hidden="true">↗</span>' : '';
    return `
      <${tag} class="project-card"${id}${link}>
        <img src="${project.image}" alt="${escape(project.imageAlt ?? '')}" loading="lazy" />
        <div class="project-card-info">
          <div class="project-name-row"><span>${escape(project.name)}</span>${arrow}</div>
          <p class="project-description">${escape(project.description)}</p>
        </div>
      </${tag}>`;
  }).join('');
}

export function renderTools(track, names) {
  const items = names.map((name) => `
    <div class="tool"><img src="${icon(name)}" alt="" /><span>${escape(name)}</span></div>`).join('');
  // Two copies let the marquee loop seamlessly.
  track.innerHTML = items + items;
}
