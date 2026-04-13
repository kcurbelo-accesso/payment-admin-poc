export function renderSection(root: HTMLElement, title: string, subtitle = '') {
  const section = document.createElement('div');
  section.innerHTML = `
    <div class="section-title">${title}</div>
    ${subtitle ? `<div class="section-sub">${subtitle}</div>` : ''}
  `;
  root.appendChild(section);
  return section;
}
