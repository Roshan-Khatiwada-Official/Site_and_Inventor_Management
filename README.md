# Site &amp; Inventory Manager

## Run locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`

The app is served at `http://localhost:3000` and on your local network at
`http://<your-computer-ip>:3000` (other devices on the same Wi‑Fi can open it).

Live (GitHub Pages): **https://roshan-khatiwada-official.github.io/Site_and_Inventor_Management/**

---

## What it is

A small field-operations app. **Site Finders** add field sites, **Data Collectors**
request sites and log how many hours of data they collect, and the **Admin** manages
the inventory, assigns collectors to sites (with inventory items), approves requests,
and reads the reports. All data is stored in **one shared Google Sheet**.

## Roles

| Role | Can do | Sees |
| --- | --- | --- |
| **Admin** | Manage inventory; assign a data collector to a site and hand them inventory items; approve/reject site requests; manage logins; read all reports. | Everything |
| **Site Finder** | Add / edit field sites (name, GPS with "use current location", supervisor + contact, number of workers, a note). | **Only the sites they added** |
| **Data Collector** | Browse available sites and request the ones they want; on their assignments, log collection hours (date + hours + optional note) and mark the site done. | **Only their own** requests and assignments, plus the public list of available sites |

Everyone signs in with an in-app **Login ID + password** (created by the Admin under
**Logins**). This is not a Google login.

## The tabs

**Admin**
- **Sites** — every site, and which Site Finder added it. Add / edit / delete.
- **Inventory** — simple item list (Item ID, Name, Category, Quantity, Note). Add / edit / delete. Items that are out show as *Out · <collector>*; a returned-with-a-problem item shows as *Flagged*.
- **Returns** — items currently out with collectors. **Check in** opens a form ("is everything OK? camera, lens, cables, battery, body") — if not OK you add a note and the item is flagged in the inventory.
- **Assignments** — assign a Data Collector to a Site and tick the inventory items they take. Only available (not out, not flagged) items are selectable. Shows hours logged.
- **Requests** — data collectors' requests for available sites. **Approve** opens a picker to hand over inventory items, then creates the assignment; **Reject** dismisses it.
- **Reports** — the numbers (see below).
- **Logins** — create / edit / suspend / delete user logins and set their role.

A data collector can only have **one open site at a time** — a pending request or an active assignment blocks new requests until that site is marked done.

Site location can be set three ways: **use current location** (on site), **paste a Google Maps link**, or **search a place name**.

**Site Finder**
- **My Sites** — add and manage the sites you found. New sites start as *Available*.

**Data Collector**
- **Available Sites** — every *Available* site, with a **Request** button. Shows your request status.
- **My Work** — your assignments. For each: the site, the inventory items you were given,
  and a form to **log hours** (date + hours + note). Sessions add up into a total. Mark it done when finished.

## Reports (Admin)

- **Totals:** number of Data Collectors, number of Sites, total hours logged, number of Site Finders.
- **Collection log:** one row per assignment — Data Collector · Site · Found by · Hours · Sessions · Status. Filter by collector, by site, or free-text search.
- **Total hours per site** (+ who found it, + which collectors worked it).
- **Total hours per data collector** (+ how many sites).

## How the data is stored (Google Sheet = database)

- A **Google Apps Script** ([`apps-script/Code.gs`](apps-script/Code.gs)) is deployed from
  the Sheet as a Web App. Setup / redeploy steps: [`apps-script/README.md`](apps-script/README.md).
- The Web App URL + token are built into the app, so **every device connects automatically** —
  no Google sign-in for staff.
- The app **loads from the Sheet on startup** and **writes every change back automatically**
  (~2 s later), and every ~12 s it re-checks the sheet so other people's changes
  appear on your screen automatically. One readable tab per collection (`Sites`,
  `Inventory`, `Assignments`, `Requests`, `Users`) plus a hidden `_raw` tab that
  holds the authoritative copy.
  **Edit data through the app, not by typing in the tabs.**

```
 App (any device) ──auto-save on every edit──▶  Apps Script Web App ──▶  Google Sheet
        ▲                                                                     │
        └──────────────── auto-load on startup / manual "pull" ───────────────┘
```

## Typical workflow

```mermaid
flowchart TD
    A[Admin creates logins and assigns roles] --> B[Site Finder adds sites\nname, GPS, supervisor, workers, note]
    B --> C[Admin adds inventory items]
    C --> D{How does a collector get a site?}
    D -->|Admin assigns directly| E[Admin: New Assignment\npick Data Collector + Site + inventory items]
    D -->|Collector asks| F[Data Collector requests an available site] --> G[Admin approves -> assignment created]
    E --> H[Data Collector opens 'My Work'\nsees site + assigned items]
    G --> H
    H --> I[Data Collector logs hours per session\ndate + hours + note]
    I --> J[Marks the assignment done]
    J --> K[Admin 'Reports'\nhours per site, hours per collector,\nwho collected where, who found the site]

    B -.auto-save.-> S[(Google Sheet)]
    E -.auto-save.-> S
    I -.auto-save.-> S
    S -.loaded on startup by every device.-> A
```

Plain-text version:

```
1. Admin           -> create Login IDs + roles (Admin / Site Finder / Data Collector)
2. Site Finder     -> add sites (name, GPS, supervisor, workers, note)  [status: Available]
3. Admin           -> add inventory items (Item ID, Name, ...)
4a. Admin          -> New Assignment: choose Data Collector + Site + inventory items
4b. or Data Collector -> request an Available site  ->  Admin approves  ->  assignment created
5. Data Collector  -> "My Work": see the site + items; log hours (date + hours + note) per session
6. Data Collector  -> mark the assignment Done
7. Admin           -> "Reports": total hours per site / per collector, who collected where,
                      and which Site Finder found each site

Every step auto-saves to the shared Google Sheet; every device loads from it on startup.
```
