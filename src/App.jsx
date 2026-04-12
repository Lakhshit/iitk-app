import { useState, useEffect, useRef } from "react";

const APP_PASSWORD = "IITK2024";

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const tryUnlock = () => {
    if (input.trim().toUpperCase() === APP_PASSWORD) {
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f1e",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "sans-serif",
    }}>
      <div style={{
        background: "linear-gradient(135deg, #0d1a35, #111d38)",
        border: "1px solid #1e2f55",
        borderRadius: 20,
        padding: "48px 40px",
        width: "100%",
        maxWidth: 380,
        textAlign: "center",
        animation: shake ? "shake 0.4s" : "none",
      }}>
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-10px); }
            80% { transform: translateX(10px); }
          }
        `}</style>
        <div style={{
          width: 64, height: 64,
          background: "linear-gradient(135deg, #c9a84c, #f0d080)",
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 24, fontWeight: 900, color: "#0a0f1e",
          margin: "0 auto 20px",
          boxShadow: "0 0 30px rgba(201,168,76,0.3)",
        }}>IIT</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#c9a84c", letterSpacing: 3, marginBottom: 6 }}>IITK</div>
        <div style={{ fontSize: 12, color: "#667788", letterSpacing: 2, textTransform: "uppercase", marginBottom: 32 }}>Session Hub</div>
        <div style={{ fontSize: 14, color: "#8899bb", marginBottom: 20 }}>Enter session password to continue</div>
        <input
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && tryUnlock()}
          placeholder="Password"
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "#0a0f1e",
            border: `1px solid ${error ? "#e0784a" : "#1e2f55"}`,
            borderRadius: 10,
            color: "#e8dcc8",
            fontSize: 16,
            outline: "none",
            boxSizing: "border-box",
            marginBottom: 12,
            letterSpacing: 3,
            textAlign: "center",
          }}
          autoFocus
        />
        {error && <div style={{ color: "#e0784a", fontSize: 12, marginBottom: 12 }}>Incorrect password. Try again.</div>}
        <button onClick={tryUnlock} style={{
          width: "100%",
          padding: "12px",
          background: "linear-gradient(135deg, #8a6a20, #c9a84c)",
          border: "none",
          borderRadius: 10,
          color: "#0a0f1e",
          fontWeight: 700,
          fontSize: 14,
          cursor: "pointer",
          letterSpacing: 1,
        }}>Enter Session →</button>
      </div>
    </div>
  );
}

const MEMBERS = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  name: `Participant ${i + 1}`,
}));

const STORAGE_KEY = "iitk_session_data";

const defaultData = {
  attendance: {},
  learning: {},
  feedback: [],
  poll: {},
  sessionTitle: "Introduction to Machine Learning",
  sessionDate: new Date().toLocaleDateString("en-IN"),
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultData, ...JSON.parse(raw) } : defaultData;
  } catch {
    return defaultData;
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const EMOJI_RATINGS = ["😐", "🙂", "😊", "😁", "🤩"];
const TABS = ["Dashboard", "Attendance", "Learning", "Feedback", "Poll", "Insights"];

export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("iitk_unlocked") === "yes");
  const [data, setData] = useState(loadData);
  const [tab, setTab] = useState("Dashboard");

  if (!unlocked) return <PasswordGate onUnlock={() => { sessionStorage.setItem("iitk_unlocked", "yes"); setUnlocked(true); }} />;
  const [feedbackForm, setFeedbackForm] = useState({ name: "", rating: 3, comment: "", topic: "" });
  const [submitted, setSubmitted] = useState(false);
  const [pollVoted, setPollVoted] = useState(false);
  const [animIn, setAnimIn] = useState(true);
  const prevTab = useRef(tab);

  useEffect(() => { saveData(data); }, [data]);

  const switchTab = (t) => {
    setAnimIn(false);
    setTimeout(() => { setTab(t); setAnimIn(true); }, 150);
  };

  const toggleAttendance = (id) => {
    setData(d => ({ ...d, attendance: { ...d.attendance, [id]: !d.attendance[id] } }));
  };

  const setLearning = (id, val) => {
    setData(d => ({ ...d, learning: { ...d.learning, [id]: val } }));
  };

  const submitFeedback = () => {
    if (!feedbackForm.name.trim() || !feedbackForm.comment.trim()) return;
    setData(d => ({ ...d, feedback: [{ ...feedbackForm, time: new Date().toLocaleTimeString("en-IN") }, ...d.feedback] }));
    setFeedbackForm({ name: "", rating: 3, comment: "", topic: "" });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const votePoll = (option) => {
    if (pollVoted) return;
    setData(d => ({ ...d, poll: { ...d.poll, [option]: (d.poll[option] || 0) + 1 } }));
    setPollVoted(true);
  };

  const attended = Object.values(data.attendance).filter(Boolean).length;
  const learningVals = Object.values(data.learning);
  const avgLearning = learningVals.length ? Math.round(learningVals.reduce((a, b) => a + b, 0) / learningVals.length) : 0;
  const pollTotal = Object.values(data.poll).reduce((a, b) => a + b, 0);

  const POLL_OPTIONS = ["Excellent", "Good", "Average", "Needs Improvement"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0f1e",
      fontFamily: "'Crimson Pro', 'Georgia', serif",
      color: "#e8dcc8",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background texture */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: "radial-gradient(ellipse at 20% 20%, #1a2744 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, #1a1a0e 0%, transparent 60%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", inset: 0, zIndex: 0, opacity: 0.03,
        backgroundImage: "repeating-linear-gradient(0deg, #c9a84c 0px, transparent 1px, transparent 40px), repeating-linear-gradient(90deg, #c9a84c 0px, transparent 1px, transparent 40px)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <header style={{
        position: "relative", zIndex: 10,
        background: "linear-gradient(135deg, #0d1a35 0%, #1a2744 50%, #0d1a35 100%)",
        borderBottom: "2px solid #c9a84c",
        padding: "0",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* IITK Emblem */}
            <div style={{
              width: 54, height: 54,
              background: "linear-gradient(135deg, #c9a84c, #f0d080)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 900, color: "#0a0f1e",
              boxShadow: "0 0 20px rgba(201,168,76,0.4)",
              letterSpacing: -1,
              fontFamily: "serif",
            }}>IIT</div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3, color: "#c9a84c", lineHeight: 1, fontFamily: "'Playfair Display', 'Georgia', serif" }}>
                IITK
              </div>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#8899bb", textTransform: "uppercase", fontFamily: "sans-serif" }}>
                Session Hub
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 14, color: "#c9a84c", fontStyle: "italic" }}>{data.sessionTitle}</div>
            <div style={{ fontSize: 11, color: "#667788", fontFamily: "sans-serif", letterSpacing: 1 }}>{data.sessionDate} · 40 Participants</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", gap: 2, borderTop: "1px solid #1e2f55" }}>
          {TABS.map(t => (
            <button key={t} onClick={() => switchTab(t)} style={{
              padding: "10px 18px",
              background: tab === t ? "rgba(201,168,76,0.15)" : "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid #c9a84c" : "2px solid transparent",
              color: tab === t ? "#c9a84c" : "#6677aa",
              cursor: "pointer",
              fontSize: 12,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              fontFamily: "sans-serif",
              fontWeight: 600,
              transition: "all 0.2s",
            }}>{t}</button>
          ))}
        </div>
      </header>

      {/* Content */}
      <main style={{
        position: "relative", zIndex: 5,
        maxWidth: 1100, margin: "0 auto",
        padding: "32px 24px",
        opacity: animIn ? 1 : 0,
        transform: animIn ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.2s, transform 0.2s",
      }}>

        {/* DASHBOARD */}
        {tab === "Dashboard" && (
          <div>
            <h2 style={{ fontSize: 32, color: "#c9a84c", marginBottom: 8, fontFamily: "'Playfair Display', Georgia, serif" }}>
              Session Overview
            </h2>
            <p style={{ color: "#8899bb", marginBottom: 32, fontSize: 14, fontFamily: "sans-serif" }}>
              Live metrics from your learning session
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 36 }}>
              {[
                { label: "Present Today", value: `${attended}/40`, icon: "👥", color: "#4dbb8a" },
                { label: "Avg. Learning Score", value: `${avgLearning}%`, icon: "📈", color: "#c9a84c" },
                { label: "Feedbacks Received", value: data.feedback.length, icon: "💬", color: "#6b8cdd" },
                { label: "Poll Responses", value: pollTotal, icon: "📊", color: "#e0784a" },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: "linear-gradient(135deg, #0d1a35, #111d38)",
                  border: "1px solid #1e2f55",
                  borderRadius: 16,
                  padding: "24px 20px",
                  position: "relative",
                  overflow: "hidden",
                }}>
                  <div style={{ position: "absolute", top: -10, right: -10, fontSize: 60, opacity: 0.07 }}>{stat.icon}</div>
                  <div style={{ fontSize: 34, fontWeight: 700, color: stat.color, lineHeight: 1, fontFamily: "sans-serif" }}>{stat.value}</div>
                  <div style={{ fontSize: 12, color: "#667788", marginTop: 6, letterSpacing: 1, textTransform: "uppercase", fontFamily: "sans-serif" }}>{stat.label}</div>
                  <div style={{ marginTop: 12, height: 3, background: "#1e2f55", borderRadius: 2 }}>
                    <div style={{ height: "100%", background: stat.color, borderRadius: 2, width: `${stat.label === "Present Today" ? (attended / 40) * 100 : stat.label === "Avg. Learning Score" ? avgLearning : Math.min(100, (stat.value / 40) * 100)}%`, transition: "width 0.6s" }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Feedback Preview */}
            {data.feedback.length > 0 && (
              <div style={{ background: "#0d1a35", border: "1px solid #1e2f55", borderRadius: 16, padding: 24 }}>
                <h3 style={{ color: "#c9a84c", marginBottom: 16, fontSize: 18, fontFamily: "'Playfair Display', Georgia, serif" }}>Recent Feedback</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.feedback.slice(0, 3).map((f, i) => (
                    <div key={i} style={{ background: "#111d38", borderRadius: 10, padding: "14px 16px", borderLeft: "3px solid #c9a84c" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: "#e8dcc8", fontFamily: "sans-serif", fontSize: 14 }}>{f.name}</span>
                        <span style={{ fontSize: 20 }}>{EMOJI_RATINGS[f.rating - 1]}</span>
                      </div>
                      <p style={{ color: "#8899bb", fontSize: 13, margin: 0, fontFamily: "sans-serif", lineHeight: 1.5 }}>{f.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.feedback.length === 0 && attended === 0 && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "#334466" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🎓</div>
                <div style={{ fontSize: 18, fontFamily: "sans-serif" }}>Mark attendance, collect learning scores & feedback to see insights here.</div>
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE */}
        {tab === "Attendance" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
              <div>
                <h2 style={{ fontSize: 32, color: "#c9a84c", marginBottom: 4, fontFamily: "'Playfair Display', Georgia, serif" }}>Attendance</h2>
                <p style={{ color: "#8899bb", fontSize: 14, fontFamily: "sans-serif" }}>{attended} of 40 marked present</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setData(d => ({ ...d, attendance: Object.fromEntries(MEMBERS.map(m => [m.id, true])) }))}
                  style={{ padding: "8px 16px", background: "#1a3a25", border: "1px solid #4dbb8a", borderRadius: 8, color: "#4dbb8a", cursor: "pointer", fontSize: 12, fontFamily: "sans-serif" }}>
                  Mark All
                </button>
                <button onClick={() => setData(d => ({ ...d, attendance: {} }))}
                  style={{ padding: "8px 16px", background: "#2a1515", border: "1px solid #bb4d4d", borderRadius: 8, color: "#bb4d4d", cursor: "pointer", fontSize: 12, fontFamily: "sans-serif" }}>
                  Clear All
                </button>
              </div>
            </div>

            <div style={{ background: "#0d1a35", border: "1px solid #1e2f55", borderRadius: 16, padding: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                {MEMBERS.map(m => (
                  <div key={m.id} onClick={() => toggleAttendance(m.id)} style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    cursor: "pointer",
                    border: `1px solid ${data.attendance[m.id] ? "#4dbb8a" : "#1e2f55"}`,
                    background: data.attendance[m.id] ? "rgba(77,187,138,0.1)" : "#111d38",
                    display: "flex", alignItems: "center", gap: 10,
                    transition: "all 0.2s",
                    userSelect: "none",
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: data.attendance[m.id] ? "#4dbb8a" : "#1e2f55",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 700, color: "#0a0f1e",
                      fontFamily: "sans-serif",
                      transition: "all 0.2s",
                    }}>{data.attendance[m.id] ? "✓" : m.id}</div>
                    <span style={{ color: data.attendance[m.id] ? "#4dbb8a" : "#8899bb", fontSize: 13, fontFamily: "sans-serif" }}>
                      {m.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Bar */}
            <div style={{ marginTop: 20, background: "#0d1a35", border: "1px solid #1e2f55", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontFamily: "sans-serif", fontSize: 13 }}>
                <span style={{ color: "#8899bb" }}>Attendance Rate</span>
                <span style={{ color: "#4dbb8a", fontWeight: 700 }}>{Math.round((attended / 40) * 100)}%</span>
              </div>
              <div style={{ height: 12, background: "#1e2f55", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(attended / 40) * 100}%`, background: "linear-gradient(90deg, #4dbb8a, #a0efc0)", borderRadius: 6, transition: "width 0.4s" }} />
              </div>
            </div>
          </div>
        )}

        {/* LEARNING */}
        {tab === "Learning" && (
          <div>
            <h2 style={{ fontSize: 32, color: "#c9a84c", marginBottom: 4, fontFamily: "'Playfair Display', Georgia, serif" }}>Learning Meter</h2>
            <p style={{ color: "#8899bb", fontSize: 14, fontFamily: "sans-serif", marginBottom: 28 }}>
              Rate how much each participant understood — drag the slider or click a level.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {MEMBERS.filter(m => data.attendance[m.id]).map(m => {
                const val = data.learning[m.id] ?? 50;
                const color = val >= 80 ? "#4dbb8a" : val >= 50 ? "#c9a84c" : "#e0784a";
                return (
                  <div key={m.id} style={{ background: "#0d1a35", border: "1px solid #1e2f55", borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontFamily: "sans-serif" }}>
                      <span style={{ fontSize: 14, color: "#e8dcc8" }}>{m.name}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color }}>{val}%</span>
                    </div>
                    <input type="range" min={0} max={100} value={val}
                      onChange={e => setLearning(m.id, +e.target.value)}
                      style={{ width: "100%", accentColor: color, cursor: "pointer" }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, gap: 6 }}>
                      {["Beginner", "Developing", "Proficient", "Expert"].map((label, i) => {
                        const lvl = [25, 50, 75, 100][i];
                        return (
                          <button key={label} onClick={() => setLearning(m.id, lvl)} style={{
                            flex: 1, padding: "4px 0", fontSize: 9, borderRadius: 6,
                            border: `1px solid ${val === lvl ? color : "#1e2f55"}`,
                            background: val === lvl ? `${color}20` : "transparent",
                            color: val === lvl ? color : "#445566",
                            cursor: "pointer", fontFamily: "sans-serif", letterSpacing: 0.5,
                          }}>{label}</button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {Object.values(data.attendance).filter(Boolean).length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#334466", fontFamily: "sans-serif" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
                Mark attendance first to rate learning levels.
              </div>
            )}

            {/* Summary */}
            {learningVals.length > 0 && (
              <div style={{ marginTop: 24, background: "#0d1a35", border: "1px solid #1e2f55", borderRadius: 16, padding: 24 }}>
                <h3 style={{ color: "#c9a84c", marginBottom: 16, fontFamily: "'Playfair Display', Georgia, serif" }}>Learning Distribution</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, fontFamily: "sans-serif" }}>
                  {[["Expert (75–100%)", 75, 100, "#4dbb8a"], ["Proficient (50–74%)", 50, 74, "#c9a84c"], ["Developing (25–49%)", 25, 49, "#e0a84a"], ["Beginner (0–24%)", 0, 24, "#e0784a"]].map(([label, min, max, col]) => {
                    const count = learningVals.filter(v => v >= min && v <= max).length;
                    return (
                      <div key={label} style={{ textAlign: "center", background: "#111d38", borderRadius: 10, padding: "16px 8px" }}>
                        <div style={{ fontSize: 28, fontWeight: 700, color: col }}>{count}</div>
                        <div style={{ fontSize: 10, color: "#667788", marginTop: 4, lineHeight: 1.4 }}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK */}
        {tab === "Feedback" && (
          <div>
            <h2 style={{ fontSize: 32, color: "#c9a84c", marginBottom: 4, fontFamily: "'Playfair Display', Georgia, serif" }}>Feedback</h2>
            <p style={{ color: "#8899bb", fontSize: 14, fontFamily: "sans-serif", marginBottom: 28 }}>Share your experience with this session</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Form */}
              <div style={{ background: "#0d1a35", border: "1px solid #1e2f55", borderRadius: 16, padding: 28 }}>
                <h3 style={{ color: "#e8dcc8", marginBottom: 20, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18 }}>Submit Feedback</h3>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 11, color: "#667788", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif" }}>Your Name</label>
                  <input value={feedbackForm.name} onChange={e => setFeedbackForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter your name"
                    style={{ width: "100%", padding: "10px 14px", background: "#111d38", border: "1px solid #1e2f55", borderRadius: 8, color: "#e8dcc8", fontSize: 14, fontFamily: "sans-serif", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 10, fontSize: 11, color: "#667788", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif" }}>Session Rating</label>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {EMOJI_RATINGS.map((em, i) => (
                      <button key={i} onClick={() => setFeedbackForm(f => ({ ...f, rating: i + 1 }))} style={{
                        fontSize: 28, background: "transparent", border: feedbackForm.rating === i + 1 ? "2px solid #c9a84c" : "2px solid transparent",
                        borderRadius: 8, padding: "4px 8px", cursor: "pointer",
                        transform: feedbackForm.rating === i + 1 ? "scale(1.3)" : "scale(1)",
                        transition: "all 0.2s",
                      }}>{em}</button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 11, color: "#667788", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif" }}>Topic (optional)</label>
                  <input value={feedbackForm.topic} onChange={e => setFeedbackForm(f => ({ ...f, topic: e.target.value }))}
                    placeholder="e.g. Neural Networks, Data Analysis…"
                    style={{ width: "100%", padding: "10px 14px", background: "#111d38", border: "1px solid #1e2f55", borderRadius: 8, color: "#e8dcc8", fontSize: 14, fontFamily: "sans-serif", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 11, color: "#667788", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "sans-serif" }}>Your Feedback</label>
                  <textarea value={feedbackForm.comment} onChange={e => setFeedbackForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder="Share what you liked, what could improve…"
                    rows={4}
                    style={{ width: "100%", padding: "10px 14px", background: "#111d38", border: "1px solid #1e2f55", borderRadius: 8, color: "#e8dcc8", fontSize: 14, fontFamily: "sans-serif", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>

                <button onClick={submitFeedback} style={{
                  width: "100%", padding: "12px",
                  background: submitted ? "linear-gradient(135deg, #1a3a25, #2a5035)" : "linear-gradient(135deg, #8a6a20, #c9a84c)",
                  border: "none", borderRadius: 10, color: submitted ? "#4dbb8a" : "#0a0f1e",
                  fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "sans-serif",
                  letterSpacing: 1, transition: "all 0.3s",
                }}>
                  {submitted ? "✓ Feedback Submitted!" : "Submit Feedback"}
                </button>
              </div>

              {/* Feedback List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 520, overflowY: "auto" }}>
                {data.feedback.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#334466", fontFamily: "sans-serif" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                    No feedback yet. Be the first!
                  </div>
                ) : data.feedback.map((f, i) => (
                  <div key={i} style={{ background: "#0d1a35", border: "1px solid #1e2f55", borderRadius: 14, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 700, color: "#e8dcc8", fontFamily: "sans-serif", fontSize: 15 }}>{f.name}</span>
                        {f.topic && <span style={{ marginLeft: 8, fontSize: 11, background: "rgba(201,168,76,0.15)", color: "#c9a84c", padding: "2px 8px", borderRadius: 20, fontFamily: "sans-serif" }}>{f.topic}</span>}
                      </div>
                      <span style={{ fontSize: 22 }}>{EMOJI_RATINGS[f.rating - 1]}</span>
                    </div>
                    <p style={{ color: "#8899bb", fontSize: 13, margin: "0 0 8px 0", fontFamily: "sans-serif", lineHeight: 1.6 }}>{f.comment}</p>
                    <div style={{ fontSize: 10, color: "#334466", fontFamily: "sans-serif" }}>{f.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* POLL */}
        {tab === "Poll" && (
          <div>
            <h2 style={{ fontSize: 32, color: "#c9a84c", marginBottom: 4, fontFamily: "'Playfair Display', Georgia, serif" }}>Live Poll</h2>
            <p style={{ color: "#8899bb", fontSize: 14, fontFamily: "sans-serif", marginBottom: 28 }}>How would you rate today's session?</p>

            <div style={{ maxWidth: 600 }}>
              {POLL_OPTIONS.map((opt, i) => {
                const count = data.poll[opt] || 0;
                const pct = pollTotal > 0 ? Math.round((count / pollTotal) * 100) : 0;
                const colors = ["#4dbb8a", "#c9a84c", "#e0a84a", "#e0784a"];
                return (
                  <div key={opt} style={{ marginBottom: 14 }}>
                    <div style={{
                      background: "#0d1a35", border: `1px solid ${pollVoted ? colors[i] + "44" : "#1e2f55"}`,
                      borderRadius: 12, overflow: "hidden", cursor: pollVoted ? "default" : "pointer",
                      transition: "border-color 0.3s",
                    }} onClick={() => votePoll(opt)}>
                      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
                        {pollVoted && (
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: `${colors[i]}18`, transition: "width 0.6s" }} />
                        )}
                        <span style={{ fontFamily: "sans-serif", fontSize: 15, color: "#e8dcc8", position: "relative" }}>{opt}</span>
                        <div style={{ display: "flex", gap: 12, alignItems: "center", position: "relative" }}>
                          {pollVoted && <span style={{ fontSize: 12, color: colors[i], fontFamily: "sans-serif", fontWeight: 700 }}>{pct}%</span>}
                          {pollVoted && <span style={{ fontSize: 12, color: "#667788", fontFamily: "sans-serif" }}>{count} votes</span>}
                          {!pollVoted && <span style={{ fontSize: 16, color: "#c9a84c" }}>→</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!pollVoted && (
                <p style={{ color: "#445566", fontSize: 12, marginTop: 16, fontFamily: "sans-serif" }}>Click an option to vote. Results appear after voting.</p>
              )}
              {pollVoted && (
                <div style={{ marginTop: 20, background: "#0d1a35", border: "1px solid #1e2f55", borderRadius: 12, padding: 16, fontFamily: "sans-serif", fontSize: 14, color: "#4dbb8a", textAlign: "center" }}>
                  ✓ Thank you for voting! — {pollTotal} total responses
                </div>
              )}
            </div>
          </div>
        )}

        {/* INSIGHTS */}
        {tab === "Insights" && (
          <div>
            <h2 style={{ fontSize: 32, color: "#c9a84c", marginBottom: 4, fontFamily: "'Playfair Display', Georgia, serif" }}>Insights</h2>
            <p style={{ color: "#8899bb", fontSize: 14, fontFamily: "sans-serif", marginBottom: 28 }}>Analytics from the session</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

              {/* Attendance Doughnut visual */}
              <div style={{ background: "#0d1a35", border: "1px solid #1e2f55", borderRadius: 16, padding: 28 }}>
                <h3 style={{ color: "#e8dcc8", marginBottom: 20, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18 }}>Attendance Breakdown</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ position: "relative", width: 100, height: 100 }}>
                    <svg viewBox="0 0 36 36" style={{ width: 100, height: 100, transform: "rotate(-90deg)" }}>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e2f55" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#4dbb8a" strokeWidth="3"
                        strokeDasharray={`${(attended / 40) * 100} ${100 - (attended / 40) * 100}`}
                        strokeLinecap="round" />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#4dbb8a", fontFamily: "sans-serif" }}>
                      {Math.round((attended / 40) * 100)}%
                    </div>
                  </div>
                  <div style={{ fontFamily: "sans-serif" }}>
                    <div style={{ color: "#4dbb8a", fontSize: 22, fontWeight: 700 }}>{attended}</div>
                    <div style={{ color: "#667788", fontSize: 12 }}>Present</div>
                    <div style={{ marginTop: 8, color: "#e0784a", fontSize: 22, fontWeight: 700 }}>{40 - attended}</div>
                    <div style={{ color: "#667788", fontSize: 12 }}>Absent</div>
                  </div>
                </div>
              </div>

              {/* Avg Feedback Rating */}
              <div style={{ background: "#0d1a35", border: "1px solid #1e2f55", borderRadius: 16, padding: 28 }}>
                <h3 style={{ color: "#e8dcc8", marginBottom: 20, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18 }}>Feedback Sentiment</h3>
                {data.feedback.length === 0 ? (
                  <div style={{ color: "#334466", fontFamily: "sans-serif", fontSize: 14 }}>No feedback submitted yet.</div>
                ) : (
                  <div>
                    {EMOJI_RATINGS.map((em, i) => {
                      const cnt = data.feedback.filter(f => f.rating === i + 1).length;
                      const pct = data.feedback.length > 0 ? Math.round((cnt / data.feedback.length) * 100) : 0;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, fontFamily: "sans-serif" }}>
                          <span style={{ fontSize: 20, width: 26 }}>{em}</span>
                          <div style={{ flex: 1, height: 10, background: "#1e2f55", borderRadius: 5, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: `hsl(${i * 30 + 20}, 70%, 60%)`, borderRadius: 5, transition: "width 0.5s" }} />
                          </div>
                          <span style={{ color: "#667788", fontSize: 12, width: 30, textAlign: "right" }}>{cnt}</span>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 14, color: "#c9a84c", fontSize: 13 }}>
                      Avg rating: {data.feedback.length > 0 ? (data.feedback.reduce((a, f) => a + f.rating, 0) / data.feedback.length).toFixed(1) : "–"} / 5
                    </div>
                  </div>
                )}
              </div>

              {/* Learning Score Distribution */}
              <div style={{ background: "#0d1a35", border: "1px solid #1e2f55", borderRadius: 16, padding: 28, gridColumn: "1 / -1" }}>
                <h3 style={{ color: "#e8dcc8", marginBottom: 20, fontFamily: "'Playfair Display', Georgia, serif", fontSize: 18 }}>Learning Score Distribution</h3>
                {learningVals.length === 0 ? (
                  <div style={{ color: "#334466", fontFamily: "sans-serif", fontSize: 14 }}>No learning data yet. Mark attendance and set scores.</div>
                ) : (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120 }}>
                    {Array.from({ length: 10 }, (_, i) => {
                      const min = i * 10, max = min + 9;
                      const cnt = learningVals.filter(v => v >= min && v <= max).length;
                      const h = learningVals.length > 0 ? Math.max(8, (cnt / learningVals.length) * 100) : 0;
                      const col = min >= 75 ? "#4dbb8a" : min >= 50 ? "#c9a84c" : min >= 25 ? "#e0a84a" : "#e0784a";
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <div style={{ width: "100%", height: `${h}%`, background: col, borderRadius: "4px 4px 0 0", transition: "height 0.5s", position: "relative" }}>
                            {cnt > 0 && <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: col, fontFamily: "sans-serif", fontWeight: 700 }}>{cnt}</div>}
                          </div>
                          <div style={{ fontSize: 9, color: "#445566", fontFamily: "sans-serif" }}>{min}–{max}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        position: "relative", zIndex: 5,
        textAlign: "center", padding: "24px",
        color: "#223344", fontSize: 11,
        borderTop: "1px solid #111d38",
        fontFamily: "sans-serif", letterSpacing: 1,
        marginTop: 40,
      }}>
        IITK Session Hub · {data.sessionDate} · Kanpur
      </footer>
    </div>
  );
}
