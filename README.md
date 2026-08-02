# Yenova — Department of Computer Science, YIASCM

A static site for Yenova with a public homepage and a separate admin panel for
managing events, no build step required.

## Structure

```
index.html            → public homepage (yenova.site/)
admin/index.html       → admin panel (yenova.site/admin)
css/style.css          → shared design system (colors, type, layout)
css/admin.css          → admin-only styles
js/store.js            → shared event data layer (localStorage)
js/main.js             → homepage behaviour (renders events, filters, nav)
js/admin.js            → admin login + CRUD logic
assets/logo.png        → Yenova mark
assets/events/*.jpg    → the 4 seeded event posters
```

## Running it locally

Any static file server works, e.g. from this folder:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000` for the site and
`http://localhost:8000/admin` for the admin panel.

## Deploying so `/admin` works as a real path

This site has **no server-side code** — `admin/index.html` becomes reachable
at `yenova.site/admin` automatically on any static host that serves
`admin/index.html` when a visitor requests `/admin` (Netlify, Vercel, GitHub
Pages, Cloudflare Pages, and a plain Apache/Nginx `public_html/admin/`
folder all do this out of the box). No extra rewrite rule is needed.

## How events are stored — important limitation

Events are stored in the visitor's **browser** via `localStorage`, under the
key `yenova_events_v1`, shared between the homepage and the admin panel.
That means:

- Edits made in the admin panel on your laptop show up on the homepage **in
  that same browser**, immediately — good for previewing.
- Those edits are **not visible to other visitors** on their own devices,
  because nothing is sent to a server. This setup is meant as a fast,
  no-backend starting point — great for a single organizer maintaining
  content from one machine and re-publishing, not for a live multi-editor CMS.

**To make edits visible to everyone**, the event data layer in `js/store.js`
(the `yenovaLoadEvents` / `yenovaSaveEvents` functions) needs to be pointed at
a real backend — a small database like Supabase or Firebase, or your own
API — instead of `localStorage`. Everything else (the homepage rendering,
the admin UI) can stay as-is; only those two functions need to change.

If you'd like, this can be wired up to a real backend so changes sync across
every visitor's browser — just ask.

## Connect registrations to a Google Sheet

Every event card on the homepage has a **Register** button (for events that
haven't happened yet) that opens a form — name, email, phone, department &
year. Submissions are sent straight to a Google Sheet, which becomes your
attendance sheet. This takes about 5 minutes to set up, no coding required
beyond a paste.

**1. Create the Sheet**
Make a new Google Sheet. Rename the first tab `Attendance`, and add this
header row:

```
Timestamp | Event | Event Date | Name | Email | Phone | Department & Year
```

**2. Add the script**
In the Sheet, go to **Extensions → Apps Script**, delete the placeholder
code, and paste this:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Attendance');
  var p = e.parameter;
  sheet.appendRow([
    new Date(),
    p.eventTitle || '',
    p.eventDate || '',
    p.name || '',
    p.email || '',
    p.phone || '',
    p.department || ''
  ]);
  return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**3. Deploy it as a Web App**
Click **Deploy → New deployment → select type "Web app"**. Set:
- **Execute as:** Me
- **Who has access:** Anyone

Click **Deploy**, authorize it when prompted, and copy the **Web app URL**
it gives you (ends in `/exec`).

**4. Wire it into the site**
Open `js/config.js` and paste that URL in:

```javascript
const YENOVA_FORM_ENDPOINT = 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec';
```

That's it — submit a test registration from the homepage and it should
appear as a new row within a few seconds.

**Notes:**
- Every submission appends a new row automatically — that Sheet *is* your
  attendance sheet, you can sort, filter, or check people off it directly.
- The **Register** button only appears for events marked "Upcoming" (based
  on the event date); completed events show "Registrations closed" instead.
- If you ever redeploy the Apps Script (not just edit it), you'll get a new
  URL and need to update `js/config.js` again. Editing the script code and
  clicking "Deploy → Manage deployments → Edit → Deploy" keeps the same URL.

## Changing the admin password

The default password is `yenova@cs2026`. **Change this before sharing the
admin URL.** To set a new one:

1. Open a browser console and run:
   ```js
   crypto.subtle.digest('SHA-256', new TextEncoder().encode('your-new-password'))
     .then(buf => console.log(Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')))
   ```
2. Copy the printed hash into `YENOVA_ADMIN_HASH` in `js/admin.js`.

This is a simple client-side gate — enough to keep casual visitors out of
the editor, not a substitute for real authentication if the data layer is
later moved to a shared backend.

## Editing events

In the admin panel you can:

- **Add** a new event with a title, category, dates, venue, description,
  optional speaker, organizers list, and a poster image (uploaded as a file,
  stored inline).
- **Edit** any field of an existing event.
- **Delete** an event (with a confirmation prompt).
- **Reset to defaults** to restore the original 4 seeded events (The
  Beginning, Mini Militia Esports, RECON Z, Job Essentials).

The homepage automatically labels each event **Upcoming** or **Completed**
by comparing its date to today, and the category filter chips on the
homepage are generated from whatever categories are currently in use.

## Design notes

- Palette and type scale live entirely in `css/style.css` as CSS custom
  properties (`--orange`, `--pink`, `--violet`, `--teal`, `--blue`, plus the
  `--gradient` built from them) — drawn from the Yenova mark's ribbon.
- Display type: Space Grotesk. Body: Inter. Labels/dates/meta: JetBrains Mono
  — a small nod to the department's subject matter.
- The circuit/brain motif from the logo is echoed as soft radial "circuit
  field" glows behind the hero and in the "Why Yenova" icon set, rather than
  reproducing the mark itself.
