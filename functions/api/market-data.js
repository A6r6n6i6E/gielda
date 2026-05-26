const CACHE_SECONDS = 120;

export function parseMarketNumber(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace('%', '').replace(',', '.').trim();
  if (!cleaned || cleaned === 'N/D' || cleaned === 'null') return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

export function normalizeHeader(header) {
  return String(header || '').trim().toLowerCase().replaceAll(' ', '').replaceAll('_', '').replaceAll('-', '');
}

export function csvToRows(text) {
  const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(normalizeHeader);
  return lines
    .slice(1)
    .map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
      return {
        symbol: row.symbol,
        date: row.date,
        time: row.time,
        open: parseMarketNumber(row.open),
        high: parseMarketNumber(row.high),
        low: parseMarketNumber(row.low),
        close: parseMarketNumber(row.close),
        volume: parseMarketNumber(row.volume)
      };
    })
    .filter((r) => r.date && Number.isFinite(r.close));
}

export function compact(date) {
  return String(date || '').replace(/[^0-9]/g, '');
}

export function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function dateString(date) {
  return date.toISOString().slice(0, 10);
}

export function dateToUnix(date) {
  return Math.floor(new Date(`${date}T00:00:00Z`).getTime() / 1000);
}

export function fromCompactDate(value, fallback) {
  const clean = compact(value);
  if (clean.length !== 8) return fallback;
  return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
}

export function stooqCandidateSymbols(raw) {
  const clean = String(raw || '').trim().toLowerCase();
  if (!clean) return [];
  const noSuffix = clean.replace(/\.pl$/, '').replace(/\.wa$/, '');
  return [...new Set([clean, `${noSuffix}.pl`, noSuffix])];
}

export function yahooCandidateSymbols(raw) {
  const clean = String(raw || '').trim().toUpperCase();
  if (!clean) return [];
  const noSuffix = clean.replace(/\.PL$/, '').replace(/\.WA$/, '');
  return [...new Set([clean.endsWith('.WA') ? clean : `${noSuffix}.WA`, noSuffix])];
}

export function stooqHistoryUrls(symbol, d1, d2) {
  return [
    `https://stooq.pl/q/d/l/?s=${encodeURIComponent(symbol)}&d1=${d1}&d2=${d2}&i=d`,
    `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&d1=${d1}&d2=${d2}&i=d`
  ];
}

export function stooqQuoteUrls(symbol) {
  return [
    `https://stooq.pl/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`,
    `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`
  ];
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'PI-Portfolio/1.0 (+https://gielda.pages.dev)',
      accept: 'text/csv,text/plain,*/*'
    },
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'PI-Portfolio/1.0 (+https://gielda.pages.dev)',
      accept: 'application/json,text/plain,*/*'
    },
    cf: { cacheTtl: CACHE_SECONDS, cacheEverything: true }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function getStooqHistory(rawSymbol, d1, d2) {
  const tried = [];
  for (const symbol of stooqCandidateSymbols(rawSymbol)) {
    for (const url of stooqHistoryUrls(symbol, d1, d2)) {
      tried.push(url);
      try {
        const rows = csvToRows(await fetchText(url)).sort((a, b) => String(a.date).localeCompare(String(b.date)));
        if (rows.length) return { symbol, rows, source: 'Stooq', tried };
      } catch {
        // next symbol/domain
      }
    }
  }
  return { symbol: rawSymbol, rows: [], source: 'Stooq', tried };
}

export async function getStooqQuote(rawSymbol) {
  const tried = [];
  for (const symbol of stooqCandidateSymbols(rawSymbol)) {
    for (const url of stooqQuoteUrls(symbol)) {
      tried.push(url);
      try {
        const rows = csvToRows(await fetchText(url));
        if (rows.length) return { symbol, row: rows[0], source: 'Stooq quote', tried };
      } catch {
        // next symbol/domain
      }
    }
  }
  return { symbol: rawSymbol, row: null, source: 'Stooq quote', tried };
}

export function yahooChartUrl(symbol, period1, period2) {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1d&events=history`;
}

export function parseYahooRows(data) {
  const result = data?.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const quote = result?.indicators?.quote?.[0] || {};
  return timestamps
    .map((ts, index) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      open: parseMarketNumber(quote.open?.[index]),
      high: parseMarketNumber(quote.high?.[index]),
      low: parseMarketNumber(quote.low?.[index]),
      close: parseMarketNumber(quote.close?.[index]),
      volume: parseMarketNumber(quote.volume?.[index])
    }))
    .filter((r) => r.date && Number.isFinite(r.close));
}

export async function getYahooHistory(rawSymbol, d1, d2) {
  const tried = [];
  const startDate = fromCompactDate(d1, '2000-01-01');
  const endDate = fromCompactDate(d2, dateString(addDays(new Date(), 1)));
  const period1 = dateToUnix(startDate);
  const period2 = dateToUnix(dateString(addDays(new Date(`${endDate}T00:00:00Z`), 1)));

  for (const symbol of yahooCandidateSymbols(rawSymbol)) {
    const url = yahooChartUrl(symbol, period1, period2);
    tried.push(url);
    try {
      const rows = parseYahooRows(await fetchJson(url)).sort((a, b) => String(a.date).localeCompare(String(b.date)));
      if (rows.length) return { symbol, rows, source: 'Yahoo Finance', tried };
    } catch {
      // next symbol
    }
  }
  return { symbol: rawSymbol, rows: [], source: 'Yahoo Finance', tried };
}

export async function getMarketHistory(rawSymbol, d1, d2) {
  const stooq = await getStooqHistory(rawSymbol, d1, d2);
  if (stooq.rows.length) return { ...stooq, provider: 'stooq' };

  const yahoo = await getYahooHistory(rawSymbol, d1, d2);
  if (yahoo.rows.length) return { ...yahoo, provider: 'yahoo', fallbackFrom: stooq };

  return {
    symbol: rawSymbol,
    rows: [],
    source: 'Stooq/Yahoo Finance',
    provider: null,
    tried: [...stooq.tried, ...yahoo.tried],
    stooq,
    yahoo
  };
}

export function latestQuoteFromRows(symbol, rows, source) {
  const sorted = rows.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const last = sorted[sorted.length - 1];
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const dailyChange = prev ? last.close - prev.close : null;
  const dailyChangePct = prev && prev.close ? (dailyChange / prev.close) * 100 : null;
  return {
    symbol,
    date: last.date,
    time: 'close',
    open: last.open,
    high: last.high,
    low: last.low,
    close: last.close,
    previousClose: prev?.close ?? null,
    dailyChange,
    dailyChangePct,
    volume: last.volume,
    source,
    delayed: true
  };
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${CACHE_SECONDS}`,
      'access-control-allow-origin': '*'
    }
  });
}

export function optionsResponse() {
  return new Response(null, {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, OPTIONS',
      'access-control-allow-headers': 'content-type'
    }
  });
}
