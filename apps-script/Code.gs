/**
 * TestCraft Indonesia — penerima formulir pendaftaran
 * ---------------------------------------------------
 * Menyimpan setiap pendaftaran dari index.html ke Google Sheets:
 *   · satu tab per bulan  (2026-07, 2026-08, ...)
 *   · kolom Kategori berwarna per jenis pendaftaran
 *   · tab "Ringkasan" berisi rekap jumlah lead per kategori per bulan
 *
 * Cara pasang: lihat apps-script/README.md
 */

var SPREADSHEET_ID = '1yIJ9q-KQmZca_WNGXvPqNkAzLw0qon3GI4sttn_oyR8';
var TIMEZONE       = 'Asia/Jakarta';

var HEADERS = ['Waktu', 'Nama', 'Email', 'WhatsApp', 'Kategori', 'Program',
               'Catatan', 'Status', 'Bahasa', 'Sumber'];
var WIDTHS  = [140, 170, 210, 140, 150, 300, 260, 130, 70, 150];

var STATUSES = ['Baru', 'Dihubungi', 'Menunggu Bayar', 'Terdaftar', 'Batal'];

/** Jenis pendaftaran dari form -> kategori ringkas + warna latar. */
var CATEGORIES = [
  { match: /bootcamp/i,             name: 'QA Bootcamp',      color: '#D5EFEE' },
  { match: /corporate|perusahaan/i, name: 'Corporate',        color: '#FEF3C7' },
  { match: /konsultasi|consulting/i,name: 'Konsultasi',       color: '#EDE9FE' },
  { match: /public|individu/i,      name: 'Public Training',  color: '#D1FAE5' }
];
var CATEGORY_FALLBACK = 'Lainnya';

/* ============================ ENDPOINT ============================ */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (!data.nama || (!data.email && !data.whatsapp)) {
      return json_({ ok: false, error: 'Data tidak lengkap' });
    }

    var now      = new Date();
    var monthKey = Utilities.formatDate(now, TIMEZONE, 'yyyy-MM');
    var sheet    = getMonthSheet_(monthKey);
    var category = categoryOf_(data.jenis);

    sheet.appendRow([
      Utilities.formatDate(now, TIMEZONE, 'dd/MM/yyyy HH:mm'),
      String(data.nama || '').trim(),
      String(data.email || '').trim(),
      normalizePhone_(data.whatsapp),
      category,
      String(data.program || '').trim(),
      String(data.catatan || '').trim(),
      'Baru',
      String(data.bahasa || 'id').toUpperCase(),
      String(data.sumber || 'website')
    ]);

    rebuildSummary_();
    return json_({ ok: true, sheet: monthKey, category: category });

  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

/** Cek cepat lewat browser bahwa Web App hidup. */
function doGet() {
  return json_({ ok: true, service: 'TestCraft registration intake' });
}

/* =========================== TAB BULANAN ========================== */

function getMonthSheet_(monthKey) {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(monthKey);
  if (sheet) return sheet;

  sheet = ss.insertSheet(monthKey);

  var head = sheet.getRange(1, 1, 1, HEADERS.length);
  head.setValues([HEADERS])
      .setBackground('#12283E')
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setFontSize(11)
      .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 34);
  sheet.setFrozenRows(1);

  WIDTHS.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });

  // Status: dropdown, bukan ketikan bebas
  sheet.getRange(2, 8, sheet.getMaxRows() - 1, 1).setDataValidation(
    SpreadsheetApp.newDataValidation()
      .requireValueInList(STATUSES, true)
      .setAllowInvalid(false)
      .build()
  );

  // Warna per kategori
  var catRange = sheet.getRange(2, 5, sheet.getMaxRows() - 1, 1);
  sheet.setConditionalFormatRules(CATEGORIES.map(function (c) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(c.name)
      .setBackground(c.color)
      .setRanges([catRange])
      .build();
  }));

  sheet.getRange(2, 1, sheet.getMaxRows() - 1, HEADERS.length)
       .setVerticalAlignment('top')
       .setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);

  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);          // bulan terbaru selalu di depan
  return sheet;
}

function categoryOf_(jenis) {
  var s = String(jenis || '');
  for (var i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].match.test(s)) return CATEGORIES[i].name;
  }
  return CATEGORY_FALLBACK;
}

/** 6282395568743 / +62 812... -> 0812... supaya seragam & bisa diklik. */
function normalizePhone_(raw) {
  var d = String(raw || '').replace(/\D/g, '');
  if (d.indexOf('62') === 0) d = '0' + d.slice(2);
  return d;
}

/* ============================ RINGKASAN =========================== */

function rebuildSummary_() {
  var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
  var names = CATEGORIES.map(function (c) { return c.name; }).concat(CATEGORY_FALLBACK);

  var months = ss.getSheets()
    .map(function (s) { return s.getName(); })
    .filter(function (n) { return /^\d{4}-\d{2}$/.test(n); })
    .sort()
    .reverse();

  var rows = months.map(function (m) {
    var sheet = ss.getSheetByName(m);
    var last  = sheet.getLastRow();
    var counts = {};
    names.forEach(function (n) { counts[n] = 0; });

    if (last > 1) {
      sheet.getRange(2, 5, last - 1, 1).getValues().forEach(function (r) {
        var k = r[0];
        if (counts[k] === undefined) counts[k] = 0;
        counts[k]++;
      });
    }
    var total = names.reduce(function (a, n) { return a + counts[n]; }, 0);
    return [m].concat(names.map(function (n) { return counts[n]; })).concat([total]);
  });

  var sheet = ss.getSheetByName('Ringkasan') || ss.insertSheet('Ringkasan', 0);
  sheet.clear();
  sheet.clearConditionalFormatRules();

  sheet.getRange(1, 1).setValue('Rekap Pendaftaran — TestCraft Indonesia')
       .setFontSize(14).setFontWeight('bold').setFontColor('#12283E');
  sheet.getRange(2, 1).setValue(
    'Diperbarui otomatis: ' + Utilities.formatDate(new Date(), TIMEZONE, 'dd/MM/yyyy HH:mm')
  ).setFontSize(10).setFontColor('#94A3B8');

  var header = ['Bulan'].concat(names).concat(['Total']);
  sheet.getRange(4, 1, 1, header.length).setValues([header])
       .setBackground('#12283E').setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.setRowHeight(4, 30);
  sheet.setFrozenRows(4);

  if (rows.length) {
    sheet.getRange(5, 1, rows.length, header.length).setValues(rows);
    sheet.getRange(5, header.length, rows.length, 1).setFontWeight('bold');

    var totals = ['TOTAL'].concat(names.map(function (_, i) {
      return rows.reduce(function (a, r) { return a + r[i + 1]; }, 0);
    }));
    totals.push(rows.reduce(function (a, r) { return a + r[r.length - 1]; }, 0));
    sheet.getRange(5 + rows.length, 1, 1, totals.length).setValues([totals])
         .setFontWeight('bold').setBackground('#F1F5F9');
  }

  sheet.setColumnWidth(1, 110);
  for (var c = 2; c <= header.length; c++) sheet.setColumnWidth(c, 130);
  ss.setActiveSheet(sheet);
  ss.moveActiveSheet(1);
}

/* ========================= UTIL & TESTING ========================= */

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Jalankan sekali dari editor Apps Script (tombol Run) untuk
 * membuat tab Ringkasan + memberi izin akses spreadsheet.
 */
function setup() {
  rebuildSummary_();
  Logger.log('Siap. Spreadsheet: ' + SpreadsheetApp.openById(SPREADSHEET_ID).getUrl());
}

/** Kirim satu baris contoh tanpa perlu buka website. */
function testKirimContoh() {
  var res = doPost({ postData: { contents: JSON.stringify({
    nama: 'Budi Santoso (tes)',
    email: 'budi@contoh.com',
    whatsapp: '081234567890',
    jenis: 'QA Bootcamp',
    program: 'Playwright Automation Testing from Zero to Expert',
    catatan: 'Baris uji coba — boleh dihapus',
    sumber: 'apps-script/testKirimContoh',
    bahasa: 'id'
  })}});
  Logger.log(res.getContent());
}
