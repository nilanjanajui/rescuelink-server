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
├── controllers/       # Mission, volunteer, dashboard, stats, testimonial, contact, subscriber
├── routes/            # Express endpoint route definitions
├── models/            # Mongoose schemas (Mission, VolunteerSignup, Update, Testimonial, ContactMessage, Subscriber)
├── middleware/        # verifyJWT, requireRole, errorHandler
├── config/
│   └── db.ts          # MongoDB connection initializer
├── lib/
│   └── auth.ts        # Better Auth server helper
├── seed.ts            # Seeds missions, testimonials, field updates
├── app.ts             # Express app setup & middleware wiring
└── server.ts          # Server entry point
```

---

## 🔌 Key API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/missions` | Public | List missions (supports `search`, `disasterType`, `urgency`, `status`, `sort`, `page`, `pageSize`) |
| `GET` | `/missions/:id` | Public | Get details for a single mission |
| `POST` | `/missions` | User / Admin | Create a new disaster relief mission |
| `GET` | `/missions/mine` | User / Admin | Fetch missions posted by the current user |
| `GET` | `/missions/admin/all` | Admin Only | Fetch all platform missions across all users |
| `PATCH` | `/missions/:id/status` | User / Admin | Toggle mission active/resolved status |
| `DELETE` | `/missions/:id` | User / Admin | Delete a mission |
| `GET` | `/updates?missionId=` | Public | Fetch real-time field updates for a mission |
| `POST` | `/volunteer/join` | User / Admin | Volunteer signup for a mission |
| `GET` | `/volunteer/my-signups` | User / Admin | Retrieve all missions joined by current user |
| `GET` | `/dashboard` | Protected | Aggregated dashboard stats (posted count, joined count, platform metrics) |
| `GET` | `/stats` | Public | Platform-wide aggregate metrics (rescued lives, volunteer hours) |
| `POST` | `/contact` | Public | Contact form submission handler |
| `POST` | `/subscriber` | Public | Newsletter subscription |
| `GET` | `/testimonials` | Public | Fetch community testimonials for landing page |

Base URL for live API: `https://rescuelink-server.onrender.com`

---

## 🔐 Auth & Roles

- Protected routes require a `verifyJWT` middleware token check.
- `requireRole('admin')` restricts administrative routes.
- Supported User Roles: `user`, `admin`, `tenant` (browse-only).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20.6+
- MongoDB (local or Atlas cluster)

### 1. Install
```bash
git clone https://github.com/nilanjanajui/rescuelink-server.git
cd rescuelink-server
npm install
```

### 2. Configure environment

Create `.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:3000
```

### 3. Seed sample data
```bash
npm run seed
```
Seeds missions, testimonials, and field updates.

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
