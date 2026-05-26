import { addDays, compact, dateString, getMarketHistory, json, latestQuoteFromRows, optionsResponse } from './market-data.js';

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const raw = (url.searchParams.get('s') || '').trim();
  if (!raw) return json({ error: 'Brak parametru s, np. /api/quote?s=pkn' }, 400);

  const d1 = '20000101';
  const d2 = compact(dateString(addDays(new Date(), 1)));
  const result = await getMarketHistory(raw, d1, d2);

  if (!result.rows.length) {
    return json({
      symbol: raw,
      rows: [],
      error: 'Brak danych dla symbolu w Stooq oraz Yahoo Finance',
      tried: result.tried,
      stooq: result.stooq,
      yahoo: result.yahoo
    }, 404);
  }

  return json({
    ...latestQuoteFromRows(result.symbol, result.rows, result.source),
    provider: result.provider,
    fallbackFrom: result.fallbackFrom ? { source: result.fallbackFrom.source, tried: result.fallbackFrom.tried } : null
  });
}

export async function onRequestOptions() {
  return optionsResponse();
}
