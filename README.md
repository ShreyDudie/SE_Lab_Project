# VJTI Committee Manager 🎓✨

A full-stack, role-based event management and discovery platform serving as the central hub for VJTI's technical, cultural, and sports committees.

This application is built with a **Flask API** on top of a **3NF-normalized SQLite database**, paired with a highly immersive, event-driven **React + Vite** frontend.

![Frontend Overview](https://img.shields.io/badge/Frontend-React%20%7C%20Vite%20%7C%20Vanilla%20CSS-blue)
![Backend Overview](https://img.shields.io/badge/Backend-Flask%20%7C%20SQLAlchemy%20%7C%20SQLite-green)

---

## ⚡ Update 2.0: High-Contrast & UI Standardization (Current)

The 2.0 release focuses on bridging the gap between creative "Committee Universes" and professional management tools.

*   **Dual-Aesthetics System**: 
    *   **Immersive (Student View)**: Specialized high-contrast glassmorphic themes for every committee (Pratibimb Red, Technovanza Blue, Enthusia Green).
    *   **Formal (Admin/Head View)**: Consistent, sharp white cards on a professional institutional background for high-focus management tasks.
*   **Unified Information Architecture**: 
    *   **Hall of Fame**: A new card-based "Trophy Case" section displaying past winners (1st/2nd place) across the Global Hub, Student Dashboard, and Committee Portals.
    *   **My Registered Events**: Instant access registration blocks on the home page and committee hubs.

---

## 🏛️ Judge Demonstration Flow (Recommended)

Follow these steps to experience the full feature set and UI transitions of the platform:

### 🎭 Phase 1: The Student "Universe" Discovery
1.  **Login**: Sign in as `student1` / `pass123`.
2.  **The Hub**: View the global dashboard. Note your **Active Registrations** and the **Hall of Fame** results.
3.  **Immersion Test**: Navigate to the **Technovanza** committee page. Note the Cyberpunk neon theme.
4.  **Contrast Test**: Navigate to **Pratibimb**. Note the UI shift to a bold cultural red/black glitch theme.
5.  **Action**: Click "Register Now" on an upcoming event. Go back to your **Dashboard** to see it instantly confirmed.

### 💼 Phase 2: The Command Center (Committee Head)
1.  **Login**: Sign in as a Committee Head account (assigned to a committee like *Technovanza*).
2.  **Interface Shift**: Notice how the UI switches to a **Formal White Style**. This is designed for high-focus management without visual distraction.
3.  **Broadcast**: Enter a message in the "Broadcast Notification" block. This sends a private alert to the dashboards of all registered students.
4.  **Attendance**: View the "Participants" list and toggle "Mark Present" for registered students.

### 🏆 Phase 3: The Climax (Ending an Event)
1.  **Declare Winners**: In the Head Console, click **"End Event"** on an active event.
2.  **Podium**: Fill out the departments for 1st, 2nd, and 3rd place (e.g., Computer, IT, Mech).
3.  **The Result**: Navigate back to the **Global Hall of Fame** (Home Page) to see the new trophy card appear with the updated winners.
4.  **Analytics**: Log in as `admin / admin123` to view the global branch leaderboard and see how these points have shifted the college rankings.

---

## 🌟 Key Features

### 🎮 Role-Based Access Control
1. **Student:** Browse events in immersive portals, track registrations, and view Hall of Fame results.
2. **Committee Head:** Manage operations in a high-clarity formal console. Send broadcasts and award branch points.
3. **Admin:** Approve Head requests and monitor global engagement analytics.

### 🎭 Immersive Committee "Universes"
*   **Pratibimb (Cultural):** Poster aesthetic, black/red themes, and bold typography.
*   **Technovanza (Tech/Robotics):** Cyberpunk UI, scanlines, neon blue grids.
*   **Enthusia (Sports):** Stadium energy and golden trophy glow effects.

---

## 🛠️ Architecture

*   **Database:** SQLite using SQLAlchemy ORM (Strict 3rd Normal Form schema).
*   **Backend:** Python + Flask (RESTful API, session-based auth).
*   **Frontend:** React 18 + Vite (Context API for state, Vanilla CSS for themes).

---

## 🚀 Setup & Installation

### 1. Database & Backend Setup
```bash
pip install -r requirements.txt
python init_db.py  # Seed the database
python app.py      # Starts Flask on port 5000
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev        # Starts Vite on port 5173
```

---

_Built for seamless event management without sacrificing the raw, creative energy of traditional college festivals._
