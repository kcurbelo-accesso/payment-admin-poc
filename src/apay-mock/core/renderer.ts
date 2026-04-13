import { advanceStep } from './stepper';
import { renderDonation, renderInsurance } from '../components/insurance';
import { renderPaymentMethodSelector } from '../components/payment';
import { renderPayLater } from '../components/pay-later';

export async function renderPage(page: any, manifest: any) {
  const root = document.getElementById('content')!;
  root.innerHTML = '';

  const sortedComponents = [...page.components]
    .sort((a, b) => a.order - b.order)
    .filter((c) => c.enabled !== false);

  if (sortedComponents.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:60px 20px;text-align:center;color:#9ca3af;font-size:14px';
    empty.textContent = 'No components enabled on this page.';
    root.appendChild(empty);
    addContinueButton(root, manifest);
    return;
  }

  sortedComponents.forEach((comp, i) => {
    const wrapper = document.createElement('div');

    switch (comp.componentType) {
      case 'donation':
        renderDonation(wrapper, comp);
        break;
      case 'insurance':
        renderInsurance(wrapper, comp);
        break;
      case 'pay-later':
        renderPayLater(wrapper, comp, manifest);
        break;
      case 'payment-method-selector':
        renderPaymentMethodSelector(wrapper, comp, manifest);
        break;
      default: {
        // Fallback: show component type label
        const fallback = document.createElement('div');
        fallback.style.cssText = 'padding:20px;border:1px dashed #d1d5db;border-radius:8px;color:#6b7280;font-size:13px;text-align:center';
        fallback.textContent = `Component: ${comp.componentType}`;
        wrapper.appendChild(fallback);
      }
    }

    // Divider between components (not after last)
    if (i < sortedComponents.length - 1) {
      const hr = document.createElement('hr');
      hr.className = 'section-divider';
      wrapper.appendChild(hr);
    }

    root.appendChild(wrapper);
  });

  addContinueButton(root, manifest);
}

function addContinueButton(root: HTMLElement, manifest: any) {
  const btn = document.createElement('button');
  btn.className = 'continue-btn';
  btn.innerHTML = `Continue <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>`;
  btn.onclick = () => advanceStep(manifest);
  root.appendChild(btn);
}
