# 🧠 DR. CHINKI v2.0 — BACKEND SYSTEM ARCHITECTURE

---

## 🌐 1. TECH STACK

| Layer         | Tech                                 |
| ------------- | ------------------------------------ |
| Frontend      | React + Next.js                      |
| 3D Engine     | **Three.js** + **React Three Fiber** |
| Backend API   | FastAPI (Python)                     |
| Database      | **Firebase** / **Supabase**          |
| AI Processing | LLM API + Vision Model               |
| Voice         | Web Speech API / Realtime AI Voice   |
| Calls         | **Twilio**                           |
| Emails        | **SendGrid**                         |
| Vector DB     | Pinecone / Weaviate / FAISS          |

---

## 🧩 2. MAIN BACKEND MODULES

### 🩺 `medical_engine.py`

* Symptom analysis (rule-based + AI)
* Report value checker
* NEET quiz generator
* Organ metadata loader

---

### 🧠 `rag_engine.py`

Handles MBBS books & PDFs

Flow:

```
Upload PDF → Extract Text → Chunk → Embeddings → Store in Vector DB
User Question → Embed Query → Similarity Search → Answer Generate
```

---

### 👁 `vision_engine.py`

* Image text extraction (OCR)
* Diagram explanation
* Object detection

---

### 🎤 `voice_engine.py`

* Speech-to-text
* Text-to-speech
* Phoneme output for lip-sync

---

### 💾 `memory_engine.py`

Database collections:

| Collection        | Stores           |
| ----------------- | ---------------- |
| users             | Profile data     |
| chat_history      | Conversations    |
| medical_reports   | Uploaded reports |
| learning_progress | Topics completed |
| business_leads    | Collected leads  |

---

### 💼 `business_engine.py`

Functions:

```python
def send_email(to, subject, body):
    # SendGrid API

def make_call(number, message):
    # Twilio API
```

---

### 🎬 `content_engine.py`

* Script generator
* Shot breakdown
* Hindi text cleaning

---

## 🔗 3. API ROUTES (FastAPI)

| Route              | Purpose                 |
| ------------------ | ----------------------- |
| `/analyze-report`  | Medical report analysis |
| `/ask-book`        | RAG question answering  |
| `/vision-analyze`  | Camera input            |
| `/generate-quiz`   | NEET quiz               |
| `/save-memory`     | Store user data         |
| `/get-memory`      | Recall history          |
| `/send-email`      | Business outreach       |
| `/make-call`       | Client calling          |
| `/generate-script` | Media content           |

---

## 🧠 4. SYSTEM FLOW

```
User Input (Text / Voice / Camera)
        ↓
Mode Detection (Medical / Study / Business / Vision)
        ↓
Route to Engine Module
        ↓
AI Processing
        ↓
Memory Save
        ↓
Response (Text + Voice + 3D Trigger)
```

---

## 🧍 5. 3D BODY INTEGRATION

Frontend listens:

```
if response.contains("heart"):
   load_3d_model("heart.glb")
```

---

## ⚠ SAFETY FILTER

Before final output:

* Remove harmful medical advice
* Add “consult doctor” warning if serious
