const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const COLORS = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    magenta: "\x1b[35m",
};

const SERVICES = [
    {
        name: "WhatsApp Microservice",
        cwd: path.join(__dirname, "../microservices/whatsapp"),
        command: "node",
        args: ["index.js"],
        color: COLORS.green,
        port: 8081
    },
    {
        name: "PaperClip Dashboard",
        cwd: path.join(__dirname, "../apps/paperclip/dashboard"),
        command: "npm",
        args: ["start"],
        color: COLORS.cyan,
        port: 3001
    },
    {
        name: "Orchestrator Backend",
        cwd: path.join(__dirname, ".."),
        command: "node",
        args: ["core/orchestrator.js"],
        color: COLORS.magenta,
        port: 5001
    }
];

async function checkOllama() {
    console.log(`${COLORS.bright}[Launcher] Checking local Ollama service...${COLORS.reset}`);
    try {
        await axios.get('http://localhost:11434/api/tags', { timeout: 2000 });
        console.log(`${COLORS.green}[Ollama] ✅ Running and responding.${COLORS.reset}\n`);
        return true;
    } catch (err) {
        console.log(`${COLORS.red}[Ollama] 🔴 Not detected on port 11434.${COLORS.reset}`);
        console.log(`${COLORS.yellow}[Ollama] Please ensure "ollama serve" is running in the background for local GPU AI.${COLORS.reset}\n`);
        return false;
    }
}

function spawnService(service) {
    console.log(`${service.color}[${service.name}] Starting...${COLORS.reset}`);
    
    // On Windows, 'npm' usually needs 'npm.cmd'
    const command = process.platform === 'win32' && service.command === 'npm' ? 'npm.cmd' : service.command;
    
    const proc = spawn(command, service.args, {
        cwd: service.cwd,
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true
    });

    proc.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                console.log(`${service.color}[${service.name}]${COLORS.reset} ${line.trim()}`);
            }
        });
    });

    proc.stderr.on('data', (data) => {
        console.error(`${COLORS.red}[${service.name}] ERR:${COLORS.reset} ${data.toString().trim()}`);
    });

    proc.on('close', (code) => {
        console.log(`${COLORS.red}[${service.name}] EXITED with code ${code}${COLORS.reset}`);
    });

    return proc;
}

async function start() {
    console.log(`${COLORS.bright}======================================================`);
    console.log(`[Launcher] KSA Verified Unified Platform Starting...`);
    console.log(`======================================================${COLORS.reset}\n`);

    await checkOllama();

    const processes = SERVICES.map(service => spawnService(service));

    process.on('SIGINT', () => {
        console.log(`\n${COLORS.yellow}[Launcher] Shutting down all services...${COLORS.reset}`);
        processes.forEach(p => p.kill());
        process.exit();
    });

    console.log(`${COLORS.bright}\n[Launcher] All services launched!${COLORS.reset}`);
    console.log(`${COLORS.cyan}[Dashboard] Access at: http://localhost:3001${COLORS.reset}`);
    console.log(`${COLORS.green}[WhatsApp ] Status check: http://localhost:8081/health${COLORS.reset}\n`);
}

start().catch(err => {
    console.error("Critical Launcher Error:", err);
    process.exit(1);
});
