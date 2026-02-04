# Voice Agent with LiveKit & Gemini

A real-time voice AI assistant powered by Google's Gemini 2.5 Flash with native audio and vision capabilities, built on LiveKit's infrastructure.

## Features

- 🎙️ **Real-time Voice Interaction** - Natural conversation with low latency
- 👁️ **Live Vision** - AI can see through your camera and describe what it sees
- 🛠️ **Function Calling** - Extensible tool system (weather example included)
- 🎨 **Modern UI** - Clean, professional Next.js interface
- 🔄 **Session Persistence** - Agent stays alive across page refreshes
- 🐳 **Docker Ready** - Production deployment with Docker Compose

## Tech Stack

- **Backend**: Python 3.11, LiveKit Agents SDK
- **LLM**: Google Gemini 2.5 Flash (Realtime API)
- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS
- **Infrastructure**: LiveKit Server, Docker

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 20+
- Google API Key ([Get one here](https://aistudio.google.com/apikey))

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd voice_agent_livekit
```

### 2. Configure Environment

Create `.env.local` in the root directory:

```env
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
GOOGLE_API_KEY=your_google_api_key_here
```

### 3. Install Dependencies

**Backend:**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### 4. Run the Application

**Terminal 1 - LiveKit Server:**
```bash
.\livekit-server.exe --dev --bind 127.0.0.1
```

**Terminal 2 - Agent:**
```bash
venv\Scripts\activate
python agent.py start
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect** - The app automatically connects when you open it
2. **Start Talking** - Click the microphone button and speak
3. **Enable Camera** (Optional) - Click the camera button to enable vision
4. **Ask Questions** - Try:
   - "What's the weather in Delhi?"
   - "What do you see?" (with camera on)
   - "Tell me a joke"

## Project Structure

```
voice_agent_livekit/
├── agent.py              # Voice agent logic
├── requirements.txt      # Python dependencies
├── livekit.yaml         # LiveKit server config
├── restart.ps1          # Quick restart script
├── frontend/            # Next.js application
│   ├── app/
│   │   ├── page.tsx    # Main UI
│   │   └── api/token/  # Token generation
│   └── package.json
└── deployment/          # Docker deployment files
    ├── Dockerfile.agent
    ├── Dockerfile.frontend
    ├── docker-compose.yml
    └── README.md
```

## Deployment

See [deployment/README.md](deployment/README.md) for production deployment instructions using Docker.

## Customization

### Adding New Tools

Edit `agent.py` and add methods to the `AssistantFnc` class:

```python
class AssistantFnc:
    @llm.function_tool(description="Your tool description")
    async def your_tool(self, param: str):
        # Your logic here
        return "Result"
```

### Changing Voice

Edit the `voice` parameter in `agent.py`:

```python
voice="Puck"  # Options: Puck, Charon, Kore, Fenrir, Aoede
```

### UI Customization

Edit `frontend/app/page.tsx` and `frontend/app/globals.css` to customize the interface.

## Troubleshooting

**Agent not responding:**
- Check that all three services are running
- Verify your `GOOGLE_API_KEY` is valid
- Check agent logs for errors

**Camera not working:**
- Ensure browser has camera permissions
- Check that `livekit-agents[images]` is installed
- Verify camera is not being used by another app

**Connection issues:**
- Ensure LiveKit server is running on port 7880
- Check firewall settings
- Verify `.env.local` configuration

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- [LiveKit](https://livekit.io/) - Real-time communication infrastructure
- [Google Gemini](https://deepmind.google/technologies/gemini/) - Multimodal AI model
- Built with guidance from [LiveKit Agents Documentation](https://docs.livekit.io/agents/)
