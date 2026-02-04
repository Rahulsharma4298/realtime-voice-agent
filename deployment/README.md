# Voice Agent Deployment Guide (Oracle Cloud)

This guide helps you deploy the Voice Agent application to an Oracle Cloud VM (Oracle Linux or Ubuntu).

## Prerequisites
- An Oracle Cloud instance (Compute VM)
- SSH access to the instance
- Project files copied to the instance

## Step 1: Transfer Files
Upload the entire project folder to your instance. You can use `scp` or `git`.

**Using SCP:**
```bash
# From your local machine (run in PowerShell)
scp -r d:\voice_agent_livekit opc@<your-instance-ip>:~/voice_agent
```

## Step 2: Run Deployment Script
SSH into your instance and run the script:

```bash
# Connect to your instance
ssh opc@<your-instance-ip>

# Navigate to deployment directory
cd ~/voice_agent/deployment

# Make script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

## Step 3: Follow Prompts
1. The script will install Docker automatically.
2. It will ask for your **GOOGLE_API_KEY**.
3. It will try to detect your Public IP.
4. It will start all services.

## Security Note (Oracle Cloud)
Oracle Cloud has a "Security List" or "Network Security Group" that firewall scripts cannot modify. You **MUST** manually open these ports in the Oracle Cloud Console:

- **TCP 3000** (Frontend)
- **TCP 7880** (LiveKit API/Signaling)
- **UDP 50000-60000** (WebRTC Media)

## Troubleshooting
- **Check Logs**:
  ```bash
  docker compose logs -f
  ```
- **Restart Services**:
  ```bash
  docker compose restart
  ```
