# Voice Agent — LiveKit Cloud Deployment

Quick deployment guide for running the voice agent and frontend using **LiveKit Cloud** (no self-hosted LiveKit server required).

---

## Prerequisites

| Requirement | Details |
|---|---|
| **Docker + Docker Compose v2** | [Install Docker](https://docs.docker.com/engine/install/) |
| **LiveKit Cloud project** | [cloud.livekit.io](https://cloud.livekit.io) |
| **Google Gemini API key** | [aistudio.google.com](https://aistudio.google.com/app/apikey) |

---

## 1. Get Your LiveKit Cloud Credentials

1. Go to [cloud.livekit.io](https://cloud.livekit.io)
2. Select or create a project
3. Navigate to **Settings → Keys**
4. Copy your **URL**, **API Key**, and **API Secret**

Your URL will look like: `wss://your-project.livekit.cloud`

---

## 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env.production

# Edit with your credentials
nano .env.production   # Linux
notepad .env.production  # Windows
```

Fill in:
```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxx
LIVEKIT_API_SECRET=SECRETxxxxxxx
GOOGLE_API_KEY=AIzaSyXXX
```

---

## 3. Deploy

### Linux / VPS
```bash
chmod +x deploy.sh
./deploy.sh
```

### Windows
```powershell
.\deploy.ps1
```

The script will:
- ✅ Validate your credentials
- 🔨 Build Docker images for agent and frontend
- 🚀 Start containers in detached mode
- 📋 Show container status and agent logs

---

## 4. Access

| Service | URL |
|---|---|
| **Frontend** | http://localhost:3000 |
| **Agent** | Connects outbound to LiveKit Cloud |

> **No ports need to be opened** for the agent — it connects outbound to LiveKit Cloud over WebSocket (port 443).

---

## Architecture

```
Browser  ──WebSocket──▶  LiveKit Cloud  ◀──WebSocket──  Agent (Docker)
   │                          │
   │◀── media (SRTP) ─────────┘
```

- **Frontend** generates tokens signed with your API key/secret and hands them to the browser
- **Browser** connects directly to LiveKit Cloud using that token
- **Agent** also connects to LiveKit Cloud and joins the same room
- LiveKit Cloud handles all WebRTC signaling and media routing

---

## Useful Commands

```bash
# Stream logs
docker compose logs -f agent
docker compose logs -f frontend

# Restart a single service
docker compose restart agent

# Rebuild after code changes
docker compose build agent && docker compose up -d agent

# Stop everything
docker compose down
```

---

## Local Development (No Docker)

For fast iteration, run services directly:

```bash
# Terminal 1 — Agent (from project root)
python agent.py dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Make sure both `d:\voice_agent_livekit\.env.local` and `d:\voice_agent_livekit\frontend\.env.local` have valid LiveKit Cloud credentials.
