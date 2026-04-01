# Memory Match (Next.js)

Face search website where user uploads one selfie and gets only related matching images from your dataset.

## Current Setup

- Next.js App Router (JavaScript)
- D3 installed for future chart/analytics usage
- Dataset folder created: `public/dataset`
- Upload page created: `/find-me`
- API route created: `/api/match`

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Folder Flow

- `public/dataset`: put all source images here (group photos, event photos, etc.)
- `src/app/find-me/page.js`: user uploads selfie
- `src/app/api/match/route.js`: server route that reads dataset and returns matches
- `src/lib/face/match-face.js`: face comparison logic

## Important Note

Right now, matching logic is placeholder and returns dataset items. This is done intentionally to keep the full request flow working first.

## Next Implementation Steps

1. Add real face model on server side in `src/lib/face/match-face.js`.
2. For each dataset image, detect all faces and store embeddings.
3. For uploaded selfie, generate embedding and compare with stored embeddings.
4. Use threshold (example `0.45`) to decide if same person.
5. Return only matched images from API.
6. Optional: keep secure images outside `public` and serve only authorized matched files.

## Suggested Face Library (Next.js only)

- Good balance for your requirement: `face-api.js` + `@tensorflow/tfjs-node` (server side)
- Faster and modern alternative: `@vladmandic/face-api` with Node backend in Next.js route handlers

No Python is required for this architecture.
