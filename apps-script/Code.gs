/**
 * Site & Inventory Manager — Google Sheets database bridge
 * ------------------------------------------------------------------
 * This script turns the spreadsheet it is attached to into the live
 * database for the Site & Inventory Manager web app.
 *
 * SETUP (one time):
 *   1. Open your Google Sheet (or create a blank one).
 *   2. Extensions  ->  Apps Script.
 *   3. Delete anything there, paste this whole file, and save.
 *   4. Change SECRET_TOKEN below to your own long random string.
 *   5. Deploy  ->  New deployment  ->  type "Web app".
 *        - Execute as:  Me
 *        - Who has access:  Anyone
 *      Click Deploy, authorise, and COPY the "Web app URL".
 *   6. In the app: open "Sheets Sync", paste the Web app URL and the
 *      same SECRET_TOKEN, then click Connect.
 *
 * To change the code later you must Deploy -> Manage deployments ->
 * edit the existing deployment and pick the new version (so the URL
 * stays the same).
 */

// >>> CHANGE THIS to your own private random string (keep it secret). <<<
var SECRET_TOKEN = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';

var RAW_SHEET = '_raw';
var COLLECTIONS = ['sites', 'collectors', 'assignments', 'equipment', 'transfers', 'users'];

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    var params = (e && e.parameter) || {};
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try {
        body = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        body = {};
      }
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
        writeAll(body.data || {});
      } finally {
        lock.releaseLock();
      }
      return output.setContent(JSON.stringify({ ok: true, savedAt: new Date().toISOString() }));
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

function book() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function readAll() {
  var sheet = book().getSheetByName(RAW_SHEET);
  if (!sheet) return emptyData();
  var value = sheet.getRange(1, 1).getValue();
  if (!value) return emptyData();
  try {
    var parsed = JSON.parse(value);
    var result = emptyData();
    COLLECTIONS.forEach(function (name) {
      if (Array.isArray(parsed[name])) result[name] = parsed[name];
    });
    return result;
  } catch (err) {
    return emptyData();
  }
}

function emptyData() {
  return { sites: [], collectors: [], assignments: [], equipment: [], transfers: [], users: [] };
}

function writeAll(data) {
  var wb = book();

  var raw = wb.getSheetByName(RAW_SHEET);
  if (!raw) raw = wb.insertSheet(RAW_SHEET);
  raw.getRange(1, 1).setValue(JSON.stringify(data));
  try { raw.hideSheet(); } catch (hideErr) {}

  COLLECTIONS.forEach(function (name) {
    var rows = Array.isArray(data[name]) ? data[name] : [];
    renderReadableTab(wb, name, rows);
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
    Object.keys(row).forEach(function (key) {
      if (columns.indexOf(key) < 0) columns.push(key);
    });
  });

  var matrix = [columns];
  rows.forEach(function (row) {
    matrix.push(columns.map(function (col) {
      var v = row[col];
      if (v === null || v === undefined) return '';
      if (typeof v === 'object') return JSON.stringify(v);
      return v;
    }));
  });

  sheet.getRange(1, 1, matrix.length, columns.length).setValues(matrix);
  sheet.setFrozenRows(1);
}
