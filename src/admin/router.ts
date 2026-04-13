export type Route = '#/dashboard' | '#/merchants' | '#/app-config' | '#/logs' | '#/releases';

export const ROUTES: { route: Route; label: string; icon: string }[] = [
  { route: '#/dashboard', label: 'Dashboard', icon: '▦' },
  { route: '#/merchants', label: 'Merchants', icon: '⬡' },
  { route: '#/app-config', label: 'App Config', icon: '⚙' },
  { route: '#/logs', label: 'Logs', icon: '≡' },
  { route: '#/releases', label: 'Releases', icon: '⬆' },
];

export function getRoute(): Route {
  const hash = window.location.hash;
  const valid = ROUTES.map(r => r.route);
  return (valid.includes(hash as Route) ? hash : '#/dashboard') as Route;
}

export function navigate(route: Route) {
  window.location.hash = route;
}

export function onRouteChange(fn: (route: Route) => void) {
  window.addEventListener('hashchange', () => fn(getRoute()));
}
