function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'access-control-allow-origin': '*'
    }
  });
}

function optionsResponse() {
  return new Response(null, {
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, OPTIONS',
      'access-control-allow-headers': 'content-type'
    }
  });
}

function userIdFromRequest(request, env) {
  const accessEmail =
    request.headers.get('cf-access-authenticated-user-email') ||
    request.headers.get('CF-Access-Authenticated-User-Email') ||
    request.headers.get('x-authenticated-user-email') ||
    '';

  const allowedEmail = String(env.PI_ALLOWED_EMAIL || '').trim().toLowerCase();

  if (allowedEmail && accessEmail && accessEmail.toLowerCase() !== allowedEmail) {
    return { error: 'Ten użytkownik nie ma dostępu do portfela.', status: 403 };
  }

  if (allowedEmail && !accessEmail && env.REQUIRE_ACCESS === 'true') {
    return { error: 'Brak nagłówka Cloudflare Access. Włącz Cloudflare Access lub wyłącz REQUIRE_ACCESS.', status: 401 };
  }

  return {
    userId: accessEmail ? accessEmail.toLowerCase() : (allowedEmail || 'single-user')
  };
}

async function ensureSchema(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      user_id TEXT NOT NULL,
      id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      name TEXT NOT NULL,
      stooq_symbol TEXT,
      yahoo_symbol TEXT,
      sector TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      user_id TEXT NOT NULL,
      id TEXT NOT NULL,
      asset_id TEXT NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      fees REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id, id)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user_asset ON transactions(user_id, asset_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
  `);
}

function normalizeAsset(asset) {
  const symbol = String(asset?.symbol || '').trim().toUpperCase();
  const id = String(asset?.id || `asset-${symbol.toLowerCase()}`).trim();

  return {
    id,
    symbol,
    name: String(asset?.name || symbol).trim() || symbol,
    stooqSymbol: String(asset?.stooqSymbol || asset?.stooq_symbol || `${symbol.toLowerCase()}.pl`).trim().toLowerCase(),
    yahooSymbol: String(asset?.yahooSymbol || asset?.yahoo_symbol || `${symbol}.WA`).trim().toUpperCase(),
    sector: String(asset?.sector || 'GPW').trim()
  };
}

function normalizeTransaction(transaction) {
  return {
    id: String(transaction?.id || crypto.randomUUID()),
    assetId: String(transaction?.assetId || transaction?.asset_id || ''),
    type: transaction?.type === 'sell' ? 'sell' : 'buy',
    date: String(transaction?.date || new Date().toISOString().slice(0, 10)),
    quantity: Number(transaction?.quantity) || 0,
    price: Number(transaction?.price) || 0,
    fees: Number(transaction?.fees) || 0
  };
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Brak bindingu D1 o nazwie DB. Dodaj bazę D1 w Cloudflare Pages → Settings → Functions → D1 database bindings.' }, 503);
  }

  const auth = userIdFromRequest(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status);

  await ensureSchema(env.DB);

  const assetsResult = await env.DB.prepare(`
    SELECT id, symbol, name, stooq_symbol, yahoo_symbol, sector
    FROM assets
    WHERE user_id = ?
    ORDER BY symbol
  `).bind(auth.userId).all();

  const transactionsResult = await env.DB.prepare(`
    SELECT id, asset_id, type, date, quantity, price, fees
    FROM transactions
    WHERE user_id = ?
    ORDER BY date, created_at, id
  `).bind(auth.userId).all();

  return json({
    assets: (assetsResult.results || []).map((asset) => ({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      stooqSymbol: asset.stooq_symbol,
      yahooSymbol: asset.yahoo_symbol,
      sector: asset.sector
    })),
    transactions: (transactionsResult.results || []).map((transaction) => ({
      id: transaction.id,
      assetId: transaction.asset_id,
      type: transaction.type,
      date: transaction.date,
      quantity: Number(transaction.quantity),
      price: Number(transaction.price),
      fees: Number(transaction.fees || 0)
    })),
    storage: 'cloudflare-d1'
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Brak bindingu D1 o nazwie DB. Dodaj bazę D1 w Cloudflare Pages → Settings → Functions → D1 database bindings.' }, 503);
  }

  const auth = userIdFromRequest(request, env);
  if (auth.error) return json({ error: auth.error }, auth.status);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'Nieprawidłowe dane JSON.' }, 400);

  const assets = (body.assets || []).map(normalizeAsset).filter((asset) => asset.id && asset.symbol);
  const assetIds = new Set(assets.map((asset) => asset.id));
  const transactions = (body.transactions || [])
    .map(normalizeTransaction)
    .filter((transaction) => transaction.id && assetIds.has(transaction.assetId) && transaction.quantity > 0 && transaction.price > 0);

  await ensureSchema(env.DB);

  const statements = [
    env.DB.prepare('DELETE FROM transactions WHERE user_id = ?').bind(auth.userId),
    env.DB.prepare('DELETE FROM assets WHERE user_id = ?').bind(auth.userId)
  ];

  for (const asset of assets) {
    statements.push(
      env.DB.prepare(`
        INSERT INTO assets (user_id, id, symbol, name, stooq_symbol, yahoo_symbol, sector, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(auth.userId, asset.id, asset.symbol, asset.name, asset.stooqSymbol, asset.yahooSymbol, asset.sector)
    );
  }

  for (const transaction of transactions) {
    statements.push(
      env.DB.prepare(`
        INSERT INTO transactions (user_id, id, asset_id, type, date, quantity, price, fees, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        auth.userId,
        transaction.id,
        transaction.assetId,
        transaction.type,
        transaction.date,
        transaction.quantity,
        transaction.price,
        transaction.fees
      )
    );
  }

  await env.DB.batch(statements);

  return json({
    ok: true,
    assets: assets.length,
    transactions: transactions.length,
    storage: 'cloudflare-d1'
  });
}

export async function onRequestOptions() {
  return optionsResponse();
}
