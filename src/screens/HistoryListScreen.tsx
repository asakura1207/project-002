import React, { useCallback, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, FAB, ActivityIndicator, Divider } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, DrinkRecord } from '../types';
import { getDrinks, deleteDrink } from '../lib/db';

type Nav = NativeStackNavigationProp<RootStackParamList, 'HistoryList'>;

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <Text style={styles.stars}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </Text>
  );
}

function DrinkItem({
  item,
  onPress,
  onDelete,
}: {
  item: DrinkRecord;
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} onLongPress={onDelete} activeOpacity={0.7}>
      <View style={styles.item}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Text style={styles.thumbnailEmoji}>🥤</Text>
          </View>
        )}
        <View style={styles.itemInfo}>
          <Text variant="bodyMedium" style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.maker ? (
            <Text variant="bodySmall" style={styles.itemMaker} numberOfLines={1}>
              {item.maker}
            </Text>
          ) : null}
          <StarDisplay rating={item.rating ?? 0} />
          <Text variant="bodySmall" style={styles.itemDate}>
            {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
      <Divider />
    </TouchableOpacity>
  );
}

export default function HistoryListScreen() {
  const navigation = useNavigation<Nav>();
  const [drinks, setDrinks] = useState<DrinkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const records = await getDrinks();
          if (active) setDrinks(records);
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [])
  );

  const handleDelete = (item: DrinkRecord) => {
    Alert.alert(
      '削除確認',
      `「${item.name}」の記録を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await deleteDrink(item.id!);
            setDrinks((prev) => prev.filter((d) => d.id !== item.id));
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (drinks.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyEmoji}>📋</Text>
        <Text variant="titleMedium" style={styles.emptyTitle}>
          まだ記録がありません
        </Text>
        <Text variant="bodyMedium" style={styles.emptyDesc}>
          バーコードをスキャンしてジュースを記録しましょう！
        </Text>
        <FAB
          icon="barcode-scan"
          label="スキャンする"
          style={styles.emptyFab}
          onPress={() => navigation.navigate('BarcodeScanner')}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={drinks}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <DrinkItem
            item={item}
            onPress={() => navigation.navigate('Detail', { drinkId: item.id! })}
            onDelete={() => handleDelete(item)}
          />
        )}
        ListHeaderComponent={
          <Text variant="bodySmall" style={styles.hint}>
            長押しで削除できます
          </Text>
        }
        contentContainerStyle={styles.list}
      />
      <FAB
        icon="barcode-scan"
        style={styles.fab}
        onPress={() => navigation.navigate('BarcodeScanner')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF8F0',
  },
  list: {
    paddingBottom: 100,
  },
  hint: {
    color: '#aaa',
    textAlign: 'center',
    paddingVertical: 8,
  },
  item: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailEmoji: {
    fontSize: 36,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
    gap: 2,
  },
  itemName: {
    fontWeight: '600',
    color: '#333',
  },
  itemMaker: {
    color: '#888',
  },
  stars: {
    color: '#FFB800',
    fontSize: 13,
  },
  itemDate: {
    color: '#aaa',
    fontSize: 11,
  },
  emptyEmoji: {
    fontSize: 72,
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDesc: {
    color: '#888',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emptyFab: {
    backgroundColor: '#FF6B35',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#FF6B35',
  },
});
