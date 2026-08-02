(function(){
  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.textContent = open ? '✕' : '☰';
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.textContent = '☰';
    }));
  }

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if(entry.isIntersecting) entry.target.classList.add('in'); });
  }, { threshold: .12 });
  revealEls.forEach(el => io.observe(el));

  const CATEGORY_ICONS = {
    Workshop: '🖥️', Esports: '🎮', Training: '🔍', Talk: '🎤'
  };

  function eventCard(event){
    const status = yenovaEventStatus(event);
    const dateLabel = yenovaFormatDateRange(event);
    const registerButton = status === 'upcoming'
      ? `<button class="event-register-btn" data-register="${event.id}">Register</button>`
      : `<button class="event-register-btn closed" disabled>Registrations closed</button>`;
    return `
      <article class="event-card reveal">
        <div class="event-media">
          <img src="${event.image}" alt="${escapeHtml(event.title)} poster" loading="lazy">
          <span class="event-status ${status}">${status === 'upcoming' ? 'Upcoming' : 'Completed'}</span>
          <span class="event-tag">${CATEGORY_ICONS[event.category] || '✦'} ${escapeHtml(event.category || 'Event')}</span>
        </div>
        <div class="event-body">
          <span class="event-date">${dateLabel}</span>
          <h3>${escapeHtml(event.title)}</h3>
          ${event.subtitle ? `<p class="event-sub">${escapeHtml(event.subtitle)}</p>` : ''}
          <div class="event-meta">
            <span>📍 ${escapeHtml(event.venue || 'TBA')}</span>
            <span>🕒 ${escapeHtml(event.time || '')}</span>
          </div>
          ${registerButton}
        </div>
      </article>`;
  }

  let registrationCounts = null;

  async function fetchCounts() {
    if (typeof YENOVA_FORM_ENDPOINT === 'undefined' || YENOVA_FORM_ENDPOINT.includes('PASTE')) return;
    try {
      const res = await fetch(YENOVA_FORM_ENDPOINT);
      const data = await res.json();
      registrationCounts = data.counts || {};
      updateButtonsWithLimits();
    } catch (e) {
      console.error('[yenova] Failed to fetch registration counts', e);
    }
  }

  function updateButtonsWithLimits() {
    if (!registrationCounts) return;
    const events = yenovaLoadEvents();
    document.querySelectorAll('.event-register-btn:not(.closed)').forEach(btn => {
      const id = btn.dataset.register;
      if (!id) return;
      const ev = events.find(e => e.id === id);
      if (ev && ev.registrationLimit) {
        const currentCount = registrationCounts[ev.title] || 0;
        if (currentCount >= ev.registrationLimit) {
          btn.textContent = 'Registrations full';
          btn.disabled = true;
          btn.classList.add('closed');
          btn.removeAttribute('data-register');
        } else {
          btn.textContent = `Register (${ev.registrationLimit - currentCount} spots left)`;
        }
      }
    });
  }

  function escapeHtml(str){
    return String(str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  }

  async function render(filter){
    const grid = document.getElementById('events-grid');
    if(!grid) return;
    let events = await yenovaLoadEvents();
    // newest first
    events.sort((a,b) => new Date(b.date) - new Date(a.date));
    if(filter && filter !== 'All'){
      events = events.filter(e => e.category === filter);
    }
    if(events.length === 0){
      grid.innerHTML = `<div class="events-empty">No events in this category yet — check back soon.</div>`;
      return;
    }
    grid.innerHTML = events.map(eventCard).join('');
    grid.querySelectorAll('.reveal').forEach(el => io.observe(el));
    if (registrationCounts) updateButtonsWithLimits();
  }

  async function buildFilters(){
    const row = document.getElementById('filter-row');
    if(!row) return;
    const events = await yenovaLoadEvents();
    const cats = ['All', ...new Set(events.map(e => e.category).filter(Boolean))];
    row.innerHTML = cats.map((c,i) => `<button class="filter-chip ${i===0?'active':''}" data-cat="${c}">${c}</button>`).join('');
    row.querySelectorAll('.filter-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        row.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render(btn.dataset.cat);
      });
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await buildFilters();
    await render('All');
    fetchCounts();
    const yearEl = document.getElementById('year');
    if(yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
