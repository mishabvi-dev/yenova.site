(function(){
  const modal = document.getElementById('reg-modal');
  const form = document.getElementById('reg-form');
  if(!modal || !form) return;

  const errEl = document.getElementById('reg-form-error');
  const noteEl = document.getElementById('reg-form-note');
  const submitBtn = document.getElementById('reg-submit-btn');

  function openRegModal(id){
    const ev = yenovaLoadEvents().find(e => e.id === id);
    if(!ev) return;

    document.getElementById('reg-modal-title').textContent = `Register — ${ev.title}`;
    document.getElementById('reg-modal-sub').textContent = `${yenovaFormatDateRange(ev)}${ev.venue ? ' · ' + ev.venue : ''}`;
    document.getElementById('reg-event-title').value = ev.title;
    document.getElementById('reg-event-date').value = ev.date;

    form.reset();
    form.eventTitle.value = ev.title;
    form.eventDate.value = ev.date;
    errEl.textContent = '';
    noteEl.classList.add('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit registration';

    modal.classList.remove('hidden');
  }

  function closeRegModal(){
    modal.classList.add('hidden');
  }

  // Event delegation: register buttons are added dynamically as event cards render.
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-register]');
    if(btn && !btn.disabled) openRegModal(btn.dataset.register);
  });

  document.getElementById('reg-modal-close').addEventListener('click', closeRegModal);
  document.getElementById('reg-cancel-btn').addEventListener('click', closeRegModal);
  modal.addEventListener('click', (e) => { if(e.target === modal) closeRegModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errEl.textContent = '';
    noteEl.classList.add('hidden');

    if(!YENOVA_FORM_ENDPOINT || YENOVA_FORM_ENDPOINT.includes('PASTE_YOUR')){
      errEl.textContent = "Registration isn't connected yet — the site owner needs to add the Google Sheet link in js/config.js.";
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    const data = new FormData(form);
    data.append('submittedAt', new Date().toISOString());

    try{
      // Apps Script Web Apps don't send CORS headers back by default, so this
      // request is fired in no-cors mode — the row still lands in the Sheet,
      // we just can't read a response back to confirm it in JS.
      await fetch(YENOVA_FORM_ENDPOINT, { method: 'POST', mode: 'no-cors', body: data });
      noteEl.textContent = "You're registered — see you there!";
      noteEl.classList.remove('hidden');
      submitBtn.textContent = 'Registered ✓';
      showRegToast('Registration submitted');
      setTimeout(closeRegModal, 1400);
    }catch(err){
      console.error('[yenova] registration submit failed', err);
      errEl.textContent = 'Something went wrong sending that — check your connection and try again.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit registration';
    }
  });

  function showRegToast(msg){
    const t = document.getElementById('reg-toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showRegToast._timer);
    showRegToast._timer = setTimeout(() => t.classList.remove('show'), 2200);
  }
})();
