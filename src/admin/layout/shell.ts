import { renderAppConfig } from '../pages/app-config';
import { renderDashboard } from '../pages/dashboard';
import { renderLogs } from '../pages/logs';
import { renderMerchants } from '../pages/merchants';
import { renderReleases } from '../pages/releases';
import { getRoute, onRouteChange } from '../router';
import { store } from '../services/store';
import { renderSidebar } from './sidebar';
import { renderTopbar } from './topbar';

export function mountShell(root: HTMLElement): void {
  // Build the fixed layout skeleton
  root.style.display = 'flex';
  root.style.minHeight = '100vh';

  root.innerHTML = `
    <div id="shell-sidebar" style="width: 240px; flex-shrink: 0;"></div>
    <div id="shell-main" style="
      flex: 1;
      margin-left: 75px;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #f8fafc;
    ">
      <div id="shell-topbar"></div>
      <main id="shell-content" style="
        flex: 1;
        overflow-y: auto;
        height: calc(100vh - 60px);
        background: #f1f5f9;
      "></main>
    </div>
  `;

  const sidebarEl = root.querySelector<HTMLElement>('#shell-sidebar')!;
  const topbarEl = root.querySelector<HTMLElement>('#shell-topbar')!;
  const contentEl = root.querySelector<HTMLElement>('#shell-content')!;

  // Mount sidebar (self-manages re-renders on route change)
  renderSidebar(sidebarEl);

  // Mount topbar (self-manages re-renders on store/route change)
  renderTopbar(topbarEl);

  // Initial content render
  renderContent(getRoute(), contentEl);

  // Re-render content on route change
  onRouteChange((route) => {
    store.setState({ currentRoute: route });
    renderContent(route, contentEl);
  });
}

function renderContent(route: string, contentEl: HTMLElement): void {
  contentEl.innerHTML = '';
  switch (route) {
    case '#/dashboard':
      renderDashboard(contentEl);
      break;
    case '#/merchants':
      renderMerchants(contentEl);
      break;
    case '#/app-config':
      renderAppConfig(contentEl);
      break;
    case '#/logs':
      renderLogs(contentEl);
      break;
    case '#/releases':
      renderReleases(contentEl);
      break;
    default:
      renderDashboard(contentEl);
  }
}
