/* ==========================================================================
   YENOVA admin panel
   Client-side only: good enough to keep casual visitors out of the editor,
   NOT a substitute for real auth. See README.md before going to production.
   ========================================================================== */

// SHA-256 hash of the default password "yenova@cs2026".
// To change the password: hash your new password (see README.md) and replace this constant.
const YENOVA_ADMIN_HASH = '0295eef76869dad91556b4ba1907e18fe59591bef96bf1a2c7c245682b45e916'; // sha-256 of "yenova@cs2026" — change via README instructions
const YENOVA_SESSION_KEY = 'yenova_admin_session';

async function sha256Hex(text){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------------------------- Auth ---------------------------- */
function isLoggedIn(){
  return sessionStorage.getItem(YENOVA_SESSION_KEY) === 'true';
}

function setLoggedIn(val){
  if(val) sessionStorage.setItem(YENOVA_SESSION_KEY, 'true');
  else sessionStorage.removeItem(YENOVA_SESSION_KEY);
}

function renderAuthState(){
  const loggedIn = isLoggedIn();
  document.getElementById('login-wrap').classList.toggle('hidden', loggedIn);
  document.getElementById('admin-body').classList.toggle('hidden', !loggedIn);
  document.getElementById('logout-btn').classList.toggle('hidden', !loggedIn);
  if(loggedIn) renderTable();
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = document.getElementById('login-password').value;
  const hash = await sha256Hex(pw);
  const errEl = document.getElementById('login-error');
  if(hash === YENOVA_ADMIN_HASH){
    setLoggedIn(true);
    errEl.textContent = '';
    document.getElementById('login-password').value = '';
    renderAuthState();
  }else{
    errEl.textContent = 'Incorrect password. Try again.';
  }
});

document.getElementById('logout-btn').addEventListener('click', () => {
  setLoggedIn(false);
  renderAuthState();
});

/* ---------------------------- Table ---------------------------- */
function renderTable(){
  const events = yenovaLoadEvents().slice().sort((a,b) => new Date(b.date) - new Date(a.date));
  const wrap = document.getElementById('table-wrap');
  const empty = document.getElementById('empty-state');

  if(events.length === 0){
    wrap.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }
  wrap.classList.remove('hidden');
  empty.classList.add('hidden');

  const rows = events.map(ev => {
    const status = yenovaEventStatus(ev);
    return `
      <tr data-id="${ev.id}">
        <td><img class="row-thumb" src="${ev.image}" alt=""></td>
        <td>
          <div class="row-title">${escapeHtml(ev.title)}</div>
          <div class="row-sub">${escapeHtml(ev.subtitle || '')}</div>
        </td>
        <td><span class="pill">${escapeHtml(ev.category || '—')}</span></td>
        <td>${yenovaFormatDateRange(ev)}</td>
        <td><span class="pill ${status}">${status === 'upcoming' ? 'Upcoming' : 'Completed'}</span></td>
        <td>
          <div class="row-actions">
            <button class="icon-btn" data-edit="${ev.id}">Edit</button>
            <button class="icon-btn danger" data-delete="${ev.id}">Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('');

  document.getElementById('table-body').innerHTML = rows;

  wrap.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.edit));
  });
  wrap.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => confirmDelete(btn.dataset.delete));
  });
}

function escapeHtml(str){
  return String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* ---------------------------- Delete ---------------------------- */
function confirmDelete(id){
  const events = yenovaLoadEvents();
  const ev = events.find(e => e.id === id);
  if(!ev) return;
  if(confirm(`Delete "${ev.title}"? This can't be undone.`)){
    yenovaDeleteEvent(id);
    renderTable();
    showToast('Event deleted');
  }
}

/* ---------------------------- Modal / form ---------------------------- */
const modal = document.getElementById('modal');
const form = document.getElementById('event-form');
let editingId = null;
let pendingImageDataUrl = null;

function openModal(id){
  editingId = id || null;
  form.reset();
  pendingImageDataUrl = null;
  document.getElementById('form-error').textContent = '';

  const preview = document.getElementById('img-preview');

  if(id){
    const ev = yenovaLoadEvents().find(e => e.id === id);
    document.getElementById('modal-title').textContent = 'Edit event';
    form.title.value = ev.title || '';
    form.subtitle.value = ev.subtitle || '';
    form.category.value = ev.category || 'Workshop';
    form.date.value = ev.date || '';
    form.endDate.value = ev.endDate || '';
    form.time.value = ev.time || '';
    form.venue.value = ev.venue || '';
    form.description.value = ev.description || '';
    form.registrationLimit.value = ev.registrationLimit || '';
    form.speaker.value = ev.speaker || '';
    form.organizers.value = (ev.organizers || []).join('\n');
    pendingImageDataUrl = ev.image || null;
    preview.src = ev.image || '';
    preview.classList.toggle('hidden', !ev.image);
  }else{
    document.getElementById('modal-title').textContent = 'Add event';
    preview.src = '';
    preview.classList.add('hidden');
  }

  modal.classList.remove('hidden');
}

function closeModal(){
  modal.classList.add('hidden');
  editingId = null;
}

document.getElementById('add-event-btn').addEventListener('click', () => openModal(null));
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('cancel-btn').addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });

document.getElementById('image-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if(!file) return;
  if(file.size > 2 * 1024 * 1024){
    document.getElementById('form-error').textContent = 'Please use an image under 2MB (poster art compresses well as JPG).';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    pendingImageDataUrl = reader.result;
    const preview = document.getElementById('img-preview');
    preview.src = pendingImageDataUrl;
    preview.classList.remove('hidden');
  };
  reader.readAsDataURL(file);
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const errEl = document.getElementById('form-error');

  const data = {
    title: form.title.value.trim(),
    subtitle: form.subtitle.value.trim(),
    category: form.category.value,
    date: form.date.value,
    endDate: form.endDate.value,
    time: form.time.value.trim(),
    venue: form.venue.value.trim(),
    registrationLimit: form.registrationLimit.value ? parseInt(form.registrationLimit.value, 10) : null,
    description: form.description.value.trim(),
    speaker: form.speaker.value.trim(),
    organizers: form.organizers.value.split('\n').map(s => s.trim()).filter(Boolean),
    image: pendingImageDataUrl
  };

  if(!data.title || !data.date || !data.image){
    errEl.textContent = 'Title, date and a poster image are required.';
    return;
  }

  if(editingId){
    yenovaUpdateEvent(editingId, data);
    showToast('Event updated');
  }else{
    yenovaAddEvent(data);
    showToast('Event added');
  }

  closeModal();
  renderTable();
});

/* ---------------------------- Reset ---------------------------- */
document.getElementById('reset-btn').addEventListener('click', () => {
  if(confirm('Reset to the 4 original Yenova events? This replaces everything currently stored.')){
    yenovaResetEvents();
    renderTable();
    showToast('Reset to defaults');
  }
});

renderAuthState();
