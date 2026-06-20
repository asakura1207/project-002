import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🥤</Text>
        <Text variant="headlineMedium" style={styles.title}>
          のみものずかん
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          飲んだものをバーコードで記録しよう
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          mode="contained"
          icon="barcode-scan"
          contentStyle={styles.buttonContent}
          style={styles.button}
          onPress={() => navigation.navigate('BarcodeScanner')}
        >
          バーコードをスキャン
        </Button>

        <Button
          mode="outlined"
          icon="history"
          contentStyle={styles.buttonContent}
          style={[styles.button, styles.buttonOutline]}
          onPress={() => navigation.navigate('HistoryList')}
        >
          飲んだ履歴を見る
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    padding: 24,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 48,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
  },
  actions: {
    gap: 16,
  },
  button: {
    borderRadius: 12,
  },
  buttonOutline: {
    borderWidth: 2,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
