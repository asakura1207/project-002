import { RakutenProduct } from '../types';

const RAKUTEN_APP_ID = 'f6dfd0c0-0ab3-480a-aaa9-bf79c575b7e0';
const RAKUTEN_OLD_ENDPOINT =
  'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601';
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

async function searchRakuten(janCode: string): Promise<RakutenProduct | null> {
  const params = new URLSearchParams({
    applicationId: RAKUTEN_APP_ID,
    keyword: janCode,
    hits: '1',
    format: 'json',
  });

  const res = await fetch(`${RAKUTEN_OLD_ENDPOINT}?${params.toString()}`);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.warn('Rakuten API error:', res.status, body);
    return null;
  }

  const data = await res.json();
  if (!data.Items || data.Items.length === 0) return null;

  const item = data.Items[0].Item;
  const imageUrl =
    item.mediumImageUrls?.length > 0 ? item.mediumImageUrls[0].imageUrl : '';

  return {
    name: item.itemName ?? '',
    image_url: imageUrl,
    maker: item.shopName ?? '',
    item_url: item.itemUrl ?? '',
  };
}

export async function searchByJanCode(janCode: string): Promise<RakutenProduct | null> {
  // まずOpen Food Factsで検索
  const offResult = await searchOpenFoodFacts(janCode);
  if (offResult) return offResult;

  // 見つからなければ旧楽天APIで検索
  const rakutenResult = await searchRakuten(janCode);
  if (rakutenResult) return rakutenResult;

  return null;
}
