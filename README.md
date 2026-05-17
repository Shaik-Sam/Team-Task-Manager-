# Team Task Manager

Full-stack web app for creating projects, assigning tasks, and tracking progress with role-based access (Admin / Member).

## Live URL

Replace after Railway deployment:

`https://YOUR-APP-NAME.up.railway.app`

## GitHub Repo

Replace after push:

`https://github.com/YOUR_USERNAME/team-task-manager`

## Demo Video

Replace after recording (2–5 min):

`https://youtu.be/YOUR_VIDEO_ID`

## Features

- Sign up / login (JWT)
- Create projects and invite members by email
- Roles per project: **admin** (manage team, delete project) and **member**
- Create tasks, assign to members, update status (`todo`, `in_progress`, `done`)
- Dashboard with task counts, overdue tasks, and your open assignments

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Deploy | Railway |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/projects` | List my projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project detail |
| PUT | `/api/projects/:id` | Update (admin) |
| DELETE | `/api/projects/:id` | Delete (admin) |
| GET | `/api/projects/:id/members` | List members |
| POST | `/api/projects/:id/members` | Add member (admin) |
| PATCH | `/api/projects/:id/members/:userId` | Change role (admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (admin) |
| GET | `/api/projects/:projectId/tasks` | List tasks |
| POST | `/api/projects/:projectId/tasks` | Create task |
| PUT | `/api/projects/:projectId/tasks/:taskId` | Update task |
| DELETE | `/api/projects/:projectId/tasks/:taskId` | Delete task |

## Local Setup

### 1. Prerequisites

- Node.js 18+
- Docker Desktop (for PostgreSQL) or a local PostgreSQL install

### 2. Start database

```bash
cd team-task-manager
docker compose up -d
```

### 3. Environment

Copy `server/.env.example` to `server/.env` and set `JWT_SECRET` to a long random string.

### 4. Install and run

Terminal 1 (API):

```bash
cd team-task-manager/server
npm install
npm run dev
```

Terminal 2 (React dev server):

```bash
cd team-task-manager/client
npm install
npm start
```

Open http://localhost:3000

### 5. Test flow

1. Register two users (e.g. admin@test.com, member@test.com)
2. Log in as admin, create a project
3. Add member@test.com as **member**
4. Create tasks and assign them
5. Log in as member and update task status
6. Check Dashboard for overdue (set a past due date)

## Production Build (single server)

```bash
cd team-task-manager/client
npm install && npm run build
cd ../server
npm install
set NODE_ENV=production
node index.js
```

App serves API and React build on port 5000.

## Railway Deployment

See **SUBMISSION.md** for step-by-step deploy, GitHub, and demo video instructions.

## Project Structure

```
team-task-manager/
├── client/          React frontend
├── server/          Express API + DB
├── docker-compose.yml
├── railway.json
├── nixpacks.toml
├── README.md
└── SUBMISSION.md
```

## Author

Your Name — replace with your details for submission.
