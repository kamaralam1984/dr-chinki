# 🩺 Dr. Chinki AI Medical Tutor

**Dr. Chinki AI Medical Tutor** is a cutting-edge, advanced AI-powered educational platform specifically designed for NEET medical students. It combines the power of Google's Gemini models with interactive 3D visualizations and a powerful, integrated camera-based "Neural Vision" system to provide a high-energy, engaging, and "viral" learning experience.

## 🚀 Features

- **🤖 Live AI Tutor (Dr. Chinki)**: Real-time, low-latency voice interaction using the Gemini Live API. Dr. Chinki speaks Hinglish with a unique, affectionate persona ("Meri Jaan", "Boss Kamar Alam").
- **👁️ Neural Vision Lab**: A unified, camera-powered interface that allows Dr. Chinki to "see" and understand the world. With user permission, she can:
    - **Analyze Faces**: Perform on-the-fly physiognomy readings.
    - **Read Text (OCR)**: Instantly digitize and process text from documents or the environment.
    - **Describe Scenes**: Provide rich descriptions of her surroundings.
- **🧠 3D Anatomy Visualizer**: Interactive 3D rendering of human organs (Heart, Brain, Cell, etc.) with high-yield NEET facts mapped to specific parts.
- **🎬 Viral Storyboarding**: Automatically generates scene-by-scene scripts for medical educational videos, including image/video prompts and duration calculations.
- **📈 YouTube Viral Analytics**: Predicts view counts, calculates a "Viral Index," and provides strategic "hacks" to make medical content trend on social media.
- **📱 Mobile Responsive**: Fully optimized for both desktop and mobile devices with a custom view-switching system.
- **🎨 AI Image Generation**: Dynamic generation of high-quality medical visuals based on chat context.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS.
- **3D Engine**: React Three Fiber / Three.js.
- **AI Core**: Google GenAI SDK (Gemini Flash & Pro models).
- **UI/UX**: Custom Glassmorphism CSS, Framer Motion for animations.

## ⚙️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kamaralam1984/dr-chinki.git
   cd dr-chinki
   ```

2. **Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```bash
   VITE_API_KEY=your_gemini_api_key_here
   ```

3. **Install Dependencies**:
   ```bash
   npm install
   ```

4. **Start Both Servers (Frontend + Backend)**:

   **Option 1: Using npm script (Recommended)**
   ```bash
   npm run dev:all
   ```
   This will start both frontend (Vite) and backend (Flask) servers simultaneously.

   **Option 2: Using shell script (macOS/Linux)**
   ```bash
   ./start.sh
   ```

   **Option 3: Using batch file (Windows)**
   ```cmd
   start.bat
   ```

   **Option 4: Manual start**
   ```bash
   # Terminal 1 - Backend
   python3 memory_server.py
   
   # Terminal 2 - Frontend
   npm run dev
   ```

5. **Access the Application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📜 Authority
Developed under the authority of **Boss Kamar Alam**. 

## ⚖️ License
MIT License - Copyright (c) 2024 Dr. Chinki AI.
