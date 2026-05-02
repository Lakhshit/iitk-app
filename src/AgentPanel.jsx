/**
 * AgentPanel.jsx
 * AI-powered WebLogic Automation Engine
 * Full operations: Start/Stop/Restart servers, Deploy/Undeploy apps, Datasources, JVM etc.
 */

import { useState, useRef, useEffect } from 'react';

/* ── Categories & Presets ────────────────────────────────── */
const CATEGORIES = [
  { id: 'monitoring',   label: '📊 Monitoring',   color: '#3B82F6' },
  { id: 'servers',      label: '⚡ Servers',       color: '#10B981' },
  { id: 'deployments',  label: '🚀 Deployments',   color: '#8B5CF6' },
  { id: 'diagnostics',  label: '🔬 Diagnostics',   color: '#F59E0B' },
];

const PRESETS = [
  // ── Monitoring ──────────────────────────────────────────
  {
    id: 'health', cat: 'monitoring',
    label: 'Full Health Check',
    icon: '🔍',
    task: 'Perform a complete health check of the entire WebLogic environment. Check all servers status, JVM heap usage, thread counts, deployed applications, and datasources. Give me a clear executive summary with any issues highlighted.',
    color: '#3B82F6'
  },
  {
    id: 'jvm-report', cat: 'monitoring',
    label: 'JVM Memory Report',
    icon: '💾',
    task: 'Check the JVM heap usage, garbage collection time, and memory statistics for all WebLogic servers. Identify if any server has high memory usage and recommend actions.',
    color: '#3B82F6'
  },
  {
    id: 'thread-report', cat: 'monitoring',
    label: 'Thread Analysis',
    icon: '🧵',
    task: 'Analyze the thread pool status for all WebLogic servers. Check for stuck threads, pending requests, and thread pool saturation. Report any concerns.',
    color: '#3B82F6'
  },
  {
    id: 'datasource-check', cat: 'monitoring',
    label: 'Datasource Status',
    icon: '🗄️',
    task: 'Check all JDBC datasources status, connection pool usage, active connections, and waiting connections. Report any datasource issues.',
    color: '#3B82F6'
  },
  {
    id: 'deploy-status', cat: 'monitoring',
    label: 'Deployment Status',
    icon: '📋',
    task: 'Get a complete status report of all deployed applications — which are active, which are stopped, which are in error state, and their target servers.',
    color: '#3B82F6'
  },

  // ── Servers ─────────────────────────────────────────────
  {
    id: 'start-admin', cat: 'servers',
    label: 'Start AdminServer',
    icon: '▶️',
    task: 'Start the AdminServer. First check its current status, then start it if it is stopped, then verify it comes back to RUNNING state.',
    color: '#10B981'
  },
  {
    id: 'stop-admin', cat: 'servers',
    label: 'Stop AdminServer',
    icon: '⏹️',
    task: 'Stop the AdminServer gracefully. Check current status first, then perform a graceful shutdown, and confirm the stop was initiated.',
    color: '#EF4444'
  },
  {
    id: 'restart-admin', cat: 'servers',
    label: 'Restart AdminServer',
    icon: '🔄',
    task: 'Restart the AdminServer. Check its current status, send the restart command, and report the result.',
    color: '#F59E0B'
  },
  {
    id: 'start-all', cat: 'servers',
    label: 'Start All Stopped',
    icon: '▶️▶️',
    task: 'Check all WebLogic servers and start any that are currently stopped or in a failed state. Verify they come back to RUNNING. Do not touch servers already running.',
    color: '#10B981'
  },
  {
    id: 'stop-all-managed', cat: 'servers',
    label: 'Stop All Managed',
    icon: '⏹️⏹️',
    task: 'Stop all managed servers (not the AdminServer) gracefully. Check their status first, then stop each one and confirm.',
    color: '#EF4444'
  },
  {
    id: 'restart-all', cat: 'servers',
    label: 'Restart All Servers',
    icon: '🔄🔄',
    task: 'Restart all WebLogic servers one by one. Check current status, restart each server, verify recovery. Report the final state of all servers.',
    color: '#F59E0B'
  },
  {
    id: 'restart-uat', cat: 'servers',
    label: 'Restart UAT Servers',
    icon: '🧪',
    task: 'Restart all servers with "uat" or "UAT" in their name. Verify they come back up successfully.',
    color: '#F59E0B'
  },
  {
    id: 'restart-prod', cat: 'servers',
    label: 'Restart PROD Servers',
    icon: '🏭',
    task: 'Restart all production servers (servers with "prod" or "PROD" in their name). Check active sessions first, restart carefully, verify recovery.',
    color: '#EF4444'
  },

  // ── Deployments ─────────────────────────────────────────
  {
    id: 'list-apps', cat: 'deployments',
    label: 'List All Applications',
    icon: '📦',
    task: 'List all deployed applications with their current state, target servers, version, and health status.',
    color: '#8B5CF6'
  },
  {
    id: 'start-all-apps', cat: 'deployments',
    label: 'Start All Apps',
    icon: '▶️',
    task: 'Start all deployed applications that are currently stopped or prepared. Verify they become active after starting.',
    color: '#10B981'
  },
  {
    id: 'stop-all-apps', cat: 'deployments',
    label: 'Stop All Apps',
    icon: '⏹️',
    task: 'Stop all currently active deployed applications gracefully. Confirm each application is stopped.',
    color: '#EF4444'
  },
  {
    id: 'stop-non-critical', cat: 'deployments',
    label: 'Stop Non-Critical Apps',
    icon: '🔇',
    task: 'Identify and stop applications that appear non-critical (not system apps, not core infrastructure). Leave critical applications running.',
    color: '#EF4444'
  },
  {
    id: 'redeploy-all', cat: 'deployments',
    label: 'Redeploy All Apps',
    icon: '🔁',
    task: 'Redeploy all currently deployed applications to refresh them. Check their status before and after redeployment.',
    color: '#8B5CF6'
  },

  // ── Diagnostics ─────────────────────────────────────────
  {
    id: 'full-diagnostic', cat: 'diagnostics',
    label: 'Full Diagnostic Report',
    icon: '🔬',
    task: 'Run a comprehensive diagnostic of the WebLogic environment. Check servers, JVM heap, threads, datasources, deployments, and domain configuration. Produce a detailed report with findings and recommendations.',
    color: '#F59E0B'
  },
  {
    id: 'perf-check', cat: 'diagnostics',
    label: 'Performance Analysis',
    icon: '📈',
    task: 'Analyze the performance of all WebLogic servers. Check CPU load indicators (thread pool, pending requests), memory usage (JVM heap, GC time), and datasource connection pool utilization. Identify bottlenecks.',
    color: '#F59E0B'
  },
  {
    id: 'domain-info', cat: 'diagnostics',
    label: 'Domain Info',
    icon: 'ℹ️',
    task: 'Get complete WebLogic domain information including domain name, version, admin server details, all configured servers, clusters, and deployment targets.',
    color: '#F59E0B'
  },
  {
    id: 'incident-report', cat: 'diagnostics',
    label: 'Generate Incident Report',
    icon: '📄',
    task: 'Generate a formal incident report of the current WebLogic environment state. Include server statuses, any anomalies, deployment health, datasource status, and recommended remediation actions.',
    color: '#F59E0B'
  },
];

/* ── Step icon mapping ───────────────────────────────────── */
function stepIcon(type) {
  return { thinking:'🧠', action:'⚡', result:'📊', text:'💬', done:'✅', error:'❌', warning:'⚠️', start:'🚀' }[type] || '•';
}

function stepColor(type) {
  return { thinking:'#60A5FA', action:'#FBBF24', result:'#9CA3AF', text:'#F9FAFB', done:'#34D399', error:'#F87171', warning:'#FBBF24', start:'#60A5FA' }[type] || '#9CA3AF';
}

/* ── Main Component ──────────────────────────────────────── */
export default function AgentPanel({ AGENT_URL = 'http://localhost:3001', C = {}, theme = 'dark' }) {
  const [steps, setSteps]           = useState([]);
  const [running, setRunning]       = useState(false);
  const [customTask, setCustomTask] = useState('');
  const [activePreset, setActive]   = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const [activeCategory, setActiveCategory] = useState('monitoring');
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [steps]);

  async function runAgent(task, presetId) {
    if (running) return;
    setRunning(true);
    setActive(presetId);
    setSteps([]);

    try {
      const resp = await fetch(`${AGENT_URL}/api/agent/run`, {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body    : JSON.stringify({ task })
      });

      if (!resp.ok) throw new Error(`Engine returned ${resp.status}`);

      const reader  = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') { setRunning(false); setActive(null); break; }
          try {
            const step = JSON.parse(raw);
            setSteps(prev => [...prev, { ...step, ts: new Date().toLocaleTimeString() }]);
          } catch {}
        }
      }
    } catch (err) {
      setSteps(prev => [...prev, { type: 'error', message: err.message, ts: new Date().toLocaleTimeString() }]);
    } finally {
      setRunning(false);
      setActive(null);
    }
  }

  /* ── Theme ───────────────────────────────────────────────── */
  const isDark = theme === 'dark';
  const card   = isDark ? '#1E2535' : '#FFFFFF';
  const card2  = isDark ? '#242938' : '#F8FAFC';
  const border = isDark ? '#334155' : '#E5E7EB';
  const txt    = isDark ? '#E2E8F0' : '#1E293B';
  const muted  = isDark ? '#94A3B8' : '#6B7280';
  const logBg  = isDark ? '#0F1421' : '#F8FAFC';

  const filteredPresets = PRESETS.filter(p => p.cat === activeCategory);
  const taskIsEmpty = !customTask.trim();

  return (
    <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, overflow: 'hidden', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* ── Header ── */}
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDark ? '#161C2D' : '#F8FAFC' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: txt }}>⚡ Automation Engine</div>
          <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>AI-powered WebLogic orchestration · {PRESETS.length} operations available</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {steps.length > 0 && !running && (
            <button onClick={() => setSteps([])} style={{ background: 'none', border: `1px solid ${border}`, color: muted, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Clear log</button>
          )}
          <div style={{ background: running ? '#10B981' : '#6366F1', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: running ? 'pulse 1s infinite' : 'none' }}/>
            {running ? 'Running' : 'Ready'}
          </div>
        </div>
      </div>

      {/* ── Category Tabs ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, background: isDark ? '#1A2030' : '#F1F5F9', overflowX: 'auto' }}>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: activeCategory === cat.id ? `3px solid ${cat.color}` : '3px solid transparent', color: activeCategory === cat.id ? cat.color : muted, cursor: 'pointer', fontSize: 13, fontWeight: activeCategory === cat.id ? 700 : 500, whiteSpace: 'nowrap', transition: 'all 0.15s' }}>
            {cat.label}
          </button>
        ))}
        <button onClick={() => { setShowCustom(v => !v); setActiveCategory('custom'); }} style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: activeCategory === 'custom' ? '3px solid #6366F1' : '3px solid transparent', color: activeCategory === 'custom' ? '#6366F1' : muted, cursor: 'pointer', fontSize: 13, fontWeight: activeCategory === 'custom' ? 700 : 500, whiteSpace: 'nowrap' }}>
          ✏️ Custom
        </button>
      </div>

      {/* ── Preset Buttons ── */}
      {activeCategory !== 'custom' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, padding: '16px 20px' }}>
          {filteredPresets.map(p => (
            <button key={p.id} disabled={running} onClick={() => runAgent(p.task, p.id)} style={{ background: activePreset === p.id ? p.color : isDark ? '#2D3748' : '#F1F5F9', color: activePreset === p.id ? '#fff' : txt, border: `1px solid ${activePreset === p.id ? p.color : border}`, borderRadius: 8, padding: '10px 14px', cursor: running ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 500, textAlign: 'left', opacity: running && activePreset !== p.id ? 0.5 : 1, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
              <span style={{ lineHeight: 1.3 }}>{p.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Custom Task ── */}
      {(activeCategory === 'custom' || showCustom) && (
        <div style={{ padding: '16px 20px', borderTop: activeCategory !== 'custom' ? `1px solid ${border}` : 'none' }}>
          <div style={{ fontSize: 12, color: muted, marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Custom Task</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              value={customTask}
              onChange={e => setCustomTask(e.target.value)}
              placeholder="Describe what you want the AI agent to do with your WebLogic environment..."
              disabled={running}
              rows={3}
              style={{ flex: 1, background: logBg, border: `1px solid ${border}`, borderRadius: 8, padding: '10px 14px', color: txt, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
            <button
              disabled={running || taskIsEmpty}
              onClick={() => { runAgent(customTask, 'custom'); setCustomTask(''); }}
              style={{ background: running || taskIsEmpty ? (isDark ? '#2D3748' : '#E5E7EB') : '#6366F1', color: running || taskIsEmpty ? muted : '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: running || taskIsEmpty ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
            >
              {running ? '⏳ Running...' : '▶ Run'}
            </button>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: muted, marginBottom: 6 }}>💡 Example tasks:</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                'Stop AdminServer and confirm it stopped',
                'Deploy pdc-app to AdminServer',
                'Check if any server has high JVM heap',
                'Undeploy all stopped applications',
                'Generate a full environment report',
              ].map(t => (
                <button key={t} onClick={() => setCustomTask(t)} disabled={running} style={{ padding: '3px 10px', background: isDark ? '#2D3748' : '#F1F5F9', border: `1px solid ${border}`, borderRadius: 4, color: muted, fontSize: 11, cursor: 'pointer' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Activity Log ── */}
      <div ref={logRef} style={{ background: logBg, borderTop: `1px solid ${border}`, maxHeight: 380, overflowY: 'auto', padding: '14px 20px', fontFamily: 'monospace', fontSize: 12 }}>
        {steps.length === 0 ? (
          <div style={{ color: muted, textAlign: 'center', padding: '30px 0', fontSize: 13 }}>
            Select an operation above to start the automation engine
          </div>
        ) : (
          steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, color: stepColor(s.type) }}>
              <span style={{ color: muted, minWidth: 60, fontSize: 11, paddingTop: 1 }}>{s.ts}</span>
              <span>{stepIcon(s.type)}</span>
              <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.6 }}>{s.message}</span>
            </div>
          ))
        )}
        {running && (
          <div style={{ color: '#6366F1', display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
            <span>AI Agent working...</span>
          </div>
        )}
      </div>
    </div>
  );
}
