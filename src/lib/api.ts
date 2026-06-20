import { RakutenProduct } from '../types';

const YAHOO_APP_ID = '32MpLkyxT8';
const YAHOO_ENDPOINT = 'https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch';
const OFF_ENDPOINT = 'https://world.openfoodfacts.org/api/v0/product';

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
  const params = new URLSearchParams({
    appid: YAHOO_APP_ID,
    jan_code: janCode,
    results: '1',
  });

  const res = await fetch(`${YAHOO_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn('Yahoo API error:', res.status, body);
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
  // まずOpen Food Factsで検索
  const offResult = await searchOpenFoodFacts(janCode);
  if (offResult) return offResult;

  // 見つからなければYahoo!ショッピングで検索
  const yahooResult = await searchYahoo(janCode);
  if (yahooResult) return yahooResult;

  return null;
}
