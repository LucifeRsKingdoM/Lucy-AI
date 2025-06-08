from flask import Flask, render_template, request, jsonify, session, url_for, redirect
import os
import requests
from dotenv import load_dotenv
import sqlite3
import hashlib
from datetime import datetime

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', os.urandom(24))

# Database setup
def init_db():
    conn = sqlite3.connect('users.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            conversation_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database
init_db()

class LucyAI:
    def __init__(self, user_data):
        """Initialize Lucy with stored user data and conversation tracking."""
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.api_key}"
        self.user_data = user_data
        self.username = user_data.get('name', 'User')

        self.conversation_history = [
            {"role": "system", "text": f"Your name is Lucy, an advanced AI assistant created by Lucifer, a BCA graduate from Bangalore University. "
                                       f"Lucy is a human-like assistant specially built to help users learn English by communicating continuously. "
                                       f"The user's name is {self.username}. Always include their name naturally in conversations to feel realistic. "
                                       f"Observe user's grammar, sentence formation, and fluency and guide them to improve."}
        ]

    def chat(self, user_input):
        self.conversation_history.append({"role": "user", "text": user_input})
        
        system_prompt = (
            f"You are Lucy, talking to {self.username}. "
            "Keep responses short, engaging, and natural like a human conversation. "
            "Be friendly, patient, and encouraging. "
            "Use appropriate emojis to make conversations engaging. "
            "Keep responses concise (2-3 sentences max) to maintain flow. "
            "Ask follow-up questions to keep conversations going. "
            "Gently correct grammar mistakes and provide examples if necessary. "
            "Provide pronunciation tips when needed. "
            "Track progress and celebrate improvements."
        )

        full_prompt = f"{system_prompt}\n\nConversation history:\n{self.format_conversation()}\n\nUser: {user_input}\nLucy:"

        payload = {"contents": [{"parts": [{"text": full_prompt}]}]}
        headers = {"Content-Type": "application/json"}
        
        try:
            response = requests.post(self.api_url, json=payload, headers=headers)
            if response.status_code == 200:
                ai_response = response.json()["candidates"][0]["content"]["parts"][0]["text"]
                self.conversation_history.append({"role": "assistant", "text": ai_response})
                return ai_response
            else:
                return f"Sorry {self.username}, I couldn't process that request. 😔"
        except Exception as e:
            return f"Sorry {self.username}, there was an error. Please try again! 😔"

    def format_conversation(self):
        """Format conversation history for AI context."""
        return "\n".join([f"{entry['role'].capitalize()}: {entry['text']}" for entry in self.conversation_history[-10:]])

# Global storage for active sessions
active_sessions = {}

def hash_password(password):
    """Hash password for security"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed):
    """Verify password against hash"""
    return hashlib.sha256(password.encode()).hexdigest() == hashed

@app.route('/')
def index():
    """Landing page with registration/login"""
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    """Handle user registration"""
    try:
        data = request.json
        name = data.get('name', '').strip()
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        # Validation
        if not name or not email or not password:
            return jsonify({"error": "All fields are required"}), 400
        
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400

        # Check if user already exists
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Email already registered"}), 400

        # Create new user
        hashed_password = hash_password(password)
        cursor.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", 
                      (name, email, hashed_password))
        conn.commit()
        conn.close()

        return jsonify({"message": "Registration successful. You can now log in."})

    except Exception as e:
        return jsonify({"error": "Registration failed. Please try again."}), 500

@app.route('/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.json
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        # Verify user credentials
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, password FROM users WHERE email = ?", (email,))
        user = cursor.fetchone()
        conn.close()

        if not user or not verify_password(password, user[2]):
            return jsonify({"error": "Invalid email or password"}), 401

        # Create session
        session['user_id'] = user[0]
        session['user_name'] = user[1]
        session['user_email'] = email

        # Store user data for Lucy AI
        user_data = {
            'id': user[0],
            'name': user[1],
            'email': email
        }
        
        # Create Lucy AI instance for this session
        active_sessions[session['user_id']] = {
            'user_data': user_data,
            'Lucy': LucyAI(user_data),
            'login_time': datetime.now()
        }

        return jsonify({
            "message": "Login successful",
            "redirect": url_for('dashboard')
        })

    except Exception as e:
        return jsonify({"error": "Login failed. Please try again."}), 500

@app.route('/dashboard')
def dashboard():
    """Main dashboard page"""
    if 'user_id' not in session:
        return redirect(url_for('index'))
    
    username = session.get('user_name', 'User')
    return render_template('dashboard.html', username=username)

@app.route('/process', methods=['POST'])
def process():
    """Process chat messages"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "No text received"}), 400
        
        user_input = data["text"]
        user_id = session['user_id']
        
        # Get or create Lucy AI instance for this user
        if user_id not in active_sessions:
            user_data = {
                'id': user_id,
                'name': session.get('user_name', 'User'),
                'email': session.get('user_email', '')
            }
            active_sessions[user_id] = {
                'user_data': user_data,
                'Lucy': LucyAI(user_data),
                'login_time': datetime.now()
            }
        
        Lucy = active_sessions[user_id]['Lucy']
        response = Lucy.chat(user_input)

        return jsonify({
            "text": user_input,
            "response": response,
            "timestamp": datetime.now().isoformat()
        })

    except Exception as e:
        print(f"Error in process: {e}")
        return jsonify({"error": "Failed to process message"}), 500

@app.route('/get_user_data')
def get_user_data():
    """Get current user data"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    user_id = session['user_id']
    if user_id in active_sessions:
        user_data = active_sessions[user_id]['user_data']
        return jsonify(user_data)
    
    return jsonify({"error": "Session not found"}), 404

@app.route('/save_session', methods=['POST'])
def save_session():
    """Save conversation data"""
    if 'user_id' not in session:
        return jsonify({"error": "Not authenticated"}), 401
    
    try:
        data = request.json
        user_id = session['user_id']
        
        # Save conversation to database
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        cursor.execute("INSERT INTO conversations (user_id, conversation_data) VALUES (?, ?)",
                      (user_id, str(data)))
        conn.commit()
        conn.close()
        
        return jsonify({"message": "Session saved successfully"})
    
    except Exception as e:
        return jsonify({"error": "Failed to save session"}), 500

@app.route('/logout')
def logout():
    """Handle user logout"""
    user_id = session.get('user_id')
    
    # Clean up active session
    if user_id and user_id in active_sessions:
        del active_sessions[user_id]
    
    # Clear session
    session.clear()
    
    return redirect(url_for('index'))

@app.errorhandler(404)
def page_not_found(e):
    return jsonify({"error": "Page not found"}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)