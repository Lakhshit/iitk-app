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

// ── Theme ─────────────────────────────────────────────────────
const C = {
  bg:"#060910",card:"#0a0f1a",card2:"#0f1520",border:"#1a2540",
  red:"#C74634",blue:"#1e90ff",cyan:"#00d4ff",green:"#00e676",
  orange:"#ff9100",purple:"#d500f9",teal:"#1de9b6",yellow:"#ffd600",
  text:"#e8eef8",muted:"#4a6080",dim:"#2a3a50",
  danger:"#ff1744",warning:"#ff9100",success:"#00e676",info:"#00d4ff",
  ociRed:"#C74634",ociBlue:"#1a4e8c",
};
const G = {
  red:"linear-gradient(135deg,#C74634,#8B1A10)",
  blue:"linear-gradient(135deg,#1e90ff,#00d4ff)",
  green:"linear-gradient(135deg,#00e676,#00a152)",
  orange:"linear-gradient(135deg,#ff9100,#C74634)",
  purple:"linear-gradient(135deg,#d500f9,#1e90ff)",
  teal:"linear-gradient(135deg,#1de9b6,#00d4ff)",
  header:"linear-gradient(180deg,#0a0f1a,#060910)",
  oci:"linear-gradient(135deg,#C74634,#1a4e8c)",
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

const OCI_NETWORK = [
  {id:"n1",name:"PROD-VCN",cidr:"10.0.0.0/16",region:"ap-mumbai-1",subnets:4,routeTables:3,securityLists:5,status:"AVAILABLE",igw:true,natGw:true},
  {id:"n2",name:"DR-VCN",cidr:"10.1.0.0/16",region:"ap-hyderabad-1",subnets:2,routeTables:2,securityLists:3,status:"AVAILABLE",igw:false,natGw:true},
  {id:"n3",name:"UAT-VCN",cidr:"10.2.0.0/16",region:"ap-mumbai-1",subnets:2,routeTables:2,securityLists:2,status:"AVAILABLE",igw:true,natGw:false},
];

const OCI_LB = [
  {id:"lb1",name:"PROD-LB-PUBLIC",type:"Flexible",shape:"Flexible 10Mbps-8Gbps",region:"ap-mumbai-1",ip:"152.67.x.x",status:"ACTIVE",backends:4,healthyBackends:3,protocol:"HTTPS",port:443,rps:1250,bw:245},
  {id:"lb2",name:"PROD-LB-INTERNAL",type:"Network",shape:"NLB",region:"ap-mumbai-1",ip:"10.0.0.20",status:"ACTIVE",backends:4,healthyBackends:4,protocol:"TCP",port:7001,rps:890,bw:180},
];

const OCI_OKE = [
  {id:"k1",name:"PROD-OKE-CLUSTER",region:"ap-mumbai-1",version:"v1.28.2",status:"ACTIVE",nodes:6,readyNodes:6,pods:48,cpuReq:75,memReq:68,namespaces:8},
  {id:"k2",name:"UAT-OKE-CLUSTER",region:"ap-mumbai-1",version:"v1.27.4",status:"ACTIVE",nodes:3,readyNodes:3,pods:20,cpuReq:40,memReq:35,namespaces:4},
];

const OCI_STORAGE = [
  {id:"s1",name:"gscoci-prod-backups",region:"ap-mumbai-1",objects:15420,sizeGB:4820,public:false,tier:"Standard",access:"ReadWrite",versioning:true},
  {id:"s2",name:"gscoci-dr-backups",region:"ap-hyderabad-1",objects:8200,sizeGB:2100,public:false,tier:"Archive",access:"ReadOnly",versioning:true},
  {id:"s3",name:"gscoci-logs",region:"ap-mumbai-1",objects:250000,sizeGB:820,public:false,tier:"Infrequent Access",access:"ReadWrite",versioning:false},
  {id:"s4",name:"gscoci-artifacts",region:"ap-mumbai-1",objects:3200,sizeGB:125,public:false,tier:"Standard",access:"ReadWrite",versioning:true},
];

const OCI_COST = {
  monthBudget: 150000,
  monthSpend: 98420,
  lastMonthSpend: 102300,
  forecast: 112000,
  breakdown: [
    {service:"Compute",spend:42000,pct:43},
    {service:"Autonomous DB",spend:28000,pct:28},
    {service:"Object Storage",spend:8500,pct:9},
    {service:"Load Balancer",spend:6200,pct:6},
    {service:"Kubernetes (OKE)",spend:7800,pct:8},
    {service:"Networking",spend:3200,pct:3},
    {service:"Other",spend:2720,pct:3},
  ],
};

const PASSWORDS = {admin:"WLS@ADMIN",operator:"WLS@OPS",approver:"WLS@APPR"};
const ROLES = {admin:"System Admin",operator:"OPS Engineer",approver:"Change Approver",viewer:"Viewer"};
const now = () => new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",second:"2-digit"});
const fmtUptime = (s) => {const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60);return`${d}d ${h}h ${m}m`;};
const fmtBytes = (gb) => gb>1024?`${(gb/1024).toFixed(1)}TB`:`${gb}GB`;
const statusColor = (s) => ({RUNNING:C.green,AVAILABLE:C.green,ACTIVE:C.green,WARNING:C.warning,CRITICAL:C.danger,STOPPED:C.muted,STANDBY:C.cyan,STARTING:C.blue,STOPPING:C.orange,RESTARTING:C.purple,TERMINATED:C.dim,FAILED:C.danger}[s]||C.muted);
const deriveWLSStatus = (s) => {
  if(s.operationStatus)return s.operationStatus;
  if(s.cpu>=92||s.jvmHeap>=95||s.mem>=95)return"CRITICAL";
  if(s.cpu>=75||s.jvmHeap>=82||s.mem>=82||s.threads/s.maxThreads>=0.88)return"WARNING";
  if(s.env==="DR")return"STANDBY";
  return"RUNNING";
};

// ── UI Components ─────────────────────────────────────────────
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

function useDB(path){
  const [data,setData]=useState(null);
  useEffect(()=>{const r=ref(db,path);const u=onValue(r,s=>setData(s.val()));return()=>u();},[path]);
  return data;
}

// ── Section Header ────────────────────────────────────────────
const SectionHeader = ({icon,title,sub,color,action}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:20}}>
    <div>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
        <span style={{fontSize:22}}>{icon}</span>
        <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:0}}>{title}</h2>
      </div>
      {sub&&<p style={{color:C.muted,margin:0,fontSize:12}}>{sub}</p>}
    </div>
    {action}
  </div>
);

// ── Approval Modal ────────────────────────────────────────────
function ApprovalModal({op,target,user,onConfirm,onCancel}){
  const [reason,setReason]=useState("");
  const [ticket,setTicket]=useState("");
  const [priority,setPriority]=useState("Normal");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.85)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(4px)"}}>
      <GlowCard color={priority==="Emergency"?C.danger:C.warning} style={{width:"100%",maxWidth:500,padding:32}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{fontSize:44,marginBottom:10}}>{op==="RESTART"?"🔄":op==="STOP"?"⏹️":op==="START"?"▶️":op==="TERMINATE"?"💀":"⚡"}</div>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:C.text,margin:"0 0 6px"}}>{op} — {target}</h2>
          {user.role!=="admin"&&<Badge text="REQUIRES CHANGE APPROVER APPROVAL" color={C.warning}/>}
          {user.role==="admin"&&<Badge text="ADMIN — DIRECT EXECUTION" color={C.green}/>}
        </div>
        {user.role!=="admin"&&(
          <div style={{background:`${C.warning}15`,border:`1px solid ${C.warning}30`,borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:C.warning}}>
            ⚠️ Your request will be queued for approval. Execution only happens after a Change Approver signs off.
          </div>
        )}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Priority</div>
          <div style={{display:"flex",gap:8}}>
            {["Low","Normal","High","Emergency"].map(p=>(
              <button key={p} onClick={()=>setPriority(p)} style={{flex:1,padding:"7px 4px",background:priority===p?`${p==="Emergency"?C.danger:C.blue}22`:C.card2,border:`1px solid ${priority===p?p==="Emergency"?C.danger:C.blue:C.border}`,borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,color:priority===p?p==="Emergency"?C.danger:C.blue:C.muted}}>{p}</button>
            ))}
          </div>
        </div>
        <Inp value={ticket} onChange={e=>setTicket(e.target.value)} placeholder="Change Ticket # (optional)" style={{marginBottom:12}}/>
        <Inp value={reason} onChange={e=>setReason(e.target.value)} placeholder="Reason / justification *" rows={3} style={{marginBottom:18}}/>
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
      {/* Left */}
      <div style={{width:420,background:"linear-gradient(180deg,#0a0f1a,#060910)",borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",padding:36,position:"relative",zIndex:1,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:28}}>
          <div style={{width:48,height:48,background:G.oci,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,boxShadow:`0 0 30px ${C.red}50`}}>☁️</div>
          <div>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:C.text}}>GSC OCI Control</div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:2,textTransform:"uppercase"}}>Oracle Cloud Infrastructure</div>
          </div>
        </div>
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:9,color:C.muted,marginBottom:4,letterSpacing:1}}>SYSTEM TIME (IST)</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:C.cyan}}>{time.toLocaleTimeString()}</div>
          <div style={{fontSize:10,color:C.muted,marginTop:3}}>{time.toLocaleDateString("en-IN",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</div>
        </div>
        {/* OCI Summary */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"12px 16px",marginBottom:16}}>
          <div style={{fontSize:9,color:C.muted,marginBottom:10,letterSpacing:1}}>INFRASTRUCTURE SUMMARY</div>
          {[
            ["☁️ Compute Instances",`${OCI_COMPUTE.filter(c=>c.status==="RUNNING").length}/${OCI_COMPUTE.length} Running`,C.green],
            ["🗄️ Databases",`${OCI_DATABASES.filter(d=>d.status==="AVAILABLE").length}/${OCI_DATABASES.length} Available`,C.blue],
            ["⚡ WebLogic Servers",`${WLS_SERVERS.filter(s=>s.env==="Production").length} Production`,C.orange],
            ["⚖️ Load Balancers",`${OCI_LB.filter(l=>l.status==="ACTIVE").length}/${OCI_LB.length} Active`,C.teal],
            ["☸️ OKE Clusters",`${OCI_OKE.filter(k=>k.status==="ACTIVE").length}/${OCI_OKE.length} Active`,C.purple],
          ].map(([label,val,color])=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:11,color:C.muted}}>{label}</span>
              <span style={{fontSize:11,fontWeight:700,color}}>{val}</span>
            </div>
          ))}
        </div>
        <div style={{background:`${C.danger}12`,border:`1px solid ${C.danger}30`,borderRadius:12,padding:"12px 16px"}}>
          <div style={{fontSize:9,color:C.danger,marginBottom:8,fontWeight:700,letterSpacing:1}}>⚠ ACTIVE ALERTS</div>
          <div style={{fontSize:11,color:C.text,marginBottom:4}}><span style={{color:C.danger}}>●</span> WLS-PROD-04: JVM Heap 98%</div>
          <div style={{fontSize:11,color:C.text,marginBottom:4}}><span style={{color:C.danger}}>●</span> WLS-PROD-04: CPU 94%</div>
          <div style={{fontSize:11,color:C.text}}><span style={{color:C.warning}}>●</span> prod-app-01: CPU spike detected</div>
        </div>
      </div>
      {/* Right */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:48,position:"relative",zIndex:1}}>
        <div style={{width:"100%",maxWidth:400}}>
          <h1 style={{fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,color:C.text,margin:"0 0 6px"}}>Secure Access</h1>
          <p style={{color:C.muted,margin:"0 0 28px",fontSize:13}}>GSC Oracle Cloud Infrastructure Management</p>
          <GlowCard color={C.blue} style={{padding:26}}>
            <div style={{marginBottom:18}}>
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
            {role&&role!=="viewer"&&(
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,color:C.muted,marginBottom:7,letterSpacing:1,textTransform:"uppercase"}}>Password</div>
                <Inp value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} placeholder="Enter password" type="password"/>
                <div style={{fontSize:10,color:C.dim,marginTop:5,fontFamily:"monospace"}}>Admin:WLS@ADMIN · Ops:WLS@OPS · Approver:WLS@APPR</div>
              </div>
            )}
            {err&&<div style={{color:C.danger,fontSize:12,marginBottom:10}}>⚠ {err}</div>}
            <Btn grad={G.oci} color={C.red} onClick={login} style={{width:"100%",padding:12}}>🔐 Sign In to OCI Control</Btn>
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
  const [tab,setTab]=useState("overview");
  const [wlsServers,setWlsServers]=useState(()=>WLS_SERVERS.map(s=>({...s,status:deriveWLSStatus(s)})));
  const [compute,setCompute]=useState(OCI_COMPUTE);
  const [databases,setDatabases]=useState(OCI_DATABASES);
  const [lbs,setLbs]=useState(OCI_LB);
  const [oke,setOke]=useState(OCI_OKE);
  const [wlsIssues,setWlsIssues]=useState([
    {id:"i1",server:"WLS-PROD-04",severity:"CRITICAL",type:"Memory Leak",description:"JVM Heap at 98% — OutOfMemoryError imminent",detected:"2 min ago",autoHeal:true,status:"HEALING"},
    {id:"i2",server:"WLS-PROD-03",severity:"WARNING",type:"Thread Starvation",description:"Thread pool at 92.5% — 185/200 threads",detected:"15 min ago",autoHeal:true,status:"DETECTED"},
    {id:"i3",server:"WLS-PROD-04",severity:"CRITICAL",type:"GC Overhead",description:"GC time 120ms — performance degraded",detected:"5 min ago",autoHeal:true,status:"DETECTED"},
  ]);
  const [termLines,setTermLines]=useState(["[INFO] GSC OCI Control Platform ready.","[INFO] All systems nominal — monitoring active."]);
  const [modal,setModal]=useState(null);

  const approvalsDB=useDB("approvals");
  const auditDB=useDB("auditLogs");
  const approvalList=approvalsDB?Object.entries(approvalsDB).map(([k,v])=>({id:k,...v})):[];
  const auditList=auditDB?Object.entries(auditDB).map(([k,v])=>({id:k,...v})):[];

  // Live metric drift
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
        const upd={...s,cpu,mem,jvmHeap,gcTime,threads,uptimeSecs:s.uptimeSecs+2};
        upd.status=deriveWLSStatus(upd);
        return upd;
      }));
      setCompute(prev=>prev.map(c=>{
        if(c.status==="STOPPED")return c;
        return{...c,cpu:Math.round(drift(c.cpu,4,1,99)),mem:Math.round(drift(c.mem,2,10,99)),uptimeSecs:c.uptimeSecs+2};
      }));
      setDatabases(prev=>prev.map(d=>({...d,cpu:Math.round(drift(d.cpu,3,1,90)),connections:Math.round(drift(d.connections,5,1,d.maxConns))})));
      setLbs(prev=>prev.map(l=>({...l,rps:Math.round(drift(l.rps,50,10,5000)),bw:Math.round(drift(l.bw,20,10,1000))})));
      setOke(prev=>prev.map(k=>({...k,cpuReq:Math.round(drift(k.cpuReq,3,10,95)),memReq:Math.round(drift(k.memReq,2,10,95)),pods:Math.round(drift(k.pods,2,10,200))})));
    },2500);
    return()=>clearInterval(t);
  },[]);

  // Auto-heal
  useEffect(()=>{
    const t=setInterval(()=>{
      setWlsIssues(prev=>prev.map(i=>{
        if(i.autoHeal&&i.status==="DETECTED")return{...i,status:"HEALING"};
        if(i.autoHeal&&i.status==="HEALING"&&Math.random()>.7)return{...i,status:"RESOLVED"};
        return i;
      }));
    },4000);
    return()=>clearInterval(t);
  },[]);

  const executeOp=(serverId,op,type="wls")=>{
    const opSteps={
      RESTART:[{d:0,l:"[INFO] Initiating graceful RESTART..."},{d:800,l:"[INFO] Draining active connections..."},{d:1800,l:"[WARN] Waiting for in-flight transactions..."},{d:2800,l:"[OK] Server stopped cleanly"},{d:3600,l:"[INFO] Starting server process..."},{d:4600,l:"[INFO] Loading configuration..."},{d:5400,l:"[OK] Datasources connected"},{d:6400,l:"[INFO] Deploying applications..."},{d:7400,l:"[SUCCESS] ✓ Server RUNNING — restart complete!"}],
      STOP:[{d:0,l:"[INFO] Initiating STOP..."},{d:800,l:"[WARN] Draining connections..."},{d:1800,l:"[OK] Applications stopped"},{d:2600,l:"[SUCCESS] ✓ Server STOPPED"}],
      START:[{d:0,l:"[INFO] Starting server..."},{d:800,l:"[INFO] Loading config..."},{d:1800,l:"[OK] Datasources connected"},{d:2800,l:"[SUCCESS] ✓ Server RUNNING!"}],
      TERMINATE:[{d:0,l:"[WARN] Terminating instance..."},{d:1500,l:"[WARN] Stopping OS processes..."},{d:3000,l:"[SUCCESS] ✓ Instance TERMINATED"}],
    };
    const steps=opSteps[op]||[{d:0,l:`[INFO] Executing ${op}...`},{d:1000,l:"[SUCCESS] Done"}];
    const wlsStatusMap={RESTART:["STOPPING","STOPPED","STARTING","RUNNING"],STOP:["STOPPING","STOPPED"],START:["STARTING","RUNNING"]};
    if(type==="wls"){
      (wlsStatusMap[op]||[]).forEach((st,i)=>setTimeout(()=>setWlsServers(prev=>prev.map(s=>s.id===serverId?{...s,status:st,operationStatus:st==="RUNNING"?null:st}:s)),i*(op==="RESTART"?3500:1500)));
    }
    steps.forEach(({d,l})=>setTimeout(()=>setTermLines(prev=>[...prev,l]),d));
  };

  const handleOp=(target,op,type="wls")=>{
    setModal({target,op,type});
  };

  const confirmOp=({reason,ticket,priority})=>{
    const {target,op,type}=modal;
    const targetName=typeof target==="string"?target:target.name;
    const entry={action:`${op} on ${targetName}`,user:user.name,target:targetName,operation:op,reason,ticket,priority,requestedBy:user.name,time:now(),resourceType:type};
    if(user.role==="admin"){
      push(ref(db,"auditLogs"),{...entry,status:"APPROVED"});
      setTermLines(prev=>[...prev,`[INFO] ${op} authorized by ${user.name}`,`[INFO] Executing on ${targetName}...`]);
      if(type==="wls")executeOp(target.id,op,"wls");
      else if(type==="compute")executeOp(target.id,op,"compute");
    }else{
      push(ref(db,"approvals"),{...entry,status:"PENDING"});
      setTermLines(prev=>[...prev,`[INFO] ${op} request submitted for ${targetName}`,`[WARN] Awaiting Change Approver authorization...`]);
    }
    setModal(null);
  };

  const pendingApprovals=approvalList.filter(a=>a.status==="PENDING").length;
  const criticalWLS=wlsServers.filter(s=>s.status==="CRITICAL").length;
  const activeIssues=wlsIssues.filter(i=>i.status!=="RESOLVED").length;

  const ALL_TABS = [
    {id:"overview",label:"🌐 OCI Overview",roles:["admin","operator","approver","viewer"]},
    {id:"compute",label:"💻 Compute",roles:["admin","operator","viewer"]},
    {id:"weblogic",label:"⚡ WebLogic",roles:["admin","operator","viewer"]},
    {id:"database",label:"🗄️ Database",roles:["admin","operator","viewer"]},
    {id:"network",label:"🔌 Network & LB",roles:["admin","operator","viewer"]},
    {id:"kubernetes",label:"☸️ Kubernetes",roles:["admin","operator","viewer"]},
    {id:"storage",label:"🪣 Storage",roles:["admin","operator","viewer"]},
    {id:"cost",label:"💰 Cost & Budget",roles:["admin","viewer"]},
    {id:"security",label:"🔐 Security & IAM",roles:["admin","viewer"]},
    {id:"operations",label:`⚙️ Operations${pendingApprovals>0?` (${pendingApprovals})`:""}`,roles:["admin","operator"]},
    {id:"approvals",label:`✅ Approvals${pendingApprovals>0?` (${pendingApprovals})`:""}`,roles:["admin","approver"]},
    {id:"issues",label:`🔥 Issues${activeIssues>0?` (${activeIssues})`:""}`,roles:["admin","operator","viewer"]},
    {id:"autohealing",label:"🔄 Auto-Heal",roles:["admin","operator"]},
    {id:"audit",label:"📋 Audit Log",roles:["admin","approver","viewer"]},
  ].filter(t=>t.roles.includes(user.role));

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Sans',sans-serif",color:C.text}}>
      <style>{`*{box-sizing:border-box}::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}input,textarea,select,button{font-family:'DM Sans',sans-serif}@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes pr{0%{transform:scale(.5);opacity:1}100%{transform:scale(2.5);opacity:0}}`}</style>

      {modal&&<ApprovalModal op={modal.op} target={typeof modal.target==="string"?modal.target:modal.target.name} user={user} onConfirm={confirmOp} onCancel={()=>setModal(null)}/>}

      <header style={{background:G.header,borderBottom:`1px solid ${C.border}`,position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 20px rgba(0,0,0,.6)"}}>
        <div style={{maxWidth:1700,margin:"0 auto",padding:"0 18px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:54}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:34,height:34,background:G.oci,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:`0 0 16px ${C.red}50`}}>☁️</div>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:C.text,lineHeight:1}}>GSC OCI Control Platform</div>
                <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,textTransform:"uppercase"}}>Global Service Centre · Oracle Cloud Infrastructure</div>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {criticalWLS>0&&<div style={{display:"flex",alignItems:"center",gap:5,background:`${C.danger}20`,border:`1px solid ${C.danger}44`,borderRadius:20,padding:"3px 10px"}}><Pulse color={C.danger} size={6}/><span style={{fontSize:11,fontWeight:700,color:C.danger}}>{criticalWLS} CRITICAL</span></div>}
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
        <div style={{maxWidth:1700,margin:"0 auto",padding:"0 18px",display:"flex",overflowX:"auto",borderTop:`1px solid ${C.border}`}}>
          {ALL_TABS.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 14px",background:"transparent",border:"none",borderBottom:tab===t.id?`2px solid ${C.red}`:"2px solid transparent",color:tab===t.id?C.red:C.muted,cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap",transition:"all .2s"}}>{t.label}</button>)}
        </div>
      </header>

      <main style={{maxWidth:1700,margin:"0 auto",padding:"22px 18px",animation:"slideIn .25s ease"}}>
        {tab==="overview"&&<OverviewTab wlsServers={wlsServers} compute={compute} databases={databases} lbs={lbs} oke={oke} wlsIssues={wlsIssues} approvalList={approvalList} auditList={auditList}/>}
        {tab==="compute"&&<ComputeTab compute={compute} user={user} handleOp={handleOp} termLines={termLines}/>}
        {tab==="weblogic"&&<WebLogicTab servers={wlsServers} user={user} handleOp={handleOp} termLines={termLines}/>}
        {tab==="database"&&<DatabaseTab databases={databases} user={user} handleOp={handleOp}/>}
        {tab==="network"&&<NetworkTab network={OCI_NETWORK} lbs={lbs}/>}
        {tab==="kubernetes"&&<KubernetesTab clusters={oke} user={user} handleOp={handleOp}/>}
        {tab==="storage"&&<StorageTab buckets={OCI_STORAGE}/>}
        {tab==="cost"&&<CostTab/>}
        {tab==="security"&&<SecurityTab/>}
        {tab==="operations"&&<OperationsTab wlsServers={wlsServers} compute={compute} user={user} approvalList={approvalList} handleOp={handleOp} termLines={termLines} setTermLines={setTermLines}/>}
        {tab==="approvals"&&<ApprovalsTab approvalList={approvalList} user={user} wlsServers={wlsServers} executeOp={executeOp} setTermLines={setTermLines}/>}
        {tab==="issues"&&<IssuesTab issues={wlsIssues} setIssues={setWlsIssues} servers={wlsServers}/>}
        {tab==="autohealing"&&<AutoHealTab issues={wlsIssues} user={user}/>}
        {tab==="audit"&&<AuditTab auditList={auditList}/>}
      </main>
    </div>
  );
}

// ── OCI OVERVIEW ──────────────────────────────────────────────
function OverviewTab({wlsServers,compute,databases,lbs,oke,wlsIssues,approvalList,auditList}){
  const running=wlsServers.filter(s=>["RUNNING"].includes(s.status)).length;
  const critical=wlsServers.filter(s=>s.status==="CRITICAL").length;
  const computeRunning=compute.filter(c=>c.status==="RUNNING").length;
  const dbAvail=databases.filter(d=>d.status==="AVAILABLE").length;
  const activeIssues=wlsIssues.filter(i=>i.status!=="RESOLVED").length;
  const healing=wlsIssues.filter(i=>i.status==="HEALING").length;

  return (
    <div>
      <div style={{marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <span style={{fontSize:22}}>🌐</span>
          <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:C.text,margin:0}}>OCI Infrastructure Overview</h2>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}><Pulse color={C.green} size={6}/><span style={{fontSize:11,color:C.muted}}>Live · ap-mumbai-1 (Primary) · ap-hyderabad-1 (DR) · Updates every 2.5s</span></div>
      </div>

      {/* Top KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:10,marginBottom:18}}>
        {[
          {l:"Compute Running",v:`${computeRunning}/${compute.length}`,c:C.green,i:"💻"},
          {l:"WebLogic RUNNING",v:`${running}/${wlsServers.length}`,c:C.orange,i:"⚡"},
          {l:"Databases UP",v:`${dbAvail}/${databases.length}`,c:C.blue,i:"🗄️"},
          {l:"LB Active",v:`${lbs.filter(l=>l.status==="ACTIVE").length}/${lbs.length}`,c:C.teal,i:"⚖️"},
          {l:"OKE Active",v:`${oke.filter(k=>k.status==="ACTIVE").length}/${oke.length}`,c:C.purple,i:"☸️"},
          {l:"Critical Alerts",v:critical,c:critical>0?C.danger:C.green,i:"🔴"},
          {l:"Active Issues",v:activeIssues,c:activeIssues>0?C.warning:C.green,i:"🔥"},
          {l:"Auto-Healing",v:healing,c:C.cyan,i:"🔄"},
          {l:"Pending Approvals",v:(approvalList||[]).filter(a=>a.status==="PENDING").length,c:C.warning,i:"⏳"},
          {l:"Month Spend",v:"₹98.4K",c:C.yellow,i:"💰"},
        ].map(s=>(
          <GlowCard key={s.l} color={s.c} style={{padding:"14px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:s.c,lineHeight:1}}>{s.v}</div>
                <div style={{fontSize:9,color:C.muted,marginTop:5,letterSpacing:.8}}>{s.l.toUpperCase()}</div>
              </div>
              <span style={{fontSize:16,opacity:.5}}>{s.i}</span>
            </div>
          </GlowCard>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1.6fr 1fr",gap:16,marginBottom:16}}>
        {/* Compute Grid */}
        <GlowCard color={C.blue}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:14,display:"flex",justifyContent:"space-between"}}>
            <span>💻 Compute Instances</span><span style={{fontSize:11,color:C.muted}}>ap-mumbai-1</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {compute.map(c=>(
              <div key={c.id} style={{background:C.card2,borderRadius:10,padding:10,border:`1px solid ${statusColor(c.status)}22`,transition:"border .3s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:7}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <Pulse color={statusColor(c.status)} size={6}/>
                    <span style={{fontWeight:700,fontSize:11,fontFamily:"monospace"}}>{c.name}</span>
                  </div>
                  <Badge text={c.status} color={statusColor(c.status)}/>
                </div>
                <div style={{fontSize:10,color:C.muted,marginBottom:7}}>{c.shape} · {c.role}</div>
                {c.status!=="STOPPED"&&<div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <MetricBar value={c.cpu} label="CPU" warn={70} crit={88} small/>
                  <MetricBar value={c.mem} label="MEM" warn={75} crit={90} small/>
                </div>}
                {c.status==="STOPPED"&&<div style={{fontSize:10,color:C.muted}}>Instance stopped</div>}
              </div>
            ))}
          </div>
        </GlowCard>

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {/* Database */}
          <GlowCard color={C.cyan}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>🗄️ Databases</div>
            {databases.map(d=>(
              <div key={d.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <div>
                  <div style={{fontWeight:700,fontSize:12,fontFamily:"monospace"}}>{d.name}</div>
                  <div style={{fontSize:10,color:C.muted}}>{d.type} · {d.region}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <Badge text={`CPU:${d.cpu}%`} color={d.cpu>70?C.warning:C.green}/>
                  <Badge text={d.status} color={statusColor(d.status)}/>
                </div>
              </div>
            ))}
          </GlowCard>

          {/* Load Balancers */}
          <GlowCard color={C.teal}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>⚖️ Load Balancers</div>
            {lbs.map(l=>(
              <div key={l.id} style={{background:C.card2,borderRadius:8,padding:10,marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                  <span style={{fontWeight:700,fontSize:12}}>{l.name}</span>
                  <Badge text={l.status} color={statusColor(l.status)}/>
                </div>
                <div style={{display:"flex",gap:12,fontSize:11}}>
                  <span style={{color:C.teal}}>⚡ {l.rps.toLocaleString()} RPS</span>
                  <span style={{color:C.cyan}}>📶 {l.bw} Mbps</span>
                  <span style={{color:l.healthyBackends<l.backends?C.warning:C.green}}>
                    {l.healthyBackends}/{l.backends} backends
                  </span>
                </div>
              </div>
            ))}
          </GlowCard>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14}}>
        {/* WebLogic Quick */}
        <GlowCard color={C.orange}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>⚡ WebLogic Servers</div>
          {wlsServers.map(s=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <Pulse color={statusColor(s.status)} size={6}/>
              <span style={{flex:1,fontSize:11,fontFamily:"monospace"}}>{s.name}</span>
              <span style={{fontSize:10,color:C.muted}}>CPU:{s.cpu}%</span>
              <Badge text={s.status} color={statusColor(s.status)}/>
            </div>
          ))}
        </GlowCard>

        {/* OKE */}
        <GlowCard color={C.purple}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14}}>☸️ Kubernetes (OKE)</div>
          {oke.map(k=>(
            <div key={k.id} style={{background:C.card2,borderRadius:10,padding:12,marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div>
                  <div style={{fontWeight:700,fontSize:12}}>{k.name}</div>
                  <div style={{fontSize:10,color:C.muted}}>{k.version} · {k.readyNodes}/{k.nodes} nodes · {k.pods} pods</div>
                </div>
                <Badge text={k.status} color={statusColor(k.status)}/>
              </div>
              <MetricBar value={k.cpuReq} label="CPU Req" warn={70} crit={85} small/>
              <div style={{marginTop:4}}><MetricBar value={k.memReq} label="Mem Req" warn={75} crit={90} small/></div>
            </div>
          ))}
        </GlowCard>

        {/* Issues + Activity */}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <GlowCard color={C.danger}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>🔥 Active Issues</div>
            {wlsIssues.filter(i=>i.status!=="RESOLVED").length===0
              ?<div style={{color:C.muted,fontSize:12,textAlign:"center",padding:"10px 0"}}>✅ All clear</div>
              :wlsIssues.filter(i=>i.status!=="RESOLVED").map(i=>(
                <div key={i.id} style={{padding:"7px 0",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:11,color:i.severity==="CRITICAL"?C.danger:C.warning,fontFamily:"monospace"}}>{i.server}</div>
                    <div style={{fontSize:10,color:C.muted}}>{i.type}</div>
                  </div>
                  <div style={{display:"flex",gap:4,alignItems:"center"}}>
                    {i.status==="HEALING"&&<span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:12}}>🔄</span>}
                    <Badge text={i.severity} color={i.severity==="CRITICAL"?C.danger:C.warning}/>
                  </div>
                </div>
              ))}
          </GlowCard>
          <GlowCard color={C.muted}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>📋 Recent Activity</div>
            {auditList.length===0?<div style={{color:C.muted,fontSize:11}}>No activity.</div>
              :[...auditList].reverse().slice(0,4).map(a=>(
                <div key={a.id} style={{padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
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

// ── COMPUTE TAB ───────────────────────────────────────────────
function ComputeTab({compute,user,handleOp,termLines}){
  const [selected,setSelected]=useState(null);
  const [localTermLines,setLocalTermLines]=useState(["[INFO] Compute console ready..."]);
  const canOperate=user.role==="admin"||user.role==="operator";
  const sel=selected?compute.find(c=>c.id===selected):null;

  return (
    <div>
      <SectionHeader icon="💻" title="Compute Instances" sub={`${compute.length} instances · ${compute.filter(c=>c.status==="RUNNING").length} running · Live metrics`}/>
      <div style={{display:"grid",gridTemplateColumns:sel?"1fr 380px":"1fr",gap:16}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:12,alignContent:"start"}}>
          {compute.map(c=>(
            <GlowCard key={c.id} color={statusColor(c.status)} onClick={()=>setSelected(selected===c.id?null:c.id)} style={{cursor:"pointer",border:`1px solid ${selected===c.id?statusColor(c.status)+"66":statusColor(c.status)+"22"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <Pulse color={statusColor(c.status)} size={7}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:700,fontSize:13}}>{c.name}</span>
                  </div>
                  <div style={{fontSize:10,color:C.muted}}>{c.shape}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                  <Badge text={c.status} color={statusColor(c.status)} dot/>
                  <Badge text={c.role} color={C.blue}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:10}}>
                {[["OCPU",c.ocpu,C.cyan],["RAM",c.ram+"G",C.purple],["CPU%",c.status!=="STOPPED"?c.cpu+"%":"-",c.cpu>85?C.danger:c.cpu>70?C.warning:C.green],["MEM%",c.status!=="STOPPED"?c.mem+"%":"-",c.mem>88?C.danger:c.mem>75?C.warning:C.green]].map(([l,v,col])=>(
                  <div key={l} style={{background:C.bg,borderRadius:7,padding:"7px 4px",textAlign:"center"}}>
                    <div style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:col,transition:"color .3s"}}>{v}</div>
                    <div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",fontSize:10,color:C.muted}}>
                <span>📍 {c.region}/{c.ad}</span>
                <span>· {c.os}</span>
                {c.status!=="STOPPED"&&<span>· ⏱ {fmtUptime(c.uptimeSecs)}</span>}
              </div>
            </GlowCard>
          ))}
        </div>

        {sel&&(
          <div style={{position:"sticky",top:80,height:"fit-content",display:"flex",flexDirection:"column",gap:12}}>
            <GlowCard color={statusColor(sel.status)}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16}}>{sel.name}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:3}}>{sel.role} · {sel.shape}</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button>
              </div>
              {sel.status!=="STOPPED"&&(
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                  <MetricBar value={sel.cpu} label="CPU Usage" warn={70} crit={88}/>
                  <MetricBar value={sel.mem} label="Memory" warn={75} crit={90}/>
                </div>
              )}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:14}}>
                {[["OCPU",sel.ocpu],["RAM",sel.ram+"GB"],["OS",sel.os],["Region",sel.region],["Private IP",sel.privateIp],["Uptime",fmtUptime(sel.uptimeSecs)]].map(([l,v])=>(
                  <div key={l} style={{background:C.bg,borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:C.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
                    <div style={{fontSize:12,fontWeight:600,fontFamily:"monospace"}}>{v}</div>
                  </div>
                ))}
              </div>
              {canOperate&&(
                <div>
                  <div style={{fontSize:10,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Operations</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
                    {[["RESTART","🔄",C.blue],["STOP","⏹️",C.danger],["START","▶️",C.green]].map(([op,icon,color])=>(
                      <button key={op} onClick={()=>handleOp(sel,op,"compute")} style={{padding:"9px 4px",background:`${color}15`,border:`1px solid ${color}44`,borderRadius:9,cursor:"pointer",textAlign:"center",color,fontWeight:700,fontSize:10}}>
                        <div style={{fontSize:17,marginBottom:2}}>{icon}</div>{op}
                      </button>
                    ))}
                  </div>
                  {user.role!=="admin"&&<div style={{fontSize:10,color:C.warning,marginTop:7,textAlign:"center"}}>⚠ Requires approval</div>}
                </div>
              )}
            </GlowCard>
            <GlowCard color={C.green}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13}}>Console</div>
              <Terminal lines={localTermLines} height={160}/>
            </GlowCard>
          </div>
        )}
      </div>
    </div>
  );
}

// ── WEBLOGIC TAB ──────────────────────────────────────────────
function WebLogicTab({servers,user,handleOp,termLines}){
  const [selected,setSelected]=useState(null);
  const [localTerm,setLocalTerm]=useState(["[INFO] WebLogic console ready..."]);
  const canOperate=user.role==="admin"||user.role==="operator";
  const sel=selected?servers.find(s=>s.id===selected):null;

  return (
    <div>
      <SectionHeader icon="⚡" title="WebLogic Servers" sub={`${servers.length} servers · Live JVM metrics · Click server for details`}/>
      <div style={{display:"grid",gridTemplateColumns:sel?"1fr 380px":"1fr",gap:16}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:10,alignContent:"start"}}>
          {servers.map(s=>(
            <GlowCard key={s.id} color={statusColor(s.status)} onClick={()=>setSelected(selected===s.id?null:s.id)} style={{cursor:"pointer",padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:3}}>
                    <Pulse color={statusColor(s.status)} size={7}/>
                    <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12}}>{s.name}</span>
                  </div>
                  <div style={{fontSize:10,color:C.muted}}>{s.host}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}>
                  <Badge text={s.status} color={statusColor(s.status)} dot/>
                  <Badge text={s.env} color={s.env==="Production"?C.red:s.env==="UAT"?C.blue:C.teal}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:5,marginBottom:10}}>
                {[["CPU",s.cpu+"%",s.cpu>85?C.danger:s.cpu>70?C.warning:C.green],["MEM",s.mem+"%",s.mem>90?C.danger:s.mem>75?C.warning:C.green],["JVM",s.jvmHeap+"%",s.jvmHeap>92?C.danger:s.jvmHeap>80?C.warning:C.green],["THR",s.threads,s.threads/s.maxThreads>.9?C.danger:s.threads/s.maxThreads>.75?C.warning:C.green]].map(([l,v,c])=>(
                  <div key={l} style={{background:C.bg,borderRadius:7,padding:"6px 3px",textAlign:"center"}}>
                    <div style={{fontFamily:"monospace",fontSize:11,fontWeight:700,color:c,transition:"color .3s"}}>{v}</div>
                    <div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:10,color:C.muted}}>⏱ {fmtUptime(s.uptimeSecs)} · {s.deployments} apps · WLS {s.version}</div>
              {["STARTING","STOPPING","RESTARTING"].includes(s.status)&&<div style={{marginTop:7,fontSize:10,color:C.cyan,display:"flex",alignItems:"center",gap:4}}><span style={{animation:"spin 1s linear infinite",display:"inline-block"}}>⟳</span> {s.status}...</div>}
            </GlowCard>
          ))}
        </div>

        {sel&&(
          <div style={{position:"sticky",top:80,height:"fit-content",display:"flex",flexDirection:"column",gap:12}}>
            <GlowCard color={statusColor(sel.status)}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:16}}>{sel.name}</div>
                  <div style={{fontSize:10,color:C.muted,fontFamily:"monospace",marginTop:3}}>{sel.host}:{sel.port}</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
                <MetricBar value={sel.cpu} label="CPU" warn={70} crit={85}/>
                <MetricBar value={sel.mem} label="Memory" warn={75} crit={90}/>
                <MetricBar value={sel.jvmHeap} label="JVM Heap" warn={80} crit={92}/>
                <MetricBar value={sel.gcTime} max={200} label="GC Time" warn={50} crit={100} unit="ms"/>
                <MetricBar value={sel.threads} max={sel.maxThreads} label={`Threads (max ${sel.maxThreads})`} warn={75} crit={90} unit=""/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginBottom:12}}>
                {[["Uptime",fmtUptime(sel.uptimeSecs)],["Version",sel.version],["Deployments",sel.deployments],["Datasources",sel.datasources]].map(([l,v])=>(
                  <div key={l} style={{background:C.bg,borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:9,color:C.muted,marginBottom:2,textTransform:"uppercase",letterSpacing:1}}>{l}</div>
                    <div style={{fontSize:12,fontWeight:600,fontFamily:"monospace"}}>{v}</div>
                  </div>
                ))}
              </div>
              {canOperate&&(
                <div>
                  <div style={{fontSize:10,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Operations</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7}}>
                    {[["RESTART","🔄",C.blue],["STOP","⏹️",C.danger],["START","▶️",C.green]].map(([op,icon,color])=>(
                      <button key={op} onClick={()=>handleOp(sel,op,"wls")} style={{padding:"9px 4px",background:`${color}15`,border:`1px solid ${color}44`,borderRadius:9,cursor:"pointer",textAlign:"center",color,fontWeight:700,fontSize:10}}>
                        <div style={{fontSize:17,marginBottom:2}}>{icon}</div>{op}
                      </button>
                    ))}
                  </div>
                  {user.role!=="admin"&&<div style={{fontSize:10,color:C.warning,marginTop:7,textAlign:"center"}}>⚠ Requires approval</div>}
                </div>
              )}
            </GlowCard>
            <GlowCard color={C.green}>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:13,display:"flex",justifyContent:"space-between"}}>
                <span>Console</span>
                <button onClick={()=>setLocalTerm(["[INFO] Cleared."])} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:5,color:C.muted,cursor:"pointer",fontSize:10,padding:"2px 7px"}}>Clear</button>
              </div>
              <Terminal lines={localTerm} height={170}/>
            </GlowCard>
          </div>
        )}
      </div>
    </div>
  );
}

// ── DATABASE TAB ──────────────────────────────────────────────
function DatabaseTab({databases,user,handleOp}){
  return (
    <div>
      <SectionHeader icon="🗄️" title="Oracle Databases" sub={`${databases.length} databases · Autonomous + DB Systems · Live metrics`}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
        {databases.map(d=>(
          <GlowCard key={d.id} color={statusColor(d.status)}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontFamily:"monospace",fontWeight:700,fontSize:13,marginBottom:3}}>{d.name}</div>
                <div style={{fontSize:10,color:C.muted}}>{d.type}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:4,alignItems:"flex-end"}}>
                <Badge text={d.status} color={statusColor(d.status)} dot/>
                <Badge text={d.shape} color={C.blue}/>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:12}}>
              {[["OCPU",d.ocpu,C.cyan],["Size",d.size,C.purple],["CPU%",d.cpu+"%",d.cpu>70?C.warning:C.green],["Conns",d.connections,d.connections/d.maxConns>.85?C.danger:C.green]].map(([l,v,c])=>(
                <div key={l} style={{background:C.bg,borderRadius:7,padding:"7px 4px",textAlign:"center"}}>
                  <div style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color:c,transition:"color .3s"}}>{v}</div>
                  <div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
              <MetricBar value={d.cpu} label="CPU Usage" warn={60} crit={80}/>
              <MetricBar value={d.connections} max={d.maxConns} label={`Connections (max ${d.maxConns})`} warn={70} crit={85} unit=""/>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",fontSize:10,color:C.muted}}>
              <span>📍 {d.region}</span>
              <span>· Oracle {d.version}</span>
              <span>· Backup: {d.backup}</span>
              <span>· ⏱ {fmtUptime(d.uptimeSecs)}</span>
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}

// ── NETWORK TAB ───────────────────────────────────────────────
function NetworkTab({network,lbs}){
  return (
    <div>
      <SectionHeader icon="🔌" title="Network & Load Balancers" sub="VCN topology · Subnets · Security Lists · Load Balancers"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        {network.map(n=>(
          <GlowCard key={n.id} color={C.blue}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:15,marginBottom:3}}>{n.name}</div>
                <div style={{fontFamily:"monospace",fontSize:11,color:C.cyan}}>{n.cidr}</div>
              </div>
              <Badge text={n.status} color={statusColor(n.status)}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
              {[["Subnets",n.subnets,C.blue],["Route Tables",n.routeTables,C.teal],["Security Lists",n.securityLists,C.orange]].map(([l,v,c])=>(
                <div key={l} style={{background:C.bg,borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{fontFamily:"monospace",fontSize:18,fontWeight:700,color:c}}>{v}</div>
                  <div style={{fontSize:9,color:C.muted,marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <span style={{fontSize:11,color:C.muted}}>📍 {n.region}</span>
              {n.igw&&<Badge text="Internet GW" color={C.green}/>}
              {n.natGw&&<Badge text="NAT GW" color={C.cyan}/>}
            </div>
          </GlowCard>
        ))}
      </div>

      <GlowCard color={C.teal}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15}}>⚖️ Load Balancers (Live Traffic)</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:14}}>
          {lbs.map(l=>(
            <div key={l.id} style={{background:C.card2,borderRadius:12,padding:16,border:`1px solid ${C.teal}33`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                <div>
                  <div style={{fontWeight:700,fontSize:14,marginBottom:3}}>{l.name}</div>
                  <div style={{fontSize:11,color:C.muted}}>{l.type} · {l.shape}</div>
                </div>
                <Badge text={l.status} color={statusColor(l.status)}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                {[["RPS",l.rps.toLocaleString(),C.teal],["Bandwidth",l.bw+" Mbps",C.cyan],["Backends",`${l.healthyBackends}/${l.backends}`,l.healthyBackends<l.backends?C.warning:C.green]].map(([label,val,color])=>(
                  <div key={label} style={{background:C.bg,borderRadius:8,padding:"9px 6px",textAlign:"center"}}>
                    <div style={{fontFamily:"monospace",fontSize:14,fontWeight:700,color,transition:"color .3s"}}>{val}</div>
                    <div style={{fontSize:9,color:C.muted,marginTop:2}}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",fontSize:11,color:C.muted}}>
                <span>🌐 {l.ip}</span>
                <span>· {l.protocol}:{l.port}</span>
                <span>· {l.region}</span>
              </div>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

// ── KUBERNETES TAB ────────────────────────────────────────────
function KubernetesTab({clusters,user,handleOp}){
  return (
    <div>
      <SectionHeader icon="☸️" title="Oracle Kubernetes Engine (OKE)" sub={`${clusters.length} clusters · ${clusters.reduce((a,k)=>a+k.nodes,0)} total nodes · Live pod metrics`}/>
      {clusters.map(k=>(
        <GlowCard key={k.id} color={C.purple} style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:18,marginBottom:4}}>{k.name}</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <Badge text={k.status} color={statusColor(k.status)} dot/>
                <Badge text={k.version} color={C.cyan}/>
                <Badge text={k.region} color={C.blue}/>
              </div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10,marginBottom:16}}>
            {[["Nodes",`${k.readyNodes}/${k.nodes}`,k.readyNodes<k.nodes?C.warning:C.green],["Pods",k.pods,C.cyan],["Namespaces",k.namespaces,C.purple],["CPU Req",k.cpuReq+"%",k.cpuReq>80?C.danger:k.cpuReq>70?C.warning:C.green],["Mem Req",k.memReq+"%",k.memReq>85?C.danger:k.memReq>75?C.warning:C.green],["Status",k.status,statusColor(k.status)]].map(([l,v,c])=>(
              <div key={l} style={{background:C.bg,borderRadius:10,padding:"12px 8px",textAlign:"center"}}>
                <div style={{fontFamily:"monospace",fontSize:16,fontWeight:700,color:c,transition:"color .3s"}}>{v}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:4}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <MetricBar value={k.cpuReq} label="CPU Request" warn={70} crit={85}/>
            <MetricBar value={k.memReq} label="Memory Request" warn={75} crit={90}/>
          </div>
        </GlowCard>
      ))}
    </div>
  );
}

// ── STORAGE TAB ───────────────────────────────────────────────
function StorageTab({buckets}){
  const totalSize=buckets.reduce((a,b)=>a+b.sizeGB,0);
  const totalObjs=buckets.reduce((a,b)=>a+b.objects,0);
  return (
    <div>
      <SectionHeader icon="🪣" title="Object Storage" sub={`${buckets.length} buckets · ${fmtBytes(totalSize)} total · ${totalObjs.toLocaleString()} objects`}/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
        {[["Total Buckets",buckets.length,C.blue,"🪣"],["Total Size",fmtBytes(totalSize),C.purple,"💾"],["Total Objects",totalObjs.toLocaleString(),C.cyan,"📁"]].map(([l,v,c,i])=>(
          <GlowCard key={l} color={c} style={{padding:"14px 16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontFamily:"monospace",fontSize:24,fontWeight:700,color:c}}>{v}</div>
                <div style={{fontSize:10,color:C.muted,marginTop:5,letterSpacing:1}}>{l.toUpperCase()}</div>
              </div>
              <span style={{fontSize:20,opacity:.5}}>{i}</span>
            </div>
          </GlowCard>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:12}}>
        {buckets.map(b=>(
          <GlowCard key={b.id} color={C.blue}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontFamily:"monospace",fontWeight:700,fontSize:13,marginBottom:3}}>{b.name}</div>
                <div style={{fontSize:10,color:C.muted}}>{b.region}</div>
              </div>
              <Badge text={b.tier} color={b.tier==="Standard"?C.green:b.tier==="Archive"?C.muted:C.blue}/>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
              {[["Size",fmtBytes(b.sizeGB),C.purple],["Objects",b.objects.toLocaleString(),C.cyan],["Access",b.access,b.access==="ReadWrite"?C.green:C.orange]].map(([l,v,c])=>(
                <div key={l} style={{background:C.bg,borderRadius:7,padding:"8px 6px",textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:c,fontFamily:"monospace"}}>{v}</div>
                  <div style={{fontSize:9,color:C.muted,marginTop:3}}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {b.public?<Badge text="PUBLIC" color={C.warning}/>:<Badge text="PRIVATE" color={C.green}/>}
              {b.versioning&&<Badge text="VERSIONING ON" color={C.cyan}/>}
            </div>
          </GlowCard>
        ))}
      </div>
    </div>
  );
}

// ── COST TAB ──────────────────────────────────────────────────
function CostTab(){
  const spent=OCI_COST.monthSpend;
  const budget=OCI_COST.monthBudget;
  const pct=Math.round((spent/budget)*100);
  return (
    <div>
      <SectionHeader icon="💰" title="Cost & Budget" sub="Oracle Cloud monthly spend · ap-mumbai-1 + ap-hyderabad-1"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
        {[["Month Budget","₹"+budget.toLocaleString(),C.blue],["Month Spend","₹"+spent.toLocaleString(),pct>80?C.danger:pct>65?C.warning:C.green],["Last Month","₹"+OCI_COST.lastMonthSpend.toLocaleString(),C.muted],["Forecast","₹"+OCI_COST.forecast.toLocaleString(),C.orange]].map(([l,v,c])=>(
          <GlowCard key={l} color={c} style={{padding:"14px 16px"}}>
            <div style={{fontFamily:"monospace",fontSize:22,fontWeight:700,color:c,marginBottom:5}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,letterSpacing:1}}>{l.toUpperCase()}</div>
          </GlowCard>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:16}}>
        <GlowCard color={C.yellow}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15}}>💳 Spend Breakdown</div>
          {OCI_COST.breakdown.map(b=>(
            <div key={b.service} style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:13}}>
                <span>{b.service}</span>
                <span style={{fontWeight:700,color:C.yellow}}>₹{b.spend.toLocaleString()} ({b.pct}%)</span>
              </div>
              <div style={{height:8,background:C.dim,borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${b.pct}%`,background:G.orange,borderRadius:4}}/>
              </div>
            </div>
          ))}
        </GlowCard>
        <GlowCard color={C.green}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>📊 Budget Utilization</div>
          <div style={{position:"relative",width:140,height:140,margin:"0 auto 20px"}}>
            <svg viewBox="0 0 36 36" style={{width:140,height:140,transform:"rotate(-90deg)"}}>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.dim} strokeWidth="3.5"/>
              <circle cx="18" cy="18" r="15.9" fill="none" stroke={pct>80?C.danger:pct>65?C.warning:C.green} strokeWidth="3.5" strokeDasharray={`${pct} ${100-pct}`} strokeLinecap="round"/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
              <div style={{fontFamily:"monospace",fontSize:22,fontWeight:700,color:pct>80?C.danger:pct>65?C.warning:C.green}}>{pct}%</div>
              <div style={{fontSize:10,color:C.muted}}>used</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[["Spent",`₹${spent.toLocaleString()}`,C.green],["Remaining",`₹${(budget-spent).toLocaleString()}`,C.blue],["vs Last Month",spent<OCI_COST.lastMonthSpend?"↓ Saving":"↑ Over",spent<OCI_COST.lastMonthSpend?C.green:C.danger]].map(([l,v,c])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                <span style={{fontSize:13,color:C.muted}}>{l}</span>
                <span style={{fontSize:13,fontWeight:700,color:c}}>{v}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>
    </div>
  );
}

// ── SECURITY TAB ──────────────────────────────────────────────
function SecurityTab(){
  const policies=[
    {name:"Prod-Admin-Policy",statements:8,scope:"Compartment: Production",status:"Active"},
    {name:"Prod-Read-Policy",statements:5,scope:"Compartment: Production",status:"Active"},
    {name:"DR-Access-Policy",statements:4,scope:"Compartment: DR",status:"Active"},
    {name:"UAT-Dev-Policy",statements:6,scope:"Compartment: UAT",status:"Active"},
  ];
  const compartments=[
    {name:"Production",resources:28,status:"Active"},
    {name:"DR",resources:12,status:"Active"},
    {name:"UAT",resources:10,status:"Active"},
    {name:"Shared-Services",resources:8,status:"Active"},
  ];
  const secEvents=[
    {type:"Login Success",user:"admin@gscoci.in",time:"2 min ago",severity:"INFO"},
    {type:"Policy Updated",user:"ops@gscoci.in",time:"1 hr ago",severity:"WARNING"},
    {type:"New API Key",user:"svc-account@gscoci.in",time:"3 hr ago",severity:"INFO"},
    {type:"Failed Login",user:"unknown",time:"5 hr ago",severity:"CRITICAL"},
  ];
  return (
    <div>
      <SectionHeader icon="🔐" title="Security & IAM" sub="Identity · Policies · Compartments · Audit Events"/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16,marginBottom:16}}>
        <GlowCard color={C.blue}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>🏢 Compartments</div>
          {compartments.map(c=>(
            <div key={c.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${C.border}`}}>
              <div>
                <div style={{fontWeight:700,fontSize:13}}>{c.name}</div>
                <div style={{fontSize:11,color:C.muted}}>{c.resources} resources</div>
              </div>
              <Badge text={c.status} color={C.green}/>
            </div>
          ))}
        </GlowCard>
        <GlowCard color={C.purple}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>📜 IAM Policies</div>
          {policies.map(p=>(
            <div key={p.name} style={{background:C.card2,borderRadius:10,padding:"10px 12px",marginBottom:8}}>
              <div style={{fontWeight:700,fontSize:12,marginBottom:3}}>{p.name}</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{p.scope}</div>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <span style={{fontSize:11,color:C.cyan}}>{p.statements} statements</span>
                <Badge text={p.status} color={C.green}/>
              </div>
            </div>
          ))}
        </GlowCard>
        <GlowCard color={C.orange}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:15}}>🔍 Security Events</div>
          {secEvents.map((e,i)=>(
            <div key={i} style={{padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontWeight:700,fontSize:12}}>{e.type}</span>
                <Badge text={e.severity} color={e.severity==="CRITICAL"?C.danger:e.severity==="WARNING"?C.warning:C.blue}/>
              </div>
              <div style={{fontSize:11,color:C.muted}}>{e.user} · {e.time}</div>
            </div>
          ))}
        </GlowCard>
      </div>
    </div>
  );
}

// ── OPERATIONS TAB ────────────────────────────────────────────
function OperationsTab({wlsServers,compute,user,approvalList,handleOp,termLines,setTermLines}){
  const [form,setForm]=useState({resourceType:"wls",server:"",operation:"RESTART"});
  const allResources=[...wlsServers.map(s=>({...s,type:"wls",label:`[WLS] ${s.name}`})),...compute.map(c=>({...c,type:"compute",label:`[Compute] ${c.name}`}))];

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>⚙️ Operations Center</h2>
      <p style={{color:C.muted,marginBottom:20,fontSize:12}}>{user.role==="admin"?"Admin — direct execution":"Operations require Change Approver sign-off"}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <GlowCard color={C.blue}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:16,fontSize:15}}>Submit Operation</div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Target Resource</div>
            <Sel value={form.server} onChange={e=>{const res=allResources.find(r=>r.name===e.target.value);setForm(f=>({...f,server:e.target.value,resourceType:res?.type||"wls"}));}}>
              <option value="">Select resource…</option>
              <optgroup label="WebLogic Servers">{wlsServers.map(s=><option key={s.id} value={s.name}>{s.name} [{s.status}]</option>)}</optgroup>
              <optgroup label="Compute Instances">{compute.map(c=><option key={c.id} value={c.name}>{c.name} [{c.status}]</option>)}</optgroup>
            </Sel>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1}}>Operation</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
              {[["RESTART","🔄",C.blue],["STOP","⏹️",C.danger],["START","▶️",C.green],["HEAPDUMP","💾",C.purple],["THREADDUMP","📋",C.teal],["PATCH","🔧",C.orange]].map(([op,icon,color])=>(
                <button key={op} onClick={()=>setForm(f=>({...f,operation:op}))} style={{padding:"10px 6px",background:form.operation===op?`${color}22`:C.card2,border:`1px solid ${form.operation===op?color:C.border}`,borderRadius:10,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:20,marginBottom:3}}>{icon}</div>
                  <div style={{fontSize:10,fontWeight:700,color:form.operation===op?color:C.muted}}>{op}</div>
                </button>
              ))}
            </div>
          </div>
          {!user.role==="admin"&&<div style={{background:`${C.blue}12`,border:`1px solid ${C.blue}30`,borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:C.blue}}>ℹ Request goes to Change Approvers before execution.</div>}
          <Btn grad={user.role==="admin"?G.green:G.orange} color={user.role==="admin"?C.green:C.orange} onClick={()=>{if(!form.server)return;const res=allResources.find(r=>r.name===form.server);if(res)handleOp(res,form.operation,res.type);}} disabled={!form.server} style={{width:"100%",padding:12}}>
            {user.role==="admin"?"⚡ Execute (with confirmation)":"📤 Submit for Approval"}
          </Btn>
        </GlowCard>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <GlowCard color={C.green}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14,display:"flex",justifyContent:"space-between"}}>
              <span>🖥️ Console</span>
              <button onClick={()=>setTermLines(["[INFO] Cleared."])} style={{background:"none",border:`1px solid ${C.border}`,borderRadius:5,color:C.muted,cursor:"pointer",fontSize:10,padding:"2px 7px"}}>Clear</button>
            </div>
            <Terminal lines={termLines} height={240}/>
          </GlowCard>
          <GlowCard color={C.warning}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>⏳ Pending Approvals</div>
            {(approvalList||[]).filter(a=>a.status==="PENDING").length===0
              ?<div style={{color:C.muted,fontSize:12}}>None pending.</div>
              :(approvalList||[]).filter(a=>a.status==="PENDING").map(a=>(
                <div key={a.id} style={{background:C.card2,borderRadius:9,padding:"9px 12px",marginBottom:7,borderLeft:`3px solid ${C.warning}`}}>
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

// ── APPROVALS TAB ─────────────────────────────────────────────
function ApprovalsTab({approvalList,user,wlsServers,executeOp,setTermLines}){
  const [localTerm,setLocalTerm]=useState(["[INFO] Approval console ready..."]);
  const canApprove=user.role==="admin"||user.role==="approver";

  const approve=(item)=>{
    update(ref(db,`approvals/${item.id}`),{status:"APPROVED",approvedBy:user.name,approvedAt:now()});
    push(ref(db,"auditLogs"),{action:`APPROVED: ${item.operation} on ${item.target}`,user:user.name,time:now()});
    setLocalTerm(prev=>[...prev,`[OK] APPROVED by ${user.name}`,`[INFO] Executing ${item.operation} on ${item.target}...`]);
    if(item.resourceType==="wls"){const s=wlsServers.find(s=>s.name===item.target);if(s)executeOp(s.id,item.operation,"wls");}
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
      <p style={{color:C.muted,marginBottom:20,fontSize:12}}>Review and authorize server operations · All approvals are logged</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:18}}>
        <div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:12,fontSize:14,color:C.warning}}>⏳ Pending ({pending.length})</div>
          {pending.length===0&&<GlowCard color={C.green} style={{textAlign:"center",padding:24,marginBottom:14}}><div style={{color:C.muted,fontSize:13}}>✅ No pending approvals</div></GlowCard>}
          {pending.map(a=>(
            <GlowCard key={a.id} color={C.warning} style={{marginBottom:12}}>
              <div style={{marginBottom:12}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
                  <span style={{fontFamily:"monospace",fontWeight:800,fontSize:18,color:C.warning}}>{a.operation}</span>
                  <Badge text={a.target} color={C.blue}/>
                  <Badge text={a.priority||"Normal"} color={a.priority==="Emergency"?C.danger:a.priority==="High"?C.warning:C.blue}/>
                  <Badge text={a.resourceType?.toUpperCase()||"WLS"} color={C.muted}/>
                </div>
                <p style={{color:C.muted,fontSize:13,margin:"0 0 6px",lineHeight:1.5}}>{a.reason}</p>
                {a.ticket&&<div style={{fontSize:11,color:C.cyan}}>🎫 {a.ticket}</div>}
                <div style={{fontSize:11,color:C.muted,marginTop:5}}>By <strong style={{color:C.text}}>{a.requestedBy}</strong> · {a.time}</div>
              </div>
              {canApprove&&<div style={{display:"flex",gap:10}}>
                <Btn grad={G.green} color={C.green} onClick={()=>approve(a)} style={{flex:1}}>✅ Approve & Execute</Btn>
                <Btn color={C.danger} onClick={()=>reject(a)} style={{flex:1}}>❌ Reject</Btn>
              </div>}
            </GlowCard>
          ))}
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14,color:C.muted,marginTop:18}}>📜 History</div>
          {history.map(a=>(
            <div key={a.id} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",marginBottom:7,borderLeft:`3px solid ${a.status==="APPROVED"?C.green:C.danger}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:12,fontFamily:"monospace"}}>{a.operation} → {a.target}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>{a.requestedBy} · {a.time}</div>
                </div>
                <Badge text={a.status} color={a.status==="APPROVED"?C.green:C.danger}/>
              </div>
            </div>
          ))}
        </div>
        <GlowCard color={C.green} style={{height:"fit-content",position:"sticky",top:80}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>🖥️ Execution Console</div>
          <Terminal lines={localTerm} height={360}/>
        </GlowCard>
      </div>
    </div>
  );
}

// ── ISSUES TAB ────────────────────────────────────────────────
function IssuesTab({issues,setIssues,servers}){
  const [termLines,setTermLines]=useState(["[INFO] Troubleshoot engine ready...","[INFO] Click an issue to analyze."]);
  const [filter,setFilter]=useState("ACTIVE");

  const troubleshoot=(issue)=>{
    const steps={
      "Memory Leak":["[INFO] Connecting to JMX...","[INFO] Reading heap histogram...","[WARN] Large retention: com.oracle.weblogic.Session (2.4GB)","[INFO] Triggering System.gc()...","[OK] GC freed 800MB","[INFO] Capturing heap dump...","[SUCCESS] Recommendation: Increase -Xmx4g, review session timeout"],
      "Thread Starvation":["[INFO] Dumping thread stacks...","[WARN] 45 threads BLOCKED","[INFO] Lock contention: TransactionManager","[INFO] Killing stuck threads...","[OK] Thread pool freed","[SUCCESS] Fix: Increase DB pool, add timeout"],
      "High CPU":["[INFO] Profiling hot methods...","[WARN] XMLParser.parse() = 62% CPU","[SUCCESS] Fix: Cache XML, upgrade parser lib"],
      "GC Overhead":["[INFO] Parsing GC logs...","[WARN] GC every 50ms","[SUCCESS] Fix: Switch to G1GC, increase -Xms"],
    };
    const s=steps[issue.type]||["[INFO] Running diagnostics...","[SUCCESS] Analysis complete"];
    setTermLines(["[INFO] Analyzing: "+issue.type+" on "+issue.server,"[INFO] ──────────────────"]);
    s.forEach((l,i)=>setTimeout(()=>setTermLines(prev=>[...prev,l]),i*700));
  };

  const filtered=filter==="ALL"?issues:filter==="ACTIVE"?issues.filter(i=>i.status!=="RESOLVED"):issues.filter(i=>i.severity===filter);

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>🔥 Issues & Troubleshooting</h2>
      <p style={{color:C.muted,marginBottom:16,fontSize:12}}>Auto-detected · Click any issue to run AI-assisted analysis</p>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {["ACTIVE","ALL","CRITICAL","WARNING"].map(f=><button key={f} onClick={()=>setFilter(f)} style={{padding:"5px 14px",borderRadius:20,border:`1px solid ${filter===f?C.red:C.border}`,background:filter===f?`${C.red}20`:"transparent",color:filter===f?C.red:C.muted,fontSize:12,cursor:"pointer",fontWeight:700}}>{f}</button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(i=>(
            <GlowCard key={i.id} color={i.severity==="CRITICAL"?C.danger:C.warning} onClick={()=>troubleshoot(i)} style={{cursor:"pointer"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div>
                  <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"monospace",fontWeight:700,fontSize:12,color:i.severity==="CRITICAL"?C.danger:C.warning}}>{i.server}</span>
                    <Badge text={i.severity} color={i.severity==="CRITICAL"?C.danger:C.warning}/>
                    <Badge text={i.type} color={C.blue}/>
                  </div>
                  <p style={{color:C.muted,fontSize:12,margin:0,lineHeight:1.5}}>{i.description}</p>
                </div>
                <div style={{display:"flex",gap:5,alignItems:"center",flexShrink:0}}>
                  {i.status==="HEALING"&&<span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:14}}>🔄</span>}
                  <Badge text={i.status} color={i.status==="RESOLVED"?C.green:i.status==="HEALING"?C.cyan:C.warning}/>
                </div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:10,color:C.muted}}>🕐 {i.detected}</span>
                  {i.autoHeal&&<Badge text="AUTO-HEAL" color={C.cyan}/>}
                </div>
                {i.status!=="RESOLVED"&&<button onClick={e=>{e.stopPropagation();setIssues(prev=>prev.map(x=>x.id===i.id?{...x,status:"RESOLVED"}:x));}} style={{padding:"3px 10px",background:`${C.green}15`,border:`1px solid ${C.green}33`,borderRadius:7,color:C.green,fontSize:10,cursor:"pointer",fontWeight:700}}>✓ Resolve</button>}
              </div>
            </GlowCard>
          ))}
          {filtered.length===0&&<GlowCard color={C.green} style={{textAlign:"center",padding:28}}><div style={{color:C.muted}}>✅ No issues found</div></GlowCard>}
        </div>
        <GlowCard color={C.green} style={{height:"fit-content",position:"sticky",top:80}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:10,fontSize:14}}>🔍 Analysis Console</div>
          <Terminal lines={termLines} height={400}/>
        </GlowCard>
      </div>
    </div>
  );
}

// ── AUTO-HEAL TAB ─────────────────────────────────────────────
function AutoHealTab({issues,user}){
  const [policies,setPolicies]=useState([
    {id:1,name:"JVM Heap Critical",trigger:"JVM Heap > 95%",action:"Force GC + Heap Dump",enabled:true,executions:12,lastRun:"2 min ago",server:"ALL PROD"},
    {id:2,name:"Thread Starvation",trigger:"Threads > 90%",action:"Kill stuck threads",enabled:true,executions:3,lastRun:"15 min ago",server:"ALL"},
    {id:3,name:"Memory Leak",trigger:"Memory growth > 5%/hr",action:"Heap dump + Restart",enabled:true,executions:1,lastRun:"1 hr ago",server:"PROD"},
    {id:4,name:"CPU Spike Protection",trigger:"CPU > 90% for 5min",action:"Thread dump + Alert",enabled:false,executions:0,lastRun:"Never",server:"ALL"},
    {id:5,name:"GC Overhead",trigger:"GC time > 100ms",action:"Tune GC params",enabled:true,executions:7,lastRun:"30 min ago",server:"PROD"},
    {id:6,name:"Datasource Recovery",trigger:"DS failures > 5",action:"Reconnect pool",enabled:true,executions:2,lastRun:"3 hr ago",server:"ALL"},
    {id:7,name:"Compute High CPU",trigger:"Compute CPU > 90%",action:"Scale out + Alert",enabled:true,executions:0,lastRun:"Never",server:"OCI Compute"},
    {id:8,name:"DB Connection Leak",trigger:"Connections > 90%",action:"Kill idle connections",enabled:true,executions:4,lastRun:"6 hr ago",server:"ALL DB"},
  ]);
  const toggle=(id)=>setPolicies(prev=>prev.map(p=>p.id===id?{...p,enabled:!p.enabled}:p));
  const healing=issues.filter(i=>i.status==="HEALING");

  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>🔄 Auto-Healing Engine</h2>
      <p style={{color:C.muted,marginBottom:16,fontSize:12}}>Automated remediation for OCI + WebLogic infrastructure</p>
      {healing.length>0&&(
        <GlowCard color={C.cyan} style={{marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:14}}>
            <span style={{animation:"spin 1s linear infinite",display:"inline-block",fontSize:18}}>🔄</span>Auto-Healing In Progress
          </div>
          {healing.map(i=>(
            <div key={i.id} style={{background:C.card2,borderRadius:10,padding:"11px 14px",marginBottom:7,border:`1px solid ${C.cyan}33`}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                <span style={{fontWeight:700,color:C.cyan,fontFamily:"monospace",fontSize:12}}>{i.server} — {i.type}</span>
                <Badge text="HEALING" color={C.cyan}/>
              </div>
              <div style={{height:5,background:C.dim,borderRadius:3,overflow:"hidden"}}>
                <div style={{height:"100%",width:"65%",background:G.teal,borderRadius:3}}/>
              </div>
              <div style={{fontSize:10,color:C.muted,marginTop:5}}>Analyzing → Applying fix → Verifying...</div>
            </div>
          ))}
        </GlowCard>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[["Active",policies.filter(p=>p.enabled).length,C.green],["Executions",policies.reduce((a,p)=>a+p.executions,0),C.blue],["Healing",healing.length,C.cyan],["Resolved",issues.filter(i=>i.status==="RESOLVED").length,C.green]].map(([l,v,c])=>(
          <GlowCard key={l} color={c} style={{padding:"12px 14px"}}>
            <div style={{fontFamily:"monospace",fontSize:24,fontWeight:700,color:c}}>{v}</div>
            <div style={{fontSize:10,color:C.muted,marginTop:4,letterSpacing:1}}>{l.toUpperCase()}</div>
          </GlowCard>
        ))}
      </div>
      <GlowCard color={C.purple}>
        <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:14,fontSize:14}}>🤖 Healing Policies ({policies.length})</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {policies.map(p=>(
            <div key={p.id} style={{background:C.card2,borderRadius:11,padding:"12px 14px",border:`1px solid ${p.enabled?C.purple+"44":C.border}`,display:"flex",gap:10,alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:13}}>{p.name}</span>
                  <Badge text={p.server} color={C.blue}/>
                  {p.enabled&&<Badge text="ON" color={C.green} dot/>}
                </div>
                <div style={{fontSize:11,color:C.warning,marginBottom:2}}>⚡ {p.trigger}</div>
                <div style={{fontSize:11,color:C.cyan,marginBottom:4}}>🔧 {p.action}</div>
                <div style={{fontSize:10,color:C.muted}}>{p.executions} runs · {p.lastRun}</div>
              </div>
              {(user.role==="admin"||user.role==="operator")&&(
                <div onClick={()=>toggle(p.id)} style={{width:40,height:22,borderRadius:11,background:p.enabled?C.green:C.dim,cursor:"pointer",position:"relative",transition:"all .3s",flexShrink:0}}>
                  <div style={{position:"absolute",top:2,left:p.enabled?20:2,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .3s"}}/>
                </div>
              )}
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}

// ── AUDIT LOG ─────────────────────────────────────────────────
function AuditTab({auditList}){
  return (
    <div>
      <h2 style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,marginBottom:4}}>📋 Audit Log</h2>
      <p style={{color:C.muted,marginBottom:20,fontSize:12}}>Immutable record of all operations · {auditList.length} entries</p>
      {auditList.length===0
        ?<GlowCard color={C.blue} style={{textAlign:"center",padding:48}}><div style={{color:C.muted}}>No records yet. Operations will appear here.</div></GlowCard>
        :<div style={{display:"flex",flexDirection:"column",gap:7}}>
          {[...auditList].reverse().map((a,i)=>(
            <GlowCard key={a.id} color={a.action.includes("APPROVED")?C.green:a.action.includes("REJECTED")?C.danger:C.blue} style={{padding:"11px 16px"}}>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:a.action.includes("APPROVED")?`${C.green}20`:a.action.includes("REJECTED")?`${C.danger}20`:`${C.blue}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>
                  {a.action.includes("APPROVED")?"✅":a.action.includes("REJECTED")?"❌":"⚡"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:12,fontFamily:"monospace"}}>{a.action}</div>
                  <div style={{color:C.muted,fontSize:10,marginTop:2}}>by {a.user} · {a.time}</div>
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
