import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set, push, update, remove } from "firebase/database";

// ─────────────────────────────────────────────────────────────
// ⚠️  STEP 1: PASTE YOUR FIREBASE CONFIG HERE
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCKsUJyfa6ktApJgAaZvpqj0RtTxVbY6N0",
  authDomain: "iitk-session.firebaseapp.com",
  databaseURL: "https://iitk-session-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iitk-session",
  storageBucket: "iitk-session.firebasestorage.app",
  messagingSenderId: "451756569425",
  appId: "1:451756569425:web:c327b5f4b973b79b0c9970",
};
// ─────────────────────────────────────────────────────────────

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const INSTRUCTOR_PASS = "ADMIN2024";
const MEMBERS = Array.from({ length: 40 }, (_, i) => `Participant ${i + 1}`);
const REACTIONS = [["👍","Got it!"],["❓","Question"],["🔥","Love it!"],["😕","Confused"],["✋","Raise Hand"],["⏸","Need Break"]];
const STARS = ["😐","🙂","😊","😁","🤩"];
const NOTE_COLORS = ["#ff3cac","#4d9fff","#00e5cc","#ff8c00","#9b59f5","#2ecc71"];

const C = {
  bg:"#080810", card:"#0f0f1a", card2:"#161625", border:"#252540",
  pink:"#ff3cac", blue:"#4d9fff", teal:"#00e5cc", orange:"#ff8c00",
  purple:"#9b59f5", green:"#2ecc71", text:"#eeeeff", muted:"#6060a0",
};
const G = {
  pink:"linear-gradient(135deg,#ff3cac,#9b59f5)",
  blue:"linear-gradient(135deg,#4d9fff,#00e5cc)",
  orange:"linear-gradient(135deg,#ff8c00,#ff3cac)",
  green:"linear-gradient(135deg,#2ecc71,#4d9fff)",
  purple:"linear-gradient(135deg,#9b59f5,#4d9fff)",
};

// ── Helpers ───────────────────────────────────────────────────
const Btn = ({ children, grad, onClick, style = {}, disabled }) => (
  <button onClick={onClick} disabled={disabled} style={{ padding:"11px 22px", background: grad || C.card, border: grad ? "none" : `1px solid ${C.border}`, borderRadius:12, color: grad ? "#fff" : C.muted, fontWeight:700, fontSize:13, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, transition:"all 0.15s", ...style }}>{children}</button>
);

const Input = ({ value, onChange, placeholder, type = "text", rows, style = {} }) => {
  const base = { width:"100%", padding:"11px 14px", background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit", ...style };
  return rows
    ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...base, resize:"vertical" }} />
    : <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={base} />;
};

const Select = ({ value, onChange, children, style = {} }) => (
  <select value={value} onChange={onChange} style={{ width:"100%", padding:"11px 14px", background:C.bg, border:`1px solid ${C.border}`, borderRadius:10, color:C.text, fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit", ...style }}>
    {children}
  </select>
);

const Card = ({ children, style = {}, grad }) => (
  <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:18, padding:24, position:"relative", overflow:"hidden", ...style }}>
    {grad && <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:grad }} />}
    {children}
  </div>
);

const SectionTitle = ({ text, sub, grad }) => (
  <div style={{ marginBottom:24 }}>
    <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:26, fontWeight:800, background: grad || G.pink, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", margin:"0 0 4px" }}>{text}</h2>
    {sub && <p style={{ color:C.muted, fontSize:13, margin:0 }}>{sub}</p>}
  </div>
);

const StatCard = ({ label, value, icon, grad }) => (
  <Card grad={grad} style={{ textAlign:"center" }}>
    <div style={{ fontSize:28, marginBottom:6 }}>{icon}</div>
    <div style={{ fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:800, background:grad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{value}</div>
    <div style={{ color:C.muted, fontSize:11, letterSpacing:1, textTransform:"uppercase", marginTop:4 }}>{label}</div>
  </Card>
);

// ── useDB hook: subscribe to a Firebase path ──────────────────
function useDB(path) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const r = ref(db, path);
    const unsub = onValue(r, snap => setData(snap.val()));
    return () => unsub();
  }, [path]);
  return data;
}

// ─────────────────────────────────────────────────────────────
// LOGIN SCREEN
// ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState(null); // "participant" | "instructor"
  const [name, setName] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const tryLogin = () => {
    if (role === "participant") {
      if (!name) return setErr("Please select your name.");
      onLogin({ role: "participant", name });
    } else {
      if (pass !== INSTRUCTOR_PASS) return setErr("Wrong password.");
      onLogin({ role: "instructor", name: "Instructor" });
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", position:"relative", overflow:"hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap'); *{box-sizing:border-box}`}</style>
      {[["#ff3cac","8%","15%"],["#4d9fff","75%","65%"],["#9b59f5","45%","85%"]].map(([c,l,t],i)=>(
        <div key={i} style={{position:"absolute",left:l,top:t,width:"280px",height:"280px",background:c,borderRadius:"50%",filter:"blur(90px)",opacity:0.12,pointerEvents:"none"}}/>
      ))}
      <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:420, padding:24 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ width:64, height:64, background:G.pink, borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:20, fontWeight:900, color:"#fff", fontFamily:"'Syne',sans-serif", boxShadow:"0 0 40px rgba(255,60,172,0.35)" }}>IIT</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, background:G.pink, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>IITK Session Hub</div>
          <div style={{ color:C.muted, fontSize:12, letterSpacing:2, textTransform:"uppercase", marginTop:4 }}>AI for Leaders · Live Session</div>
        </div>

        {!role ? (
          <Card>
            <p style={{ color:C.muted, textAlign:"center", marginBottom:20, fontSize:14 }}>Who are you joining as?</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <button onClick={() => { setRole("participant"); setErr(""); }} style={{ padding:"20px 12px", background:C.card2, border:`2px solid ${C.blue}`, borderRadius:14, cursor:"pointer", textAlign:"center", color:C.text }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🎓</div>
                <div style={{ fontWeight:700, fontSize:14, color:C.blue }}>Participant</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>Join the session</div>
              </button>
              <button onClick={() => { setRole("instructor"); setErr(""); }} style={{ padding:"20px 12px", background:C.card2, border:`2px solid ${C.purple}`, borderRadius:14, cursor:"pointer", textAlign:"center", color:C.text }}>
                <div style={{ fontSize:32, marginBottom:8 }}>🧑‍🏫</div>
                <div style={{ fontWeight:700, fontSize:14, color:C.purple }}>Instructor</div>
                <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>Manage session</div>
              </button>
            </div>
          </Card>
        ) : (
          <Card>
            <button onClick={() => { setRole(null); setErr(""); }} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:13, marginBottom:16, padding:0 }}>← Back</button>
            {role === "participant" ? (
              <>
                <p style={{ color:C.muted, fontSize:14, marginBottom:12 }}>Select your name to join:</p>
                <Select value={name} onChange={e => { setName(e.target.value); setErr(""); }} style={{ marginBottom:16 }}>
                  <option value="">-- Select your name --</option>
                  {MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                </Select>
              </>
            ) : (
              <>
                <p style={{ color:C.muted, fontSize:14, marginBottom:12 }}>Enter instructor password:</p>
                <Input value={pass} onChange={e => { setPass(e.target.value); setErr(""); }} placeholder="Password" type="password" style={{ marginBottom:16 }} />
              </>
            )}
            {err && <p style={{ color:C.pink, fontSize:12, marginBottom:12 }}>{err}</p>}
            <Btn grad={role === "participant" ? G.blue : G.purple} onClick={tryLogin} style={{ width:"100%" }}>
              {role === "participant" ? "🚀 Join Session" : "🔐 Login as Instructor"}
            </Btn>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PARTICIPANT APP
// ─────────────────────────────────────────────────────────────
function ParticipantApp({ user, onLogout }) {
  const [tab, setTab] = useState("feed");
  const [learningNote, setLearningNote] = useState("");
  const [learningScore, setLearningScore] = useState(50);
  const [learningSaved, setLearningSaved] = useState(false);
  const [fbForm, setFbForm] = useState({ rating: 3, comment: "", topic: "" });
  const [fbSaved, setFbSaved] = useState(false);
  const [question, setQuestion] = useState("");
  const [qSaved, setQSaved] = useState(false);
  const [myAnswers, setMyAnswers] = useState({});

  const feed = useDB("feed");
  const reactions = useDB("reactions");
  const questions = useDB("questions");
  const notes = useDB("notes");
  const quizData = useDB("quiz/questions");
  const myReaction = reactions?.[user.name] || null;

  const saveLearning = () => {
    set(ref(db, `feed/${user.name.replace(/ /g,"_")}`), {
      name: user.name, score: learningScore, note: learningNote, time: new Date().toLocaleTimeString("en-IN"),
    });
    setLearningSaved(true); setTimeout(() => setLearningSaved(false), 2500);
  };

  const sendReaction = (r) => {
    set(ref(db, `reactions/${user.name.replace(/ /g,"_")}`), r === myReaction ? null : r);
  };

  const submitQuestion = () => {
    if (!question.trim()) return;
    push(ref(db, "questions"), { name: user.name, question, answered: false, time: new Date().toLocaleTimeString("en-IN") });
    setQuestion(""); setQSaved(true); setTimeout(() => setQSaved(false), 2500);
  };

  const submitFeedback = () => {
    if (!fbForm.comment.trim()) return;
    push(ref(db, "feedback"), { name: user.name, ...fbForm, time: new Date().toLocaleTimeString("en-IN") });
    setFbForm({ rating: 3, comment: "", topic: "" }); setFbSaved(true); setTimeout(() => setFbSaved(false), 2500);
  };

  const PTABS = [
    { id:"feed", label:"🌊 Live Feed" },
    { id:"learn", label:"📚 My Learning" },
    { id:"react", label:"🙋 My Reaction" },
    { id:"qa", label:"💬 Q&A" },
    { id:"quiz", label:"🧠 Quiz" },
    { id:"notes", label:"📌 Notes" },
    { id:"feedback", label:"⭐ Feedback" },
  ];

  const feedEntries = feed ? Object.values(feed) : [];
  const noteEntries = notes ? Object.values(notes) : [];
  const questionEntries = questions ? Object.entries(questions).map(([k,v])=>({id:k,...v})) : [];
  const quizList = quizData ? Object.entries(quizData).map(([k,v])=>({id:k,...v})) : [];

  return (
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'DM Sans',sans-serif", color:C.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}input,textarea,select{font-family:'DM Sans',sans-serif}`}</style>
      <header style={{ background:C.card, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:100 }}>
        <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:14 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:38, height:38, background:G.blue, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:900, color:"#fff", fontFamily:"'Syne',sans-serif" }}>IIT</div>
              <div>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, background:G.blue, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1 }}>IITK Session Hub</div>
                <div style={{ color:C.muted, fontSize:10, letterSpacing:1.5, textTransform:"uppercase" }}>AI for Leaders</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ background:`${C.blue}22`, border:`1px solid ${C.blue}44`, borderRadius:20, padding:"4px 12px", fontSize:12, color:C.blue, fontWeight:600 }}>🎓 {user.name}</div>
              <button onClick={onLogout} style={{ background:"transparent", border:"none", color:C.muted, cursor:"pointer", fontSize:12 }}>Logout</button>
            </div>
          </div>
          <div style={{ display:"flex", gap:0, marginTop:10, overflowX:"auto" }}>
            {PTABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:"9px 14px", background:"transparent", border:"none", borderBottom: tab===t.id ? `2px solid ${C.blue}` : "2px solid transparent", color: tab===t.id ? C.blue : C.muted, cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap", transition:"all 0.2s" }}>{t.label}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth:1100, margin:"0 auto", padding:"28px 20px" }}>

        {/* LIVE FEED */}
        {tab==="feed" && (
          <div>
            <SectionTitle text="🌊 Live Class Feed" sub="See what everyone is learning in real time" grad={G.blue} />
            {feedEntries.length === 0
              ? <Card style={{ textAlign:"center", padding:48 }}><div style={{ fontSize:48, marginBottom:12 }}>🎓</div><div style={{ color:C.muted }}>No updates yet — be the first to share what you're learning!</div></Card>
              : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
                  {feedEntries.sort((a,b) => a.name.localeCompare(b.name)).map((e, i) => {
                    const col = e.score >= 75 ? C.green : e.score >= 50 ? C.blue : e.score >= 25 ? C.orange : C.pink;
                    const react = reactions?.[e.name.replace(/ /g,"_")];
                    return (
                      <Card key={i} grad={G.blue}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                          <div style={{ fontWeight:700, fontSize:14, color:C.blue }}>{e.name}</div>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            {react && <span style={{ fontSize:20 }}>{react}</span>}
                            <div style={{ fontWeight:800, color:col, fontSize:16, fontFamily:"'Syne',sans-serif" }}>{e.score}%</div>
                          </div>
                        </div>
                        <div style={{ height:6, background:C.card2, borderRadius:3, marginBottom:10 }}>
                          <div style={{ height:"100%", width:`${e.score}%`, background: e.score>=75?G.green:e.score>=50?G.blue:e.score>=25?G.orange:G.pink, borderRadius:3, transition:"width 0.4s" }}/>
                        </div>
                        {e.note && <p style={{ color:C.muted, fontSize:13, margin:0, lineHeight:1.5 }}>{e.note}</p>}
                        <div style={{ fontSize:10, color:C.border, marginTop:8 }}>{e.time}</div>
                      </Card>
                    );
                  })}
                </div>
            }
          </div>
        )}

        {/* MY LEARNING */}
        {tab==="learn" && (
          <div>
            <SectionTitle text="📚 My Learning" sub="Rate your understanding and share what you learned" grad={G.green} />
            <Card grad={G.green} style={{ maxWidth:560 }}>
              <div style={{ marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:13 }}>
                  <span style={{ color:C.muted }}>How well did you understand?</span>
                  <span style={{ fontWeight:800, color: learningScore>=75?C.green:learningScore>=50?C.blue:learningScore>=25?C.orange:C.pink, fontFamily:"'Syne',sans-serif", fontSize:18 }}>{learningScore}%</span>
                </div>
                <input type="range" min={0} max={100} value={learningScore} onChange={e=>setLearningScore(+e.target.value)}
                  style={{ width:"100%", accentColor:C.green, cursor:"pointer" }}/>
                <div style={{ display:"flex", gap:6, marginTop:8 }}>
                  {[["😕 Beginner",10],["🙂 Getting it",40],["😊 Understood",70],["🤩 Mastered",100]].map(([l,v])=>(
                    <button key={v} onClick={()=>setLearningScore(v)} style={{ flex:1, padding:"5px 0", fontSize:9, borderRadius:8, border:`1px solid ${learningScore===v?C.green:C.border}`, background:learningScore===v?`${C.green}22`:"transparent", color:learningScore===v?C.green:C.muted, cursor:"pointer" }}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", color:C.muted, fontSize:12, marginBottom:8, textTransform:"uppercase", letterSpacing:1 }}>What did you learn? (share with the class)</label>
                <Input value={learningNote} onChange={e=>setLearningNote(e.target.value)} placeholder="e.g. I learned how neural networks work and their applications in leadership decision-making…" rows={4} />
              </div>
              <Btn grad={learningSaved ? G.green : G.green} onClick={saveLearning} style={{ width:"100%" }}>
                {learningSaved ? "✅ Shared with class!" : "📤 Share with Class"}
              </Btn>
            </Card>
          </div>
        )}

        {/* MY REACTION */}
        {tab==="react" && (
          <div>
            <SectionTitle text="🙋 My Reaction" sub="Let the instructor know how you're feeling" grad={G.orange} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14, maxWidth:700 }}>
              {REACTIONS.map(([emoji, label]) => {
                const active = myReaction === emoji;
                return (
                  <button key={emoji} onClick={() => sendReaction(emoji)} style={{ padding:"24px 16px", background: active ? `${C.orange}22` : C.card, border:`2px solid ${active?C.orange:C.border}`, borderRadius:16, cursor:"pointer", textAlign:"center", color:C.text, transition:"all 0.2s", transform: active ? "scale(1.05)" : "scale(1)" }}>
                    <div style={{ fontSize:40, marginBottom:10 }}>{emoji}</div>
                    <div style={{ fontSize:13, fontWeight:active?700:400, color:active?C.orange:C.muted }}>{label}</div>
                    {active && <div style={{ marginTop:8, fontSize:10, color:C.orange, fontWeight:700 }}>● Active</div>}
                  </button>
                );
              })}
            </div>
            {myReaction && (
              <div style={{ marginTop:16 }}>
                <Btn onClick={() => sendReaction(myReaction)} style={{ color:C.pink, borderColor:C.pink }}>✕ Clear my reaction</Btn>
              </div>
            )}

            {/* Class reactions overview */}
            <div style={{ marginTop:28 }}>
              <div style={{ fontWeight:700, marginBottom:14, color:C.text, fontFamily:"'Syne',sans-serif" }}>Class Reactions Right Now:</div>
              <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                {REACTIONS.map(([emoji]) => {
                  const count = reactions ? Object.values(reactions).filter(r => r === emoji).length : 0;
                  if (!count) return null;
                  return (
                    <div key={emoji} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 18px", display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:24 }}>{emoji}</span>
                      <span style={{ fontWeight:800, fontSize:18, color:C.orange, fontFamily:"'Syne',sans-serif" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Q&A */}
        {tab==="qa" && (
          <div>
            <SectionTitle text="💬 Q&A Board" sub="Ask questions — instructor will answer live" grad={G.purple} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1.3fr", gap:24 }}>
              <Card grad={G.purple}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, marginBottom:16, fontSize:15 }}>Ask a Question</div>
                <Input value={question} onChange={e=>{setQuestion(e.target.value);setQSaved(false);}} placeholder="What's unclear? What do you want to know more about?" rows={4} style={{ marginBottom:14 }} />
                <Btn grad={qSaved?G.green:G.purple} onClick={submitQuestion} style={{ width:"100%" }}>
                  {qSaved ? "✅ Question submitted!" : "Submit Question"}
                </Btn>
              </Card>
              <div style={{ display:"flex", flexDirection:"column", gap:12, maxHeight:480, overflowY:"auto" }}>
                {questionEntries.length === 0
                  ? <div style={{ color:C.muted, textAlign:"center", paddingTop:48 }}>No questions yet.</div>
                  : questionEntries.map((q) => (
                    <Card key={q.id} style={{ borderLeft:`3px solid ${q.answered?C.green:C.purple}`, padding:16 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                        <span style={{ fontWeight:700, fontSize:13, color:C.purple }}>{q.name}</span>
                        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                          <span style={{ fontSize:10, color:C.muted }}>{q.time}</span>
                          {q.answered && <span style={{ fontSize:11, color:C.green, background:`${C.green}22`, padding:"2px 8px", borderRadius:20, fontWeight:600 }}>✅ Answered</span>}
                        </div>
                      </div>
                      <p style={{ color:C.text, fontSize:13, margin:0, lineHeight:1.6 }}>{q.question}</p>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {tab==="quiz" && (
          <div>
            <SectionTitle text="🧠 Quiz" sub="Test your knowledge" grad={G.orange} />
            {quizList.length === 0
              ? <Card style={{ textAlign:"center", padding:48 }}><div style={{ fontSize:48, marginBottom:12 }}>🧠</div><div style={{ color:C.muted }}>No quiz yet — instructor hasn't created one.</div></Card>
              : <div style={{ maxWidth:600 }}>
                  {quizList.map((q, i) => {
                    const ans = myAnswers[q.id]; const done = ans !== undefined;
                    return (
                      <Card key={q.id} style={{ marginBottom:16 }} grad={G.orange}>
                        <div style={{ fontWeight:700, fontSize:15, marginBottom:14 }}>Q{i+1}. {q.question}</div>
                        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                          {q.options.map((opt, j) => {
                            let border=C.border, bg=C.card2, col=C.text;
                            if(done){if(j===q.correct){border=C.green;bg=`${C.green}22`;col=C.green;}else if(j===ans){border=C.pink;bg=`${C.pink}22`;col=C.pink;}}
                            return (
                              <button key={j} onClick={()=>!done&&setMyAnswers(a=>({...a,[q.id]:j}))}
                                style={{padding:"11px 16px",borderRadius:10,border:`1px solid ${border}`,background:bg,color:col,fontSize:13,cursor:done?"default":"pointer",textAlign:"left",transition:"all 0.15s"}}>
                                {String.fromCharCode(65+j)}. {opt}{done&&j===q.correct&&" ✓"}{done&&j===ans&&j!==q.correct&&" ✗"}
                              </button>
                            );
                          })}
                        </div>
                        {done && <div style={{marginTop:10,fontSize:12,color:ans===q.correct?C.green:C.pink,fontWeight:700}}>{ans===q.correct?"🎉 Correct!":"❌ Wrong — correct: "+String.fromCharCode(65+q.correct)}</div>}
                      </Card>
                    );
                  })}
                  {Object.keys(myAnswers).length===quizList.length && (
                    <Card grad={G.green} style={{textAlign:"center",padding:28}}>
                      <div style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,background:G.green,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                        Score: {Object.entries(myAnswers).filter(([id,j])=>j===quizList.find(q=>q.id===id)?.correct).length}/{quizList.length}
                      </div>
                      <Btn onClick={()=>setMyAnswers({})} style={{marginTop:12}}>🔁 Retry</Btn>
                    </Card>
                  )}
                </div>
            }
          </div>
        )}

        {/* NOTES */}
        {tab==="notes" && (
          <div>
            <SectionTitle text="📌 Session Notes" sub="Key points posted by the instructor" grad={G.purple} />
            {noteEntries.length === 0
              ? <Card style={{textAlign:"center",padding:48}}><div style={{fontSize:48,marginBottom:12}}>📌</div><div style={{color:C.muted}}>No notes posted yet.</div></Card>
              : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:14}}>
                  {noteEntries.map((n,i)=>(
                    <Card key={i} style={{borderTop:`4px solid ${n.color}`}}>
                      <div style={{fontWeight:700,color:n.color,marginBottom:8,fontSize:14}}>{n.title}</div>
                      <p style={{color:C.muted,fontSize:13,margin:"0 0 8px",lineHeight:1.6}}>{n.body}</p>
                      <div style={{fontSize:10,color:C.border}}>{n.time}</div>
                    </Card>
                  ))}
                </div>
            }
          </div>
        )}

        {/* FEEDBACK */}
        {tab==="feedback" && (
          <div>
            <SectionTitle text="⭐ Session Feedback" sub="Share your honest experience" grad={G.pink} />
            <Card grad={G.pink} style={{maxWidth:520}}>
              <div style={{marginBottom:16}}>
                <label style={{display:"block",color:C.muted,fontSize:12,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>Rating</label>
                <div style={{display:"flex",gap:10}}>
                  {STARS.map((em,i)=>(
                    <button key={i} onClick={()=>setFbForm(f=>({...f,rating:i+1}))} style={{fontSize:30,background:"transparent",border:`2px solid ${fbForm.rating===i+1?C.pink:"transparent"}`,borderRadius:10,padding:"4px 8px",cursor:"pointer",transform:fbForm.rating===i+1?"scale(1.3)":"scale(1)",transition:"all 0.15s"}}>{em}</button>
                  ))}
                </div>
              </div>
              <Input value={fbForm.topic} onChange={e=>setFbForm(f=>({...f,topic:e.target.value}))} placeholder="Topic (e.g. AI Ethics, Neural Networks)" style={{marginBottom:12}} />
              <Input value={fbForm.comment} onChange={e=>setFbForm(f=>({...f,comment:e.target.value}))} placeholder="What did you like? What could be better?" rows={4} style={{marginBottom:16}} />
              <Btn grad={fbSaved?G.green:G.pink} onClick={submitFeedback} style={{width:"100%"}}>
                {fbSaved?"✅ Feedback submitted!":"Submit Feedback ⭐"}
              </Btn>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INSTRUCTOR APP
// ─────────────────────────────────────────────────────────────
function InstructorApp({ onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const [noteForm, setNoteForm] = useState({ title:"", body:"", color:"#ff3cac" });
  const [quizForm, setQuizForm] = useState({ question:"", options:["","","",""], correct:0 });
  const [quizView, setQuizView] = useState("list");

  const feed = useDB("feed");
  const reactions = useDB("reactions");
  const questions = useDB("questions");
  const notes = useDB("notes");
  const quizData = useDB("quiz/questions");
  const feedbackData = useDB("feedback");

  const feedEntries = feed ? Object.values(feed) : [];
  const questionEntries = questions ? Object.entries(questions).map(([k,v])=>({id:k,...v})) : [];
  const noteEntries = notes ? Object.entries(notes).map(([k,v])=>({id:k,...v})) : [];
  const quizList = quizData ? Object.entries(quizData).map(([k,v])=>({id:k,...v})) : [];
  const feedbackList = feedbackData ? Object.values(feedbackData) : [];

  const avgScore = feedEntries.length ? Math.round(feedEntries.reduce((s,e)=>s+e.score,0)/feedEntries.length) : 0;
  const totalReactions = reactions ? Object.values(reactions).filter(Boolean).length : 0;

  const markAttendance = (name, val) => set(ref(db, `attendance/${name.replace(/ /g,"_")}`), val);
  const attendance = useDB("attendance");

  const postNote = () => {
    if (!noteForm.title.trim() || !noteForm.body.trim()) return;
    push(ref(db, "notes"), { ...noteForm, time: new Date().toLocaleTimeString("en-IN") });
    setNoteForm({ title:"", body:"", color:"#ff3cac" });
  };

  const addQuizQuestion = () => {
    if (!quizForm.question.trim() || quizForm.options.some(o=>!o.trim())) return;
    push(ref(db, "quiz/questions"), { ...quizForm });
    setQuizForm({ question:"", options:["","","",""], correct:0 });
  };

  const toggleAnswered = (q) => update(ref(db, `questions/${q.id}`), { answered: !q.answered });
  const deleteQuestion = (id) => remove(ref(db, `questions/${id}`));
  const deleteNote = (id) => remove(ref(db, `notes/${id}`));
  const deleteQuizQ = (id) => remove(ref(db, `quiz/questions/${id}`));

  const ITABS = [
    { id:"dashboard", label:"📊 Dashboard" },
    { id:"attendance", label:"✅ Attendance" },
    { id:"feed", label:"🌊 Class Feed" },
    { id:"qa", label:"💬 Q&A" },
    { id:"notes", label:"📌 Post Notes" },
    { id:"quiz", label:"🧠 Create Quiz" },
    { id:"feedback", label:"⭐ Feedback" },
    { id:"insights", label:"📈 Insights" },
  ];

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.text}}>
      <header style={{background:C.card,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 20px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:14}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,background:G.purple,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",fontFamily:"'Syne',sans-serif"}}>IIT</div>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,background:G.purple,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>IITK Session Hub</div>
                <div style={{color:C.muted,fontSize:10,letterSpacing:1.5,textTransform:"uppercase"}}>Instructor Dashboard</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{background:`${C.purple}22`,border:`1px solid ${C.purple}44`,borderRadius:20,padding:"4px 12px",fontSize:12,color:C.purple,fontWeight:600}}>🧑‍🏫 Instructor</div>
              <button onClick={onLogout} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:12}}>Logout</button>
            </div>
          </div>
          <div style={{display:"flex",gap:0,marginTop:10,overflowX:"auto"}}>
            {ITABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"9px 14px",background:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${C.purple}`:"2px solid transparent",color:tab===t.id?C.purple:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",transition:"all 0.2s"}}>{t.label}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{maxWidth:1200,margin:"0 auto",padding:"28px 20px"}}>

        {/* DASHBOARD */}
        {tab==="dashboard" && (
          <div>
            <SectionTitle text="📊 Instructor Dashboard" sub="Real-time session overview" grad={G.purple}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:16,marginBottom:28}}>
              <StatCard label="Submitted Learning" value={feedEntries.length} icon="📚" grad={G.blue}/>
              <StatCard label="Avg Understanding" value={`${avgScore}%`} icon="📈" grad={G.green}/>
              <StatCard label="Active Reactions" value={totalReactions} icon="🙋" grad={G.orange}/>
              <StatCard label="Questions Asked" value={questionEntries.length} icon="💬" grad={G.purple}/>
              <StatCard label="Unanswered" value={questionEntries.filter(q=>!q.answered).length} icon="❓" grad={G.pink}/>
              <StatCard label="Feedbacks" value={feedbackList.length} icon="⭐" grad={G.gold||G.orange}/>
            </div>

            {/* Reaction Summary */}
            <Card grad={G.orange} style={{marginBottom:20}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15}}>🙋 Live Reactions</div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
                {REACTIONS.map(([emoji,label])=>{
                  const count = reactions ? Object.values(reactions).filter(r=>r===emoji).length : 0;
                  return(
                    <div key={emoji} style={{display:"flex",alignItems:"center",gap:8,background:C.card2,padding:"10px 16px",borderRadius:12}}>
                      <span style={{fontSize:22}}>{emoji}</span>
                      <div><div style={{fontWeight:800,fontSize:16,color:C.orange,fontFamily:"'Syne',sans-serif"}}>{count}</div><div style={{fontSize:10,color:C.muted}}>{label}</div></div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Latest questions */}
            {questionEntries.filter(q=>!q.answered).length > 0 && (
              <Card grad={G.purple}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>❓ Pending Questions</div>
                {questionEntries.filter(q=>!q.answered).slice(0,4).map(q=>(
                  <div key={q.id} style={{background:C.card2,borderRadius:10,padding:"10px 14px",marginBottom:10,borderLeft:`3px solid ${C.purple}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:13,color:C.purple,marginBottom:4}}>{q.name}</div>
                      <div style={{color:C.text,fontSize:13}}>{q.question}</div>
                    </div>
                    <Btn grad={G.green} onClick={()=>toggleAnswered(q)} style={{whiteSpace:"nowrap",padding:"6px 14px",fontSize:12}}>✓ Done</Btn>
                  </div>
                ))}
              </Card>
            )}
          </div>
        )}

        {/* ATTENDANCE */}
        {tab==="attendance" && (
          <div>
            <SectionTitle text="✅ Attendance" sub={`${MEMBERS.filter(m=>attendance?.[m.replace(/ /g,"_")]).length} of 40 present`} grad={G.green}/>
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              <Btn grad={G.green} onClick={()=>MEMBERS.forEach(m=>set(ref(db,`attendance/${m.replace(/ /g,"_")}`),true))}>✅ Mark All Present</Btn>
              <Btn onClick={()=>MEMBERS.forEach(m=>remove(ref(db,`attendance/${m.replace(/ /g,"_")}`)))}>🗑 Clear All</Btn>
            </div>
            <Card>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:8}}>
                {MEMBERS.map(m=>{
                  const key=m.replace(/ /g,"_");
                  const present=!!attendance?.[key];
                  return(
                    <div key={m} onClick={()=>markAttendance(m,!present)}
                      style={{padding:"10px 14px",borderRadius:12,cursor:"pointer",border:`1px solid ${present?C.green:C.border}`,background:present?`${C.green}15`:C.card2,display:"flex",alignItems:"center",gap:10,transition:"all 0.15s",userSelect:"none"}}>
                      <div style={{width:26,height:26,borderRadius:"50%",background:present?G.green:C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{present?"✓":m.split(" ")[1]}</div>
                      <span style={{color:present?C.green:C.muted,fontSize:13,fontWeight:present?600:400}}>{m}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}

        {/* CLASS FEED */}
        {tab==="feed" && (
          <div>
            <SectionTitle text="🌊 Class Feed" sub="All participant learning updates" grad={G.blue}/>
            {feedEntries.length===0
              ? <Card style={{textAlign:"center",padding:48}}><div style={{color:C.muted}}>No updates yet.</div></Card>
              : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
                  {feedEntries.map((e,i)=>{
                    const col=e.score>=75?C.green:e.score>=50?C.blue:e.score>=25?C.orange:C.pink;
                    const react=reactions?.[e.name.replace(/ /g,"_")];
                    return(
                      <Card key={i} grad={G.blue}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                          <div style={{fontWeight:700,fontSize:14,color:C.blue}}>{e.name}</div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            {react&&<span style={{fontSize:18}}>{react}</span>}
                            <span style={{fontWeight:800,color:col,fontSize:16,fontFamily:"'Syne',sans-serif"}}>{e.score}%</span>
                          </div>
                        </div>
                        <div style={{height:6,background:C.card2,borderRadius:3,marginBottom:10}}>
                          <div style={{height:"100%",width:`${e.score}%`,background:e.score>=75?G.green:e.score>=50?G.blue:e.score>=25?G.orange:G.pink,borderRadius:3}}/>
                        </div>
                        {e.note&&<p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.5}}>{e.note}</p>}
                        <div style={{fontSize:10,color:C.border,marginTop:8}}>{e.time}</div>
                      </Card>
                    );
                  })}
                </div>
            }
          </div>
        )}

        {/* Q&A */}
        {tab==="qa" && (
          <div>
            <SectionTitle text="💬 Q&A Management" sub="Answer and manage participant questions" grad={G.purple}/>
            {questionEntries.length===0
              ? <Card style={{textAlign:"center",padding:48}}><div style={{color:C.muted}}>No questions yet.</div></Card>
              : <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {questionEntries.sort((a,b)=>a.answered-b.answered).map(q=>(
                    <Card key={q.id} style={{borderLeft:`3px solid ${q.answered?C.green:C.purple}`,padding:18}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                            <span style={{fontWeight:700,fontSize:13,color:C.purple}}>{q.name}</span>
                            <span style={{fontSize:10,color:C.muted}}>{q.time}</span>
                          </div>
                          <p style={{color:C.text,fontSize:14,margin:0,lineHeight:1.6}}>{q.question}</p>
                        </div>
                        <div style={{display:"flex",gap:8,flexShrink:0}}>
                          <Btn grad={q.answered?G.green:G.purple} onClick={()=>toggleAnswered(q)} style={{padding:"6px 14px",fontSize:12}}>
                            {q.answered?"✅ Answered":"Mark Done"}
                          </Btn>
                          <Btn onClick={()=>deleteQuestion(q.id)} style={{padding:"6px 12px",fontSize:12,color:C.pink,borderColor:C.pink}}>✕</Btn>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
            }
          </div>
        )}

        {/* POST NOTES */}
        {tab==="notes" && (
          <div>
            <SectionTitle text="📌 Post Session Notes" sub="Share key points — visible to all participants" grad={G.pink}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:24}}>
              <Card grad={G.pink}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15}}>New Note</div>
                <Input value={noteForm.title} onChange={e=>setNoteForm(f=>({...f,title:e.target.value}))} placeholder="Note title…" style={{marginBottom:12}}/>
                <Input value={noteForm.body} onChange={e=>setNoteForm(f=>({...f,body:e.target.value}))} placeholder="Write the note content…" rows={5} style={{marginBottom:14}}/>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Color</div>
                  <div style={{display:"flex",gap:8}}>
                    {NOTE_COLORS.map(col=>(
                      <button key={col} onClick={()=>setNoteForm(f=>({...f,color:col}))} style={{width:26,height:26,borderRadius:"50%",background:col,border:noteForm.color===col?"3px solid #fff":"3px solid transparent",cursor:"pointer"}}/>
                    ))}
                  </div>
                </div>
                <Btn grad={G.pink} onClick={postNote} style={{width:"100%"}}>📌 Post to All Participants</Btn>
              </Card>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,alignContent:"start"}}>
                {noteEntries.length===0
                  ? <div style={{color:C.muted,gridColumn:"1/-1",textAlign:"center",paddingTop:48}}>No notes yet.</div>
                  : noteEntries.map(n=>(
                    <Card key={n.id} style={{borderTop:`4px solid ${n.color}`,position:"relative"}}>
                      <button onClick={()=>deleteNote(n.id)} style={{position:"absolute",top:12,right:12,background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:14}}>✕</button>
                      <div style={{fontWeight:700,color:n.color,marginBottom:8,fontSize:13,paddingRight:20}}>{n.title}</div>
                      <p style={{color:C.muted,fontSize:12,margin:"0 0 8px",lineHeight:1.5}}>{n.body}</p>
                      <div style={{fontSize:10,color:C.border}}>{n.time}</div>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* CREATE QUIZ */}
        {tab==="quiz" && (
          <div>
            <SectionTitle text="🧠 Create Quiz" sub="Add MCQ questions for participants" grad={G.orange}/>
            <div style={{display:"flex",gap:10,marginBottom:24}}>
              {[["list","📋 Questions"],["add","➕ Add Question"]].map(([v,label])=>(
                <Btn key={v} grad={quizView===v?G.orange:undefined} onClick={()=>setQuizView(v)}>{label}</Btn>
              ))}
            </div>
            {quizView==="add" && (
              <Card grad={G.orange} style={{maxWidth:580}}>
                <Input value={quizForm.question} onChange={e=>setQuizForm(f=>({...f,question:e.target.value}))} placeholder="Enter question…" style={{marginBottom:16,fontWeight:600,fontSize:15}}/>
                {quizForm.options.map((opt,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"center"}}>
                    <button onClick={()=>setQuizForm(f=>({...f,correct:i}))} style={{width:30,height:30,borderRadius:"50%",border:`2px solid ${quizForm.correct===i?C.green:C.border}`,background:quizForm.correct===i?`${C.green}22`:"transparent",color:quizForm.correct===i?C.green:C.muted,cursor:"pointer",fontWeight:700,flexShrink:0,fontSize:12}}>{String.fromCharCode(65+i)}</button>
                    <Input value={opt} onChange={e=>{const ops=[...quizForm.options];ops[i]=e.target.value;setQuizForm(f=>({...f,options:ops}));}} placeholder={`Option ${String.fromCharCode(65+i)}`} style={{border:`1px solid ${quizForm.correct===i?C.green+"66":C.border}`}}/>
                  </div>
                ))}
                <div style={{fontSize:11,color:C.muted,marginBottom:14}}>💡 Click the letter to mark correct answer</div>
                <Btn grad={G.orange} onClick={addQuizQuestion} style={{width:"100%"}}>Add Question 🧠</Btn>
              </Card>
            )}
            {quizView==="list" && (
              <div>
                {quizList.length===0
                  ? <Card style={{textAlign:"center",padding:48}}><div style={{color:C.muted}}>No questions yet.</div></Card>
                  : quizList.map((q,i)=>(
                    <Card key={q.id} style={{marginBottom:14}} grad={G.orange}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                        <div style={{fontWeight:700,fontSize:15}}>Q{i+1}. {q.question}</div>
                        <Btn onClick={()=>deleteQuizQ(q.id)} style={{padding:"5px 12px",fontSize:12,color:C.pink,borderColor:C.pink}}>✕</Btn>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {q.options.map((opt,j)=>(
                          <div key={j} style={{padding:"8px 14px",borderRadius:10,background:j===q.correct?`${C.green}22`:C.card2,border:`1px solid ${j===q.correct?C.green:C.border}`,fontSize:13,color:j===q.correct?C.green:C.muted}}>
                            {String.fromCharCode(65+j)}. {opt} {j===q.correct&&"✓"}
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK VIEW */}
        {tab==="feedback" && (
          <div>
            <SectionTitle text="⭐ All Feedback" sub="What participants are saying" grad={G.pink}/>
            {feedbackList.length===0
              ? <Card style={{textAlign:"center",padding:48}}><div style={{color:C.muted}}>No feedback yet.</div></Card>
              : <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {feedbackList.map((f,i)=>(
                    <Card key={i} style={{borderLeft:`3px solid ${C.pink}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <div>
                          <span style={{fontWeight:700,fontSize:14}}>{f.name}</span>
                          {f.topic&&<span style={{marginLeft:8,fontSize:11,background:`${C.pink}22`,color:C.pink,padding:"2px 8px",borderRadius:20}}>{f.topic}</span>}
                        </div>
                        <span style={{fontSize:22}}>{STARS[f.rating-1]}</span>
                      </div>
                      <p style={{color:C.muted,fontSize:13,margin:"0 0 6px",lineHeight:1.6}}>{f.comment}</p>
                      <div style={{fontSize:10,color:C.border}}>{f.time}</div>
                    </Card>
                  ))}
                </div>
            }
          </div>
        )}

        {/* INSIGHTS */}
        {tab==="insights" && (
          <div>
            <SectionTitle text="📈 Insights" grad={G.green}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
              <Card grad={G.green}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:20,fontSize:15}}>Attendance</div>
                <div style={{display:"flex",alignItems:"center",gap:24}}>
                  <div style={{position:"relative",width:90,height:90,flexShrink:0}}>
                    <svg viewBox="0 0 36 36" style={{width:90,height:90,transform:"rotate(-90deg)"}}>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.card2} strokeWidth="3.5"/>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.green} strokeWidth="3.5"
                        strokeDasharray={`${(MEMBERS.filter(m=>attendance?.[m.replace(/ /g,"_")]).length/40)*100} ${100-(MEMBERS.filter(m=>attendance?.[m.replace(/ /g,"_")]).length/40)*100}`} strokeLinecap="round"/>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,color:C.green}}>
                      {Math.round((MEMBERS.filter(m=>attendance?.[m.replace(/ /g,"_")]).length/40)*100)}%
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:24,fontWeight:800,color:C.green,fontFamily:"'Syne',sans-serif"}}>{MEMBERS.filter(m=>attendance?.[m.replace(/ /g,"_")]).length}</div>
                    <div style={{color:C.muted,fontSize:12}}>Present</div>
                    <div style={{fontSize:18,fontWeight:700,color:C.pink,fontFamily:"'Syne',sans-serif",marginTop:8}}>{40-MEMBERS.filter(m=>attendance?.[m.replace(/ /g,"_")]).length}</div>
                    <div style={{color:C.muted,fontSize:12}}>Absent</div>
                  </div>
                </div>
              </Card>
              <Card grad={G.pink}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15}}>Feedback Sentiment</div>
                {feedbackList.length===0?<div style={{color:C.muted,fontSize:13}}>No feedback yet.</div>:(
                  <div>
                    {STARS.map((em,i)=>{
                      const cnt=feedbackList.filter(f=>f.rating===i+1).length;
                      const pct=Math.round((cnt/feedbackList.length)*100);
                      return(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                          <span style={{fontSize:18,width:26}}>{em}</span>
                          <div style={{flex:1,height:10,background:C.card2,borderRadius:5,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${pct}%`,background:G.pink,borderRadius:5,transition:"width 0.5s"}}/>
                          </div>
                          <span style={{color:C.muted,fontSize:12,width:24,textAlign:"right"}}>{cnt}</span>
                        </div>
                      );
                    })}
                    <div style={{marginTop:10,fontSize:13,color:C.pink,fontWeight:700}}>Avg: {(feedbackList.reduce((a,f)=>a+f.rating,0)/feedbackList.length).toFixed(1)} / 5</div>
                  </div>
                )}
              </Card>
              <Card grad={G.blue} style={{gridColumn:"1/-1"}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:20,fontSize:15}}>Learning Distribution</div>
                {feedEntries.length===0?<div style={{color:C.muted,fontSize:13}}>No learning data yet.</div>:(
                  <div>
                    <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120,marginBottom:8}}>
                      {Array.from({length:10},(_,i)=>{
                        const min=i*10,max=min+9;
                        const cnt=feedEntries.filter(e=>e.score>=min&&e.score<=max).length;
                        const maxCnt=Math.max(...Array.from({length:10},(__,j)=>feedEntries.filter(e=>e.score>=j*10&&e.score<=j*10+9).length),1);
                        const h=Math.max(4,(cnt/maxCnt)*110);
                        const g=min>=75?G.green:min>=50?G.blue:min>=25?G.orange:G.pink;
                        return(
                          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                            {cnt>0&&<div style={{fontSize:11,fontWeight:700,color:C.muted}}>{cnt}</div>}
                            <div style={{width:"100%",height:h,background:g,borderRadius:"5px 5px 0 0",transition:"height 0.5s"}}/>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{display:"flex",gap:6}}>
                      {Array.from({length:10},(_,i)=><div key={i} style={{flex:1,fontSize:9,color:C.muted,textAlign:"center"}}>{i*10}</div>)}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:16}}>
                      {[["🤩 Mastered",75,100,G.green],["😊 Good",50,74,G.blue],["🙂 Getting it",25,49,G.orange],["😕 Beginner",0,24,G.pink]].map(([label,min,max,g])=>(
                        <div key={label} style={{background:C.card2,borderRadius:12,padding:"14px 10px",textAlign:"center",position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:g}}/>
                          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,background:g,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{feedEntries.filter(e=>e.score>=min&&e.score<=max).length}</div>
                          <div style={{fontSize:10,color:C.muted,marginTop:4}}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </main>

      <footer style={{textAlign:"center",padding:"20px",color:C.border,fontSize:11,letterSpacing:1,borderTop:`1px solid ${C.border}`,marginTop:40}}>
        IITK Session Hub · AI for Leaders
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  if (!user) return <LoginScreen onLogin={setUser} />;
  if (user.role === "instructor") return <InstructorApp onLogout={() => setUser(null)} />;
  return <ParticipantApp user={user} onLogout={() => setUser(null)} />;
}
