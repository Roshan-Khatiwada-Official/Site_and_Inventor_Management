# Google Sheet as the database — setup

This makes one Google Sheet the shared, always-on database for the app.
No staff Google logins, no hourly token expiry.

## What you need
- A Google account (the "owner" of the database).
- One Google Sheet (blank is fine).

## Steps

1. **Create / open the sheet** you want to use as the database.
2. In the sheet: **Extensions → Apps Script**.
3. Delete the sample code, paste everything from **`Code.gs`** (in this folder), and **Save**.
4. Near the top, change:
   ```js
   var SECRET_TOKEN = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';
   ```
   to your own long random string. Keep it private — anyone with the URL **and**
   this token can read/write the data.
5. **Deploy → New deployment**.
   - Click the gear → **Web app**.
   - **Execute as:** Me
   - **Who has access:** Anyone
   - **Deploy**, then approve the Google permission prompt.
6. Copy the **Web app URL** (ends in `/exec`).
7. In the app, sign in as Admin or Operations Manager → **Sheets Sync** button →
   **"Use Google Sheet as the Live Database"** → paste the Web app URL and the same
   token → **Connect**.

That's it. From now on:
- The app loads data from the sheet on startup.
- Every change (sites, collectors, dispatches, equipment, transfers, users) is
  written back to the sheet automatically (~2s debounce).
- The sheet has readable tabs (`Sites`, `Collectors`, …) plus a hidden `_raw`
  tab that holds the authoritative data. **Edit the readable tabs is view-only in
  practice** — to change data, use the app, or edit `_raw` carefully.

## Updating the script later
Apps Script → **Deploy → Manage deployments** → edit the existing deployment →
pick the new version. This keeps the **same URL** so the app stays connected.

## Security notes
- The token is stored in the browser (localStorage) and sent with each request.
- The `Users` tab / `_raw` contains login IDs and passwords in plain text. Restrict
  who can open the sheet accordingly.
- To rotate the token: change `SECRET_TOKEN`, redeploy (same deployment), then
  reconnect in the app with the new token.
