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
    
    # Add Docker's official GPG key
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc
    
    # Add the repository to Apt sources
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update
    
    # Install Docker packages (without docker-model-plugin which doesn't exist)
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin docker-buildx-plugin
    
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker installed.${NC}"
    echo -e "${YELLOW}Note: You may need to log out and back in for group changes to take effect.${NC}"
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

# Use sudo if user doesn't have docker group active yet
if groups | grep -q docker; then
    docker compose -f docker-compose.yml up -d --build
else
    echo -e "${YELLOW}Using sudo for docker (group membership not active yet)${NC}"
    sudo docker compose -f docker-compose.yml up -d --build
fi

echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo -e "Frontend: http://$PUBLIC_IP:3000"
echo -e "LiveKit:  http://$PUBLIC_IP:7880"
echo -e ""
echo -e "${YELLOW}Note: If you installed Docker for the first time, you may need to log out and back in.${NC}"
echo -e "${YELLOW}To view logs: sudo docker compose logs -f${NC}"
