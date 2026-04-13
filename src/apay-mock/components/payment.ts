export function renderPaymentMethodSelector(root: HTMLElement, comp: any, manifest: any) {
  const features = comp.features ?? {};
  const hideHeader: boolean = features.hideHeader ?? false;

  // Integration detection
  const csIntg = manifest.integrations?.find((i: any) => i.provider === 'Cybersource' && i.enabled !== false);
  const svIntg = manifest.integrations?.find((i: any) => i.provider === 'GiftCard' && i.enabled !== false);
  const ppIntg = manifest.integrations?.find((i: any) => i.provider === 'PayPal' && i.enabled !== false);

  const hasGooglePay = !!csIntg?.settings?.paymentMethods?.GGL?.length;
  const hasApplePay = !!csIntg?.settings?.paymentMethods?.APL?.length;
  const hasCreditCard = !!csIntg?.settings?.paymentMethods?.CCD?.length;
  const hasGiftCard = !!svIntg;
  const hasPayPal = !!ppIntg;

  const ppFunding: any[] = ppIntg?.settings?.fundingSources ?? [];
  const hasPayLater = ppFunding.some((f) => f.source === 'paylater' && f.enabled !== false);
  const hasVenmo = ppFunding.some((f) => f.source === 'venmo' && f.enabled !== false);

  const hasExpress = hasGooglePay || hasApplePay || hasPayPal;

  const section = document.createElement('div');

  // ── Express payments ──────────────────────────────────────
  if (hasExpress) {
    const expressSection = document.createElement('div');
    expressSection.style.marginBottom = '4px';

    const expressLabel = document.createElement('div');
    expressLabel.className = 'express-label';
    expressLabel.textContent = 'Express Payments';
    expressSection.appendChild(expressLabel);

    // Build button pairs in a grid
    const btns: string[] = [];

    if (hasGooglePay) {
      btns.push(`
        <button class="express-btn gpay">
          <svg width="17" height="17" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span class="btn-text" style="color:white">Pay</span>
        </button>`);
    }

    if (hasApplePay) {
      btns.push(`
        <button class="express-btn applepay">
          <svg width="20" height="14" viewBox="0 0 50 20" fill="white">
            <path d="M9.2 4.4c-.7.8-1.8 1.5-2.9 1.4-.1-1.1.4-2.3 1.1-3 .7-.8 1.9-1.5 2.9-1.5.1 1.2-.4 2.3-1.1 3.1zm1 1.6c-1.6-.1-3 .9-3.8.9-.8 0-2-.9-3.3-.9C1.5 6.1 0 7.5 0 10.4c0 4.1 3.6 9.6 5.1 9.6.8 0 1.5-.5 2.6-.5 1.1 0 1.7.5 2.7.5C12 20 15 15 15 10.4c0-2.8-1.5-4.4-3.8-4.4h-1z"/>
            <text x="18" y="15" font-size="12" font-weight="700" font-family="Arial">Pay</text>
          </svg>
        </button>`);
    }

    if (hasPayPal) {
      btns.push(`
        <button class="express-btn paypal">
          <span class="btn-text-blue">Pay</span><span class="btn-text-light">Pal</span>
        </button>`);
    }

    if (hasPayLater) {
      btns.push(`
        <button class="express-btn paylater">
          <div style="width:18px;height:18px;border-radius:50%;background:#003087;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:white">P</div>
          <span style="font-size:13px;font-weight:700;color:#003087">Pay Later</span>
        </button>`);
    }

    if (hasVenmo) {
      btns.push(`
        <button class="express-btn venmo">
          <span class="btn-text">venmo</span>
        </button>`);
    }

    // Render in pairs
    const rows: string[] = [];
    for (let i = 0; i < btns.length; i += 2) {
      const pair = btns.slice(i, i + 2);
      rows.push(`<div class="express-grid">${pair.join('')}</div>`);
    }

    expressSection.innerHTML += rows.join('');
    section.appendChild(expressSection);

    // OR divider
    const orDiv = document.createElement('div');
    orDiv.className = 'or-divider';
    orDiv.innerHTML = `<div class="or-line"></div><span class="or-text">OR</span><div class="or-line"></div>`;
    section.appendChild(orDiv);
  }

  // ── Contact information ───────────────────────────────────
  const contactSection = document.createElement('div');
  contactSection.style.marginBottom = '20px';
  contactSection.innerHTML = `
    <div class="section-title" style="margin-bottom:14px">Contact information</div>
    <div class="field-wrapper">
      <div class="field-label">First name</div>
      <div class="field-value">John</div>
    </div>
    <div class="field-wrapper">
      <div class="field-label">Last name</div>
      <div class="field-value">Doe</div>
    </div>
    <div class="field-wrapper">
      <div class="field-label">Email</div>
      <div class="field-value">johndoe@example.com</div>
    </div>
    <div class="field-wrapper phone-field">
      <div class="phone-flag">
        <span style="font-size:15px">🇺🇸</span>
        <span style="font-size:13px;color:#374151">+1</span>
        <span style="font-size:9px;color:#9ca3af">▾</span>
      </div>
      <div>
        <div class="field-label">Phone Number</div>
        <div class="field-value">5555555555</div>
      </div>
    </div>
  `;
  section.appendChild(contactSection);

  // ── Payment method ────────────────────────────────────────
  const paymentSection = document.createElement('div');
  paymentSection.style.marginBottom = '4px';

  if (!hideHeader) {
    paymentSection.innerHTML = `
      <div class="section-title" style="margin-bottom:8px">Payment method</div>
      <div class="secure-badge">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        <span class="secure-text">Transactions are secured and encrypted</span>
      </div>
    `;
  }

  const list = document.createElement('div');
  list.className = 'payment-method-list';

  const rows: { badge: string; label: string; badgeClass: string }[] = [];

  if (hasCreditCard) {
    rows.push({ badge: 'VISA', label: 'Credit / Debit Card', badgeClass: 'visa' });
  }
  if (hasGiftCard) {
    rows.push({ badge: 'SVC', label: 'Gift Card', badgeClass: 'svc' });
  }
  if (hasPayPal) {
    rows.push({ badge: 'PP', label: 'PayPal', badgeClass: '' });
  }

  rows.forEach((row, i) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'payment-method-row' + (i === 0 ? ' selected' : '');

    const badge =
      row.label === 'PayPal'
        ? `<span style="font-size:13px;font-weight:800;color:#003087">Pay</span><span style="font-size:13px;font-weight:800;color:#009cde">Pal</span>`
        : `<span class="pm-badge ${row.badgeClass}">${row.badge}</span>`;

    const radio = document.createElement('div');
    radio.className = 'pm-radio' + (i === 0 ? ' checked' : '');

    rowEl.innerHTML = badge + `<span class="pm-name">${row.label}</span>`;
    rowEl.appendChild(radio);

    rowEl.onclick = () => {
      list.querySelectorAll('.payment-method-row').forEach((r) => r.classList.remove('selected'));
      list.querySelectorAll('.pm-radio').forEach((r) => r.classList.remove('checked'));
      rowEl.classList.add('selected');
      radio.classList.add('checked');
    };

    list.appendChild(rowEl);
  });

  paymentSection.appendChild(list);
  section.appendChild(paymentSection);
  root.appendChild(section);
}
