function csvToRows(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row = Object.fromEntries(headers.map((h, i) => [h, values[i]]));
    return {
      date: row.date,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume)
    };
  }).filter((r) => r.date && Number.isFinite(r.close));
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

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const raw = (url.searchParams.get('s') || '').trim().toLowerCase();
  const d1 = (url.searchParams.get('d1') || '').replace(/[^0-9]/g, '');
  const d2 = (url.searchParams.get('d2') || '').replace(/[^0-9]/g, '');

  if (!raw) return json({ error: 'Brak parametru s, np. /api/history?s=pkn.pl' }, 400);

  const params = new URLSearchParams({ s: raw, i: 'd' });
  if (d1) params.set('d1', d1);
  if (d2) params.set('d2', d2);

  const stooqUrl = `https://stooq.com/q/d/l/?${params.toString()}`;
  const response = await fetch(stooqUrl, {
    headers: { 'user-agent': 'PI-Portfolio/1.0 (+Cloudflare Pages Function)' },
    cf: { cacheTtl: 300, cacheEverything: true }
  });

  if (!response.ok) return json({ error: 'Nie udało się pobrać historii ze Stooq', status: response.status }, 502);
  const text = await response.text();
  const rows = csvToRows(text);
  if (!rows.length) return json({ symbol: raw, rows: [], source: 'Stooq' });

  return json({ symbol: raw, rows, source: 'Stooq', delayed: true });
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
