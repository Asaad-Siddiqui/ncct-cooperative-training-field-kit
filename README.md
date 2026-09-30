# Co Step

**Co Step** is a browser-based prototype for exploring a practical cooperative-training journey in the NCCT context: record attendance, complete a short lesson and knowledge check, simulate syncing activity, review a cohort, and verify a sample completion record locally.

[Open the hosted demo](https://sahakari-seven.vercel.app/)

> **Demo data only:** every participant, ID, attendance event, quiz result, and certificate shown in the prototype is synthetic. Do not enter real participant information.

## Who it serves

Co Step is a conversation and walkthrough aid for cooperative trainers, training coordinators, programme staff, and people evaluating a possible field-training workflow. It is designed to make the steps and their assumptions visible; it is not an operational NCCT service or a production learning platform.

## What the demo covers

The prototype focuses on one sample cohort of six synthetic trainees and one short course. It includes trainer-confirmed ID check-in, optional QR-card scanning where the browser supports it, duplicate check-in protection, a short reading, a four-question quiz, a browser-local activity queue, a simulated cohort roster, and a sample certificate with a local verification view.

A passing score is 75% or higher. The sample certificate is issued only after at least one attendance event and a passing quiz result are both marked synced in the demo. These rules are part of the prototype, not an approved credential policy.

## Guided walkthrough

From **Overview**, choose **Start**. Each **Next** advances the guide and carries out the next synthetic demo action: switch to the simulated offline state, record and reject a duplicate check-in, mark the lesson read, submit the sample quiz, reconnect, run simulated sync, review the cohort record, and open the local certificate check. The closing screen explains what the prototype does and does not implement.

**Back** replays a step safely; guided attendance and quiz activity are reused instead of duplicated. **Restart** removes only the walkthrough’s synthetic events, while **Exit** leaves the ordinary app available. The navigation and manual demo controls can also be explored without starting the guide.

## Run locally

You’ll need Node.js and npm. From the project directory:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To build and preview the static production bundle:

```bash
npm run build
npm run preview
```

`npm run build` is the project’s available build check. There is no automated test suite configured yet.

## Technology

The interface is a client-side JavaScript application built and served with Vite, with plain CSS for layout and styling. Demo state is stored in the current browser’s `localStorage`; the `qrcode` package creates sample QR codes. Camera scanning is opt-in and depends on browser support and a secure context such as HTTPS or localhost.

## Prototype limits

The Online/Offline control only changes the demo state; it does not disconnect the device or demonstrate a fully offline-capable installed app. Sync only changes sample records in this browser. There is no central NCCT database, account system, cross-device sync, production identity service, connected field hardware, or authoritative certificate issuer/verifier. Local storage is not a backup, shared database, or secure records system.

The certificate and its QR check are demonstrations only, not official credentials. Camera access is requested only after someone chooses QR scanning; trainer-confirmed ID remains available as a fallback. No facial recognition is used.

## Realistic next steps

Before any operational pilot, validate the workflow and training content with the intended cooperative teams and relevant NCCT stakeholders. Agree on data minimisation, consent, access roles, retention, and support responsibilities before designing a real system.

A production effort would then need secure accounts and backend services, reliable offline storage and cross-device sync with deduplication and conflict recovery, accessible field testing on target devices and networks, and an authoritative certificate service with a verification process. Those capabilities are outside this prototype.
