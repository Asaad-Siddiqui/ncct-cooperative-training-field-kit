import QRCode from 'qrcode';
import './styles.css';
import './tour.css';
import { createGuidedTour } from './guided-tour.js';

const STORAGE_KEY = 'ncct-cooperative-training-field-kit:v1';
const SESSION_ID = 'batch-08-demo-session';
const ATTENDANCE_REQUIRED = 1;
const PASS_SCORE = 75;
const trainees = [
  { id: 'STU-24017', name: 'Samiksha Pawar', role: 'PACS trainee', institution: 'Maharashtra', initials: 'SP', tone: 'coral' },
  { id: 'STU-24023', name: 'Manoj Khatri', role: 'Cooperative secretary', institution: 'Rajasthan', initials: 'MK', tone: 'blue' },
  { id: 'STU-24031', name: 'Rukmini Soren', role: 'SHG member', institution: 'Odisha', initials: 'RS', tone: 'lilac' },
  { id: 'STU-24038', name: 'Imran Ansari', role: 'Dairy cooperative', institution: 'Madhya Pradesh', initials: 'IA', tone: 'gold' },
  { id: 'STU-24044', name: 'Lata Khandagale', role: 'PACS trainee', institution: 'Karnataka', initials: 'LK', tone: 'mint' },
  { id: 'STU-24052', name: 'Deepak Rathod', role: 'Rural youth', institution: 'Gujarat', initials: 'DR', tone: 'slate' }
];
const questions = [
  { prompt: 'Why does the field kit save attendance before a connection is available?', choices: ['A network may be unreliable at the training site', 'The portal is not allowed to count attendance', 'It prevents trainees from taking the lesson'], answer: 0 },
  { prompt: 'Who confirms a trainee when the QR card is unavailable?', choices: ['Any nearby trainee', 'The trainer, using the trainee ID', 'The certificate verifier'], answer: 1 },
  { prompt: 'What should happen when offline attendance is synced?', choices: ['Count every scan as a new visit', 'Replace all local activity', 'Deduplicate events before counting them'], answer: 2 },
  { prompt: 'When can this prototype issue a completion certificate?', choices: ['As soon as a trainee opens the course', 'After synced attendance and a synced passing quiz', 'Whenever a trainer presses a certificate button'], answer: 1 }
];
const initialState = {
  version: 1,
  online: true,
  view: 'overview',
  activeTraineeId: trainees[0].id,
  attendanceEvents: [],
  assessmentEvents: [],
  lessonRead: {},
  certificates: [],
  courseTab: 'active'
};
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || saved.version !== 1) return structuredClone(initialState);
    return { ...structuredClone(initialState), ...saved };
  } catch { return structuredClone(initialState); }
}
let state = loadState();
let toastTimer;
let scannerTimer;
let scanStream;

const icon = (name, size = 18) => {
  const common = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  const paths = {
    grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
    tablet: '<rect x="5" y="2.8" width="14" height="18.4" rx="2.2"/><path d="M10 18h4"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 5.5v16M8 7h8M8 10h7"/>',
    award: '<circle cx="12" cy="8.5" r="5.5"/><path d="m8.5 13-1 8 4.5-2.6 4.5 2.6-1-8"/>',
    users: '<path d="M16 20v-1.7a3.3 3.3 0 0 0-3.3-3.3H6.3A3.3 3.3 0 0 0 3 18.3V20"/><circle cx="9.5" cy="7" r="3.5"/><path d="M17 11a3.5 3.5 0 1 0-1.4-6.7M17.8 15h.1a3.1 3.1 0 0 1 3.1 3.1V20"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    wifi: '<path d="M5 9.5a11 11 0 0 1 14 0M8 12.5a6.5 6.5 0 0 1 8 0M11 15.5a2 2 0 0 1 2 0M12 19h.01"/>',
    cloud: '<path d="M7 18a4 4 0 1 1 .6-7.96A5.5 5.5 0 0 1 18 11.5a3.25 3.25 0 1 1 .75 6.5H7Z"/><path d="M12 12v5m-2-2 2 2 2-2"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v2M14 20h2M20 19v2M18 20h1"/>',
    check: '<path d="m5 12.5 4.2 4.2L19.5 6.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.2 4.2"/>',
    chevron: '<path d="m8 10 4 4 4-4"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    shield: '<path d="M12 22s8-3.8 8-10V5l-8-3-8 3v7c0 6.2 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    print: '<path d="M7 8V3h10v5M7 17H5a2 2 0 0 1-2-2v-4a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4a2 2 0 0 1-2 2h-2"/><path d="M7 14h10v7H7zM17 11h.01"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    spark: '<path d="m12 3 1.9 5.8L20 11l-6.1 2.1L12 19l-1.9-5.9L4 11l6.1-2.2L12 3ZM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z"/>'
  };
  return `<svg ${common}>${paths[name] || paths.grid}</svg>`;
};
const esc = (value = '') => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const person = id => trainees.find(item => item.id === id);
const pendingCount = () => state.attendanceEvents.filter(event => !event.synced).length + state.assessmentEvents.filter(event => !event.synced).length;
const syncedAttendance = id => state.attendanceEvents.filter(event => event.traineeId === id && event.sessionId === SESSION_ID && event.synced);
const latestAssessment = id => state.assessmentEvents.filter(event => event.traineeId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
const currentCertificate = id => state.certificates.find(certificate => certificate.traineeId === id);
const isLessonRead = id => Boolean(state.lessonRead[id]);
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function setToast(message, kind = 'success') {
  const el = document.querySelector('#toast');
  el.className = `toast show ${kind}`;
  el.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
}
function setView(view) {
  state.view = view;
  if (new URLSearchParams(location.search).has('verify')) {
    history.replaceState({}, '', location.pathname);
  }
  save();
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function setActiveTrainee(id) {
  if (!person(id)) return;
  state.activeTraineeId = id;
  save();
  render();
}
function setConnection(online) {
  state.online = online;
  save();
  render();
  if (online) {
    const waiting = pendingCount();
    setToast(waiting ? `Connection restored · ${waiting} item${waiting === 1 ? '' : 's'} waiting to sync` : 'Connection restored · all caught up');
  } else setToast('Field kit is offline · new activity will queue on this device');
}
function recordAttendance(id, source = 'trainer ID') {
  const trainee = person(id);
  if (!trainee) { setToast('Trainee ID not found · check the card and try again', 'error'); return; }
  if (state.attendanceEvents.some(event => event.traineeId === id && event.sessionId === SESSION_ID)) {
    setToast(`${trainee.name} is already checked in · duplicate not counted`, 'error');
    return;
  }
  const event = {
    id: crypto.randomUUID(), traineeId: id, sessionId: SESSION_ID,
    source, createdAt: new Date().toISOString(), synced: state.online
  };
  state.attendanceEvents.unshift(event);
  state.activeTraineeId = id;
  save();
  render();
  setToast(state.online ? `${trainee.name} checked in · visible in portal` : `${trainee.name} checked in · saved on this device`);
}
function markLessonRead() {
  state.lessonRead[state.activeTraineeId] = true;
  save();
  render();
  setToast('Lesson marked complete · knowledge check is ready');
}
function submitQuiz(form) {
  if (!isLessonRead(state.activeTraineeId)) { setToast('Mark the lesson as read before starting the check', 'error'); return; }
  const data = new FormData(form);
  const answers = questions.map((_, index) => Number(data.get(`q${index}`)));
  if (answers.some(value => !Number.isInteger(value))) { setToast('Choose an answer for each question', 'error'); return; }
  const correct = answers.reduce((sum, answer, index) => sum + (answer === questions[index].answer ? 1 : 0), 0);
  const score = Math.round(correct / questions.length * 100);
  const event = {
    id: crypto.randomUUID(), traineeId: state.activeTraineeId, score, correct,
    total: questions.length, answers, createdAt: new Date().toISOString(), synced: state.online
  };
  state.assessmentEvents = state.assessmentEvents.filter(item => item.traineeId !== state.activeTraineeId);
  state.assessmentEvents.unshift(event);
  save();
  render();
  setToast(state.online ? `Knowledge check saved · ${score}%` : `Knowledge check saved locally · ${score}% pending sync`, score >= PASS_SCORE ? 'success' : 'error');
  if (event.synced) maybeIssueCertificate(event.traineeId);
}
function maybeIssueCertificate(id) {
  if (currentCertificate(id)) return false;
  const attended = syncedAttendance(id).length >= ATTENDANCE_REQUIRED;
  const assessment = latestAssessment(id);
  const passed = assessment?.synced && assessment.score >= PASS_SCORE;
  if (!attended || !passed) return false;
  const trainee = person(id);
  const certificate = {
    id: `NCCT-CT-2026-${id.replace('STU-', '')}`,
    traineeId: id, traineeName: trainee.name,
    course: 'Digital records for stronger cooperatives',
    issuedAt: new Date().toISOString(), verified: true
  };
  state.certificates.unshift(certificate);
  save();
  return true;
}
async function syncNow() {
  if (!state.online) { setToast('Connect the field kit before syncing', 'error'); return; }
  if (pendingCount() === 0) { setToast('Everything is already synced'); return; }
  const button = document.querySelector('#syncButton');
  if (button) { button.disabled = true; button.innerHTML = `${icon('cloud', 16)} Syncing…`; }
  const pending = [
    ...state.attendanceEvents.filter(event => !event.synced).map(event => ({ type: 'attendance', event })),
    ...state.assessmentEvents.filter(event => !event.synced).map(event => ({ type: 'assessment', event }))
  ].sort((a, b) => a.event.createdAt.localeCompare(b.event.createdAt));
  for (const item of pending) {
    await new Promise(resolve => setTimeout(resolve, 320));
    const store = item.type === 'attendance' ? state.attendanceEvents : state.assessmentEvents;
    const original = store.find(event => event.id === item.event.id);
    if (original && !original.synced) original.synced = true;
  }
  const newlyIssued = [];
  trainees.forEach(trainee => { if (maybeIssueCertificate(trainee.id)) newlyIssued.push(trainee.name); });
  save();
  render();
  setToast(newlyIssued.length ? `Sync complete · certificate issued for ${newlyIssued.join(', ')}` : `Sync complete · ${pending.length} item${pending.length === 1 ? '' : 's'} moved to the portal`);
}
function renderAppShell() {
  const active = state.view;
  const titleMap = { overview: ['Training workspace', 'One cohort · one field device · a clearer training record'], fieldkit: ['Field kit', 'Capture attendance at the training site, even without a network'], lesson: ['Lesson & quiz', 'A short, practical learning check for this cohort'], courses: ['Courses & cohorts', 'Keep the first demo focused on one active training cohort'], certificates: ['Certificates', 'Issue on configured criteria, then verify the record'] };
  const [heading, subheading] = titleMap[active] || titleMap.overview;
  return `<div class="app-shell">
    <aside class="sidebar" id="sidebar">
      <a class="brand" href="#" data-view="overview" aria-label="Sahakari Field Kit home">
        <span class="brand-mark"><span></span><span></span><span></span><span></span></span>
        <span class="brand-text"><strong>sahakari</strong><small>NCCT FIELD KIT</small></span>
      </a>
      <div class="workspace-label">WORKSPACE</div>
      <nav class="side-nav" aria-label="Main navigation">
        <button class="nav-link ${active === 'overview' ? 'active' : ''}" data-view="overview">${icon('grid')}<span>Overview</span></button>
        <button class="nav-link ${active === 'fieldkit' ? 'active' : ''}" data-view="fieldkit">${icon('tablet')}<span>Field kit</span><span class="nav-count">${pendingCount() || ''}</span></button>
        <button class="nav-link ${active === 'lesson' ? 'active' : ''}" data-view="lesson">${icon('book')}<span>Lesson & quiz</span></button>
        <button class="nav-link ${active === 'courses' ? 'active' : ''}" data-view="courses">${icon('users')}<span>Courses & cohorts</span></button>
        <button class="nav-link ${active === 'certificates' ? 'active' : ''}" data-view="certificates">${icon('award')}<span>Certificates</span>${state.certificates.length ? `<span class="nav-dot"></span>` : ''}</button>
      </nav>
      <div class="sidebar-bottom">
        <div class="sidebar-cohort"><span class="cohort-icon">${icon('users', 16)}</span><div><small>ACTIVE COHORT</small><strong>Batch 08</strong><span>6 synthetic trainees</span></div><button class="icon-button tiny" title="Cohort details" data-view="courses">${icon('chevron', 14)}</button></div>
        <div class="profile-row"><div class="profile-avatar">NC</div><div><strong>Training coordinator</strong><small>Demo workspace</small></div><span class="profile-menu">···</span></div>
      </div>
    </aside>
    <main class="main-column">
      <header class="topbar">
        <button class="icon-button mobile-menu" id="menuButton" aria-label="Open navigation">${icon('menu')}</button>
        <div class="breadcrumbs"><span>NCCT</span><b>/</b><span>Training</span><b>/</b><strong>${heading}</strong></div>
        <div class="topbar-actions">
          <div class="connection-pill ${state.online ? 'is-online' : 'is-offline'}"><span class="connection-dot"></span><span>${state.online ? 'Online' : 'Offline'}</span><button id="connectionToggle" class="connection-switch" aria-label="Toggle simulated connection" title="Toggle simulated connection"><span></span></button></div>
          <button id="syncButton" class="button button-primary sync-top ${pendingCount() ? 'has-pending' : ''}" ${!state.online ? 'disabled' : ''}>${icon('cloud', 16)}<span>Sync now</span>${pendingCount() ? `<i>${pendingCount()}</i>` : ''}</button>
          <button id="startTourButton" class="button button-quiet start-tour-button" title="Start the guided walkthrough">${icon('spark', 14)}<span>Start</span></button>
          <button class="icon-button help-button" title="Prototype information" id="boundaryButton">${icon('shield', 17)}</button>
        </div>
      </header>
      <section class="page-head"><div><div class="eyebrow"><span class="eyebrow-mark"></span>COOPERATIVE TRAINING · BATCH 08</div><h1>${heading}</h1><p>${subheading}</p></div><div class="head-right"><span class="date-chip">${icon('clock', 15)} 30 Sep 2026</span><button class="button button-quiet" data-view="courses">${icon('users', 16)} <span>Batch 08</span>${icon('chevron', 14)}</button></div></section>
      <div class="prototype-note"><span class="note-icon">${icon('shield', 15)}</span><span><strong>Prototype, not a central system.</strong> Offline records and the simulated portal stay in this browser.</span><button id="boundaryLink" aria-label="More about this prototype">Learn more</button></div>
      <div id="pageContent"></div>
      <footer class="app-footer"><span>SAHAKARI FIELD KIT <i>•</i> DEMO BUILD</span><span>Designed for a small first step toward connected cooperative training</span></footer>
    </main>
  </div>`;
}
function renderOverview() {
  const attendanceCount = new Set(state.attendanceEvents.filter(event => event.synced && event.sessionId === SESSION_ID).map(event => event.traineeId)).size;
  const pending = pendingCount();
  const activeProgress = latestAssessment(state.activeTraineeId);
  const activeAttendance = state.attendanceEvents.some(event => event.traineeId === state.activeTraineeId && event.sessionId === SESSION_ID);
  return `<div class="stats-grid">
    <article class="stat-card"><div class="stat-top"><span>COHORT</span><span class="stat-icon mint-icon">${icon('users', 17)}</span></div><strong>06</strong><div class="stat-foot"><span class="stat-note">Synthetic trainees</span><span class="stat-tag">Batch 08</span></div></article>
    <article class="stat-card"><div class="stat-top"><span>ATTENDANCE</span><span class="stat-icon coral-icon">${icon('check', 17)}</span></div><strong>${String(attendanceCount).padStart(2, '0')}<small> / 06</small></strong><div class="stat-foot"><span class="stat-note">Synced to portal</span><span class="mini-progress"><i style="width:${attendanceCount / 6 * 100}%"></i></span></div></article>
    <article class="stat-card"><div class="stat-top"><span>LEARNING</span><span class="stat-icon blue-icon">${icon('book', 17)}</span></div><strong>${state.assessmentEvents.filter(event => event.synced).length}<small> / 06</small></strong><div class="stat-foot"><span class="stat-note">Knowledge checks synced</span><span class="stat-tag warm">${pending ? `${pending} pending` : 'Up to date'}</span></div></article>
    <article class="stat-card"><div class="stat-top"><span>CERTIFICATES</span><span class="stat-icon gold-icon">${icon('award', 17)}</span></div><strong>${String(state.certificates.length).padStart(2, '0')}</strong><div class="stat-foot"><span class="stat-note">Criteria-gated</span><span class="stat-tag">${state.certificates.length ? 'Issued' : 'None yet'}</span></div></article>
  </div>
  <div class="overview-grid">
    <section class="card session-card">
      <div class="section-head"><div><div class="section-kicker">FIELD SESSION <span class="live-dot"></span></div><h2>Digital readiness for PACS</h2><p>Practical records for stronger cooperatives</p></div><button class="button button-light small-button" data-view="fieldkit">Open field kit ${icon('arrow', 14)}</button></div>
      <div class="session-meta"><div class="meta-unit"><span class="meta-label">FACILITATOR</span><strong><span class="trainer-avatar">RK</span> R. Kulkarni</strong></div><div class="meta-unit"><span class="meta-label">SCHEDULE</span><strong>Today · 10:00–12:00</strong></div><div class="meta-unit"><span class="meta-label">LOCATION</span><strong>${icon('grid', 14)} Demo classroom</strong></div></div>
      <div class="session-divider"></div>
      <div class="session-bottom"><div class="attendance-overview"><div class="avatar-stack">${trainees.slice(0, 4).map(t => `<span class="avatar ${t.tone}">${t.initials}</span>`).join('')}<span class="avatar more-avatars">+2</span></div><div><strong>${attendanceCount} of 6 checked in</strong><small>${pending ? `${pending} item${pending === 1 ? '' : 's'} waiting on the field device` : 'Attendance appears here after check-in'}</small></div></div><button class="button button-outline small-button" data-action="quick-checkin">${icon('qr', 15)} Record attendance</button></div>
    </section>
    <section class="card lesson-card">
      <div class="lesson-topline"><span class="course-type">ACTIVE COURSE</span><span class="course-symbol">${icon('book', 20)}</span></div>
      <div class="lesson-title-row"><div><h2>Digital records for stronger cooperatives</h2><p>Module 1 <span>·</span> 12 min <span>·</span> 4-question check</p></div></div>
      <div class="lesson-illustration"><div class="illustration-sun"></div><div class="illustration-sheet"><span></span><span></span><span></span><i>${icon('check', 14)}</i></div><div class="illustration-dot dot-a"></div><div class="illustration-dot dot-b"></div><span class="illustration-label">LEARN BY DOING</span></div>
      <div class="lesson-progress-row"><div><strong>${isLessonRead(state.activeTraineeId) ? 'Lesson read' : activeProgress ? 'Knowledge check submitted' : 'Ready when you are'}</strong><small>${activeProgress ? `Latest score: ${activeProgress.score}%${activeProgress.synced ? ' · synced' : ' · pending sync'}` : 'A simple lesson, then check understanding'}</small></div><button class="circle-arrow" data-view="lesson" aria-label="Open lesson">${icon('arrow', 17)}</button></div>
    </section>
  </div>
  <div class="lower-grid">
    <section class="card cohort-card"><div class="card-heading-row"><div><div class="section-kicker">COHORT SNAPSHOT</div><h2>People in this session</h2></div><button class="text-link" data-view="courses">View cohort ${icon('arrow', 14)}</button></div>
      <div class="trainee-table-wrap"><table class="trainee-table"><thead><tr><th>TRAINEE</th><th>INSTITUTION</th><th>ATTENDANCE</th><th>LEARNING</th></tr></thead><tbody>${trainees.slice(0, 5).map(renderTraineeRow).join('')}</tbody></table></div>
      <div class="table-end"><span>Showing 5 of 6 · all profiles are synthetic</span><button data-view="courses">Open cohort →</button></div>
    </section>
    <section class="card sync-card"><div class="card-heading-row"><div><div class="section-kicker">FIELD DEVICE</div><h2>Local activity</h2></div><span class="device-status ${state.online ? 'connected' : 'disconnected'}"><i></i>${state.online ? 'Connected' : 'Offline'}</span></div>
      <div class="device-visual"><div class="device-outline"><div class="device-screen"><span class="screen-dot"></span><b>${pending}</b><small>${pending === 1 ? 'item' : 'items'} to sync</small><span class="screen-line"></span></div><span class="device-button"></span></div><div class="device-copy"><strong>${pending ? 'A small queue is waiting' : 'Ready for the field'}</strong><p>${pending ? 'Reconnect to move saved attendance and learning to the portal.' : 'Capture attendance offline. Sync when the signal returns.'}</p></div></div>
      <div class="sync-card-foot"><span>${icon('cloud', 15)} ${pending ? `${pending} pending item${pending === 1 ? '' : 's'}` : 'No pending items'}</span><button class="text-link" data-action="sync">${pending ? 'Sync activity' : 'View field kit'} ${icon('arrow', 14)}</button></div>
    </section>
  </div>`;
}
function renderTraineeRow(trainee) {
  const event = state.attendanceEvents.find(item => item.traineeId === trainee.id && item.sessionId === SESSION_ID);
  const assessment = latestAssessment(trainee.id);
  const badge = event ? (event.synced ? '<span class="status-chip success">Present</span>' : '<span class="status-chip pending"><i></i>Pending</span>') : '<span class="status-chip quiet">Not checked in</span>';
  const learning = assessment ? `<span class="score-pill ${assessment.synced ? (assessment.score >= PASS_SCORE ? 'score-good' : 'score-low') : 'score-pending'}">${assessment.score}%${assessment.synced ? '' : ' · queued'}</span>` : '<span class="muted-dash">—</span>';
  return `<tr><td><div class="trainee-cell"><span class="avatar ${trainee.tone}">${trainee.initials}</span><div><strong>${trainee.name}</strong><small>${trainee.id}</small></div></div></td><td><span class="institution-text">${trainee.institution}</span></td><td>${badge}</td><td>${learning}</td></tr>`;
}
function renderFieldKit() {
  const pendingEvents = [
    ...state.attendanceEvents.filter(event => !event.synced).map(event => ({ ...event, type: 'Attendance', sub: `QR check-in · ${person(event.traineeId)?.name || event.traineeId}` })),
    ...state.assessmentEvents.filter(event => !event.synced).map(event => ({ ...event, type: 'Learning', sub: `Knowledge check · ${person(event.traineeId)?.name || event.traineeId} · ${event.score}%` }))
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const allEvents = [
    ...state.attendanceEvents.map(event => ({ ...event, type: 'Attendance', sub: `${event.source} · ${person(event.traineeId)?.name || event.traineeId}` })),
    ...state.assessmentEvents.map(event => ({ ...event, type: 'Learning', sub: `Knowledge check · ${person(event.traineeId)?.name || event.traineeId} · ${event.score}%` }))
  ].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  return `<div class="field-grid"><section class="card capture-card"><div class="card-heading-row"><div><div class="section-kicker">ATTENDANCE CAPTURE</div><h2>Check in a trainee</h2><p>Use a printed QR card or confirm the ID with the trainer.</p></div><span class="offline-device-badge ${state.online ? 'connected' : 'offline'}"><i></i>${state.online ? 'Device online' : 'Offline mode'}</span></div>
    <div class="capture-band"><div class="band-icon">${icon('qr', 19)}</div><div><strong>Batch 08 · PACS digital readiness</strong><small>One attendance per trainee for today’s demo session.</small></div></div>
    <label class="field-label" for="traineeSelect">ACTIVE TRAINEE</label><div class="select-wrap"><select id="traineeSelect">${trainees.map(t => `<option value="${t.id}" ${t.id === state.activeTraineeId ? 'selected' : ''}>${t.name} · ${t.id}</option>`).join('')}</select>${icon('chevron', 16)}</div>
    <div class="capture-actions"><button id="scanQrButton" class="button button-primary capture-action">${icon('qr', 17)} Scan QR card</button><button id="showCardsButton" class="button button-outline capture-action">${icon('print', 17)} Show demo cards</button></div>
    <div class="fallback-panel"><div class="fallback-heading"><span>${icon('shield', 15)}</span><strong>Trainer-confirmed ID fallback</strong></div><p>When the camera or QR card is unavailable, confirm the printed trainee ID before recording attendance.</p><div class="fallback-input-row"><div class="input-with-icon">${icon('search', 16)}<input id="manualId" value="${esc(state.activeTraineeId)}" autocomplete="off" placeholder="e.g. STU-24017" aria-label="Trainer-confirmed trainee ID" /></div><button id="confirmIdButton" class="button button-dark">Confirm ID</button></div></div>
    <div class="capture-footer"><span>${icon('shield', 14)} ${state.online ? 'Saved to the simulated portal in this browser.' : 'Saved locally on this device · sync later.'}</span><button class="text-link" data-view="lesson">Go to lesson ${icon('arrow', 13)}</button></div>
  </section>
  <section class="card pending-card"><div class="card-heading-row"><div><div class="section-kicker">SYNC QUEUE</div><h2>Device activity</h2><p>Queued locally until the simulated connection is back.</p></div><span class="queue-count ${pendingCount() ? 'has-items' : ''}">${pendingCount()}<small>pending</small></span></div>
    ${pendingEvents.length ? `<div class="queue-list">${pendingEvents.map(event => `<div class="queue-item"><span class="queue-item-icon ${event.type === 'Attendance' ? 'queue-attendance' : 'queue-learning'}">${icon(event.type === 'Attendance' ? 'qr' : 'book', 16)}</span><div><strong>${esc(event.type)}</strong><small>${esc(event.sub)}</small></div><span class="pending-label"><i></i>Pending</span></div>`).join('')}</div>` : `<div class="empty-queue"><div class="empty-cloud">${icon('cloud', 24)}</div><strong>Nothing waiting to sync</strong><span>Check someone in while offline to see the queue fill up.</span></div>`}
    <div class="queue-footer"><span class="device-footer-dot ${state.online ? 'green' : 'orange'}"></span>${state.online ? 'Network available' : 'Offline · changes stay on this browser'}<button class="button button-outline small-button" data-action="sync" ${!state.online || !pendingCount() ? 'disabled' : ''}>${icon('cloud', 14)} Sync ${pendingCount() ? `(${pendingCount()})` : ''}</button></div>
  </section>
  <section class="card activity-card"><div class="card-heading-row"><div><div class="section-kicker">RECENT ON THIS DEVICE</div><h2>Latest activity</h2></div><button class="button button-quiet small-button" data-action="clear-demo" title="Clear this browser's local prototype data">Reset demo</button></div>
    ${allEvents.length ? `<div class="activity-list">${allEvents.map(event => `<div class="activity-row"><span class="activity-mark ${event.type === 'Attendance' ? 'mark-attendance' : 'mark-learning'}">${icon(event.type === 'Attendance' ? 'check' : 'book', 15)}</span><div class="activity-copy"><strong>${esc(event.sub)}</strong><small>${esc(new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))} · ${event.synced ? 'Synced to portal' : 'Pending sync'}</small></div><span class="activity-state ${event.synced ? 'synced' : 'queued'}">${event.synced ? 'Synced' : 'Queued'}</span></div>`).join('')}</div>` : `<div class="empty-activity">Your check-ins and quiz results will show here.</div>`}
  </section>
  <section class="card field-tip"><div class="tip-icon">${icon('spark', 18)}</div><div><span class="section-kicker">FIELD NOTE</span><strong>Offline by design, not by guesswork</strong><p>Each trainee can count once per session. The portal only sees records after you reconnect and sync.</p></div></section></div>`;
}
function renderLesson() {
  const id = state.activeTraineeId;
  const trainee = person(id);
  const last = latestAssessment(id);
  const quizDone = Boolean(last);
  const lessonRead = isLessonRead(id);
  return `<div class="course-intro card"><div class="course-intro-copy"><div class="section-kicker">MODULE 01 <span class="module-separator">/</span> PACS DIGITAL READINESS</div><h2>Good records build stronger cooperatives.</h2><p>Learn a simple way to keep cooperative member and transaction records tidy, private, and easier to use.</p><div class="course-meta-line"><span>${icon('clock', 15)} About 3 minutes</span><span>${icon('book', 15)} Short reading</span><span>${icon('award', 15)} Pass at ${PASS_SCORE}%</span></div><div class="current-learner"><span class="avatar ${trainee.tone}">${trainee.initials}</span><span>Learning as <strong>${trainee.name}</strong></span><button class="text-link" data-view="fieldkit">Change trainee ${icon('arrow', 13)}</button></div></div><div class="course-cover"><div class="cover-sun"></div><div class="cover-orbit orbit-one"></div><div class="cover-orbit orbit-two"></div><div class="cover-paper"><span class="paper-mark">S</span><span class="paper-rule"></span><span class="paper-rule short"></span><span class="paper-rule"></span><i>${icon('check', 16)}</i></div><span class="cover-caption">SMALL STEPS<br/>MAKE A DIFFERENCE</span></div></div>
  <div class="lesson-columns"><section class="card lesson-reading"><div class="card-heading-row"><div><div class="section-kicker">THE LESSON</div><h2>Make the records work for you</h2></div><span class="read-status ${lessonRead ? 'read' : ''}">${lessonRead ? icon('check', 13) + ' Read' : '3 min read'}</span></div>
    <div class="reading-content"><p class="reading-lede">Clear records help members make informed decisions and help a cooperative stay ready for the next opportunity.</p><div class="reading-point"><span class="point-number">01</span><div><strong>Write it down while it is fresh</strong><p>Capture the date, purpose, amount, and people involved in a transaction. A regular routine makes later reviews easier.</p></div></div><div class="reading-point"><span class="point-number">02</span><div><strong>Keep personal information purposeful</strong><p>Record only the details needed for cooperative work. Store member information carefully and let people know why it is being collected.</p></div></div><div class="reading-point"><span class="point-number">03</span><div><strong>Check the totals together</strong><p>Review entries with another authorised person. A second look can catch mistakes before they become confusing.</p></div></div><div class="lesson-callout"><span>${icon('spark', 17)}</span><div><strong>Remember</strong><p>Simple, consistent, carefully checked records are more useful than a complicated system no one can keep up.</p></div></div></div>
    ${lessonRead ? `<button id="startQuizButton" class="button button-primary wide-button">${quizDone ? 'Review knowledge check' : 'Continue to knowledge check'} ${icon('arrow', 16)}</button>` : `<button id="markReadButton" class="button button-primary wide-button">Mark lesson read & continue ${icon('arrow', 16)}</button>`}
  </section><section class="card quiz-panel" id="quizPanel"><div class="card-heading-row"><div><div class="section-kicker">KNOWLEDGE CHECK</div><h2>Put it into practice</h2></div><span class="quiz-count">4 questions</span></div>
    ${!lessonRead ? `<div class="quiz-locked"><div class="lock-icon">${icon('book', 21)}</div><strong>Finish the short reading first</strong><p>When you’re ready, mark the lesson as read to unlock the knowledge check.</p><span class="locked-step"><i>1</i> Lesson <span class="locked-line"></span><i class="muted-step">2</i> Quiz</span></div>` : quizDone ? `<div class="quiz-result ${last.score >= PASS_SCORE ? 'passed' : 'needs-retry'}"><div class="result-ring"><strong>${last.score}%</strong><span>SCORE</span></div><div><span class="result-status">${last.score >= PASS_SCORE ? 'Nice work — passed' : 'A little more practice'}</span><p>${last.correct} of ${last.total} answers correct. ${last.synced ? 'Result synced to the portal.' : 'Result is saved locally and pending sync.'}</p></div></div><button id="retryQuizButton" class="button button-outline wide-button">Retake the knowledge check ${icon('arrow', 15)}</button>` : `<form id="quizForm" class="quiz-form">${questions.map((question, index) => `<fieldset class="quiz-question"><legend><span>${String(index + 1).padStart(2, '0')}</span>${esc(question.prompt)}</legend><div class="choice-list">${question.choices.map((choice, choiceIndex) => `<label class="quiz-choice"><input type="radio" name="q${index}" value="${choiceIndex}"/><span class="choice-check"></span><span>${esc(choice)}</span></label>`).join('')}</div></fieldset>`).join('')}<div class="quiz-submit-row"><span>${icon('shield', 14)} ${state.online ? 'Result syncs to this browser’s portal.' : 'Result queues on this device while offline.'}</span><button class="button button-dark" type="submit">Submit answers ${icon('arrow', 15)}</button></div></form>`}
  </section></div><div class="criteria-strip"><span class="criteria-icon">${icon('award', 18)}</span><div><strong>Certificate criteria</strong><p>At least ${ATTENDANCE_REQUIRED} attendance record synced <i>+</i> a synced quiz score of ${PASS_SCORE}% or higher. No manual override.</p></div><button class="text-link" data-view="certificates">View certificate rules ${icon('arrow', 13)}</button></div>`;
}
function renderCourses() {
  const checked = new Set(state.attendanceEvents.filter(event => event.synced).map(event => event.traineeId)).size;
  const learned = new Set(state.assessmentEvents.filter(event => event.synced).map(event => event.traineeId)).size;
  return `<section class="cohort-hero card"><div><span class="section-kicker">COHORT · BATCH 08</span><h2>Digital readiness for cooperative teams</h2><p>A small, demo cohort for exploring training operations from the field kit to the staff portal.</p><div class="cohort-pills"><span>${icon('users', 15)} 6 synthetic trainees</span><span>${icon('clock', 15)} 30 Sep 2026</span><span>${icon('grid', 15)} VAMNICOM demo</span></div></div><div class="cohort-graphic"><span class="graphic-ring ring-a"></span><span class="graphic-ring ring-b"></span><span class="graphic-center">${icon('users', 25)}</span><span class="graphic-star">✳</span></div></section>
    <div class="stats-grid compact-stats"><article class="stat-card"><div class="stat-top"><span>ENROLLED</span><span class="stat-icon mint-icon">${icon('users', 17)}</span></div><strong>06</strong><div class="stat-foot"><span class="stat-note">All demo profiles</span></div></article><article class="stat-card"><div class="stat-top"><span>ATTENDANCE</span><span class="stat-icon coral-icon">${icon('check', 17)}</span></div><strong>${String(checked).padStart(2, '0')}<small> / 06</small></strong><div class="stat-foot"><span class="stat-note">Synced records</span></div></article><article class="stat-card"><div class="stat-top"><span>LEARNING</span><span class="stat-icon blue-icon">${icon('book', 17)}</span></div><strong>${String(learned).padStart(2, '0')}<small> / 06</small></strong><div class="stat-foot"><span class="stat-note">Quiz results synced</span></div></article></div>
    <div class="catalog-head"><div><div class="section-kicker">COURSE CATALOG</div><h2>Learning for this cohort</h2></div><div class="catalog-tabs"><button class="${state.courseTab === 'active' ? 'selected' : ''}" data-action="course-tab" data-tab="active">Active <span>1</span></button><button class="${state.courseTab === 'planned' ? 'selected' : ''}" data-action="course-tab" data-tab="planned">In the pipeline <span>1</span></button></div></div>
    ${state.courseTab === 'active' ? `<article class="course-list-card card"><div class="course-list-icon">${icon('book', 21)}</div><div class="course-list-copy"><div class="course-list-tags"><span class="active-tag">ACTIVE</span><span class="course-code">CT-08-01</span></div><h3>Digital records for stronger cooperatives</h3><p>Practical record-keeping, privacy basics, and consistent checks for cooperative teams.</p><div class="course-list-meta"><span>${icon('clock', 14)} 12 min</span><span>${icon('users', 14)} 6 enrolled</span><span>${icon('award', 14)} Quiz · pass ${PASS_SCORE}%</span></div></div><div class="course-list-end"><div class="mini-completion"><span>COHORT PROGRESS</span><div class="progress-bar"><i style="width:${learned / 6 * 100}%"></i></div><small>${learned} of 6 synced</small></div><button class="button button-primary small-button" data-view="lesson">Open course ${icon('arrow', 14)}</button></div></article>` : `<article class="course-list-card card planned-course"><div class="course-list-icon blue-tile">${icon('grid', 21)}</div><div class="course-list-copy"><div class="course-list-tags"><span class="planned-tag">PLANNED</span><span class="course-code">CT-08-02</span></div><h3>Member services & financial literacy</h3><p>A future cohort module placeholder. Lesson content and assessments are not included in this prototype.</p><div class="course-list-meta"><span>${icon('clock', 14)} Draft</span><span>${icon('users', 14)} Cohort dependent</span></div></div><div class="course-list-end"><span class="not-in-scope">Not in demo</span></div></article>`}
    <section class="card cohort-roster"><div class="card-heading-row"><div><div class="section-kicker">COHORT ROSTER</div><h2>Training status</h2></div><span class="roster-count">6 participants</span></div><div class="trainee-table-wrap"><table class="trainee-table"><thead><tr><th>TRAINEE</th><th>ROLE / REGION</th><th>ATTENDANCE</th><th>LEARNING</th><th>CERTIFICATE</th></tr></thead><tbody>${trainees.map(trainee => { const cert = currentCertificate(trainee.id); const event = state.attendanceEvents.find(item => item.traineeId === trainee.id); const assessment = latestAssessment(trainee.id); return `<tr><td><div class="trainee-cell"><span class="avatar ${trainee.tone}">${trainee.initials}</span><div><strong>${trainee.name}</strong><small>${trainee.id}</small></div></div></td><td><span class="role-region">${trainee.role}<small>${trainee.institution}</small></span></td><td>${event ? (event.synced ? '<span class="status-chip success">Present</span>' : '<span class="status-chip pending"><i></i>Pending sync</span>') : '<span class="status-chip quiet">Not yet</span>'}</td><td>${assessment ? `<span class="score-pill ${assessment.synced ? (assessment.score >= PASS_SCORE ? 'score-good' : 'score-low') : 'score-pending'}">${assessment.score}%${assessment.synced ? '' : ' · queued'}</span>` : '<span class="muted-dash">Not started</span>'}</td><td>${cert ? `<span class="status-chip success">${icon('award', 12)} Issued</span>` : '<span class="muted-dash">—</span>'}</td></tr>`; }).join('')}</tbody></table></div><div class="roster-foot">${icon('shield', 14)} Sample records only · no real participant information</div></section>`;
}
function renderCertificates() {
  const activeId = state.activeTraineeId;
  const active = person(activeId);
  const certificate = currentCertificate(activeId);
  const attendance = syncedAttendance(activeId).length;
  const assessment = latestAssessment(activeId);
  const hasAttendance = attendance >= ATTENDANCE_REQUIRED;
  const hasPassingQuiz = Boolean(assessment?.synced && assessment.score >= PASS_SCORE);
  const certRows = trainees.map(trainee => {
    const cert = currentCertificate(trainee.id);
    const attended = syncedAttendance(trainee.id).length >= ATTENDANCE_REQUIRED;
    const quiz = latestAssessment(trainee.id);
    const passed = Boolean(quiz?.synced && quiz.score >= PASS_SCORE);
    return `<tr><td><div class="trainee-cell"><span class="avatar ${trainee.tone}">${trainee.initials}</span><div><strong>${trainee.name}</strong><small>${trainee.id}</small></div></div></td><td><span class="${attended ? 'rule-met' : 'rule-wait'}">${attended ? icon('check', 14) : icon('clock', 14)} ${attended ? 'Met' : 'Waiting'}</span></td><td><span class="${passed ? 'rule-met' : 'rule-wait'}">${passed ? icon('check', 14) : icon('clock', 14)} ${passed ? `${quiz.score}% · Met` : quiz ? `${quiz.score}% · Below threshold` : 'Waiting'}</span></td><td>${cert ? `<button class="text-link" data-action="verify" data-code="${cert.id}">Verify ${icon('arrow', 13)}</button>` : '<span class="muted-dash">Not eligible</span>'}</td></tr>`;
  }).join('');
  return `<div class="cert-layout"><section class="card cert-rules"><div class="section-kicker">COMPLETION RULES</div><h2>Earned by learning, not by button</h2><p class="cert-intro">The prototype checks synced portal records before issuing a certificate. There is no manual override.</p><div class="rule-stack"><div class="rule-row"><span class="rule-icon rule-attendance">${icon('check', 16)}</span><div><strong>${ATTENDANCE_REQUIRED} session attendance</strong><small>Recorded once, then synced from the field kit.</small></div><span class="rule-condition">REQUIRED</span></div><div class="rule-row"><span class="rule-icon rule-quiz">${icon('book', 16)}</span><div><strong>Knowledge check · ${PASS_SCORE}% or higher</strong><small>Four questions about field practice and syncing.</small></div><span class="rule-condition">REQUIRED</span></div><div class="rule-row"><span class="rule-icon rule-cloud">${icon('cloud', 16)}</span><div><strong>Both records synced</strong><small>Pending offline items do not count toward eligibility.</small></div><span class="rule-condition">REQUIRED</span></div></div>
  <div class="eligibility-box ${certificate ? 'eligible' : ''}"><span class="eligibility-mark">${certificate ? icon('check', 18) : icon('clock', 18)}</span><div><strong>${certificate ? 'Certificate issued' : 'Selected trainee: ' + esc(active.name)}</strong><p>${certificate ? `${attendance} of ${ATTENDANCE_REQUIRED} attendance · ${assessment.score}% quiz · all synced` : `Attendance ${hasAttendance ? 'met' : 'not yet met'} · Quiz ${hasPassingQuiz ? `passed (${assessment.score}%)` : 'not yet passed'} · ${!state.online ? 'device is offline' : pendingCount() ? `${pendingCount()} record(s) waiting to sync` : 'complete both steps to become eligible'}`}</p></div></div>
  </section><section class="certificate-preview card">${certificate ? `<div class="certificate-paper"><div class="cert-corner top-left"></div><div class="cert-corner top-right"></div><div class="cert-corner bottom-left"></div><div class="cert-corner bottom-right"></div><div class="cert-seal">${icon('award', 23)}</div><div class="cert-overline">NATIONAL COUNCIL FOR COOPERATIVE TRAINING</div><div class="cert-institution">VAMNICOM · COOPERATIVE LEARNING</div><h2>Certificate<br/><em>of completion</em></h2><span class="cert-presented">THIS IS TO CERTIFY THAT</span><strong class="cert-name">${esc(certificate.traineeName)}</strong><span class="cert-description">has completed <b>Digital records for stronger cooperatives</b><br/>and met the attendance and assessment requirements.</span><div class="cert-bottom"><div class="cert-signature"><span>R. Kulkarni</span><small>PROGRAMME FACILITATOR</small></div><div class="cert-date"><span>${new Date(certificate.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span><small>DATE OF ISSUE</small></div><div class="cert-qr-wrap"><img class="certificate-qr" alt="QR code to verify certificate"/><small>SCAN TO VERIFY</small></div></div><div class="cert-id">${esc(certificate.id)}</div></div><div class="cert-action-row"><span class="verified-badge">${icon('shield', 14)} Eligible · verified in this browser</span><button class="button button-outline small-button" data-action="verify" data-code="${certificate.id}">Open verification view ${icon('arrow', 14)}</button></div>` : `<div class="empty-certificate"><div class="certificate-illustration"><div class="paper-certificate"><span class="paper-rosette">${icon('award', 19)}</span><i></i><i></i><i></i><b></b></div><span class="cert-lock">${icon('shield', 18)}</span></div><span class="section-kicker">NO CERTIFICATE YET</span><h2>Complete the learning path</h2><p>Once attendance and a passing quiz are both synced, this certificate will be issued automatically.</p><div class="empty-cert-steps"><span class="${hasAttendance ? 'step-complete' : ''}"><i>${hasAttendance ? icon('check', 11) : '1'}</i>Attendance</span><span class="step-line ${hasAttendance && hasPassingQuiz ? 'filled' : ''}"></span><span class="${hasPassingQuiz ? 'step-complete' : ''}"><i>${hasPassingQuiz ? icon('check', 11) : '2'}</i>Pass quiz</span><span class="step-line ${certificate ? 'filled' : ''}"></span><span><i>3</i>Sync</span></div><button class="button button-primary" data-view="fieldkit">Continue in the field kit ${icon('arrow', 15)}</button></div>`}</section></div>
  <section class="card certificate-roster"><div class="card-heading-row"><div><div class="section-kicker">COHORT ELIGIBILITY</div><h2>Completion status</h2></div><button class="button button-quiet small-button" data-view="courses">View course roster ${icon('arrow', 14)}</button></div><div class="trainee-table-wrap"><table class="trainee-table"><thead><tr><th>TRAINEE</th><th>ATTENDANCE</th><th>PASSING QUIZ</th><th>CERTIFICATE</th></tr></thead><tbody>${certRows}</tbody></table></div></section>
  <section class="card verify-tools"><div class="verify-tool-icon">${icon('qr', 19)}</div><div><strong>Verify a certificate</strong><p>Open a certificate’s QR link or enter its ID below. Verification checks this browser’s local demo record only.</p></div><form id="verifyForm" class="verify-form"><input id="verifyInput" placeholder="NCCT-CT-2026-24017" aria-label="Certificate ID"/><button class="button button-dark" type="submit">Verify ${icon('arrow', 14)}</button></form></section>`;
}
function renderVerification(code) {
  const cert = state.certificates.find(item => item.id.toLowerCase() === String(code || '').toLowerCase());
  const trainee = cert && person(cert.traineeId);
  return `<div class="verification-wrap"><button class="text-link back-link" data-view="certificates">${icon('arrow', 14)} Back to certificates</button><section class="verification-card card"><div class="verification-mark ${cert ? 'verified' : 'unverified'}">${icon(cert ? 'shield' : 'search', 27)}</div><div class="section-kicker">CERTIFICATE VERIFICATION · LOCAL PROTOTYPE</div><h2>${cert ? 'Certificate record found' : 'No matching local record'}</h2><p>${cert ? 'This certificate matches a completion record stored in the current browser’s simulated portal.' : 'This browser does not have a matching certificate in its local demo data. A production verifier would query a central issuing service.'}</p>${cert ? `<div class="verification-details"><div><span>LEARNER</span><strong>${esc(cert.traineeName)}</strong></div><div><span>COURSE</span><strong>${esc(cert.course)}</strong></div><div><span>CERTIFICATE ID</span><strong class="mono">${esc(cert.id)}</strong></div><div><span>ISSUED</span><strong>${new Date(cert.issuedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></div></div><div class="verification-success">${icon('check', 15)} Verified locally · attendance and passing quiz were synced</div>` : `<div class="verify-search-row"><input id="verifyInput" value="${esc(code || '')}" placeholder="Enter certificate ID" aria-label="Certificate ID"/><button class="button button-dark" id="verifyAgainButton">Check record ${icon('arrow', 14)}</button></div>`}<div class="verification-fineprint">Demo record only · all names and IDs are synthetic · not a production credential check.</div></section></div>`;
}
function render() {
  const verifyCode = new URLSearchParams(location.search).get('verify');
  document.querySelector('#app').innerHTML = renderAppShell();
  const content = document.querySelector('#pageContent');
  if (verifyCode) {
    content.innerHTML = renderVerification(verifyCode);
  } else if (state.view === 'fieldkit') content.innerHTML = renderFieldKit();
  else if (state.view === 'lesson') content.innerHTML = renderLesson();
  else if (state.view === 'courses') content.innerHTML = renderCourses();
  else if (state.view === 'certificates') content.innerHTML = renderCertificates();
  else content.innerHTML = renderOverview();
  bindEvents();
  guidedTour?.render();
  if (!verifyCode && state.view === 'certificates' && currentCertificate(state.activeTraineeId)) hydrateCertificateQr();
}
function bindEvents() {
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', event => {
    event.preventDefault();
    setView(button.dataset.view);
    document.querySelector('#sidebar')?.classList.remove('sidebar-open');
  }));
  document.querySelector('#connectionToggle')?.addEventListener('click', () => setConnection(!state.online));
  document.querySelector('#syncButton')?.addEventListener('click', syncNow);
  document.querySelector('#startTourButton')?.addEventListener('click', () => guidedTour.start());
  document.querySelectorAll('[data-action="sync"]').forEach(button => button.addEventListener('click', syncNow));
  document.querySelector('#boundaryButton')?.addEventListener('click', showBoundary);
  document.querySelector('#boundaryLink')?.addEventListener('click', showBoundary);
  document.querySelector('#menuButton')?.addEventListener('click', () => document.querySelector('#sidebar')?.classList.toggle('sidebar-open'));
  document.querySelector('#traineeSelect')?.addEventListener('change', event => setActiveTrainee(event.target.value));
  document.querySelector('#confirmIdButton')?.addEventListener('click', () => recordAttendance(document.querySelector('#manualId')?.value.trim().toUpperCase(), 'trainer-confirmed ID'));
  document.querySelector('#manualId')?.addEventListener('keydown', event => { if (event.key === 'Enter') recordAttendance(event.target.value.trim().toUpperCase(), 'trainer-confirmed ID'); });
  document.querySelector('#scanQrButton')?.addEventListener('click', openScanner);
  document.querySelector('#showCardsButton')?.addEventListener('click', showQrCards);
  document.querySelector('[data-action="quick-checkin"]')?.addEventListener('click', () => { setView('fieldkit'); setTimeout(() => document.querySelector('#manualId')?.focus(), 20); });
  document.querySelector('#markReadButton')?.addEventListener('click', markLessonRead);
  document.querySelector('#startQuizButton')?.addEventListener('click', () => document.querySelector('#quizPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  document.querySelector('#retryQuizButton')?.addEventListener('click', () => { state.assessmentEvents = state.assessmentEvents.filter(item => item.traineeId !== state.activeTraineeId); state.certificates = state.certificates.filter(item => item.traineeId !== state.activeTraineeId); save(); render(); });
  document.querySelector('#quizForm')?.addEventListener('submit', event => { event.preventDefault(); submitQuiz(event.currentTarget); });
  document.querySelectorAll('[data-action="course-tab"]').forEach(button => button.addEventListener('click', () => { state.courseTab = button.dataset.tab; save(); render(); }));
  document.querySelectorAll('[data-action="verify"]').forEach(button => button.addEventListener('click', () => openVerification(button.dataset.code)));
  document.querySelector('#verifyForm')?.addEventListener('submit', event => { event.preventDefault(); openVerification(document.querySelector('#verifyInput')?.value.trim()); });
  document.querySelector('#verifyAgainButton')?.addEventListener('click', () => openVerification(document.querySelector('#verifyInput')?.value.trim()));
  document.querySelector('[data-action="clear-demo"]')?.addEventListener('click', resetDemo);
}
function showBoundary() {
  showModal(`<div class="modal-head"><div><span class="section-kicker">ABOUT THIS PREVIEW</span><h2>A local prototype, not a live system</h2></div><button class="icon-button" data-close-modal aria-label="Close">${icon('x')}</button></div><div class="boundary-modal-copy"><div class="boundary-modal-icon">${icon('shield', 22)}</div><p>This demo keeps attendance, quiz results, and the simulated portal in <strong>this browser’s local storage</strong>. The Offline switch only simulates connectivity; Sync now moves queued events into the portal view in the same browser.</p><p>There is no central NCCT database, production account, or cross-device sync behind this preview. All six people are synthetic, and verification checks only this browser’s local demo data.</p><p>Camera access is requested only when you choose to scan a QR card. Trainer-confirmed ID is always available as a fallback.</p></div><button class="button button-dark modal-done" data-close-modal>Got it</button>`);
}
function showModal(content) {
  document.querySelector('#modal-root').innerHTML = `<div class="modal-backdrop" data-backdrop><div class="modal-card" role="dialog" aria-modal="true">${content}</div></div>`;
  document.querySelectorAll('[data-close-modal]').forEach(button => button.addEventListener('click', closeModal));
  document.querySelector('[data-backdrop]')?.addEventListener('click', event => { if (event.target.dataset.backdrop !== undefined) closeModal(); });
  document.addEventListener('keydown', escapeModal, { once: true });
}
function closeModal() { stopCamera(); document.querySelector('#modal-root').innerHTML = ''; }
function escapeModal(event) { if (event.key === 'Escape') closeModal(); }
function showQrCards() {
  const cards = trainees.map(trainee => `<article class="print-card"><div class="print-card-head"><span class="mini-brand">SAHAKARI <i>·</i> NCCT</span><span class="print-qr-chip">TRAINEE QR</span></div><div class="print-card-body"><img class="trainee-qr" data-id="${trainee.id}" alt="QR for ${esc(trainee.name)}"/><div><strong>${esc(trainee.name)}</strong><span>${esc(trainee.role)}</span><b>${trainee.id}</b></div></div><div class="print-card-foot">BATCH 08 <span>DEMO CARD · SYNTHETIC</span></div></article>`).join('');
  showModal(`<div class="modal-head"><div><span class="section-kicker">PRINTABLE DEMO MATERIAL</span><h2>Sample trainee QR cards</h2><p>These codes contain only synthetic demo IDs.</p></div><button class="icon-button" data-close-modal aria-label="Close">${icon('x')}</button></div><div class="print-card-grid">${cards}</div><div class="modal-footer"><span>${icon('shield', 14)} QR payload: <code>NCCT|trainee ID</code></span><button class="button button-dark" id="printCardsButton">${icon('print', 15)} Print cards</button></div>`);
  document.querySelectorAll('.trainee-qr').forEach(img => QRCode.toDataURL(`NCCT|${img.dataset.id}`, { width: 120, margin: 1, color: { dark: '#173d3a', light: '#ffffff' } }).then(url => { img.src = url; }));
  document.querySelector('#printCardsButton')?.addEventListener('click', () => window.print());
}
async function openScanner() {
  const supported = 'BarcodeDetector' in window && navigator.mediaDevices?.getUserMedia;
  const body = supported ? `<div class="scanner-frame"><video id="scannerVideo" autoplay muted playsinline></video><div class="scanner-crosshair"><i></i></div><span class="scanner-hint">Hold a demo QR card in the frame</span></div><div id="cameraStatus" class="camera-status">Requesting camera permission…</div>` : `<div class="scanner-unavailable"><span>${icon('qr', 26)}</span><strong>Camera scanning isn’t available here</strong><p>This browser may not support QR detection or camera access. Use the trainer-confirmed ID fallback instead.</p></div>`;
  showModal(`<div class="modal-head"><div><span class="section-kicker">FIELD KIT · ATTENDANCE</span><h2>Scan a trainee QR</h2><p>Camera stays off until you choose this action.</p></div><button class="icon-button" data-close-modal aria-label="Close">${icon('x')}</button></div>${body}<div class="scanner-fallback"><span>Prefer not to use camera?</span><button class="text-link" data-close-modal>Use trainer-confirmed ID ${icon('arrow', 13)}</button></div>`);
  if (!supported) return;
  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
    const video = document.querySelector('#scannerVideo');
    if (!video) { stopCamera(); return; }
    video.srcObject = scanStream;
    await video.play();
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const loop = async () => {
      if (!document.querySelector('#scannerVideo')) return;
      try {
        const codes = await detector.detect(video);
        if (codes.length) {
          const raw = codes[0].rawValue.trim();
          const id = raw.includes('|') ? raw.split('|').pop().trim().toUpperCase() : raw.toUpperCase();
          closeModal();
          recordAttendance(id, 'QR camera scan');
          return;
        }
      } catch { /* Wait for the next camera frame. */ }
      scannerTimer = setTimeout(loop, 260);
    };
    loop();
  } catch (error) {
    const status = document.querySelector('#cameraStatus');
    if (status) status.innerHTML = `Camera could not start (${esc(error?.name || 'permission or device issue')}). Use the trainer-confirmed ID fallback.`;
  }
}
function stopCamera() {
  clearTimeout(scannerTimer);
  if (scanStream) { scanStream.getTracks().forEach(track => track.stop()); scanStream = null; }
}
function openVerification(code) {
  const safeCode = String(code || '').trim();
  if (!safeCode) { setToast('Enter a certificate ID to verify', 'error'); return; }
  history.pushState({}, '', `${location.pathname}?verify=${encodeURIComponent(safeCode)}`);
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function hydrateCertificateQr() {
  const certificate = currentCertificate(state.activeTraineeId);
  const img = document.querySelector('.certificate-qr');
  if (!certificate || !img) return;
  const verifyUrl = `${location.origin}${location.pathname}?verify=${encodeURIComponent(certificate.id)}`;
  try { img.src = await QRCode.toDataURL(verifyUrl, { width: 90, margin: 1, color: { dark: '#173d3a', light: '#ffffff' } }); } catch { /* The text certificate ID remains available. */ }
}
function resetDemo() {
  if (!window.confirm('Reset this browser’s local prototype data? This clears the demo attendance, quiz results, and certificates.')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(initialState);
  save();
  render();
  setToast('Demo data reset in this browser');
}
const guidedTour = createGuidedTour({
  setView(view) {
    state.view = view;
    if (new URLSearchParams(location.search).has('verify')) history.replaceState({}, '', location.pathname);
    save();
  },
  renderApp: render,
});
window.addEventListener('popstate', render);
render();
