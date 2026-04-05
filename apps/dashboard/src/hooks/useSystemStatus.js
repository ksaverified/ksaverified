import { useState, useEffect } from 'react';

/**
 * Custom hook to fetch system status and telemetry from the PaperClip backend.
 * Expects the Vite proxy to be configured for /api -> localhost:3001.
 */
export function useSystemStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error('System telemetry unavailable');
      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      console.error('[Telemetry] Error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll every 10 seconds for real-time updates
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const runCommand = async (command) => {
    try {
      const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await response.json();
      return data;
    } catch (err) {
      return { error: err.message };
    }
  };

  const triggerOrchestrator = async () => {
    try {
      const response = await fetch('/api/orchestrator/trigger', { method: 'POST' });
      return await response.json();
    } catch (err) {
      return { error: err.message };
    }
  };

  return { status, loading, error, runCommand, triggerOrchestrator, refresh: fetchStatus };
}
