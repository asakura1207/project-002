export interface DrinkRecord {
  id?: number;
  jan_code: string;
  name: string;
  image_url: string;
  maker: string;
  rating: number;
  memo: string;
  created_at: string;
}

export interface RakutenProduct {
  name: string;
  image_url: string;
  maker: string;
  item_url: string;
}

export type RootStackParamList = {
  Home: undefined;
  BarcodeScanner: undefined;
  SearchResult: { janCode: string };
  HistoryList: undefined;
  Detail: { drinkId: number };
};
