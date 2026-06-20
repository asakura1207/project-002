import { RakutenProduct } from '../types';

const ENDPOINT = 'https://world.openfoodfacts.org/api/v0/product';

export async function searchByJanCode(janCode: string): Promise<RakutenProduct | null> {
  const response = await fetch(`${ENDPOINT}/${janCode}.json`, {
    headers: {
      'User-Agent': 'NominomotoZukan/1.0 (asakura104783@gmail.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status === 0 || !data.product) {
    return null;
  }

  const p = data.product;
  const name = p.product_name_ja || p.product_name || '';
  const imageUrl = p.image_front_url || p.image_url || '';
  const maker = p.brands || '';

  if (!name) {
    return null;
  }

  return {
    name,
    image_url: imageUrl,
    maker,
    item_url: '',
  };
}
