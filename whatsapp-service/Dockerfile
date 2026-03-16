FROM node:20-slim

# Install latest chrome dev package and fonts
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libasound2 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy shared dependencies
COPY services/ ./services/
COPY agents/ ./agents/

# Copy WhatsApp service package and install at the ROOT level (/app)
# This ensures shared services from /app/services can find modules in /app/node_modules
COPY whatsapp-service/package*.json ./
RUN npm install

# Copy WhatsApp service code into its own subdirectory
COPY whatsapp-service/ ./whatsapp-service/

# Expose the API port
EXPOSE 8081

# Start from the service subdirectory
WORKDIR /app/whatsapp-service
CMD ["npm", "start"]
