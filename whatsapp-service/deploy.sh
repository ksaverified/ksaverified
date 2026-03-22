#!/bin/bash

# KSAVerified VPS Deployment Script
# This script prepares a fresh Ubuntu server for the WhatsApp Microservice.

echo "--- Starting KSAVerified VPS Setup ---"

# 1. Update system
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker & Docker Compose
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce docker-compose

# 3. Create microservice directory
mkdir -p ~/whatsapp-service
cd ~/whatsapp-service

# 4. Clone or pull repository
# Note: User needs to provide GitHub credentials or use SSH keys
# git clone https://github.com/USER/Internet-Presence.git .

echo "--- Setup Complete ---"
echo "Instructions:"
echo "1. Copy your .env file to ~/whatsapp-service/.env"
echo "2. Run: docker-compose up -d --build"
