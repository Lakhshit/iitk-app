import { useState, useEffect, useRef } from "react";

const APP_PASSWORD = "IITK2024";
const STORAGE_KEY = "iitk_v2_data";

const C = {
  bg: "#0d0d14",
  card: "#13131f",
  card2: "#1a1a2e",
  border: "#2a2a45",
  pink: "#ff3cac",
  blue: "#3c8eff",
  teal: "#00f5d4",
  orange: "#ff9900",
  purple: "#a855f7",
  green: "#22c55e",
  yellow: "#facc15",
  text: "#f0f0ff",
  muted: "#6b6b99",
};

const GRAD = {
  pink: "linear-gradient(135deg,#ff3cac,#a855f7)",
  blue: "linear-gradient(135deg,#3c8eff,#00f5d4)",
  orange: "linear-gradient(135deg,#ff9900,#ff3cac)",
  green: "linear-gradient(135deg,#22c55e,#3c8eff)",
  purple: "linear-gradient(135deg,#a855f7,#3c8eff)",
};

const TABS = [
  { id: "dashboard", label: "🏠 Dashboard" },
  { id: "attendance", label: "✅ Attendance" },
  { id: "reactions", label: "🙋 Reactions" },
  { id: "qa", label: "💬 Q&A Board" },
  { id: "notes", label: "📝 Notes" },
  { id: "quiz", label: "🧠 Quiz" },
  { id: "feedback", label: "⭐ Feedback" },
  { id: "insights", label: "📊 Insights" },
];

const MEMBERS = Array.from({ length: 40 }, (_, i) => ({ id: i + 1, name: `Participant ${i + 1}` }));
const EMOJI_RATINGS = ["😐", "🙂", "😊", "😁", "🤩"];

const defaultData = {
  attendance: {},
  learning: {},
  reactions: {},
  questions: [],
  notes: [],
  quiz: { questions: [], answers: {} },
  feedback: [],
  sessionTitle: "Introduction to Machine Learning",
  sessionDate: new Date().toLocaleDateString("en-IN"),
};

function load() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? { ...defaultData, ...JSON.parse(r) } : defaultData; }
  catch { return defaultData; }
}
function save(d) { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }

function PasswordGate({ onUnlock }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState(false);
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (val.trim().toUpperCase() === APP_PASSWORD) { onUnlock(); }
    else { setErr(true); setShake(true); setTimeout(() => setShake(false), 500); }
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", overflow: "hidden", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-12px)} 75%{transform:translateX(12px)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-18px)} }
        @keyframes pulse { 0%,100%{opacity:0.15;transform:scale(1)} 50%{opacity:0.25;transform:scale(1.05)} }
      `}</style>
      {[["#ff3cac","10%","20%","300px"],["#3c8eff","70%","60%","250px"],["#a855f7","40%","80%","200px"]].map(([c,l,t,s],i)=>(
        <div key={i} style={{position:"absolute",left:l,top:t,width:s,height:s,background:c,borderRadius:"50%",filter:"blur(100px)",opacity:0.15,animation:`pulse ${3+i}s ease-in-out infinite`,animationDelay:`${i*0.8}s`}}/>
      ))}
      <div style={{position:"relative",zIndex:10,background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:"52px 44px",width:"100%",maxWidth:400,textAlign:"center",animation:shake?"shake 0.4s":"none",boxShadow:"0 0 80px rgba(168,85,247,0.15)"}}>
        <div style={{width:72,height:72,background:GRAD.pink,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:22,fontWeight:900,color:"#fff",fontFamily:"'Syne',sans-serif",boxShadow:"0 0 40px rgba(255,60,172,0.4)"}}>IIT</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,background:GRAD.pink,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>IITK</div>
        <div style={{color:C.muted,fontSize:12,letterSpacing:3,textTransform:"uppercase",marginBottom:36}}>Session Hub</div>
        <input type="password" value={val} autoFocus
          onChange={e=>{setVal(e.target.value);setErr(false);}}
          onKeyDown={e=>e.key==="Enter"&&attempt()}
          placeholder="Enter session password"
          style={{width:"100%",padding:"14px 18px",background:C.bg,border:`2px solid ${err?C.pink:C.border}`,borderRadius:12,color:C.text,fontSize:15,outline:"none",boxSizing:"border-box",marginBottom:10,textAlign:"center",letterSpacing:4,fontFamily:"'DM Sans',sans-serif",transition:"border 0.2s"}}
        />
        {err&&<div style={{color:C.pink,fontSize:12,marginBottom:10}}>❌ Wrong password. Try again.</div>}
        <button onClick={attempt} style={{width:"100%",padding:"14px",background:GRAD.pink,border:"none",borderRadius:12,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer",fontFamily:"'Syne',sans-serif",letterSpacing:1,boxShadow:"0 8px 30px rgba(255,60,172,0.3)"}}>
          Enter Session 🚀
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, grad }) {
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:"22px 20px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:grad}}/>
      <div style={{fontSize:32,marginBottom:8}}>{icon}</div>
      <div style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,background:grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{value}</div>
      <div style={{color:C.muted,fontSize:12,letterSpacing:1,textTransform:"uppercase",marginTop:4}}>{label}</div>
    </div>
  );
}

function SectionHeader({ title, sub, grad }) {
  return (
    <div style={{marginBottom:28}}>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,background:grad||GRAD.pink,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:"0 0 6px"}}>{title}</h2>
      {sub&&<p style={{color:C.muted,fontSize:13,margin:0}}>{sub}</p>}
    </div>
  );
}

export default function App() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem("iitk_v2_unlocked") === "yes");
  const [data, setData] = useState(load);
  const [tab, setTab] = useState("dashboard");
  const [feedbackForm, setFeedbackForm] = useState({ name: "", rating: 3, comment: "", topic: "" });
  const [submitted, setSubmitted] = useState(false);
  const [qaForm, setQaForm] = useState({ name: "", question: "" });
  const [noteForm, setNoteForm] = useState({ title: "", body: "", color: "#ff3cac" });
  const [quizForm, setQuizForm] = useState({ question: "", options: ["", "", "", ""], correct: 0 });
  const [quizView, setQuizView] = useState("list");
  const [myAnswers, setMyAnswers] = useState({});
  const [animIn, setAnimIn] = useState(true);

  useEffect(() => { save(data); }, [data]);

  if (!unlocked) return <PasswordGate onUnlock={() => { sessionStorage.setItem("iitk_v2_unlocked", "yes"); setUnlocked(true); }} />;

  const switchTab = (t) => { setAnimIn(false); setTimeout(() => { setTab(t); setAnimIn(true); }, 120); };
  const upd = (patch) => setData(d => ({ ...d, ...patch }));

  const attended = Object.values(data.attendance).filter(Boolean).length;
  const learningVals = Object.values(data.learning);
  const avgLearning = learningVals.length ? Math.round(learningVals.reduce((a, b) => a + b, 0) / learningVals.length) : 0;
  const totalReactions = Object.values(data.reactions).reduce((sum, r) => sum + Object.values(r || {}).reduce((s, v) => s + v, 0), 0);
  const NOTE_COLORS = ["#ff3cac", "#3c8eff", "#00f5d4", "#ff9900", "#a855f7", "#22c55e"];

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.text}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${C.bg}}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
        input,textarea,select{font-family:'DM Sans',sans-serif;}
        button{font-family:'DM Sans',sans-serif;}
      `}</style>

      <header style={{background:C.card,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0 0"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:42,height:42,background:GRAD.pink,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:14,color:"#fff",boxShadow:"0 4px 20px rgba(255,60,172,0.4)"}}>IIT</div>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,background:GRAD.pink,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>IITK</div>
                <div style={{color:C.muted,fontSize:10,letterSpacing:2,textTransform:"uppercase"}}>Session Hub</div>
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text}}>{data.sessionTitle}</div>
              <div style={{fontSize:11,color:C.muted}}>{data.sessionDate} · 40 Participants</div>
            </div>
          </div>
          <div style={{display:"flex",gap:2,marginTop:10,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>switchTab(t.id)} style={{padding:"10px 16px",background:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${C.pink}`:"2px solid transparent",color:tab===t.id?C.pink:C.muted,cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap",transition:"all 0.2s"}}>{t.label}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{maxWidth:1200,margin:"0 auto",padding:"32px 24px",opacity:animIn?1:0,transform:animIn?"translateY(0)":"translateY(12px)",transition:"all 0.2s"}}>

        {/* DASHBOARD */}
        {tab==="dashboard"&&(
          <div>
            <SectionHeader title="Session Dashboard 🎯" sub="Live overview of your learning session" grad={GRAD.pink}/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:28}}>
              <StatCard label="Present Today" value={`${attended}/40`} icon="👥" grad={GRAD.green}/>
              <StatCard label="Avg Learning" value={`${avgLearning}%`} icon="📈" grad={GRAD.blue}/>
              <StatCard label="Questions" value={data.questions.length} icon="💬" grad={GRAD.orange}/>
              <StatCard label="Reactions" value={totalReactions} icon="🔥" grad={GRAD.pink}/>
              <StatCard label="Notes" value={data.notes.length} icon="📝" grad={GRAD.purple}/>
              <StatCard label="Feedbacks" value={data.feedback.length} icon="⭐" grad={GRAD.green}/>
            </div>
            {data.questions.length>0&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24,marginBottom:20}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:16}}>💬 Latest Questions</div>
                {data.questions.slice(0,3).map((q,i)=>(
                  <div key={i} style={{background:C.card2,borderRadius:12,padding:"12px 16px",marginBottom:10,borderLeft:`3px solid ${C.blue}`}}>
                    <div style={{fontWeight:600,fontSize:14,color:C.blue}}>{q.name}</div>
                    <div style={{color:C.muted,fontSize:13,marginTop:4}}>{q.question}</div>
                  </div>
                ))}
              </div>
            )}
            {data.notes.length>0&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:16}}>📝 Recent Notes</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
                  {data.notes.slice(0,4).map((n,i)=>(
                    <div key={i} style={{background:C.card2,borderRadius:14,padding:16,borderTop:`3px solid ${n.color}`}}>
                      <div style={{fontWeight:700,fontSize:13,color:n.color,marginBottom:6}}>{n.title}</div>
                      <div style={{color:C.muted,fontSize:12,lineHeight:1.5}}>{n.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ATTENDANCE */}
        {tab==="attendance"&&(
          <div>
            <SectionHeader title="Attendance 👥" sub={`${attended} of 40 marked present`} grad={GRAD.green}/>
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              <button onClick={()=>upd({attendance:Object.fromEntries(MEMBERS.map(m=>[m.id,true]))})}
                style={{padding:"10px 20px",background:GRAD.green,border:"none",borderRadius:10,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:13}}>✅ Mark All Present</button>
              <button onClick={()=>upd({attendance:{}})}
                style={{padding:"10px 20px",background:C.card,border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,fontWeight:700,cursor:"pointer",fontSize:13}}>🗑 Clear All</button>
            </div>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:20,marginBottom:20}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))",gap:8}}>
                {MEMBERS.map(m=>{
                  const present=!!data.attendance[m.id];
                  return(
                    <div key={m.id} onClick={()=>upd({attendance:{...data.attendance,[m.id]:!present}})}
                      style={{padding:"11px 14px",borderRadius:12,cursor:"pointer",border:`1px solid ${present?C.green:C.border}`,background:present?"rgba(34,197,94,0.1)":C.card2,display:"flex",alignItems:"center",gap:10,transition:"all 0.15s",userSelect:"none"}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:present?GRAD.green:C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>{present?"✓":m.id}</div>
                      <span style={{color:present?C.green:C.muted,fontSize:13,fontWeight:present?600:400}}>{m.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {attended>0&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:16}}>📈 Learning Level</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
                  {MEMBERS.filter(m=>data.attendance[m.id]).map(m=>{
                    const val=data.learning[m.id]??50;
                    const col=val>=75?C.green:val>=50?C.blue:val>=25?C.orange:C.pink;
                    return(
                      <div key={m.id} style={{background:C.card2,borderRadius:12,padding:"14px 16px"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}>
                          <span style={{fontWeight:600}}>{m.name}</span>
                          <span style={{fontWeight:700,color:col}}>{val}%</span>
                        </div>
                        <input type="range" min={0} max={100} value={val}
                          onChange={e=>upd({learning:{...data.learning,[m.id]:+e.target.value}})}
                          style={{width:"100%",accentColor:col,cursor:"pointer"}}/>
                        <div style={{display:"flex",gap:4,marginTop:6}}>
                          {[["😕",25],["🙂",50],["😊",75],["🤩",100]].map(([label,lvl])=>(
                            <button key={lvl} onClick={()=>upd({learning:{...data.learning,[m.id]:lvl}})} style={{flex:1,padding:"4px 0",fontSize:10,borderRadius:6,border:`1px solid ${val===lvl?col:C.border}`,background:val===lvl?`${col}22`:"transparent",color:val===lvl?col:C.muted,cursor:"pointer"}}>{label}</button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* REACTIONS */}
        {tab==="reactions"&&(
          <div>
            <SectionHeader title="Reactions & Raise Hand 🙋" sub="React to the session in real time" grad={GRAD.orange}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:28}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:6,fontSize:16}}>Send a Reaction</div>
                <div style={{color:C.muted,fontSize:13,marginBottom:20}}>Select your name and tap a reaction</div>
                <select id="reactionName" style={{width:"100%",padding:"10px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,marginBottom:16,outline:"none"}}>
                  <option value="">Select your name…</option>
                  {MEMBERS.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {[["👍","Got it!",C.green],["❓","I have a question",C.blue],["🔥","Loving this!",C.orange],["😕","Confused",C.pink],["✋","Raise Hand",C.purple],["⏸","Need a break",C.muted]].map(([emoji,label,color])=>(
                    <button key={emoji} onClick={()=>{
                      const sel=document.getElementById("reactionName").value;
                      if(!sel)return;
                      const prev=data.reactions[sel]||{};
                      upd({reactions:{...data.reactions,[sel]:{...prev,[emoji]:(prev[emoji]||0)+1}}});
                    }} style={{padding:"14px 10px",background:C.card2,border:`1px solid ${C.border}`,borderRadius:14,cursor:"pointer",textAlign:"center",color:C.text,transition:"all 0.15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${color}`;e.currentTarget.style.background=`${color}15`;}}
                      onMouseLeave={e=>{e.currentTarget.style.border=`1px solid ${C.border}`;e.currentTarget.style.background=C.card2;}}>
                      <div style={{fontSize:28,marginBottom:4}}>{emoji}</div>
                      <div style={{fontSize:11,color:C.muted}}>{label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:28}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:16}}>Live Summary</div>
                {(()=>{
                  const totals={};
                  Object.values(data.reactions).forEach(r=>Object.entries(r||{}).forEach(([k,v])=>{totals[k]=(totals[k]||0)+v;}));
                  const entries=Object.entries(totals).sort((a,b)=>b[1]-a[1]);
                  if(!entries.length)return<div style={{color:C.muted,fontSize:13}}>No reactions yet.</div>;
                  const max=entries[0][1];
                  return entries.map(([emoji,count])=>(
                    <div key={emoji} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <span style={{fontSize:24,width:32}}>{emoji}</span>
                      <div style={{flex:1,height:12,background:C.card2,borderRadius:6,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${(count/max)*100}%`,background:GRAD.orange,borderRadius:6,transition:"width 0.4s"}}/>
                      </div>
                      <span style={{fontWeight:700,fontSize:14,color:C.orange,width:24,textAlign:"right"}}>{count}</span>
                    </div>
                  ));
                })()}
                {(()=>{
                  const raised=Object.entries(data.reactions).filter(([,r])=>r["✋"]>0);
                  if(!raised.length)return null;
                  return(
                    <div style={{marginTop:20,background:`${C.purple}15`,border:`1px solid ${C.purple}44`,borderRadius:12,padding:14}}>
                      <div style={{fontWeight:700,color:C.purple,marginBottom:8,fontSize:13}}>✋ Hands Raised ({raised.length})</div>
                      {raised.map(([id])=><div key={id} style={{fontSize:12,color:C.muted,marginBottom:4}}>→ {MEMBERS.find(m=>m.id==id)?.name||`Participant ${id}`}</div>)}
                    </div>
                  );
                })()}
                <button onClick={()=>upd({reactions:{}})} style={{marginTop:16,padding:"8px 18px",background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,cursor:"pointer",fontSize:12}}>🔄 Reset Reactions</button>
              </div>
            </div>
          </div>
        )}

        {/* Q&A */}
        {tab==="qa"&&(
          <div>
            <SectionHeader title="Q&A Board 💬" sub="Submit questions for the instructor" grad={GRAD.blue}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:24}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:28}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:20,fontSize:16}}>Ask a Question</div>
                <select value={qaForm.name} onChange={e=>setQaForm(f=>({...f,name:e.target.value}))}
                  style={{width:"100%",padding:"10px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,marginBottom:14,outline:"none"}}>
                  <option value="">Select your name…</option>
                  {MEMBERS.map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
                <textarea value={qaForm.question} onChange={e=>setQaForm(f=>({...f,question:e.target.value}))}
                  placeholder="Type your question here…" rows={4}
                  style={{width:"100%",padding:"12px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,outline:"none",resize:"vertical",marginBottom:14}}/>
                <button onClick={()=>{
                  if(!qaForm.name||!qaForm.question.trim())return;
                  upd({questions:[{...qaForm,time:new Date().toLocaleTimeString("en-IN"),answered:false},...data.questions]});
                  setQaForm(f=>({...f,question:""}));
                }} style={{width:"100%",padding:"12px",background:GRAD.blue,border:"none",borderRadius:12,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,boxShadow:"0 6px 24px rgba(60,142,255,0.3)"}}>Submit Question 💬</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12,maxHeight:520,overflowY:"auto"}}>
                {data.questions.length===0?<div style={{color:C.muted,fontSize:14,textAlign:"center",paddingTop:60}}>No questions yet!</div>
                  :data.questions.map((q,i)=>(
                    <div key={i} style={{background:C.card,border:`1px solid ${q.answered?C.green+"55":C.border}`,borderRadius:16,padding:20}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <span style={{fontWeight:700,fontSize:14,color:C.blue}}>{q.name}</span>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <span style={{fontSize:10,color:C.muted}}>{q.time}</span>
                          <button onClick={()=>{const qs=[...data.questions];qs[i]={...qs[i],answered:!qs[i].answered};upd({questions:qs});}}
                            style={{padding:"3px 10px",borderRadius:20,border:"none",background:q.answered?`${C.green}22`:C.border,color:q.answered?C.green:C.muted,fontSize:11,cursor:"pointer",fontWeight:600}}>
                            {q.answered?"✅ Answered":"Mark Done"}
                          </button>
                        </div>
                      </div>
                      <p style={{color:C.text,fontSize:14,margin:0,lineHeight:1.6}}>{q.question}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* NOTES */}
        {tab==="notes"&&(
          <div>
            <SectionHeader title="Session Notes 📝" sub="Post key takeaways and important points" grad={GRAD.purple}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:24}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:28}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:20,fontSize:16}}>Add a Note</div>
                <input value={noteForm.title} onChange={e=>setNoteForm(f=>({...f,title:e.target.value}))} placeholder="Note title…"
                  style={{width:"100%",padding:"10px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,outline:"none",marginBottom:12}}/>
                <textarea value={noteForm.body} onChange={e=>setNoteForm(f=>({...f,body:e.target.value}))} placeholder="Write your note…" rows={5}
                  style={{width:"100%",padding:"12px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,outline:"none",resize:"vertical",marginBottom:14}}/>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,color:C.muted,marginBottom:8,letterSpacing:1,textTransform:"uppercase"}}>Pick color</div>
                  <div style={{display:"flex",gap:8}}>
                    {NOTE_COLORS.map(col=>(
                      <button key={col} onClick={()=>setNoteForm(f=>({...f,color:col}))} style={{width:28,height:28,borderRadius:"50%",background:col,border:noteForm.color===col?"3px solid #fff":"3px solid transparent",cursor:"pointer",flexShrink:0}}/>
                    ))}
                  </div>
                </div>
                <button onClick={()=>{
                  if(!noteForm.title.trim()||!noteForm.body.trim())return;
                  upd({notes:[{...noteForm,time:new Date().toLocaleTimeString("en-IN")},...data.notes]});
                  setNoteForm({title:"",body:"",color:"#ff3cac"});
                }} style={{width:"100%",padding:"12px",background:GRAD.purple,border:"none",borderRadius:12,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,boxShadow:"0 6px 24px rgba(168,85,247,0.3)"}}>Post Note 📝</button>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,alignContent:"start",maxHeight:520,overflowY:"auto"}}>
                {data.notes.length===0?<div style={{color:C.muted,fontSize:14,gridColumn:"1/-1",textAlign:"center",paddingTop:60}}>No notes yet.</div>
                  :data.notes.map((n,i)=>(
                    <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,borderTop:`4px solid ${n.color}`,position:"relative"}}>
                      <button onClick={()=>upd({notes:data.notes.filter((_,j)=>j!==i)})} style={{position:"absolute",top:12,right:12,background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:14}}>✕</button>
                      <div style={{fontWeight:700,color:n.color,marginBottom:8,fontSize:14,paddingRight:20}}>{n.title}</div>
                      <p style={{color:C.muted,fontSize:13,margin:"0 0 8px",lineHeight:1.6}}>{n.body}</p>
                      <div style={{fontSize:10,color:C.border}}>{n.time}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {tab==="quiz"&&(
          <div>
            <SectionHeader title="Quick Quiz 🧠" sub="Create MCQs and let participants answer" grad={GRAD.orange}/>
            <div style={{display:"flex",gap:10,marginBottom:24}}>
              {[["list","📋 Questions"],["add","➕ Add Question"],["take","✏️ Take Quiz"]].map(([v,label])=>(
                <button key={v} onClick={()=>setQuizView(v)} style={{padding:"10px 22px",background:quizView===v?GRAD.orange:C.card,border:`1px solid ${quizView===v?"transparent":C.border}`,borderRadius:10,color:quizView===v?"#fff":C.muted,cursor:"pointer",fontWeight:600,fontSize:13}}>{label}</button>
              ))}
            </div>
            {quizView==="add"&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:28,maxWidth:600}}>
                <input value={quizForm.question} onChange={e=>setQuizForm(f=>({...f,question:e.target.value}))} placeholder="Enter your question…"
                  style={{width:"100%",padding:"12px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:15,outline:"none",marginBottom:16,fontWeight:600}}/>
                {quizForm.options.map((opt,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"center"}}>
                    <button onClick={()=>setQuizForm(f=>({...f,correct:i}))} style={{width:32,height:32,borderRadius:"50%",border:`2px solid ${quizForm.correct===i?C.green:C.border}`,background:quizForm.correct===i?`${C.green}22`:"transparent",color:quizForm.correct===i?C.green:C.muted,cursor:"pointer",fontWeight:700,flexShrink:0,fontSize:12}}>{String.fromCharCode(65+i)}</button>
                    <input value={opt} onChange={e=>{const ops=[...quizForm.options];ops[i]=e.target.value;setQuizForm(f=>({...f,options:ops}));}} placeholder={`Option ${String.fromCharCode(65+i)}`}
                      style={{flex:1,padding:"10px 14px",background:C.bg,border:`1px solid ${quizForm.correct===i?C.green+"66":C.border}`,borderRadius:10,color:C.text,fontSize:14,outline:"none"}}/>
                  </div>
                ))}
                <div style={{fontSize:11,color:C.muted,marginBottom:16}}>💡 Click the letter button to mark the correct answer</div>
                <button onClick={()=>{
                  if(!quizForm.question.trim()||quizForm.options.some(o=>!o.trim()))return;
                  const qs=[...(data.quiz.questions||[]),{...quizForm}];
                  upd({quiz:{...data.quiz,questions:qs}});
                  setQuizForm({question:"",options:["","","",""],correct:0});
                }} style={{width:"100%",padding:"12px",background:GRAD.orange,border:"none",borderRadius:12,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}}>Add Question 🧠</button>
              </div>
            )}
            {quizView==="list"&&(
              <div>
                {(!data.quiz.questions||!data.quiz.questions.length)?<div style={{color:C.muted,textAlign:"center",paddingTop:60,fontSize:14}}>No questions yet. Click "Add Question"!</div>
                  :data.quiz.questions.map((q,i)=>(
                    <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,marginBottom:14}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                        <div style={{fontWeight:700,fontSize:15}}>Q{i+1}. {q.question}</div>
                        <button onClick={()=>{const qs=data.quiz.questions.filter((_,j)=>j!==i);upd({quiz:{...data.quiz,questions:qs}});}} style={{background:"transparent",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                        {q.options.map((opt,j)=>(
                          <div key={j} style={{padding:"8px 14px",borderRadius:10,background:j===q.correct?`${C.green}22`:C.card2,border:`1px solid ${j===q.correct?C.green:C.border}`,fontSize:13,color:j===q.correct?C.green:C.muted}}>
                            {String.fromCharCode(65+j)}. {opt} {j===q.correct&&"✓"}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {quizView==="take"&&(
              <div style={{maxWidth:600}}>
                {(!data.quiz.questions||!data.quiz.questions.length)?<div style={{color:C.muted,textAlign:"center",paddingTop:60,fontSize:14}}>No questions added yet!</div>:(
                  <div>
                    {data.quiz.questions.map((q,i)=>{
                      const ans=myAnswers[i];const done=ans!==undefined;
                      return(
                        <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:24,marginBottom:16}}>
                          <div style={{fontWeight:700,fontSize:15,marginBottom:16}}>Q{i+1}. {q.question}</div>
                          <div style={{display:"flex",flexDirection:"column",gap:8}}>
                            {q.options.map((opt,j)=>{
                              let bg=C.card2,border=C.border,color=C.text;
                              if(done){if(j===q.correct){bg=`${C.green}22`;border=C.green;color=C.green;}else if(j===ans){bg=`${C.pink}22`;border=C.pink;color=C.pink;}}
                              return(
                                <button key={j} onClick={()=>!done&&setMyAnswers(a=>({...a,[i]:j}))}
                                  style={{padding:"12px 16px",borderRadius:10,border:`1px solid ${border}`,background:bg,color,fontSize:14,cursor:done?"default":"pointer",textAlign:"left",transition:"all 0.15s"}}>
                                  {String.fromCharCode(65+j)}. {opt}{done&&j===q.correct&&" ✓"}{done&&j===ans&&j!==q.correct&&" ✗"}
                                </button>
                              );
                            })}
                          </div>
                          {done&&<div style={{marginTop:10,fontSize:12,color:ans===q.correct?C.green:C.pink,fontWeight:600}}>{ans===q.correct?"🎉 Correct!":"❌ Wrong! Correct: "+String.fromCharCode(65+q.correct)}</div>}
                        </div>
                      );
                    })}
                    {Object.keys(myAnswers).length===data.quiz.questions.length&&(
                      <div style={{background:GRAD.orange,borderRadius:16,padding:24,textAlign:"center",marginTop:8}}>
                        <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:"#fff",marginBottom:4}}>
                          Score: {Object.entries(myAnswers).filter(([i,j])=>j===data.quiz.questions[i].correct).length}/{data.quiz.questions.length}
                        </div>
                        <button onClick={()=>setMyAnswers({})} style={{padding:"10px 24px",background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.4)",borderRadius:10,color:"#fff",cursor:"pointer",fontWeight:700,marginTop:8}}>Retry 🔁</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* FEEDBACK */}
        {tab==="feedback"&&(
          <div>
            <SectionHeader title="Feedback ⭐" sub="Share your session experience" grad={GRAD.pink}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:24}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:28}}>
                <select value={feedbackForm.name} onChange={e=>setFeedbackForm(f=>({...f,name:e.target.value}))}
                  style={{width:"100%",padding:"10px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,marginBottom:16,outline:"none"}}>
                  <option value="">Select your name…</option>
                  {MEMBERS.map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
                <div style={{marginBottom:16}}>
                  <div style={{fontSize:12,color:C.muted,marginBottom:10,letterSpacing:1,textTransform:"uppercase"}}>Rating</div>
                  <div style={{display:"flex",gap:10}}>
                    {EMOJI_RATINGS.map((em,i)=>(
                      <button key={i} onClick={()=>setFeedbackForm(f=>({...f,rating:i+1}))} style={{fontSize:28,background:"transparent",border:`2px solid ${feedbackForm.rating===i+1?C.pink:"transparent"}`,borderRadius:10,padding:"4px 8px",cursor:"pointer",transform:feedbackForm.rating===i+1?"scale(1.25)":"scale(1)",transition:"all 0.15s"}}>{em}</button>
                    ))}
                  </div>
                </div>
                <input value={feedbackForm.topic} onChange={e=>setFeedbackForm(f=>({...f,topic:e.target.value}))} placeholder="Topic (optional)"
                  style={{width:"100%",padding:"10px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,outline:"none",marginBottom:12}}/>
                <textarea value={feedbackForm.comment} onChange={e=>setFeedbackForm(f=>({...f,comment:e.target.value}))} placeholder="What did you like? What can improve?" rows={4}
                  style={{width:"100%",padding:"12px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:14,outline:"none",resize:"vertical",marginBottom:14}}/>
                <button onClick={()=>{
                  if(!feedbackForm.name||!feedbackForm.comment.trim())return;
                  upd({feedback:[{...feedbackForm,time:new Date().toLocaleTimeString("en-IN")},...data.feedback]});
                  setFeedbackForm({name:"",rating:3,comment:"",topic:""});
                  setSubmitted(true);setTimeout(()=>setSubmitted(false),3000);
                }} style={{width:"100%",padding:"12px",background:submitted?`${C.green}33`:GRAD.pink,border:submitted?`1px solid ${C.green}`:"none",borderRadius:12,color:submitted?C.green:"#fff",fontWeight:700,cursor:"pointer",fontSize:14,transition:"all 0.3s"}}>
                  {submitted?"✓ Submitted!":"Submit Feedback ⭐"}
                </button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12,maxHeight:520,overflowY:"auto"}}>
                {data.feedback.length===0?<div style={{color:C.muted,fontSize:14,textAlign:"center",paddingTop:60}}>No feedback yet!</div>
                  :data.feedback.map((f,i)=>(
                    <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:20,borderLeft:`3px solid ${C.pink}`}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                        <div>
                          <span style={{fontWeight:700,fontSize:14}}>{f.name}</span>
                          {f.topic&&<span style={{marginLeft:8,fontSize:11,background:`${C.pink}22`,color:C.pink,padding:"2px 8px",borderRadius:20}}>{f.topic}</span>}
                        </div>
                        <span style={{fontSize:22}}>{EMOJI_RATINGS[f.rating-1]}</span>
                      </div>
                      <p style={{color:C.muted,fontSize:13,margin:"0 0 6px",lineHeight:1.6}}>{f.comment}</p>
                      <div style={{fontSize:10,color:C.border}}>{f.time}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* INSIGHTS */}
        {tab==="insights"&&(
          <div>
            <SectionHeader title="Insights 📊" sub="Analytics from your session" grad={GRAD.green}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:28}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:20,fontSize:16}}>Attendance</div>
                <div style={{display:"flex",alignItems:"center",gap:24}}>
                  <div style={{position:"relative",width:100,height:100,flexShrink:0}}>
                    <svg viewBox="0 0 36 36" style={{width:100,height:100,transform:"rotate(-90deg)"}}>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.card2} strokeWidth="3.5"/>
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#ga)" strokeWidth="3.5"
                        strokeDasharray={`${(attended/40)*100} ${100-(attended/40)*100}`} strokeLinecap="round"/>
                      <defs><linearGradient id="ga" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#22c55e"/><stop offset="100%" stopColor="#3c8eff"/></linearGradient></defs>
                    </svg>
                    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:C.green}}>{Math.round((attended/40)*100)}%</div>
                  </div>
                  <div>
                    <div style={{fontSize:28,fontWeight:800,color:C.green,fontFamily:"'Syne',sans-serif"}}>{attended}</div>
                    <div style={{color:C.muted,fontSize:12}}>Present</div>
                    <div style={{fontSize:22,fontWeight:700,color:C.pink,fontFamily:"'Syne',sans-serif",marginTop:8}}>{40-attended}</div>
                    <div style={{color:C.muted,fontSize:12}}>Absent</div>
                  </div>
                </div>
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:28}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:16}}>Feedback Sentiment</div>
                {data.feedback.length===0?<div style={{color:C.muted,fontSize:13}}>No feedback yet.</div>:(
                  <div>
                    {EMOJI_RATINGS.map((em,i)=>{
                      const cnt=data.feedback.filter(f=>f.rating===i+1).length;
                      const pct=Math.round((cnt/data.feedback.length)*100);
                      return(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                          <span style={{fontSize:20,width:28}}>{em}</span>
                          <div style={{flex:1,height:10,background:C.card2,borderRadius:5,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${pct}%`,background:GRAD.pink,borderRadius:5,transition:"width 0.5s"}}/>
                          </div>
                          <span style={{color:C.muted,fontSize:12,width:28,textAlign:"right"}}>{cnt}</span>
                        </div>
                      );
                    })}
                    <div style={{marginTop:12,fontSize:13,color:C.pink,fontWeight:700}}>Avg: {(data.feedback.reduce((a,f)=>a+f.rating,0)/data.feedback.length).toFixed(1)} / 5</div>
                  </div>
                )}
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:28,gridColumn:"1/-1"}}>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:20,fontSize:16}}>Learning Score Distribution</div>
                {learningVals.length===0?<div style={{color:C.muted,fontSize:13}}>No learning data yet.</div>:(
                  <div>
                    <div style={{display:"flex",alignItems:"flex-end",gap:8,height:140,marginBottom:8}}>
                      {Array.from({length:10},(_,i)=>{
                        const min=i*10,max=min+9;
                        const cnt=learningVals.filter(v=>v>=min&&v<=max).length;
                        const maxCnt=Math.max(...Array.from({length:10},(__,j)=>learningVals.filter(v=>v>=j*10&&v<=j*10+9).length),1);
                        const h=Math.max(4,(cnt/maxCnt)*120);
                        const grad=min>=75?GRAD.green:min>=50?GRAD.blue:min>=25?GRAD.orange:GRAD.pink;
                        return(
                          <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                            {cnt>0&&<div style={{fontSize:11,fontWeight:700,color:C.muted}}>{cnt}</div>}
                            <div style={{width:"100%",height:h,background:grad,borderRadius:"6px 6px 0 0",transition:"height 0.5s"}}/>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      {Array.from({length:10},(_,i)=><div key={i} style={{flex:1,fontSize:9,color:C.muted,textAlign:"center"}}>{i*10}</div>)}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginTop:20}}>
                      {[["🤩 Expert",75,100,GRAD.green],["😊 Good",50,74,GRAD.blue],["🙂 Developing",25,49,GRAD.orange],["😕 Beginner",0,24,GRAD.pink]].map(([label,min,max,g])=>(
                        <div key={label} style={{background:C.card2,borderRadius:12,padding:"14px 10px",textAlign:"center",position:"relative",overflow:"hidden"}}>
                          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:g}}/>
                          <div style={{fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,background:g,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{learningVals.filter(v=>v>=min&&v<=max).length}</div>
                          <div style={{fontSize:10,color:C.muted,marginTop:4}}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer style={{textAlign:"center",padding:"24px",color:C.border,fontSize:11,letterSpacing:1,borderTop:`1px solid ${C.border}`,marginTop:40}}>
        IITK Session Hub · {data.sessionDate}
      </footer>
    </div>
  );
}
