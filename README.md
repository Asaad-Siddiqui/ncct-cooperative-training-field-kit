# Sahakari Field Kit — NCCT Cooperative Training Prototype

A lightweight, responsive single-page prototype for a cooperative training field kit and its staff portal. It demonstrates the first slice of a larger NCCT/VAMNICOM training ecosystem: offline attendance capture, a short lesson and quiz, a simulated sync queue, progress visibility, and criteria-gated certificates with a verification view.

## Demo flow

1. Open **Field kit** and switch the simulated device to **Offline**.
2. Check in a synthetic trainee by scanning a QR card (where the browser supports `BarcodeDetector`) or by trainer-confirmed trainee ID. The same trainee cannot be counted twice for the demo session.
3. Open **Lesson & quiz**, mark the short lesson as read, and submit the four-question knowledge check. A score of 75% or higher is required.
4. Switch back **Online** and choose **Sync now**. The local pending queue is replayed idempotently into the simulated portal.
5. Open **Certificates**. A certificate is issued only after at least one synced attendance event and a synced passing quiz. Open its verification view or scan its QR code.

The first synthetic trainee is `STU-24017` (QR payload: `NCCT|STU-24017`). Other demo IDs are visible in the app. The quiz answers are about offline capture, trainer confirmation, duplicate-safe sync, and completion criteria.

## Prototype boundary

This is a browser-only prototype, not a production LMS, ERP, or central NCCT database. Attendance, quiz results, simulated portal state, and certificates are saved in `localStorage` in the current browser. Switching the connection control only simulates connectivity; syncing moves eligible records between the local field-kit queue and the portal view in this same browser. It does not send data to a central service or synchronize across devices. The verification view therefore checks the local prototype record only.

All people and IDs are synthetic. The demo does not use face recognition, hostel/logistics workflows, recruiter services, or external integrations. Camera access is requested only after a user explicitly chooses QR scanning and requires a secure browser context; trainer-confirmed ID remains available as a fallback.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. To create a static production build:

```bash
npm run build
```

## Temporary preview

With `dist/` built and Wrangler 4.102.0 available through `npx`, deploy a temporary preview with:

```bash
npx --yes wrangler@4.102.0 deploy --temporary
```

The temporary preview is public to anyone who has its link. It is not a production deployment and does not add a central backend.
