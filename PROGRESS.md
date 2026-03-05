# Resume Builder — Progress & Handoff

## GitHub Repo
https://github.com/agup792/resume-on-steroids

## Project Location
`/Users/akshay-seekout/Documents/Projects_code/resume_on_steroids /resume-builder/`
> **Note**: The parent directory has a trailing space in its name.

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Typst CLI**: v0.14.2 installed at `~/.local/bin/typst` — compiles `.typ` files to PDF and PNG
- **LLM**: Azure AI Foundry via `@ai-sdk/azure` (Vercel AI SDK) — not yet connected, demo mode works without credentials
- **State**: React `useReducer` — in-memory, no persistence

## Dev Server
- Runs via `npx next dev --hostname 127.0.0.1 --port 3000` from the `resume-builder/` directory
- `.env.local` exists with placeholder Azure credentials (in `.gitignore`, never committed)

---

## What's Built (Phases 1-6 Complete)

### Phase 1: Scaffold + Landing Page ✅
- Next.js + Tailwind project with DM Sans / DM Mono fonts
- Landing page with drag-and-drop PDF upload zone, value props, "or try with a sample resume" demo button
- Dependencies installed: `ai`, `@ai-sdk/azure`, `zod`, `cheerio`, `pdfjs-dist`, `uuid`, `typst`

### Phase 2: Typst Compilation + PDF Preview ✅
- **`/api/compile` route** (`src/app/api/compile/route.ts`): receives Typst source, writes to temp file, calls `~/.local/bin/typst compile` to generate both PDF and PNG, returns JSON `{ pdf: base64, pageImages: [data:image/png;base64,...], pageCount: number }`
- **CenterPanel** (`src/app/components/CenterPanel.tsx`): renders server-generated PNG images as `<img>` tags — no client-side pdfjs-dist (that approach failed due to worker loading issues in Cursor's embedded browser)
- **Full 3-panel layout** working: left nav (220px), center preview (flexible), right chat (360px) with 52px header
- **Demo flow** verified end-to-end: click "try with a sample resume" → parsing progress → 3-panel layout with rendered resume PDF in center

### Phase 3: Chat Editing (Demo Mode) ✅ — Integration Tested 2026-03-05
- Send chat message → API responds → user message + assistant response appear in chat with edit badge
- Suggestion chip clicks trigger messages identically to typed input
- Input shows "Processing..." (disabled) during API call
- After chat edit, Typst recompiles and preview updates via `UPDATE_TYPST → compileTypst() → UPDATE_PREVIEW`
- Demo mode: chat API returns original Typst source with mock summary, preview recompiles successfully

### Phase 4: Clarification ✅ — Integration Tested 2026-03-05
- Ambiguous requests (e.g., "add my certification") trigger clarification response
- Clarification responses show amber "Needs your input" badge
- **Undo not yet implemented**: `UNDO` action exists in reducer but no UI trigger (no undo button, no "undo" command detection)

### Phase 5: Tailoring ✅ — Integration Tested 2026-03-05
- Paste JD URL in left panel → click Go → tailor API called → new variant created
- New variant appears in left nav with green dot, auto-selected
- Tailor progress messages appear in original variant's chat
- Chat input disabled during tailoring with "Processing..." state
- Compile loading indicator ("Compiling preview...") shown in center panel

### Phase 6: Variant Management ✅ — Integration Tested 2026-03-05
- Switching variants updates: center preview, chat history, right panel header, active highlight
- Delete variant button appears on hover for tailored variants
- Independent chat histories per variant (tailored variant gets fresh welcome + suggestions)
- Variant context hint shown: "Editing: [name] · Changes won't affect your original"
- Variant items now use semantic `<button>` elements with `aria-current` for accessibility

### Bugs Fixed During Testing
1. **CenterPanel `previewImages` crash**: `previewImages` could be `undefined` causing `TypeError: Cannot read properties of undefined (reading 'length')`. Fixed with default parameter `previewImages = []`.
2. **Variant items not accessible**: Left panel variant items were `<div onClick>` without semantic roles. Changed to `<button>` with `aria-current` state. Nested delete button changed to `<span role="button">` to avoid invalid button nesting.

### Architecture (verified working)

#### API Routes (all have demo-mode fallbacks)
- **`/api/parse`** (`src/app/api/parse/route.ts`): accepts PDF upload, returns Typst source. Demo mode returns a sample Jane Smith resume.
- **`/api/chat`** (`src/app/api/chat/route.ts`): accepts Typst source + chat history + user message, returns `{ action: "edit", typstSource, summary }` or `{ action: "clarify", question }`. Demo mode returns mock responses.
- **`/api/tailor`** (`src/app/api/tailor/route.ts`): accepts Typst source + JD URL, returns tailored variant. Demo mode returns original source with a demo label.
- **`/api/compile`** (`src/app/api/compile/route.ts`): compiles Typst → PDF + PNG. Fully working.

#### Components
- `LandingView.tsx` — upload zone + demo button
- `ParsingView.tsx` — step-by-step progress during PDF processing
- `MainLayout.tsx` — 3-panel grid container with header
- `LeftPanel.tsx` — variant list with semantic buttons + tailor URL input
- `CenterPanel.tsx` — renders preview images from server (with safe default)
- `RightPanel.tsx` — chat messages, input, suggestion chips
- `ChatMessage.tsx` — individual message bubble with edit/clarification badges
- `TypingIndicator.tsx` — animated dots during LLM processing
- `SuggestionChips.tsx` — clickable suggestion pills

#### State Management (`src/lib/state.ts`)
- `useReducer` with actions: `SET_PARSING`, `SET_READY`, `SET_ACTIVE_VARIANT`, `ADD_VARIANT`, `DELETE_VARIANT`, `UPDATE_TYPST`, `UPDATE_PREVIEW`, `ADD_CHAT_MESSAGE`, `UNDO`, `RESET`
- `createVariant()` helper

#### Types (`src/lib/types.ts`)
- `AppState`, `ResumeVariant` (with `compiledPdf: string | null`, `previewImages: string[]`), `ChatMessage`, `ParsingStep`

#### LLM Prompts (`src/lib/prompts.ts`)
- `CHAT_SYSTEM_PROMPT` — resume editing agent with tool-use (update_resume / ask_clarification)
- `VISION_EXTRACTION_PROMPT` — PDF-to-text extraction
- `TYPST_CONVERSION_PROMPT` — text-to-Typst conversion using basic-resume template
- `RUBRIC_CREATION_PROMPT` — JD → scoring rubric
- `TAILORING_PROMPT` — resume tailoring against rubric

#### AI Config (`src/lib/ai.ts`)
- Azure AI Foundry client via `@ai-sdk/azure`

#### Client Typst Helper (`src/lib/typst.ts`)
- `compileTypst(source)` → calls `/api/compile`, returns `{ pdf, pageImages, pageCount }`
- `pdfBase64ToUint8Array(base64)` → for download

---

### Phase 7: Polish + Error Handling ✅ — Implemented 2026-03-05

#### Typst Compile Retry with LLM Error Recovery
- `compileTypstWithRetry()` in `src/lib/typst.ts` — attempts compile, on failure calls `/api/fix-typst` to fix the Typst source via LLM, retries up to 2 times
- `/api/fix-typst/route.ts` — new endpoint that feeds compile errors to the LLM and returns corrected Typst source
- On final failure: reverts to last working version (dispatches `UNDO`) and shows user-friendly error: "Couldn't apply that change — the updated resume had a formatting error. Your resume has been restored."

#### Azure AI Retry Logic
- Chat route (`/api/chat`) — auto-retries Azure AI call once (1s delay) before falling back to demo mode
- Parse route (`/api/parse`) — auto-retries Azure AI call once before falling back to demo mode
- Tailor route (`/api/tailor`) — returns specific error messages for each failure scenario

#### Error Messages (per spec Section 14)
| Scenario | Message |
|----------|---------|
| Typst compile fails after retries | "Couldn't apply that change — the updated resume had a formatting error. Your resume has been restored." |
| Tailored variant compile fails | "Created tailored variant, but the preview couldn't be generated." (still saves the variant) |
| Azure AI unavailable | "The AI service is temporarily unavailable. Please try again in a moment." |
| Generic error | "Something went wrong. Please try again." |
| JD URL blocked/unreachable | "Couldn't access that URL — it may be blocked or unreachable." |
| JD URL HTTP error | "Couldn't access that URL (HTTP {status})." |
| JD URL no content | "Couldn't find a job description on that page." |
| AI tailoring failure | "The AI service encountered an error while tailoring." |

#### LLM No Tool Call Handling
- Chat route handles `result.toolCalls` being empty — returns a clarification response asking user to rephrase

#### Parse Route Section Detection
- Extracts section names from the LLM's extracted text and returns them in the `summary.sections` array
- Welcome message now shows "Detected sections: ..." when real PDF is parsed

#### Additional Polish
- Suggestion chips now show until the user sends their first message (not just when chatHistory is empty)
- JD text truncated to 8K chars to avoid exceeding LLM context limits
- Tailor URL fetch has 15s timeout with `AbortSignal.timeout`

#### Already Working (verified during Phase 3–6 testing)
- Keyboard shortcuts: Enter to send, Shift+Enter for newline

---

## Azure AI Setup

To connect real Azure AI (replacing demo mode), update `.env.local`:
```
AZURE_RESOURCE_NAME=your-actual-resource-name
AZURE_API_KEY=your-actual-api-key
AZURE_DEPLOYMENT_NAME=gpt-4o
```
The app auto-detects when credentials are present and switches from demo mode to real AI.

---

## Key Decisions Made
1. **Server-side Typst compilation** instead of WASM: Typst CLI is simpler and more reliable than `@myriaddreamin/typst.ts` WASM in the browser
2. **Server-side PNG rendering** instead of client-side pdfjs-dist: Typst CLI natively outputs PNG (`--format png`), avoiding all browser PDF.js worker issues
3. **Demo mode fallbacks**: All API routes work without Azure AI credentials by returning sample/mock data
4. **basic-resume template v0.2.9**: Typst's package manager auto-downloads it on first compile

## Sample Typst Source (for testing)
The sample resume is hardcoded in `src/app/page.tsx` as `SAMPLE_TYPST` — a Jane Smith resume with Education, Work Experience, Projects, and Skills sections using the `basic-resume` template.
