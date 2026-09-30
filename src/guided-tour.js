const steps = [
  {
    view: 'overview',
    target: '#startTourButton',
    title: 'A practical path for cooperative learning',
    body: 'This demo presents an NCCT training goal in everyday steps: help cooperative teams learn useful record-keeping habits, take attendance, check understanding, and keep a clear completion record.',
    note: 'The people, course activity, and progress shown here are synthetic demo data.',
  },
  {
    view: 'fieldkit',
    target: '.capture-band',
    title: 'People and a field-ready workflow',
    body: 'Picture a trainer-led session supported by a shared phone or tablet. The trainer facilitates the session and confirms attendance; trainees join the lesson; a training coordinator reviews the cohort after records are synced.',
    details: [
      ['Trainee', 'joins the session and completes the lesson'],
      ['Trainer', 'confirms the person and records attendance'],
      ['Coordinator', 'reviews cohort progress in the portal-style view'],
    ],
    note: 'This screen is a browser mock-up. No physical device or field hardware is connected.',
  },
  {
    view: 'fieldkit',
    target: '#connectionToggle',
    title: 'Take attendance without a signal',
    body: 'Switch the top-bar control to Offline to model a weak connection. Choose a synthetic trainee and use the trainer-confirmed ID fallback. A QR card is optional; the camera is only requested if someone chooses Scan QR card.',
    note: 'The Offline switch only changes this demo’s status. It does not turn off your internet or prove that real-world offline capture is ready.',
  },
  {
    view: 'lesson',
    target: '.quiz-panel .card-heading-row',
    title: 'A short lesson, followed by a quiz',
    body: 'The trainee reads a short lesson about clear, careful cooperative records, then answers four questions. In this prototype, 75% (three answers out of four) is the passing score.',
    note: 'Lesson progress and quiz answers are stored in this browser. A pending result stays here until the simulated sync step.',
  },
  {
    view: 'fieldkit',
    target: '.pending-card .card-heading-row',
    title: 'Pending means “saved here, not sent”',
    body: 'Attendance and quiz results created while Offline appear in the field kit’s pending queue. They remain in this browser until the connection is switched back to Online and Sync now is used.',
    note: 'The queue is browser-local demo data—not a backup service or a cross-device transfer.',
  },
  {
    view: 'fieldkit',
    target: '#syncButton',
    title: 'Reconnect, then sync the queue',
    body: 'Switch back to Online and choose Sync now. The prototype marks queued records as synced and makes them available to the portal-style cohort view in this same browser.',
    note: 'No record is sent to a central NCCT service. This is a simulated sync, not a production backend.',
  },
  {
    view: 'courses',
    target: '.cohort-roster .card-heading-row',
    title: 'A coordinator can review cohort progress',
    body: 'The roster brings attendance and learning status together so a coordinator can see which synthetic trainees have checked in and completed the knowledge check. In this demo, the view reads the same browser’s local records.',
    note: 'There is no live staff portal or sharing between devices behind this screen.',
  },
  {
    view: 'certificates',
    target: '.cert-rules .section-kicker',
    title: 'Certificates follow clear completion rules',
    body: 'A trainee becomes eligible only after at least one attendance record and a quiz score of 75% or higher are both synced. The certificate QR opens a verification view that checks the current browser’s demo record.',
    note: 'The QR check is not an official credential service, and the certificate is not a production NCCT credential.',
  },
];

const esc = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export function createGuidedTour({ setView, renderApp }) {
  let current = -1;
  const root = () => document.querySelector('#tour-root');

  function clearHighlights() {
    document.querySelectorAll('.tour-focus').forEach(element => element.classList.remove('tour-focus'));
  }

  function positionCard() {
    const card = document.querySelector('#tour-root .tour-card');
    if (!card || card.classList.contains('is-conclusion')) return;
    const target = document.querySelector(steps[current]?.target);
    if (!target) {
      card.style.left = '50%';
      card.style.top = '50%';
      card.style.transform = 'translate(-50%, -50%)';
      return;
    }
    card.style.transform = 'none';
    const rect = target.getBoundingClientRect();
    const width = card.getBoundingClientRect().width || Math.min(390, window.innerWidth - 28);
    const margin = 14;
    const cardHeight = card.getBoundingClientRect().height || 300;
    const clamp = (value, max) => Math.min(Math.max(margin, value), Math.max(margin, max - margin));
    const candidates = [
      { left: rect.left + rect.width / 2 - width / 2, top: rect.bottom + 18 },
      { left: rect.left + rect.width / 2 - width / 2, top: rect.top - cardHeight - 18 },
      { left: rect.right + 18, top: rect.top + rect.height / 2 - cardHeight / 2 },
      { left: rect.left - width - 18, top: rect.top + rect.height / 2 - cardHeight / 2 },
    ].map(point => ({ left: clamp(point.left, window.innerWidth - width), top: clamp(point.top, window.innerHeight - cardHeight) }));
    const overlapArea = point => {
      const overlapWidth = Math.max(0, Math.min(point.left + width, rect.right) - Math.max(point.left, rect.left));
      const overlapHeight = Math.max(0, Math.min(point.top + cardHeight, rect.bottom) - Math.max(point.top, rect.top));
      return overlapWidth * overlapHeight;
    };
    const placement = candidates.reduce((best, point) => overlapArea(point) < overlapArea(best) ? point : best);
    card.style.left = `${placement.left}px`;
    card.style.top = `${placement.top}px`;
  }

  function buttonMarkup(label, action, kind = 'quiet', disabled = false) {
    return `<button class="button button-${kind} tour-control" data-tour-action="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
  }

  function renderConclusion() {
    return `<div class="tour-scrim" aria-hidden="true"></div>
      <section class="tour-card is-conclusion" role="dialog" aria-modal="true" aria-labelledby="tourConclusionTitle">
        <div class="conclusion-topline"><span class="conclusion-brand"><span class="brand-mark"><span></span><span></span><span></span><span></span></span> SAHAKARI · NCCT FIELD KIT</span><span class="conclusion-label">WALKTHROUGH COMPLETE</span></div>
        <div class="conclusion-hero"><div><p class="conclusion-kicker">FROM FIELD SESSION TO TRAINING RECORD</p><h2 id="tourConclusionTitle">A simple learning journey, with a clear finish.</h2><p>Attendance, a useful lesson, a knowledge check, and a completion rule can fit into one understandable flow for cooperative training.</p></div><div class="journey-stamp"><span>TRAIN</span><i>→</i><span>LEARN</span><i>→</i><span>VERIFY</span></div></div>
        <div class="conclusion-columns">
          <div class="conclusion-column"><h3>What this prototype shows</h3><ul><li>Trainer-confirmed, synthetic attendance</li><li>A short lesson and four-question quiz</li><li>Pending records and a simulated sync</li><li>A portal-style roster and local QR check</li></ul></div>
          <div class="conclusion-column future-column"><h3>What production would still need</h3><ul><li>Approved real devices, accounts, and operating procedures</li><li>A secure central service and tested offline conflict handling</li><li>Real cross-device sync and an authoritative certificate verifier</li><li>Privacy, security, accessibility, and field testing</li></ul></div>
        </div>
        <div class="conclusion-boundary"><strong>Prototype boundary:</strong> this app uses synthetic demo data in one browser. It does not connect to physical hardware, use facial recognition, run a production backend, or sync across devices.</div>
        <div class="tour-footer conclusion-footer"><span class="tour-progress">END · 08 STEPS</span><div class="tour-buttons">${buttonMarkup('‹ Back', 'back')} ${buttonMarkup('Finish walkthrough', 'close', 'primary')}</div></div>
      </section>`;
  }

  function render() {
    const container = root();
    if (!container) return;
    clearHighlights();
    if (current < 0) {
      container.innerHTML = '';
      return;
    }
    if (current === steps.length) {
      container.innerHTML = renderConclusion();
      bindControls();
      return;
    }
    const step = steps[current];
    const target = document.querySelector(step.target);
    if (target) target.classList.add('tour-focus');
    const details = step.details?.length
      ? `<div class="tour-detail-grid">${step.details.map(([label, text]) => `<div><strong>${esc(label)}</strong><span>${esc(text)}</span></div>`).join('')}</div>`
      : '';
    container.innerHTML = `<div class="tour-scrim" aria-hidden="true"></div>
      <section class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tourStepTitle" aria-describedby="tourStepBody">
        <div class="tour-card-top"><span class="tour-eyebrow">GUIDED WALKTHROUGH · STEP ${String(current + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}</span><button class="tour-close" data-tour-action="close" aria-label="Close walkthrough">×</button></div>
        <h2 id="tourStepTitle">${esc(step.title)}</h2><p class="tour-body" id="tourStepBody">${esc(step.body)}</p>${details}<div class="tour-note"><span aria-hidden="true">i</span><p>${esc(step.note)}</p></div>
        <div class="tour-footer"><span class="tour-progress">${current + 1} of ${steps.length}</span><div class="tour-buttons">${buttonMarkup('‹ Back', 'back', 'quiet', current === 0)}${buttonMarkup(current === steps.length - 1 ? 'See conclusion ›' : 'Next ›', 'next', 'primary')}</div></div>
      </section>`;
    bindControls();
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        requestAnimationFrame(positionCard);
      });
    } else requestAnimationFrame(positionCard);
  }

  function bindControls() {
    document.querySelectorAll('[data-tour-action]').forEach(button => button.addEventListener('click', () => {
      const action = button.dataset.tourAction;
      if (action === 'next') goTo(current + 1);
      if (action === 'back') goTo(current - 1);
      if (action === 'close') close();
    }));
  }

  function goTo(next) {
    if (next < 0) return;
    current = Math.min(next, steps.length);
    const step = steps[current];
    setView(step ? step.view : 'overview');
    renderApp();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function start() { goTo(0); }
  function close() {
    current = -1;
    clearHighlights();
    renderApp();
  }

  document.addEventListener('keydown', event => {
    if (current < 0) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowRight' && current < steps.length) goTo(current + 1);
    if (event.key === 'ArrowLeft' && current > 0) goTo(current - 1);
  });
  window.addEventListener('resize', positionCard);

  return { start, close, render };
}
