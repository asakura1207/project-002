import { RakutenProduct } from '../types';

// 楽天デベロッパーサイト https://webservice.rakuten.co.jp/ でアプリIDを取得してください
const RAKUTEN_APP_ID = 'f6dfd0c0-0ab3-480a-aaa9-bf79c575b7e0';

const ENDPOINT = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601';

export async function searchByJanCode(janCode: string): Promise<RakutenProduct | null> {
  const params = new URLSearchParams({
    applicationId: RAKUTEN_APP_ID,
    keyword: janCode,
    hits: '1',
    format: 'json',
  });

  const response = await fetch(`${ENDPOINT}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.Items || data.Items.length === 0) {
    return null;
  }

  const item = data.Items[0].Item;
  const imageUrl =
    item.mediumImageUrls && item.mediumImageUrls.length > 0
      ? item.mediumImageUrls[0].imageUrl
      : '';

  return {
    name: item.itemName ?? '',
    image_url: imageUrl,
    maker: item.shopName ?? '',
    item_url: item.itemUrl ?? '',
  };
}
