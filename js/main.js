import { GITHUB_USERNAME, experience, projects, tools } from './content.js';
import { renderExperience, renderProjects, renderTools } from './sections.js';
import { loadContributions } from './contributions.js';
import { initShell } from './shell.js';

const $ = (selector) => document.querySelector(selector);

initShell();

const avatarDialog = $('#avatar-dialog');
$('#avatar-button').addEventListener('click', () => avatarDialog.showModal());
$('#close-avatar').addEventListener('click', () => avatarDialog.close());
avatarDialog.addEventListener('click', (event) => {
  if (event.target === avatarDialog) avatarDialog.close();
});

renderExperience($('#experience-list'), experience);
renderProjects($('#project-grid'), projects);
renderTools($('#tools-track'), tools);

loadContributions(GITHUB_USERNAME, {
  calendar: $('#calendar'),
  months: $('#month-labels'),
  count: $('#contribution-count')
});
