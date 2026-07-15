# 🛟 RescueLink — Server

The backend API for **RescueLink**, a disaster relief coordination platform. Built with Node.js, Express, and TypeScript, backed by MongoDB.

This is the server half of the project. See the companion [rescuelink-client](https://github.com/nilanjanajui/rescuelink-client) repo for the frontend.

---

## 🔗 Links

| | URL |
|---|---|
| **Live API** | https://rescuelink-server.onrender.com |
| **Live Client** | https://rescuelink-client.vercel.app |
| **Client Repo** | https://github.com/nilanjanajui/rescuelink-client |

---

## 🛠 Tech Stack

- Node.js + Express.js + TypeScript
- MongoDB + Mongoose
- JWT auth (`jose`) with role-based middleware
- Better Auth (server-side integration)

---

## 📁 Project Structure

```
src/
├── controllers/       # mission, volunteer, dashboard, stats, testimonial, contact, subscriber
├── routes/            # matching route definitions
├── models/            # Mission, VolunteerSignup, Update, Testimonial, ContactMessage, Subscriber
├── middleware/        # verifyJWT, requireRole, errorHandler
├── config/
│   └── db.ts          # MongoDB connection
├── lib/
│   └── auth.ts
├── seed.ts             # seeds missions, testimonials, updates
├── app.ts              # Express app + middleware wiring
└── server.ts           # entry point
```

---

## 🔌 Key Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/missions` | List missions — supports `search`, `disasterType`, `urgency`, `status`, `sort`, `page`, `pageSize` |
| `GET` | `/missions/:id` | Get a single mission's details |
| `GET` | `/missions/mine` | Missions posted by the current user |
| `GET` | `/missions/admin/all` | All missions (admin only) |
| `PATCH` | `/missions/:id/status` | Toggle a mission's active/resolved status |
| `DELETE` | `/missions/:id` | Delete a mission |
| `GET` | `/updates?missionId=` | Updates feed for a mission |
| `POST/GET` | `/volunteer/*` | Volunteer signups, "my signups" |
| `GET` | `/dashboard` | Combined posted + joined missions, and platform stats for admins |
| `GET` | `/stats` | Platform-wide statistics |
| `POST` | `/contact` | Contact form submission |
| `POST` | `/subscriber` | Newsletter signup |
| `GET` | `/testimonials` | Testimonials for the homepage |

> Exact paths/params may vary slightly — check `src/routes/` for the source of truth.

Base URL for the live API: `https://rescuelink-server.onrender.com`

---

## 🔐 Auth & Roles

- Routes are protected with a `verifyJWT` middleware that validates the session token
- `requireRole` middleware restricts admin-only routes (e.g. `/missions/admin/all`)
- Roles: `user`, `admin`, `tenant` (browse-only)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.6+
- MongoDB (local or Atlas)

### 1. Install
```bash
git clone https://github.com/nilanjanajui/rescuelink-server.git
cd rescuelink-server
npm install
```

### 2. Configure environment

Create `.env`:
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
```

For production/deployment (e.g. Render), set:
```
CLIENT_URL=https://rescuelink-client.vercel.app
```

### 3. Seed sample data
```bash
npm run seed
```
Seeds missions, testimonials, and updates. Mission posters are looked up by email against the org accounts created by the client's `seed:auth` script — run that first if you want posters attached correctly.

### 4. Run
```bash
npm run dev
```
API available at **http://localhost:5000**.

---

## 🧪 Type Checking

```bash
npx tsc --noEmit
```

---

## 📄 License

Built for educational/demo purposes as part of a full-stack TypeScript Project.
