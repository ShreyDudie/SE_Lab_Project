# Deploying VJTI Committee Manager

The project runs as **one web service plus one Postgres database**:

- **Web service:** Flask serves both the API and the built React site, so there is a single URL, no CORS, and login cookies just work. It is built from the included `Dockerfile`, so it works on Render, Railway, Fly.io or any Docker host.
- **Postgres database:** this is what makes the site **persistent**. Everything people add (events, registrations, sign-ups, results, scans) is kept across restarts, redeploys and sleep/wake cycles.

The steps below use **Render** (free, no credit card). The Blueprint creates both pieces and connects them for you.

> Ticket QR codes work from any phone once deployed: they use the site's public `https` address, so the phone does not need to be on your Wi-Fi.

---

## How the data is seeded (exactly once)

On start-up the container runs `bootstrap_db.py` **once, before the web server starts**:

| Database state | What happens |
|---|---|
| Brand new (no users at all) | Loads the full demo data **once**: 4 committees, **56 events** (32 concluded with results and a live leaderboard, 24 upcoming), 60+ students, registrations, attendance and notifications. |
| Already has data | **Nothing is seeded.** All data is kept. |

After that first load the site is a normal website: log in as a committee head and create or edit events, register students, declare winners, and so on. None of it is ever overwritten, and it is **not** reloaded when someone opens the page or when the service restarts, even if you later delete every event.

---

## 1. Put the code on GitHub

From the project folder:

```bash
git add -A
git commit -m "Update"
git push origin main
```

(The repo is `https://github.com/ShreyDudie/SE_Lab_Project`. The local database and `node_modules` are git-ignored, so they are not uploaded.)

## 2. Create everything on Render

1. Sign up / log in at <https://render.com> (you can use "Sign in with GitHub").
2. Click **New +  ->  Blueprint**.
3. Connect your GitHub account, pick the **SE_Lab_Project** repo and click **Connect**.
4. Render reads `render.yaml` and shows two things: the web service `vjti-committee-manager` and the database `vjti-db`. Click **Apply**.
5. Wait for the first build (about 5-8 minutes: it builds the React app, installs Python packages, then loads the demo data into the new database).
6. When the service says **Live**, open the URL shown at the top (like `https://vjti-committee-manager.onrender.com`).

You do not need to enter any settings or copy any connection string. The Blueprint wires the database in, generates a random `SECRET_KEY`, turns debug mode off and enables secure cookies.

## 3. Log in

| Role | Username | Password |
|---|---|---|
| Student | `student1` | `pass123` |
| Committee head (Technovanza) | `technohead` | `technohead123` |
| Admin | `admin` | `admin123` |

See `workflow.md` for the full demo script.

---

## Things to know about the free tier

- **The web service sleeps after ~15 minutes without visitors** and takes about 30-60 seconds to wake up. Your data is safe (it lives in the database). Open the site a minute before presenting.
- **Render's free Postgres database is time-limited** (currently it expires about 30 days after creation, with a short grace period). If your project needs to live longer, use a permanent free database instead:
  1. Create a free Postgres database at <https://neon.tech> or <https://supabase.com> and copy its connection string (it starts with `postgresql://`).
  2. In `render.yaml`, delete the whole `databases:` section and replace the `DATABASE_URL` entry with `value: "<paste the connection string>"`. (Or leave the Blueprint as is, then in the Render dashboard open the web service -> Environment and set `DATABASE_URL` yourself.)
  3. Redeploy. The empty database is seeded once, as described above.
- **To skip the demo data** (for example when connecting a database that already has real data), set the environment variable `SEED_DEMO_DATA=0`.
- **Security for a public link:** passwords are stored in plain text and the demo passwords above are public. That is fine for a class demo, but for a link you share widely, change the admin password or ask for password hashing to be added.

## Run it locally (unchanged)

```bash
pip install -r requirements.txt
python init_db.py
python seed_demo_data.py
python app.py            # API on :5000
cd client && npm install && npm run dev   # site on :5173
```

Locally the app uses a SQLite file (`instance/default.db`), which persists on your own disk.

## Test the container locally (optional, needs Docker)

```bash
docker build -t vjti-committee-manager .
docker run --rm -p 10000:10000 -e SECRET_KEY=local-test vjti-committee-manager
# open http://localhost:10000   (uses a SQLite file inside the container; set DATABASE_URL to use Postgres)
```

## Other hosts

- **Railway:** New Project -> Deploy from GitHub repo (it detects the `Dockerfile`), then add a **PostgreSQL** database to the project. Set `DATABASE_URL` on the web service to the database's connection string, plus `SECRET_KEY=<any long random string>` and `SESSION_COOKIE_SECURE=1`.
- **Fly.io:** `fly launch` (detects the `Dockerfile`), `fly postgres create`, then `fly secrets set DATABASE_URL=<connection string> SECRET_KEY=<random string>`.

## What was added to make this possible

- `app.py` serves the built website (`client/dist`) and falls back to `index.html` so React routes like `/committee/3` and `/verify/...` work on refresh. Unknown `/api/...` paths return JSON 404. It reads `DATABASE_URL` (SQLite locally, Postgres in production; the old `postgres://` form is accepted) and keeps hosted connections healthy.
- `bootstrap_db.py` creates tables and seeds a brand-new database exactly once, before the server starts.
- `wsgi.py` is the production entry point (gunicorn).
- `requirements-deploy.txt` is the slim dependency list (the original `requirements.txt` is a full local `pip freeze`).
- `Dockerfile`, `.dockerignore` and `render.yaml` build and describe the web service and its database.
- Debug mode is off unless `FLASK_DEBUG=1`.
