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

// ── EmailJS Config ─────────────────────────────────────────
// Sign up free at emailjs.com, create a service + template, paste IDs below
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
const ALERT_EMAIL = "your-team@gscoci.in"; // Change to your team email

// ── Theme ──────────────────────────────────────────────────
const DARK = {
  bg:"#060910",card:"#0a0f1a",card2:"#0f1520",border:"#1a2540",
  red:"#C74634",blue:"#1e90ff",cyan:"#00d4ff",green:"#00e676",
  orange:"#ff9100",purple:"#d500f9",teal:"#1de9b6",yellow:"#ffd600",
  text:"#e8eef8",muted:"#4a6080",dim:"#2a3a50",
  danger:"#ff1744",warning:"#ff9100",success:"#00e676",info:"#00d4ff",
  shadow:"rgba(0,0,0,0.5)",headerBg:"linear-gradient(180deg,#0a0f1a,#060910)",
};
const LIGHT = {
  bg:"#f0f4f8",card:"#ffffff",card2:"#f8fafc",border:"#e2e8f0",
  red:"#C74634",blue:"#1a56a0",cyan:"#0891b2",green:"#059669",
  orange:"#ea580c",purple:"#7c3aed",teal:"#0d9488",yellow:"#d97706",
  text:"#1e293b",muted:"#64748b",dim:"#cbd5e1",
  danger:"#dc2626",warning:"#d97706",success:"#059669",info:"#0891b2",
  shadow:"rgba(0,0,0,0.1)",headerBg:"linear-gradient(180deg,#1e293b,#0f172a)",
};

const G = {
  red:"linear-gradient(135deg,#C74634,#8B1A10)",
  blue:"linear-gradient(135deg,#1e90ff,#00d4ff)",
  green:"linear-gradient(135deg,#00e676,#00a152)",
  orange:"linear-gradient(135deg,#ff9100,#C74634)",
  purple:"linear-gradient(135deg,#d500f9,#1e90ff)",
  teal:"linear-gradient(135deg,#1de9b6,#00d4ff)",
  oci:"linear-gradient(135deg,#C74634,#1a4e8c)",
};

// ── Seed Data ─────────────────────────────────────────────
const WLS_SERVERS = [
  {id:"wls1",name:"WLS-PROD-01",env:"Production",host:"prod-wls-01.gscoci.in",port:7001,cpu:42,mem:68,threads:120,maxThreads:200,jvmHeap:72,gcTime:12,datasources:4,deployments:8,version:"14.1.1.0",uptimeSecs:3934200},
  {id:"wls2",name:"WLS-PROD-02",env:"Production",host:"prod-wls-02.gscoci.in",port:7001,cpu:38,mem:61,threads:98,maxThreads:200,jvmHeap:65,gcTime:8,datasources:4,deployments:8,version:"14.1.1.0",uptimeSecs:3934200},
  {id:"wls3",name:"WLS-PROD-03",env:"Production",host:"prod-wls-03.gscoci.in",port:7001,cpu:78,mem:87,threads:185,maxThreads:200,jvmHeap:89,gcTime:45,datasources:4,deployments:8,version:"14.1.1.0",uptimeSecs:1039800},
  {id:"wls4",name:"WLS-PROD-04",env:"Production",host:"prod-wls-04.gscoci.in",port:7001,cpu:94,mem:96,threads:198,maxThreads:200,jvmHeap:98,gcTime:120,datasources:2,deployments:8,version:"14.1.1.0",uptimeSecs:177900},
  {id:"wls5",name:"WLS-UAT-01",env:"UAT",host:"uat-wls-01.gscoci.in",port:7001,cpu:25,mem:45,threads:60,maxThreads:150,jvmHeap:50,gcTime:5,datasources:3,deployments:5,version:"14.1.1.0",uptimeSecs:467200},
  {id:"wls6",name:"WLS-DR-01",env:"DR",host:"dr-wls-01.gscoci.in",port:7001,cpu:5,mem:20,threads:10,maxThreads:200,jvmHeap:30,gcTime:2,datasources:4,deployments:8,version:"14.1.1.0",uptimeSecs:7776000},
  {id:"wls7",name:"WLS-ADMIN",env:"Production",host:"prod-wls-admin.gscoci.in",port:7001,cpu:15,mem:35,threads:40,maxThreads:100,jvmHeap:40,gcTime:3,datasources:2,deployments:3,version:"14.1.1.0",uptimeSecs:3934200},
];

const OCI_COMPUTE = [
  {id:"c1",name:"prod-app-01",shape:"VM.Standard3.Flex",ocpu:8,ram:128,os:"Oracle Linux 8",region:"ap-mumbai-1",ad:"AD-1",status:"RUNNING",cpu:65,mem:72,uptimeSecs:2592000,role:"App Server"},
  {id:"c2",name:"prod-app-02",shape:"VM.Standard3.Flex",ocpu:8,ram:128,os:"Oracle Linux 8",region:"ap-mumbai-1",ad:"AD-2",status:"RUNNING",cpu:58,mem:68,uptimeSecs:2592000,role:"App Server"},
  {id:"c3",name:"prod-db-01",shape:"VM.Standard.E4.Flex",ocpu:16,ram:256,os:"Oracle Linux 8",region:"ap-mumbai-1",ad:"AD-1",status:"RUNNING",cpu:35,mem:55,uptimeSecs:5184000,role:"DB Server"},
  {id:"c4",name:"prod-lb-01",shape:"VM.Standard3.Flex",ocpu:4,ram:64,os:"Oracle Linux 8",region:"ap-mumbai-1",ad:"AD-1",status:"RUNNING",cpu:22,mem:38,uptimeSecs:5184000,role:"Load Balancer"},
  {id:"c5",name:"dr-app-01",shape:"VM.Standard3.Flex",ocpu:8,ram:128,os:"Oracle Linux 8",region:"ap-hyderabad-1",ad:"AD-1",status:"STOPPED",cpu:0,mem:0,uptimeSecs:0,role:"DR App"},
  {id:"c6",name:"bastion-01",shape:"VM.Standard.E3.Flex",ocpu:2,ram:16,os:"Oracle Linux 8",region:"ap-mumbai-1",ad:"AD-1",status:"RUNNING",cpu:5,mem:12,uptimeSecs:7776000,role:"Bastion"},
];

const OCI_DATABASES = [
  {id:"db1",name:"PROD-ADB-01",type:"ATP",ocpu:4,region:"ap-mumbai-1",status:"AVAILABLE",cpu:45,connections:128,maxConns:300,version:"19c",uptimeSecs:5184000,size:"2TB"},
  {id:"db2",name:"PROD-ADB-02",type:"ADW",ocpu:8,region:"ap-mumbai-1",status:"AVAILABLE",cpu:32,connections:64,maxConns:200,version:"19c",uptimeSecs:5184000,size:"5TB"},
  {id:"db3",name:"DR-ADB-01",type:"ATP",ocpu:4,region:"ap-hyderabad-1",status:"AVAILABLE",cpu:5,connections:10,maxConns:300,version:"19c",uptimeSecs:7776000,size:"2TB"},
];

const OCI_LB = [
  {id:"lb1",name:"PROD-LB-PUBLIC",type:"Flexible",region:"ap-mumbai-1",ip:"152.67.x.x",status:"ACTIVE",backends:4,healthyBackends:3,protocol:"HTTPS",port:443,rps:1250,bw:245},
  {id:"lb2",name:"PROD-LB-INTERNAL",type:"Network",region:"ap-mumbai-1",ip:"10.0.0.20",status:"ACTIVE",backends:4,healthyBackends:4,protocol:"TCP",port:7001,rps:890,bw:180},
];

const INIT_PATCHES = [
  {id:"p1",name:"Oracle JDK 17.0.10",server:"ALL WLS",priority:"Critical",status:"PENDING",releaseDate:"2024-01-15",cve:"CVE-2024-20918",impact:"Security"},
  {id:"p2",name:"WebLogic 14.1.1 Patch Set",server:"ALL WLS",priority:"High",status:"SCHEDULED",releaseDate:"2024-01-20",cve:"CVE-2024-21006",impact:"Security+Performance"},
  {id:"p3",name:"Oracle Linux 8.9 Update",server:"ALL Compute",priority:"Medium",status:"COMPLETED",releaseDate:"2024-01-10",cve:"N/A",impact:"OS Security"},
  {id:"p4",name:"OCI CLI v3.36.0",server:"Bastion",priority:"Low",status:"COMPLETED",releaseDate:"2024-01-08",cve:"N/A",impact:"Tooling"},
  {id:"p5",name:"ADB Maintenance Update",server:"PROD-ADB-01",priority:"High",status:"PENDING",releaseDate:"2024-01-25",cve:"N/A",impact:"Database"},
];

const PASSWORDS = {admin:"WLS@ADMIN",operator:"WLS@OPS",approver:"WLS@APPR"};
const ROLES = {admin:"System Admin",operator:"OPS Engineer",approver:"Change Approver",viewer:"Viewer"};
const now = () => new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"});
const fmtUptime = (s) => {const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60);return`${d}d ${h}h ${m}m`;};
const statusColor = (s,C) => ({RUNNING:C.green,AVAILABLE:C.green,ACTIVE:C.green,SUCCESS:C.green,WARNING:C.warning,CRITICAL:C.danger,STOPPED:C.muted,STANDBY:C.cyan,STARTING:C.blue,STOPPING:C.orange,RESTARTING:C.purple,FAILED:C.danger,IN_PROGRESS:C.blue,PENDING:C.yellow||C.warning,OPEN:C.danger,ACKNOWLEDGED:C.warning,RESOLVED:C.green,CLOSED:C.muted,SCHEDULED:C.blue,COMPLETED:C.green}[s]||C.muted);
const deriveWLSStatus = (s) => {
  if(s.operationStatus)return s.operationStatus;
  if(s.cpu>=92||s.jvmHeap>=95||s.mem>=95)return"CRITICAL";
  if(s.cpu>=75||s.jvmHeap>=82||s.mem>=82||s.threads/s.maxThreads>=0.88)return"WARNING";
  if(s.env==="DR")return"STANDBY";
  return"RUNNING";
};

// ── Email Alert ────────────────────────────────────────────
const sendEmailAlert = async (subject, message, priority="HIGH") => {
  try {
    // Load EmailJS dynamically
    if (!window.emailjs) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
        script.onload = resolve;
        document.head.appendChild(script);
      });
      window.emailjs.init(EMAILJS_PUBLIC_KEY);
    }
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: ALERT_EMAIL,
      subject: `[GSC OCI ${priority}] ${subject}`,
      message: message,
      time: now(),
      platform_url: "https://lakhshit.in",
    });
    return true;
  } catch (err) {
    console.log("Email not configured yet:", err);
    return false;
  }
};

function useDB(path){
  const [data,setData]=useState(null);
  useEffect(()=>{const r=ref(db,path);const u=onValue(r,s=>setData(s.val()));return()=>u();},[path]);
  return data;
}

// ── UI Components ──────────────────────────────────────────
const Pulse = ({color,size=10}) => (
  <span style={{position:"relative",display:"inline-block",width:size,height:size,flexShrink:0}}>
    <span style={{position:"absolute",inset:0,borderRadius:"50%",background:color,opacity:.4,animation:"pr 1.5s ease-out infinite"}}/>
    <span style={{position:"absolute",inset:0,borderRadius:"50%",background:color}}/>
  </span>
);

const Badge = ({text,color,dot}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:`${color}20`,color,border:`1px solid ${color}40`,whiteSpace:"nowrap"}}>
    {dot&&<span style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>}{text}
  </span>
);

const GlowCard = ({children,color,style={},onClick,C}) => (
  <div onClick={onClick} style={{background:C.card,border:`1px solid ${(color||C.blue)+"33"}`,borderRadius:16,padding:20,boxShadow:`0 0 20px ${(color||C.blue)+"10"}`,position:"relative",overflow:"hidden",cursor:onClick?"pointer":"default",transition:"all .2s",...style}}
    onMouseEnter={e=>onClick&&(e.currentTarget.style.boxShadow=`0 0 40px ${(color||C.blue)+"28"}`)}
    onMouseLeave={e=>onClick&&(e.currentTarget.style.boxShadow=`0 0 20px ${(color||C.blue)+"10"}`)}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color||C.blue},transparent)`}}/>
    {children}
  </div>
);

const MetricBar = ({value,max=100,label,unit="%",warn=70,crit=90,small,C}) => {
  const pct=Math.min(100,(value/max)*100);
  const color=pct>=crit?C.danger:pct>=warn?C.warning:C.success;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:small?10:11}}>
        <span style={{color:C.muted}}>{label}</span>
        <span style={{color,fontWeight:700}}>{value}{unit}</span>
      </div>
      <div style={{height:small?4:6,background:C.dim,borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3,transition:"width .8s,background .4s",boxShadow:`0 0 8px ${color}60`}}/>
      </div>
    </div>
  );
};

const Btn = ({children,grad,color,onClick,style={},sm,disabled,C}) => (
  <button onClick={onClick} disabled={disabled} style={{padding:sm?"6px 14px":"10px 22px",background:disabled?C.dim:grad||`${color||C.blue}22`,border:`1px solid ${disabled?C.dim:color||C.blue}44`,borderRadius:10,color:disabled?C.muted:grad?"#fff":color||C.blue,fontWeight:700,fontSize:sm?12:13,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",transition:"all .15s",opacity:disabled?.5:1,boxShadow:grad&&!disabled?`0 4px 20px ${color||C.blue}40`:"none",...style}}>{children}</button>
);

const Inp = ({value,onChange,placeholder,type="text",rows,style={},C}) => {
  const base={width:"100%",padding:"10px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",...style};
  return rows?<textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{...base,resize:"vertical"}}/>:<input type={type} value={value} onChange={onChange} placeholder={placeholder} style={base}/>;
};

const Sel = ({value,onChange,children,style={},C}) => (
  <select value={value} onChange={onChange} style={{width:"100%",padding:"10px 14px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",...style}}>{children}</select>
);

const Terminal = ({lines,height=220,C}) => {
  const r=useRef(null);
  useEffect(()=>{if(r.current)r.current.scrollTop=r.current.scrollHeight;},[lines]);
  return (
    <div ref={r} style={{background:"#000",borderRadius:10,padding:14,height,overflowY:"auto",fontFamily:"'JetBrains Mono',monospace",fontSize:11,border:`1px solid ${C.green}33`,lineHeight:1.6}}>
      {lines.map((l,i)=><div key={i} style={{color:l.startsWith("[ERR")?C.danger:l.startsWith("[WARN")?C.warning:l.startsWith("[OK")||l.startsWith("[SUC")?C.success:l.startsWith("[INFO")?C.cyan:C.text}}>{l}</div>)}
      <div style={{display:"inline-block",width:8,height:12,background:C.green,animation:"blink 1s step-end infinite",verticalAlign:"middle"}}/>
    </div>
  );
};

// ── Toast ──────────────────────────────────────────────────
function ToastContainer({toasts,dismiss}){
  return (
    <div style={{position:"fixed",top:80,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:340}}>
      {toasts.map(t=>(
        <div key={t.id} style={{background:"#0a0f1a",border:`1px solid ${t.color}55`,borderRadius:12,padding:"12px 16px",boxShadow:`0 4px 20px ${t.color}30`,display:"flex",gap:12,alignItems:"flex-start",animation:"slideIn .3s ease"}}>
          <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:12,color:t.color}}>{t.title}</div>
            <div style={{fontSize:11,color:"#4a6080",marginTop:3}}>{t.message}</div>
          </div>
          <button onClick={()=>dismiss(t.id)} style={{background:"none",border:"none",color:"#4a6080",cursor:"pointer",fontSize:14,flexShrink:0}}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Approval Modal ─────────────────────────────────────────
function ApprovalModal({op,target,user,onConfirm,onCancel,C}){
  const [reason,setReason]=useState("");
  const [ticket,setTicket]=useState("");
  const [priority,setPriority]=useState("Normal");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <GlowCard color={priority==="Emergency"?C.danger:C.warning} style={{width:"100%",maxWidth:500,padding:32}} C={C}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:44,marginBottom:10}}>{op==="RESTART"?"🔄":op==="STOP"?"⏹️":op==="START"?"▶️":"⚡"}</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:C.text,margin:"0 0 6px"}}>{op} — {target}</h2>
          {user.role!=="admin"&&<Badge text="REQUIRES APPROVAL" color={C.warning}/>}
          {user.role==="admin"&&<Badge text="DIRECT EXECUTION" color={C.green}/>}
        </div>
        {user.role!=="admin"&&<div style={{background:`${C.warning}15`,border:`1px solid ${C.warning}30`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:C.warning}}>⚠️ Queued for approval. Execution only after approver sign-off.</div>}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Priority</div>
          <div style={{display:"flex",gap:8}}>
            {["Low","Normal","High","Emergency"].map(p=><button key={p} onClick={()=>setPriority(p)} style={{flex:1,padding:"7px 4px",background:priority===p?`${p==="Emergency"?C.danger:C.blue}22`:C.card2,border:`1px solid ${priority===p?p==="Emergency"?C.danger:C.blue:C.border}`,borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,color:priority===p?p==="Emergency"?C.danger:C.blue:C.muted}}>{p}</button>)}
          </div>
        </div>
        <Inp value={ticket} onChange={e=>setTicket(e.target.value)} placeholder="Change Ticket #" style={{marginBottom:10}} C={C}/>
        <Inp value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason / justification *" rows={3} style={{marginBottom:16}} C={C}/>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onCancel} style={{flex:1,padding:11,background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <Btn grad={user.role==="admin"?G.green:G.orange} color={user.role==="admin"?C.green:C.orange} onClick={()=>reason.trim()&&onConfirm({reason,ticket,priority})} disabled={!reason.trim()} style={{flex:2,padding:11}} C={C}>
            {user.role==="admin"?"⚡ Execute Now":"📤 Submit for Approval"}
          </Btn>
        </div>
      </GlowCard>
    </div>
  );
}

// ── Theme Toggle ───────────────────────────────────────────
const ThemeToggle = ({isDark,toggle}) => (
  <button onClick={toggle} style={{background:"transparent",border:"1px solid #ffffff44",borderRadius:20,padding:"5px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:6,color:"#fff",fontSize:12,fontWeight:600}}>
    {isDark?"☀️ Light":"🌙 Dark"}
  </button>
);

// ── LOGIN ──────────────────────────────────────────────────
function Login({onLogin,isDark,toggleTheme}){
  const C=isDark?DARK:LIGHT;
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
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",fontFamily:"'DM Sans',sans-serif",overflow:"hidden",color:C.text}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;700&display=swap');*{box-sizing:border-box}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pr{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.5);opacity:0}}@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{position:"fixed",inset:0,zIndex:0}}>
        {[["#C74634","8%","15%"],["#1e90ff","75%","65%"],["#00d4ff","45%","85%"]].map(([c,l,t],i)=><div key={i} style={{position:"absolute",left:l,top:t,width:"300px",height:"300px",background:c,borderRadius:"50%",filter:"blur(100px)",opacity:.07}}/>)}
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.border}22 1px,transparent 1px),linear-gradient(90deg,${C.border}22 1px,transparent 1px)`,backgroundSize:"40px 40px",opacity:.3}}/>
      </div>
      {/* Left Panel */}
      <div style={{width:400,background:"linear-gradient(180deg,#0a0f1a,#060910)",borderRight:`1px solid #1a2540`,display:"flex",flexDirection:"column",padding:36,position:"relative",zIndex:1,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:48,height:48,background:G.oci,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:`0 0 30px #C7463450`}}>☁️</div>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:"#e8eef8"}}>GSC OCI Control</div>
              <div style={{fontSize:10,color:"#4a6080",letterSpacing:2,textTransform:"uppercase"}}>Oracle Cloud Infrastructure</div>
            </div>
          </div>
          <ThemeToggle isDark={isDark} toggle={toggleTheme}/>
        </div>
        <div style={{background:"#0a0f1a",border:"1px solid #1a2540",borderRadius:12,padding:"12px 16px",marginBottom:14}}>
          <div style={{fontSize:9,color:"#4a6080",marginBottom:4,letterSpacing:1}}>SYSTEM TIME (IST)</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:"#00d4ff"}}>{time.toLocaleTimeString()}</div>
          <div style={{fontSize:10,color:"#4a6080",marginTop:3}}>{time.toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
        </div>
        <div style={{background:"#0a0f1a",border:"1px solid #1a2540",borderRadius:12,padding:"12px 16px",marginBottom:14}}>
          <div style={{fontSize:9,color:"#4a6080",marginBottom:10,letterSpacing:1}}>INFRASTRUCTURE SUMMARY</div>
          {[["💻 Compute",`${OCI_COMPUTE.filter(c=>c.status==="RUNNING").length}/${OCI_COMPUTE.length} Running`,"#00e676"],["⚡ WebLogic",`${WLS_SERVERS.filter(s=>s.env==="Production").length} Production`,"#ff9100"],["🗄️ Databases",`${OCI_DATABASES.length} Available`,"#1e90ff"],["⚖️ Load Balancers",`${OCI_LB.length} Active`,"#1de9b6"]].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><span style={{fontSize:11,color:"#4a6080"}}>{l}</span><span style={{fontSize:11,fontWeight:700,color:c}}>{v}</span></div>
          ))}
        </div>
        <div style={{background:"#ff174415",border:"1px solid #ff174430",borderRadius:12,padding:"12px 16px"}}>
          <div style={{fontSize:9,color:"#ff1744",marginBottom:8,fontWeight:700,letterSpacing:1}}>⚠ ACTIVE ALERTS</div>
          <div style={{fontSize:11,color:"#e8eef8",marginBottom:4}}><span style={{color:"#ff1744"}}>●</span> WLS-PROD-04: JVM Heap 98%</div>
          <div style={{fontSize:11,color:"#e8eef8",marginBottom:4}}><span style={{color:"#ff1744"}}>●</span> WLS-PROD-04: CPU 94%</div>
          <div style={{fontSize:11,color:"#e8eef8"}}><span style={{color:"#ff9100"}}>●</span> WLS-PROD-03: Thread pool 92%</div>
        </div>
      </div>
      {/* Right Panel */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:48,position:"relative",zIndex:1}}>
        <div style={{width:"100%",maxWidth:420}}>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.text,margin:"0 0 6px"}}>Secure Access</h1>
          <p style={{color:C.muted,margin:"0 0 26px",fontSize:13}}>GSC Oracle Cloud Infrastructure Management</p>
          <GlowCard color={C.blue} style={{padding:26}} C={C}>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:C.muted,marginBottom:10,letterSpacing:1,textTransform:"uppercase"}}>Select Role</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                {[["admin","🛡️","System Admin","Full control"],["operator","⚙️","OPS Engineer","Operations"],["approver","✅","Change Approver","Approvals"],["viewer","👁️","Viewer","Read only"]].map(([r,icon,label,sub])=>(
                  <button key={r} onClick={()=>{setRole(r);setErr("");setPass("");}} style={{padding:"13px 8px",background:role===r?`${C.blue}20`:C.card2,border:`1px solid ${role===r?C.blue:C.border}`,borderRadius:12,cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                    <div style={{fontSize:20,marginBottom:4}}>{icon}</div>
                    <div style={{fontWeight:700,fontSize:12,color:role===r?C.blue:C.text}}>{label}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2}}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>
            {role&&role!=="viewer"&&<div style={{marginBottom:14}}>
              <Inp value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} placeholder="Enter password" type="password" C={C}/>
              <div style={{fontSize:10,color:C.dim,marginTop:5}}>Contact your system administrator for credentials.</div>
            </div>}
            {err&&<div style={{color:C.danger,fontSize:12,marginBottom:10}}>⚠ {err}</div>}
            <Btn grad={G.oci} color={C.red} onClick={login} style={{width:"100%",padding:12}} C={C}>🔐 Sign In to OCI Control</Btn>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [user,setUser]=useState(null);
  const [isDark,setIsDark]=useState(true);
  const toggleTheme=()=>setIsDark(d=>!d);
  if(!user)return <Login onLogin={setUser} isDark={isDark} toggleTheme={toggleTheme}/>;
  return <MainApp user={user} onLogout={()=>setUser(null)} isDark={isDark} toggleTheme={toggleTheme}/>;
}

function MainApp({user,onLogout,isDark,toggleTheme}){
  const C=isDark?DARK:LIGHT;
  const [tab,setTab]=useState("overview");
  const [wlsServers,setWlsServers]=useState(()=>WLS_SERVERS.map(s=>({...s,status:deriveWLSStatus(s)})));
  const [compute,setCompute]=useState(OCI_COMPUTE);
  const [databases,setDatabases]=useState(OCI_DATABASES);
  const [lbs,setLbs]=useState(OCI_LB);
  const [wlsIssues,setWlsIssues]=useState([
    {id:"i1",server:"WLS-PROD-04",severity:"CRITICAL",type:"Memory Leak",description:"JVM Heap at 98%",detected:"2 min ago",autoHeal:true,status:"HEALING"},
    {id:"i2",server:"WLS-PROD-03",severity:"WARNING",type:"Thread Starvation",description:"185/200 threads active",detected:"15 min ago",autoHeal:true,status:"DETECTED"},
  ]);
  const [toasts,setToasts]=useState([]);
  const [modal,setModal]=useState(null);
  const [termLines,setTermLines]=useState(["[INFO] GSC OCI Control Platform ready.","[INFO] All systems monitored."]);
  const [showChatbot,setShowChatbot]=useState(false);
  const [emailAlerts,setEmailAlerts]=useState(true);

  const approvalsDB=useDB("approvals");
  const auditDB=useDB("auditLogs");
  const incidentsDB=useDB("incidents");
  const maintenanceDB=useDB("maintenance");
  const ticketsDB=useDB("tickets");

  const approvalList=approvalsDB?Object.entries(approvalsDB).map(([k,v])=>({id:k,...v})):[];
  const auditList=auditDB?Object.entries(auditDB).map(([k,v])=>({id:k,...v})):[];
  const incidentList=incidentsDB?Object.entries(incidentsDB).map(([k,v])=>({id:k,...v})):[];
  const maintenanceList=maintenanceDB?Object.entries(maintenanceDB).map(([k,v])=>({id:k,...v})):[];
  const ticketList=ticketsDB?Object.entries(ticketsDB).map(([k,v])=>({id:k,...v})):[];

  const addToast=(title,message,color,icon)=>{
    const id=Date.now();
    setToasts(prev=>[...prev,{id,title,message,color,icon}]);
    setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==id)),6000);
  };

  // Live metrics + auto-alerts
  useEffect(()=>{
    const t=setInterval(()=>{
      const drift=(v,r,mn,mx)=>Math.min(mx,Math.max(mn,v+(Math.random()-.5)*r));
      setWlsServers(prev=>prev.map(s=>{
        if(["STOPPED","STANDBY","STARTING","STOPPING","RESTARTING"].includes(s.status))return s;
        const cpu=Math.round(drift(s.cpu,s.env==="Production"?5:2,2,99));
        const mem=Math.round(drift(s.mem,2,10,99));
        const jvmHeap=Math.round(drift(s.jvmHeap,3,10,99));
        const gcTime=Math.round(drift(s.gcTime,s.jvmHeap>85?8:2,1,250));
        const threads=Math.round(drift(s.threads,4,1,s.maxThreads));
        const upd={...s,cpu,mem,jvmHeap,gcTime,threads,uptimeSecs:s.uptimeSecs+3};
        const newStatus=deriveWLSStatus(upd);
        if(newStatus==="CRITICAL"&&s.status!=="CRITICAL"){
          addToast(`🔴 CRITICAL: ${s.name}`,`CPU:${cpu}% MEM:${mem}% JVM:${jvmHeap}%`,"#ff1744","🔴");
          if(emailAlerts){
            sendEmailAlert(`CRITICAL Alert: ${s.name}`,
              `Server ${s.name} has reached CRITICAL status.\n\nMetrics:\n- CPU: ${cpu}%\n- Memory: ${mem}%\n- JVM Heap: ${jvmHeap}%\n- GC Time: ${gcTime}ms\n\nImmediate attention required!\n\nView dashboard: https://lakhshit.in`,"CRITICAL");
          }
          // Auto-create P1 incident
          push(ref(db,"incidents"),{title:`CRITICAL: ${s.name} — CPU:${cpu}% JVM:${jvmHeap}%`,priority:"P1",status:"OPEN",affectedSystem:s.name,category:"Performance",reportedBy:"Auto-Detection",assignee:"On-Call Engineer",createdAt:now(),slaBreachAt:"1 hour",description:`Auto-detected critical threshold breach. CPU:${cpu}% MEM:${mem}% JVM:${jvmHeap}%`});
        }
        upd.status=newStatus;
        return upd;
      }));
      setCompute(prev=>prev.map(c=>{
        if(c.status==="STOPPED")return c;
        return{...c,cpu:Math.round(drift(c.cpu,4,1,99)),mem:Math.round(drift(c.mem,2,10,99)),uptimeSecs:c.uptimeSecs+3};
      }));
      setDatabases(prev=>prev.map(d=>({...d,cpu:Math.round(drift(d.cpu,3,1,90)),connections:Math.round(drift(d.connections,5,1,d.maxConns))})));
      setLbs(prev=>prev.map(l=>({...l,rps:Math.round(drift(l.rps,50,10,5000)),bw:Math.round(drift(l.bw,20,10,1000))})));
    },3000);
    return()=>clearInterval(t);
  },[emailAlerts]);

  // Auto-heal
  useEffect(()=>{
    const t=setInterval(()=>{
      setWlsIssues(prev=>prev.map(i=>{
        if(i.autoHeal&&i.status==="DETECTED")return{...i,status:"HEALING"};
        if(i.autoHeal&&i.status==="HEALING"&&Math.random()>.7){
          addToast(`✅ Auto-healed: ${i.server}`,`${i.type} resolved automatically`,C.green,"🔄");
          return{...i,status:"RESOLVED"};
        }
        return i;
      }));
    },4000);
    return()=>clearInterval(t);
  },[]);

  const executeOp=(serverId,op)=>{
    const steps={
      RESTART:[{d:0,l:"[INFO] Initiating RESTART..."},{d:900,l:"[INFO] Draining connections..."},{d:1800,l:"[OK] Server stopped"},{d:2700,l:"[INFO] Starting server..."},{d:3600,l:"[OK] Datasources connected"},{d:4500,l:"[SUCCESS] ✓ Server RUNNING!"}],
      STOP:[{d:0,l:"[INFO] Initiating STOP..."},{d:1000,l:"[WARN] Draining..."},{d:2200,l:"[SUCCESS] ✓ Server STOPPED"}],
      START:[{d:0,l:"[INFO] Starting..."},{d:1200,l:"[INFO] Loading config..."},{d:2500,l:"[SUCCESS] ✓ Server RUNNING!"}],
    };
    const wlsMap={RESTART:["STOPPING","STOPPED","STARTING","RUNNING"],STOP:["STOPPING","STOPPED"],START:["STARTING","RUNNING"]};
    (wlsMap[op]||[]).forEach((st,i)=>setTimeout(()=>setWlsServers(prev=>prev.map(s=>s.id===serverId?{...s,status:st,operationStatus:st==="RUNNING"?null:st}:s)),i*(op==="RESTART"?2000:1500)));
    (steps[op]||[]).forEach(({d,l})=>setTimeout(()=>setTermLines(prev=>[...prev,l]),d));
  };

  const handleOp=(target,op,type="wls")=>setModal({target,op,type});

  const confirmOp=({reason,ticket,priority})=>{
    const{target,op,type}=modal;
    const name=typeof target==="string"?target:target.name;
    const entry={action:`${op} on ${name}`,user:user.name,target:name,operation:op,reason,ticket,priority,requestedBy:user.name,time:now(),resourceType:type};
    if(user.role==="admin"){
      push(ref(db,"auditLogs"),{...entry,status:"APPROVED"});
      addToast(`⚡ Executing: ${op}`,`${name} — authorized by ${user.name}`,C.green,"⚡");
      if(type==="wls")executeOp(target.id,op);
    }else{
      push(ref(db,"approvals"),{...entry,status:"PENDING"});
      addToast(`📤 Submitted for Approval`,`${op} on ${name} awaiting sign-off`,C.warning,"📤");
      if(emailAlerts){
        sendEmailAlert(`Change Request: ${op} on ${name}`,
          `New change request submitted.\n\nOperation: ${op}\nTarget: ${name}\nRequested by: ${user.name}\nPriority: ${priority}\nTicket: ${ticket||"N/A"}\nReason: ${reason}\n\nApprove at: https://lakhshit.in`,"CHANGE REQUEST");
      }
    }
    setModal(null);
  };

  const pendingApprovals=approvalList.filter(a=>a.status==="PENDING").length;
  const openIncidents=incidentList.filter(i=>i.status==="OPEN"||i.status==="ACKNOWLEDGED").length;
  const criticalWLS=wlsServers.filter(s=>s.status==="CRITICAL").length;
  const activeIssues=wlsIssues.filter(i=>i.status!=="RESOLVED").length;

  const ALL_TABS=[
    {id:"overview",label:"🌐 Overview",roles:["admin","operator","approver","viewer"]},
    {id:"weblogic",label:"⚡ WebLogic",roles:["admin","operator","viewer"]},
    {id:"compute",label:"💻 Compute",roles:["admin","operator","viewer"]},
    {id:"database",label:"🗄️ Database",roles:["admin","operator","viewer"]},
    {id:"network",label:"🔌 Network",roles:["admin","operator","viewer"]},
    {id:"incidents",label:`🚨 Incidents${openIncidents>0?` (${openIncidents})`:""}`,roles:["admin","operator","approver","viewer"]},
    {id:"maintenance",label:"🔧 Maintenance",roles:["admin","operator"]},
    {id:"tickets",label:`🎫 Tickets${ticketList.filter(t=>t.status==="OPEN").length>0?` (${ticketList.filter(t=>t.status==="OPEN").length})`:""}`,roles:["admin","operator","approver"]},
    {id:"patches",label:"📦 Patches",roles:["admin","operator"]},
    {id:"sla",label:"⏱️ SLA",roles:["admin","operator","viewer"]},
    {id:"capacity",label:"📈 Capacity",roles:["admin","operator","viewer"]},
    {id:"dr",label:"🔁 DR Readiness",roles:["admin","operator","viewer"]},
    {id:"oncall",label:"👨‍💼 On-Call",roles:["admin","operator","viewer"]},
    {id:"deployments",label:"🚀 Deployments",roles:["admin","operator","viewer"]},
    {id:"cost",label:"💰 Cost",roles:["admin","viewer"]},
    {id:"security",label:"🔐 Security",roles:["admin","viewer"]},
    {id:"alerts",label:"🔔 Alert Config",roles:["admin"]},
    {id:"operations",label:"⚙️ Operations",roles:["admin","operator"]},
    {id:"approvals",label:`✅ Approvals${pendingApprovals>0?` (${pendingApprovals})`:""}`,roles:["admin","approver"]},
    {id:"issues",label:`🔥 Issues${activeIssues>0?` (${activeIssues})`:""}`,roles:["admin","operator","viewer"]},
    {id:"autohealing",label:"🔄 Auto-Heal",roles:["admin","operator"]},
    {id:"audit",label:"📋 Audit",roles:["admin","approver","viewer"]},
  ].filter(t=>t.roles.includes(user.role));

  const sharedProps={C,wlsServers,compute,databases,lbs,wlsIssues,setWlsIssues,approvalList,auditList,incidentList,maintenanceList,ticketList,user,handleOp,termLines,setTermLines,executeOp,addToast,emailAlerts};

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.text,transition:"background .3s,color .3s"}}>
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}input,textarea,select,button{font-family:'DM Sans',sans-serif}@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes pr{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.5);opacity:0}}`}</style>

      <ToastContainer toasts={toasts} dismiss={id=>setToasts(prev=>prev.filter(t=>t.id!==id))}/>
      {modal&&<ApprovalModal op={modal.op} target={typeof modal.target==="string"?modal.target:modal.target.name} user={user} onConfirm={confirmOp} onCancel={()=>setModal(null)} C={C}/>}
      {showChatbot&&<ChatbotPanel onClose={()=>setShowChatbot(false)} C={C} wlsServers={wlsServers} compute={compute} databases={databases} incidentList={incidentList}/>}

      {/* Floating Chatbot Button */}
      <button onClick={()=>setShowChatbot(!showChatbot)} style={{position:"fixed",bottom:24,right:24,zIndex:500,width:54,height:54,borderRadius:"50%",background:G.purple,border:"none",cursor:"pointer",fontSize:24,boxShadow:"0 4px 20px rgba(213,0,249,0.4)",display:"flex",alignItems:"center",justifyContent:"center",transition:"transform .2s"}}
        title="OCI Assistant">🤖</button>

      <header style={{background:C.headerBg,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100,boxShadow:`0 2px 20px ${C.shadow}`}}>
        <div style={{maxWidth:1800,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:32,height:32,background:G.oci,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,boxShadow:`0 0 16px #C7463450`}}>☁️</div>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:"#e8eef8",lineHeight:1}}>GSC OCI Control Platform</div>
                <div style={{fontSize:9,color:"#4a6080",letterSpacing:1.5,textTransform:"uppercase"}}>Global Service Centre · Oracle Cloud Infrastructure</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {criticalWLS>0&&<div style={{display:"flex",alignItems:"center",gap:5,background:`${C.danger}20`,border:`1px solid ${C.danger}44`,borderRadius:20,padding:"3px 10px"}}><Pulse color={C.danger} size={6}/><span style={{fontSize:11,fontWeight:700,color:C.danger}}>{criticalWLS} CRITICAL</span></div>}
              {openIncidents>0&&<div style={{background:`${C.orange}20`,border:`1px solid ${C.orange}44`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,color:C.orange}}>{openIncidents} Incidents</div>}
              {emailAlerts&&<div style={{background:`${C.green}15`,border:`1px solid ${C.green}33`,borderRadius:20,padding:"3px 10px",fontSize:11,color:C.green}}>📧 Alerts ON</div>}
              <ThemeToggle isDark={isDark} toggle={toggleTheme}/>
              <div style={{display:"flex",alignItems:"center",gap:7,background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"4px 12px"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:G.oci,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,color:"#fff"}}>{user.initials}</div>
                <span style={{fontSize:12,fontWeight:600,color:C.text}}>{user.name}</span>
                <Badge text={ROLES[user.role]} color={C.blue}/>
              </div>
              <Btn color={C.red} onClick={onLogout} sm C={C}>Sign Out</Btn>
            </div>
          </div>
        </div>
        <div style={{maxWidth:1800,margin:"0 auto",padding:"0 16px",display:"flex",overflowX:"auto",borderTop:`1px solid ${C.border}`}}>
          {ALL_TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 13px",background:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${C.red}`:"2px solid transparent",color:tab===t.id?C.red:C.muted,cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap",transition:"all .2s"}}>{t.label}</button>)}
        </div>
      </header>

      <main style={{maxWidth:1800,margin:"0 auto",padding:"20px 16px",animation:"slideIn .25s ease"}}>
        {tab==="overview"&&<OverviewTab {...sharedProps}/>}
        {tab==="weblogic"&&<WebLogicTab {...sharedProps}/>}
        {tab==="compute"&&<ComputeTab {...sharedProps}/>}
        {tab==="database"&&<DatabaseTab {...sharedProps}/>}
        {tab==="network"&&<NetworkTab {...sharedProps}/>}
        {tab==="incidents"&&<IncidentsTab {...sharedProps}/>}
        {tab==="maintenance"&&<MaintenanceTab {...sharedProps}/>}
        {tab==="tickets"&&<TicketsTab {...sharedProps}/>}
        {tab==="patches"&&<PatchesTab {...sharedProps}/>}
        {tab==="sla"&&<SLATab {...sharedProps}/>}
        {tab==="capacity"&&<CapacityTab {...sharedProps}/>}
        {tab==="dr"&&<DRTab {...sharedProps}/>}
        {tab==="oncall"&&<OnCallTab {...sharedProps}/>}
        {tab==="deployments"&&<DeploymentsTab {...sharedProps}/>}
        {tab==="cost"&&<CostTab {...sharedProps}/>}
        {tab==="security"&&<SecurityTab {...sharedProps}/>}
        {tab==="alerts"&&<AlertConfigTab {...sharedProps} emailAlerts={emailAlerts} setEmailAlerts={setEmailAlerts}/>}
        {tab==="operations"&&<OperationsTab {...sharedProps}/>}
        {tab==="approvals"&&<ApprovalsTab {...sharedProps}/>}
        {tab==="issues"&&<IssuesTab {...sharedProps}/>}
        {tab==="autohealing"&&<AutoHealTab {...sharedProps}/>}
        {tab==="audit"&&<AuditTab {...sharedProps}/>}
      </main>
    </div>
  );
}

// ── CHATBOT PANEL ──────────────────────────────────────────
function ChatbotPanel({onClose,C,wlsServers,compute,databases,incidentList}){
  const [messages,setMessages]=useState([{role:"assistant",content:"👋 Hi! I'm your OCI Assistant. Ask me anything about your infrastructure — server status, incidents, performance, recommendations and more!"}]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const msgRef=useRef(null);
  useEffect(()=>{if(msgRef.current)msgRef.current.scrollTop=msgRef.current.scrollHeight;},[messages]);

  const getContext=()=>{
    const critical=wlsServers.filter(s=>s.status==="CRITICAL").map(s=>`${s.name}(CPU:${s.cpu}%,JVM:${s.jvmHeap}%)`).join(", ");
    const warning=wlsServers.filter(s=>s.status==="WARNING").map(s=>s.name).join(", ");
    const openInc=incidentList.filter(i=>i.status==="OPEN").length;
    return `You are an OCI (Oracle Cloud Infrastructure) expert assistant for GSC (Global Service Centre). 
Current infrastructure status:
- WebLogic servers: ${wlsServers.length} total, ${wlsServers.filter(s=>s.status==="RUNNING").length} running, ${wlsServers.filter(s=>s.status==="CRITICAL").length} critical
- Critical servers: ${critical||"None"}
- Warning servers: ${warning||"None"}  
- Compute instances: ${compute.filter(c=>c.status==="RUNNING").length}/${compute.length} running
- Databases: ${databases.length} available
- Open incidents: ${openInc}
- Average WLS CPU: ${Math.round(wlsServers.reduce((a,s)=>a+s.cpu,0)/wlsServers.length)}%
- Average JVM Heap: ${Math.round(wlsServers.reduce((a,s)=>a+s.jvmHeap,0)/wlsServers.length)}%
Be concise, technical and helpful. Provide actionable recommendations.`;
  };

  const send=async()=>{
    if(!input.trim()||loading)return;
    const userMsg={role:"user",content:input};
    setMessages(prev=>[...prev,userMsg]);
    setInput("");
    setLoading(true);
    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:500,
          system:getContext(),
          messages:[...messages.filter(m=>m.role!=="assistant"||messages.indexOf(m)>0),userMsg].map(m=>({role:m.role,content:m.content}))
        })
      });
      const data=await res.json();
      const reply=data.content?.[0]?.text||"Sorry, I couldn't process that.";
      setMessages(prev=>[...prev,{role:"assistant",content:reply}]);
    }catch(e){
      setMessages(prev=>[...prev,{role:"assistant",content:"⚠️ I'm having trouble connecting. Please check your network and try again."}]);
    }
    setLoading(false);
  };

  const quickQuestions=["What's the current status of all servers?","Which servers need immediate attention?","Recommend fixes for high JVM heap","Show me open incidents","What is the DR readiness status?"];

  return (
    <div style={{position:"fixed",bottom:90,right:24,zIndex:999,width:380,height:520,background:C.card,border:`1px solid ${C.purple}44`,borderRadius:20,boxShadow:`0 8px 40px ${C.purple}30`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{background:G.purple,padding:"14px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🤖</span>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:"#fff"}}>OCI Assistant</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.7)"}}>Powered by AI · GSC Infrastructure Expert</div>
          </div>
        </div>
        <button onClick={onClose} style={{background:"rgba(255,255,255,0.2)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",color:"#fff",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
      </div>

      <div ref={msgRef} style={{flex:1,overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:10}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            <div style={{maxWidth:"85%",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",background:m.role==="user"?G.purple:C.card2,color:m.role==="user"?"#fff":C.text,fontSize:13,lineHeight:1.5,border:m.role==="user"?"none":`1px solid ${C.border}`}}>
              {m.content}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",justifyContent:"flex-start"}}><div style={{padding:"10px 14px",borderRadius:"16px 16px 16px 4px",background:C.card2,border:`1px solid ${C.border}`,fontSize:13,color:C.muted}}>🤖 Thinking...</div></div>}
      </div>

      <div style={{padding:"8px 12px",borderTop:`1px solid ${C.border}`}}>
        <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
          {quickQuestions.slice(0,3).map(q=>(
            <button key={q} onClick={()=>{setInput(q);}} style={{padding:"3px 10px",background:`${C.purple}15`,border:`1px solid ${C.purple}33`,borderRadius:20,color:C.purple,fontSize:10,cursor:"pointer",fontWeight:600}}>{q.slice(0,25)}...</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about your infrastructure..." style={{flex:1,padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={send} disabled={loading||!input.trim()} style={{padding:"9px 14px",background:G.purple,border:"none",borderRadius:10,color:"#fff",cursor:loading?"not-allowed":"pointer",fontWeight:700,fontSize:13,opacity:loading||!input.trim()?0.5:1}}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ── ALERT CONFIG TAB ───────────────────────────────────────
function AlertConfigTab({C,emailAlerts,setEmailAlerts,addToast}){
  const [email,setEmail]=useState(ALERT_EMAIL);
  const [thresholds,setThresholds]=useState({cpu:85,mem:90,jvm:92,gcTime:100});
  const [rules,setRules]=useState([
    {id:1,name:"Critical Server Alert",trigger:"Server status → CRITICAL",action:"Email + Auto P1 Incident",enabled:true,lastTriggered:"2 min ago"},
    {id:2,name:"High CPU Warning",trigger:"CPU > 85% for 5 min",action:"Email notification",enabled:true,lastTriggered:"Never"},
    {id:3,name:"JVM Heap Critical",trigger:"JVM Heap > 92%",action:"Email + Auto-heal trigger",enabled:true,lastTriggered:"10 min ago"},
    {id:4,name:"Pending Approval",trigger:"New approval request",action:"Email to approvers",enabled:true,lastTriggered:"1 hr ago"},
    {id:5,name:"P1 Incident Created",trigger:"Priority 1 incident",action:"Email all roles",enabled:true,lastTriggered:"Never"},
    {id:6,name:"Daily Health Report",trigger:"Every day 8:00 AM",action:"Summary email",enabled:false,lastTriggered:"Never"},
  ]);
  const toggle=(id)=>setRules(prev=>prev.map(r=>r.id===id?{...r,enabled:!r.enabled}:r));

  const testEmail=async()=>{
    addToast("📧 Sending test email...","Check your inbox in a moment",C.blue,"📧");
    const sent=await sendEmailAlert("Test Alert — GSC OCI Platform","This is a test alert from your GSC OCI Control Platform. Email alerts are working correctly!\n\nDashboard: https://lakhshit.in","TEST");
    if(sent)addToast("✅ Test email sent!","Check your inbox",C.green,"✅");
    else addToast("⚠️ Email not configured","Set up EmailJS credentials in the code",C.warning,"⚠️");
  };

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>🔔 Alert Configuration</h2>
      <p style={{color:C.muted,marginBottom:20,fontSize:12}}>Configure email alerts · Set thresholds · Manage notification rules</p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        {/* Email Setup */}
        <GlowCard color={C.blue} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>📧 Email Configuration</span>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,color:C.muted}}>Alerts</span>
              <div onClick={()=>setEmailAlerts(!emailAlerts)} style={{width:40,height:22,borderRadius:11,background:emailAlerts?C.green:C.dim,cursor:"pointer",position:"relative",transition:"all .3s"}}>
                <div style={{position:"absolute",top:2,left:emailAlerts?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .3s"}}/>
              </div>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Alert Email Address</div>
            <input value={email} onChange={e=>setEmail(e.target.value)} style={{width:"100%",padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
          </div>
          <div style={{background:`${C.blue}12`,border:`1px solid ${C.blue}30`,borderRadius:10,padding:"12px 14px",marginBottom:14,fontSize:12,color:C.muted}}>
            <div style={{fontWeight:700,color:C.blue,marginBottom:6}}>📋 EmailJS Setup (Free)</div>
            <div style={{marginBottom:3}}>1. Go to <span style={{color:C.cyan}}>emailjs.com</span> → Sign up free</div>
            <div style={{marginBottom:3}}>2. Create an Email Service (Gmail/Outlook)</div>
            <div style={{marginBottom:3}}>3. Create an Email Template</div>
            <div style={{marginBottom:3}}>4. Copy Service ID, Template ID, Public Key</div>
            <div>5. Paste in the code at the top of App.jsx</div>
          </div>
          <Btn grad={G.blue} color={C.blue} onClick={testEmail} style={{width:"100%"}} C={C}>📧 Send Test Email</Btn>
        </GlowCard>

        {/* Thresholds */}
        <GlowCard color={C.orange} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15}}>⚡ Alert Thresholds</div>
          {[["CPU Usage (%)",thresholds.cpu,"cpu",85,99],["Memory (%)",thresholds.mem,"mem",85,99],["JVM Heap (%)",thresholds.jvm,"jvm",88,99],["GC Time (ms)",thresholds.gcTime,"gcTime",50,200]].map(([label,val,key,min,max])=>(
            <div key={key} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:12}}>
                <span style={{color:C.muted}}>{label}</span>
                <span style={{color:C.orange,fontWeight:700}}>{val}{key==="gcTime"?"ms":"%"}</span>
              </div>
              <input type="range" min={min} max={max} value={val} onChange={e=>setThresholds(t=>({...t,[key]:+e.target.value}))} style={{width:"100%",accentColor:C.orange}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:C.dim,marginTop:2}}>
                <span>{min}{key==="gcTime"?"ms":"%"}</span><span>{max}{key==="gcTime"?"ms":"%"}</span>
              </div>
            </div>
          ))}
          <Btn grad={G.orange} color={C.orange} onClick={()=>addToast("✅ Thresholds saved","Alert thresholds updated",C.green,"✅")} style={{width:"100%"}} C={C}>Save Thresholds</Btn>
        </GlowCard>
      </div>

      {/* Alert Rules */}
      <GlowCard color={C.purple} C={C}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15}}>📋 Alert Rules</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {rules.map(r=>(
            <div key={r.id} style={{background:C.card2,borderRadius:12,padding:"13px 16px",border:`1px solid ${r.enabled?C.purple+"44":C.border}`,display:"flex",gap:14,alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:4}}>
                  <span style={{fontWeight:700,fontSize:13,color:C.text}}>{r.name}</span>
                  {r.enabled&&<Badge text="ACTIVE" color={C.green} dot/>}
                </div>
                <div style={{fontSize:11,color:C.warning,marginBottom:2}}>⚡ Trigger: {r.trigger}</div>
                <div style={{fontSize:11,color:C.cyan,marginBottom:3}}>📧 Action: {r.action}</div>
                <div style={{fontSize:10,color:C.muted}}>Last triggered: {r.lastTriggered}</div>
              </div>
              <div onClick={()=>toggle(r.id)} style={{width:40,height:22,borderRadius:11,background:r.enabled?C.green:C.dim,cursor:"pointer",position:"relative",transition:"all .3s",flexShrink:0}}>
                <div style={{position:"absolute",top:2,left:r.enabled?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .3s"}}/>
              </div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

// ── MAINTENANCE WINDOW TAB ─────────────────────────────────
function MaintenanceTab({C,maintenanceList,wlsServers,compute,user,addToast}){
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({title:"",description:"",systems:"",startDate:"",startTime:"",duration:"2",type:"Planned",approvedBy:""});
  const allSystems=[...wlsServers.map(s=>s.name),...compute.map(c=>c.name)].join(", ");

  const save=()=>{
    if(!form.title.trim())return;
    push(ref(db,"maintenance"),{...form,status:"SCHEDULED",createdBy:user.name,createdAt:now()});
    setForm({title:"",description:"",systems:"",startDate:"",startTime:"",duration:"2",type:"Planned",approvedBy:""});
    setShowForm(false);
    addToast("📅 Maintenance scheduled","Team has been notified",C.blue,"📅");
  };

  const updateStatus=(id,status)=>update(ref(db,`maintenance/${id}`),{status});
  const upcoming=maintenanceList.filter(m=>m.status==="SCHEDULED");
  const active=maintenanceList.filter(m=>m.status==="IN_PROGRESS");
  const completed=maintenanceList.filter(m=>m.status==="COMPLETED");

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20}}>
        <div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>🔧 Maintenance Windows</h2>
          <p style={{color:C.muted,margin:0,fontSize:12}}>Schedule downtime · Notify stakeholders · Track maintenance history</p>
        </div>
        <Btn grad={G.blue} color={C.blue} onClick={()=>setShowForm(!showForm)} C={C}>+ Schedule Maintenance</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:18}}>
        {[["Scheduled",upcoming.length,C.blue,"📅"],["In Progress",active.length,C.orange,"🔧"],["Completed",completed.length,C.green,"✅"]].map(([l,v,c,i])=>(
          <GlowCard key={l} color={c} style={{padding:"14px 16px"}} C={C}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:26,fontWeight:700,color:c}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:4}}>{i} {l.toUpperCase()}</div>
          </GlowCard>
        ))}
      </div>

      {active.length>0&&(
        <GlowCard color={C.orange} style={{marginBottom:16}} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:15,display:"flex",alignItems:"center",gap:10}}>
            <span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>🔧</span>Active Maintenance
          </div>
          {active.map(m=>(
            <div key={m.id} style={{background:C.card2,borderRadius:10,padding:"12px 14px",marginBottom:8,borderLeft:`3px solid ${C.orange}`}}>
              <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{m.title}</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:6}}>{m.systems}</div>
              <div style={{display:"flex",gap:10}}>
                <Btn grad={G.green} onClick={()=>updateStatus(m.id,"COMPLETED")} sm C={C}>✅ Mark Complete</Btn>
              </div>
            </div>
          ))}
        </GlowCard>
      )}

      {showForm&&(
        <GlowCard color={C.blue} style={{marginBottom:16}} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15}}>Schedule Maintenance Window</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Maintenance title *" style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
              {["Planned","Emergency","Patching","Upgrade","DR Test"].map(t=><option key={t}>{t}</option>)}
            </select>
            <input value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} type="date" style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <input value={form.startTime} onChange={e=>setForm(f=>({...f,startTime:e.target.value}))} type="time" style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <input value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} placeholder="Duration (hours)" type="number" style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <input value={form.approvedBy} onChange={e=>setForm(f=>({...f,approvedBy:e.target.value}))} placeholder="Approved by" style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          </div>
          <input value={form.systems} onChange={e=>setForm(f=>({...f,systems:e.target.value}))} placeholder={`Affected systems (e.g. ${allSystems.slice(0,40)}...)`} style={{width:"100%",padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",marginTop:10}}/>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description / scope of work..." rows={2} style={{width:"100%",padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",resize:"vertical",marginTop:10}}/>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn grad={G.blue} onClick={save} C={C}>📅 Schedule</Btn>
            <Btn onClick={()=>setShowForm(false)} C={C}>Cancel</Btn>
          </div>
        </GlowCard>
      )}

      <GlowCard color={C.blue} C={C}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>📅 Upcoming Maintenance</div>
        {upcoming.length===0?<div style={{color:C.muted,fontSize:13,textAlign:"center",padding:"20px 0"}}>No maintenance scheduled.</div>
          :upcoming.map(m=>(
            <div key={m.id} style={{background:C.card2,borderRadius:12,padding:"14px 16px",marginBottom:10,borderLeft:`3px solid ${C.blue}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{m.title}</div>
                  <div style={{display:"flex",gap:10,fontSize:11,color:C.muted,flexWrap:"wrap"}}>
                    <span>📅 {m.startDate} {m.startTime}</span>
                    <span>⏱ {m.duration}h</span>
                    {m.approvedBy&&<span>✅ Approved: {m.approvedBy}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <Badge text={m.type} color={C.blue}/>
                  <Btn sm grad={G.orange} onClick={()=>updateStatus(m.id,"IN_PROGRESS")} C={C}>▶ Start</Btn>
                  <Btn sm danger onClick={()=>remove(ref(db,`maintenance/${m.id}`))} C={C}>✕</Btn>
                </div>
              </div>
              {m.systems&&<div style={{fontSize:11,color:C.cyan}}>🖥️ {m.systems}</div>}
              {m.description&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{m.description}</div>}
            </div>
          ))}
      </GlowCard>
    </div>
  );
}

// ── TICKETS TAB ────────────────────────────────────────────
function TicketsTab({C,ticketList,user,wlsServers,incidentList,addToast}){
  const [showForm,setShowForm]=useState(false);
  const [filter,setFilter]=useState("OPEN");
  const [form,setForm]=useState({title:"",description:"",priority:"Medium",assignee:"",system:"",type:"Incident",externalRef:""});

  const create=()=>{
    if(!form.title.trim())return;
    push(ref(db,"tickets"),{...form,status:"OPEN",createdBy:user.name,createdAt:now(),ticketId:`TKT-${Date.now().toString().slice(-6)}`});
    setForm({title:"",description:"",priority:"Medium",assignee:"",system:"",type:"Incident",externalRef:""});
    setShowForm(false);
    addToast("🎫 Ticket created","New ticket added to queue",C.blue,"🎫");
  };

  const updateStatus=(id,status)=>update(ref(db,`tickets/${id}`),{status,updatedAt:now()});
  const filtered=filter==="ALL"?ticketList:ticketList.filter(t=>t.status===filter);
  const priorityColor={Critical:C.danger,High:C.warning,Medium:C.orange,Low:C.green};

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20}}>
        <div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>🎫 Ticket Management</h2>
          <p style={{color:C.muted,margin:0,fontSize:12}}>JIRA/ServiceNow style ticketing · Track issues · Link to incidents</p>
        </div>
        <Btn grad={G.blue} color={C.blue} onClick={()=>setShowForm(!showForm)} C={C}>+ Create Ticket</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[["Open",ticketList.filter(t=>t.status==="OPEN").length,C.danger],["In Progress",ticketList.filter(t=>t.status==="IN_PROGRESS").length,C.blue],["Resolved",ticketList.filter(t=>t.status==="RESOLVED").length,C.green],["Total",ticketList.length,C.muted]].map(([l,v,c])=>(
          <GlowCard key={l} color={c} style={{padding:"13px 14px"}} C={C}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:24,fontWeight:700,color:c}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:3}}>{l.toUpperCase()}</div>
          </GlowCard>
        ))}
      </div>

      {showForm&&(
        <GlowCard color={C.blue} style={{marginBottom:16}} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>Create Ticket</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Ticket title *" style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
              {["Incident","Change Request","Problem","Service Request","Task"].map(t=><option key={t}>{t}</option>)}
            </select>
            <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
              {["Critical","High","Medium","Low"].map(p=><option key={p}>{p}</option>)}
            </select>
            <select value={form.assignee} onChange={e=>setForm(f=>({...f,assignee:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
              <option value="">Assign to…</option>
              {["Rajesh Kumar","Priya Sharma","Amit Verma","Sneha Patel"].map(n=><option key={n}>{n}</option>)}
            </select>
            <select value={form.system} onChange={e=>setForm(f=>({...f,system:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
              <option value="">Affected System</option>
              {wlsServers.map(s=><option key={s.id}>{s.name}</option>)}
            </select>
            <input value={form.externalRef} onChange={e=>setForm(f=>({...f,externalRef:e.target.value}))} placeholder="JIRA/ServiceNow Ref (optional)" style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
          </div>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Describe the issue..." rows={3} style={{width:"100%",padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",resize:"vertical",marginTop:10}}/>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn grad={G.blue} onClick={create} C={C}>🎫 Create Ticket</Btn>
            <Btn onClick={()=>setShowForm(false)} C={C}>Cancel</Btn>
          </div>
        </GlowCard>
      )}

      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        {["OPEN","IN_PROGRESS","RESOLVED","CLOSED","ALL"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${filter===f?C.blue:C.border}`,background:filter===f?`${C.blue}20`:"transparent",color:filter===f?C.blue:C.muted,fontSize:11,cursor:"pointer",fontWeight:700}}>{f}</button>)}
      </div>

      {filtered.length===0?<GlowCard color={C.green} style={{textAlign:"center",padding:36}} C={C}><div style={{color:C.muted}}>No tickets found.</div></GlowCard>
        :<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(t=>(
            <GlowCard key={t.id} color={priorityColor[t.priority]||C.blue} style={{padding:"14px 18px"}} C={C}>
              <div style={{display:"flex",gap:14,alignItems:"center"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"monospace",fontSize:11,color:C.muted}}>{t.ticketId}</span>
                    <span style={{fontWeight:700,fontSize:14,color:C.text}}>{t.title}</span>
                    <Badge text={t.priority} color={priorityColor[t.priority]||C.blue}/>
                    <Badge text={t.type} color={C.blue}/>
                    {t.externalRef&&<Badge text={t.externalRef} color={C.purple}/>}
                  </div>
                  <div style={{display:"flex",gap:12,fontSize:11,color:C.muted,flexWrap:"wrap"}}>
                    {t.system&&<span>🖥️ {t.system}</span>}
                    {t.assignee&&<span>👤 {t.assignee}</span>}
                    <span>🕐 {t.createdAt}</span>
                    <span>By {t.createdBy}</span>
                  </div>
                  {t.description&&<p style={{color:C.muted,fontSize:12,margin:"6px 0 0",lineHeight:1.4}}>{t.description}</p>}
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
                  <Badge text={t.status} color={statusColor(t.status,C)}/>
                  <select value={t.status} onChange={e=>updateStatus(t.id,e.target.value)} style={{padding:"4px 8px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:11,outline:"none",fontFamily:"inherit"}}>
                    {["OPEN","IN_PROGRESS","RESOLVED","CLOSED"].map(s=><option key={s}>{s}</option>)}
                  </select>
                  <button onClick={()=>remove(ref(db,`tickets/${t.id}`))} style={{padding:"4px 10px",background:`${C.red}15`,border:`1px solid ${C.red}33`,borderRadius:8,color:C.red,fontSize:11,cursor:"pointer",fontWeight:700}}>✕</button>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      }
    </div>
  );
}

// ── PATCHES TAB ────────────────────────────────────────────
function PatchesTab({C,user,addToast}){
  const [patches,setPatches]=useState(INIT_PATCHES);
  const [filter,setFilter]=useState("ALL");
  const priorityColor={Critical:C.danger,High:C.warning,Medium:C.orange,Low:C.green};

  const updateStatus=(id,status)=>{
    setPatches(prev=>prev.map(p=>p.id===id?{...p,status}:p));
    addToast(`📦 Patch ${status.toLowerCase()}`,"Patch status updated",C.green,"📦");
  };

  const filtered=filter==="ALL"?patches:patches.filter(p=>p.status===filter||p.priority===filter);
  const pending=patches.filter(p=>p.status==="PENDING").length;
  const critical=patches.filter(p=>p.priority==="Critical"&&p.status==="PENDING").length;

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>📦 Patch Management</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Security patches · Compliance tracking · CVE management</p>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[["Pending",pending,C.warning,"📦"],["Critical CVEs",critical,C.danger,"🔴"],["Scheduled",patches.filter(p=>p.status==="SCHEDULED").length,C.blue,"📅"],["Completed",patches.filter(p=>p.status==="COMPLETED").length,C.green,"✅"]].map(([l,v,c,i])=>(
          <GlowCard key={l} color={c} style={{padding:"13px 14px"}} C={C}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:24,fontWeight:700,color:c}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:4}}>{i} {l.toUpperCase()}</div>
          </GlowCard>
        ))}
      </div>

      {critical>0&&(
        <GlowCard color={C.danger} style={{marginBottom:16}} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14,color:C.danger}}>⚠️ Critical Security Patches Required</div>
          {patches.filter(p=>p.priority==="Critical"&&p.status==="PENDING").map(p=>(
            <div key={p.id} style={{background:C.card2,borderRadius:9,padding:"10px 12px",marginBottom:7,borderLeft:`3px solid ${C.danger}`}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:3}}>{p.name}</div>
              <div style={{display:"flex",gap:10,fontSize:11,color:C.muted,flexWrap:"wrap"}}>
                <span style={{color:C.danger}}>⚠ CVE: {p.cve}</span>
                <span>📅 Release: {p.releaseDate}</span>
                <span>🖥️ {p.server}</span>
              </div>
            </div>
          ))}
        </GlowCard>
      )}

      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        {["ALL","PENDING","SCHEDULED","COMPLETED","Critical","High"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${filter===f?C.red:C.border}`,background:filter===f?`${C.red}20`:"transparent",color:filter===f?C.red:C.muted,fontSize:11,cursor:"pointer",fontWeight:700}}>{f}</button>)}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(p=>(
          <GlowCard key={p.id} color={priorityColor[p.priority]||C.blue} style={{padding:"14px 18px"}} C={C}>
            <div style={{display:"flex",gap:14,alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:14,color:C.text}}>{p.name}</span>
                  <Badge text={p.priority} color={priorityColor[p.priority]||C.blue}/>
                  <Badge text={p.impact} color={C.cyan}/>
                  {p.cve!=="N/A"&&<Badge text={p.cve} color={C.danger}/>}
                </div>
                <div style={{display:"flex",gap:12,fontSize:11,color:C.muted,flexWrap:"wrap"}}>
                  <span>🖥️ {p.server}</span>
                  <span>📅 Released: {p.releaseDate}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center"}}>
                <Badge text={p.status} color={statusColor(p.status,C)}/>
                {p.status==="PENDING"&&(
                  <Btn sm grad={G.blue} onClick={()=>updateStatus(p.id,"SCHEDULED")} C={C}>📅 Schedule</Btn>
                )}
                {p.status==="SCHEDULED"&&(
                  <Btn sm grad={G.green} onClick={()=>updateStatus(p.id,"COMPLETED")} C={C}>✅ Mark Done</Btn>
                )}
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}

// ── Simplified remaining tabs ──────────────────────────────
function OverviewTab({C,wlsServers,compute,databases,lbs,wlsIssues,approvalList,auditList,incidentList}){
  const running=wlsServers.filter(s=>s.status==="RUNNING").length;
  const critical=wlsServers.filter(s=>s.status==="CRITICAL").length;
  const openInc=incidentList.filter(i=>["OPEN","ACKNOWLEDGED"].includes(i.status)).length;
  return (
    <div>
      <div style={{marginBottom:18}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:0}}>🌐 OCI Infrastructure Overview</h2>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}><Pulse color={C.green} size={6}/><span style={{fontSize:11,color:C.muted}}>Live · ap-mumbai-1 (Primary) · ap-hyderabad-1 (DR) · Updates every 3s</span></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:16}}>
        {[
          {l:"Compute Running",v:`${compute.filter(c=>c.status==="RUNNING").length}/${compute.length}`,c:C.green,i:"💻"},
          {l:"WebLogic Running",v:`${running}/${wlsServers.length}`,c:C.orange,i:"⚡"},
          {l:"Databases Up",v:`${databases.filter(d=>d.status==="AVAILABLE").length}/${databases.length}`,c:C.blue,i:"🗄️"},
          {l:"LB Active",v:`${lbs.filter(l=>l.status==="ACTIVE").length}/${lbs.length}`,c:C.teal,i:"⚖️"},
          {l:"Critical Alerts",v:critical,c:critical>0?C.danger:C.green,i:"🔴"},
          {l:"Open Incidents",v:openInc,c:openInc>0?C.orange:C.green,i:"🚨"},
          {l:"Auto-Healing",v:wlsIssues.filter(i=>i.status==="HEALING").length,c:C.cyan,i:"🔄"},
          {l:"Pending Ops",v:(approvalList||[]).filter(a=>a.status==="PENDING").length,c:C.warning,i:"⏳"},
        ].map(s=>(
          <GlowCard key={s.l} color={s.c} style={{padding:"12px 10px"}} C={C}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:9,color:C.muted,marginTop:4,letterSpacing:.8}}>{s.l.toUpperCase()}</div>
              </div>
              <span style={{fontSize:14,opacity:.5}}>{s.i}</span>
            </div>
          </GlowCard>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:14,marginBottom:14}}>
        <GlowCard color={C.blue} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14,display:"flex",justifyContent:"space-between"}}><span>💻 Live Server Matrix</span><div style={{display:"flex",alignItems:"center",gap:4}}><Pulse color={C.green} size={6}/><span style={{fontSize:10,color:C.muted,fontWeight:400}}>Live</span></div></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {wlsServers.map(s=>(
              <div key={s.id} style={{background:C.card2,borderRadius:10,padding:10,border:`1px solid ${statusColor(s.status,C)}22`,transition:"border .3s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}><div style={{display:"flex",alignItems:"center",gap:6}}><Pulse color={statusColor(s.status,C)} size={6}/><span style={{fontWeight:700,fontSize:11,fontFamily:"monospace",color:C.text}}>{s.name}</span></div><Badge text={s.status} color={statusColor(s.status,C)}/></div>
                <MetricBar value={s.cpu} label="CPU" warn={70} crit={85} small C={C}/>
                <div style={{marginTop:4}}><MetricBar value={s.jvmHeap} label="JVM" warn={80} crit={92} small C={C}/></div>
              </div>
            ))}
          </div>
        </GlowCard>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <GlowCard color={C.danger} C={C}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>🚨 Active Issues</div>
            {wlsIssues.filter(i=>i.status!=="RESOLVED").length===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"10px 0"}}>✅ All clear</div>
              :wlsIssues.filter(i=>i.status!=="RESOLVED").map(i=>(
                <div key={i.id} style={{padding:"7px 0",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><div style={{fontWeight:700,fontSize:11,color:i.severity==="CRITICAL"?C.danger:C.warning,fontFamily:"monospace"}}>{i.server}</div><div style={{fontSize:10,color:C.muted}}>{i.type}</div></div>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>{i.status==="HEALING"&&<span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:12}}>🔄</span>}<Badge text={i.severity} color={i.severity==="CRITICAL"?C.danger:C.warning}/></div>
                </div>
              ))}
          </GlowCard>
          <GlowCard color={C.purple} C={C}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>📋 Recent Activity</div>
            {auditList.length===0?<div style={{color:C.muted,fontSize:11}}>No activity yet.</div>
              :[...auditList].reverse().slice(0,5).map(a=>(
                <div key={a.id} style={{padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{fontWeight:600,fontSize:11,color:C.text}}>{a.action}</div>
                  <div style={{color:C.muted,fontSize:10,marginTop:2}}>{a.user} · {a.time}</div>
                </div>
              ))}
          </GlowCard>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        <GlowCard color={C.cyan} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>🗄️ Databases</div>
          {databases.map(d=>(
            <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <div><div style={{fontWeight:700,fontSize:11,fontFamily:"monospace",color:C.text}}>{d.name}</div><div style={{fontSize:10,color:C.muted}}>{d.type} · {d.region}</div></div>
              <div style={{display:"flex",gap:5}}><Badge text={`${d.cpu}%`} color={d.cpu>70?C.warning:C.green}/><Badge text={d.status} color={statusColor(d.status,C)}/></div>
            </div>
          ))}
        </GlowCard>
        <GlowCard color={C.teal} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>⚖️ Load Balancers</div>
          {lbs.map(l=>(
            <div key={l.id} style={{background:C.card2,borderRadius:8,padding:10,marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span style={{fontWeight:700,fontSize:11,color:C.text}}>{l.name}</span><Badge text={l.status} color={statusColor(l.status,C)}/></div>
              <div style={{display:"flex",gap:8,fontSize:11}}><span style={{color:C.teal}}>⚡{l.rps.toLocaleString()} RPS</span><span style={{color:l.healthyBackends<l.backends?C.warning:C.green}}>{l.healthyBackends}/{l.backends} backends</span></div>
            </div>
          ))}
        </GlowCard>
        <GlowCard color={C.orange} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>🚨 Open Incidents</div>
          {openInc===0?<div style={{color:C.muted,fontSize:12,padding:"8px 0"}}>✅ No open incidents</div>
            :incidentList.filter(i=>["OPEN","ACKNOWLEDGED"].includes(i.status)).slice(0,4).map(i=>(
              <div key={i.id} style={{padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontWeight:700,fontSize:11,color:i.priority==="P1"?C.danger:C.warning}}>{i.title?.slice(0,35)}...</div>
                <div style={{fontSize:10,color:C.muted}}>{i.priority} · {i.assignee}</div>
              </div>
            ))}
        </GlowCard>
      </div>
    </div>
  );
}

function WebLogicTab({C,wlsServers,user,handleOp}){
  const [sel,setSel]=useState(null);
  const s=sel?wlsServers.find(x=>x.id===sel):null;
  const canOp=user.role==="admin"||user.role==="operator";
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>⚡ WebLogic Servers</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Live JVM metrics · Click server for details</p>
      <div style={{display:"grid",gridTemplateColumns:s?"1fr 360px":"1fr",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,alignContent:"start"}}>
          {wlsServers.map(sv=>(
            <GlowCard key={sv.id} color={statusColor(sv.status,C)} onClick={()=>setSel(sel===sv.id?null:sv.id)} style={{cursor:"pointer",padding:"13px 15px"}} C={C}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
                <div><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}><Pulse color={statusColor(sv.status,C)} size={7}/><span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:C.text}}>{sv.name}</span></div><div style={{fontSize:10,color:C.muted}}>{sv.host}</div></div>
                <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}><Badge text={sv.status} color={statusColor(sv.status,C)} dot/><Badge text={sv.env} color={sv.env==="Production"?C.red:sv.env==="UAT"?C.blue:C.teal}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:9}}>
                {[["CPU",sv.cpu+"%",sv.cpu>85?C.danger:sv.cpu>70?C.warning:C.green],["MEM",sv.mem+"%",sv.mem>90?C.danger:sv.mem>75?C.warning:C.green],["JVM",sv.jvmHeap+"%",sv.jvmHeap>92?C.danger:sv.jvmHeap>80?C.warning:C.green],["THR",sv.threads,sv.threads/sv.maxThreads>.9?C.danger:sv.threads/sv.maxThreads>.75?C.warning:C.green]].map(([l,v,c])=>(
                  <div key={l} style={{background:C.bg,borderRadius:7,padding:"6px 3px",textAlign:"center"}}><div style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:c,transition:"color .3s"}}>{v}</div><div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div></div>
                ))}
              </div>
              <div style={{fontSize:10,color:C.muted}}>⏱ {fmtUptime(sv.uptimeSecs)} · {sv.deployments} apps · WLS {sv.version}</div>
              {["STARTING","STOPPING","RESTARTING"].includes(sv.status)&&<div style={{marginTop:6,fontSize:10,color:C.cyan,display:"flex",alignItems:"center",gap:3}}><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>{sv.status}...</div>}
            </GlowCard>
          ))}
        </div>
        {s&&<div style={{position:"sticky",top:80,height:"fit-content",display:"flex",flexDirection:"column",gap:10}}>
          <GlowCard color={statusColor(s.status,C)} C={C}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:C.text}}>{s.name}</div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginTop:3}}>{s.host}:{s.port}</div></div><button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button></div>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
              <MetricBar value={s.cpu} label="CPU" warn={70} crit={85} C={C}/>
              <MetricBar value={s.mem} label="Memory" warn={75} crit={90} C={C}/>
              <MetricBar value={s.jvmHeap} label="JVM Heap" warn={80} crit={92} C={C}/>
              <MetricBar value={s.gcTime} max={200} label="GC Time" warn={50} crit={100} unit="ms" C={C}/>
              <MetricBar value={s.threads} max={s.maxThreads} label={`Threads (max ${s.maxThreads})`} warn={75} crit={90} unit="" C={C}/>
            </div>
            {canOp&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
              {[["RESTART","🔄",C.blue],["STOP","⏹️",C.danger],["START","▶️",C.green]].map(([op,icon,color])=>(
                <button key={op} onClick={()=>handleOp(s,op,"wls")} style={{padding:"9px 4px",background:`${color}15`,border:`1px solid ${color}44`,borderRadius:9,cursor:"pointer",textAlign:"center",color,fontWeight:700,fontSize:10}}>
                  <div style={{fontSize:17,marginBottom:2}}>{icon}</div>{op}
                </button>
              ))}
            </div>}
            {user.role!=="admin"&&<div style={{fontSize:10,color:C.warning,marginTop:7,textAlign:"center"}}>⚠ Requires approval</div>}
          </GlowCard>
        </div>}
      </div>
    </div>
  );
}

function ComputeTab({C,compute,user,handleOp}){
  const [sel,setSel]=useState(null);
  const s=sel?compute.find(c=>c.id===sel):null;
  const canOp=user.role==="admin"||user.role==="operator";
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>💻 Compute Instances</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>{compute.length} instances · Live metrics</p>
      <div style={{display:"grid",gridTemplateColumns:s?"1fr 360px":"1fr",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,alignContent:"start"}}>
          {compute.map(c=>(
            <GlowCard key={c.id} color={statusColor(c.status,C)} onClick={()=>setSel(sel===c.id?null:c.id)} style={{cursor:"pointer",padding:"13px 15px"}} C={C}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
                <div><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}><Pulse color={statusColor(c.status,C)} size={7}/><span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:C.text}}>{c.name}</span></div><div style={{fontSize:10,color:C.muted}}>{c.shape}</div></div>
                <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}><Badge text={c.status} color={statusColor(c.status,C)} dot/><Badge text={c.role} color={C.blue}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:9}}>
                {[["OCPU",c.ocpu,C.cyan],["RAM",c.ram+"G",C.purple],["CPU%",c.status!=="STOPPED"?c.cpu+"%":"-",c.cpu>85?C.danger:c.cpu>70?C.warning:C.green],["MEM%",c.status!=="STOPPED"?c.mem+"%":"-",c.mem>88?C.danger:c.mem>75?C.warning:C.green]].map(([l,v,col])=>(
                  <div key={l} style={{background:C.bg,borderRadius:7,padding:"6px 3px",textAlign:"center"}}><div style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:col,transition:"color .3s"}}>{v}</div><div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div></div>
                ))}
              </div>
              <div style={{fontSize:10,color:C.muted}}>📍 {c.region}/{c.ad} · {c.os}{c.status!=="STOPPED"?` · ⏱ ${fmtUptime(c.uptimeSecs)}`:""}</div>
            </GlowCard>
          ))}
        </div>
        {s&&<div style={{position:"sticky",top:80,height:"fit-content"}}>
          <GlowCard color={statusColor(s.status,C)} C={C}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16,color:C.text}}>{s.name}</div><div style={{fontSize:10,color:C.muted,marginTop:3}}>{s.shape}</div></div><button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button></div>
            {s.status!=="STOPPED"&&<div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}><MetricBar value={s.cpu} label="CPU" warn={70} crit={88} C={C}/><MetricBar value={s.mem} label="Memory" warn={75} crit={90} C={C}/></div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>
              {[["OCPU",s.ocpu],["RAM",s.ram+"GB"],["OS",s.os],["Region",s.region],["Uptime",fmtUptime(s.uptimeSecs)]].map(([l,v])=>(
                <div key={l} style={{background:C.bg,borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:9,color:C.muted,marginBottom:2,textTransform:"uppercase"}}>{l}</div><div style={{fontSize:12,fontWeight:600,fontFamily:"monospace",color:C.text}}>{v}</div></div>
              ))}
            </div>
            {canOp&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
              {[["RESTART","🔄",C.blue],["STOP","⏹️",C.danger],["START","▶️",C.green]].map(([op,icon,color])=>(
                <button key={op} onClick={()=>handleOp(s,op,"compute")} style={{padding:"9px 4px",background:`${color}15`,border:`1px solid ${color}44`,borderRadius:9,cursor:"pointer",textAlign:"center",color,fontWeight:700,fontSize:10}}><div style={{fontSize:17,marginBottom:2}}>{icon}</div>{op}</button>
              ))}
            </div>}
          </GlowCard>
        </div>}
      </div>
    </div>
  );
}

function DatabaseTab({C,databases}){
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>🗄️ Oracle Databases</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>ATP · ADW · DB Systems · Live metrics</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {databases.map(d=>(
          <GlowCard key={d.id} color={statusColor(d.status,C)} C={C}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div><div style={{fontFamily:"monospace",fontWeight:700,fontSize:13,marginBottom:3,color:C.text}}>{d.name}</div><div style={{fontSize:10,color:C.muted}}>{d.type}</div></div>
              <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}><Badge text={d.status} color={statusColor(d.status,C)} dot/><Badge text={d.region} color={C.blue}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:5,marginBottom:10}}>
              {[["OCPU",d.ocpu,C.cyan],["Size",d.size,C.purple],["CPU%",d.cpu+"%",d.cpu>70?C.warning:C.green]].map(([l,v,c])=>(
                <div key={l} style={{background:C.bg,borderRadius:7,padding:"7px 4px",textAlign:"center"}}><div style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:c,transition:"color .3s"}}>{v}</div><div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div></div>
              ))}
            </div>
            <MetricBar value={d.cpu} label="CPU" warn={60} crit={80} C={C}/>
            <div style={{marginTop:7}}><MetricBar value={d.connections} max={d.maxConns} label={`Connections (max ${d.maxConns})`} warn={70} crit={85} unit="" C={C}/></div>
            <div style={{fontSize:10,color:C.muted,marginTop:8}}>⏱ {fmtUptime(d.uptimeSecs)} · Oracle {d.version}</div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}

function NetworkTab({C,lbs}){
  const network=[{id:"n1",name:"PROD-VCN",cidr:"10.0.0.0/16",region:"ap-mumbai-1",subnets:4,routeTables:3,securityLists:5,igw:true,natGw:true},{id:"n2",name:"DR-VCN",cidr:"10.1.0.0/16",region:"ap-hyderabad-1",subnets:2,routeTables:2,securityLists:3,igw:false,natGw:true}];
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>🔌 Network & Load Balancers</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>VCN topology · Subnets · Security Lists · LB traffic</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {network.map(n=>(
          <GlowCard key={n.id} color={C.blue} C={C}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,marginBottom:3,color:C.text}}>{n.name}</div><div style={{fontFamily:"monospace",fontSize:11,color:C.cyan}}>{n.cidr}</div></div><Badge text="AVAILABLE" color={C.green}/></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
              {[["Subnets",n.subnets,C.blue],["Route Tables",n.routeTables,C.teal],["Sec Lists",n.securityLists,C.orange]].map(([l,v,c])=>(
                <div key={l} style={{background:C.bg,borderRadius:8,padding:"9px 6px",textAlign:"center"}}><div style={{fontFamily:"monospace",fontSize:16,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:9,color:C.muted,marginTop:3}}>{l}</div></div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><span style={{fontSize:11,color:C.muted}}>📍 {n.region}</span>{n.igw&&<Badge text="Internet GW" color={C.green}/>}{n.natGw&&<Badge text="NAT GW" color={C.cyan}/>}</div>
          </GlowCard>
        ))}
      </div>
      <GlowCard color={C.teal} C={C}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>⚖️ Load Balancers (Live Traffic)</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {lbs.map(l=>(
            <div key={l.id} style={{background:C.card2,borderRadius:12,padding:14,border:`1px solid ${C.teal}33`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div><div style={{fontWeight:700,fontSize:13,marginBottom:2,color:C.text}}>{l.name}</div><div style={{fontSize:10,color:C.muted}}>{l.type} · {l.protocol}:{l.port}</div></div><Badge text={l.status} color={statusColor(l.status,C)}/></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
                {[["RPS",l.rps.toLocaleString(),C.teal],["BW",l.bw+" Mbps",C.cyan],["Backends",`${l.healthyBackends}/${l.backends}`,l.healthyBackends<l.backends?C.warning:C.green]].map(([label,val,color])=>(
                  <div key={label} style={{background:C.bg,borderRadius:7,padding:"7px 5px",textAlign:"center"}}><div style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color,transition:"color .3s"}}>{val}</div><div style={{fontSize:9,color:C.muted,marginTop:2}}>{label}</div></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

function IncidentsTab({C,incidentList,user,wlsServers,compute,addToast}){
  const [form,setForm]=useState({title:"",description:"",priority:"P2",assignee:"",affectedSystem:"",category:"Performance"});
  const [showForm,setShowForm]=useState(false);
  const [filter,setFilter]=useState("OPEN");
  const create=()=>{
    if(!form.title.trim())return;
    push(ref(db,"incidents"),{...form,status:"OPEN",reportedBy:user.name,createdAt:now(),slaBreachAt:form.priority==="P1"?"1 hour":form.priority==="P2"?"4 hours":"8 hours"});
    setForm({title:"",description:"",priority:"P2",assignee:"",affectedSystem:"",category:"Performance"});
    setShowForm(false);
    addToast("🚨 Incident created","P"+form.priority+" incident logged",C.orange,"🚨");
  };
  const updateStatus=(id,status)=>update(ref(db,`incidents/${id}`),{status,updatedAt:now()});
  const allSystems=[...wlsServers.map(s=>s.name),...compute.map(c=>c.name)];
  const filtered=filter==="ALL"?incidentList:incidentList.filter(i=>i.status===filter||(filter==="OPEN"&&i.status==="ACKNOWLEDGED"));
  const priorityColor={P1:C.danger,P2:C.warning,P3:C.orange};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20}}>
        <div><h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>🚨 Incident Management</h2><p style={{color:C.muted,margin:0,fontSize:12}}>ITIL P1/P2/P3 · SLA timers · Auto-detection</p></div>
        <Btn grad={G.red} color={C.red} onClick={()=>setShowForm(!showForm)} C={C}>+ Create Incident</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[["P1 Critical",incidentList.filter(i=>i.priority==="P1"&&!["RESOLVED","CLOSED"].includes(i.status)).length,C.danger,"🔴"],["P2 High",incidentList.filter(i=>i.priority==="P2"&&!["RESOLVED","CLOSED"].includes(i.status)).length,C.warning,"🟠"],["Open",incidentList.filter(i=>i.status==="OPEN").length,C.orange,"⚠️"],["Resolved",incidentList.filter(i=>["RESOLVED","CLOSED"].includes(i.status)).length,C.green,"✅"]].map(([l,v,c,i])=>(
          <GlowCard key={l} color={c} style={{padding:"13px 14px"}} C={C}><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:24,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:C.muted,marginTop:4}}>{i} {l.toUpperCase()}</div></GlowCard>
        ))}
      </div>
      {showForm&&(
        <GlowCard color={C.red} style={{marginBottom:16}} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>Create Incident</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Incident title *" style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
              {["P1 - Critical (1hr SLA)","P2 - High (4hr SLA)","P3 - Medium (8hr SLA)"].map((p,i)=><option key={i} value={`P${i+1}`}>{p}</option>)}
            </select>
            <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
              {["Performance","Availability","Security","Data","Configuration","Other"].map(c=><option key={c}>{c}</option>)}
            </select>
            <select value={form.affectedSystem} onChange={e=>setForm(f=>({...f,affectedSystem:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
              <option value="">Affected System</option>
              {allSystems.map(s=><option key={s}>{s}</option>)}
            </select>
            <select value={form.assignee} onChange={e=>setForm(f=>({...f,assignee:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
              <option value="">Assign To</option>
              {["Rajesh Kumar","Priya Sharma","Amit Verma","Sneha Patel"].map(n=><option key={n}>{n}</option>)}
            </select>
          </div>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Describe the incident..." rows={2} style={{width:"100%",padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box",resize:"vertical",marginTop:10}}/>
          <div style={{display:"flex",gap:10,marginTop:12}}><Btn grad={G.red} onClick={create} C={C}>🚨 Create</Btn><Btn onClick={()=>setShowForm(false)} C={C}>Cancel</Btn></div>
        </GlowCard>
      )}
      <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
        {["OPEN","ACKNOWLEDGED","RESOLVED","CLOSED","ALL"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${filter===f?C.red:C.border}`,background:filter===f?`${C.red}20`:"transparent",color:filter===f?C.red:C.muted,fontSize:11,cursor:"pointer",fontWeight:700}}>{f}</button>)}
      </div>
      {filtered.length===0?<GlowCard color={C.green} style={{textAlign:"center",padding:36}} C={C}><div style={{color:C.muted}}>✅ No incidents found</div></GlowCard>
        :<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(i=>(
            <GlowCard key={i.id} color={priorityColor[i.priority]||C.blue} style={{padding:"13px 16px"}} C={C}>
              <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}><Badge text={i.priority} color={priorityColor[i.priority]||C.blue}/><span style={{fontWeight:700,fontSize:14,color:C.text}}>{i.title}</span><Badge text={i.category||"General"} color={C.blue}/></div>
                  {i.description&&<p style={{color:C.muted,fontSize:12,margin:"0 0 6px",lineHeight:1.4}}>{i.description}</p>}
                  <div style={{display:"flex",gap:10,fontSize:11,color:C.muted,flexWrap:"wrap"}}>
                    {i.affectedSystem&&<span>🖥️ {i.affectedSystem}</span>}{i.assignee&&<span>👤 {i.assignee}</span>}<span>🕐 {i.createdAt}</span>{i.slaBreachAt&&<span style={{color:i.priority==="P1"?C.danger:C.warning}}>⏱ SLA: {i.slaBreachAt}</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:7,flexShrink:0,alignItems:"center"}}>
                  <Badge text={i.status} color={statusColor(i.status,C)}/>
                  <select value={i.status} onChange={e=>updateStatus(i.id,e.target.value)} style={{padding:"4px 8px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.text,fontSize:11,outline:"none",fontFamily:"inherit"}}>
                    {["OPEN","ACKNOWLEDGED","IN_PROGRESS","RESOLVED","CLOSED"].map(s=><option key={s}>{s}</option>)}
                  </select>
                  <button onClick={()=>remove(ref(db,`incidents/${i.id}`))} style={{padding:"3px 9px",background:`${C.red}15`,border:`1px solid ${C.red}33`,borderRadius:7,color:C.red,fontSize:10,cursor:"pointer",fontWeight:700}}>✕</button>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      }
    </div>
  );
}

function SLATab({C}){
  const slaData=[{name:"WLS-PROD-01",sla:99.97,uptime:99.97,incidents:1,downtime:"2h 15m",target:"99.9%",status:"MET"},{name:"WLS-PROD-02",sla:99.94,uptime:99.94,incidents:2,downtime:"3h 30m",target:"99.9%",status:"MET"},{name:"WLS-PROD-03",sla:99.75,uptime:99.75,incidents:5,downtime:"6h 12m",target:"99.9%",status:"AT RISK"},{name:"WLS-PROD-04",sla:99.45,uptime:99.45,incidents:8,downtime:"13h 0m",target:"99.9%",status:"BREACHED"},{name:"PROD-ADB-01",sla:99.99,uptime:99.99,incidents:0,downtime:"0h 0m",target:"99.99%",status:"MET"},{name:"PROD-LB-PUBLIC",sla:99.98,uptime:99.98,incidents:1,downtime:"1h 0m",target:"99.99%",status:"AT RISK"}];
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>⏱️ SLA & Uptime Tracker</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Monthly SLA compliance · Uptime tracking · Downtime log</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[["SLA Met",slaData.filter(s=>s.status==="MET").length,C.green],["At Risk",slaData.filter(s=>s.status==="AT RISK").length,C.warning],["Breached",slaData.filter(s=>s.status==="BREACHED").length,C.danger],["Overall","99.84%",C.blue]].map(([l,v,c])=>(
          <GlowCard key={l} color={c} style={{padding:"13px 14px"}} C={C}><div style={{fontFamily:"monospace",fontSize:24,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:C.muted,marginTop:4}}>{l.toUpperCase()}</div></GlowCard>
        ))}
      </div>
      <GlowCard color={C.blue} C={C}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>📊 SLA Compliance — This Month</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["Service","SLA Target","Actual Uptime","Incidents","Downtime","Status"].map(h=><th key={h} style={{padding:"9px 10px",textAlign:"left",fontSize:10,color:C.muted,letterSpacing:1,textTransform:"uppercase",fontWeight:600}}>{h}</th>)}</tr></thead>
            <tbody>
              {slaData.map(s=>(
                <tr key={s.name} style={{borderBottom:`1px solid ${C.border}22`}}>
                  <td style={{padding:"10px",fontFamily:"monospace",fontWeight:700,fontSize:12,color:C.text}}>{s.name}</td>
                  <td style={{padding:"10px",fontSize:12,color:C.muted}}>{s.target}</td>
                  <td style={{padding:"10px",fontSize:12,fontWeight:700,color:s.uptime>=99.9?C.green:s.uptime>=99.5?C.warning:C.danger}}>{s.uptime}%</td>
                  <td style={{padding:"10px",fontSize:12,color:s.incidents>3?C.warning:C.muted}}>{s.incidents}</td>
                  <td style={{padding:"10px",fontSize:12,color:C.muted}}>{s.downtime}</td>
                  <td style={{padding:"10px"}}><Badge text={s.status} color={s.status==="MET"?C.green:s.status==="AT RISK"?C.warning:C.danger}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}

function CapacityTab({C,wlsServers,compute,databases}){
  const recommendations=[{resource:"WLS-PROD-04",issue:"JVM Heap >90% consistently",action:"Scale: Increase heap to 4GB or add WLS-PROD-05",urgency:"CRITICAL"},{resource:"WLS-PROD-03",issue:"Thread pool >85% for 2+ weeks",action:"Increase maxThreads to 300",urgency:"HIGH"},{resource:"PROD-ADB-01",issue:"Connections trending +15%/month",action:"Scale to 8 OCPU",urgency:"MEDIUM"},{resource:"prod-app-01",issue:"CPU averaging 65%",action:"Monitor — consider upgrade",urgency:"LOW"}];
  const urgencyColor={CRITICAL:C.danger,HIGH:C.warning,MEDIUM:C.orange,LOW:C.blue};
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>📈 Capacity Planning</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Resource utilization trends · Forecasting · Scale recommendations</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <GlowCard color={C.orange} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:15}}>🔮 30/60/90 Day Forecast</div>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["Resource","Now","30d","60d","90d"].map(h=><th key={h} style={{padding:"7px 8px",textAlign:"left",fontSize:10,color:C.muted,textTransform:"uppercase"}}>{h}</th>)}</tr></thead>
            <tbody>
              {[["WLS JVM",82,91,97,"⚠ Limit"],["Compute CPU",55,62,68,74],["DB Connections",45,52,60,68],["Storage",60,63,66,69]].map(([r,...vals])=>(
                <tr key={r} style={{borderBottom:`1px solid ${C.border}22`}}>
                  <td style={{padding:"8px",fontSize:12,fontWeight:600,color:C.text}}>{r}</td>
                  {vals.map((v,i)=><td key={i} style={{padding:"8px",fontSize:12,color:i===3&&isNaN(v)?C.danger:i>=2?C.warning:C.muted,fontWeight:i>=2?700:400}}>{isNaN(v)?v:`${v}%`}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </GlowCard>
        <GlowCard color={C.purple} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:15}}>💡 Scale Recommendations</div>
          {recommendations.map((r,i)=>(
            <div key={i} style={{background:C.card2,borderRadius:10,padding:"10px 12px",marginBottom:8,borderLeft:`3px solid ${urgencyColor[r.urgency]}`}}>
              <div style={{display:"flex",gap:8,marginBottom:4}}><Badge text={r.urgency} color={urgencyColor[r.urgency]}/><span style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:C.text}}>{r.resource}</span></div>
              <div style={{fontSize:11,color:C.warning,marginBottom:3}}>⚠ {r.issue}</div>
              <div style={{fontSize:11,color:C.cyan}}>💡 {r.action}</div>
            </div>
          ))}
        </GlowCard>
      </div>
    </div>
  );
}

function DRTab({C,wlsServers,compute,databases}){
  const [testing,setTesting]=useState(false);
  const [testLog,setTestLog]=useState([]);
  const drChecks=[{item:"DR-ADB-01 Sync",status:"SYNCHRONIZED",detail:"Lag: 2s",ok:true},{item:"DR-VCN Connectivity",status:"ACTIVE",detail:"IPSec up",ok:true},{item:"dr-app-01 Compute",status:"STOPPED",detail:"Ready to start",ok:true},{item:"WLS-DR-01 Standby",status:"STANDBY",detail:"Synchronized",ok:true},{item:"DNS Failover",status:"CONFIGURED",detail:"TTL 60s",ok:true},{item:"Backup Restore",status:"PASSED",detail:"Last: 10 Jan",ok:true},{item:"DR LB Config",status:"CONFIGURED",detail:"Ready",ok:true},{item:"Runbook",status:"OUTDATED",detail:"3 months old",ok:false}];
  const score=Math.round((drChecks.filter(c=>c.ok).length/drChecks.length)*100);
  const runTest=()=>{
    setTesting(true);setTestLog([]);
    const steps=["[INFO] Initiating DR Simulation...","[OK] ADB replication lag: 2s","[OK] IPSec tunnel active","[OK] DNS failover ready (60s TTL)","[OK] WLS-DR-01 in STANDBY","[OK] DR LB backends ready","[INFO] RTO estimate: ~15 min | RPO: ~5 min","[SUCCESS] DR Test PASSED — Score: "+score+"%"];
    steps.forEach((l,i)=>setTimeout(()=>{setTestLog(p=>[...p,l]);if(i===steps.length-1)setTesting(false);},i*600));
  };
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>🔁 DR Readiness</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Disaster Recovery · Failover readiness · RTO/RPO</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <GlowCard color={score>=90?C.green:score>=70?C.warning:C.danger} C={C}>
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{position:"relative",width:130,height:130,margin:"0 auto 14px"}}>
              <svg viewBox="0 0 36 36" style={{width:130,height:130,transform:"rotate(-90deg)"}}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.dim} strokeWidth="3.5"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={score>=90?C.green:score>=70?C.warning:C.danger} strokeWidth="3.5" strokeDasharray={`${score} ${100-score}`} strokeLinecap="round"/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                <div style={{fontFamily:"monospace",fontSize:24,fontWeight:700,color:score>=90?C.green:score>=70?C.warning:C.danger}}>{score}%</div>
                <div style={{fontSize:10,color:C.muted}}>DR Ready</div>
              </div>
            </div>
            <div style={{display:"flex",gap:16,justifyContent:"center",marginBottom:14}}>
              <div style={{textAlign:"center"}}><div style={{fontFamily:"monospace",fontWeight:700,color:C.cyan,fontSize:16}}>~15 min</div><div style={{fontSize:10,color:C.muted}}>RTO</div></div>
              <div style={{textAlign:"center"}}><div style={{fontFamily:"monospace",fontWeight:700,color:C.purple,fontSize:16}}>~5 min</div><div style={{fontSize:10,color:C.muted}}>RPO</div></div>
            </div>
            <Btn grad={testing?undefined:G.blue} color={C.blue} onClick={runTest} disabled={testing} C={C}>{testing?<span style={{display:"flex",alignItems:"center",gap:6}}><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>Testing...</span>:"▶ Run DR Test"}</Btn>
          </div>
        </GlowCard>
        <GlowCard color={C.cyan} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:15}}>🔍 Readiness Checks</div>
          {drChecks.map((c,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:14,flexShrink:0}}>{c.ok?"✅":"❌"}</span>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:12,color:c.ok?C.text:C.danger}}>{c.item}</div><div style={{fontSize:10,color:C.muted}}>{c.detail}</div></div>
              <Badge text={c.status} color={c.ok?C.green:C.danger}/>
            </div>
          ))}
        </GlowCard>
      </div>
      {testLog.length>0&&<GlowCard color={C.green} style={{marginTop:14}} C={C}><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13}}>🖥️ Test Log</div><Terminal lines={testLog} height={180} C={C}/></GlowCard>}
    </div>
  );
}

function OnCallTab({C,user}){
  const [roster,setRoster]=useState([{id:"o1",name:"Rajesh Kumar",email:"rajesh@gscoci.in",phone:"+91-98xxx-xxxx",role:"Primary On-Call",escalation:1,available:true},{id:"o2",name:"Priya Sharma",email:"priya@gscoci.in",phone:"+91-97xxx-xxxx",role:"Secondary On-Call",escalation:2,available:true},{id:"o3",name:"Amit Verma",email:"amit@gscoci.in",phone:"+91-96xxx-xxxx",role:"Escalation L2",escalation:3,available:true},{id:"o4",name:"Sneha Patel",email:"sneha@gscoci.in",phone:"+91-95xxx-xxxx",role:"OCI Admin",escalation:4,available:false}]);
  const primary=roster.find(r=>r.escalation===1&&r.available);
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>👨‍💼 On-Call Roster</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Current on-call · Escalation chain · Contact details</p>
      {primary&&(
        <GlowCard color={C.danger} style={{marginBottom:16}} C={C}>
          <div style={{fontSize:11,color:C.muted,marginBottom:12,letterSpacing:1,textTransform:"uppercase"}}>🔴 Primary On-Call Right Now</div>
          <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:14}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:`${C.danger}20`,border:`2px solid ${C.danger}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:C.danger}}>{primary.name.split(" ").map(n=>n[0]).join("")}</div>
            <div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:20,color:C.text}}>{primary.name}</div><div style={{fontSize:12,color:C.muted}}>{primary.role}</div></div>
          </div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:14}}>
            <div style={{fontSize:12,color:C.muted}}>📧 {primary.email}</div>
            <div style={{fontSize:12,color:C.muted}}>📱 {primary.phone}</div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <a href={`tel:${primary.phone.replace(/[^+\d]/g,"")}`} style={{textDecoration:"none"}}><Btn grad={G.green} sm C={C}>📞 Call Now</Btn></a>
            <a href={`sms:${primary.phone.replace(/[^+\d]/g,"")}`} style={{textDecoration:"none"}}><Btn color={C.blue} sm C={C}>💬 Message</Btn></a>
            <a href={`mailto:${primary.email}`} style={{textDecoration:"none"}}><Btn color={C.purple} sm C={C}>📧 Email</Btn></a>
          </div>
        </GlowCard>
      )}
      <GlowCard color={C.blue} C={C}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>📋 Escalation Chain</div>
        {roster.sort((a,b)=>a.escalation-b.escalation).map(r=>(
          <div key={r.id} style={{display:"flex",gap:12,alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{width:30,height:30,borderRadius:"50%",background:`${r.available?C.green:C.muted}22`,border:`1px solid ${r.available?C.green:C.muted}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:r.available?C.green:C.muted,flexShrink:0}}>{r.escalation}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14,color:C.text}}>{r.name}</div>
              <div style={{fontSize:11,color:C.muted}}>{r.role} · {r.phone}</div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <a href={`tel:${r.phone.replace(/[^+\d]/g,"")}`} style={{textDecoration:"none",padding:"4px 10px",background:`${C.green}20`,border:`1px solid ${C.green}44`,borderRadius:8,color:C.green,fontSize:11,fontWeight:700,cursor:"pointer"}}>📞</a>
              <a href={`sms:${r.phone.replace(/[^+\d]/g,"")}`} style={{textDecoration:"none",padding:"4px 10px",background:`${C.blue}20`,border:`1px solid ${C.blue}44`,borderRadius:8,color:C.blue,fontSize:11,fontWeight:700,cursor:"pointer"}}>💬</a>
              <a href={`mailto:${r.email}`} style={{textDecoration:"none",padding:"4px 10px",background:`${C.purple}20`,border:`1px solid ${C.purple}44`,borderRadius:8,color:C.purple,fontSize:11,fontWeight:700,cursor:"pointer"}}>📧</a>
            </div>
            <div onClick={()=>setRoster(p=>p.map(x=>x.id===r.id?{...x,available:!x.available}:x))} style={{width:38,height:20,borderRadius:10,background:r.available?C.green:C.dim,cursor:"pointer",position:"relative",transition:"all .3s",flexShrink:0}}>
              <div style={{position:"absolute",top:2,left:r.available?19:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .3s"}}/>
            </div>
          </div>
        ))}
      </GlowCard>
    </div>
  );
}

function DeploymentsTab({C,user,wlsServers,addToast}){
  const [deployments,setDeployments]=useState([{id:"d1",app:"PaymentService",version:"v2.4.1",prevVersion:"v2.4.0",server:"WLS-PROD-01",env:"Production",status:"SUCCESS",deployedBy:"ops@gscoci.in",time:"2 hr ago",duration:"4m 32s",rollback:true},{id:"d2",app:"UserAuthService",version:"v1.8.3",prevVersion:"v1.8.2",server:"WLS-PROD-02",env:"Production",status:"SUCCESS",deployedBy:"admin@gscoci.in",time:"5 hr ago",duration:"3m 12s",rollback:true},{id:"d3",app:"ReportingEngine",version:"v3.1.0",prevVersion:"v3.0.9",server:"WLS-PROD-03",env:"Production",status:"FAILED",deployedBy:"ops@gscoci.in",time:"1 hr ago",duration:"1m 48s",rollback:false}]);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({app:"",version:"",server:"",env:"Production"});
  const deploy=()=>{
    if(!form.app||!form.version||!form.server)return;
    const nd={id:`d${Date.now()}`,app:form.app,version:form.version,prevVersion:"previous",server:form.server,env:form.env,status:"IN_PROGRESS",deployedBy:user.name,time:"Just now",duration:"-",rollback:false};
    setDeployments(p=>[nd,...p]);
    setTimeout(()=>setDeployments(p=>p.map(d=>d.id===nd.id?{...d,status:"SUCCESS",duration:"3m 45s",rollback:true}:d)),8000);
    addToast("🚀 Deployment started",`${form.app} ${form.version} deploying to ${form.server}`,C.blue,"🚀");
    setShowForm(false);
  };
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20}}>
        <div><h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>🚀 Deployment Tracker</h2><p style={{color:C.muted,margin:0,fontSize:12}}>App releases · Rollback · History</p></div>
        {(user.role==="admin"||user.role==="operator")&&<Btn grad={G.blue} color={C.blue} onClick={()=>setShowForm(!showForm)} C={C}>+ Deploy</Btn>}
      </div>
      {showForm&&(
        <GlowCard color={C.blue} style={{marginBottom:14}} C={C}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <input value={form.app} onChange={e=>setForm(f=>({...f,app:e.target.value}))} placeholder="App name" style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <input value={form.version} onChange={e=>setForm(f=>({...f,version:e.target.value}))} placeholder="Version (e.g. v2.5.0)" style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}/>
            <select value={form.server} onChange={e=>setForm(f=>({...f,server:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
              <option value="">Target server</option>{wlsServers.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
            <select value={form.env} onChange={e=>setForm(f=>({...f,env:e.target.value}))} style={{padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit"}}>
              {["Production","UAT","DR"].map(e=><option key={e}>{e}</option>)}
            </select>
          </div>
          <div style={{display:"flex",gap:10,marginTop:12}}><Btn grad={G.blue} onClick={deploy} C={C}>🚀 Deploy</Btn><Btn onClick={()=>setShowForm(false)} C={C}>Cancel</Btn></div>
        </GlowCard>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {deployments.map(d=>(
          <GlowCard key={d.id} color={statusColor(d.status,C)} style={{padding:"12px 16px"}} C={C}>
            <div style={{display:"flex",gap:14,alignItems:"center"}}>
              <div style={{width:38,height:38,borderRadius:11,background:`${statusColor(d.status,C)}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{d.status==="SUCCESS"?"✅":d.status==="FAILED"?"❌":d.status==="IN_PROGRESS"?<span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>🔄</span>:"🚀"}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:14,color:C.text}}>{d.app}</span><Badge text={d.version} color={C.cyan}/><Badge text={d.env} color={d.env==="Production"?C.red:C.blue}/><Badge text={d.status} color={statusColor(d.status,C)}/></div>
                <div style={{display:"flex",gap:10,fontSize:11,color:C.muted,flexWrap:"wrap"}}><span>🖥️ {d.server}</span><span>👤 {d.deployedBy}</span><span>🕐 {d.time}</span>{d.duration!=="-"&&<span>⏱ {d.duration}</span>}</div>
              </div>
              {d.rollback&&d.status==="SUCCESS"&&<Btn sm color={C.warning} onClick={()=>setDeployments(p=>p.map(x=>x.id===d.id?{...x,status:"ROLLBACK",version:x.prevVersion}:x))} C={C}>↩ Rollback</Btn>}
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}

function CostTab({C}){
  const budget=150000,spent=98420,pct=Math.round((spent/budget)*100);
  const breakdown=[{service:"Compute",spend:42000,pct:43},{service:"Autonomous DB",spend:28000,pct:28},{service:"Object Storage",spend:8500,pct:9},{service:"Load Balancer",spend:6200,pct:6},{service:"Kubernetes",spend:7800,pct:8},{service:"Networking",spend:3200,pct:3},{service:"Other",spend:2720,pct:3}];
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>💰 Cost & Budget</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Oracle Cloud monthly spend · ap-mumbai-1 + ap-hyderabad-1</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {[["Budget","₹"+budget.toLocaleString(),C.blue],["Spent","₹"+spent.toLocaleString(),pct>80?C.danger:C.green],["Last Month","₹1,02,300",C.muted],["Forecast","₹1,12,000",C.orange]].map(([l,v,c])=>(
          <GlowCard key={l} color={c} style={{padding:"13px 14px"}} C={C}><div style={{fontFamily:"monospace",fontSize:20,fontWeight:700,color:c,marginBottom:4}}>{v}</div><div style={{fontSize:10,color:C.muted,letterSpacing:1}}>{l.toUpperCase()}</div></GlowCard>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:14}}>
        <GlowCard color={C.yellow} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>💳 Spend Breakdown</div>
          {breakdown.map(b=>(
            <div key={b.service} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}><span style={{color:C.text}}>{b.service}</span><span style={{fontWeight:700,color:C.yellow}}>₹{b.spend.toLocaleString()} ({b.pct}%)</span></div>
              <div style={{height:7,background:C.dim,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${b.pct}%`,background:G.orange,borderRadius:3}}/></div>
            </div>
          ))}
        </GlowCard>
        <GlowCard color={C.green} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:15}}>📊 Budget Utilization</div>
          <div style={{position:"relative",width:120,height:120,margin:"0 auto 14px"}}>
            <svg viewBox="0 0 36 36" style={{width:120,height:120,transform:"rotate(-90deg)"}}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.dim} strokeWidth="3.5"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={pct>80?C.danger:pct>65?C.warning:C.green} strokeWidth="3.5" strokeDasharray={`${pct} ${100-pct}`} strokeLinecap="round"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
              <div style={{fontFamily:"monospace",fontSize:20,fontWeight:700,color:pct>80?C.danger:C.green}}>{pct}%</div>
              <div style={{fontSize:10,color:C.muted}}>used</div>
            </div>
          </div>
          {[["Spent","₹"+spent.toLocaleString(),C.green],["Remaining","₹"+(budget-spent).toLocaleString(),C.blue],["vs Last Month","↓ Saving",C.green]].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:12,color:C.muted}}>{l}</span><span style={{fontSize:12,fontWeight:700,color:c}}>{v}</span></div>
          ))}
        </GlowCard>
      </div>
    </div>
  );
}

function SecurityTab({C}){
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>🔐 Security & IAM</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Identity · Policies · Compartments · Security Events</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        <GlowCard color={C.blue} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>🏢 Compartments</div>
          {["Production","DR","UAT","Shared-Services"].map((c,i)=>(
            <div key={c} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <div><div style={{fontWeight:700,fontSize:13,color:C.text}}>{c}</div><div style={{fontSize:11,color:C.muted}}>{[28,12,10,8][i]} resources</div></div>
              <Badge text="ACTIVE" color={C.green}/>
            </div>
          ))}
        </GlowCard>
        <GlowCard color={C.purple} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>📜 IAM Policies</div>
          {["Prod-Admin-Policy","Prod-Read-Policy","DR-Access-Policy","UAT-Dev-Policy"].map(p=>(
            <div key={p} style={{background:C.card2,borderRadius:9,padding:"9px 11px",marginBottom:7}}>
              <div style={{fontWeight:700,fontSize:12,marginBottom:2,color:C.text}}>{p}</div>
              <div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:C.cyan}}>Active</span><Badge text="ACTIVE" color={C.green}/></div>
            </div>
          ))}
        </GlowCard>
        <GlowCard color={C.orange} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>🔍 Security Events</div>
          {[["Login Success","admin@gscoci.in","2 min ago","INFO"],["Policy Updated","ops@gscoci.in","1 hr ago","WARNING"],["New API Key","svc@gscoci.in","3 hr ago","INFO"],["Failed Login","unknown","5 hr ago","CRITICAL"]].map(([type,u,time,sev])=>(
            <div key={type} style={{padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontWeight:700,fontSize:12,color:C.text}}>{type}</span><Badge text={sev} color={sev==="CRITICAL"?C.danger:sev==="WARNING"?C.warning:C.blue}/></div>
              <div style={{fontSize:11,color:C.muted}}>{u} · {time}</div>
            </div>
          ))}
        </GlowCard>
      </div>
    </div>
  );
}

function OperationsTab({C,wlsServers,compute,user,approvalList,handleOp,termLines,setTermLines}){
  const [form,setForm]=useState({server:"",operation:"RESTART"});
  const all=[...wlsServers.map(s=>({...s,type:"wls"})),...compute.map(c=>({...c,type:"compute"}))];
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>⚙️ Operations Center</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>{user.role==="admin"?"Admin — direct execution":"All ops require approval"}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <GlowCard color={C.blue} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>Submit Operation</div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>Target Resource</div>
            <select value={form.server} onChange={e=>setForm(f=>({...f,server:e.target.value}))} style={{width:"100%",padding:"9px 12px",background:C.bg,border:`1px solid ${C.border}`,borderRadius:9,color:C.text,fontSize:13,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}>
              <option value="">Select resource…</option>
              <optgroup label="WebLogic">{wlsServers.map(s=><option key={s.id} value={s.name}>{s.name} [{s.status}]</option>)}</optgroup>
              <optgroup label="Compute">{compute.map(c=><option key={c.id} value={c.name}>{c.name} [{c.status}]</option>)}</optgroup>
            </select>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>Operation</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
              {[["RESTART","🔄",C.blue],["STOP","⏹️",C.danger],["START","▶️",C.green],["HEAPDUMP","💾",C.purple],["THREADDUMP","📋",C.teal],["PATCH","🔧",C.orange]].map(([op,icon,color])=>(
                <button key={op} onClick={()=>setForm(f=>({...f,operation:op}))} style={{padding:"9px 5px",background:form.operation===op?`${color}22`:C.card2,border:`1px solid ${form.operation===op?color:C.border}`,borderRadius:9,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:19,marginBottom:2}}>{icon}</div>
                  <div style={{fontSize:10,fontWeight:700,color:form.operation===op?color:C.muted}}>{op}</div>
                </button>
              ))}
            </div>
          </div>
          <Btn grad={user.role==="admin"?G.green:G.orange} color={user.role==="admin"?C.green:C.orange} onClick={()=>{if(!form.server)return;const res=all.find(r=>r.name===form.server);if(res)handleOp(res,form.operation,res.type);}} disabled={!form.server} style={{width:"100%",padding:12}} C={C}>
            {user.role==="admin"?"⚡ Execute (with confirmation)":"📤 Submit for Approval"}
          </Btn>
        </GlowCard>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <GlowCard color={C.green} C={C}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13,display:"flex",justifyContent:"space-between"}}><span>🖥️ Console</span><button onClick={()=>setTermLines(["[INFO] Cleared."])} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:5,color:C.muted,cursor:"pointer",fontSize:10,padding:"2px 7px"}}>Clear</button></div>
            <Terminal lines={termLines} height={200} C={C}/>
          </GlowCard>
          <GlowCard color={C.warning} C={C}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13}}>⏳ Pending</div>
            {(approvalList||[]).filter(a=>a.status==="PENDING").length===0?<div style={{color:C.muted,fontSize:12}}>None pending.</div>
              :(approvalList||[]).filter(a=>a.status==="PENDING").map(a=>(
                <div key={a.id} style={{background:C.card2,borderRadius:8,padding:"8px 10px",marginBottom:6,borderLeft:`3px solid ${C.warning}`}}>
                  <div style={{fontWeight:700,fontSize:11,fontFamily:"monospace",color:C.text}}>{a.operation} → {a.target}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>By {a.requestedBy} · {a.time}</div>
                </div>
              ))}
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

function ApprovalsTab({C,approvalList,user,wlsServers,executeOp,setTermLines}){
  const [localTerm,setLocalTerm]=useState(["[INFO] Approval console ready..."]);
  const canApprove=user.role==="admin"||user.role==="approver";
  const approve=(item)=>{
    update(ref(db,`approvals/${item.id}`),{status:"APPROVED",approvedBy:user.name,approvedAt:now()});
    push(ref(db,"auditLogs"),{action:`APPROVED: ${item.operation} on ${item.target}`,user:user.name,time:now()});
    setLocalTerm(p=>[...p,`[OK] APPROVED by ${user.name}`,`[INFO] Executing ${item.operation} on ${item.target}...`]);
    if(item.resourceType==="wls"){const s=wlsServers.find(s=>s.name===item.target);if(s)executeOp(s.id,item.operation);}
  };
  const reject=(item)=>{
    update(ref(db,`approvals/${item.id}`),{status:"REJECTED",rejectedBy:user.name,rejectedAt:now()});
    push(ref(db,"auditLogs"),{action:`REJECTED: ${item.operation} on ${item.target}`,user:user.name,time:now()});
    setLocalTerm(p=>[...p,`[WARN] REJECTED by ${user.name}`]);
  };
  const pending=(approvalList||[]).filter(a=>a.status==="PENDING");
  const history=(approvalList||[]).filter(a=>a.status!=="PENDING");
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>✅ Change Approvals</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Review operations · Approve or reject · All logged</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:16}}>
        <div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13,color:C.warning}}>⏳ Pending ({pending.length})</div>
          {pending.length===0&&<GlowCard color={C.green} style={{textAlign:"center",padding:20,marginBottom:12}} C={C}><div style={{color:C.muted,fontSize:13}}>✅ No pending</div></GlowCard>}
          {pending.map(a=>(
            <GlowCard key={a.id} color={C.warning} style={{marginBottom:10}} C={C}>
              <div style={{marginBottom:10}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}><span style={{fontFamily:"monospace",fontWeight:800,fontSize:16,color:C.warning}}>{a.operation}</span><Badge text={a.target} color={C.blue}/><Badge text={a.priority||"Normal"} color={a.priority==="Emergency"?C.danger:C.blue}/></div>
                <p style={{color:C.muted,fontSize:12,margin:"0 0 5px",lineHeight:1.4}}>{a.reason}</p>
                <div style={{fontSize:11,color:C.muted}}>By <strong style={{color:C.text}}>{a.requestedBy}</strong> · {a.time}</div>
              </div>
              {canApprove&&<div style={{display:"flex",gap:10}}><Btn grad={G.green} color={C.green} onClick={()=>approve(a)} style={{flex:1}} C={C}>✅ Approve & Execute</Btn><Btn color={C.danger} onClick={()=>reject(a)} style={{flex:1}} C={C}>❌ Reject</Btn></div>}
            </GlowCard>
          ))}
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:8,fontSize:13,color:C.muted,marginTop:14}}>📜 History</div>
          {history.map(a=>(
            <div key={a.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",marginBottom:6,borderLeft:`3px solid ${a.status==="APPROVED"?C.green:C.danger}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontWeight:700,fontSize:11,fontFamily:"monospace",color:C.text}}>{a.operation} → {a.target}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{a.requestedBy} · {a.time}</div></div><Badge text={a.status} color={a.status==="APPROVED"?C.green:C.danger}/></div>
            </div>
          ))}
        </div>
        <GlowCard color={C.green} style={{height:"fit-content",position:"sticky",top:80}} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13}}>🖥️ Execution Console</div>
          <Terminal lines={localTerm} height={320} C={C}/>
        </GlowCard>
      </div>
    </div>
  );
}

function IssuesTab({C,issues,setIssues,servers}){
  const [termLines,setTermLines]=useState(["[INFO] Troubleshoot engine ready...","[INFO] Click an issue to analyze."]);
  const [filter,setFilter]=useState("ACTIVE");
  const troubleshoot=(issue)=>{
    const steps={"Memory Leak":["[INFO] Reading heap histogram...","[WARN] Large retention: 2.4GB","[INFO] Triggering GC...","[OK] GC freed 800MB","[SUCCESS] Fix: Increase -Xmx4g"],"Thread Starvation":["[INFO] Dumping threads...","[WARN] 45 BLOCKED","[SUCCESS] Fix: Increase DB pool"],"High CPU":["[INFO] Profiling...","[SUCCESS] Fix: Cache XML"],"GC Overhead":["[INFO] Parsing GC logs...","[SUCCESS] Fix: Switch to G1GC"]};
    const s=steps[issue.type]||["[INFO] Running diagnostics...","[SUCCESS] Analysis complete"];
    setTermLines(["[INFO] Analyzing: "+issue.type+" on "+issue.server]);
    s.forEach((l,i)=>setTimeout(()=>setTermLines(p=>[...p,l]),i*700));
  };
  const filtered=filter==="ALL"?issues:filter==="ACTIVE"?issues.filter(i=>i.status!=="RESOLVED"):issues.filter(i=>i.severity===filter);
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>🔥 Issues & Troubleshooting</h2>
      <p style={{color:C.muted,marginBottom:14,fontSize:12}}>Auto-detected · Click to analyze</p>
      <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
        {["ACTIVE","ALL","CRITICAL","WARNING"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${filter===f?C.red:C.border}`,background:filter===f?`${C.red}20`:"transparent",color:filter===f?C.red:C.muted,fontSize:11,cursor:"pointer",fontWeight:700}}>{f}</button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {filtered.map(i=>(
            <GlowCard key={i.id} color={i.severity==="CRITICAL"?C.danger:C.warning} onClick={()=>troubleshoot(i)} style={{cursor:"pointer"}} C={C}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                <div><div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}><span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:i.severity==="CRITICAL"?C.danger:C.warning}}>{i.server}</span><Badge text={i.severity} color={i.severity==="CRITICAL"?C.danger:C.warning}/><Badge text={i.type} color={C.blue}/></div><p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.4}}>{i.description}</p></div>
                <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>{i.status==="HEALING"&&<span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:13}}>🔄</span>}<Badge text={i.status} color={i.status==="RESOLVED"?C.green:i.status==="HEALING"?C.cyan:C.warning}/></div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:5}}>
                <div style={{display:"flex",gap:7}}><span style={{fontSize:10,color:C.muted}}>🕐 {i.detected}</span>{i.autoHeal&&<Badge text="AUTO-HEAL" color={C.cyan}/>}</div>
                {i.status!=="RESOLVED"&&<button onClick={e=>{e.stopPropagation();setIssues(p=>p.map(x=>x.id===i.id?{...x,status:"RESOLVED"}:x));}} style={{padding:"3px 9px",background:`${C.green}15`,border:`1px solid ${C.green}33`,borderRadius:7,color:C.green,fontSize:10,cursor:"pointer",fontWeight:700}}>✓ Resolve</button>}
              </div>
            </GlowCard>
          ))}
          {filtered.length===0&&<GlowCard color={C.green} style={{textAlign:"center",padding:28}} C={C}><div style={{color:C.muted}}>✅ No issues</div></GlowCard>}
        </div>
        <GlowCard color={C.green} style={{height:"fit-content",position:"sticky",top:80}} C={C}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13}}>🔍 Analysis Console</div>
          <Terminal lines={termLines} height={380} C={C}/>
        </GlowCard>
      </div>
    </div>
  );
}

function AutoHealTab({C,issues,user}){
  const [policies,setPolicies]=useState([
    {id:1,name:"JVM Heap Critical",trigger:"JVM > 95%",action:"Force GC + Heap Dump",enabled:true,executions:12},{id:2,name:"Thread Starvation",trigger:"Threads > 90%",action:"Kill stuck threads",enabled:true,executions:3},{id:3,name:"Memory Leak",trigger:"Memory > 5%/hr",action:"Heap dump + Restart",enabled:true,executions:1},{id:4,name:"CPU Spike",trigger:"CPU > 90% for 5min",action:"Thread dump + Alert",enabled:false,executions:0},{id:5,name:"GC Overhead",trigger:"GC > 100ms",action:"Tune GC params",enabled:true,executions:7},{id:6,name:"Datasource Recovery",trigger:"DS failures > 5",action:"Reconnect pool",enabled:true,executions:2},{id:7,name:"Compute High CPU",trigger:"VM CPU > 90%",action:"Scale out + Alert",enabled:true,executions:0},{id:8,name:"DB Connection Leak",trigger:"Connections > 90%",action:"Kill idle connections",enabled:true,executions:4},
  ]);
  const healing=issues.filter(i=>i.status==="HEALING");
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>🔄 Auto-Healing Engine</h2>
      <p style={{color:C.muted,marginBottom:14,fontSize:12}}>Automated remediation for OCI + WebLogic</p>
      {healing.length>0&&<GlowCard color={C.cyan} style={{marginBottom:14}} C={C}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14,color:C.text}}><span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:16}}>🔄</span>Auto-Healing In Progress ({healing.length})</div>{healing.map(i=><div key={i.id} style={{background:C.card2,borderRadius:9,padding:"10px 12px",marginBottom:6,border:`1px solid ${C.cyan}33`}}><div style={{fontWeight:700,color:C.cyan,fontFamily:"monospace",fontSize:11}}>{i.server} — {i.type}</div><div style={{height:4,background:C.dim,borderRadius:2,marginTop:6,overflow:"hidden"}}><div style={{height:"100%",width:"65%",background:G.teal,borderRadius:2}}/></div></div>)}</GlowCard>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {[["Active",policies.filter(p=>p.enabled).length,C.green],["Executions",policies.reduce((a,p)=>a+p.executions,0),C.blue],["Healing",healing.length,C.cyan],["Resolved",issues.filter(i=>i.status==="RESOLVED").length,C.green]].map(([l,v,c])=>(
          <GlowCard key={l} color={c} style={{padding:"12px 14px"}} C={C}><div style={{fontFamily:"monospace",fontSize:22,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:C.muted,marginTop:3,letterSpacing:1}}>{l.toUpperCase()}</div></GlowCard>
        ))}
      </div>
      <GlowCard color={C.purple} C={C}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>🤖 Healing Policies</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          {policies.map(p=>(
            <div key={p.id} style={{background:C.card2,borderRadius:10,padding:"11px 12px",border:`1px solid ${p.enabled?C.purple+"44":C.border}`,display:"flex",gap:9,alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3}}><span style={{fontWeight:700,fontSize:12,color:C.text}}>{p.name}</span>{p.enabled&&<Badge text="ON" color={C.green} dot/>}</div>
                <div style={{fontSize:10,color:C.warning,marginBottom:2}}>⚡ {p.trigger}</div>
                <div style={{fontSize:10,color:C.cyan,marginBottom:3}}>🔧 {p.action}</div>
                <div style={{fontSize:10,color:C.muted}}>{p.executions} runs</div>
              </div>
              {(user.role==="admin"||user.role==="operator")&&<div onClick={()=>setPolicies(prev=>prev.map(x=>x.id===p.id?{...x,enabled:!x.enabled}:x))} style={{width:38,height:20,borderRadius:10,background:p.enabled?C.green:C.dim,cursor:"pointer",position:"relative",transition:"all .3s",flexShrink:0}}><div style={{position:"absolute",top:2,left:p.enabled?19:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .3s"}}/></div>}
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

function AuditTab({C,auditList}){
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,marginBottom:4}}>📋 Audit Log</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Immutable record · {auditList.length} entries</p>
      {auditList.length===0?<GlowCard color={C.blue} style={{textAlign:"center",padding:40}} C={C}><div style={{color:C.muted}}>No records yet.</div></GlowCard>
        :<div style={{display:"flex",flexDirection:"column",gap:6}}>
          {[...auditList].reverse().map((a,i)=>(
            <GlowCard key={a.id} color={a.action.includes("APPROVED")?C.green:a.action.includes("REJECTED")?C.danger:C.blue} style={{padding:"10px 14px"}} C={C}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:a.action.includes("APPROVED")?`${C.green}20`:a.action.includes("REJECTED")?`${C.danger}20`:`${C.blue}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{a.action.includes("APPROVED")?"✅":a.action.includes("REJECTED")?"❌":"⚡"}</div>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,fontFamily:"monospace",color:C.text}}>{a.action}</div><div style={{color:C.muted,fontSize:10,marginTop:2}}>by {a.user} · {a.time}</div></div>
                <div style={{fontFamily:"monospace",fontSize:10,color:C.dim}}>#{auditList.length-i}</div>
              </div>
            </GlowCard>
          ))}
        </div>
      }
    </div>
  );
}
