/* ── INLINE SVG STRINGS (used in dynamically rendered HTML) ── */
const I = {
  chevron:   `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  credit:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>`,
  payment:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>`,
  phone:     `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:.45"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.95-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.03z"/></svg>`,
  clipboard: `<svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>`,
  check:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  edit:      `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:     `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
};

/* ── DATA ── */
const COLORS = ['#e05c5c','#0f9b8e','#f0a500','#6c5ce7','#e17055','#00b894','#d63031','#0984e3'];
let db = JSON.parse(localStorage.getItem('khata_db') || '{"customers":[],"entries":[]}');
let activeCustomerId = null;
let activeEntryId    = null;
let openCards = new Set();

/* ── UTILITIES ── */
const save = () => localStorage.setItem('khata_db', JSON.stringify(db));
const uid  = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function fmt(n) {
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000)   return '₹' + (n / 1000).toFixed(1) + 'k';
  return '₹' + n.toFixed(0);
}

const getInitials = name => name.trim().split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');

function getColor(id) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % COLORS.length;
  return COLORS[h];
}

function customerBalance(cid) {
  let credit = 0, paid = 0;
  db.entries.filter(e => e.cid === cid).forEach(e => {
    if (e.type === 'credit') credit += e.amount;
    else paid += e.amount;
  });
  return { credit, paid, net: credit - paid };
}

function totalSummary() {
  let credit = 0, paid = 0;
  db.entries.forEach(e => {
    if (e.type === 'credit') credit += e.amount;
    else paid += e.amount;
  });
  return { credit, paid, net: credit - paid };
}

/* ── RENDER ── */
function render(filter = '') {
  // Update summary numbers (Mobile = M, Desktop = D)
  const s = totalSummary();
  ['M', 'D'].forEach(sfx => {
    const tc = document.getElementById('totalCredit' + sfx);
    const tp = document.getElementById('totalPaid' + sfx);
    const tn = document.getElementById('totalNet' + sfx);
    if (tc) tc.textContent = fmt(s.credit);
    if (tp) tp.textContent = fmt(s.paid);
    if (tn) tn.textContent = fmt(s.net);
  });

  const sc = document.getElementById('sidebarCount');
  if (sc) sc.textContent = db.customers.length + ' customer' + (db.customers.length === 1 ? '' : 's');

  const list = document.getElementById('customerList');
  const filtered = db.customers.filter(c =>
    c.name.toLowerCase().includes(filter.toLowerCase()) || (c.phone || '').includes(filter)
  );

  // Empty state
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">
      <div class="es-icon" style="color:#ccc">${I.clipboard}</div>
      <div class="es-title">${filter ? 'No results found' : 'No customers yet'}</div>
      <div class="es-sub">${filter ? 'Try a different name.' : 'Tap the + button to add your first customer.'}</div>
    </div>`;
    return;
  }

  // Render customer cards
  list.innerHTML = filtered.map(c => {
    const b = customerBalance(c.id);
    const isOpen = openCards.has(c.id);
    const entries = db.entries.filter(e => e.cid === c.id).slice().reverse();
    const allSorted = db.entries.filter(e => e.cid === c.id).slice().sort((a, z) => a.ts - z.ts);

    const eHtml = entries.length === 0
      ? `<div class="no-entries">No transactions yet</div>`
      : `<table class="entries-table">
          <thead><tr><th>Type</th><th>Amount</th><th>Note</th><th>Date</th><th>Balance</th><th></th></tr></thead>
          <tbody>${entries.map(e => {
            let bal = 0;
            for (const x of allSorted) {
              if (x.type === 'credit') bal += x.amount; else bal -= x.amount;
              if (x.id === e.id) break;
            }
            return `<tr>
              <td><span class="entry-type-badge badge-${e.type}">${e.type === 'credit' ? 'Credit' : 'Payment'}</span></td>
              <td><span class="entry-amount ${e.type}">${e.type === 'credit' ? '+' : '-'}${fmt(e.amount)}</span></td>
              <td><span class="entry-note">${e.note || '—'}</span></td>
              <td><span class="entry-date">${new Date(e.ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span></td>
              <td><span style="font-size:12px;font-weight:700;color:${bal > 0 ? 'var(--red)' : bal < 0 ? 'var(--green)' : '#888'}">${fmt(Math.abs(bal))}</span></td>
              <td>
                <div style="display:flex;gap:4px;justify-content:flex-end;">
                  <button class="row-btn edit-btn" onclick="openEditEntry('${e.id}')" title="Edit">${I.edit}</button>
                  <button class="row-btn del-btn"  onclick="deleteEntry('${e.id}')"   title="Delete">${I.trash}</button>
                </div>
              </td>
            </tr>`;
          }).join('')}</tbody>
        </table>`;

    const en = c.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    return `<div class="customer-card ${isOpen ? 'open' : ''}" id="card-${c.id}">
      <div class="customer-head" onclick="toggleCard('${c.id}')">
        <div class="customer-avatar" style="background:${getColor(c.id)}">${getInitials(c.name)}</div>
        <div class="customer-info">
          <div class="customer-name">${c.name}</div>
          <div class="customer-meta">${I.phone} ${c.phone || 'No phone'} &nbsp;·&nbsp; ${entries.length} txn${entries.length === 1 ? '' : 's'}</div>
        </div>
        <div class="customer-balance">
          <div class="balance-label">${b.net > 0 ? 'Owes' : 'Paid off'}</div>
          <div class="balance-amount ${b.net > 0 ? 'owe' : 'paid'}">${fmt(Math.abs(b.net))}</div>
        </div>
        <button class="row-btn edit-btn" style="margin-left:6px" onclick="event.stopPropagation();openEditCustomer('${c.id}')" title="Edit Customer">${I.edit}</button>
        <button class="row-btn del-btn"  style="margin-left:2px" onclick="event.stopPropagation();deleteCustomer('${c.id}')"  title="Delete Customer">${I.trash}</button>
        <div class="customer-toggle">${I.chevron}</div>
      </div>
      <div class="ledger-panel">
        <div class="ledger-actions">
          <button class="btn-credit"  onclick="openCredit('${c.id}','${en}')">${I.credit} Add Credit</button>
          <button class="btn-payment" onclick="openPayment('${c.id}','${en}')">${I.payment} Payment</button>
        </div>
        ${eHtml}
      </div>
    </div>`;
  }).join('');
}

function toggleCard(id) {
  if (openCards.has(id)) openCards.delete(id);
  else openCards.add(id);
  render(document.getElementById('searchInput').value);
}

/* ── MODALS ── */
function openAddCustomer() {
  document.getElementById('newName').value = '';
  document.getElementById('newPhone').value = '';
  document.getElementById('modalAddCustomer').classList.add('active');
  setTimeout(() => document.getElementById('newName').focus(), 100);
}

function openCredit(cid, name) {
  activeCustomerId = cid;
  document.getElementById('creditFor').textContent = name;
  document.getElementById('creditAmount').value = '';
  document.getElementById('creditNote').value = '';
  document.getElementById('modalCredit').classList.add('active');
  setTimeout(() => document.getElementById('creditAmount').focus(), 100);
}

function openPayment(cid, name) {
  activeCustomerId = cid;
  document.getElementById('paymentFor').textContent = name;
  document.getElementById('paymentAmount').value = '';
  document.getElementById('paymentNote').value = '';
  document.getElementById('modalPayment').classList.add('active');
  setTimeout(() => document.getElementById('paymentAmount').focus(), 100);
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

/* ── EDIT CUSTOMER ── */
function openEditCustomer(cid) {
  const c = db.customers.find(x => x.id === cid);
  if (!c) return;
  activeCustomerId = cid;
  document.getElementById('editCustName').value  = c.name;
  document.getElementById('editCustPhone').value = c.phone || '';
  document.getElementById('modalEditCustomer').classList.add('active');
  setTimeout(() => document.getElementById('editCustName').focus(), 100);
}

function saveEditCustomer() {
  const name  = document.getElementById('editCustName').value.trim();
  const phone = document.getElementById('editCustPhone').value.trim();
  if (!name) { showToast('warn', 'Name cannot be empty'); return; }
  const duplicate = db.customers.find(c => c.name.toLowerCase() === name.toLowerCase() && c.id !== activeCustomerId);
  if (duplicate) { showToast('warn', 'Another customer with this name exists'); return; }
  const c = db.customers.find(x => x.id === activeCustomerId);
  c.name  = name;
  c.phone = phone;
  save();
  closeModal('modalEditCustomer');
  render(document.getElementById('searchInput').value);
  showToast('ok', 'Customer updated!');
}

function deleteCustomer(cid) {
  if (!confirm('Delete this customer and ALL their transactions?')) return;
  db.customers = db.customers.filter(c => c.id !== cid);
  db.entries   = db.entries.filter(e => e.cid !== cid);
  openCards.delete(cid);
  save();
  render(document.getElementById('searchInput').value);
  showToast('ok', 'Customer deleted');
}

/* ── EDIT ENTRY ── */
function openEditEntry(eid) {
  const e = db.entries.find(x => x.id === eid);
  if (!e) return;
  activeEntryId = eid;
  document.getElementById('editEntryType').value   = e.type;
  document.getElementById('editEntryAmount').value = e.amount;
  document.getElementById('editEntryNote').value   = e.note || '';
  document.getElementById('modalEditEntry').classList.add('active');
  setTimeout(() => document.getElementById('editEntryAmount').focus(), 100);
}

function saveEditEntry() {
  const amount = parseFloat(document.getElementById('editEntryAmount').value);
  const note   = document.getElementById('editEntryNote').value.trim();
  const type   = document.getElementById('editEntryType').value;
  if (!amount || amount <= 0) { showToast('warn', 'Enter a valid amount'); return; }
  const e = db.entries.find(x => x.id === activeEntryId);
  e.amount = amount;
  e.note   = note;
  e.type   = type;
  save();
  closeModal('modalEditEntry');
  render(document.getElementById('searchInput').value);
  showToast('ok', 'Entry updated!');
}

function deleteEntry(eid) {
  if (!confirm('Delete this transaction?')) return;
  db.entries = db.entries.filter(e => e.id !== eid);
  save();
  render(document.getElementById('searchInput').value);
  showToast('ok', 'Entry deleted');
}

function addCustomer() {
  const name  = document.getElementById('newName').value.trim();
  const phone = document.getElementById('newPhone').value.trim();
  if (!name) { showToast('warn', 'Please enter a name'); return; }
  if (db.customers.find(c => c.name.toLowerCase() === name.toLowerCase())) {
    showToast('warn', 'Customer already exists'); return;
  }
  const c = { id: uid(), name, phone, ts: Date.now() };
  db.customers.unshift(c);
  save();
  closeModal('modalAddCustomer');
  openCards.add(c.id);
  render();
  showToast('ok', name + ' added!');
}

function addEntry(type) {
  const amount = parseFloat(document.getElementById(type + 'Amount').value);
  const note   = document.getElementById(type + 'Note').value.trim();
  if (!amount || amount <= 0) { showToast('warn', 'Enter a valid amount'); return; }
  db.entries.push({ id: uid(), cid: activeCustomerId, type, amount, note, ts: Date.now() });
  save();
  closeModal(type === 'credit' ? 'modalCredit' : 'modalPayment');
  openCards.add(activeCustomerId);
  render(document.getElementById('searchInput').value);
  showToast('ok', type === 'credit' ? `Credit ₹${amount} added` : `Payment ₹${amount} recorded`);
}

/* ── TOAST ── */
let toastTimer;
function showToast(kind, msg) {
  const ti = document.getElementById('toastIcon');
  ti.innerHTML = '';
  const tmp = document.createElement('div');
  tmp.innerHTML = kind === 'ok' ? I.check : I.alert;
  const svg = tmp.firstChild;
  if (svg) ti.replaceWith(svg);
  document.getElementById('toastMsg').textContent = msg;
  const t = document.getElementById('toast');
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

/* ── EVENTS ── */
document.getElementById('searchInput').addEventListener('input', e => render(e.target.value));

document.querySelectorAll('.overlay').forEach(o =>
  o.addEventListener('click', e => { if (e.target === o) o.classList.remove('active'); })
);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.overlay.active').forEach(o => o.classList.remove('active'));
  }
  if (e.key === 'Enter') {
    if (document.getElementById('modalAddCustomer').classList.contains('active'))  addCustomer();
    if (document.getElementById('modalCredit').classList.contains('active'))       addEntry('credit');
    if (document.getElementById('modalPayment').classList.contains('active'))      addEntry('payment');
    if (document.getElementById('modalEditCustomer').classList.contains('active')) saveEditCustomer();
    if (document.getElementById('modalEditEntry').classList.contains('active'))    saveEditEntry();
  }
});

/* ── DATE ── */
document.getElementById('headerDate').textContent =
  new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });

/* ── RESPONSIVE LAYOUT ── */
function applyLayout() {
  const isDesktop = window.innerWidth >= 800;
  const sb  = document.getElementById('desktopSidebar');
  const mo  = document.getElementById('mobileOnly');
  const lay = document.getElementById('mainLayout');
  if (isDesktop) {
    sb.style.display  = 'block';
    mo.style.display  = 'none';
    lay.className     = 'main-grid';
    lay.prepend(sb);
  } else {
    sb.style.display  = 'none';
    mo.style.display  = 'block';
    lay.className     = '';
  }
}

applyLayout();
window.addEventListener('resize', applyLayout);
render();
