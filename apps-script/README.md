# Google Sheet as the database — setup

This makes one Google Sheet the shared, always-on database for the app.
No staff Google logins.

## First-time setup

1. **Create / open the sheet** you want to use as the database.
2. **Extensions → Apps Script**.
3. Delete the sample code, paste everything from **`Code.gs`** (in this folder), **Save**.
4. Set `SECRET_TOKEN` near the top to your own long random string. It must match the
   token built into the app (`src/services/sheetsBridge.ts` → `DEFAULT_BRIDGE_CONFIG.token`).
5. **Deploy → New deployment** → gear → **Web app**.
   - **Execute as:** Me
   - **Who has access:** Anyone
   - **Deploy**, then approve the Google permission prompt.
6. Copy the **Web app URL** (ends in `/exec`) and put it in
   `src/services/sheetsBridge.ts` → `DEFAULT_BRIDGE_CONFIG.webAppUrl`.

Current deployment URL (in `src/services/sheetsBridge.ts`):
`https://script.google.com/macros/s/AKfycbwNibLBQSaRh29qRtpB4_o0q4cSk7Q6uVMJFWhRmdw53o-vXETVou9QcWu6dJMllLhtTQ/exec`

## Redeploying after a code change (e.g. new collections)

The script is **collection-agnostic** — it stores the whole dataset in the hidden
`db` tab and renders a readable tab for every array it finds. You still need to
push a new version when `Code.gs` itself changes:

1. Apps Script → paste the new `Code.gs`, **Save**.
2. **Deploy → Manage deployments** → ✏️ edit the existing deployment →
   **Version: New version** → **Deploy**.
   The **Web app URL stays the same**, so the app keeps working.

## Notes

- The token is stored in the browser and shipped in the app bundle — treat it as
  "anyone who can open the app can read/write the sheet". Rotate it by changing
  `SECRET_TOKEN`, redeploying (same deployment), and updating `sheetsBridge.ts`.
- The `Users` tab contains login IDs and passwords in plain text. Restrict who can
  open the sheet.
- Edit data through the app. The readable tabs are rebuilt from `db` on every save.
