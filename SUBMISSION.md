# Assignment Submission Guide — Team Task Manager

Use this checklist to submit: **Live URL**, **GitHub repo**, **README**, and **2–5 min demo video**.

---

## Part 1 — Run Locally (Before Deploy)

### Step 1: Install tools

- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for local PostgreSQL)
- Optional: [GitHub Desktop](https://desktop.github.com/) or use Git in terminal

### Step 2: Start PostgreSQL

Open terminal in the project folder:

```powershell
cd "C:\Users\shaik\OneDrive\Desktop\LMS\team-task-manager"
docker compose up -d
```

### Step 3: Configure environment

```powershell
copy server\.env.example server\.env
```

Edit `server\.env`:

- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/team_task_manager`
- `JWT_SECRET=` use any long random string (e.g. 32+ characters)

### Step 4: Start backend

```powershell
cd server
npm install
npm run dev
```

You should see: `Server running on port 5000`

### Step 5: Start frontend

New terminal:

```powershell
cd client
npm install
npm start
```

Browser opens at http://localhost:3000

### Step 6: Verify features

| Feature | How to test |
|---------|-------------|
| Auth | Register 2 users, login/logout |
| Projects | User A creates project |
| Team | User A adds User B email as member |
| RBAC | Member cannot delete project; admin can |
| Tasks | Create, assign, change status |
| Dashboard | Create task with yesterday’s due date → shows overdue |

---

## Part 2 — Push to GitHub

### Step 1: Create repository

1. Go to https://github.com/new
2. Name: `team-task-manager`
3. Public
4. Do **not** add README (you already have one)
5. Create repository

### Step 2: Push code

From `team-task-manager` folder:

```powershell
git init
git add .
git commit -m "Team Task Manager full-stack assignment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/team-task-manager.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 3: Update README

Edit `README.md` and set:

- Live URL (after Part 3)
- GitHub repo link
- Demo video link (after Part 4)

Commit and push again.

---

## Part 3 — Deploy on Railway (Mandatory Live URL)

### Step 1: Create Railway account

1. https://railway.app/
2. Sign up with GitHub

### Step 2: New project from GitHub

1. **New Project** → **Deploy from GitHub repo**
2. Select `team-task-manager`
3. Railway detects Node.js via `nixpacks.toml`

### Step 3: Add PostgreSQL database

1. In the same project, click **+ New**
2. Choose **Database** → **PostgreSQL**
3. Wait until it is running
4. Open the PostgreSQL service → **Variables** → copy `DATABASE_URL`

### Step 4: Configure web service variables

Click your **web/app service** (not the database) → **Variables** → add:

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Paste from PostgreSQL service (or use Reference: `${{Postgres.DATABASE_URL}}`) |
| `JWT_SECRET` | Long random secret string |
| `NODE_ENV` | `production` |
| `PORT` | Railway sets this automatically — do not hardcode |

**Link database to app (recommended):**

- On the app service → **Variables** → **Add Reference**
- Select PostgreSQL → `DATABASE_URL`

### Step 5: Deploy settings

Railway uses `nixpacks.toml`:

- Builds React in `client/build`
- Starts `server/index.js`

Trigger deploy: **Deploy** or push to `main`.

### Step 6: Generate public URL

1. App service → **Settings** → **Networking**
2. **Generate Domain**
3. Copy URL, e.g. `https://team-task-manager-production.up.railway.app`

### Step 7: Test live app

1. Open live URL
2. Register → create project → add task
3. If blank page: check **Deployments** → **Logs** for errors
4. Common fixes:
   - Missing `JWT_SECRET`
   - Missing `DATABASE_URL`
   - Build failed: run `cd client && npm run build` locally first

### Step 8: Put live URL in README

```markdown
## Live URL
https://your-app.up.railway.app
```

Push to GitHub.

---

## Part 4 — Record Demo Video (2–5 minutes)

### What to show (in order)

1. **Intro (15 sec)** — App name, your name, live URL on screen
2. **Register / Login (30 sec)** — Two accounts or one admin + one member
3. **Create project (30 sec)** — Name and description
4. **Team management (45 sec)** — Add second user by email as member; mention admin vs member
5. **Tasks (60 sec)** — Create tasks, assign, change status to in progress / done
6. **Dashboard (30 sec)** — Show stats, overdue task, my tasks
7. **RBAC (30 sec)** — Log in as member: cannot delete project; admin can
8. **Closing (15 sec)** — GitHub link, thank you

### Recording tools (free)

- Windows: **Xbox Game Bar** (Win + G) or **OBS Studio**
- Or Loom: https://www.loom.com/

### Upload

1. YouTube (Unlisted) or Google Drive (Anyone with link)
2. Add link to `README.md` under **Demo Video**

---

## Part 5 — Final Submission Package

Submit these four items to your instructor/platform:

| # | Item | Your value |
|---|------|------------|
| 1 | **Live URL** | `https://_____.up.railway.app` |
| 2 | **GitHub repo** | `https://github.com/_____/team-task-manager` |
| 3 | **README** | In repo root (with links filled in) |
| 4 | **Demo video** | YouTube/Drive link (2–5 min) |

### Email / form template

```
Subject: Team Task Manager Submission - [Your Name]

Live URL: https://...
GitHub: https://github.com/...
Demo Video: https://...

Stack: React, Node.js, Express, PostgreSQL, Railway
Features: Auth, Projects, RBAC (Admin/Member), Tasks, Dashboard
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `DATABASE_URL is required` | Add PostgreSQL and link variable on Railway |
| `JWT_SECRET is required` | Add variable on Railway app service |
| CORS / API errors on live | App serves frontend from same domain; use `/api` paths only |
| User not found when adding member | That email must register first |
| Docker port in use | Stop other PostgreSQL or change port in `docker-compose.yml` |
| Build fails on Railway | Check logs; ensure `client/package.json` exists |

---

## Time estimate

| Task | Hours |
|------|-------|
| Local setup & testing | 1–2 |
| GitHub push | 0.5 |
| Railway deploy | 1–2 |
| Demo video | 0.5–1 |
| **Total** | **3–6** (within 8–12 h assignment window) |

Good luck with your submission.
