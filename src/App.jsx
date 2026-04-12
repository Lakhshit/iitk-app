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
  bg:"#060910",card:"#0a0f1a",card2:"#0f1520",border:"#1a2540",
  red:"#C74634",redD:"#8B1A10",blue:"#1e90ff",cyan:"#00d4ff",
  green:"#00e676",orange:"#ff9100",yellow:"#ffd600",purple:"#d500f9",teal:"#1de9b6",
  text:"#e8eef8",muted:"#4a6080",dim:"#2a3a50",
  danger:"#ff1744",warning:"#ff9100",success:"#00e676",info:"#00d4ff",
};
const G = {
  red:"linear-gradient(135deg,#C74634,#8B1A10)",
  blue:"linear-gradient(135deg,#1e90ff,#00d4ff)",
  green:"linear-gradient(135deg,#00e676,#00a152)",
  orange:"linear-gradient(135deg,#ff9100,#C74634)",
  purple:"linear-gradient(135deg,#d500f9,#1e90ff)",
  teal:"linear-gradient(135deg,#1de9b6,#00d4ff)",
  header:"linear-gradient(135deg,#0a0f1a 0%,#0f1a2e 100%)",
};

// ── Server seed data (metrics drift live) ────────────────────
const SEED = [
  {id:"wls1",name:"WLS-PROD-01",env:"Production",host:"prod-wls-01.gscoci.in",port:7001,cpu:42,mem:68,threads:120,maxThreads:200,jvmHeap:72,gcTime:12,datasources:4,deployments:8,version:"14.1.1.0",uptimeSecs:3934200},
  {id:"wls2",name:"WLS-PROD-02",env:"Production",host:"prod-wls-02.gscoci.in",port:7001,cpu:38,mem:61,threads:98,maxThreads:200,jvmHeap:65,gcTime:8,datasources:4,deployments:8,version:"14.1.1.0",uptimeSecs:3934200},
  {id:"wls3",name:"WLS-PROD-03",env:"Production",host:"prod-wls-03.gscoci.in",port:7001,cpu:78,mem:87,threads:185,maxThreads:200,jvmHeap:89,gcTime:45,datasources:4,deployments:8,version:"14.1.1.0",uptimeSecs:1039800},
  {id:"wls4",name:"WLS-PROD-04",env:"Production",host:"prod-wls-04.gscoci.in",port:7001,cpu:94,mem:96,threads:198,maxThreads:200,jvmHeap:98,gcTime:120,datasources:2,deployments:8,version:"14.1.1.0",uptimeSecs:177900},
  {id:"wls5",name:"WLS-UAT-01",env:"UAT",host:"uat-wls-01.gscoci.in",port:7001,cpu:25,mem:45,threads:60,maxThreads:150,jvmHeap:50,gcTime:5,datasources:3,deployments:5,version:"14.1.1.0",uptimeSecs:467200},
  {id:"wls6",name:"WLS-DR-01",env:"DR",host:"dr-wls-01.gscoci.in",port:7001,cpu:5,mem:20,threads:10,maxThreads:200,jvmHeap:30,gcTime:2,datasources:4,deployments:8,version:"14.1.1.0",uptimeSecs:7776000},
  {id:"wls7",name:"WLS-ADMIN",env:"Production",host:"prod-wls-admin.gscoci.in",port:7001,cpu:15,mem:35,threads:40,maxThreads:100,jvmHeap:40,gcTime:3,datasources:2,deployments:3,version:"14.1.1.0",uptimeSecs:3934200},
];

const deriveStatus = (s) => {
  if(s.operationStatus) return s.operationStatus;
  if(s.cpu>=92||s.jvmHeap>=95||s.mem>=95) return "CRITICAL";
  if(s.cpu>=75||s.jvmHeap>=82||s.mem>=82||s.threads/s.maxThreads>=0.88) return "WARNING";
  if(s.env==="DR") return "STANDBY";
  return "RUNNING";
};

const fmtUptime = (secs) => {
  const d=Math.floor(secs/86400),h=Math.floor((secs%86400)/3600),m=Math.floor((secs%3600)/60);
  return `${d}d ${h}h ${m}m`;
};

const statusColor = (s) => ({RUNNING:C.green,WARNING:C.warning,CRITICAL:C.danger,STOPPED:C.muted,STANDBY:C.cyan,STARTING:C.blue,STOPPING:C.orange,RESTARTING:C.purple}[s]||C.muted);
const severityColor = (s) => ({CRITICAL:C.danger,WARNING:C.warning,INFO:C.info,LOW:C.green}[s]||C.muted);

const PASSWORDS = {admin:"WLS@ADMIN",operator:"WLS@OPS",approver:"WLS@APPR"};
const ROLES = {admin:"System Admin",operator:"OPS Engineer",approver:"Change Approver",viewer:"Viewer"};
const now = () => new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"});

// ── UI helpers ───────────────────────────────────────────────
const Pulse = ({color,size=10}) => (
  <span style={{position:"relative",display:"inline-block",width:size,height:size,flexShrink:0}}>
    <style>{`@keyframes pr{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.5);opacity:0}}`}</style>
    <span style={{position:"absolute",inset:0,borderRadius:"50%",background:color,opacity:.4,animation:"pr 1.5s ease-out infinite"}}/>
    <span style={{position:"absolute",inset:0,borderRadius:"50%",background:color}}/>
  </span>
);

const Badge = ({text,color,dot}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:`${color}20`,color,border:`1px solid ${color}40`,whiteSpace:"nowrap"}}>
    {dot&&<span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>}{text}
  </span>
);

const GlowCard = ({children,color=C.blue,style={},onClick}) => (
  <div onClick={onClick} style={{background:C.card,border:`1px solid ${color}33`,borderRadius:16,padding:20,boxShadow:`0 0 20px ${color}12`,position:"relative",overflow:"hidden",cursor:onClick?"pointer":"default",transition:"all 0.2s",...style}}
    onMouseEnter={e=>onClick&&(e.currentTarget.style.boxShadow=`0 0 40px ${color}28`)}
    onMouseLeave={e=>onClick&&(e.currentTarget.style.boxShadow=`0 0 20px ${color}12`)}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color},transparent)`}}/>
    {children}
  </div>
);

const MetricBar = ({value,max=100,label,unit="%",warn=70,crit=90}) => {
  const pct=Math.min(100,(value/max)*100);
  const color=pct>=crit?C.danger:pct>=warn?C.warning:C.success;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11}}>
        <span style={{color:C.muted}}>{label}</span>
        <span style={{color,fontWeight:700}}>{value}{unit}</span>
      </div>
      <div style={{height:6,background:C.dim,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3,transition:"width 0.8s,background 0.4s",boxShadow:`0 0 8px ${color}60`}}/>
      </div>
    </div>
  );
};

const Btn = ({children,grad,color,onClick,style={},sm,disabled}) => (
  <button onClick={onClick} disabled={disabled} style={{padding:sm?"6px 14px":"10px 22px",background:disabled?C.dim:grad||`${color||C.blue}22`,border:`1px solid ${disabled?C.dim:color||C.blue}44`,borderRadius:10,color:disabled?C.muted:grad?"#fff":color||C.blue,fontWeight:700,fontSize:sm?12:13,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",transition:"all .15s",opacity:disabled?.5:1,boxShadow:grad&&!disabled?`0 4px 20px ${color||C.blue}40`:"none",...style}}>{children}</button>
);

const Inp = ({value,onChange,placeholder,type="text",rows,style={}}) => {
  const base={width:"100%",padding:"10px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",...style};
  return rows?<textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{...base,resize:"vertical"}}/>:<input type={type} value={value} onChange={onChange} placeholder={placeholder} style={base}/>;
};

const Sel = ({value,onChange,children,style={}}) => (
  <select value={value} onChange={onChange} style={{width:"100%",padding:"10px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",...style}}>{children}</select>
);

const Terminal = ({lines,height=220}) => {
  const r=useRef(null);
  useEffect(()=>{if(r.current)r.current.scrollTop=r.current.scrollHeight;},[lines]);
  return (
    <div ref={r} style={{background:"#000",borderRadius:10,padding:14,height,overflowY:"auto",fontFamily:"'JetBrains Mono',monospace",fontSize:11,border:`1px solid ${C.green}33`,lineHeight:1.6}}>
      {lines.map((l,i)=><div key={i} style={{color:l.startsWith("[ERR")?C.danger:l.startsWith("[WARN")?C.warning:l.startsWith("[OK")||l.startsWith("[SUC")?C.success:l.startsWith("[INFO")?C.cyan:C.text}}>{l}</div>)}
      <div style={{display:"inline-block",width:8,height:12,background:C.green,animation:"blink 1s step-end infinite",verticalAlign:"middle"}}/>
    </div>
  );
};

function useDB(path){
  const [data,setData]=useState(null);
  useEffect(()=>{const r=ref(db,path);const u=onValue(r,s=>setData(s.val()));return()=>u();},[path]);
  return data;
}

// ── Approval Modal ───────────────────────────────────────────
function ApprovalModal({op,server,onConfirm,onCancel,user}){
  const [reason,setReason]=useState("");
  const [ticket,setTicket]=useState("");
  const [priority,setPriority]=useState("Normal");
  const isEmergency = priority==="Emergency";

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <div style={{background:C.card,border:`1px solid ${isEmergency?C.danger:C.warning}55`,borderRadius:20,padding:32,width:"100%",maxWidth:520,boxShadow:`0 0 60px ${isEmergency?C.danger:C.warning}30`}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:48,marginBottom:12}}>{op==="RESTART"?"🔄":op==="STOP"?"⏹️":op==="START"?"▶️":"⚡"}</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 6px"}}>{op} Request</h2>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
            <Badge text={server} color={C.blue}/>
            {user.role!=="admin"&&<Badge text="REQUIRES APPROVAL" color={C.warning}/>}
            {user.role==="admin"&&<Badge text="DIRECT EXECUTION" color={C.green}/>}
          </div>
        </div>

        {user.role!=="admin"&&(
          <div style={{background:`${C.warning}15`,border:`1px solid ${C.warning}33`,borderRadius:12,padding:14,marginBottom:20,fontSize:12,color:C.warning}}>
            ⚠️ This operation will be sent to <strong>Change Approvers</strong> before execution. Execution only happens after approval.
          </div>
        )}

        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Priority Level</div>
          <div style={{display:"flex",gap:8}}>
            {["Low","Normal","High","Emergency"].map(p=>(
              <button key={p} onClick={()=>setPriority(p)} style={{flex:1,padding:"8px 4px",background:priority===p?`${p==="Emergency"?C.danger:p==="High"?C.warning:C.blue}25`:C.card2,border:`1px solid ${priority===p?p==="Emergency"?C.danger:C.blue:C.border}`,borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,color:priority===p?p==="Emergency"?C.danger:C.blue:C.muted}}>{p}</button>
            ))}
          </div>
        </div>

        <div style={{marginBottom:14}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Change Ticket # (optional)</div>
          <Inp value={ticket} onChange={e=>setTicket(e.target.value)} placeholder="e.g. CHG-2024-1234"/>
        </div>

        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Reason / Justification *</div>
          <Inp value={reason} onChange={e=>setReason(e.target.value)} placeholder="Why is this operation needed? What is the expected impact?" rows={3}/>
        </div>

        <div style={{display:"flex",gap:12}}>
          <button onClick={onCancel} style={{flex:1,padding:12,background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <Btn grad={user.role==="admin"?G.green:G.orange} color={user.role==="admin"?C.green:C.orange} onClick={()=>reason.trim()&&onConfirm({reason,ticket,priority})} disabled={!reason.trim()} style={{flex:2,padding:12}}>
            {user.role==="admin"?"⚡ Execute Now":"📤 Submit for Approval"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ── LOGIN ────────────────────────────────────────────────────
function Login({onLogin}){
  const [role,setRole]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [time,setTime]=useState(new Date());
  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);

  const login=()=>{
    if(!role)return setErr("Select a role.");
    if(role==="viewer")return onLogin({name:"Viewer",role:"viewer",initials:"VW"});
    if(pass!==PASSWORDS[role])return setErr("Incorrect password.");
    const names={admin:"System Admin",operator:"OPS Engineer",approver:"Change Approver"};
    onLogin({name:names[role],role,initials:role.slice(0,2).toUpperCase()});
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",fontFamily:"'DM Sans',sans-serif",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        *{box-sizing:border-box}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pr{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.5);opacity:0}}
        @keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scanline{0%{top:-10%}100%{top:110%}}
      `}</style>
      <div style={{position:"fixed",inset:0,overflow:"hidden",zIndex:0}}>
        {[["#C74634","8%","15%","400px"],["#1e90ff","75%","65%","350px"],["#00d4ff","45%","85%","250px"]].map(([c,l,t,s],i)=>(
          <div key={i} style={{position:"absolute",left:l,top:t,width:s,height:s,background:c,borderRadius:"50%",filter:"blur(120px)",opacity:.06}}/>
        ))}
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.border}22 1px,transparent 1px),linear-gradient(90deg,${C.border}22 1px,transparent 1px)`,backgroundSize:"40px 40px",opacity:.4}}/>
      </div>

      {/* Left Panel */}
      <div style={{width:440,background:"linear-gradient(180deg,#0a0f1a,#060910)",borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:40,position:"relative",zIndex:1,flexShrink:0}}>
        <div style={{marginBottom:32}}>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:6}}>
            <div style={{width:50,height:50,background:G.red,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:`0 0 30px ${C.red}60`}}>⚡</div>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:C.text}}>WebLogic Control</div>
              <div style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:"uppercase"}}>GSC · Oracle Cloud Infrastructure</div>
            </div>
          </div>
        </div>

        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 18px",marginBottom:20}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:6,letterSpacing:1}}>SYSTEM TIME (IST)</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:26,fontWeight:700,color:C.cyan}}>{time.toLocaleTimeString()}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:4}}>{time.toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
        </div>

        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"14px 18px",marginBottom:20}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:12,letterSpacing:1}}>PRODUCTION SERVER STATUS</div>
          {SEED.filter(s=>s.env==="Production").map(s=>{
            const st=deriveStatus(s);
            return (
              <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                <Pulse color={statusColor(st)} size={7}/>
                <span style={{flex:1,fontSize:12,color:C.text,fontFamily:"monospace"}}>{s.name}</span>
                <Badge text={st} color={statusColor(st)}/>
              </div>
            );
          })}
        </div>

        <div style={{background:`${C.danger}12`,border:`1px solid ${C.danger}30`,borderRadius:14,padding:"12px 18px"}}>
          <div style={{fontSize:10,color:C.danger,marginBottom:8,fontWeight:700,letterSpacing:1}}>⚠ ACTIVE ALERTS</div>
          <div style={{fontSize:12,color:C.text,marginBottom:4}}><span style={{color:C.danger}}>●</span> WLS-PROD-04: JVM Heap 98%</div>
          <div style={{fontSize:12,color:C.text,marginBottom:4}}><span style={{color:C.danger}}>●</span> WLS-PROD-04: CPU 94%</div>
          <div style={{fontSize:12,color:C.text}}><span style={{color:C.warning}}>●</span> WLS-PROD-03: Thread pool 92%</div>
        </div>
      </div>

      {/* Right Panel */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:48,position:"relative",zIndex:1}}>
        <div style={{width:"100%",maxWidth:400}}>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:30,fontWeight:800,color:C.text,margin:"0 0 6px"}}>Secure Access</h1>
          <p style={{color:C.muted,margin:"0 0 32px",fontSize:14}}>WebLogic Production Management Platform</p>
          <GlowCard color={C.blue} style={{padding:28}}>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:10,letterSpacing:1,textTransform:"uppercase"}}>Select Role</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["admin","🛡️","System Admin","Full control + direct exec"],["operator","⚙️","OPS Engineer","Operations + submit requests"],["approver","✅","Change Approver","Review & approve ops"],["viewer","👁️","Viewer","Read only"]].map(([r,icon,label,sub])=>(
                  <button key={r} onClick={()=>{setRole(r);setErr("");setPass("");}} style={{padding:"14px 10px",background:role===r?`${C.blue}20`:C.card2,border:`1px solid ${role===r?C.blue:C.border}`,borderRadius:12,cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                    <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
                    <div style={{fontWeight:700,fontSize:12,color:role===r?C.blue:C.text}}>{label}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2}}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>
            {role&&role!=="viewer"&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:8,letterSpacing:1,textTransform:"uppercase"}}>Password</div>
                <Inp value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} placeholder="Enter password" type="password"/>
                <div style={{fontSize:10,color:C.dim,marginTop:6,fontFamily:"monospace"}}>Admin:WLS@ADMIN · Ops:WLS@OPS · Approver:WLS@APPR</div>
              </div>
            )}
            {err&&<div style={{color:C.danger,fontSize:12,marginBottom:12}}>⚠ {err}</div>}
            <Btn grad={G.red} color={C.red} onClick={login} style={{width:"100%",padding:13}}>🔐 Authenticate & Enter</Btn>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
export default function App(){
  const [user,setUser]=useState(null);
  if(!user)return <Login onLogin={setUser}/>;
  return <MainApp user={user} onLogout={()=>setUser(null)}/>;
}

function MainApp({user,onLogout}){
  const [tab,setTab]=useState("dashboard");
  const [servers,setServers]=useState(()=>SEED.map(s=>({...s,status:deriveStatus(s)})));
  const [issues,setIssues]=useState([
    {id:"i1",server:"WLS-PROD-04",severity:"CRITICAL",type:"Memory Leak",description:"JVM Heap at 98% — OutOfMemoryError imminent",detected:"2 min ago",autoHeal:true,status:"HEALING"},
    {id:"i2",server:"WLS-PROD-03",severity:"WARNING",type:"Thread Starvation",description:"Thread pool at 92.5% — 185/200 threads active",detected:"15 min ago",autoHeal:true,status:"DETECTED"},
    {id:"i3",server:"WLS-PROD-03",severity:"WARNING",type:"High CPU",description:"CPU at 78% — above 75% threshold",detected:"20 min ago",autoHeal:false,status:"OPEN"},
    {id:"i4",server:"WLS-PROD-04",severity:"CRITICAL",type:"GC Overhead",description:"GC time 120ms — app performance severely degraded",detected:"5 min ago",autoHeal:true,status:"DETECTED"},
  ]);

  const approvalsDB = useDB("approvals");
  const auditDB = useDB("auditLogs");
  const approvalList = approvalsDB?Object.entries(approvalsDB).map(([k,v])=>({id:k,...v})):[];
  const auditList = auditDB?Object.entries(auditDB).map(([k,v])=>({id:k,...v})):[];

  // ── Live metric drift ──────────────────────────────────────
  useEffect(()=>{
    const t=setInterval(()=>{
      setServers(prev=>prev.map(s=>{
        if(["STOPPED","STANDBY","STARTING","STOPPING","RESTARTING"].includes(s.status))
          return {...s,uptimeSecs:s.status==="RUNNING"?s.uptimeSecs+2:s.uptimeSecs};
        const drift=(v,range,min,max)=>Math.min(max,Math.max(min,v+(Math.random()-.5)*range));
        const cpu=Math.round(drift(s.cpu,s.env==="Production"?5:3,2,99));
        const mem=Math.round(drift(s.mem,2,10,99));
        const jvmHeap=Math.round(drift(s.jvmHeap,3,10,99));
        const gcTime=Math.round(drift(s.gcTime,s.jvmHeap>85?10:3,1,250));
        const threads=Math.round(drift(s.threads,5,1,s.maxThreads));
        const updated={...s,cpu,mem,jvmHeap,gcTime,threads,uptimeSecs:s.uptimeSecs+2};
        updated.status=deriveStatus(updated);
        return updated;
      }));

      // Auto-detect new issues from metrics
      setServers(curr=>{
        curr.forEach(s=>{
          if(s.jvmHeap>=95) setIssues(prev=>{
            if(prev.some(i=>i.server===s.name&&i.type==="Memory Leak"&&i.status!=="RESOLVED"))return prev;
            return [...prev,{id:`auto_${Date.now()}`,server:s.name,severity:"CRITICAL",type:"Memory Leak",description:`JVM Heap at ${s.jvmHeap}% — OutOfMemoryError risk`,detected:"just now",autoHeal:true,status:"DETECTED"}];
          });
          if(s.cpu>=90) setIssues(prev=>{
            if(prev.some(i=>i.server===s.name&&i.type==="High CPU"&&i.status!=="RESOLVED"))return prev;
            return [...prev,{id:`cpu_${Date.now()}`,server:s.name,severity:"CRITICAL",type:"High CPU",description:`CPU at ${s.cpu}% — critical threshold exceeded`,detected:"just now",autoHeal:false,status:"DETECTED"}];
          });
        });
        return curr;
      });
    },2000);
    return()=>clearInterval(t);
  },[]);

  // ── Auto-heal ticker ───────────────────────────────────────
  useEffect(()=>{
    const t=setInterval(()=>{
      setIssues(prev=>prev.map(i=>{
        if(i.autoHeal&&i.status==="DETECTED")return{...i,status:"HEALING"};
        if(i.autoHeal&&i.status==="HEALING"&&Math.random()>.65)return{...i,status:"RESOLVED"};
        return i;
      }));
    },4000);
    return()=>clearInterval(t);
  },[]);

  // ── Operation execution (called after approval or direct) ──
  const executeOperation = (serverId,op,termSetter)=>{
    const opSteps={
      RESTART:[
        {delay:0,line:"[INFO] Initiating graceful RESTART sequence..."},
        {delay:800,line:"[INFO] Sending shutdown signal to server..."},
        {delay:1600,line:"[WARN] Draining active HTTP connections..."},
        {delay:2400,line:"[INFO] Waiting for in-flight transactions..."},
        {delay:3200,line:"[OK] All transactions complete. Stopping JVM..."},
        {delay:4000,line:"[INFO] Server process terminated."},
        {delay:4800,line:"[INFO] Starting WebLogic Server process..."},
        {delay:5600,line:"[INFO] Loading domain configuration..."},
        {delay:6400,line:"[INFO] Connecting to datasources..."},
        {delay:7200,line:"[OK] Datasources connected (4/4)"},
        {delay:8000,line:"[INFO] Deploying applications (8 apps)..."},
        {delay:9000,line:"[OK] All applications deployed successfully"},
        {delay:9800,line:"[SUCCESS] ✓ Server is RUNNING — restart complete!"},
      ],
      STOP:[
        {delay:0,line:"[INFO] Initiating graceful STOP..."},
        {delay:800,line:"[WARN] Draining connections..."},
        {delay:1800,line:"[INFO] Shutting down applications..."},
        {delay:2800,line:"[OK] Applications stopped"},
        {delay:3600,line:"[INFO] Closing datasource connections..."},
        {delay:4400,line:"[SUCCESS] ✓ Server STOPPED successfully"},
      ],
      START:[
        {delay:0,line:"[INFO] Starting WebLogic Server..."},
        {delay:800,line:"[INFO] Loading NodeManager..."},
        {delay:1600,line:"[INFO] Starting server process..."},
        {delay:2600,line:"[INFO] Loading domain config..."},
        {delay:3400,line:"[INFO] Connecting datasources..."},
        {delay:4200,line:"[OK] 4/4 datasources connected"},
        {delay:5000,line:"[INFO] Deploying applications..."},
        {delay:6000,line:"[SUCCESS] ✓ Server is RUNNING!"},
      ],
    };

    const steps=opSteps[op]||[{delay:0,line:`[INFO] Executing ${op}...`},{delay:1000,line:"[SUCCESS] Done"}];
    const statusMap={RESTART:["STOPPING","STOPPED","STARTING","RUNNING"],STOP:["STOPPING","STOPPED"],START:["STARTING","RUNNING"]};
    const statuses=statusMap[op]||[];

    // Animate server status
    statuses.forEach((st,i)=>{
      setTimeout(()=>{
        setServers(prev=>prev.map(s=>s.id===serverId?{...s,status:st,operationStatus:st==="RUNNING"?null:st}:s));
      },i*(op==="RESTART"?3500:1500));
    });

    steps.forEach(({delay,line})=>setTimeout(()=>termSetter(prev=>[...prev,line]),delay));
  };

  const pendingApprovals = approvalList.filter(a=>a.status==="PENDING").length;
  const criticalCount = servers.filter(s=>s.status==="CRITICAL").length;
  const activeIssues = issues.filter(i=>i.status!=="RESOLVED").length;

  const TABS = [
    {id:"dashboard",label:"📊 Dashboard"},
    {id:"servers",label:"🖥️ Servers"},
    {id:"operations",label:"⚙️ Operations"},
    {id:"issues",label:`🔥 Issues${activeIssues>0?` (${activeIssues})`:""}` },
    {id:"autohealing",label:"🔄 Auto-Heal"},
    {id:"approvals",label:`✅ Approvals${pendingApprovals>0?` (${pendingApprovals})`:""}` },
    {id:"automation",label:"🤖 Automation"},
    {id:"audit",label:"📋 Audit Log"},
  ].filter(t=>{
    if(user.role==="viewer")return["dashboard","servers","issues","audit"].includes(t.id);
    if(user.role==="approver")return["dashboard","approvals","audit"].includes(t.id);
    return true;
  });

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.text}}>
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}input,textarea,select,button{font-family:'DM Sans',sans-serif}@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes pr{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.5);opacity:0}}`}</style>

      <header style={{background:G.header,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 20px rgba(0,0,0,.5)"}}>
        <div style={{maxWidth:1600,margin:"0 auto",padding:"0 20px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:56}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:36,height:36,background:G.red,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:`0 0 20px ${C.red}60`}}>⚡</div>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:800,color:C.text,lineHeight:1}}>WebLogic Control Platform</div>
                <div style={{fontSize:9,color:C.muted,letterSpacing:2,textTransform:"uppercase"}}>GSC · Oracle Cloud Infrastructure</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {criticalCount>0&&<div style={{display:"flex",alignItems:"center",gap:6,background:`${C.danger}20`,border:`1px solid ${C.danger}44`,borderRadius:20,padding:"4px 12px"}}><Pulse color={C.danger} size={7}/><span style={{fontSize:12,fontWeight:700,color:C.danger}}>{criticalCount} CRITICAL</span></div>}
              {pendingApprovals>0&&<div style={{background:`${C.warning}20`,border:`1px solid ${C.warning}44`,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:700,color:C.warning}}>{pendingApprovals} Pending</div>}
              <div style={{display:"flex",alignItems:"center",gap:8,background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"5px 12px"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:G.red,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>{user.initials}</div>
                <span style={{fontSize:12,fontWeight:600}}>{user.name}</span>
                <Badge text={ROLES[user.role]} color={C.blue}/>
              </div>
              <Btn color={C.red} onClick={onLogout} sm>Sign Out</Btn>
            </div>
          </div>
        </div>
        <div style={{maxWidth:1600,margin:"0 auto",padding:"0 20px",display:"flex",overflowX:"auto",borderTop:`1px solid ${C.border}`}}>
          {TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"9px 16px",background:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${C.red}`:"2px solid transparent",color:tab===t.id?C.red:C.muted,cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",transition:"all .2s"}}>{t.label}</button>)}
        </div>
      </header>

      <main style={{maxWidth:1600,margin:"0 auto",padding:"24px 20px",animation:"slideIn .3s ease"}}>
        {tab==="dashboard"&&<DashboardTab servers={servers} issues={issues} approvalList={approvalList} auditList={auditList}/>}
        {tab==="servers"&&<ServersTab servers={servers} user={user} executeOperation={executeOperation}/>}
        {tab==="operations"&&<OperationsTab servers={servers} user={user} approvalList={approvalList} executeOperation={executeOperation}/>}
        {tab==="issues"&&<IssuesTab issues={issues} setIssues={setIssues} servers={servers}/>}
        {tab==="autohealing"&&<AutoHealTab servers={servers} issues={issues} user={user}/>}
        {tab==="approvals"&&<ApprovalsTab approvalList={approvalList} user={user} servers={servers} executeOperation={executeOperation}/>}
        {tab==="automation"&&<AutomationTab servers={servers}/>}
        {tab==="audit"&&<AuditTab auditList={auditList}/>}
      </main>
    </div>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────
function DashboardTab({servers,issues,approvalList,auditList}){
  const running=servers.filter(s=>s.status==="RUNNING").length;
  const critical=servers.filter(s=>s.status==="CRITICAL").length;
  const warning=servers.filter(s=>s.status==="WARNING").length;
  const activeIssues=issues.filter(i=>i.status!=="RESOLVED").length;
  const healing=issues.filter(i=>i.status==="HEALING").length;
  const liveServers=servers.filter(s=>!["STOPPED","STANDBY"].includes(s.status));
  const avgCpu=liveServers.length?Math.round(liveServers.reduce((a,s)=>a+s.cpu,0)/liveServers.length):0;
  const avgMem=liveServers.length?Math.round(liveServers.reduce((a,s)=>a+s.mem,0)/liveServers.length):0;

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>Production Overview</h2>
        <div style={{display:"flex",alignItems:"center",gap:8}}><Pulse color={C.green} size={7}/><span style={{fontSize:12,color:C.muted}}>Live · metrics update every 2 seconds</span></div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:20}}>
        {[
          {label:"RUNNING",value:running,total:servers.length,color:C.green,icon:"▶"},
          {label:"CRITICAL",value:critical,color:C.danger,icon:"🔴"},
          {label:"WARNING",value:warning,color:C.warning,icon:"⚠"},
          {label:"ACTIVE ISSUES",value:activeIssues,color:C.orange,icon:"🔥"},
          {label:"AUTO-HEALING",value:healing,color:C.cyan,icon:"🔄"},
          {label:"AVG CPU",value:`${avgCpu}%`,color:avgCpu>75?C.danger:avgCpu>60?C.warning:C.green,icon:"⚡"},
          {label:"AVG MEMORY",value:`${avgMem}%`,color:avgMem>80?C.danger:avgMem>65?C.warning:C.green,icon:"💾"},
          {label:"PENDING OPS",value:(approvalList||[]).filter(a=>a.status==="PENDING").length,color:C.purple,icon:"⏳"},
        ].map(s=>(
          <GlowCard key={s.label} color={s.color} style={{padding:"16px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:26,fontWeight:700,color:s.color,lineHeight:1}}>{s.value}{s.total?<span style={{fontSize:12,color:C.muted}}>/{s.total}</span>:""}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:5,letterSpacing:1.2}}>{s.label}</div>
              </div>
              <span style={{fontSize:18,opacity:.5}}>{s.icon}</span>
            </div>
          </GlowCard>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:18}}>
        <GlowCard color={C.blue}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:14,display:"flex",justifyContent:"space-between"}}>
            <span>🖥️ Live Server Matrix</span><span style={{fontSize:11,color:C.muted,fontWeight:400,display:"flex",alignItems:"center",gap:4}}><Pulse color={C.green} size={6}/>Live</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {servers.map(s=>(
              <div key={s.id} style={{background:C.card2,borderRadius:12,padding:12,border:`1px solid ${statusColor(s.status)}33`,transition:"border .3s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <Pulse color={statusColor(s.status)} size={7}/>
                    <span style={{fontWeight:700,fontSize:11,fontFamily:"monospace"}}>{s.name}</span>
                  </div>
                  <Badge text={s.status} color={statusColor(s.status)}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:5}}>
                  <MetricBar value={s.cpu} label="CPU" warn={70} crit={85}/>
                  <MetricBar value={s.mem} label="MEM" warn={75} crit={90}/>
                  <MetricBar value={s.jvmHeap} label="JVM" warn={80} crit={92}/>
                </div>
                {["STARTING","STOPPING","RESTARTING"].includes(s.status)&&(
                  <div style={{marginTop:8,fontSize:10,color:C.cyan,display:"flex",alignItems:"center",gap:4}}>
                    <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> {s.status}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlowCard>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <GlowCard color={C.danger}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>🔥 Active Issues</div>
            {issues.filter(i=>i.status!=="RESOLVED").length===0
              ?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"14px 0"}}>✅ All systems healthy</div>
              :issues.filter(i=>i.status!=="RESOLVED").map(i=>(
                <div key={i.id} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:11,color:severityColor(i.severity),fontFamily:"monospace"}}>{i.server}</div>
                    <div style={{fontSize:11,color:C.muted}}>{i.type}</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <Badge text={i.severity} color={severityColor(i.severity)}/>
                    {i.status==="HEALING"&&<span style={{fontSize:14,animation:"spin 1s linear infinite",display:"inline-block"}}>🔄</span>}
                  </div>
                </div>
              ))}
          </GlowCard>
          <GlowCard color={C.purple}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>📋 Recent Activity</div>
            {auditList.length===0?<div style={{color:C.muted,fontSize:12}}>No activity yet.</div>
              :[...auditList].reverse().slice(0,5).map(a=>(
                <div key={a.id} style={{padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{fontWeight:600,fontSize:11}}>{a.action}</div>
                  <div style={{color:C.muted,fontSize:10,marginTop:2}}>{a.user} · {a.time}</div>
                </div>
              ))}
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

// ── SERVERS TAB ───────────────────────────────────────────────
function ServersTab({servers,user,executeOperation}){
  const [selected,setSelected]=useState(null);
  const [modal,setModal]=useState(null);
  const [termLines,setTermLines]=useState(["[INFO] Server console ready..."]);
  const sel=selected?servers.find(s=>s.id===selected):null;
  const canOperate = user.role==="admin"||user.role==="operator";

  const handleOp=(server,op)=>setModal({server,op});

  const confirmOp=({reason,ticket,priority})=>{
    const {server,op}=modal;
    const entry={action:`${op} requested for ${server.name}`,user:user.name,server:server.name,operation:op,reason,ticket,priority,requestedBy:user.name,time:now()};
    if(user.role==="admin"){
      push(ref(db,"auditLogs"),{...entry,status:"APPROVED"});
      setTermLines(prev=>[...prev,`[INFO] Direct execution authorized by ${user.name}`,`[INFO] Starting ${op} on ${server.name}...`]);
      executeOperation(server.id,op,setTermLines);
    }else{
      push(ref(db,"approvals"),{...entry,status:"PENDING"});
      setTermLines(prev=>[...prev,`[INFO] ${op} request submitted for ${server.name}`,`[WARN] Awaiting Change Approver authorization...`,`[INFO] Notification sent to approvers`]);
    }
    setModal(null);
  };

  return (
    <div>
      {modal&&<ApprovalModal op={modal.op} server={modal.server.name} user={user} onConfirm={confirmOp} onCancel={()=>setModal(null)}/>}
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>🖥️ WebLogic Servers</h2>
      <p style={{color:C.muted,marginBottom:20,fontSize:12}}>{servers.length} servers · Metrics live · Click a server for details & operations</p>

      <div style={{display:"grid",gridTemplateColumns:sel?"1fr 380px":"1fr",gap:18}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12,alignContent:"start"}}>
          {servers.map(s=>(
            <GlowCard key={s.id} color={statusColor(s.status)} onClick={()=>setSelected(selected===s.id?null:s.id)} style={{cursor:"pointer",padding:"16px 18px",border:`1px solid ${selected===s.id?statusColor(s.status)+"66":statusColor(s.status)+"22"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <Pulse color={statusColor(s.status)} size={8}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:13}}>{s.name}</span>
                  </div>
                  <div style={{fontSize:10,color:C.muted,fontFamily:"monospace"}}>{s.host}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                  <Badge text={s.status} color={statusColor(s.status)} dot/>
                  <Badge text={s.env} color={s.env==="Production"?C.red:s.env==="UAT"?C.blue:C.teal}/>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
                {[["CPU",s.cpu+"%",s.cpu>85?C.danger:s.cpu>70?C.warning:C.green],["MEM",s.mem+"%",s.mem>90?C.danger:s.mem>75?C.warning:C.green],["JVM",s.jvmHeap+"%",s.jvmHeap>92?C.danger:s.jvmHeap>80?C.warning:C.green],["THR",s.threads,s.threads/s.maxThreads>.9?C.danger:s.threads/s.maxThreads>.75?C.warning:C.green]].map(([l,v,c])=>(
                  <div key={l} style={{background:C.bg,borderRadius:8,padding:"7px 4px",textAlign:"center"}}>
                    <div style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:c,transition:"color .3s"}}>{v}</div>
                    <div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>

              <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                <span style={{fontSize:10,color:C.muted}}>⏱ {fmtUptime(s.uptimeSecs)}</span>
                <span style={{fontSize:10,color:C.muted}}>· {s.deployments} apps · {s.datasources} DS</span>
              </div>

              {["STARTING","STOPPING","RESTARTING"].includes(s.status)&&(
                <div style={{marginTop:8,background:`${C.cyan}15`,borderRadius:8,padding:"6px 10px",fontSize:11,color:C.cyan,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> {s.status}...
                </div>
              )}
            </GlowCard>
          ))}
        </div>

        {sel&&(
          <div style={{position:"sticky",top:80,height:"fit-content",display:"flex",flexDirection:"column",gap:14}}>
            <GlowCard color={statusColor(sel.status)}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16}}>{sel.name}</div>
                  <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginTop:4}}>{sel.host}:{sel.port}</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button>
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
                <MetricBar value={sel.cpu} label="CPU Usage" warn={70} crit={85}/>
                <MetricBar value={sel.mem} label="Memory" warn={75} crit={90}/>
                <MetricBar value={sel.jvmHeap} label="JVM Heap" warn={80} crit={92}/>
                <MetricBar value={sel.gcTime} max={200} label="GC Time" warn={50} crit={100} unit="ms"/>
                <MetricBar value={sel.threads} max={sel.maxThreads} label={`Threads (/${sel.maxThreads})`} warn={75} crit={90} unit=""/>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
                {[["Uptime",fmtUptime(sel.uptimeSecs)],["Version",sel.version],["Port",sel.port],["Deployments",sel.deployments]].map(([l,v])=>(
                  <div key={l} style={{background:C.bg,borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:C.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
                    <div style={{fontSize:12,fontWeight:600,fontFamily:"monospace"}}>{v}</div>
                  </div>
                ))}
              </div>

              {canOperate&&(
                <div>
                  <div style={{fontSize:11,color:C.muted,marginBottom:10,letterSpacing:1,textTransform:"uppercase"}}>Operations</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                    {[["RESTART","🔄",C.blue],["STOP","⏹️",C.danger],["START","▶️",C.green]].map(([op,icon,color])=>(
                      <button key={op} onClick={()=>handleOp(sel,op)} disabled={op==="START"&&sel.status!=="STOPPED"||op==="STOP"&&sel.status==="STOPPED"} style={{padding:"10px 6px",background:`${color}15`,border:`1px solid ${color}44`,borderRadius:10,cursor:"pointer",textAlign:"center",color,fontWeight:700,fontSize:11,transition:"all .15s",opacity:(op==="START"&&sel.status!=="STOPPED"||(op==="STOP"&&sel.status==="STOPPED"))?.4:1}}>
                        <div style={{fontSize:18,marginBottom:3}}>{icon}</div>{op}
                      </button>
                    ))}
                  </div>
                  {user.role!=="admin"&&<div style={{fontSize:10,color:C.warning,marginTop:8,textAlign:"center"}}>⚠ Operations require Change Approver approval</div>}
                </div>
              )}
            </GlowCard>

            <GlowCard color={C.green}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13,display:"flex",justifyContent:"space-between"}}>
                <span>Console</span>
                <button onClick={()=>setTermLines(["[INFO] Console cleared."])} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:5,color:C.muted,cursor:"pointer",fontSize:10,padding:"2px 7px"}}>Clear</button>
              </div>
              <Terminal lines={termLines} height={180}/>
            </GlowCard>
          </div>
        )}
      </div>
    </div>
  );
}

// ── OPERATIONS TAB ────────────────────────────────────────────
function OperationsTab({servers,user,approvalList,executeOperation}){
  const [form,setForm]=useState({server:"",operation:"RESTART",reason:"",priority:"Normal",ticket:""});
  const [termLines,setTermLines]=useState(["[INFO] Operations console ready...","[INFO] Select a server and operation to begin."]);
  const [modal,setModal]=useState(null);

  const openModal=()=>{
    if(!form.server)return;
    setModal({server:servers.find(s=>s.name===form.server)||{name:form.server},op:form.operation});
  };

  const confirmOp=({reason,ticket,priority})=>{
    const {server,op}=modal;
    const entry={action:`${op} requested for ${server.name}`,user:user.name,server:server.name,operation:op,reason,ticket,priority,requestedBy:user.name,time:now()};
    if(user.role==="admin"){
      push(ref(db,"auditLogs"),{...entry,status:"APPROVED"});
      setTermLines(prev=>[...prev,`[INFO] Direct execution by Admin...`,`[INFO] Starting ${op} on ${server.name}...`]);
      executeOperation(server.id,op,setTermLines);
    }else{
      push(ref(db,"approvals"),{...entry,status:"PENDING"});
      setTermLines(prev=>[...prev,`[INFO] ${op} submitted for ${server.name}`,`[WARN] Awaiting Change Approver sign-off...`,`[INFO] Approvers have been notified`]);
    }
    setModal(null);
  };

  return (
    <div>
      {modal&&<ApprovalModal op={modal.op} server={modal.server.name} user={user} onConfirm={confirmOp} onCancel={()=>setModal(null)}/>}
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>⚙️ Server Operations</h2>
      <p style={{color:C.muted,marginBottom:20,fontSize:12}}>{user.role==="admin"?"Admin — direct execution enabled":"All operations require Change Approver approval before execution"}</p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <GlowCard color={C.blue}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:18,fontSize:15}}>Request Operation</div>

          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Target Server</div>
            <Sel value={form.server} onChange={e=>setForm(f=>({...f,server:e.target.value}))}>
              <option value="">Select server…</option>
              {servers.map(s=><option key={s.id} value={s.name}>{s.name} — {s.status} (CPU:{s.cpu}%)</option>)}
            </Sel>
          </div>

          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Operation</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[["RESTART","🔄",C.blue],["STOP","⏹️",C.danger],["START","▶️",C.green],["HEAPDUMP","💾",C.purple],["THREADDUMP","📋",C.teal],["PATCH","🔧",C.orange]].map(([op,icon,color])=>(
                <button key={op} onClick={()=>setForm(f=>({...f,operation:op}))} style={{padding:"10px 6px",background:form.operation===op?`${color}22`:C.card2,border:`1px solid ${form.operation===op?color:C.border}`,borderRadius:10,cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                  <div style={{fontSize:20,marginBottom:3}}>{icon}</div>
                  <div style={{fontSize:10,fontWeight:700,color:form.operation===op?color:C.muted}}>{op}</div>
                </button>
              ))}
            </div>
          </div>

          {!form.server&&<div style={{background:`${C.warning}15`,border:`1px solid ${C.warning}30`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:C.warning}}>⚠ Please select a target server before proceeding.</div>}

          {user.role!=="admin"&&(
            <div style={{background:`${C.blue}12`,border:`1px solid ${C.blue}30`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:C.blue}}>
              ℹ Your request will be sent to Change Approvers. Execution happens only after approval.
            </div>
          )}

          <Btn grad={user.role==="admin"?G.green:G.orange} color={user.role==="admin"?C.green:C.orange} onClick={openModal} disabled={!form.server} style={{width:"100%",padding:12}}>
            {user.role==="admin"?"⚡ Execute (with confirmation)":"📤 Submit for Approval"}
          </Btn>
        </GlowCard>

        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <GlowCard color={C.green}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14,display:"flex",justifyContent:"space-between"}}>
              <span>🖥️ Operations Console</span>
              <button onClick={()=>setTermLines(["[INFO] Cleared."])} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:5,color:C.muted,cursor:"pointer",fontSize:10,padding:"2px 7px"}}>Clear</button>
            </div>
            <Terminal lines={termLines} height={260}/>
          </GlowCard>

          <GlowCard color={C.warning}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>⏳ Pending Approvals</div>
            {(approvalList||[]).filter(a=>a.status==="PENDING").length===0
              ?<div style={{color:C.muted,fontSize:12}}>No pending operations.</div>
              :(approvalList||[]).filter(a=>a.status==="PENDING").map(a=>(
                <div key={a.id} style={{background:C.card2,borderRadius:10,padding:"10px 12px",marginBottom:8,borderLeft:`3px solid ${C.warning}`}}>
                  <div style={{fontWeight:700,fontSize:12,fontFamily:"monospace"}}>{a.operation} → {a.server}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:3}}>By {a.requestedBy} · {a.time}</div>
                  <div style={{fontSize:11,color:C.text,marginTop:3}}>{a.reason}</div>
                </div>
              ))}
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

// ── ISSUES TAB ────────────────────────────────────────────────
function IssuesTab({issues,setIssues,servers}){
  const [termLines,setTermLines]=useState(["[INFO] Troubleshoot engine ready...","[INFO] Click an issue to begin analysis."]);
  const [filter,setFilter]=useState("ACTIVE");

  const troubleshoot=(issue)=>{
    const steps={
      "Memory Leak":["[INFO] Connecting to JMX on "+issue.server+"...","[INFO] Reading heap histogram...","[WARN] Large object retention detected","[INFO] Top retained: com.oracle.weblogic.Session (2.4GB)","[INFO] Triggering System.gc()...","[OK] GC completed — freed 800MB","[INFO] Initiating heap dump to /logs/heapdump.hprof","[OK] Heap dump complete","[SUCCESS] Recommendation: Increase -Xmx4g, review session timeout policy"],
      "Thread Starvation":["[INFO] Connecting to thread pool manager...","[INFO] Dumping active thread stacks...","[WARN] 45 threads in BLOCKED state","[INFO] Lock contention in TransactionManager","[INFO] Identifying deadlock...","[WARN] Circular wait detected between T-142 and T-187","[INFO] Killing stuck threads...","[OK] Thread pool freed","[SUCCESS] Recommendation: Review DB connection pool size, add timeout"],
      "High CPU":["[INFO] Profiling CPU via JMX...","[INFO] Sampling hot methods...","[WARN] XMLParser.parse() consuming 62% CPU","[INFO] Checking for infinite loops...","[INFO] Stack trace: EJBContainer.invoke() → XMLParser.parse()","[SUCCESS] Recommendation: Cache XML results, upgrade parser library"],
      "GC Overhead":["[INFO] Parsing GC logs...","[WARN] GC frequency: every 50ms (should be <500ms)","[INFO] Heap fragmentation detected","[INFO] Current: -XX:+UseParallelGC","[SUCCESS] Recommendation: Switch to -XX:+UseG1GC, set -Xms2g -Xmx4g"],
    };
    const s=steps[issue.type]||["[INFO] Running diagnostics...","[INFO] Analyzing logs...","[SUCCESS] Analysis complete"];
    setTermLines(["[INFO] Starting analysis: "+issue.type+" on "+issue.server,"[INFO] ─────────────────────────────────"]);
    s.forEach((l,i)=>setTimeout(()=>setTermLines(prev=>[...prev,l]),i*700));
  };

  const resolve=(id)=>setIssues(prev=>prev.map(i=>i.id===id?{...i,status:"RESOLVED"}:i));
  const filtered=filter==="ALL"?issues:filter==="ACTIVE"?issues.filter(i=>i.status!=="RESOLVED"):issues.filter(i=>i.severity===filter);

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>🔥 Issues & Troubleshooting</h2>
      <p style={{color:C.muted,marginBottom:20,fontSize:12}}>Auto-detected issues · Click any issue to run AI-assisted troubleshooting</p>
      <div style={{display:"flex",gap:8,marginBottom:18,flexWrap:"wrap"}}>
        {["ACTIVE","ALL","CRITICAL","WARNING"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${filter===f?C.red:C.border}`,background:filter===f?`${C.red}20`:"transparent",color:filter===f?C.red:C.muted,fontSize:12,cursor:"pointer",fontWeight:700}}>{f}</button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.length===0&&<GlowCard color={C.green} style={{textAlign:"center",padding:32}}><div style={{color:C.muted}}>✅ No issues found</div></GlowCard>}
          {filtered.map(i=>(
            <GlowCard key={i.id} color={severityColor(i.severity)} onClick={()=>troubleshoot(i)} style={{cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:severityColor(i.severity)}}>{i.server}</span>
                    <Badge text={i.severity} color={severityColor(i.severity)}/>
                    <Badge text={i.type} color={C.blue}/>
                  </div>
                  <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.5}}>{i.description}</p>
                </div>
                <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                  {i.status==="HEALING"&&<span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:16}}>🔄</span>}
                  <Badge text={i.status} color={i.status==="RESOLVED"?C.green:i.status==="HEALING"?C.cyan:i.status==="DETECTED"?C.warning:C.danger}/>
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div style={{display:"flex",gap:10,alignItems:"center"}}>
                  <span style={{fontSize:11,color:C.muted}}>🕐 {i.detected}</span>
                  {i.autoHeal&&<Badge text="AUTO-HEAL" color={C.cyan}/>}
                </div>
                {i.status!=="RESOLVED"&&<button onClick={e=>{e.stopPropagation();resolve(i.id);}} style={{padding:"4px 10px",background:`${C.green}15`,border:`1px solid ${C.green}33`,borderRadius:8,color:C.green,fontSize:11,cursor:"pointer",fontWeight:700}}>✓ Resolve</button>}
              </div>
            </GlowCard>
          ))}
        </div>
        <GlowCard color={C.green} style={{height:"fit-content",position:"sticky",top:80}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14,display:"flex",justifyContent:"space-between"}}>
            <span>🔍 Troubleshoot Console</span><span style={{fontSize:11,color:C.muted}}>Click issue to analyze</span>
          </div>
          <Terminal lines={termLines} height={420}/>
        </GlowCard>
      </div>
    </div>
  );
}

// ── AUTO-HEAL TAB ─────────────────────────────────────────────
function AutoHealTab({servers,issues,user}){
  const [policies,setPolicies]=useState([
    {id:1,name:"JVM Heap Critical",trigger:"JVM Heap > 95%",action:"Force GC + Heap Dump + Alert",enabled:true,executions:12,lastRun:"2 min ago",server:"ALL PROD"},
    {id:2,name:"Thread Starvation",trigger:"Threads > 90% capacity",action:"Kill stuck threads + Alert",enabled:true,executions:3,lastRun:"15 min ago",server:"ALL"},
    {id:3,name:"Memory Leak Detection",trigger:"Memory growth > 5%/hr",action:"Heap dump + Analyze + Restart",enabled:true,executions:1,lastRun:"1 hr ago",server:"PROD"},
    {id:4,name:"CPU Spike Protection",trigger:"CPU > 90% for 5 min",action:"Thread dump + Scale out",enabled:false,executions:0,lastRun:"Never",server:"ALL"},
    {id:5,name:"GC Overhead Limit",trigger:"GC time > 100ms",action:"Tune GC params + Notify",enabled:true,executions:7,lastRun:"30 min ago",server:"PROD"},
    {id:6,name:"Datasource Recovery",trigger:"DS failures > 5",action:"Reconnect datasource pool",enabled:true,executions:2,lastRun:"3 hr ago",server:"ALL"},
  ]);
  const toggle=(id)=>setPolicies(prev=>prev.map(p=>p.id===id?{...p,enabled:!p.enabled}:p));
  const healing=issues.filter(i=>i.status==="HEALING");

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>🔄 Auto-Healing Engine</h2>
      <p style={{color:C.muted,marginBottom:20,fontSize:12}}>Automated detection and remediation · Policies trigger in real time</p>

      {healing.length>0&&(
        <GlowCard color={C.cyan} style={{marginBottom:18}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14,display:"flex",alignItems:"center",gap:10}}>
            <span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:18}}>🔄</span>Auto-Healing In Progress
          </div>
          {healing.map(i=>(
            <div key={i.id} style={{background:C.card2,borderRadius:10,padding:"12px 14px",marginBottom:8,border:`1px solid ${C.cyan}33`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontWeight:700,color:C.cyan,fontFamily:"monospace",fontSize:12}}>{i.server} — {i.type}</span>
                <Badge text="HEALING" color={C.cyan}/>
              </div>
              <div style={{height:6,background:C.dim,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:"65%",background:G.teal,borderRadius:3}}/>
              </div>
              <div style={{fontSize:11,color:C.muted,marginTop:6}}>Analyzing → Applying fix → Verifying health...</div>
            </div>
          ))}
        </GlowCard>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[["Active Policies",policies.filter(p=>p.enabled).length,C.green],["Total Executions",policies.reduce((a,p)=>a+p.executions,0),C.blue],["Healing Now",healing.length,C.cyan],["Issues Resolved",issues.filter(i=>i.status==="RESOLVED").length,C.green]].map(([l,v,c])=>(
          <GlowCard key={l} color={c} style={{padding:"14px 16px"}}>
            <div style={{fontFamily:"monospace",fontSize:26,fontWeight:700,color:c}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:5,letterSpacing:1}}>{l.toUpperCase()}</div>
          </GlowCard>
        ))}
      </div>

      <GlowCard color={C.purple}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:14}}>🤖 Healing Policies</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {policies.map(p=>(
            <div key={p.id} style={{background:C.card2,borderRadius:12,padding:"14px 16px",border:`1px solid ${p.enabled?C.purple+"44":C.border}`,display:"flex",gap:14,alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:13}}>{p.name}</span>
                  <Badge text={p.server} color={C.blue}/>
                  {p.enabled&&<Badge text="ACTIVE" color={C.green} dot/>}
                </div>
                <div style={{display:"flex",gap:16,fontSize:11,flexWrap:"wrap"}}>
                  <span style={{color:C.warning}}>⚡ {p.trigger}</span>
                  <span style={{color:C.cyan}}>🔧 {p.action}</span>
                </div>
                <div style={{fontSize:10,color:C.muted,marginTop:5}}>{p.executions} executions · Last: {p.lastRun}</div>
              </div>
              {(user.role==="admin"||user.role==="operator")&&(
                <div onClick={()=>toggle(p.id)} style={{width:44,height:24,borderRadius:12,background:p.enabled?C.green:C.dim,cursor:"pointer",position:"relative",transition:"all .3s",flexShrink:0}}>
                  <div style={{position:"absolute",top:2,left:p.enabled?22:2,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .3s",boxShadow:"0 2px 4px rgba(0,0,0,.3)"}}/>
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
function ApprovalsTab({approvalList,user,servers,executeOperation}){
  const [termLines,setTermLines]=useState(["[INFO] Approval console ready...","[INFO] Approve or reject operations below."]);

  const approve=(item)=>{
    update(ref(db,`approvals/${item.id}`),{status:"APPROVED",approvedBy:user.name,approvedAt:now()});
    push(ref(db,"auditLogs"),{action:`APPROVED: ${item.operation} on ${item.server}`,user:user.name,time:now()});
    setTermLines(prev=>[...prev,`[OK] Operation APPROVED by ${user.name}`,`[INFO] Executing ${item.operation} on ${item.server}...`]);
    const srv=servers.find(s=>s.name===item.server);
    if(srv)executeOperation(srv.id,item.operation,setTermLines);
    else setTermLines(prev=>[...prev,`[WARN] Server not found for direct execution — manual execution required`]);
  };

  const reject=(item)=>{
    update(ref(db,`approvals/${item.id}`),{status:"REJECTED",rejectedBy:user.name,rejectedAt:now()});
    push(ref(db,"auditLogs"),{action:`REJECTED: ${item.operation} on ${item.server}`,user:user.name,time:now()});
    setTermLines(prev=>[...prev,`[WARN] Operation ${item.operation} REJECTED by ${user.name}`]);
  };

  const canApprove=user.role==="admin"||user.role==="approver";
  const pending=(approvalList||[]).filter(a=>a.status==="PENDING");
  const history=(approvalList||[]).filter(a=>a.status!=="PENDING");

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>✅ Change Approvals</h2>
      <p style={{color:C.muted,marginBottom:20,fontSize:12}}>Approve or reject server operation requests · Approved ops execute immediately</p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 380px",gap:20}}>
        <div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14,color:C.warning}}>⏳ Pending ({pending.length})</div>
          {pending.length===0
            ?<GlowCard color={C.green} style={{textAlign:"center",padding:28,marginBottom:18}}><div style={{color:C.muted,fontSize:13}}>✅ No pending approvals</div></GlowCard>
            :pending.map(a=>(
              <GlowCard key={a.id} color={C.warning} style={{marginBottom:12}}>
                <div style={{marginBottom:14}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"monospace",fontWeight:800,fontSize:18,color:C.warning}}>{a.operation}</span>
                    <Badge text={a.server} color={C.blue}/>
                    <Badge text={a.priority||"Normal"} color={a.priority==="Emergency"?C.danger:a.priority==="High"?C.warning:C.blue}/>
                  </div>
                  <p style={{color:C.muted,fontSize:13,margin:"0 0 8px",lineHeight:1.5}}>{a.reason}</p>
                  {a.ticket&&<div style={{fontSize:11,color:C.cyan}}>🎫 Ticket: {a.ticket}</div>}
                  <div style={{fontSize:11,color:C.muted,marginTop:4}}>Requested by <strong style={{color:C.text}}>{a.requestedBy}</strong> · {a.time}</div>
                </div>
                {canApprove&&(
                  <div style={{display:"flex",gap:10}}>
                    <Btn grad={G.green} color={C.green} onClick={()=>approve(a)} style={{flex:1}}>✅ Approve & Execute</Btn>
                    <Btn color={C.danger} onClick={()=>reject(a)} style={{flex:1}}>❌ Reject</Btn>
                  </div>
                )}
                {!canApprove&&<div style={{fontSize:12,color:C.muted,fontStyle:"italic"}}>Awaiting approver action…</div>}
              </GlowCard>
            ))}

          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14,color:C.muted,marginTop:20}}>📜 History</div>
          {history.length===0?<div style={{color:C.muted,fontSize:12}}>No history yet.</div>
            :history.map(a=>(
              <div key={a.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",marginBottom:8,borderLeft:`3px solid ${a.status==="APPROVED"?C.green:C.danger}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:12,fontFamily:"monospace"}}>{a.operation} → {a.server}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:3}}>{a.requestedBy} · {a.time}</div>
                  </div>
                  <Badge text={a.status} color={a.status==="APPROVED"?C.green:C.danger}/>
                </div>
              </div>
            ))}
        </div>

        <GlowCard color={C.green} style={{height:"fit-content",position:"sticky",top:80}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>🖥️ Execution Console</div>
          <Terminal lines={termLines} height={380}/>
        </GlowCard>
      </div>
    </div>
  );
}

// ── AUTOMATION TAB ────────────────────────────────────────────
function AutomationTab({servers}){
  const [rules]=useState([
    {id:1,name:"Nightly Rolling Restart",schedule:"02:00 AM Daily",servers:"ALL PROD",action:"Rolling Restart (one by one)",nextRun:"Tonight 02:00",enabled:true,lastStatus:"SUCCESS"},
    {id:2,name:"Weekly Health Report",schedule:"Monday 09:00",servers:"ALL",action:"Generate & Email Report",nextRun:"Monday 09:00",enabled:true,lastStatus:"SUCCESS"},
    {id:3,name:"Log Rotation",schedule:"Every 6 Hours",servers:"ALL",action:"Rotate + Archive Logs",nextRun:"In 2 hours",enabled:true,lastStatus:"SUCCESS"},
    {id:4,name:"Heap Monitoring",schedule:"Every 5 min",servers:"ALL PROD",action:"Alert if JVM > 85%",nextRun:"In 3 min",enabled:true,lastStatus:"RUNNING"},
    {id:5,name:"DR Failover Test",schedule:"1st Sunday Monthly",servers:"DR",action:"Failover simulation",nextRun:"1st Sunday",enabled:false,lastStatus:"PENDING"},
    {id:6,name:"Security Scan",schedule:"Weekly Sunday",servers:"ALL",action:"Vulnerability scan + Report",nextRun:"Sunday 01:00",enabled:true,lastStatus:"SUCCESS"},
    {id:7,name:"Datasource Health Check",schedule:"Every 15 min",servers:"ALL",action:"Ping + reconnect failed DS",nextRun:"In 8 min",enabled:true,lastStatus:"SUCCESS"},
    {id:8,name:"Patch Management",schedule:"Monthly 1st Sat",servers:"ALL",action:"Download + apply patches",nextRun:"1st Saturday",enabled:true,lastStatus:"PENDING"},
  ]);

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>🤖 Automation Rules</h2>
      <p style={{color:C.muted,marginBottom:20,fontSize:12}}>Scheduled tasks and automated workflows</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:14}}>
        {rules.map(r=>(
          <GlowCard key={r.id} color={r.enabled?C.blue:C.muted} style={{padding:"16px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontWeight:800,fontSize:14,marginBottom:4}}>{r.name}</div>
                <div style={{fontSize:11,color:C.muted}}>🕐 {r.schedule}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                <Badge text={r.enabled?"ACTIVE":"DISABLED"} color={r.enabled?C.green:C.muted} dot/>
                <Badge text={r.lastStatus} color={r.lastStatus==="SUCCESS"?C.green:r.lastStatus==="RUNNING"?C.cyan:C.muted}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
              <div style={{background:C.bg,borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontSize:9,color:C.muted,marginBottom:3,textTransform:"uppercase"}}>Action</div>
                <div style={{fontSize:11,fontWeight:600}}>{r.action}</div>
              </div>
              <div style={{background:C.bg,borderRadius:8,padding:"8px 10px"}}>
                <div style={{fontSize:9,color:C.muted,marginBottom:3,textTransform:"uppercase"}}>Target</div>
                <div style={{fontSize:11,fontWeight:600,fontFamily:"monospace"}}>{r.servers}</div>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontSize:11,color:C.cyan}}>⏭ Next: {r.nextRun}</div>
              <div style={{display:"flex",gap:8}}>
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

// ── AUDIT LOG ─────────────────────────────────────────────────
function AuditTab({auditList}){
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>📋 Audit Log</h2>
      <p style={{color:C.muted,marginBottom:20,fontSize:12}}>Complete immutable history of all operations and approvals</p>
      {auditList.length===0
        ?<GlowCard color={C.blue} style={{textAlign:"center",padding:48}}><div style={{color:C.muted}}>No audit records yet.</div></GlowCard>
        :<div style={{display:"flex",flexDirection:"column",gap:8}}>
          {[...auditList].reverse().map((a,i)=>(
            <GlowCard key={a.id} color={a.action.includes("APPROVED")?C.green:a.action.includes("REJECTED")?C.danger:C.blue} style={{padding:"12px 16px"}}>
              <div style={{display:"flex",gap:14,alignItems:"center"}}>
                <div style={{width:32,height:32,borderRadius:"50%",background:a.action.includes("APPROVED")?`${C.green}20`:a.action.includes("REJECTED")?`${C.danger}20`:`${C.blue}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>
                  {a.action.includes("APPROVED")?"✅":a.action.includes("REJECTED")?"❌":"⚡"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:12,fontFamily:"monospace"}}>{a.action}</div>
                  <div style={{color:C.muted,fontSize:11,marginTop:3}}>by {a.user} · {a.time}</div>
                </div>
                <div style={{fontFamily:"monospace",fontSize:10,color:C.dim}}>#{auditList.length-i}</div>
              </div>
            </GlowCard>
          ))}
        </div>
      }
    </div>
  );
}
