import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, update, remove } from "firebase/database";

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

// ── EmailJS Config ─────────────────────────────────────────
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
const ALERT_EMAIL = "your-team@company.in";

// ── Theme ──────────────────────────────────────────────────
const DARK = { bg:"#060910",card:"#0a0f1a",card2:"#0f1520",border:"#1a2540",red:"#C74634",blue:"#1e90ff",cyan:"#00d4ff",green:"#00e676",orange:"#ff9100",purple:"#d500f9",teal:"#1de9b6",yellow:"#ffd600",text:"#e8eef8",muted:"#4a6080",dim:"#2a3a50",danger:"#ff1744",warning:"#ff9100",success:"#00e676",info:"#00d4ff",shadow:"rgba(0,0,0,0.5)",headerBg:"linear-gradient(180deg,#0a0f1a,#060910)" };
const LIGHT = { bg:"#f0f4f8",card:"#ffffff",card2:"#f8fafc",border:"#e2e8f0",red:"#C74634",blue:"#1a56a0",cyan:"#0891b2",green:"#059669",orange:"#ea580c",purple:"#7c3aed",teal:"#0d9488",yellow:"#d97706",text:"#1e293b",muted:"#64748b",dim:"#cbd5e1",danger:"#dc2626",warning:"#d97706",success:"#059669",info:"#0891b2",shadow:"rgba(0,0,0,0.1)",headerBg:"linear-gradient(180deg,#1e293b,#0f172a)" };
const G = { red:"linear-gradient(135deg,#C74634,#8B1A10)",blue:"linear-gradient(135deg,#1e90ff,#00d4ff)",green:"linear-gradient(135deg,#00e676,#00a152)",orange:"linear-gradient(135deg,#ff9100,#C74634)",purple:"linear-gradient(135deg,#d500f9,#1e90ff)",teal:"linear-gradient(135deg,#1de9b6,#00d4ff)" };

// ── Roles ──────────────────────────────────────────────────
// IMPORTANT: Move these to a backend API for production.
// These passwords are placeholders — replace with proper auth (Firebase Auth / OAuth).
const ROLES = {
  admin:    { label:"System Admin",     icon:"🛡️", pass:"ADMIN@2025!", color:"red"    },
  ops:      { label:"OPS Engineer",     icon:"⚙️", pass:"OPS@2025!",   color:"blue"   },
  approver: { label:"Change Approver",  icon:"✅", pass:"APPR@2025!",  color:"green"  },
  viewer:   { label:"Viewer",           icon:"👁️", pass:null,          color:"muted"  },
};

// ── Initial Data ───────────────────────────────────────────
const INIT_SERVERS = [
  { id:"wls1", name:"AdminServer",    status:"running",  cpu:42, mem:68, heap:71, threads:45, region:"Mumbai"    },
  { id:"wls2", name:"ManagedServer1", status:"running",  cpu:38, mem:72, heap:65, threads:38, region:"Mumbai"    },
  { id:"wls3", name:"ManagedServer2", status:"running",  cpu:55, mem:61, heap:58, threads:52, region:"Mumbai"    },
  { id:"wls4", name:"ManagedServer3", status:"stopped",  cpu:0,  mem:0,  heap:0,  threads:0,  region:"Mumbai"    },
  { id:"wls5", name:"ManagedServer4", status:"running",  cpu:29, mem:55, heap:49, threads:31, region:"Hyderabad" },
  { id:"wls6", name:"ManagedServer5", status:"warning",  cpu:88, mem:91, heap:87, threads:95, region:"Hyderabad" },
  { id:"wls7", name:"ManagedServer6", status:"running",  cpu:33, mem:58, heap:62, threads:28, region:"Hyderabad" },
];
const INIT_ISSUES = [
  { id:"i1", sev:"P1", title:"ManagedServer5 high CPU/memory",  status:"open",       assignee:"ops@company.in",   created:"2025-04-27 08:12" },
  { id:"i2", sev:"P2", title:"ManagedServer3 unexpectedly stopped", status:"in-progress",assignee:"ops@company.in",   created:"2025-04-26 22:45" },
  { id:"i3", sev:"P3", title:"Heap usage trending upward on WLS2", status:"open",       assignee:"admin@company.in", created:"2025-04-27 06:30" },
];

// ── Firebase Hook ─────────────────────────────────────────
function useDB(path) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const r = ref(db, path);
    return onValue(r, snap => setData(snap.val()));
  }, [path]);
  return data;
}

// ── Utility ───────────────────────────────────────────────
const ts = () => new Date().toLocaleString("en-IN",{hour12:false});
const uid = () => Math.random().toString(36).slice(2,9);

// ── Email Alert ───────────────────────────────────────────
async function sendAlert(subject, body) {
  try {
    if (window.emailjs) {
      await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID,
        { to_email: ALERT_EMAIL, subject, message: body }, EMAILJS_PUBLIC_KEY);
    }
  } catch(e) { console.warn("Email alert skipped:", e.message); }
}

// ── AI Chat (backend proxy) ────────────────────────────────
// NOTE: For production, move this API call to your backend proxy server (proxy.js).
// The proxy should call the AI API and return results — never call AI APIs directly from the browser.
async function callAI(messages, serverContext) {
  const systemPrompt = `You are the Cloud Infra AI Assistant for this infrastructure management platform.
You help operations teams manage WebLogic servers, OCI resources, deployments, incidents, and maintenance.
Answer concisely and technically. Focus on actionable insights.
Current infrastructure context: ${JSON.stringify(serverContext)}`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "No response received.";
  } catch(e) {
    return "AI service unavailable. Please check your network connection and try again.";
  }
}

// ── Styled Components ─────────────────────────────────────
const Btn = ({children, onClick, grad, color, style={}, disabled=false}) => {
  const C = DARK;
  return (
    <button onClick={onClick} disabled={disabled} style={{
      background: disabled ? C.dim : (grad||G.blue),
      color: "#fff", border:"none", borderRadius:8,
      padding:"8px 16px", cursor: disabled?"not-allowed":"pointer",
      fontWeight:700, fontSize:13, transition:"all 0.2s",
      opacity: disabled ? 0.5 : 1, ...style
    }}>{children}</button>
  );
};

const Badge = ({children, color="#1e90ff", bg}) => (
  <span style={{
    background: bg||color+"22", color, border:`1px solid ${color}44`,
    borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:700,
  }}>{children}</span>
);

const GlowCard = ({children, C, style={}}) => (
  <div style={{
    background:C.card, border:`1px solid ${C.border}`, borderRadius:12,
    padding:20, boxShadow:`0 4px 24px ${C.shadow}`, ...style
  }}>{children}</div>
);

const Inp = ({value, onChange, placeholder, type="text", style={}}) => {
  const C = DARK;
  return (
    <input value={value} onChange={onChange} type={type} placeholder={placeholder} style={{
      background:C.card2, border:`1px solid ${C.border}`, borderRadius:8,
      color:C.text, padding:"10px 14px", width:"100%", fontSize:13,
      outline:"none", boxSizing:"border-box", ...style
    }} />
  );
};

// ── Status Helpers ────────────────────────────────────────
const statusColor = (s, C) => ({running:C.green,stopped:C.danger,warning:C.warning}[s]||C.muted);
const sevColor    = (s, C) => ({P1:C.danger,P2:C.warning,P3:C.info}[s]||C.muted);

// ═══════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════
function Login({ onLogin }) {
  const C = DARK;
  const [role, setRole] = useState("");
  const [pass, setPass] = useState("");
  const [err,  setErr]  = useState("");

  const login = () => {
    if (!role) { setErr("Please select a role"); return; }
    const r = ROLES[role];
    if (r.pass && pass !== r.pass) { setErr("Incorrect password"); return; }
    onLogin({ role, label: r.label, icon: r.icon });
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Segoe UI',sans-serif" }}>
      <GlowCard C={C} style={{ width:420, maxWidth:"95vw" }}>
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:48, marginBottom:8 }}>🌐</div>
          <div style={{ fontSize:22, fontWeight:800, color:C.red }}>Cloud Infra Control</div>
          <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>Infrastructure Management Platform</div>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:12, color:C.muted, marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Select Role</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {Object.entries(ROLES).map(([r,{label,icon}]) => (
              <button key={r} onClick={() => { setRole(r); setErr(""); }} style={{
                background: role===r ? C.blue+"33" : C.card2,
                border: `2px solid ${role===r ? C.blue : C.border}`,
                borderRadius:8, padding:"12px 8px", cursor:"pointer",
                color:C.text, textAlign:"center", transition:"all 0.15s"
              }}>
                <div style={{ fontSize:22, marginBottom:4 }}>{icon}</div>
                <div style={{ fontWeight:700, fontSize:12, color: role===r ? C.blue : C.text }}>{label}</div>
              </button>
            ))}
          </div>
        </div>

        {role && ROLES[role].pass && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Password</div>
            <Inp value={pass} onChange={e => { setPass(e.target.value); setErr(""); }}
              placeholder="Enter password" type="password" />
          </div>
        )}

        {err && <div style={{ color:C.danger, fontSize:12, marginBottom:12 }}>⚠ {err}</div>}
        <Btn grad={G.red} onClick={login} style={{ width:"100%", padding:"14px" }}>
          🔐 Authenticate & Enter
        </Btn>
      </GlowCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser]   = useState(null);
  const [theme, setTheme] = useState("dark");
  if (!user) return <Login onLogin={setUser} />;
  return <MainApp user={user} onLogout={() => setUser(null)} theme={theme} setTheme={setTheme} />;
}

function MainApp({ user, onLogout, theme, setTheme }) {
  const C = theme === "dark" ? DARK : LIGHT;
  const [tab, setTab]       = useState("dashboard");
  const [servers, setServers] = useState(INIT_SERVERS);
  const [issues, setIssues]   = useState(INIT_ISSUES);

  const approvals = useDB("approvals");
  const auditLogs = useDB("auditLogs");

  const approvalList = approvals ? Object.entries(approvals).map(([k,v])=>({id:k,...v})) : [];
  const auditList    = auditLogs  ? Object.entries(auditLogs).map(([k,v])=>({id:k,...v})).sort((a,b)=>b.time?.localeCompare(a.time)) : [];

  const addAudit = useCallback((action, detail="") => {
    push(ref(db,"auditLogs"), { user: user.label, role: user.role, action, detail, time: ts() });
  }, [user]);

  useEffect(() => { addAudit("Login", `Logged in as ${user.label}`); }, []);

  const canOps      = ["admin","ops"].includes(user.role);
  const canApprove  = ["admin","approver"].includes(user.role);
  const canAdmin    = user.role === "admin";

  // ── Server simulation ──────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => {
      setServers(prev => prev.map(s => {
        if (s.status === "stopped") return s;
        const jitter = v => Math.max(0, Math.min(100, v + (Math.random()-0.5)*6));
        const newStatus = (s.cpu > 85 || s.mem > 90) ? "warning" : "running";
        return { ...s, cpu: Math.round(jitter(s.cpu)), mem: Math.round(jitter(s.mem)),
          heap: Math.round(jitter(s.heap)), threads: Math.round(jitter(s.threads)), status: newStatus };
      }));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const TABS = [
    { id:"dashboard",    label:"Dashboard",    icon:"📊" },
    { id:"weblogic",     label:"WebLogic",     icon:"⚙️" },
    { id:"incidents",    label:"Incidents",    icon:"🚨" },
    { id:"approvals",    label:"Approvals",    icon:"✅" },
    { id:"maintenance",  label:"Maintenance",  icon:"🔧" },
    { id:"patches",      label:"Patches",      icon:"📦" },
    { id:"tickets",      label:"Tickets",      icon:"🎫" },
    { id:"audit",        label:"Audit Log",    icon:"📋" },
    { id:"chatbot",      label:"AI Assistant", icon:"🤖" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Segoe UI',sans-serif", color:C.text }}>
      {/* Header */}
      <div style={{ background:C.headerBg, borderBottom:`1px solid ${C.border}`, padding:"0 20px", display:"flex", alignItems:"center", justifyContent:"space-between", height:56, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:24 }}>🌐</span>
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:C.red }}>Cloud Infra Control</div>
            <div style={{ fontSize:10, color:C.muted }}>Infrastructure Management Platform</div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => setTheme(t => t==="dark"?"light":"dark")} style={{
            background:C.card2, border:`1px solid ${C.border}`, borderRadius:20,
            color:C.text, padding:"4px 12px", cursor:"pointer", fontSize:13
          }}>{theme==="dark"?"☀️ Light":"🌙 Dark"}</button>
          <Badge color={C[ROLES[user.role].color]||C.blue}>{user.icon} {user.label}</Badge>
          <button onClick={onLogout} style={{ background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:13 }}>Logout</button>
        </div>
      </div>

      {/* Nav */}
      <div style={{ background:C.card, borderBottom:`1px solid ${C.border}`, padding:"0 20px", display:"flex", gap:4, overflowX:"auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); addAudit("Tab Visit", t.label); }} style={{
            background: tab===t.id ? C.red+"22" : "none",
            border:"none", borderBottom: tab===t.id ? `2px solid ${C.red}` : "2px solid transparent",
            color: tab===t.id ? C.red : C.muted, padding:"12px 16px", cursor:"pointer",
            fontSize:13, fontWeight: tab===t.id ? 700 : 400, whiteSpace:"nowrap",
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:20, maxWidth:1400, margin:"0 auto" }}>
        {tab==="dashboard"   && <DashboardTab   servers={servers} issues={issues} C={C} />}
        {tab==="weblogic"    && <WebLogicTab     servers={servers} setServers={setServers} user={user} canOps={canOps} addAudit={addAudit} C={C} />}
        {tab==="incidents"   && <IncidentsTab    issues={issues} setIssues={setIssues} user={user} canOps={canOps} addAudit={addAudit} C={C} />}
        {tab==="approvals"   && <ApprovalsTab    approvalList={approvalList} user={user} canOps={canOps} canApprove={canApprove} addAudit={addAudit} C={C} />}
        {tab==="maintenance" && <MaintenanceTab  user={user} canOps={canOps} addAudit={addAudit} C={C} />}
        {tab==="patches"     && <PatchesTab      user={user} canOps={canOps} addAudit={addAudit} C={C} />}
        {tab==="tickets"     && <TicketsTab      user={user} canOps={canOps} addAudit={addAudit} C={C} />}
        {tab==="audit"       && <AuditTab        auditList={auditList} C={C} />}
        {tab==="chatbot"     && <ChatbotTab      servers={servers} issues={issues} user={user} C={C} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD TAB
// ═══════════════════════════════════════════════════════════
function DashboardTab({ servers, issues, C }) {
  const running = servers.filter(s=>s.status==="running").length;
  const warning = servers.filter(s=>s.status==="warning").length;
  const stopped = servers.filter(s=>s.status==="stopped").length;
  const openP1  = issues.filter(i=>i.sev==="P1"&&i.status!=="closed").length;

  const cards = [
    { label:"Servers Running",  value:running, icon:"🟢", color:C.green  },
    { label:"Servers Warning",  value:warning, icon:"🟡", color:C.warning },
    { label:"Servers Stopped",  value:stopped, icon:"🔴", color:C.danger  },
    { label:"Open P1 Incidents",value:openP1,  icon:"🚨", color:C.danger  },
  ];

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:16, marginBottom:24 }}>
        {cards.map(c => (
          <GlowCard key={c.label} C={C} style={{ textAlign:"center" }}>
            <div style={{ fontSize:32 }}>{c.icon}</div>
            <div style={{ fontSize:36, fontWeight:800, color:c.color }}>{c.value}</div>
            <div style={{ fontSize:13, color:C.muted }}>{c.label}</div>
          </GlowCard>
        ))}
      </div>

      <GlowCard C={C}>
        <div style={{ fontWeight:700, marginBottom:16, color:C.text }}>📡 Live Server Overview</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:12 }}>
          {servers.map(s => (
            <div key={s.id} style={{ background:C.card2, border:`1px solid ${statusColor(s.status,C)}44`, borderRadius:10, padding:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{s.name}</div>
                <Badge color={statusColor(s.status,C)}>{s.status.toUpperCase()}</Badge>
              </div>
              {s.status!=="stopped" && (
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, fontSize:12 }}>
                  {[["CPU",s.cpu],["MEM",s.mem],["HEAP",s.heap],["THR",s.threads]].map(([k,v])=>(
                    <div key={k}>
                      <div style={{ color:C.muted, marginBottom:3 }}>{k}: <span style={{ color: v>80?C.danger:v>60?C.warning:C.green, fontWeight:700 }}>{v}%</span></div>
                      <div style={{ background:C.dim, borderRadius:4, height:4 }}>
                        <div style={{ width:`${v}%`, background: v>80?C.danger:v>60?C.warning:C.green, height:4, borderRadius:4, transition:"width 0.5s" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize:11, color:C.muted, marginTop:8 }}>📍 {s.region}</div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// WEBLOGIC TAB
// ═══════════════════════════════════════════════════════════
function WebLogicTab({ servers, setServers, user, canOps, addAudit, C }) {
  const [selected, setSelected] = useState(null);
  const [log, setLog] = useState([]);
  const [pending, setPending] = useState({});

  const requestOp = async (server, action) => {
    if (!canOps) return;
    addAudit(`Request ${action}`, server.name);
    setPending(p => ({...p, [server.id]: action}));
    setLog(l => [...l, `[${ts()}] Requesting ${action} for ${server.name}...`]);

    // Submit for approval
    await push(ref(db,"approvals"), {
      type:"server-op", action, target: server.name, serverId: server.id,
      requestedBy: user.label, requestedAt: ts(), status:"pending"
    });
    setLog(l => [...l, `[${ts()}] Submitted for approval. Awaiting approver sign-off.`]);
  };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>
      <GlowCard C={C}>
        <div style={{ fontWeight:700, marginBottom:16 }}>⚙️ WebLogic Servers</div>
        {servers.map(s => (
          <div key={s.id} onClick={() => setSelected(s)} style={{
            background: selected?.id===s.id ? C.blue+"22" : C.card2,
            border:`1px solid ${selected?.id===s.id ? C.blue : C.border}`,
            borderRadius:10, padding:14, marginBottom:10, cursor:"pointer",
          }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:700 }}>{s.name}</div>
                <div style={{ fontSize:12, color:C.muted }}>📍 {s.region}</div>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <Badge color={statusColor(s.status,C)}>{s.status.toUpperCase()}</Badge>
                {pending[s.id] && <Badge color={C.warning}>Pending {pending[s.id]}</Badge>}
              </div>
            </div>
            {s.status!=="stopped" && (
              <div style={{ display:"flex", gap:16, marginTop:10, fontSize:12 }}>
                {[["CPU",s.cpu],["MEM",s.mem],["HEAP",s.heap]].map(([k,v])=>(
                  <span key={k} style={{ color: v>80?C.danger:v>60?C.warning:C.green }}>{k}: {v}%</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </GlowCard>

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {selected && (
          <GlowCard C={C}>
            <div style={{ fontWeight:700, marginBottom:12 }}>🎮 Controls — {selected.name}</div>
            {canOps ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <Btn grad={G.green}  onClick={() => requestOp(selected,"Start")}   disabled={selected.status==="running"}>▶ Start</Btn>
                <Btn grad={G.red}    onClick={() => requestOp(selected,"Stop")}    disabled={selected.status==="stopped"}>⏹ Stop</Btn>
                <Btn grad={G.orange} onClick={() => requestOp(selected,"Restart")} disabled={selected.status==="stopped"}>🔄 Restart</Btn>
              </div>
            ) : (
              <div style={{ color:C.muted, fontSize:13 }}>View only — OPS role required for controls.</div>
            )}
          </GlowCard>
        )}
        <GlowCard C={C} style={{ flex:1 }}>
          <div style={{ fontWeight:700, marginBottom:12 }}>📟 Operation Log</div>
          <div style={{ background:C.card2, borderRadius:8, padding:12, minHeight:200, fontFamily:"monospace", fontSize:11, color:C.green, maxHeight:400, overflowY:"auto" }}>
            {log.length===0 ? <span style={{ color:C.muted }}>No operations yet.</span> : log.map((l,i)=><div key={i}>{l}</div>)}
          </div>
        </GlowCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// INCIDENTS TAB
// ═══════════════════════════════════════════════════════════
function IncidentsTab({ issues, setIssues, user, canOps, addAudit, C }) {
  const [form, setForm] = useState({ sev:"P2", title:"", assignee:"" });
  const [showForm, setShowForm] = useState(false);

  const addIssue = () => {
    if (!form.title) return;
    const issue = { id:`i${uid()}`, ...form, status:"open", created: ts() };
    setIssues(p => [...p, issue]);
    addAudit("Create Incident", `${form.sev}: ${form.title}`);
    if (form.sev==="P1") sendAlert("🚨 P1 Incident Created", form.title);
    setForm({ sev:"P2", title:"", assignee:"" });
    setShowForm(false);
  };

  const updateStatus = (id, status) => {
    setIssues(p => p.map(i => i.id===id ? {...i, status} : i));
    addAudit("Update Incident", `${id} → ${status}`);
  };

  return (
    <GlowCard C={C}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:16 }}>🚨 Incident Management</div>
        {canOps && <Btn grad={G.red} onClick={() => setShowForm(s=>!s)}>+ New Incident</Btn>}
      </div>

      {showForm && (
        <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>Severity</div>
              <select value={form.sev} onChange={e => setForm(f=>({...f, sev:e.target.value}))} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.text, padding:"8px 12px", borderRadius:8, width:"100%", fontSize:13 }}>
                <option>P1</option><option>P2</option><option>P3</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>Assignee</div>
              <Inp value={form.assignee} onChange={e => setForm(f=>({...f,assignee:e.target.value}))} placeholder="email@company.in" />
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:12, color:C.muted, marginBottom:6 }}>Title</div>
            <Inp value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Describe the incident..." />
          </div>
          <Btn grad={G.red} onClick={addIssue}>Create Incident</Btn>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {issues.map(i => (
          <div key={i.id} style={{ background:C.card2, border:`1px solid ${sevColor(i.sev,C)}33`, borderRadius:10, padding:14 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                  <Badge color={sevColor(i.sev,C)}>{i.sev}</Badge>
                  <Badge color={C.muted}>{i.status}</Badge>
                </div>
                <div style={{ fontWeight:600 }}>{i.title}</div>
                <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>👤 {i.assignee} · 🕐 {i.created}</div>
              </div>
              {canOps && i.status !== "closed" && (
                <div style={{ display:"flex", gap:8 }}>
                  {i.status==="open" && <Btn grad={G.blue} onClick={()=>updateStatus(i.id,"in-progress")}>Start</Btn>}
                  {i.status==="in-progress" && <Btn grad={G.green} onClick={()=>updateStatus(i.id,"closed")}>Close</Btn>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}

// ═══════════════════════════════════════════════════════════
// APPROVALS TAB
// ═══════════════════════════════════════════════════════════
function ApprovalsTab({ approvalList, user, canOps, canApprove, addAudit, C }) {
  const pending = approvalList.filter(a=>a.status==="pending");
  const done    = approvalList.filter(a=>a.status!=="pending");

  const decide = async (a, decision) => {
    await update(ref(db,`approvals/${a.id}`), { status: decision, decidedBy: user.label, decidedAt: ts() });
    addAudit(`Approval ${decision}`, `${a.action} on ${a.target}`);
  };

  return (
    <GlowCard C={C}>
      <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>✅ Change Approvals</div>
      {pending.length===0 && <div style={{ color:C.muted, marginBottom:24 }}>No pending approvals.</div>}
      {pending.map(a => (
        <div key={a.id} style={{ background:C.card2, border:`1px solid ${C.warning}44`, borderRadius:10, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:700, color:C.warning }}>⏳ Pending: {a.action} → {a.target}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>Requested by {a.requestedBy} at {a.requestedAt}</div>
            </div>
            {canApprove && (
              <div style={{ display:"flex", gap:8 }}>
                <Btn grad={G.green} onClick={()=>decide(a,"approved")}>✓ Approve</Btn>
                <Btn grad={G.red}   onClick={()=>decide(a,"rejected")}>✗ Reject</Btn>
              </div>
            )}
          </div>
        </div>
      ))}
      {done.length>0 && (
        <>
          <div style={{ fontWeight:700, marginBottom:12, marginTop:8 }}>History</div>
          {done.slice(0,10).map(a => (
            <div key={a.id} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, padding:12, marginBottom:8, fontSize:13 }}>
              <div style={{ display:"flex", justifyContent:"space-between" }}>
                <span>{a.action} → {a.target}</span>
                <Badge color={a.status==="approved"?C.green:C.danger}>{a.status.toUpperCase()}</Badge>
              </div>
              <div style={{ color:C.muted, fontSize:11, marginTop:4 }}>By {a.decidedBy} at {a.decidedAt}</div>
            </div>
          ))}
        </>
      )}
    </GlowCard>
  );
}

// ═══════════════════════════════════════════════════════════
// MAINTENANCE TAB
// ═══════════════════════════════════════════════════════════
function MaintenanceTab({ user, canOps, addAudit, C }) {
  const items = useDB("maintenance");
  const list  = items ? Object.entries(items).map(([k,v])=>({id:k,...v})) : [];
  const [form, setForm] = useState({ title:"", server:"", start:"", end:"", type:"Planned" });
  const [show, setShow] = useState(false);

  const add = async () => {
    if (!form.title || !form.start) return;
    await push(ref(db,"maintenance"), { ...form, createdBy: user.label, createdAt: ts(), status:"scheduled" });
    addAudit("Schedule Maintenance", form.title);
    setForm({ title:"", server:"", start:"", end:"", type:"Planned" });
    setShow(false);
  };

  const cancel = async (id, title) => {
    await update(ref(db,`maintenance/${id}`), { status:"cancelled" });
    addAudit("Cancel Maintenance", title);
  };

  return (
    <GlowCard C={C}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:16 }}>🔧 Maintenance Windows</div>
        {canOps && <Btn grad={G.blue} onClick={() => setShow(s=>!s)}>+ Schedule</Btn>}
      </div>
      {show && (
        <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div><div style={{ fontSize:12,color:C.muted,marginBottom:6 }}>Title</div><Inp value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Maintenance title" /></div>
            <div><div style={{ fontSize:12,color:C.muted,marginBottom:6 }}>Server</div><Inp value={form.server} onChange={e=>setForm(f=>({...f,server:e.target.value}))} placeholder="Server name" /></div>
            <div><div style={{ fontSize:12,color:C.muted,marginBottom:6 }}>Start</div><Inp type="datetime-local" value={form.start} onChange={e=>setForm(f=>({...f,start:e.target.value}))} /></div>
            <div><div style={{ fontSize:12,color:C.muted,marginBottom:6 }}>End</div><Inp type="datetime-local" value={form.end} onChange={e=>setForm(f=>({...f,end:e.target.value}))} /></div>
          </div>
          <Btn grad={G.blue} onClick={add}>Schedule Maintenance</Btn>
        </div>
      )}
      {list.length===0 && <div style={{ color:C.muted }}>No maintenance scheduled.</div>}
      {list.map(m => (
        <div key={m.id} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:700 }}>{m.title}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>🖥 {m.server} · {m.start} → {m.end}</div>
              <div style={{ fontSize:11, color:C.muted }}>By {m.createdBy}</div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <Badge color={m.status==="scheduled"?C.blue:C.muted}>{m.status}</Badge>
              {canOps && m.status==="scheduled" && <Btn grad={G.red} onClick={()=>cancel(m.id,m.title)}>Cancel</Btn>}
            </div>
          </div>
        </div>
      ))}
    </GlowCard>
  );
}

// ═══════════════════════════════════════════════════════════
// PATCHES TAB
// ═══════════════════════════════════════════════════════════
function PatchesTab({ user, canOps, addAudit, C }) {
  const PATCHES = [
    { id:"p1", name:"WLS Security Patch Jan-2025",   cve:"CVE-2025-1234",  severity:"Critical", status:"pending",  affectedServers:["AdminServer","ManagedServer1"] },
    { id:"p2", name:"JDK 17.0.9 Upgrade",           cve:"CVE-2024-9876",  severity:"High",     status:"applied",  affectedServers:["All Servers"] },
    { id:"p3", name:"OCI Agent Update v2.4",         cve:"N/A",            severity:"Low",      status:"pending",  affectedServers:["ManagedServer5","ManagedServer6"] },
    { id:"p4", name:"JDBC Driver Security Fix",      cve:"CVE-2025-5678",  severity:"High",     status:"pending",  affectedServers:["AdminServer"] },
  ];
  const [patches, setPatches] = useState(PATCHES);

  const applyPatch = (id) => {
    setPatches(p => p.map(x => x.id===id ? {...x, status:"applied", appliedBy:user.label, appliedAt:ts()} : x));
    addAudit("Apply Patch", patches.find(x=>x.id===id)?.name);
  };

  const sevColor2 = s => ({Critical:C.danger, High:C.warning, Medium:C.info, Low:C.muted}[s]||C.muted);

  return (
    <GlowCard C={C}>
      <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>📦 Patch Management</div>
      <div style={{ display:"flex", gap:12, marginBottom:16 }}>
        {[["Pending",patches.filter(p=>p.status==="pending").length,C.warning],["Applied",patches.filter(p=>p.status==="applied").length,C.green]].map(([l,v,c])=>(
          <div key={l} style={{ background:C.card2, border:`1px solid ${c}33`, borderRadius:8, padding:"10px 20px", textAlign:"center" }}>
            <div style={{ fontSize:24, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:12, color:C.muted }}>{l}</div>
          </div>
        ))}
      </div>
      {patches.map(p => (
        <div key={p.id} style={{ background:C.card2, border:`1px solid ${sevColor2(p.severity)}33`, borderRadius:10, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                <Badge color={sevColor2(p.severity)}>{p.severity}</Badge>
                <Badge color={p.status==="applied"?C.green:C.warning}>{p.status}</Badge>
              </div>
              <div style={{ fontWeight:700 }}>{p.name}</div>
              <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>CVE: {p.cve} · Affects: {p.affectedServers.join(", ")}</div>
              {p.appliedBy && <div style={{ fontSize:11, color:C.success, marginTop:4 }}>✓ Applied by {p.appliedBy} at {p.appliedAt}</div>}
            </div>
            {canOps && p.status==="pending" && <Btn grad={G.green} onClick={()=>applyPatch(p.id)}>Apply</Btn>}
          </div>
        </div>
      ))}
    </GlowCard>
  );
}

// ═══════════════════════════════════════════════════════════
// TICKETS TAB
// ═══════════════════════════════════════════════════════════
function TicketsTab({ user, canOps, addAudit, C }) {
  const tickets = useDB("tickets");
  const list    = tickets ? Object.entries(tickets).map(([k,v])=>({id:k,...v})) : [];
  const [form, setForm]   = useState({ title:"", priority:"Medium", type:"ServiceNow", description:"" });
  const [show, setShow]   = useState(false);

  const create = async () => {
    if (!form.title) return;
    await push(ref(db,"tickets"), { ...form, status:"open", createdBy: user.label, createdAt: ts(), ticketId:`TKT-${uid().toUpperCase()}` });
    addAudit("Create Ticket", `${form.type}: ${form.title}`);
    setForm({ title:"", priority:"Medium", type:"ServiceNow", description:"" });
    setShow(false);
  };

  const close = async (id, title) => {
    await update(ref(db,`tickets/${id}`), { status:"closed", closedBy: user.label, closedAt: ts() });
    addAudit("Close Ticket", title);
  };

  const priColor = p => ({Critical:C.danger, High:C.warning, Medium:C.info, Low:C.muted}[p]||C.muted);

  return (
    <GlowCard C={C}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontWeight:700, fontSize:16 }}>🎫 Ticket Management</div>
        {canOps && <Btn grad={G.blue} onClick={()=>setShow(s=>!s)}>+ New Ticket</Btn>}
      </div>
      {show && (
        <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:10, padding:16, marginBottom:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div><div style={{ fontSize:12,color:C.muted,marginBottom:6 }}>Title</div><Inp value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Ticket title" /></div>
            <div>
              <div style={{ fontSize:12,color:C.muted,marginBottom:6 }}>System</div>
              <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.text, padding:"10px 14px", borderRadius:8, width:"100%", fontSize:13 }}>
                <option>ServiceNow</option><option>JIRA</option><option>Internal</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize:12,color:C.muted,marginBottom:6 }}>Priority</div>
              <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{ background:C.card, border:`1px solid ${C.border}`, color:C.text, padding:"10px 14px", borderRadius:8, width:"100%", fontSize:13 }}>
                <option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
            <div><div style={{ fontSize:12,color:C.muted,marginBottom:6 }}>Description</div><Inp value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Details..." /></div>
          </div>
          <Btn grad={G.blue} onClick={create}>Create Ticket</Btn>
        </div>
      )}
      {list.length===0 && <div style={{ color:C.muted }}>No tickets yet.</div>}
      {list.map(t => (
        <div key={t.id} style={{ background:C.card2, border:`1px solid ${priColor(t.priority)}33`, borderRadius:10, padding:14, marginBottom:10 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ display:"flex", gap:8, marginBottom:6 }}>
                <Badge color={C.muted}>{t.ticketId}</Badge>
                <Badge color={priColor(t.priority)}>{t.priority}</Badge>
                <Badge color={C.info}>{t.type}</Badge>
                <Badge color={t.status==="open"?C.green:C.muted}>{t.status}</Badge>
              </div>
              <div style={{ fontWeight:700 }}>{t.title}</div>
              {t.description && <div style={{ fontSize:12, color:C.muted, marginTop:4 }}>{t.description}</div>}
              <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>By {t.createdBy} · {t.createdAt}</div>
            </div>
            {canOps && t.status==="open" && <Btn grad={G.green} onClick={()=>close(t.id,t.title)}>Close</Btn>}
          </div>
        </div>
      ))}
    </GlowCard>
  );
}

// ═══════════════════════════════════════════════════════════
// AUDIT TAB
// ═══════════════════════════════════════════════════════════
function AuditTab({ auditList, C }) {
  return (
    <GlowCard C={C}>
      <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>📋 Audit Log</div>
      {auditList.length===0 && <div style={{ color:C.muted }}>No audit entries yet.</div>}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {auditList.map(a => (
          <div key={a.id} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 14px", display:"flex", gap:16, alignItems:"center" }}>
            <div style={{ fontSize:11, color:C.muted, minWidth:140 }}>🕐 {a.time}</div>
            <Badge color={C.blue}>{a.role}</Badge>
            <div style={{ fontWeight:600, fontSize:13 }}>{a.action}</div>
            {a.detail && <div style={{ fontSize:12, color:C.muted }}>{a.detail}</div>}
            <div style={{ marginLeft:"auto", fontSize:12, color:C.muted }}>👤 {a.user}</div>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}

// ═══════════════════════════════════════════════════════════
// CHATBOT TAB
// NOTE: For production deployment, move the API call in callAI()
// to your backend proxy server (proxy.js route: POST /api/chat).
// The proxy should hold the API key securely as an environment variable.
// ═══════════════════════════════════════════════════════════
function ChatbotTab({ servers, issues, user, C }) {
  const [messages, setMessages] = useState([
    { role:"assistant", content:"👋 Hello! I'm your Cloud Infra AI Assistant. Ask me anything about your servers, incidents, performance, or recommended actions." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role:"user", content: input };
    setMessages(m => [...m, userMsg]);
    setInput("");
    setLoading(true);

    const history = messages.filter(m=>m.role!=="assistant"||messages.indexOf(m)>0).map(m=>({ role:m.role, content:m.content }));
    const context = { servers: servers.map(s=>({name:s.name,status:s.status,cpu:s.cpu,mem:s.mem})), openIssues: issues.filter(i=>i.status!=="closed").length };

    const reply = await callAI([...history, userMsg], context);
    setMessages(m => [...m, { role:"assistant", content: reply }]);
    setLoading(false);
  };

  const QUICK = ["What's the overall system health?","Which servers need attention?","Any critical incidents?","Suggest performance improvements"];

  return (
    <GlowCard C={C} style={{ display:"flex", flexDirection:"column", height:"70vh" }}>
      <div style={{ fontWeight:700, fontSize:16, marginBottom:16 }}>🤖 Cloud Infra AI Assistant</div>
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
        {messages.map((m,i) => (
          <div key={i} style={{ display:"flex", justifyContent: m.role==="user"?"flex-end":"flex-start" }}>
            <div style={{
              background: m.role==="user" ? G.blue : C.card2,
              border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 16px",
              maxWidth:"75%", fontSize:14, lineHeight:1.6, color: m.role==="user"?"#fff":C.text,
            }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", justifyContent:"flex-start" }}>
            <div style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 16px", color:C.muted, fontSize:14 }}>Analyzing infrastructure data...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => setInput(q)} style={{ background:C.card2, border:`1px solid ${C.border}`, borderRadius:20, color:C.muted, padding:"4px 12px", cursor:"pointer", fontSize:12 }}>{q}</button>
        ))}
      </div>
      <div style={{ display:"flex", gap:10 }}>
        <Inp value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about your infrastructure..." style={{ flex:1 }} />
        <Btn grad={G.blue} onClick={send} disabled={loading || !input.trim()} style={{ padding:"10px 20px" }}>Send</Btn>
      </div>
    </GlowCard>
  );
}
