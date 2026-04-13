export function renderDonation(root: HTMLElement, comp: any) {
  const features = comp.features ?? {};
  const amounts: number[] = features.amounts ?? [1, 2, 5];
  const enableRounding: boolean = features.enableRounding ?? false;
  const enableCustomAmount: boolean = features.enableCustomAmount ?? true;

  const section = document.createElement('div');

  // Heading
  section.innerHTML = `
    <div class="section-title">Make a donation</div>
    <div class="section-sub">Contribute to a supported initiative.</div>
  `;

  // Round-up pill
  if (enableRounding) {
    const roundUp = document.createElement('button');
    roundUp.className = 'donation-pill';
    roundUp.textContent = 'Round up my purchase (+ $1.00)';
    section.appendChild(roundUp);
  }

  // Amount pills row
  const amountRow = document.createElement('div');
  amountRow.className = 'donation-amounts';

  amounts.slice(0, 3).forEach((a, i) => {
    const pill = document.createElement('button');
    pill.className = 'amount-pill' + (i === 0 ? ' selected' : '');
    pill.textContent = `$${Number(a).toFixed(2)}`;
    pill.onclick = () => {
      amountRow.querySelectorAll('.amount-pill').forEach((p) => p.classList.remove('selected'));
      pill.classList.add('selected');
    };
    amountRow.appendChild(pill);
  });

  if (enableCustomAmount) {
    const custom = document.createElement('button');
    custom.className = 'amount-pill';
    custom.textContent = 'Custom';
    custom.onclick = () => {
      amountRow.querySelectorAll('.amount-pill').forEach((p) => p.classList.remove('selected'));
      custom.classList.add('selected');
    };
    amountRow.appendChild(custom);
  }

  section.appendChild(amountRow);
  root.appendChild(section);
}

export function renderInsurance(root: HTMLElement, _comp: any) {
  const section = document.createElement('div');

  section.innerHTML = `
    <div class="section-title">Ticket Protection</div>
    <div class="section-sub">Protect your purchase with coverage for cancellations and delays.</div>
  `;

  // Decline option
  const decline = document.createElement('div');
  decline.className = 'insurance-card';
  decline.innerHTML = `
    <div class="ins-radio"></div>
    <div class="ins-card-body">
      <div class="ins-card-title">No thanks</div>
      <div class="ins-card-sub">I'll take my chances</div>
    </div>
  `;

  // Add protection option
  const protect = document.createElement('div');
  protect.className = 'insurance-card selected';
  protect.style.marginTop = '8px';
  protect.innerHTML = `
    <div class="ins-radio" style="border-color:var(--primary);background:var(--primary);display:flex;align-items:center;justify-content:center">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.5"><polyline points="20 6 9 17 4 12"/></svg>
    </div>
    <div class="ins-card-body">
      <div class="ins-card-title">Add ticket protection</div>
      <div class="ins-card-sub">Coverage for cancellations, delays &amp; more</div>
    </div>
    <div class="ins-card-price">$2.99</div>
  `;

  // Toggle selection
  [decline, protect].forEach((card) => {
    card.onclick = () => {
      decline.classList.remove('selected');
      protect.classList.remove('selected');
      card.classList.add('selected');
    };
  });

  section.appendChild(decline);
  section.appendChild(protect);
  root.appendChild(section);
}
