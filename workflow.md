# Demo Workflow: presenting VJTI Committee Manager to the Professor

**Total time:** about 12-15 minutes. **Story to tell:** *"One platform where every VJTI committee runs its events, students discover and register for them, and every result feeds a live inter-branch championship."*

---

## 0. Before the demo (do this 10 minutes earlier)

```bash
# Terminal 1 - backend (from the project root)
pip install -r requirements.txt
python init_db.py            # tables + admin / committee-head accounts (first time only)
python seed_demo_data.py     # realistic demo data (re-run any time to RESET the demo)
python app.py                # Flask API on http://127.0.0.1:5000

# Terminal 2 - frontend
cd client
npm install                  # first time only
npm run dev                  # React app on http://localhost:5173
```

Open **http://localhost:5173** in Chrome, zoom 100%, full-screen. Keep a second window logged out for the role switches.

**What the seed gives you:** 56 events (32 concluded with podium results, 24 upcoming over the next ~2 months), 62 students across 10 departments, about 1,250 registrations, attendance and ratings, broadcast notifications, and a live inter-branch leaderboard. All dates are generated relative to today, so countdowns and the timeline always look current.

### Demo accounts

| Role | Username | Password | Use it for |
|---|---|---|---|
| Student (IT dept) | `student1` | `pass123` | Acts 1 and 2 |
| Committee Head (Technovanza) | `technohead` | `technohead123` | Act 3 |
| Admin | `admin` | `admin123` | Act 4 |
| Other heads | `cochead`, `enthuhead`, `pratihead` | `<name>123` | Optional |

> Type these credentials on the login page.
> Pending head requests `aditya_head` and `meera_head` are pre-created so the admin approval can be shown live.

---

## Act 1 - The Student Experience (about 5 min)

**Login** as `student1` / `pass123`.

1. **Landing page: "the hub"**
   - Point out the hero: live counters (upcoming events, concluded, students, registrations) and the **Next Up** spotlight with a live countdown.
   - *Say:* "Everything on this page is computed from the database. Nothing is hard-coded."
2. **Smart search (HCI: recognition over recall)**
   - Click the search box: suggested tags appear. Type `robo` or pick the `hackathon` tag. Results filter instantly. Click **Clear Filter** to reset.
3. **Recommended for IT**
   - Events tagged with the student's own department are recommended automatically (department-tag matching).
4. **Committee poster cards**
   - The four committees: **COC** (coding / CP / DSA), **Enthusia** (sports), **Technovanza** (technical / robotics), **Pratibimb** (cultural). Each has its own visual identity and an "upcoming" count.
5. **Event Timeline + Branch Standings**
   - Left: the timeline grouped by month, with days-away labels and a green *Registered* marker on events the student already joined.
   - Right: the **Inter-Branch Championship**: podium plus ranked bars. The student's own department is highlighted.
   - *Say:* "1st / 2nd / 3rd place in any event earns 10 / 5 / 3 points for the winning *department*."
6. **Upcoming Events**
   - Use the committee filter chips (COC, Enthusia, ...). Click **Show all N events**.
   - Click any card to open the **event detail modal** (about, rules, prizes, tags, countdown).
   - Use the bookmark and share icons (toast feedback).
7. **Register**
   - Click **Register** on a card with the *Register* button (for example *RoboWars 2027 - Qualifiers*). A toast confirms, and the card flips to a green **Registered** state.

8. **Digital ticket**
   - Scroll to **My Registered Events** and click **Ticket**. A boarding-pass style ticket opens with a ticket number, entry code, venue and attendee.
   - Show **Add to calendar** (downloads an `.ics` file), **Print** (prints only the ticket) and **Cancel registration** (opens a confirmation dialog; choose *Keep my spot*).
   - **Scan the QR with your phone** (the phone must be on the same Wi-Fi as the laptop). The phone opens a verification page where the ticket **tears off at the QR**, leaving the left side stamped **ADMITTED**. The ticket open on the laptop notices the scan within a couple of seconds and tears live too. Scanning the same QR again says "already scanned" (each ticket is single-use), and a tampered QR is rejected.
   - A scanned ticket stays torn and **cannot be cancelled** afterwards (the server refuses too). To run the scan demo again, click **Reset scan (demo)** on the torn ticket.
   - If the phone cannot open the link, allow Node/Vite through the Windows firewall for private networks, or use **Open scan page** on the ticket to test the same flow on the laptop.
   - Cancelling a registration plays a separate effect: the whole ticket is **ripped in two** along a jagged line and falls away.
9. **Notification bell** (top-right navbar): the badge shows new broadcasts, and the dropdown has its own scrollable list. Press `Esc` or click outside to close.
10. **Scroll feedback:** a gold progress bar at the very top tracks page position, and a back-to-top button appears after scrolling.

11. **"Thank you" state:** when you register, a confirmation card with an animated check and confetti appears, with **View my ticket** as the next step.

12. **Sound effects** (turn your speakers on): broadcast = a whoosh as the paper plane flies by; mark present = a rubber-stamp slam; cancelling or scanning a ticket = paper tearing (the scan adds a scanner beep and a thud when ADMITTED lands); registering = a chime; declaring winners = a short fanfare; errors (such as the time-conflict check) = a low buzz. The **speaker icon in the navbar** mutes and unmutes everything and remembers your choice. On a phone, browsers block sound until you tap, so the scan page shows a **Tap to hear the scan** button.

### Showpiece: the time-conflict guard

1. Open **Upcoming Events** and find **CP League - Round 2** (COC, 3:00-5:30 PM).
2. Click **Register**. A red toast appears: *"Time Conflict! Already registered for Technovanza Hackathon 2027: 12-Hour Sprint at this time."*
3. *Say:* "The server checks every registration against the student's existing schedule, so overlapping events cannot be booked."

---

## Act 2 - Inside a Committee Universe (about 3 min)

1. Sidebar (hamburger, top-left) -> **Technovanza**. Note the cyberpunk blue theme, fonts and glow.
   - **About** card with real stats, the next event and the latest champions.
   - **Live Standings** for this committee only.
2. Switch the tabs: **Events -> Discover -> Teams**
   - **Discover:** Unstop-style filters by type (Hackathons / RoboWars / Workshops / Contests) and difficulty.
   - **Teams:** create a team or join one (team formation, saved locally in the browser).
3. Sidebar -> **Pratibimb** (red / black glitch look) and **Enthusia** (orange stadium look). *Say:* "Same data model, completely different personality per committee."
4. Go to **Dashboard** (sidebar):
   - Stat tiles: active registrations, events attended, **department rank (#1 IT, 92 pts)**, notifications.
   - **Active Registrations** with a **View Ticket** button on each card.
   - **Notifications** sent by committee heads (in a scrollable panel).
   - **My Participation History** with attendance and star ratings.

---

## Act 3 - The Committee Head Console (about 4 min)

**Log out**, then log in as `technohead` / `technohead123`. The UI switches to a formal, high-contrast management style.

1. **Dashboard:** total registrations, attendance rate, Technovanza standings, active vs archived events.
2. Click **Manage Committee**.
3. **Create an event.** Click **Create Event** and enter:
   - Title `Robotics Open House`, a date 2-3 days from now, 12:00 to 13:00, tags `workshop, beginner, IT`, and a short description.
4. **Switch to the student window** (or log back in as `student1`) and **register** for *Robotics Open House*. Then return to the head.
   *Tip: keep two browser windows (one normal, one incognito) to switch roles instantly.*
5. **Broadcast:** in **Broadcast Notification**, pick *Robotics Open House*, type a message ("Bring your laptops"), and click **Send Broadcast**. Everyone registered receives it on their dashboard.
6. **Participants and attendance:** the newest registrations are listed first. Click **Mark Present** for `student1`.
7. **End Event -> declare winners.** On *Robotics Open House* click **End Event**, choose the 1st / 2nd / 3rd departments (for example *Diploma*, *Civil*, *Text*) and click **Finalize Results**.
   - Points are awarded immediately (the form shows +10 / +5 / +3).
8. Back on the **Dashboard**, open **View Results** on that event: the podium, **attendance rate** and the verified participant log.

---

## Act 4 - Admin and Analytics (about 2 min)

**Log out**, then log in as `admin` / `admin123`.

1. **Analytics tiles and Committee Engagement chart:** registrations and events per committee.
2. **Global Inter-Branch Leaderboard:** the points from Act 3 are already reflected (Diploma / Civil / Text moved up).
3. **Pending Approvals:** click **Approve** on `aditya_head` and `meera_head`. *Say:* "Committee heads must be verified by an admin before they get access."
4. **All Events** table: every event with Live / Done status, in a fixed-height scrollable table with a sticky header.

*(Optional)* Show the sign-up flow: **Register -> Role: Committee Head** creates a pending account that sees the "Account Pending Approval" screen until the admin approves it.

*(Optional, 1 min)* Polish worth a glance:
- **Form validation:** on **Register**, submit empty or type a 2-character username and a short password. Inline messages appear, and the password strength meter fills as you type. After a successful sign-up the dashboard greets the new user with a "Thank you for joining" banner.
- **404 page:** visit any unknown URL, for example `/nothing-here`.
- **Rich footer** at the bottom of every page, and the **branded favicon** in the browser tab.

---

## Talking points for the technical questions

- **Database:** SQLite through SQLAlchemy, in strict **3rd Normal Form**. Lookup tables (`Department`, `Tag`), junction tables (`EventTag`) and `EventResult` (one row per podium place) replace comma-separated strings and repeated columns. See `ER_diagram.png`.
- **Backend:** Flask REST API with session-based authentication (Flask-Login). Role checks on every write endpoint (student / head / admin) and ownership checks (a head can only manage *their* committee).
- **Frontend:** React 19 + Vite, React Router, Context API for auth; hand-written CSS themes per committee.
- **Business rules worth mentioning:** time-conflict detection on registration, duplicate-registration guard, points system (10 / 5 / 3) computed on the fly from `EventResult`, department-based recommendations, attendance analytics.
- **HCI principles used:** recognition over recall (tag suggestions, filter chips), immediate feedback (toasts, button state changes, skeleton loaders), consistency (shared card / badge system), visibility of system status (countdowns, live standings), error prevention (conflict guard), keyboard accessibility (focus rings, keyboard-operable cards) and reduced-motion support.

---

## Resetting between demos

```bash
python seed_demo_data.py
```

This clears events, registrations, results, messages and tags, then regenerates them. User accounts are kept. Refresh the browser afterwards.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Blank page / network errors | Make sure Flask is running on port 5000 (the Vite dev server proxies `/api` to it). |
| "Authentication required" | Log in again (sessions reset when Flask restarts). |
| Events look stale or past | Re-run `python seed_demo_data.py`; dates are relative to the day you seed. |
| Head sees "Account Pending Approval" | Run `python seed_demo_data.py` (it approves the four committee heads) or approve from the admin account. |
