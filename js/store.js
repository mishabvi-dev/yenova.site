/* ==========================================================================
   YENOVA — event data layer
   All events live in the browser's localStorage under YENOVA_STORE_KEY, so the
   public site (index.html) and the admin panel (admin/index.html) always read
   the same data. See README.md for how to replace this with a real backend.
   ========================================================================== */

const YENOVA_STORE_KEY = 'yenova_events_v1';

const YENOVA_DEFAULT_EVENTS = [
  {
    id: 'job-essentials-2026',
    title: 'Job Essentials',
    subtitle: 'How To Land Your 1st Job',
    category: 'Talk',
    date: '2026-02-19',
    endDate: '',
    time: '9:30 AM – 3:30 PM',
    venue: 'LH 101, YIASCM',
    description: 'A career-readiness session on cracking your first tech job, led by a founding engineer building AI risk infrastructure. Covers resumes, interviews and what hiring managers actually look for.',
    speaker: 'Ahsaaf S — Founding Engineer, Risknox.Ai',
    organizers: ['Dr. Rathnakar Shetty — Head of Department', 'Ms. Pooja Kottary — Lecturer'],
    image: '/assets/events/job-essentials.jpg'
  },
  {
    id: 'recon-z-2026',
    title: 'RECON Z',
    subtitle: 'Digital Forensics + Criminal Investigation Training Program',
    category: 'Training',
    date: '2026-02-04',
    endDate: '2026-02-05',
    time: 'Full day, both days',
    venue: 'YIASCM Kulur',
    description: 'A two-day hands-on training program in digital forensics and criminal investigation, presented in association with Yenova IT Club — covering evidence handling, device analysis and real investigative workflows.',
    speaker: '',
    organizers: ['Mr. Parameshwar Hegde — Asst. Professor', 'Dr. Rathnakar Shetty — Head of Department', 'Ms. Pooja Kottary — Lecturer'],
    image: '/assets/events/recon-z.jpg'
  },
  {
    id: 'mini-militia-2026',
    title: 'Mini Militia Esports Tournament',
    subtitle: '5 vs 5 knockout bracket',
    category: 'Esports',
    date: '2026-03-31',
    endDate: '',
    time: '9:30 AM onwards',
    venue: 'YMK',
    description: 'A high-energy 5v5 Mini Militia showdown open to every department, run by the CS department to bring the campus gaming community together for a day of trash talk and teamwork.',
    speaker: '',
    prize: '₹1,000 prize pool',
    organizers: ['Dr. Rathnakar Shetty — Head of Department', 'Ms. Pooja Kottary — Lecturer'],
    image: '/assets/events/mini-militia.jpg'
  },
  {
    id: 'the-beginning-webdev-2026',
    title: 'The Beginning',
    subtitle: 'Value Added Course on Web Development',
    category: 'Workshop',
    date: '2026-07-29',
    endDate: '',
    time: '9:30 AM',
    venue: 'YMK Auditorium',
    description: 'A value-added course that takes students from zero to their first deployed web page — HTML, CSS and the habits that carry into real projects.',
    speaker: '',
    organizers: ['Dr. Rathnakar Shetty — Head of Department', 'Dr. Parameshwar R Hegde — Assistant Professor', 'Ms. Pooja Kottary — Faculty Coordinator'],
    image: '/assets/events/web-dev.jpg'
  }
];

function yenovaClone(obj){
  return JSON.parse(JSON.stringify(obj));
}

function yenovaLoadEvents(){
  try{
    const raw = localStorage.getItem(YENOVA_STORE_KEY);
    if(!raw){
      yenovaSaveEvents(YENOVA_DEFAULT_EVENTS);
      return yenovaClone(YENOVA_DEFAULT_EVENTS);
    }
    const parsed = JSON.parse(raw);
    if(!Array.isArray(parsed)) throw new Error('bad shape');
    return parsed;
  }catch(err){
    console.error('[yenova] could not read stored events, reseeding defaults', err);
    yenovaSaveEvents(YENOVA_DEFAULT_EVENTS);
    return yenovaClone(YENOVA_DEFAULT_EVENTS);
  }
}

function yenovaSaveEvents(events){
  localStorage.setItem(YENOVA_STORE_KEY, JSON.stringify(events));
}

function yenovaMakeId(title){
  const slug = (title || 'event').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  return `${slug || 'event'}-${Date.now().toString(36)}`;
}

function yenovaAddEvent(event){
  const events = yenovaLoadEvents();
  const withId = { ...event, id: event.id || yenovaMakeId(event.title) };
  events.unshift(withId);
  yenovaSaveEvents(events);
  return withId;
}

function yenovaUpdateEvent(id, updates){
  const events = yenovaLoadEvents();
  const idx = events.findIndex(e => e.id === id);
  if(idx === -1) return null;
  events[idx] = { ...events[idx], ...updates, id };
  yenovaSaveEvents(events);
  return events[idx];
}

function yenovaDeleteEvent(id){
  const events = yenovaLoadEvents().filter(e => e.id !== id);
  yenovaSaveEvents(events);
}

function yenovaResetEvents(){
  yenovaSaveEvents(YENOVA_DEFAULT_EVENTS);
}

function yenovaEventStatus(event){
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(event.date);
  const end = event.endDate ? new Date(event.endDate) : start;
  return end >= today ? 'upcoming' : 'completed';
}

function yenovaFormatDateRange(event){
  const opts = { day:'numeric', month:'short', year:'numeric' };
  const start = new Date(event.date).toLocaleDateString('en-IN', opts);
  if(event.endDate && event.endDate !== event.date){
    const end = new Date(event.endDate).toLocaleDateString('en-IN', opts);
    return `${start} – ${end}`;
  }
  return start;
}
