import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, update, remove } from "firebase/database";

// ─── Firebase ──────────────────────────────────────────────────────────────
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

// ─── WLS Proxy Config ──────────────────────────────────────────────────────
// Change this to your proxy URL. In Vercel, set env var REACT_APP_WLS_PROXY_URL
const PROXY_URL = process.env.REACT_APP_WLS_PROXY_URL || "https://clapped-electable-clubbing.ngrok-free.dev";

// ─── EmailJS ───────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY  = "YOUR_PUBLIC_KEY";
const ALERT_EMAIL         = "your-team@company.com";

// ─── Theme ─────────────────────────────────────────────────────────────────
const DARK = {
  bg:"#0a0a0a",card:"#111111",card2:"#161616",border:"#2a2a2a",
  red:"#C74634",red2:"#8B1A10",blue:"#1a6fde",cyan:"#00a8e8",
  green:"#1a8a1a",orange:"#d95f00",purple:"#6941C6",teal:"#0d7377",
  yellow:"#b45309",text:"#f0f0f0",muted:"#666666",dim:"#333333",
  danger:"#C74634",warning:"#d95f00",success:"#1a8a1a",info:"#1a6fde",
  shadow:"rgba(0,0,0,0.6)",headerBg:"#1a1a1a",accent:"#C74634",
};
const LIGHT = {
  bg:"#f5f5f5",card:"#ffffff",card2:"#fafafa",border:"#e0e0e0",
  red:"#C74634",red2:"#8B1A10",blue:"#1a6fde",cyan:"#0077b6",
  green:"#1a6b1a",orange:"#c05000",purple:"#5b21b6",teal:"#0a6367",
  yellow:"#92400e",text:"#1a1a1a",muted:"#666666",dim:"#dddddd",
  danger:"#C74634",warning:"#c05000",success:"#1a6b1a",info:"#1a6fde",
  shadow:"rgba(0,0,0,0.15)",headerBg:"#C74634",accent:"#C74634",
};

// ─── Helpers ───────────────────────────────────────────────────────────────
const nowStr  = () => new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"});
const fmtUp   = (s) => { const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60); return d+"d "+h+"h "+m+"m"; };
const fmtSize = (bytes) => { if(!bytes) return "0B"; const k=1024,s=["B","KB","MB","GB","TB"]; const i=Math.floor(Math.log(bytes)/Math.log(k)); return (bytes/Math.pow(k,i)).toFixed(1)+s[i]; };
const scol    = (s,C) => ({RUNNING:C.green,AVAILABLE:C.green,ACTIVE:C.green,SUCCESS:C.green,HEALTHY:C.green,WARNING:C.warning,CRITICAL:C.danger,STOPPED:C.muted,STANDBY:C.cyan,STARTING:C.blue,STOPPING:C.orange,RESTARTING:C.purple,FAILED:C.danger,IN_PROGRESS:C.blue,PENDING:C.warning,OPEN:C.danger,ACKNOWLEDGED:C.warning,RESOLVED:C.green,CLOSED:C.muted,SCHEDULED:C.blue,COMPLETED:C.green,TERMINATED:C.muted,SHUTDOWN:C.muted,ADMIN:C.purple,UNKNOWN:C.muted}[s]||C.muted);
const drift   = (v,r,mn,mx) => Math.min(mx,Math.max(mn,v+(Math.random()-.5)*r));

const PASSWORDS = { admin:"WLS@ADMIN", operator:"WLS@OPS", approver:"WLS@APPR" };

// ─── WLS REST API Layer ─────────────────────────────────────────────────────
const NGROK_HEADERS = {
  "Accept": "application/json",
  "ngrok-skip-browser-warning": "true",
  "User-Agent": "CloudInfraPlatform/1.0"
};
const wlsApi = {
  async get(path) {
    const r = await fetch(PROXY_URL + path, { headers: NGROK_HEADERS });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${path}`);
    return r.json();
  },
  async post(path, body={}) {
    const r = await fetch(PROXY_URL + path, { method:"POST", headers:{ ...NGROK_HEADERS, "Content-Type":"application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${path}`);
    return r.json();
  },
  async upload(path, formData) {
    const r = await fetch(PROXY_URL + path, { method:"POST", headers:{ "ngrok-skip-browser-warning":"true" }, body: formData });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${path}`);
    return r.json();
  },
  async health() {
    try {
      const r = await fetch(PROXY_URL + "/health", { headers: NGROK_HEADERS, signal: AbortSignal.timeout(5000) });
      if (!r.ok) return false;
      const d = await r.json();
      return d.status === "ok";
    }
    catch { return false; }
  }
};

// ─── Simulated fallback data ────────────────────────────────────────────────
const WLS_SEED = [
  { id:"wls1",name:"WLS-PROD-01",env:"Production",host:"prod-wls-01.company.com",port:7001,cpu:42,mem:68,threads:120,maxThreads:200,jvmHeap:72,gcTime:12,deployments:8,version:"14.1.1.0",uptimeSecs:3934200,status:"RUNNING" },
  { id:"wls2",name:"WLS-PROD-02",env:"Production",host:"prod-wls-02.company.com",port:7001,cpu:38,mem:61,threads:98, maxThreads:200,jvmHeap:65,gcTime:8, deployments:8,version:"14.1.1.0",uptimeSecs:3934200,status:"RUNNING" },
  { id:"wls3",name:"WLS-PROD-03",env:"Production",host:"prod-wls-03.company.com",port:7001,cpu:78,mem:87,threads:185,maxThreads:200,jvmHeap:89,gcTime:45,deployments:8,version:"14.1.1.0",uptimeSecs:1039800,status:"WARNING" },
  { id:"wls4",name:"WLS-PROD-04",env:"Production",host:"prod-wls-04.company.com",port:7001,cpu:94,mem:96,threads:198,maxThreads:200,jvmHeap:98,gcTime:120,deployments:8,version:"14.1.1.0",uptimeSecs:177900, status:"CRITICAL"},
  { id:"wls5",name:"WLS-UAT-01", env:"UAT",        host:"uat-wls-01.company.com", port:7001,cpu:25,mem:45,threads:60, maxThreads:150,jvmHeap:50,gcTime:5, deployments:5,version:"14.1.1.0",uptimeSecs:467200, status:"RUNNING" },
  { id:"wls6",name:"WLS-DR-01",  env:"DR",         host:"dr-wls-01.company.com",  port:7001,cpu:5, mem:20,threads:10, maxThreads:200,jvmHeap:30,gcTime:2, deployments:8,version:"14.1.1.0",uptimeSecs:7776000,status:"STANDBY" },
  { id:"wls7",name:"WLS-ADMIN",  env:"Production", host:"prod-wls-admin.company.com",port:7001,cpu:15,mem:35,threads:40,maxThreads:100,jvmHeap:40,gcTime:3, deployments:3,version:"14.1.1.0",uptimeSecs:3934200,status:"RUNNING" },
];
const DEPLOY_SEED = [
  { name:"pdc-app",      type:"WAR", targets:["WLS-PROD-01","WLS-PROD-02"], state:"ACTIVE",   health:"OK",  version:"1.0.0", deployedAt:"10 Jan 09:12", size:"18 MB" },
  { name:"app-portal",   type:"WAR", targets:["WLS-PROD-01","WLS-PROD-02"], state:"ACTIVE",   health:"OK",  version:"2.3.1", deployedAt:"08 Jan 14:30", size:"42 MB" },
  { name:"reporting-svc",type:"EAR", targets:["WLS-PROD-01"],               state:"ACTIVE",   health:"OK",  version:"3.1.0", deployedAt:"06 Jan 11:00", size:"65 MB" },
  { name:"batch-engine",  type:"JAR", targets:["WLS-PROD-02"],               state:"PREPARED", health:"WARN",version:"1.2.0", deployedAt:"04 Jan 08:00", size:"9 MB"  },
  { name:"uat-portal",    type:"WAR", targets:["WLS-UAT-01"],                state:"ACTIVE",   health:"OK",  version:"2.4.0-SNAPSHOT", deployedAt:"12 Jan 16:00", size:"44 MB" },
];

// ─── Activity Types ────────────────────────────────────────────────────────
const AT = {
  LOGIN:     { icon:"🔐",color:"#1a6fde",label:"Login" },
  LOGOUT:    { icon:"🚪",color:"#666666",label:"Logout" },
  TAB_VISIT: { icon:"👁️",color:"#00a8e8",label:"Page View" },
  OP_SUBMIT: { icon:"📤",color:"#6941C6",label:"Op Submitted" },
  OP_EXECUTE:{ icon:"⚡",color:"#1a8a1a",label:"Op Executed" },
  OP_CANCEL: { icon:"❌",color:"#C74634",label:"Op Cancelled" },
  OP_APPROVE:{ icon:"✅",color:"#1a8a1a",label:"Approved" },
  OP_REJECT: { icon:"🚫",color:"#C74634",label:"Rejected" },
  DEPLOY:    { icon:"🚀",color:"#1a6fde",label:"Deployment" },
  UNDEPLOY:  { icon:"📦",color:"#d95f00",label:"Undeployment" },
  INCIDENT:  { icon:"🚨",color:"#d95f00",label:"Incident" },
  FEEDBACK:  { icon:"💬",color:"#6941C6",label:"Feedback" },
  VISITOR:   { icon:"👤",color:"#00a8e8",label:"Site Visit" },
  ALERT:     { icon:"🔔",color:"#d95f00",label:"Alert" },
};

function trackVisitor() {
  try {
    push(ref(db,"visitors"),{ timestamp:new Date().toISOString(),time:nowStr(),page:window.location.href,browser:navigator.userAgent.split(") ")[0].split("(")[1]||navigator.userAgent.slice(0,60),platform:navigator.platform,language:navigator.language,screenSize:window.screen.width+"x"+window.screen.height,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,referrer:document.referrer||"Direct" });
  } catch(e){}
}
function useDB(path) {
  const [data,setData] = useState(null);
  useEffect(() => { const r=ref(db,path); const u=onValue(r,s=>setData(s.val())); return ()=>u(); },[path]);
  return data;
}
function useActivityRecorder(user) {
  const sessionId = useRef("S_"+Date.now());
  const record = useCallback((type,details) => {
    if(!user) return;
    push(ref(db,"activityLog"),Object.assign({ type,icon:AT[type]?.icon||"📌",label:AT[type]?.label||type,color:AT[type]?.color||"#666",user:user.name,role:user.role,sessionId:sessionId.current,timestamp:new Date().toISOString(),time:nowStr() },details||{}));
  },[user]);
  useEffect(() => {
    if(!user) return;
    record("LOGIN",{ description:user.name+" signed in" });
    const fn=()=>record("LOGOUT",{ description:user.name+" signed out" });
    window.addEventListener("beforeunload",fn);
    return ()=>window.removeEventListener("beforeunload",fn);
  },[user?.name]);
  return { record, sessionId:sessionId.current };
}

// ─── UI Atoms ─────────────────────────────────────────────────────────────
const Pulse = ({color,size=10}) => <span style={{position:"relative",display:"inline-block",width:size,height:size,flexShrink:0}}><span style={{position:"absolute",inset:0,borderRadius:"50%",background:color,opacity:.4,animation:"pr 1.5s ease-out infinite"}}/><span style={{position:"absolute",inset:0,borderRadius:"50%",background:color}}/></span>;
const Badge = ({text,color,dot}) => <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 9px",borderRadius:4,fontSize:11,fontWeight:700,background:color+"18",color,border:"1px solid "+color+"40",whiteSpace:"nowrap"}}>{dot&&<span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>}{text}</span>;
const Chip = ({label,color,C}) => <span style={{padding:"3px 8px",background:color+"18",border:"1px solid "+color+"33",borderRadius:3,fontSize:10,fontWeight:700,color}}>{label}</span>;

const Card = ({children,color,style,onClick,C}) => {
  const [hov,setHov]=useState(false);
  return <div onClick={onClick} onMouseEnter={()=>onClick&&setHov(true)} onMouseLeave={()=>setHov(false)} style={Object.assign({background:C.card,border:"1px solid "+C.border,borderTop:"3px solid "+(color||C.red),borderRadius:4,padding:20,cursor:onClick?"pointer":"default",transition:"all .2s",boxShadow:hov?"0 4px 16px "+C.shadow:"0 1px 4px "+C.shadow,transform:hov?"translateY(-1px)":"none"},style||{})}>{children}</div>;
};

const MetricBar = ({value,max,label,unit,warn,crit,small,C}) => {
  const m=max||100,u=unit!==undefined?unit:"%",w=warn||70,cr=crit||90;
  const pct=Math.min(100,(value/m)*100);
  const color=pct>=cr?C.danger:pct>=w?C.warning:C.success;
  return <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:small?10:11}}><span style={{color:C.muted}}>{label}</span><span style={{color,fontWeight:700}}>{value}{u}</span></div><div style={{height:small?4:6,background:C.dim,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:pct+"%",background:color,borderRadius:2,transition:"width .8s"}}/></div></div>;
};

const Btn = ({children,color,onClick,style,sm,disabled,outline,loading,C}) => {
  const col=color||C.red;
  return <button onClick={onClick} disabled={disabled||loading} style={Object.assign({padding:sm?"5px 14px":"9px 20px",background:outline||disabled?"transparent":col,border:"1px solid "+(disabled?C.dim:col),borderRadius:4,color:disabled?C.muted:outline?col:"#fff",fontWeight:700,fontSize:sm?12:13,cursor:disabled||loading?"not-allowed":"pointer",fontFamily:"inherit",transition:"all .15s",opacity:disabled?0.5:1,display:"flex",alignItems:"center",gap:6},style||{})}>{loading&&<span style={{display:"inline-block",width:12,height:12,border:"2px solid currentColor",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>}{children}</button>;
};

const Inp = ({value,onChange,placeholder,type,rows,style,C}) => {
  const base={width:"100%",padding:"9px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"};
  return rows?<textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={Object.assign({},base,{resize:"vertical"},style||{})}/>:<input type={type||"text"} value={value} onChange={onChange} placeholder={placeholder} style={Object.assign({},base,style||{})}/>;
};

const Sel = ({value,onChange,children,C}) => <select value={value} onChange={onChange} style={{width:"100%",padding:"9px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}>{children}</select>;

const Terminal = ({lines,height,C}) => {
  const r=useRef(null);
  useEffect(()=>{ if(r.current) r.current.scrollTop=r.current.scrollHeight; },[lines]);
  return <div ref={r} style={{background:"#000",borderRadius:4,padding:14,height:height||220,overflowY:"auto",fontFamily:"'JetBrains Mono',monospace",fontSize:11,border:"1px solid "+C.success+"33",lineHeight:1.6}}>
    {lines.map((l,i)=><div key={i} style={{color:l.startsWith("[ERR")?C.danger:l.startsWith("[WARN")?C.warning:l.startsWith("[OK")||l.startsWith("[SUC")?C.success:l.startsWith("[INFO")?C.cyan:C.text}}>{l}</div>)}
    <div style={{display:"inline-block",width:8,height:12,background:C.success,animation:"blink 1s step-end infinite",verticalAlign:"middle"}}/>
  </div>;
};

// ─── Toast ─────────────────────────────────────────────────────────────────
function ToastContainer({toasts,dismiss}) {
  return <div style={{position:"fixed",top:70,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:360,pointerEvents:"none"}}>
    {toasts.map(t=><div key={t.id} style={{pointerEvents:"all",background:"#111",border:"1px solid "+t.color+"55",borderLeft:"4px solid "+t.color,borderRadius:4,padding:"12px 16px",boxShadow:"0 2px 12px rgba(0,0,0,.4)",display:"flex",gap:12,alignItems:"flex-start",animation:"slideIn .2s ease"}}>
      <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:t.color}}>{t.title}</div>{t.message&&<div style={{fontSize:11,color:"#666",marginTop:3}}>{t.message}</div>}</div>
      <button onClick={()=>dismiss(t.id)} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:14,pointerEvents:"all"}}>✕</button>
    </div>)}
  </div>;
}

// ─── Approval Modal ────────────────────────────────────────────────────────
function ApprovalModal({op,target,user,onConfirm,onCancel,C,record}) {
  const [reason,setReason]=useState("");
  const [ticket,setTicket]=useState("");
  const [priority,setPriority]=useState("Normal");
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <Card color={C.red} style={{width:"100%",maxWidth:500,padding:32}} C={C}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:44,marginBottom:10}}>{op==="RESTART"?"🔄":op==="STOP"?"⏹️":op==="DEPLOY"?"🚀":op==="UNDEPLOY"?"📦":"▶️"}</div>
        <h2 style={{fontWeight:800,fontSize:18,color:C.text,margin:"0 0 6px"}}>{op} — {target}</h2>
        {user.role==="admin"?<Badge text="DIRECT EXECUTION" color={C.success}/>:<Badge text="REQUIRES APPROVAL" color={C.warning}/>}
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Priority</div>
        <div style={{display:"flex",gap:8}}>
          {["Low","Normal","High","Emergency"].map(p=><button key={p} onClick={()=>setPriority(p)} style={{flex:1,padding:"7px 4px",background:priority===p?(p==="Emergency"?C.danger:C.blue):C.card2,border:"1px solid "+(priority===p?(p==="Emergency"?C.danger:C.blue):C.border),borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:700,color:priority===p?"#fff":C.muted}}>{p}</button>)}
        </div>
      </div>
      <Inp value={ticket} onChange={e=>setTicket(e.target.value)} placeholder="Change Ticket #" style={{marginBottom:10}} C={C}/>
      <Inp value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason / justification *" rows={3} style={{marginBottom:16}} C={C}/>
      <div style={{display:"flex",gap:12}}>
        <button onClick={()=>{record&&record("OP_CANCEL",{operation:op,target});onCancel();}} style={{flex:1,padding:11,background:"transparent",border:"1px solid "+C.border,borderRadius:4,color:C.muted,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
        <Btn color={user.role==="admin"?C.success:C.warning} onClick={()=>reason.trim()&&onConfirm({reason,ticket,priority})} disabled={!reason.trim()} style={{flex:2,padding:11}} C={C}>{user.role==="admin"?"⚡ Execute Now":"📤 Submit for Approval"}</Btn>
      </div>
    </Card>
  </div>;
}

// ─── Connection Status Banner ──────────────────────────────────────────────
function ConnectionBanner({status,proxyUrl,C}) {
  if(status==="connected") return null;
  return <div style={{background:status==="checking"?C.blue+"18":C.warning+"18",borderBottom:"2px solid "+(status==="checking"?C.blue:C.warning),padding:"8px 20px",display:"flex",alignItems:"center",gap:10,fontSize:12}}>
    {status==="checking"?<span style={{display:"inline-block",width:12,height:12,border:"2px solid "+C.blue,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>:<span>⚠️</span>}
    <span style={{color:status==="checking"?C.blue:C.warning,fontWeight:700}}>{status==="checking"?"Connecting to WLS proxy...":"Running in Simulation Mode"}</span>
    {status==="disconnected"&&<span style={{color:C.muted}}>Set <code style={{background:C.dim,padding:"1px 5px",borderRadius:3}}>REACT_APP_WLS_PROXY_URL</code> to connect to real WebLogic · Proxy: {proxyUrl}</span>}
    {status==="disconnected"&&<Badge text="SIMULATED DATA" color={C.warning}/>}
  </div>;
}

// ─── Login Page ────────────────────────────────────────────────────────────
function Login({onLogin,isDark,toggleTheme}) {
  const C=isDark?DARK:LIGHT;
  const [role,setRole]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [time,setTime]=useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t); },[]);
  useEffect(()=>{ trackVisitor(); },[]);
  const login=()=>{
    if(!role) return setErr("Select a role.");
    if(role==="viewer") return onLogin({name:"Viewer",role:"viewer",initials:"VW"});
    if(pass!==PASSWORDS[role]) return setErr("Incorrect password.");
    const names={admin:"System Admin",operator:"OPS Engineer",approver:"Change Approver"};
    onLogin({name:names[role],role,initials:role.slice(0,2).toUpperCase()});
  };
  return <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:"'DM Sans',sans-serif"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap');*{box-sizing:border-box}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pr{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.5);opacity:0}}@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    <div style={{background:C.red,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{fontWeight:800,fontSize:22,color:"#fff",letterSpacing:-0.5}}>ORACLE</div>
        <div style={{width:1,height:24,background:"rgba(255,255,255,.3)"}}/>
        <div style={{color:"rgba(255,255,255,.9)",fontSize:14,fontWeight:600}}>Cloud Infrastructure Platform</div>
      </div>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <span style={{color:"rgba(255,255,255,.7)",fontSize:12}}>Enterprise Edition</span>
        <button onClick={toggleTheme} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:4,padding:"4px 12px",cursor:"pointer",color:"#fff",fontSize:12,fontWeight:600}}>{isDark?"☀️ Light":"🌙 Dark"}</button>
      </div>
    </div>
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
      <div style={{width:"100%",maxWidth:960,display:"grid",gridTemplateColumns:"1fr 1fr",gap:40}}>
        <div>
          <div style={{fontSize:13,color:C.red,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:12}}>Cloud Infrastructure Management</div>
          <h1 style={{fontSize:36,fontWeight:800,color:C.text,margin:"0 0 16px",lineHeight:1.2}}>Infrastructure<br/>Control Platform</h1>
          <p style={{color:C.muted,fontSize:14,lineHeight:1.7,marginBottom:28}}>Unified monitoring and management for Multi-Cloud Infrastructure — WebLogic, Compute, Databases, Kubernetes, Docker, OKE, Networking and more.</p>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:24,fontWeight:700,color:C.red,marginBottom:4}}>{time.toLocaleTimeString()}</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:24}}>{time.toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} · IST</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["7","WebLogic Servers"],["6","Compute Instances"],["3","Databases"],["2","OKE Clusters"],["4","OCI Functions"],["2","WAF Policies"]].map(([v,l])=><div key={l} style={{background:C.card,border:"1px solid "+C.border,borderLeft:"3px solid "+C.red,borderRadius:4,padding:"10px 14px"}}>
              <div style={{fontSize:22,fontWeight:800,color:C.red,fontFamily:"monospace"}}>{v}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>{l}</div>
            </div>)}
          </div>
        </div>
        <div>
          <Card color={C.red} style={{padding:32}} C={C}>
            <div style={{marginBottom:24}}>
              <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 6px"}}>Secure Sign In</h2>
              <p style={{color:C.muted,margin:0,fontSize:13}}>Select your role and enter credentials</p>
            </div>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>Select Role</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[["admin","🛡️","System Admin","Full control"],["operator","⚙️","OPS Engineer","Operations"],["approver","✅","Change Approver","Approvals"],["viewer","👁️","Viewer","Read only"]].map(([r,icon,label,sub])=><button key={r} onClick={()=>{setRole(r);setErr("");setPass("");}} style={{padding:"12px 8px",background:role===r?C.red+"15":C.card2,border:"2px solid "+(role===r?C.red:C.border),borderRadius:4,cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                  <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                  <div style={{fontWeight:700,fontSize:12,color:role===r?C.red:C.text}}>{label}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>{sub}</div>
                </button>)}
              </div>
            </div>
            {role&&role!=="viewer"&&<div style={{marginBottom:16}}><Inp value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} placeholder="Enter password" type="password" C={C}/></div>}
            {err&&<div style={{color:C.danger,fontSize:12,marginBottom:12,padding:"8px 12px",background:C.danger+"15",borderRadius:4,border:"1px solid "+C.danger+"33"}}>⚠ {err}</div>}
            <Btn color={C.red} onClick={login} style={{width:"100%",padding:12,fontSize:14,justifyContent:"center"}} C={C}>🔐 Sign In to OCI Control</Btn>
          </Card>
          <div style={{marginTop:16,padding:"12px 16px",background:C.card,border:"1px solid "+C.border,borderRadius:4,fontSize:11,color:C.muted,textAlign:"center"}}>🔍 All access is logged and recorded.</div>
        </div>
      </div>
    </div>
    <div style={{background:C.card,borderTop:"1px solid "+C.border,padding:"12px 32px",display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}>
      <span>© 2025 Cloud Infrastructure Platform · Multi-Cloud & DevOps</span>
      <span>Mumbai · Hyderabad · Enterprise Edition</span>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user,setUser]=useState(null);
  const [isDark,setIsDark]=useState(true);
  if(!user) return <Login onLogin={setUser} isDark={isDark} toggleTheme={()=>setIsDark(d=>!d)}/>;
  return <MainApp user={user} onLogout={()=>setUser(null)} isDark={isDark} toggleTheme={()=>setIsDark(d=>!d)}/>;
}

function MainApp({user,onLogout,isDark,toggleTheme}) {
  const C=isDark?DARK:LIGHT;
  const [tab,setTab]=useState("overview");
  const [proxyStatus,setProxyStatus]=useState("checking"); // checking|connected|disconnected
  const [realMode,setRealMode]=useState(false);

  // ─── Data state ──────────────────────────────────────────────────────────
  const [wls,setWls]=useState(WLS_SEED);
  const [deployments,setDeployments]=useState(DEPLOY_SEED);
  const [termLines,setTermLines]=useState(["[INFO] Cloud Infrastructure Platform ready.","[INFO] Enterprise Edition · All systems monitored."]);
  const [toasts,setToasts]=useState([]);
  const [modal,setModal]=useState(null);
  const [showChatbot,setShowChatbot]=useState(false);
  const [emailAlerts,setEmailAlerts]=useState(true);
  const { record } = useActivityRecorder(user);

  // Firebase
  const approvalsDB  = useDB("approvals");
  const auditDB      = useDB("auditLogs");
  const incidentsDB  = useDB("incidents");
  const activityDB   = useDB("activityLog");
  const visitorsDB   = useDB("visitors");
  const feedbackDB   = useDB("feedback");
  const approvalList = approvalsDB  ? Object.entries(approvalsDB).map(([k,v])=>({id:k,...v}))  : [];
  const auditList    = auditDB      ? Object.entries(auditDB).map(([k,v])=>({id:k,...v}))      : [];
  const incidentList = incidentsDB  ? Object.entries(incidentsDB).map(([k,v])=>({id:k,...v}))  : [];
  const activityList = activityDB   ? Object.entries(activityDB).map(([k,v])=>({id:k,...v}))   : [];
  const visitorList  = visitorsDB   ? Object.entries(visitorsDB).map(([k,v])=>({id:k,...v}))   : [];
  const feedbackList = feedbackDB   ? Object.entries(feedbackDB).map(([k,v])=>({id:k,...v}))   : [];

  const addToast = (title,message,color,icon) => {
    const id=Date.now();
    setToasts(p=>[...p,{id,title,message,color,icon}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),6000);
  };

  // ─── Proxy connection check ───────────────────────────────────────────────
  useEffect(()=>{
    const check=async()=>{
      const ok=await wlsApi.health();
      setProxyStatus(ok?"connected":"disconnected");
      setRealMode(ok);
      if(ok) {
        addToast("🔗 Connected","Real WLS data active",C.success,"🟢");
        loadRealServers();
        loadRealDeployments();
      }
    };
    check();
    const t=setInterval(check,30000);
    return ()=>clearInterval(t);
  },[]);

  // ─── Real data loaders ────────────────────────────────────────────────────
  const loadRealServers = async()=>{
    try {
      const data=await wlsApi.get("/api/servers");
      if(data.servers?.length) {
        setWls(data.servers.map((s,i)=>({ ...WLS_SEED[i%WLS_SEED.length], ...s, id:"wls"+i, cpu:0, mem:0, jvmHeap:0, gcTime:0, threads:0, maxThreads:200 })));
        termLine("[OK] Loaded "+data.servers.length+" servers from WLS REST API");
      }
    } catch(e) { termLine("[WARN] Server load failed: "+e.message); }
  };
  const loadRealDeployments = async()=>{
    try {
      const data=await wlsApi.get("/api/deployments");
      if(data.deployments?.length) {
        const normalized=data.deployments.map(d=>({
          ...d,
          name: d.name||"unknown",
          state: d.state==="UNKNOWN"?(d.active===true?"ACTIVE":"PREPARED"):(d.state||"ACTIVE"),
          type: d.type==="AppDeployment"?"WAR":(d.type||"WAR"),
          targets: Array.isArray(d.targets)?d.targets.map(t=>typeof t==="string"?t:t.name||"AdminServer"):["AdminServer"],
          version: d.version||"1.0",
          health: d.health||"OK",
        }));
        setDeployments(normalized);
      }
    } catch(e){ console.warn("Deployments load failed:",e.message); }
  };

  // ─── Live metrics poll (real or simulated) ────────────────────────────────
  useEffect(()=>{
    if(realMode) {
      // Poll real JVM metrics for each server
      const t=setInterval(async()=>{
        const updates=await Promise.allSettled(wls.map(s=>wlsApi.get("/api/servers/"+s.name)));
        setWls(prev=>prev.map((s,i)=>{
          const d=updates[i];
          if(d.status==="fulfilled"&&d.value.server) {
            const rv=d.value.server;
            return {...s,cpu:rv.jvm?.heapPct||s.cpu,jvmHeap:rv.jvm?.heapPct||s.jvmHeap,gcTime:rv.jvm?.gcTimeSec||s.gcTime,threads:rv.threads?.current||s.threads,status:rv.state==="RUNNING"?"RUNNING":rv.state==="SHUTDOWN"?"STOPPED":rv.state||s.status};
          }
          return s;
        }));
      },10000);
      return ()=>clearInterval(t);
    } else {
      // Simulate drift
      const t=setInterval(()=>{
        setWls(prev=>prev.map(s=>{
          if(["STOPPED","STANDBY","STARTING","STOPPING"].includes(s.status)) return s;
          const cpu=Math.round(drift(s.cpu,5,2,99));
          const jvmHeap=Math.round(drift(s.jvmHeap,3,10,99));
          if(jvmHeap>=95&&s.status!=="CRITICAL") {
            addToast("CRITICAL: "+s.name,"JVM:"+jvmHeap+"%",C.danger,"🔴");
            record("ALERT",{description:"CRITICAL: "+s.name});
          }
          const status=jvmHeap>=95?"CRITICAL":jvmHeap>=82?"WARNING":s.env==="DR"?"STANDBY":"RUNNING";
          return {...s,cpu,mem:Math.round(drift(s.mem,2,10,99)),jvmHeap,gcTime:Math.round(drift(s.gcTime,jvmHeap>85?8:2,1,250)),threads:Math.round(drift(s.threads,4,1,s.maxThreads)),uptimeSecs:s.uptimeSecs+3,status};
        }));
      },3000);
      return ()=>clearInterval(t);
    }
  },[realMode,wls.length]);

  const termLine = (l) => setTermLines(p=>[...p,l]);

  // ─── Operations ──────────────────────────────────────────────────────────
  const handleOp=(target,op,type)=>{
    record("OP_SUBMIT",{operation:op,target:typeof target==="string"?target:target.name,description:user.name+" submitted "+op});
    setModal({target,op,type:type||"wls"});
  };

  const confirmOp=async({reason,ticket,priority})=>{
    const {target,op,type}=modal;
    const name=typeof target==="string"?target:target.name;
    const entry={action:op+" on "+name,user:user.name,target:name,operation:op,reason,ticket,priority,time:nowStr(),resourceType:type};
    if(user.role==="admin") {
      push(ref(db,"auditLogs"),{...entry,status:"APPROVED"});
      record("OP_EXECUTE",{operation:op,target:name,description:user.name+" executed "+op+" on "+name});
      addToast("Executing: "+op,name,C.success,"⚡");
      termLine("[INFO] "+op+" initiated on "+name);
      if(realMode) {
        try {
          const res=await wlsApi.post("/api/servers/"+name+"/"+op.toLowerCase(),{reason});
          termLine("[OK] "+res.message||op+" sent to "+name);
          addToast(op+" sent",name,C.success,"✅");
          setTimeout(loadRealServers,5000);
        } catch(e) {
          termLine("[ERR] "+op+" failed: "+e.message);
          addToast(op+" failed",e.message,C.danger,"❌");
        }
      } else {
        simulateOp(target,op,type);
      }
    } else {
      push(ref(db,"approvals"),{...entry,status:"PENDING",requestedBy:user.name});
      record("OP_SUBMIT",{operation:op,target:name});
      addToast("Submitted","Awaiting approval",C.warning,"📤");
    }
    setModal(null);
  };

  const simulateOp=(target,op,type)=>{
    if(type!=="wls") return;
    const steps={RESTART:["STOPPING","STOPPED","STARTING","RUNNING"],STOP:["STOPPING","STOPPED"],START:["STARTING","RUNNING"]};
    const id=typeof target==="string"?null:target.id;
    if(!id) return;
    (steps[op]||[]).forEach((st,i)=>setTimeout(()=>{
      setWls(p=>p.map(s=>s.id===id?{...s,status:st,operationStatus:st==="RUNNING"?null:st}:s));
      termLine(st==="RUNNING"?"[OK] "+target.name+" is RUNNING":"[INFO] "+target.name+" → "+st);
    },i*2000));
  };

  // ─── Tab routing ─────────────────────────────────────────────────────────
  const changeTab=(id,label)=>{ setTab(id); record("TAB_VISIT",{tab:label,description:user.name+" visited "+label}); };

  const pendingApprovals = approvalList.filter(a=>a.status==="PENDING").length;
  const openIncidents    = incidentList.filter(i=>["OPEN","ACKNOWLEDGED"].includes(i.status)).length;
  const criticalWLS      = wls.filter(s=>s.status==="CRITICAL").length;

  const ALL_TABS=[
    {id:"overview",   label:"Overview",       roles:["admin","operator","approver","viewer"]},
    {id:"weblogic",   label:"WebLogic",       roles:["admin","operator","viewer"]},
    {id:"deployments",label:"Deployments",    roles:["admin","operator","viewer"]},
    {id:"pipeline",   label:"Pipeline",       roles:["admin","operator"]},
    {id:"pdc-monitor",label:"PDC App",        roles:["admin","operator","viewer"]},
    {id:"operations", label:"Operations",     roles:["admin","operator"]},
    {id:"approvals",  label:"Approvals"+(pendingApprovals>0?" ("+pendingApprovals+")":" "), roles:["admin","approver"]},
    {id:"incidents",  label:"Incidents"+(openIncidents>0?" ("+openIncidents+")":" "),  roles:["admin","operator","approver","viewer"]},
    {id:"oncall",     label:"On-Call",        roles:["admin","operator","viewer"]},
    {id:"dr",         label:"DR",             roles:["admin","operator","viewer"]},
    {id:"patches",    label:"Patches",        roles:["admin","operator"]},
    {id:"cost",       label:"Cost",           roles:["admin","viewer"]},
    {id:"visitors",   label:"Visitors",       roles:["admin"]},
    {id:"feedback",   label:"Feedback"+(feedbackList.length>0?" ("+feedbackList.length+")":" "), roles:["admin","approver"]},
    {id:"activity",   label:"Activity",       roles:["admin","approver"]},
    {id:"audit",      label:"Audit",          roles:["admin","approver"]},
    {id:"wls-setup",  label:"⚙ WLS Setup",    roles:["admin"]},
  ].filter(t=>t.roles.includes(user.role));

  const sp={C,wls,deployments,setDeployments,approvalList,auditList,incidentList,activityList,visitorList,feedbackList,user,handleOp,termLines,setTermLines,addToast,record,realMode,proxyStatus,loadRealDeployments};

  return <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.text}}>
    <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.dim};border-radius:3px}input,textarea,select,button{font-family:'DM Sans',sans-serif}@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes pr{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.5);opacity:0}}`}</style>
    <ToastContainer toasts={toasts} dismiss={id=>setToasts(p=>p.filter(t=>t.id!==id))}/>
    {modal&&<ApprovalModal op={modal.op} target={typeof modal.target==="string"?modal.target:modal.target.name} user={user} onConfirm={confirmOp} onCancel={()=>setModal(null)} C={C} record={record}/>}
    {showChatbot&&<ChatbotPanel onClose={()=>setShowChatbot(false)} C={C} wls={wls} deployments={deployments} incidentList={incidentList} record={record} user={user} realMode={realMode}/>}

    {/* Chatbot Btn */}
    <button onClick={()=>setShowChatbot(!showChatbot)} style={{position:"fixed",bottom:24,right:24,zIndex:500,width:52,height:52,borderRadius:"50%",background:C.red,border:"none",cursor:"pointer",fontSize:22,boxShadow:"0 4px 16px rgba(0,0,0,.4)",display:"flex",alignItems:"center",justifyContent:"center"}} title="OCI Assistant">🤖</button>

    {/* Platform Header */
    <header style={{background:C.headerBg,borderBottom:"1px solid "+C.border,position:"sticky",top:0,zIndex:100}}>
      <div style={{padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:50,borderBottom:"1px solid rgba(255,255,255,.1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{fontWeight:800,fontSize:18,color:"#fff",letterSpacing:-0.5}}>ORACLE</div>
          <div style={{width:1,height:20,background:"rgba(255,255,255,.3)"}}/>
          <div style={{color:"rgba(255,255,255,.85)",fontSize:13,fontWeight:600}}>Cloud Infrastructure Platform</div>
          {/* Real/Sim indicator */}
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.1)",borderRadius:4,padding:"3px 10px",fontSize:11}}>
            <Pulse color={proxyStatus==="connected"?C.success:proxyStatus==="checking"?C.blue:C.warning} size={6}/>
            <span style={{color:"rgba(255,255,255,.8)",fontWeight:700}}>{proxyStatus==="connected"?"LIVE WLS":proxyStatus==="checking"?"CONNECTING":"SIMULATED"}</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {criticalWLS>0&&<div style={{display:"flex",alignItems:"center",gap:5,background:C.danger+"25",border:"1px solid "+C.danger+"55",borderRadius:4,padding:"3px 10px"}}><Pulse color={C.danger} size={6}/><span style={{fontSize:11,fontWeight:700,color:C.danger}}>{criticalWLS} CRITICAL</span></div>}
          <button onClick={toggleTheme} style={{background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:4,padding:"5px 12px",cursor:"pointer",color:"#fff",fontSize:12,fontWeight:600}}>{isDark?"☀️":"🌙"}</button>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:4,padding:"4px 12px"}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:C.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff",border:"2px solid rgba(255,255,255,.4)"}}>{user.initials}</div>
            <span style={{fontSize:12,fontWeight:600,color:"#fff"}}>{user.name}</span>
          </div>
          <Btn color="#fff" outline onClick={()=>{record("LOGOUT",{description:user.name+" signed out"});onLogout();}} sm C={C}>Sign Out</Btn>
        </div>
      </div>
      <ConnectionBanner status={proxyStatus} proxyUrl={PROXY_URL} C={C}/>
      <div style={{padding:"0 20px",display:"flex",overflowX:"auto",background:isDark?"#1a1a1a":"#b83020"}}>
        {ALL_TABS.map(t=><button key={t.id} onClick={()=>changeTab(t.id,t.label)} style={{padding:"9px 14px",background:"transparent",border:"none",borderBottom:tab===t.id?"3px solid #fff":"3px solid transparent",color:tab===t.id?"#fff":"rgba(255,255,255,.6)",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?700:500,whiteSpace:"nowrap",transition:"all .2s"}}>{t.label}</button>)}
      </div>
    </header>

    <main style={{maxWidth:1800,margin:"0 auto",padding:"24px 20px",animation:"slideIn .25s ease"}}>
      {tab==="overview"    && <OverviewTab {...sp}/>}
      {tab==="weblogic"    && <WebLogicTab {...sp}/>}
      {tab==="deployments" && <DeploymentsTab {...sp}/>}
      {tab==="pipeline"    && <PipelineTab {...sp}/>}
      {tab==="pdc-monitor" && <PDCMonitorTab {...sp}/>}
      {tab==="operations"  && <OperationsTab {...sp}/>}
      {tab==="approvals"   && <ApprovalsTab {...sp}/>}
      {tab==="incidents"   && <IncidentsTab {...sp}/>}
      {tab==="oncall"      && <OnCallTab {...sp}/>}
      {tab==="dr"          && <DRTab {...sp}/>}
      {tab==="patches"     && <PatchesTab {...sp}/>}
      {tab==="cost"        && <CostTab {...sp}/>}
      {tab==="visitors"    && <VisitorsTab {...sp}/>}
      {tab==="feedback"    && <FeedbackTab {...sp}/>}
      {tab==="activity"    && <ActivityTab {...sp}/>}
      {tab==="audit"       && <AuditTab {...sp}/>}
      {tab==="wls-setup"   && <WLSSetupTab {...sp}/>}
    </main>
    <button onClick={()=>changeTab("feedback","Feedback")} style={{position:"fixed",bottom:24,left:24,zIndex:500,padding:"8px 18px",background:C.card,border:"1px solid "+C.border,borderRadius:4,cursor:"pointer",fontSize:13,fontWeight:700,color:C.text,boxShadow:"0 2px 8px "+C.shadow}}>💬 Feedback</button>
  </div>;
}

// ─── Overview Tab ──────────────────────────────────────────────────────────
function OverviewTab({C,wls,deployments,incidentList,approvalList,auditList,realMode,proxyStatus}) {
  const running=wls.filter(s=>s.status==="RUNNING").length;
  const critical=wls.filter(s=>s.status==="CRITICAL").length;
  const openInc=incidentList.filter(i=>["OPEN","ACKNOWLEDGED"].includes(i.status)).length;
  const activeDeploys=deployments.filter(d=>d.state==="ACTIVE").length;
  return <div>
    <div style={{marginBottom:20}}>
      <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>Infrastructure Overview</h2>
      <div style={{display:"flex",alignItems:"center",gap:8}}><Pulse color={C.success} size={6}/><span style={{fontSize:12,color:C.muted}}>{realMode?"Live data from WLS REST API":"Simulation mode"} · Updates every 3s</span></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
      {[{l:"WLS Running",v:running+"/"+wls.length,c:C.red,i:"⚡"},{l:"Active Deploys",v:activeDeploys+"/"+deployments.length,c:C.blue,i:"🚀"},{l:"Critical",v:critical,c:critical>0?C.danger:C.success,i:"🔴"},{l:"Incidents",v:openInc,c:openInc>0?C.warning:C.success,i:"🚨"},{l:"Pending Approvals",v:(approvalList||[]).filter(a=>a.status==="PENDING").length,c:C.warning,i:"⏳"},{l:"Proxy",v:proxyStatus==="connected"?"LIVE":"SIM",c:proxyStatus==="connected"?C.success:C.warning,i:"🔗"}].map(s=><Card key={s.l} color={s.c} style={{padding:"14px 16px"}} C={C}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div><div style={{fontSize:10,color:C.muted,marginTop:6,textTransform:"uppercase",letterSpacing:0.8}}>{s.l}</div></div>
          <span style={{fontSize:18,opacity:.5}}>{s.i}</span>
        </div>
      </Card>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
      <Card color={C.red} C={C}>
        <div style={{fontWeight:700,marginBottom:14,fontSize:14,display:"flex",justifyContent:"space-between"}}>
          <span>⚡ WebLogic Servers</span>
          <div style={{display:"flex",alignItems:"center",gap:5}}><Pulse color={C.success} size={6}/><span style={{fontSize:11,color:C.muted,fontWeight:400}}>Live</span></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {wls.map(s=><div key={s.id} style={{background:C.card2,border:"1px solid "+C.border,borderLeft:"3px solid "+scol(s.status,C),borderRadius:4,padding:"10px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><Pulse color={scol(s.status,C)} size={6}/><span style={{fontWeight:700,fontSize:12,fontFamily:"monospace",color:C.text}}>{s.name}</span></div>
              <Badge text={s.status} color={scol(s.status,C)}/>
            </div>
            <MetricBar value={s.cpu||0} label="CPU" warn={70} crit={85} small C={C}/>
            <div style={{marginTop:5}}><MetricBar value={s.jvmHeap||0} label="JVM" warn={80} crit={92} small C={C}/></div>
          </div>)}
        </div>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card color={C.blue} C={C}>
          <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>🚀 Deployments</div>
          {deployments.slice(0,5).map(d=><div key={d.name} style={{padding:"7px 0",borderBottom:"1px solid "+C.border+"66"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontWeight:600,fontSize:12,color:C.text}}>{d.name}</span>
              <Badge text={d.state||"ACTIVE"} color={scol(d.state||"ACTIVE",C)}/>
            </div>
            <div style={{fontSize:10,color:C.muted}}>{d.type} · {(d.targets||[]).join(", ")}</div>
          </div>)}
        </Card>
        <Card color={C.danger} C={C}>
          <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>📋 Recent Audit</div>
          {auditList.length===0?<div style={{color:C.muted,fontSize:12}}>No activity yet.</div>:[...auditList].reverse().slice(0,4).map(a=><div key={a.id} style={{padding:"5px 0",borderBottom:"1px solid "+C.border+"66"}}>
            <div style={{fontWeight:600,fontSize:11,color:C.text}}>{a.action}</div>
            <div style={{color:C.muted,fontSize:10,marginTop:1}}>{a.user} · {a.time}</div>
          </div>)}
        </Card>
      </div>
    </div>
  </div>;
}

// ─── WebLogic Tab ──────────────────────────────────────────────────────────
function WebLogicTab({C,wls,user,handleOp,realMode,addToast}) {
  const [sel,setSel]=useState(null);
  const [detail,setDetail]=useState(null);
  const [loadingDetail,setLoadingDetail]=useState(false);
  const s=sel?wls.find(x=>x.id===sel):null;
  const canOp=user.role==="admin"||user.role==="operator";

  const loadDetail=async(name)=>{
    if(!realMode) return;
    setLoadingDetail(true);
    try { const d=await wlsApi.get("/api/servers/"+name); setDetail(d.server); }
    catch(e) { setDetail(null); }
    finally { setLoadingDetail(false); }
  };

  useEffect(()=>{ if(s&&realMode) loadDetail(s.name); },[sel,realMode]);

  return <div>
    <div style={{marginBottom:16}}>
      <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>WebLogic Servers</h2>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <p style={{color:C.muted,margin:0,fontSize:12}}>Live JVM metrics · {wls.length} servers · Click for details</p>
        {realMode&&<Badge text="LIVE WLS DATA" color={C.success}/>}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:s?"1fr 360px":"1fr",gap:16}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12,alignContent:"start"}}>
        {wls.map(sv=><Card key={sv.id} color={scol(sv.status,C)} onClick={()=>setSel(sel===sv.id?null:sv.id)} style={{cursor:"pointer",padding:"14px 16px"}} C={C}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div>
              <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}><Pulse color={scol(sv.status,C)} size={7}/><span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:C.text}}>{sv.name}</span></div>
              <div style={{fontSize:10,color:C.muted}}>{sv.host||sv.name}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
              <Badge text={sv.status} color={scol(sv.status,C)} dot/>
              <Badge text={sv.env||"Production"} color={sv.env==="UAT"?C.blue:sv.env==="DR"?C.teal:C.red}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
            {[["CPU",sv.cpu+"%",sv.cpu>85?C.danger:sv.cpu>70?C.warning:C.success],["MEM",sv.mem+"%",sv.mem>90?C.danger:sv.mem>75?C.warning:C.success],["JVM",sv.jvmHeap+"%",sv.jvmHeap>92?C.danger:sv.jvmHeap>80?C.warning:C.success],["THR",sv.threads,sv.threads/sv.maxThreads>.9?C.danger:sv.threads/sv.maxThreads>.75?C.warning:C.success]].map(([l,v,c])=><div key={l} style={{background:C.bg,border:"1px solid "+C.border,borderRadius:3,padding:"6px 3px",textAlign:"center"}}>
              <div style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:c}}>{v}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div>
            </div>)}
          </div>
          <div style={{fontSize:10,color:C.muted}}>⏱ {fmtUp(sv.uptimeSecs||0)} · WLS {sv.version}</div>
        </Card>)}
      </div>
      {s&&<div style={{position:"sticky",top:90,height:"fit-content"}}>
        <Card color={scol(s.status,C)} C={C}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <div><div style={{fontWeight:800,fontSize:16,color:C.text}}>{s.name}</div><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginTop:3}}>{s.host}:{s.port}</div></div>
            <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}>✕</button>
          </div>
          {loadingDetail&&<div style={{textAlign:"center",padding:20,color:C.muted}}>Loading real metrics...</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            <MetricBar value={detail?.jvm?.heapPct||s.jvmHeap||0} label="JVM Heap" warn={80} crit={92} C={C}/>
            <MetricBar value={s.cpu||0} label="CPU" warn={70} crit={85} C={C}/>
            <MetricBar value={s.mem||0} label="Memory" warn={75} crit={90} C={C}/>
            {detail&&<>
              <MetricBar value={detail.jvm?.gcTimeSec||0} max={200} label="GC Time" warn={50} crit={100} unit="s" C={C}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
                {[["Threads Idle",detail.threads?.current||0,C.cyan],["Stuck Threads",detail.threads?.stuck||0,(detail.threads?.stuck||0)>0?C.danger:C.success],["Pending Req",detail.threads?.pending||0,(detail.threads?.pending||0)>50?C.warning:C.success],["JVM Heap MB",detail.jvm?.heapUsedMB||0,C.blue]].map(([l,v,c])=><div key={l} style={{background:C.bg,border:"1px solid "+C.border,borderRadius:3,padding:"8px 10px"}}>
                  <div style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:c}}>{v}</div>
                  <div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div>
                </div>)}
              </div>
            </>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {[["Uptime",fmtUp(s.uptimeSecs||0)],["Version",s.version],["Deployments",s.deployments||0],["Environment",s.env||"Production"]].map(([l,v])=><div key={l} style={{background:C.bg,border:"1px solid "+C.border,borderRadius:4,padding:"8px 10px"}}>
              <div style={{fontSize:9,color:C.muted,marginBottom:2,textTransform:"uppercase"}}>{l}</div>
              <div style={{fontSize:12,fontWeight:600,fontFamily:"monospace",color:C.text}}>{v}</div>
            </div>)}
          </div>
          {canOp&&<>
            <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Operations</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
              {[["RESTART","🔄",C.blue],["STOP","⏹️",C.danger],["START","▶️",C.success]].map(([op,icon,color])=><Btn key={op} color={color} onClick={()=>handleOp(s,op,"wls")} style={{padding:"10px 4px",textAlign:"center",justifyContent:"center",flexDirection:"column",gap:4}} C={C}><span style={{fontSize:18}}>{icon}</span>{op}</Btn>)}
            </div>
            {realMode&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <Btn color={C.orange} sm onClick={async()=>{ addToast("Heap dump triggered","",C.orange,"💾"); try{await wlsApi.post("/api/heapdump/"+s.name);addToast("Heap dump done","",C.success,"✅");}catch(e){addToast("Failed",e.message,C.danger,"❌")} }} C={C}>💾 Heap Dump</Btn>
              <Btn color={C.purple} sm onClick={async()=>{ try{const d=await wlsApi.get("/api/threads/"+s.name);addToast("Threads: "+d.threads?.executeThreadTotalCount,"Stuck: "+(d.threads?.stuckThreadCount||0),C.purple,"📋");}catch(e){addToast("Failed",e.message,C.danger,"❌")} }} C={C}>📋 Thread Dump</Btn>
            </div>}
            {user.role!=="admin"&&<div style={{fontSize:11,color:C.warning,marginTop:8,textAlign:"center"}}>⚠ Requires Change Approver sign-off</div>}
          </>}
        </Card>
      </div>}
    </div>
  </div>;
}

// ─── Deployments Tab ───────────────────────────────────────────────────────
function DeploymentsTab({C,deployments,setDeployments,wls,user,addToast,record,termLines,setTermLines,handleOp,realMode,loadRealDeployments}) {
  const [showDeploy,setShowDeploy]=useState(false);
  const [file,setFile]=useState(null);
  const [appName,setAppName]=useState("");
  const [targets,setTargets]=useState("WLS-PROD-01,WLS-PROD-02");
  const [deploying,setDeploying]=useState(false);
  const [filter,setFilter]=useState("ALL");
  const [dragOver,setDragOver]=useState(false);
  const canDeploy=user.role==="admin"||user.role==="operator";
  const termLine=(l)=>setTermLines(p=>[...p,l]);

  const handleFileDrop=(e)=>{
    e.preventDefault(); setDragOver(false);
    const f=e.dataTransfer?.files[0]||e.target.files[0];
    if(!f) return;
    setFile(f);
    if(!appName) setAppName(f.name.replace(/\.(war|ear|jar)$/i,""));
    addToast("File selected",f.name+" ("+fmtSize(f.size)+")",C.blue,"📦");
  };

  const doDeploy=async()=>{
    if(!file&&!appName) return addToast("Select a file","",C.danger,"❌");
    if(!appName.trim()) return addToast("Enter app name","",C.danger,"❌");
    setDeploying(true);
    termLine("[INFO] Deploying "+appName+" to "+targets+"...");
    record("DEPLOY",{description:user.name+" deploying "+appName+" to "+targets});
    if(realMode&&file) {
      try {
        const form=new FormData();
        form.append("file",file);
        form.append("appName",appName);
        form.append("targets",targets);
        const res=await wlsApi.upload("/api/deploy",form);
        termLine("[OK] "+res.message);
        addToast("Deployed!",appName+" on "+targets,C.success,"🚀");
        push(ref(db,"auditLogs"),{action:"DEPLOYED: "+appName,user:user.name,target:targets,time:nowStr(),status:"SUCCESS"});
        if(loadRealDeployments) await loadRealDeployments();
      } catch(e) {
        termLine("[ERR] Deploy failed: "+e.message);
        addToast("Deploy failed",e.message,C.danger,"❌");
      }
    } else {
      // Simulated deploy
      const targetList=targets.split(",").map(t=>t.trim());
      ["[INFO] Uploading "+appName+"...",`[INFO] Staging on ${targets}...`,"[INFO] Deploying to managed servers...","[OK] Application synchronized","[SUCCESS] "+appName+" is ACTIVE"].forEach((l,i)=>setTimeout(()=>termLine(l),i*800));
      setTimeout(()=>{
        setDeployments(p=>{
          const exists=p.find(d=>d.name===appName);
          if(exists) return p.map(d=>d.name===appName?{...d,state:"ACTIVE",deployedAt:nowStr(),version:(parseFloat(d.version||"1.0")+0.1).toFixed(1)}:d);
          return [...p,{name:appName,type:file?.name?.endsWith(".ear")?"EAR":file?.name?.endsWith(".jar")?"JAR":"WAR",targets:targetList,state:"ACTIVE",health:"OK",version:"1.0.0",deployedAt:nowStr(),size:file?fmtSize(file.size):"N/A"}];
        });
        push(ref(db,"auditLogs"),{action:"DEPLOYED: "+appName,user:user.name,target:targets,time:nowStr(),status:"SUCCESS"});
        addToast("Deployed!",appName,C.success,"🚀");
      },4500);
    }
    setDeploying(false);
    setShowDeploy(false);
    setFile(null);
    setAppName("");
  };

  const doOp=async(dep,op)=>{
    if(!realMode) {
      // Simulated
      if(op==="UNDEPLOY") {
        setDeployments(p=>p.filter(d=>d.name!==dep.name));
        push(ref(db,"auditLogs"),{action:"UNDEPLOYED: "+dep.name,user:user.name,time:nowStr()});
        addToast("Undeployed",dep.name,C.warning,"📦");
        record("UNDEPLOY",{description:user.name+" undeployed "+dep.name});
      } else if(op==="REDEPLOY") {
        setDeployments(p=>p.map(d=>d.name===dep.name?{...d,state:"ACTIVE",deployedAt:nowStr()}:d));
        addToast("Redeployed",dep.name,C.success,"🔄");
      } else if(op==="STOP") {
        setDeployments(p=>p.map(d=>d.name===dep.name?{...d,state:"PREPARED"}:d));
        addToast("Stopped",dep.name,C.warning,"⏹️");
      } else if(op==="START") {
        setDeployments(p=>p.map(d=>d.name===dep.name?{...d,state:"ACTIVE"}:d));
        addToast("Started",dep.name,C.success,"▶️");
      }
    } else {
      try {
        const paths={UNDEPLOY:"/api/undeploy/"+dep.name,REDEPLOY:"/api/redeploy/"+dep.name,STOP:"/api/stop-deployment/"+dep.name,START:"/api/start-deployment/"+dep.name};
        const r=await wlsApi.post(paths[op]||"/api/redeploy/"+dep.name);
        addToast(op+" complete",dep.name,C.success,"✅");
        termLine("[OK] "+op+": "+dep.name+" — "+r.message);
        if(loadRealDeployments) setTimeout(loadRealDeployments,2000);
      } catch(e) { addToast(op+" failed",e.message,C.danger,"❌"); }
    }
  };

  const filtered=filter==="ALL"?deployments:deployments.filter(d=>d.state===filter);

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>🚀 Deployment Manager</h2>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <p style={{color:C.muted,margin:0,fontSize:12}}>Deploy, undeploy, redeploy WAR/EAR applications · {deployments.length} applications</p>
          {realMode&&<Badge text="REAL WLS" color={C.success}/>}
        </div>
      </div>
      {canDeploy&&<Btn color={C.red} onClick={()=>setShowDeploy(!showDeploy)} C={C}>🚀 Deploy Application</Btn>}
    </div>

    {/* KPI row */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
      {[["Active",deployments.filter(d=>d.state==="ACTIVE").length,C.success,"✅"],["Total",deployments.length,C.blue,"📦"],["Prepared",deployments.filter(d=>d.state==="PREPARED").length,C.warning,"⏸"],["Failed",deployments.filter(d=>d.state==="FAILED").length,C.danger,"❌"]].map(([l,v,c,i])=><Card key={l} color={c} style={{padding:"14px 16px"}} C={C}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:24,fontWeight:700,color:c}}>{i} {v}</div>
        <div style={{fontSize:11,color:C.muted,marginTop:6,textTransform:"uppercase"}}>{l}</div>
      </Card>)}
    </div>

    {/* Deploy Form */}
    {showDeploy&&<Card color={C.red} style={{marginBottom:16}} C={C}>
      <div style={{fontWeight:700,marginBottom:16,fontSize:16}}>🚀 Deploy New Application</div>
      {/* Drag & Drop zone */}
      <div
        onDragOver={e=>{e.preventDefault();setDragOver(true)}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={handleFileDrop}
        onClick={()=>document.getElementById("warFileInput").click()}
        style={{border:"2px dashed "+(dragOver?C.red:file?C.success:C.border),borderRadius:8,padding:"32px 20px",textAlign:"center",cursor:"pointer",marginBottom:14,background:dragOver?C.red+"08":file?C.success+"08":"transparent",transition:"all .2s"}}
      >
        <div style={{fontSize:36,marginBottom:8}}>{file?"✅":"📦"}</div>
        {file?<><div style={{fontWeight:700,fontSize:14,color:C.success,marginBottom:4}}>{file.name}</div><div style={{fontSize:11,color:C.muted}}>{fmtSize(file.size)}</div></>:<><div style={{fontWeight:700,fontSize:14,color:C.muted,marginBottom:4}}>Drag & drop WAR / EAR / JAR here</div><div style={{fontSize:11,color:C.dim}}>or click to browse</div></>}
        <input id="warFileInput" type="file" accept=".war,.ear,.jar" onChange={handleFileDrop} style={{display:"none"}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Application Name</div>
          <Inp value={appName} onChange={e=>setAppName(e.target.value)} placeholder="e.g. pdc-app" C={C}/>
        </div>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Target Servers</div>
          <Sel value={targets} onChange={e=>setTargets(e.target.value)} C={C}>
            {["WLS-PROD-01,WLS-PROD-02","WLS-PROD-01","WLS-PROD-02","WLS-UAT-01","WLS-PROD-01,WLS-PROD-02,WLS-UAT-01"].map(t=><option key={t} value={t}>{t}</option>)}
          </Sel>
        </div>
      </div>
      <div style={{display:"flex",gap:12}}>
        <Btn color={C.red} onClick={doDeploy} loading={deploying} disabled={deploying||!appName.trim()} style={{flex:1,padding:12,justifyContent:"center"}} C={C}>🚀 {realMode?"Deploy to Real WLS":"Simulate Deploy"}</Btn>
        <Btn color={C.muted} outline onClick={()=>{setShowDeploy(false);setFile(null);setAppName("");}} style={{padding:12}} C={C}>Cancel</Btn>
      </div>
    </Card>}

    <div style={{display:"grid",gridTemplateColumns:"3fr 1fr",gap:14}}>
      <div>
        {/* Filter bar */}
        <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
          {["ALL","ACTIVE","PREPARED","FAILED"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 14px",borderRadius:3,border:"1px solid "+(filter===f?C.red:C.border),background:filter===f?C.red+"15":"transparent",color:filter===f?C.red:C.muted,fontSize:12,cursor:"pointer",fontWeight:700}}>{f}</button>)}
          {canDeploy&&realMode&&<button onClick={loadRealDeployments} style={{marginLeft:"auto",padding:"5px 14px",borderRadius:3,border:"1px solid "+C.border,background:"transparent",color:C.muted,fontSize:12,cursor:"pointer"}}>↻ Refresh</button>}
        </div>

        {/* Deployment list */}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(dep=><Card key={dep.name} color={scol(dep.state||"ACTIVE",C)} style={{padding:"14px 18px"}} C={C}>
            <div style={{display:"flex",gap:14,alignItems:"flex-start",flexWrap:"wrap"}}>
              <div style={{fontSize:32,flexShrink:0}}>{dep.type==="EAR"?"🏢":dep.type==="JAR"?"☕":"🌐"}</div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontWeight:800,fontSize:15,fontFamily:"monospace",color:C.text}}>{dep.name}</span>
                  <Chip label={dep.type||"WAR"} color={C.cyan} C={C}/>
                  <Badge text={dep.state||"ACTIVE"} color={scol(dep.state||"ACTIVE",C)}/>
                  {dep.health&&dep.health!=="OK"&&<Badge text={dep.health} color={C.warning}/>}
                </div>
                <div style={{display:"flex",gap:12,fontSize:11,color:C.muted,flexWrap:"wrap"}}>
                  {dep.version&&<span>📌 v{dep.version}</span>}
                  {dep.size&&<span>💾 {dep.size}</span>}
                  {dep.deployedAt&&<span>🕐 {dep.deployedAt}</span>}
                </div>
                <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                  {(dep.targets||[]).map(t=><Chip key={t} label={t} color={C.blue} C={C}/>)}
                </div>
              </div>
              {canDeploy&&<div style={{display:"flex",gap:7,flexShrink:0,flexWrap:"wrap"}}>
                {dep.state!=="ACTIVE"&&<Btn color={C.success} sm onClick={()=>doOp(dep,"START")} C={C}>▶️ Start</Btn>}
                {dep.state==="ACTIVE"&&<Btn color={C.warning} sm onClick={()=>doOp(dep,"STOP")} C={C}>⏹ Stop</Btn>}
                <Btn color={C.blue} sm onClick={()=>doOp(dep,"REDEPLOY")} C={C}>🔄 Redeploy</Btn>
                <Btn color={C.danger} sm outline onClick={()=>{ if(window.confirm("Undeploy "+dep.name+"?")) doOp(dep,"UNDEPLOY"); }} C={C}>🗑 Undeploy</Btn>
              </div>}
            </div>
          </Card>)}
          {filtered.length===0&&<Card color={C.muted} style={{textAlign:"center",padding:40}} C={C}><div style={{color:C.muted}}>No deployments found.</div></Card>}
        </div>
      </div>

      {/* Terminal */}
      <div style={{position:"sticky",top:90,height:"fit-content"}}>
        <Card color={C.success} C={C}>
          <div style={{fontWeight:700,marginBottom:10,fontSize:13,display:"flex",justifyContent:"space-between"}}>
            <span>🖥 Deploy Console</span>
            <button onClick={()=>setTermLines(["[INFO] Cleared."])} style={{background:"none",border:"1px solid "+C.border,borderRadius:3,color:C.muted,cursor:"pointer",fontSize:10,padding:"2px 8px"}}>Clear</button>
          </div>
          <Terminal lines={termLines} height={420} C={C}/>
        </Card>
      </div>
    </div>
  </div>;
}

// ─── Operations Tab ────────────────────────────────────────────────────────
function OperationsTab({C,wls,user,approvalList,handleOp,termLines,setTermLines,realMode}) {
  const [form,setForm]=useState({server:"",operation:"RESTART"});
  const [loading,setLoading]=useState(false);
  const termLine=(l)=>setTermLines(p=>[...p,l]);

  const execOp=async()=>{
    if(!form.server) return;
    const res=wls.find(r=>r.name===form.server);
    if(!res) return;
    if(realMode) {
      setLoading(true);
      termLine("[INFO] "+form.operation+" on "+form.server+" (real WLS)...");
      handleOp(res,form.operation,"wls");
      setLoading(false);
    } else {
      handleOp(res,form.operation,"wls");
    }
  };

  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>Operations Center</h2>
    <p style={{color:C.muted,marginBottom:16,fontSize:12}}>{user.role==="admin"?"System Admin — direct execution":"Operations require Change Approver sign-off"} · {realMode&&<strong style={{color:C.success}}>REAL WLS EXECUTION</strong>}</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card color={C.red} C={C}>
        <div style={{fontWeight:700,marginBottom:14,fontSize:15}}>Submit Operation</div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Target Server</div>
          <select value={form.server} onChange={e=>setForm(f=>({...f,server:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}>
            <option value="">Select server…</option>
            {wls.map(s=><option key={s.id} value={s.name}>{s.name} [{s.status}]</option>)}
          </select>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Operation</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[["RESTART","🔄",C.blue],["STOP","⏹️",C.danger],["START","▶️",C.success],["HEAPDUMP","💾",C.purple],["THREADDUMP","📋",C.teal],["PATCH","🔧",C.orange]].map(([op,icon,color])=><button key={op} onClick={()=>setForm(f=>({...f,operation:op}))} style={{padding:"9px 5px",background:form.operation===op?color+"20":C.card2,border:"2px solid "+(form.operation===op?color:C.border),borderRadius:4,cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:18,marginBottom:2}}>{icon}</div>
              <div style={{fontSize:10,fontWeight:700,color:form.operation===op?color:C.muted}}>{op}</div>
            </button>)}
          </div>
        </div>
        <Btn color={user.role==="admin"?C.success:C.warning} onClick={execOp} disabled={!form.server} loading={loading} style={{width:"100%",padding:12,justifyContent:"center"}} C={C}>{user.role==="admin"?`⚡ Execute ${realMode?"(Real)":"(Sim)"}`:"📤 Submit for Approval"}</Btn>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card color={C.success} C={C}>
          <div style={{fontWeight:700,marginBottom:10,fontSize:13,display:"flex",justifyContent:"space-between"}}>
            <span>🖥 Console</span>
            <button onClick={()=>setTermLines(["[INFO] Cleared."])} style={{background:"none",border:"1px solid "+C.border,borderRadius:3,color:C.muted,cursor:"pointer",fontSize:10,padding:"2px 8px"}}>Clear</button>
          </div>
          <Terminal lines={termLines} height={200} C={C}/>
        </Card>
        <Card color={C.warning} C={C}>
          <div style={{fontWeight:700,marginBottom:10,fontSize:13}}>⏳ Pending Approvals</div>
          {(approvalList||[]).filter(a=>a.status==="PENDING").length===0?<div style={{color:C.muted,fontSize:12}}>None pending.</div>:(approvalList||[]).filter(a=>a.status==="PENDING").map(a=><div key={a.id} style={{background:C.bg,borderRadius:4,padding:"8px 10px",marginBottom:6,borderLeft:"3px solid "+C.warning}}>
            <div style={{fontWeight:700,fontSize:11,fontFamily:"monospace",color:C.text}}>{a.operation} → {a.target}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:2}}>By {a.requestedBy||a.user} · {a.time}</div>
          </div>)}
        </Card>
      </div>
    </div>
  </div>;
}

// ─── Approvals Tab ─────────────────────────────────────────────────────────
function ApprovalsTab({C,approvalList,user,wls,record,addToast}) {
  const [localTerm,setLocalTerm]=useState(["[INFO] Approval console ready..."]);
  const canApprove=user.role==="admin"||user.role==="approver";
  const approve=(item)=>{
    update(ref(db,"approvals/"+item.id),{status:"APPROVED",approvedBy:user.name,approvedAt:nowStr()});
    push(ref(db,"auditLogs"),{action:"APPROVED: "+item.operation+" on "+item.target,user:user.name,time:nowStr()});
    record("OP_APPROVE",{operation:item.operation,target:item.target,description:user.name+" approved "+item.operation+" on "+item.target});
    setLocalTerm(p=>[...p,"[OK] APPROVED by "+user.name,"[INFO] Executing "+item.operation+"..."]);
    addToast("Approved",item.operation+" on "+item.target,C.success,"✅");
  };
  const reject=(item)=>{
    update(ref(db,"approvals/"+item.id),{status:"REJECTED",rejectedBy:user.name,rejectedAt:nowStr()});
    push(ref(db,"auditLogs"),{action:"REJECTED: "+item.operation+" on "+item.target,user:user.name,time:nowStr()});
    record("OP_REJECT",{operation:item.operation,target:item.target});
    setLocalTerm(p=>[...p,"[WARN] REJECTED by "+user.name]);
    addToast("Rejected",item.target,C.danger,"🚫");
  };
  const pending=(approvalList||[]).filter(a=>a.status==="PENDING");
  const history=(approvalList||[]).filter(a=>a.status!=="PENDING");
  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>Change Approvals</h2>
    <p style={{color:C.muted,marginBottom:16,fontSize:12}}>Review and approve/reject pending change requests</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:14}}>
      <div>
        <div style={{fontWeight:700,marginBottom:10,fontSize:13,color:C.warning}}>⏳ Pending ({pending.length})</div>
        {pending.length===0&&<Card color={C.success} style={{textAlign:"center",padding:20,marginBottom:12}} C={C}><div style={{color:C.muted}}>✅ No pending approvals</div></Card>}
        {pending.map(a=><Card key={a.id} color={C.warning} style={{marginBottom:10}} C={C}>
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
              <span style={{fontFamily:"monospace",fontWeight:800,fontSize:16,color:C.warning}}>{a.operation}</span>
              <Badge text={a.target} color={C.blue}/>
              <Badge text={a.priority||"Normal"} color={C.blue}/>
              {a.resourceType&&<Badge text={a.resourceType.toUpperCase()} color={C.purple}/>}
            </div>
            <p style={{color:C.muted,fontSize:12,margin:"0 0 5px"}}>{a.reason}</p>
            {a.ticket&&<div style={{fontSize:11,color:C.cyan}}>🎫 Ticket: {a.ticket}</div>}
            <div style={{fontSize:11,color:C.muted}}>By <strong style={{color:C.text}}>{a.requestedBy||a.user}</strong> · {a.time}</div>
          </div>
          {canApprove&&<div style={{display:"flex",gap:10}}>
            <Btn color={C.success} onClick={()=>approve(a)} style={{flex:1}} C={C}>✅ Approve & Execute</Btn>
            <Btn color={C.danger} outline onClick={()=>reject(a)} style={{flex:1}} C={C}>❌ Reject</Btn>
          </div>}
        </Card>)}
        <div style={{fontWeight:700,marginBottom:8,fontSize:13,color:C.muted,marginTop:14}}>📜 History</div>
        {history.map(a=><div key={a.id} style={{background:C.card,border:"1px solid "+C.border,borderLeft:"3px solid "+(a.status==="APPROVED"?C.success:C.danger),borderRadius:4,padding:"9px 12px",marginBottom:6}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:700,fontSize:11,fontFamily:"monospace",color:C.text}}>{a.operation} → {a.target}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{a.requestedBy||a.user} · {a.time}</div></div>
            <Badge text={a.status} color={a.status==="APPROVED"?C.success:C.danger}/>
          </div>
        </div>)}
      </div>
      <Card color={C.success} style={{height:"fit-content",position:"sticky",top:90}} C={C}>
        <div style={{fontWeight:700,marginBottom:10,fontSize:13}}>🖥 Execution Console</div>
        <Terminal lines={localTerm} height={320} C={C}/>
      </Card>
    </div>
  </div>;
}

// ─── Incidents Tab (condensed) ─────────────────────────────────────────────
function IncidentsTab({C,incidentList,user,wls,addToast,record}) {
  const [form,setForm]=useState({title:"",description:"",priority:"P2",assignee:"",affectedSystem:"",category:"Performance"});
  const [showForm,setShowForm]=useState(false);
  const [filter,setFilter]=useState("OPEN");
  const create=()=>{
    if(!form.title.trim()) return;
    push(ref(db,"incidents"),{...form,status:"OPEN",reportedBy:user.name,createdAt:nowStr(),slaBreachAt:form.priority==="P1"?"1 hour":form.priority==="P2"?"4 hours":"8 hours"});
    record("INCIDENT",{description:user.name+" created incident: "+form.title});
    setForm({title:"",description:"",priority:"P2",assignee:"",affectedSystem:"",category:"Performance"});
    setShowForm(false);
    addToast("Incident created","",C.warning,"🚨");
  };
  const filtered=filter==="ALL"?incidentList:incidentList.filter(i=>filter==="OPEN"?["OPEN","ACKNOWLEDGED"].includes(i.status):i.status===filter);
  const pc={P1:C.danger,P2:C.warning,P3:C.orange};
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <div><h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>Incident Management</h2><p style={{color:C.muted,margin:0,fontSize:12}}>ITIL P1/P2/P3 · SLA timers</p></div>
      <Btn color={C.red} onClick={()=>setShowForm(!showForm)} C={C}>+ Create Incident</Btn>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
      {[["P1",incidentList.filter(i=>i.priority==="P1"&&!["RESOLVED","CLOSED"].includes(i.status)).length,C.danger],["P2",incidentList.filter(i=>i.priority==="P2"&&!["RESOLVED","CLOSED"].includes(i.status)).length,C.warning],["Open",incidentList.filter(i=>i.status==="OPEN").length,C.orange],["Resolved",incidentList.filter(i=>["RESOLVED","CLOSED"].includes(i.status)).length,C.success]].map(([l,v,c])=><Card key={l} color={c} style={{padding:"13px 14px"}} C={C}><div style={{fontFamily:"monospace",fontSize:24,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:C.muted,marginTop:4,textTransform:"uppercase"}}>{l}</div></Card>)}
    </div>
    {showForm&&<Card color={C.red} style={{marginBottom:14}} C={C}>
      <div style={{fontWeight:700,marginBottom:12,fontSize:15}}>Create Incident</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <Inp value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Title *" C={C}/>
        <Sel value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} C={C}>{["P1 - Critical","P2 - High","P3 - Medium"].map((p,i)=><option key={i} value={"P"+(i+1)}>{p}</option>)}</Sel>
        <Sel value={form.assignee} onChange={e=>setForm(f=>({...f,assignee:e.target.value}))} C={C}><option value="">Assign To</option>{["Rajesh Kumar","Priya Sharma","Amit Verma","Sneha Patel"].map(n=><option key={n}>{n}</option>)}</Sel>
        <Sel value={form.affectedSystem} onChange={e=>setForm(f=>({...f,affectedSystem:e.target.value}))} C={C}><option value="">Affected System</option>{wls.map(s=><option key={s.id}>{s.name}</option>)}</Sel>
      </div>
      <Inp value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description..." rows={2} style={{marginTop:10}} C={C}/>
      <div style={{display:"flex",gap:10,marginTop:12}}><Btn color={C.red} onClick={create} C={C}>🚨 Create</Btn><Btn color={C.muted} outline onClick={()=>setShowForm(false)} C={C}>Cancel</Btn></div>
    </Card>}
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      {["OPEN","ACKNOWLEDGED","RESOLVED","ALL"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 14px",borderRadius:3,border:"1px solid "+(filter===f?C.red:C.border),background:filter===f?C.red+"15":"transparent",color:filter===f?C.red:C.muted,fontSize:12,cursor:"pointer",fontWeight:700}}>{f}</button>)}
    </div>
    {filtered.length===0?<Card color={C.success} style={{textAlign:"center",padding:36}} C={C}><div style={{color:C.muted}}>✅ No incidents found</div></Card>:<div style={{display:"flex",flexDirection:"column",gap:10}}>
      {filtered.map(i=><Card key={i.id} color={pc[i.priority]||C.blue} style={{padding:"13px 16px"}} C={C}>
        <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}><Badge text={i.priority} color={pc[i.priority]||C.blue}/><span style={{fontWeight:700,fontSize:14,color:C.text}}>{i.title}</span></div>
            {i.description&&<p style={{color:C.muted,fontSize:12,margin:"0 0 5px"}}>{i.description}</p>}
            <div style={{display:"flex",gap:10,fontSize:11,color:C.muted,flexWrap:"wrap"}}>
              {i.affectedSystem&&<span>🖥 {i.affectedSystem}</span>}{i.assignee&&<span>👤 {i.assignee}</span>}<span>🕐 {i.createdAt}</span>{i.slaBreachAt&&<span style={{color:i.priority==="P1"?C.danger:C.warning}}>⏱ SLA: {i.slaBreachAt}</span>}
            </div>
          </div>
          <div style={{display:"flex",gap:7,alignItems:"center",flexShrink:0}}>
            <Badge text={i.status} color={scol(i.status,C)}/>
            <select value={i.status} onChange={e=>update(ref(db,"incidents/"+i.id),{status:e.target.value})} style={{padding:"4px 8px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:11,outline:"none",fontFamily:"inherit"}}>
              {["OPEN","ACKNOWLEDGED","IN_PROGRESS","RESOLVED","CLOSED"].map(s=><option key={s}>{s}</option>)}
            </select>
            <button onClick={()=>remove(ref(db,"incidents/"+i.id))} style={{padding:"4px 10px",background:C.danger+"15",border:"1px solid "+C.danger+"33",borderRadius:4,color:C.danger,fontSize:11,cursor:"pointer",fontWeight:700}}>✕</button>
          </div>
        </div>
      </Card>)}
    </div>}
  </div>;
}

// ─── On-Call, DR, Patches, Cost, Visitors, Feedback, Activity, Audit ────────
// (same as previous version - abbreviated here for space, they're included inline)

function OnCallTab({C}) {
  const [roster,setRoster]=useState([
    {id:"o1",name:"Rajesh Kumar",email:"rajesh@company.com",phone:"+919800000000",role:"Primary On-Call",escalation:1,available:true},
    {id:"o2",name:"Priya Sharma",email:"priya@company.com",phone:"+919700000000",role:"Secondary On-Call",escalation:2,available:true},
    {id:"o3",name:"Amit Verma",email:"amit@company.com",phone:"+919600000000",role:"Escalation L2",escalation:3,available:true},
    {id:"o4",name:"Sneha Patel",email:"sneha@company.com",phone:"+919500000000",role:"OCI Admin",escalation:4,available:false},
  ]);
  const primary=roster.find(r=>r.escalation===1&&r.available);
  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>On-Call Roster</h2>
    <p style={{color:C.muted,marginBottom:16,fontSize:12}}>Escalation chain · Direct contact</p>
    {primary&&<Card color={C.danger} style={{marginBottom:14}} C={C}>
      <div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>🔴 Primary On-Call Now</div>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:C.danger+"20",border:"2px solid "+C.danger,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:C.danger}}>{primary.name.split(" ").map(n=>n[0]).join("")}</div>
        <div><div style={{fontWeight:800,fontSize:18,color:C.text}}>{primary.name}</div><div style={{fontSize:12,color:C.muted}}>{primary.role} · {primary.phone}</div></div>
      </div>
      <div style={{display:"flex",gap:10}}><a href={"tel:"+primary.phone} style={{textDecoration:"none"}}><Btn color={C.success} sm C={C}>📞 Call</Btn></a><a href={"sms:"+primary.phone} style={{textDecoration:"none"}}><Btn color={C.blue} sm C={C}>💬 SMS</Btn></a><a href={"mailto:"+primary.email} style={{textDecoration:"none"}}><Btn color={C.purple} sm C={C}>📧 Email</Btn></a></div>
    </Card>}
    <Card color={C.blue} C={C}>
      <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>Escalation Chain</div>
      {roster.sort((a,b)=>a.escalation-b.escalation).map(r=><div key={r.id} style={{display:"flex",gap:12,alignItems:"center",padding:"10px 0",borderBottom:"1px solid "+C.border}}>
        <div style={{width:30,height:30,borderRadius:"50%",background:(r.available?C.success:C.muted)+"20",border:"1px solid "+(r.available?C.success:C.muted),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:r.available?C.success:C.muted,flexShrink:0}}>{r.escalation}</div>
        <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:C.text}}>{r.name}</div><div style={{fontSize:11,color:C.muted}}>{r.role}</div></div>
        <div style={{display:"flex",gap:6}}>
          <a href={"tel:"+r.phone} style={{textDecoration:"none",padding:"4px 10px",background:C.success+"15",border:"1px solid "+C.success+"33",borderRadius:4,color:C.success,fontSize:11,fontWeight:700}}>📞</a>
          <a href={"mailto:"+r.email} style={{textDecoration:"none",padding:"4px 10px",background:C.purple+"15",border:"1px solid "+C.purple+"33",borderRadius:4,color:C.purple,fontSize:11,fontWeight:700}}>📧</a>
        </div>
        <div onClick={()=>setRoster(p=>p.map(x=>x.id===r.id?{...x,available:!x.available}:x))} style={{width:38,height:20,borderRadius:10,background:r.available?C.success:C.dim,cursor:"pointer",position:"relative",flexShrink:0}}>
          <div style={{position:"absolute",top:2,left:r.available?19:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .3s"}}/>
        </div>
      </div>)}
    </Card>
  </div>;
}

function DRTab({C}) {
  const [log,setLog]=useState([]);
  const [testing,setTesting]=useState(false);
  const checks=[{item:"DR-ADB-01 Sync",status:"SYNCHRONIZED",detail:"Lag: 2s",ok:true},{item:"DR-VCN Connectivity",status:"ACTIVE",detail:"IPSec up",ok:true},{item:"dr-app-01",status:"STOPPED",detail:"Ready",ok:true},{item:"WLS-DR-01",status:"STANDBY",detail:"Sync'd",ok:true},{item:"DNS Failover",status:"CONFIGURED",detail:"TTL 60s",ok:true},{item:"Backup Restore",status:"PASSED",detail:"10 Jan",ok:true},{item:"DR LB Config",status:"CONFIGURED",detail:"Ready",ok:true},{item:"Runbook",status:"OUTDATED",detail:"3m old",ok:false}];
  const score=Math.round((checks.filter(c=>c.ok).length/checks.length)*100);
  const runTest=()=>{
    setTesting(true);setLog([]);
    ["[INFO] Initiating DR Simulation...","[OK] ADB lag: 2s","[OK] IPSec tunnel active","[OK] WLS-DR-01 STANDBY","[OK] DNS failover ready","[INFO] RTO: ~15 min | RPO: ~5 min","[SUCCESS] DR Test PASSED — "+score+"%"].forEach((l,i)=>setTimeout(()=>{setLog(p=>[...p,l]);if(i===6)setTesting(false);},i*600));
  };
  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>DR Readiness</h2>
    <p style={{color:C.muted,marginBottom:16,fontSize:12}}>Disaster Recovery · RTO/RPO · Failover</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Card color={score>=90?C.success:C.warning} C={C}>
        <div style={{textAlign:"center",padding:"14px 0"}}>
          <div style={{position:"relative",width:130,height:130,margin:"0 auto 16px"}}>
            <svg viewBox="0 0 36 36" style={{width:130,height:130,transform:"rotate(-90deg)"}}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.dim} strokeWidth="3"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={score>=90?C.success:C.warning} strokeWidth="3" strokeDasharray={score+" "+(100-score)} strokeLinecap="round"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
              <div style={{fontFamily:"monospace",fontSize:28,fontWeight:700,color:score>=90?C.success:C.warning}}>{score}%</div>
              <div style={{fontSize:10,color:C.muted}}>DR Ready</div>
            </div>
          </div>
          <div style={{display:"flex",gap:20,justifyContent:"center",marginBottom:16}}>
            <div style={{textAlign:"center"}}><div style={{fontFamily:"monospace",fontWeight:700,color:C.cyan,fontSize:16}}>~15 min</div><div style={{fontSize:10,color:C.muted}}>RTO</div></div>
            <div style={{textAlign:"center"}}><div style={{fontFamily:"monospace",fontWeight:700,color:C.purple,fontSize:16}}>~5 min</div><div style={{fontSize:10,color:C.muted}}>RPO</div></div>
          </div>
          <Btn color={C.blue} onClick={runTest} disabled={testing} C={C}>{testing?"⟳ Testing...":"▶ Run DR Test"}</Btn>
        </div>
      </Card>
      <Card color={C.blue} C={C}>
        <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>Readiness Checks</div>
        {checks.map((c,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:"1px solid "+C.border}}>
          <span style={{fontSize:14,flexShrink:0}}>{c.ok?"✅":"❌"}</span>
          <div style={{flex:1}}><div style={{fontWeight:600,fontSize:12,color:c.ok?C.text:C.danger}}>{c.item}</div><div style={{fontSize:10,color:C.muted}}>{c.detail}</div></div>
          <Badge text={c.status} color={c.ok?C.success:C.danger}/>
        </div>)}
      </Card>
    </div>
    {log.length>0&&<Card color={C.success} style={{marginTop:14}} C={C}><div style={{fontWeight:700,marginBottom:10,fontSize:13}}>🖥 Test Log</div><Terminal lines={log} height={150} C={C}/></Card>}
  </div>;
}

function PatchesTab({C,user,addToast,record}) {
  const [patches,setPatches]=useState([
    {id:"p1",name:"JDK 17.0.10",server:"ALL WLS",priority:"Critical",status:"PENDING",cve:"CVE-2024-20918",impact:"Security"},
    {id:"p2",name:"WebLogic 14.1.1 PSU",server:"ALL WLS",priority:"High",status:"SCHEDULED",cve:"CVE-2024-21006",impact:"Security+Perf"},
    {id:"p3",name:"Enterprise Linux 8.9",server:"ALL Compute",priority:"Medium",status:"COMPLETED",cve:"N/A",impact:"OS Security"},
    {id:"p4",name:"ADB Maintenance",server:"PROD-ADB-01",priority:"High",status:"PENDING",cve:"N/A",impact:"Database"},
  ]);
  const upd=(id,status)=>{setPatches(p=>p.map(x=>x.id===id?{...x,status}:x));addToast("Patch updated","",C.success,"📦");};
  const pc={Critical:C.danger,High:C.warning,Medium:C.orange,Low:C.success};
  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:16}}>Patch Management</h2>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {patches.map(p=><Card key={p.id} color={pc[p.priority]||C.blue} style={{padding:"13px 16px"}} C={C}>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:13,color:C.text}}>{p.name}</span><Badge text={p.priority} color={pc[p.priority]||C.blue}/><Badge text={p.impact} color={C.cyan}/>{p.cve!=="N/A"&&<Badge text={p.cve} color={C.danger}/>}</div>
            <div style={{fontSize:11,color:C.muted}}>🖥 {p.server}</div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
            <Badge text={p.status} color={scol(p.status,C)}/>
            {p.status==="PENDING"&&<Btn sm color={C.blue} onClick={()=>upd(p.id,"SCHEDULED")} C={C}>📅 Schedule</Btn>}
            {p.status==="SCHEDULED"&&<Btn sm color={C.success} onClick={()=>upd(p.id,"COMPLETED")} C={C}>✅ Done</Btn>}
          </div>
        </div>
      </Card>)}
    </div>
  </div>;
}

function CostTab({C}) {
  const budget=150000,spent=98420,pct=Math.round((spent/budget)*100);
  const bd=[{service:"Compute",spend:42000,pct:43},{service:"Autonomous DB",spend:28000,pct:28},{service:"Object Storage",spend:8500,pct:9},{service:"Kubernetes",spend:7800,pct:8},{service:"Load Balancer",spend:6200,pct:6},{service:"Functions+WAF",spend:5920,pct:4}];
  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:16}}>Cost & Budget</h2>
    <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:14}}>
      <Card color={C.orange} C={C}>
        <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Spend by Service</div>
        {bd.map(b=><div key={b.service} style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:12}}><span style={{color:C.text}}>{b.service}</span><span style={{fontWeight:700,color:C.orange}}>₹{b.spend.toLocaleString()} ({b.pct}%)</span></div>
          <div style={{height:7,background:C.dim,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:b.pct+"%",background:C.red,borderRadius:2}}/></div>
        </div>)}
      </Card>
      <Card color={C.success} C={C}>
        <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Budget Utilization</div>
        <div style={{position:"relative",width:120,height:120,margin:"0 auto 16px"}}>
          <svg viewBox="0 0 36 36" style={{width:120,height:120,transform:"rotate(-90deg)"}}>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.dim} strokeWidth="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none" stroke={pct>80?C.danger:C.success} strokeWidth="3" strokeDasharray={pct+" "+(100-pct)} strokeLinecap="round"/>
          </svg>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
            <div style={{fontFamily:"monospace",fontSize:22,fontWeight:700,color:pct>80?C.danger:C.success}}>{pct}%</div>
            <div style={{fontSize:10,color:C.muted}}>used</div>
          </div>
        </div>
        {[["Budget","₹"+budget.toLocaleString(),C.blue],["Spent","₹"+spent.toLocaleString(),C.success],["Remaining","₹"+(budget-spent).toLocaleString(),C.cyan]].map(([l,v,c])=><div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid "+C.border}}><span style={{fontSize:12,color:C.muted}}>{l}</span><span style={{fontSize:12,fontWeight:700,color:c}}>{v}</span></div>)}
      </Card>
    </div>
  </div>;
}

function VisitorsTab({C,visitorList}) {
  const now=new Date();
  const [filter,setFilter]=useState("TODAY");
  const filtered=visitorList.filter(v=>{
    const vd=new Date(v.timestamp||Date.now());
    if(filter==="TODAY") return vd.toDateString()===now.toDateString();
    if(filter==="WEEK") return (now-vd)<7*86400000;
    return true;
  }).sort((a,b)=>new Date(b.timestamp||0)-new Date(a.timestamp||0));
  const todayCount=visitorList.filter(v=>new Date(v.timestamp||0).toDateString()===now.toDateString()).length;
  const uniqueTimezones=[...new Set(visitorList.map(v=>v.timezone).filter(Boolean))];
  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>👤 Visitor Tracking</h2>
    <p style={{color:C.muted,marginBottom:16,fontSize:12}}>Every site visit to lakhshit.in is logged</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
      {[["Total",visitorList.length,C.blue],["Today",todayCount,C.cyan],["Timezones",uniqueTimezones.length,C.purple],["This Week",visitorList.filter(v=>(now-new Date(v.timestamp||0))<7*86400000).length,C.orange]].map(([l,v,c])=><Card key={l} color={c} style={{padding:"14px 16px"}} C={C}><div style={{fontFamily:"monospace",fontSize:22,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:C.muted,marginTop:6,textTransform:"uppercase"}}>{l}</div></Card>)}
    </div>
    <Card color={C.blue} C={C}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontWeight:700,fontSize:14}}>Visit Log</div>
        <div style={{display:"flex",gap:7}}>{["TODAY","WEEK","ALL"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 12px",borderRadius:3,border:"1px solid "+(filter===f?C.red:C.border),background:filter===f?C.red+"15":"transparent",color:filter===f?C.red:C.muted,fontSize:11,cursor:"pointer",fontWeight:700}}>{f}</button>)}</div>
      </div>
      {filtered.length===0?<div style={{color:C.muted,textAlign:"center",padding:30}}>No visits yet.</div>:<div style={{maxHeight:400,overflowY:"auto"}}>
        {filtered.map((v,i)=><div key={v.id||i} style={{padding:"10px 0",borderBottom:"1px solid "+C.border}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:18}}>🌍</span><div><div style={{fontWeight:600,fontSize:12,color:C.text}}>{v.timezone||"Unknown"}</div><div style={{fontSize:10,color:C.muted}}>{v.platform||"Unknown"}</div></div></div>
            <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",textAlign:"right"}}><div>{v.time}</div><div style={{marginTop:2}}>{v.screenSize||""}</div></div>
          </div>
          <div style={{fontSize:10,color:C.dim,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(v.browser||"").slice(0,80)}</div>
        </div>)}
      </div>}
    </Card>
  </div>;
}

function FeedbackTab({C,feedbackList,user,addToast,record}) {
  const [form,setForm]=useState({name:"",email:"",rating:5,category:"General",message:""});
  const [submitted,setSubmitted]=useState(false);
  const [view,setView]=useState(user.role==="admin"||user.role==="approver"?"LIST":"FORM");
  const submit=()=>{
    if(!form.message.trim()) return;
    push(ref(db,"feedback"),{...form,submittedAt:nowStr(),timestamp:new Date().toISOString(),submittedBy:user.name});
    record("FEEDBACK",{description:user.name+" submitted feedback: "+form.category+" ("+form.rating+"★)"});
    setSubmitted(true);addToast("Feedback submitted!","Thank you",C.success,"💬");
    setTimeout(()=>setSubmitted(false),3000);
    setForm({name:"",email:"",rating:5,category:"General",message:""});
  };
  const avgRating=feedbackList.length>0?(feedbackList.reduce((a,f)=>a+(f.rating||5),0)/feedbackList.length).toFixed(1):"N/A";
  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>💬 Feedback</h2>
    <p style={{color:C.muted,marginBottom:16,fontSize:12}}>Share feedback about the platform</p>
    {(user.role==="admin"||user.role==="approver")&&<div style={{display:"flex",gap:8,marginBottom:16}}>
      {[["FORM","📝 Submit"],["LIST","📋 View All ("+feedbackList.length+")"]].map(([v,l])=><button key={v} onClick={()=>setView(v)} style={{padding:"7px 18px",borderRadius:3,border:"1px solid "+(view===v?C.red:C.border),background:view===v?C.red+"15":"transparent",color:view===v?C.red:C.muted,fontSize:12,cursor:"pointer",fontWeight:700}}>{l}</button>)}
    </div>}
    {view==="LIST"?<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[["Total",feedbackList.length,C.blue],["Avg Rating",avgRating+"★",C.yellow],["This Week",feedbackList.filter(f=>(new Date()-new Date(f.timestamp||0))<7*86400000).length,C.cyan]].map(([l,v,c])=><Card key={l} color={c} style={{padding:"14px 16px"}} C={C}><div style={{fontFamily:"monospace",fontSize:22,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:C.muted,marginTop:6,textTransform:"uppercase"}}>{l}</div></Card>)}
      </div>
      <Card color={C.blue} C={C}>
        {feedbackList.length===0?<div style={{color:C.muted,textAlign:"center",padding:30}}>No feedback yet.</div>:[...feedbackList].reverse().map((f,i)=><div key={f.id||i} style={{padding:"12px 0",borderBottom:"1px solid "+C.border}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div style={{display:"flex",gap:8,alignItems:"center"}}><Badge text={f.category||"General"} color={C.blue}/><span style={{color:C.yellow,fontWeight:700,fontSize:14}}>{"★".repeat(f.rating||5)}</span></div><span style={{fontSize:10,color:C.muted}}>{f.submittedAt}</span></div>
          <div style={{fontSize:13,color:C.text,marginBottom:4,lineHeight:1.5}}>{f.message}</div>
          <div style={{fontSize:11,color:C.muted}}>By {f.name||f.submittedBy||"Anonymous"}{f.email?" · "+f.email:""}</div>
        </div>)}
      </Card>
    </div>:<Card color={C.blue} style={{maxWidth:600}} C={C}>
      <div style={{fontWeight:700,marginBottom:20,fontSize:16}}>Share Your Feedback</div>
      {submitted&&<div style={{background:C.success+"15",border:"1px solid "+C.success+"44",borderRadius:4,padding:"12px 16px",marginBottom:16,color:C.success,fontWeight:700}}>✅ Thank you for your feedback!</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <Inp value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name" C={C}/>
        <Inp value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="Email (optional)" C={C}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <Sel value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} C={C}>{["General","Bug Report","Feature Request","Performance","UI/UX","Praise"].map(c=><option key={c}>{c}</option>)}</Sel>
        <div><div style={{fontSize:11,color:C.muted,marginBottom:6}}>Rating</div><div style={{display:"flex",gap:6}}>{[1,2,3,4,5].map(r=><button key={r} onClick={()=>setForm(f=>({...f,rating:r}))} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",opacity:r<=form.rating?1:.3,transition:"opacity .2s"}}>★</button>)}</div></div>
      </div>
      <Inp value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} placeholder="Your message *" rows={4} style={{marginBottom:16}} C={C}/>
      <Btn color={C.red} onClick={submit} disabled={!form.message.trim()} style={{width:"100%",padding:12,justifyContent:"center"}} C={C}>💬 Submit Feedback</Btn>
    </Card>}
  </div>;
}

function ActivityTab({C,activityList,user}) {
  const [filter,setFilter]=useState("ALL");
  const [search,setSearch]=useState("");
  const [dateFilter,setDateFilter]=useState("TODAY");
  const now=new Date();
  const filtered=activityList.filter(a=>{
    const ad=new Date(a.timestamp||Date.now());
    const mDate=dateFilter==="ALL"?true:dateFilter==="TODAY"?ad.toDateString()===now.toDateString():(now-ad)<7*86400000;
    const mType=filter==="ALL"?true:a.type===filter;
    const mSearch=search===""?true:((a.description||"")+(a.user||"")+(a.label||"")).toLowerCase().includes(search.toLowerCase());
    return mDate&&mType&&mSearch;
  }).sort((a,b)=>new Date(b.timestamp||0)-new Date(a.timestamp||0));
  const exportCSV=()=>{
    const rows=[["Time","User","Role","Action","Description"],...filtered.map(a=>[a.time,a.user,a.role,a.label,(a.description||"").replace(/,/g,";")])];
    const csv=rows.map(r=>r.join(",")).join("\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    const l=document.createElement("a");l.href=url;l.download="activity_"+new Date().toISOString().slice(0,10)+".csv";l.click();
  };
  const todayCount=activityList.filter(a=>new Date(a.timestamp||0).toDateString()===now.toDateString()).length;
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <div><h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>📹 Activity Recording</h2><p style={{color:C.muted,margin:0,fontSize:12}}>Every action recorded · {activityList.length} total events</p></div>
      <button onClick={exportCSV} style={{padding:"8px 16px",background:C.success+"20",border:"1px solid "+C.success+"44",borderRadius:4,color:C.success,fontWeight:700,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>📥 Export CSV</button>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:10,marginBottom:16}}>
      {[["Total",activityList.length,C.blue,"📊"],["Today",todayCount,C.cyan,"📅"],["Ops",activityList.filter(a=>["OP_EXECUTE","OP_SUBMIT"].includes(a.type)).length,C.success,"⚡"],["Deploys",activityList.filter(a=>a.type==="DEPLOY").length,C.red,"🚀"],["Logins",activityList.filter(a=>a.type==="LOGIN").length,C.teal,"🔐"]].map(s=><Card key={s[0]} color={s[2]} style={{padding:"12px 14px"}} C={C}><div style={{fontFamily:"monospace",fontSize:20,fontWeight:700,color:s[2]}}>{s[1]}</div><div style={{fontSize:9,color:C.muted,marginTop:4}}>{s[3]} {s[0].toUpperCase()}</div></Card>)}
    </div>
    <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:4,padding:"12px 14px",marginBottom:14,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search..." style={{padding:"7px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:12,outline:"none",fontFamily:"inherit",minWidth:160}}/>
      <select value={dateFilter} onChange={e=>setDateFilter(e.target.value)} style={{padding:"7px 10px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:12,outline:"none",fontFamily:"inherit"}}>{[["TODAY","Today"],["WEEK","This Week"],["ALL","All Time"]].map(o=><option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>
      <select value={filter} onChange={e=>setFilter(e.target.value)} style={{padding:"7px 10px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:12,outline:"none",fontFamily:"inherit"}}><option value="ALL">All Actions</option>{Object.entries(AT).map(e=><option key={e[0]} value={e[0]}>{e[1].icon} {e[1].label}</option>)}</select>
      <span style={{fontSize:11,color:C.muted,marginLeft:"auto"}}>{filtered.length} records</span>
    </div>
    <div style={{position:"relative"}}>
      <div style={{position:"absolute",left:19,top:0,bottom:0,width:2,background:C.border}}/>
      {filtered.length===0&&<Card color={C.blue} style={{textAlign:"center",padding:40}} C={C}><div style={{color:C.muted}}>No activity recorded yet.</div></Card>}
      {filtered.map(a=><div key={a.id} style={{display:"flex",gap:12,marginBottom:8,position:"relative",zIndex:1}}>
        <div style={{width:38,height:38,borderRadius:"50%",background:C.card,border:"2px solid "+(a.color||C.blue),display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{a.icon||"📌"}</div>
        <div style={{flex:1,background:C.card,border:"1px solid "+C.border,borderRadius:4,padding:"10px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:5}}>
            <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:12,color:a.color||C.blue}}>{a.label}</span><Badge text={a.role} color={C.purple}/><span style={{fontWeight:600,fontSize:12,color:C.text}}>{a.user}</span></div>
            <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{a.time}</span>
          </div>
          {a.description&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{a.description}</div>}
          <div style={{display:"flex",gap:7,marginTop:5,flexWrap:"wrap"}}>{a.operation&&<Badge text={a.operation} color={C.orange}/>}{a.target&&<Badge text={a.target} color={C.blue}/>}</div>
        </div>
      </div>)}
    </div>
  </div>;
}

function AuditTab({C,auditList}) {
  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>Audit Log</h2>
    <p style={{color:C.muted,marginBottom:16,fontSize:12}}>Immutable operations record · {auditList.length} entries</p>
    {auditList.length===0?<Card color={C.blue} style={{textAlign:"center",padding:40}} C={C}><div style={{color:C.muted}}>No records yet.</div></Card>:<div style={{display:"flex",flexDirection:"column",gap:6}}>
      {[...auditList].reverse().map((a,i)=><Card key={a.id} color={a.action?.includes("APPROVED")?C.success:a.action?.includes("REJECTED")?C.danger:a.action?.includes("DEPLOYED")?C.blue:C.red} style={{padding:"10px 14px"}} C={C}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.bg,border:"1px solid "+C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{a.action?.includes("APPROVED")?"✅":a.action?.includes("REJECTED")?"❌":a.action?.includes("DEPLOYED")?"🚀":"⚡"}</div>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,fontFamily:"monospace",color:C.text}}>{a.action}</div><div style={{color:C.muted,fontSize:10,marginTop:2}}>by {a.user} · {a.time}</div></div>
          <div style={{fontFamily:"monospace",fontSize:10,color:C.dim}}>#{auditList.length-i}</div>
        </div>
      </Card>)}
    </div>}
  </div>;
}

// ─── PDC App Monitor Tab ───────────────────────────────────────────────────
function PDCMonitorTab({C,wls,realMode,addToast,proxyStatus}) {
  const [health,setHealth]=useState(null);
  const [metrics,setMetrics]=useState(null);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState(null);
  const [port,setPort]=useState("8001");
  const [history,setHistory]=useState([]);
  const [pollInterval,setPollInterval]=useState(null);
  const [autoRefresh,setAutoRefresh]=useState(false);

  const fetchPDC=async(p)=>{
    const base=realMode?`${PROXY_URL}/pdc-proxy/${p||port}`:`http://localhost:${p||port}`;
    setLoading(true); setErr(null);
    try {
      const [h,m]=await Promise.all([
        fetch(`${base}/pdc/api/health`,{signal:AbortSignal.timeout(4000)}).then(r=>r.json()),
        fetch(`${base}/pdc/api/metrics`,{signal:AbortSignal.timeout(4000)}).then(r=>r.json()),
      ]);
      setHealth(h); setMetrics(m);
      setHistory(prev=>[{time:new Date().toLocaleTimeString("en-IN"),heapPct:h.jvm?.heapPct||0,threads:h.threads?.liveCount||0,status:h.status||"UP"},...prev].slice(0,20));
      setErr(null);
    } catch(e) {
      setErr(e.message.includes("Failed to fetch")||e.message.includes("abort")?"Cannot reach PDC app at port "+port+". Is it deployed and running?":e.message);
    } finally { setLoading(false); }
  };

  useEffect(()=>{ fetchPDC(); },[]);

  useEffect(()=>{
    if(autoRefresh) { const t=setInterval(fetchPDC,5000); setPollInterval(t); return ()=>clearInterval(t); }
    else { if(pollInterval) { clearInterval(pollInterval); setPollInterval(null); } }
  },[autoRefresh,port]);

  const heapPct=health?.jvm?.heapPct||0;
  const threadCount=health?.threads?.liveCount||0;
  const heapColor=heapPct>85?C.danger:heapPct>70?C.warning:C.success;
  const sparkPts=history.slice().reverse().map((h,i)=>`${i*28},${80-(h.heapPct||0)*0.75}`).join(" ");

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>📦 PDC App Monitor</h2>
        <p style={{color:C.muted,margin:0,fontSize:12}}>Live health from deployed PDC application · WebLogic managed server</p>
      </div>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <span style={{fontSize:12,color:C.muted}}>Port:</span>
          <select value={port} onChange={e=>{setPort(e.target.value);fetchPDC(e.target.value);}} style={{padding:"6px 10px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:12,outline:"none",fontFamily:"inherit"}}>
            {["8001","8002","8003","7001"].map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:11,color:C.muted}}>Auto-refresh 5s</span>
          <div onClick={()=>setAutoRefresh(!autoRefresh)} style={{width:36,height:20,borderRadius:10,background:autoRefresh?C.success:C.dim,cursor:"pointer",position:"relative",transition:"background .2s"}}>
            <div style={{position:"absolute",top:2,left:autoRefresh?17:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .25s"}}/>
          </div>
        </div>
        <button onClick={()=>fetchPDC()} style={{padding:"7px 16px",background:C.blue,border:"none",borderRadius:4,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>↻ Refresh</button>
      </div>
    </div>

    {/* Connection Status Banner */}
    <div style={{marginBottom:14,padding:"10px 16px",background:err?C.danger+"12":health?C.success+"12":C.blue+"12",border:"1px solid "+(err?C.danger:health?C.success:C.blue)+"33",borderRadius:4,display:"flex",alignItems:"center",gap:10}}>
      <Pulse color={err?C.danger:health?C.success:C.blue} size={8}/>
      <span style={{fontWeight:700,fontSize:13,color:err?C.danger:health?C.success:C.text}}>{loading?"Checking PDC app...":err?"PDC App Unreachable":health?.status==="UP"?"PDC App is RUNNING on port "+port:"Unknown state"}</span>
      {err&&<span style={{fontSize:11,color:C.muted}}>{err}</span>}
      {!err&&!loading&&<span style={{marginLeft:"auto",fontSize:11,color:C.muted}}>http://localhost:{port}/pdc/</span>}
    </div>

    {err&&<Card color={C.warning} C={C} style={{marginBottom:16}}>
      <div style={{fontWeight:700,marginBottom:10,fontSize:14}}>🔧 How to get PDC App running</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[["1","Build PDC app","cd wls-package/pdc-app && mvn clean package"],["2","Start WLS environment","cd scripts && ./start-wls.sh start-env"],["3","Deploy PDC app","./start-wls.sh deploy-pdc prod"],["4","Verify","curl http://localhost:8001/pdc/health"]].map(([n,label,cmd])=><div key={n} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:C.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{n}</div>
          <div><div style={{fontWeight:700,fontSize:12,color:C.text,marginBottom:3}}>{label}</div><code style={{fontSize:11,background:C.bg,padding:"3px 8px",borderRadius:3,color:C.cyan,border:"1px solid "+C.border,display:"block"}}>{cmd}</code></div>
        </div>)}
      </div>
    </Card>}

    {health&&!err&&<>
      {/* KPI Row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:16}}>
        {[{l:"Status",v:health.status||"UP",c:C.success,i:"✅"},{l:"App Version",v:health.version||"1.0.0",c:C.blue,i:"📌"},{l:"Server",v:health.serverInfo?.split(" ")[0]||"WLS",c:C.red,i:"⚡"},{l:"Env",v:health.env||"PROD",c:C.orange,i:"🏷"}].map(s=><Card key={s.l} color={s.c} style={{padding:"13px 14px"}} C={C}>
          <div style={{fontFamily:"monospace",fontWeight:700,fontSize:16,color:s.c}}>{s.i} {s.v}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:5,textTransform:"uppercase"}}>{s.l}</div>
        </Card>)}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {/* JVM */}
        <Card color={heapColor} C={C}>
          <div style={{fontWeight:700,marginBottom:14,fontSize:14,display:"flex",justifyContent:"space-between"}}>
            <span>💾 JVM Memory</span>
            <span style={{fontFamily:"monospace",fontSize:18,color:heapColor}}>{heapPct}%</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
            {[["Used",health.jvm?.heapUsedMB+"MB",heapColor],["Max",health.jvm?.heapMaxMB+"MB",C.blue],["CPUs",health.jvm?.processors||metrics?.os?.processors||"-",C.purple]].map(([l,v,c])=><div key={l} style={{background:C.bg,border:"1px solid "+C.border,borderRadius:3,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color:c}}>{v}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:3}}>{l}</div>
            </div>)}
          </div>
          <div style={{height:7,background:C.dim,borderRadius:3,overflow:"hidden",marginBottom:6}}>
            <div style={{height:"100%",width:heapPct+"%",background:heapColor,borderRadius:3,transition:"width .6s"}}/>
          </div>
          <div style={{fontSize:10,color:C.muted}}>{heapPct>85?"⚠ High — consider restart or increase -Xmx":heapPct>70?"Monitor — approaching threshold":"Heap healthy"}</div>
        </Card>

        {/* Threads */}
        <Card color={C.cyan} C={C}>
          <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>🧵 Threads</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[["Live Threads",health.threads?.liveCount,C.text],["Peak",health.threads?.peakCount,C.cyan],["Daemon",health.threads?.daemonCount,C.purple],["Deadlocked",health.threads?.deadlocked||0,health.threads?.deadlocked>0?C.danger:C.success]].map(([l,v,c])=><div key={l} style={{background:C.bg,border:"1px solid "+C.border,borderRadius:3,padding:"9px 8px"}}>
              <div style={{fontFamily:"monospace",fontSize:18,fontWeight:700,color:c}}>{v}</div>
              <div style={{fontSize:10,color:C.muted,marginTop:3}}>{l}</div>
            </div>)}
          </div>
          {health.threads?.deadlocked>0&&<div style={{background:C.danger+"15",border:"1px solid "+C.danger+"33",borderRadius:4,padding:"8px 10px",fontSize:11,color:C.danger,fontWeight:700}}>⚠ Deadlocked threads detected — restart server!</div>}
        </Card>
      </div>

      {/* GC Stats from metrics */}
      {metrics?.gc&&metrics.gc.length>0&&<Card color={C.purple} style={{marginBottom:14}} C={C}>
        <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>♻️ Garbage Collection</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10}}>
          {metrics.gc.map((g,i)=><div key={i} style={{background:C.bg,border:"1px solid "+C.border,borderRadius:4,padding:"10px 12px"}}>
            <div style={{fontWeight:700,fontSize:12,color:C.text,marginBottom:6}}>{g.name}</div>
            <div style={{display:"flex",gap:16,fontSize:11}}>
              <span><span style={{color:C.muted}}>Count: </span><span style={{color:C.purple,fontWeight:700}}>{g.count}</span></span>
              <span><span style={{color:C.muted}}>Time: </span><span style={{color:g.timeMs>1000?C.danger:C.success,fontWeight:700}}>{g.timeMs}ms</span></span>
            </div>
          </div>)}
        </div>
      </Card>}

      {/* Heap history sparkline */}
      {history.length>1&&<Card color={C.blue} C={C}>
        <div style={{fontWeight:700,marginBottom:10,fontSize:14,display:"flex",justifyContent:"space-between"}}>
          <span>📈 Heap % History (last {history.length} polls)</span>
          <span style={{fontSize:11,color:C.muted}}>Latest: {history[0]?.heapPct}%</span>
        </div>
        <svg width="100%" height="90" style={{display:"block",overflow:"visible"}}>
          <defs><linearGradient id="hg" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={C.blue} stopOpacity="0.3"/><stop offset="100%" stopColor={C.blue} stopOpacity="0.01"/></linearGradient></defs>
          {history.length>1&&<>
            <polyline points={sparkPts} fill="none" stroke={C.blue} strokeWidth="2" strokeLinejoin="round"/>
            <polygon points={sparkPts+" "+((history.length-1)*28)+",80 0,80"} fill="url(#hg)"/>
            {history.slice().reverse().map((h,i)=><circle key={i} cx={i*28} cy={80-(h.heapPct||0)*0.75} r="3" fill={heapColor}/>)}
          </>}
          {[0,25,50,75,100].map(v=><line key={v} x1="0" y1={80-v*0.75} x2="100%" y2={80-v*0.75} stroke={C.border} strokeWidth="1" strokeDasharray="4"/>)}
          {[0,25,50,75,100].map(v=><text key={v} x="2" y={80-v*0.75-2} fontSize="8" fill={C.muted}>{v}%</text>)}
        </svg>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:8}}>
          {history.slice(0,8).map((h,i)=><div key={i} style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{h.time}: <span style={{color:h.heapPct>85?C.danger:h.heapPct>70?C.warning:C.success,fontWeight:700}}>{h.heapPct}%</span></div>)}
        </div>
      </Card>}

      {/* API Endpoints */}
      <Card color={C.teal} style={{marginTop:14}} C={C}>
        <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>🔌 Live API Endpoints</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:8}}>
          {[{url:`http://localhost:${port}/pdc/`,label:"Dashboard UI",status:"UP"},{url:`http://localhost:${port}/pdc/health`,label:"Health JSON",status:"UP"},{url:`http://localhost:${port}/pdc/api/metrics`,label:"JVM Metrics",status:"UP"},{url:`http://localhost:${port}/pdc/api/status`,label:"Status",status:"UP"}].map(e=><a key={e.url} href={e.url} target="_blank" rel="noreferrer" style={{textDecoration:"none",display:"block",background:C.bg,border:"1px solid "+C.border,borderRadius:4,padding:"10px 12px"}}>
            <div style={{fontWeight:700,fontSize:12,color:C.text,marginBottom:3}}>{e.label}</div>
            <div style={{fontSize:10,color:C.teal,fontFamily:"monospace",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.url}</div>
            <div style={{marginTop:5}}><Badge text={e.status} color={C.success}/></div>
          </a>)}
        </div>
      </Card>
    </>}
  </div>;
}

// ─── Pipeline Tab ──────────────────────────────────────────────────────────
function PipelineTab({C,deployments,wls,user,addToast,record,setDeployments,realMode,loadRealDeployments}) {
  const [pipelines,setPipelines]=useState([
    {id:"pl1",name:"pdc-app",stage:"PRODUCTION",lastBuild:"#47",status:"SUCCESS",branch:"main",commit:"a3f8c12",duration:"2m 34s",triggeredBy:"Auto",time:"10 min ago",steps:[{n:"Build",s:"SUCCESS"},{n:"Unit Tests",s:"SUCCESS"},{n:"Integration",s:"SUCCESS"},{n:"Deploy UAT",s:"SUCCESS"},{n:"Smoke Test",s:"SUCCESS"},{n:"Deploy PROD",s:"SUCCESS"}]},
    {id:"pl2",name:"app-portal",stage:"UAT",lastBuild:"#23",status:"IN_PROGRESS",branch:"release/2.1",commit:"b7d4e91",duration:"1m 20s",triggeredBy:"Rajesh Kumar",time:"2 min ago",steps:[{n:"Build",s:"SUCCESS"},{n:"Unit Tests",s:"SUCCESS"},{n:"Integration",s:"IN_PROGRESS"},{n:"Deploy UAT",s:"PENDING"},{n:"Smoke Test",s:"PENDING"},{n:"Deploy PROD",s:"PENDING"}]},
    {id:"pl3",name:"batch-processor",stage:"FAILED",lastBuild:"#15",status:"FAILED",branch:"fix/timeout",commit:"c1a5f33",duration:"45s",triggeredBy:"Priya Sharma",time:"1 hr ago",steps:[{n:"Build",s:"SUCCESS"},{n:"Unit Tests",s:"FAILED"},{n:"Integration",s:"SKIPPED"},{n:"Deploy UAT",s:"SKIPPED"},{n:"Smoke Test",s:"SKIPPED"},{n:"Deploy PROD",s:"SKIPPED"}]},
  ]);
  const [history]=useState([
    {build:"#47",app:"pdc-app",status:"SUCCESS",env:"PROD",time:"10 min ago",by:"Auto CI",commit:"a3f8c12"},
    {build:"#46",app:"pdc-app",status:"SUCCESS",env:"PROD",time:"3 hr ago",by:"Lakhshit",commit:"9b2d4a1"},
    {build:"#23",app:"app-portal",status:"IN_PROGRESS",env:"UAT",time:"2 min ago",by:"Rajesh Kumar",commit:"b7d4e91"},
    {build:"#22",app:"app-portal",status:"SUCCESS",env:"UAT",time:"2 days ago",by:"Priya Sharma",commit:"f4e8c00"},
    {build:"#15",app:"batch-processor",status:"FAILED",env:"UAT",time:"1 hr ago",by:"Priya Sharma",commit:"c1a5f33"},
    {build:"#14",app:"batch-processor",status:"SUCCESS",env:"PROD",time:"3 days ago",by:"Auto CI",commit:"d9f1b22"},
  ]);

  const sc={SUCCESS:C.success,FAILED:C.danger,IN_PROGRESS:C.blue,PENDING:C.dim,SKIPPED:C.dim};
  const si={SUCCESS:"✅",FAILED:"❌",IN_PROGRESS:"⟳",PENDING:"○",SKIPPED:"—"};

  const triggerRollback=(pl)=>{
    if(!window.confirm("Rollback "+pl.name+" to previous build?")) return;
    addToast("Rollback initiated",pl.name+" rolling back",C.warning,"⏪");
    record("DEPLOY",{description:user.name+" triggered rollback for "+pl.name});
    push(ref(db,"auditLogs"),{action:"ROLLBACK: "+pl.name,user:user.name,time:nowStr()});
  };

  const triggerPipeline=(pl)=>{
    setPipelines(p=>p.map(x=>x.id===pl.id?{...x,status:"IN_PROGRESS",steps:x.steps.map((s,i)=>({...s,s:i===0?"IN_PROGRESS":"PENDING"}))}:x));
    addToast("Pipeline triggered",pl.name+" building",C.blue,"🔄");
    record("DEPLOY",{description:user.name+" triggered pipeline for "+pl.name});
    let step=0;
    const iv=setInterval(()=>{
      step++;
      setPipelines(p=>p.map(x=>x.id===pl.id?{...x,steps:x.steps.map((s,i)=>({...s,s:i<step?"SUCCESS":i===step?"IN_PROGRESS":"PENDING"}))}:x));
      if(step>=pl.steps.length-1) {
        clearInterval(iv);
        setTimeout(()=>setPipelines(p=>p.map(x=>x.id===pl.id?{...x,status:"SUCCESS",time:"just now",steps:x.steps.map(s=>({...s,s:"SUCCESS"}))}:x)),800);
        addToast("Pipeline complete!",pl.name+" deployed",C.success,"✅");
      }
    },1200);
  };

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>🔄 Deployment Pipeline</h2>
        <p style={{color:C.muted,margin:0,fontSize:12}}>CI/CD pipelines · Build status · Version history · Rollback</p>
      </div>
    </div>

    {/* KPIs */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
      {[["Pipelines",pipelines.length,C.blue],["Passing",pipelines.filter(p=>p.status==="SUCCESS").length,C.success],["Failed",pipelines.filter(p=>p.status==="FAILED").length,C.danger],["Running",pipelines.filter(p=>p.status==="IN_PROGRESS").length,C.blue]].map(([l,v,c])=><Card key={l} color={c} style={{padding:"13px 14px"}} C={C}><div style={{fontFamily:"monospace",fontSize:22,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:C.muted,marginTop:4,textTransform:"uppercase"}}>{l}</div></Card>)}
    </div>

    {/* Pipeline Cards */}
    <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
      {pipelines.map(pl=><Card key={pl.id} color={sc[pl.status]||C.muted} style={{padding:"14px 18px"}} C={C}>
        <div style={{display:"flex",gap:14,alignItems:"flex-start",flexWrap:"wrap",marginBottom:12}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:4}}>
              <span style={{fontFamily:"monospace",fontWeight:800,fontSize:16,color:C.text}}>{pl.name}</span>
              <Badge text={pl.status} color={sc[pl.status]||C.muted}/>
              <Badge text={pl.stage} color={pl.stage==="PRODUCTION"?C.red:pl.stage==="UAT"?C.blue:C.orange}/>
            </div>
            <div style={{display:"flex",gap:12,fontSize:11,color:C.muted,flexWrap:"wrap"}}>
              <span>🔖 Build {pl.lastBuild}</span>
              <span>🌿 {pl.branch}</span>
              <span>💬 {pl.commit}</span>
              <span>⏱ {pl.duration}</span>
              <span>👤 {pl.triggeredBy}</span>
              <span>🕐 {pl.time}</span>
            </div>
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button onClick={()=>triggerPipeline(pl)} style={{padding:"6px 14px",background:C.blue,border:"none",borderRadius:4,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>▶ Run</button>
            <button onClick={()=>triggerRollback(pl)} style={{padding:"6px 14px",background:C.warning+"20",border:"1px solid "+C.warning+"44",borderRadius:4,color:C.warning,fontSize:12,fontWeight:700,cursor:"pointer"}}>⏪ Rollback</button>
          </div>
        </div>
        {/* Pipeline steps */}
        <div style={{display:"flex",gap:0,alignItems:"center",overflowX:"auto"}}>
          {pl.steps.map((step,i)=><div key={i} style={{display:"flex",alignItems:"center",flexShrink:0}}>
            <div style={{textAlign:"center",padding:"6px 10px",background:step.s==="IN_PROGRESS"?C.blue+"15":step.s==="SUCCESS"?C.success+"12":step.s==="FAILED"?C.danger+"12":C.bg,border:"1px solid "+(step.s==="IN_PROGRESS"?C.blue:step.s==="SUCCESS"?C.success:step.s==="FAILED"?C.danger:C.border),borderRadius:4,minWidth:90}}>
              <div style={{fontSize:14,marginBottom:3,animation:step.s==="IN_PROGRESS"?"spin 1.2s linear infinite":"none",display:"inline-block"}}>{si[step.s]||"?"}</div>
              <div style={{fontSize:10,fontWeight:600,color:sc[step.s]||C.muted}}>{step.n}</div>
            </div>
            {i<pl.steps.length-1&&<div style={{width:20,height:2,background:step.s==="SUCCESS"?C.success:C.border,flexShrink:0}}/>}
          </div>)}
        </div>
      </Card>)}
    </div>

    {/* Build History */}
    <Card color={C.blue} C={C}>
      <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>📜 Build History</div>
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{borderBottom:"2px solid "+C.red}}>{["Build","Application","Status","Environment","Triggered By","Commit","Time"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:0.7,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
          <tbody>{history.map((h,i)=><tr key={i} style={{borderBottom:"1px solid "+C.border}}>
            <td style={{padding:"9px 12px",fontFamily:"monospace",fontWeight:700,color:C.text,fontSize:12}}>{h.build}</td>
            <td style={{padding:"9px 12px",fontWeight:600,fontSize:12,color:C.text}}>{h.app}</td>
            <td style={{padding:"9px 12px"}}><Badge text={h.status} color={sc[h.status]||C.muted}/></td>
            <td style={{padding:"9px 12px"}}><Badge text={h.env} color={h.env==="PROD"?C.red:C.blue}/></td>
            <td style={{padding:"9px 12px",fontSize:12,color:C.muted}}>{h.by}</td>
            <td style={{padding:"9px 12px",fontFamily:"monospace",fontSize:11,color:C.cyan}}>{h.commit}</td>
            <td style={{padding:"9px 12px",fontSize:11,color:C.muted}}>{h.time}</td>
          </tr>)}
          </tbody>
        </table>
      </div>
    </Card>
  </div>;
}

// ─── WLS Setup Tab ─────────────────────────────────────────────────────────
function WLSSetupTab({C,realMode,proxyStatus,addToast,record,user}) {
  const [proxyUrl,setProxyUrl]=useState(typeof process!=="undefined"&&process.env?.REACT_APP_WLS_PROXY_URL||"http://localhost:3001");
  const [testing,setTesting]=useState(false);
  const [testResult,setTestResult]=useState(null);
  const [wlsHost,setWlsHost]=useState("localhost");
  const [wlsPort,setWlsPort]=useState("7001");
  const [wlsUser,setWlsUser]=useState("weblogic");
  const [wlsPass,setWlsPass]=useState("WLS@Admin2025!");
  const [step,setStep]=useState(0);

  const testConnection=async()=>{
    setTesting(true); setTestResult(null);
    try {
      const r=await fetch(proxyUrl+"/health",{signal:AbortSignal.timeout(5000)});
      const d=await r.json();
      setTestResult({ok:true,msg:"Proxy connected! WLS: "+d.wls,data:d});
      addToast("Proxy connected!",d.wls,C.success,"✅");
      record("SETTINGS",{description:user.name+" tested proxy connection"});
    } catch(e) {
      setTestResult({ok:false,msg:e.message.includes("abort")?"Timeout — proxy not reachable at "+proxyUrl:e.message});
      addToast("Connection failed",e.message.slice(0,60),C.danger,"❌");
    }
    setTesting(false);
  };

  const steps=[
    {icon:"🐋",title:"Start Docker WLS Environment",cmd:"cd wls-package/scripts\n./start-wls.sh start-env",desc:"Pulls WLS 14.1.1 image and starts 3 managed servers + proxy. Requires Docker Desktop."},
    {icon:"🔌",title:"Start Proxy Server (standalone)",cmd:"cd wls-package/proxy\nnpm install\nWLS_ADMIN_URL=http://localhost:7001 \\\nWLS_USERNAME=weblogic \\\nWLS_PASSWORD=WLS@Admin2025! \\\nALLOWED_ORIGINS=https://lakhshit.in \\\nnode server.js",desc:"If WLS is already running elsewhere (OCI VM), just run the proxy to bridge lakhshit.in → WLS REST API."},
    {icon:"🌐",title:"Set Proxy URL in Vercel",cmd:"REACT_APP_WLS_PROXY_URL=http://YOUR_SERVER_IP:3001",desc:"In Vercel dashboard → Settings → Environment Variables. If using Docker locally, use your machine's IP or ngrok tunnel."},
    {icon:"📦",title:"Build and Deploy PDC App",cmd:"cd wls-package/pdc-app\nmvn clean package\n\n# Then deploy\ncd ../scripts\n./start-wls.sh deploy-pdc prod",desc:"Builds the Java EE PDC WAR and deploys it to WLS-PROD-01 and WLS-PROD-02. Accessible at http://localhost:8001/pdc/"},
    {icon:"✅",title:"Verify Integration",cmd:"# Test proxy\ncurl http://localhost:3001/health\n\n# Test WLS API\ncurl http://localhost:3001/api/servers\n\n# Test PDC app\ncurl http://localhost:8001/pdc/health",desc:"If all three return JSON responses, your lakhshit.in platform is fully connected to real WebLogic."},
  ];

  return <div>
    <div style={{marginBottom:20}}>
      <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>⚙ WLS Integration Setup</h2>
      <p style={{color:C.muted,margin:0,fontSize:12}}>Connect lakhshit.in to a live WebLogic environment</p>
    </div>

    {/* Current Status */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
      {[{l:"Proxy Status",v:proxyStatus==="connected"?"CONNECTED":"DISCONNECTED",c:proxyStatus==="connected"?C.success:C.danger,i:proxyStatus==="connected"?"🟢":"🔴"},{l:"Mode",v:realMode?"REAL WLS":"SIMULATED",c:realMode?C.success:C.warning,i:realMode?"⚡":"🎭"},{l:"Platform",v:"lakhshit.in",c:C.blue,i:"🌐"}].map(s=><Card key={s.l} color={s.c} style={{padding:"14px 16px"}} C={C}>
        <div style={{fontFamily:"monospace",fontWeight:700,fontSize:16,color:s.c}}>{s.i} {s.v}</div>
        <div style={{fontSize:11,color:C.muted,marginTop:5,textTransform:"uppercase"}}>{s.l}</div>
      </Card>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
      {/* Connection Test */}
      <Card color={C.blue} C={C}>
        <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>🔗 Test Connection</div>
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Proxy URL</div>
          <input value={proxyUrl} onChange={e=>setProxyUrl(e.target.value)} style={{width:"100%",padding:"9px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:13,outline:"none",fontFamily:"monospace",boxSizing:"border-box"}}/>
        </div>
        <button onClick={testConnection} disabled={testing} style={{width:"100%",padding:"10px",background:C.blue,border:"none",borderRadius:4,color:"#fff",fontWeight:700,fontSize:13,cursor:testing?"not-allowed":"pointer",opacity:testing?.6:1,fontFamily:"inherit"}}>
          {testing?"⟳ Testing...":"🔌 Test Connection"}
        </button>
        {testResult&&<div style={{marginTop:12,padding:"10px 12px",background:(testResult.ok?C.success:C.danger)+"15",border:"1px solid "+(testResult.ok?C.success:C.danger)+"33",borderRadius:4,fontSize:12,color:testResult.ok?C.success:C.danger,fontWeight:600}}>
          {testResult.ok?"✅":"❌"} {testResult.msg}
          {testResult.ok&&testResult.data&&<div style={{marginTop:6,fontSize:11,color:C.muted,fontFamily:"monospace"}}>Time: {testResult.data.time}</div>}
        </div>}
        <div style={{marginTop:14,padding:"10px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:6}}>Once connected, the platform will:</div>
          {["Pull live server states every 5s","Execute real start/stop/restart on WLS","Deploy actual WAR files to managed servers","Show real JVM heap and thread metrics"].map((t,i)=><div key={i} style={{fontSize:11,color:C.text,padding:"3px 0",display:"flex",gap:6}}><span style={{color:C.success}}>✓</span>{t}</div>)}
        </div>
      </Card>

      {/* WLS Config */}
      <Card color={C.orange} C={C}>
        <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>🔑 WLS Admin Credentials</div>
        {[["Admin Host",wlsHost,setWlsHost,"text","localhost"],["Admin Port",wlsPort,setWlsPort,"text","7001"],["Username",wlsUser,setWlsUser,"text","weblogic"],["Password",wlsPass,setWlsPass,"password","•••••"]].map(([l,v,set,t,ph])=><div key={l} style={{marginBottom:10}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:5,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
          <input type={t} value={v} onChange={e=>set(e.target.value)} placeholder={ph} style={{width:"100%",padding:"8px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
        </div>)}
        <div style={{marginTop:6,padding:"8px 12px",background:C.orange+"12",border:"1px solid "+C.orange+"33",borderRadius:4,fontSize:11,color:C.orange}}>
          ⚠ These are used by the proxy server. Set them in the proxy's environment variables, not here.
        </div>
      </Card>
    </div>

    {/* Step-by-step guide */}
    <Card color={C.purple} C={C}>
      <div style={{fontWeight:700,marginBottom:16,fontSize:14}}>📋 Setup Guide ({step+1}/{steps.length})</div>
      <div style={{display:"flex",gap:0,marginBottom:20,overflowX:"auto"}}>
        {steps.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",flexShrink:0}}>
          <button onClick={()=>setStep(i)} style={{padding:"7px 12px",background:i===step?C.red:i<step?C.success+"20":"transparent",border:"1px solid "+(i===step?C.red:i<step?C.success:C.border),borderRadius:4,cursor:"pointer",fontSize:11,fontWeight:700,color:i===step?"#fff":i<step?C.success:C.muted,whiteSpace:"nowrap"}}>{i<step?"✓ ":""}{s.title.split(" ").slice(0,3).join(" ")}</button>
          {i<steps.length-1&&<div style={{width:16,height:2,background:i<step?C.success:C.border,flexShrink:0}}/>}
        </div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:28}}>{steps[step].icon}</span>
            <div><div style={{fontWeight:800,fontSize:16,color:C.text}}>{steps[step].title}</div></div>
          </div>
          <p style={{color:C.muted,fontSize:13,lineHeight:1.6,marginBottom:14}}>{steps[step].desc}</p>
          <div style={{display:"flex",gap:8}}>
            {step>0&&<button onClick={()=>setStep(s=>s-1)} style={{padding:"7px 16px",background:"transparent",border:"1px solid "+C.border,borderRadius:4,color:C.muted,fontSize:12,cursor:"pointer",fontWeight:600}}>← Back</button>}
            {step<steps.length-1&&<button onClick={()=>setStep(s=>s+1)} style={{padding:"7px 16px",background:C.purple,border:"none",borderRadius:4,color:"#fff",fontSize:12,cursor:"pointer",fontWeight:700}}>Next →</button>}
            {step===steps.length-1&&<button onClick={testConnection} style={{padding:"7px 16px",background:C.success,border:"none",borderRadius:4,color:"#fff",fontSize:12,cursor:"pointer",fontWeight:700}}>✅ Test Connection</button>}
          </div>
        </div>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Command</div>
          <pre style={{background:"#000",borderRadius:4,padding:14,fontSize:11,color:"#4ade80",lineHeight:1.7,border:"1px solid "+C.success+"33",overflowX:"auto",margin:0,fontFamily:"'JetBrains Mono',monospace"}}>{steps[step].cmd}</pre>
          <button onClick={()=>{navigator.clipboard?.writeText(steps[step].cmd);addToast("Copied!","Command copied to clipboard",C.success,"📋");}} style={{marginTop:8,padding:"5px 12px",background:"transparent",border:"1px solid "+C.border,borderRadius:3,color:C.muted,fontSize:11,cursor:"pointer",fontWeight:600}}>📋 Copy</button>
        </div>
      </div>
    </Card>

    {/* Quick reference */}
    <Card color={C.teal} style={{marginTop:14}} C={C}>
      <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>🔑 Quick Reference</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:8}}>
        {[{l:"WLS Admin Console",v:"http://localhost:7001/console",c:C.red},{l:"WLS-PROD-01",v:"http://localhost:8001",c:C.blue},{l:"WLS-PROD-02",v:"http://localhost:8002",c:C.blue},{l:"WLS-UAT-01",v:"http://localhost:8003",c:C.purple},{l:"Proxy API",v:"http://localhost:3001",c:C.teal},{l:"PDC App",v:"http://localhost:8001/pdc/",c:C.success}].map(item=><div key={item.l} style={{background:C.bg,border:"1px solid "+C.border,borderRadius:4,padding:"10px 12px"}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:3}}>{item.l}</div>
          <a href={item.v} target="_blank" rel="noreferrer" style={{fontFamily:"monospace",fontSize:11,color:item.c,textDecoration:"none",fontWeight:700}}>{item.v} ↗</a>
        </div>)}
      </div>
      <div style={{marginTop:12,padding:"10px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,fontSize:11,color:C.muted}}>
        Credentials: <strong style={{color:C.text}}>weblogic</strong> / <strong style={{color:C.text}}>WLS@Admin2025!</strong> · Domain: <strong style={{color:C.text}}>WLS_Domain</strong>
      </div>
    </Card>
  </div>;
}


function ChatbotPanel({onClose,C,wls,deployments,incidentList,record,user,realMode}) {
  const INIT_MSG = {role:"assistant",content:"👋 Hi "+user.name+"! I'm your **Cloud Infra AI Assistant**.\n\n"+(realMode?"🟢 Connected to live WebLogic — I can analyse your real infrastructure data!":"📊 I can see your infrastructure data and provide intelligent analysis.\n\nAsk me anything about your servers, deployments, incidents, or get recommendations!")};
  const [messages,setMessages]=useState([INIT_MSG]);
  const [input,setInput]=useState("");
  const [typing,setTyping]=useState(false);
  const [error,setError]=useState(null);
  const msgRef=useRef(null);
  useEffect(()=>{ if(msgRef.current) msgRef.current.scrollTop=msgRef.current.scrollHeight; },[messages]);

  const buildContext=()=>{
    const critical=wls.filter(s=>s.status==="CRITICAL");
    const warning=wls.filter(s=>s.status==="WARNING");
    const running=wls.filter(s=>s.status==="RUNNING");
    const stopped=wls.filter(s=>s.status==="STOPPED");
    const openInc=incidentList.filter(i=>["OPEN","ACKNOWLEDGED"].includes(i.status));
    const activeDeploys=deployments.filter(d=>d.state==="ACTIVE");
    const avgCpu=Math.round(wls.reduce((a,s)=>a+(s.cpu||0),0)/Math.max(wls.length,1));
    const avgJvm=Math.round(wls.reduce((a,s)=>a+(s.jvmHeap||0),0)/Math.max(wls.length,1));

    return `You are an expert WebLogic, Kubernetes, Docker, and multi-cloud infrastructure assistant embedded in Cloud Infrastructure Platform.
You have access to LIVE infrastructure data. Analyse it intelligently and give actionable, specific advice.
Be concise, use emojis for clarity, and always recommend specific actions.
Never mention Claude, Anthropic, or any AI company or model name in your responses. You are the Cloud Infra AI Assistant.

=== LIVE INFRASTRUCTURE DATA (${new Date().toLocaleTimeString()}) ===

WEBLOGIC SERVERS (${wls.length} total):
${wls.map(s=>`- ${s.name} [${s.env||"Production"}]: ${s.status} | CPU:${s.cpu||0}% | JVM Heap:${s.jvmHeap||0}% | Memory:${s.mem||0}% | Threads:${s.threads||0}/${s.maxThreads||200} | GC Time:${s.gcTime||0}ms | Uptime:${s.uptimeSecs?Math.floor(s.uptimeSecs/86400)+"d":"-"} | Version:${s.version||"14.1.1"}`).join("\n")}

SUMMARY: ${running.length} RUNNING | ${critical.length} CRITICAL | ${warning.length} WARNING | ${stopped.length} STOPPED
Average CPU: ${avgCpu}% | Average JVM: ${avgJvm}%
${critical.length>0?"⚠ CRITICAL SERVERS NEED IMMEDIATE ATTENTION: "+critical.map(s=>s.name).join(", "):""}

DEPLOYMENTS (${deployments.length} total, ${activeDeploys.length} active):
${deployments.map(d=>`- ${d.name} [${d.type||"WAR"}]: ${d.state||"ACTIVE"} on ${(d.targets||[]).join(",")||"AdminServer"} v${d.version||"1.0"}`).join("\n")||"- pdc-app [WAR]: ACTIVE on AdminServer"}

OPEN INCIDENTS (${openInc.length}):
${openInc.length>0?openInc.map(i=>`- [${i.priority}] ${i.title||"Untitled"}: ${i.status} — ${i.affectedSystem||"Unknown"} — SLA: ${i.slaBreachAt||"N/A"}`).join("\n"):"No open incidents ✅"}

CONNECTION: ${realMode?"LIVE WebLogic REST API connected":"Simulation mode with representative data"}
PLATFORM: Cloud Infrastructure Platform | WebLogic 14.1.1 | Domain: WLS_Domain
USER: ${user.name} (${user.role})

=== END OF LIVE DATA ===

Respond in a helpful, expert tone. Keep responses under 200 words unless generating a report.
Use line breaks for readability. Always end with a specific actionable recommendation if relevant.
Never reveal you are an AI model from any company. You are the Cloud Infra AI Assistant built into this platform.`;
  };

  const send=async()=>{
    if(!input.trim()||typing) return;
    const q=input.trim();
    const newMessages=[...messages,{role:"user",content:q}];
    setMessages(newMessages);
    setInput(""); setTyping(true); setError(null);
    record("CHATBOT",{description:user.name+" asked AI assistant: "+q.slice(0,80)});

    try {
      const systemPrompt=buildContext();
      const history=newMessages.slice(-10).map(m=>({role:m.role,content:m.content}));
      const response=await fetch(PROXY_URL+"/api/ai/chat",{
        method:"POST",
        headers:{"Content-Type":"application/json","ngrok-skip-browser-warning":"true"},
      });
      if(!response.ok) {
        const err=await response.json().catch(()=>({}));
        throw new Error(err.error?.message||"Service error "+response.status);
      }
      const data=await response.json();
      const reply=data.content?.[0]?.text||"Sorry, I couldn't generate a response.";
      setMessages(p=>[...p,{role:"assistant",content:reply}]);
    } catch(e) {
      setError(e.message);
      setMessages(p=>[...p,{role:"assistant",content:"⚠ AI service unavailable: "+e.message}]);
    } finally {
      setTyping(false);
    }
  };

  const QUICK=[
    "Full health assessment now",
    "Which servers need attention?",
    "Analyse JVM heap",
    "Generate incident report",
    "Is it safe to deploy?",
    "Root cause of current issues",
  ];

  return <div style={{position:"fixed",bottom:90,right:24,zIndex:999,width:420,height:580,background:C.card,border:"1px solid "+C.red+"66",borderRadius:8,boxShadow:"0 12px 40px rgba(0,0,0,.5)",display:"flex",flexDirection:"column",overflow:"hidden"}}>
    <div style={{background:"linear-gradient(135deg, "+C.red+" 0%, #8B1A10 100%)",padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(255,255,255,.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🤖</div>
        <div>
          <div style={{fontWeight:800,fontSize:14,color:"#fff"}}>Cloud Infra AI Assistant</div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.7)",display:"flex",alignItems:"center",gap:4}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:realMode?"#4ade80":"#fbbf24",display:"inline-block"}}/>
            {realMode?"Analysing live infrastructure":"Analysing infrastructure data"}
          </div>
        </div>
      </div>
      <button onClick={onClose} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.2)",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#fff",fontSize:14}}>✕</button>
    </div>
    <div ref={msgRef} style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
      {messages.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",gap:8,alignItems:"flex-start"}}>
        {m.role==="assistant"&&<div style={{width:24,height:24,borderRadius:"50%",background:C.red+"20",border:"1px solid "+C.red+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,marginTop:2}}>🤖</div>}
        <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"4px 16px 16px 16px",background:m.role==="user"?"linear-gradient(135deg, "+C.red+", #8B1A10)":C.card2,color:m.role==="user"?"#fff":C.text,fontSize:12,lineHeight:1.7,border:m.role==="user"?"none":"1px solid "+C.border,whiteSpace:"pre-wrap"}}>{m.content}</div>
      </div>)}
      {typing&&<div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:24,height:24,borderRadius:"50%",background:C.red+"20",border:"1px solid "+C.red+"44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>🤖</div>
        <div style={{padding:"10px 14px",borderRadius:"4px 16px 16px 16px",background:C.card2,border:"1px solid "+C.border,display:"flex",gap:5,alignItems:"center"}}>
          <span style={{fontSize:11,color:C.muted}}>AI is analysing your infrastructure</span>
          {[0,.3,.6].map(d=><span key={d} style={{display:"inline-block",width:5,height:5,borderRadius:"50%",background:C.red,animation:"blink .8s ease "+d+"s infinite"}}/>)}
        </div>
      </div>}
    </div>
    <div style={{padding:"8px 12px",borderTop:"1px solid "+C.border,flexShrink:0}}>
      <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
        {QUICK.map(q=><button key={q} onClick={()=>setInput(q)} style={{padding:"3px 8px",background:C.red+"12",border:"1px solid "+C.red+"30",borderRadius:3,color:C.red,fontSize:10,cursor:"pointer",fontWeight:600}}>{q}</button>)}
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask about your infrastructure..." style={{flex:1,padding:"9px 12px",background:C.bg,border:"1px solid "+(error?C.danger:C.border),borderRadius:6,color:C.text,fontSize:12,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={send} disabled={typing||!input.trim()} style={{padding:"9px 16px",background:C.red,border:"none",borderRadius:6,color:"#fff",cursor:typing||!input.trim()?"not-allowed":"pointer",fontWeight:700,fontSize:13,opacity:typing||!input.trim()?.5:1}}>{typing?"⟳":"→"}</button>
      </div>
      <div style={{textAlign:"center",fontSize:9,color:C.dim,marginTop:6}}>Cloud Infra AI Assistant · Intelligent Infrastructure Analysis</div>
    </div>
  </div>;
}

