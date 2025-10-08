from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import uuid
import time
import json
import os
from datetime import datetime
from typing import Dict, Any
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get the project root directory (one level up from backend)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
logger.info(f"Serving files from: {BASE_DIR}")

app = Flask(__name__)
CORS(app)

# Configuration
class Config:
    SESSION_TIMEOUT = 3600  # 1 hour
    MAX_MESSAGES = 1000
    MAX_SCORES = 1000

# Storage (in production, use Redis or database)
sessions: Dict[str, Dict] = {}
scores = []
messages = []

# Default configuration
default_config = {
    'bannerText': 'Happy Birthday, My Love!',
    'assets': {
        'balloons': 8,
        'cloudMessages': [
            "Best Wishes!",
            "Happy Birthday!",
            "You're Amazing!",
            "So Special!",
            "Joy & Happiness!",
            "Love You!"
        ]
    },
    'blogContent': {
        'title': '💖 My Special Message for You 💖',
        'subtitle': 'A Collection of Love and Memories',
        'sections': [
            {
                'type': 'paragraph',
                'content': 'My dearest love, every day with you feels like a beautiful dream come true. Your smile lights up my world in ways words cannot describe.'
            },
            {
                'type': 'paragraph',
                'content': 'You have this incredible ability to make everything better just by being you. Whether I\'m having a tough day or facing challenges, the thought of you brings instant comfort and joy to my heart. 💖'
            },
            {
                'type': 'gallery',
                'images': [
                    {'src': 'assets/images/kitty_01.png', 'alt': 'Cute Kitty 1'},
                    {'src': 'assets/images/kitty_02.png', 'alt': 'Cute Kitty 2'},
                    {'src': 'assets/images/kitty_03.png', 'alt': 'Cute Kitty 3'},
                    {'src': 'assets/images/kitty_04.png', 'alt': 'Cute Kitty 4'},
                    {'src': 'assets/images/kitty_05.png', 'alt': 'Cute Kitty 5'}
                ]
            },
            {
                'type': 'list',
                'items': [
                    '💕 Your kind heart that cares for everyone',
                    '🌟 Your incredible strength and resilience',
                    '😊 The way you find joy in little things',
                    '🤗 Your warm hugs that feel like home',
                    '🎯 Your determination to achieve your dreams',
                    '💝 The love you share so freely'
                ]
            },
            {
                'type': 'wishes',
                'wishes': [
                    '🎂 May your day be filled with joy and laughter!',
                    '🎁 May all your dreams and wishes come true!',
                    '💫 May this year bring you endless happiness!',
                    '🌟 May you always feel loved and cherished!'
                ]
            }
        ]
    }
}

def cleanup_old_sessions():
    """Remove sessions older than timeout"""
    current_time = datetime.now()
    expired_sessions = []
    
    for session_id, session in sessions.items():
        last_seen = datetime.fromisoformat(session['last_seen'])
        if (current_time - last_seen).total_seconds() > Config.SESSION_TIMEOUT:
            expired_sessions.append(session_id)
    
    for session_id in expired_sessions:
        del sessions[session_id]
        logger.info(f"Cleaned up expired session: {session_id}")

# Serve static files from the project root
@app.route('/')
def serve_index():
    try:
        return send_file(os.path.join(BASE_DIR, 'index.html'))
    except Exception as e:
        logger.error(f"Error serving index.html: {e}")
        return "Index file not found", 404

@app.route('/<path:path>')
def serve_static(path):
    try:
        # Security: prevent directory traversal
        if '..' in path or path.startswith('/'):
            return "Invalid path", 400
            
        full_path = os.path.join(BASE_DIR, path)
        
        # Check if file exists
        if os.path.isfile(full_path):
            return send_from_directory(BASE_DIR, path)
        else:
            # If it's an HTML page that doesn't exist, serve index.html for SPA routing
            if path.endswith('.html'):
                return send_file(os.path.join(BASE_DIR, 'index.html'))
            else:
                return "File not found", 404
    except Exception as e:
        logger.error(f"Error serving {path}: {e}")
        return "File not found", 404

# Specific routes for HTML pages to handle direct navigation
@app.route('/index.html')
def serve_index_html():
    return serve_index()

@app.route('/decoration.html')
def serve_decoration():
    return send_file(os.path.join(BASE_DIR, 'decoration.html'))

@app.route('/game.html')
def serve_game():
    return send_file(os.path.join(BASE_DIR, 'game.html'))

@app.route('/result.html')
def serve_result():
    return send_file(os.path.join(BASE_DIR, 'result.html'))

# Serve CSS files
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'css'), filename)

# Serve JS files
@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'js'), filename)

# Serve assets
@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'assets'), filename)

# API Routes
@app.route('/api/health')
def health_check():
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})

@app.route('/api/session/create', methods=['POST'])
def create_session():
    cleanup_old_sessions()
    
    session_id = str(uuid.uuid4())
    sessions[session_id] = {
        'id': session_id,
        'created_at': datetime.now().isoformat(),
        'last_seen': datetime.now().isoformat(),
        'state': {
            'progress': {
                'landing': True,
                'startedAt': datetime.now().isoformat()
            }
        }
    }
    
    logger.info(f"Created new session: {session_id}")
    return jsonify({'sessionId': session_id})

@app.route('/api/session/<session_id>', methods=['GET'])
def get_session(session_id):
    cleanup_old_sessions()
    
    session = sessions.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    session['last_seen'] = datetime.now().isoformat()
    return jsonify(session)

@app.route('/api/session/<session_id>', methods=['POST'])
def update_session(session_id):
    session = sessions.get(session_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Deep merge update
    def deep_merge(target: Dict, source: Dict):
        for key, value in source.items():
            if isinstance(value, dict) and key in target and isinstance(target[key], dict):
                deep_merge(target[key], value)
            else:
                target[key] = value
    
    deep_merge(session['state'], data)
    session['last_seen'] = datetime.now().isoformat()
    
    logger.info(f"Updated session {session_id}")
    return jsonify(session)

@app.route('/api/session/<session_id>/reset', methods=['POST'])
def reset_session(session_id):
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    # Create new session
    new_session_id = str(uuid.uuid4())
    sessions[new_session_id] = {
        'id': new_session_id,
        'created_at': datetime.now().isoformat(),
        'last_seen': datetime.now().isoformat(),
        'state': {}
    }
    
    # Remove old session
    del sessions[session_id]
    
    logger.info(f"Reset session {session_id} -> {new_session_id}")
    return jsonify({'sessionId': new_session_id})

@app.route('/api/score', methods=['POST'])
def add_score():
    data = request.get_json()
    
    if not data or 'score' not in data:
        return jsonify({'error': 'Score is required'}), 400
    
    # Limit scores storage
    if len(scores) >= Config.MAX_SCORES:
        scores.pop(0)
    
    score_record = {
        'id': str(uuid.uuid4()),
        'session_id': data.get('sessionId'),
        'score': data['score'],
        'meta': data.get('meta', {}),
        'created_at': datetime.now().isoformat()
    }
    
    scores.append(score_record)
    scores.sort(key=lambda x: x['score'], reverse=True)
    
    logger.info(f"New score: {score_record['score']}")
    return jsonify(score_record)

@app.route('/api/scores', methods=['GET'])
def get_scores():
    return jsonify({
        'scores': scores[:10],
        'total': len(scores)
    })

@app.route('/api/messages', methods=['GET'])
def get_messages():
    return jsonify({
        'messages': messages[-50:],
        'total': len(messages)
    })

@app.route('/api/messages', methods=['POST'])
def add_message():
    data = request.get_json()
    
    if not data or not data.get('name') or not data.get('message'):
        return jsonify({'error': 'Name and message are required'}), 400
    
    # Limit messages storage
    if len(messages) >= Config.MAX_MESSAGES:
        messages.pop(0)
    
    # Basic content validation
    name = data['name'].strip()
    message = data['message'].strip()
    
    if len(name) > 50:
        return jsonify({'error': 'Name too long'}), 400
    if len(message) > 500:
        return jsonify({'error': 'Message too long'}), 400
    
    message_record = {
        'id': str(uuid.uuid4()),
        'session_id': data.get('sessionId'),
        'name': name,
        'message': message,
        'created_at': datetime.now().isoformat()
    }
    
    messages.append(message_record)
    
    logger.info(f"New message from {name}")
    return jsonify(message_record)

@app.route('/api/config', methods=['GET'])
def get_config():
    return jsonify(default_config)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    cleanup_old_sessions()
    
    return jsonify({
        'sessions': {
            'total': len(sessions),
            'active': len([s for s in sessions.values() 
                          if (datetime.now() - datetime.fromisoformat(s['last_seen'])).total_seconds() < 3600])
        },
        'scores': len(scores),
        'messages': len(messages),
        'uptime': time.time() - app.start_time
    })

# Initialize app start time
app.start_time = time.time()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting Birthday Surprise Backend on port {port}")
    logger.info(f"Base directory: {BASE_DIR}")
    logger.info(f"Files in base directory: {os.listdir(BASE_DIR)}")
    
    app.run(debug=debug, port=port, host='0.0.0.0')