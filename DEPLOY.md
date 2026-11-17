# Deploying VJTI Committee Manager

The project is set up to run as **one web service**: Flask serves both the API and the built React site, so there is a single URL, no CORS, and login cookies just work. It deploys from the included `Dockerfile`, so it works on Render, Railway, Fly.io or any Docker host. The steps below use **Render** (free, no credit card).

> Ticket QR codes work from any phone once deployed: they use the site's public `https` address, so the phone does not need to be on your Wi-Fi.

---

## 1. Put the code on GitHub

From the project folder:

```bash
git add -A
git commit -m "Add deployment configuration"
git push origin main
```

(The repo is `https://github.com/ShreyDudie/SE_Lab_Project`. The local database and `node_modules` are git-ignored, so they are not uploaded.)

## 2. Create the service on Render

1. Sign up / log in at <https://render.com> (you can use "Sign in with GitHub").
2. Click **New +  ->  Blueprint**.
3. Connect your GitHub account, pick the **SE_Lab_Project** repo and click **Connect**.
4. Render reads `render.yaml`, shows one web service called `vjti-committee-manager`, and asks you to confirm. Click **Apply**.
5. Wait for the first build (about 5-8 minutes: it builds the React app, then installs Python packages).
6. When it says **Live**, open the URL shown at the top (like `https://vjti-committee-manager.onrender.com`).

You do not need to enter any settings. The blueprint generates a random `SECRET_KEY`, turns debug mode off and enables secure cookies for you.

## 3. Log in

The site seeds itself with demo data on first start.

| Role | Username | Password |
|---|---|---|
| Student | `student1` | `pass123` |
| Committee head (Technovanza) | `technohead` | `technohead123` |
| Admin | `admin` | `admin123` |

See `workflow.md` for the full demo script.

## Things to know about the free tier

- **It sleeps after ~15 minutes without visitors** and takes about 30-60 seconds to wake up. Open the site a minute before presenting.
- **The disk is temporary.** When the service restarts or redeploys, the SQLite database starts empty and the demo data is seeded again automatically (`wsgi.py`). Accounts or events created on the live site are lost on restart. For permanent data, add a Render Postgres database (or a paid persistent disk) and set the `DATABASE_URL` environment variable. The code already reads it; you would also add `psycopg2-binary` to `requirements-deploy.txt`.
- **Security for a public link:** passwords are stored in plain text and the demo passwords above are public. That is fine for a class demo, but for a link you share widely, change the admin password or ask for password hashing to be added.

## Test the container locally (optional, needs Docker)

```bash
docker build -t vjti-committee-manager .
docker run --rm -p 10000:10000 -e SECRET_KEY=local-test vjti-committee-manager
# open http://localhost:10000
```

## Other hosts

- **Railway:** New Project -> Deploy from GitHub repo. It detects the `Dockerfile`. Add the variables `SECRET_KEY=<any long random string>` and `SESSION_COOKIE_SECURE=1`.
- **Fly.io:** `fly launch` in the project folder (it detects the `Dockerfile`), then `fly secrets set SECRET_KEY=<random string>`.

## What changed to make this possible

- `app.py` serves the built website (`client/dist`) and falls back to `index.html` so React routes like `/committee/3` and `/verify/...` work on refresh. Unknown `/api/...` paths return JSON 404.
- `wsgi.py` is the production entry point (gunicorn) and seeds an empty database.
- `requirements-deploy.txt` is the slim dependency list (the original `requirements.txt` is a full local `pip freeze`).
- `Dockerfile`, `.dockerignore` and `render.yaml` build and describe the service.
- Debug mode is off unless `FLASK_DEBUG=1`; local development (`python app.py`, `npm run dev`) works as before.
