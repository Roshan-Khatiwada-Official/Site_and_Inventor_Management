/**
 * Site & Inventory Manager — Google Sheets database bridge (generic).
 *
 * Stores the authoritative JSON in a hidden `_raw` tab and renders one readable
 * tab per top-level array in the data (sites, inventory, assignments, requests,
 * users, …). Collection-agnostic: no code change needed when collections change.
 *
 * Every write snapshots whatever was there IMMEDIATELY BEFORE it, to a
 * timestamped file in a Drive folder — so a single bad write (a buggy client
 * overwriting everything, a mistaken bulk edit, anything) can always be
 * undone by restoring the snapshot from just before it, instead of having to
 * reconstruct what was lost by hand.
 *
 * SETUP / REDEPLOY:
 *   1. Google Sheet -> Extensions -> Apps Script -> paste this file -> Save.
 *   2. Set SECRET_TOKEN below to your own long random string.
 *   3. Deploy -> Manage deployments -> edit -> Version: New version -> Deploy
 *      (keeps the same Web app URL).
 */

var SECRET_TOKEN = 'siteops-db-2026-Kx9mPq3nRw7v';
var RAW_SHEET = 'db';
var BACKUP_FOLDER_NAME = 'SiteOps Backups';
var BACKUP_RETENTION_DAYS = 30;

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var params = (e && e.parameter) || {};
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (err) { body = {}; }
    }

    var token = body.token || params.token;
    if (token !== SECRET_TOKEN) {
      return output.setContent(JSON.stringify({ ok: false, error: 'Unauthorized: bad token' }));
    }

    var action = body.action || params.action || 'read';

    if (action === 'write') {
      var lock = LockService.getScriptLock();
      lock.waitLock(20000);
      try {
        backupBeforeWrite();
        writeAll(body.data || {});
      } finally {
        lock.releaseLock();
      }
      return output.setContent(JSON.stringify({ ok: true, savedAt: new Date().toISOString() }));
    }

    if (action === 'listBackups') {
      return output.setContent(JSON.stringify({ ok: true, backups: listBackups() }));
    }

    if (action === 'restoreBackup') {
      var name = body.name || params.name;
      if (!name) return output.setContent(JSON.stringify({ ok: false, error: 'Missing backup name' }));
      var lock2 = LockService.getScriptLock();
      lock2.waitLock(20000);
      var restored;
      try {
        backupBeforeWrite(); // so restoring is itself undoable
        restored = restoreBackup(name);
      } finally {
        lock2.releaseLock();
      }
      return output.setContent(JSON.stringify({ ok: true, data: restored, restoredAt: new Date().toISOString() }));
    }

    return output.setContent(JSON.stringify({
      ok: true,
      data: readAll(),
      fetchedAt: new Date().toISOString()
    }));
  } catch (err) {
    return output.setContent(JSON.stringify({ ok: false, error: String(err) }));
  }
}

function book() { return SpreadsheetApp.getActiveSpreadsheet(); }

// A single Sheets cell can hold at most ~50,000 characters. The whole
// database used to be JSON.stringify'd into one cell, which silently failed
// (and stopped saving ANY change) the moment the data grew past that limit.
// Instead, each top-level collection gets its own row, split across as many
// cells as it needs, so there's effectively no size ceiling.
var CHUNK_SIZE = 40000;

function readAll() {
  var sheet = book().getSheetByName(RAW_SHEET);
  if (!sheet) return {};
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 2) return legacyReadAll(sheet);
  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var result = {};
  values.forEach(function (row) {
    var key = row[0];
    if (!key) return;
    var json = row.slice(1).join('');
    if (!json) return;
    try {
      result[key] = JSON.parse(json);
    } catch (err) { /* skip a corrupt row rather than failing the whole read */ }
  });
  return result;
}

// One-time fallback so data saved before this change (single JSON cell) still loads.
function legacyReadAll(sheet) {
  if (!sheet) return {};
  var value = sheet.getRange(1, 1).getValue();
  if (!value) return {};
  try {
    var parsed = JSON.parse(value);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch (err) {
    return {};
  }
}

function writeAll(data) {
  var wb = book();

  var raw = wb.getSheetByName(RAW_SHEET);
  if (!raw) raw = wb.insertSheet(RAW_SHEET);
  raw.clearContents();

  var keys = Object.keys(data);
  var rows = keys.map(function (key) {
    var json = JSON.stringify(data[key]);
    var chunks = [];
    for (var i = 0; i < json.length; i += CHUNK_SIZE) chunks.push(json.slice(i, i + CHUNK_SIZE));
    if (!chunks.length) chunks = [''];
    return { key: key, chunks: chunks };
  });
  var maxChunks = rows.reduce(function (m, r) { return Math.max(m, r.chunks.length); }, 1);
  var matrix = rows.map(function (r) {
    var row = [r.key];
    for (var i = 0; i < maxChunks; i++) row.push(r.chunks[i] || '');
    return row;
  });
  if (matrix.length) raw.getRange(1, 1, matrix.length, maxChunks + 1).setValues(matrix);
  try { raw.hideSheet(); } catch (hideErr) {}

  Object.keys(data).forEach(function (key) {
    if (Array.isArray(data[key])) {
      renderReadableTab(wb, key, data[key]);
    }
  });
}

function renderReadableTab(wb, name, rows) {
  var title = name.charAt(0).toUpperCase() + name.slice(1);
  var sheet = wb.getSheetByName(title);
  if (!sheet) sheet = wb.insertSheet(title);
  sheet.clearContents();

  if (!rows.length) return;

  var columns = [];
  rows.forEach(function (row) {
    if (row && typeof row === 'object') {
      Object.keys(row).forEach(function (k) {
        if (columns.indexOf(k) < 0) columns.push(k);
      });
    }
  });

  var matrix = [columns];
  rows.forEach(function (row) {
    matrix.push(columns.map(function (c) {
      var v = row ? row[c] : '';
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    }));
  });

  sheet.getRange(1, 1, matrix.length, columns.length).setValues(matrix);
  sheet.setFrozenRows(1);
}

// ---------------------------------------------------------------------------
// Backups — every write snapshots the data as it stood immediately before
// that write, to its own timestamped file in a Drive folder. A backup
// failure never blocks the actual write (better to save without a backup
// than to lose the save entirely over a Drive hiccup).
// ---------------------------------------------------------------------------

function backupFolder_() {
  var it = DriveApp.getFoldersByName(BACKUP_FOLDER_NAME);
  if (it.hasNext()) return it.next();
  return DriveApp.createFolder(BACKUP_FOLDER_NAME);
}

function backupBeforeWrite() {
  try {
    var current = readAll();
    if (!current || !Object.keys(current).length) return; // nothing to protect yet
    var folder = backupFolder_();
    var stamp = Utilities.formatDate(new Date(), 'UTC', "yyyyMMdd'T'HHmmss'Z'");
    folder.createFile('siteops-backup-' + stamp + '.json', JSON.stringify(current), MimeType.PLAIN_TEXT);
    pruneOldBackups_(folder);
  } catch (err) {
    // swallow — see comment above
  }
}

function pruneOldBackups_(folder) {
  var cutoff = new Date(Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  var files = folder.getFiles();
  while (files.hasNext()) {
    var f = files.next();
    if (f.getDateCreated() < cutoff) f.setTrashed(true);
  }
}

function listBackups() {
  var folder = backupFolder_();
  var files = folder.getFiles();
  var out = [];
  while (files.hasNext()) {
    var f = files.next();
    out.push({ name: f.getName(), createdAt: f.getDateCreated().toISOString(), size: f.getSize() });
  }
  out.sort(function (a, b) { return b.createdAt.localeCompare(a.createdAt); });
  return out;
}

function restoreBackup(name) {
  var folder = backupFolder_();
  var files = folder.getFilesByName(name);
  if (!files.hasNext()) throw new Error('Backup not found: ' + name);
  var content = files.next().getBlob().getDataAsString();
  var data = JSON.parse(content);
  writeAll(data);
  return data;
}
