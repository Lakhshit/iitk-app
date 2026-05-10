import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, update } from "firebase/database";
import AgentPanel from './AgentPanel';

//  Firebase 
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
const db  = getDatabase(app);

//  Proxy / Agent URLs (set in Vercel env vars) 
const PROXY_URL = "http://localhost:3001";
const AGENT_URL = "http://localhost:3001";

//  Roles & passwords 
const PASSWORDS = { admin:"WLS@ADMIN", operator:"WLS@OPS", approver:"WLS@APPR", manager:"WLS@MGR" };

//  Theme 
const DARK = {
  bg:"#0a0a0a", card:"#111111", card2:"#161616", border:"#2a2a2a",
  red:"#C74634", red2:"#8B1A10", blue:"#1a6fde", cyan:"#00a8e8",
  green:"#1a8a1a", orange:"#d95f00", purple:"#6941C6", teal:"#0d7377",
  yellow:"#b45309", text:"#f0f0f0", muted:"#666666", dim:"#333333",
  danger:"#C74634", warning:"#d95f00", success:"#1a8a1a", info:"#1a6fde",
  shadow:"rgba(0,0,0,0.6)", headerBg:"#1a1a1a", accent:"#C74634",
};
const LIGHT = {
  bg:"#f5f5f5", card:"#ffffff", card2:"#fafafa", border:"#e0e0e0",
  red:"#C74634", red2:"#8B1A10", blue:"#1a6fde", cyan:"#0077b6",
  green:"#1a6b1a", orange:"#c05000", purple:"#5b21b6", teal:"#0a6367",
  yellow:"#92400e", text:"#1a1a1a", muted:"#666666", dim:"#dddddd",
  danger:"#C74634", warning:"#c05000", success:"#1a6b1a", info:"#1a6fde",
  shadow:"rgba(0,0,0,0.15)", headerBg:"#C74634", accent:"#C74634",
};

//  Helpers 
const nowStr  = () => new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"});
const fmtUp   = (s) => { const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60); return d+"d "+h+"h "+m+"m"; };
const scol    = (s,C) => ({RUNNING:C.green,AVAILABLE:C.green,ACTIVE:C.green,SUCCESS:C.green,HEALTHY:C.green,WARNING:C.warning,CRITICAL:C.danger,STOPPED:C.muted,STANDBY:C.cyan,STARTING:C.blue,STOPPING:C.orange,RESTARTING:C.purple,FAILED:C.danger,PREPARED:C.warning,SHUTDOWN:C.muted,ADMIN:C.purple,UNKNOWN:C.muted}[s]||C.muted);

//  WLS REST API Layer 
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
    } catch { return false; }
  }
};

//  Activity Types 
const AT = {
  LOGIN:     { icon:"", color:"#1a6fde", label:"Login" },
  LOGOUT:    { icon:"", color:"#666666", label:"Logout" },
  TAB_VISIT: { icon:"", color:"#00a8e8", label:"Page View" },
  OP_SUBMIT: { icon:"", color:"#6941C6", label:"Op Submitted" },
  OP_EXECUTE:{ icon:"", color:"#1a8a1a", label:"Op Executed" },
  OP_CANCEL: { icon:"", color:"#C74634", label:"Op Cancelled" },
  OP_APPROVE:{ icon:"", color:"#1a8a1a", label:"Approved" },
  OP_REJECT: { icon:"", color:"#C74634", label:"Rejected" },
  DEPLOY:    { icon:"", color:"#1a6fde", label:"Deployment" },
  UNDEPLOY:  { icon:"", color:"#d95f00", label:"Undeployment" },
  INCIDENT:  { icon:"", color:"#d95f00", label:"Incident" },
  FEEDBACK:  { icon:"", color:"#6941C6", label:"Feedback" },
  ALERT:     { icon:"", color:"#d95f00", label:"Alert" },
};

function useDB(path) {
  const [data,setData] = useState(null);
  useEffect(() => { const r=ref(db,path); const u=onValue(r,s=>setData(s.val())); return ()=>u(); },[path]);
  return data;
}

function useActivityRecorder(user) {
  const sessionId = useRef("S_"+Date.now());
  const record = useCallback((type,details) => {
    if(!user) return;
    push(ref(db,"activityLog"),Object.assign({ type,icon:AT[type]?.icon||"",label:AT[type]?.label||type,color:AT[type]?.color||"#666",user:user.name,role:user.role,sessionId:sessionId.current,timestamp:new Date().toISOString(),time:nowStr() },details||{}));
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

//  UI Atoms 
const Pulse = ({color,size=10}) => <span style={{position:"relative",display:"inline-block",width:size,height:size,flexShrink:0}}><span style={{position:"absolute",inset:0,borderRadius:"50%",background:color,opacity:.4,animation:"pr 1.5s ease-out infinite"}}/><span style={{position:"absolute",inset:0,borderRadius:"50%",background:color}}/></span>;
const Badge = ({text,color,dot}) => <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 9px",borderRadius:4,fontSize:11,fontWeight:700,background:color+"18",color,border:"1px solid "+color+"40",whiteSpace:"nowrap"}}>{dot&&<span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>}{text}</span>;
const Chip  = ({label,color}) => <span style={{padding:"3px 8px",background:color+"18",border:"1px solid "+color+"33",borderRadius:3,fontSize:10,fontWeight:700,color}}>{label}</span>;

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

//  Toast 
function ToastContainer({toasts,dismiss}) {
  return <div style={{position:"fixed",top:70,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:360,pointerEvents:"none"}}>
    {toasts.map(t=><div key={t.id} style={{pointerEvents:"all",background:"#111",border:"1px solid "+t.color+"55",borderLeft:"4px solid "+t.color,borderRadius:4,padding:"12px 16px",boxShadow:"0 2px 12px rgba(0,0,0,.4)",display:"flex",gap:12,alignItems:"flex-start",animation:"slideIn .2s ease"}}>
      <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
      <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,color:t.color}}>{t.title}</div>{t.message&&<div style={{fontSize:11,color:"#666",marginTop:3}}>{t.message}</div>}</div>
      <button onClick={()=>dismiss(t.id)} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:14,pointerEvents:"all"}}></button>
    </div>)}
  </div>;
}

//  Approval Modal 
function ApprovalModal({op,target,user,onConfirm,onCancel,C,record}) {
  const [reason,setReason]=useState("");
  const [ticket,setTicket]=useState("");
  const [priority,setPriority]=useState("Normal");
  return <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center"}}>
    <Card color={C.warning} style={{width:"100%",maxWidth:480,padding:28}} C={C}>
      <div style={{marginBottom:20}}>
        <div style={{fontWeight:800,fontSize:18,color:C.text,marginBottom:6}}>Submit for Approval</div>
        <div style={{fontSize:13,color:C.muted}}><strong style={{color:C.warning,fontFamily:"monospace"}}>{op}</strong> on <strong style={{color:C.text}}>{target}</strong></div>
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
        <Btn color={C.blue} onClick={()=>reason.trim()&&onConfirm({reason,ticket,priority})} disabled={!reason.trim()} style={{flex:2,padding:11}} C={C}>Submit for Approval</Btn>
      </div>
    </Card>
  </div>;
}

//  Login 
function Login({onLogin,isDark,toggleTheme}) {
  const C=isDark?DARK:LIGHT;
  const [role,setRole]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [time,setTime]=useState(new Date());
  useEffect(()=>{ const t=setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t); },[]);
  const login=()=>{
    if(!role) return setErr("Select a role.");
    if(role==="viewer") return onLogin({name:"Viewer",role:"viewer",initials:"VW"});
    if(pass!==PASSWORDS[role]) return setErr("Incorrect password.");
    const names={admin:"System Admin",operator:"OPS Engineer",approver:"Change Approver",manager:"Manager"};
    onLogin({name:names[role],role,initials:role.slice(0,2).toUpperCase()});
  };
  return <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:"'DM Sans',sans-serif"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=JetBrains+Mono:wght@400;700&display=swap');*{box-sizing:border-box}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pr{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.5);opacity:0}}@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    <div style={{background:C.red,padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{fontWeight:800,fontSize:22,color:"#fff",letterSpacing:-0.5}}>CLOUD</div>
        <div style={{width:1,height:24,background:"rgba(255,255,255,.3)"}}/>
        <div style={{color:"rgba(255,255,255,.9)",fontSize:14,fontWeight:600}}>Cloud Infrastructure Platform</div>
      </div>
      <button onClick={toggleTheme} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)",borderRadius:4,padding:"4px 12px",cursor:"pointer",color:"#fff",fontSize:12,fontWeight:600}}>{isDark?" Light":" Dark"}</button>
    </div>
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:40}}>
      <div style={{width:"100%",maxWidth:480}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{fontSize:13,color:C.red,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Cloud Infrastructure Management</div>
          <h1 style={{fontSize:32,fontWeight:800,color:C.text,margin:"0 0 8px",lineHeight:1.2}}>Infrastructure Control Platform</h1>
          <p style={{color:C.muted,fontSize:14,lineHeight:1.7,margin:0}}>AI-powered WebLogic operations from a single URL.</p>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:C.red,marginTop:16}}>{time.toLocaleTimeString()}</div>
          <div style={{fontSize:12,color:C.muted}}>{time.toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})} · IST</div>
        </div>
        <Card color={C.red} style={{padding:32}} C={C}>
          <div style={{marginBottom:24}}>
            <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 6px"}}>Secure Sign In</h2>
            <p style={{color:C.muted,margin:0,fontSize:13}}>Select your role and enter credentials</p>
          </div>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:1}}>Select Role</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[["admin","","System Admin","Full control"],["operator","","OPS Engineer","Operations"],["manager","","Manager","Approve ops"],["approver","","Change Approver","Approvals"],["viewer","","Viewer","Read only"]].map(([r,icon,label,sub])=><button key={r} onClick={()=>{setRole(r);setErr("");setPass("");}} style={{padding:"12px 8px",background:role===r?C.red+"15":C.card2,border:"2px solid "+(role===r?C.red:C.border),borderRadius:4,cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                <div style={{fontWeight:700,fontSize:12,color:role===r?C.red:C.text}}>{label}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:2}}>{sub}</div>
              </button>)}
            </div>
          </div>
          {role&&role!=="viewer"&&<div style={{marginBottom:16}}><Inp value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} placeholder="Enter password" type="password" C={C}/></div>}
          {err&&<div style={{color:C.danger,fontSize:12,marginBottom:12,padding:"8px 12px",background:C.danger+"15",borderRadius:4,border:"1px solid "+C.danger+"33"}}> {err}</div>}
          <Btn color={C.red} onClick={login} style={{width:"100%",padding:12,fontSize:14,justifyContent:"center"}} C={C}> Sign In</Btn>
        </Card>
        <div style={{marginTop:12,padding:"10px 16px",background:C.card,border:"1px solid "+C.border,borderRadius:4,fontSize:11,color:C.muted,textAlign:"center"}}> All access is logged, audited and recorded in real-time. Powered by Oracle WebLogic AI Platform.</div>
      </div>
    </div>
    <div style={{background:C.card,borderTop:"1px solid "+C.border,padding:"12px 32px",display:"flex",justifyContent:"space-between",fontSize:11,color:C.muted}}>
      <span>© 2026 Cloud Infrastructure Platform</span>
      <span>Enterprise Edition</span>
    </div>
  </div>;
}

// 
// MAIN APP
// 
export default function App() {
  const [user,setUser]=useState(null);
  const [isDark,setIsDark]=useState(true);
  if(!user) return <Login onLogin={setUser} isDark={isDark} toggleTheme={()=>setIsDark(d=>!d)}/>;
  return <MainApp user={user} onLogout={()=>setUser(null)} isDark={isDark} toggleTheme={()=>setIsDark(d=>!d)}/>;
}

function MainApp({user,onLogout,isDark,toggleTheme}) {
  const C=isDark?DARK:LIGHT;
  const [tab,setTab]=useState("overview");
  const [proxyStatus,setProxyStatus]=useState("checking");
  const [realMode,setRealMode]=useState(false);

  //  Data state 
  const [wls,setWls]=useState([]);
  const [deployments,setDeployments]=useState([]);
  const [termLines,setTermLines]=useState(["[INFO] Cloud Infrastructure Platform ready.","[INFO] Connecting to WebLogic..."]);
  const [toasts,setToasts]=useState([]);
  const [modal,setModal]=useState(null);
  const { record } = useActivityRecorder(user);

  // Firebase
  const approvalsDB = useDB("approvals");
  const auditDB     = useDB("auditLogs");
  const incidentsDB = useDB("incidents");
  const activityDB  = useDB("activityLog");
  const feedbackDB  = useDB("feedback");
  const approvalList = approvalsDB ? Object.entries(approvalsDB).map(([k,v])=>({id:k,...v})) : [];
  const auditList    = auditDB     ? Object.entries(auditDB).map(([k,v])=>({id:k,...v}))     : [];
  const incidentList = incidentsDB ? Object.entries(incidentsDB).map(([k,v])=>({id:k,...v})) : [];
  const activityList = activityDB  ? Object.entries(activityDB).map(([k,v])=>({id:k,...v}))  : [];
  const feedbackList = feedbackDB  ? Object.entries(feedbackDB).map(([k,v])=>({id:k,...v}))  : [];

  const addToast = (title,message,color,icon) => {
    const id=Date.now();
    setToasts(p=>[...p,{id,title,message,color,icon}]);
    setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),6000);
  };

  const termLine = (l) => setTermLines(p=>[...p,l]);

  //  Proxy connection check 
  useEffect(()=>{
    const check=async()=>{
      const ok=await wlsApi.health();
      setProxyStatus(ok?"connected":"disconnected");
      setRealMode(ok);
      if(ok) {
        loadRealServers();
        loadRealDeployments();
      }
    };
    check();
    const t=setInterval(check,30000);
    return ()=>clearInterval(t);
  },[]);

  //  Real data loaders 
  const loadRealServers = async()=>{
    try {
      const data=await wlsApi.get("/api/servers");
      if(data.servers?.length) {
        setWls(data.servers.map((s,i)=>({
          id:"wls"+i,
          name:s.name||"Server-"+i,
          status:s.state==="RUNNING"?"RUNNING":s.state==="SHUTDOWN"?"STOPPED":s.state||"UNKNOWN",
          env:s.name?.includes("UAT")?"UAT":s.name?.includes("DR")?"DR":"Production",
          host:s.listenAddress||s.name,
          port:s.listenPort||7001,
          cpu:s.jvm?.heapPct||0,
          mem:s.jvm?.heapPct||0,
          jvmHeap:s.jvm?.heapPct||0,
          gcTime:s.jvm?.gcTimeSec||0,
          threads:s.threads?.current||0,
          maxThreads:s.threads?.max||200,
          version:"14.1.1.0",
          uptimeSecs:0,
          deployments:0,
          ...s
        })));
        // silent poll
      }
    } catch(e) { termLine("[WARN] Server load failed: "+e.message); }
  };

  const loadRealDeployments = async()=>{
    try {
      const data=await wlsApi.get("/api/deployments");
      // Always update - even if empty
      const deps = data.deployments || [];
      if(deps.length) {
        const normalized=deps.map(d=>({
          ...d,
          name: d.name||"unknown",
          state: d.state==="UNKNOWN"?(d.active===true?"ACTIVE":"PREPARED"):d.state||"UNKNOWN",
          version: d.version||"1.0",
          health: d.health||"OK",
        }));
        setDeployments(normalized);
        termLine("[OK] Loaded "+normalized.length+" deployments");
      } else {
        setDeployments([]);
        termLine("[OK] No deployments found");
      }
    } catch(e){ termLine("[WARN] Deployments load failed: "+e.message); setDeployments([]); }
  };

  //  Poll real metrics every 10s 
  useEffect(()=>{
    if(!realMode||wls.length===0) return;
    const t=setInterval(async()=>{ if(!realMode) return; // poll every 30s
      const data=await wlsApi.get("/api/servers");
      const serverMap={};
      (data.servers||[]).forEach(s=>{serverMap[s.name]=s;});
      // Update wls directly with fresh states
      setWls(prev=>prev.map(s=>{
        const fresh=serverMap[s.name];
        if(fresh) {
          const newStatus=fresh.state==="RUNNING"?"RUNNING":fresh.state==="SHUTDOWN"?"STOPPED":fresh.state||s.status;
          return {...s, status:newStatus};
        }
        return s;
      }));
      return;
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
  },[realMode,wls.length]);

  //  Operations 
  const handleOp=(target,op,type)=>{
    record("OP_SUBMIT",{operation:op,target:typeof target==="string"?target:target.name,description:user.name+" submitted "+op});
    setModal({target,op,type:type||"wls"});
  };

  const changeTab=(id,label)=>{ setTab(id); record("TAB_VISIT",{tab:label,description:user.name+" visited "+label}); };

  const confirmOp=async({reason,ticket,priority})=>{
    const {target,op,type}=modal;
    const name=typeof target==="string"?target:target.name;
    const sourcePath=typeof target==="object"?target.sourcePath:null;
    const targets=typeof target==="object"?target.targets:null;
    const entry=Object.fromEntries(Object.entries({action:op+" on "+name,user:user.name,target:name,operation:op,reason,ticket,priority,time:nowStr(),resourceType:type,sourcePath:sourcePath||null,targets:targets||null}).filter(([,v])=>v!==undefined&&v!==null));
    // All operations require approval except for admin doing START
    const isProdCritical=(op==="STOP"||op==="RESTART")&&name.toLowerCase().includes("prod");
    // ALL operations go through approval - Manager must approve before execution
    {
      push(ref(db,"approvals"),{...entry,status:"PENDING",requestedBy:user.name});
      record("OP_SUBMIT",{operation:op,target:name});
      addToast("Submitted for Approval","Pending Manager approval — check Approvals tab",C.warning,"");
      termLine("[PENDING] "+op+" on "+name+" sent to Manager for approval");
    }
    setModal(null);
    changeTab("approvals","Approvals");
  };

  //  Tab routing 

  const pendingApprovals = approvalList.filter(a=>a.status==="PENDING").length;
  const openIncidents    = incidentList.filter(i=>["OPEN","ACKNOWLEDGED"].includes(i.status)).length;
  const criticalWLS      = wls.filter(s=>s.status==="CRITICAL").length;

  const ALL_TABS=[
    {id:"overview",    label:"Dashboard",     roles:["admin","operator","approver","viewer","manager"]},
    {id:"weblogic",    label:"Servers",       roles:["admin","operator","viewer","manager"]},
    {id:"deployments", label:"Deployments",   roles:["admin","operator","viewer","manager"]},
    {id:"operations",  label:"Control Panel", roles:["admin","operator"]},
    {id:"approvals",   label:"Approvals"+(pendingApprovals>0?" ("+pendingApprovals+")":""), roles:["admin","approver","manager"]},
    {id:"incidents",   label:"Incidents"+(openIncidents>0?" ("+openIncidents+")":""),       roles:["admin","operator","approver","viewer","manager"]},
    {id:"audit",       label:"Audit",         roles:["admin","approver","manager"]},
    {id:"automation",  label:" Automation",  roles:["admin","operator"]},
    {id:"security",    label:"Security",      roles:["admin","manager","approver"]},
    {id:"mythos",      label:"OCI Advisory", roles:["admin","manager","approver"]},
  ].filter(t=>t.roles.includes(user.role));

  const sp={C,wls,deployments,setDeployments,approvalList,auditList,incidentList,activityList,feedbackList,user,handleOp,termLines,setTermLines,addToast,record,realMode,proxyStatus,loadRealDeployments,loadRealServers};

  return <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.text}}>
    <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.dim};border-radius:3px}input,textarea,select,button{font-family:'DM Sans',sans-serif}@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes pr{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.5);opacity:0}}`}</style>
    <ToastContainer toasts={toasts} dismiss={id=>setToasts(p=>p.filter(t=>t.id!==id))}/>
    {modal&&<ApprovalModal op={modal.op} target={typeof modal.target==="string"?modal.target:modal.target.name} user={user} onConfirm={confirmOp} onCancel={()=>setModal(null)} C={C} record={record}/>}

    {/* Platform Header */}
    <header style={{background:C.headerBg,borderBottom:"1px solid "+C.border,position:"sticky",top:0,zIndex:100}}>
      <div style={{padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:50,borderBottom:"1px solid rgba(255,255,255,.1)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{fontWeight:800,fontSize:18,color:"#fff",letterSpacing:-0.5}}>CLOUD</div>
          <div style={{width:1,height:20,background:"rgba(255,255,255,.3)"}}/>
          <div style={{color:"rgba(255,255,255,.85)",fontSize:13,fontWeight:600}}>Cloud Infrastructure Platform</div>
          <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,.1)",borderRadius:4,padding:"3px 10px",fontSize:11}}>
            <Pulse color={proxyStatus==="connected"?C.success:proxyStatus==="checking"?C.blue:C.warning} size={6}/>
            <span style={{color:"rgba(255,255,255,.8)",fontWeight:700}}>{proxyStatus==="connected"?"Connected — gsc_domain":proxyStatus==="checking"?"Connecting..":"Disconnected"}</span>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {criticalWLS>0&&<div style={{display:"flex",alignItems:"center",gap:5,background:C.danger+"25",border:"1px solid "+C.danger+"55",borderRadius:4,padding:"3px 10px"}}><Pulse color={C.danger} size={6}/><span style={{fontSize:11,fontWeight:700,color:C.danger}}>{criticalWLS} CRITICAL</span></div>}
          <button onClick={toggleTheme} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.35)",borderRadius:4,padding:"5px 14px",cursor:"pointer",color:"#fff",fontSize:12,fontWeight:700,letterSpacing:0.3}}>{isDark?"Light Mode":"Dark Mode"}</button>
          <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.2)",borderRadius:4,padding:"4px 12px"}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:C.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{user.initials}</div>
            <span style={{fontSize:12,fontWeight:600,color:"#fff"}}>{user.name}</span>
          </div>
          <Btn color="#fff" outline onClick={()=>{record("LOGOUT",{description:user.name+" signed out"});onLogout();}} sm C={C}>Sign Out</Btn>
        </div>
      </div>

      {/* Connection banner when disconnected */}
      {proxyStatus!=="connected"&&<div style={{background:proxyStatus==="checking"?C.blue+"18":C.warning+"18",borderBottom:"2px solid "+(proxyStatus==="checking"?C.blue:C.warning),padding:"8px 20px",display:"flex",alignItems:"center",gap:10,fontSize:12}}>
        {proxyStatus==="checking"?<span style={{display:"inline-block",width:12,height:12,border:"2px solid "+C.blue,borderTopColor:"transparent",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>:<span></span>}
        <span style={{color:proxyStatus==="checking"?C.blue:C.warning,fontWeight:700}}>{proxyStatus==="checking"?"Connecting to WebLogic proxy...":"Not connected to WebLogic. Check proxy and ngrok."}</span>
      </div>}

      <div style={{padding:"0 20px",display:"flex",overflowX:"auto",background:isDark?"#1a1a1a":"#b83020"}}>
        {ALL_TABS.map(t=><button key={t.id} onClick={()=>changeTab(t.id,t.label)} style={{padding:"9px 14px",background:"transparent",border:"none",borderBottom:tab===t.id?"3px solid #fff":"3px solid transparent",color:tab===t.id?"#fff":"rgba(255,255,255,.6)",cursor:"pointer",fontSize:12,fontWeight:tab===t.id?700:500,whiteSpace:"nowrap",transition:"all .2s"}}>{t.label}</button>)}
      </div>
    </header>

    <main style={{maxWidth:1800,margin:"0 auto",padding:"24px 20px",animation:"slideIn .25s ease"}}>
      {tab==="overview"    && <OverviewTab {...sp}/>}
      {tab==="weblogic"    && <WebLogicTab {...sp}/>}
      {tab==="deployments" && <DeploymentsTab {...sp}/>}
      {tab==="operations"  && <OperationsTab {...sp}/>}
      {tab==="approvals"   && <ApprovalsTab {...sp}/>}
      {tab==="incidents"   && <IncidentsTab {...sp}/>}
      {tab==="feedback"    && <FeedbackTab {...sp}/>}
      {tab==="activity"    && <ActivityTab {...sp}/>}
      {tab==="audit"       && <AuditTab {...sp}/>}
      {tab==="automation"  && <div style={{padding:"8px 0"}}><AgentPanel AGENT_URL={AGENT_URL} theme={isDark?"dark":"light"} C={C}/></div>}
      {tab==="security"    && <SecurityTab C={C} user={user} wlsApi={wlsApi} addToast={addToast} realMode={realMode}/>}
      {tab==="mythos"      && <MythosTab C={C} user={user} wlsApi={wlsApi} addToast={addToast} realMode={realMode}/>}
    </main>

    <button onClick={()=>changeTab("feedback","Feedback")} style={{position:"fixed",bottom:24,left:24,zIndex:500,padding:"8px 18px",background:C.card,border:"1px solid "+C.border,borderRadius:4,cursor:"pointer",fontSize:13,fontWeight:700,color:C.text,boxShadow:"0 2px 8px "+C.shadow}}> Feedback</button>
  </div>;
}

//  Overview Tab 
function OverviewTab({C,wls,deployments,incidentList,approvalList,auditList,realMode,proxyStatus,loadRealServers,loadRealDeployments}) {
  const running=wls.filter(s=>s.status==="RUNNING").length;
  const critical=wls.filter(s=>s.status==="CRITICAL").length;
  const openInc=incidentList.filter(i=>["OPEN","ACKNOWLEDGED"].includes(i.status)).length;
  const activeDeploys=deployments.filter(d=>d.state==="ACTIVE").length;
  return <div>
    <div style={{marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:10}}>
      <div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>Infrastructure Overview</h2>
        <div style={{display:"flex",alignItems:"center",gap:8}}><Pulse color={realMode?C.success:C.warning} size={6}/><span style={{fontSize:12,color:C.muted}}>{realMode?"":"Not connected  check proxy"}</span></div>
      </div>
      {realMode&&<div style={{display:"flex",gap:8}}>
        <Btn color={C.blue} sm onClick={loadRealServers} C={C}> Refresh Servers</Btn>
        <Btn color={C.purple} sm onClick={loadRealDeployments} C={C}> Refresh Deployments</Btn>
      </div>}
    </div>

    {!realMode&&<div style={{background:C.warning+"12",border:"1px solid "+C.warning+"44",borderRadius:4,padding:"16px 20px",marginBottom:20,display:"flex",gap:12,alignItems:"flex-start"}}>
      <span style={{fontSize:24}}></span>
      <div>
        <div style={{fontWeight:700,color:C.warning,marginBottom:4}}>Not connected to WebLogic</div>
        <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>Make sure your Docker containers are running and ngrok is active. Check the proxy at <code style={{background:C.dim,padding:"1px 5px",borderRadius:3,fontSize:11}}>{PROXY_URL}/health</code></div>
      </div>
    </div>}

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
      {[
        {l:"WLS Servers",v:wls.length>0?running+"/"+wls.length:"",c:C.red,i:""},
        {l:"Active Deploys",v:deployments.length>0?activeDeploys+"/"+deployments.length:"",c:C.blue,i:""},
        {l:"Critical",v:critical,c:critical>0?C.danger:C.success,i:""},
        {l:"Incidents",v:openInc,c:openInc>0?C.warning:C.success,i:""},
        {l:"Pending Approvals",v:(approvalList||[]).filter(a=>a.status==="PENDING").length,c:C.warning,i:""},
        
      ].map(s=><Card key={s.l} color={s.c} style={{padding:"14px 16px"}} C={C}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div><div style={{fontSize:10,color:C.muted,marginTop:6,textTransform:"uppercase",letterSpacing:0.8}}>{s.l}</div></div>
          <span style={{fontSize:18,opacity:.5}}>{s.i}</span>
        </div>
      </Card>)}
    </div>

    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16}}>
      <Card color={C.red} C={C}>
        <div style={{fontWeight:700,marginBottom:14,fontSize:14,display:"flex",justifyContent:"space-between"}}>
          <span> WebLogic Servers</span>
          <div style={{display:"flex",alignItems:"center",gap:5}}><Pulse color={realMode?C.success:C.muted} size={6}/><span style={{fontSize:11,color:C.muted,fontWeight:400}}>{realMode?"Live":"Offline"}</span></div>
        </div>
        {wls.length===0?<div style={{textAlign:"center",padding:"30px 0",color:C.muted}}>{realMode?"Loading servers...":"No data  connect to WebLogic"}</div>:<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {wls.map(s=><div key={s.id} style={{background:C.card2,border:"1px solid "+C.border,borderLeft:"3px solid "+scol(s.status,C),borderRadius:4,padding:"10px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><Pulse color={scol(s.status,C)} size={6}/><span style={{fontWeight:700,fontSize:12,fontFamily:"monospace",color:C.text}}>{s.name}</span></div>
              <Badge text={s.status} color={scol(s.status,C)}/>
            </div>
            <MetricBar value={s.cpu||0} label="CPU" warn={70} crit={85} small C={C}/>
            <div style={{marginTop:5}}><MetricBar value={s.jvmHeap||0} label="JVM" warn={80} crit={92} small C={C}/></div>
          </div>)}
        </div>}
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card color={C.blue} C={C}>
          <div style={{fontWeight:700,marginBottom:10,fontSize:14}}> Deployments</div>
          {deployments.length===0?<div style={{color:C.muted,fontSize:12,padding:"10px 0"}}>{realMode?"Loading deployments...":"No data"}</div>:deployments.slice(0,5).map(d=><div key={d.name} style={{padding:"7px 0",borderBottom:"1px solid "+C.border+"66"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontWeight:600,fontSize:12,color:C.text}}>{d.name}</span>
              <Badge text={d.state||"ACTIVE"} color={scol(d.state||"ACTIVE",C)}/>
            </div>
            <div style={{fontSize:10,color:C.muted}}>{d.type} · {(Array.isArray(d.targets) ? d.targets : d.targets ? [d.targets] : []).join(", ")}</div>
          </div>)}
        </Card>
        <Card color={C.danger} C={C}>
          <div style={{fontWeight:700,marginBottom:10,fontSize:14}}> Recent Audit</div>
          {auditList.length===0?<div style={{color:C.muted,fontSize:12}}>No activity yet.</div>:[...auditList].reverse().slice(0,4).map(a=><div key={a.id} style={{padding:"5px 0",borderBottom:"1px solid "+C.border+"66"}}>
            <div style={{fontWeight:600,fontSize:11,color:C.text}}>{a.action}</div>
            <div style={{color:C.muted,fontSize:10,marginTop:1}}>{a.user} · {a.time}</div>
          </div>)}
        </Card>
      </div>
    </div>
  </div>;
}

//  WebLogic Tab 
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
        <p style={{color:C.muted,margin:0,fontSize:12}}>{wls.length} servers · Click for details</p>
        {realMode&&<Badge text={"Connected — gsc_domain"} color={C.success}/>}
        {!realMode&&<Badge text="NOT CONNECTED" color={C.warning}/>}
      </div>
    </div>
    {wls.length===0?<Card color={C.muted} style={{textAlign:"center",padding:60}} C={C}>
      <div style={{fontSize:32,marginBottom:12}}></div>
      <div style={{fontWeight:700,color:C.text,marginBottom:8}}>No WebLogic servers found</div>
      <div style={{color:C.muted,fontSize:13}}>{realMode?"Servers loaded but none returned from API":"Connect to WebLogic proxy to see real server data"}</div>
    </Card>:<div style={{display:"grid",gridTemplateColumns:s?"1fr 360px":"1fr",gap:16}}>
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
            {[["CPU",sv.cpu+"%",sv.cpu>85?C.danger:sv.cpu>70?C.warning:C.success],["MEM",sv.mem+"%",sv.mem>90?C.danger:sv.mem>75?C.warning:C.success],["JVM",sv.jvmHeap+"%",sv.jvmHeap>92?C.danger:sv.jvmHeap>80?C.warning:C.success],["THR",sv.threads,C.info]].map(([l,v,c])=><div key={l} style={{background:C.bg,border:"1px solid "+C.border,borderRadius:3,padding:"6px 3px",textAlign:"center"}}>
              <div style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:c}}>{v}</div>
              <div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div>
            </div>)}
          </div>
          <div style={{fontSize:10,color:C.muted}}> {fmtUp(sv.uptimeSecs||0)} · WLS {sv.version}</div>
        </Card>)}
      </div>
      {s&&<div style={{position:"sticky",top:90,height:"fit-content"}}>
        <Card color={scol(s.status,C)} C={C}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
            <div><div style={{fontWeight:800,fontSize:16,color:C.text}}>{s.name}</div><div style={{fontSize:11,color:C.muted,fontFamily:"monospace",marginTop:3}}>{s.host}:{s.port}</div></div>
            <button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:18}}></button>
          </div>
          {loadingDetail&&<div style={{textAlign:"center",padding:20,color:C.muted}}>Loading metrics...</div>}
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
            <MetricBar value={detail?.jvm?.heapPct||s.jvmHeap||0} label="JVM Heap" warn={80} crit={92} C={C}/>
            <MetricBar value={s.cpu||0} label="CPU" warn={70} crit={85} C={C}/>
            <MetricBar value={s.mem||0} label="Memory" warn={75} crit={90} C={C}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {[["Uptime",fmtUp(s.uptimeSecs||0)],["Version",s.version||"14.1.1"],["Environment",s.env||"Production"],["Port",s.port||7001]].map(([l,v])=><div key={l} style={{background:C.bg,border:"1px solid "+C.border,borderRadius:4,padding:"8px 10px"}}>
              <div style={{fontSize:9,color:C.muted,marginBottom:2,textTransform:"uppercase"}}>{l}</div>
              <div style={{fontSize:12,fontWeight:600,fontFamily:"monospace",color:C.text}}>{v}</div>
            </div>)}
          </div>
          {canOp&&<div style={{display:"flex",flexDirection:"column",gap:6}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>Operations</div>
            {[["RESTART","",C.blue],["STOP","",s.status==="STOPPED"?C.dim:C.danger],["START","",s.status==="RUNNING"?C.dim:C.success]].map(([op,icon,col])=><Btn key={op} color={col} sm onClick={()=>handleOp(s,op,"wls")} disabled={op==="STOP"&&s.status==="STOPPED"||op==="START"&&s.status==="RUNNING"} C={C}>{icon} {op}</Btn>)}
          </div>}
        </Card>
      </div>}
    </div>}
  </div>;
}

//  Deployments Tab 
function DeploymentsTab({C,wls,deployments,setDeployments,user,handleOp,termLines,setTermLines,addToast,record,realMode,loadRealDeployments}) {
  const [deployForm,setDeployForm]=useState({appName:"pdc-app",sourcePath:"/tmp/pdc-app.war",targets:"AdminServer"});
  const [showDeploy,setShowDeploy]=useState(false);
  const [filter,setFilter]=useState("ALL");

  const submitDeploy=()=>{
    if(!deployForm.appName||!deployForm.sourcePath) return addToast("Error","App name and path required",C.danger,"ERR");
    handleOp({name:deployForm.appName,sourcePath:deployForm.sourcePath,targets:deployForm.targets.split(",").map(t=>t.trim())},"DEPLOY","deployment");
    setShowDeploy(false);
    setDeployForm({appName:"pdc-app",sourcePath:"/tmp/pdc-app.war",targets:"AdminServer"});
  };

  const termLine=(l)=>setTermLines(p=>[...p,l]);
  const canDeploy=user.role==="admin"||user.role==="operator";

  const filtered=filter==="ALL"?deployments:deployments.filter(d=>d.state===filter);

  const doOp=(dep,op)=>{
    if(!realMode) { addToast("Not connected","Connect to WebLogic first",C.warning,""); return; }
    // Route ALL deployment operations through approval workflow
    handleOp({name:dep.name, resourceType:"deployment"}, op, "deployment");
  };



  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:16,flexWrap:"wrap",gap:10}}>
      <div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>Deployments</h2>
        <p style={{color:C.muted,margin:0,fontSize:12}}>{deployments.length} applications · {realMode?<strong style={{color:C.success}}>Connected — gsc_domain</strong>:<strong style={{color:C.warning}}>Not connected</strong>}</p>
      </div>
      {canDeploy&&<div style={{display:"flex",gap:8}}>
        
        <Btn color={C.success} onClick={()=>setShowDeploy(v=>!v)} C={C}> Deploy WAR/EAR</Btn>
        <Btn color={C.blue} sm onClick={loadRealDeployments} C={C}> Refresh</Btn>
      </div>}
    </div>
    {showDeploy&&<div style={{background:C.card2,border:"1px solid "+C.border,borderRadius:8,padding:"16px 20px",marginBottom:16}}>
      <div style={{fontWeight:700,fontSize:14,color:C.text,marginBottom:12}}>Deploy Application to WebLogic</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>App Name</div>
          <input value={deployForm.appName} onChange={e=>setDeployForm(p=>({...p,appName:e.target.value}))} placeholder="pdc-app" style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:4,padding:"7px 10px",color:C.text,fontSize:13,boxSizing:"border-box"}}/>
        </div>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>WAR Path (inside container)</div>
          <input value={deployForm.sourcePath} onChange={e=>setDeployForm(p=>({...p,sourcePath:e.target.value}))} placeholder="/tmp/pdc-app.war" style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:4,padding:"7px 10px",color:C.text,fontSize:13,boxSizing:"border-box"}}/>
        </div>
        <div>
          <div style={{fontSize:11,color:C.muted,marginBottom:4}}>Target Servers</div>
          <input value={deployForm.targets} onChange={e=>setDeployForm(p=>({...p,targets:e.target.value}))} placeholder="AdminServer" style={{width:"100%",background:C.bg,border:"1px solid "+C.border,borderRadius:4,padding:"7px 10px",color:C.text,fontSize:13,boxSizing:"border-box"}}/>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <Btn color={C.success} onClick={submitDeploy} C={C}>Submit for Approval</Btn>
        <Btn color={C.muted} outline onClick={()=>setShowDeploy(false)} C={C}>Cancel</Btn>
      </div>
      <div style={{fontSize:11,color:C.muted,marginTop:8}}>Note: WAR file must already be inside the Docker container at the specified path. Use: docker cp your.war gsc-wls-admin:/tmp/your.war</div>
    </div>}

    <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:16}}>
      <div>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {["ALL","ACTIVE","PREPARED","FAILED"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 14px",background:filter===f?C.red:C.card2,border:"1px solid "+(filter===f?C.red:C.border),borderRadius:4,cursor:"pointer",fontSize:12,fontWeight:700,color:filter===f?"#fff":C.muted}}>{f}</button>)}
        </div>
        {deployments.length===0?<Card color={C.muted} style={{textAlign:"center",padding:60}} C={C}>
          <div style={{fontSize:32,marginBottom:12}}></div>
          <div style={{fontWeight:700,color:C.text,marginBottom:8}}>No deployments found</div>
          <div style={{color:C.muted,fontSize:13}}>{realMode?"No applications deployed on WebLogic":"Connect to WebLogic to see deployments"}</div>
        </Card>:<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(dep=><Card key={dep.name} color={scol(dep.state||"ACTIVE",C)} style={{padding:"14px 18px"}} C={C}>
            <div style={{display:"flex",gap:14,alignItems:"flex-start",flexWrap:"wrap"}}>
              <div style={{fontSize:32,flexShrink:0}}>{dep.type==="EAR"?"":dep.type==="JAR"?"":""}</div>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontWeight:800,fontSize:15,fontFamily:"monospace",color:C.text}}>{dep.name}</span>
                  <Chip label={dep.type||"WAR"} color={C.cyan}/>
                  <Badge text={dep.state||"ACTIVE"} color={scol(dep.state||"ACTIVE",C)}/>
                </div>
                <div style={{display:"flex",gap:12,fontSize:11,color:C.muted,flexWrap:"wrap"}}>
                  {dep.version&&<span> v{dep.version}</span>}
                  {dep.deployedAt&&<span> {dep.deployedAt}</span>}
                </div>
                <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                  {(Array.isArray(dep.targets) ? dep.targets : dep.targets ? String(dep.targets).split(",").map(s=>s.trim()) : []).map(t=><Chip key={t} label={t} color={C.blue}/>)}
                </div>
              </div>
              {canDeploy&&<div style={{display:"flex",gap:7,flexShrink:0,flexWrap:"wrap"}}>
                {dep.state!=="ACTIVE"&&<Btn color={C.success} sm onClick={()=>doOp(dep,"START")} C={C}> Start</Btn>}
                {dep.state==="ACTIVE"&&<Btn color={C.warning} sm onClick={()=>doOp(dep,"STOP")} C={C}> Stop</Btn>}
                <Btn color={C.blue} sm onClick={()=>doOp(dep,"REDEPLOY")} C={C}> Redeploy</Btn>
                <Btn color={C.danger} sm outline onClick={()=>{ doOp(dep,"UNDEPLOY"); }} C={C}>— Undeploy</Btn>
              </div>}
            </div>
          </Card>)}
        </div>}
      </div>
      <div style={{position:"sticky",top:90,height:"fit-content"}}>
        <Card color={C.success} C={C}>
          <div style={{fontWeight:700,marginBottom:10,fontSize:13,display:"flex",justifyContent:"space-between"}}>
            <span>– Deploy Console</span>
            <button onClick={()=>setTermLines(["[INFO] Cleared."])} style={{background:"none",border:"1px solid "+C.border,borderRadius:3,color:C.muted,cursor:"pointer",fontSize:10,padding:"2px 8px"}}>Clear</button>
          </div>
          <div ref={null} style={{background:"#000",borderRadius:4,padding:14,height:420,overflowY:"auto",fontFamily:"monospace",fontSize:11,border:"1px solid "+C.success+"33",lineHeight:1.6}}>
            {termLines.map((l,i)=><div key={i} style={{color:l.startsWith("[ERR")?C.danger:l.startsWith("[WARN")?C.warning:l.startsWith("[OK")?C.success:C.text}}>{l}</div>)}
          </div>
        </Card>
      </div>
    </div>
  </div>;
}

//  Operations Tab 
function OperationsTab({C,wls,user,approvalList,handleOp,termLines,setTermLines,realMode}) {
  const [form,setForm]=useState({server:"",operation:"RESTART"});
  const execOp=()=>{
    if(!form.server) return;
    const res=wls.find(r=>r.name===form.server);
    if(!res) return;
    handleOp(res,form.operation,"wls");
  };
  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>Operations Center</h2>
    <p style={{color:C.muted,marginBottom:16,fontSize:12}}>{user.role==="admin"?"System Admin  direct execution":"Operations require Change Approver sign-off"} · {realMode?<strong style={{color:C.success}}>REAL WLS EXECUTION</strong>:<strong style={{color:C.warning}}>Not connected</strong>}</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <Card color={C.red} C={C}>
        <div style={{fontWeight:700,marginBottom:14,fontSize:15}}>Submit Operation</div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Target Server</div>
          <select value={form.server} onChange={e=>setForm(f=>({...f,server:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}>
            <option value="">Select server</option>
            {wls.map(s=><option key={s.id} value={s.name}>{s.name} [{s.status}]</option>)}
          </select>
          {wls.length===0&&<div style={{fontSize:11,color:C.warning,marginTop:6}}> No servers loaded. Connect to WebLogic first.</div>}
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Operation</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[["RESTART","",C.blue],["STOP","",C.danger],["START","",C.success],["HEAPDUMP","",C.purple],["THREADDUMP","",C.teal],["PATCH","",C.orange]].map(([op,icon,color])=><button key={op} onClick={()=>setForm(f=>({...f,operation:op}))} style={{padding:"9px 5px",background:form.operation===op?color+"20":C.card2,border:"2px solid "+(form.operation===op?color:C.border),borderRadius:4,cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:18,marginBottom:2}}>{icon}</div>
              <div style={{fontSize:10,fontWeight:700,color:form.operation===op?color:C.muted}}>{op}</div>
            </button>)}
          </div>
        </div>
        <Btn color={user.role==="admin"?C.success:C.warning} onClick={execOp} disabled={!form.server} style={{width:"100%",padding:12,justifyContent:"center"}} C={C}>{user.role==="admin"?` Execute ${realMode?"(Real)":"(Offline)"}`:" Submit for Approval"}</Btn>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <Card color={C.success} C={C}>
          <div style={{fontWeight:700,marginBottom:10,fontSize:13,display:"flex",justifyContent:"space-between"}}>
            <span>– Console</span>
            <button onClick={()=>setTermLines(["[INFO] Cleared."])} style={{background:"none",border:"1px solid "+C.border,borderRadius:3,color:C.muted,cursor:"pointer",fontSize:10,padding:"2px 8px"}}>Clear</button>
          </div>
          <div style={{background:"#000",borderRadius:4,padding:14,height:200,overflowY:"auto",fontFamily:"monospace",fontSize:11,lineHeight:1.6}}>
            {termLines.map((l,i)=><div key={i} style={{color:l.startsWith("[ERR")?C.danger:l.startsWith("[WARN")?C.warning:l.startsWith("[OK")?C.success:C.text}}>{l}</div>)}
          </div>
        </Card>
        <Card color={C.warning} C={C}>
          <div style={{fontWeight:700,marginBottom:10,fontSize:13}}> Pending Approvals</div>
          {(approvalList||[]).filter(a=>a.status==="PENDING").length===0?<div style={{color:C.muted,fontSize:12}}>None pending.</div>:(approvalList||[]).filter(a=>a.status==="PENDING").map(a=><div key={a.id} style={{background:C.bg,borderRadius:4,padding:"8px 10px",marginBottom:6,borderLeft:"3px solid "+C.warning}}>
            <div style={{fontWeight:700,fontSize:11,fontFamily:"monospace",color:C.text}}>{a.operation}  {a.target}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:2}}>By {a.requestedBy||a.user} · {a.time}</div>
          </div>)}
        </Card>
      </div>
    </div>
  </div>;
}

//  Approvals Tab 

// ════════════════════════════════════════════════════════
// SECURITY TAB
// ════════════════════════════════════════════════════════
function SecurityTab({C,user,wlsApi,addToast,realMode}) {
  const [scanning,setScanning]=useState(false);
  const [results,setResults]=useState(null);
  const [report,setReport]=useState('');
  const [loadingReport,setLoadingReport]=useState(false);
  const [activeCategory,setActiveCategory]=useState('ALL');

  const runScan=async()=>{
    if(!realMode) return addToast("Not connected","Connect to WebLogic first",C.warning,"");
    setScanning(true); setResults(null); setReport('');
    try {
      const data=await wlsApi.post("/api/security/scan",{});
      setResults(data);
      addToast("Scan complete",`Risk Level: ${data.riskLevel}`,
        data.riskLevel==="CRITICAL"||data.riskLevel==="HIGH"?C.danger:C.success,"");
    } catch(e) {
      addToast("Scan failed",e.message,C.danger,"");
    }
    setScanning(false);
  };

  const generateReport=async()=>{
    if(!results) return;
    setLoadingReport(true);
    try {
      const data=await wlsApi.post("/api/security/report",{
        findings:results.findings,
        summary:results.summary,
        riskLevel:results.riskLevel,
        riskScore:results.riskScore,
      });
      setReport(data.report);
    } catch(e) {
      addToast("Report failed",e.message,C.danger,"");
    }
    setLoadingReport(false);
  };

  const downloadReport=()=>{
    if(!report||!results) return;
    // Use jsPDF via CDN loaded dynamically
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, margin = 15, lineH = 7;
      let y = 20;

      const addText = (text, size, color, bold, maxW) => {
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
        const lines = doc.splitTextToSize(text, maxW || W - margin * 2);
        lines.forEach(line => {
          if(y > 275) { doc.addPage(); y = 20; }
          doc.text(line, margin, y);
          y += size * 0.45;
        });
        y += 2;
      };

      const addRect = (col, h) => {
        doc.setFillColor(...col);
        doc.rect(0, y - 6, W, h || lineH + 2, 'F');
      };

      // Header
      addRect([15, 23, 42], 18);
      doc.setFontSize(18); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
      doc.text('GSC WebLogic Security Assessment Report', margin, y + 4);
      y += 18;

      // Metadata bar
      addRect([30, 41, 60], 10);
      doc.setFontSize(9); doc.setTextColor(148,163,184); doc.setFont('helvetica','normal');
      doc.text('Generated: ' + new Date().toLocaleString() + '   |   WebLogic 14.1.1   |   Oracle GSC   |   Classification: Internal', margin, y + 3);
      y += 14;

      // Risk Score box
      const rCol = results.riskLevel==='CRITICAL'?[220,38,38]:results.riskLevel==='HIGH'?[249,115,22]:results.riskLevel==='MEDIUM'?[245,158,11]:[34,197,94];
      doc.setFillColor(...rCol);
      doc.roundedRect(margin, y, 55, 18, 3, 3, 'F');
      doc.setFontSize(11); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
      doc.text('Risk: ' + results.riskLevel, margin + 4, y + 7);
      doc.text('Score: ' + results.riskScore + '/100', margin + 4, y + 14);

      // Summary stats
      const stats = [['Critical', results.summary.critical, [220,38,38]], ['High', results.summary.high, [249,115,22]], ['Medium', results.summary.medium, [245,158,11]], ['Passed', results.summary.passed, [34,197,94]]];
      stats.forEach((st, i) => {
        const sx = 80 + i * 32;
        doc.setFillColor(...st[2]);
        doc.roundedRect(sx, y, 28, 18, 2, 2, 'F');
        doc.setFontSize(14); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
        doc.text(String(st[1]), sx + 10, y + 10, {align:'center'});
        doc.setFontSize(8); doc.text(st[0], sx + 10, y + 16, {align:'center'});
      });
      y += 26;

      // AI Report
      addText('Executive Assessment', 13, [13,148,136], true);
      doc.setDrawColor(13,148,136); doc.setLineWidth(0.5);
      doc.line(margin, y - 1, W - margin, y - 1);
      y += 3;

      const reportLines = report.split('\n');
      reportLines.forEach(line => {
        if(!line.trim()) { y += 3; return; }
        if(line.startsWith('## ')) {
          y += 2;
          addText(line.replace('## ',''), 12, [15,23,42], true);
          doc.line(margin, y-1, W-margin, y-1);
          y += 2;
        } else if(line.startsWith('### ')) {
          addText(line.replace('### ',''), 11, [13,148,136], true);
        } else if(line.startsWith('- ') || line.startsWith('* ')) {
          addText('  • ' + line.substring(2), 9, [71,85,105], false);
        } else if(line.startsWith('**') && line.endsWith('**')) {
          addText(line.replace(/[*][*]/g,''), 10, [15,23,42], true);
        } else {
          addText(line.replace(/[*][*]/g,''), 9, [71,85,105], false);
        }
      });

      y += 6;
      // Findings
      addText('Detailed Findings', 13, [13,148,136], true);
      doc.line(margin, y-1, W-margin, y-1);
      y += 4;

      results.findings.forEach(f => {
        if(y > 260) { doc.addPage(); y = 20; }
        const sevCol = f.status==='PASS'?[34,197,94]:f.severity==='CRITICAL'?[220,38,38]:f.severity==='HIGH'?[249,115,22]:f.severity==='MEDIUM'?[245,158,11]:[100,116,139];
        doc.setFillColor(248,250,252);
        const fH = f.recommendation ? 22 : 16;
        doc.roundedRect(margin, y, W - margin*2, fH, 2, 2, 'F');
        doc.setFillColor(...sevCol);
        doc.roundedRect(margin, y, 20, fH, 2, 2, 'F');
        doc.setFontSize(8); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
        doc.text(f.status==='PASS'?'PASS':f.severity, margin+2, y+fH/2+1, {baseline:'middle'});
        doc.setFontSize(9); doc.setTextColor(15,23,42); doc.setFont('helvetica','bold');
        doc.text(f.check, margin+24, y+5);
        doc.setFontSize(8); doc.setTextColor(100,116,139); doc.setFont('helvetica','normal');
        doc.text(f.category, margin+24, y+10);
        doc.text(doc.splitTextToSize(f.detail, W-margin*2-26)[0], margin+24, y+15);
        if(f.recommendation) {
          doc.setTextColor(13,148,136);
          doc.text(doc.splitTextToSize('Rec: '+f.recommendation, W-margin*2-26)[0], margin+24, y+20);
        }
        y += fH + 3;
      });

      // Footer
      const pages = doc.getNumberOfPages();
      for(let i=1; i<=pages; i++) {
        doc.setPage(i);
        doc.setFillColor(15,23,42);
        doc.rect(0, 287, W, 10, 'F');
        doc.setFontSize(8); doc.setTextColor(148,163,184); doc.setFont('helvetica','normal');
        doc.text('GSC WebLogic AI Platform  |  Security Assessment  |  Confidential', margin, 293);
        doc.text('Page '+i+' of '+pages, W-margin, 293, {align:'right'});
      }

      doc.save('GSC_Security_Report_'+new Date().toISOString().split('T')[0]+'.pdf');
    };
    document.head.appendChild(script);
  };
  const riskColor=(level)=>({CRITICAL:C.danger,HIGH:"#F97316",MEDIUM:C.warning,LOW:C.green,INFO:C.blue,PASS:C.green}[level]||C.muted);
  const categories=results?["ALL",...new Set(results.findings.map(f=>f.category))]:[];
  const filtered=results?results.findings.filter(f=>activeCategory==="ALL"||f.category===activeCategory):[];

  return <div style={{padding:"20px 24px"}}>
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
      <div>
        <div style={{fontSize:22,fontWeight:700,color:C.text}}>Security Assessment</div>
        <div style={{fontSize:13,color:C.muted,marginTop:4}}>WebLogic 14.1.1 Security Scanner — checks users, SSL, deployments, ports, audit logs</div>
      </div>
      <div style={{display:"flex",gap:10}}>
        {results&&<Btn color={C.blue} onClick={generateReport} loading={loadingReport} C={C}>Generate Compliance Report</Btn>}
        {report&&<Btn color={C.success} onClick={downloadReport} C={C}>Download PDF Report</Btn>}
        <Btn color={C.teal} onClick={runScan} loading={scanning} C={C}>{scanning?"Scanning...":"Run Security Scan"}</Btn>
      </div>
    </div>

    {/* Empty state */}
    {!results&&!scanning&&<div style={{textAlign:"center",padding:"60px 0",color:C.muted}}>
      <div style={{fontSize:48,marginBottom:16}}>🔒</div>
      <div style={{fontSize:18,fontWeight:600,color:C.text,marginBottom:8}}>No scan results yet</div>
      <div style={{fontSize:13,marginBottom:24}}>Run a security scan to assess your WebLogic environment</div>
      <Btn color={C.teal} onClick={runScan} C={C}>Run Security Scan</Btn>
    </div>}

    {/* Scanning state */}
    {scanning&&<div style={{textAlign:"center",padding:"60px 0",color:C.muted}}>
      <div style={{fontSize:18,color:C.teal,marginBottom:8}}>Scanning WebLogic environment...</div>
      <div style={{fontSize:13}}>Checking users, SSL, deployments, ports, audit logs</div>
    </div>}

    {/* Results */}
    {results&&<div>
      {/* Risk Score Cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:20}}>
        {[
          {l:"Risk Level",v:results.riskLevel,c:riskColor(results.riskLevel)},
          {l:"Risk Score",v:results.riskScore+"/100",c:results.riskScore>70?C.green:results.riskScore>40?C.warning:C.danger},
          {l:"Critical",v:results.summary.critical,c:results.summary.critical>0?C.danger:C.success},
          {l:"High",v:results.summary.high,c:results.summary.high>0?"#F97316":C.success},
          {l:"Medium",v:results.summary.medium,c:results.summary.medium>0?C.warning:C.success},
        ].map(s=><Card key={s.l} color={s.c} style={{padding:"12px 16px",textAlign:"center"}} C={C}>
          <div style={{fontSize:22,fontWeight:700,color:s.c}}>{s.v}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>{s.l}</div>
        </Card>)}
      </div>

      {/* Category filter */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {categories.map(cat=><button key={cat} onClick={()=>setActiveCategory(cat)}
          style={{padding:"5px 14px",borderRadius:20,border:"1px solid",fontSize:12,cursor:"pointer",
            borderColor:activeCategory===cat?C.teal:C.border,
            background:activeCategory===cat?C.teal:"transparent",
            color:activeCategory===cat?C.white:C.muted}}>
          {cat}
        </button>)}
      </div>

      {/* Findings list */}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
        {filtered.map((f,i)=><div key={i} style={{background:C.card2,border:"1px solid",
          borderColor:f.status==="PASS"?C.border:riskColor(f.severity)+"44",
          borderLeft:"4px solid "+riskColor(f.status==="PASS"?"PASS":f.severity),
          borderRadius:8,padding:"12px 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{background:riskColor(f.status==="PASS"?"PASS":f.severity)+"22",
                color:riskColor(f.status==="PASS"?"PASS":f.severity),
                padding:"2px 10px",borderRadius:12,fontSize:11,fontWeight:700}}>
                {f.status==="PASS"?"PASS":f.severity}
              </span>
              <span style={{fontSize:11,color:C.muted}}>{f.category}</span>
            </div>
            <span style={{fontSize:11,color:C.muted}}>{f.status}</span>
          </div>
          <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>{f.check}</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:f.recommendation?6:0}}>{f.detail}</div>
          {f.recommendation&&<div style={{fontSize:12,color:C.muted,marginTop:4}}>{f.recommendation}</div>}
          {f.howToFix&&<div style={{marginTop:8,background:C.bg,borderRadius:6,padding:"8px 12px"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.teal,marginBottom:4}}>HOW TO FIX:</div>
            <div style={{fontSize:12,color:C.text,whiteSpace:"pre-line",fontFamily:"monospace"}}>{f.howToFix}</div>
          </div>}
          {f.verifyStep&&<div style={{marginTop:6,fontSize:11,color:C.success}}>VERIFY: {f.verifyStep}</div>}
        </div>)}
      </div>

      {/* AI Report */}
      {report&&<div style={{background:C.card2,border:"1px solid "+C.border,borderRadius:8,padding:20}}>
        <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:12}}>AI Security Assessment Report</div>
        <div style={{fontSize:13,color:C.muted,whiteSpace:"pre-wrap",lineHeight:1.7}}>{report}</div>
      </div>}
    </div>}
  </div>;
}



// ════════════════════════════════════════════════════════
// OCI ADVISORY TAB
// ════════════════════════════════════════════════════════
function MythosTab({C,user,wlsApi,addToast,realMode}) {
  const [scanning,setScanning]=useState(false);
  const [results,setResults]=useState(null);
  const [report,setReport]=useState('');
  const [loadingReport,setLoadingReport]=useState(false);
  const [activeVector,setActiveVector]=useState('ALL');

  const runScan=async()=>{
    if(!realMode) return addToast("Not connected","Connect to WebLogic first",C.warning,"");
    setScanning(true); setResults(null); setReport('');
    try {
      const data=await wlsApi.post("/api/mythos/scan",{});
      setResults(data);
      addToast("Compliance Scan Complete","Resilience Score: "+data.resilience+"/100",
        data.riskLevel==="CRITICAL"||data.riskLevel==="HIGH"?C.danger:C.success,"");
    } catch(e) { addToast("Scan failed",e.message,C.danger,""); }
    setScanning(false);
  };

  const generateReport=async()=>{
    if(!results) return;
    setLoadingReport(true);
    try {
      const data=await wlsApi.post("/api/mythos/report",{
        findings:results.findings, summary:results.summary,
        resilience:results.resilience, riskLevel:results.riskLevel,
        remediations:results.remediations,
      });
      setReport(data.report);
    } catch(e) { addToast("Report failed",e.message,C.danger,""); }
    setLoadingReport(false);
  };

  const downloadPDF=()=>{
    if(!report||!results) return;
    const script=document.createElement('script');
    script.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload=()=>{
      const {jsPDF}=window.jspdf;
      const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
      const W=210, M=15;
      let y=20;
      const add=(txt,sz,col,bold,maxW)=>{
        doc.setFontSize(sz); doc.setTextColor(...col);
        doc.setFont('helvetica',bold?'bold':'normal');
        const lines=doc.splitTextToSize(String(txt),maxW||W-M*2);
        lines.forEach(l=>{ if(y>275){doc.addPage();y=20;} doc.text(l,M,y); y+=sz*0.45; }); y+=2;
      };
      // Header
      doc.setFillColor(15,23,42); doc.rect(0,0,W,22,'F');
      doc.setFillColor(220,38,38); doc.rect(0,0,6,22,'F');
      doc.setFontSize(16); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
      doc.text('GSC Oracle Advisory Compliance Assessment Report',M,10);
      doc.setFontSize(9); doc.setTextColor(148,163,184); doc.setFont('helvetica','normal');
      doc.text('Oracle GSC  |  Oracle Advisory Compliance  |  '+new Date().toLocaleString()+'  |  Confidential',M,17);
      y=30;
      // Resilience score
      const rCol=results.riskLevel==='CRITICAL'?[220,38,38]:results.riskLevel==='HIGH'?[249,115,22]:[34,197,94];
      doc.setFillColor(...rCol); doc.roundedRect(M,y,60,18,3,3,'F');
      doc.setFontSize(11); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
      doc.text('Resilience: '+results.resilience+'/100',M+4,y+7);
      doc.text('Risk: '+results.riskLevel,M+4,y+14);
      // Stats
      [[results.summary.critical,'Critical',[220,38,38]],[results.summary.high,'High',[249,115,22]],[results.summary.medium,'Medium',[245,158,11]],[results.summary.passed,'Passed',[34,197,94]]].forEach((st,i)=>{
        const sx=85+i*32;
        doc.setFillColor(...st[2]); doc.roundedRect(sx,y,28,18,2,2,'F');
        doc.setFontSize(14); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
        doc.text(String(st[0]),sx+14,y+10,{align:'center'});
        doc.setFontSize(8); doc.text(st[1],sx+14,y+16,{align:'center'});
      });
      y+=26;
      add('Advisory: Oracle Security Advisory May 2026 — Security Controls',9,[148,163,184],false);
      y+=4;
      // Report content
      add('Security Assessment',13,[13,148,136],true);
      doc.setDrawColor(13,148,136); doc.setLineWidth(0.5); doc.line(M,y-1,W-M,y-1); y+=3;
      report.split('\n').forEach(line=>{
        if(!line.trim()){y+=3;return;}
        if(line.startsWith('## ')) { y+=2; add(line.replace('## ',''),12,[15,23,42],true); doc.line(M,y-1,W-M,y-1); y+=2; }
        else if(line.startsWith('### ')) add(line.replace('### ',''),11,[13,148,136],true);
        else if(line.startsWith('- ')) add('  - '+line.substring(2),9,[71,85,105],false);
        else add(line.replace(/[*][*]/g,''),9,[71,85,105],false);
      });
      y+=6;
      // Findings
      add('Security Control Findings',13,[220,38,38],true);
      doc.line(M,y-1,W-M,y-1); y+=4;
      results.findings.filter(f=>f.status!=='PASS').forEach(f=>{
        if(y>260){doc.addPage();y=20;}
        const sc=f.severity==='CRITICAL'?[220,38,38]:f.severity==='HIGH'?[249,115,22]:f.severity==='MEDIUM'?[245,158,11]:[100,116,139];
        doc.setFillColor(248,250,252); doc.roundedRect(M,y,W-M*2,f.remediation?24:16,2,2,'F');
        doc.setFillColor(...sc); doc.roundedRect(M,y,22,f.remediation?24:16,2,2,'F');
        doc.setFontSize(7); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
        doc.text(f.vector||'',M+1,y+(f.remediation?12:8),{baseline:'middle'});
        doc.setFontSize(9); doc.setTextColor(15,23,42); doc.setFont('helvetica','bold');
        doc.text(f.check,M+25,y+5);
        doc.setFontSize(8); doc.setTextColor(100,116,139); doc.setFont('helvetica','normal');
        const detLines=doc.splitTextToSize(f.detail,W-M*2-27);
        const fixLines=f.remediation?doc.splitTextToSize('Fix: '+f.remediation,W-M*2-27):[];
        const totalLines=detLines.length+fixLines.length;
        const fHH=8+totalLines*4+8;
        doc.setFillColor(248,250,252); doc.roundedRect(M,y,W-M*2,fHH,2,2,'F');
        doc.setFillColor(...sc); doc.roundedRect(M,y,22,fHH,2,2,'F');
        doc.setFontSize(7); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
        doc.text(f.vector||'',M+1,y+fHH/2,{baseline:'middle'});
        doc.setFontSize(9); doc.setTextColor(15,23,42); doc.setFont('helvetica','bold');
        doc.text(f.check,M+25,y+5);
        doc.setFontSize(8); doc.setTextColor(100,116,139); doc.setFont('helvetica','normal');
        let ly=y+11;
        detLines.forEach(l=>{doc.text(l,M+25,ly);ly+=4;});
        if(fixLines.length>0){
          doc.setTextColor(13,148,136);
          fixLines.forEach(l=>{doc.text(l,M+25,ly);ly+=4;});
        }
        y+=fHH+3;
      });
      // Footer
      const pages=doc.getNumberOfPages();
      for(let i=1;i<=pages;i++){
        doc.setPage(i); doc.setFillColor(15,23,42); doc.rect(0,287,W,10,'F');
        doc.setFontSize(8); doc.setTextColor(148,163,184); doc.setFont('helvetica','normal');
        doc.text('GSC WebLogic AI Platform  |  Oracle Advisory Compliance Report  |  Confidential',M,293);
        doc.text('Page '+i+' of '+pages,W-M,293,{align:'right'});
      }
      doc.save('GSC_OCI_Advisory_Compliance_'+new Date().toISOString().split('T')[0]+'.pdf');
    };
    document.head.appendChild(script);
  };

  const sevColor=(sev,status)=>{
    if(status==='PASS') return C.green;
    return {CRITICAL:C.danger,HIGH:"#F97316",MEDIUM:C.warning,LOW:C.blue,INFO:C.muted}[sev]||C.muted;
  };

  const vectors=results?["ALL",...new Set(results.findings.map(f=>f.vector))]:[];
  const filtered=results?results.findings.filter(f=>activeVector==="ALL"||f.vector===activeVector):[];

  return <div style={{padding:"20px 24px"}}>
    {/* Header */}
    <div style={{background:"linear-gradient(135deg, #1E0A0A 0%, #2D0808 100%)",border:"1px solid #7F1D1D",borderRadius:12,padding:"20px 24px",marginBottom:20}}>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
            <div style={{background:C.danger,borderRadius:6,padding:"4px 12px"}}>
              <span style={{fontSize:11,fontWeight:700,color:C.white,letterSpacing:1}}>OCI ADVISORY</span>
            </div>
            <span style={{fontSize:11,color:"#FCA5A5"}}>Oracle Security Advisory — May 2026</span>
          </div>
          <div style={{fontSize:20,fontWeight:700,color:C.white,marginBottom:6}}>Oracle Advisory Compliance Assessment</div>
          <div style={{fontSize:12,color:"#FCA5A5",maxWidth:600}}>
            Evaluates your WebLogic environment against 8 Oracle advisory security controls.
            AI-enabled threats can autonomously discover and chain vulnerabilities at machine speed.
            This scanner identifies your exposure and generates a prioritised remediation plan.
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,minWidth:200}}>
          <Btn color={C.danger} onClick={runScan} loading={scanning} C={C}>
            {scanning?"Scanning...":"Run Oracle Advisory Compliance Scan"}
          </Btn>
          {results&&<Btn color={C.blue} onClick={generateReport} loading={loadingReport} C={C}>Generate Compliance Report</Btn>}
          {report&&<Btn color={C.success} onClick={downloadPDF} C={C}>Download PDF</Btn>}
        </div>
      </div>
    </div>

    {/* Attack vectors legend */}
    {!results&&!scanning&&<div>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:12}}>Oracle Advisory Security Controls</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>
        {[
          {id:"Console Security",name:"Admin Console",icon:"🎯"},
          {id:"Patch Compliance",name:"Patch Compliance",icon:"🔧"},
          {id:"Authentication",name:"Authentication",icon:"🔐"},
          {id:"Privilege Risk",name:"Privilege Escalation",icon:"⬆️"},
          {id:"App Security",name:"Deployment Security",icon:"📦"},
          {id:"Network Audit",name:"Network Recon",icon:"🌐"},
          {id:"Audit Logs",name:"Audit Trail",icon:"📋"},
          {id:"SSL Security",name:"SSL/TLS",icon:"🔒"},
        ].map(v=><div key={v.id} style={{background:C.card2,border:"1px solid "+C.border,borderRadius:8,padding:"12px 14px"}}>
          <div style={{fontSize:11,color:C.danger,fontWeight:700,marginBottom:4}}>{v.id}</div>
          <div style={{fontSize:13,fontWeight:600,color:C.text}}>{v.name}</div>
        </div>)}
      </div>
      <div style={{textAlign:"center",padding:"20px 0"}}>
        <Btn color={C.danger} onClick={runScan} C={C}>Run Oracle Advisory Compliance Scan</Btn>
      </div>
    </div>}

    {scanning&&<div style={{textAlign:"center",padding:"60px 0"}}>
      <div style={{fontSize:18,color:C.danger,marginBottom:8}}>Running Oracle Advisory compliance scan...</div>
      <div style={{fontSize:13,color:C.muted}}>Checking 8 security controls: console exposure, patch compliance, authentication, privilege escalation, deployments, network, audit logs, SSL</div>
    </div>}

    {results&&<div>
      {/* Score cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:20}}>
        {[
          {l:"Resilience Score",v:results.resilience+"/100",c:results.resilience>70?C.green:results.resilience>40?C.warning:C.danger},
          {l:"Risk Level",v:results.riskLevel,c:results.riskLevel==="CRITICAL"||results.riskLevel==="HIGH"?C.danger:C.warning},
          {l:"Critical",v:results.summary.critical,c:results.summary.critical>0?C.danger:C.success},
          {l:"High",v:results.summary.high,c:results.summary.high>0?"#F97316":C.success},
          {l:"Medium",v:results.summary.medium,c:results.summary.medium>0?C.warning:C.success},
          {l:"Passed",v:results.summary.passed,c:C.success},
        ].map(s=><Card key={s.l} color={s.c} style={{padding:"10px 14px",textAlign:"center"}} C={C}>
          <div style={{fontSize:20,fontWeight:700,color:s.c}}>{s.v}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:3}}>{s.l}</div>
        </Card>)}
      </div>

      {/* Prioritised remediations */}
      {results.remediations?.length>0&&<div style={{background:C.card2,border:"1px solid #7F1D1D",borderRadius:8,padding:16,marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:700,color:C.danger,marginBottom:12}}>Priority Remediation Plan</div>
        {results.remediations.slice(0,5).map((r,i)=><div key={i} style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:10,paddingBottom:10,borderBottom:i<4?"1px solid "+C.border:"none"}}>
          <div style={{minWidth:24,height:24,borderRadius:"50%",background:C.danger,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C.white,flexShrink:0}}>{i+1}</div>
          <div>
            <div style={{fontSize:12,fontWeight:600,color:C.text}}>{r.check}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:2}}>{r.remediation}</div>
          </div>
          <div style={{marginLeft:"auto",fontSize:10,fontWeight:700,color:sevColor(r.severity,'FAIL'),background:sevColor(r.severity,'FAIL')+"22",padding:"2px 8px",borderRadius:10,whiteSpace:"nowrap",flexShrink:0}}>{r.severity}</div>
        </div>)}
      </div>}

      {/* Vector filter */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        {vectors.map(v=><button key={v} onClick={()=>setActiveVector(v)}
          style={{padding:"4px 12px",borderRadius:16,border:"1px solid",fontSize:11,cursor:"pointer",
            borderColor:activeVector===v?C.danger:C.border,
            background:activeVector===v?C.danger:"transparent",
            color:activeVector===v?C.white:C.muted}}>
          {v}
        </button>)}
      </div>

      {/* Findings */}
      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
        {filtered.map((f,i)=><div key={i} style={{background:C.card2,
          border:"1px solid "+(f.status==="PASS"?C.border:sevColor(f.severity,f.status)+"44"),
          borderLeft:"4px solid "+sevColor(f.severity,f.status),
          borderRadius:8,padding:"12px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
            <span style={{background:sevColor(f.severity,f.status)+"22",color:sevColor(f.severity,f.status),
              padding:"2px 10px",borderRadius:12,fontSize:10,fontWeight:700}}>
              {f.status==="PASS"?"PASS":f.severity}
            </span>
            <span style={{fontSize:10,color:C.danger,fontWeight:600}}>{f.vector}</span>
            <span style={{fontSize:10,color:C.muted}}>{f.status}</span>
          </div>
          <div style={{fontSize:13,fontWeight:600,color:C.text,marginBottom:4}}>{f.check}</div>
          <div style={{fontSize:12,color:C.muted,marginBottom:f.remediation?6:0}}>{f.detail}</div>
          {f.remediation&&<div style={{fontSize:12,color:C.teal}}>Recommended Fix: {f.remediation}</div>}
        </div>)}
      </div>

      {/* AI Report */}
      {report&&<div style={{background:C.card2,border:"1px solid "+C.border,borderRadius:8,padding:20}}>
        <div style={{fontSize:15,fontWeight:700,color:C.danger,marginBottom:12}}>AI Oracle Advisory Compliance Report</div>
        <div style={{fontSize:13,color:C.muted,whiteSpace:"pre-wrap",lineHeight:1.7}}>{report}</div>
      </div>}
    </div>}
  </div>;
}


function ApprovalsTab({C,approvalList,user,record,addToast,realMode,loadRealServers}) {
  const [localTerm,setLocalTerm]=useState(["[INFO] Approval console ready..."]);
  const canApprove=user.role==="manager"||user.role==="approver";
  const approve=async(item)=>{
    update(ref(db,"approvals/"+item.id),{status:"APPROVED",approvedBy:user.name,approvedAt:nowStr()});
    push(ref(db,"auditLogs"),{action:"APPROVED: "+item.operation+" on "+item.target,user:user.name,time:nowStr()});
    record("OP_APPROVE",{operation:item.operation,target:item.target});
    setLocalTerm(p=>[...p,"[OK] APPROVED by "+user.name,"[INFO] Executing "+item.operation+" on "+item.target+"..."]);
    addToast("Approved",item.operation+" on "+item.target,C.success,"OK");
    const proxyUrl="http://localhost:3001";
    const op=(item.operation||"").toLowerCase();
    const target=item.target||"";
    try {
      let url="";
      let body={reason:item.reason||"Approved by manager"};
      // Determine endpoint based on operation type
      if(op==="deploy") {
        url=proxyUrl+"/api/deployments/deploy";
        body={...body,appName:target,sourcePath:item.sourcePath||"/tmp/"+target+".war",targets:item.targets||["AdminServer"]};
      } else if(op==="undeploy"||op==="stop"&&item.resourceType==="deployment") {
        url=proxyUrl+"/api/deployments/"+target+"/undeploy";
      } else if(op==="redeploy") {
        url=proxyUrl+"/api/deployments/"+target+"/redeploy";
        body={...body,sourcePath:item.sourcePath};
      } else {
        // Server operations: start, stop, restart
        url=proxyUrl+"/api/servers/"+target+"/"+op;
      }
      setLocalTerm(p=>[...p,"[INFO] POST "+url]);
      const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      const data=await response.json();
      if(data.success) {
        setLocalTerm(p=>[...p,"[OK] "+op+" executed on "+target]);
        addToast("Executed",op+" on "+target,C.success,"OK");
        update(ref(db,"approvals/"+item.id),{executedAt:nowStr(),executionStatus:"SUCCESS"});
        if(loadRealServers) setTimeout(()=>loadRealServers(),5000);
      } else {
        setLocalTerm(p=>[...p,"[ERR] "+data.error]);
        addToast("Failed",data.error,C.danger,"ERR");
        update(ref(db,"approvals/"+item.id),{executedAt:nowStr(),executionStatus:"FAILED"});
      }
    } catch(e) {
      setLocalTerm(p=>[...p,"[ERR] "+e.message]);
      addToast("Error",e.message,C.danger,"ERR");
      update(ref(db,"approvals/"+item.id),{executedAt:nowStr(),executionStatus:"FAILED"});
    }
  };
  const reject=(item)=>{
    update(ref(db,"approvals/"+item.id),{status:"REJECTED",rejectedBy:user.name,rejectedAt:nowStr()});
    push(ref(db,"auditLogs"),{action:"REJECTED: "+item.operation+" on "+item.target,user:user.name,time:nowStr()});
    record("OP_REJECT",{operation:item.operation,target:item.target});
    setLocalTerm(p=>[...p,"[WARN] REJECTED by "+user.name]);
    addToast("Rejected",item.target,C.danger,"");
  };
  const pending=(approvalList||[]).filter(a=>a.status==="PENDING");
  const history=(approvalList||[]).filter(a=>a.status!=="PENDING");
  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>Change Approvals</h2>
    <p style={{color:C.muted,marginBottom:16,fontSize:12}}>Review and approve/reject pending change requests</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:14}}>
      <div>
        <div style={{fontWeight:700,marginBottom:10,fontSize:13,color:C.warning}}> Pending ({pending.length})</div>
        {pending.length===0&&<Card color={C.success} style={{textAlign:"center",padding:20,marginBottom:12}} C={C}><div style={{color:C.muted}}> No pending approvals</div></Card>}
        {pending.map(a=><Card key={a.id} color={C.warning} style={{marginBottom:10}} C={C}>
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
              <span style={{fontFamily:"monospace",fontWeight:800,fontSize:16,color:C.warning}}>{a.operation}</span>
              <Badge text={a.target} color={C.blue}/>
              <Badge text={a.priority||"Normal"} color={C.blue}/>
            </div>
            <p style={{color:C.muted,fontSize:12,margin:"0 0 5px"}}>{a.reason}</p>
            {a.ticket&&<div style={{fontSize:11,color:C.cyan}}> Ticket: {a.ticket}</div>}
            <div style={{fontSize:11,color:C.muted}}>By <strong style={{color:C.text}}>{a.requestedBy||a.user}</strong> · {a.time}</div>
          </div>
          {canApprove&&a.requestedBy!==user.name&&<div style={{display:"flex",gap:10}}>
            <Btn color={C.success} onClick={()=>approve(a)} style={{flex:1}} C={C}> Approve & Execute</Btn>
            <Btn color={C.danger} outline onClick={()=>reject(a)} style={{flex:1}} C={C}> Reject</Btn>
          </div>}
          {a.requestedBy===user.name&&<div style={{color:"#F59E0B",fontSize:12,padding:"6px 0",textAlign:"center"}}> Pending Manager approval...</div>}
        </Card>)}
        <div style={{fontWeight:700,marginBottom:8,fontSize:13,color:C.muted,marginTop:14}}> History</div>
        {history.map(a=><div key={a.id} style={{background:C.card,border:"1px solid "+C.border,borderLeft:"3px solid "+(a.status==="APPROVED"?C.success:C.danger),borderRadius:4,padding:"9px 12px",marginBottom:6}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:700,fontSize:11,fontFamily:"monospace",color:C.text}}>{a.operation}  {a.target}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{a.requestedBy||a.user} · {a.time}</div></div>
            <Badge text={a.status} color={a.status==="APPROVED"?C.success:C.danger}/>
          </div>
        </div>)}
      </div>
      <Card color={C.success} style={{height:"fit-content",position:"sticky",top:90}} C={C}>
        <div style={{fontWeight:700,marginBottom:10,fontSize:13}}>– Console</div>
        <div style={{background:"#000",borderRadius:4,padding:14,height:320,overflowY:"auto",fontFamily:"monospace",fontSize:11,lineHeight:1.6}}>
          {localTerm.map((l,i)=><div key={i} style={{color:l.startsWith("[OK")?C.success:l.startsWith("[WARN")?C.warning:C.text}}>{l}</div>)}
        </div>
      </Card>
    </div>
  </div>;
}

//  Incidents Tab 
function IncidentsTab({C,incidentList,user,addToast,record}) {
  const [form,setForm]=useState({title:"",description:"",priority:"P2",assignee:"",affectedSystem:"",category:"Performance"});
  const [showForm,setShowForm]=useState(false);
  const [filter,setFilter]=useState("OPEN");
  const create=()=>{
    if(!form.title.trim()) return;
    push(ref(db,"incidents"),{...form,status:"OPEN",reportedBy:user.name,createdAt:nowStr(),slaBreachAt:form.priority==="P1"?"1 hour":form.priority==="P2"?"4 hours":"8 hours"});
    record("INCIDENT",{description:user.name+" created incident: "+form.title});
    setForm({title:"",description:"",priority:"P2",assignee:"",affectedSystem:"",category:"Performance"});
    setShowForm(false);
    addToast("Incident created","",C.warning,"");
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
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
        <Inp value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Incident title *" C={C}/>
        <Inp value={form.affectedSystem} onChange={e=>setForm(f=>({...f,affectedSystem:e.target.value}))} placeholder="Affected system" C={C}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:10}}>
        <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
          {["P1","P2","P3"].map(p=><option key={p}>{p}</option>)}
        </select>
        <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
          {["Performance","Availability","Security","Configuration","Other"].map(c=><option key={c}>{c}</option>)}
        </select>
        <Inp value={form.assignee} onChange={e=>setForm(f=>({...f,assignee:e.target.value}))} placeholder="Assignee" C={C}/>
      </div>
      <Inp value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description" rows={3} style={{marginBottom:12}} C={C}/>
      <Btn color={C.red} onClick={create} disabled={!form.title.trim()} C={C}> Create Incident</Btn>
    </Card>}
    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
      {["OPEN","ACKNOWLEDGED","RESOLVED","ALL"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 14px",background:filter===f?C.red:C.card2,border:"1px solid "+(filter===f?C.red:C.border),borderRadius:4,cursor:"pointer",fontSize:12,fontWeight:700,color:filter===f?"#fff":C.muted}}>{f}</button>)}
    </div>
    {filtered.length===0?<Card color={C.success} style={{textAlign:"center",padding:40}} C={C}><div style={{color:C.muted}}> No incidents found</div></Card>:filtered.map(inc=><Card key={inc.id} color={pc[inc.priority]||C.warning} style={{marginBottom:10,padding:"14px 16px"}} C={C}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <Badge text={inc.priority} color={pc[inc.priority]||C.warning}/>
          <span style={{fontWeight:700,fontSize:14,color:C.text}}>{inc.title}</span>
        </div>
        <Badge text={inc.status} color={inc.status==="OPEN"?C.danger:inc.status==="ACKNOWLEDGED"?C.warning:C.success}/>
      </div>
      <div style={{fontSize:12,color:C.muted,marginBottom:6}}>{inc.description}</div>
      <div style={{display:"flex",gap:12,fontSize:11,color:C.muted,flexWrap:"wrap"}}>
        {inc.affectedSystem&&<span>– {inc.affectedSystem}</span>}
        {inc.assignee&&<span> {inc.assignee}</span>}
        <span> {inc.createdAt}</span>
        {inc.slaBreachAt&&<span> SLA: {inc.slaBreachAt}</span>}
      </div>
      <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
        {inc.status==="OPEN"&&<button onClick={()=>update(ref(db,"incidents/"+inc.id),{status:"ACKNOWLEDGED"})} style={{padding:"4px 12px",background:C.warning+"20",border:"1px solid "+C.warning+"44",borderRadius:3,color:C.warning,fontSize:11,cursor:"pointer",fontWeight:700}}>Acknowledge</button>}
        {["OPEN","ACKNOWLEDGED"].includes(inc.status)&&<button onClick={()=>update(ref(db,"incidents/"+inc.id),{status:"RESOLVED",resolvedAt:nowStr()})} style={{padding:"4px 12px",background:C.success+"20",border:"1px solid "+C.success+"44",borderRadius:3,color:C.success,fontSize:11,cursor:"pointer",fontWeight:700}}>Resolve</button>}
      </div>
    </Card>)}
  </div>;
}

//  Feedback Tab 
function FeedbackTab({C,feedbackList,user}) {
  const [form,setForm]=useState({name:"",email:"",category:"General",rating:5,message:""});
  const [submitted,setSubmitted]=useState(false);
  const isAdmin=user.role==="admin"||user.role==="approver";
  const avgRating=feedbackList.length>0?Math.round(feedbackList.reduce((s,f)=>s+(f.rating||5),0)/feedbackList.length):0;
  const submit=()=>{
    if(!form.message.trim()) return;
    push(ref(db,"feedback"),{...form,submittedBy:user.name,submittedAt:nowStr(),timestamp:new Date().toISOString()});
    setSubmitted(true);
    setForm({name:"",email:"",category:"General",rating:5,message:""});
    setTimeout(()=>setSubmitted(false),4000);
  };
  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>Feedback</h2>
    <p style={{color:C.muted,marginBottom:16,fontSize:12}}>{isAdmin?"View all feedback":"Share your feedback"}</p>
    {isAdmin?<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[["Total",feedbackList.length,C.blue],["Avg Rating",avgRating+"",C.yellow],["This Week",feedbackList.filter(f=>(new Date()-new Date(f.timestamp||0))<7*86400000).length,C.cyan]].map(([l,v,c])=><Card key={l} color={c} style={{padding:"14px 16px"}} C={C}><div style={{fontFamily:"monospace",fontSize:22,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:C.muted,marginTop:6,textTransform:"uppercase"}}>{l}</div></Card>)}
      </div>
      <Card color={C.blue} C={C}>
        {feedbackList.length===0?<div style={{color:C.muted,textAlign:"center",padding:30}}>No feedback yet.</div>:[...feedbackList].reverse().map((f,i)=><div key={f.id||i} style={{padding:"12px 0",borderBottom:"1px solid "+C.border}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><div style={{display:"flex",gap:8,alignItems:"center"}}><Badge text={f.category||"General"} color={C.blue}/><span style={{color:C.yellow,fontWeight:700,fontSize:14}}>{"".repeat(f.rating||5)}</span></div><span style={{fontSize:10,color:C.muted}}>{f.submittedAt}</span></div>
          <div style={{fontSize:13,color:C.text,marginBottom:4,lineHeight:1.5}}>{f.message}</div>
          <div style={{fontSize:11,color:C.muted}}>By {f.name||f.submittedBy||"Anonymous"}{f.email?" · "+f.email:""}</div>
        </div>)}
      </Card>
    </div>:<Card color={C.blue} style={{maxWidth:600}} C={C}>
      <div style={{fontWeight:700,marginBottom:20,fontSize:16}}>Share Your Feedback</div>
      {submitted&&<div style={{background:C.success+"15",border:"1px solid "+C.success+"44",borderRadius:4,padding:"12px 16px",marginBottom:16,color:C.success,fontWeight:700}}> Thank you for your feedback!</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <Inp value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Your name" C={C}/>
        <Inp value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="Email (optional)" C={C}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
        <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}>{["General","Bug Report","Feature Request","Performance","UI/UX","Praise"].map(c=><option key={c}>{c}</option>)}</select>
        <div><div style={{fontSize:11,color:C.muted,marginBottom:6}}>Rating</div><div style={{display:"flex",gap:6}}>{[1,2,3,4,5].map(r=><button key={r} onClick={()=>setForm(f=>({...f,rating:r}))} style={{fontSize:22,background:"none",border:"none",cursor:"pointer",opacity:r<=form.rating?1:.3,transition:"opacity .2s"}}></button>)}</div></div>
      </div>
      <Inp value={form.message} onChange={e=>setForm(f=>({...f,message:e.target.value}))} placeholder="Your message *" rows={4} style={{marginBottom:16}} C={C}/>
      <Btn color={C.red} onClick={submit} disabled={!form.message.trim()} style={{width:"100%",padding:12,justifyContent:"center"}} C={C}> Submit Feedback</Btn>
    </Card>}
  </div>;
}

//  Activity Tab 
function ActivityTab({C,activityList,user}) {
  const [filter,setFilter]=useState("ALL");
  const [search,setSearch]=useState("");
  const now=new Date();
  const filtered=activityList.filter(a=>{
    const mType=filter==="ALL"?true:a.type===filter;
    const mSearch=search===""?true:((a.description||"")+(a.user||"")+(a.label||"")).toLowerCase().includes(search.toLowerCase());
    return mType&&mSearch;
  }).sort((a,b)=>new Date(b.timestamp||0)-new Date(a.timestamp||0));
  const exportCSV=()=>{
    const rows=[["Time","User","Role","Action","Description"],...filtered.map(a=>[a.time,a.user,a.role,a.label,(a.description||"").replace(/,/g,";")])];
    const csv=rows.map(r=>r.join(",")).join("\n");
    const url=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));
    const l=document.createElement("a");l.href=url;l.download="activity_"+new Date().toISOString().slice(0,10)+".csv";l.click();
  };
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <div><h2 style={{fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>Activity Log</h2><p style={{color:C.muted,margin:0,fontSize:12}}>{activityList.length} total events</p></div>
      <button onClick={exportCSV} style={{padding:"8px 16px",background:C.success+"20",border:"1px solid "+C.success+"44",borderRadius:4,color:C.success,fontWeight:700,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}> Export CSV</button>
    </div>
    <div style={{background:C.card,border:"1px solid "+C.border,borderRadius:4,padding:"12px 14px",marginBottom:14,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder=" Search..." style={{padding:"7px 12px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:12,outline:"none",fontFamily:"inherit",minWidth:160}}/>
      <select value={filter} onChange={e=>setFilter(e.target.value)} style={{padding:"7px 10px",background:C.bg,border:"1px solid "+C.border,borderRadius:4,color:C.text,fontSize:12,outline:"none",fontFamily:"inherit"}}><option value="ALL">All Actions</option>{Object.entries(AT).map(e=><option key={e[0]} value={e[0]}>{e[1].icon} {e[1].label}</option>)}</select>
      <span style={{fontSize:11,color:C.muted,marginLeft:"auto"}}>{filtered.length} records</span>
    </div>
    {filtered.length===0?<Card color={C.blue} style={{textAlign:"center",padding:40}} C={C}><div style={{color:C.muted}}>No activity recorded yet.</div></Card>:<div style={{position:"relative"}}>
      <div style={{position:"absolute",left:19,top:0,bottom:0,width:2,background:C.border}}/>
      {filtered.map(a=><div key={a.id} style={{display:"flex",gap:12,marginBottom:8,position:"relative",zIndex:1}}>
        <div style={{width:38,height:38,borderRadius:"50%",background:C.card,border:"2px solid "+(a.color||C.blue),display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>{a.icon||""}</div>
        <div style={{flex:1,background:C.card,border:"1px solid "+C.border,borderRadius:4,padding:"10px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:5}}>
            <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:12,color:a.color||C.blue}}>{a.label}</span><Badge text={a.role} color={C.purple}/><span style={{fontWeight:600,fontSize:12,color:C.text}}>{a.user}</span></div>
            <span style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{a.time}</span>
          </div>
          {a.description&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{a.description}</div>}
        </div>
      </div>)}
    </div>}
  </div>;
}

//  Audit Tab 
function AuditTab({C,auditList}) {
  return <div>
    <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>Audit Log</h2>
    <p style={{color:C.muted,marginBottom:16,fontSize:12}}>Immutable operations record · {auditList.length} entries</p>
    {auditList.length===0?<Card color={C.blue} style={{textAlign:"center",padding:40}} C={C}><div style={{color:C.muted}}>No records yet.</div></Card>:<div style={{display:"flex",flexDirection:"column",gap:6}}>
      {[...auditList].reverse().map((a,i)=><Card key={a.id} color={a.action?.includes("APPROVED")?C.success:a.action?.includes("REJECTED")?C.danger:a.action?.includes("DEPLOYED")?C.blue:C.red} style={{padding:"10px 14px"}} C={C}>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.bg,border:"1px solid "+C.border,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{a.action?.includes("APPROVED")?"":a.action?.includes("REJECTED")?"":a.action?.includes("DEPLOYED")?"":""}</div>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,fontFamily:"monospace",color:C.text}}>{a.action}</div><div style={{color:C.muted,fontSize:10,marginTop:2}}>by {a.user} · {a.time}</div></div>
          <div style={{fontFamily:"monospace",fontSize:10,color:C.dim}}>#{auditList.length-i}</div>
        </div>
      </Card>)}
    </div>}
  </div>;
}
