import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator, Divider } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, RakutenProduct } from '../types';
import { searchByJanCode } from '../lib/api';
import { saveDrink } from '../lib/db';
import StarRating from '../components/StarRating';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SearchResult'>;
type Route = RouteProp<RootStackParamList, 'SearchResult'>;

type Status = 'loading' | 'found' | 'not_found' | 'error';

export default function SearchResultScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { janCode } = params;

  const [status, setStatus] = useState<Status>('loading');
  const [product, setProduct] = useState<RakutenProduct | null>(null);
  const [name, setName] = useState('');
  const [maker, setMaker] = useState('');
  const [rating, setRating] = useState(3);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      setStatus('loading');
      const result = await searchByJanCode(janCode);
      if (result) {
        setProduct(result);
        setName(result.name);
        setMaker(result.maker);
        setStatus('found');
      } else {
        setStatus('not_found');
      }
    } catch {
      setStatus('error');
    }
  }, [janCode]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('エラー', '商品名を入力してください。');
      return;
    }

    setSaving(true);
    try {
      await saveDrink({
        jan_code: janCode,
        name: name.trim(),
        image_url: product?.image_url ?? '',
        maker: maker.trim(),
        rating,
        memo: memo.trim(),
        created_at: new Date().toISOString(),
      });
      // スタックをリセットして「戻る」でスキャン画面に戻らないようにする
      navigation.reset({
        index: 1,
        routes: [{ name: 'Home' }, { name: 'HistoryList' }],
      });
    } catch (e) {
      Alert.alert('エラー', '保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>商品情報を検索中...</Text>
        <Text variant="bodySmall" style={styles.janCode}>
          JANコード: {janCode}
        </Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>⚠️</Text>
        <Text variant="titleMedium" style={styles.errorText}>
          商品の取得に失敗しました
        </Text>
        <Text variant="bodySmall" style={{ color: '#666', marginTop: 8 }}>
          ネットワーク接続を確認してください。
        </Text>
        <Button mode="contained" onPress={fetchProduct} style={{ marginTop: 24 }}>
          再試行
        </Button>
        <Button mode="text" onPress={() => navigation.goBack()} style={{ marginTop: 8 }}>
          戻る
        </Button>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* 商品情報カード */}
        <Card style={styles.card} elevation={2}>
          {status === 'found' && product?.image_url ? (
            <Image
              source={{ uri: product.image_url }}
              style={styles.productImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageEmoji}>🥤</Text>
            </View>
          )}
          <Card.Content>
            {status === 'not_found' && (
              <Text variant="bodySmall" style={styles.notFoundBadge}>
                商品が見つかりませんでした。手動で入力してください。
              </Text>
            )}
            <Text variant="labelSmall" style={styles.janLabel}>
              JANコード: {janCode}
            </Text>
          </Card.Content>
        </Card>

        {/* 入力フォーム */}
        <View style={styles.form}>
          <TextInput
            label="商品名"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="メーカー"
            value={maker}
            onChangeText={setMaker}
            mode="outlined"
            style={styles.input}
          />

          <Divider style={styles.divider} />

          <Text variant="labelLarge" style={styles.label}>
            評価
          </Text>
          <StarRating rating={rating} onRate={setRating} size={36} />

          <Divider style={styles.divider} />

          <TextInput
            label="メモ（任意）"
            value={memo}
            onChangeText={setMemo}
            mode="outlined"
            multiline
            numberOfLines={3}
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            記録する
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            style={{ marginTop: 4 }}
          >
            スキャンし直す
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF8F0',
  },
  loadingText: {
    marginTop: 16,
    color: '#555',
  },
  janCode: {
    marginTop: 8,
    color: '#999',
  },
  emoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 12,
  },
  errorText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    marginBottom: 16,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
  },
  noImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageEmoji: {
    fontSize: 72,
  },
  notFoundBadge: {
    color: '#E65100',
    marginTop: 8,
    backgroundColor: '#FFF3E0',
    padding: 8,
    borderRadius: 4,
  },
  janLabel: {
    color: '#999',
    marginTop: 8,
  },
  form: {
    gap: 4,
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  label: {
    color: '#555',
    marginBottom: 8,
  },
  divider: {
    marginVertical: 12,
  },
  saveButton: {
    borderRadius: 10,
    marginTop: 16,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
});
