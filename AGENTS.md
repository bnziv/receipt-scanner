# AI Agent Instructions for receipt-scanner

## Project overview
- This is a small Next.js 14 app that uses Google Gemini via `@google/generative-ai` to parse restaurant receipts.
- The UI is in `components/ReceiptSplitter.tsx` and the homepage is rendered from `app/page.tsx`.
- The server-side receipt parser is implemented in `app/api/analyze/route.ts`.

## Setup and development
- Install dependencies: `npm install`
- Local dev server: `npm run dev`
- Production build: `npm run build`
- Start production server: `npm run start`
- The app depends on a Google AI Studio key in `process.env.GEMINI_API_KEY`.
- Use `.env.local` for local secrets; do not expose the key in browser code.

## Important files
- `package.json` — project scripts and dependencies.
- `README.md` — contains setup and deployment instructions.
- `app/page.tsx` — root page that renders the receipt splitter.
- `components/ReceiptSplitter.tsx` — client UI for uploading receipts, adding people, and assigning items.
- `app/api/analyze/route.ts` — API route that sends images to Gemini and returns parsed JSON.

## Key behavior and constraints
- The API route sends an image as Base64 and expects strict JSON output from Gemini.
- The prompt in `app/api/analyze/route.ts` requires the model to return only JSON, no markdown fences or extra text.
- The frontend expects response shape:
  - `items: [{name, price}]`
  - `subtotal`
  - `tax`
  - `tip`
  - `total`
- `tip` should be set to `0` if the receipt does not show a tip.
- The frontend uses the receipt data to calculate totals, tax, and assign items to people.

## Best practices for changes
- Preserve the server-side API route for model calls so the key stays hidden.
- If adjusting prompt or model, keep the response validation robust and handle parse errors gracefully.
- Keep UI logic in `components/ReceiptSplitter.tsx` and avoid moving AI key usage to client-side code.

## Notes for AI agents
- This repo is a production-style demo; avoid adding unnecessary backend complexity.
- If you need to update the receipt parsing behavior, update only `app/api/analyze/route.ts` and optionally the prompt text.
- Use README links for setup details instead of repeating full documentation.
