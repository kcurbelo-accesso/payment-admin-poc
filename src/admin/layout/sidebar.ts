import { ROUTES, getRoute, navigate, type Route } from '../router';

export function renderSidebar(container: HTMLElement): void {
  function build() {
    const currentRoute = getRoute();

    container.innerHTML = `
      <aside style="
        width: 240px; min-width: 240px; height: 100vh;
        background: linear-gradient(170deg, #0d1829 0%, #0f172a 60%, #111827 100%);
        display: flex; flex-direction: column;
        position: fixed; top: 0; left: 0; z-index: 100;
        border-right: 1px solid rgba(255,255,255,0.05);
        box-shadow: 4px 0 24px rgba(0,0,0,0.25);
      ">

        <!-- Logo -->
        <div style="padding: 22px 18px 18px; border-bottom: 1px solid rgba(255,255,255,0.06);">
          <div style="display: flex; align-items: center; gap: 11px;">
            <div style="
              width: 38px; height: 38px; flex-shrink: 0;
              background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
              border-radius: 10px;
              display: flex; align-items: center; justify-content: center;
              font-size: 17px; font-weight: 800; color: white; letter-spacing: -0.5px;
              box-shadow: 0 4px 14px rgba(59,130,246,0.45);
            ">A</div>
            <div>
              <div style="color: #f1f5f9; font-size: 15px; font-weight: 700; line-height: 1.2; letter-spacing: -0.3px;">Checkout Admin POC</div>
              <div style="color: #475569; font-size: 10.5px; font-weight: 500; letter-spacing: 0.06em; margin-top: 1px; text-transform: uppercase;">Config CRM</div>
            </div>
          </div>
        </div>

        <!-- Nav label -->
        <div style="padding: 18px 18px 6px;">
          <span style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #334155;">Navigation</span>
        </div>

        <!-- Nav items -->
        <nav style="flex: 1; padding: 4px 10px; display: flex; flex-direction: column; gap: 2px; overflow-y: auto;">
          ${ROUTES.map((r) => {
            const active = r.route === currentRoute;
            return `
              <button
                data-route="${r.route}"
                style="
                  display: flex; align-items: center; gap: 11px;
                  width: 100%; padding: 10px 12px;
                  border: none; border-radius: 9px;
                  cursor: pointer; font-family: inherit; font-size: 13.5px; font-weight: ${active ? '600' : '500'};
                  text-align: left; transition: all 0.15s ease;
                  ${
                    active
                      ? `background: linear-gradient(130deg, rgba(59,130,246,0.85) 0%, rgba(37,99,235,0.9) 100%);
                       color: white;
                       box-shadow: 0 2px 10px rgba(59,130,246,0.3), inset 0 1px 0 rgba(255,255,255,0.1);`
                      : `background: transparent; color: #64748b;`
                  }
                "
                ${
                  !active
                    ? `
                  onmouseover="this.style.background='rgba(255,255,255,0.06)'; this.style.color='#cbd5e1';"
                  onmouseout="this.style.background='transparent'; this.style.color='#64748b';"
                `
                    : ''
                }
              >
                <span style="
                  width: 30px; height: 30px; border-radius: 7px; flex-shrink: 0;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 14px;
                  background: ${active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)'};
                  transition: background 0.15s;
                ">${r.icon}</span>
                <span style="flex: 1;">${r.label}</span>
                ${active ? `<span style="width: 5px; height: 5px; background: rgba(255,255,255,0.7); border-radius: 50%; flex-shrink: 0;"></span>` : ''}
              </button>
            `;
          }).join('')}
        </nav>

        <!-- Divider -->
        <div style="margin: 0 18px; height: 1px; background: rgba(255,255,255,0.06);"></div>

        <!-- Footer -->
        <div style="padding: 14px 18px 18px;">
          <div style="
            background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
            border-radius: 10px; padding: 10px 12px;
            display: flex; align-items: center; gap: 10px;
          ">
            <div style="
              width: 8px; height: 8px; background: #22c55e; border-radius: 50%; flex-shrink: 0;
              box-shadow: 0 0 0 3px rgba(34,197,94,0.2);
            "></div>
            <div>
              <div style="color: #94a3b8; font-size: 11px; font-weight: 600;">All systems normal</div>
              <div style="color: #334155; font-size: 10px; margin-top: 1px;">v0.1.0-poc</div>
            </div>
          </div>
        </div>
      </aside>
    `;

    container.querySelectorAll('button[data-route]').forEach((btn) => {
      btn.addEventListener('click', () => {
        navigate((btn as HTMLElement).dataset.route as Route);
      });
    });
  }

  build();
  window.addEventListener('hashchange', () => build());
}
