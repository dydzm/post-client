# Findings - API Testing Tool Enhancement

## Project Structure
- **Frontend:** Vue 3 (Composition API), Pinia, Tailwind 4.2.2, Radix Vue.
- **Backend:** FastAPI, httpx.
- **Workspace:** `ui/` for frontend, `app/` for backend.

## Existing State
- `ui/package.json` confirms Tailwind v4.2 and shadcn-ui dependencies.
- `GEMINI.md` outlines a hybrid GUI/CLI approach.
- Current request model: `method`, `url`, `headers`, `query`, `body`.

## New Requirements
- **URL Logic:** Auto-prefix `http://` for localhost and `https://` for others if protocol is missing.
- **Resizable Layout:** Draggable split panes for adjusting workspace sizes.
- **Responsive Design:** Mobile-friendly UI with adaptive layouts.
- **GUI-CLI Sync:** Pressing Enter in GUI URL input should trigger CLI command entry.
- **Response Viewer:** 
  - Tabs: Body, Headers, Preview.
  - Body: Syntax highlighting, Minify/Prettify.
  - Preview: Render HTML/Images.
  - Headers: Structured list/table.
- **Collections:** Sidebar with tree view, Import/Export `collection.json`.
- **Tabs:** Multi-tab support for concurrent request testing.
