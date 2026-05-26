import { addDays, compact, dateString, getMarketHistory, json, optionsResponse } from './market-data.js';

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const raw = (url.searchParams.get('s') || '').trim();
  if (!raw) return json({ error: 'Brak parametru s, np. /api/history?s=pkn' }, 400);

  const fallbackStart = '2000-01-01';
  const fallbackEnd = dateString(addDays(new Date(), 1));
  const d1 = compact(url.searchParams.get('d1') || fallbackStart);
  const d2 = compact(url.searchParams.get('d2') || fallbackEnd);
  const result = await getMarketHistory(raw, d1, d2);

  if (!result.rows.length) {
    return json({
      symbol: raw,
      rows: [],
      error: 'Brak danych historycznych dla symbolu w Stooq oraz Yahoo Finance',
      tried: result.tried,
      stooq: result.stooq,
      yahoo: result.yahoo
    }, 404);
  }

  return json({
    symbol: result.symbol,
    rows: result.rows,
    source: result.source,
    provider: result.provider,
    delayed: true
  });
}

export async function onRequestOptions() {
  return optionsResponse();
}
