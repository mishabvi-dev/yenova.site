/* ==========================================================================
   YENOVA — event data layer (Supabase version)
   ========================================================================== */

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    registrationLimit: null,
    image: 'assets/events/job-essentials.jpg'
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
    registrationLimit: null,
    image: 'assets/events/recon-z.jpg'
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
    registrationLimit: null,
    organizers: ['Dr. Rathnakar Shetty — Head of Department', 'Ms. Pooja Kottary — Lecturer'],
    image: 'assets/events/mini-militia.jpg'
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
    registrationLimit: null,
    organizers: ['Dr. Rathnakar Shetty — Head of Department', 'Dr. Parameshwar R Hegde — Assistant Professor', 'Ms. Pooja Kottary — Faculty Coordinator'],
    image: 'assets/events/web-dev.jpg'
  }
];

function yenovaMakeId(title){
  const slug = (title || 'event').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  return `${slug || 'event'}-${Date.now().toString(36)}`;
}

async function yenovaLoadEvents(){
  const { data, error } = await supabaseClient.from('events').select('*');
  if (error) {
    console.error('[yenova] could not read stored events', error);
    return [];
  }
  return data || [];
}

async function yenovaAddEvent(event){
  const withId = { ...event, id: event.id || yenovaMakeId(event.title) };
  const { data, error } = await supabaseClient.from('events').insert([withId]).select();
  if (error) throw error;
  return data[0];
}

async function yenovaUpdateEvent(id, updates){
  const { data, error } = await supabaseClient.from('events').update(updates).eq('id', id).select();
  if (error) throw error;
  return data ? data[0] : null;
}

async function yenovaDeleteEvent(id){
  const { error } = await supabaseClient.from('events').delete().eq('id', id);
  if (error) throw error;
}

async function yenovaResetEvents(){
  await supabaseClient.from('events').delete().neq('id', 'dummy');
  await supabaseClient.from('events').insert(YENOVA_DEFAULT_EVENTS);
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
