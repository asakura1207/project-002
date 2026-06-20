import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, MD3LightTheme, Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { initDB } from './src/lib/db';
import { RootStackParamList } from './src/types';

import HomeScreen from './src/screens/HomeScreen';
import BarcodeScannerScreen from './src/screens/BarcodeScannerScreen';
import SearchResultScreen from './src/screens/SearchResultScreen';
import HistoryListScreen from './src/screens/HistoryListScreen';
import DetailScreen from './src/screens/DetailScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#FF6B35',
    secondary: '#FF8C42',
    background: '#FFF8F0',
    surface: '#FFFFFF',
  },
};

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    initDB()
      .then(() => setDbReady(true))
      .catch(() => setDbError(true));
  }, []);

  if (dbError) {
    return (
      <View style={styles.center}>
        <Text>データベースの初期化に失敗しました。アプリを再起動してください。</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider
        theme={theme}
        settings={{
          // Expo 環境で react-native-paper のアイコンを確実に描画する
          icon: (props) => (
            <MaterialCommunityIcons
              name={props.name as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
              size={props.size}
              color={props.color}
            />
          ),
        }}
      >
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#FF6B35' },
              headerTintColor: '#fff',
              headerTitleStyle: { fontWeight: 'bold' },
              contentStyle: { backgroundColor: '#FFF8F0' },
            }}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: 'のみものずかん', headerShown: false }}
            />
            <Stack.Screen
              name="BarcodeScanner"
              component={BarcodeScannerScreen}
              options={{ title: 'バーコードをスキャン' }}
            />
            <Stack.Screen
              name="SearchResult"
              component={SearchResultScreen}
              options={{ title: '商品情報の確認' }}
            />
            <Stack.Screen
              name="HistoryList"
              component={HistoryListScreen}
              options={{ title: '飲んだ履歴' }}
            />
            <Stack.Screen
              name="Detail"
              component={DetailScreen}
              options={{ title: '詳細' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
  },
});
