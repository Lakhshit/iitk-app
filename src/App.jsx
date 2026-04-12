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

const C = {
  bg:"#060910",card:"#0a0f1a",card2:"#0f1520",border:"#1a2540",
  red:"#C74634",blue:"#1e90ff",cyan:"#00d4ff",green:"#00e676",
  orange:"#ff9100",purple:"#d500f9",teal:"#1de9b6",yellow:"#ffd600",
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
  oci:"linear-gradient(135deg,#C74634,#1a4e8c)",
  header:"linear-gradient(180deg,#0a0f1a,#060910)",
};

// ── Seed Data ─────────────────────────────────────────────────
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
  {id:"c1",name:"prod-app-01",shape:"VM.Standard3.Flex",ocpu:8,ram:128,os:"Oracle Linux 8",region:"ap-mumbai-1",ad:"AD-1",status:"RUNNING",cpu:65,mem:72,publicIp:"10.0.1.10",privateIp:"192.168.1.10",uptimeSecs:2592000,role:"App Server"},
  {id:"c2",name:"prod-app-02",shape:"VM.Standard3.Flex",ocpu:8,ram:128,os:"Oracle Linux 8",region:"ap-mumbai-1",ad:"AD-2",status:"RUNNING",cpu:58,mem:68,publicIp:"10.0.1.11",privateIp:"192.168.1.11",uptimeSecs:2592000,role:"App Server"},
  {id:"c3",name:"prod-db-01",shape:"VM.Standard.E4.Flex",ocpu:16,ram:256,os:"Oracle Linux 8",region:"ap-mumbai-1",ad:"AD-1",status:"RUNNING",cpu:35,mem:55,publicIp:"10.0.2.10",privateIp:"192.168.2.10",uptimeSecs:5184000,role:"DB Server"},
  {id:"c4",name:"prod-lb-01",shape:"VM.Standard3.Flex",ocpu:4,ram:64,os:"Oracle Linux 8",region:"ap-mumbai-1",ad:"AD-1",status:"RUNNING",cpu:22,mem:38,publicIp:"10.0.0.5",privateIp:"192.168.0.5",uptimeSecs:5184000,role:"Load Balancer"},
  {id:"c5",name:"dr-app-01",shape:"VM.Standard3.Flex",ocpu:8,ram:128,os:"Oracle Linux 8",region:"ap-hyderabad-1",ad:"AD-1",status:"STOPPED",cpu:0,mem:0,publicIp:"10.1.1.10",privateIp:"192.168.1.20",uptimeSecs:0,role:"DR App"},
  {id:"c6",name:"bastion-01",shape:"VM.Standard.E3.Flex",ocpu:2,ram:16,os:"Oracle Linux 8",region:"ap-mumbai-1",ad:"AD-1",status:"RUNNING",cpu:5,mem:12,publicIp:"152.67.x.x",privateIp:"192.168.0.2",uptimeSecs:7776000,role:"Bastion"},
  {id:"c7",name:"uat-app-01",shape:"VM.Standard3.Flex",ocpu:4,ram:64,os:"Oracle Linux 8",region:"ap-mumbai-1",ad:"AD-1",status:"RUNNING",cpu:30,mem:42,publicIp:"10.2.1.10",privateIp:"192.168.3.10",uptimeSecs:1296000,role:"UAT App"},
];

const OCI_DATABASES = [
  {id:"db1",name:"PROD-ADB-01",type:"Autonomous Transaction Processing",shape:"ATP",ocpu:4,storage:2,region:"ap-mumbai-1",status:"AVAILABLE",cpu:45,connections:128,maxConns:300,version:"19c",backup:"Auto",uptimeSecs:5184000,size:"2TB"},
  {id:"db2",name:"PROD-ADB-02",type:"Autonomous Data Warehouse",shape:"ADW",ocpu:8,storage:5,region:"ap-mumbai-1",status:"AVAILABLE",cpu:32,connections:64,maxConns:200,version:"19c",backup:"Auto",uptimeSecs:5184000,size:"5TB"},
  {id:"db3",name:"DR-ADB-01",type:"Autonomous Transaction Processing",shape:"ATP",ocpu:4,storage:2,region:"ap-hyderabad-1",status:"AVAILABLE",cpu:5,connections:10,maxConns:300,version:"19c",backup:"Auto",uptimeSecs:7776000,size:"2TB"},
  {id:"db4",name:"UAT-DB-01",type:"DB System",shape:"VM.Standard.E4",ocpu:4,storage:1,region:"ap-mumbai-1",status:"AVAILABLE",cpu:20,connections:25,maxConns:100,version:"19c",backup:"Manual",uptimeSecs:1296000,size:"1TB"},
];

const OCI_LB = [
  {id:"lb1",name:"PROD-LB-PUBLIC",type:"Flexible",shape:"10Mbps-8Gbps",region:"ap-mumbai-1",ip:"152.67.x.x",status:"ACTIVE",backends:4,healthyBackends:3,protocol:"HTTPS",port:443,rps:1250,bw:245},
  {id:"lb2",name:"PROD-LB-INTERNAL",type:"Network",shape:"NLB",region:"ap-mumbai-1",ip:"10.0.0.20",status:"ACTIVE",backends:4,healthyBackends:4,protocol:"TCP",port:7001,rps:890,bw:180},
];

const OCI_OKE = [
  {id:"k1",name:"PROD-OKE-CLUSTER",region:"ap-mumbai-1",version:"v1.28.2",status:"ACTIVE",nodes:6,readyNodes:6,pods:48,cpuReq:75,memReq:68,namespaces:8},
  {id:"k2",name:"UAT-OKE-CLUSTER",region:"ap-mumbai-1",version:"v1.27.4",status:"ACTIVE",nodes:3,readyNodes:3,pods:20,cpuReq:40,memReq:35,namespaces:4},
];

const OCI_STORAGE = [
  {id:"s1",name:"gscoci-prod-backups",region:"ap-mumbai-1",objects:15420,sizeGB:4820,public:false,tier:"Standard",versioning:true},
  {id:"s2",name:"gscoci-dr-backups",region:"ap-hyderabad-1",objects:8200,sizeGB:2100,public:false,tier:"Archive",versioning:true},
  {id:"s3",name:"gscoci-logs",region:"ap-mumbai-1",objects:250000,sizeGB:820,public:false,tier:"Infrequent",versioning:false},
  {id:"s4",name:"gscoci-artifacts",region:"ap-mumbai-1",objects:3200,sizeGB:125,public:false,tier:"Standard",versioning:true},
];

const INIT_DEPLOYMENTS = [
  {id:"d1",app:"PaymentService",version:"v2.4.1",prevVersion:"v2.4.0",server:"WLS-PROD-01",env:"Production",status:"SUCCESS",deployedBy:"ops@gscoci.in",time:"2 hours ago",duration:"4m 32s",rollback:true},
  {id:"d2",app:"UserAuthService",version:"v1.8.3",prevVersion:"v1.8.2",server:"WLS-PROD-02",env:"Production",status:"SUCCESS",deployedBy:"admin@gscoci.in",time:"5 hours ago",duration:"3m 12s",rollback:true},
  {id:"d3",app:"ReportingEngine",version:"v3.1.0",prevVersion:"v3.0.9",server:"WLS-PROD-03",env:"Production",status:"FAILED",deployedBy:"ops@gscoci.in",time:"1 hour ago",duration:"1m 48s",rollback:false},
  {id:"d4",app:"APIGateway",version:"v5.2.0",prevVersion:"v5.1.8",server:"WLS-UAT-01",env:"UAT",status:"IN_PROGRESS",deployedBy:"dev@gscoci.in",time:"10 min ago",duration:"-",rollback:false},
  {id:"d5",app:"DataSyncService",version:"v1.2.0",prevVersion:"v1.1.9",server:"WLS-PROD-04",env:"Production",status:"PENDING",deployedBy:"ops@gscoci.in",time:"Just now",duration:"-",rollback:false},
  {id:"d6",app:"NotificationService",version:"v2.0.1",prevVersion:"v2.0.0",server:"WLS-PROD-01",env:"Production",status:"SUCCESS",deployedBy:"admin@gscoci.in",time:"Yesterday",duration:"2m 55s",rollback:true},
];

const INIT_ONCALL = [
  {id:"o1",name:"Rajesh Kumar",email:"rajesh@gscoci.in",phone:"+91-98xxx-xxxx",role:"Primary On-Call",shift:"Week 1",available:true,escalation:1},
  {id:"o2",name:"Priya Sharma",email:"priya@gscoci.in",phone:"+91-97xxx-xxxx",role:"Secondary On-Call",shift:"Week 1",available:true,escalation:2},
  {id:"o3",name:"Amit Verma",email:"amit@gscoci.in",phone:"+91-96xxx-xxxx",role:"Escalation L2",shift:"Always",available:true,escalation:3},
  {id:"o4",name:"Sneha Patel",email:"sneha@gscoci.in",phone:"+91-95xxx-xxxx",role:"OCI Admin",shift:"Week 2",available:false,escalation:4},
];

const PASSWORDS = {admin:"WLS@ADMIN",operator:"WLS@OPS",approver:"WLS@APPR"};
const ROLES = {admin:"System Admin",operator:"OPS Engineer",approver:"Change Approver",viewer:"Viewer"};
const now = () => new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"});
const fmtUptime = (s) => {const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60);return`${d}d ${h}h ${m}m`;};
const fmtGB = (gb) => gb>1024?`${(gb/1024).toFixed(1)}TB`:`${gb}GB`;
const statusColor = (s) => ({RUNNING:C.green,AVAILABLE:C.green,ACTIVE:C.green,SUCCESS:C.green,WARNING:C.warning,CRITICAL:C.danger,STOPPED:C.muted,STANDBY:C.cyan,STARTING:C.blue,STOPPING:C.orange,RESTARTING:C.purple,FAILED:C.danger,IN_PROGRESS:C.blue,PENDING:C.yellow,OPEN:C.danger,ACKNOWLEDGED:C.warning,RESOLVED:C.green,CLOSED:C.muted}[s]||C.muted);
const deriveWLSStatus = (s) => {
  if(s.operationStatus)return s.operationStatus;
  if(s.cpu>=92||s.jvmHeap>=95||s.mem>=95)return"CRITICAL";
  if(s.cpu>=75||s.jvmHeap>=82||s.mem>=82||s.threads/s.maxThreads>=0.88)return"WARNING";
  if(s.env==="DR")return"STANDBY";
  return"RUNNING";
};

// ── UI Helpers ────────────────────────────────────────────────
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
  <div onClick={onClick} style={{background:C.card,border:`1px solid ${color}33`,borderRadius:16,padding:20,boxShadow:`0 0 20px ${color}10`,position:"relative",overflow:"hidden",cursor:onClick?"pointer":"default",transition:"all .2s",...style}}
    onMouseEnter={e=>onClick&&(e.currentTarget.style.boxShadow=`0 0 40px ${color}28`)}
    onMouseLeave={e=>onClick&&(e.currentTarget.style.boxShadow=`0 0 20px ${color}10`)}>
    <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${color},transparent)`}}/>
    {children}
  </div>
);

const MetricBar = ({value,max=100,label,unit="%",warn=70,crit=90,small}) => {
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

// ── Sparkline Chart ───────────────────────────────────────────
const Sparkline = ({data,color,height=40,width=120}) => {
  if(!data||data.length<2)return null;
  const min=Math.min(...data),max=Math.max(...data),range=max-min||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/range)*(height-4)-2}`).join(" ");
  return (
    <svg width={width} height={height} style={{display:"block"}}>
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={pts} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={parseFloat(pts.split(" ").pop().split(",")[0])} cy={parseFloat(pts.split(" ").pop().split(",")[1])} r="2.5" fill={color}/>
    </svg>
  );
};

// ── Toast Notifications ───────────────────────────────────────
function ToastContainer({toasts,dismiss}){
  return (
    <div style={{position:"fixed",top:80,right:20,zIndex:9999,display:"flex",flexDirection:"column",gap:8,maxWidth:340}}>
      {toasts.map(t=>(
        <div key={t.id} style={{background:C.card,border:`1px solid ${t.color}55`,borderRadius:12,padding:"12px 16px",boxShadow:`0 4px 20px ${t.color}30`,display:"flex",gap:12,alignItems:"flex-start",animation:"slideIn .3s ease"}}>
          <span style={{fontSize:18,flexShrink:0}}>{t.icon}</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:12,color:t.color}}>{t.title}</div>
            <div style={{fontSize:11,color:C.muted,marginTop:3}}>{t.message}</div>
          </div>
          <button onClick={()=>dismiss(t.id)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:14,flexShrink:0}}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ── Approval Modal ────────────────────────────────────────────
function ApprovalModal({op,target,user,onConfirm,onCancel}){
  const [reason,setReason]=useState("");
  const [ticket,setTicket]=useState("");
  const [priority,setPriority]=useState("Normal");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <GlowCard color={priority==="Emergency"?C.danger:C.warning} style={{width:"100%",maxWidth:500,padding:32}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:44,marginBottom:10}}>{op==="RESTART"?"🔄":op==="STOP"?"⏹️":op==="START"?"▶️":"⚡"}</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:C.text,margin:"0 0 6px"}}>{op} — {target}</h2>
          {user.role!=="admin"&&<Badge text="REQUIRES CHANGE APPROVER APPROVAL" color={C.warning}/>}
          {user.role==="admin"&&<Badge text="ADMIN — DIRECT EXECUTION" color={C.green}/>}
        </div>
        {user.role!=="admin"&&<div style={{background:`${C.warning}15`,border:`1px solid ${C.warning}30`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:C.warning}}>⚠️ Queued for approval. Execution only after approver sign-off.</div>}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Priority</div>
          <div style={{display:"flex",gap:8}}>
            {["Low","Normal","High","Emergency"].map(p=><button key={p} onClick={()=>setPriority(p)} style={{flex:1,padding:"7px 4px",background:priority===p?`${p==="Emergency"?C.danger:C.blue}22`:C.card2,border:`1px solid ${priority===p?p==="Emergency"?C.danger:C.blue:C.border}`,borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,color:priority===p?p==="Emergency"?C.danger:C.blue:C.muted}}>{p}</button>)}
          </div>
        </div>
        <Inp value={ticket} onChange={e=>setTicket(e.target.value)} placeholder="Change Ticket # (optional)" style={{marginBottom:10}}/>
        <Inp value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason / justification *" rows={3} style={{marginBottom:16}}/>
        <div style={{display:"flex",gap:12}}>
          <button onClick={onCancel} style={{flex:1,padding:11,background:"transparent",border:`1px solid ${C.border}`,borderRadius:10,color:C.muted,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
          <Btn grad={user.role==="admin"?G.green:G.orange} color={user.role==="admin"?C.green:C.orange} onClick={()=>reason.trim()&&onConfirm({reason,ticket,priority})} disabled={!reason.trim()} style={{flex:2,padding:11}}>
            {user.role==="admin"?"⚡ Execute Now":"📤 Submit for Approval"}
          </Btn>
        </div>
      </GlowCard>
    </div>
  );
}

function useDB(path){
  const [data,setData]=useState(null);
  useEffect(()=>{const r=ref(db,path);const u=onValue(r,s=>setData(s.val()));return()=>u();},[path]);
  return data;
}

// ── LOGIN ─────────────────────────────────────────────────────
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
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;700&display=swap');*{box-sizing:border-box}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes pr{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.5);opacity:0}}@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{position:"fixed",inset:0,zIndex:0}}>
        {[["#C74634","8%","15%"],["#1e90ff","75%","65%"],["#00d4ff","45%","85%"]].map(([c,l,t],i)=><div key={i} style={{position:"absolute",left:l,top:t,width:"300px",height:"300px",background:c,borderRadius:"50%",filter:"blur(100px)",opacity:.07}}/>)}
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(${C.border}22 1px,transparent 1px),linear-gradient(90deg,${C.border}22 1px,transparent 1px)`,backgroundSize:"40px 40px",opacity:.3}}/>
      </div>
      <div style={{width:420,background:"linear-gradient(180deg,#0a0f1a,#060910)",borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:36,position:"relative",zIndex:1,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
          <div style={{width:48,height:48,background:G.oci,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:`0 0 30px ${C.red}50`}}>☁️</div>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:C.text}}>GSC OCI Control</div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:"uppercase"}}>Oracle Cloud Infrastructure</div>
          </div>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",marginBottom:14}}>
          <div style={{fontSize:9,color:C.muted,marginBottom:4,letterSpacing:1}}>SYSTEM TIME (IST)</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:C.cyan}}>{time.toLocaleTimeString()}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:3}}>{time.toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",marginBottom:14}}>
          <div style={{fontSize:9,color:C.muted,marginBottom:10,letterSpacing:1}}>INFRASTRUCTURE SUMMARY</div>
          {[["💻 Compute",`${OCI_COMPUTE.filter(c=>c.status==="RUNNING").length}/${OCI_COMPUTE.length} Running`,C.green],["⚡ WebLogic",`${WLS_SERVERS.filter(s=>s.env==="Production").length} Production`,C.orange],["🗄️ Databases",`${OCI_DATABASES.length} Available`,C.blue],["☸️ OKE",`${OCI_OKE.length} Clusters`,C.purple]].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
              <span style={{fontSize:11,color:C.muted}}>{l}</span>
              <span style={{fontSize:11,fontWeight:700,color:c}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{background:`${C.danger}12`,border:`1px solid ${C.danger}30`,borderRadius:12,padding:"12px 16px"}}>
          <div style={{fontSize:9,color:C.danger,marginBottom:8,fontWeight:700,letterSpacing:1}}>⚠ ACTIVE ALERTS</div>
          <div style={{fontSize:11,color:C.text,marginBottom:4}}><span style={{color:C.danger}}>●</span> WLS-PROD-04: JVM Heap 98%</div>
          <div style={{fontSize:11,color:C.text,marginBottom:4}}><span style={{color:C.danger}}>●</span> WLS-PROD-04: CPU 94%</div>
          <div style={{fontSize:11,color:C.text}}><span style={{color:C.warning}}>●</span> WLS-PROD-03: Thread pool 92%</div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:48,position:"relative",zIndex:1}}>
        <div style={{width:"100%",maxWidth:400}}>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.text,margin:"0 0 6px"}}>Secure Access</h1>
          <p style={{color:C.muted,margin:"0 0 26px",fontSize:13}}>GSC Oracle Cloud Infrastructure Management</p>
          <GlowCard color={C.blue} style={{padding:26}}>
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
              <Inp value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} placeholder="Enter password" type="password"/>
              <div style={{fontSize:10,color:C.dim,marginTop:5,fontFamily:"monospace"}}>Contact your system administrator for access credentials.</div>
            </div>}
            {err&&<div style={{color:C.danger,fontSize:12,marginBottom:10}}>⚠ {err}</div>}
            <Btn grad={G.oci} color={C.red} onClick={login} style={{width:"100%",padding:12}}>🔐 Sign In to OCI Control</Btn>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

export default function App(){
  const [user,setUser]=useState(null);
  if(!user)return <Login onLogin={setUser}/>;
  return <MainApp user={user} onLogout={()=>setUser(null)}/>;
}

function MainApp({user,onLogout}){
  const [tab,setTab]=useState("overview");
  const [wlsServers,setWlsServers]=useState(()=>WLS_SERVERS.map(s=>({...s,status:deriveWLSStatus(s)})));
  const [compute,setCompute]=useState(OCI_COMPUTE);
  const [databases,setDatabases]=useState(OCI_DATABASES);
  const [lbs,setLbs]=useState(OCI_LB);
  const [oke,setOke]=useState(OCI_OKE);
  const [wlsIssues,setWlsIssues]=useState([
    {id:"i1",server:"WLS-PROD-04",severity:"CRITICAL",type:"Memory Leak",description:"JVM Heap at 98%",detected:"2 min ago",autoHeal:true,status:"HEALING"},
    {id:"i2",server:"WLS-PROD-03",severity:"WARNING",type:"Thread Starvation",description:"185/200 threads active",detected:"15 min ago",autoHeal:true,status:"DETECTED"},
  ]);
  const [toasts,setToasts]=useState([]);
  const [modal,setModal]=useState(null);
  const [termLines,setTermLines]=useState(["[INFO] GSC OCI Control Platform ready.","[INFO] All systems monitored."]);
  const [metricHistory,setMetricHistory]=useState(()=>Object.fromEntries(WLS_SERVERS.map(s=>[s.id,{cpu:Array(20).fill(s.cpu),mem:Array(20).fill(s.mem),jvm:Array(20).fill(s.jvmHeap)}])));

  const approvalsDB=useDB("approvals");
  const auditDB=useDB("auditLogs");
  const incidentsDB=useDB("incidents");
  const approvalList=approvalsDB?Object.entries(approvalsDB).map(([k,v])=>({id:k,...v})):[];
  const auditList=auditDB?Object.entries(auditDB).map(([k,v])=>({id:k,...v})):[];
  const incidentList=incidentsDB?Object.entries(incidentsDB).map(([k,v])=>({id:k,...v})):[];

  const addToast=(title,message,color,icon)=>{
    const id=Date.now();
    setToasts(prev=>[...prev,{id,title,message,color,icon}]);
    setTimeout(()=>setToasts(prev=>prev.filter(t=>t.id!==id)),6000);
  };

  // Live metrics + auto-toast on breach
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
        if(newStatus==="CRITICAL"&&s.status!=="CRITICAL")
          addToast(`🔴 CRITICAL: ${s.name}`,`CPU:${cpu}% MEM:${mem}% JVM:${jvmHeap}%`,C.danger,"🔴");
        else if(newStatus==="WARNING"&&s.status==="RUNNING")
          addToast(`⚠ WARNING: ${s.name}`,`CPU:${cpu}% or MEM:${mem}% above threshold`,C.warning,"⚠️");
        upd.status=newStatus;
        return upd;
      }));
      setCompute(prev=>prev.map(c=>{
        if(c.status==="STOPPED")return c;
        return{...c,cpu:Math.round(drift(c.cpu,4,1,99)),mem:Math.round(drift(c.mem,2,10,99)),uptimeSecs:c.uptimeSecs+3};
      }));
      setDatabases(prev=>prev.map(d=>({...d,cpu:Math.round(drift(d.cpu,3,1,90)),connections:Math.round(drift(d.connections,5,1,d.maxConns))})));
      setLbs(prev=>prev.map(l=>({...l,rps:Math.round(drift(l.rps,50,10,5000)),bw:Math.round(drift(l.bw,20,10,1000))})));
      setOke(prev=>prev.map(k=>({...k,cpuReq:Math.round(drift(k.cpuReq,3,10,95)),memReq:Math.round(drift(k.memReq,2,10,95))})));
      setMetricHistory(prev=>{
        const next={...prev};
        WLS_SERVERS.forEach(s=>{
          const srv=wlsServers.find(x=>x.id===s.id)||s;
          next[s.id]={cpu:[...prev[s.id].cpu.slice(-19),srv.cpu],mem:[...prev[s.id].mem.slice(-19),srv.mem],jvm:[...prev[s.id].jvm.slice(-19),srv.jvmHeap]};
        });
        return next;
      });
    },3000);
    return()=>clearInterval(t);
  },[]);

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
      RESTART:[{d:0,l:"[INFO] Initiating graceful RESTART..."},{d:900,l:"[INFO] Draining connections..."},{d:1800,l:"[OK] Server stopped"},{d:2700,l:"[INFO] Starting server..."},{d:3600,l:"[OK] Datasources connected"},{d:4500,l:"[SUCCESS] ✓ Server RUNNING!"}],
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
    }
    setModal(null);
  };

  const pendingApprovals=approvalList.filter(a=>a.status==="PENDING").length;
  const openIncidents=incidentList.filter(i=>i.status==="OPEN"||i.status==="ACKNOWLEDGED").length;
  const criticalWLS=wlsServers.filter(s=>s.status==="CRITICAL").length;
  const activeIssues=wlsIssues.filter(i=>i.status!=="RESOLVED").length;

  const ALL_TABS=[
    {id:"overview",label:"🌐 Overview",roles:["admin","operator","approver","viewer"]},
    {id:"compute",label:"💻 Compute",roles:["admin","operator","viewer"]},
    {id:"weblogic",label:"⚡ WebLogic",roles:["admin","operator","viewer"]},
    {id:"performance",label:"📊 Performance",roles:["admin","operator","viewer"]},
    {id:"database",label:"🗄️ Database",roles:["admin","operator","viewer"]},
    {id:"network",label:"🔌 Network",roles:["admin","operator","viewer"]},
    {id:"kubernetes",label:"☸️ Kubernetes",roles:["admin","operator","viewer"]},
    {id:"storage",label:"🪣 Storage",roles:["admin","operator","viewer"]},
    {id:"incidents",label:`🚨 Incidents${openIncidents>0?` (${openIncidents})`:""}`,roles:["admin","operator","approver","viewer"]},
    {id:"deployments",label:"🚀 Deployments",roles:["admin","operator","viewer"]},
    {id:"sla",label:"⏱️ SLA & Uptime",roles:["admin","operator","viewer"]},
    {id:"capacity",label:"📈 Capacity",roles:["admin","operator","viewer"]},
    {id:"dr",label:"🔁 DR Readiness",roles:["admin","operator","viewer"]},
    {id:"oncall",label:"👨‍💼 On-Call",roles:["admin","operator","viewer"]},
    {id:"cost",label:"💰 Cost",roles:["admin","viewer"]},
    {id:"security",label:"🔐 Security",roles:["admin","viewer"]},
    {id:"operations",label:`⚙️ Operations`,roles:["admin","operator"]},
    {id:"approvals",label:`✅ Approvals${pendingApprovals>0?` (${pendingApprovals})`:""}`,roles:["admin","approver"]},
    {id:"issues",label:`🔥 Issues${activeIssues>0?` (${activeIssues})`:""}`,roles:["admin","operator","viewer"]},
    {id:"autohealing",label:"🔄 Auto-Heal",roles:["admin","operator"]},
    {id:"audit",label:"📋 Audit",roles:["admin","approver","viewer"]},
  ].filter(t=>t.roles.includes(user.role));

  const props={wlsServers,compute,databases,lbs,oke,wlsIssues,setWlsIssues,approvalList,auditList,incidentList,user,handleOp,termLines,setTermLines,executeOp,metricHistory};

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.text}}>
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}input,textarea,select,button{font-family:'DM Sans',sans-serif}@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes pr{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.5);opacity:0}}`}</style>

      <ToastContainer toasts={toasts} dismiss={id=>setToasts(prev=>prev.filter(t=>t.id!==id))}/>
      {modal&&<ApprovalModal op={modal.op} target={typeof modal.target==="string"?modal.target:modal.target.name} user={user} onConfirm={confirmOp} onCancel={()=>setModal(null)}/>}

      <header style={{background:G.header,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 20px rgba(0,0,0,.6)"}}>
        <div style={{maxWidth:1800,margin:"0 auto",padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:52}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:32,height:32,background:G.oci,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,boxShadow:`0 0 16px ${C.red}50`}}>☁️</div>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,color:C.text,lineHeight:1}}>GSC OCI Control Platform</div>
                <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,textTransform:"uppercase"}}>Global Service Centre · Oracle Cloud Infrastructure</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {criticalWLS>0&&<div style={{display:"flex",alignItems:"center",gap:5,background:`${C.danger}20`,border:`1px solid ${C.danger}44`,borderRadius:20,padding:"3px 10px"}}><Pulse color={C.danger} size={6}/><span style={{fontSize:11,fontWeight:700,color:C.danger}}>{criticalWLS} CRITICAL</span></div>}
              {openIncidents>0&&<div style={{background:`${C.orange}20`,border:`1px solid ${C.orange}44`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,color:C.orange}}>{openIncidents} Incidents</div>}
              {pendingApprovals>0&&<div style={{background:`${C.warning}20`,border:`1px solid ${C.warning}44`,borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:700,color:C.warning}}>{pendingApprovals} Pending</div>}
              <div style={{display:"flex",alignItems:"center",gap:7,background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:"4px 12px"}}>
                <div style={{width:20,height:20,borderRadius:"50%",background:G.oci,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>{user.initials}</div>
                <span style={{fontSize:12,fontWeight:600}}>{user.name}</span>
                <Badge text={ROLES[user.role]} color={C.blue}/>
              </div>
              <Btn color={C.red} onClick={onLogout} sm>Sign Out</Btn>
            </div>
          </div>
        </div>
        <div style={{maxWidth:1800,margin:"0 auto",padding:"0 16px",display:"flex",overflowX:"auto",borderTop:`1px solid ${C.border}`}}>
          {ALL_TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 13px",background:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${C.red}`:"2px solid transparent",color:tab===t.id?C.red:C.muted,cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap",transition:"all .2s"}}>{t.label}</button>)}
        </div>
      </header>

      <main style={{maxWidth:1800,margin:"0 auto",padding:"20px 16px",animation:"slideIn .25s ease"}}>
        {tab==="overview"&&<OverviewTab {...props}/>}
        {tab==="compute"&&<ComputeTab {...props}/>}
        {tab==="weblogic"&&<WebLogicTab {...props}/>}
        {tab==="performance"&&<PerformanceTab {...props}/>}
        {tab==="database"&&<DatabaseTab {...props}/>}
        {tab==="network"&&<NetworkTab lbs={lbs} network={[{id:"n1",name:"PROD-VCN",cidr:"10.0.0.0/16",region:"ap-mumbai-1",subnets:4,routeTables:3,securityLists:5,igw:true,natGw:true},{id:"n2",name:"DR-VCN",cidr:"10.1.0.0/16",region:"ap-hyderabad-1",subnets:2,routeTables:2,securityLists:3,igw:false,natGw:true}]}/>}
        {tab==="kubernetes"&&<KubernetesTab clusters={oke} user={user} handleOp={handleOp}/>}
        {tab==="storage"&&<StorageTab buckets={OCI_STORAGE}/>}
        {tab==="incidents"&&<IncidentsTab incidentList={incidentList} user={user} wlsServers={wlsServers} compute={compute}/>}
        {tab==="deployments"&&<DeploymentsTab user={user} wlsServers={wlsServers}/>}
        {tab==="sla"&&<SLATab wlsServers={wlsServers} compute={compute}/>}
        {tab==="capacity"&&<CapacityTab wlsServers={wlsServers} compute={compute} databases={databases} metricHistory={metricHistory}/>}
        {tab==="dr"&&<DRTab wlsServers={wlsServers} compute={compute} databases={databases} lbs={lbs}/>}
        {tab==="oncall"&&<OnCallTab user={user}/>}
        {tab==="cost"&&<CostTab/>}
        {tab==="security"&&<SecurityTab/>}
        {tab==="operations"&&<OperationsTab {...props}/>}
        {tab==="approvals"&&<ApprovalsTab approvalList={approvalList} user={user} wlsServers={wlsServers} executeOp={executeOp} setTermLines={setTermLines}/>}
        {tab==="issues"&&<IssuesTab issues={wlsIssues} setIssues={setWlsIssues} servers={wlsServers}/>}
        {tab==="autohealing"&&<AutoHealTab issues={wlsIssues} user={user}/>}
        {tab==="audit"&&<AuditTab auditList={auditList}/>}
      </main>
    </div>
  );
}

// ── OVERVIEW ──────────────────────────────────────────────────
function OverviewTab({wlsServers,compute,databases,lbs,oke,wlsIssues,approvalList,auditList,incidentList}){
  const running=wlsServers.filter(s=>s.status==="RUNNING").length;
  const critical=wlsServers.filter(s=>s.status==="CRITICAL").length;
  const openInc=incidentList.filter(i=>i.status==="OPEN"||i.status==="ACKNOWLEDGED").length;
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
          {l:"Databases",v:`${databases.filter(d=>d.status==="AVAILABLE").length}/${databases.length}`,c:C.blue,i:"🗄️"},
          {l:"LB Active",v:`${lbs.filter(l=>l.status==="ACTIVE").length}/${lbs.length}`,c:C.teal,i:"⚖️"},
          {l:"OKE Active",v:`${oke.filter(k=>k.status==="ACTIVE").length}/${oke.length}`,c:C.purple,i:"☸️"},
          {l:"Critical Alerts",v:critical,c:critical>0?C.danger:C.green,i:"🔴"},
          {l:"Open Incidents",v:openInc,c:openInc>0?C.orange:C.green,i:"🚨"},
          {l:"Auto-Healing",v:wlsIssues.filter(i=>i.status==="HEALING").length,c:C.cyan,i:"🔄"},
          {l:"Pending Ops",v:(approvalList||[]).filter(a=>a.status==="PENDING").length,c:C.warning,i:"⏳"},
          {l:"Month Spend",v:"₹98.4K",c:C.yellow,i:"💰"},
        ].map(s=>(
          <GlowCard key={s.l} color={s.c} style={{padding:"12px 10px"}}>
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
        <GlowCard color={C.blue}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14,display:"flex",justifyContent:"space-between"}}>
            <span>💻 Live Server Matrix</span><div style={{display:"flex",alignItems:"center",gap:4}}><Pulse color={C.green} size={6}/><span style={{fontSize:10,color:C.muted,fontWeight:400}}>Live</span></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {wlsServers.map(s=>(
              <div key={s.id} style={{background:C.card2,borderRadius:10,padding:10,border:`1px solid ${statusColor(s.status)}22`,transition:"border .3s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}><Pulse color={statusColor(s.status)} size={6}/><span style={{fontWeight:700,fontSize:11,fontFamily:"monospace"}}>{s.name}</span></div>
                  <Badge text={s.status} color={statusColor(s.status)}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <MetricBar value={s.cpu} label="CPU" warn={70} crit={85} small/>
                  <MetricBar value={s.jvmHeap} label="JVM" warn={80} crit={92} small/>
                </div>
                {["STARTING","STOPPING","RESTARTING"].includes(s.status)&&<div style={{marginTop:6,fontSize:10,color:C.cyan,display:"flex",alignItems:"center",gap:3}}><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>{s.status}...</div>}
              </div>
            ))}
          </div>
        </GlowCard>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <GlowCard color={C.orange}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>🚨 Open Incidents</div>
            {openInc===0?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"8px 0"}}>✅ No open incidents</div>
              :incidentList.filter(i=>["OPEN","ACKNOWLEDGED"].includes(i.status)).slice(0,3).map(i=>(
                <div key={i.id} style={{padding:"7px 0",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:11,color:i.priority==="P1"?C.danger:i.priority==="P2"?C.warning:C.blue}}>{i.title}</div>
                    <div style={{fontSize:10,color:C.muted}}>{i.priority} · {i.assignee}</div>
                  </div>
                  <Badge text={i.status} color={statusColor(i.status)}/>
                </div>
              ))}
          </GlowCard>
          <GlowCard color={C.purple}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>📋 Recent Activity</div>
            {auditList.length===0?<div style={{color:C.muted,fontSize:11}}>No activity yet.</div>
              :[...auditList].reverse().slice(0,5).map(a=>(
                <div key={a.id} style={{padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
                  <div style={{fontWeight:600,fontSize:11}}>{a.action}</div>
                  <div style={{color:C.muted,fontSize:10,marginTop:2}}>{a.user} · {a.time}</div>
                </div>
              ))}
          </GlowCard>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        <GlowCard color={C.cyan}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>🗄️ Databases</div>
          {databases.map(d=>(
            <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <div>
                <div style={{fontWeight:700,fontSize:11,fontFamily:"monospace"}}>{d.name}</div>
                <div style={{fontSize:10,color:C.muted}}>{d.type}</div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <Badge text={`CPU:${d.cpu}%`} color={d.cpu>70?C.warning:C.green}/>
                <Badge text={d.status} color={statusColor(d.status)}/>
              </div>
            </div>
          ))}
        </GlowCard>
        <GlowCard color={C.teal}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>⚖️ Load Balancers</div>
          {lbs.map(l=>(
            <div key={l.id} style={{background:C.card2,borderRadius:8,padding:10,marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontWeight:700,fontSize:11}}>{l.name}</span>
                <Badge text={l.status} color={statusColor(l.status)}/>
              </div>
              <div style={{display:"flex",gap:10,fontSize:11}}>
                <span style={{color:C.teal}}>⚡{l.rps.toLocaleString()} RPS</span>
                <span style={{color:l.healthyBackends<l.backends?C.warning:C.green}}>{l.healthyBackends}/{l.backends} backends</span>
              </div>
            </div>
          ))}
        </GlowCard>
        <GlowCard color={C.purple}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>☸️ Kubernetes (OKE)</div>
          {oke.map(k=>(
            <div key={k.id} style={{background:C.card2,borderRadius:10,padding:10,marginBottom:7}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                <span style={{fontWeight:700,fontSize:11}}>{k.name}</span>
                <Badge text={k.status} color={statusColor(k.status)}/>
              </div>
              <div style={{fontSize:10,color:C.muted,marginBottom:6}}>{k.readyNodes}/{k.nodes} nodes · {k.pods} pods</div>
              <MetricBar value={k.cpuReq} label="CPU Req" warn={70} crit={85} small/>
            </div>
          ))}
        </GlowCard>
      </div>
    </div>
  );
}

// ── PERFORMANCE CHARTS ────────────────────────────────────────
function PerformanceTab({wlsServers,compute,metricHistory}){
  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>📊 Performance Analytics</h2>
        <div style={{display:"flex",alignItems:"center",gap:8}}><Pulse color={C.green} size={6}/><span style={{fontSize:11,color:C.muted}}>Historical trends · Live charts · Last 60 seconds</span></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
        {wlsServers.map(s=>{
          const hist=metricHistory[s.id]||{cpu:[],mem:[],jvm:[]};
          return (
            <GlowCard key={s.id} color={statusColor(s.status)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Pulse color={statusColor(s.status)} size={7}/>
                  <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13}}>{s.name}</span>
                </div>
                <Badge text={s.status} color={statusColor(s.status)}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14}}>
                {[["CPU",s.cpu,"%",C.blue,hist.cpu],["Memory",s.mem,"%",C.purple,hist.mem],["JVM",s.jvmHeap,"%",s.jvmHeap>85?C.danger:C.orange,hist.jvm]].map(([label,val,unit,color,data])=>(
                  <div key={label} style={{background:C.bg,borderRadius:10,padding:"10px 8px"}}>
                    <div style={{fontSize:9,color:C.muted,marginBottom:3,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
                    <div style={{fontFamily:"monospace",fontSize:18,fontWeight:700,color,marginBottom:6,transition:"color .3s"}}>{val}{unit}</div>
                    <Sparkline data={data} color={color} height={32} width={80}/>
                  </div>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <MetricBar value={s.threads} max={s.maxThreads} label={`Threads/${s.maxThreads}`} warn={75} crit={90} unit="" small/>
                <MetricBar value={s.gcTime} max={200} label="GC Time" warn={50} crit={100} unit="ms" small/>
              </div>
              <div style={{marginTop:10,fontSize:10,color:C.muted}}>⏱ {fmtUptime(s.uptimeSecs)} · {s.deployments} apps · {s.env}</div>
            </GlowCard>
          );
        })}
      </div>
      <div style={{marginTop:16}}>
        <h3 style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:C.text,marginBottom:12}}>💻 Compute Performance</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {compute.filter(c=>c.status!=="STOPPED").map(c=>(
            <GlowCard key={c.id} color={C.blue} style={{padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12}}>{c.name}</span>
                <Badge text={c.role} color={C.blue}/>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <MetricBar value={c.cpu} label="CPU" warn={70} crit={88} small/>
                <MetricBar value={c.mem} label="Memory" warn={75} crit={90} small/>
              </div>
              <div style={{fontSize:10,color:C.muted,marginTop:8}}>{c.shape} · {c.ocpu} OCPU · {c.ram}GB RAM</div>
            </GlowCard>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── INCIDENTS ─────────────────────────────────────────────────
function IncidentsTab({incidentList,user,wlsServers,compute}){
  const [form,setForm]=useState({title:"",description:"",priority:"P2",assignee:"",affectedSystem:"",category:"Performance"});
  const [showForm,setShowForm]=useState(false);
  const [filter,setFilter]=useState("OPEN");

  const createIncident=()=>{
    if(!form.title.trim())return;
    push(ref(db,"incidents"),{...form,status:"OPEN",reportedBy:user.name,createdAt:now(),slaBreachAt:form.priority==="P1"?"1 hour":form.priority==="P2"?"4 hours":"8 hours",timeline:[{time:now(),action:"Incident created",by:user.name}]});
    setForm({title:"",description:"",priority:"P2",assignee:"",affectedSystem:"",category:"Performance"});
    setShowForm(false);
  };

  const updateStatus=(id,status)=>{
    update(ref(db,`incidents/${id}`),{status,updatedAt:now()});
  };

  const allSystems=[...wlsServers.map(s=>s.name),...compute.map(c=>c.name)];
  const filtered=filter==="ALL"?incidentList:incidentList.filter(i=>i.status===filter||(filter==="OPEN"&&i.status==="ACKNOWLEDGED"));
  const p1=incidentList.filter(i=>i.priority==="P1"&&i.status!=="RESOLVED"&&i.status!=="CLOSED").length;
  const p2=incidentList.filter(i=>i.priority==="P2"&&i.status!=="RESOLVED"&&i.status!=="CLOSED").length;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20}}>
        <div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>🚨 Incident Management</h2>
          <p style={{color:C.muted,margin:0,fontSize:12}}>ITIL-based P1/P2/P3 incident tracking · SLA timers · Escalation</p>
        </div>
        <Btn grad={G.red} color={C.red} onClick={()=>setShowForm(!showForm)}>+ Create Incident</Btn>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}>
        {[["P1 Critical",p1,C.danger,"🔴"],["P2 High",p2,C.orange,"🟠"],["P3 Medium",incidentList.filter(i=>i.priority==="P3"&&!["RESOLVED","CLOSED"].includes(i.status)).length,C.warning,"🟡"],["Resolved",incidentList.filter(i=>["RESOLVED","CLOSED"].includes(i.status)).length,C.green,"✅"]].map(([l,v,c,icon])=>(
          <GlowCard key={l} color={c} style={{padding:"14px 16px"}}>
            <div style={{fontFamily:"monospace",fontSize:26,fontWeight:700,color:c}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:5,letterSpacing:.8}}>{icon} {l.toUpperCase()}</div>
          </GlowCard>
        ))}
      </div>

      {showForm&&(
        <GlowCard color={C.red} style={{marginBottom:18}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15}}>🚨 Create Incident</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Inp value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Incident title *"/>
            <Sel value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
              {["P1 - Critical (1hr SLA)","P2 - High (4hr SLA)","P3 - Medium (8hr SLA)"].map((p,i)=><option key={i} value={`P${i+1}`}>{p}</option>)}
            </Sel>
            <Sel value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              {["Performance","Availability","Security","Data","Configuration","Other"].map(c=><option key={c}>{c}</option>)}
            </Sel>
            <Sel value={form.affectedSystem} onChange={e=>setForm(f=>({...f,affectedSystem:e.target.value}))}>
              <option value="">Affected System</option>
              {allSystems.map(s=><option key={s}>{s}</option>)}
            </Sel>
            <Sel value={form.assignee} onChange={e=>setForm(f=>({...f,assignee:e.target.value}))}>
              <option value="">Assign To</option>
              {["Rajesh Kumar","Priya Sharma","Amit Verma","Sneha Patel"].map(n=><option key={n}>{n}</option>)}
            </Sel>
          </div>
          <Inp value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Describe the incident, symptoms, impact..." rows={3} style={{marginTop:12}}/>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn grad={G.red} onClick={createIncident}>🚨 Create Incident</Btn>
            <Btn onClick={()=>setShowForm(false)}>Cancel</Btn>
          </div>
        </GlowCard>
      )}

      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {["OPEN","ACKNOWLEDGED","RESOLVED","CLOSED","ALL"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${filter===f?C.red:C.border}`,background:filter===f?`${C.red}20`:"transparent",color:filter===f?C.red:C.muted,fontSize:12,cursor:"pointer",fontWeight:700}}>{f}</button>)}
      </div>

      {filtered.length===0
        ?<GlowCard color={C.green} style={{textAlign:"center",padding:40}}><div style={{color:C.muted}}>✅ No incidents found</div></GlowCard>
        :<div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.map(i=>{
            const pcolor=i.priority==="P1"?C.danger:i.priority==="P2"?C.orange:C.warning;
            return (
              <GlowCard key={i.id} color={pcolor}>
                <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                      <Badge text={i.priority} color={pcolor}/>
                      <span style={{fontWeight:700,fontSize:15,color:C.text}}>{i.title}</span>
                      <Badge text={i.category||"General"} color={C.blue}/>
                    </div>
                    {i.description&&<p style={{color:C.muted,fontSize:13,margin:"0 0 8px",lineHeight:1.5}}>{i.description}</p>}
                    <div style={{display:"flex",gap:14,fontSize:11,color:C.muted,flexWrap:"wrap"}}>
                      {i.affectedSystem&&<span>🖥️ {i.affectedSystem}</span>}
                      {i.assignee&&<span>👤 {i.assignee}</span>}
                      <span>🕐 {i.createdAt}</span>
                      <span>By {i.reportedBy}</span>
                      {i.slaBreachAt&&<span style={{color:i.priority==="P1"?C.danger:C.warning}}>⏱ SLA: {i.slaBreachAt}</span>}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexShrink:0,alignItems:"center",flexWrap:"wrap"}}>
                    <Badge text={i.status} color={statusColor(i.status)}/>
                    <Sel value={i.status} onChange={e=>updateStatus(i.id,e.target.value)} style={{width:"auto",padding:"4px 8px",fontSize:11}}>
                      {["OPEN","ACKNOWLEDGED","IN_PROGRESS","RESOLVED","CLOSED"].map(s=><option key={s}>{s}</option>)}
                    </Sel>
                    <Btn sm danger onClick={()=>remove(ref(db,`incidents/${i.id}`))}>✕</Btn>
                  </div>
                </div>
              </GlowCard>
            );
          })}
        </div>
      }
    </div>
  );
}

// ── DEPLOYMENTS ───────────────────────────────────────────────
function DeploymentsTab({user,wlsServers}){
  const [deployments,setDeployments]=useState(INIT_DEPLOYMENTS);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({app:"",version:"",server:"",env:"Production",deployedBy:user.name});
  const [filter,setFilter]=useState("ALL");

  const deploy=()=>{
    if(!form.app||!form.version||!form.server)return;
    const newDeploy={id:`d${Date.now()}`,app:form.app,version:form.version,prevVersion:"previous",server:form.server,env:form.env,status:"IN_PROGRESS",deployedBy:form.deployedBy,time:"Just now",duration:"-",rollback:false};
    setDeployments(prev=>[newDeploy,...prev]);
    setTimeout(()=>setDeployments(prev=>prev.map(d=>d.id===newDeploy.id?{...d,status:"SUCCESS",duration:"3m 45s",rollback:true}:d)),8000);
    setShowForm(false);
  };

  const rollback=(d)=>setDeployments(prev=>prev.map(x=>x.id===d.id?{...x,status:"ROLLBACK",version:x.prevVersion}:x));

  const filtered=filter==="ALL"?deployments:deployments.filter(d=>d.status===filter||d.env===filter);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20}}>
        <div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>🚀 Deployment Tracker</h2>
          <p style={{color:C.muted,margin:0,fontSize:12}}>Application releases · Rollback capability · Deployment history</p>
        </div>
        {(user.role==="admin"||user.role==="operator")&&<Btn grad={G.blue} color={C.blue} onClick={()=>setShowForm(!showForm)}>+ New Deployment</Btn>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[["Total",deployments.length,C.blue],["Success",deployments.filter(d=>d.status==="SUCCESS").length,C.green],["Failed",deployments.filter(d=>d.status==="FAILED").length,C.danger],["In Progress",deployments.filter(d=>d.status==="IN_PROGRESS").length,C.cyan]].map(([l,v,c])=>(
          <GlowCard key={l} color={c} style={{padding:"13px 14px"}}>
            <div style={{fontFamily:"monospace",fontSize:24,fontWeight:700,color:c}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:4}}>{l.toUpperCase()}</div>
          </GlowCard>
        ))}
      </div>

      {showForm&&(
        <GlowCard color={C.blue} style={{marginBottom:16}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>New Deployment</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Inp value={form.app} onChange={e=>setForm(f=>({...f,app:e.target.value}))} placeholder="Application name"/>
            <Inp value={form.version} onChange={e=>setForm(f=>({...f,version:e.target.value}))} placeholder="Version (e.g. v2.5.0)"/>
            <Sel value={form.server} onChange={e=>setForm(f=>({...f,server:e.target.value}))}>
              <option value="">Target server</option>
              {wlsServers.map(s=><option key={s.id} value={s.name}>{s.name} [{s.status}]</option>)}
            </Sel>
            <Sel value={form.env} onChange={e=>setForm(f=>({...f,env:e.target.value}))}>
              {["Production","UAT","DR"].map(e=><option key={e}>{e}</option>)}
            </Sel>
          </div>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn grad={G.blue} onClick={deploy}>🚀 Deploy</Btn>
            <Btn onClick={()=>setShowForm(false)}>Cancel</Btn>
          </div>
        </GlowCard>
      )}

      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        {["ALL","SUCCESS","FAILED","IN_PROGRESS","Production","UAT"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${filter===f?C.blue:C.border}`,background:filter===f?`${C.blue}20`:"transparent",color:filter===f?C.blue:C.muted,fontSize:11,cursor:"pointer",fontWeight:700}}>{f}</button>)}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(d=>(
          <GlowCard key={d.id} color={statusColor(d.status)} style={{padding:"14px 18px"}}>
            <div style={{display:"flex",gap:16,alignItems:"center"}}>
              <div style={{width:40,height:40,borderRadius:12,background:`${statusColor(d.status)}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                {d.status==="SUCCESS"?"✅":d.status==="FAILED"?"❌":d.status==="IN_PROGRESS"?<span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>🔄</span>:"🚀"}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:15}}>{d.app}</span>
                  <Badge text={d.version} color={C.cyan}/>
                  <Badge text={d.env} color={d.env==="Production"?C.red:C.blue}/>
                  <Badge text={d.status} color={statusColor(d.status)}/>
                </div>
                <div style={{display:"flex",gap:14,fontSize:12,color:C.muted,flexWrap:"wrap"}}>
                  <span>🖥️ {d.server}</span>
                  <span>👤 {d.deployedBy}</span>
                  <span>🕐 {d.time}</span>
                  {d.duration!=="-"&&<span>⏱ {d.duration}</span>}
                  {d.prevVersion&&<span style={{color:C.dim}}>← from {d.prevVersion}</span>}
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexShrink:0}}>
                {d.rollback&&d.status==="SUCCESS"&&(user.role==="admin"||user.role==="operator")&&(
                  <Btn sm color={C.warning} onClick={()=>rollback(d)}>↩ Rollback</Btn>
                )}
              </div>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}

// ── SLA & UPTIME ──────────────────────────────────────────────
function SLATab({wlsServers,compute}){
  const slaData=[
    {name:"WLS-PROD-01",sla:99.95,uptime:99.97,incidents:1,downtime:"2h 15m",target:"99.9%",status:"MET"},
    {name:"WLS-PROD-02",sla:99.92,uptime:99.94,incidents:2,downtime:"3h 30m",target:"99.9%",status:"MET"},
    {name:"WLS-PROD-03",sla:99.72,uptime:99.75,incidents:5,downtime:"6h 12m",target:"99.9%",status:"AT RISK"},
    {name:"WLS-PROD-04",sla:99.41,uptime:99.45,incidents:8,downtime:"13h 0m",target:"99.9%",status:"BREACHED"},
    {name:"PROD-ADB-01",sla:99.99,uptime:99.99,incidents:0,downtime:"0h 0m",target:"99.99%",status:"MET"},
    {name:"PROD-LB-PUBLIC",sla:99.98,uptime:99.98,incidents:1,downtime:"1h 0m",target:"99.99%",status:"AT RISK"},
  ];
  const met=slaData.filter(s=>s.status==="MET").length;
  const breached=slaData.filter(s=>s.status==="BREACHED").length;
  const atRisk=slaData.filter(s=>s.status==="AT RISK").length;

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>⏱️ SLA & Uptime Tracker</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Service Level Agreement compliance · Monthly uptime · Downtime log</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:18}}>
        {[["SLA Met",met,C.green],["At Risk",atRisk,C.warning],["Breached",breached,C.danger],["Overall Uptime","99.84%",C.blue]].map(([l,v,c])=>(
          <GlowCard key={l} color={c} style={{padding:"14px 16px"}}>
            <div style={{fontFamily:"monospace",fontSize:26,fontWeight:700,color:c}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:5,letterSpacing:1}}>{l.toUpperCase()}</div>
          </GlowCard>
        ))}
      </div>
      <GlowCard color={C.blue}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15}}>📊 SLA Compliance — This Month</div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["Service","SLA Target","Actual Uptime","Incidents","Downtime","Status"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",fontSize:11,color:C.muted,letterSpacing:1,textTransform:"uppercase",fontWeight:600}}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {slaData.map(s=>(
                <tr key={s.name} style={{borderBottom:`1px solid ${C.border}22`}}>
                  <td style={{padding:"11px 12px",fontFamily:"monospace",fontWeight:700,fontSize:13}}>{s.name}</td>
                  <td style={{padding:"11px 12px",fontSize:12,color:C.muted}}>{s.target}</td>
                  <td style={{padding:"11px 12px",fontSize:12,fontWeight:700,color:s.uptime>=99.9?C.green:s.uptime>=99.5?C.warning:C.danger}}>{s.uptime}%</td>
                  <td style={{padding:"11px 12px",fontSize:12,color:s.incidents>3?C.warning:C.muted}}>{s.incidents}</td>
                  <td style={{padding:"11px 12px",fontSize:12,color:C.muted}}>{s.downtime}</td>
                  <td style={{padding:"11px 12px"}}><Badge text={s.status} color={s.status==="MET"?C.green:s.status==="AT RISK"?C.warning:C.danger}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}

// ── CAPACITY PLANNING ─────────────────────────────────────────
function CapacityTab({wlsServers,compute,databases,metricHistory}){
  const recommendations=[
    {resource:"WLS-PROD-04",issue:"JVM Heap consistently >90%",action:"Scale: Increase heap from 2GB → 4GB or add WLS-PROD-05",urgency:"CRITICAL",impact:"High"},
    {resource:"WLS-PROD-03",issue:"Thread pool >85% for 2+ weeks",action:"Add managed server or increase maxThreads to 300",urgency:"HIGH",impact:"Medium"},
    {resource:"PROD-ADB-01",issue:"Connections trending up 15%/month",action:"Scale to 8 OCPU or optimize connection pooling",urgency:"MEDIUM",impact:"Medium"},
    {resource:"prod-app-01",issue:"CPU averaging 65% (threshold 70%)",action:"Monitor — consider VM.Standard3 with 16 OCPU",urgency:"LOW",impact:"Low"},
    {resource:"Object Storage",issue:"Growing 20GB/month — 4.8TB used",action:"Archive logs to OCI Archive Tier (60% cost saving)",urgency:"LOW",impact:"Low"},
  ];
  const urgencyColor={CRITICAL:C.danger,HIGH:C.warning,MEDIUM:C.orange,LOW:C.blue};

  const forecast=[
    {resource:"WLS JVM Heap",current:82,in30:"91%",in60:"97%",in90:"Over limit",trend:"↑ +3%/week"},
    {resource:"Compute CPU",current:55,in30:"62%",in60:"68%",in90:"74%",trend:"↑ +1.2%/week"},
    {resource:"Database Connections",current:45,in30:"52%",in60:"60%",in90:"68%",trend:"↑ +2.3%/week"},
    {resource:"Object Storage",current:60,in30:"63%",in60:"66%",in90:"69%",trend:"↑ +1%/week"},
  ];

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>📈 Capacity Planning</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Resource utilization trends · Forecasting · Scale recommendations</p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
        <GlowCard color={C.orange}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>🔮 30/60/90 Day Forecast</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{borderBottom:`1px solid ${C.border}`}}>
                  {["Resource","Now","30 Days","60 Days","90 Days","Trend"].map(h=><th key={h} style={{padding:"8px 10px",textAlign:"left",fontSize:10,color:C.muted,textTransform:"uppercase"}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {forecast.map(f=>(
                  <tr key={f.resource} style={{borderBottom:`1px solid ${C.border}22`}}>
                    <td style={{padding:"9px 10px",fontSize:12,fontWeight:600}}>{f.resource}</td>
                    <td style={{padding:"9px 10px",fontSize:12,color:C.cyan}}>{f.current}%</td>
                    <td style={{padding:"9px 10px",fontSize:12,color:C.muted}}>{f.in30}</td>
                    <td style={{padding:"9px 10px",fontSize:12,color:C.warning}}>{f.in60}</td>
                    <td style={{padding:"9px 10px",fontSize:12,color:f.in90.includes("Over")?C.danger:C.orange}}>{f.in90}</td>
                    <td style={{padding:"9px 10px",fontSize:11,color:C.green}}>{f.trend}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlowCard>

        <GlowCard color={C.blue}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>📊 Current Utilization</div>
          {[...wlsServers.slice(0,4).map(s=>({name:s.name,cpu:s.cpu,mem:s.mem,jvm:s.jvmHeap}))].map(s=>(
            <div key={s.name} style={{marginBottom:12}}>
              <div style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:C.text,marginBottom:5}}>{s.name}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                {[["CPU",s.cpu,80],["MEM",s.mem,85],["JVM",s.jvm,90]].map(([l,v,th])=>(
                  <div key={l}>
                    <MetricBar value={v} label={l} warn={th-15} crit={th} small/>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </GlowCard>
      </div>

      <GlowCard color={C.purple}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>💡 Scale Recommendations</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {recommendations.map((r,i)=>(
            <div key={i} style={{background:C.card2,borderRadius:12,padding:"14px 16px",borderLeft:`4px solid ${urgencyColor[r.urgency]}`}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                <Badge text={r.urgency} color={urgencyColor[r.urgency]}/>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:13,color:C.text}}>{r.resource}</span>
                <Badge text={`Impact: ${r.impact}`} color={C.muted}/>
              </div>
              <div style={{fontSize:12,color:C.warning,marginBottom:4}}>⚠ {r.issue}</div>
              <div style={{fontSize:12,color:C.cyan}}>💡 {r.action}</div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

// ── DR READINESS ──────────────────────────────────────────────
function DRTab({wlsServers,compute,databases,lbs}){
  const [lastTest,setLastTest]=useState("15 Jan 2025 — Partial failover test — PASSED");
  const [testing,setTesting]=useState(false);
  const [testLog,setTestLog]=useState([]);

  const drChecks=[
    {item:"DR-ADB-01 Sync Status",status:"SYNCHRONIZED",detail:"Lag: 2 seconds",ok:true},
    {item:"DR-VCN Connectivity",status:"ACTIVE",detail:"IPSec tunnel up",ok:true},
    {item:"dr-app-01 Compute",status:"STOPPED",detail:"Ready to start in 5 min",ok:true},
    {item:"WLS-DR-01 Standby",status:"STANDBY",detail:"Synchronized with PROD",ok:true},
    {item:"DNS Failover Config",status:"CONFIGURED",detail:"TTL 60s — ready to flip",ok:true},
    {item:"Backup Restore Test",status:"PASSED",detail:"Last tested: 10 Jan 2025",ok:true},
    {item:"DR LB Configuration",status:"CONFIGURED",detail:"Backends pre-registered",ok:true},
    {item:"Runbook Updated",status:"OUTDATED",detail:"Last update: 3 months ago",ok:false},
  ];
  const score=Math.round((drChecks.filter(c=>c.ok).length/drChecks.length)*100);

  const runTest=()=>{
    setTesting(true);
    setTestLog([]);
    const steps=["[INFO] Initiating DR Failover Simulation...","[INFO] Checking DR-ADB-01 replication lag...","[OK] Replication lag: 2 seconds — acceptable","[INFO] Testing VPN/IPSec tunnel...","[OK] DR-VCN connectivity confirmed","[INFO] Simulating DNS flip (not live)...","[OK] DNS failover would take ~60 seconds","[INFO] Verifying WLS-DR-01 readiness...","[OK] WLS-DR-01 in STANDBY — ready to start","[INFO] Checking DR LB backends...","[OK] All DR backends pre-registered","[INFO] Estimating RTO/RPO...","[OK] RTO: ~15 minutes | RPO: ~5 minutes","[SUCCESS] ✓ DR Readiness Test PASSED — Score: "+score+"%"];
    steps.forEach((l,i)=>setTimeout(()=>{setTestLog(prev=>[...prev,l]);if(i===steps.length-1)setTesting(false);},i*600));
  };

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>🔁 DR Readiness Dashboard</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Disaster Recovery status · Failover readiness · RTO/RPO tracking</p>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
        <GlowCard color={score>=90?C.green:score>=70?C.warning:C.danger}>
          <div style={{textAlign:"center",padding:"20px 0"}}>
            <div style={{position:"relative",width:140,height:140,margin:"0 auto 16px"}}>
              <svg viewBox="0 0 36 36" style={{width:140,height:140,transform:"rotate(-90deg)"}}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.dim} strokeWidth="3.5"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={score>=90?C.green:score>=70?C.warning:C.danger} strokeWidth="3.5" strokeDasharray={`${score} ${100-score}`} strokeLinecap="round"/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                <div style={{fontFamily:"monospace",fontSize:28,fontWeight:700,color:score>=90?C.green:score>=70?C.warning:C.danger}}>{score}%</div>
                <div style={{fontSize:10,color:C.muted}}>DR Ready</div>
              </div>
            </div>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:16,color:C.text}}>DR Readiness Score</div>
            <div style={{fontSize:11,color:C.muted,marginTop:4}}>{lastTest}</div>
            <div style={{marginTop:16,display:"flex",gap:12,justifyContent:"center"}}>
              <div style={{textAlign:"center"}}><div style={{fontFamily:"monospace",fontWeight:700,color:C.cyan,fontSize:18}}>~15 min</div><div style={{fontSize:10,color:C.muted}}>RTO</div></div>
              <div style={{textAlign:"center"}}><div style={{fontFamily:"monospace",fontWeight:700,color:C.purple,fontSize:18}}>~5 min</div><div style={{fontSize:10,color:C.muted}}>RPO</div></div>
            </div>
          </div>
        </GlowCard>

        <GlowCard color={C.cyan}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>🔍 Readiness Checks</span>
            <Btn grad={testing?undefined:G.blue} color={C.blue} onClick={runTest} disabled={testing} sm>
              {testing?<span style={{display:"flex",alignItems:"center",gap:6}}><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span>Testing...</span>:"▶ Run Test"}
            </Btn>
          </div>
          {drChecks.map((c,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{fontSize:16,flexShrink:0}}>{c.ok?"✅":"❌"}</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:12,color:c.ok?C.text:C.danger}}>{c.item}</div>
                <div style={{fontSize:10,color:C.muted}}>{c.detail}</div>
              </div>
              <Badge text={c.status} color={c.ok?C.green:C.danger}/>
            </div>
          ))}
        </GlowCard>
      </div>

      {testLog.length>0&&(
        <GlowCard color={C.green}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>🖥️ Test Console</div>
          <Terminal lines={testLog} height={220}/>
        </GlowCard>
      )}
    </div>
  );
}

// ── ON-CALL ───────────────────────────────────────────────────
function OnCallTab({user}){
  const [roster,setRoster]=useState(INIT_ONCALL);
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({name:"",email:"",phone:"",role:"Developer"});
  const primary=roster.find(r=>r.escalation===1&&r.available);
  const secondary=roster.find(r=>r.escalation===2&&r.available);

  const add=()=>{
    if(!form.name.trim())return;
    setRoster(prev=>[...prev,{id:`o${Date.now()}`,...form,available:true,escalation:prev.length+1,shift:"Roster"}]);
    setForm({name:"",email:"",phone:"",role:"Developer"});
    setShowForm(false);
  };

  const toggle=(id)=>setRoster(prev=>prev.map(r=>r.id===id?{...r,available:!r.available}:r));

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20}}>
        <div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:"0 0 4px"}}>👨‍💼 On-Call Roster</h2>
          <p style={{color:C.muted,margin:0,fontSize:12}}>Current on-call team · Escalation chain · Contact details</p>
        </div>
        {user.role==="admin"&&<Btn grad={G.purple} color={C.purple} onClick={()=>setShowForm(!showForm)}>+ Add Member</Btn>}
      </div>

      {primary&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:18}}>
          {[{label:"Primary On-Call 🔴",person:primary,color:C.danger},{label:"Secondary On-Call 🟡",person:secondary,color:C.warning}].map(({label,person,color})=>person&&(
            <GlowCard key={label} color={color}>
              <div style={{fontSize:11,color:C.muted,marginBottom:12,letterSpacing:1,textTransform:"uppercase"}}>{label}</div>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:`${color}30`,border:`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color,fontFamily:"'Syne',sans-serif",flexShrink:0}}>
                  {person.name.split(" ").map(n=>n[0]).join("")}
                </div>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,color:C.text}}>{person.name}</div>
                  <div style={{fontSize:12,color:C.muted}}>{person.role}</div>
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <div style={{fontSize:12,color:C.muted}}>📧 {person.email}</div>
                <div style={{fontSize:12,color:C.muted}}>📱 {person.phone}</div>
                <div style={{fontSize:11,color:C.muted}}>🔄 Shift: {person.shift}</div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:14}}>
                <Btn grad={G.green} sm style={{flex:1}}>📞 Call</Btn>
                <Btn color={C.blue} sm style={{flex:1}}>💬 Message</Btn>
              </div>
            </GlowCard>
          ))}
        </div>
      )}

      {showForm&&(
        <GlowCard color={C.purple} style={{marginBottom:16}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>Add On-Call Member</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Inp value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Full Name *"/>
            <Inp value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="Email" type="email"/>
            <Inp value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="Phone"/>
            <Inp value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} placeholder="Role"/>
          </div>
          <div style={{display:"flex",gap:10,marginTop:14}}>
            <Btn grad={G.purple} onClick={add}>Add to Roster</Btn>
            <Btn onClick={()=>setShowForm(false)}>Cancel</Btn>
          </div>
        </GlowCard>
      )}

      <GlowCard color={C.blue}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>📋 Escalation Chain</div>
        {roster.sort((a,b)=>a.escalation-b.escalation).map(r=>(
          <div key={r.id} style={{display:"flex",gap:14,alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${C.border}`}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:`${r.available?C.green:C.muted}22`,border:`1px solid ${r.available?C.green:C.muted}`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:r.available?C.green:C.muted,flexShrink:0}}>{r.escalation}</div>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:14}}>{r.name}</div>
              <div style={{fontSize:11,color:C.muted}}>{r.role} · {r.email} · {r.phone}</div>
            </div>
            <Badge text={r.shift} color={C.blue}/>
            <div onClick={()=>toggle(r.id)} style={{width:40,height:22,borderRadius:11,background:r.available?C.green:C.dim,cursor:"pointer",position:"relative",transition:"all .3s",flexShrink:0}}>
              <div style={{position:"absolute",top:2,left:r.available?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .3s"}}/>
            </div>
          </div>
        ))}
      </GlowCard>
    </div>
  );
}

// ── Remaining tabs (Compute, WebLogic, DB, Network, K8s, Storage, Cost, Security, Operations, Approvals, Issues, AutoHeal, Audit) ──
function ComputeTab({compute,user,handleOp}){
  const [sel,setSel]=useState(null);
  const s=sel?compute.find(c=>c.id===sel):null;
  const canOp=user.role==="admin"||user.role==="operator";
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>💻 Compute Instances</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>{compute.length} instances · Live metrics</p>
      <div style={{display:"grid",gridTemplateColumns:s?"1fr 360px":"1fr",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:10,alignContent:"start"}}>
          {compute.map(c=>(
            <GlowCard key={c.id} color={statusColor(c.status)} onClick={()=>setSel(sel===c.id?null:c.id)} style={{cursor:"pointer",padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}><Pulse color={statusColor(c.status)} size={7}/><span style={{fontFamily:"monospace",fontWeight:700,fontSize:13}}>{c.name}</span></div><div style={{fontSize:10,color:C.muted}}>{c.shape}</div></div>
                <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}><Badge text={c.status} color={statusColor(c.status)} dot/><Badge text={c.role} color={C.blue}/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:9}}>
                {[["OCPU",c.ocpu,C.cyan],["RAM",c.ram+"G",C.purple],["CPU%",c.status!=="STOPPED"?c.cpu+"%":"-",c.cpu>85?C.danger:c.cpu>70?C.warning:C.green],["MEM%",c.status!=="STOPPED"?c.mem+"%":"-",c.mem>88?C.danger:c.mem>75?C.warning:C.green]].map(([l,v,col])=>(
                  <div key={l} style={{background:C.bg,borderRadius:7,padding:"6px 3px",textAlign:"center"}}>
                    <div style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:col,transition:"color .3s"}}>{v}</div>
                    <div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,color:C.muted}}>📍 {c.region}/{c.ad} · {c.os}{c.status!=="STOPPED"?` · ⏱ ${fmtUptime(c.uptimeSecs)}`:""}</div>
            </GlowCard>
          ))}
        </div>
        {s&&<div style={{position:"sticky",top:80,height:"fit-content",display:"flex",flexDirection:"column",gap:10}}>
          <GlowCard color={statusColor(s.status)}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16}}>{s.name}</div><div style={{fontSize:10,color:C.muted,marginTop:3}}>{s.shape}</div></div><button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button></div>
            {s.status!=="STOPPED"&&<div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}><MetricBar value={s.cpu} label="CPU" warn={70} crit={88}/><MetricBar value={s.mem} label="Memory" warn={75} crit={90}/></div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>
              {[["OCPU",s.ocpu],["RAM",s.ram+"GB"],["OS",s.os],["Region",s.region],["Private IP",s.privateIp],["Uptime",fmtUptime(s.uptimeSecs)]].map(([l,v])=>(
                <div key={l} style={{background:C.bg,borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:9,color:C.muted,marginBottom:2,textTransform:"uppercase"}}>{l}</div><div style={{fontSize:12,fontWeight:600,fontFamily:"monospace"}}>{v}</div></div>
              ))}
            </div>
            {canOp&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
              {[["RESTART","🔄",C.blue],["STOP","⏹️",C.danger],["START","▶️",C.green]].map(([op,icon,color])=>(
                <button key={op} onClick={()=>handleOp(s,op,"compute")} style={{padding:"9px 4px",background:`${color}15`,border:`1px solid ${color}44`,borderRadius:9,cursor:"pointer",textAlign:"center",color,fontWeight:700,fontSize:10}}>
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

function WebLogicTab({wlsServers,user,handleOp}){
  const [sel,setSel]=useState(null);
  const s=sel?wlsServers.find(x=>x.id===sel):null;
  const canOp=user.role==="admin"||user.role==="operator";
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>⚡ WebLogic Servers</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Live JVM metrics · Click server for details & operations</p>
      <div style={{display:"grid",gridTemplateColumns:s?"1fr 360px":"1fr",gap:14}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,alignContent:"start"}}>
          {wlsServers.map(sv=>(
            <GlowCard key={sv.id} color={statusColor(sv.status)} onClick={()=>setSel(sel===sv.id?null:sv.id)} style={{cursor:"pointer",padding:"13px 15px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9}}>
                <div><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}><Pulse color={statusColor(sv.status)} size={7}/><span style={{fontFamily:"monospace",fontWeight:700,fontSize:12}}>{sv.name}</span></div><div style={{fontSize:10,color:C.muted}}>{sv.host}</div></div>
                <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}><Badge text={sv.status} color={statusColor(sv.status)} dot/><Badge text={sv.env} color={sv.env==="Production"?C.red:sv.env==="UAT"?C.blue:C.teal}/></div>
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
          <GlowCard color={statusColor(s.status)}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16}}>{s.name}</div><div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginTop:3}}>{s.host}:{s.port}</div></div><button onClick={()=>setSel(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button></div>
            <div style={{display:"flex",flexDirection:"column",gap:7,marginBottom:12}}>
              <MetricBar value={s.cpu} label="CPU" warn={70} crit={85}/>
              <MetricBar value={s.mem} label="Memory" warn={75} crit={90}/>
              <MetricBar value={s.jvmHeap} label="JVM Heap" warn={80} crit={92}/>
              <MetricBar value={s.gcTime} max={200} label="GC Time" warn={50} crit={100} unit="ms"/>
              <MetricBar value={s.threads} max={s.maxThreads} label={`Threads (max ${s.maxThreads})`} warn={75} crit={90} unit=""/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>
              {[["Uptime",fmtUptime(s.uptimeSecs)],["Version",s.version],["Deployments",s.deployments],["Datasources",s.datasources]].map(([l,v])=>(
                <div key={l} style={{background:C.bg,borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:9,color:C.muted,marginBottom:2,textTransform:"uppercase"}}>{l}</div><div style={{fontSize:12,fontWeight:600,fontFamily:"monospace"}}>{v}</div></div>
              ))}
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

function DatabaseTab({databases}){
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>🗄️ Oracle Databases</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>ATP · ADW · DB Systems · Live metrics</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
        {databases.map(d=>(
          <GlowCard key={d.id} color={statusColor(d.status)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
              <div><div style={{fontFamily:"monospace",fontWeight:700,fontSize:13,marginBottom:3}}>{d.name}</div><div style={{fontSize:10,color:C.muted}}>{d.type}</div></div>
              <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}><Badge text={d.status} color={statusColor(d.status)} dot/><Badge text={d.shape} color={C.blue}/></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:10}}>
              {[["OCPU",d.ocpu,C.cyan],["Size",d.size,C.purple],["CPU%",d.cpu+"%",d.cpu>70?C.warning:C.green],["Conns",d.connections,d.connections/d.maxConns>.85?C.danger:C.green]].map(([l,v,c])=>(
                <div key={l} style={{background:C.bg,borderRadius:7,padding:"7px 4px",textAlign:"center"}}><div style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:c,transition:"color .3s"}}>{v}</div><div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div></div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:10}}>
              <MetricBar value={d.cpu} label="CPU" warn={60} crit={80}/>
              <MetricBar value={d.connections} max={d.maxConns} label={`Connections (max ${d.maxConns})`} warn={70} crit={85} unit=""/>
            </div>
            <div style={{fontSize:10,color:C.muted}}>📍 {d.region} · Oracle {d.version} · Backup: {d.backup} · ⏱ {fmtUptime(d.uptimeSecs)}</div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}

function NetworkTab({network,lbs}){
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>🔌 Network & Load Balancers</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>VCN topology · Subnets · Security Lists · LB traffic</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        {network.map(n=>(
          <GlowCard key={n.id} color={C.blue}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}><div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,marginBottom:3}}>{n.name}</div><div style={{fontFamily:"monospace",fontSize:11,color:C.cyan}}>{n.cidr}</div></div><Badge text="AVAILABLE" color={C.green}/></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
              {[["Subnets",n.subnets,C.blue],["Route Tables",n.routeTables,C.teal],["Security Lists",n.securityLists,C.orange]].map(([l,v,c])=>(
                <div key={l} style={{background:C.bg,borderRadius:8,padding:"9px 6px",textAlign:"center"}}><div style={{fontFamily:"monospace",fontSize:16,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:9,color:C.muted,marginTop:3}}>{l}</div></div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><span style={{fontSize:11,color:C.muted}}>📍 {n.region}</span>{n.igw&&<Badge text="Internet GW" color={C.green}/>}{n.natGw&&<Badge text="NAT GW" color={C.cyan}/>}</div>
          </GlowCard>
        ))}
      </div>
      <GlowCard color={C.teal}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>⚖️ Load Balancers (Live Traffic)</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:12}}>
          {lbs.map(l=>(
            <div key={l.id} style={{background:C.card2,borderRadius:12,padding:14,border:`1px solid ${C.teal}33`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><div><div style={{fontWeight:700,fontSize:13,marginBottom:2}}>{l.name}</div><div style={{fontSize:10,color:C.muted}}>{l.type} · {l.shape}</div></div><Badge text={l.status} color={statusColor(l.status)}/></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:10}}>
                {[["RPS",l.rps.toLocaleString(),C.teal],["Bandwidth",l.bw+" Mbps",C.cyan],["Backends",`${l.healthyBackends}/${l.backends}`,l.healthyBackends<l.backends?C.warning:C.green]].map(([label,val,color])=>(
                  <div key={label} style={{background:C.bg,borderRadius:8,padding:"8px 6px",textAlign:"center"}}><div style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color,transition:"color .3s"}}>{val}</div><div style={{fontSize:9,color:C.muted,marginTop:2}}>{label}</div></div>
                ))}
              </div>
              <div style={{fontSize:10,color:C.muted}}>🌐 {l.ip} · {l.protocol}:{l.port} · {l.region}</div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

function KubernetesTab({clusters,user,handleOp}){
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>☸️ Oracle Kubernetes Engine (OKE)</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>{clusters.length} clusters · Live pod metrics</p>
      {clusters.map(k=>(
        <GlowCard key={k.id} color={C.purple} style={{marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div><div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,marginBottom:4}}>{k.name}</div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><Badge text={k.status} color={statusColor(k.status)} dot/><Badge text={k.version} color={C.cyan}/><Badge text={k.region} color={C.blue}/></div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:14}}>
            {[["Nodes",`${k.readyNodes}/${k.nodes}`,k.readyNodes<k.nodes?C.warning:C.green],["Pods",k.pods,C.cyan],["Namespaces",k.namespaces,C.purple],["CPU Req",k.cpuReq+"%",k.cpuReq>80?C.danger:k.cpuReq>70?C.warning:C.green],["Mem Req",k.memReq+"%",k.memReq>85?C.danger:k.memReq>75?C.warning:C.green],["Status",k.status,statusColor(k.status)]].map(([l,v,c])=>(
              <div key={l} style={{background:C.bg,borderRadius:10,padding:"11px 6px",textAlign:"center"}}><div style={{fontFamily:"monospace",fontSize:15,fontWeight:700,color:c,transition:"color .3s"}}>{v}</div><div style={{fontSize:10,color:C.muted,marginTop:3}}>{l}</div></div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:7}}>
            <MetricBar value={k.cpuReq} label="CPU Request" warn={70} crit={85}/>
            <MetricBar value={k.memReq} label="Memory Request" warn={75} crit={90}/>
          </div>
        </GlowCard>
      ))}
    </div>
  );
}

function StorageTab({buckets}){
  const total=buckets.reduce((a,b)=>a+b.sizeGB,0);
  const objs=buckets.reduce((a,b)=>a+b.objects,0);
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>🪣 Object Storage</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>{buckets.length} buckets · {fmtGB(total)} total · {objs.toLocaleString()} objects</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[["Total Buckets",buckets.length,C.blue,"🪣"],["Total Size",fmtGB(total),C.purple,"💾"],["Total Objects",objs.toLocaleString(),C.cyan,"📁"]].map(([l,v,c,i])=>(
          <GlowCard key={l} color={c} style={{padding:"13px 14px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontFamily:"monospace",fontSize:22,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:C.muted,marginTop:4,letterSpacing:1}}>{l.toUpperCase()}</div></div><span style={{fontSize:18,opacity:.5}}>{i}</span></div></GlowCard>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12}}>
        {buckets.map(b=>(
          <GlowCard key={b.id} color={C.blue}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><div><div style={{fontFamily:"monospace",fontWeight:700,fontSize:13,marginBottom:3}}>{b.name}</div><div style={{fontSize:10,color:C.muted}}>{b.region}</div></div><Badge text={b.tier} color={b.tier==="Standard"?C.green:b.tier==="Archive"?C.muted:C.blue}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:10}}>
              {[["Size",fmtGB(b.sizeGB),C.purple],["Objects",b.objects.toLocaleString(),C.cyan],["Access","R/W",C.green]].map(([l,v,c])=>(
                <div key={l} style={{background:C.bg,borderRadius:7,padding:"7px 5px",textAlign:"center"}}><div style={{fontSize:11,fontWeight:700,color:c,fontFamily:"monospace"}}>{v}</div><div style={{fontSize:9,color:C.muted,marginTop:3}}>{l}</div></div>
              ))}
            </div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{b.public?<Badge text="PUBLIC" color={C.warning}/>:<Badge text="PRIVATE" color={C.green}/>}{b.versioning&&<Badge text="VERSIONING" color={C.cyan}/>}</div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}

function CostTab(){
  const budget=150000,spent=98420;
  const pct=Math.round((spent/budget)*100);
  const breakdown=[{service:"Compute",spend:42000,pct:43},{service:"Autonomous DB",spend:28000,pct:28},{service:"Object Storage",spend:8500,pct:9},{service:"Load Balancer",spend:6200,pct:6},{service:"Kubernetes",spend:7800,pct:8},{service:"Networking",spend:3200,pct:3},{service:"Other",spend:2720,pct:3}];
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>💰 Cost & Budget</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Oracle Cloud monthly spend · ap-mumbai-1 + ap-hyderabad-1</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[["Month Budget","₹"+budget.toLocaleString(),C.blue],["Month Spend","₹"+spent.toLocaleString(),pct>80?C.danger:pct>65?C.warning:C.green],["Last Month","₹1,02,300",C.muted],["Forecast","₹1,12,000",C.orange]].map(([l,v,c])=>(
          <GlowCard key={l} color={c} style={{padding:"13px 14px"}}><div style={{fontFamily:"monospace",fontSize:20,fontWeight:700,color:c,marginBottom:4}}>{v}</div><div style={{fontSize:10,color:C.muted,letterSpacing:1}}>{l.toUpperCase()}</div></GlowCard>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:14}}>
        <GlowCard color={C.yellow}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>💳 Spend Breakdown</div>
          {breakdown.map(b=>(
            <div key={b.service} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}><span>{b.service}</span><span style={{fontWeight:700,color:C.yellow}}>₹{b.spend.toLocaleString()} ({b.pct}%)</span></div>
              <div style={{height:7,background:C.dim,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${b.pct}%`,background:G.orange,borderRadius:3}}/></div>
            </div>
          ))}
        </GlowCard>
        <GlowCard color={C.green}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:15}}>📊 Budget Utilization</div>
          <div style={{position:"relative",width:130,height:130,margin:"0 auto 16px"}}>
            <svg viewBox="0 0 36 36" style={{width:130,height:130,transform:"rotate(-90deg)"}}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.dim} strokeWidth="3.5"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={pct>80?C.danger:pct>65?C.warning:C.green} strokeWidth="3.5" strokeDasharray={`${pct} ${100-pct}`} strokeLinecap="round"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}><div style={{fontFamily:"monospace",fontSize:22,fontWeight:700,color:pct>80?C.danger:pct>65?C.warning:C.green}}>{pct}%</div><div style={{fontSize:10,color:C.muted}}>used</div></div>
          </div>
          {[["Spent","₹"+spent.toLocaleString(),C.green],["Remaining","₹"+(budget-spent).toLocaleString(),C.blue],["Trend","↓ Saving vs last month",C.green]].map(([l,v,c])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:12,color:C.muted}}>{l}</span><span style={{fontSize:12,fontWeight:700,color:c}}>{v}</span></div>
          ))}
        </GlowCard>
      </div>
    </div>
  );
}

function SecurityTab(){
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>🔐 Security & IAM</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Identity · Policies · Compartments · Security Events</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        <GlowCard color={C.blue}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>🏢 Compartments</div>
          {["Production","DR","UAT","Shared-Services"].map((c,i)=>(
            <div key={c} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <div><div style={{fontWeight:700,fontSize:13}}>{c}</div><div style={{fontSize:11,color:C.muted}}>{[28,12,10,8][i]} resources</div></div>
              <Badge text="ACTIVE" color={C.green}/>
            </div>
          ))}
        </GlowCard>
        <GlowCard color={C.purple}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>📜 IAM Policies</div>
          {["Prod-Admin-Policy","Prod-Read-Policy","DR-Access-Policy","UAT-Dev-Policy"].map(p=>(
            <div key={p} style={{background:C.card2,borderRadius:9,padding:"9px 11px",marginBottom:7}}><div style={{fontWeight:700,fontSize:12,marginBottom:2}}>{p}</div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:11,color:C.cyan}}>Active</span><Badge text="ACTIVE" color={C.green}/></div></div>
          ))}
        </GlowCard>
        <GlowCard color={C.orange}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>🔍 Security Events</div>
          {[["Login Success","admin@gscoci.in","2 min ago","INFO"],["Policy Updated","ops@gscoci.in","1 hr ago","WARNING"],["New API Key","svc@gscoci.in","3 hr ago","INFO"],["Failed Login","unknown","5 hr ago","CRITICAL"]].map(([type,user,time,sev])=>(
            <div key={type} style={{padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}><span style={{fontWeight:700,fontSize:12}}>{type}</span><Badge text={sev} color={sev==="CRITICAL"?C.danger:sev==="WARNING"?C.warning:C.blue}/></div>
              <div style={{fontSize:11,color:C.muted}}>{user} · {time}</div>
            </div>
          ))}
        </GlowCard>
      </div>
    </div>
  );
}

function OperationsTab({wlsServers,compute,user,approvalList,handleOp,termLines,setTermLines}){
  const [form,setForm]=useState({server:"",operation:"RESTART"});
  const all=[...wlsServers.map(s=>({...s,type:"wls",label:`[WLS] ${s.name}`})),...compute.map(c=>({...c,type:"compute",label:`[VM] ${c.name}`}))];
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>⚙️ Operations Center</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>{user.role==="admin"?"Admin — direct execution":"All operations require Change Approver approval"}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18}}>
        <GlowCard color={C.blue}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15}}>Submit Operation</div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:7,textTransform:"uppercase",letterSpacing:1}}>Target Resource</div>
            <Sel value={form.server} onChange={e=>setForm(f=>({...f,server:e.target.value}))}>
              <option value="">Select resource…</option>
              <optgroup label="WebLogic">{wlsServers.map(s=><option key={s.id} value={s.name}>{s.name} [{s.status}]</option>)}</optgroup>
              <optgroup label="Compute">{compute.map(c=><option key={c.id} value={c.name}>{c.name} [{c.status}]</option>)}</optgroup>
            </Sel>
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
          <Btn grad={user.role==="admin"?G.green:G.orange} color={user.role==="admin"?C.green:C.orange} onClick={()=>{if(!form.server)return;const res=all.find(r=>r.name===form.server);if(res)handleOp(res,form.operation,res.type);}} disabled={!form.server} style={{width:"100%",padding:12}}>
            {user.role==="admin"?"⚡ Execute (with confirmation)":"📤 Submit for Approval"}
          </Btn>
        </GlowCard>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <GlowCard color={C.green}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13,display:"flex",justifyContent:"space-between"}}><span>🖥️ Console</span><button onClick={()=>setTermLines(["[INFO] Cleared."])} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:5,color:C.muted,cursor:"pointer",fontSize:10,padding:"2px 7px"}}>Clear</button></div>
            <Terminal lines={termLines} height={220}/>
          </GlowCard>
          <GlowCard color={C.warning}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13}}>⏳ Pending</div>
            {(approvalList||[]).filter(a=>a.status==="PENDING").length===0?<div style={{color:C.muted,fontSize:12}}>None.</div>
              :(approvalList||[]).filter(a=>a.status==="PENDING").map(a=>(
                <div key={a.id} style={{background:C.card2,borderRadius:8,padding:"8px 10px",marginBottom:6,borderLeft:`3px solid ${C.warning}`}}>
                  <div style={{fontWeight:700,fontSize:11,fontFamily:"monospace"}}>{a.operation} → {a.target}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>By {a.requestedBy} · {a.time}</div>
                </div>
              ))}
          </GlowCard>
        </div>
      </div>
    </div>
  );
}

function ApprovalsTab({approvalList,user,wlsServers,executeOp,setTermLines}){
  const [localTerm,setLocalTerm]=useState(["[INFO] Approval console ready..."]);
  const canApprove=user.role==="admin"||user.role==="approver";
  const approve=(item)=>{
    update(ref(db,`approvals/${item.id}`),{status:"APPROVED",approvedBy:user.name,approvedAt:now()});
    push(ref(db,"auditLogs"),{action:`APPROVED: ${item.operation} on ${item.target}`,user:user.name,time:now()});
    setLocalTerm(prev=>[...prev,`[OK] APPROVED by ${user.name}`,`[INFO] Executing ${item.operation} on ${item.target}...`]);
    if(item.resourceType==="wls"){const s=wlsServers.find(s=>s.name===item.target);if(s)executeOp(s.id,item.operation);}
  };
  const reject=(item)=>{
    update(ref(db,`approvals/${item.id}`),{status:"REJECTED",rejectedBy:user.name,rejectedAt:now()});
    push(ref(db,"auditLogs"),{action:`REJECTED: ${item.operation} on ${item.target}`,user:user.name,time:now()});
    setLocalTerm(prev=>[...prev,`[WARN] REJECTED by ${user.name}`]);
  };
  const pending=(approvalList||[]).filter(a=>a.status==="PENDING");
  const history=(approvalList||[]).filter(a=>a.status!=="PENDING");
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>✅ Change Approvals</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Approve or reject operations · All logged to audit trail</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:16}}>
        <div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13,color:C.warning}}>⏳ Pending ({pending.length})</div>
          {pending.length===0&&<GlowCard color={C.green} style={{textAlign:"center",padding:20,marginBottom:12}}><div style={{color:C.muted,fontSize:13}}>✅ No pending approvals</div></GlowCard>}
          {pending.map(a=>(
            <GlowCard key={a.id} color={C.warning} style={{marginBottom:10}}>
              <div style={{marginBottom:12}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:5,flexWrap:"wrap"}}><span style={{fontFamily:"monospace",fontWeight:800,fontSize:16,color:C.warning}}>{a.operation}</span><Badge text={a.target} color={C.blue}/><Badge text={a.priority||"Normal"} color={a.priority==="Emergency"?C.danger:C.blue}/></div>
                <p style={{color:C.muted,fontSize:12,margin:"0 0 5px",lineHeight:1.5}}>{a.reason}</p>
                {a.ticket&&<div style={{fontSize:11,color:C.cyan}}>🎫 {a.ticket}</div>}
                <div style={{fontSize:11,color:C.muted,marginTop:4}}>By <strong style={{color:C.text}}>{a.requestedBy}</strong> · {a.time}</div>
              </div>
              {canApprove&&<div style={{display:"flex",gap:10}}><Btn grad={G.green} color={C.green} onClick={()=>approve(a)} style={{flex:1}}>✅ Approve & Execute</Btn><Btn color={C.danger} onClick={()=>reject(a)} style={{flex:1}}>❌ Reject</Btn></div>}
            </GlowCard>
          ))}
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:8,fontSize:13,color:C.muted,marginTop:16}}>📜 History</div>
          {history.map(a=>(
            <div key={a.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:"9px 12px",marginBottom:6,borderLeft:`3px solid ${a.status==="APPROVED"?C.green:C.danger}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><div style={{fontWeight:700,fontSize:11,fontFamily:"monospace"}}>{a.operation} → {a.target}</div><div style={{fontSize:10,color:C.muted,marginTop:2}}>{a.requestedBy} · {a.time}</div></div>
                <Badge text={a.status} color={a.status==="APPROVED"?C.green:C.danger}/>
              </div>
            </div>
          ))}
        </div>
        <GlowCard color={C.green} style={{height:"fit-content",position:"sticky",top:80}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13}}>🖥️ Execution Console</div>
          <Terminal lines={localTerm} height={340}/>
        </GlowCard>
      </div>
    </div>
  );
}

function IssuesTab({issues,setIssues,servers}){
  const [termLines,setTermLines]=useState(["[INFO] Troubleshoot engine ready...","[INFO] Click an issue to analyze."]);
  const [filter,setFilter]=useState("ACTIVE");
  const troubleshoot=(issue)=>{
    const steps={"Memory Leak":["[INFO] Connecting to JMX...","[INFO] Reading heap histogram...","[WARN] Large retention: 2.4GB in Session cache","[INFO] Triggering System.gc()...","[OK] GC freed 800MB","[SUCCESS] Fix: Increase -Xmx4g, review session timeout"],"Thread Starvation":["[INFO] Dumping threads...","[WARN] 45 threads BLOCKED","[INFO] Lock: TransactionManager","[SUCCESS] Fix: Increase DB pool, add timeout"],"High CPU":["[INFO] Profiling...","[WARN] XMLParser.parse() = 62% CPU","[SUCCESS] Fix: Cache XML, upgrade parser"],"GC Overhead":["[INFO] Parsing GC logs...","[WARN] GC every 50ms","[SUCCESS] Fix: Switch to G1GC"]};
    const s=steps[issue.type]||["[INFO] Running diagnostics...","[SUCCESS] Analysis complete"];
    setTermLines(["[INFO] Analyzing: "+issue.type+" on "+issue.server,"[INFO] ──────────────────"]);
    s.forEach((l,i)=>setTimeout(()=>setTermLines(prev=>[...prev,l]),i*700));
  };
  const filtered=filter==="ALL"?issues:filter==="ACTIVE"?issues.filter(i=>i.status!=="RESOLVED"):issues.filter(i=>i.severity===filter);
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>🔥 Issues & Troubleshooting</h2>
      <p style={{color:C.muted,marginBottom:14,fontSize:12}}>Auto-detected · Click to run analysis</p>
      <div style={{display:"flex",gap:7,marginBottom:14,flexWrap:"wrap"}}>
        {["ACTIVE","ALL","CRITICAL","WARNING"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${filter===f?C.red:C.border}`,background:filter===f?`${C.red}20`:"transparent",color:filter===f?C.red:C.muted,fontSize:11,cursor:"pointer",fontWeight:700}}>{f}</button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div style={{display:"flex",flexDirection:"column",gap:9}}>
          {filtered.map(i=>(
            <GlowCard key={i.id} color={i.severity==="CRITICAL"?C.danger:C.warning} onClick={()=>troubleshoot(i)} style={{cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
                <div><div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}><span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:i.severity==="CRITICAL"?C.danger:C.warning}}>{i.server}</span><Badge text={i.severity} color={i.severity==="CRITICAL"?C.danger:C.warning}/><Badge text={i.type} color={C.blue}/></div><p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.4}}>{i.description}</p></div>
                <div style={{display:"flex",gap:4,alignItems:"center",flexShrink:0}}>{i.status==="HEALING"&&<span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:13}}>🔄</span>}<Badge text={i.status} color={i.status==="RESOLVED"?C.green:i.status==="HEALING"?C.cyan:C.warning}/></div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:5}}>
                <div style={{display:"flex",gap:7,alignItems:"center"}}><span style={{fontSize:10,color:C.muted}}>🕐 {i.detected}</span>{i.autoHeal&&<Badge text="AUTO-HEAL" color={C.cyan}/>}</div>
                {i.status!=="RESOLVED"&&<button onClick={e=>{e.stopPropagation();setIssues(prev=>prev.map(x=>x.id===i.id?{...x,status:"RESOLVED"}:x));}} style={{padding:"3px 9px",background:`${C.green}15`,border:`1px solid ${C.green}33`,borderRadius:7,color:C.green,fontSize:10,cursor:"pointer",fontWeight:700}}>✓ Resolve</button>}
              </div>
            </GlowCard>
          ))}
          {filtered.length===0&&<GlowCard color={C.green} style={{textAlign:"center",padding:28}}><div style={{color:C.muted}}>✅ No issues</div></GlowCard>}
        </div>
        <GlowCard color={C.green} style={{height:"fit-content",position:"sticky",top:80}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13}}>🔍 Analysis Console</div>
          <Terminal lines={termLines} height={380}/>
        </GlowCard>
      </div>
    </div>
  );
}

function AutoHealTab({issues,user}){
  const [policies,setPolicies]=useState([
    {id:1,name:"JVM Heap Critical",trigger:"JVM Heap > 95%",action:"Force GC + Heap Dump",enabled:true,executions:12,lastRun:"2 min ago"},
    {id:2,name:"Thread Starvation",trigger:"Threads > 90%",action:"Kill stuck threads",enabled:true,executions:3,lastRun:"15 min ago"},
    {id:3,name:"Memory Leak",trigger:"Memory > 5%/hr growth",action:"Heap dump + Restart",enabled:true,executions:1,lastRun:"1 hr ago"},
    {id:4,name:"CPU Spike",trigger:"CPU > 90% for 5min",action:"Thread dump + Alert",enabled:false,executions:0,lastRun:"Never"},
    {id:5,name:"GC Overhead",trigger:"GC time > 100ms",action:"Tune GC params",enabled:true,executions:7,lastRun:"30 min ago"},
    {id:6,name:"Datasource Recovery",trigger:"DS failures > 5",action:"Reconnect pool",enabled:true,executions:2,lastRun:"3 hr ago"},
    {id:7,name:"Compute High CPU",trigger:"VM CPU > 90%",action:"Scale out + Alert",enabled:true,executions:0,lastRun:"Never"},
    {id:8,name:"DB Connection Leak",trigger:"Connections > 90%",action:"Kill idle connections",enabled:true,executions:4,lastRun:"6 hr ago"},
  ]);
  const toggle=(id)=>setPolicies(prev=>prev.map(p=>p.id===id?{...p,enabled:!p.enabled}:p));
  const healing=issues.filter(i=>i.status==="HEALING");
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>🔄 Auto-Healing Engine</h2>
      <p style={{color:C.muted,marginBottom:16,fontSize:12}}>Automated remediation for OCI + WebLogic</p>
      {healing.length>0&&<GlowCard color={C.cyan} style={{marginBottom:14}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14}}><span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:16}}>🔄</span>Auto-Healing In Progress</div>{healing.map(i=>(
        <div key={i.id} style={{background:C.card2,borderRadius:9,padding:"10px 12px",marginBottom:6,border:`1px solid ${C.cyan}33`}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontWeight:700,color:C.cyan,fontFamily:"monospace",fontSize:11}}>{i.server} — {i.type}</span><Badge text="HEALING" color={C.cyan}/></div><div style={{height:4,background:C.dim,borderRadius:2,overflow:"hidden"}}><div style={{height:"100%",width:"65%",background:G.teal,borderRadius:2}}/></div></div>
      ))}</GlowCard>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:14}}>
        {[["Active",policies.filter(p=>p.enabled).length,C.green],["Executions",policies.reduce((a,p)=>a+p.executions,0),C.blue],["Healing",healing.length,C.cyan],["Resolved",issues.filter(i=>i.status==="RESOLVED").length,C.green]].map(([l,v,c])=>(
          <GlowCard key={l} color={c} style={{padding:"12px 14px"}}><div style={{fontFamily:"monospace",fontSize:22,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:C.muted,marginTop:3,letterSpacing:1}}>{l.toUpperCase()}</div></GlowCard>
        ))}
      </div>
      <GlowCard color={C.purple}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>🤖 Healing Policies</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          {policies.map(p=>(
            <div key={p.id} style={{background:C.card2,borderRadius:10,padding:"11px 12px",border:`1px solid ${p.enabled?C.purple+"44":C.border}`,display:"flex",gap:9,alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}><span style={{fontWeight:700,fontSize:12}}>{p.name}</span>{p.enabled&&<Badge text="ON" color={C.green} dot/>}</div>
                <div style={{fontSize:10,color:C.warning,marginBottom:2}}>⚡ {p.trigger}</div>
                <div style={{fontSize:10,color:C.cyan,marginBottom:3}}>🔧 {p.action}</div>
                <div style={{fontSize:10,color:C.muted}}>{p.executions} runs · {p.lastRun}</div>
              </div>
              {(user.role==="admin"||user.role==="operator")&&<div onClick={()=>toggle(p.id)} style={{width:38,height:20,borderRadius:10,background:p.enabled?C.green:C.dim,cursor:"pointer",position:"relative",transition:"all .3s",flexShrink:0}}><div style={{position:"absolute",top:2,left:p.enabled?19:2,width:16,height:16,borderRadius:"50%",background:"#fff",transition:"left .3s"}}/></div>}
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

function AuditTab({auditList}){
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>📋 Audit Log</h2>
      <p style={{color:C.muted,marginBottom:18,fontSize:12}}>Immutable record · {auditList.length} entries</p>
      {auditList.length===0?<GlowCard color={C.blue} style={{textAlign:"center",padding:40}}><div style={{color:C.muted}}>No records yet.</div></GlowCard>
        :<div style={{display:"flex",flexDirection:"column",gap:6}}>
          {[...auditList].reverse().map((a,i)=>(
            <GlowCard key={a.id} color={a.action.includes("APPROVED")?C.green:a.action.includes("REJECTED")?C.danger:C.blue} style={{padding:"10px 14px"}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:a.action.includes("APPROVED")?`${C.green}20`:a.action.includes("REJECTED")?`${C.danger}20`:`${C.blue}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0}}>{a.action.includes("APPROVED")?"✅":a.action.includes("REJECTED")?"❌":"⚡"}</div>
                <div style={{flex:1}}><div style={{fontWeight:700,fontSize:12,fontFamily:"monospace"}}>{a.action}</div><div style={{color:C.muted,fontSize:10,marginTop:2}}>by {a.user} · {a.time}</div></div>
                <div style={{fontFamily:"monospace",fontSize:10,color:C.dim}}>#{auditList.length-i}</div>
              </div>
            </GlowCard>
          ))}
        </div>
      }
    </div>
  );
}
