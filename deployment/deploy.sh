#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Voice Agent Deployment Script ===${NC}"

# 1. Update System
echo -e "${YELLOW}Updating system...${NC}"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
fi

if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
elif [[ "$OS" == *"Oracle"* ]] || [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Fedora"* ]]; then
    sudo yum update -y
    sudo yum install -y yum-utils
fi

# 2. Install Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker installed.${NC}"
else
    echo -e "${GREEN}Docker already installed.${NC}"
fi

# 3. Setup Environment
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Creating .env.production...${NC}"
    cp .env.example .env.production
    
    # Get Public IP
    PUBLIC_IP=$(curl -s ifconfig.me)
    
    echo -e "${YELLOW}Please configure your .env.production file.${NC}"
    echo "Using Public IP: $PUBLIC_IP"
    
    # Auto-update Public URL
    sed -i "s|<your-public-ip>|$PUBLIC_IP|g" .env.production
    
    echo -e "${YELLOW}Enter your GOOGLE_API_KEY:${NC}"
    read -r GOOGLE_KEY
    sed -i "s|your_google_api_key|$GOOGLE_KEY|g" .env.production
    
    echo -e "${GREEN}.env.production configured.${NC}"
fi

# 4. Configure Firewall (Basic attempt)
echo -e "${YELLOW}Checking firewall ports...${NC}"
# Allow 7880 (LiveKit), 3000 (Frontend), 50000-60000 (RTC)
if command -v ufw &> /dev/null; then
    sudo ufw allow 3000/tcp
    sudo ufw allow 7880/tcp
    sudo ufw allow 50000:60000/udp
    echo -e "${GREEN}Opened ports with UFW.${NC}"
elif command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --permanent --add-port=7880/tcp
    sudo firewall-cmd --permanent --add-port=50000-60000/udp
    sudo firewall-cmd --reload
    echo -e "${GREEN}Opened ports with firewall-cmd.${NC}"
else 
    echo -e "${YELLOW}Warning: Could not configure firewall automatically. Ensure ports 3000, 7880, and 50000-60000/udp are open.${NC}"
fi

# 5. Start Services
echo -e "${YELLOW}Starting services...${NC}"
docker compose -f docker-compose.yml up -d --build

echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo -e "Frontend: http://$PUBLIC_IP:3000"
echo -e "LiveKit:  http://$PUBLIC_IP:7880"
