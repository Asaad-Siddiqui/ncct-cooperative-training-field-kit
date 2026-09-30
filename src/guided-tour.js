const steps = [
  {
    id: 'goal', view: 'overview', target: '.session-card',
    title: 'A practical NCCT training goal',
    body: 'Help cooperative teams build useful record-keeping habits, attend a field session, check what they learned, and keep a clear completion record.',
    next: 'Next opens the field-kit view and introduces the intended trainer setup.',
    note: 'This is one small training-flow prototype, not the full NCCT ERP or LMS. Every person and record is synthetic.',
  },
  {
    id: 'hardware', view: 'fieldkit', target: '#hardwareStatusCard',
    title: 'Simple hardware for a field pilot',
    body: 'A trainer could start with one Android phone or tablet and its built-in camera for printed QR cards. A power bank helps through the day; Wi-Fi or a mobile hotspot is used when it is time to sync. A staff member can review the cohort on an existing laptop.',
    next: 'Next sets this browser demo to Offline.',
    note: 'The status on this screen is explicit: no physical hardware is connected. A separate scanner is optional; face-recognition hardware is not part of this plan.',
  },
  {
    id: 'offline', view: 'fieldkit', target: '#connectionToggle', action: 'offline',
    title: 'Model a weak-signal training site',
    body: 'The guided step switches the prototype to Offline so attendance and the quiz result will be queued locally before the simulated sync.',
    next: 'Next records one trainer-confirmed attendance event for a synthetic trainee.',
    note: 'This toggle only changes the demo status. It does not disconnect the network or prove native/offline operation.',
  },
  {
    id: 'attendance', view: 'fieldkit', target: '#confirmIdButton', action: 'attendance',
    title: 'Record attendance with a confirmed ID',
    body: 'Samiksha Pawar (synthetic ID STU-24017) is selected. The guided flow records her check-in using the trainer-confirmed ID path; camera scanning is not required.',
    next: 'Next tries the same check-in again to demonstrate duplicate protection.',
    note: 'The event is marked Pending in this browser. The guided record is isolated from ordinary manual-session check-ins.',
  },
  {
    id: 'duplicate', view: 'fieldkit', target: '.pending-card', action: 'duplicate',
    title: 'A repeat check-in is rejected',
    body: 'The flow deliberately attempts the same trainee and session a second time. The app should reject it and leave the attendance count at one.',
    next: 'Next opens the lesson and marks its reading as complete.',
    note: 'Back and replay reuse the same guided event. They do not create another attendance or quiz event.',
  },
  {
    id: 'lesson', view: 'lesson', target: '.lesson-reading', action: 'lesson',
    title: 'A short lesson before the knowledge check',
    body: 'The lesson covers tidy records, purposeful use of personal information, and checking totals together. The guided action marks this reading complete so the quiz can open.',
    next: 'Next submits a four-question sample quiz and shows answer-by-answer feedback.',
    note: 'This learning content and completion state are synthetic browser-local demo data.',
  },
  {
    id: 'quiz', view: 'lesson', target: '.quiz-answer-review', action: 'quiz',
    title: 'Four questions, with visible feedback',
    body: 'The sample answers are submitted through the same assessment logic used by the manual quiz. The result panel shows the selected answers and whether each is correct.',
    next: 'Next returns to the field kit and shows both offline records in its queue.',
    note: 'A score of at least 75% (three of four) passes. This sample earns 100%; while Offline, it is still pending—not yet eligible for a certificate.',
  },
  {
    id: 'pending', view: 'fieldkit', target: '.pending-card',
    title: 'Pending means saved here, not sent',
    body: 'The field-kit queue now shows the attendance and quiz result. Both remain in this browser until the demo reconnects and sync is selected.',
    next: 'Next changes the simulated connection back to Online.',
    note: 'This is browser local storage, not a backup service, central database, or cross-device transfer.',
  },
  {
    id: 'reconnect', view: 'fieldkit', target: '#connectionToggle', action: 'online',
    title: 'Reconnect when a signal is available',
    body: 'The guided flow restores the simulated Online state. The records are still waiting; reconnecting alone does not mark them synced.',
    next: 'Next runs Sync now and applies the completion rule.',
    note: 'No live network request to an NCCT service is made by this prototype.',
  },
  {
    id: 'sync', view: 'fieldkit', target: '#syncButton', action: 'sync',
    title: 'Move the queue into the local portal view',
    body: 'The app runs its real demo sync action: pending items change to Synced and become visible in the portal-style cohort view in this same browser.',
    next: 'Next opens the updated cohort roster.',
    note: 'Sync is simulated locally. There is no central backend and no cross-device synchronization.',
  },
  {
    id: 'portal', view: 'courses', target: '.cohort-roster .guided-trainee-row',
    title: 'Review the updated training record',
    body: 'The roster now reflects the synced attendance and 100% knowledge check for the synthetic trainee. The overview, field kit, and roster all read the same browser-local records.',
    next: 'Next opens the certificate rules and eligibility result.',
    note: 'This is a portal-style screen, not a live staff portal or shared institution-wide database.',
  },
  {
    id: 'certificate', view: 'certificates', target: '.certificate-preview',
    title: 'Issue only after both records are synced',
    body: 'The demo requires one synced attendance record and a synced quiz score of at least 75%. After the simulated sync, the synthetic trainee is eligible and the app issues the certificate.',
    next: 'Next opens the certificate’s local verification view.',
    note: 'This is not an official NCCT credential or an authoritative certificate service.',
  },
  {
    id: 'verify', view: 'certificates', target: '.verification-card', action: 'verify',
    title: 'Verify the synthetic certificate locally',
    body: 'The app opens the same local verification view used by the certificate QR. It confirms that the certificate ID matches a record stored in this browser.',
    next: 'Next reviews exactly what this prototype does—and does not—implement.',
    note: 'A real verifier would need a secure issuing service. This local check is only a demonstration.',
  },
];

const esc = value => String(value).replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

export function createGuidedTour({ setView, renderApp, actions }) {
  let current = -1;
  let busy = false;
  let actionFeedback = '';
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
    const width = card.getBoundingClientRect().width || Math.min(410, window.innerWidth - 28);
    const margin = 14;
    const cardHeight = card.getBoundingClientRect().height || 320;
    if (['quiz', 'pending', 'portal'].includes(steps[current]?.id) && window.innerWidth > 760) {
      card.style.left = '260px';
      card.style.top = `${Math.min(Math.max(margin, 82), Math.max(margin, window.innerHeight - cardHeight - margin))}px`;
      return;
    }
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
    return `<button type="button" class="button button-${kind} tour-control" data-tour-action="${action}" ${disabled ? 'disabled' : ''}>${label}</button>`;
  }

  function renderConclusion() {
    return `<div class="tour-scrim" aria-hidden="true"></div>
      <section class="tour-card is-conclusion" role="dialog" aria-modal="true" aria-labelledby="tourConclusionTitle">
        <div class="conclusion-topline"><span class="conclusion-brand"><span class="brand-mark"><span></span><span></span><span></span><span></span></span> SAHAKARI · NCCT FIELD KIT</span><span class="conclusion-label">WALKTHROUGH COMPLETE</span><button class="tour-close" data-tour-action="close" aria-label="Exit walkthrough">×</button></div>
        <div class="conclusion-hero"><div><p class="conclusion-kicker">FROM FIELD SESSION TO TRAINING RECORD</p><h2 id="tourConclusionTitle">A clear training journey, with honest boundaries.</h2><p>Attendance, a useful lesson, a knowledge check, simulated sync, cohort progress, and a locally verified sample certificate fit into one understandable flow.</p></div><div class="journey-stamp"><span>TRAIN</span><i>→</i><span>LEARN</span><i>→</i><span>VERIFY</span></div></div>
        <div class="conclusion-columns">
          <div class="conclusion-column"><h3>What this prototype demonstrates</h3><ul><li>Trainer-confirmed attendance for synthetic trainees</li><li>A lesson and four-question assessment with feedback</li><li>Pending records, duplicate protection, and simulated sync</li><li>A portal-style roster and local certificate check</li></ul></div>
          <div class="conclusion-column future-column"><h3>What is not implemented</h3><ul><li>No physical field hardware is connected</li><li>No central NCCT backend or cross-device sync</li><li>No face recognition or production identity service</li><li>No installed Android app or authoritative certificate service</li></ul></div>
        </div>
        <div class="conclusion-boundary"><strong>Prototype boundary:</strong> all sample records live in this browser. The Offline switch and sync are simulated; no data is sent to a central system. A real pilot would still need approved devices, secure backend services, privacy/security review, and field testing.</div>
        <div class="tour-footer conclusion-footer"><span class="tour-progress">END · ${steps.length} DEMO STEPS</span><div class="tour-buttons">${buttonMarkup('‹ Back', 'back')}${buttonMarkup('Restart', 'restart')}${buttonMarkup('Exit', 'close', 'primary')}</div></div>
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
    const progress = Math.round((current + 1) / steps.length * 100);
    const details = actionFeedback
      ? `<div class="tour-action-feedback" role="status"><span aria-hidden="true">✓</span><p><strong>Demo action</strong>${esc(actionFeedback)}</p></div>`
      : '';
    container.innerHTML = `<div class="tour-scrim" aria-hidden="true"></div>
      <section class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tourStepTitle" aria-describedby="tourStepBody">
        <div class="tour-card-top"><div><span class="tour-eyebrow">GUIDED DEMONSTRATION · STEP ${String(current + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')}</span><div class="tour-progress-track" aria-label="${progress}% complete"><i style="width:${progress}%"></i></div></div><button class="tour-close" data-tour-action="close" aria-label="Exit walkthrough">×</button></div>
        <h2 id="tourStepTitle">${esc(step.title)}</h2><p class="tour-body" id="tourStepBody">${esc(step.body)}</p>${details}<div class="tour-next-cue"><strong>Up next</strong><span>${esc(step.next)}</span></div><div class="tour-note"><span aria-hidden="true">i</span><p>${esc(step.note)}</p></div>
        <div class="tour-footer"><span class="tour-progress">${current + 1} of ${steps.length}</span><div class="tour-buttons">${buttonMarkup('‹ Back', 'back', 'quiet', current === 0 || busy)}${buttonMarkup(current === steps.length - 1 ? 'Finish ›' : 'Next ›', 'next', 'primary', busy)}${buttonMarkup('Restart', 'restart', 'quiet', busy)}${buttonMarkup('Exit', 'close', 'quiet')}</div></div>
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
    document.querySelectorAll('[data-tour-action]').forEach(button => button.addEventListener('click', async () => {
      const action = button.dataset.tourAction;
      if (action === 'next') await goTo(current + 1);
      if (action === 'back') await goTo(current - 1);
      if (action === 'close') close();
      if (action === 'restart') await start();
    }));
  }

  async function goTo(next) {
    if (next < 0 || busy) return;
    busy = true;
    current = Math.min(next, steps.length);
    actionFeedback = '';
    render();
    if (current === 0) await actions.prepare();
    const step = steps[current];
    setView(step ? step.view : 'overview');
    if (step?.action) {
      try { actionFeedback = await actions.perform(step.action) || ''; }
      catch { actionFeedback = 'The step could not complete automatically. The ordinary app controls remain available after Exit.'; }
    }
    busy = false;
    renderApp();
    render();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  async function start() { await goTo(0); }
  function close() {
    current = -1;
    busy = false;
    clearHighlights();
    renderApp();
  }

  document.addEventListener('keydown', event => {
    if (current < 0 || busy) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowRight' && current < steps.length) goTo(current + 1);
    if (event.key === 'ArrowLeft' && current > 0) goTo(current - 1);
  });
  window.addEventListener('resize', positionCard);

  return { start, close, render };
}
