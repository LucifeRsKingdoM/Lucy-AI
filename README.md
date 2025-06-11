<!-- ─────────────────────────────────────────────────────────────── -->
<!--  LUCY AI – README.md                                            -->
<!--  “Learn any language by chatting with an AI friend.”           -->
<!--  © 2024 Yogesh | MIT License                                    -->
<!-- ─────────────────────────────────────────────────────────────── -->

<p align="center">
  <img src="https://raw.githubusercontent.com/LucifeRsKingdoM/Lucy-AI/main/static/media/full-logo.png" width="120" alt="Lucy AI logo">
</p>

<h1 align="center">Lucy AI 🤖💬</h1>

<p align="center"><i>“Practice makes fluent.” – Lucy</i></p>

<p align="center">
  <a href="https://github.com/your-user/lucy-ai/stargazers">
    <img src="https://img.shields.io/github/stars/your-user/lucy-ai?style=social" alt="GitHub stars">
  </a>
  <a href="https://github.com/your-user/lucy-ai/fork">
    <img src="https://img.shields.io/github/forks/your-user/lucy-ai?style=social" alt="GitHub forks">
  </a>
  <img src="https://img.shields.io/badge/status-in%20progress-orange" alt="Project status">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs welcome">
</p>

---

## 🧠 About Lucy AI

**Lucy AI** is a free and open-source AI language tutor that helps you improve your speaking skills in **English (and other languages soon!)**.

🎙️ Talk or type — Lucy listens and responds with friendly replies, grammar corrections, and progress tracking.

> ⚠️ Project under active development — more features arriving weekly!

---

## 🛠️ Tech Stack

| Layer         | Technologies                                         |
|---------------|------------------------------------------------------|
| 🎨 Frontend   | HTML, CSS, Vanilla JS, Font Awesome                  |
| 🎤 Voice      | Web Speech API (Speech-to-Text + Text-to-Speech)     |
| 🔧 Backend    | Python, Flask                                         |
| 🗃️ Database   | SQLite (local file-based DB)                         |
| 🧠 AI Model   | Google Gemini 2.0 (via REST API)                      |
| 🔐 Sessions   | Flask secure cookies                                  |

---

## ✨ Features

| Feature                      | Status     |
|-----------------------------|------------|
| 🔐 User Register/Login       | ✅ Done     |
| 💬 Real-time Chat UI         | ✅ Done     |
| 🎙️ Voice Mode (hands-free)   | ✅ Done     |
| 📊 Streaks & Progress Stats  | ✅ Done     |
| 📚 Lessons & Vocabulary      | 🚧 Coming Soon |
| 🏆 Badges & Achievements     | 🚧 Coming Soon |
| 🌍 Multi-language Support    | 🚧 Coming Soon |

---

## 📸 Demo Screenshot

<p align="center">
  <img src="https://raw.githubusercontent.com/your-user/lucy-ai/main/assets/demo.png" alt="Lucy AI screenshot" width="80%">
</p>

---

## 🧑‍💻 Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/your-user/lucy-ai.git
cd lucy-ai

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set environment variables
echo "GEMINI_API_KEY=your_api_key" >> .env
echo "SECRET_KEY=super-secret" >> .env

# 5. Start server
python app.py
# Visit: http://localhost:5000
```

---

## 🗂 Project Structure

```
lucy-ai/
├── app.py               # Flask backend
├── templates/           # HTML views
│   ├── index.html       # Login/Register
│   └── dashboard.html   # Main chat UI
├── static/              # CSS, JS
├── users.db             # SQLite database
├── .env                 # Environment secrets
└── README.md
```

---

## 🤝 Contributing

We welcome contributions! Whether it's a bug fix, feature idea, or doc improvement — every bit counts.

1. Fork the repo
2. Create a new branch: `git checkout -b feature/amazing-feature`
3. Commit and push your changes
4. Open a Pull Request ✅

---

## 💜 Support This Project

Lucy is free & ad-free, but API and server costs add up.  
You can support the project via:

| Method      | ID/Link                     |
|-------------|-----------------------------|
| PhonePe     | `yogiguli@ybl`              |
| Google Pay  | `yogesh490807@okaxis`       |
| Paytm       | `9008587582@ptaxis`         |
| GitHub      | ⭐ Star the repo             |

Even ₹5 helps. Thank you so much! ☕💜

---

## 📄 License

Licensed under the [MIT License](LICENSE).  
Feel free to use and modify with attribution.

---

<p align="center">
  Built with ❤️ and caffeine in Bangalore
</p>
