# Sahakari Field Kit — NCCT Cooperative Training Prototype
A responsive, browser-only prototype for a cooperative training field kit and portal-style cohort view. It demonstrates a small learning path: attendance, a short lesson and quiz, a simulated sync queue, cohort progress, and completion certificates with a local QR verification view.

## Guided walkthrough

Open the app and choose **Start** in the top bar. Each **Next** advances to a highlighted app screen and performs the corresponding synthetic demo action, including attendance, duplicate rejection, lesson completion, the four-question quiz, reconnect, sync, certificate issuance, and local verification. **Back** replays the current step safely; guided attendance and quiz results are reused rather than duplicated. **Restart** resets only the walkthrough's synthetic events, while **Exit** returns to the normal app. The ordinary navigation and manual app actions remain available outside the walkthrough.

The walkthrough explains:

1. **Training goal and intended hardware:** introduce practical cooperative record keeping and a modest possible field setup (Android phone/tablet, optional built-in camera QR scan, power bank, and later Wi-Fi/hotspot); clearly state that no hardware is connected.
2. **Offline attendance:** set the simulated status to Offline; record one synthetic check-in with trainer-confirmed ID; attempt a duplicate and show it is rejected.
3. **Lesson and quiz:** complete a short reading and submit four sample answers, with visible per-question feedback. A score of 75% or more passes.
4. **Pending records:** show attendance and quiz activity in the browser-local queue.
5. **Reconnect and simulated sync:** return to Online, run **Sync now**, and move the records into the portal-style view in this same browser.
6. **Portal and certificate:** show the updated synthetic trainee row; issue a certificate only when attendance and the passing quiz are both synced, then open its local verification view.
7. **Prototype limits:** finish by distinguishing this browser-only demonstration from a real NCCT system.

The app remains usable without the walkthrough. Existing Field kit, Lesson & quiz, Courses & cohorts, Certificates, QR-card, verification, connection-toggle, sync, and reset-demo actions are retained.

## Prototype boundary

All names, IDs, and records are synthetic. Attendance, quiz answers, certificates, and the simulated portal are stored in `localStorage` in the current browser. The Online/Offline control only changes the demo state. Sync moves queued records into the portal-style view in this browser; it does not send data to NCCT or synchronize across devices. The certificate QR checks the local prototype record only.

This is **not** a production LMS, central NCCT database, official credential service, or connected hardware kit. It does not use facial recognition. A production system would still need approved devices and operating procedures, secure accounts and backend services, tested offline conflict handling, cross-device sync, an authoritative certificate verifier, and privacy/security and field testing.

The guided walkthrough does not require camera access; it records attendance using trainer-confirmed ID. In ordinary manual mode, camera access is requested only after the user explicitly chooses QR scanning and requires a secure browser context. Trainer-confirmed ID remains available as a fallback.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To create a static build:

```bash
npm run build
```

## Temporary preview

With the static build and Wrangler 4.102.0 available through `npx`, an unauthenticated temporary preview can be deployed with:

```bash
npx --yes wrangler@4.102.0 deploy --temporary
```

Anyone with the preview link can access that temporary deployment. It is not a production deployment and does not add a central backend.
