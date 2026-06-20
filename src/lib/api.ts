import { RakutenProduct } from '../types';

const YAHOO_CLIENT_ID = 'SCz0yqZn1S';
const YAHOO_CLIENT_SECRET = 'rSyNS5XFJB7H5Twr1SmZ2RXxiD0Pf9zRNYt8Nd6Y';
const YAHOO_TOKEN_ENDPOINT = 'https://auth.login.yahoo.co.jp/yconnect/v2/token';
const YAHOO_SHOPPING_ENDPOINT =
  'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch';
const OFF_ENDPOINT = 'https://world.openfoodfacts.org/api/v0/product';

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getYahooToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const basic = btoa(`${YAHOO_CLIENT_ID}:${YAHOO_CLIENT_SECRET}`);
  const res = await fetch(YAHOO_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn('Yahoo token error:', res.status, body);
    return null;
  }

  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.token;
}

async function searchOpenFoodFacts(janCode: string): Promise<RakutenProduct | null> {
  const res = await fetch(`${OFF_ENDPOINT}/${janCode}.json`, {
    headers: { 'User-Agent': 'NominomotoZukan/1.0 (asakura104783@gmail.com)' },
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (data.status === 0 || !data.product) return null;

  const p = data.product;
  const name = p.product_name_ja || p.product_name || '';
  if (!name) return null;

  return {
    name,
    image_url: p.image_front_url || p.image_url || '',
    maker: p.brands || '',
    item_url: '',
  };
}

async function searchYahoo(janCode: string): Promise<RakutenProduct | null> {
  const token = await getYahooToken();
  if (!token) return null;

  const params = new URLSearchParams({ jan_code: janCode, results: '1' });
  const res = await fetch(`${YAHOO_SHOPPING_ENDPOINT}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn('Yahoo Shopping error:', res.status, body);
    return null;
  }

  const data = await res.json();
  const hits = data.hits;
  if (!hits || hits.length === 0) return null;

  const item = hits[0];
  return {
    name: item.name ?? '',
    image_url: item.image?.small ?? '',
    maker: item.brand?.name ?? item.seller?.name ?? '',
    item_url: item.url ?? '',
  };
}

export async function searchByJanCode(janCode: string): Promise<RakutenProduct | null> {
  const offResult = await searchOpenFoodFacts(janCode);
  if (offResult) return offResult;

  const yahooResult = await searchYahoo(janCode);
  if (yahooResult) return yahooResult;

  return null;
}
