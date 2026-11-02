import { projects } from './content.js';
import { escape, projectUrl, techTag } from './sections.js';
import { initShell } from './shell.js';

// Text fields may contain inline HTML (links, <strong>), the same as experience highlights.
const paragraphs = (items = []) => items.map((text) => `<p>${text}</p>`).join('');
const bullets = (items = []) => (items.length ? `<ul>${items.map((text) => `<li>${text}</li>`).join('')}</ul>` : '');

function section(title, body) {
  if (!body) return '';
  return `
    <section class="section">
      <h2 class="section-title">${escape(title)}</h2>
      ${body}
    </section>`;
}

function facts(project) {
  const items = [['Role', project.role], ['Timeline', project.period], ['Status', project.status]].filter(([, value]) => value);
  if (!items.length) return '';
  return `<dl class="project-facts">${items.map(([label, value]) => `<div><dt>${label}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;
}

function links(project) {
  if (!project.links?.length) return '';
  const pills = project.links.map((link) => (link.internal
    ? `<a class="pill" href="${link.url}">${escape(link.label)} →</a>`
    : `<a class="pill" href="${link.url}" target="_blank" rel="noopener noreferrer">${escape(link.label)} ↗</a>`));
  return `<div class="project-links">${pills.join('')}</div>`;
}

function gallery(project) {
  if (!project.gallery?.length) return '';
  return `<div class="project-gallery">${project.gallery.map((item) => `
    <figure>
      <img src="${item.src}" alt="${escape(item.alt ?? '')}" loading="lazy" />
      ${item.caption ? `<figcaption>${escape(item.caption)}</figcaption>` : ''}
    </figure>`).join('')}</div>`;
}

function pager(index) {
  const previous = projects[(index - 1 + projects.length) % projects.length];
  const next = projects[(index + 1) % projects.length];
  if (projects.length < 2) return '';
  return `
    <nav class="project-pager section" aria-label="More projects">
      <a class="pager-link" href="${projectUrl(previous)}"><span>← Previous</span><strong>${escape(previous.name)}</strong></a>
      <a class="pager-link pager-link--next" href="${projectUrl(next)}"><span>Next →</span><strong>${escape(next.name)}</strong></a>
    </nav>`;
}

function renderProject(container, index) {
  const project = projects[index];
  document.title = `${project.name} — Tanner Bjorgan`;
  container.innerHTML = `
    <header class="project-header section">
      <h1>${escape(project.name)}</h1>
      <p class="project-tagline">${escape(project.tagline ?? project.description)}</p>
      ${facts(project)}
      ${links(project)}
    </header>
    <div class="project-cover section">
      <img src="${project.image}" alt="${escape(project.imageAlt ?? '')}" />
    </div>
    ${section('Overview', project.overview?.length ? `<div class="prose">${paragraphs(project.overview)}</div>` : '')}
    ${section('Built with', project.stack?.length ? `<div class="tag-list">${project.stack.map(techTag).join('')}</div>` : '')}
    ${(project.sections ?? []).map((item) => section(item.title, `<div class="prose">${paragraphs(item.paragraphs)}${bullets(item.bullets)}</div>`)).join('')}
    ${section('Gallery', gallery(project))}
    ${pager(index)}`;
}

function renderMissing(container) {
  document.title = 'Project not found — Tanner Bjorgan';
  container.innerHTML = `
    <header class="project-header section">
      <h1>Project not found</h1>
      <p class="project-tagline">That project doesn't exist. <a class="text-link" href="./#projects">See all projects</a>.</p>
    </header>`;
}

const slug = new URLSearchParams(location.search).get('p');
const index = projects.findIndex((project) => project.slug === slug);
const container = document.querySelector('#project');
if (index >= 0) renderProject(container, index);
else renderMissing(container);

initShell();
