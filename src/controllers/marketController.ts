import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/apiResponse.ts';
import fetch from 'node-fetch';
import { cryptoPriceService } from '../services/cryptoPriceService.ts';
import db from '../lib/db.ts';

const cryptoNames: Record<string, string> = {
  'BTC': 'Bitcoin',
  'ETH': 'Ethereum',
  'USDT': 'Tether',
  'BNB': 'BNB',
  'SOL': 'Solana',
  'XRP': 'XRP',
  'USDC': 'USDC',
  'ADA': 'Cardano',
  'AVAX': 'Avalanche',
  'DOGE': 'Dogecoin',
  'DOT': 'Polkadot',
  'LINK': 'Chainlink',
  'MATIC': 'Polygon',
  'SHIB': 'Shiba Inu',
  'LTC': 'Litecoin',
  'BCH': 'Bitcoin Cash',
  'UNI': 'Uniswap',
  'ATOM': 'Cosmos',
  'XLM': 'Stellar',
  'XMR': 'Monero'
};

export const getMarketPrice = async (req: Request, res: Response) => {
  const { symbol } = req.params;
  const { type } = req.query;
  const upperSymbol = symbol.toUpperCase();
  console.log('getMarketPrice: Searching for', upperSymbol, 'type:', type);
  const name = cryptoNames[upperSymbol] || upperSymbol;

  try {
    // If explicitly stock or real_estate, go to Yahoo Finance directly
    if (type === 'stocks' || type === 'real_estate' || type === 'stock') {
      try {
        const yahooRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${upperSymbol}.SA`);
        if (yahooRes.ok) {
          const yahooData = await yahooRes.json() as any;
          const result = yahooData.chart?.result?.[0];
          if (result && result.meta && result.meta.regularMarketPrice) {
            const stockPrice = result.meta.regularMarketPrice;
            return sendSuccess(res, { price: stockPrice, name: upperSymbol });
          }
        }
      } catch (e) {
        console.error('Erro ao buscar no Yahoo Finance:', e);
      }
      return sendError(res, 'Ativo não encontrado na B3', 404);
    }

    // Try to get from real-time service first
    const cachedPrice = cryptoPriceService.getPrice(symbol);
    if (cachedPrice !== null) {
      return sendSuccess(res, { price: cachedPrice, name });
    }

    // Try to get from DB cache
    const dbCache = await db('crypto_price_cache').where({ symbol: upperSymbol }).first();
    if (dbCache && Date.now() - new Date(dbCache.updated_at).getTime() < 300000) { // 5 minutes
      // Add to subscription so we get real-time updates next time
      cryptoPriceService.addSubscription(symbol);
      return sendSuccess(res, { price: parseFloat(dbCache.price), name });
    }

    // Try to fetch BRL pair first
    let response;
    try {
      response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${upperSymbol}BRL`);
    } catch (e) {
      console.error('Erro ao buscar na Binance (BRL):', e);
      response = { ok: false };
    }
    
    if (!response.ok) {
      // Fallback to USDT pair and convert
      try {
        response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${upperSymbol}USDT`);
      } catch (e) {
        console.error('Erro ao buscar na Binance (USDT):', e);
        response = { ok: false };
      }
      if (!response.ok) {
        // If type is explicitly crypto, fail here.
        if (type === 'crypto') {
          // Try Yahoo Finance for crypto (e.g. BTC-BRL) as a last resort
          try {
            const yahooRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${upperSymbol}-BRL`);
            if (yahooRes.ok) {
              const yahooData = await yahooRes.json() as any;
              const result = yahooData.chart?.result?.[0];
              if (result && result.meta && result.meta.regularMarketPrice) {
                const cryptoPrice = result.meta.regularMarketPrice;
                return sendSuccess(res, { price: cryptoPrice, name });
              }
            }
          } catch (e) {
            console.error('Erro ao buscar crypto no Yahoo Finance:', e);
          }
          return sendError(res, 'Criptomoeda não encontrada', 404);
        }

        // If it's not explicitly crypto, maybe it's a B3 stock (e.g. PETR4). We can try Yahoo Finance API.
        try {
          const yahooRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${upperSymbol}.SA`);
          if (yahooRes.ok) {
            const yahooData = await yahooRes.json() as any;
            const result = yahooData.chart?.result?.[0];
            if (result && result.meta && result.meta.regularMarketPrice) {
              const stockPrice = result.meta.regularMarketPrice;
              // Yahoo Finance doesn't return a clean name in this endpoint, but we can just use the symbol
              return sendSuccess(res, { price: stockPrice, name: upperSymbol });
            }
          }
        } catch (e) {
          console.error('Erro ao buscar no Yahoo Finance:', e);
        }
        return sendError(res, 'Preço não encontrado', 404);
      }
      
      const data = await response.json() as { price: string };
      const usdtPrice = parseFloat(data.price);
      
      // Fetch USDT/BRL
      let usdtBrlRes;
      try {
        usdtBrlRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=USDTBRL`);
      } catch (e) {
        console.error('Erro ao buscar USDTBRL na Binance:', e);
        usdtBrlRes = { ok: false };
      }
      
      if (usdtBrlRes.ok) {
        const usdtBrlData = await usdtBrlRes.json() as { price: string };
        const brlPrice = usdtPrice * parseFloat(usdtBrlData.price);
        cryptoPriceService.addSubscription(symbol);
        return sendSuccess(res, { price: brlPrice, name });
      } else {
        // If we can't get BRL, return USDT price
        cryptoPriceService.addSubscription(symbol);
        return sendSuccess(res, { price: usdtPrice, name });
      }
    }

    const data = await response.json() as { price: string };
    
    // Add to subscription so we get real-time updates next time
    cryptoPriceService.addSubscription(symbol);

    return sendSuccess(res, { price: parseFloat(data.price), name });
  } catch (error) {
    return sendError(res, 'Erro ao buscar preço de mercado');
  }
};
