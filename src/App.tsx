import React, { useState, useEffect, useRef } from 'react';
import {
  Github, Mail, MapPin, ExternalLink, Linkedin, ChevronDown,
} from 'lucide-react';
import Playground from './components/Playground';

// ── DATA ─────────────────────────────────────────────────────────────────────

const ROLES = [
  'Full Stack Developer',
  'AI Engineer',
  'Software Engineer',
  'Cloud Architect',
];

const PROJECTS = [
  {
    title: 'Health Tracker AI',
    tagline: 'Social health platform — wearables, AI insights & team challenges',
    description:
      'Mobile app auto-reads Apple Health, WHOOP, Oura & Garmin on install and syncs biometrics in real time. AI analyzes your sleep, HRV, recovery & nutrition to surface personalized insights. Friends form squads, each on any wearable — a unified health score is computed across devices and used to power shared leaderboards and head-to-head challenges.',
    tech: ['React Native', 'Node.js', 'React', 'PostgreSQL', 'Tesseract.js', 'Recharts', 'HealthKit', 'Twilio', 'WHOOP API', 'Oura API', 'Garmin API', 'Gemini AI'],
    color: '#8b5cf6',
    category: 'Full Stack · AI · Mobile',
    github: 'https://github.com/tharunmanikonda/health-tracker-ai',
    featured: true,
  },
  {
    title: 'QA Voice Agent',
    tagline: 'AI-powered call transcript analysis system',
    description:
      'Analyzes AI voice-agent call transcripts using GPT-4 & Claude with 4-tier outcome classification. Generates actionable agent-training improvements via a batch-processing pipeline.',
    tech: ['Python', 'GPT-4', 'Claude API', 'Flask', 'OpenAI'],
    color: '#06b6d4',
    category: 'AI · LLM',
    github: 'https://github.com/tharunmanikonda/QA--Agent',
    featured: false,
  },
  {
    title: 'NotchSafe',
    tagline: 'macOS notch utility with biometric vault',
    description:
      'Native macOS menu-bar app living in the notch. Offers screenshot capture, drag-and-drop file storage, Touch ID–encrypted secure vault, and clipboard history — zero external dependencies.',
    tech: ['Swift', 'SwiftUI', 'AppKit', 'macOS 13+', 'Touch ID'],
    color: '#f43f5e',
    category: 'iOS · macOS',
    github: 'https://github.com/tharunmanikonda/notchsafe',
    featured: false,
  },
  {
    title: 'WHOOP AI Motivator',
    tagline: 'Personalized AI health coach delivered via SMS',
    description:
      'Fetches daily WHOOP recovery, sleep & strain metrics, generates <160-char motivational messages using Google Gemini, and delivers them on autopilot via Twilio + Vercel cron jobs.',
    tech: ['TypeScript', 'Google Gemini', 'Twilio', 'WHOOP API', 'Vercel', 'Supabase'],
    color: '#f59e0b',
    category: 'AI · Automation',
    github: 'https://github.com/tharunmanikonda/whopp-notifications',
    featured: true,
  },
];


const EXPERIENCE = [
  {
    company: 'McKinsey & Company',
    role: 'Full Stack Developer / Technology Engineer',
    duration: 'May 2025 – Present',
    location: 'California, USA',
    current: true,
    color: '#8b5cf6',
    highlights: [
      'Built referral & rewards UI with Stripe + Twilio, boosting engagement by 40%',
      'Redesigned customer workflows with Tailwind CSS & Redux, cutting support tickets 20%',
      'Developed Node.js / Python APIs supporting search for 50K+ users',
      'Improved frontend responsiveness by 35% via state & performance optimization',
    ],
  },
  {
    company: 'Uber',
    role: 'Full Stack Developer',
    duration: 'Feb 2024 – May 2025',
    location: 'California, USA',
    current: false,
    color: '#06b6d4',
    highlights: [
      'Dashboards for trip metadata & ride auditing supporting 1M+ monthly transactions',
      'Real-time data pipelines with Kafka, containerized deployments via Docker',
      'Cut UI errors 30% through debouncing & conditional loaders',
    ],
  },
  {
    company: 'KPMG',
    role: 'Java Full Stack Developer',
    duration: 'Sep 2021 – Jul 2022',
    location: 'India',
    current: false,
    color: '#f59e0b',
    highlights: [
      'JSP / Spring Boot dashboards monitoring 100+ KPIs',
      'Secure REST APIs connecting PostgreSQL with frontend',
      'AWS EC2 deployment; cut developer onboarding time by 50%',
    ],
  },
];

// ── HOOKS ─────────────────────────────────────────────────────────────────────

function useVisible(threshold = 0.12) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible] as const;
}

function useTypewriter(words: string[], speed = 75, pause = 2200) {
  const [index, setIndex] = useState(0);
  const [sub, setSub] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [text, setText] = useState('');

  useEffect(() => {
    const word = words[index];
    if (!deleting && sub === word.length) {
      const t = setTimeout(() => setDeleting(true), pause);
      return () => clearTimeout(t);
    }
    if (deleting && sub === 0) {
      setDeleting(false);
      setIndex(i => (i + 1) % words.length);
      return;
    }
    const next = sub + (deleting ? -1 : 1);
    const t = setTimeout(() => {
      setSub(next);
      setText(word.substring(0, next));
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(t);
  }, [sub, deleting, index, words, speed, pause]);

  return text;
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────

// Mouse-tracking spotlight
const Spotlight = () => {
  useEffect(() => {
    const h = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mx', `${e.clientX}px`);
      document.documentElement.style.setProperty('--my', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', h, { passive: true });
    return () => window.removeEventListener('mousemove', h);
  }, []);
  return <div className="spotlight fixed inset-0 pointer-events-none z-[2]" />;
};

// Noise grain layer
const Grain = () => (
  <div
    className="grain fixed inset-0 pointer-events-none z-[1] opacity-[0.04]"
  />
);

// Aurora orbs + dot grid
const Aurora = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div
      className="aurora-1 absolute rounded-full opacity-[0.32]"
      style={{
        width: 700, height: 700, top: '-15%', left: '-12%',
        background: 'radial-gradient(circle, #8b5cf6 0%, transparent 68%)',
      }}
    />
    <div
      className="aurora-2 absolute rounded-full opacity-[0.22]"
      style={{
        width: 580, height: 580, top: '20%', right: '-16%',
        background: 'radial-gradient(circle, #06b6d4 0%, transparent 68%)',
      }}
    />
    <div
      className="aurora-3 absolute rounded-full opacity-[0.18]"
      style={{
        width: 460, height: 460, bottom: '-8%', left: '32%',
        background: 'radial-gradient(circle, #f0abfc 0%, transparent 68%)',
      }}
    />
    <div className="dot-grid absolute inset-0 opacity-[0.28]" />
  </div>
);

// Sticky nav
const Nav = ({ active }: { active: string }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' });
    setOpen(false);
  };

  const links = ['about', 'experience', 'projects', 'playground', 'skills', 'contact'];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'nav-scrolled' : ''}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => go('hero')}
          className="gradient-text font-mono text-sm font-semibold tracking-[0.2em] uppercase"
        >
          TM
        </button>

        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <button
              key={l}
              onClick={() => go(l)}
              className={`text-sm capitalize transition-colors duration-200 ${
                active === l ? 'text-violet-400' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {l}
            </button>
          ))}
          <a
            href="https://github.com/tharunmanikonda"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-slate-100 transition-colors duration-200"
          >
            <Github size={17} />
          </a>
        </div>

        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setOpen(!open)}
          aria-label="menu"
        >
          <span className={`block h-0.5 bg-slate-400 transition-all duration-200 ${open ? 'w-5 rotate-45 translate-y-2' : 'w-5'}`} />
          <span className={`block h-0.5 bg-slate-400 transition-all duration-200 ${open ? 'opacity-0 w-0' : 'w-4'}`} />
          <span className={`block h-0.5 bg-slate-400 transition-all duration-200 ${open ? 'w-5 -rotate-45 -translate-y-2' : 'w-5'}`} />
        </button>
      </div>

      {open && (
        <div className="md:hidden glass border-t border-violet-500/10 px-6 py-4 space-y-3">
          {links.map(l => (
            <button
              key={l}
              onClick={() => go(l)}
              className="block text-slate-300 capitalize text-sm w-full text-left py-1.5"
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
};

// Hero section — hacker terminal aesthetic
const Hero = () => {
  const role = useTypewriter(ROLES);
  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 64, behavior: 'smooth' });
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center text-center px-6 pt-16 scanlines overflow-hidden"
    >
      <div className="hero-glow" />

      <div className="relative z-10 max-w-4xl fade-up">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 text-xs text-green-400 font-mono border border-green-500/20 rounded-full px-4 py-1.5 mb-10 glass">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="opacity-60">$</span> Available for new opportunities
        </div>

        {/* Name */}
        <h1
          className="font-bold mb-4 tracking-tight leading-none"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(3.2rem, 9vw, 7rem)' }}
        >
          <span className="block text-slate-50">Tharun</span>
          <span className="block gradient-text glitch-text">Manikonda</span>
        </h1>

        {/* Typewriter role */}
        <div className="text-lg md:text-2xl text-slate-400 mb-5 font-mono min-h-[2rem]">
          <span className="text-green-400">&gt;&gt; </span>
          <span className="text-slate-200">{role}</span>
          <span className="cursor text-green-400">_</span>
        </div>

        {/* Tagline */}
        <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed font-mono text-sm">
          <span className="text-slate-600">// </span>
          3+ years shipping full-stack systems and AI-powered products
          <br className="hidden sm:block" />
          at McKinsey, Uber & KPMG. From MERN to LLMs.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-14">
          <button
            onClick={() => go('projects')}
            className="group flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-7 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/30"
          >
            View Projects
            <ExternalLink
              size={14}
              className="opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200"
            />
          </button>
          <button
            onClick={() => go('playground')}
            className="group flex items-center gap-2 glass border border-green-500/25 hover:border-green-500/50 text-green-400 hover:text-green-300 px-7 py-3 rounded-xl text-sm font-semibold transition-all duration-200 font-mono"
          >
            <span className="opacity-70">$</span> live_playground
          </button>
          <button
            onClick={() => go('contact')}
            className="flex items-center gap-2 glass border border-violet-500/20 hover:border-violet-500/50 text-slate-300 hover:text-white px-7 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
          >
            <Mail size={14} />
            Get in Touch
          </button>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-6 max-w-xs mx-auto">
          {[['3+', 'Years Exp.'], ['3', 'Companies'], ['8+', 'Projects']].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="text-2xl md:text-3xl font-bold gradient-text font-mono">{n}</div>
              <div className="text-[0.65rem] text-slate-500 mt-1 tracking-wide font-mono">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => go('about')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 hover:text-violet-400 transition-colors duration-200 animate-bounce"
        aria-label="scroll down"
      >
        <ChevronDown size={22} />
      </button>
    </section>
  );
};

// About section
const About = () => {
  const [ref, visible] = useVisible();
  return (
    <section
      id="about"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-28 px-6 relative z-10"
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)' }}
        >
          <p className="text-xs text-violet-400 font-mono mb-3 tracking-[0.18em] uppercase">// about me</p>
          <h2
            className="text-3xl md:text-4xl font-bold mb-14"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Who I Am
          </h2>

          <div className="grid md:grid-cols-5 gap-12 items-start">
            <div className="md:col-span-3 space-y-5">
              <p className="text-slate-200 leading-relaxed text-lg">
                I'm a Full Stack Developer & AI Engineer based in California, with 3+ years shipping
                production systems at McKinsey & Company, Uber, and KPMG.
              </p>
              <p className="text-slate-400 leading-relaxed">
                I'm passionate about the intersection of AI and product — building tools that are
                genuinely useful, not just technically impressive. Lately I've been deep in LLM
                integration, wearable APIs, and native macOS development.
              </p>
              <p className="text-slate-400 leading-relaxed">
                Open to full-time roles where I can work on ambitious products that pair strong
                engineering with emerging AI capabilities.
              </p>
              <div className="flex flex-wrap gap-5 pt-3">
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <MapPin size={13} className="text-violet-400" />
                  California, USA
                </span>
                <span className="flex items-center gap-1.5 text-sm text-slate-400">
                  <Mail size={13} className="text-violet-400" />
                  tharun.manikonda1@outlook.com
                </span>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              {[
                { n: '3+', l: 'Years Experience', c: '#8b5cf6' },
                { n: '3',  l: 'Top Companies',    c: '#06b6d4' },
                { n: 'M.S.', l: 'CS — UAB',       c: '#f0abfc' },
                { n: '8+', l: 'Projects Shipped',  c: '#f59e0b' },
              ].map(({ n, l, c }) => (
                <div
                  key={l}
                  className="glass rounded-2xl p-5 text-center hover:scale-[1.04] transition-transform duration-200"
                >
                  <div className="text-2xl font-bold font-mono mb-1.5" style={{ color: c }}>{n}</div>
                  <div className="text-xs text-slate-400 leading-snug">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Experience section
const Experience = () => {
  const [ref, visible] = useVisible();
  return (
    <section
      id="experience"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-28 px-6 relative z-10"
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)' }}
        >
          <p className="text-xs text-cyan-400 font-mono mb-3 tracking-[0.18em] uppercase">// work history</p>
          <h2
            className="text-3xl md:text-4xl font-bold mb-14"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Experience
          </h2>

          <div className="relative">
            <div className="absolute left-[6px] top-3 bottom-3 w-px bg-gradient-to-b from-violet-500 via-cyan-500 to-amber-500 opacity-25 hidden md:block" />
            <div className="space-y-8">
              {EXPERIENCE.map((exp, i) => (
                <div
                  key={i}
                  className="relative md:pl-10 transition-all duration-700"
                  style={{ transitionDelay: `${i * 120}ms`, opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(20px)' }}
                >
                  <div className="absolute left-0 top-6 hidden md:flex items-center justify-center">
                    {exp.current && (
                      <span
                        className="dot-ping absolute w-3.5 h-3.5 rounded-full opacity-50"
                        style={{ background: exp.color }}
                      />
                    )}
                    <span
                      className="relative w-3.5 h-3.5 rounded-full border-2 block z-10"
                      style={{ borderColor: exp.color, background: exp.current ? exp.color : '#04050f' }}
                    />
                  </div>

                  <div className="glass rounded-2xl p-6 hover:border-violet-500/30 transition-all duration-300">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <h3 className="text-base font-bold text-slate-100">{exp.company}</h3>
                          {exp.current && (
                            <span className="text-[0.65rem] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-mono">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-medium" style={{ color: exp.color }}>{exp.role}</div>
                      </div>
                      <div className="text-right text-xs text-slate-500 font-mono leading-relaxed">
                        <div>{exp.duration}</div>
                        <div className="mt-0.5">{exp.location}</div>
                      </div>
                    </div>
                    <ul className="space-y-2.5">
                      {exp.highlights.map((h, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm text-slate-400 leading-relaxed">
                          <span className="text-violet-500 mt-0.5 shrink-0 text-xs">▹</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// ── PER-PROJECT ANIMATED VISUALIZATIONS ──────────────────────────────────────

// Health Tracker: wearables + Apple Health → AI score engine → team challenges
const HealthViz = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 700);
    return () => clearInterval(id);
  }, []);

  // Cycle through 4 phases: data ingestion, AI analysis, score, challenge
  const phase = Math.floor(tick / 3) % 4;

  const wearables = [
    { label: 'Apple Health', color: '#f43f5e' },
    { label: 'WHOOP', color: '#8b5cf6' },
    { label: 'Oura', color: '#f59e0b' },
    { label: 'Garmin', color: '#06b6d4' },
  ];

  const stages = [
    { label: 'AI Insights', color: '#a78bfa', active: phase === 1 },
    { label: 'Health Score', color: '#34d399', active: phase === 2 },
    { label: '🏆 Challenge', color: '#f59e0b', active: phase === 3 },
  ];

  const activeWearable = tick % wearables.length;

  return (
    <div className="py-2 px-1">
      {/* Row 1: wearables feeding in */}
      <div className="flex items-center gap-1 mb-2">
        <div className="flex gap-1 flex-wrap">
          {wearables.map((w, i) => (
            <div
              key={w.label}
              className="text-[0.48rem] font-mono px-1.5 py-0.5 rounded transition-all duration-400"
              style={{
                background: activeWearable === i ? `${w.color}28` : `${w.color}08`,
                color: activeWearable === i ? w.color : `${w.color}45`,
                border: `1px solid ${activeWearable === i ? w.color + '55' : w.color + '15'}`,
                boxShadow: activeWearable === i ? `0 0 8px ${w.color}35` : 'none',
              }}
            >
              {w.label}
            </div>
          ))}
        </div>
        <div className="text-[0.45rem] text-slate-700 font-mono ml-1">→</div>
        <div
          className="text-[0.48rem] font-mono px-1.5 py-0.5 rounded transition-all duration-400"
          style={{
            background: phase === 0 ? '#8b5cf618' : '#8b5cf608',
            color: phase === 0 ? '#8b5cf6' : '#8b5cf640',
            border: `1px solid ${phase === 0 ? '#8b5cf640' : '#8b5cf615'}`,
            boxShadow: phase === 0 ? '0 0 8px #8b5cf630' : 'none',
          }}
        >
          API sync
        </div>
      </div>

      {/* Row 2: pipeline → score → challenge */}
      <div className="flex items-center gap-1">
        {stages.map((s, i) => (
          <React.Fragment key={s.label}>
            <div
              className="flex-1 text-center text-[0.48rem] font-mono px-1 py-1 rounded transition-all duration-400"
              style={{
                background: s.active ? `${s.color}22` : `${s.color}07`,
                color: s.active ? s.color : `${s.color}40`,
                border: `1px solid ${s.active ? s.color + '45' : s.color + '15'}`,
                transform: s.active ? 'scale(1.06)' : 'scale(1)',
                boxShadow: s.active ? `0 0 10px ${s.color}30` : 'none',
              }}
            >
              {s.label}
            </div>
            {i < stages.length - 1 && (
              <div className="w-2 h-px shrink-0" style={{ background: 'rgba(100,100,140,0.25)' }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// QA Voice Agent: waveform → GPT-4 → classification
const QAViz = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 120);
    return () => clearInterval(id);
  }, []);
  const tiers = ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4'];
  const activeTier = Math.floor(tick / 12) % 4;
  return (
    <div className="py-3 flex items-center gap-3 px-1">
      <div className="flex items-end gap-0.5 h-7 shrink-0">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="w-1 rounded-sm"
            style={{
              height: `${12 + Math.abs(Math.sin((tick * 0.18 + i * 0.7))) * 12}px`,
              background: '#06b6d4',
              opacity: 0.7,
              transition: 'height 0.1s ease',
            }}
          />
        ))}
      </div>
      <div className="text-[0.5rem] text-slate-600 font-mono shrink-0">→ GPT-4 →</div>
      <div
        className="text-[0.55rem] font-mono px-2 py-1 rounded transition-all duration-500 shrink-0"
        style={{
          background: '#06b6d418',
          color: '#06b6d4',
          border: '1px solid #06b6d435',
          boxShadow: `0 0 10px #06b6d422`,
        }}
      >
        {tiers[activeTier]}
      </div>
    </div>
  );
};

// NotchSafe: animated macOS notch
const NotchViz = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 1200);
    return () => clearInterval(id);
  }, []);
  const icons = ['#8b5cf6', '#06b6d4', '#f43f5e'];
  return (
    <div className="py-3 flex justify-center">
      <div className="relative" style={{ width: 200, height: 28, background: '#0a0a0a', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
        {/* notch cutout */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2"
          style={{ width: 68, height: 28, background: '#04050f', borderRadius: '0 0 12px 12px' }}
        />
        {/* icons left */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1.5">
          {icons.map((c, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-sm transition-all duration-700"
              style={{
                background: c,
                opacity: tick % 3 === i ? 1 : 0.3,
                boxShadow: tick % 3 === i ? `0 0 8px ${c}` : 'none',
              }}
            />
          ))}
        </div>
        {/* touch id indicator right */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div
            className="w-3.5 h-3.5 rounded-full border-2 transition-all duration-700"
            style={{
              borderColor: tick % 4 === 0 ? '#34d399' : '#374151',
              boxShadow: tick % 4 === 0 ? '0 0 8px #34d39988' : 'none',
            }}
          />
        </div>
      </div>
    </div>
  );
};

// WHOOP Motivator: metrics → Gemini → SMS
const WHOOPViz = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(n => n + 1), 900);
    return () => clearInterval(id);
  }, []);
  const metrics = ['Recovery: 87%', 'Sleep: 7.4h', 'Strain: 14.2'];
  return (
    <div className="py-3 flex items-center gap-2 px-1">
      <div className="flex-1 space-y-0.5">
        {metrics.map((m, i) => (
          <div
            key={m}
            className="text-[0.52rem] font-mono transition-all duration-500"
            style={{ color: tick % 3 === i ? '#f59e0b' : '#374151' }}
          >
            {m}
          </div>
        ))}
      </div>
      <div className="text-[0.48rem] text-slate-700 font-mono shrink-0">→ Gemini →</div>
      <div
        className="text-[0.52rem] font-mono px-2 py-2 rounded-lg shrink-0 text-center transition-all duration-700"
        style={{
          background: '#f59e0b15',
          color: '#f59e0b',
          border: '1px solid #f59e0b30',
          opacity: tick % 2 === 0 ? 1 : 0.55,
          boxShadow: tick % 2 === 0 ? '0 0 12px #f59e0b25' : 'none',
        }}
      >
        SMS ✓
      </div>
    </div>
  );
};

const VIZ_COMPONENTS = [HealthViz, QAViz, NotchViz, WHOOPViz];

// Projects section — asymmetric bento grid + live mini-visualizations
const Projects = () => {
  const [ref, visible] = useVisible();
  return (
    <section
      id="projects"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-28 px-6 relative z-10"
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)' }}
        >
          <p className="text-xs text-violet-400 font-mono mb-3 tracking-[0.18em] uppercase">// featured work</p>
          <h2
            className="text-3xl md:text-4xl font-bold mb-14"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Projects
          </h2>

          {/* Bento grid: featured (col-span-2) alternates with single */}
          <div className="grid md:grid-cols-3 gap-5">
            {PROJECTS.map((p, i) => {
              const VizComp = VIZ_COMPONENTS[i];
              const isFeatured = p.featured;
              return (
                <div
                  key={i}
                  className={`glass project-card rounded-2xl p-6 flex flex-col group ${isFeatured ? 'md:col-span-2' : 'md:col-span-1'}`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.boxShadow = `0 12px 48px ${p.color}28`;
                    el.style.borderColor = `${p.color}45`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.boxShadow = '';
                    el.style.borderColor = '';
                  }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <span
                        className="text-[0.65rem] font-mono px-2 py-1 rounded-md inline-block mb-3"
                        style={{
                          color: p.color,
                          background: `${p.color}14`,
                          border: `1px solid ${p.color}30`,
                        }}
                      >
                        {p.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-100 leading-snug">{p.title}</h3>
                      <p className="text-sm mt-0.5 font-medium" style={{ color: p.color }}>
                        {p.tagline}
                      </p>
                    </div>
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-4 shrink-0 text-slate-500 hover:text-slate-100 transition-colors duration-200"
                    >
                      <Github size={18} />
                    </a>
                  </div>

                  {/* Live visualization */}
                  <div
                    className="rounded-xl mb-4 overflow-hidden"
                    style={{
                      background: `${p.color}06`,
                      border: `1px solid ${p.color}18`,
                      minHeight: 52,
                    }}
                  >
                    <div className="px-2">
                      <VizComp />
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-slate-400 leading-relaxed mb-4 flex-1">{p.description}</p>

                  {/* Tech stack */}
                  <div className="flex flex-wrap gap-1.5">
                    {p.tech.map(t => (
                      <span key={t} className="skill-badge">{t}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

// ── SKILL TICKER ROWS ─────────────────────────────────────────────────────────

const TICKER_ROWS: { dir: 'left' | 'right' | 'left-slow'; skills: { label: string; color: string }[] }[] = [
  {
    dir: 'left',
    skills: [
      { label: 'React.js', color: '#8b5cf6' },
      { label: 'TypeScript', color: '#8b5cf6' },
      { label: 'JavaScript ES6+', color: '#8b5cf6' },
      { label: 'Next.js', color: '#8b5cf6' },
      { label: 'Tailwind CSS', color: '#8b5cf6' },
      { label: 'Redux', color: '#8b5cf6' },
      { label: 'Material UI', color: '#8b5cf6' },
      { label: 'Node.js', color: '#06b6d4' },
      { label: 'Express.js', color: '#06b6d4' },
      { label: 'Python', color: '#06b6d4' },
      { label: 'Java', color: '#06b6d4' },
      { label: 'Spring Boot', color: '#06b6d4' },
      { label: 'REST APIs', color: '#06b6d4' },
      { label: 'JWT', color: '#06b6d4' },
    ],
  },
  {
    dir: 'right',
    skills: [
      { label: 'OpenAI GPT-4', color: '#f0abfc' },
      { label: 'Anthropic Claude', color: '#f0abfc' },
      { label: 'Google Gemini', color: '#f0abfc' },
      { label: 'LangChain', color: '#f0abfc' },
      { label: 'Prompt Engineering', color: '#f0abfc' },
      { label: 'PostgreSQL', color: '#34d399' },
      { label: 'MongoDB', color: '#34d399' },
      { label: 'SQL', color: '#34d399' },
      { label: 'Supabase', color: '#34d399' },
      { label: 'Spring Data JPA', color: '#34d399' },
      { label: 'React Native', color: '#f0abfc' },
      { label: 'HealthKit', color: '#f0abfc' },
      { label: 'Gemini AI', color: '#f0abfc' },
    ],
  },
  {
    dir: 'left-slow',
    skills: [
      { label: 'AWS EC2 / S3', color: '#f59e0b' },
      { label: 'Docker', color: '#f59e0b' },
      { label: 'Kubernetes', color: '#f59e0b' },
      { label: 'GitHub Actions', color: '#f59e0b' },
      { label: 'Vercel', color: '#f59e0b' },
      { label: 'CI / CD', color: '#f59e0b' },
      { label: 'Git', color: '#94a3b8' },
      { label: 'Postman', color: '#94a3b8' },
      { label: 'Jest', color: '#94a3b8' },
      { label: 'Figma', color: '#94a3b8' },
      { label: 'Jira', color: '#94a3b8' },
      { label: 'Confluence', color: '#94a3b8' },
      { label: 'SwiftUI', color: '#f43f5e' },
      { label: 'Swift', color: '#f43f5e' },
    ],
  },
];

function SkillRow({ dir, skills }: { dir: string; skills: { label: string; color: string }[] }) {
  const cls = dir === 'right' ? 'marquee-right' : dir === 'left-slow' ? 'marquee-left-slow' : 'marquee-left';
  const doubled = [...skills, ...skills];
  return (
    <div className="overflow-hidden py-1.5" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)' }}>
      <div className={`marquee-track ${cls}`}>
        {doubled.map((s, i) => (
          <span
            key={i}
            className="skill-badge shrink-0"
            style={{ color: s.color, borderColor: `${s.color}30`, background: `${s.color}0d` }}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Skills section — marquee ticker + education
const Skills = () => {
  const [ref, visible] = useVisible();
  return (
    <section
      id="skills"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-28 px-6 relative z-10"
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)' }}
        >
          <p className="text-xs text-cyan-400 font-mono mb-3 tracking-[0.18em] uppercase">// tech stack</p>
          <h2
            className="text-3xl md:text-4xl font-bold mb-10"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Skills
          </h2>

          {/* 3 marquee rows running in alternating directions */}
          <div className="space-y-3 mb-10">
            {TICKER_ROWS.map((row, i) => (
              <SkillRow key={i} dir={row.dir} skills={row.skills} />
            ))}
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="text-[0.65rem] font-mono font-bold text-violet-400 mb-4 tracking-[0.18em] uppercase">
              Education
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-slate-100 font-semibold">Master of Science — Computer Science</div>
                <div className="text-slate-400 text-sm mt-1">University of Alabama at Birmingham</div>
              </div>
              <div className="text-xs text-slate-500 font-mono">Aug 2022 – Dec 2023</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Contact section
const Contact = () => {
  const [ref, visible] = useVisible();
  return (
    <section
      id="contact"
      ref={ref as React.RefObject<HTMLElement>}
      className="py-28 px-6 relative z-10"
    >
      <div className="max-w-2xl mx-auto text-center">
        <div
          className="transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(32px)' }}
        >
          <p className="text-xs text-violet-400 font-mono mb-3 tracking-[0.18em] uppercase">// contact</p>
          <h2
            className="font-bold mb-5 leading-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 'clamp(2rem, 5vw, 3.2rem)' }}
          >
            Let's build something{' '}
            <span className="gradient-text">extraordinary.</span>
          </h2>
          <p className="text-slate-400 mb-10 leading-relaxed">
            I'm open to full-time roles, consulting, and interesting side projects.
            If you have something in mind, let's talk.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="mailto:tharun.manikonda1@outlook.com"
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-7 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-xl hover:shadow-violet-500/30"
            >
              <Mail size={15} /> Send an email
            </a>
            <a
              href="https://github.com/tharunmanikonda"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 glass border border-violet-500/20 hover:border-violet-500/50 text-slate-300 hover:text-white px-7 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              <Github size={15} /> GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/tharunmanikonda"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 glass border border-violet-500/20 hover:border-violet-500/50 text-slate-300 hover:text-white px-7 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
            >
              <Linkedin size={15} /> LinkedIn
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="py-8 px-6 border-t border-slate-800/40 relative z-10">
    <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 font-mono">
      <span>© 2025 Tharun Manikonda</span>
      <span>React · Vite · Tailwind</span>
    </div>
  </footer>
);

// ── APP ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [active, setActive] = useState('hero');

  useEffect(() => {
    const ids = ['hero', 'about', 'experience', 'projects', 'playground', 'skills', 'contact'];
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); }),
      { threshold: 0.35 },
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen text-slate-100 overflow-x-hidden" style={{ background: '#04050f' }}>
      <Aurora />
      <Grain />
      <Spotlight />
      <Nav active={active} />
      <main>
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Playground />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
