export function renderPayLater(root: HTMLElement, _comp: any, _manifest: any) {
  const section = document.createElement('div');

  section.innerHTML = `
    <div class="section-title">Pay Monthly</div>
    <div class="section-sub">Split your purchase into easy monthly payments with 0% APR financing.</div>
    <div class="paylater-card">
      <div class="paylater-as-low">as low as</div>
      <div class="paylater-amount">$37.83<span> /mo</span></div>
      <div class="paylater-terms">for 3 months · 0% APR · No hidden fees</div>
      <div class="paylater-cta">Apply for financing</div>
    </div>
  `;

  root.appendChild(section);
}
