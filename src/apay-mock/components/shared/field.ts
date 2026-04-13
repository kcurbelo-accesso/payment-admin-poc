export function renderField(root: HTMLElement, label: string, value = '') {
  const field = document.createElement('div');
  field.className = 'field-wrapper';
  field.innerHTML = `
    <div class="field-label">${label}</div>
    <div class="field-value">${value || '—'}</div>
  `;
  root.appendChild(field);
}
