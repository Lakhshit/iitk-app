/**
 * AgentPanel.jsx
 * Drop this file into your src/ folder alongside App.jsx.
 * Then add <AgentPanel AGENT_URL="https://YOUR-NGROK-URL.ngrok-free.dev" /> 
 * inside App.jsx wherever you want the panel to appear.
 *
 * Branded as "Automation Engine" — zero Claude/Anthropic references.
 */

import { useState, useRef, useEffect } from 'react';

/* ── Preset tasks shown as quick-launch buttons ──────────── */
const PRESETS = [
  {
    id      : 'health',
    label   : 'Environment Health Check',
    icon    : '🔍',
    task    : 'Perform a full health check of the WebLogic environment. Check all servers and applications, and give me a clear summary of what is running, what is stopped, and if there are any issues.',
    color   : '#3B82F6'
  },
  {
    id      : 'start-all',
    label   : 'Start All Stopped Servers',
    icon    : '▶️',
    task    : 'Check which managed servers are currently stopped or in a failed state and start them. Verify they are running after starting. Do not touch servers that are already running.',
    color   : '#10B981'
  },
  {
    id      : 'restart-uat',
    label   : 'Restart UAT Environment',
    icon    : '🔄',
    task    : 'Restart all servers that have "uat" in their name. Check their status before restarting, perform the restart, then verify they come back up successfully.',
    color   : '#F59E0B'
  },
  {
    id      : 'stop-apps',
    label   : 'Stop Non-Critical Apps',
    icon    : '⏹️',
    task    : 'Identify any applications that are currently active and not critical system applications. Stop them gracefully and confirm they are stopped.',
    color   : '#EF4444'
  },
  {
    id      : 'deploy-check',
    label   : 'Deployment Status Report',
    icon    : '📋',
    task    : 'Give me a complete status report of all deployed applications — which are active, which are stopped, and which need attention.',
    color   : '#8B5CF6'
  }
];

/* ── Step icon mapping ───────────────────────────────────── */
function stepIcon(type) {
  const icons = {
    thinking : '🧠',
    action   : '⚡',
    result   : '📊',
    text     : '💬',
    done     : '✅',
    error    : '❌',
    warning  : '⚠️',
    start    : '🚀'
  };
  return icons[type] || '•';
}

/* ── Colour for step type ────────────────────────────────── */
function stepColor(type, C) {
  const map = {
    thinking : C.info || '#60A5FA',
    action   : C.warning || '#FBBF24',
    result   : C.secondary || '#9CA3AF',
    text     : C.primary || '#F9FAFB',
    done     : C.success || '#34D399',
    error    : C.danger || '#F87171',
    warning  : '#FBBF24',
    start    : C.info || '#60A5FA'
  };
  return map[type] || C.secondary;
}

/* ─────────────────────────────────────────────────────────
   Main Component
   Props:
     AGENT_URL  — base URL of your agent-server.js (e.g. https://xxx.ngrok-free.dev)
     C          — your app's colour object (same one used in App.jsx)
     theme      — 'dark' | 'light' (default 'dark')
   ───────────────────────────────────────────────────────── */
export default function AgentPanel({ AGENT_URL = 'http://localhost:3002', C = {}, theme = 'dark' }) {
  const [steps, setSteps]       = useState([]);
  const [running, setRunning]   = useState(false);
  const [customTask, setCustomTask] = useState('');
  const [activePreset, setActive]   = useState(null);
  const [showCustom, setShowCustom] = useState(false);
  const logRef = useRef(null);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [steps]);

  /* ── Run agent ─────────────────────────────────────────── */
  async function runAgent(task, presetId) {
    if (running) return;
    setRunning(true);
    setActive(presetId);
    setSteps([]);

    try {
      const resp = await fetch(`${AGENT_URL}/api/agent/run`, {
        method  : 'POST',
        headers : { 'Content-Type': 'application/json' },
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

  /* ── Colours (fallback palette) ─────────────────────────── */
  const isDark = theme === 'dark';
  const bg     = isDark ? '#1A1F2E' : '#F3F4F6';
  const card   = isDark ? '#242938' : '#FFFFFF';
  const border = isDark ? '#334155' : '#E5E7EB';
  const txt    = isDark ? '#E2E8F0' : '#1E293B';
  const muted  = isDark ? '#94A3B8' : '#6B7280';
  const logBg  = isDark ? '#0F1421' : '#F8FAFC';

  /* ── Styles ─────────────────────────────────────────────── */
  const styles = {
    panel: {
      background   : card,
      border       : `1px solid ${border}`,
      borderRadius : '12px',
      overflow     : 'hidden',
      fontFamily   : 'system-ui, -apple-system, sans-serif'
    },
    header: {
      padding         : '16px 20px',
      borderBottom    : `1px solid ${border}`,
      display         : 'flex',
      alignItems      : 'center',
      justifyContent  : 'space-between',
      background      : isDark ? '#1E2535' : '#F8FAFC'
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    badge: {
      background   : running ? '#10B981' : '#6366F1',
      color        : '#fff',
      fontSize     : '11px',
      fontWeight   : 700,
      padding      : '3px 10px',
      borderRadius : '20px',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      display      : 'flex',
      alignItems   : 'center',
      gap          : '6px'
    },
    dot: {
      width      : '7px',
      height     : '7px',
      borderRadius: '50%',
      background : running ? '#fff' : '#fff',
      animation  : running ? 'pulse 1s infinite' : 'none'
    },
    title: { color: txt, fontWeight: 600, fontSize: '15px', margin: 0 },
    sub  : { color: muted, fontSize: '12px', marginTop: '2px' },
    presets: {
      display        : 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap            : '10px',
      padding        : '16px 20px'
    },
    presetBtn: (id, color) => ({
      background   : activePreset === id ? color : isDark ? '#2D3748' : '#F1F5F9',
      color        : activePreset === id ? '#fff' : txt,
      border       : `1px solid ${activePreset === id ? color : border}`,
      borderRadius : '8px',
      padding      : '10px 14px',
      cursor       : running ? 'not-allowed' : 'pointer',
      fontSize     : '13px',
      fontWeight   : 500,
      textAlign    : 'left',
      opacity      : running && activePreset !== id ? 0.5 : 1,
      transition   : 'all 0.15s ease',
      display      : 'flex',
      alignItems   : 'center',
      gap          : '8px'
    }),
    customRow: {
      padding     : '0 20px 16px',
      display     : 'flex',
      gap         : '8px',
      alignItems  : 'flex-end'
    },
    input: {
      flex        : 1,
      background  : logBg,
      border      : `1px solid ${border}`,
      borderRadius: '8px',
      padding     : '10px 14px',
      color       : txt,
      fontSize    : '13px',
      outline     : 'none',
      resize      : 'vertical',
      minHeight   : '60px',
      fontFamily  : 'inherit'
    },
    runBtn: (disabled) => ({
      background   : disabled ? (isDark ? '#2D3748' : '#E5E7EB') : '#6366F1',
      color        : disabled ? muted : '#fff',
      border       : 'none',
      borderRadius : '8px',
      padding      : '10px 18px',
      cursor       : disabled ? 'not-allowed' : 'pointer',
      fontSize     : '13px',
      fontWeight   : 600,
      whiteSpace   : 'nowrap',
      alignSelf    : 'flex-end',
      transition   : 'all 0.15s'
    }),
    log: {
      background : logBg,
      borderTop  : `1px solid ${border}`,
      maxHeight  : '320px',
      overflowY  : 'auto',
      padding    : '14px 20px',
      fontFamily : 'monospace',
      fontSize   : '12px'
    },
    step: (type) => ({
      display      : 'flex',
      gap          : '10px',
      marginBottom : '8px',
      color        : stepColor(type, { info: '#60A5FA', warning: '#FBBF24', secondary: muted, primary: txt, success: '#34D399', danger: '#F87171' })
    }),
    stepTime: { color: muted, minWidth: '55px', fontSize: '11px', paddingTop: '1px' },
    stepMsg  : { flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: '1.5' },
    emptyLog : { color: muted, textAlign: 'center', padding: '30px 0', fontSize: '13px' },
    clearBtn : {
      background   : 'none',
      border       : `1px solid ${border}`,
      color        : muted,
      borderRadius : '6px',
      padding      : '4px 10px',
      fontSize     : '11px',
      cursor       : 'pointer'
    }
  };

  const taskIsEmpty = !customTask.trim();

  return (
    <div style={styles.panel}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { to{transform:rotate(360deg)} }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <div>
            <p style={styles.title}>⚡ Automation Engine</p>
            <p style={styles.sub}>AI-powered WebLogic orchestration</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {steps.length > 0 && !running && (
            <button style={styles.clearBtn} onClick={() => setSteps([])}>Clear log</button>
          )}
          <span style={styles.badge}>
            <span style={styles.dot}/>
            {running ? 'Running' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Quick-launch presets */}
      <div style={styles.presets}>
        {PRESETS.map(p => (
          <button
            key={p.id}
            style={styles.presetBtn(p.id, p.color)}
            disabled={running}
            onClick={() => runAgent(p.task, p.id)}
          >
            <span style={{ fontSize: '16px' }}>{p.icon}</span>
            <span>{p.label}</span>
          </button>
        ))}
        <button
          style={styles.presetBtn('custom', '#6366F1')}
          disabled={running}
          onClick={() => setShowCustom(v => !v)}
        >
          <span style={{ fontSize: '16px' }}>✏️</span>
          <span>Custom Task</span>
        </button>
      </div>

      {/* Custom task input */}
      {showCustom && (
        <div style={styles.customRow}>
          <textarea
            style={styles.input}
            placeholder="Describe what you want the automation engine to do..."
            value={customTask}
            onChange={e => setCustomTask(e.target.value)}
            disabled={running}
          />
          <button
            style={styles.runBtn(running || taskIsEmpty)}
            disabled={running || taskIsEmpty}
            onClick={() => { runAgent(customTask, 'custom'); setCustomTask(''); }}
          >
            {running ? '⏳ Running...' : '▶ Run'}
          </button>
        </div>
      )}

      {/* Activity Log */}
      <div ref={logRef} style={styles.log}>
        {steps.length === 0 ? (
          <div style={styles.emptyLog}>
            Select a task above to start the automation engine
          </div>
        ) : (
          steps.map((s, i) => (
            <div key={i} style={styles.step(s.type)}>
              <span style={styles.stepTime}>{s.ts}</span>
              <span>{stepIcon(s.type)}</span>
              <span style={styles.stepMsg}>{s.message}</span>
            </div>
          ))
        )}
        {running && (
          <div style={{ color: '#6366F1', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
            <span>Engine working...</span>
          </div>
        )}
      </div>
    </div>
  );
}
