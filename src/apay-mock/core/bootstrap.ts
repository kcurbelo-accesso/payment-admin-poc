import { setupStepper } from './stepper';
import { applyTheme } from './theme';

export function bootstrap(manifest: any) {
  applyTheme(manifest.merchant.theme);

  document.body.innerHTML = `
    <header id="app-header">
      <div class="header-nav-btns">
        <button class="header-icon-btn" title="Menu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <button class="header-icon-btn" title="Refresh">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </button>
      </div>

      <nav id="breadcrumb" class="header-breadcrumb"></nav>

      <div class="header-spacer"></div>
    </header>

    <div id="app-layout">
      <main id="content"></main>

      <aside id="summary">
        <div class="summary-title">Order Summary</div>

        <div class="summary-item">
          <div>
            <div class="summary-item-label">General Admission × 2</div>
            <div class="summary-item-sub">Sat, Jul 19 · All Day</div>
          </div>
          <div class="summary-item-price">$98.00</div>
        </div>

        <div class="summary-item">
          <div>
            <div class="summary-item-label">Parking Pass</div>
            <div class="summary-item-sub">Lot B</div>
          </div>
          <div class="summary-item-price">$12.00</div>
        </div>

        <div class="summary-item">
          <div class="summary-item-label">Convenience Fee</div>
          <div class="summary-item-price">$3.50</div>
        </div>

        <hr class="summary-divider">

        <div class="summary-total">
          <span class="summary-total-label">Total</span>
          <span class="summary-total-amount">$113.50</span>
        </div>
        <div class="summary-tax">
          <span>Tax included</span>
          <span>USD</span>
        </div>
      </aside>
    </div>
  `;

  setupStepper(manifest);
}
