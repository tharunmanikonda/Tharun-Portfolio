const express = require('express');
const router = express.Router();

// ── SYSTEM PROMPT ────────────────────────────────────────────────────────────
// This is what the AI "knows" about Tharun. Drop in your API key and it goes live.

const SYSTEM_PROMPT = `You are an AI assistant embedded in Tharun Manikonda's personal portfolio website.
Your role is to represent Tharun and answer questions from recruiters, engineers, and visitors.

IMPORTANT RULES:
- Speak in first person ("I built...", "I worked at...") as if you ARE Tharun.
- Be conversational, confident, and concise — 2-4 sentences max per response.
- If asked something you don't know, say "I don't have that info handy — feel free to reach out directly at tharun.manikonda1@outlook.com"
- Never make up facts. Only use information from the context below.
- Do not mention you are an AI unless directly asked.
- If a question is unrelated to Tharun, his resume, portfolio, projects, skills, experience, availability, or contact details, politely refuse and redirect to the email above.

ABOUT THARUN:
Name: Tharun Manikonda
Title: Full Stack Developer & AI Engineer
Location: California, USA
Email: tharun.manikonda1@outlook.com
GitHub: https://github.com/tharunmanikonda
LinkedIn: https://www.linkedin.com/in/tharunmanikonda
Education: Master of Science in Computer Science, University of Alabama at Birmingham (Aug 2022 – Dec 2023)
Experience: 3+ years building production-scale full-stack and AI-powered applications

WORK EXPERIENCE:
1. McKinsey & Company — Full Stack Developer / Technology Engineer (May 2025 – Present, California)
   - Built referral & rewards UI with React.js, Stripe and Twilio integration → 40% engagement boost
   - Redesigned customer workflows with Tailwind CSS & Redux, cutting support tickets 20%
   - Developed Node.js/Python APIs supporting search for 50K+ users
   - Improved frontend responsiveness by 35%

2. Uber — Full Stack Developer (Feb 2024 – May 2025, California)
   - Dashboards for trip metadata & ride auditing supporting 1M+ monthly transactions
   - Real-time Kafka pipelines, Docker containerization
   - Cut UI errors 30% with debouncing & conditional loaders

3. KPMG — Java Full Stack Developer (Sep 2021 – Jul 2022, India)
   - JSP/Spring Boot dashboards monitoring 100+ KPIs
   - Secure REST APIs connecting PostgreSQL with frontend
   - AWS EC2 deployment, 50% reduction in developer onboarding time

FEATURED PROJECTS:
1. Health Tracker AI — Full-stack health tracking platform
   - Syncs WHOOP, Oura Ring & Garmin biometrics
   - Multi-modal food logging: barcode scan, OCR label photography, WhatsApp commands
   - Correlates nutrition patterns with recovery performance
   - Stack: Node.js, React, PostgreSQL, Tesseract.js, WHOOP API, Oura API
   - GitHub: https://github.com/tharunmanikonda/health-tracker-ai

2. QA Voice Agent — AI call transcript analysis
   - Analyzes AI voice-agent transcripts using GPT-4 & Claude
   - 4-tier outcome classification with actionable agent-training improvements
   - Batch + real-time processing pipelines
   - Stack: Python, GPT-4, Anthropic Claude, Flask, OpenAI
   - GitHub: https://github.com/tharunmanikonda/QA--Agent

3. NotchSafe — Native macOS notch utility
   - Menu bar app living in the MacBook notch
   - Screenshot capture, drag-and-drop file storage, Touch ID encrypted vault, clipboard history
   - Zero external dependencies, < 5MB binary
   - Stack: Swift, SwiftUI, AppKit, macOS 13+, Touch ID
   - GitHub: https://github.com/tharunmanikonda/notchsafe

4. WHOOP AI Motivator — Personalized AI health coach via SMS
   - Fetches daily WHOOP recovery, sleep & strain metrics
   - Generates <160-char motivational SMS using Google Gemini
   - Fully automated via Twilio + Vercel cron jobs, costs ~$0.23/month
   - Stack: TypeScript, Google Gemini, Twilio, WHOOP API, Vercel, Supabase
   - GitHub: https://github.com/tharunmanikonda/whopp-notifications

TECHNICAL SKILLS:
Frontend: React.js, TypeScript, JavaScript ES6+, Next.js, Tailwind CSS, Redux, Material UI, HTML5/CSS3
Backend: Node.js, Express.js, Python, Java, Spring Boot, REST APIs, JWT
AI/LLM: OpenAI GPT-4, Anthropic Claude, Google Gemini, LangChain, Prompt Engineering
Database: PostgreSQL, MongoDB, SQL, Supabase, Spring Data JPA
DevOps: AWS (EC2, S3), Docker, Kubernetes, GitHub Actions, Vercel, CI/CD, Prometheus, Grafana
Tools: Git, Postman, Swagger, Jest, Figma, Jira, Confluence

AVAILABILITY: Actively looking for full-time roles in full-stack engineering, AI engineering, or founding engineer positions.`;

// ── MOCK RESPONSES ───────────────────────────────────────────────────────────
// Used when no API key is set. Keyword-scored so the right response is picked.

const MOCK_RESPONSES = [
  {
    score: 0,
    keywords: ['who', 'yourself', 'about', 'introduce', 'tell', 'overview', 'summary', 'background'],
    response: "I'm Tharun Manikonda — a Full Stack Developer and AI Engineer based in California. I have 3+ years of experience shipping production systems, most recently at McKinsey & Company. I'm passionate about combining strong full-stack engineering with AI capabilities, and I hold a Master's in Computer Science from UAB.",
  },
  {
    score: 0,
    keywords: ['mckinsey', 'current', 'now', 'role', 'job', 'working'],
    response: "I'm currently at McKinsey & Company as a Full Stack Developer and Technology Engineer. I build React.js interfaces for referral and rewards modules, integrated Stripe and Twilio APIs, and develop Node.js/Python services supporting 50K+ users. It's been a great place to ship high-impact work at scale.",
  },
  {
    score: 0,
    keywords: ['uber', 'ride', 'trip', 'dashboard'],
    response: "At Uber I built interactive React.js dashboards for trip metadata management and ride auditing, supporting over 1 million monthly transactions. I integrated real-time data pipelines with Kafka and deployed everything via Docker. One highlight was cutting UI errors by 30% through debouncing and smarter async handling.",
  },
  {
    score: 0,
    keywords: ['kpmg', 'java', 'spring', 'consulting', 'india', 'first'],
    response: "My first role was at KPMG in India as a Java Full Stack Developer. I built JSP and Spring Boot dashboards that monitored 100+ KPIs, created secure REST APIs connecting PostgreSQL to the frontend, and deployed on AWS EC2. I also cut developer onboarding time by 50% by writing centralized Confluence documentation.",
  },
  {
    score: 0,
    keywords: ['project', 'built', 'work', 'portfolio', 'show', 'demo', 'featured'],
    response: "My four featured projects span full-stack AI, native macOS, and LLM pipelines: Health Tracker AI (wearable + nutrition tracking), QA Voice Agent (AI call transcript analysis with GPT-4 & Claude), NotchSafe (native macOS notch utility with Touch ID vault), and WHOOP AI Motivator (personalized health SMS via Google Gemini). Want to dig into any of them?",
  },
  {
    score: 0,
    keywords: ['health', 'tracker', 'whoop', 'oura', 'garmin', 'nutrition', 'food', 'wearable'],
    response: "Health Tracker AI is a full-stack platform that syncs WHOOP, Oura Ring, and Garmin biometrics, then lets you log food via barcode scanning, OCR label photography, or WhatsApp commands. The interesting part is the correlation layer — it shows how your nutrition choices actually affect recovery scores. Stack is Node.js, React, PostgreSQL, and Tesseract.js.",
  },
  {
    score: 0,
    keywords: ['qa', 'voice', 'agent', 'transcript', 'call', 'gpt', 'claude', 'llm', 'classify'],
    response: "The QA Voice Agent analyzes AI call-center transcripts using GPT-4 and Anthropic Claude. It classifies calls into four outcome tiers — from fully successful to escalated-unsuccessful — and generates specific improvement suggestions for agent training. It handles both individual and batch processing, with a keyword fallback when the API is unavailable.",
  },
  {
    score: 0,
    keywords: ['notchsafe', 'notch', 'macos', 'swift', 'mac', 'touch id', 'vault', 'clipboard'],
    response: "NotchSafe is a native macOS app that lives inside the MacBook notch — it gives you quick access to screenshots, file storage, a Touch ID–encrypted secure vault, and clipboard history, all from a hover-to-reveal dropdown. It's written entirely in Swift and SwiftUI with zero external dependencies, under 5MB, and requires macOS 13+.",
  },
  {
    score: 0,
    keywords: ['whoop motivator', 'whopp', 'notification', 'sms', 'gemini', 'twilio', 'motivat'],
    response: "WHOOP AI Motivator is an automation I built for myself. It fetches my daily WHOOP recovery, sleep, and strain metrics, feeds them to Google Gemini, and gets back a personalized motivational SMS under 160 characters — delivered automatically every morning via Twilio. The whole thing runs on Vercel cron jobs and costs about $0.23 a month.",
  },
  {
    score: 0,
    keywords: ['ai', 'llm', 'machine learning', 'openai', 'anthropic', 'artificial', 'gpt', 'model'],
    response: "I've worked hands-on with GPT-4, Anthropic Claude, and Google Gemini across multiple projects. My QA Voice Agent uses multi-model LLM pipelines for classification, the WHOOP Motivator uses Gemini for personalized content generation, and I've built prompt engineering patterns for both structured JSON output and conversational interfaces.",
  },
  {
    score: 0,
    keywords: ['skill', 'stack', 'tech', 'language', 'framework', 'tool', 'use', 'know'],
    response: "My core stack is React + TypeScript on the frontend, Node.js / Python / Java on the backend, and PostgreSQL or MongoDB for data. On the DevOps side I work with Docker, Kubernetes, GitHub Actions, and AWS. For AI I've integrated OpenAI, Anthropic, and Gemini APIs. I also have native macOS experience in Swift/SwiftUI from building NotchSafe.",
  },
  {
    score: 0,
    keywords: ['frontend', 'react', 'ui', 'interface', 'css', 'tailwind', 'design'],
    response: "Frontend is where I spend a lot of time — React with TypeScript is my default, and I lean heavily on Tailwind CSS for styling. I've worked with Redux for complex state, Material UI for enterprise dashboards, and Next.js for full-stack React apps. I care a lot about performance: debouncing, lazy loading, and keeping bundle sizes lean.",
  },
  {
    score: 0,
    keywords: ['backend', 'api', 'server', 'node', 'python', 'java', 'spring', 'rest'],
    response: "On the backend I'm comfortable in Node.js/Express, Python (Flask), and Java with Spring Boot. I design RESTful APIs, work with JWT auth, and have experience with event-driven architectures using Kafka. I've deployed services on AWS EC2/S3, containerized with Docker, and orchestrated with Kubernetes.",
  },
  {
    score: 0,
    keywords: ['education', 'degree', 'university', 'college', 'master', 'study', 'uab', 'alabama'],
    response: "I hold a Master of Science in Computer Science from the University of Alabama at Birmingham, which I completed between August 2022 and December 2023. Before that I worked in India at KPMG as a Java Full Stack Developer.",
  },
  {
    score: 0,
    keywords: ['contact', 'reach', 'email', 'hire', 'connect', 'linkedin', 'github', 'available', 'looking'],
    response: "You can reach me at tharun.manikonda1@outlook.com — I'm actively looking for full-time roles in full-stack engineering, AI engineering, or founding engineer positions. My GitHub is github.com/tharunmanikonda and LinkedIn is linkedin.com/in/tharunmanikonda.",
  },
  {
    score: 0,
    keywords: ['available', 'open', 'hire', 'position', 'opportunity', 'freelance', 'remote', 'reloc'],
    response: "Yes, I'm actively looking! I'm open to full-time roles in full-stack engineering, AI product development, or founding engineer roles at startups. I'm in California and open to both remote and on-site opportunities. Best way to reach me is tharun.manikonda1@outlook.com.",
  },
];

const DEFAULT_RESPONSE =
  "That's a great question! I might not have the details on that specifically, but feel free to reach out directly at tharun.manikonda1@outlook.com — I'd love to chat more about it.";

// ── UTILS ────────────────────────────────────────────────────────────────────

const ON_TOPIC_KEYWORDS = [
  'tharun', 'manikonda', 'you', 'your', 'resume', 'portfolio', 'background',
  'experience', 'work', 'role', 'job', 'company', 'mckinsey', 'uber', 'kpmg',
  'project', 'projects', 'built', 'build', 'health tracker', 'qa voice', 'notchsafe',
  'whoop', 'motivator', 'skills', 'stack', 'tech', 'frontend', 'backend', 'ai',
  'llm', 'devops', 'aws', 'contact', 'email', 'linkedin', 'github', 'available',
  'hire', 'hiring', 'education', 'degree', 'uab', 'university',
];

function isOnTopic(message) {
  const lower = message.toLowerCase();
  return ON_TOPIC_KEYWORDS.some(k => lower.includes(k));
}

function pickMockResponse(message) {
  const lower = message.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const candidate of MOCK_RESPONSES) {
    let score = 0;
    for (const kw of candidate.keywords) {
      if (lower.includes(kw)) score += kw.length; // longer keyword = higher weight
    }
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return bestScore > 0 ? best.response : DEFAULT_RESPONSE;
}

async function streamText(text, res) {
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    const token = (i === 0 ? '' : ' ') + words[i];
    res.write(`data: ${token}\n\n`);
    // Variable delay — slightly faster mid-sentence for realism
    const delay = 28 + Math.random() * 22;
    await new Promise(r => setTimeout(r, delay));
  }
  res.write('data: [DONE]\n\n');
  res.end();
}

// ── GEMINI STREAMING ─────────────────────────────────────────────────────────

async function streamGemini(message, history, res) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_PROMPT,
  });

  // Build chat history in Gemini format (alternating user/model roles)
  const geminiHistory = history
    .filter(h => h.content)
    .map(h => ({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }],
    }));

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessageStream(message);

  for await (const chunk of result.stream) {
    const token = chunk.text();
    if (token) res.write(`data: ${token}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

// ── ANTHROPIC STREAMING ──────────────────────────────────────────────────────

async function streamAnthropic(message, history, res) {
  const Anthropic = require('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const messages = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages,
  });

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      res.write(`data: ${chunk.delta.text}\n\n`);
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

// ── OPENAI STREAMING ─────────────────────────────────────────────────────────

async function streamOpenAI(message, history, res) {
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message },
  ];

  const stream = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 300,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || '';
    if (token) res.write(`data: ${token}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
}

// ── ROUTE ────────────────────────────────────────────────────────────────────

router.post('/', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering

  try {
    if (!isOnTopic(message)) {
      await streamText(DEFAULT_RESPONSE, res);
      return;
    }

    if (process.env.GEMINI_API_KEY) {
      await streamGemini(message, history, res);
    } else if (process.env.ANTHROPIC_API_KEY) {
      await streamAnthropic(message, history, res);
    } else if (process.env.OPENAI_API_KEY) {
      await streamOpenAI(message, history, res);
    } else {
      // No API key — stream a smart mock response
      const response = pickMockResponse(message);
      await streamText(response, res);
    }
  } catch (err) {
    console.error('[chat] Error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Streaming failed' });
    } else {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

module.exports = router;
