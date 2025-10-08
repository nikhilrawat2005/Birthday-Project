# 🎉 Birthday Surprise Project – Multi-Page Edition 🎂

A sweet, creative, and interactive **multi-page website** made as a **surprise birthday gift** 💖 — built using **HTML, CSS, JavaScript**, and a **Flask backend**.  

It features separate pages for each experience phase — with persistent sessions, animations, decorations, a cake-cutting sequence, a kitty-catching mini-game, and a guestbook 🐥🐱.

---

## 🌈 About the Project

This project is a **personal birthday surprise website** made with love — now enhanced with a **modern multi-page architecture** and **Flask backend integration**.

The site takes visitors through several fun and emotional scenes across different pages:

| Page | Description |
|------|--------------|
| 🐤 **Welcome Screen** (`index.html`) | Ducky greets you warmly & creates a session |
| 🎈 **Decoration Phase** (`decoration.html`) | Balloons, banners & confetti appear one by one |
| 🍰 **Cake Cutting Moment** | The highlight celebration with explosion effects |
| 🐱 **Mini Game** (`game.html`) | Catch the falling kitties using a bucket 🪣 |
| 💝 **Reward & Blog** (`result.html`) | Heartfelt message blog & guestbook functionality |

Every transition, animation, and interaction is designed to feel **personal and joyful** 💫

---

## 🏗️ Project Architecture

<details>
<summary>🎨 Frontend Structure</summary>

birthday-surprise/
├── index.html # Landing page
├── decoration.html # Decorations scene
├── game.html # Kitty-catching game
├── result.html # Blog & guestbook
├── css/
│ ├── common.css
│ ├── landing.css
│ ├── decoration.css
│ ├── game.css
│ └── result.css
├── js/
│ ├── session.js
│ ├── audio.js
│ ├── input.js
│ ├── game.js
│ ├── decoration.js
│ ├── result.js
│ └── main-index.js
└── assets/
├── images/
└── audio/

</details>

<details>
<summary>🔥 Backend Structure (Flask)</summary>

backend/
├── app.py # Main Flask app
├── requirements.txt # Python dependencies
├── render.yaml # Render deployment config
├── Dockerfile # Container setup
└── package.json # Deployment scripts

</details>

---

## 🛠️ Tech Stack

### 🎨 Frontend
- **HTML5** — Semantic structure across all pages  
- **CSS3 + Animations** — Responsive Grid & Flexbox  
- **JavaScript (ES6 Modules)** — Modular & scalable architecture  
- **Canvas API** — Kitty-catching game with touch/mouse support  
- **Audio API** — Dynamic sound effects & background music  

### ⚙️ Backend
- **Python Flask** — RESTful API server  
- **Session Management** — Persistent progress tracking  
- **CORS Support** — For cross-origin access  
- **Guestbook API** — Stores and retrieves user messages  

---

## ✨ Features

- 🎯 Multi-page navigation with persistent sessions  
- 📱 Fully responsive for all devices  
- 🎮 Touch & keyboard support in the game  
- 💾 Backend integration for scores and messages  
- 🎵 Audio management with mute/unmute controls  
- ⚡ Optimized with lazy loading and caching  

---

## 🚀 Quick Start

### 🧩 Prerequisites
- Python **3.8+**
- Modern web browser  
- *(Optional)* Node.js for combined scripts  

### 🪄 Option 1: Frontend Only
```bash
# Clone or download the project
cd birthday-surprise

# Serve frontend only
python -m http.server 8000
# Open http://localhost:8000

⚙️ Option 2: Full Stack Development

# Terminal 1 – Backend
cd backend
pip install -r requirements.txt
python app.py
# Backend → http://localhost:5000

# Terminal 2 – Frontend
cd ..
python -m http.server 8000
# Frontend → http://localhost:8000


🧠 Option 3: Using npm Scripts

npm install
npm run dev


🌍 Deployment
🧁 Frontend

Netlify (recommended)
netlify deploy --prod --dir=.

Vercel
vercel --prod
GitHub Pages or any static host

☁️ Backend

Render.com (via render.yaml)

Railway.app

Heroku / PythonAnywhere

Docker container support

🕹️ How to Use

Start from the landing page and begin the celebration

Decorate with balloons, cake, and confetti

Play the kitty-catching game (use arrow keys or touch)

Read the heartfelt blog message 💌

Sign the guestbook to leave a memory

Restart anytime and relive the fun 🎊

🔧 API Endpoints
Method	Endpoint	Description
POST	/api/session/create	Create new user session
GET	/api/session/:id	Retrieve session data
POST	/api/session/:id	Update session
POST	/api/session/:id/reset	Reset session
POST	/api/score	Save game score
GET/POST	/api/messages	Guestbook messages
GET	/api/config	Get dynamic config
GET	/api/health	Health check
📱 Responsive Features

Mobile-first design

Touch-friendly game controls

Orientation detection & alerts

Reduced motion accessibility

High-DPI image optimization

Progressive enhancement for older browsers

🎯 Key Highlights
🎨 Visuals & Animation

Smooth CSS transitions

Cake explosion particle effects

Floating balloons & clouds

Crisp responsive canvas game

🎵 Audio Experience

Dynamic background music per scene

Contextual sound effects

Mute/unmute control

Graceful fallbacks

🕹️ Game Features

Touch/mouse/keyboard support

Pause & resume

Score tracking & persistence

Mobile-optimized

💾 Data Persistence

Session-based tracking

Guestbook message saving

Score leaderboard

Local storage fallback

🧰 Development Commands

# Install backend dependencies
cd backend && pip install -r requirements.txt

# Run development servers
npm run dev

# Build for production
npm run build

# Run tests
npm test

🐛 Troubleshooting
Issue	Fix
❌ CORS errors	Enable CORS in Flask
🔇 Audio not playing	Click interaction needed for autoplay
🕹️ Touch controls not working	Verify mobile support
💾 Session not persisting	Ensure backend is running

🧩 Debug Tip:
Use browser console — detailed error logs are already included.

🚀 Future Enhancements

Admin dashboard for messages

Multi-language support

Custom themes & color palettes

Social sharing features

Progressive Web App (PWA)

Database integration

Real-time WebSocket features

More mini-games 🎮

Custom audio uploads

🤝 Contributing

While this is a personal project, suggestions and pull requests are welcome!
You can contribute to:

🐞 Bug fixes

⚡ Performance improvements

♿ Accessibility enhancements

💡 New creative features

📄 License

Licensed under Personal Use License.
You’re free to use or modify for personal birthday surprises,
but commercial use or redistribution is not allowed without permission.

💌 Author

Made with 💖 by Nikhil

“The best gifts come from the heart —
and sometimes from the code editor too!” 💝