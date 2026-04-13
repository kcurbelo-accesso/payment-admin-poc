import { renderPage } from './renderer';

let activeIndex = 0;
let allPages: any[] = [];

export function setupStepper(manifest: any) {
  allPages = [...manifest.navigation.pages]
    .filter((p) => p.enabled !== false)
    .sort((a, b) => a.order - b.order);

  activeIndex = 0;
  renderBreadcrumb(manifest);

  if (allPages.length > 0) {
    renderPage(allPages[0], manifest);
  }
}

function renderBreadcrumb(manifest: any) {
  const nav = document.getElementById('breadcrumb')!;
  nav.innerHTML = '';

  allPages.forEach((page, i) => {
    // Step button
    const btn = document.createElement('button');
    btn.className = 'step-btn ' + (i === activeIndex ? 'active' : 'inactive');
    btn.textContent = page.title;
    btn.onclick = () => {
      activeIndex = i;
      renderBreadcrumb(manifest);
      renderPage(page, manifest);
    };
    nav.appendChild(btn);

    // Separator
    if (i < allPages.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'step-sep';
      sep.textContent = '—';
      nav.appendChild(sep);
    }
  });
}

export function advanceStep(manifest: any) {
  if (activeIndex < allPages.length - 1) {
    activeIndex++;
    renderBreadcrumb(manifest);
    renderPage(allPages[activeIndex], manifest);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
