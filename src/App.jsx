import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Download,
  FileJson,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  WalletCards
} from 'lucide-react';
import './styles.css';

const STORAGE_KEY = 'pi-portfolio-gpw-v4';
const PLN = 'PLN';

const GPW_COMPANIES = [
  { symbol: '11B', name: '11 bit studios S.A.', stooqSymbol: '11b.pl', sector: 'Gry' },
  { symbol: '1AT', name: 'Atal S.A.', stooqSymbol: '1at.pl', sector: 'Deweloperzy' },
  { symbol: '4MB', name: '4Mass S.A.', stooqSymbol: '4mb.pl', sector: 'Kosmetyki' },
  { symbol: 'ABE', name: 'AB S.A.', stooqSymbol: 'abe.pl', sector: 'Dystrybucja IT' },
  { symbol: 'ABS', name: 'Asbis Enterprises Plc', stooqSymbol: 'abs.pl', sector: 'Dystrybucja IT' },
  { symbol: 'ACP', name: 'Asseco Poland S.A.', stooqSymbol: 'acp.pl', sector: 'Technologia' },
  { symbol: 'ACT', name: 'Action S.A.', stooqSymbol: 'act.pl', sector: 'Dystrybucja IT' },
  { symbol: 'ADV', name: 'Adiuvo Investments S.A.', stooqSymbol: 'adv.pl', sector: 'Medycyna' },
  { symbol: 'AGO', name: 'Agora S.A.', stooqSymbol: 'ago.pl', sector: 'Media' },
  { symbol: 'ALE', name: 'Allegro.eu S.A.', stooqSymbol: 'ale.pl', sector: 'E-commerce' },
  { symbol: 'ALG', name: 'All in! Games S.A.', stooqSymbol: 'alg.pl', sector: 'Gry' },
  { symbol: 'ALR', name: 'Alior Bank S.A.', stooqSymbol: 'alr.pl', sector: 'Banki' },
  { symbol: 'AMB', name: 'Ambra S.A.', stooqSymbol: 'amb.pl', sector: 'Spożywcze' },
  { symbol: 'AMC', name: 'Amica S.A.', stooqSymbol: 'amc.pl', sector: 'Przemysł' },
  { symbol: 'APT', name: 'Apator S.A.', stooqSymbol: 'apt.pl', sector: 'Przemysł' },
  { symbol: 'ARH', name: 'Archicom S.A.', stooqSymbol: 'arh.pl', sector: 'Deweloperzy' },
  { symbol: 'ART', name: 'Artifex Mundi S.A.', stooqSymbol: 'art.pl', sector: 'Gry' },
  { symbol: 'ASB', name: 'Asseco Business Solutions S.A.', stooqSymbol: 'asb.pl', sector: 'Technologia' },
  { symbol: 'ASE', name: 'Asseco South Eastern Europe S.A.', stooqSymbol: 'ase.pl', sector: 'Technologia' },
  { symbol: 'AST', name: 'Astarta Holding N.V.', stooqSymbol: 'ast.pl', sector: 'Rolnictwo' },
  { symbol: 'ATC', name: 'Arctic Paper S.A.', stooqSymbol: 'atc.pl', sector: 'Papier' },
  { symbol: 'ATD', name: 'Atende S.A.', stooqSymbol: 'atd.pl', sector: 'Technologia' },
  { symbol: 'ATT', name: 'Grupa Azoty S.A.', stooqSymbol: 'att.pl', sector: 'Chemia' },
  { symbol: 'BCM', name: 'Betacom S.A.', stooqSymbol: 'bcm.pl', sector: 'Technologia' },
  { symbol: 'BDX', name: 'Budimex S.A.', stooqSymbol: 'bdx.pl', sector: 'Budownictwo' },
  { symbol: 'BFT', name: 'Benefit Systems S.A.', stooqSymbol: 'bft.pl', sector: 'Usługi' },
  { symbol: 'BHW', name: 'Bank Handlowy w Warszawie S.A.', stooqSymbol: 'bhw.pl', sector: 'Banki' },
  { symbol: 'BIO', name: 'Bioton S.A.', stooqSymbol: 'bio.pl', sector: 'Biotechnologia' },
  { symbol: 'BLO', name: 'Bloober Team S.A.', stooqSymbol: 'blo.pl', sector: 'Gry' },
  { symbol: 'BMC', name: 'Bumech S.A.', stooqSymbol: 'bmc.pl', sector: 'Przemysł' },
  { symbol: 'BNP', name: 'BNP Paribas Bank Polska S.A.', stooqSymbol: 'bnp.pl', sector: 'Banki' },
  { symbol: 'BOS', name: 'BOŚ S.A.', stooqSymbol: 'bos.pl', sector: 'Banki' },
  { symbol: 'BOW', name: 'Bowim S.A.', stooqSymbol: 'bow.pl', sector: 'Stal' },
  { symbol: 'BRS', name: 'Boryszew S.A.', stooqSymbol: 'brs.pl', sector: 'Przemysł' },
  { symbol: 'CAR', name: 'Inter Cars S.A.', stooqSymbol: 'car.pl', sector: 'Handel' },
  { symbol: 'CCC', name: 'CCC S.A.', stooqSymbol: 'ccc.pl', sector: 'Handel' },
  { symbol: 'CDL', name: 'CDRL S.A.', stooqSymbol: 'cdl.pl', sector: 'Handel' },
  { symbol: 'CDR', name: 'CD Projekt S.A.', stooqSymbol: 'cdr.pl', sector: 'Gry' },
  { symbol: 'CIG', name: 'CI Games S.A.', stooqSymbol: 'cig.pl', sector: 'Gry' },
  { symbol: 'CLC', name: 'Coal Energy S.A.', stooqSymbol: 'clc.pl', sector: 'Energia' },
  { symbol: 'CMP', name: 'Comp S.A.', stooqSymbol: 'cmp.pl', sector: 'Technologia' },
  { symbol: 'CMR', name: 'Comarch S.A.', stooqSymbol: 'cmr.pl', sector: 'Technologia' },
  { symbol: 'COG', name: 'Cognor Holding S.A.', stooqSymbol: 'cog.pl', sector: 'Stal' },
  { symbol: 'CPD', name: 'CPD S.A.', stooqSymbol: 'cpd.pl', sector: 'Deweloperzy' },
  { symbol: 'CPS', name: 'Cyfrowy Polsat S.A.', stooqSymbol: 'cps.pl', sector: 'Media' },
  { symbol: 'CRI', name: 'Creotech Instruments S.A.', stooqSymbol: 'cri.pl', sector: 'Technologia' },
  { symbol: 'CSR', name: 'Caspar Asset Management S.A.', stooqSymbol: 'csr.pl', sector: 'Finanse' },
  { symbol: 'DAD', name: 'Dadelo S.A.', stooqSymbol: 'dad.pl', sector: 'Handel' },
  { symbol: 'DAT', name: 'DataWalk S.A.', stooqSymbol: 'dat.pl', sector: 'Technologia' },
  { symbol: 'DBC', name: 'Dębica S.A.', stooqSymbol: 'dbc.pl', sector: 'Przemysł' },
  { symbol: 'DCR', name: 'Decora S.A.', stooqSymbol: 'dcr.pl', sector: 'Przemysł' },
  { symbol: 'DNP', name: 'Dino Polska S.A.', stooqSymbol: 'dnp.pl', sector: 'Handel' },
  { symbol: 'DOM', name: 'Dom Development S.A.', stooqSymbol: 'dom.pl', sector: 'Deweloperzy' },
  { symbol: 'DVL', name: 'Develia S.A.', stooqSymbol: 'dvl.pl', sector: 'Deweloperzy' },
  { symbol: 'EAT', name: 'AmRest Holdings SE', stooqSymbol: 'eat.pl', sector: 'Gastronomia' },
  { symbol: 'ECH', name: 'Echo Investment S.A.', stooqSymbol: 'ech.pl', sector: 'Deweloperzy' },
  { symbol: 'ENA', name: 'Enea S.A.', stooqSymbol: 'ena.pl', sector: 'Energia' },
  { symbol: 'ENG', name: 'Energa S.A.', stooqSymbol: 'eng.pl', sector: 'Energia' },
  { symbol: 'ENT', name: 'Enter Air S.A.', stooqSymbol: 'ent.pl', sector: 'Transport' },
  { symbol: 'ERB', name: 'Erbud S.A.', stooqSymbol: 'erb.pl', sector: 'Budownictwo' },
  { symbol: 'EUR', name: 'Eurocash S.A.', stooqSymbol: 'eur.pl', sector: 'Handel' },
  { symbol: 'FAB', name: 'Śnieżka S.A.', stooqSymbol: 'fab.pl', sector: 'Chemia' },
  { symbol: 'FRO', name: 'Ferro S.A.', stooqSymbol: 'fro.pl', sector: 'Przemysł' },
  { symbol: 'FTE', name: 'Forte S.A.', stooqSymbol: 'fte.pl', sector: 'Meble' },
  { symbol: 'GPW', name: 'Giełda Papierów Wartościowych S.A.', stooqSymbol: 'gpw.pl', sector: 'Finanse' },
  { symbol: 'GTC', name: 'Globe Trade Centre S.A.', stooqSymbol: 'gtc.pl', sector: 'Deweloperzy' },
  { symbol: 'HUG', name: 'Huuuge Inc.', stooqSymbol: 'hug.pl', sector: 'Gry' },
  { symbol: 'ICE', name: 'Medinice S.A.', stooqSymbol: 'ice.pl', sector: 'Medycyna' },
  { symbol: 'IFI', name: 'IFIRMA S.A.', stooqSymbol: 'ifi.pl', sector: 'Technologia' },
  { symbol: 'ING', name: 'ING Bank Śląski S.A.', stooqSymbol: 'ing.pl', sector: 'Banki' },
  { symbol: 'JSW', name: 'Jastrzębska Spółka Węglowa S.A.', stooqSymbol: 'jsw.pl', sector: 'Surowce' },
  { symbol: 'KER', name: 'Kernel Holding S.A.', stooqSymbol: 'ker.pl', sector: 'Rolnictwo' },
  { symbol: 'KGH', name: 'KGHM Polska Miedź S.A.', stooqSymbol: 'kgh.pl', sector: 'Surowce' },
  { symbol: 'KRU', name: 'Kruk S.A.', stooqSymbol: 'kru.pl', sector: 'Finanse' },
  { symbol: 'KTY', name: 'Grupa Kęty S.A.', stooqSymbol: 'kty.pl', sector: 'Przemysł' },
  { symbol: 'LBW', name: 'Lubawa S.A.', stooqSymbol: 'lbw.pl', sector: 'Przemysł' },
  { symbol: 'LEN', name: 'Lena Lighting S.A.', stooqSymbol: 'len.pl', sector: 'Przemysł' },
  { symbol: 'LPP', name: 'LPP S.A.', stooqSymbol: 'lpp.pl', sector: 'Handel' },
  { symbol: 'LTX', name: 'Lentex S.A.', stooqSymbol: 'ltx.pl', sector: 'Przemysł' },
  { symbol: 'LWB', name: 'Lubelski Węgiel Bogdanka S.A.', stooqSymbol: 'lwb.pl', sector: 'Energia' },
  { symbol: 'MAB', name: 'Mabion S.A.', stooqSymbol: 'mab.pl', sector: 'Biotechnologia' },
  { symbol: 'MBK', name: 'mBank S.A.', stooqSymbol: 'mbk.pl', sector: 'Banki' },
  { symbol: 'MCI', name: 'MCI Capital ASI S.A.', stooqSymbol: 'mci.pl', sector: 'Finanse' },
  { symbol: 'MDG', name: 'Medicalgorithmics S.A.', stooqSymbol: 'mdg.pl', sector: 'Medycyna' },
  { symbol: 'MDV', name: 'Modivo S.A.', stooqSymbol: 'mdv.pl', sector: 'E-commerce' },
  { symbol: 'MIL', name: 'Bank Millennium S.A.', stooqSymbol: 'mil.pl', sector: 'Banki' },
  { symbol: 'MOC', name: 'Mo-Bruk S.A.', stooqSymbol: 'moc.pl', sector: 'Odpady' },
  { symbol: 'MOL', name: 'MOL Nyrt.', stooqSymbol: 'mol.pl', sector: 'Paliwa' },
  { symbol: 'MRB', name: 'Mirbud S.A.', stooqSymbol: 'mrb.pl', sector: 'Budownictwo' },
  { symbol: 'MRC', name: 'Mercator Medical S.A.', stooqSymbol: 'mrc.pl', sector: 'Medycyna' },
  { symbol: 'MSP', name: 'Mostostal Płock S.A.', stooqSymbol: 'msp.pl', sector: 'Budownictwo' },
  { symbol: 'MUR', name: 'Murapol S.A.', stooqSymbol: 'mur.pl', sector: 'Deweloperzy' },
  { symbol: 'NEU', name: 'Neuca S.A.', stooqSymbol: 'neu.pl', sector: 'Farmacja' },
  { symbol: 'NNG', name: 'NanoGroup S.A.', stooqSymbol: 'nng.pl', sector: 'Biotechnologia' },
  { symbol: 'NTT', name: 'NTT System S.A.', stooqSymbol: 'ntt.pl', sector: 'Technologia' },
  { symbol: 'NVT', name: 'Novita S.A.', stooqSymbol: 'nvt.pl', sector: 'Przemysł' },
  { symbol: 'OPL', name: 'Orange Polska S.A.', stooqSymbol: 'opl.pl', sector: 'Telekomunikacja' },
  { symbol: 'OPN', name: 'Oponeo.pl S.A.', stooqSymbol: 'opn.pl', sector: 'E-commerce' },
  { symbol: 'PCR', name: 'PCF Group S.A.', stooqSymbol: 'pcr.pl', sector: 'Gry' },
  { symbol: 'PCE', name: 'PCC Exol S.A.', stooqSymbol: 'pce.pl', sector: 'Chemia' },
  { symbol: 'PEO', name: 'Bank Pekao S.A.', stooqSymbol: 'peo.pl', sector: 'Banki' },
  { symbol: 'PGE', name: 'PGE Polska Grupa Energetyczna S.A.', stooqSymbol: 'pge.pl', sector: 'Energia' },
  { symbol: 'PKN', name: 'Orlen S.A.', stooqSymbol: 'pkn.pl', sector: 'Paliwa' },
  { symbol: 'PKO', name: 'PKO Bank Polski S.A.', stooqSymbol: 'pko.pl', sector: 'Banki' },
  { symbol: 'PLW', name: 'PlayWay S.A.', stooqSymbol: 'plw.pl', sector: 'Gry' },
  { symbol: 'PMP', name: 'Pamapol S.A.', stooqSymbol: 'pmp.pl', sector: 'Spożywcze' },
  { symbol: 'PXM', name: 'Polimex Mostostal S.A.', stooqSymbol: 'pxm.pl', sector: 'Budownictwo' },
  { symbol: 'PZU', name: 'PZU S.A.', stooqSymbol: 'pzu.pl', sector: 'Ubezpieczenia' },
  { symbol: 'RBW', name: 'Rainbow Tours S.A.', stooqSymbol: 'rbw.pl', sector: 'Turystyka' },
  { symbol: 'RWL', name: 'Rawlplug S.A.', stooqSymbol: 'rwl.pl', sector: 'Przemysł' },
  { symbol: 'SAN', name: 'Sanok Rubber Company S.A.', stooqSymbol: 'san.pl', sector: 'Przemysł' },
  { symbol: 'SNT', name: 'Synektik S.A.', stooqSymbol: 'snt.pl', sector: 'Medycyna' },
  { symbol: 'SPL', name: 'Santander Bank Polska S.A.', stooqSymbol: 'spl.pl', sector: 'Banki' },
  { symbol: 'STP', name: 'Stalprodukt S.A.', stooqSymbol: 'stp.pl', sector: 'Stal' },
  { symbol: 'SVE', name: 'Selvita S.A.', stooqSymbol: 'sve.pl', sector: 'Biotechnologia' },
  { symbol: 'TAR', name: 'Tarczyński S.A.', stooqSymbol: 'tar.pl', sector: 'Spożywcze' },
  { symbol: 'TEN', name: 'Ten Square Games S.A.', stooqSymbol: 'ten.pl', sector: 'Gry' },
  { symbol: 'TIM', name: 'TIM S.A.', stooqSymbol: 'tim.pl', sector: 'Handel' },
  { symbol: 'TOR', name: 'Torpol S.A.', stooqSymbol: 'tor.pl', sector: 'Budownictwo' },
  { symbol: 'TPE', name: 'Tauron Polska Energia S.A.', stooqSymbol: 'tpe.pl', sector: 'Energia' },
  { symbol: 'TXT', name: 'Text S.A.', stooqSymbol: 'txt.pl', sector: 'Technologia' },
  { symbol: 'UNT', name: 'Unimot S.A.', stooqSymbol: 'unt.pl', sector: 'Paliwa' },
  { symbol: 'VGO', name: 'Vigo Photonics S.A.', stooqSymbol: 'vgo.pl', sector: 'Technologia' },
  { symbol: 'VRG', name: 'VRG S.A.', stooqSymbol: 'vrg.pl', sector: 'Handel' },
  { symbol: 'VOT', name: 'Votum S.A.', stooqSymbol: 'vot.pl', sector: 'Finanse' },
  { symbol: 'WLT', name: 'Wielton S.A.', stooqSymbol: 'wlt.pl', sector: 'Przemysł' },
  { symbol: 'WPL', name: 'Wirtualna Polska Holding S.A.', stooqSymbol: 'wpl.pl', sector: 'Media' },
  { symbol: 'WWL', name: 'Wawel S.A.', stooqSymbol: 'wwl.pl', sector: 'Spożywcze' },
  { symbol: 'XTB', name: 'XTB S.A.', stooqSymbol: 'xtb.pl', sector: 'Finanse' },
  { symbol: 'ZAB', name: 'Żabka Group S.A.', stooqSymbol: 'zab.pl', sector: 'Handel' },
  { symbol: 'ZEP', name: 'ZE PAK S.A.', stooqSymbol: 'zep.pl', sector: 'Energia' }
];

const seedState = {
  assets: [
    { id: 'asset-mdv', ...GPW_COMPANIES.find((x) => x.symbol === 'MDV') },
    { id: 'asset-lwb', ...GPW_COMPANIES.find((x) => x.symbol === 'LWB') },
    { id: 'asset-dnp', ...GPW_COMPANIES.find((x) => x.symbol === 'DNP') },
    { id: 'asset-pkn', ...GPW_COMPANIES.find((x) => x.symbol === 'PKN') }
  ],
  transactions: [
    { id: 'tr-1', assetId: 'asset-mdv', type: 'buy', date: '2026-05-25', quantity: 100, price: 100, fees: 5 },
    { id: 'tr-2', assetId: 'asset-lwb', type: 'buy', date: '2026-01-01', quantity: 250, price: 22, fees: 3 },
    { id: 'tr-3', assetId: 'asset-dnp', type: 'buy', date: '2026-04-01', quantity: 100, price: 10, fees: 2 },
    { id: 'tr-4', assetId: 'asset-pkn', type: 'buy', date: '2026-05-04', quantity: 100, price: 120, fees: 5 }
  ],
  quotes: {},
  history: {}
};

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState;
    const parsed = JSON.parse(raw);
    return {
      ...seedState,
      ...parsed,
      quotes: parsed?.quotes || {},
      history: parsed?.history || {}
    };
  } catch {
    return seedState;
  }
}

function formatMoney(value) {
  const n = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: PLN,
    maximumFractionDigits: 2
  }).format(n);
}

function formatNumber(value, digits = 2) {
  return new Intl.NumberFormat('pl-PL', {
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
}

function findCompany(symbol) {
  const s = String(symbol || '').trim().toUpperCase();
  return GPW_COMPANIES.find((c) => c.symbol === s);
}

function calculatePosition(asset, transactions, currentPrice) {
  const sorted = transactions
    .filter((t) => t.assetId === asset.id)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let qty = 0;
  let cost = 0;
  let realized = 0;

  for (const t of sorted) {
    const q = Number(t.quantity) || 0;
    const price = Number(t.price) || 0;
    const fees = Number(t.fees) || 0;

    if (t.type === 'buy') {
      qty += q;
      cost += q * price + fees;
    } else {
      const sellQty = Math.min(q, qty);
      const avg = qty > 0 ? cost / qty : 0;
      const soldCost = avg * sellQty;
      realized += sellQty * price - fees - soldCost;
      qty -= sellQty;
      cost -= soldCost;
      if (qty < 0.0000001) qty = 0;
      if (cost < 0.0000001) cost = 0;
    }
  }

  const avgPrice = qty > 0 ? cost / qty : 0;
  const value = qty * currentPrice;
  const unrealized = value - cost;
  const totalPL = unrealized + realized;
  const plPct = cost > 0 ? (unrealized / cost) * 100 : 0;

  return {
    qty,
    cost,
    avgPrice,
    value,
    unrealized,
    realized,
    totalPL,
    plPct,
    txCount: sorted.length
  };
}

function getCurrentPrice(asset, quotes, transactions) {
  const quote = quotes[asset.id]?.close;
  if (Number.isFinite(quote) && quote > 0) return quote;
  const last = transactions
    .filter((t) => t.assetId === asset.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  return Number(last?.price) || 0;
}

function quoteLabel(assetId, quotes) {
  const q = quotes[assetId];
  if (!q) return 'Brak notowania ze Stooq – użyto ceny ostatniej transakcji';
  return `Stooq: ${q.date || ''}${q.time ? `, ${q.time}` : ''}`.trim();
}


function formatDateShort(date) {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(date));
  } catch {
    return date;
  }
}

function formatPercent(value) {
  if (!Number.isFinite(value)) return '—';
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatNumber(value)}%`;
}

function getMinTransactionDate(transactions) {
  const dates = transactions.map((t) => t.date).filter(Boolean).sort();
  return dates[0] || new Date().toISOString().slice(0, 10);
}

function compactDate(date) {
  return String(date || '').replaceAll('-', '');
}

function calculateQuantityUntil(assetId, transactions, date) {
  return transactions
    .filter((t) => t.assetId === assetId && t.date <= date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .reduce((qty, t) => qty + (t.type === 'buy' ? 1 : -1) * (Number(t.quantity) || 0), 0);
}

function getHistoricalPrice(assetId, history, date, fallbackPrice) {
  const rows = (history?.[assetId] || []).filter((r) => r.date <= date).sort((a, b) => a.date.localeCompare(b.date));
  const last = rows[rows.length - 1];
  return Number(last?.close) || fallbackPrice || 0;
}

function buildPortfolioSeries(assets, transactions, history, quotes) {
  const dateSet = new Set(transactions.map((t) => t.date).filter(Boolean));
  Object.values(history || {}).forEach((items) => (items || []).forEach((h) => dateSet.add(h.date)));
  const dates = [...dateSet].filter(Boolean).sort();
  const series = [];

  for (const date of dates) {
    let value = 0;
    for (const asset of assets) {
      const qty = calculateQuantityUntil(asset.id, transactions, date);
      if (qty <= 0) continue;
      const fallback = Number(quotes?.[asset.id]?.close) || 0;
      const price = getHistoricalPrice(asset.id, history, date, fallback);
      value += qty * price;
    }
    if (value > 0) series.push({ date, value });
  }

  return series;
}

function PortfolioChart({ series }) {
  if (!series || series.length < 2) {
    return <div className="empty">Odśwież ceny i historię, aby zbudować wykres wartości portfela w czasie.</div>;
  }

  const width = 920;
  const height = 260;
  const padding = 34;
  const values = series.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = series.map((p, i) => {
    const x = padding + (i / Math.max(1, series.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.value - min) / span) * (height - padding * 2);
    return { ...p, x, y };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `${padding},${height - padding} ${line} ${width - padding},${height - padding}`;
  const first = series[0];
  const last = series[series.length - 1];
  const change = last.value - first.value;
  const changePct = first.value ? (change / first.value) * 100 : 0;

  return (
    <div className="chart-card">
      <div className="chart-stats">
        <div>
          <span>Od</span>
          <strong>{formatDateShort(first.date)}</strong>
        </div>
        <div>
          <span>Do</span>
          <strong>{formatDateShort(last.date)}</strong>
        </div>
        <div>
          <span>Zmiana</span>
          <strong className={change >= 0 ? 'good-text' : 'bad-text'}>{formatMoney(change)} · {formatPercent(changePct)}</strong>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="portfolio-chart" role="img" aria-label="Wykres wartości portfela w czasie">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={`${padding},${padding} ${padding},${height - padding} ${width - padding},${height - padding}`} fill="none" stroke="#d9e4f1" strokeWidth="2" />
        <polygon points={area} fill="url(#chartFill)" />
        <polyline points={line} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {points.filter((_, i) => i === 0 || i === points.length - 1).map((p) => (
          <circle key={p.date} cx={p.x} cy={p.y} r="5" fill="#2563eb" />
        ))}
      </svg>
    </div>
  );
}

function ClosedPositionsCard({ rows }) {
  return (
    <div className="closed-card">
      {rows.length === 0 ? (
        <div className="empty">Brak historycznie zamkniętych pozycji.</div>
      ) : (
        <div className="closed-list">
          {rows.map((r) => (
            <div className="closed-item" key={r.asset.id}>
              <div>
                <b>{r.asset.symbol}</b>
                <span>{r.asset.name}</span>
              </div>
              <strong className={r.realized >= 0 ? 'good-text' : 'bad-text'}>{formatMoney(r.realized)}</strong>
              <small>{r.txCount} transakcji</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, sub, icon, tone = 'neutral' }) {
  return (
    <section className={`metric-card ${tone}`}>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        {sub && <span>{sub}</span>}
      </div>
      <div className="metric-icon">{icon}</div>
    </section>
  );
}

function AllocationChart({ rows }) {
  const total = rows.reduce((s, r) => s + r.value, 0);

  if (!total) {
    return <div className="empty">Dodaj pierwszą transakcję, aby zobaczyć alokację portfela.</div>;
  }

  let acc = 0;
  const stops = rows
    .map((r, i) => {
      const start = acc;
      const deg = (r.value / total) * 360;
      acc += deg;
      return `var(--chart-${(i % 6) + 1}) ${start}deg ${acc}deg`;
    })
    .join(', ');

  return (
    <div className="allocation">
      <div className="donut" style={{ background: `conic-gradient(${stops})` }} />
      <div className="legend">
        {rows.slice(0, 6).map((r, i) => (
          <div className="legend-row" key={r.asset.id}>
            <span className="dot" style={{ background: `var(--chart-${(i % 6) + 1})` }} />
            <span>
              <b>{r.asset.symbol}</b>
              <small>{formatNumber(total ? (r.value / total) * 100 : 0)}%</small>
            </span>
            <strong>{formatMoney(r.value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="brand-logo" aria-hidden="true">
      <svg viewBox="0 0 180 96" role="img">
        <defs>
          <linearGradient id="piGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <path
          d="M48 72c-12-2-23-10-29-21-5-9-7-21-1-30 3-5 9-8 15-8 8 0 14 5 18 11 5-2 8-6 12-10 5-6 12-12 22-12 5 0 9 2 12 5-8 0-12 3-16 8-5 6-7 11-7 19 0 16 13 30 13 30-8 0-14-2-20-7-3-2-6-5-8-9l-3 7c-2 5-6 12-18 17Z"
          fill="#101828"
          opacity="0.96"
        />
        <path
          d="M132 74c11-1 22-8 29-18 6-10 8-23 2-33-4-7-11-10-19-10-6 0-12 2-16 7 4 1 8 5 10 10 3 6 2 13-2 18 11 1 19 8 25 16-8 1-14 1-22 0-4 4-8 7-14 10 0 0 5-8 5-17 0-7-3-14-9-19-5-5-11-7-18-7-2 0-4 0-6 1 4-7 12-12 23-12 11 0 21 4 30 11-2-8-8-15-16-19 7 0 13 2 19 6 10 8 16 19 18 32 1 10-1 20-7 28-8 11-20 18-32 20Z"
          fill="#101828"
          opacity="0.96"
        />
        <path d="M66 22h48" stroke="url(#piGradient)" strokeWidth="11" strokeLinecap="round" />
        <path d="M78 22v48" stroke="url(#piGradient)" strokeWidth="11" strokeLinecap="round" />
        <path d="M102 22v48" stroke="url(#piGradient)" strokeWidth="11" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function App() {
  const [state, setState] = useState(loadState);
  const [txForm, setTxForm] = useState({
    symbol: '',
    name: '',
    type: 'buy',
    date: new Date().toISOString().slice(0, 10),
    quantity: '',
    price: '',
    fees: '0'
  });
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const rows = useMemo(() => {
    return state.assets
      .map((asset) => {
        const price = getCurrentPrice(asset, state.quotes, state.transactions);
        const pos = calculatePosition(asset, state.transactions, price);
        return { asset, price, ...pos };
      })
      .filter((r) => r.qty > 0 || r.txCount > 0)
      .sort((a, b) => b.value - a.value);
  }, [state]);

  const activeRows = useMemo(() => rows.filter((r) => r.qty > 0), [rows]);
  const closedRows = useMemo(() => rows.filter((r) => r.txCount > 0 && r.qty <= 0.0000001), [rows]);
  const portfolioSeries = useMemo(
    () => buildPortfolioSeries(state.assets, state.transactions, state.history, state.quotes),
    [state.assets, state.transactions, state.history, state.quotes]
  );

  const filteredRows = activeRows.filter((r) =>
    `${r.asset.name} ${r.asset.symbol} ${r.asset.sector}`.toLowerCase().includes(query.toLowerCase())
  );

  const totals = useMemo(() => {
    const value = activeRows.reduce((s, r) => s + r.value, 0);
    const invested = activeRows.reduce((s, r) => s + r.cost, 0);
    const realized = rows.reduce((s, r) => s + r.realized, 0);
    const pl = value - invested + realized;
    const plPct = invested ? (pl / invested) * 100 : 0;
    return {
      value,
      invested,
      realized,
      pl,
      plPct,
      count: activeRows.length
    };
  }, [rows, activeRows]);

  function onSymbolChange(value) {
    const symbol = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const company = findCompany(symbol);
    setTxForm((f) => ({
      ...f,
      symbol,
      name: company?.name || symbol
    }));
  }

  function addTransaction(e) {
    e.preventDefault();
    const symbol = txForm.symbol.trim().toUpperCase();
    const quantity = Number(txForm.quantity);
    const price = Number(txForm.price);

    if (!symbol || !quantity || !price) {
      setStatus('Uzupełnij symbol, liczbę sztuk i cenę transakcji.');
      return;
    }

    const company = findCompany(symbol);

    setState((s) => {
      let asset = s.assets.find((a) => a.symbol === symbol);
      let assets = s.assets;

      if (!asset) {
        asset = {
          id: uid('asset'),
          symbol,
          name: txForm.name.trim() || company?.name || symbol,
          stooqSymbol: company?.stooqSymbol || `${symbol.toLowerCase()}.pl`,
          sector: company?.sector || 'GPW'
        };
        assets = [...s.assets, asset];
      }

      const transaction = {
        id: uid('tr'),
        assetId: asset.id,
        type: txForm.type,
        date: txForm.date,
        quantity,
        price,
        fees: Number(txForm.fees) || 0
      };

      return { ...s, assets, transactions: [...s.transactions, transaction] };
    });

    setTxForm((f) => ({ ...f, quantity: '', price: '', fees: '0' }));
    setStatus('Transakcja została zapisana.');
  }

  function removeTransaction(id) {
    setState((s) => ({
      ...s,
      transactions: s.transactions.filter((t) => t.id !== id)
    }));
  }

  async function refreshQuotes() {
    setStatus('Pobieram notowania oraz historię GPW ze Stooq...');
    const updates = {};
    const historyUpdates = {};
    const d1 = compactDate(getMinTransactionDate(state.transactions));
    const d2 = compactDate(new Date().toISOString().slice(0, 10));

    await Promise.all(
      state.assets.map(async (asset) => {
        if (!asset.stooqSymbol) return;
        try {
          const quoteRes = await fetch(`/api/quote?s=${encodeURIComponent(asset.stooqSymbol)}`);
          const quoteData = await quoteRes.json();
          if (quoteRes.ok && Number.isFinite(quoteData.close)) {
            updates[asset.id] = { ...quoteData, fetchedAt: new Date().toISOString() };
          }
        } catch {
          // ignorujemy pojedyncze błędy symboli
        }

        try {
          const historyRes = await fetch(`/api/history?s=${encodeURIComponent(asset.stooqSymbol)}&d1=${d1}&d2=${d2}`);
          const historyData = await historyRes.json();
          if (historyRes.ok && Array.isArray(historyData.rows)) {
            historyUpdates[asset.id] = historyData.rows;
          }
        } catch {
          // historia jest dodatkiem, aplikacja działa także bez niej
        }
      })
    );

    setState((s) => ({
      ...s,
      quotes: { ...s.quotes, ...updates },
      history: { ...s.history, ...historyUpdates }
    }));

    const quoteCount = Object.keys(updates).length;
    const historyCount = Object.keys(historyUpdates).length;
    setStatus(
      quoteCount || historyCount
        ? `Zaktualizowano ${quoteCount} notowań i ${historyCount} serii historycznych.`
        : 'Nie pobrano nowych danych. Sprawdź symbole spółek.'
    );
  }

  function exportCsv() {
    const header = [
      'nazwa',
      'symbol',
      'liczba',
      'srednia_cena_pln',
      'aktualna_cena_pln',
      'wartosc_pln',
      'koszt_pln',
      'pl_pln',
      'pl_proc'
    ];
    const lines = [header.join(',')].concat(
      rows.map((r) =>
        [
          r.asset.name,
          r.asset.symbol,
          r.qty,
          r.avgPrice,
          r.price,
          r.value,
          r.cost,
          r.value - r.cost,
          r.plPct
        ]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(',')
      )
    );
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `portfel-gpw-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json'
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `portfel-gpw-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importBackup(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const next = JSON.parse(reader.result);
        setState({ ...seedState, ...next, quotes: next?.quotes || {}, history: next?.history || {} });
        setStatus('Wczytano kopię zapasową JSON.');
      } catch {
        setStatus('Nieprawidłowy plik JSON.');
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <div className="brand">
            <BrandMark />
            <div>
              <span>Portfel Inwestycyjny</span>
              <strong>PI</strong>
            </div>
          </div>
          <p className="eyebrow">GPW · PLN · podsumowanie inwestycji</p>
          <h1>Portfel Inwestycyjny</h1>
        </div>


      </section>

      <section className="metrics">
        <MetricCard
          title="Wartość netto"
          value={formatMoney(totals.value)}
          sub="bieżąca wartość pozycji"
          icon={<BarChart3 size={24} />}
        />
        <MetricCard
          title="Łącznie zainwestowano"
          value={formatMoney(totals.invested)}
          sub="koszt otwartych pozycji"
          icon={<WalletCards size={24} />}
        />
        <MetricCard
          title="Łączny zysk/strata"
          value={formatMoney(totals.pl)}
          sub={`${formatNumber(totals.plPct)}%`}
          icon={totals.pl >= 0 ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
          tone={totals.pl >= 0 ? 'good' : 'bad'}
        />
        <MetricCard
          title="Liczba aktywów"
          value={totals.count}
          sub="otwarte pozycje"
          icon={<ShieldCheck size={24} />}
        />
      </section>

      {status && <div className="notice">{status}</div>}

      <section className="top-grid">
        <div className="panel transaction-panel">
          <div className="panel-head">
            <div>
              <h2>Dodaj transakcję</h2>
            </div>
          </div>

          <form className="form tx-form" onSubmit={addTransaction}>
            <div className="field symbol-field">
              <label>Symbol GPW</label>
              <input list="gpw-symbols" placeholder="np. PKN" value={txForm.symbol} onChange={(e) => onSymbolChange(e.target.value)} />
              <datalist id="gpw-symbols">
                {GPW_COMPANIES.map((c) => (
                  <option key={c.symbol} value={c.symbol}>{c.name}</option>
                ))}
              </datalist>
            </div>

            <div className="field name-field">
              <label>Nazwa spółki</label>
              <input
                placeholder="uzupełniana automatycznie lub wpisz ręcznie"
                value={txForm.name}
                onChange={(e) => setTxForm({ ...txForm, name: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Typ</label>
              <select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value })}>
                <option value="buy">Kupno</option>
                <option value="sell">Sprzedaż</option>
              </select>
            </div>

            <div className="field">
              <label>Data</label>
              <input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} />
            </div>

            <div className="field">
              <label>Liczba sztuk</label>
              <input
                type="number"
                step="0.0001"
                placeholder="100"
                value={txForm.quantity}
                onChange={(e) => setTxForm({ ...txForm, quantity: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Cena za sztukę</label>
              <input
                type="number"
                step="0.0001"
                placeholder="120.50"
                value={txForm.price}
                onChange={(e) => setTxForm({ ...txForm, price: e.target.value })}
              />
            </div>

            <div className="field">
              <label>Prowizja (PLN)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={txForm.fees}
                onChange={(e) => setTxForm({ ...txForm, fees: e.target.value })}
              />
            </div>

            <div className="form-actions">
              <button className="primary" type="submit">
                <Plus size={17} /> Dodaj transakcję
              </button>
            </div>
          </form>
        </div>

        <div className="panel allocation-panel">
          <div className="panel-head">
            <div>
              <h2>Alokacja portfela</h2>
              <p>Podział bieżącej wartości aktywów według poszczególnych spółek.</p>
            </div>
            <strong>{formatMoney(totals.value)}</strong>
          </div>
          <AllocationChart rows={activeRows} />
        </div>
      </section>

      <section className="panel portfolio-panel">
        <div className="panel-head wrap">
          <div>
            <h2>Aktywa</h2>
            <p>Kliknij w wiersz, aby rozwinąć historię transakcji dla danej spółki.</p>
          </div>

          <div className="toolbar">
            <label className="search">
              <Search size={16} />
              <input
                placeholder="Filtruj nazwę, symbol lub sektor"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <button onClick={refreshQuotes} type="button">
              <RefreshCw size={16} /> Odśwież ceny i historię
            </button>
            <button onClick={exportCsv} type="button">
              <Download size={16} /> CSV
            </button>
            <button onClick={exportBackup} type="button">
              <FileJson size={16} /> Backup
            </button>
            <label className="button-like">
              <Upload size={16} /> Import
              <input type="file" accept="application/json" onChange={(e) => importBackup(e.target.files?.[0])} />
            </label>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Spółka</th>
                <th>Liczba</th>
                <th>Średnia cena</th>
                <th>Aktualna cena</th>
                <th>Wartość</th>
                <th>% portfela</th>
                <th>Zysk/Strata %</th>
                <th>Zysk/Strata</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => {
                const assetTx = state.transactions
                  .filter((t) => t.assetId === r.asset.id)
                  .sort((a, b) => new Date(b.date) - new Date(a.date));
                const isOpen = !!expanded[r.asset.id];

                return (
                  <React.Fragment key={r.asset.id}>
                    <tr className="asset-row" onClick={() => setExpanded((x) => ({ ...x, [r.asset.id]: !x[r.asset.id] }))}>
                      <td className="chev">{isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</td>
                      <td>
                        <b>{r.asset.name}</b>
                        <small>{r.asset.symbol} · {r.asset.sector || 'GPW'}</small>
                      </td>
                      <td>{formatNumber(r.qty, 4)}</td>
                      <td>{formatMoney(r.avgPrice)}</td>
                      <td>
                        <div className="price-line">
                          <b>{formatMoney(r.price)}</b>
                          {Number.isFinite(state.quotes[r.asset.id]?.dailyChangePct) && (
                            <span className={state.quotes[r.asset.id].dailyChangePct >= 0 ? 'change-pill good' : 'change-pill bad'}>
                              {formatPercent(state.quotes[r.asset.id].dailyChangePct)}
                            </span>
                          )}
                        </div>
                        <small>{quoteLabel(r.asset.id, state.quotes)}</small>
                      </td>
                      <td>
                        <b>{formatMoney(r.value)}</b>
                        <small>Koszt: {formatMoney(r.cost)}</small>
                      </td>
                      <td>{totals.value ? formatNumber((r.value / totals.value) * 100) : '0'}%</td>
                      <td>
                        <span className={r.plPct >= 0 ? 'pill good' : 'pill bad'}>{formatNumber(r.plPct)}%</span>
                      </td>
                      <td className={r.value - r.cost >= 0 ? 'good-text' : 'bad-text'}>{formatMoney(r.value - r.cost)}</td>
                    </tr>

                    {isOpen && (
                      <tr className="history-row">
                        <td></td>
                        <td colSpan="8">
                          <div className="history-box">
                            <div className="history-title">
                              <CalendarDays size={17} /> Historia transakcji: {r.asset.symbol}
                            </div>
                            <div className="history-list">
                              {assetTx.map((t) => (
                                <div className="history-item" key={t.id}>
                                  <span className={t.type === 'buy' ? 'tag buy' : 'tag sell'}>
                                    {t.type === 'buy' ? 'Kupno' : 'Sprzedaż'}
                                  </span>
                                  <strong>{t.date}</strong>
                                  <span>{formatNumber(t.quantity, 4)} szt.</span>
                                  <span>{formatMoney(t.price)} / szt.</span>
                                  <span>Prowizja: {formatMoney(t.fees || 0)}</span>
                                  <b>
                                    {formatMoney(
                                      (Number(t.quantity) || 0) * (Number(t.price) || 0) +
                                        (t.type === 'buy' ? Number(t.fees) || 0 : -(Number(t.fees) || 0))
                                    )}
                                  </b>
                                  <button className="ghost-danger" type="button" onClick={() => removeTransaction(t.id)}>
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="panel chart-panel">
          <div className="panel-head">
            <div>
              <h2>Wartość portfela w czasie</h2>
              <p>Wykres jest liczony na podstawie historii transakcji oraz dziennych cen zamknięcia pobranych ze Stooq.</p>
            </div>
          </div>
          <PortfolioChart series={portfolioSeries} />
        </div>

        <div className="panel closed-panel">
          <div className="panel-head">
            <div>
              <h2>Historyczne aktywa</h2>
              <p>Spółki, które były kiedyś w portfelu, ale aktualnie liczba akcji wynosi zero.</p>
            </div>
          </div>
          <ClosedPositionsCard rows={closedRows} />
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
