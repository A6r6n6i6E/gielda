function parseStooqNumber(value) {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(',', '.').trim();
  if (!cleaned || cleaned === 'N/D') return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

function normalizeHeader(header) {
  return String(header || '').trim().toLowerCase().replaceAll(' ', '').replaceAll('_', '').replaceAll('-', '');
}

function csvToRows(text) {
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
      'cache-control': 'public, max-age=300',
      'access-control-allow-origin': '*'
    }
  });
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 PI-Portfolio/1.0 Cloudflare-Pages' },
    cf: { cacheTtl: 300, cacheEverything: true }
  });
  if (!response.ok) return { ok: false, status: response.status, text: '' };
  return { ok: true, status: response.status, text: await response.text() };
}

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const raw = (url.searchParams.get('s') || '').trim().toLowerCase();
  const d1 = (url.searchParams.get('d1') || '').replace(/[^0-9]/g, '');
  const d2 = (url.searchParams.get('d2') || '').replace(/[^0-9]/g, '');

  if (!raw) return json({ error: 'Brak parametru s, np. /api/history?s=pkn.pl' }, 400);

  for (const symbol of candidateSymbols(raw)) {
    const params = new URLSearchParams({ s: symbol, i: 'd' });
    if (d1) params.set('d1', d1);
    if (d2) params.set('d2', d2);

    const stooqUrl = `https://stooq.pl/q/d/l/?${params.toString()}`;
    const response = await fetchText(stooqUrl);
    if (!response.ok) continue;

    const rows = csvToRows(response.text);
    if (rows.length) {
      return json({ symbol, querySymbol: raw, rows, source: 'Stooq', delayed: true });
    }
  }

  return json({ symbol: raw, rows: [], source: 'Stooq' });
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
