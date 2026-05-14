# Receipt Splitter

Split restaurant bills fairly. Upload a receipt photo → AI reads every item → assign to people → get exact amounts with tax & tip.

---

## 1. Get a free Gemini API key

1. Go to **https://aistudio.google.com/app/apikey**
2. Sign in with a Google account
3. Click **Create API key** — copy it

---

## 2. Local development

```bash
# Install dependencies
npm install

# Set up your API key
cp .env.local.example .env.local
# Open .env.local and paste your Gemini key

# Run dev server
npm run dev
```

Open **http://localhost:3000**

---

## 3. Import into Claude Code (VS Code)

### Option A — Open folder directly (simplest)

1. Unzip this project somewhere on your machine, e.g. `~/Projects/receipt-splitter`
2. In VS Code: **File → Open Folder** → select the folder
3. Open the Claude Code panel (sidebar icon or `Cmd+Shift+P` → "Claude")
4. Say: *"Set up this project — install dependencies and create .env.local with a placeholder for GEMINI_API_KEY"*

### Option B — Claude Code terminal commands

With Claude Code open in VS Code, paste this into the Claude Code chat:

```
Please do the following to set up this Next.js project:
1. Run `npm install` in the terminal
2. Create a .env.local file from .env.local.example
3. Start the dev server with `npm run dev`
Let me know when localhost:3000 is ready.
```

### Option C — Clone from GitHub first

If you push this to GitHub first:

```bash
git clone https://github.com/YOUR_USERNAME/receipt-splitter
cd receipt-splitter
code .  # opens in VS Code
```

Then open Claude Code and ask it to finish setup.

---

## 4. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or via the Vercel dashboard:
1. Push repo to GitHub
2. Import at **vercel.com/new**
3. Add environment variable: `GEMINI_API_KEY` = your key
4. Deploy

---

## Project structure

```
receipt-splitter/
├── app/
│   ├── api/analyze/route.ts   ← Gemini API call (server-side, key never exposed)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── ReceiptSplitter.tsx    ← all UI and state
├── .env.local.example         ← copy to .env.local and add your key
└── package.json
```
