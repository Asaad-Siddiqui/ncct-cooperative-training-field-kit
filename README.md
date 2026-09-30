# Sahakari Field Kit — NCCT Cooperative Training Prototype
A responsive, browser-only prototype for a cooperative training field kit and portal-style cohort view. It demonstrates a small learning path: attendance, a short lesson and quiz, a simulated sync queue, cohort progress, and completion certificates with a local QR verification view.

## Guided walkthrough

Open the app and choose **Start** in the top bar. A highlighted screen and plain-language tip explain each step. Use **Next** and **Back** to move through the actual prototype screens; choose **Finish walkthrough** on the presentation-style conclusion.

The walkthrough explains:

1. **Training goal:** a practical cooperative record-keeping lesson with a clear way to follow participation and learning.
2. **Field team:** trainees take part, a trainer facilitates and confirms attendance, and a coordinator reviews cohort progress. The shared phone/tablet is only an example of the intended field workflow; no physical hardware is connected.
3. **Offline attendance:** switch the app’s connection control to Offline and use a synthetic trainee ID. QR scanning is optional; camera permission is requested only when Scan QR card is chosen.
4. **Lesson and quiz:** mark the short lesson read, then answer four questions. A score of 75% or more passes this demo check.
5. **Pending records:** offline attendance and quiz activity wait in the browser’s local queue.
6. **Sync and portal view:** switch to Online, choose **Sync now**, and view the resulting attendance and learning status in the cohort roster.
7. **Certificate:** one synced attendance record plus a synced quiz score of at least 75% makes the synthetic trainee eligible. The QR opens a local verification view.

The app remains usable without the walkthrough. Existing Field kit, Lesson & quiz, Courses & cohorts, Certificates, QR-card, verification, connection-toggle, sync, and reset-demo actions are retained.

## Prototype boundary

All names, IDs, and records are synthetic. Attendance, quiz answers, certificates, and the simulated portal are stored in `localStorage` in the current browser. The Online/Offline control only changes the demo state. Sync moves queued records into the portal-style view in this browser; it does not send data to NCCT or synchronize across devices. The certificate QR checks the local prototype record only.

This is **not** a production LMS, central NCCT database, official credential service, or connected hardware kit. It does not use facial recognition. A production system would still need approved devices and operating procedures, secure accounts and backend services, tested offline conflict handling, cross-device sync, an authoritative certificate verifier, and privacy/security and field testing.

Camera access is requested only after a user explicitly chooses QR scanning and requires a secure browser context. Trainer-confirmed ID remains available as a fallback.

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
