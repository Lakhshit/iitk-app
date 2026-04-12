import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, update, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD8flQKhye0ux5W-rw7LIjHdZt3ZkoroHg",
  authDomain: "oci-team-hub.firebaseapp.com",
  databaseURL: "https://oci-team-hub-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "oci-team-hub",
  storageBucket: "oci-team-hub.firebasestorage.app",
  messagingSenderId: "444346127805",
  appId: "1:444346127805:web:1f7ef3208c968a1b812ed4",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ── Theme ────────────────────────────────────────────────────
const C = {
  bg: "#060910", card: "#0a0f1a", card2: "#0f1520", border: "#1a2540",
  red: "#C74634", redD: "#8B1A10", redL: "#ff6b4a",
  blue: "#1e90ff", blueD: "#0a5fd1", cyan: "#00d4ff",
  green: "#00e676", greenD: "#00a152", orange: "#ff9100",
  yellow: "#ffd600", purple: "#d500f9", teal: "#1de9b6",
  text: "#e8eef8", muted: "#4a6080", dim: "#2a3a50",
  success: "#00e676", warning: "#ff9100", danger: "#ff1744", info: "#00d4ff",
};

const G = {
  red: "linear-gradient(135deg,#C74634,#8B1A10)",
  blue: "linear-gradient(135deg,#1e90ff,#00d4ff)",
  green: "linear-gradient(135deg,#00e676,#00a152)",
  orange: "linear-gradient(135deg,#ff9100,#C74634)",
  purple: "linear-gradient(135deg,#d500f9,#1e90ff)",
  teal: "linear-gradient(135deg,#1de9b6,#00d4ff)",
  dark: "linear-gradient(135deg,#0a0f1a,#060910)",
  header: "linear-gradient(135deg,#0a0f1a 0%,#0f1a2e 100%)",
};

// ── Initial Server Data ──────────────────────────────────────
const INIT_SERVERS = [
  { id: "wls1", name: "WLS-PROD-01", env: "Production", host: "prod-wls-01.gscoci.in", port: 7001, adminPort: 9002, status: "RUNNING", health: 98, cpu: 42, mem: 68, threads: 120, maxThreads: 200, uptime: "45d 12h 34m", jvmHeap: 72, gcTime: 12, datasources: 4, deployments: 8, version: "14.1.1.0" },
  { id: "wls2", name: "WLS-PROD-02", env: "Production", host: "prod-wls-02.gscoci.in", port: 7001, adminPort: 9002, status: "RUNNING", health: 95, cpu: 38, mem: 61, threads: 98, maxThreads: 200, uptime: "45d 12h 34m", jvmHeap: 65, gcTime: 8, datasources: 4, deployments: 8, version: "14.1.1.0" },
  { id: "wls3", name: "WLS-PROD-03", env: "Production", host: "prod-wls-03.gscoci.in", port: 7001, adminPort: 9002, status: "WARNING", health: 72, cpu: 78, mem: 87, threads: 185, maxThreads: 200, uptime: "12d 3h 10m", jvmHeap: 89, gcTime: 45, datasources: 4, deployments: 8, version: "14.1.1.0" },
  { id: "wls4", name: "WLS-PROD-04", env: "Production", host: "prod-wls-04.gscoci.in", port: 7001, adminPort: 9002, status: "CRITICAL", health: 35, cpu: 94, mem: 96, threads: 198, maxThreads: 200, uptime: "2d 1h 5m", jvmHeap: 98, gcTime: 120, datasources: 2, deployments: 8, version: "14.1.1.0" },
  { id: "wls5", name: "WLS-UAT-01", env: "UAT", host: "uat-wls-01.gscoci.in", port: 7001, adminPort: 9002, status: "RUNNING", health: 90, cpu: 25, mem: 45, threads: 60, maxThreads: 150, uptime: "5d 8h 20m", jvmHeap: 50, gcTime: 5, datasources: 3, deployments: 5, version: "14.1.1.0" },
  { id: "wls6", name: "WLS-DR-01", env: "DR", host: "dr-wls-01.gscoci.in", port: 7001, adminPort: 9002, status: "STANDBY", health: 100, cpu: 5, mem: 20, threads: 10, maxThreads: 200, uptime: "90d 0h 0m", jvmHeap: 30, gcTime: 2, datasources: 4, deployments: 8, version: "14.1.1.0" },
  { id: "wls7", name: "WLS-ADMIN", env: "Production", host: "prod-wls-admin.gscoci.in", port: 7001, adminPort: 9002, status: "RUNNING", health: 99, cpu: 15, mem: 35, threads: 40, maxThreads: 100, uptime: "45d 12h 34m", jvmHeap: 40, gcTime: 3, datasources: 2, deployments: 3, version: "14.1.1.0" },
];

const INIT_ISSUES = [
  { id: "i1", server: "WLS-PROD-04", severity: "CRITICAL", type: "Memory Leak", description: "JVM Heap usage at 98% - OutOfMemoryError imminent", detected: "2 min ago", autoHeal: true, status: "HEALING", steps: ["Triggering GC", "Heap dump captured", "Analyzing memory leak", "Applying patch"] },
  { id: "i2", server: "WLS-PROD-03", severity: "WARNING", type: "Thread Starvation", description: "Thread pool at 92.5% capacity - 185/200 threads active", detected: "15 min ago", autoHeal: true, status: "DETECTED", steps: [] },
  { id: "i3", server: "WLS-PROD-03", severity: "WARNING", type: "High CPU", description: "CPU usage at 78% - above threshold of 75%", detected: "20 min ago", autoHeal: false, status: "OPEN", steps: [] },
  { id: "i4", server: "WLS-PROD-04", severity: "CRITICAL", type: "GC Overhead", description: "GC time exceeding 120ms - application performance degraded", detected: "5 min ago", autoHeal: true, status: "DETECTED", steps: [] },
];

const ROLES = { admin: "Admin", operator: "Operator", viewer: "Viewer", approver: "Change Approver" };
const PASSWORDS = { admin: "WLS@ADMIN", operator: "WLS@OPS", approver: "WLS@APPR" };

const now = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });

function useDB(path) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const r = ref(db, path);
    const unsub = onValue(r, snap => setData(snap.val()));
    return () => unsub();
  }, [path]);
  return data;
}

// ── UI Components ─────────────────────────────────────────────
const Pulse = ({ color, size = 10 }) => (
  <span style={{ position: "relative", display: "inline-block", width: size, height: size }}>
    <style>{`@keyframes pulse-ring{0%{transform:scale(0.5);opacity:1}100%{transform:scale(2.5);opacity:0}}`}</style>
    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color, opacity: 0.4, animation: "pulse-ring 1.5s ease-out infinite" }} />
    <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
  </span>
);

const GlowCard = ({ children, color = C.blue, style = {}, onClick }) => (
  <div onClick={onClick} style={{ background: C.card, border: `1px solid ${color}33`, borderRadius: 16, padding: 20, boxShadow: `0 0 20px ${color}15`, position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default", transition: "all 0.2s", ...style }}
    onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = `0 0 40px ${color}30`)}
    onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = `0 0 20px ${color}15`)}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
    {children}
  </div>
);

const MetricBar = ({ value, max = 100, label, unit = "%", warn = 70, crit = 90 }) => {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct >= crit ? C.danger : pct >= warn ? C.warning : C.success;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11 }}>
        <span style={{ color: C.muted }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{value}{unit}</span>
      </div>
      <div style={{ height: 6, background: C.dim, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s, background 0.3s", boxShadow: `0 0 8px ${color}80` }} />
      </div>
    </div>
  );
};

const Badge = ({ text, color, dot }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${color}20`, color, border: `1px solid ${color}40` }}>
    {dot && <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />}
    {text}
  </span>
);

const Btn = ({ children, grad, color, onClick, style = {}, sm, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding: sm ? "6px 14px" : "10px 22px", background: disabled ? C.dim : grad || `${color || C.blue}22`, border: `1px solid ${disabled ? C.dim : color || C.blue}44`, borderRadius: 10, color: disabled ? C.muted : grad ? "#fff" : color || C.blue, fontWeight: 700, fontSize: sm ? 12 : 13, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s", opacity: disabled ? 0.5 : 1, boxShadow: grad && !disabled ? `0 4px 20px ${color || C.blue}40` : "none", ...style }}>{children}</button>
);

const Inp = ({ value, onChange, placeholder, type = "text", rows, style = {} }) => {
  const base = { width: "100%", padding: "10px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", ...style };
  return rows ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...base, resize: "vertical" }} /> : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={base} />;
};

const Sel = ({ value, onChange, children, style = {} }) => (
  <select value={value} onChange={onChange} style={{ width: "100%", padding: "10px 14px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", ...style }}>{children}</select>
);

const Terminal = ({ lines, height = 200 }) => {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines]);
  return (
    <div ref={ref} style={{ background: "#000", borderRadius: 10, padding: 16, height, overflowY: "auto", fontFamily: "monospace", fontSize: 12, border: `1px solid ${C.green}33` }}>
      {lines.map((l, i) => (
        <div key={i} style={{ marginBottom: 3, color: l.startsWith("[ERROR]") ? C.danger : l.startsWith("[WARN]") ? C.warning : l.startsWith("[SUCCESS]") ? C.success : l.startsWith("[INFO]") ? C.cyan : C.text }}>
          {l}
        </div>
      ))}
      <div style={{ display: "inline-block", width: 8, height: 14, background: C.green, animation: "blink 1s step-end infinite", verticalAlign: "middle" }} />
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
};

const statusColor = (s) => ({ RUNNING: C.green, WARNING: C.warning, CRITICAL: C.danger, STOPPED: C.muted, STANDBY: C.cyan, STARTING: C.blue, STOPPING: C.orange }[s] || C.muted);
const severityColor = (s) => ({ CRITICAL: C.danger, WARNING: C.warning, INFO: C.info, LOW: C.green }[s] || C.muted);

// ── LOGIN ─────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [role, setRole] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const login = () => {
    if (!role) return setErr("Select a role.");
    if (role === "viewer") return onLogin({ name: "Viewer", role: "viewer", initials: "VW" });
    if (pass !== PASSWORDS[role]) return setErr("Incorrect password.");
    const names = { admin: "System Admin", operator: "OPS Engineer", approver: "Change Approver" };
    onLogin({ name: names[role], role, initials: role.slice(0, 2).toUpperCase() });
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", fontFamily: "'DM Sans',sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box}
        @keyframes scan{0%{top:0}100%{top:100%}}
        @keyframes flicker{0%,100%{opacity:1}92%{opacity:0.8}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes rotate{to{transform:rotate(360deg)}}
      `}</style>

      {/* Animated Background */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", zIndex: 0 }}>
        {[["#C74634","8%","15%","400px"],["#1e90ff","75%","65%","350px"],["#00d4ff","45%","85%","250px"]].map(([c,l,t,s],i)=>(
          <div key={i} style={{ position:"absolute",left:l,top:t,width:s,height:s,background:c,borderRadius:"50%",filter:"blur(120px)",opacity:0.06 }}/>
        ))}
        {/* Grid lines */}
        <div style={{ position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.border}22 1px,transparent 1px),linear-gradient(90deg,${C.border}22 1px,transparent 1px)`,backgroundSize:"40px 40px",opacity:0.4 }}/>
      </div>

      {/* Left Panel */}
      <div style={{ width: 480, background: "linear-gradient(180deg,#0a0f1a,#060910)", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", padding: 48, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <div style={{ width: 56, height: 56, background: G.red, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, boxShadow: `0 0 30px ${C.red}60` }}>⚡</div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: C.text }}>WebLogic Control</div>
              <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>GSC · Oracle Cloud Infrastructure</div>
            </div>
          </div>
        </div>

        {/* Live Clock */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, letterSpacing: 1 }}>SYSTEM TIME</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: C.cyan }}>{time.toLocaleTimeString()}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{time.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        </div>

        {/* Server Quick Status */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, letterSpacing: 1 }}>PRODUCTION SERVERS</div>
          {INIT_SERVERS.filter(s => s.env === "Production").map(s => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Pulse color={statusColor(s.status)} size={8} />
              <span style={{ flex: 1, fontSize: 12, color: C.text, fontFamily: "monospace" }}>{s.name}</span>
              <Badge text={s.status} color={statusColor(s.status)} />
            </div>
          ))}
        </div>

        {/* Critical alerts */}
        {INIT_ISSUES.filter(i => i.severity === "CRITICAL").length > 0 && (
          <div style={{ background: `${C.danger}15`, border: `1px solid ${C.danger}33`, borderRadius: 14, padding: "14px 20px" }}>
            <div style={{ fontSize: 11, color: C.danger, marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>⚠ ACTIVE CRITICAL ALERTS</div>
            {INIT_ISSUES.filter(i => i.severity === "CRITICAL").map(i => (
              <div key={i.id} style={{ fontSize: 12, color: C.text, marginBottom: 6 }}>
                <span style={{ color: C.danger }}>●</span> {i.server}: {i.type}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel - Login */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 48, position: "relative", zIndex: 1 }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, color: C.text, margin: "0 0 8px" }}>Secure Access</h1>
          <p style={{ color: C.muted, margin: "0 0 36px", fontSize: 14 }}>WebLogic Production Management Platform</p>

          <GlowCard color={C.blue} style={{ padding: 32 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: C.muted, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>Access Role</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["admin","🛡️","System Admin","Full control"],["operator","⚙️","OPS Engineer","Operations"],["approver","✅","Change Approver","Approvals"],["viewer","👁️","Viewer","Read only"]].map(([r,icon,label,sub])=>(
                  <button key={r} onClick={() => { setRole(r); setErr(""); setPass(""); }} style={{ padding: "14px 10px", background: role===r?`${C.blue}20`:C.card2, border: `1px solid ${role===r?C.blue:C.border}`, borderRadius: 12, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: role===r?C.blue:C.text }}>{label}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {role && role !== "viewer" && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, letterSpacing: 1, textTransform: "uppercase" }}>Password</div>
                <Inp value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} placeholder="Enter secure password" type="password" />
                <div style={{ fontSize: 11, color: C.dim, marginTop: 6, fontFamily: "monospace" }}>
                  Admin: WLS@ADMIN · Ops: WLS@OPS · Approver: WLS@APPR
                </div>
              </div>
            )}

            {err && <div style={{ color: C.danger, fontSize: 12, marginBottom: 12 }}>⚠ {err}</div>}
            <Btn grad={G.red} color={C.red} onClick={login} style={{ width: "100%", padding: "14px" }}>
              🔐 Authenticate & Enter
            </Btn>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  if (!user) return <Login onLogin={setUser} />;
  return <MainApp user={user} onLogout={() => setUser(null)} />;
}

function MainApp({ user, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [servers, setServers] = useState(INIT_SERVERS);
  const [issues, setIssues] = useState(INIT_ISSUES);

  const approvals = useDB("approvals");
  const auditLogs = useDB("auditLogs");

  const approvalList = approvals ? Object.entries(approvals).map(([k,v])=>({id:k,...v})) : [];
  const auditList = auditLogs ? Object.entries(auditLogs).map(([k,v])=>({id:k,...v})) : [];

  // Simulate live metrics
  useEffect(() => {
    const t = setInterval(() => {
      setServers(prev => prev.map(s => {
        if (s.status === "STOPPED" || s.status === "STANDBY") return s;
        const drift = (v, range, min, max) => Math.min(max, Math.max(min, v + (Math.random() - 0.5) * range));
        return { ...s, cpu: Math.round(drift(s.cpu, 4, 1, 99)), mem: Math.round(drift(s.mem, 2, 10, 99)), threads: Math.round(drift(s.threads, 5, 1, s.maxThreads)), jvmHeap: Math.round(drift(s.jvmHeap, 3, 10, 99)) };
      }));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  // Auto-healing simulation
  useEffect(() => {
    const t = setInterval(() => {
      setIssues(prev => prev.map(i => {
        if (i.autoHeal && i.status === "DETECTED") return { ...i, status: "HEALING" };
        if (i.autoHeal && i.status === "HEALING" && Math.random() > 0.7) return { ...i, status: "RESOLVED" };
        return i;
      }));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const criticalCount = servers.filter(s => s.status === "CRITICAL").length;
  const pendingApprovals = approvalList.filter(a => a.status === "PENDING").length;
  const activeIssues = issues.filter(i => i.status !== "RESOLVED").length;

  const TABS = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "servers", label: "🖥️ Servers" },
    { id: "operations", label: "⚙️ Operations" },
    { id: "issues", label: `🔥 Issues ${activeIssues > 0 ? `(${activeIssues})` : ""}` },
    { id: "autohealing", label: "🔄 Auto-Heal" },
    { id: "approvals", label: `✅ Approvals ${pendingApprovals > 0 ? `(${pendingApprovals})` : ""}` },
    { id: "automation", label: "🤖 Automation" },
    { id: "audit", label: "📋 Audit Log" },
  ].filter(t => {
    if (user.role === "viewer") return ["dashboard", "servers", "issues", "audit"].includes(t.id);
    if (user.role === "approver") return ["dashboard", "approvals", "audit"].includes(t.id);
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans',sans-serif", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        input,textarea,select,button{font-family:'DM Sans',sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      `}</style>

      {/* Header */}
      <header style={{ background: G.header, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100, boxShadow: `0 2px 20px rgba(0,0,0,0.5)` }}>
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 38, height: 38, background: G.red, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 0 20px ${C.red}60` }}>⚡</div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 17, fontWeight: 800, color: C.text, lineHeight: 1 }}>WebLogic Control Platform</div>
                <div style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>GSC · Oracle Cloud Infrastructure</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {criticalCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${C.danger}20`, border: `1px solid ${C.danger}44`, borderRadius: 20, padding: "5px 12px" }}>
                  <Pulse color={C.danger} size={8} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.danger }}>{criticalCount} CRITICAL</span>
                </div>
              )}
              {pendingApprovals > 0 && (
                <div style={{ background: `${C.warning}20`, border: `1px solid ${C.warning}44`, borderRadius: 20, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: C.warning }}>
                  {pendingApprovals} Pending Approval
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 14px" }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", background: G.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 }}>{user.initials}</div>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</span>
                <Badge text={ROLES[user.role]} color={C.blue} />
              </div>
              <Btn color={C.red} onClick={onLogout} sm>Sign Out</Btn>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ maxWidth: 1600, margin: "0 auto", padding: "0 24px", display: "flex", gap: 0, overflowX: "auto", borderTop: `1px solid ${C.border}` }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 18px", background: "transparent", border: "none", borderBottom: tab===t.id?`2px solid ${C.red}`:"2px solid transparent", color: tab===t.id?C.red:C.muted, cursor: "pointer", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", transition: "all 0.2s", letterSpacing: 0.3 }}>{t.label}</button>
          ))}
        </div>
      </header>

      <main style={{ maxWidth: 1600, margin: "0 auto", padding: "24px", animation: "slideIn 0.3s ease" }}>
        {tab === "dashboard" && <DashboardTab servers={servers} issues={issues} approvalList={approvalList} auditList={auditList} />}
        {tab === "servers" && <ServersTab servers={servers} user={user} />}
        {tab === "operations" && <OperationsTab servers={servers} user={user} approvalList={approvalList} />}
        {tab === "issues" && <IssuesTab issues={issues} setIssues={setIssues} servers={servers} user={user} />}
        {tab === "autohealing" && <AutoHealTab servers={servers} issues={issues} user={user} />}
        {tab === "approvals" && <ApprovalsTab approvalList={approvalList} user={user} servers={servers} />}
        {tab === "automation" && <AutomationTab user={user} servers={servers} />}
        {tab === "audit" && <AuditTab auditList={auditList} />}
      </main>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────
function DashboardTab({ servers, issues, approvalList, auditList }) {
  const running = servers.filter(s => s.status === "RUNNING").length;
  const critical = servers.filter(s => s.status === "CRITICAL").length;
  const warning = servers.filter(s => s.status === "WARNING").length;
  const activeIssues = issues.filter(i => i.status !== "RESOLVED").length;
  const healing = issues.filter(i => i.status === "HEALING").length;
  const avgCpu = Math.round(servers.filter(s=>s.status!=="STOPPED"&&s.status!=="STANDBY").reduce((a,s)=>a+s.cpu,0)/servers.filter(s=>s.status!=="STOPPED"&&s.status!=="STANDBY").length);
  const avgMem = Math.round(servers.filter(s=>s.status!=="STOPPED"&&s.status!=="STANDBY").reduce((a,s)=>a+s.mem,0)/servers.filter(s=>s.status!=="STOPPED"&&s.status!=="STANDBY").length);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: C.text, margin: "0 0 4px" }}>Production Overview</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Pulse color={C.green} size={8} />
          <span style={{ fontSize: 12, color: C.muted }}>Live monitoring · Updates every 3 seconds</span>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { label: "RUNNING", value: running, total: servers.length, color: C.green, icon: "▶" },
          { label: "CRITICAL", value: critical, color: C.danger, icon: "🔴" },
          { label: "WARNING", value: warning, color: C.warning, icon: "⚠" },
          { label: "ACTIVE ISSUES", value: activeIssues, color: C.orange, icon: "🔥" },
          { label: "AUTO-HEALING", value: healing, color: C.cyan, icon: "🔄" },
          { label: "AVG CPU", value: `${avgCpu}%`, color: avgCpu>75?C.danger:avgCpu>60?C.warning:C.green, icon: "⚡" },
          { label: "AVG MEMORY", value: `${avgMem}%`, color: avgMem>80?C.danger:avgMem>65?C.warning:C.green, icon: "💾" },
          { label: "PENDING OPS", value: (approvalList||[]).filter(a=>a.status==="PENDING").length, color: C.purple, icon: "⏳" },
        ].map(s => (
          <GlowCard key={s.label} color={s.color} style={{ padding: "18px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}{s.total ? <span style={{ fontSize: 14, color: C.muted }}>/{s.total}</span> : ""}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 6, letterSpacing: 1.5 }}>{s.label}</div>
              </div>
              <span style={{ fontSize: 20, opacity: 0.5 }}>{s.icon}</span>
            </div>
          </GlowCard>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        {/* Server Health Grid */}
        <GlowCard color={C.blue}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 15, display: "flex", justifyContent: "space-between" }}>
            <span>🖥️ Server Health Matrix</span>
            <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>Live</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {servers.map(s => (
              <div key={s.id} style={{ background: C.card2, borderRadius: 12, padding: 14, border: `1px solid ${statusColor(s.status)}33` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Pulse color={statusColor(s.status)} size={8} />
                    <span style={{ fontWeight: 700, fontSize: 12, fontFamily: "monospace" }}>{s.name}</span>
                  </div>
                  <Badge text={s.status} color={statusColor(s.status)} />
                </div>
                <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 6 }}>
                  <MetricBar value={s.cpu} label="CPU" warn={70} crit={85} />
                  <MetricBar value={s.mem} label="MEM" warn={75} crit={90} />
                  <MetricBar value={s.jvmHeap} label="JVM" warn={80} crit={92} />
                </div>
              </div>
            ))}
          </div>
        </GlowCard>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Active Issues */}
          <GlowCard color={C.danger}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 14, fontSize: 15 }}>🔥 Active Issues</div>
            {issues.filter(i => i.status !== "RESOLVED").length === 0
              ? <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "16px 0" }}>✅ All systems healthy</div>
              : issues.filter(i => i.status !== "RESOLVED").map(i => (
                <div key={i.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: severityColor(i.severity) }}>{i.server}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{i.type}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Badge text={i.severity} color={severityColor(i.severity)} />
                    {i.status === "HEALING" && <span style={{ fontSize: 16, animation: "spin 1s linear infinite", display: "inline-block" }}>🔄</span>}
                  </div>
                </div>
              ))}
          </GlowCard>

          {/* Recent Audit */}
          <GlowCard color={C.purple}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 14, fontSize: 15 }}>📋 Recent Activity</div>
            {auditList.length === 0
              ? <div style={{ color: C.muted, fontSize: 13 }}>No activity yet.</div>
              : [...auditList].reverse().slice(0, 5).map(a => (
                <div key={a.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{a.action}</div>
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{a.user} · {a.time}</div>
                </div>
              ))}
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

// ── SERVERS TAB ───────────────────────────────────────────────
function ServersTab({ servers, user }) {
  const [selected, setSelected] = useState(null);
  const sel = selected ? servers.find(s => s.id === selected) : null;

  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>🖥️ WebLogic Servers</h2>
      <p style={{ color: C.muted, marginBottom: 24, fontSize: 13 }}>{servers.length} servers monitored · Live metrics</p>

      <div style={{ display: "grid", gridTemplateColumns: sel ? "1fr 400px" : "1fr", gap: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 14, alignContent: "start" }}>
          {servers.map(s => (
            <GlowCard key={s.id} color={statusColor(s.status)} onClick={() => setSelected(selected === s.id ? null : s.id)} style={{ cursor: "pointer", padding: "18px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Pulse color={statusColor(s.status)} size={8} />
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 14 }}>{s.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>{s.host}:{s.port}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                  <Badge text={s.status} color={statusColor(s.status)} dot />
                  <Badge text={s.env} color={s.env==="Production"?C.red:s.env==="UAT"?C.blue:C.teal} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[["CPU", s.cpu+"%", s.cpu>85?C.danger:s.cpu>70?C.warning:C.green],["MEM",s.mem+"%",s.mem>90?C.danger:s.mem>75?C.warning:C.green],["JVM",s.jvmHeap+"%",s.jvmHeap>92?C.danger:s.jvmHeap>80?C.warning:C.green],["THR",`${s.threads}/${s.maxThreads}`,s.threads/s.maxThreads>0.9?C.danger:s.threads/s.maxThreads>0.75?C.warning:C.green]].map(([l,v,c])=>(
                  <div key={l} style={{ background: C.bg, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: c }}>{v}</div>
                    <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: C.muted }}>⏱ {s.uptime}</span>
                <span style={{ fontSize: 11, color: C.muted }}>· {s.deployments} apps</span>
                <span style={{ fontSize: 11, color: C.muted }}>· {s.datasources} datasources</span>
                <span style={{ fontSize: 11, color: C.muted }}>· WLS {s.version}</span>
              </div>
            </GlowCard>
          ))}
        </div>

        {sel && (
          <GlowCard color={statusColor(sel.status)} style={{ height: "fit-content", position: "sticky", top: 100 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18 }}>{sel.name}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontFamily: "monospace" }}>{sel.host}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <MetricBar value={sel.cpu} label="CPU Usage" warn={70} crit={85} />
              <MetricBar value={sel.mem} label="Memory" warn={75} crit={90} />
              <MetricBar value={sel.jvmHeap} label="JVM Heap" warn={80} crit={92} />
              <MetricBar value={sel.gcTime} max={200} label="GC Time (ms)" warn={50} crit={100} unit="ms" />
              <MetricBar value={sel.threads} max={sel.maxThreads} label={`Threads (max ${sel.maxThreads})`} warn={75} crit={90} unit="" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["Status", sel.status],["Environment",sel.env],["Port",sel.port],["Admin Port",sel.adminPort],["Deployments",sel.deployments],["Datasources",sel.datasources],["WLS Version",sel.version],["Uptime",sel.uptime]].map(([l,v])=>(
                <div key={l} style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>{l}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: l==="Uptime"||l==="WLS Version"?"monospace":"inherit" }}>{v}</div>
                </div>
              ))}
            </div>
          </GlowCard>
        )}
      </div>
    </div>
  );
}

// ── OPERATIONS TAB ────────────────────────────────────────────
function OperationsTab({ servers, user, approvalList }) {
  const [form, setForm] = useState({ server: "", operation: "RESTART", reason: "", priority: "Normal", scheduledFor: "now" });
  const [submitted, setSubmitted] = useState(false);
  const [termLines, setTermLines] = useState(["[INFO] WebLogic Control Platform Ready", "[INFO] Awaiting operation request..."]);

  const canExecuteDirect = user.role === "admin";

  const submitOp = () => {
    if (!form.server || !form.reason.trim()) return;
    const logEntry = { action: `${form.operation} requested for ${form.server}`, user: user.name, server: form.server, operation: form.operation, reason: form.reason, status: canExecuteDirect ? "APPROVED" : "PENDING", priority: form.priority, time: now(), requestedBy: user.name };

    if (canExecuteDirect) {
      push(ref(db, "auditLogs"), logEntry);
      simulateOperation(form.server, form.operation);
    } else {
      push(ref(db, "approvals"), logEntry);
      setTermLines(prev => [...prev, `[INFO] Operation ${form.operation} on ${form.server} submitted for approval`, `[INFO] Approval request sent to Change Approvers`, `[WARN] Awaiting approval before execution...`]);
    }
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const simulateOperation = (serverName, op) => {
    const lines = {
      RESTART: [`[INFO] Initiating ${op} on ${serverName}...`, `[INFO] Sending graceful shutdown signal...`, `[WARN] Waiting for active requests to complete...`, `[INFO] Server ${serverName} stopped successfully`, `[INFO] Starting WebLogic Server...`, `[INFO] Loading configurations...`, `[INFO] Initializing datasources...`, `[INFO] Deploying applications...`, `[SUCCESS] Server ${serverName} is RUNNING ✓`],
      STOP: [`[INFO] Initiating STOP on ${serverName}...`, `[WARN] Draining active connections...`, `[INFO] Stopping managed server...`, `[SUCCESS] Server ${serverName} STOPPED successfully`],
      START: [`[INFO] Initiating START on ${serverName}...`, `[INFO] Loading NodeManager...`, `[INFO] Starting server process...`, `[INFO] Deploying applications...`, `[SUCCESS] Server ${serverName} is RUNNING ✓`],
      HEAPDUMP: [`[INFO] Triggering Heap Dump on ${serverName}...`, `[INFO] Capturing JVM heap snapshot...`, `[INFO] Writing to /logs/heapdump_${Date.now()}.hprof`, `[SUCCESS] Heap dump captured successfully`],
      THREADDUMP: [`[INFO] Triggering Thread Dump on ${serverName}...`, `[INFO] Capturing thread stack traces...`, `[SUCCESS] Thread dump written to logs`],
    };
    const ops = lines[op] || [`[INFO] Executing ${op} on ${serverName}...`, `[SUCCESS] Operation completed`];
    ops.forEach((line, i) => setTimeout(() => setTermLines(prev => [...prev, line]), i * 800));
  };

  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>⚙️ Server Operations</h2>
      <p style={{ color: C.muted, marginBottom: 24, fontSize: 13 }}>
        {canExecuteDirect ? "Admin mode — direct execution enabled" : "Operations require Change Approver approval"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Operation Form */}
        <GlowCard color={C.blue}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 20, fontSize: 15 }}>Request Operation</div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Target Server</div>
            <Sel value={form.server} onChange={e => setForm(f => ({ ...f, server: e.target.value }))}>
              <option value="">Select server…</option>
              {servers.map(s => <option key={s.id} value={s.name}>{s.name} [{s.status}]</option>)}
            </Sel>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Operation Type</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[["RESTART","🔄",C.blue],["STOP","⏹️",C.danger],["START","▶️",C.green],["HEAPDUMP","💾",C.purple],["THREADDUMP","📋",C.teal],["PATCH","🔧",C.orange]].map(([op,icon,color])=>(
                <button key={op} onClick={() => setForm(f => ({ ...f, operation: op }))} style={{ padding: "10px 8px", background: form.operation===op?`${color}25`:C.card2, border: `1px solid ${form.operation===op?color:C.border}`, borderRadius: 10, cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: form.operation===op?color:C.muted }}>{op}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Priority</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["Low","Normal","High","Emergency"].map(p => (
                <button key={p} onClick={() => setForm(f => ({ ...f, priority: p }))} style={{ flex: 1, padding: "8px 4px", background: form.priority===p?`${p==="Emergency"?C.danger:p==="High"?C.warning:C.blue}22`:C.card2, border: `1px solid ${form.priority===p?C.blue:C.border}`, borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, color: form.priority===p?C.blue:C.muted }}>{p}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Change Reason *</div>
            <Inp value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Describe the reason for this operation…" rows={3} />
          </div>

          {!canExecuteDirect && (
            <div style={{ background: `${C.warning}15`, border: `1px solid ${C.warning}33`, borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 12, color: C.warning }}>
              ⚠️ This operation will be sent for approval before execution. Ensure you have a valid change ticket.
            </div>
          )}

          <Btn grad={canExecuteDirect ? G.green : G.orange} color={canExecuteDirect ? C.green : C.orange} onClick={submitOp} style={{ width: "100%", padding: "12px" }} disabled={!form.server || !form.reason.trim()}>
            {submitted ? "✅ Submitted!" : canExecuteDirect ? "⚡ Execute Immediately" : "📤 Submit for Approval"}
          </Btn>
        </GlowCard>

        {/* Terminal Output */}
        <div>
          <GlowCard color={C.green} style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 14, fontSize: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>🖥️ Operations Console</span>
              <button onClick={() => setTermLines(["[INFO] Console cleared.", "[INFO] Ready."])} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.muted, cursor: "pointer", fontSize: 11, padding: "3px 8px" }}>Clear</button>
            </div>
            <Terminal lines={termLines} height={280} />
          </GlowCard>

          {/* Pending Operations */}
          <GlowCard color={C.warning}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 14, fontSize: 15 }}>⏳ Pending Approvals</div>
            {(approvalList||[]).filter(a=>a.status==="PENDING").length === 0
              ? <div style={{ color: C.muted, fontSize: 13 }}>No pending operations.</div>
              : (approvalList||[]).filter(a=>a.status==="PENDING").map(a=>(
                <div key={a.id} style={{ background: C.card2, borderRadius: 10, padding: "10px 14px", marginBottom: 10, borderLeft: `3px solid ${C.warning}` }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{a.operation} → {a.server}</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>By {a.requestedBy} · {a.time}</div>
                  <div style={{ fontSize: 11, color: C.text, marginTop: 4 }}>{a.reason}</div>
                </div>
              ))}
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

// ── ISSUES TAB ────────────────────────────────────────────────
function IssuesTab({ issues, setIssues, servers, user }) {
  const [selected, setSelected] = useState(null);
  const [termLines, setTermLines] = useState(["[INFO] Troubleshoot console ready...", "[INFO] Select an issue to begin analysis."]);
  const [filter, setFilter] = useState("ALL");

  const troubleshoot = (issue) => {
    const steps = {
      "Memory Leak": ["[INFO] Analyzing JVM heap...", "[INFO] Running gc analysis...", "[WARN] Found memory leak in: com.example.SessionCache", "[INFO] Triggering System.gc()...", "[INFO] Capturing heap dump...", "[INFO] Analyzing retained objects...", "[WARN] 2.4GB retained by SessionCache.sessions", "[SUCCESS] Recommendation: Increase -Xmx, review session timeout", "[INFO] Auto-patch available — run HEAPDUMP + restart"],
      "Thread Starvation": ["[INFO] Analyzing thread pool...", "[INFO] Dumping active threads...", "[WARN] 45 threads stuck in BLOCKED state", "[INFO] Identifying lock contention...", "[WARN] Lock held by: TransactionManager.commit()", "[INFO] Killing stuck threads...", "[SUCCESS] Thread pool freed — recommend DB connection review"],
      "High CPU": ["[INFO] Profiling CPU usage...", "[INFO] Sampling thread stacks...", "[WARN] Hot method: XMLParser.parse() consuming 62% CPU", "[INFO] Checking for infinite loops...", "[SUCCESS] Recommendation: Upgrade XML parser lib, add caching"],
      "GC Overhead": ["[INFO] Analyzing GC logs...", "[WARN] GC running every 50ms (too frequent)", "[INFO] Heap fragmentation detected...", "[SUCCESS] Recommendation: Switch to G1GC, increase heap size"],
    };
    const s = steps[issue.type] || ["[INFO] Running diagnostics...", "[INFO] Checking logs...", "[SUCCESS] Analysis complete — check recommendations"];
    setTermLines(["[INFO] Starting troubleshoot for: " + issue.type + " on " + issue.server]);
    s.forEach((l, i) => setTimeout(() => setTermLines(prev => [...prev, l]), i * 700));
    setSelected(issue.id);
  };

  const resolve = (id) => setIssues(prev => prev.map(i => i.id === id ? { ...i, status: "RESOLVED" } : i));
  const filtered = filter === "ALL" ? issues : filter === "ACTIVE" ? issues.filter(i=>i.status!=="RESOLVED") : issues.filter(i=>i.severity===filter);

  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>🔥 Issues & Troubleshooting</h2>
      <p style={{ color: C.muted, marginBottom: 24, fontSize: 13 }}>AI-powered issue detection with automated troubleshooting</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["ALL","ACTIVE","CRITICAL","WARNING"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:"6px 14px",borderRadius:20,border:`1px solid ${filter===f?C.red:C.border}`,background:filter===f?`${C.red}20`:"transparent",color:filter===f?C.red:C.muted,fontSize:12,cursor:"pointer",fontWeight:700 }}>{f}</button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(i => (
            <GlowCard key={i.id} color={severityColor(i.severity)} onClick={() => troubleshoot(i)} style={{ cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: severityColor(i.severity) }}>{i.server}</span>
                    <Badge text={i.severity} color={severityColor(i.severity)} />
                    <Badge text={i.type} color={C.blue} />
                  </div>
                  <p style={{ color: C.muted, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{i.description}</p>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                  {i.status === "HEALING" && <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: 18 }}>🔄</span>}
                  <Badge text={i.status} color={i.status==="RESOLVED"?C.green:i.status==="HEALING"?C.cyan:i.status==="DETECTED"?C.warning:C.danger} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: C.muted }}>🕐 Detected {i.detected}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  {i.autoHeal && <Badge text="AUTO-HEAL ENABLED" color={C.cyan} />}
                  {i.status !== "RESOLVED" && (
                    <button onClick={e => { e.stopPropagation(); resolve(i.id); }} style={{ padding: "4px 10px", background: `${C.green}20`, border: `1px solid ${C.green}44`, borderRadius: 8, color: C.green, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>Mark Resolved</button>
                  )}
                </div>
              </div>
            </GlowCard>
          ))}
        </div>

        <GlowCard color={C.green} style={{ height: "fit-content", position: "sticky", top: 100 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 14, fontSize: 15, display: "flex", justifyContent: "space-between" }}>
            <span>🔍 Troubleshoot Console</span>
            <span style={{ fontSize: 11, color: C.muted }}>Click issue to analyze</span>
          </div>
          <Terminal lines={termLines} height={400} />
        </GlowCard>
      </div>
    </div>
  );
}

// ── AUTO-HEAL TAB ─────────────────────────────────────────────
function AutoHealTab({ servers, issues, user }) {
  const [policies, setPolicies] = useState([
    { id: 1, name: "JVM Heap Critical", trigger: "JVM Heap > 95%", action: "Force GC + Heap Dump + Alert", enabled: true, executions: 12, lastRun: "2 min ago", server: "ALL" },
    { id: 2, name: "Thread Starvation", trigger: "Threads > 90% capacity", action: "Kill stuck threads + Alert", enabled: true, executions: 3, lastRun: "15 min ago", server: "ALL" },
    { id: 3, name: "Memory Leak Detection", trigger: "Memory growth > 5%/hour", action: "Heap dump + Analyze + Restart", enabled: true, executions: 1, lastRun: "1 hour ago", server: "PROD" },
    { id: 4, name: "CPU Spike Protection", trigger: "CPU > 90% for 5 min", action: "Thread dump + Scale out", enabled: false, executions: 0, lastRun: "Never", server: "ALL" },
    { id: 5, name: "GC Overhead Limit", trigger: "GC time > 100ms", action: "Tune GC params + Notify", enabled: true, executions: 7, lastRun: "30 min ago", server: "PROD" },
    { id: 6, name: "Datasource Recovery", trigger: "DS connection failures > 5", action: "Reconnect datasource pool", enabled: true, executions: 2, lastRun: "3 hours ago", server: "ALL" },
  ]);

  const toggle = (id) => setPolicies(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));

  const healingNow = issues.filter(i => i.status === "HEALING");

  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>🔄 Auto-Healing Engine</h2>
      <p style={{ color: C.muted, marginBottom: 24, fontSize: 13 }}>Automated detection and remediation of WebLogic issues</p>

      {/* Active Healing */}
      {healingNow.length > 0 && (
        <GlowCard color={C.cyan} style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 14, fontSize: 15, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: 20 }}>🔄</span>
            Auto-Healing in Progress
          </div>
          {healingNow.map(i => (
            <div key={i.id} style={{ background: C.card2, borderRadius: 12, padding: "14px 16px", marginBottom: 10, border: `1px solid ${C.cyan}44` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontWeight: 700, color: C.cyan, fontFamily: "monospace" }}>{i.server} — {i.type}</div>
                <Badge text="HEALING" color={C.cyan} />
              </div>
              <div style={{ height: 6, background: C.dim, borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: "100%", width: "65%", background: G.teal, borderRadius: 3, animation: "progress 2s ease-in-out infinite" }} />
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>Analyzing → Applying fix → Verifying…</div>
            </div>
          ))}
        </GlowCard>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          ["Active Policies", policies.filter(p=>p.enabled).length, C.green],
          ["Total Executions", policies.reduce((a,p)=>a+p.executions,0), C.blue],
          ["Healing Now", healingNow.length, C.cyan],
          ["Issues Resolved", issues.filter(i=>i.status==="RESOLVED").length, C.green],
        ].map(([l,v,c])=>(
          <GlowCard key={l} color={c} style={{ padding: "16px 18px" }}>
            <div style={{ fontFamily: "monospace", fontSize: 28, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 6, letterSpacing: 1 }}>{l.toUpperCase()}</div>
          </GlowCard>
        ))}
      </div>

      {/* Policies */}
      <GlowCard color={C.purple}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 20, fontSize: 15 }}>🤖 Healing Policies</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {policies.map(p => (
            <div key={p.id} style={{ background: C.card2, borderRadius: 12, padding: "16px 18px", border: `1px solid ${p.enabled?C.purple+"44":C.border}`, display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</span>
                  <Badge text={p.server} color={C.blue} />
                  {p.enabled && <Badge text="ACTIVE" color={C.green} dot />}
                </div>
                <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
                  <span style={{ color: C.warning }}>⚡ Trigger: {p.trigger}</span>
                  <span style={{ color: C.cyan }}>🔧 Action: {p.action}</span>
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>
                  {p.executions} executions · Last run: {p.lastRun}
                </div>
              </div>
              {(user.role === "admin" || user.role === "operator") && (
                <div onClick={() => toggle(p.id)} style={{ width: 48, height: 26, borderRadius: 13, background: p.enabled ? C.green : C.dim, cursor: "pointer", position: "relative", transition: "all 0.3s", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 3, left: p.enabled ? 24 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.3)" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

// ── APPROVALS TAB ─────────────────────────────────────────────
function ApprovalsTab({ approvalList, user, servers }) {
  const [termLines, setTermLines] = useState(["[INFO] Approval console ready..."]);

  const approve = (item) => {
    update(ref(db, `approvals/${item.id}`), { status: "APPROVED", approvedBy: user.name, approvedAt: now() });
    push(ref(db, "auditLogs"), { action: `APPROVED: ${item.operation} on ${item.server}`, user: user.name, time: now() });
    setTermLines(prev => [...prev, `[SUCCESS] Operation ${item.operation} APPROVED by ${user.name}`, `[INFO] Executing ${item.operation} on ${item.server}...`, `[INFO] Operation queued for execution...`]);
  };

  const reject = (item) => {
    update(ref(db, `approvals/${item.id}`), { status: "REJECTED", rejectedBy: user.name, rejectedAt: now() });
    push(ref(db, "auditLogs"), { action: `REJECTED: ${item.operation} on ${item.server}`, user: user.name, time: now() });
    setTermLines(prev => [...prev, `[WARN] Operation ${item.operation} REJECTED by ${user.name}`]);
  };

  const canApprove = user.role === "admin" || user.role === "approver";
  const pending = (approvalList||[]).filter(a => a.status === "PENDING");
  const history = (approvalList||[]).filter(a => a.status !== "PENDING");

  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>✅ Change Approvals</h2>
      <p style={{ color: C.muted, marginBottom: 24, fontSize: 13 }}>Review and approve server operation requests</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: 20 }}>
        <div>
          {/* Pending */}
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 14, fontSize: 15, color: C.warning }}>
            ⏳ Pending Approvals ({pending.length})
          </div>
          {pending.length === 0
            ? <GlowCard color={C.green} style={{ textAlign: "center", padding: 32, marginBottom: 20 }}><div style={{ color: C.muted }}>✅ No pending approvals</div></GlowCard>
            : pending.map(a => (
              <GlowCard key={a.id} color={C.warning} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16 }}>{a.operation}</span>
                      <Badge text={a.server} color={C.blue} />
                      <Badge text={a.priority || "Normal"} color={a.priority==="Emergency"?C.danger:a.priority==="High"?C.warning:C.blue} />
                    </div>
                    <p style={{ color: C.muted, fontSize: 13, margin: "0 0 8px", lineHeight: 1.5 }}>{a.reason}</p>
                    <div style={{ fontSize: 11, color: C.muted }}>Requested by <strong style={{ color: C.text }}>{a.requestedBy}</strong> · {a.time}</div>
                  </div>
                </div>
                {canApprove && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <Btn grad={G.green} color={C.green} onClick={() => approve(a)} style={{ flex: 1 }}>✅ Approve & Execute</Btn>
                    <Btn color={C.danger} onClick={() => reject(a)} style={{ flex: 1 }}>❌ Reject</Btn>
                  </div>
                )}
              </GlowCard>
            ))}

          {/* History */}
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 14, fontSize: 15, color: C.muted, marginTop: 24 }}>
            📜 Approval History
          </div>
          {history.length === 0
            ? <div style={{ color: C.muted, fontSize: 13 }}>No history yet.</div>
            : history.map(a => (
              <div key={a.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10, borderLeft: `3px solid ${a.status==="APPROVED"?C.green:C.danger}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{a.operation} → {a.server}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{a.requestedBy} · {a.time}</div>
                  </div>
                  <Badge text={a.status} color={a.status==="APPROVED"?C.green:C.danger} />
                </div>
              </div>
            ))}
        </div>

        <GlowCard color={C.green} style={{ height: "fit-content", position: "sticky", top: 100 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 14, fontSize: 15 }}>🖥️ Execution Console</div>
          <Terminal lines={termLines} height={350} />
        </GlowCard>
      </div>
    </div>
  );
}

// ── AUTOMATION TAB ────────────────────────────────────────────
function AutomationTab({ user, servers }) {
  const [rules] = useState([
    { id: 1, name: "Nightly Restart", schedule: "02:00 AM Daily", servers: "ALL PROD", action: "Rolling Restart", nextRun: "Tonight 02:00", enabled: true, lastStatus: "SUCCESS" },
    { id: 2, name: "Weekly Health Report", schedule: "Monday 09:00", servers: "ALL", action: "Generate & Email Report", nextRun: "Monday 09:00", enabled: true, lastStatus: "SUCCESS" },
    { id: 3, name: "Log Rotation", schedule: "Every 6 Hours", servers: "ALL", action: "Rotate + Archive Logs", nextRun: "In 2 hours", enabled: true, lastStatus: "SUCCESS" },
    { id: 4, name: "Heap Monitoring", schedule: "Every 5 min", servers: "ALL PROD", action: "Check + Alert if > 85%", nextRun: "In 3 min", enabled: true, lastStatus: "RUNNING" },
    { id: 5, name: "DR Failover Test", schedule: "1st Sunday Monthly", servers: "DR", action: "Failover simulation", nextRun: "1st Sunday", enabled: false, lastStatus: "PENDING" },
    { id: 6, name: "Security Scan", schedule: "Weekly Sunday", servers: "ALL", action: "Vulnerability scan + Report", nextRun: "Sunday 01:00", enabled: true, lastStatus: "SUCCESS" },
  ]);

  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>🤖 Automation Rules</h2>
      <p style={{ color: C.muted, marginBottom: 24, fontSize: 13 }}>Scheduled tasks and automated workflows for WebLogic management</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(420px,1fr))", gap: 16 }}>
        {rules.map(r => (
          <GlowCard key={r.id} color={r.enabled?C.blue:C.muted} style={{ padding: "18px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: C.muted }}>🕐 {r.schedule}</div>
              </div>
              <div style={{ display: "flex", flex: "column", gap: 6, alignItems: "flex-end" }}>
                <Badge text={r.enabled?"ACTIVE":"DISABLED"} color={r.enabled?C.green:C.muted} dot />
                <Badge text={r.lastStatus} color={r.lastStatus==="SUCCESS"?C.green:r.lastStatus==="RUNNING"?C.cyan:C.muted} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: "uppercase" }}>Action</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{r.action}</div>
              </div>
              <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: C.muted, marginBottom: 4, textTransform: "uppercase" }}>Target</div>
                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>{r.servers}</div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: C.cyan }}>⏭ Next: {r.nextRun}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn sm color={C.blue}>▶ Run Now</Btn>
                <Btn sm color={C.muted}>Edit</Btn>
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}

// ── AUDIT LOG TAB ─────────────────────────────────────────────
function AuditTab({ auditList }) {
  return (
    <div>
      <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>📋 Audit Log</h2>
      <p style={{ color: C.muted, marginBottom: 24, fontSize: 13 }}>Complete history of all operations and changes</p>

      {auditList.length === 0
        ? <GlowCard color={C.blue} style={{ textAlign: "center", padding: 48 }}><div style={{ color: C.muted }}>No audit records yet. Operations will appear here.</div></GlowCard>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...auditList].reverse().map((a, i) => (
              <GlowCard key={a.id} color={a.action.includes("APPROVED")?C.green:a.action.includes("REJECTED")?C.danger:C.blue} style={{ padding: "14px 18px" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: a.action.includes("APPROVED")?`${C.green}20`:a.action.includes("REJECTED")?`${C.danger}20`:`${C.blue}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                    {a.action.includes("APPROVED")?"✅":a.action.includes("REJECTED")?"❌":"⚡"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>{a.action}</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>by {a.user} · {a.time}</div>
                  </div>
                  <div style={{ fontFamily: "monospace", fontSize: 11, color: C.dim }}>#{auditList.length - i}</div>
                </div>
              </GlowCard>
            ))}
          </div>
        )}
    </div>
  );
}
