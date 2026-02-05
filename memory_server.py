#!/usr/bin/env python3
"""
Dr. Chinki Memory Server
A Flask backend for storing and retrieving memories (text, images, names)
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3
import base64
import os
from datetime import datetime
from pathlib import Path
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Configuration
DB_PATH = 'memories.db'
IMAGE_DIR = Path('memory_images')
AUDIO_DIR = Path('memory_audios')

# Create directories if they don't exist
IMAGE_DIR.mkdir(exist_ok=True)
AUDIO_DIR.mkdir(exist_ok=True)

def init_db():
    """Initialize SQLite database with memories table"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            content TEXT,
            image_path TEXT,
            name TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            recognition_data TEXT,
            voice_data TEXT,
            audio_path TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profile (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            interests TEXT,
            goals TEXT,
            skill_level TEXT,
            business_type TEXT,
            preferred_language TEXT,
            personality_type TEXT,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Add recognition_data column if it doesn't exist (for existing databases)
    try:
        cursor.execute('ALTER TABLE memories ADD COLUMN recognition_data TEXT')
        print("✅ Added recognition_data column to existing table")
    except sqlite3.OperationalError:
        pass
    
    # Add voice_data column if it doesn't exist
    try:
        cursor.execute('ALTER TABLE memories ADD COLUMN voice_data TEXT')
        print("✅ Added voice_data column to existing table")
    except sqlite3.OperationalError:
        pass
    
    # Add audio_path column if it doesn't exist
    try:
        cursor.execute('ALTER TABLE memories ADD COLUMN audio_path TEXT')
        print("✅ Added audio_path column to existing table")
    except sqlite3.OperationalError:
        pass
    
    # Create index for faster searches
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_name ON memories(name)
    ''')
    cursor.execute('''
        CREATE INDEX IF NOT EXISTS idx_timestamp ON memories(timestamp)
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Database initialized successfully")

def save_image(image_base64, memory_id):
    """Save base64 image to filesystem"""
    try:
        # Remove data URL prefix if present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]
        
        # Decode base64 to bytes
        image_data = base64.b64decode(image_base64)
        
        # Generate filename
        filename = f"memory_{memory_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
        filepath = os.path.join(IMAGE_DIR, filename)
        
        # Save image
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        return filepath
    except Exception as e:
        print(f"❌ Error saving image: {e}")
        return None

@app.route('/api/memory/save', methods=['POST'])
def save_memory():
    """Save a new memory to database"""
    try:
        data = request.json
        
        text = data.get('text', '')
        image_base64 = data.get('image', '')
        audio_base64 = data.get('audio', '')
        name = data.get('name', 'Unnamed Memory')
        metadata = data.get('metadata', {})
        recognition_data = data.get('recognition_data', None)
        voice_data = data.get('voice_data', None)
        
        # Determine memory type
        if image_base64 and text:
            memory_type = 'mixed'
        elif image_base64:
            memory_type = 'image'
        elif audio_base64:
            memory_type = 'audio'
        else:
            memory_type = 'text'
        
        # Insert into database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO memories (type, content, name, metadata, recognition_data, voice_data, audio_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (memory_type, text, name, json.dumps(metadata), json.dumps(recognition_data) if recognition_data else None, json.dumps(voice_data) if voice_data else None, None))
        
        memory_id = cursor.lastrowid
        conn.commit()
        
        # Save image if provided
        image_filename = None
        if image_base64:
            image_filename = save_image(image_base64, memory_id)
            if image_filename:
                cursor.execute('UPDATE memories SET image_path = ? WHERE id = ?', (image_filename, memory_id))
                conn.commit()
        
        # Save audio if provided
        audio_filename = None
        if audio_base64:
            try:
                # Decode base64 audio
                if ',' in audio_base64:
                    audio_data = base64.b64decode(audio_base64.split(',')[1])
                else:
                    audio_data = base64.b64decode(audio_base64)
                
                # Generate filename
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                audio_filename = f'audio_{memory_id}_{timestamp}.webm'
                audio_path = AUDIO_DIR / audio_filename
                
                # Save audio file
                with open(audio_path, 'wb') as f:
                    f.write(audio_data)
                
                # Update database
                cursor.execute('UPDATE memories SET audio_path = ? WHERE id = ?', (audio_filename, memory_id))
                conn.commit()
                print(f"✅ Audio saved: {audio_filename}")
            except Exception as e:
                print(f"❌ Error saving audio: {e}")
        
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Memory saved successfully, Boss Jaan! 💚',
            'memory_id': memory_id,
            'name': name
        }), 201
        
    except Exception as e:
        print(f"❌ Error saving memory: {e}")
        return jsonify({
            'success': False,
            'message': f'Error saving memory: {str(e)}'
        }), 500

@app.route('/api/user/profile', methods=['GET'])
def get_user_profile():
    """Retrieve the user profile"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM user_profile ORDER BY last_updated DESC LIMIT 1')
        row = cursor.fetchone()
        conn.close()
        
        if row:
            profile = {
                'name': row['name'],
                'interests': json.loads(row['interests']) if row['interests'] else [],
                'goals': json.loads(row['goals']) if row['goals'] else [],
                'skill_level': row['skill_level'],
                'business_type': row['business_type'],
                'preferred_language': row['preferred_language'],
                'personality_type': row['personality_type']
            }
            return jsonify({'success': True, 'profile': profile}), 200
        else:
            return jsonify({'success': True, 'profile': None}), 200
            
    except Exception as e:
        print(f"❌ Error retrieving profile: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/user/profile', methods=['POST'])
def save_user_profile():
    """Save or update the user profile"""
    try:
        data = request.json
        name = data.get('name')
        interests = data.get('interests', [])
        goals = data.get('goals', [])
        skill_level = data.get('skill_level')
        business_type = data.get('business_type')
        preferred_language = data.get('preferred_language')
        personality_type = data.get('personality_type')
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # We only keep one main profile for now
        cursor.execute('DELETE FROM user_profile')
        
        cursor.execute('''
            INSERT INTO user_profile (name, interests, goals, skill_level, business_type, preferred_language, personality_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (name, json.dumps(interests), json.dumps(goals), skill_level, business_type, preferred_language, personality_type))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Profile updated successfully!'}), 200
        
    except Exception as e:
        print(f"❌ Error saving profile: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/memory/list', methods=['GET'])
def list_memories():
    """Retrieve all memories"""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row  # Return rows as dictionaries
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, type, content, image_path, name, timestamp, metadata, recognition_data, voice_data, audio_path
            FROM memories
            ORDER BY timestamp DESC
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        memories = []
        for row in rows:
            memory = {
                'id': row['id'],
                'type': row['type'],
                'content': row['content'],
                'image_path': row['image_path'],
                'name': row['name'],
                'timestamp': row['timestamp'],
                'metadata': json.loads(row['metadata']) if row['metadata'] else {},
                'recognition_data': json.loads(row['recognition_data']) if row['recognition_data'] else None,
                'voice_data': json.loads(row['voice_data']) if row['voice_data'] else None,
                'audio_path': row['audio_path']
            }
            memories.append(memory)
        
        return jsonify({
            'success': True,
            'count': len(memories),
            'memories': memories
        }), 200
        
    except Exception as e:
        print(f"❌ Error retrieving memories: {e}")
        return jsonify({
            'success': False,
            'message': f'Error retrieving memories: {str(e)}'
        }), 500

@app.route('/api/memory/search', methods=['GET'])
def search_memories():
    """Search memories by text query"""
    try:
        query = request.args.get('query', '')
        
        if not query:
            return jsonify({
                'success': False,
                'message': 'Query parameter is required'
            }), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Search in name, content, and recognition_data
        cursor.execute('''
            SELECT id, type, content, image_path, name, timestamp, metadata, recognition_data, voice_data, audio_path
            FROM memories
            WHERE name LIKE ? OR content LIKE ? OR recognition_data LIKE ?
            ORDER BY timestamp DESC
        ''', (f'%{query}%', f'%{query}%', f'%{query}%'))
        
        rows = cursor.fetchall()
        conn.close()
        
        memories = []
        for row in rows:
            memory = {
                'id': row['id'],
                'type': row['type'],
                'content': row['content'],
                'image_path': row['image_path'],
                'name': row['name'],
                'timestamp': row['timestamp'],
                'metadata': json.loads(row['metadata']) if row['metadata'] else {},
                'recognition_data': json.loads(row['recognition_data']) if row['recognition_data'] else None,
                'voice_data': json.loads(row['voice_data']) if row['voice_data'] else None,
                'audio_path': row['audio_path']
            }
            memories.append(memory)
        
        return jsonify({
            'success': True,
            'count': len(memories),
            'query': query,
            'memories': memories
        }), 200
        
    except Exception as e:
        print(f"❌ Error searching memories: {e}")
        return jsonify({
            'success': False,
            'message': f'Error searching memories: {str(e)}'
        }), 500

@app.route('/api/memory/image/<path:filename>', methods=['GET'])
def get_image(filename):
    """Serve memory images"""
    try:
        return send_from_directory(IMAGE_DIR, filename)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Image not found: {str(e)}'
        }), 404

@app.route('/api/memory/audio/<filename>')
def serve_audio(filename):
    """Serve audio file"""
    try:
        return send_from_directory(AUDIO_DIR, filename)
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Audio not found: {str(e)}'
        }), 404

@app.route('/api/memory/delete/<int:memory_id>', methods=['DELETE'])
def delete_memory(memory_id):
    """Delete a memory by ID"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get image path before deleting
        cursor.execute('SELECT image_path FROM memories WHERE id = ?', (memory_id,))
        row = cursor.fetchone()
        
        if row and row[0]:
            # Delete image file
            try:
                os.remove(row[0])
            except:
                pass
        
        # Delete from database
        cursor.execute('DELETE FROM memories WHERE id = ?', (memory_id,))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Memory deleted successfully'
        }), 200
        
    except Exception as e:
        print(f"❌ Error deleting memory: {e}")
        return jsonify({
            'success': False,
            'message': f'Error deleting memory: {str(e)}'
        }), 500

@app.route('/api/memory/recognize', methods=['POST'])
def recognize_memory():
    """Find matching memory based on description"""
    try:
        data = request.json
        description = data.get('description', '')
        
        if not description:
            return jsonify({
                'success': False,
                'message': 'Description is required'
            }), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Search for similar descriptions in recognition_data
        cursor.execute('''
            SELECT id, type, content, image_path, name, timestamp, metadata, recognition_data
            FROM memories
            WHERE recognition_data IS NOT NULL
            ORDER BY timestamp DESC
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        # Simple matching: find memories with similar keywords
        matches = []
        description_lower = description.lower()
        description_words = set(description_lower.split())
        
        for row in rows:
            recognition_data = json.loads(row['recognition_data']) if row['recognition_data'] else {}
            stored_description = recognition_data.get('description', '').lower()
            
            # Calculate simple word overlap
            stored_words = set(stored_description.split())
            common_words = description_words.intersection(stored_words)
            
            if len(common_words) >= 2:  # At least 2 matching words
                similarity = len(common_words) / max(len(description_words), len(stored_words))
                matches.append({
                    'id': row['id'],
                    'name': row['name'],
                    'similarity': similarity,
                    'recognition_data': recognition_data,
                    'image_path': row['image_path']
                })
        
        # Sort by similarity
        matches.sort(key=lambda x: x['similarity'], reverse=True)
        
        if matches:
            best_match = matches[0]
            return jsonify({
                'success': True,
                'found': True,
                'name': best_match['name'],
                'similarity': best_match['similarity'],
                'memory_id': best_match['id'],
                'all_matches': matches[:3]  # Top 3 matches
            }), 200
        else:
            return jsonify({
                'success': True,
                'found': False,
                'message': 'No matching memory found'
            }), 200
        
    except Exception as e:
        print(f"❌ Error recognizing memory: {e}")
        return jsonify({
            'success': False,
            'message': f'Error recognizing memory: {str(e)}'
        }), 500

@app.route('/api/voice/save', methods=['POST'])
def save_voice_profile():
    """Save voice profile with speech patterns"""
    try:
        data = request.json
        person_name = data.get('name', '')
        speech_sample = data.get('speech_sample', '')
        
        if not person_name or not speech_sample:
            return jsonify({
                'success': False,
                'message': 'Name and speech sample are required'
            }), 400
        
        # Extract speech patterns from sample
        voice_data = {
            'speech_patterns': {
                'sample_text': speech_sample,
                'word_count': len(speech_sample.split()),
                'common_words': list(set(speech_sample.lower().split()))[:20],
                'language_style': 'hinglish' if any(word in speech_sample.lower() for word in ['hai', 'haan', 'nahi', 'kya']) else 'english'
            },
            'recorded_at': datetime.now().isoformat()
        }
        
        # Save to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO memories (type, content, name, voice_data)
            VALUES (?, ?, ?, ?)
        ''', ('text', f'Voice profile: {person_name}', person_name, json.dumps(voice_data)))
        
        memory_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Voice profile saved for {person_name}! 💚',
            'memory_id': memory_id,
            'name': person_name
        }), 201
        
    except Exception as e:
        print(f"❌ Error saving voice profile: {e}")
        return jsonify({
            'success': False,
            'message': f'Error saving voice profile: {str(e)}'
        }), 500

@app.route('/api/voice/recognize', methods=['POST'])
def recognize_voice():
    """Recognize speaker from speech sample"""
    try:
        data = request.json
        speech_sample = data.get('speech_sample', '')
        
        if not speech_sample:
            return jsonify({
                'success': False,
                'message': 'Speech sample is required'
            }), 400
        
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all voice profiles
        cursor.execute('''
            SELECT id, name, voice_data
            FROM memories
            WHERE voice_data IS NOT NULL
        ''')
        
        rows = cursor.fetchall()
        conn.close()
        
        if not rows:
            return jsonify({
                'success': True,
                'found': False,
                'message': 'No voice profiles found'
            }), 200
        
        # Simple text matching
        sample_words = set(speech_sample.lower().split())
        matches = []
        
        for row in rows:
            voice_data = json.loads(row['voice_data']) if row['voice_data'] else {}
            stored_sample = voice_data.get('speech_patterns', {}).get('sample_text', '')
            stored_words = set(stored_sample.lower().split())
            
            # Calculate word overlap
            common_words = sample_words.intersection(stored_words)
            if len(common_words) >= 2:
                similarity = len(common_words) / max(len(sample_words), len(stored_words))
                matches.append({
                    'id': row['id'],
                    'name': row['name'],
                    'similarity': similarity
                })
        
        # Sort by similarity
        matches.sort(key=lambda x: x['similarity'], reverse=True)
        
        if matches:
            best_match = matches[0]
            return jsonify({
                'success': True,
                'found': True,
                'name': best_match['name'],
                'similarity': best_match['similarity'],
                'confidence': 'high' if best_match['similarity'] > 0.5 else 'low'
            }), 200
        else:
            return jsonify({
                'success': True,
                'found': False,
                'message': 'Speaker not recognized'
            }), 200
        
    except Exception as e:
        print(f"❌ Error recognizing voice: {e}")
        return jsonify({
            'success': False,
            'message': f'Error recognizing voice: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Dr. Chinki Memory Server',
        'version': '2.0.0'  # Updated for recognition feature
    }), 200

if __name__ == '__main__':
    print("🧠 Dr. Chinki Memory Server Starting...")
    print("=" * 50)
    init_db()
    print(f"📁 Image directory: {os.path.abspath(IMAGE_DIR)}")
    print(f"💾 Database: {os.path.abspath(DB_PATH)}")
    print("=" * 50)
    print("🚀 Server running on http://localhost:5000")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)
