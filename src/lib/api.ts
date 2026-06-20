import { RakutenProduct } from '../types';

const APP_ID = 'f6dfd0c0-0ab3-480a-aaa9-bf79c575b7e0';
const ACCESS_KEY = 'pk_mSxJSmd8GaYbtlTWy3S08qFpLtcxZn698GKn6w4Z1Ks';
const ENDPOINT = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260401';

export async function searchByJanCode(janCode: string): Promise<RakutenProduct | null> {
  const params = new URLSearchParams({
    applicationId: APP_ID,
    accessKey: ACCESS_KEY,
    keyword: janCode,
    hits: '1',
    format: 'json',
  });

  const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
    headers: {
      accessKey: ACCESS_KEY,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error(`API error: ${response.status}`, body);
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
