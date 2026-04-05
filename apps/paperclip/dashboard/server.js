require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Import DatabaseService from Internet Presence project
const DatabaseService = require('../../../core/services/db.js');
const db = new DatabaseService();

// API Handlers from root directory
const portalHandler = require('../../../api/portal');
const seoHandler = require('../../../api/seo');
const leadsHandler = require('../../../api/leads');


const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.DASHBOARD_PORT || 3001;
const ROOT_DIR = path.join(__dirname, '..');
const PAPERCLIP_CONFIG = path.join(ROOT_DIR, 'paperclip.json');
const MEMORY_DIR = path.join(ROOT_DIR, 'memory');
const LIFE_DIR = path.join(ROOT_DIR, 'life');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API: Get leads
app.get('/api/leads', (req, res) => {
  res.json(getLeadsData());
});

// API: Get system status
app.get('/api/status', async (req, res) => {
  const status = {
    gpu: await getGpuStatus(),
    ollama: await getOllamaStatus(),
    config: getConfig(),
    memory: getMemoryStats(),
    leads: getLeadsData(),
    timestamp: new Date().toISOString()
  };
  res.json(status);
});

// API: Get PaperClip config
app.get('/api/config', (req, res) => {
  res.json(getConfig());
});

// API: Get memory entries
app.get('/api/memory', (req, res) => {
  res.json(getMemoryStats());
});

// API: Get business info
app.get('/api/business', (req, res) => {
  res.json(getBusinessInfo());
});

// API: Run command
app.post('/api/command', (req, res) => {
  const { command } = req.body;
  exec(command, { cwd: ROOT_DIR, timeout: 10000 }, (error, stdout, stderr) => {
    if (error) {
      res.json({ error: error.message, output: stderr });
      return;
    }
    res.json({ output: stdout || 'Command executed successfully' });
  });
});

// Portal & Leads API (Universal handlers)
app.all('/api/portal', (req, res) => portalHandler(req, res));
app.all('/api/seo', (req, res) => seoHandler(req, res));
app.all('/api/leads/v2', (req, res) => leadsHandler(req, res)); // Avoid conflict with existing /api/leads

// Orchestrator IPC Endpoints
app.get('/api/orchestrator/status', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5001/status', { timeout: 2000 });
    res.json(response.data);
  } catch (err) {
    res.json({ isRunning: false, error: 'Orchestrator Offline' });
  }
});

app.post('/api/orchestrator/trigger', async (req, res) => {
  try {
    const response = await axios.get('http://localhost:5001/trigger', { timeout: 5000 });
    res.json(response.data);
  } catch (err) {
    res.status(503).json({ error: 'Orchestrator Offline' });
  }
});

function getGpuStatus() {
  return new Promise((resolve) => {
    exec('nvidia-smi --query-gpu=name,driver_version,memory.total,memory.used,utilization.gpu,temperature.gpu --format=csv,noheader',
      (error, stdout) => {
        if (error) {
          resolve({ available: false, error: 'GPU not detected' });
          return;
        }
        const parts = stdout.trim().split(', ');
        resolve({
          available: true,
          name: parts[0],
          driver: parts[1],
          totalMemory: parts[2],
          usedMemory: parts[3],
          utilization: parts[4],
          temperature: parts[5]
        });
      });
  });
}

function getOllamaStatus() {
  return new Promise((resolve) => {
    exec('ollama list 2>nul', (error, stdout) => {
      if (error || !stdout.trim()) {
        resolve({ running: false, models: [] });
        return;
      }
      const lines = stdout.trim().split('\n').slice(1);
      const models = lines.map(line => {
        const parts = line.split(/\s+/);
        return { name: parts[0], size: parts[1], modified: parts[2] };
      });
      resolve({ running: true, models });
    });
  });
}

function getConfig() {
  try {
    const content = fs.readFileSync(PAPERCLIP_CONFIG, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return { error: 'Config not found' };
  }
}

function getMemoryStats() {
  try {
    const files = fs.readdirSync(MEMORY_DIR).filter(f => f.endsWith('.md'));
    const today = new Date().toISOString().split('T')[0];
    const todayFile = `${today}.md`;
    const hasTodayNote = files.includes(todayFile);

    return {
      totalNotes: files.length,
      hasTodayNote,
      latestNote: files.sort().pop(),
      path: MEMORY_DIR
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function getLeadsData() {
  try {
    // Fetch live stats from Supabase instead of local JSON
    const { data: leads, error } = await db.supabase
      .from('leads')
      .select('status, priority, conversion_score');

    if (error) throw error;

    const byStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});

    return {
      source: 'Supabase (Production)',
      conversionStats: {
        total: leads.length,
        new: byStatus.scouted || 0,
        contacted: byStatus.contacted || 0,
        interested: byStatus.interested || 0,
        customer: byStatus.customer || 0,
        notInterested: byStatus.not_interested || 0,
        invalid: byStatus.error || 0,
        conversionRate: leads.length > 0 ? ((byStatus.customer || 0) / leads.length * 100).toFixed(2) : 0
      }
    };
  } catch (e) {
    console.error('[Dashboard] Supabase error:', e.message);
    return { error: e.message, source: 'offline', leads: [], stats: {} };
  }
}

function getBusinessInfo() {
  const areas = [];
  const projects = [];

  try {
    const areasDir = path.join(LIFE_DIR, 'Areas', 'Business');
    if (fs.existsSync(areasDir)) {
      const areaFiles = fs.readdirSync(areasDir).filter(f => f.endsWith('.md'));
      areaFiles.forEach(f => {
        const content = fs.readFileSync(path.join(areasDir, f), 'utf8');
        const nameMatch = content.match(/name:\s*(.+)/);
        areas.push({ name: nameMatch ? nameMatch[1].trim() : f.replace('.md', ''), file: f });
      });
    }
  } catch (e) {}

  try {
    const projectsDir = path.join(LIFE_DIR, 'Projects');
    if (fs.existsSync(projectsDir)) {
      const projectFiles = fs.readdirSync(projectsDir).filter(f => f.endsWith('.md'));
      projectFiles.forEach(f => {
        const content = fs.readFileSync(path.join(projectsDir, f), 'utf8');
        const nameMatch = content.match(/name:\s*(.+)/);
        const statusMatch = content.match(/status:\s*(.+)/);
        projects.push({
          name: nameMatch ? nameMatch[1].trim() : f.replace('.md', ''),
          file: f,
          status: statusMatch ? statusMatch[1].trim() : 'unknown'
        });
      });
    }
  } catch (e) {}

  return { areas, projects };
}

// WebSocket for real-time updates
io.on('connection', async (socket) => {
  console.log('Client connected');

  // Send initial status
  socket.emit('status', {
    gpu: await getGpuStatus(),
    ollama: await getOllamaStatus(),
    config: getConfig(),
    memory: getMemoryStats(),
    business: getBusinessInfo(),
    leads: await getLeadsData()
  });

  // Periodic updates
  const interval = setInterval(async () => {
    socket.emit('status', {
      gpu: await getGpuStatus(),
      ollama: await getOllamaStatus(),
      memory: getMemoryStats(),
      business: getBusinessInfo(),
      leads: await getLeadsData(),
      timestamp: new Date().toISOString()
    });
  }, 10000); // 10s updates for live DB

  socket.on('disconnect', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
