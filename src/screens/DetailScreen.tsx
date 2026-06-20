import React, { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Image, Alert } from 'react-native';
import { Text, Button, Divider, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, DrinkRecord } from '../types';
import { getDrinkById, deleteDrink } from '../lib/db';
import StarRating from '../components/StarRating';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Detail'>;
type Route = RouteProp<RootStackParamList, 'Detail'>;

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="labelSmall" style={styles.infoLabel}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={styles.infoValue}>
        {value || '—'}
      </Text>
    </View>
  );
}

export default function DetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { drinkId } = params;
  const [drink, setDrink] = useState<DrinkRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const record = await getDrinkById(drinkId);
          if (active) setDrink(record);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [drinkId])
  );

  const handleDelete = () => {
    Alert.alert('削除確認', 'この記録を削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          await deleteDrink(drinkId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!drink) {
    return (
      <View style={styles.center}>
        <Text variant="titleMedium">記録が見つかりませんでした。</Text>
        <Button onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          戻る
        </Button>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* 商品画像 */}
      {drink.image_url ? (
        <Image
          source={{ uri: drink.image_url }}
          style={styles.image}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderEmoji}>🥤</Text>
        </View>
      )}

      {/* 商品情報 */}
      <View style={styles.section}>
        <Text variant="headlineSmall" style={styles.productName}>
          {drink.name}
        </Text>

        <Divider style={styles.divider} />

        <InfoRow label="メーカー" value={drink.maker} />
        <InfoRow label="JANコード" value={drink.jan_code} />
        <InfoRow label="飲んだ日時" value={formatDate(drink.created_at)} />

        <Divider style={styles.divider} />

        <Text variant="labelSmall" style={styles.infoLabel}>
          評価
        </Text>
        <View style={styles.ratingRow}>
          <StarRating rating={drink.rating ?? 0} readonly size={32} />
          <Text variant="bodyMedium" style={styles.ratingText}>
            {drink.rating} / 5
          </Text>
        </View>

        {drink.memo ? (
          <>
            <Divider style={styles.divider} />
            <Text variant="labelSmall" style={styles.infoLabel}>
              メモ
            </Text>
            <Text variant="bodyMedium" style={styles.memo}>
              {drink.memo}
            </Text>
          </>
        ) : null}
      </View>

      {/* 削除ボタン */}
      <View style={styles.deleteSection}>
        <Button
          mode="outlined"
          textColor="#E53935"
          style={styles.deleteButton}
          onPress={handleDelete}
        >
          この記録を削除する
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  scroll: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF8F0',
  },
  image: {
    width: '100%',
    height: 240,
    backgroundColor: '#F5F5F5',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderEmoji: {
    fontSize: 80,
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  productName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  divider: {
    marginVertical: 12,
  },
  infoRow: {
    marginBottom: 10,
  },
  infoLabel: {
    color: '#999',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  ratingText: {
    color: '#666',
  },
  memo: {
    color: '#444',
    lineHeight: 22,
    marginTop: 4,
  },
  deleteSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  deleteButton: {
    borderColor: '#E53935',
    borderRadius: 8,
  },
});
