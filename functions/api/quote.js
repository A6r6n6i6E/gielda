const QUOTE_FIELDS = 'sd2t2ohlcv';

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
  const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;
  const headers = lines[0].split(',').map(normalizeHeader);
  const values = lines[1].split(',').map((v) => v.trim());
  return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
}

function csvHistoryRows(text) {
  const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(normalizeHeader);
  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
      return {
        date: row.date,
        open: parseStooqNumber(row.open),
        high: parseStooqNumber(row.high),
        low: parseStooqNumber(row.low),
        close: parseStooqNumber(row.close),
        volume: parseStooqNumber(row.volume)
      };
    })
    .filter((r) => r.date && Number.isFinite(r.close));
}

function compact(date) {
  return String(date || '').replace(/[^0-9]/g, '');
}

function isoDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function candidateSymbols(raw) {
  const clean = String(raw || '').trim().toLowerCase();
  if (!clean) return [];
  const noSuffix = clean.replace(/\.pl$/, '');
  return [...new Set([clean, `${noSuffix}.pl`, noSuffix])];
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

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 PI-Portfolio/1.0 Cloudflare-Pages'
    },
    cf: { cacheTtl: 60, cacheEverything: true }
  });

  if (!response.ok) {
    return { ok: false, status: response.status, text: '' };
  }

  return { ok: true, status: response.status, text: await response.text() };
}

async function getQuote(symbol) {
  const stooqUrl = `https://stooq.pl/q/l/?s=${encodeURIComponent(symbol)}&f=${QUOTE_FIELDS}&h&e=csv`;
  const result = await fetchText(stooqUrl);
  if (!result.ok) return null;

  const row = csvLineToObject(result.text);
  const close = parseStooqNumber(row?.close);

  if (!row || !Number.isFinite(close)) return null;

  return {
    symbol: row.symbol || symbol,
    date: row.date,
    time: row.time,
    open: parseStooqNumber(row.open),
    high: parseStooqNumber(row.high),
    low: parseStooqNumber(row.low),
    close,
    volume: parseStooqNumber(row.volume),
    raw: row
  };
}

async function getRecentHistory(symbol) {
  const d1 = compact(isoDateDaysAgo(21));
  const d2 = compact(new Date().toISOString().slice(0, 10));
  const histUrl = `https://stooq.pl/q/d/l/?s=${encodeURIComponent(symbol)}&d1=${d1}&d2=${d2}&i=d`;
  const result = await fetchText(histUrl);
  if (!result.ok) return [];
  return csvHistoryRows(result.text).sort((a, b) => a.date.localeCompare(b.date));
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const raw = (url.searchParams.get('s') || '').trim().toLowerCase();
  if (!raw) return json({ error: 'Brak parametru s, np. /api/quote?s=pkn.pl' }, 400);

  const attempted = candidateSymbols(raw);
  let quote = null;
  let usedSymbol = null;
  let historyRows = [];

  for (const symbol of attempted) {
    quote = await getQuote(symbol);
    historyRows = await getRecentHistory(symbol);

    if (quote || historyRows.length) {
      usedSymbol = symbol;
      break;
    }
  }

  if (!quote && !historyRows.length) {
    return json(
      {
        symbol: raw,
        attempted,
        error: 'Brak notowania dla symbolu w Stooq'
      },
      404
    );
  }

  const last = historyRows[historyRows.length - 1] || null;
  const prev = historyRows.length > 1 ? historyRows[historyRows.length - 2] : null;

  const close = Number.isFinite(quote?.close) ? quote.close : last?.close;
  const previousClose = prev?.close ?? null;
  const dailyChange = Number.isFinite(close) && Number.isFinite(previousClose) ? close - previousClose : null;
  const dailyChangePct =
    Number.isFinite(dailyChange) && Number.isFinite(previousClose) && previousClose !== 0
      ? (dailyChange / previousClose) * 100
      : null;

  return json({
    symbol: quote?.symbol || usedSymbol || raw,
    querySymbol: raw,
    stooqSymbol: usedSymbol || raw,
    date: quote?.date || last?.date || null,
    time: quote?.time || null,
    open: quote?.open ?? last?.open ?? null,
    high: quote?.high ?? last?.high ?? null,
    low: quote?.low ?? last?.low ?? null,
    close,
    previousClose,
    dailyChange,
    dailyChangePct,
    volume: quote?.volume ?? last?.volume ?? null,
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
