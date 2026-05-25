const STOOQ_FIELDS = 'sd2t2ohlcvc1c1p';

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replaceAll(' ', '')
    .replaceAll('_', '')
    .replaceAll('-', '');
}

function parseStooqNumber(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace('%', '').replace(',', '.').trim();
  if (!cleaned || cleaned === 'N/D') return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function csvLineToObject(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;
  const headers = lines[0].split(',').map(normalizeHeader);
  const values = lines[1].split(',').map((v) => v.trim());
  return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
}

function csvHistoryRows(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
    return { date: row.date, close: Number(row.close) };
  }).filter((r) => r.date && Number.isFinite(r.close));
}

function compact(date) {
  return String(date || '').replace(/[^0-9]/g, '');
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=60',
      'access-control-allow-origin': '*'
    }
  });
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const raw = (url.searchParams.get('s') || '').trim().toLowerCase();
  if (!raw) return json({ error: 'Brak parametru s, np. /api/quote?s=pkn.pl' }, 400);

  const stooqUrl = `https://stooq.com/q/l/?s=${encodeURIComponent(raw)}&f=${STOOQ_FIELDS}&h&e=csv`;
  const response = await fetch(stooqUrl, {
    headers: { 'user-agent': 'PI-Portfolio/1.0 (+Cloudflare Pages Function)' },
    cf: { cacheTtl: 60, cacheEverything: true }
  });

  if (!response.ok) return json({ error: 'Nie udało się pobrać danych ze Stooq', status: response.status }, 502);
  const text = await response.text();
  const row = csvLineToObject(text);
  if (!row || !row.close || row.close === 'N/D') {
    return json({ symbol: raw, error: 'Brak notowania dla symbolu w Stooq', raw: text }, 404);
  }

  const close = parseStooqNumber(row.close);
  let previousClose = null;

  // Stooq może zwrócić dzienną zmianę bezpośrednio jako pola Change oraz %Change
  // dla zapytania q/l. Jeżeli te pola nie są dostępne, niżej próbujemy policzyć
  // zmianę z krótkiego zakresu danych historycznych.
  let dailyChange = parseStooqNumber(row.change ?? row.change1 ?? row.c1);
  let dailyChangePct = parseStooqNumber(
    row['%change'] ?? row.changepercent ?? row.changepercentage ?? row.c1p
  );

  try {
    const currentDate = row.date && row.date !== 'N/D' ? new Date(row.date) : new Date();
    const start = new Date(currentDate);
    start.setDate(start.getDate() - 12);
    const d1 = compact(start.toISOString().slice(0, 10));
    const d2 = compact(currentDate.toISOString().slice(0, 10));
    const histUrl = `https://stooq.com/q/d/l/?s=${encodeURIComponent(raw)}&d1=${d1}&d2=${d2}&i=d`;
    const histRes = await fetch(histUrl, {
      headers: { 'user-agent': 'PI-Portfolio/1.0 (+Cloudflare Pages Function)' },
      cf: { cacheTtl: 60, cacheEverything: true }
    });
    if (histRes.ok) {
      const histRows = csvHistoryRows(await histRes.text()).sort((a, b) => a.date.localeCompare(b.date));
      const quoteDate = row.date;
      const idx = histRows.findIndex((h) => h.date === quoteDate);
      const prev = idx > 0 ? histRows[idx - 1] : histRows[histRows.length - 2];
      if (prev && Number.isFinite(prev.close)) {
        previousClose = prev.close;
        dailyChange = close - previousClose;
        dailyChangePct = previousClose ? (dailyChange / previousClose) * 100 : null;
      }
    }
  } catch {
    // dzienna zmiana jest dodatkiem; brak nie blokuje notowania
  }

  return json({
    symbol: row.symbol || raw,
    date: row.date,
    time: row.time,
    open: parseStooqNumber(row.open),
    high: parseStooqNumber(row.high),
    low: parseStooqNumber(row.low),
    close,
    previousClose,
    dailyChange,
    dailyChangePct,
    volume: parseStooqNumber(row.volume),
    source: 'Stooq',
    delayed: true
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type'
    }
  });
}
