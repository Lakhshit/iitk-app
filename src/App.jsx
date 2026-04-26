import { useState, useEffect, useRef } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const NAV_LINKS = ["About", "Skills", "Experience", "Portfolio", "Contact"];

const SKILL_CATEGORIES = [
  {
    icon: "🐳",
    label: "Containers & Orchestration",
    color: "#2196f3",
    skills: ["Docker", "Kubernetes (K8s)", "OKE (Oracle Kubernetes Engine)", "Helm", "Istio Service Mesh", "OpenShift", "Container Registry"],
  },
  {
    icon: "☁️",
    label: "Cloud Platforms",
    color: "#00bcd4",
    skills: ["Oracle Cloud Infrastructure (OCI)", "AWS", "Azure", "Multi-Cloud Architecture", "Cloud Migration", "IaaS / PaaS / SaaS"],
  },
  {
    icon: "⚙️",
    label: "Middleware & Integration",
    color: "#ff9800",
    skills: ["Middleware Architecture", "Integration Platform (iPaaS)", "API Gateway", "SOA / Microservices", "Message Queuing", "Enterprise Service Bus"],
  },
  {
    icon: "🔄",
    label: "DevOps & CI/CD",
    color: "#4caf50",
    skills: ["CI/CD Pipelines", "GitOps", "Terraform / IaC", "Ansible", "Jenkins / GitHub Actions", "Monitoring & Observability"],
  },
  {
    icon: "🗄️",
    label: "Databases & Data",
    color: "#9c27b0",
    skills: ["Autonomous Database", "PostgreSQL / MySQL", "NoSQL", "Data Migration", "Database Performance Tuning", "Cloud Storage"],
  },
  {
    icon: "🏗️",
    label: "Architecture & Leadership",
    color: "#f44336",
    skills: ["Solution Architecture", "Enterprise Architecture", "Technical Pre-Sales", "RFP / RFI Responses", "Program Management", "Stakeholder Engagement"],
  },
];

const EXPERIENCES = [
  {
    period: "2018 – Present",
    role: "Principal Cloud Architect & Technical Lead",
    company: "Enterprise Technology Consulting",
    highlights: [
      "Architected multi-cloud solutions spanning OCI, AWS, and Azure for Fortune 500 clients",
      "Led Kubernetes & container adoption programs — migrating legacy workloads to OKE and OpenShift",
      "Delivered pre-sales engagements across 15+ countries, winning deals worth $50M+",
      "Established DevOps culture and CI/CD practices for global delivery teams",
    ],
  },
  {
    period: "2012 – 2018",
    role: "Senior Middleware Architect",
    company: "Global Systems Integration",
    highlights: [
      "Designed and implemented enterprise integration platforms serving millions of daily transactions",
      "Led migration of monolithic systems to microservices architecture using Docker and Kubernetes",
      "Built cloud-native PaaS solutions enabling rapid application development",
      "Managed cross-functional teams of 20+ engineers across multiple time zones",
    ],
  },
  {
    period: "2006 – 2012",
    role: "Technical Consultant & Solutions Engineer",
    company: "IT Services & Consulting",
    highlights: [
      "Delivered end-to-end middleware implementations for banking, retail, and government sectors",
      "Specialised in high-availability architectures and disaster recovery planning",
      "Conducted technical workshops and knowledge transfer for client engineering teams",
      "Developed automated deployment frameworks reducing deployment time by 60%",
    ],
  },
];

const PORTFOLIO = [
  {
    tag: "Kubernetes · OKE",
    color: "#2196f3",
    title: "Enterprise Container Platform",
    desc: "Designed and delivered a production-grade Kubernetes platform on OKE for a financial services client — zero-downtime deployments, auto-scaling, and Istio service mesh for 50+ microservices.",
  },
  {
    tag: "Multi-Cloud · IaC",
    color: "#00bcd4",
    title: "Multi-Cloud Migration Program",
    desc: "Led a $12M cloud migration from on-premises datacentres to OCI & AWS. Terraform-based infrastructure-as-code, blue-green deployments, and automated compliance checks.",
  },
  {
    tag: "DevOps · CI/CD",
    color: "#4caf50",
    title: "DevOps Transformation",
    desc: "Built enterprise DevOps practice from scratch — GitOps with ArgoCD, automated testing pipelines, and observability stack (Prometheus, Grafana, ELK). Reduced release cycles from monthly to daily.",
  },
  {
    tag: "Integration · API",
    color: "#ff9800",
    title: "iPaaS Integration Hub",
    desc: "Architected a cloud-native integration platform connecting 30+ enterprise systems — REST & SOAP APIs, event-driven architecture, and real-time data synchronisation at scale.",
  },
  {
    tag: "Pre-Sales · Architecture",
    color: "#9c27b0",
    title: "Global Pre-Sales Delivery",
    desc: "Technical lead for RFP responses and proof-of-concepts across EMEA and APAC — solution demos, architectural blueprints, and executive presentations for deals ranging $1M–$20M.",
  },
  {
    tag: "Docker · Microservices",
    color: "#f44336",
    title: "Microservices Modernisation",
    desc: "Decomposed a 15-year-old monolith into 40+ containerised microservices using Docker and Kubernetes — improving scalability 10× and reducing infrastructure cost by 35%.",
  },
];

const STATS = [
  { value: "18+", label: "Years Experience" },
  { value: "50+", label: "Projects Delivered" },
  { value: "15+", label: "Countries" },
  { value: "$50M+", label: "Deals Won" },
];

// ─── HOOKS ───────────────────────────────────────────────────────────────────

function useScrollSpy() {
  const [active, setActive] = useState("About");
  useEffect(() => {
    const handler = () => {
      const sections = NAV_LINKS.map((n) => document.getElementById(n));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = sections[i];
        if (el && el.getBoundingClientRect().top <= 120) {
          setActive(NAV_LINKS[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return active;
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Nav({ active }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setOpen(false);
  };

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 999,
      background: scrolled ? "rgba(10,12,20,0.96)" : "transparent",
      backdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
      transition: "all 0.4s ease",
      padding: "0 5vw",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 68,
    }}>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18, color: "#fff", letterSpacing: "-0.5px", cursor: "pointer" }}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
        <span style={{ color: "#64b5f6" }}>L</span>akhshit
      </div>

      {/* Desktop */}
      <div style={{ display: "flex", gap: 8 }} className="desk-nav">
        {NAV_LINKS.map((n) => (
          <button key={n} onClick={() => scrollTo(n)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "8px 16px", borderRadius: 8,
            color: active === n ? "#64b5f6" : "rgba(255,255,255,0.6)",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: active === n ? 600 : 400,
            fontSize: 14,
            transition: "color 0.2s",
          }}>{n}</button>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button onClick={() => setOpen(!open)} style={{
        display: "none", background: "none", border: "none", cursor: "pointer",
        color: "#fff", fontSize: 22,
      }} className="mob-menu">☰</button>

      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 998,
          background: "rgba(10,12,20,0.98)",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24,
        }}>
          <button onClick={() => setOpen(false)} style={{
            position: "absolute", top: 24, right: 24,
            background: "none", border: "none", color: "#fff", fontSize: 28, cursor: "pointer",
          }}>✕</button>
          {NAV_LINKS.map((n) => (
            <button key={n} onClick={() => scrollTo(n)} style={{
              background: "none", border: "none", cursor: "pointer",
              color: active === n ? "#64b5f6" : "#fff",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600, fontSize: 28,
            }}>{n}</button>
          ))}
        </div>
      )}
    </nav>
  );
}

function Hero() {
  const words = ["Cloud Architect", "DevOps Leader", "Kubernetes Expert", "Pre-Sales Specialist", "Solution Designer"];
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => { setIdx((i) => (i + 1) % words.length); setFade(true); }, 400);
    }, 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="About" style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      padding: "120px 5vw 80px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Animated bg blobs */}
      <div style={{
        position: "absolute", width: 600, height: 600,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(33,150,243,0.12) 0%, transparent 70%)",
        top: -100, right: -100, pointerEvents: "none",
        animation: "pulse 6s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 400, height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,188,212,0.08) 0%, transparent 70%)",
        bottom: 50, left: -100, pointerEvents: "none",
        animation: "pulse 8s ease-in-out infinite 2s",
      }} />

      <div style={{ maxWidth: 800, position: "relative" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(33,150,243,0.1)", border: "1px solid rgba(33,150,243,0.3)",
          borderRadius: 100, padding: "6px 16px", marginBottom: 24,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4caf50", boxShadow: "0 0 8px #4caf50", display: "inline-block" }} />
          <span style={{ color: "#64b5f6", fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500 }}>
            Available for new engagements
          </span>
        </div>

        <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: "clamp(42px, 7vw, 80px)",
          fontWeight: 800, lineHeight: 1.05,
          color: "#fff", marginBottom: 16, letterSpacing: "-2px",
        }}>
          Lakhshit<br />
          <span style={{ color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.25)" }}>Anand</span>
        </h1>

        <div style={{ height: 52, display: "flex", alignItems: "center", marginBottom: 28 }}>
          <span style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "clamp(20px, 3vw, 30px)",
            fontWeight: 600,
            color: "#64b5f6",
            opacity: fade ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}>{words[idx]}</span>
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "clamp(15px, 1.8vw, 18px)",
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.8, maxWidth: 640, marginBottom: 48,
        }}>
          18+ years architecting enterprise cloud solutions — from Kubernetes-native platforms
          to multi-cloud migrations. I bridge deep technical expertise with strategic pre-sales
          and delivery leadership across global organisations.
        </p>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <button onClick={() => document.getElementById("Portfolio")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              background: "linear-gradient(135deg, #1976d2, #0288d1)",
              border: "none", borderRadius: 12, padding: "14px 32px",
              color: "#fff", fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600, fontSize: 15, cursor: "pointer",
              boxShadow: "0 8px 32px rgba(33,150,243,0.3)",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(33,150,243,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(33,150,243,0.3)"; }}>
            View Portfolio →
          </button>
          <button onClick={() => document.getElementById("Contact")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.2)", borderRadius: 12,
              padding: "14px 32px",
              color: "#fff", fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600, fontSize: 15, cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(33,150,243,0.6)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; }}>
            Get in Touch
          </button>
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex", gap: 40, flexWrap: "wrap", marginTop: 64,
          paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          {STATS.map((s) => (
            <div key={s.label}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 28, color: "#64b5f6" }}>{s.value}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Skills() {
  const [ref, inView] = useInView();
  return (
    <section id="Skills" ref={ref} style={{ padding: "100px 5vw" }}>
      <SectionLabel>Expertise</SectionLabel>
      <h2 style={h2Style}>Technical Skills</h2>
      <p style={bodyStyle}>Cloud-native technologies, container platforms, and enterprise integration — built over 18 years of hands-on delivery.</p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: 20, marginTop: 48,
      }}>
        {SKILL_CATEGORIES.map((cat, i) => (
          <div key={cat.label} style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: 28,
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateY(20px)",
            transition: `opacity 0.5s ${i * 0.07}s, transform 0.5s ${i * 0.07}s`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 24 }}>{cat.icon}</span>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                fontSize: 14, color: cat.color,
              }}>{cat.label}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {cat.skills.map((sk) => (
                <span key={sk} style={{
                  background: `${cat.color}14`,
                  border: `1px solid ${cat.color}33`,
                  borderRadius: 6, padding: "4px 10px",
                  fontSize: 12, color: "rgba(255,255,255,0.75)",
                  fontFamily: "'DM Sans', sans-serif",
                }}>{sk}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Experience() {
  const [ref, inView] = useInView();
  return (
    <section id="Experience" ref={ref} style={{ padding: "100px 5vw", background: "rgba(255,255,255,0.015)" }}>
      <SectionLabel>Career</SectionLabel>
      <h2 style={h2Style}>Experience</h2>
      <p style={bodyStyle}>18+ years of progressive experience — from hands-on implementation to enterprise architecture and global pre-sales leadership.</p>

      <div style={{ marginTop: 56, position: "relative", maxWidth: 800 }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: 1, background: "rgba(255,255,255,0.08)",
        }} />
        {EXPERIENCES.map((exp, i) => (
          <div key={exp.role} style={{
            paddingLeft: 40, marginBottom: 56,
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateX(-20px)",
            transition: `opacity 0.5s ${i * 0.15}s, transform 0.5s ${i * 0.15}s`,
            position: "relative",
          }}>
            <div style={{
              position: "absolute", left: -5, top: 4,
              width: 10, height: 10, borderRadius: "50%",
              background: "#64b5f6",
              boxShadow: "0 0 0 3px rgba(100,181,246,0.2)",
            }} />
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 12, color: "#64b5f6", fontWeight: 500,
              marginBottom: 8, textTransform: "uppercase", letterSpacing: 1,
            }}>{exp.period}</div>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
              fontSize: 20, color: "#fff", marginBottom: 4,
            }}>{exp.role}</div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              color: "rgba(255,255,255,0.4)", marginBottom: 16,
            }}>{exp.company}</div>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
              {exp.highlights.map((h) => (
                <li key={h} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6,
                }}>
                  <span style={{ color: "#4caf50", marginTop: 2, flexShrink: 0 }}>▸</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function Portfolio() {
  const [ref, inView] = useInView();
  return (
    <section id="Portfolio" ref={ref} style={{ padding: "100px 5vw" }}>
      <SectionLabel>Work</SectionLabel>
      <h2 style={h2Style}>Selected Projects</h2>
      <p style={bodyStyle}>A sample of high-impact engagements — enterprise cloud, container platforms, and pre-sales leadership.</p>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: 20, marginTop: 48,
      }}>
        {PORTFOLIO.map((p, i) => (
          <div key={p.title} style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 16, padding: 28,
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateY(20px)",
            transition: `opacity 0.5s ${i * 0.08}s, transform 0.5s ${i * 0.08}s`,
            cursor: "default",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${p.color}44`; e.currentTarget.style.background = `${p.color}08`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}>
            <div style={{
              display: "inline-block",
              background: `${p.color}18`, border: `1px solid ${p.color}44`,
              borderRadius: 6, padding: "4px 10px",
              fontSize: 11, color: p.color,
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
              marginBottom: 16, letterSpacing: 0.5,
            }}>{p.tag}</div>
            <div style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 700,
              fontSize: 18, color: "#fff", marginBottom: 10,
            }}>{p.title}</div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              color: "rgba(255,255,255,0.5)", lineHeight: 1.7,
            }}>{p.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Contact() {
  const [ref, inView] = useInView();
  const [copied, setCopied] = useState(false);
  const email = "lakhshit@example.com";

  const copy = () => {
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section id="Contact" ref={ref} style={{ padding: "100px 5vw 80px" }}>
      <SectionLabel>Connect</SectionLabel>
      <h2 style={h2Style}>Let's Work Together</h2>
      <p style={{ ...bodyStyle, maxWidth: 560 }}>
        Available for architecture consulting, pre-sales support, cloud transformation programs,
        and technical leadership engagements worldwide.
      </p>

      <div style={{
        display: "flex", gap: 16, flexWrap: "wrap", marginTop: 40,
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateY(20px)",
        transition: "opacity 0.6s 0.1s, transform 0.6s 0.1s",
      }}>
        <button onClick={copy} style={{
          background: "linear-gradient(135deg, #1976d2, #0288d1)",
          border: "none", borderRadius: 12, padding: "14px 32px",
          color: "#fff", fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600, fontSize: 15, cursor: "pointer",
          boxShadow: "0 8px 32px rgba(33,150,243,0.25)",
          transition: "transform 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
        onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}>
          {copied ? "✓ Copied!" : "📋 Copy Email"}
        </button>

        <a href="https://www.linkedin.com/in/lakhshit/" target="_blank" rel="noreferrer" style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12, padding: "14px 28px",
          color: "#fff", fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 600, fontSize: 15, textDecoration: "none",
          transition: "border-color 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "#0a66c2"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}>
          🔗 LinkedIn
        </a>
      </div>

      <div style={{
        marginTop: 80, paddingTop: 32,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
          © 2026 Lakhshit Anand · Cloud Architect & Technical Lead
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.2)" }}>
          Docker · Kubernetes · OCI · Multi-Cloud
        </span>
      </div>
    </section>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const h2Style = {
  fontFamily: "'Syne', sans-serif",
  fontSize: "clamp(28px, 4vw, 44px)",
  fontWeight: 800, color: "#fff",
  letterSpacing: "-1px", marginBottom: 16,
};

const bodyStyle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 16, color: "rgba(255,255,255,0.45)",
  lineHeight: 1.7, maxWidth: 600,
};

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: 11, fontWeight: 700,
      color: "#64b5f6", textTransform: "uppercase",
      letterSpacing: 3, marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

export default function App() {
  const active = useScrollSpy();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        body {
          background: #0a0c14;
          color: #fff;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* Subtle grid overlay */
        body::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px);
          background-size: 80px 80px;
        }

        * { position: relative; }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }

        /* Responsive nav */
        @media (max-width: 720px) {
          .desk-nav { display: none !important; }
          .mob-menu { display: block !important; }
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(100,181,246,0.3); border-radius: 2px; }
      `}</style>

      <Nav active={active} />
      <Hero />
      <Skills />
      <Experience />
      <Portfolio />
      <Contact />
    </>
  );
}
