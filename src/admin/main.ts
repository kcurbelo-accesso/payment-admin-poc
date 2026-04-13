import { mountShell } from './layout/shell';
import { getRoute } from './router';
import { store } from './services/store';

const root = document.getElementById('admin-root')!;

// Global styles (inject into head)
const style = document.createElement('style');
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f1f5f9; color: #0f172a; -webkit-font-smoothing: antialiased; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

  /* ── Toggle switch ── */
  .toggle-switch { position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0; }
  .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
  .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #cbd5e1; border-radius: 99px; transition: background 0.2s, box-shadow 0.2s; }
  .toggle-slider::before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
  input:checked + .toggle-slider { background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }
  input:checked + .toggle-slider::before { transform: translateX(18px); }

  /* ── Card ── */
  .card {
    background: #ffffff;
    border: 1px solid rgba(226, 232, 240, 0.9);
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 1px 2px rgba(15,23,42,0.04), 0 2px 8px rgba(15,23,42,0.03);
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .card:hover { box-shadow: 0 2px 6px rgba(15,23,42,0.06), 0 6px 20px rgba(15,23,42,0.05); border-color: rgba(203,213,225,0.8); }

  /* ── Badge ── */
  .badge { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 600; letter-spacing: 0.01em; white-space: nowrap; }
  .badge-active  { background: #dcfce7; color: #15803d; }
  .badge-inactive{ background: #f1f5f9; color: #64748b; }
  .badge-pending { background: #fef9c3; color: #92400e; }
  .badge-info    { background: #dbeafe; color: #1d4ed8; }
  .badge-warn    { background: #fef3c7; color: #b45309; }
  .badge-error   { background: #fee2e2; color: #b91c1c; }
  .badge-debug   { background: #f1f5f9; color: #475569; }

  /* ── Button ── */
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    padding: 7px 15px; border-radius: 8px; border: none;
    cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600;
    transition: all 0.15s ease; white-space: nowrap; letter-spacing: -0.01em;
  }
  .btn:active { transform: scale(0.97); }
  .btn-primary {
    background: linear-gradient(160deg, #4f96ff 0%, #2563eb 100%);
    color: white;
    box-shadow: 0 1px 3px rgba(37,99,235,0.25), 0 3px 10px rgba(37,99,235,0.18);
  }
  .btn-primary:hover {
    background: linear-gradient(160deg, #3b82f6 0%, #1d4ed8 100%);
    box-shadow: 0 2px 6px rgba(37,99,235,0.35), 0 6px 18px rgba(37,99,235,0.2);
    transform: translateY(-1px);
  }
  .btn-ghost {
    background: transparent; color: #475569;
    border: 1.5px solid #e2e8f0;
  }
  .btn-ghost:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }
  .btn-danger { background: #fff1f2; color: #be123c; border: 1.5px solid #fecdd3; }
  .btn-danger:hover { background: #fee2e2; border-color: #fca5a5; }

  /* ── Form controls ── */
  .form-input {
    width: 100%; padding: 8px 11px;
    border: 1.5px solid #e2e8f0; border-radius: 8px;
    font-family: inherit; font-size: 13px; color: #0f172a;
    background: #f8fafc;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
    appearance: none;
  }
  .form-input:focus {
    outline: none; background: #ffffff;
    border-color: #93c5fd;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  }
  .form-label { font-size: 11.5px; font-weight: 600; color: #475569; margin-bottom: 5px; display: block; letter-spacing: 0.01em; }

  /* ── Table ── */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table thead { position: sticky; top: 0; z-index: 1; }
  .data-table th {
    text-align: left; padding: 10px 14px;
    font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #94a3b8;
    background: #f8fafc; border-bottom: 1px solid #e2e8f0;
  }
  .data-table th:first-child { border-radius: 0; }
  .data-table td { padding: 11px 14px; border-bottom: 1px solid #f1f5f9; color: #374151; vertical-align: middle; }
  .data-table tbody tr { transition: background 0.1s; }
  .data-table tbody tr:hover td { background: #f8fafc; }
  .data-table tbody tr:last-child td { border-bottom: none; }

  /* ── Tabs ── */
  .tab-bar { display: flex; border-bottom: 1px solid #e2e8f0; gap: 2px; }
  .tab {
    padding: 10px 16px; font-size: 13px; font-weight: 500; cursor: pointer;
    color: #64748b; border-bottom: 2px solid transparent; margin-bottom: -1px;
    background: none; border-top: none; border-left: none; border-right: none;
    font-family: inherit; transition: color 0.15s;
  }
  .tab.active { color: #2563eb; border-bottom-color: #3b82f6; font-weight: 600; }
  .tab:hover:not(.active) { color: #334155; background: #f8fafc; border-radius: 6px 6px 0 0; }

  /* ── Section header ── */
  .section-header {
    font-size: 10.5px; font-weight: 700; color: #94a3b8;
    text-transform: uppercase; letter-spacing: 0.08em;
    padding-bottom: 10px; margin-bottom: 16px;
    border-bottom: 1px solid #f1f5f9;
    display: flex; align-items: center; gap: 8px;
  }

  /* ── Stat card ── */
  .stat-icon {
    width: 44px; height: 44px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* ── Accordion ── */
  .accordion-content { overflow: hidden; }

  /* ── Animations ── */
  @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .page-enter { animation: fadeIn 0.18s ease forwards; }
`;
document.head.appendChild(style);

// Initialize route from URL hash
store.setState({ currentRoute: getRoute() });

mountShell(root);
