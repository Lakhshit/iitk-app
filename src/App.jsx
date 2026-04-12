import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, update, remove } from "firebase/database";

// ─── PASTE YOUR FIREBASE CONFIG HERE ────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyD8flQKhye0ux5W-rw7LIjHdZt3ZkoroHg",
  authDomain: "oci-team-hub.firebaseapp.com",
  databaseURL: "https://oci-team-hub-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "oci-team-hub",
  storageBucket: "oci-team-hub.firebasestorage.app",
  messagingSenderId: "444346127805",
  appId: "1:444346127805:web:1f7ef3208c968a1b812ed4",
};
// ────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ── Theme ────────────────────────────────────────────────────
const C = {
  bg: "#070b14", card: "#0d1320", card2: "#111928", border: "#1e2d45",
  blue: "#2979ff", cyan: "#00bcd4", green: "#00c853", orange: "#ff6d00",
  red: "#f44336", purple: "#7c4dff", yellow: "#ffd600", teal: "#1de9b6",
  text: "#e8eaf6", muted: "#546e7a", dim: "#37474f",
};
const G = {
  blue: "linear-gradient(135deg,#2979ff,#00bcd4)",
  green: "linear-gradient(135deg,#00c853,#1de9b6)",
  orange: "linear-gradient(135deg,#ff6d00,#ffd600)",
  red: "linear-gradient(135deg,#f44336,#ff6d00)",
  purple: "linear-gradient(135deg,#7c4dff,#2979ff)",
  dark: "linear-gradient(135deg,#1e2d45,#0d1320)",
};

const ROLES = { leadership: "Leadership", pm: "Project Manager", dev: "Developer/Engineer" };
const USERS = [
  { id: "u1", name: "Rajesh Kumar", role: "leadership", avatar: "RK" },
  { id: "u2", name: "Priya Sharma", role: "leadership", avatar: "PS" },
  { id: "u3", name: "Amit Verma", role: "pm", avatar: "AV" },
  { id: "u4", name: "Sneha Patel", role: "pm", avatar: "SP" },
  { id: "u5", name: "Rohan Singh", role: "pm", avatar: "RS" },
  { id: "u6", name: "Divya Nair", role: "dev", avatar: "DN" },
  { id: "u7", name: "Karan Mehta", role: "dev", avatar: "KM" },
  { id: "u8", name: "Anjali Rao", role: "dev", avatar: "AR" },
  { id: "u9", name: "Vikram Joshi", role: "dev", avatar: "VJ" },
  { id: "u10", name: "Neha Gupta", role: "dev", avatar: "NG" },
  { id: "u11", name: "Suresh Iyer", role: "dev", avatar: "SI" },
  { id: "u12", name: "Pooja Agarwal", role: "dev", avatar: "PA" },
];

const PRIORITY_COLORS = { Critical: C.red, High: C.orange, Medium: C.yellow, Low: C.green };
const STATUS_COLORS = {
  Active: C.blue, "In Progress": C.cyan, Completed: C.green, "On Hold": C.yellow,
  Open: C.red, Resolved: C.green, Closed: C.muted, Planning: C.purple,
  "To Do": C.muted, Done: C.green, Blocked: C.red,
};

// ── Reusable Components ───────────────────────────────────────
const Badge = ({ text, color }) => (
  <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${color}22`, color, border: `1px solid ${color}44`, whiteSpace: "nowrap" }}>{text}</span>
);

const Avatar = ({ initials, size = 32, grad = G.blue }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.32, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "'Syne',sans-serif" }}>{initials}</div>
);

const Card = ({ children, style = {}, grad, onClick }) => (
  <div onClick={onClick} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, position: "relative", overflow: "hidden", cursor: onClick ? "pointer" : "default", transition: "border-color 0.2s", ...style }}
    onMouseEnter={e => onClick && (e.currentTarget.style.borderColor = C.blue)}
    onMouseLeave={e => onClick && (e.currentTarget.style.borderColor = C.border)}>
    {grad && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: grad }} />}
    {children}
  </div>
);

const Btn = ({ children, grad, onClick, style = {}, sm, danger }) => (
  <button onClick={onClick} style={{ padding: sm ? "6px 14px" : "10px 20px", background: danger ? `${C.red}22` : grad || C.card2, border: danger ? `1px solid ${C.red}44` : grad ? "none" : `1px solid ${C.border}`, borderRadius: 10, color: danger ? C.red : grad ? "#fff" : C.muted, fontWeight: 600, fontSize: sm ? 12 : 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", ...style }}>{children}</button>
);

const Input = ({ value, onChange, placeholder, type = "text", rows, style = {} }) => {
  const base = { width: "100%", padding: "10px 13px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", ...style };
  return rows ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...base, resize: "vertical" }} /> : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={base} />;
};

const Select = ({ value, onChange, children, style = {} }) => (
  <select value={value} onChange={onChange} style={{ width: "100%", padding: "10px 13px", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box", ...style }}>{children}</select>
);

const SectionTitle = ({ text, sub, grad }) => (
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, background: grad || G.blue, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 4px" }}>{text}</h2>
    {sub && <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{sub}</p>}
  </div>
);

const StatCard = ({ label, value, icon, grad, sub }) => (
  <Card grad={grad}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, background: grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>{value}</div>
        <div style={{ color: C.muted, fontSize: 12, letterSpacing: 0.5, marginTop: 6, textTransform: "uppercase" }}>{label}</div>
        {sub && <div style={{ color: C.teal, fontSize: 11, marginTop: 4 }}>{sub}</div>}
      </div>
      <div style={{ fontSize: 28, opacity: 0.6 }}>{icon}</div>
    </div>
  </Card>
);

function useDB(path) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const r = ref(db, path);
    const unsub = onValue(r, snap => setData(snap.val()));
    return () => unsub();
  }, [path]);
  return data;
}

const now = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

// ── LOGIN ────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [selected, setSelected] = useState(null);
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const login = () => {
    if (!selected) return setErr("Select a user.");
    if (selected.role === "leadership" && pass !== "OCI@LEAD") return setErr("Wrong password for Leadership.");
    if (selected.role === "pm" && pass !== "OCI@PM") return setErr("Wrong password for PM.");
    onLogin(selected);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", position: "relative", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');*{box-sizing:border-box}`}</style>
      {[["#2979ff","5%","10%"],["#7c4dff","80%","70%"],["#00bcd4","50%","90%"]].map(([c,l,t],i)=>(
        <div key={i} style={{ position:"absolute",left:l,top:t,width:"300px",height:"300px",background:c,borderRadius:"50%",filter:"blur(100px)",opacity:0.08,pointerEvents:"none" }}/>
      ))}
      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 480, padding: 24 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, background: G.blue, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: "0 0 40px rgba(41,121,255,0.35)" }}>☁️</div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, background: G.blue, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>OCI Team Hub</div>
              <div style={{ color: C.muted, fontSize: 11, letterSpacing: 2, textTransform: "uppercase" }}>Oracle Cloud Infrastructure</div>
            </div>
          </div>
        </div>

        <Card>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: C.muted, fontSize: 12, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Select your profile</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
              {USERS.map(u => (
                <div key={u.id} onClick={() => { setSelected(u); setErr(""); setPass(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, cursor: "pointer", border: `1px solid ${selected?.id === u.id ? C.blue : C.border}`, background: selected?.id === u.id ? `${C.blue}15` : C.card2, transition: "all 0.15s" }}>
                  <Avatar initials={u.avatar} size={36} grad={u.role === "leadership" ? G.purple : u.role === "pm" ? G.blue : G.green} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{ROLES[u.role]}</div>
                  </div>
                  {selected?.id === u.id && <span style={{ color: C.blue, fontSize: 16 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>

          {selected && selected.role !== "dev" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Password</div>
              <Input value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} placeholder={`Enter ${ROLES[selected.role]} password`} type="password" />
              <div style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>
                💡 Leadership: <code style={{ color: C.cyan }}>OCI@LEAD</code> &nbsp; PM: <code style={{ color: C.cyan }}>OCI@PM</code>
              </div>
            </div>
          )}

          {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>⚠️ {err}</div>}
          <Btn grad={G.blue} onClick={login} style={{ width: "100%" }}>🚀 Enter OCI Hub</Btn>
        </Card>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  if (!user) return <Login onLogin={setUser} />;
  return <MainApp user={user} onLogout={() => setUser(null)} />;
}

function MainApp({ user, onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [modal, setModal] = useState(null);

  // Firebase data
  const projects = useDB("projects");
  const incidents = useDB("incidents");
  const tasks = useDB("tasks");
  const announcements = useDB("announcements");
  const capacity = useDB("capacity");

  const projectList = projects ? Object.entries(projects).map(([k, v]) => ({ id: k, ...v })) : [];
  const incidentList = incidents ? Object.entries(incidents).map(([k, v]) => ({ id: k, ...v })) : [];
  const taskList = tasks ? Object.entries(tasks).map(([k, v]) => ({ id: k, ...v })) : [];
  const announcementList = announcements ? Object.values(announcements) : [];

  // Stats
  const activeProjects = projectList.filter(p => p.status === "Active" || p.status === "In Progress").length;
  const openIncidents = incidentList.filter(i => i.status === "Open").length;
  const criticalIncidents = incidentList.filter(i => i.priority === "Critical" && i.status === "Open").length;
  const myTasks = taskList.filter(t => t.assignee === user.name);
  const completedTasks = taskList.filter(t => t.status === "Done").length;

  const TABS_BY_ROLE = {
    leadership: [
      { id: "dashboard", label: "📊 Dashboard" },
      { id: "projects", label: "🚀 Projects" },
      { id: "incidents", label: "🔥 Incidents" },
      { id: "resources", label: "👥 Resources" },
      { id: "announcements", label: "📢 Announcements" },
      { id: "reports", label: "📈 Reports" },
    ],
    pm: [
      { id: "dashboard", label: "📊 Dashboard" },
      { id: "projects", label: "🚀 Projects" },
      { id: "tasks", label: "✅ Tasks" },
      { id: "incidents", label: "🔥 Incidents" },
      { id: "resources", label: "👥 Resources" },
      { id: "announcements", label: "📢 Announcements" },
    ],
    dev: [
      { id: "dashboard", label: "📊 Dashboard" },
      { id: "mytasks", label: "✅ My Tasks" },
      { id: "incidents", label: "🔥 Incidents" },
      { id: "projects", label: "🚀 Projects" },
      { id: "announcements", label: "📢 Announcements" },
    ],
  };

  const tabs = TABS_BY_ROLE[user.role];
  const roleGrad = user.role === "leadership" ? G.purple : user.role === "pm" ? G.blue : G.green;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans',sans-serif", color: C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}input,textarea,select{font-family:'DM Sans',sans-serif}button{font-family:'DM Sans',sans-serif}`}</style>

      {/* Header */}
      <header style={{ background: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 24 }}>☁️</div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, background: G.blue, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1 }}>OCI Team Hub</div>
                <div style={{ color: C.muted, fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase" }}>Oracle Cloud Infrastructure</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {criticalIncidents > 0 && (
                <div style={{ background: `${C.red}22`, border: `1px solid ${C.red}44`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: C.red, fontWeight: 700 }}>
                  🔴 {criticalIncidents} Critical
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${C.border}`, borderRadius: 20, padding: "6px 12px" }}>
                <Avatar initials={user.avatar} size={24} grad={roleGrad} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</span>
                <Badge text={ROLES[user.role]} color={user.role === "leadership" ? C.purple : user.role === "pm" ? C.blue : C.green} />
              </div>
              <Btn onClick={onLogout} sm style={{ color: C.muted }}>Logout</Btn>
            </div>
          </div>
          <div style={{ display: "flex", gap: 0, marginTop: 10, overflowX: "auto" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "9px 16px", background: "transparent", border: "none", borderBottom: tab === t.id ? `2px solid ${C.blue}` : "2px solid transparent", color: tab === t.id ? C.blue : C.muted, cursor: "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.2s" }}>{t.label}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "28px 24px" }}>

        {/* ── DASHBOARD ──────────────────────────────────────── */}
        {tab === "dashboard" && (
          <DashboardTab user={user} projectList={projectList} incidentList={incidentList} taskList={taskList} announcementList={announcementList} myTasks={myTasks} activeProjects={activeProjects} openIncidents={openIncidents} criticalIncidents={criticalIncidents} completedTasks={completedTasks} roleGrad={roleGrad} />
        )}

        {/* ── PROJECTS ──────────────────────────────────────── */}
        {tab === "projects" && (
          <ProjectsTab user={user} projectList={projectList} />
        )}

        {/* ── INCIDENTS ─────────────────────────────────────── */}
        {tab === "incidents" && (
          <IncidentsTab user={user} incidentList={incidentList} />
        )}

        {/* ── TASKS (PM view) ────────────────────────────────── */}
        {tab === "tasks" && (
          <TasksTab user={user} taskList={taskList} projectList={projectList} allTasks />
        )}

        {/* ── MY TASKS (Dev view) ───────────────────────────── */}
        {tab === "mytasks" && (
          <TasksTab user={user} taskList={myTasks} projectList={projectList} />
        )}

        {/* ── RESOURCES ─────────────────────────────────────── */}
        {tab === "resources" && (
          <ResourcesTab user={user} taskList={taskList} projectList={projectList} capacity={capacity} />
        )}

        {/* ── ANNOUNCEMENTS ─────────────────────────────────── */}
        {tab === "announcements" && (
          <AnnouncementsTab user={user} announcementList={announcementList} />
        )}

        {/* ── REPORTS ───────────────────────────────────────── */}
        {tab === "reports" && (
          <ReportsTab projectList={projectList} incidentList={incidentList} taskList={taskList} />
        )}

      </main>
    </div>
  );
}

// ── DASHBOARD TAB ────────────────────────────────────────────
function DashboardTab({ user, projectList, incidentList, taskList, announcementList, myTasks, activeProjects, openIncidents, criticalIncidents, completedTasks, roleGrad }) {
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, background: roleGrad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: "0 0 4px" }}>
          Welcome back, {user.name.split(" ")[0]}! 👋
        </h2>
        <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Active Projects" value={activeProjects} icon="🚀" grad={G.blue} sub={`${projectList.length} total`} />
        <StatCard label="Open Incidents" value={openIncidents} icon="🔥" grad={openIncidents > 0 ? G.red : G.green} sub={criticalIncidents > 0 ? `${criticalIncidents} critical` : "All clear"} />
        <StatCard label="Total Tasks" value={taskList.length} icon="✅" grad={G.purple} sub={`${completedTasks} done`} />
        <StatCard label="Team Members" value={USERS.length} icon="👥" grad={G.green} sub="Across all roles" />
        {user.role === "dev" && <StatCard label="My Tasks" value={myTasks.length} icon="🎯" grad={G.orange} sub={`${myTasks.filter(t=>t.status==="Done").length} done`} />}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 20 }}>
        {/* Recent Incidents */}
        <Card grad={G.red}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🔥 Recent Incidents</span>
            <Badge text={`${openIncidents} Open`} color={openIncidents > 0 ? C.red : C.green} />
          </div>
          {incidentList.length === 0
            ? <div style={{ color: C.muted, fontSize: 13, textAlign: "center", padding: "24px 0" }}>✅ No incidents reported</div>
            : incidentList.slice(0, 5).map(inc => (
              <div key={inc.id} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: PRIORITY_COLORS[inc.priority] || C.muted, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inc.title}</div>
                  <div style={{ color: C.muted, fontSize: 11, marginTop: 2 }}>{inc.project} · {inc.assignee}</div>
                </div>
                <Badge text={inc.status} color={STATUS_COLORS[inc.status] || C.muted} />
              </div>
            ))}
        </Card>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Projects status */}
          <Card grad={G.blue}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 14, fontSize: 15 }}>🚀 Project Status</div>
            {projectList.length === 0
              ? <div style={{ color: C.muted, fontSize: 13 }}>No projects yet.</div>
              : projectList.slice(0, 4).map(p => (
                <div key={p.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>{p.name}</span>
                    <Badge text={p.status} color={STATUS_COLORS[p.status] || C.muted} />
                  </div>
                  <div style={{ height: 5, background: C.card2, borderRadius: 3 }}>
                    <div style={{ height: "100%", width: `${p.progress || 0}%`, background: p.progress >= 75 ? G.green : p.progress >= 40 ? G.blue : G.orange, borderRadius: 3, transition: "width 0.5s" }} />
                  </div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{p.progress || 0}% complete</div>
                </div>
              ))}
          </Card>

          {/* Announcements */}
          <Card grad={G.purple}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 12, fontSize: 15 }}>📢 Latest Updates</div>
            {announcementList.length === 0
              ? <div style={{ color: C.muted, fontSize: 13 }}>No announcements.</div>
              : announcementList.slice(-3).reverse().map((a, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                  <div style={{ color: C.muted, fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{a.body}</div>
                  <div style={{ fontSize: 10, color: C.dim, marginTop: 4 }}>{a.author} · {a.time}</div>
                </div>
              ))}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── PROJECTS TAB ─────────────────────────────────────────────
function ProjectsTab({ user, projectList }) {
  const canAdd = user.role !== "dev";
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState({ name: "", description: "", status: "Planning", priority: "Medium", owner: "", team: [], progress: 0, dueDate: "" });

  const saveProject = () => {
    if (!form.name.trim()) return;
    push(ref(db, "projects"), { ...form, createdBy: user.name, createdAt: now() });
    setForm({ name: "", description: "", status: "Planning", priority: "Medium", owner: "", team: [], progress: 0, dueDate: "" });
    setShowForm(false);
  };

  const updateProgress = (id, progress) => update(ref(db, `projects/${id}`), { progress: Number(progress) });
  const updateStatus = (id, status) => update(ref(db, `projects/${id}`), { status });
  const deleteProject = (id) => remove(ref(db, `projects/${id}`));

  const filtered = filter === "All" ? projectList : projectList.filter(p => p.status === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <SectionTitle text="🚀 Projects" sub={`${projectList.length} total projects`} grad={G.blue} />
        {canAdd && <Btn grad={G.blue} onClick={() => setShowForm(!showForm)}>+ New Project</Btn>}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["All", "Planning", "Active", "In Progress", "On Hold", "Completed"].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${filter === s ? C.blue : C.border}`, background: filter === s ? `${C.blue}22` : "transparent", color: filter === s ? C.blue : C.muted, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>{s}</button>
        ))}
      </div>

      {/* Add Form */}
      {showForm && canAdd && (
        <Card grad={G.blue} style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>New Project</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Project name *" />
            <Select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {["Planning", "Active", "In Progress", "On Hold", "Completed"].map(s => <option key={s}>{s}</option>)}
            </Select>
            <Select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {["Critical", "High", "Medium", "Low"].map(s => <option key={s}>{s}</option>)}
            </Select>
            <Select value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}>
              <option value="">Assign Owner</option>
              {USERS.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </Select>
            <Input value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} type="date" />
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>Progress: {form.progress}%</span>
              <input type="range" min={0} max={100} value={form.progress} onChange={e => setForm(f => ({ ...f, progress: +e.target.value }))} style={{ flex: 1, accentColor: C.blue }} />
            </div>
          </div>
          <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Project description" rows={2} style={{ marginTop: 12 }} />
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Btn grad={G.blue} onClick={saveProject}>Save Project</Btn>
            <Btn onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Project Cards */}
      {filtered.length === 0
        ? <Card style={{ textAlign: "center", padding: 48 }}><div style={{ color: C.muted }}>No projects found.</div></Card>
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 16 }}>
          {filtered.map(p => (
            <Card key={p.id} grad={G.blue}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{p.name}</div>
                  {p.description && <div style={{ color: C.muted, fontSize: 12, lineHeight: 1.5, marginBottom: 8 }}>{p.description}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  <Badge text={p.priority} color={PRIORITY_COLORS[p.priority] || C.muted} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
                  <span style={{ color: C.muted }}>Progress</span>
                  <span style={{ color: C.cyan, fontWeight: 700 }}>{p.progress || 0}%</span>
                </div>
                <div style={{ height: 6, background: C.card2, borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${p.progress || 0}%`, background: (p.progress || 0) >= 75 ? G.green : (p.progress || 0) >= 40 ? G.blue : G.orange, borderRadius: 3, transition: "width 0.4s" }} />
                </div>
                {canAdd && <input type="range" min={0} max={100} value={p.progress || 0} onChange={e => updateProgress(p.id, e.target.value)} style={{ width: "100%", accentColor: C.blue, marginTop: 4 }} />}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge text={p.status} color={STATUS_COLORS[p.status] || C.muted} />
                  {p.owner && <div style={{ fontSize: 12, color: C.muted }}>👤 {p.owner}</div>}
                </div>
                {canAdd && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <Select value={p.status} onChange={e => updateStatus(p.id, e.target.value)} style={{ width: "auto", padding: "4px 8px", fontSize: 11 }}>
                      {["Planning", "Active", "In Progress", "On Hold", "Completed"].map(s => <option key={s}>{s}</option>)}
                    </Select>
                    <Btn sm danger onClick={() => deleteProject(p.id)}>✕</Btn>
                  </div>
                )}
              </div>
              {p.dueDate && <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>📅 Due: {p.dueDate}</div>}
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

// ── INCIDENTS TAB ────────────────────────────────────────────
function IncidentsTab({ user, incidentList }) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState({ title: "", description: "", priority: "High", status: "Open", project: "", assignee: "", type: "Bug" });

  const save = () => {
    if (!form.title.trim()) return;
    push(ref(db, "incidents"), { ...form, reportedBy: user.name, time: now() });
    setForm({ title: "", description: "", priority: "High", status: "Open", project: "", assignee: "", type: "Bug" });
    setShowForm(false);
  };

  const updateStatus = (id, status) => update(ref(db, `incidents/${id}`), { status });
  const deleteIncident = (id) => remove(ref(db, `incidents/${id}`));

  const filtered = filter === "All" ? incidentList : incidentList.filter(i => i.priority === filter || i.status === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <SectionTitle text="🔥 Incidents & Issues" sub={`${incidentList.filter(i => i.status === "Open").length} open · ${incidentList.filter(i => i.priority === "Critical").length} critical`} grad={G.red} />
        <Btn grad={G.red} onClick={() => setShowForm(!showForm)}>+ Report Incident</Btn>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {["All", "Critical", "High", "Medium", "Low", "Open", "Resolved", "Closed"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "5px 13px", borderRadius: 20, border: `1px solid ${filter === f ? C.red : C.border}`, background: filter === f ? `${C.red}22` : "transparent", color: filter === f ? C.red : C.muted, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>{f}</button>
        ))}
      </div>

      {showForm && (
        <Card grad={G.red} style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Report Incident</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Incident title *" />
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {["Bug", "Outage", "Performance", "Security", "Data Issue", "Other"].map(t => <option key={t}>{t}</option>)}
            </Select>
            <Select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {["Critical", "High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
            </Select>
            <Select value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
              <option value="">Assign to…</option>
              {USERS.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </Select>
            <Input value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} placeholder="Related project" />
          </div>
          <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the incident…" rows={3} style={{ marginTop: 12 }} />
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Btn grad={G.red} onClick={save}>🔥 Report Incident</Btn>
            <Btn onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {filtered.length === 0
        ? <Card style={{ textAlign: "center", padding: 48 }}><div style={{ fontSize: 40, marginBottom: 12 }}>✅</div><div style={{ color: C.muted }}>No incidents found!</div></Card>
        : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(inc => (
            <Card key={inc.id} style={{ borderLeft: `3px solid ${PRIORITY_COLORS[inc.priority] || C.muted}` }}>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{inc.title}</span>
                    <Badge text={inc.priority} color={PRIORITY_COLORS[inc.priority] || C.muted} />
                    <Badge text={inc.type || "Bug"} color={C.cyan} />
                  </div>
                  {inc.description && <p style={{ color: C.muted, fontSize: 13, margin: "0 0 8px", lineHeight: 1.5 }}>{inc.description}</p>}
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.muted, flexWrap: "wrap" }}>
                    {inc.project && <span>📁 {inc.project}</span>}
                    {inc.assignee && <span>👤 {inc.assignee}</span>}
                    <span>🕐 {inc.time}</span>
                    <span>Reported by {inc.reportedBy}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                  <Badge text={inc.status} color={STATUS_COLORS[inc.status] || C.muted} />
                  <Select value={inc.status} onChange={e => updateStatus(inc.id, e.target.value)} style={{ width: "auto", padding: "4px 8px", fontSize: 11 }}>
                    {["Open", "In Progress", "Resolved", "Closed"].map(s => <option key={s}>{s}</option>)}
                  </Select>
                  <Btn sm danger onClick={() => deleteIncident(inc.id)}>✕</Btn>
                </div>
              </div>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

// ── TASKS TAB ────────────────────────────────────────────────
function TasksTab({ user, taskList, projectList, allTasks }) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [form, setForm] = useState({ title: "", description: "", priority: "Medium", status: "To Do", assignee: "", project: "", dueDate: "" });

  const canAdd = user.role === "pm" || user.role === "leadership";
  const fullTaskList = useDB("tasks");
  const allTasksList = fullTaskList ? Object.entries(fullTaskList).map(([k, v]) => ({ id: k, ...v })) : [];
  const displayTasks = allTasks ? allTasksList : taskList;

  const save = () => {
    if (!form.title.trim()) return;
    push(ref(db, "tasks"), { ...form, createdBy: user.name, time: now() });
    setForm({ title: "", description: "", priority: "Medium", status: "To Do", assignee: "", project: "", dueDate: "" });
    setShowForm(false);
  };

  const updateStatus = (id, status) => update(ref(db, `tasks/${id}`), { status });
  const deleteTask = (id) => remove(ref(db, `tasks/${id}`));
  const filtered = filter === "All" ? displayTasks : displayTasks.filter(t => t.status === filter || t.priority === filter);

  const cols = ["To Do", "In Progress", "Blocked", "Done"];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <SectionTitle text={allTasks ? "✅ All Tasks" : "✅ My Tasks"} sub={`${displayTasks.filter(t => t.status === "Done").length} of ${displayTasks.length} completed`} grad={G.purple} />
        {canAdd && <Btn grad={G.purple} onClick={() => setShowForm(!showForm)}>+ New Task</Btn>}
      </div>

      {showForm && canAdd && (
        <Card grad={G.purple} style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>New Task</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title *" />
            <Select value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))}>
              <option value="">Assign to…</option>
              {USERS.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
            </Select>
            <Select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {["Critical", "High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
            </Select>
            <Select value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))}>
              <option value="">Link to project…</option>
              {projectList.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
            </Select>
            <Input value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} type="date" />
          </div>
          <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task description" rows={2} style={{ marginTop: 12 }} />
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Btn grad={G.purple} onClick={save}>Add Task</Btn>
            <Btn onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {/* Kanban Board */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {cols.map(col => {
          const colTasks = displayTasks.filter(t => t.status === col);
          const colColor = col === "Done" ? C.green : col === "Blocked" ? C.red : col === "In Progress" ? C.blue : C.muted;
          return (
            <div key={col}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: colColor }}>{col}</div>
                <Badge text={colTasks.length} color={colColor} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {colTasks.map(t => (
                  <Card key={t.id} style={{ padding: 14, cursor: "default" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{t.title}</div>
                    {t.description && <div style={{ color: C.muted, fontSize: 11, marginBottom: 8, lineHeight: 1.4 }}>{t.description}</div>}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      <Badge text={t.priority} color={PRIORITY_COLORS[t.priority] || C.muted} />
                    </div>
                    {t.assignee && <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>👤 {t.assignee}</div>}
                    {t.project && <div style={{ fontSize: 11, color: C.cyan, marginBottom: 8 }}>📁 {t.project}</div>}
                    {t.dueDate && <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>📅 {t.dueDate}</div>}
                    <div style={{ display: "flex", gap: 6 }}>
                      <Select value={t.status} onChange={e => updateStatus(t.id, e.target.value)} style={{ flex: 1, padding: "4px 8px", fontSize: 10 }}>
                        {["To Do", "In Progress", "Blocked", "Done"].map(s => <option key={s}>{s}</option>)}
                      </Select>
                      {canAdd && <Btn sm danger onClick={() => deleteTask(t.id)}>✕</Btn>}
                    </div>
                  </Card>
                ))}
                {colTasks.length === 0 && <div style={{ padding: "20px 0", textAlign: "center", color: C.dim, fontSize: 12, border: `1px dashed ${C.border}`, borderRadius: 12 }}>Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── RESOURCES TAB ────────────────────────────────────────────
function ResourcesTab({ user, taskList, projectList, capacity }) {
  const updateCapacity = (userId, val) => set(ref(db, `capacity/${userId}`), Number(val));

  return (
    <div>
      <SectionTitle text="👥 Team Resources & Capacity" sub="Workload visibility across all team members" grad={G.green} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {USERS.map(u => {
          const assigned = taskList.filter(t => t.assignee === u.name);
          const done = assigned.filter(t => t.status === "Done").length;
          const inProgress = assigned.filter(t => t.status === "In Progress").length;
          const blocked = assigned.filter(t => t.status === "Blocked").length;
          const cap = capacity?.[u.id] ?? 80;
          const load = assigned.length > 0 ? Math.min(100, Math.round((assigned.length / 8) * 100)) : 0;
          const loadColor = load >= 90 ? C.red : load >= 70 ? C.orange : C.green;
          const canEdit = user.role !== "dev";

          return (
            <Card key={u.id} grad={u.role === "leadership" ? G.purple : u.role === "pm" ? G.blue : G.green}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 14 }}>
                <Avatar initials={u.avatar} size={42} grad={u.role === "leadership" ? G.purple : u.role === "pm" ? G.blue : G.green} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{ROLES[u.role]}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
                {[["Total Tasks", assigned.length, C.blue], ["In Progress", inProgress, C.cyan], ["Done", done, C.green], ["Blocked", blocked, C.red]].map(([label, val, col]) => (
                  <div key={label} style={{ background: C.card2, borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: col }}>{val}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                  <span style={{ color: C.muted }}>Workload</span>
                  <span style={{ color: loadColor, fontWeight: 700 }}>{load}%</span>
                </div>
                <div style={{ height: 8, background: C.card2, borderRadius: 4, marginBottom: 10 }}>
                  <div style={{ height: "100%", width: `${load}%`, background: load >= 90 ? G.red : load >= 70 ? G.orange : G.green, borderRadius: 4, transition: "width 0.4s" }} />
                </div>
                {canEdit && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.muted, marginBottom: 4 }}>
                      <span>Capacity: {cap}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={cap} onChange={e => updateCapacity(u.id, e.target.value)} style={{ width: "100%", accentColor: C.teal }} />
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── ANNOUNCEMENTS TAB ────────────────────────────────────────
function AnnouncementsTab({ user, announcementList }) {
  const canPost = user.role === "leadership" || user.role === "pm";
  const [form, setForm] = useState({ title: "", body: "", type: "General" });
  const [showForm, setShowForm] = useState(false);

  const post = () => {
    if (!form.title.trim() || !form.body.trim()) return;
    push(ref(db, "announcements"), { ...form, author: user.name, time: now() });
    setForm({ title: "", body: "", type: "General" });
    setShowForm(false);
  };

  const typeColors = { General: C.blue, Urgent: C.red, Update: C.green, Maintenance: C.orange };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
        <SectionTitle text="📢 Announcements" sub="Team-wide updates and communications" grad={G.purple} />
        {canPost && <Btn grad={G.purple} onClick={() => setShowForm(!showForm)}>+ Post Announcement</Btn>}
      </div>

      {showForm && (
        <Card grad={G.purple} style={{ marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Title *" />
            <Select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              {["General", "Urgent", "Update", "Maintenance"].map(t => <option key={t}>{t}</option>)}
            </Select>
          </div>
          <Input value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="Announcement content…" rows={4} />
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <Btn grad={G.purple} onClick={post}>📢 Post to Team</Btn>
            <Btn onClick={() => setShowForm(false)}>Cancel</Btn>
          </div>
        </Card>
      )}

      {announcementList.length === 0
        ? <Card style={{ textAlign: "center", padding: 48 }}><div style={{ fontSize: 40, marginBottom: 12 }}>📢</div><div style={{ color: C.muted }}>No announcements yet.</div></Card>
        : <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[...announcementList].reverse().map((a, i) => (
            <Card key={i} style={{ borderLeft: `3px solid ${typeColors[a.type] || C.blue}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontWeight: 700, fontSize: 16 }}>{a.title}</span>
                  <Badge text={a.type} color={typeColors[a.type] || C.blue} />
                </div>
                <div style={{ fontSize: 11, color: C.muted, textAlign: "right" }}>
                  <div>{a.author}</div>
                  <div>{a.time}</div>
                </div>
              </div>
              <p style={{ color: C.muted, fontSize: 14, margin: 0, lineHeight: 1.6 }}>{a.body}</p>
            </Card>
          ))}
        </div>
      }
    </div>
  );
}

// ── REPORTS TAB ──────────────────────────────────────────────
function ReportsTab({ projectList, incidentList, taskList }) {
  const byStatus = (list, key) => {
    const counts = {};
    list.forEach(i => { const v = i[key] || "Unknown"; counts[v] = (counts[v] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const projectsByStatus = byStatus(projectList, "status");
  const incidentsByPriority = byStatus(incidentList, "priority");
  const tasksByAssignee = byStatus(taskList, "assignee");
  const completionRate = taskList.length > 0 ? Math.round((taskList.filter(t => t.status === "Done").length / taskList.length) * 100) : 0;

  const BarChart = ({ data, colorMap, title, grad }) => (
    <Card grad={grad}>
      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>{title}</div>
      {data.length === 0 ? <div style={{ color: C.muted, fontSize: 13 }}>No data yet.</div> : (
        <div>
          {data.map(([label, count]) => {
            const max = data[0][1];
            const color = colorMap?.[label] || C.blue;
            return (
              <div key={label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 13 }}>
                  <span style={{ color: C.text }}>{label}</span>
                  <span style={{ fontWeight: 700, color }}>{count}</span>
                </div>
                <div style={{ height: 10, background: C.card2, borderRadius: 5, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(count / max) * 100}%`, background: `${color}`, borderRadius: 5, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );

  return (
    <div>
      <SectionTitle text="📈 Reports & Analytics" sub="Organization-wide metrics and insights" grad={G.green} />

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Projects" value={projectList.length} icon="🚀" grad={G.blue} />
        <StatCard label="Active Incidents" value={incidentList.filter(i => i.status === "Open").length} icon="🔥" grad={G.red} />
        <StatCard label="Task Completion" value={`${completionRate}%`} icon="✅" grad={G.green} />
        <StatCard label="Critical Issues" value={incidentList.filter(i => i.priority === "Critical" && i.status === "Open").length} icon="⚠️" grad={G.orange} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <BarChart data={projectsByStatus} colorMap={STATUS_COLORS} title="📊 Projects by Status" grad={G.blue} />
        <BarChart data={incidentsByPriority} colorMap={PRIORITY_COLORS} title="🔥 Incidents by Priority" grad={G.red} />
      </div>

      <Card grad={G.purple}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>👥 Task Distribution by Team Member</div>
        {tasksByAssignee.length === 0 ? <div style={{ color: C.muted, fontSize: 13 }}>No task data yet.</div> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
            {tasksByAssignee.slice(0, 12).map(([name, count]) => {
              const u = USERS.find(u => u.name === name);
              return (
                <div key={name} style={{ background: C.card2, borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar initials={u?.avatar || "??"} size={32} grad={G.purple} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                    <div style={{ height: 4, background: C.border, borderRadius: 2, marginTop: 5 }}>
                      <div style={{ height: "100%", width: `${(count / tasksByAssignee[0][1]) * 100}%`, background: G.purple, borderRadius: 2 }} />
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: C.purple, fontFamily: "'Syne',sans-serif", fontSize: 16 }}>{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
