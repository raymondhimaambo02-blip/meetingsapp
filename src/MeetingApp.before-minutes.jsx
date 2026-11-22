/*
 * Meetings™ — created by rayTECH@innovations™ (0979566905)
 * © 2026 rayTECH@innovations. All rights reserved.
 * This source code and the app it builds are the property of rayTECH@innovations.
 * Copying, reselling, redistributing or passing this work off as your own, in whole or in part, is not permitted without written permission.
 */
import { useState, useRef, useEffect } from "react";
import { Bell, BellRing, Ban, Building2, Calendar, Check, ChevronDown, Clock, Eye, EyeOff, Inbox, Lock, LogOut, Mail, MapPin, Mic, Plus, Send, Trash2, Type, User, UserPlus, Vibrate, Volume2, X, Users, MessageCircle, ArrowLeft, Sun, Sunrise, Sunset, Moon, Video, Download, Megaphone, Repeat, CalendarPlus, Pencil, BarChart3, FileText, Fingerprint } from "lucide-react";

/* ---------- Alerts: sound, voice, vibration ---------- */
let ctx;
function playChime() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    [659.25, 783.99, 987.77].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + i * 0.18;
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.3, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.65);
    });
  } catch (e) {}
}
const speak = (s) => { try { if (!("speechSynthesis" in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(s); u.rate = 0.95; speechSynthesis.speak(u); } catch (e) {} };
const buzz = () => { try { navigator.vibrate && navigator.vibrate([250, 120, 250, 120, 500]); } catch (e) {} };
const fmtDate = (d) => new Date(d + "T00:00").toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtTime = (t) => { const [h, m] = t.split(":"); const d = new Date(); d.setHours(+h, +m); return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); };
const parts = (d) => { if (!d) return { w: "Day", d: "--", m: "Mon" }; const x = new Date(d + "T00:00"); return { w: x.toLocaleDateString(undefined, { weekday: "short" }), d: x.getDate(), m: x.toLocaleDateString(undefined, { month: "short" }) }; };
const BLANKF = { topic: "", date: "", time: "", venue: "", link: "", notes: "", agenda: "", repeat: "none", reminders: [30, 10] };
const remOf = (m) => (m.reminders && m.reminders.length ? m.reminders : [30, 10]);
const remText = (m) => { const r = [...remOf(m)].sort((a, b) => b - a); return r.length > 1 ? `${r.slice(0, -1).join(", ")} and ${r[r.length - 1]}` : `${r[0]}`; };
const where = (m) => m.venue || "Online meeting";
const pad2 = (n) => String(n).padStart(2, "0");
const shift = (d, kind, n) => {
  const x = new Date(d + "T00:00");
  if (kind === "weekly") x.setDate(x.getDate() + 7 * n);
  else { const day = x.getDate(); x.setDate(1); x.setMonth(x.getMonth() + n); x.setDate(Math.min(day, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate())); }
  return `${x.getFullYear()}-${pad2(x.getMonth() + 1)}-${pad2(x.getDate())}`;
};
const gcal = (m) => {
  const s = new Date(`${m.date}T${m.time}`), e = new Date(s.getTime() + 3600000);
  const z = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(m.topic) + "&dates=" + z(s) + "/" + z(e) +
    "&location=" + encodeURIComponent(m.venue || m.link || "") + "&details=" + encodeURIComponent([m.notes, m.agenda && "Agenda: " + m.agenda, m.link].filter(Boolean).join("\n"));
};
const mapUrl = (m) => "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(m.venue);
const safeLink = (l) => (/^https?:\/\//i.test(l) ? l : "https://" + l);
const openUrl = (u) => { try { window.open(u, "_blank", "noopener"); } catch (e) {} };
/* Loud alarm: repeats from the invitation screen until the client replies */
function playAlarm() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.4, 0.8].forEach((off) => [880, 1174.66].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + off + i * 0.16;
      o.type = "square"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.55, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.32);
    }));
  } catch (e) {}
}
const buzzLong = () => { try { navigator.vibrate && navigator.vibrate([600, 150, 600, 150, 600]); } catch (e) {} };
function runAlert(m, o) {
  if (o.sound) playChime();
  if (o.vibrate) buzz();
  if (o.voice) setTimeout(() => speak(`New meeting. ${m.topic}. ${fmtDate(m.date)} at ${fmtTime(m.time)}. ${m.venue ? `Venue: ${m.venue}.` : "This is an online meeting."}`), o.sound ? 700 : 0);
}

/* Built-in manager account: not stored in the user list, so it never appears in People or invites */
const MANAGER = { id: 1, name: "Raymond Hims", org: "Head Office", username: "raymondhims", pass: "1720", role: "manager" };
const SEED = [
  { id: 2, name: "Chanda Lungu", org: "Head Office", email: "admin@demo.com", pass: "demo123", role: "admin" },
  { id: 3, name: "Amara Phiri", org: "Phiri & Partners", email: "amara@demo.com", pass: "demo123", role: "client" },
  { id: 4, name: "Daniel Mwansa", org: "Copperline Logistics", email: "daniel@demo.com", pass: "demo123", role: "client" },
  { id: 5, name: "Grace Banda", org: "Banda Foods", email: "grace@demo.com", pass: "demo123", role: "client" },
  { id: 6, name: "Joseph Tembo", org: "Tembo Consulting", email: "joseph@demo.com", pass: "demo123", role: "client" },
  { id: 7, name: "Mercy Zulu", org: "Zulu Agri", email: "mercy@demo.com", pass: "demo123", role: "client" },
];
const ROLE = { manager: "Manager", admin: "Admin", client: "Client" };
const BLANK = { name: "", org: "", email: "", pass: "" };
/* Storage: keeps the session and data on the phone (works in the installed app; silently skipped where storage is unavailable) */
const store = {
  get(k, d) { try { const v = localStorage.getItem("mtg:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("mtg:" + k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem("mtg:" + k); } catch (e) {} },
};
let BOOT;
const boot = () => BOOT || (BOOT = {
  users: store.get("users", SEED), session: store.get("session", null), meetings: store.get("meetings", []),
  rsvp: store.get("rsvp", {}), banners: store.get("banners", []), msgs: store.get("msgs", []), fired: store.get("fired", []), checkins: store.get("checkins", {}), seen: store.get("seen", {}),
});
const restore = () => { const b = boot(); return b.session === MANAGER.id ? MANAGER : b.users.find((u) => u.id === b.session) || null; };

/* Native alerts: Capacitor Local Notifications ring even when the app is closed */
const LN = () => (typeof window !== "undefined" ? window.Capacitor?.Plugins?.LocalNotifications : undefined);
let ready;
const ensureNative = (ln) => ready || (ready = (async () => {
  try {
    await ln.requestPermissions();
    await ln.createChannel({ id: "meetings", name: "Meeting alerts", description: "Invitations and reminders", importance: 5, visibility: 1, vibration: true, lights: true });
    if (!store.get("exactAsked", false)) {
      const r = await ln.checkExactNotificationSetting?.();
      if (r && r.exact_alarm !== "granted") { store.set("exactAsked", true); await ln.changeExactNotificationSetting?.(); }
    }
  } catch (e) {}
})());
/* Fingerprint / face unlock: uses a Capacitor biometric plugin when installed (@aparajita/capacitor-biometric-auth or capacitor-native-biometric) */
const BIO = () => (typeof window !== "undefined" ? window.Capacitor?.Plugins?.BiometricAuth || window.Capacitor?.Plugins?.NativeBiometric : undefined);
const bioCheck = async () => { const p = BIO(); if (!p) return false; try { if (p.checkBiometry) return !!(await p.checkBiometry()).isAvailable; if (p.isAvailable) return !!(await p.isAvailable()).isAvailable; } catch (e) {} return false; };
const bioAsk = async (reason) => {
  const p = BIO(); if (!p) return false;
  try {
    if (p.authenticate) { await p.authenticate({ reason, cancelTitle: "Use password", allowDeviceCredential: false, androidTitle: "Meetings", androidSubtitle: reason }); return true; }
    if (p.verifyIdentity) { await p.verifyIdentity({ reason, title: "Meetings" }); return true; }
  } catch (e) {}
  return false;
};
/* ---------- Voice: speech out, speech in, and a small parser for spoken meeting details ---------- */
let VOICE = false;
const SRPlugin = () => (typeof window !== "undefined" ? window.Capacitor?.Plugins?.SpeechRecognition : undefined);
const webSR = () => (typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined);
const canListen = () => !!(SRPlugin() || webSR());
const sayLang = () => (/^en/i.test(navigator.language || "") ? navigator.language : "en-US");
const say = (s) => new Promise((res) => {
  try {
    if (!("speechSynthesis" in window)) return res();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(s); u.rate = 0.95; u.lang = sayLang();
    u.onend = u.onerror = () => res(); speechSynthesis.speak(u); setTimeout(res, 20000);
  } catch (e) { res(); }
});
const listen = async () => {
  const p = SRPlugin();
  if (p) {
    try {
      const a = await p.available?.(); if (a && a.available === false) return "";
      const perm = await p.requestPermissions?.(); if (perm && perm.speechRecognition && perm.speechRecognition !== "granted") return "";
      const r = await p.start({ language: sayLang(), maxResults: 1, partialResults: false, popup: false });
      return ((r && r.matches && r.matches[0]) || "").trim();
    } catch (e) { return ""; }
  }
  const W = webSR(); if (!W) return "";
  return new Promise((res) => {
    const rec = new W(); let done = false;
    const fin = (t) => { if (!done) { done = true; res(t); } };
    rec.lang = sayLang(); rec.interimResults = false; rec.maxAlternatives = 1;
    rec.onresult = (e) => fin((e.results[0]?.[0]?.transcript || "").trim());
    rec.onerror = () => fin(""); rec.onend = () => fin("");
    try { rec.start(); } catch (e) { fin(""); }
    setTimeout(() => { try { rec.stop(); } catch (e) {} }, 12000);
  });
};
const isNo = (s) => /\b(no|nope|can'?t|cannot|can not|won'?t|not attend|not coming|not able|decline|sorry)\b/i.test(s);
const isYes = (s) => /\b(yes|yeah|yep|yup|sure|attend|i will|i'll be there|i'll come|confirm|okay|ok|definitely)\b/i.test(s);
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const isoOf = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
function parseDate(t) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const plus = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return isoOf(d); };
  let m;
  if ((m = t.match(/\bday after tomorrow\b/i))) return { date: plus(2), used: m[0] };
  if ((m = t.match(/\b(?:on\s+)?tomorrow\b/i))) return { date: plus(1), used: m[0] };
  if ((m = t.match(/\b(?:on\s+)?today\b/i))) return { date: plus(0), used: m[0] };
  const mon = MONTHS.join("|");
  if ((m = t.match(new RegExp(`\\b(?:on\\s+)?(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${mon})(?:\\s+(\\d{4}))?\\b`, "i"))) || (m = t.match(new RegExp(`\\b(?:on\\s+)?(${mon})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`, "i")))) {
    const numFirst = /^\d/.test(m[1]);
    const day = +(numFirst ? m[1] : m[2]), mi = MONTHS.indexOf((numFirst ? m[2] : m[1]).toLowerCase());
    let y = m[3] ? +m[3] : today.getFullYear(); let d = new Date(y, mi, day);
    if (!m[3] && d < today) d = new Date(y + 1, mi, day);
    return { date: isoOf(d), used: m[0] };
  }
  if ((m = t.match(new RegExp(`\\b(?:(next|this|on)\\s+)?(${DAYS.join("|")})\\b`, "i")))) {
    let diff = (DAYS.indexOf(m[2].toLowerCase()) - today.getDay() + 7) % 7; if (diff === 0) diff = 7;
    return { date: plus(diff), used: m[0] };
  }
  if ((m = t.match(/\bon the (\d{1,2})(?:st|nd|rd|th)\b/i))) {
    let d = new Date(today.getFullYear(), today.getMonth(), +m[1]); if (d < today) d = new Date(today.getFullYear(), today.getMonth() + 1, +m[1]);
    return { date: isoOf(d), used: m[0] };
  }
  return null;
}
function parseTime(t, bare) {
  let m, h, min = 0, mer = "";
  if ((m = t.match(/\bat\s+noon\b|\bnoon\b/i))) return { time: "12:00", used: m[0] };
  if ((m = t.match(/\bat\s+midnight\b|\bmidnight\b/i))) return { time: "00:00", used: m[0] };
  if ((m = t.match(/\b(?:at\s+)?(\d{1,2})(?:[:.\s](\d{2}))?\s*(a\.?m\.?|p\.?m\.?)(?![a-z])/i))) { h = +m[1]; min = +(m[2] || 0); mer = m[3][0].toLowerCase(); }
  else if ((m = t.match(/\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/))) { h = +m[1]; min = +m[2]; }
  else if ((m = t.match(/\bat\s+(\d{1,2})(?:\s*o'?clock)?(?![\d:])(?!\s*(?:st|nd|rd|th|am|pm))/i))) { h = +m[1]; if (h >= 1 && h <= 6) mer = "p"; }
  else if (bare && (m = t.match(/(\d{1,2})(?:[:.](\d{2}))?/))) { h = +m[1]; min = +(m[2] || 0); if (h >= 1 && h <= 6) mer = "p"; }
  else return null;
  if (mer === "p" && h < 12) h += 12; if (mer === "a" && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return { time: `${pad2(h)}:${pad2(min)}`, used: m[0] };
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function parseWho(t, clients) {
  if (/\b(everyone|everybody|all (?:of )?(?:the |my )?(?:clients|them|people)|all clients)\b/i.test(t)) return { ids: clients.map((c) => c.id), used: [(t.match(/\b(?:for|with|invite|inviting)\s+(?:everyone|everybody|all (?:of )?(?:the |my )?(?:clients|them|people))\b/i) || t.match(/\b(?:everyone|everybody|all (?:of )?(?:the |my )?(?:clients|them|people)|all clients)\b/i))[0]] };
  const ids = [], used = [];
  clients.forEach((c) => {
    const full = c.name.trim(), first = full.split(" ")[0];
    const hit = new RegExp(`\\b${esc(full)}\\b`, "i").test(t) ? full : new RegExp(`\\b${esc(first)}\\b`, "i").test(t) ? first : "";
    if (hit) { ids.push(c.id); used.push(t.match(new RegExp(`\\b${esc(hit)}\\b`, "i"))[0]); }
  });
  return ids.length ? { ids, used } : null;
}
const cleanTopic = (s) => {
  let x = " " + s + " ";
  x = x.replace(/\b(?:please|can you|could you|i want to|i would like to|i'd like to|let'?s)\b/gi, " ")
    .replace(/\b(?:schedule|set up|setup|create|book|arrange|plan|organi[sz]e)\b/gi, " ")
    .replace(/\b(?:a|an|the|new)?\s*\b(?:meeting|appointment|session)\b/gi, " ")
    .replace(/\s+/g, " ").trim();
  for (let i = 0; i < 6; i++) x = x.replace(/^(?:about|regarding|called|titled|to discuss|discussing|on|for|with|and|invite|inviting|a|an|the|to|[,.;])\s+/i, "").replace(/\s+(?:for|with|and|invite|inviting|on|at|in|the|a|to|[,.;])$/i, "").replace(/[,.;]+$/, "").trim();
  x = x.replace(/^(?:about|regarding|called|titled|on)\s+/i, "").trim();
  return x.length > 1 ? x.charAt(0).toUpperCase() + x.slice(1) : "";
};
function parseMeeting(text, clients) {
  let t = " " + text.replace(/\s+/g, " ").trim() + " ";
  const out = {}, cut = (u) => { t = t.replace(u, " "); };
  const d = parseDate(t); if (d) { out.date = d.date; cut(d.used); }
  const tm = parseTime(t); if (tm) { out.time = tm.time; cut(tm.used); }
  const w = parseWho(t, clients); if (w) { out.ids = w.ids; w.used.forEach(cut); }
  let v;
  if ((v = t.match(/\b(?:online|virtual|zoom|google meet|teams call|video call)\b/i))) { out.venue = "Online"; cut(v[0]); }
  else if ((v = t.match(/\b(?:venue(?: is)?|location(?: is)?|at|in the)\s+(?:the\s+)?(.+?)(?=\s+(?:for|with|about|regarding|called|titled|to discuss)\b|[,.;]|\s*$)/i))) { out.venue = v[1].trim().replace(/^./, (c) => c.toUpperCase()); cut(v[0]); }
  if (!out.venue && (v = t.match(/\b(?:at|in)\s+(?:the\s+)?((?:\w+\s+){0,3}?(?:room|hall|office|building|centre|center|boardroom|floor|lab|hotel|lodge|campus|club|restaurant)(?:\s+\d+)?)\b/i))) { out.venue = v[1].trim().replace(/^./, (c) => c.toUpperCase()); cut(v[0]); }
  const topic = cleanTopic(t); if (topic) out.topic = topic;
  return out;
}
const CREDIT = "rayTECH@innovations";
const nid = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return (Math.abs(h) % 2147483000) + 1; };

const greet = (ms) => { const h = new Date(ms).getHours(); return h < 5 ? ["Working late", Moon] : h < 12 ? ["Good morning", Sunrise] : h < 17 ? ["Good afternoon", Sun] : h < 21 ? ["Good evening", Sunset] : ["Good night", Moon]; };
const stamp = (ms) => { const d = new Date(ms); return d.toDateString() === new Date().toDateString() ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : d.toLocaleDateString([], { day: "numeric", month: "short" }); };
function Field({ icon: Icon, right, ...p }) {
  return <div className="fld"><Icon size={18} /><input {...p} />{right}</div>;
}
const GRAD = ["#5B3DF5,#8E6BFF", "#FF5C7A,#FF9A6B", "#14C99A,#6BE3C2", "#FFB020,#FFD36B", "#2D9CFF,#7FC4FF"];
const init = (n) => n.split(" ").map((w) => w[0]).join("");

function Avatar({ c, size = 44 }) {
  const [a, b] = GRAD[c.id % 5].split(",");
  return <span className="av" style={{ width: size, height: size, fontSize: size * 0.34, background: `linear-gradient(135deg,${a},${b})` }}>{init(c.name)}</span>;
}

function Ticket({ m, tone = "violet", children }) {
  const p = parts(m.date);
  return (
    <div className={"tk " + tone}>
      <div className="tk-date"><span>{p.w}</span><b>{p.d}</b><span>{p.m}</span></div>
      <div className="tk-body">
        <div className="tk-topic">{m.topic || "Your meeting topic"}</div>
        <div className="tk-line"><Clock size={14} />{m.time ? fmtTime(m.time) : "Time"}</div>
        {(m.venue || !m.link) && <div className="tk-line"><MapPin size={14} />{m.venue || "Venue"}</div>}
        {m.link && <div className="tk-line"><Video size={14} />Online link</div>}
        {!!(m.series || m.moved) && !m.cancelled && <div className="chips" style={{ marginTop: 6 }}>{m.series && <span className="chip">{m.repeat === "weekly" ? "Weekly" : "Monthly"} {m.n}/{m.of}</span>}{m.moved && <span className="chip wait">Rescheduled</span>}</div>}
        {children}
      </div>
    </div>
  );
}

function Donut({ yes, no, total }) {
  const R = 22, C = 2 * Math.PI * R, a = (yes / total) * C, b = (no / total) * C;
  return (
    <svg width="58" height="58" viewBox="0 0 58 58" aria-hidden="true">
      <circle cx="29" cy="29" r={R} fill="none" stroke="#E4E1FA" strokeWidth="7" />
      <circle cx="29" cy="29" r={R} fill="none" stroke="#14C99A" strokeWidth="7" strokeDasharray={`${a} ${C - a}`} transform="rotate(-90 29 29)" strokeLinecap="round" />
      <circle cx="29" cy="29" r={R} fill="none" stroke="#FF5C7A" strokeWidth="7" strokeDasharray={`${b} ${C - b}`} strokeDashoffset={-a} transform="rotate(-90 29 29)" strokeLinecap="round" />
      <text x="29" y="33" textAnchor="middle" fontSize="12" fontWeight="800" fill="#14123A">{yes + no}/{total}</text>
    </svg>
  );
}

const css = `
.mt{--bg:#EEF0FF;--ink:#14123A;--ink2:#2A2766;--mute:#6C6A94;--vio:#5B3DF5;--vio2:#8E6BFF;--mint:#14C99A;--coral:#FF5C7A;--sun:#FFB020;--line:#E0DDF7;
 font-family:"Poppins",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--bg);color:var(--ink);min-height:100vh;max-width:480px;margin:0 auto;position:relative;padding-bottom:110px;font-size:15px;line-height:1.45;overflow-x:hidden}
.mt *{box-sizing:border-box}.mt button{font-family:inherit}
.mt header{position:relative;overflow:hidden;color:#fff;padding:26px 20px 30px;border-radius:0 0 40px 40px;text-shadow:0 1px 8px rgba(20,10,60,.25)}
.mt header.h-admin{background:radial-gradient(110% 90% at 0% 0%,#E8338A 0%,transparent 58%),radial-gradient(90% 90% at 100% 0%,#F5883A 0%,transparent 55%),radial-gradient(110% 100% at 95% 100%,#17BFC4 0%,transparent 58%),radial-gradient(100% 100% at 5% 100%,#6A3DF0 0%,transparent 62%),#2A1A7A}
.mt header.h-client{background:radial-gradient(110% 90% at 0% 0%,#14B8A6 0%,transparent 58%),radial-gradient(90% 90% at 100% 0%,#3B82F6 0%,transparent 55%),radial-gradient(110% 100% at 95% 100%,#A855F7 0%,transparent 58%),radial-gradient(100% 100% at 5% 100%,#FACC15 0%,transparent 55%),#0B2A5B}
.mt header::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,10,60,.28),rgba(20,10,60,.05) 70%)}
.mt header::after{content:"";position:absolute;inset:0;background:repeating-radial-gradient(circle at 100% 0,rgba(255,255,255,.2) 0 2px,transparent 2px 24px);-webkit-mask-image:radial-gradient(circle at 100% 0,#000,transparent 62%);mask-image:radial-gradient(circle at 100% 0,#000,transparent 62%)}
.mt header>*{position:relative;z-index:1}
.mt .top{display:flex;align-items:center;gap:12px}
.mt .logo{width:44px;height:44px;border-radius:14px;background:rgba(255,255,255,.22);border:1px solid rgba(255,255,255,.35);display:grid;place-items:center;backdrop-filter:blur(6px)}
.mt h1{font-size:25px;margin:0;font-weight:800;letter-spacing:-.02em;line-height:1.15}
.mt .sub{color:rgba(255,255,255,.92);font-size:13px}
.mt .seg{position:relative;display:grid;grid-template-columns:1fr 1fr;background:rgba(255,255,255,.18);border-radius:16px;padding:4px;margin-top:20px}
.mt .seg i{position:absolute;top:4px;bottom:4px;left:4px;width:calc(50% - 4px);background:#fff;border-radius:12px;transition:transform .35s cubic-bezier(.3,1.4,.5,1)}
.mt .seg button{position:relative;z-index:1;border:0;background:none;color:#fff;padding:10px;font-weight:700;font-size:14px;cursor:pointer;transition:color .2s}
.mt .seg button.on{color:var(--vio)}
.mt main{padding:20px 16px}
.mt h2{font-size:16px;margin:22px 0 10px;font-weight:700}
.mt .cap{font-size:12.5px;color:var(--mute);margin:0 0 8px 4px}
.mt .tk{position:relative;display:flex;background:#fff;border-radius:22px;margin-bottom:14px;box-shadow:0 10px 24px -14px rgba(59,34,214,.45)}
.mt .tk::before,.mt .tk::after{content:"";position:absolute;left:67px;width:20px;height:20px;border-radius:50%;background:var(--bg);z-index:2}
.mt .tk::before{top:-10px}.mt .tk::after{bottom:-10px}
.mt .tk-date{width:78px;flex:none;border-radius:22px 0 0 22px;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 4px;border-right:2px dashed rgba(255,255,255,.55);background:linear-gradient(160deg,var(--vio),var(--vio2))}
.mt .tk-date span{font-size:12px;font-weight:600;opacity:.9}.mt .tk-date b{font-size:30px;font-weight:800;line-height:1.05;letter-spacing:-.02em}
.mt .tk.mint .tk-date{background:linear-gradient(160deg,#0FB98B,#5EE0BC)}
.mt .tk.coral .tk-date{background:linear-gradient(160deg,#F23D63,#FF8A7A)}
.mt .tk.sun .tk-date{background:linear-gradient(160deg,#F59500,#FFC94D)}
.mt .tk-body{flex:1;min-width:0;padding:14px 16px 14px 14px}
.mt .tk-topic{font-weight:700;font-size:16px;letter-spacing:-.01em;line-height:1.25;margin-bottom:6px;overflow-wrap:anywhere}
.mt .tk-line{display:flex;gap:7px;align-items:center;color:var(--mute);font-size:13.5px;margin-top:3px}
.mt .fld{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid transparent;border-radius:16px;padding:0 14px;margin-bottom:10px;color:var(--vio);transition:border-color .2s,box-shadow .2s}
.mt .fld:focus-within{border-color:var(--vio2);box-shadow:0 0 0 4px rgba(91,61,245,.12)}
.mt .fld input,.mt .fld textarea{flex:1;min-width:0;border:0;background:none;padding:14px 0;font:inherit;color:var(--ink);outline:none;resize:none}
.mt .two{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.mt .ppl{display:flex;gap:10px;overflow-x:auto;padding:4px 2px 10px;margin:0 -2px;scrollbar-width:none}
.mt .pp{flex:none;width:68px;border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;font-size:12px;font-weight:600;color:var(--ink);position:relative}
.mt .av{border-radius:50%;display:grid;place-items:center;color:#fff;font-weight:700;flex:none;transition:transform .25s cubic-bezier(.3,1.5,.5,1)}
.mt .pp .av{width:54px;height:54px}
.mt .pp.on .av{transform:scale(1.1);box-shadow:0 0 0 3px var(--bg),0 0 0 6px var(--vio)}
.mt .pp .tick{position:absolute;top:-2px;right:6px;width:22px;height:22px;border-radius:50%;background:var(--mint);color:#fff;display:grid;place-items:center;transform:scale(0);transition:transform .25s cubic-bezier(.3,1.8,.5,1);border:2px solid var(--bg)}
.mt .pp.on .tick{transform:scale(1)}
.mt .all .av{background:var(--ink);}
.mt .tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.mt .tile{border:0;border-radius:20px;background:#fff;padding:16px 4px 12px;display:flex;flex-direction:column;align-items:center;gap:8px;color:var(--mute);font-weight:600;font-size:13px;cursor:pointer;transition:transform .2s,background .25s,color .25s,box-shadow .25s}
.mt .tile:active{transform:scale(.94)}
.mt .tile.on{background:linear-gradient(150deg,var(--vio),var(--vio2));color:#fff;box-shadow:0 12px 22px -10px rgba(91,61,245,.7)}
.mt .go{width:100%;margin-top:22px;border:0;border-radius:20px;padding:17px;color:#fff;font-weight:800;font-size:16px;display:flex;gap:10px;justify-content:center;align-items:center;cursor:pointer;background:linear-gradient(100deg,var(--vio),#9B5BFF 60%,#FF5C7A);box-shadow:0 16px 26px -14px rgba(91,61,245,.9);transition:transform .15s}
.mt .go:active{transform:scale(.97)}.mt .go:disabled{background:#CFCCEA;box-shadow:none;cursor:not-allowed}
.mt .hint{font-size:12.5px;color:var(--mute);text-align:center;margin-top:10px}
.mt .chip{font-size:12px;font-weight:700;padding:4px 10px;border-radius:99px;background:#EDE9FF;color:var(--vio)}
.mt .chip.ok{background:#D6F7EC;color:#0A8F6B}.mt .chip.no{background:#FFE0E6;color:#C92A4B}.mt .chip.wait{background:#FFEFCC;color:#A86400}
.mt .foot{display:flex;align-items:center;gap:12px;width:100%;border:0;background:none;padding:10px 0 0;margin-top:8px;border-top:1px dashed var(--line);cursor:pointer;text-align:left;font:inherit;color:inherit}
.mt .chips{display:flex;gap:5px;flex-wrap:wrap;flex:1}
.mt .who{display:flex;align-items:center;gap:10px;padding:10px 4px;border-top:1px solid var(--line)}
.mt .panel{background:#fff;border-radius:20px;padding:6px 14px 14px;margin:-4px 0 14px}
.mt .remind{width:100%;margin-top:6px;border:0;border-radius:14px;padding:12px;background:var(--ink);color:#fff;font-weight:700;display:flex;gap:8px;justify-content:center;align-items:center;cursor:pointer}
.mt .acts{display:flex;gap:8px;margin-top:12px}
.mt .acts button{flex:1;border:0;border-radius:14px;padding:11px 6px;font-weight:700;font-size:13.5px;display:flex;gap:6px;justify-content:center;align-items:center;cursor:pointer;background:#F1EFFF;color:var(--ink2)}
.mt .acts .yes{background:var(--mint);color:#fff}.mt .acts .icon{flex:none;width:44px}
.mt .empty{text-align:center;color:var(--mute);padding:34px 24px}
.mt .empty .bub{width:84px;height:84px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;color:var(--vio);background:#fff;box-shadow:0 0 0 10px rgba(91,61,245,.08),0 0 0 22px rgba(91,61,245,.04)}
.mt nav{position:fixed;bottom:14px;left:50%;transform:translateX(-50%);width:calc(100% - 32px);max-width:440px;background:var(--ink);border-radius:24px;display:flex;gap:6px;padding:8px;padding-bottom:calc(8px + env(safe-area-inset-bottom,0px));z-index:5;box-shadow:0 18px 30px -12px rgba(20,18,58,.6)}
.mt nav button{position:relative;flex:1;border:0;background:none;color:rgba(255,255,255,.6);display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:14px;padding:12px;border-radius:17px;cursor:pointer;transition:background .25s,color .25s}
.mt nav button.on{background:rgba(255,255,255,.14);color:#fff}
.mt nav em{font-style:normal;font-size:11px;min-width:20px;height:20px;border-radius:10px;background:var(--coral);color:#fff;display:grid;place-items:center;padding:0 5px}
.mt .toast{position:fixed;bottom:150px;left:50%;transform:translateX(-50%);background:var(--ink);color:#fff;padding:12px 18px;border-radius:16px;font-weight:600;font-size:14px;z-index:40;display:flex;gap:8px;align-items:center;max-width:92%;box-shadow:0 12px 28px rgba(20,18,58,.4)}
.mt .ov{position:fixed;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:18px;overflow:auto;background:radial-gradient(circle at 50% 18%,#6D4DFF 0%,#2B1BA8 55%,#140F5E 100%)}
.mt .ovc{width:100%;max-width:400px;text-align:center;color:#fff}
.mt .ring{width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,#FF5C7A,#FFB020);display:grid;place-items:center;margin:0 auto 14px}
.mt .ovc .tk{text-align:left;margin:16px 0 8px;color:var(--ink)}
.mt .ovc .lead{font-size:14px;color:rgba(255,255,255,.8)}
.mt .big{width:100%;padding:16px;border-radius:18px;border:0;font-weight:800;font-size:16px;display:flex;gap:8px;justify-content:center;align-items:center;margin-top:10px;cursor:pointer;transition:transform .15s}
.mt .big:active{transform:scale(.97)}
.mt .big.yes{background:var(--mint);color:#06382B}.mt .big.no{background:rgba(255,255,255,.14);color:#fff;border:2px solid rgba(255,255,255,.35)}
.mt .ovc .fld{text-align:left;margin-top:12px}
.mt .ovc .link{background:none;border:0;color:rgba(255,255,255,.85);font-weight:600;margin-top:14px;cursor:pointer;font-size:13.5px}
.mt .ovc .small{font-size:12px;color:rgba(255,255,255,.6);margin-top:12px}
.mt .conf{position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden}
.mt .conf s{position:absolute;top:-16px;width:9px;height:14px;border-radius:2px;animation:fall 1.7s ease-in forwards}
.mt header.h-manager{background:radial-gradient(110% 90% at 0% 0%,#FFB020 0%,transparent 55%),radial-gradient(90% 90% at 100% 0%,#FF5C7A 0%,transparent 55%),radial-gradient(110% 100% at 95% 100%,#8E6BFF 0%,transparent 58%),radial-gradient(100% 100% at 5% 100%,#14C99A 0%,transparent 58%),#3B0A45}
.mt .tk.grey .tk-date{background:linear-gradient(160deg,#8A88A6,#B5B3CC)}
.mt .tk.grey .tk-topic{text-decoration:line-through;opacity:.65}
.mt .ubar{display:flex;align-items:center;gap:10px;margin-top:18px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);border-radius:18px;padding:8px 8px 8px 10px}
.mt .ubar .who2{flex:1;min-width:0;line-height:1.25}
.mt .ubar b{display:block;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mt .ubar small{font-size:12px;opacity:.92}
.mt .ubar button{border:0;border-radius:12px;background:rgba(255,255,255,.24);color:#fff;padding:9px 12px;font-weight:700;font-size:13px;display:flex;gap:6px;align-items:center;cursor:pointer}
.mt .seg.lt{background:#E4E1FA;margin-top:0;margin-bottom:10px}
.mt .seg.lt i{background:linear-gradient(100deg,var(--vio),var(--vio2))}
.mt .seg.lt button{color:var(--mute)}.mt .seg.lt button.on{color:#fff}
.mt .err{color:#C92A4B;font-size:13px;font-weight:600;margin:2px 4px 10px}
.mt .demo{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
.mt .demo button{border:0;border-radius:14px;background:#fff;padding:9px 12px;font-weight:700;font-size:12.5px;color:var(--ink2);cursor:pointer}
.mt .eye{border:0;background:none;color:var(--mute);cursor:pointer;display:grid;place-items:center;padding:6px}
.mt .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.mt .stat{background:#fff;border-radius:18px;padding:12px 6px;text-align:center}
.mt .stat b{display:block;font-size:24px;font-weight:800;line-height:1.1}.mt .stat span{font-size:12px;color:var(--mute)}
.mt .urow{display:flex;align-items:center;gap:12px;background:#fff;border-radius:18px;padding:10px 12px;margin-bottom:10px}
.mt .trash{flex:none;border:0;min-width:40px;height:40px;border-radius:12px;background:#FFE9ED;color:#C92A4B;display:grid;place-items:center;cursor:pointer;font-weight:700;font-size:12.5px}
.mt .trash.sure{background:#C92A4B;color:#fff;padding:0 12px}
.mt .cancel{width:100%;margin:-4px 0 14px;border:0;border-radius:16px;padding:12px;background:#FFE9ED;color:#C92A4B;font-weight:700;display:flex;gap:8px;justify-content:center;align-items:center;cursor:pointer}
.mt .cancel.sure{background:#C92A4B;color:#fff}
.mt .card2{background:#fff;border-radius:22px;padding:14px;margin:10px 0 14px;animation:pop .3s ease-out}
.mt .card2 .fld{background:var(--bg)}
.mt .bns{position:fixed;top:10px;left:50%;transform:translateX(-50%);width:calc(100% - 24px);max-width:456px;z-index:45;display:flex;flex-direction:column;gap:8px}
.mt .bn{display:flex;gap:12px;align-items:center;border-radius:18px;padding:12px 12px 12px 14px;color:#fff;box-shadow:0 14px 28px -12px rgba(20,18,58,.6);animation:pop .3s ease-out;background:linear-gradient(100deg,#F59500,#FF5C7A)}
.mt .bn.gone{background:linear-gradient(100deg,#6C6A94,#2A2766)}
.mt .bn div{flex:1;font-size:13.5px;line-height:1.35}.mt .bn b{display:block;font-size:15px}
.mt .bn button{border:0;background:rgba(255,255,255,.24);color:#fff;border-radius:10px;width:32px;height:32px;display:grid;place-items:center;cursor:pointer;flex:none}
.mt .hello{display:inline-flex;align-items:center;gap:7px;font-size:13px;font-weight:700;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.32);border-radius:99px;padding:5px 12px;margin-bottom:14px}
.mt .bn.msgb{background:linear-gradient(100deg,#5B3DF5,#2D9CFF)}
.mt .conv{display:flex;align-items:center;gap:12px;width:100%;border:0;background:#fff;border-radius:18px;padding:10px 12px;margin-bottom:10px;cursor:pointer;text-align:left;font:inherit;color:inherit}
.mt .conv .pv{color:var(--mute);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.mt .conv .tm{font-size:11.5px;color:var(--mute);margin-bottom:4px}
.mt .cnt{min-width:22px;height:22px;border-radius:11px;background:var(--coral);color:#fff;font-size:12px;font-weight:700;display:inline-grid;place-items:center;padding:0 6px}
.mt .chead{display:flex;align-items:center;gap:10px;margin-bottom:14px}
.mt .back{border:0;background:#fff;width:40px;height:40px;border-radius:14px;display:grid;place-items:center;cursor:pointer;color:var(--ink);flex:none}
.mt .thread{display:flex;flex-direction:column;gap:8px;padding-bottom:70px}
.mt .bub2{max-width:80%;padding:10px 14px;border-radius:18px;font-size:14.5px;overflow-wrap:anywhere;animation:pop .2s ease-out}
.mt .bub2.me{align-self:flex-end;background:linear-gradient(120deg,var(--vio),var(--vio2));color:#fff;border-bottom-right-radius:6px}
.mt .bub2.them{align-self:flex-start;background:#fff;border-bottom-left-radius:6px}
.mt .bub2 small{display:block;font-size:11px;opacity:.7;margin-top:2px}
.mt .composer{position:fixed;bottom:90px;left:50%;transform:translateX(-50%);width:calc(100% - 32px);max-width:440px;display:flex;gap:8px;z-index:4}
.mt .composer .fld{flex:1;margin:0;box-shadow:0 8px 20px -12px rgba(59,34,214,.5)}
.mt .composer button{flex:none;width:52px;border:0;border-radius:16px;background:linear-gradient(120deg,var(--vio),#9B5BFF);color:#fff;display:grid;place-items:center;cursor:pointer}
.mt .composer button:disabled{background:#CFCCEA;cursor:not-allowed}
.mt .hero{display:flex;flex-direction:column;align-items:center;text-align:center}
.mt .hero h1{font-size:32px;letter-spacing:-.03em}
.mt .logo.big{width:68px;height:68px;border-radius:22px;margin:6px 0 22px;box-shadow:0 0 0 8px rgba(255,255,255,.14),0 0 0 18px rgba(255,255,255,.07);animation:bob 3.2s ease-in-out infinite}
.mt .hello.big{font-size:15px;padding:7px 18px;margin:0 0 12px;background:linear-gradient(100deg,rgba(255,255,255,.3),rgba(255,255,255,.14))}
.mt .wel{text-align:center;margin:6px 0 20px}
.mt .wel h2{font-size:27px;font-weight:800;letter-spacing:-.02em;margin:0;background:linear-gradient(100deg,#5B3DF5,#E8338A 55%,#F5883A);-webkit-background-clip:text;background-clip:text;color:transparent}
.mt .wel p{margin:6px 0 12px;color:var(--mute);font-size:14px}
.mt .wel i{display:block;width:56px;height:5px;border-radius:99px;margin:0 auto;background:linear-gradient(100deg,#5B3DF5,#14C99A)}
.mt .rem{display:flex;gap:8px;flex-wrap:wrap}
.mt .rem button{border:0;border-radius:99px;padding:10px 16px;background:#fff;color:var(--mute);font-weight:700;font-size:13px;cursor:pointer;transition:background .2s,color .2s}
.mt .rem button.on{background:linear-gradient(100deg,var(--vio),var(--vio2));color:#fff}
.mt .rem-me{display:flex;align-items:center;gap:10px;margin:2px 4px 12px;font-size:13.5px;font-weight:600;color:var(--ink2);cursor:pointer}
.mt .rem-me input{width:20px;height:20px;accent-color:var(--vio);flex:none}
.mt .crd{text-align:center;font-size:11.5px;color:var(--mute);margin:28px 0 4px;line-height:1.55}
.mt .crd b{color:var(--ink2)}
@keyframes bob{50%{transform:translateY(-5px)}}
@keyframes fall{to{transform:translateY(110vh) rotate(540deg);opacity:.2}}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(255,92,122,.6)}100%{box-shadow:0 0 0 34px rgba(255,92,122,0)}}
@keyframes pop{from{opacity:0;transform:translateY(10px) scale(.98)}}
.mt .ring{animation:pulse 1.5s ease-out infinite}
.mt .tk,.mt .panel{animation:pop .3s ease-out}
@media (prefers-reduced-motion:reduce){.mt *{animation:none!important;transition:none!important}}
`;

export default function MeetingApp() {
  const [users, setUsers] = useState(() => boot().users);
  const [user, setUser] = useState(restore);
  const [mode, setMode] = useState("login");
  const saved = () => { const r = store.get("remember", null); return r ? { ...BLANK, email: r.email, pass: r.pass } : BLANK; };
  const [auth, setAuth] = useState(saved);
  const [remember, setRemember] = useState(() => !store.get("rememberOff", false));
  const [err, setErr] = useState("");
  const [show, setShow] = useState(false);
  const [tab, setTab] = useState(() => { const u = restore(); return !u ? "" : u.role === "client" ? "inbox" : u.role === "admin" ? "compose" : "users"; });
  const [meetings, setMeetings] = useState(() => boot().meetings);
  const [rsvp, setRsvp] = useState(() => boot().rsvp);
  const [banners, setBanners] = useState(() => boot().banners);
  const [toast, setToast] = useState("");
  const [f, setF] = useState(BLANKF);
  const [sel, setSel] = useState([]);
  const [opt, setOpt] = useState({ sound: true, voice: true, vibrate: true });
  const [overlay, setOverlay] = useState(null);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(null);
  const [pop, setPop] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [confirm, setConfirm] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [nu, setNu] = useState({ ...BLANK, role: "client" });
  const [msgs, setMsgs] = useState(() => boot().msgs);
  const [chat, setChat] = useState(null);
  const [draft, setDraft] = useState("");
  const [checkins, setCheckins] = useState(() => boot().checkins);
  const [seen, setSeen] = useState(() => boot().seen);
  const [resch, setResch] = useState(null);
  const [repOpen, setRepOpen] = useState(false);
  const [bioOk, setBioOk] = useState(false);
  const [bioId, setBioId] = useState(() => store.get("bioUser", null));
  const [offerBio, setOfferBio] = useState(false);
  const [listening, setListening] = useState("");
  useEffect(() => { bioCheck().then(setBioOk); }, []);
  const tt = useRef(), ct = useRef(), fired = useRef(new Set(boot().fired)), endRef = useRef();
  /* A blocked or deleted account is locked out on this phone: no login, no alerts, no alarms */
  const me = user && user.id !== MANAGER.id ? users.find((u) => u.id === user.id) : user;
  const locked = !!user && user.id !== MANAGER.id && (!me || !!me.status);
  const uid = locked ? undefined : user?.id;
  useEffect(() => { if (locked) { setOverlay(null); try { speechSynthesis.cancel(); } catch (e) {} } }, [locked]);
  const startOf = (m) => new Date(`${m.date}T${m.time}`).getTime();

  const flash = (m) => { setToast(m); clearTimeout(tt.current); tt.current = setTimeout(() => setToast(""), 3200); };
  const saveFired = () => store.set("fired", [...fired.current]);
  const ask = (id) => { setConfirm(id); clearTimeout(ct.current); ct.current = setTimeout(() => setConfirm(null), 4000); };

  /* Reminders: banner + sound + voice + vibration */
  const remind = (m, mins) => {
    setBanners((b) => [{ id: Math.random(), to: uid, kind: "remind", title: `Starts in ${mins} minutes`, text: `${m.topic} · ${where(m)}` }, ...b]);
    playChime(); buzz(); setTimeout(() => speak(`Reminder. ${m.topic} starts in ${mins} minutes. ${where(m)}.`), 700);
  };

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    const wake = () => { if (!document.hidden) setNow(Date.now()); };
    document.addEventListener("visibilitychange", wake);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", wake); };
  }, []);
  useEffect(() => {
    if (!overlay) return;
    const id = setInterval(() => { if (!VOICE) { playAlarm(); buzzLong(); } }, 5000);
    return () => clearInterval(id);
  }, [overlay]);
  useEffect(() => {
    if (!uid) return;
    meetings.forEach((m) => {
      if (m.cancelled || !m.to.includes(uid) || rsvp[`${m.id}-${uid}`]?.s === "no") return;
      const mins = (startOf(m) - now) / 60000;
      if (!(mins > 0)) return;
      const due = remOf(m).filter((t) => mins <= t);
      if (!due.length) return;
      const keys = due.map((t) => `${m.id}-${uid}-${t}`);
      if (keys.every((k) => fired.current.has(k))) return;
      keys.forEach((k) => fired.current.add(k)); saveFired(); remind(m, Math.min(...due));
    });
  }, [now, meetings, rsvp, uid]);

  useEffect(() => {
    if (!uid || tab !== "chat" || !chat || chat === "new") return;
    if (msgs.some((m) => m.to === uid && m.from === chat && !m.read)) setMsgs((ms) => ms.map((m) => (m.to === uid && m.from === chat && !m.read ? { ...m, read: true } : m)));
    const hit = (x) => x.kind === "msg" && x.to === uid && x.from === chat;
    if (banners.some(hit)) setBanners((b) => b.filter((x) => !hit(x)));
  }, [tab, chat, msgs, uid, banners]);
  useEffect(() => { if (tab === "chat" && typeof chat === "number") endRef.current?.scrollIntoView({ block: "end" }); }, [msgs.length, chat, tab]);

  /* Keep the session and data on the phone until the user logs out */
  useEffect(() => { store.set("users", users); }, [users]);
  useEffect(() => { store.set("meetings", meetings); }, [meetings]);
  useEffect(() => { store.set("rsvp", rsvp); }, [rsvp]);
  useEffect(() => { store.set("banners", banners); }, [banners]);
  useEffect(() => { store.set("msgs", msgs); }, [msgs]);
  useEffect(() => { store.set("checkins", checkins); }, [checkins]);
  useEffect(() => { store.set("seen", seen); }, [seen]);
  /* Delivery proof: "delivered" when the invitation reaches this phone, "opened" when the client sees it */
  useEffect(() => {
    if (!uid || user?.role !== "client") return;
    const ts = Date.now();
    setSeen((s) => {
      let n = s, ch = false;
      meetings.forEach((m) => {
        if (m.cancelled || !m.to.includes(uid)) return;
        const k = `${m.id}-${uid}`, cur = s[k] || {}, next = { ...cur };
        if (!cur.d) next.d = ts;
        if (!cur.o && (tab === "inbox" || overlay === m.id)) next.o = ts;
        if (next.d !== cur.d || next.o !== cur.o) { if (!ch) { n = { ...s }; ch = true; } n[k] = next; }
      });
      return n;
    });
  }, [meetings, tab, overlay, uid]);
  useEffect(() => { if (user) store.set("session", user.id); else store.del("session"); }, [user]);
  useEffect(() => {
    if (!user) return;
    flash(`${greet(Date.now())[0]}, ${user.name.split(" ")[0]}. You’re signed in.`);
    if (user.role === "client") prompt(user.id);
  }, []);

  /* Schedule phone alarms (30 min, 10 min, start) so reminders ring with the app closed */
  useEffect(() => {
    const ln = LN();
    if (!ln) return;
    (async () => {
      try {
        const pending = (await ln.getPending()).notifications || [];
        const want = new Map();
        if (uid) {
          await ensureNative(ln);
          meetings.forEach((m) => {
            if (m.cancelled || !m.to.includes(uid) || rsvp[`${m.id}-${uid}`]?.s === "no") return;
            [...remOf(m), 0].forEach((mins) => {
              const at = startOf(m) - mins * 60000;
              if (!(at > Date.now())) return;
              const id = nid(`${m.id}-${uid}-${mins}`);
              want.set(id, { id, channelId: "meetings", title: mins ? `Meeting in ${mins} minutes` : "Meeting starting now", body: `${m.topic} · ${where(m)}`, schedule: { at: new Date(at), allowWhileIdle: true }, extra: { meetingId: m.id } });
            });
          });
        }
        const stale = pending.filter((n) => !want.has(n.id)).map((n) => ({ id: n.id }));
        if (stale.length) await ln.cancel({ notifications: stale });
        if (want.size) await ln.schedule({ notifications: [...want.values()] });
      } catch (e) {}
    })();
  }, [meetings, rsvp, uid]);

  /* Auth */
  const enter = (u, fresh, viaBio) => {
    setUser(u); setOfferBio(!viaBio && bioOk && bioId !== u.id); setErr(""); setShow(false); setAuth(BLANK); setOpen(null); setChat(null); setDraft("");
    setTab(u.role === "client" ? "inbox" : u.role === "admin" ? "compose" : "users");
    if (banners.some((b) => b.to === u.id)) { playChime(); buzz(); }
    const n = msgs.filter((m) => m.to === u.id && !m.read).length;
    const first = u.name.split(" ")[0], g = greet(Date.now())[0];
    const hi = fresh ? `${g}, ${first}. Welcome to Meetings. Your account is ready.` : `${g}, ${first}. ${n ? `You have ${n} new message${n > 1 ? "s" : ""}.` : "Welcome back."}`;
    flash(hi);
    if (u.role === "client" && pendingFor(u.id)) prompt(u.id); else setTimeout(() => speak(hi), 600);
  };
  const keep = () => { if (remember) { store.set("remember", { email: auth.email.trim(), pass: auth.pass }); store.del("rememberOff"); } else { store.del("remember"); store.set("rememberOff", true); } };
  const login = () => {
    const id = auth.email.trim().toLowerCase();
    if (id === MANAGER.username && auth.pass === MANAGER.pass) { keep(); return enter(MANAGER); }
    const u = users.find((x) => x.email === id && x.pass === auth.pass);
    if (!u) return setErr("Email or password is incorrect.");
    if (u.status) return setErr(u.status === "blocked" ? "This account is blocked. Contact your manager." : "This account has been removed. Contact your manager.");
    keep(); enter(u);
  };
  const check = (d) => {
    const email = d.email.trim().toLowerCase();
    if (!d.name.trim() || !email || !d.pass) return "Fill in the name, email and password.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email address.";
    if (d.pass.length < 6) return "Password must be at least 6 characters.";
    const dup = users.find((u) => u.email === email);
    if (dup) return dup.status ? "This email can’t be used to register. Contact your manager." : "That email is already registered.";
    return "";
  };
  const register = () => {
    const e = check(auth); if (e) return setErr(e);
    const u = { id: Date.now(), name: auth.name.trim(), org: auth.org.trim() || "Independent", email: auth.email.trim().toLowerCase(), pass: auth.pass, role: "client" };
    setUsers((x) => [...x, u]); keep(); enter(u, true);
  };
  const logout = () => { setAuth(saved()); setUser(null); setChat(null); setDraft(""); setOverlay(null); setMode("login"); setErr(""); try { speechSynthesis.cancel(); } catch (e) {} };

  const bioLogin = async () => {
    const u = bioId === MANAGER.id ? MANAGER : users.find((x) => x.id === bioId);
    if (!u) { store.del("bioUser"); setBioId(null); return setErr("That account is no longer available. Log in with your password."); }
    if (u.status) return setErr(u.status === "blocked" ? "This account is blocked. Contact your manager." : "This account has been removed. Contact your manager.");
    if (await bioAsk("Log in to Meetings")) enter(u, false, true); else setErr("Fingerprint not recognised. Use your password instead.");
  };
  const bioEnable = async () => {
    if (await bioAsk("Confirm to turn on fingerprint login")) { store.set("bioUser", user.id); setBioId(user.id); setOfferBio(false); flash("Fingerprint login is on for this account on this phone."); }
    else flash("Fingerprint login was not turned on.");
  };
  const bioOff = () => { store.del("bioUser"); setBioId(null); setOfferBio(false); flash("Fingerprint login turned off."); };

  /* Manager actions */
  const addUser = () => {
    const e = check(nu); if (e) return setErr(e);
    setUsers((x) => [...x, { id: Date.now(), name: nu.name.trim(), org: nu.org.trim() || "Independent", email: nu.email.trim().toLowerCase(), pass: nu.pass, role: nu.role }]);
    flash(`${nu.name.trim()} added as ${ROLE[nu.role]}`); setNu({ ...BLANK, role: "client" }); setErr(""); setAddOpen(false);
  };
  const setStatus = (id, status) => {
    setUsers((x) => x.map((u) => (u.id === id ? { ...u, status } : u)));
    if (status) setSel((s) => s.filter((c) => c !== id));
    setConfirm(null); flash(status === "blocked" ? "User blocked. They are locked out." : status === "deleted" ? "User deleted. They are locked out until restored." : "User restored. They can log in again.");
  };
  const cancelMeeting = (m) => {
    setMeetings((ms) => ms.map((x) => (x.id === m.id ? { ...x, cancelled: true } : x)));
    setBanners((b) => [...m.to.map((c) => ({ id: Math.random(), to: c, kind: "cancel", title: "Meeting cancelled", text: `${m.topic}, ${fmtDate(m.date)}` })), ...b]);
    setConfirm(null); flash("Meeting cancelled. Invitees are notified.");
  };

  /* Admin: send */
  const clients = users.filter((u) => u.role === "client" && !u.status);
  const valid = f.topic.trim() && f.date && f.time && (f.venue.trim() || f.link.trim()) && sel.length;
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const send = (d = f, ids = sel) => {
    const { repeat: kind, ...rest } = d;
    const base = { ...rest, topic: d.topic.trim(), venue: d.venue.trim(), link: d.link.trim(), agenda: d.agenda.trim(), to: ids, opt: { ...opt } };
    const count = kind === "weekly" ? 8 : kind === "monthly" ? 6 : 1, sid = Date.now();
    const list = Array.from({ length: count }, (_, i) => ({ ...base, id: sid + i, date: i ? shift(d.date, kind, i) : d.date, ...(count > 1 ? { series: sid, repeat: kind, n: i + 1, of: count } : {}) }));
    setMeetings((x) => [...list, ...x]);
    runAlert(list[0], opt); setPop((n) => n + 1);
    flash(count > 1 ? `Sent ${count} ${kind} meetings to ${ids.length} client${ids.length > 1 ? "s" : ""}` : `Sent to ${ids.length} client${ids.length > 1 ? "s" : ""}`);
    setF(BLANKF); setSel([]); setTab("sent");
  };

  /* Client: reply */
  const pendingFor = (cid, rs = rsvp) => meetings.find((m) => !m.cancelled && m.to.includes(cid) && !rs[`${m.id}-${cid}`] && (!m.series || m.n === 1));
  const prompt = (cid) => {
    const m = pendingFor(cid);
    if (m) { setDeclining(false); setReason(""); setOverlay(m.id); runAlert(m, m.opt); }
  };
  const answer = (m, s, why = "") => {
    const nr = { ...rsvp, [`${m.id}-${uid}`]: { s, reason: why.trim() } };
    setRsvp(nr);
    const nx = overlay ? pendingFor(uid, nr) : null;
    setOverlay(nx ? nx.id : null); setDeclining(false); setReason("");
    if (s === "yes") setPop((n) => n + 1);
    flash(s === "yes" ? `Confirmed. You’ll be reminded ${remText(m)} minutes before.` : "Noted. The admin knows you can’t attend.");
  };
  const until = (m) => {
    const mins = Math.round((startOf(m) - now) / 60000);
    if (mins <= 0) return "Started";
    if (mins < 60) return `Starts in ${mins} min`;
    const h = Math.floor(mins / 60);
    return h < 24 ? `Starts in ${h}h ${mins % 60}m` : null;
  };
  const preview = (m) => { flash("Previewing your reminders"); [...remOf(m)].sort((a, b) => b - a).forEach((t, i) => setTimeout(() => remind(m, t), i * 6000)); };

  const [gt, GIcon] = greet(now);
  const everyone = [MANAGER, ...users];
  const who = (id) => everyone.find((u) => u.id === id);
  const contacts = users.filter((u) => u.id !== uid && !u.status);
  const myMsgs = msgs.filter((m) => m.from === uid || m.to === uid);
  const threads = [...new Set(myMsgs.map((m) => (m.from === uid ? m.to : m.from)))].map((pid) => {
    const list = myMsgs.filter((m) => m.from === pid || m.to === pid);
    return { p: who(pid), last: list[list.length - 1], unread: list.filter((m) => m.to === uid && !m.read).length };
  }).filter((x) => x.p).sort((a, b) => b.last.at - a.last.at);
  const unreadAll = msgs.filter((m) => m.to === uid && !m.read && who(m.from)).length;
  const sendMsg = () => {
    const text = draft.trim();
    if (!text || typeof chat !== "number") return;
    setMsgs((x) => [...x, { id: Date.now() + Math.random(), from: uid, to: chat, text, at: Date.now(), read: false }]);
    setBanners((b) => [{ id: Math.random(), to: chat, from: uid, kind: "msg", title: `New message from ${user.name}`, text: text.length > 70 ? text.slice(0, 70) + "…" : text }, ...b]);
    setDraft("");
  };
  const sendAll = () => {
    const text = draft.trim(); if (!text) return;
    const at = Date.now(), tos = users.filter((u) => u.id !== uid), body = "Announcement: " + text;
    setMsgs((x) => [...x, ...tos.map((u) => ({ id: at + Math.random(), from: uid, to: u.id, text: body, at, read: false }))]);
    setBanners((b) => [...tos.map((u) => ({ id: Math.random(), to: u.id, from: uid, kind: "msg", title: `Announcement from ${user.name}`, text: text.length > 70 ? text.slice(0, 70) + "…" : text })), ...b]);
    setDraft(""); setChat(null); flash(`Sent to ${tos.length} ${tos.length === 1 ? "person" : "people"}`);
  };
  const reschedule = (m) => {
    const r = resch; if (!r || !r.date || !r.time || !(r.venue.trim() || m.link)) return;
    const was = `${fmtDate(m.date)}, ${fmtTime(m.time)}`, now2 = `${fmtDate(r.date)}, ${fmtTime(r.time)}`;
    setMeetings((ms) => ms.map((x) => (x.id === m.id ? { ...x, date: r.date, time: r.time, venue: r.venue.trim(), moved: true } : x)));
    setRsvp((rs) => { const n = { ...rs }; m.to.forEach((c) => delete n[`${m.id}-${c}`]); return n; });
    [...fired.current].forEach((k) => { if (k.startsWith(`${m.id}-`)) fired.current.delete(k); }); saveFired();
    setBanners((b) => [...m.to.map((c) => ({ id: Math.random(), to: c, kind: "move", title: "Meeting rescheduled", text: `${m.topic}. Was ${was}. Now ${now2}. Please reply again.` })), ...b]);
    setResch(null); flash("Rescheduled. Invitees are alerted and asked to reply again.");
  };
  const winOpen = (m) => { const d = (now - startOf(m)) / 60000; return d >= -30 && d <= 180; };
  const checkIn = (m) => { setCheckins((c) => ({ ...c, [`${m.id}-${uid}`]: Date.now() })); setPop((n) => n + 1); flash("Checked in. Thank you!"); };
  const repRows = clients.map((c) => {
    const ms = meetings.filter((m) => !m.cancelled && m.to.includes(c.id)), r = (m) => rsvp[`${m.id}-${c.id}`];
    return { c, inv: ms.length, yes: ms.filter((m) => r(m)?.s === "yes").length, no: ms.filter((m) => r(m)?.s === "no").length, wait: ms.filter((m) => !r(m)).length, here: ms.filter((m) => checkins[`${m.id}-${c.id}`]).length };
  });
  const exportCsv = () => {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`, iso = (t) => (t ? new Date(t).toISOString() : "");
    const lines = [["Meeting", "Date", "Time", "Venue or link", "Person", "Organisation", "Reply", "Reason", "Delivered", "Opened", "Checked in"].map(q).join(",")];
    meetings.forEach((m) => m.to.forEach((cid) => {
      const c = users.find((u) => u.id === cid); if (!c) return;
      const k = `${m.id}-${cid}`, r = rsvp[k], sn = seen[k];
      lines.push([m.topic, m.date, m.time, m.venue || m.link || "", c.name, c.org, m.cancelled ? "Cancelled" : r ? (r.s === "yes" ? "Attending" : "Not attending") : "Awaiting", r?.reason || "", iso(sn?.d), iso(sn?.o), iso(checkins[k])].map(q).join(","));
    }));
    const csv = lines.join("\r\n");
    try { if (navigator.share) { navigator.share({ title: "Attendance report", text: csv }).catch(() => {}); return; } } catch (e) {}
    try { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv" })); a.download = "meetings-attendance.csv"; document.body.appendChild(a); a.click(); a.remove(); flash("Report downloaded"); }
    catch (e) { try { navigator.clipboard.writeText(csv); flash("Report copied to clipboard"); } catch (e2) {} }
  };
  /* Voice: the admin speaks a meeting; a client answers an invitation by voice */
  const hear = async (prompt) => { setListening("speaking"); await say(prompt); setListening("listening"); const r = await listen(); setListening(""); return r; };
  const voiceSchedule = async () => {
    if (VOICE) return; VOICE = true;
    try {
      const d = { ...f }; let ids = [...sel];
      const merge = (p) => { if (p.topic) d.topic = p.topic; if (p.date) d.date = p.date; if (p.time) d.time = p.time; if (p.venue) d.venue = p.venue; if (p.ids) ids = p.ids; setF({ ...d }); setSel([...ids]); };
      const need = () => (!d.topic.trim() ? "topic" : !d.date ? "date" : !d.time ? "time" : !(d.venue.trim() || d.link.trim()) ? "venue" : !ids.length ? "who" : "");
      const first = await hear("Tell me about the meeting. For example: schedule a budget review on Friday at 3 PM in Boardroom 2 for everyone.");
      if (!first) { flash("I didn’t catch that. Tap the mic and try again."); return; }
      merge(parseMeeting(first, clients));
      for (let i = 0; i < 8 && need(); i++) {
        const k = need();
        const a = await hear({ topic: "What is the meeting about?", date: "Which day?", time: "What time?", venue: "Where will it be?", who: "Who should I invite? Say everyone, or say their names." }[k]);
        if (!a) { flash("I didn’t hear anything. Tap the mic to continue."); return; }
        if (k === "topic") { const t = cleanTopic(a) || a.trim(); merge({ topic: t.charAt(0).toUpperCase() + t.slice(1) }); }
        else if (k === "date") { const x = parseDate(a); if (x) merge({ date: x.date }); else await say("Sorry, I didn’t understand the day."); }
        else if (k === "time") { const x = parseTime(a, true); if (x) merge({ time: x.time }); else await say("Sorry, I didn’t understand the time."); }
        else if (k === "venue") merge({ venue: /\b(online|virtual|zoom|google meet|teams)\b/i.test(a) ? "Online" : a.trim().replace(/^(?:at|in)\s+(?:the\s+)?/i, "").replace(/^./, (c) => c.toUpperCase()) });
        else { const x = parseWho(a, clients); if (x) merge({ ids: x.ids }); else await say("Sorry, I didn’t catch any names."); }
      }
      if (need()) { flash("Some details are still missing. Please fill them in."); return; }
      const ok = await hear(`${d.topic}, ${fmtDate(d.date)} at ${fmtTime(d.time)}, ${d.venue || "online"}, for ${ids.length} ${ids.length === 1 ? "client" : "clients"}. Say send to send it, or cancel.`);
      if (/\b(send|yes|confirm|go ahead|okay|ok)\b/i.test(ok) && !/\b(don'?t|cancel|no)\b/i.test(ok)) send(d, ids);
      else flash("Check the details, then tap Send.");
    } finally { VOICE = false; setListening(""); }
  };
  const voiceReply = async (m) => {
    if (VOICE) return; VOICE = true;
    try {
      let a = await hear(`${m.topic}, ${fmtDate(m.date)} at ${fmtTime(m.time)}, ${where(m)}. Will you attend? Say yes or no.`);
      for (let i = 0; i < 2 && a && !isNo(a) && !isYes(a); i++) a = await hear("Sorry, please say yes or no.");
      if (!a) { flash("I didn’t hear a reply. Tap the mic to try again, or use the buttons."); return; }
      if (isNo(a)) { const why = await hear("Okay. Say your reason, or say skip."); answer(m, "no", why && !/^\W*(skip|none|nothing|no)\W*$/i.test(why) ? why : ""); await say("Noted. The admin will be told."); }
      else if (isYes(a)) { answer(m, "yes"); await say("Thank you. You are marked as attending."); }
      else flash("I couldn’t tell. Please use the buttons.");
    } finally { VOICE = false; setListening(""); }
  };
  const micLabel = listening === "listening" ? "Listening…" : listening === "speaking" ? "Speaking…" : "";
  const ovm = meetings.find((m) => m.id === overlay);
  const mine = meetings.filter((m) => m.to.includes(uid));
  const pend = mine.filter((m) => !m.cancelled && !rsvp[`${m.id}-${uid}`]).length;
  const active = meetings.filter((m) => !m.cancelled);
  const awaiting = active.reduce((n, m) => n + m.to.filter((c) => !rsvp[`${m.id}-${c}`] && !users.find((u) => u.id === c)?.status).length, 0);

  const shared = (
    <>
      {toast && <div className="toast" role="status"><Check size={18} /> {toast}</div>}
      {pop > 0 && <div className="conf" key={pop} aria-hidden="true">{[...Array(26)].map((_, i) => (
        <s key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.08}s`, background: ["#5B3DF5", "#14C99A", "#FF5C7A", "#FFB020", "#2D9CFF"][i % 5] }} />
      ))}</div>}
    </>
  );

  /* ---------- Login / Register ---------- */
  if (!user) {
    const set = (k) => (e) => setAuth({ ...auth, [k]: e.target.value });
    const reg = mode === "register";
    return (
      <div className="mt">
        <style>{css}</style>{shared}
        <header className="h-admin">
          <div className="hero">
            <div className="logo big"><Bell size={30} /></div>
            <div className="hello big"><GIcon size={17} /> {gt}. Welcome</div>
            <h1>Meetings</h1>
            <div className="sub">Never miss a meeting again</div>
          </div>
          <div className="seg" role="tablist">
            <i style={{ transform: reg ? "translateX(100%)" : "translateX(0)" }} />
            <button className={!reg ? "on" : ""} onClick={() => { setMode("login"); setErr(""); }}>Log in</button>
            <button className={reg ? "on" : ""} onClick={() => { setMode("register"); setErr(""); }}>Register</button>
          </div>
        </header>
        <main>
          <div className="wel">
            <h2>{reg ? "Create your account" : "Welcome back"}</h2>
            <p>{reg ? "Join in seconds and never miss a meeting." : "Log in to see your meetings and messages."}</p>
            <i />
          </div>
          {!reg && bioOk && bioId && (
            <>
              <button className="go" style={{ marginTop: 0 }} onClick={bioLogin}><Fingerprint size={20} /> Log in with fingerprint</button>
              <div className="hint" style={{ marginBottom: 14 }}>or use your email and password</div>
            </>
          )}
          {reg && <Field icon={User} aria-label="Full name" value={auth.name} onChange={set("name")} placeholder="Full name" autoComplete="name" />}
          {reg && <Field icon={Building2} aria-label="Organisation" value={auth.org} onChange={set("org")} placeholder="Organisation (optional)" />}
          <Field icon={Mail} aria-label={reg ? "Email" : "Email or username"} type={reg ? "email" : "text"} value={auth.email} onChange={set("email")} placeholder={reg ? "Email address" : "Email or username"} autoComplete={reg ? "email" : "username"} autoCapitalize="none" />
          <Field icon={Lock} aria-label="Password" type={show ? "text" : "password"} value={auth.pass} onChange={set("pass")} placeholder="Password" autoComplete={reg ? "new-password" : "current-password"}
            onKeyDown={(e) => e.key === "Enter" && (reg ? register() : login())}
            right={<button className="eye" onClick={() => setShow(!show)} aria-label="Show password">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
          <label className="rem-me"><input type="checkbox" checked={remember} onChange={(e) => { setRemember(e.target.checked); if (!e.target.checked) { store.del("remember"); store.set("rememberOff", true); } }} /> Remember my email and password on this phone</label>
          {err && <div className="err" role="alert">{err}</div>}
          <button className="go" style={{ marginTop: 8 }} onClick={reg ? register : login}>{reg ? <UserPlus size={19} /> : <Check size={19} />} {reg ? "Create account" : "Log in"}</button>
          {reg && <div className="hint">New accounts are clients. A manager can change that.</div>}
          <div className="crd"><b>Meetings™</b> · Created by {CREDIT}™ · 0979566905<br />© 2026 {CREDIT}. All rights reserved.</div>
        </main>
      </div>
    );
  }

  if (locked) return (
    <div className="mt">
      <style>{css}</style>{shared}
      <header className="h-manager"><div className="hero"><div className="logo big"><Ban size={30} /></div><h1>Meetings</h1><div className="sub">Access is switched off</div></div></header>
      <main>
        <div className="empty">
          <div className="bub"><Ban size={30} /></div>
          <b>{me?.status === "blocked" ? "Your account is blocked" : "Your account has been removed"}</b>
          <p>You can’t use Meetings with this account until your manager restores it. Contact your manager for help.</p>
          <button className="go" onClick={logout}><LogOut size={18} /> Log out</button>
        </div>
        <div className="crd"><b>Meetings™</b> · Created by {CREDIT}™ · 0979566905<br />© 2026 {CREDIT}. All rights reserved.</div>
      </main>
    </div>
  );

  /* ---------- Shared meeting list for admin and manager ---------- */
  const sentList = (canCancel) => meetings.length === 0 ? (
    <div className="empty"><div className="bub"><Send size={30} /></div><b>No meetings yet</b><p>Meetings the admin sends will appear here.</p></div>
  ) : meetings.map((m) => {
    const st = (c) => rsvp[`${m.id}-${c}`];
    const inv = m.to.map((c) => users.find((u) => u.id === c)).filter((c) => c && !c.status);
    const yes = inv.filter((c) => st(c.id)?.s === "yes").length;
    const no = inv.filter((c) => st(c.id)?.s === "no").length;
    const wait = inv.length - yes - no;
    const isOpen = open === m.id;
    return (
      <div key={m.id}>
        <Ticket m={m} tone={m.cancelled ? "grey" : "violet"}>
          {m.cancelled ? <div style={{ marginTop: 8 }}><span className="chip no">Cancelled</span></div>
            : inv.length === 0 ? <div className="cap" style={{ margin: "8px 0 0" }}>No one invited</div>
            : (
              <button className="foot" onClick={() => setOpen(isOpen ? null : m.id)} aria-expanded={isOpen}>
                <Donut yes={yes} no={no} total={inv.length} />
                <div className="chips"><span className="chip ok">{yes} in</span><span className="chip no">{no} out</span><span className="chip wait">{wait} waiting</span>{inv.some((c) => checkins[`${m.id}-${c.id}`]) && <span className="chip">{inv.filter((c) => checkins[`${m.id}-${c.id}`]).length} here</span>}</div>
                <ChevronDown size={20} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
              </button>
            )}
        </Ticket>
        {isOpen && !m.cancelled && (
          <div className="panel">
            {inv.map((c) => { const r = st(c.id), sn = seen[`${m.id}-${c.id}`], ck = checkins[`${m.id}-${c.id}`]; return (
              <div className="who" key={c.id}>
                <Avatar c={c} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}><b>{c.name}</b>{r?.reason && <div className="cap" style={{ margin: 0 }}>“{r.reason}”</div>}<div className="cap" style={{ margin: 0 }}>{[sn?.o ? "Opened " + stamp(sn.o) : sn?.d ? "Delivered " + stamp(sn.d) : "Not delivered yet", ck && "Checked in " + stamp(ck)].filter(Boolean).join(" · ")}</div></div>
                <span className={"chip " + (r ? (r.s === "yes" ? "ok" : "no") : "wait")}>{r ? (r.s === "yes" ? "Attending" : "Not attending") : "Awaiting"}</span>
              </div>
            ); })}
            <div className="cap" style={{ margin: "10px 0 0" }}>Everyone who hasn’t declined is reminded automatically {remText(m)} minutes before.</div>
            <div className="fld" style={{ background: "var(--bg)", marginTop: 10 }}><FileText size={18} /><input aria-label="Minutes" value={m.minutes || ""} onChange={(e) => setMeetings((ms) => ms.map((x) => (x.id === m.id ? { ...x, minutes: e.target.value } : x)))} placeholder="Minutes or notes (clients can read)" /></div>
            {resch?.id === m.id ? (
              <div className="card2" style={{ margin: "10px 0 0", background: "var(--bg)" }}>
                <div className="two">
                  <div className="fld" style={{ background: "#fff" }}><Calendar size={18} /><input aria-label="New date" type="date" value={resch.date} onChange={(e) => setResch({ ...resch, date: e.target.value })} /></div>
                  <div className="fld" style={{ background: "#fff" }}><Clock size={18} /><input aria-label="New time" type="time" value={resch.time} onChange={(e) => setResch({ ...resch, time: e.target.value })} /></div>
                </div>
                <div className="fld" style={{ background: "#fff" }}><MapPin size={18} /><input aria-label="New venue" value={resch.venue} onChange={(e) => setResch({ ...resch, venue: e.target.value })} placeholder="Venue" /></div>
                <button className="go" style={{ marginTop: 4 }} disabled={!resch.date || !resch.time || !(resch.venue.trim() || m.link)} onClick={() => reschedule(m)}><Check size={18} /> Save and notify everyone</button>
                <button className="remind" style={{ background: "var(--mute)" }} onClick={() => setResch(null)}>Never mind</button>
              </div>
            ) : (
              <button className="remind" style={{ marginTop: 10 }} onClick={() => setResch({ id: m.id, date: m.date, time: m.time, venue: m.venue || "" })}><Pencil size={16} /> Reschedule</button>
            )}
          </div>
        )}
        {canCancel && !m.cancelled && (
          <button className={"cancel" + (confirm === m.id ? " sure" : "")} onClick={() => (confirm === m.id ? cancelMeeting(m) : ask(m.id))}>
            <Ban size={16} />{confirm === m.id ? "Tap again to cancel for everyone" : "Cancel meeting"}
          </button>
        )}
      </div>
    );
  });

  const heading = tab === "chat" ? ["Messages", unreadAll ? `${unreadAll} unread` : "Chat with anyone on the team"] : user.role === "client" ? ["Your invitations", pend ? `${pend} waiting for your reply` : "You’re all caught up"]
    : user.role === "manager" ? (tab === "users" ? ["People", "Add or remove users"] : ["All meetings", "Monitor replies or cancel"])
    : tab === "compose" ? ["Plan a meeting", "Invite your clients in a minute"] : ["Replies", "See who’s coming"];

  return (
    <div className="mt">
      <style>{css}</style>{shared}
      <div className="bns" aria-live="polite">
        {banners.filter((b) => b.to === uid).slice(0, 3).map((b) => (
          <div key={b.id} className={"bn " + (b.kind === "cancel" ? "gone" : b.kind === "msg" ? "msgb" : "")}>{b.kind === "msg" ? <MessageCircle size={22} /> : <BellRing size={22} />}<div onClick={b.kind === "msg" ? () => { setTab("chat"); setChat(b.from); } : undefined} style={b.kind === "msg" ? { cursor: "pointer" } : undefined}><b>{b.title}</b>{b.text}</div>
            <button aria-label="Dismiss" onClick={() => setBanners((x) => x.filter((y) => y.id !== b.id))}><X size={16} /></button></div>
        ))}
      </div>

      {ovm && user.role === "client" && (
        <div className="ov" role="alertdialog" aria-modal="true" aria-label="Meeting invitation">
          <div className="ovc">
            <div className="ring"><BellRing size={32} color="#fff" /></div>
            <h1>You’re invited</h1>
            <div className="lead">Please let the admin know if you’ll be there.</div>
            <Ticket m={ovm} tone="sun">{ovm.notes && <div className="tk-line" style={{ fontStyle: "italic" }}>{ovm.notes}</div>}</Ticket>
            {!declining ? (
              <>
                <button className="big yes" onClick={() => answer(ovm, "yes")}><Check size={20} /> I will attend</button>
                <button className="big no" onClick={() => setDeclining(true)}><X size={20} /> I can’t attend</button>
                {canListen() && <button className="big no" disabled={!!listening} onClick={() => voiceReply(ovm)}><Mic size={20} /> {micLabel || "Reply by voice"}</button>}
                <button className="link" onClick={() => runAlert(ovm, { sound: true, voice: true, vibrate: true })}>Replay voice</button>
              </>
            ) : (
              <>
                <div className="fld"><textarea rows={2} aria-label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (optional), e.g. travelling" /></div>
                <button className="big no" onClick={() => answer(ovm, "no", reason)}>Confirm: not attending</button>
                <button className="link" onClick={() => setDeclining(false)}>Back</button>
              </>
            )}
            <div className="small">A reply is needed. This alert repeats until you answer.</div>
          </div>
        </div>
      )}

      <header className={"h-" + user.role}>
        <div className="hello"><GIcon size={15} /> {gt}, {user.name.split(" ")[0]}</div>
        <div className="top"><div className="logo"><Bell size={22} /></div><div><h1>{heading[0]}</h1><div className="sub">{heading[1]}</div></div></div>
        <div className="ubar">
          <Avatar c={user} size={38} />
          <div className="who2"><b>{user.name}</b><small>{ROLE[user.role]} · {user.org}</small></div>
          {bioOk && <button aria-label={bioId === user.id ? "Turn off fingerprint login" : "Turn on fingerprint login"} title={bioId === user.id ? "Fingerprint login is on" : "Turn on fingerprint login"} onClick={bioId === user.id ? bioOff : bioEnable} style={bioId === user.id ? { background: "#fff", color: "var(--vio)" } : undefined}><Fingerprint size={16} /></button>}
          <button onClick={logout}><LogOut size={15} />Log out</button>
        </div>
      </header>

      <main>
        {offerBio && bioOk && (
          <div className="card2" style={{ marginTop: 0 }}>
            <b>Log in with your fingerprint next time?</b>
            <div className="cap" style={{ margin: "4px 0 10px" }}>Your password still works. This only turns it on for this phone.</div>
            <div className="acts" style={{ marginTop: 0 }}>
              <button className="yes" onClick={bioEnable}><Fingerprint size={16} />Turn on</button>
              <button onClick={() => setOfferBio(false)}>Not now</button>
            </div>
          </div>
        )}
        {tab === "chat" && (chat === null ? (
          <>
            <button className="go" style={{ marginTop: 0, marginBottom: 16 }} onClick={() => setChat("new")}><Send size={18} /> New message</button>
            {user.role !== "client" && <button className="remind" style={{ marginTop: -6, marginBottom: 16 }} onClick={() => { setChat("all"); setDraft(""); }}><Megaphone size={16} /> Announce to everyone</button>}
            {threads.length === 0 && <div className="empty"><div className="bub"><MessageCircle size={30} /></div><b>No messages yet</b><p>Start a conversation with anyone on the team.</p></div>}
            {threads.map((x) => (
              <button className="conv" key={x.p.id} onClick={() => setChat(x.p.id)}>
                <Avatar c={x.p} size={46} />
                <div style={{ flex: 1, minWidth: 0 }}><b>{x.p.name}</b><div className="pv">{x.last.from === uid ? "You: " : ""}{x.last.text}</div></div>
                <div style={{ textAlign: "right" }}><div className="tm">{stamp(x.last.at)}</div>{x.unread > 0 && <span className="cnt">{x.unread}</span>}</div>
              </button>
            ))}
          </>
        ) : chat === "all" ? (
          <>
            <div className="chead"><button className="back" onClick={() => setChat(null)} aria-label="Back"><ArrowLeft size={20} /></button><b>Announce to everyone</b></div>
            <div className="cap">One message to all {contacts.length} {contacts.length === 1 ? "person" : "people"}. Each is alerted.</div>
            <div className="fld"><Megaphone size={18} /><input aria-label="Announcement" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendAll()} placeholder="Write your announcement" /></div>
            <button className="go" style={{ marginTop: 8 }} disabled={!draft.trim() || contacts.length === 0} onClick={sendAll}><Megaphone size={18} /> Send to everyone</button>
          </>
        ) : chat === "new" ? (
          <>
            <div className="chead"><button className="back" onClick={() => setChat(null)} aria-label="Back"><ArrowLeft size={20} /></button><b>Choose who to message</b></div>
            {contacts.length === 0 && <div className="empty">No one else is registered yet.</div>}
            {contacts.map((c) => (
              <button className="conv" key={c.id} onClick={() => setChat(c.id)}>
                <Avatar c={c} size={44} /><div style={{ flex: 1, minWidth: 0 }}><b>{c.name}</b><div className="pv">{ROLE[c.role]} · {c.org}</div></div>
              </button>
            ))}
          </>
        ) : !who(chat) ? (
          <div className="empty">This user is no longer available.<br /><button className="lnk" style={{ border: 0, background: "none", color: "var(--vio)", fontWeight: 700, marginTop: 10 }} onClick={() => setChat(null)}>Back to messages</button></div>
        ) : (
          <>
            <div className="chead">
              <button className="back" onClick={() => setChat(null)} aria-label="Back"><ArrowLeft size={20} /></button>
              <Avatar c={who(chat)} size={40} /><div><b>{who(chat).name}</b><div className="cap" style={{ margin: 0 }}>{ROLE[who(chat).role]}</div></div>
            </div>
            <div className="thread">
              {myMsgs.filter((m) => m.from === chat || m.to === chat).length === 0 && <div className="empty">Say hello to {who(chat).name.split(" ")[0]}.</div>}
              {myMsgs.filter((m) => m.from === chat || m.to === chat).map((m) => (
                <div key={m.id} className={"bub2 " + (m.from === uid ? "me" : "them")}>{m.text}<small>{stamp(m.at)}</small></div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="composer">
              <div className="fld"><input aria-label="Message" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMsg()} placeholder="Write a message" /></div>
              <button disabled={!draft.trim()} onClick={sendMsg} aria-label="Send message"><Send size={20} /></button>
            </div>
          </>
        ))}

        {user.role === "manager" && tab === "users" && (
          <>
            <div className="stats">
              <div className="stat"><b>{clients.length}</b><span>Clients</span></div>
              <div className="stat"><b>{active.length}</b><span>Meetings</span></div>
              <div className="stat"><b>{awaiting}</b><span>Awaiting reply</span></div>
            </div>
            <button className="remind" style={{ marginTop: 16 }} onClick={() => { setAddOpen(!addOpen); setErr(""); }}><UserPlus size={16} /> {addOpen ? "Close" : "Add a user"}</button>
            {addOpen && (
              <div className="card2">
                <Field icon={User} aria-label="Full name" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} placeholder="Full name" />
                <Field icon={Building2} aria-label="Organisation" value={nu.org} onChange={(e) => setNu({ ...nu, org: e.target.value })} placeholder="Organisation (optional)" />
                <Field icon={Mail} aria-label="Email" type="email" value={nu.email} onChange={(e) => setNu({ ...nu, email: e.target.value })} placeholder="Email address" />
                <Field icon={Lock} aria-label="Password" value={nu.pass} onChange={(e) => setNu({ ...nu, pass: e.target.value })} placeholder="Temporary password (6+ characters)" />
                <div className="seg lt">
                  <i style={{ transform: nu.role === "client" ? "translateX(0)" : "translateX(100%)" }} />
                  <button className={nu.role === "client" ? "on" : ""} onClick={() => setNu({ ...nu, role: "client" })}>Client</button>
                  <button className={nu.role === "admin" ? "on" : ""} onClick={() => setNu({ ...nu, role: "admin" })}>Admin</button>
                </div>
                {err && <div className="err" role="alert">{err}</div>}
                <button className="go" style={{ marginTop: 6 }} onClick={addUser}><UserPlus size={18} /> Add user</button>
              </div>
            )}
            <h2>Everyone · {users.length}</h2>
            {users.map((u) => (
              <div className="urow" key={u.id}>
                <Avatar c={u} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}><b>{u.name}</b><div className="cap" style={{ margin: 0, overflowWrap: "anywhere" }}>{u.email} · {u.org}</div></div>
                <span className={"chip" + (u.status ? " no" : u.role === "client" ? "" : " wait")}>{u.status === "deleted" ? "Deleted" : u.status === "blocked" ? "Blocked" : ROLE[u.role]}</span>
                {u.id !== uid && (u.status === "deleted" ? (
                  <button className="trash" style={{ background: "#D6F7EC", color: "#0A8F6B", padding: "0 12px" }} onClick={() => setStatus(u.id, undefined)}>Restore</button>
                ) : (
                  <>
                    <button className={"trash" + (confirm === "b" + u.id ? " sure" : "")} style={confirm === "b" + u.id ? undefined : u.status ? { background: "#D6F7EC", color: "#0A8F6B", padding: "0 12px" } : { background: "#FFEFCC", color: "#A86400" }}
                      aria-label={u.status ? `Unblock ${u.name}` : `Block ${u.name}`} onClick={() => (u.status ? setStatus(u.id, undefined) : confirm === "b" + u.id ? setStatus(u.id, "blocked") : ask("b" + u.id))}>
                      {u.status ? "Unblock" : confirm === "b" + u.id ? "Block" : <Ban size={18} />}
                    </button>
                    <button className={"trash" + (confirm === u.id ? " sure" : "")} aria-label={`Delete ${u.name}`} onClick={() => (confirm === u.id ? setStatus(u.id, "deleted") : ask(u.id))}>
                      {confirm === u.id ? "Delete" : <Trash2 size={18} />}
                    </button>
                  </>
                ))}
              </div>
            ))}
          </>
        )}

        {user.role === "manager" && tab === "meetings" && (
          <>
            <button className="remind" style={{ marginTop: 0, marginBottom: 14 }} onClick={() => setRepOpen(!repOpen)}><BarChart3 size={16} /> {repOpen ? "Hide report" : "Attendance report"}</button>
            {repOpen && (
              <div className="card2">
                <button className="remind" style={{ marginTop: 0 }} onClick={exportCsv}><Download size={16} /> Download or share list (CSV)</button>
                {repRows.length === 0 && <div className="cap" style={{ marginTop: 10 }}>No clients yet.</div>}
                {repRows.map((x) => (
                  <div className="who" key={x.c.id}>
                    <Avatar c={x.c} size={36} />
                    <div style={{ flex: 1, minWidth: 0 }}><b>{x.c.name}</b><div className="cap" style={{ margin: 0 }}>{x.inv} invited · {x.yes} yes · {x.no} no · {x.wait} no reply · {x.here} checked in</div></div>
                  </div>
                ))}
              </div>
            )}
            {sentList(true)}
          </>
        )}

        {user.role === "admin" && tab === "compose" && (
          <>
            {canListen() && <button className="remind" style={{ marginTop: 0, marginBottom: 14, background: listening ? "var(--coral)" : undefined }} disabled={!!listening} onClick={voiceSchedule}><Mic size={16} /> {micLabel || "Speak a meeting"}</button>}
            <div className="cap">Live preview of what clients will see</div>
            <Ticket m={f} />
            <h2>Details</h2>
            <div className="fld"><Type size={18} /><input aria-label="Topic" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="Meeting topic" /></div>
            <div className="two">
              <div className="fld"><Calendar size={18} /><input aria-label="Date" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
              <div className="fld"><Clock size={18} /><input aria-label="Time" type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div>
            </div>
            <div className="fld"><MapPin size={18} /><input aria-label="Venue" value={f.venue} onChange={(e) => setF({ ...f, venue: e.target.value })} placeholder="Venue (optional if online)" /></div>
            <div className="fld"><Video size={18} /><input aria-label="Online meeting link" type="url" autoCapitalize="none" value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="Online meeting link (optional)" /></div>
            <div className="fld"><Inbox size={18} /><input aria-label="Notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Notes (optional)" /></div>
            <div className="fld"><FileText size={18} /><input aria-label="Agenda" value={f.agenda} onChange={(e) => setF({ ...f, agenda: e.target.value })} placeholder="Agenda (optional)" /></div>

            <h2>Who’s invited · {sel.length}</h2>
            {clients.length === 0 && <div className="cap">No clients registered yet.</div>}
            <div className="ppl">
              <button className={"pp all" + (clients.length > 0 && sel.length === clients.length ? " on" : "")} onClick={() => setSel(sel.length === clients.length ? [] : clients.map((c) => c.id))}>
                <span className="av" style={{ width: 54, height: 54 }}><Users size={22} /></span>Everyone<span className="tick"><Check size={13} /></span>
              </button>
              {clients.map((c) => (
                <button key={c.id} className={"pp" + (sel.includes(c.id) ? " on" : "")} onClick={() => toggle(c.id)} aria-pressed={sel.includes(c.id)}>
                  <Avatar c={c} size={54} />{c.name.split(" ")[0]}<span className="tick"><Check size={13} /></span>
                </button>
              ))}
            </div>

            <h2>How should we alert them?</h2>
            <div className="tiles">
              {[["sound", Volume2, "Sound"], ["voice", Mic, "Voice"], ["vibrate", Vibrate, "Vibrate"]].map(([k, Icon, l]) => (
                <button key={k} className={"tile" + (opt[k] ? " on" : "")} onClick={() => setOpt({ ...opt, [k]: !opt[k] })} aria-pressed={opt[k]}><Icon size={24} />{l}</button>
              ))}
            </div>
            <h2>Remind them before the meeting</h2>
            <div className="rem">
              {[60, 30, 15, 10, 5].map((t) => (
                <button key={t} className={f.reminders.includes(t) ? "on" : ""} aria-pressed={f.reminders.includes(t)}
                  onClick={() => setF({ ...f, reminders: f.reminders.includes(t) ? (f.reminders.length > 1 ? f.reminders.filter((x) => x !== t) : f.reminders) : [...f.reminders, t] })}>{t} min</button>
              ))}
            </div>
            <h2>Repeat</h2>
            <div className="tiles">
              {[["none", Calendar, "Once"], ["weekly", Repeat, "Weekly"], ["monthly", Repeat, "Monthly"]].map(([k, Icon, l]) => (
                <button key={k} className={"tile" + (f.repeat === k ? " on" : "")} onClick={() => setF({ ...f, repeat: k })} aria-pressed={f.repeat === k}><Icon size={24} />{l}</button>
              ))}
            </div>
            {f.repeat !== "none" && <div className="hint" style={{ textAlign: "left" }}>Creates {f.repeat === "weekly" ? "8 weekly" : "6 monthly"} meetings, starting on the date above.</div>}
            <button className="go" disabled={!valid} onClick={() => send()}><Send size={19} /> Send invitation</button>
            {!valid && <div className="hint">Add a topic, date, time, a venue or online link, and at least one client.</div>}
          </>
        )}

        {user.role === "admin" && tab === "sent" && sentList(false)}

        {user.role === "client" && tab === "inbox" && (
          <>
            {mine.length === 0 && <div className="empty"><div className="bub"><Inbox size={30} /></div><b>No invitations yet</b><p>You’ll be alerted here when a meeting is shared with you.</p></div>}
            {mine.map((m) => {
              const r = rsvp[`${m.id}-${uid}`];
              const left = !m.cancelled && until(m);
              return (
                <Ticket key={m.id} m={m} tone={m.cancelled ? "grey" : r ? (r.s === "yes" ? "mint" : "coral") : "sun"}>
                  <div className="chips" style={{ marginTop: 8 }}>
                    <span className={"chip " + (m.cancelled ? "no" : r ? (r.s === "yes" ? "ok" : "no") : "wait")}>{m.cancelled ? "Cancelled" : r ? (r.s === "yes" ? "You’re attending" : "Not attending") : "Reply needed"}</span>
                    {left && <span className="chip">{left}</span>}
                    {checkins[`${m.id}-${uid}`] && <span className="chip ok">Checked in</span>}
                  </div>
                  {m.notes && <div className="cap" style={{ margin: "8px 0 0" }}>{m.notes}</div>}
                  {m.agenda && <div className="cap" style={{ margin: "6px 0 0" }}><b>Agenda:</b> {m.agenda}</div>}
                  {m.minutes && <div className="cap" style={{ margin: "6px 0 0" }}><b>Minutes:</b> {m.minutes}</div>}
                  {!m.cancelled && (
                    <div className="acts">
                      <button className={r?.s === "yes" ? "yes" : ""} onClick={() => answer(m, "yes")}><Check size={16} />Attend</button>
                      <button onClick={() => { setDeclining(true); setReason(""); setOverlay(m.id); }}><X size={16} />Can’t</button>
                      <button className="icon" onClick={() => runAlert(m, { sound: true, voice: true, vibrate: true })} aria-label="Replay alert"><Volume2 size={16} /></button>
                      <button className="icon" onClick={() => preview(m)} aria-label="Preview your reminders"><BellRing size={16} /></button>
                      {canListen() && <button className="icon" onClick={() => voiceReply(m)} disabled={!!listening} aria-label="Reply by voice"><Mic size={16} /></button>}
                    </div>
                  )}
                  {!m.cancelled && (
                    <div className="acts" style={{ marginTop: 8 }}>
                      <button onClick={() => openUrl(gcal(m))}><CalendarPlus size={16} />Calendar</button>
                      {m.venue && <button onClick={() => openUrl(mapUrl(m))}><MapPin size={16} />Map</button>}
                      {m.link && <button onClick={() => openUrl(safeLink(m.link))}><Video size={16} />Join</button>}
                    </div>
                  )}
                  {!m.cancelled && r?.s === "yes" && winOpen(m) && !checkins[`${m.id}-${uid}`] && (
                    <button className="remind" onClick={() => checkIn(m)}><MapPin size={16} /> I’m here</button>
                  )}
                </Ticket>
              );
            })}
          </>
        )}
        <div className="crd"><b>Meetings™</b> · Created by {CREDIT}™ · 0979566905<br />© 2026 {CREDIT}. All rights reserved.</div>
      </main>

      <nav>
        {user.role === "manager" && (
          <>
            <button className={tab === "users" ? "on" : ""} onClick={() => setTab("users")}><Users size={20} />Users</button>
            <button className={tab === "meetings" ? "on" : ""} onClick={() => setTab("meetings")}><Calendar size={19} />Meetings{active.length > 0 && <em>{active.length}</em>}</button>
          </>
        )}
        {user.role === "admin" && (
          <>
            <button className={tab === "compose" ? "on" : ""} onClick={() => setTab("compose")}><Plus size={20} />New</button>
            <button className={tab === "sent" ? "on" : ""} onClick={() => setTab("sent")}><Send size={19} />Replies{meetings.length > 0 && <em>{meetings.length}</em>}</button>
          </>
        )}
        {user.role === "client" && <button className={tab === "inbox" ? "on" : ""} onClick={() => setTab("inbox")}><Inbox size={20} />Inbox{pend > 0 && <em>{pend}</em>}</button>}
        <button className={tab === "chat" ? "on" : ""} onClick={() => { setTab("chat"); setChat(null); }}><MessageCircle size={19} />Chats{unreadAll > 0 && <em>{unreadAll}</em>}</button>
      </nav>
    </div>
  );
}
