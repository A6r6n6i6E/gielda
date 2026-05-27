import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { addDays, compact, dateString, getMarketHistory, latestQuoteFromRows } from './functions/api/market-data.js';

function sendJson(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data, null, 2));
}

function yahooDevApiPlugin() {
  return {
    name: 'pi-yahoo-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname !== '/api/quote' && url.pathname !== '/api/history') return next();

        const raw = (url.searchParams.get('s') || '').trim();
        if (!raw) return sendJson(res, { error: 'Brak parametru s' }, 400);

        const fallbackStart = '2000-01-01';
        const fallbackEnd = dateString(addDays(new Date(), 1));
        const d1 = compact(url.searchParams.get('d1') || fallbackStart);
        const d2 = compact(url.searchParams.get('d2') || fallbackEnd);
        const result = await getMarketHistory(raw, d1, d2);

        if (!result.rows.length) {
          return sendJson(res, {
            symbol: raw,
            rows: [],
            error: 'Brak danych dla symbolu w Yahoo Finance',
            tried: result.tried,
            provider: 'yahoo'
          }, 404);
        }

        if (url.pathname === '/api/history') {
          return sendJson(res, {
            symbol: result.symbol,
            rows: result.rows,
            source: result.source,
            provider: result.provider,
            delayed: true,
            localDev: true
          });
        }

        return sendJson(res, {
          ...latestQuoteFromRows(result.symbol, result.rows, result.source),
          provider: result.provider,
          localDev: true
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), yahooDevApiPlugin()]
});
