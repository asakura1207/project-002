import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Linking } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'BarcodeScanner'>;

export default function BarcodeScannerScreen() {
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const isScanning = useRef(false);
  const [isActive, setIsActive] = useState(true);
  // requestPermission が完了したかを追跡（未決定 vs 拒否を区別するため）
  const [permissionResolved, setPermissionResolved] = useState(false);

  useEffect(() => {
    requestPermission().then(() => setPermissionResolved(true));
    // マウント時に一度だけ呼ぶ。依存配列を空にして再呼び出しを防ぐ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 画面を離れたときスキャンを止め、戻ってきたときロックを解除
  useEffect(() => {
    setIsActive(isFocused);
    if (isFocused) {
      isScanning.current = false;
    }
  }, [isFocused]);

  const codeScanner = useCodeScanner({
    codeTypes: ['ean-13', 'ean-8'],
    onCodeScanned: useCallback(
      (codes) => {
        if (isScanning.current || !isFocused) return;
        const value = codes[0]?.value;
        if (!value) return;

        isScanning.current = true;
        setIsActive(false);
        navigation.navigate('SearchResult', { janCode: value });
      },
      [navigation, isFocused]
    ),
  });

  // 権限ダイアログ表示中 or 初回確認中
  if (!permissionResolved) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>カメラの権限を確認中...</Text>
      </View>
    );
  }

  // 権限が拒否された場合のフォールバック UI
  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>📷</Text>
        <Text variant="titleMedium" style={styles.message}>
          カメラへのアクセスが必要です
        </Text>
        <Text variant="bodyMedium" style={styles.description}>
          バーコードを読み取るためにカメラを許可してください。
        </Text>
        <Button
          mode="contained"
          style={styles.settingsButton}
          onPress={() => Linking.openSettings()}
        >
          設定からカメラを許可する
        </Button>
        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 8 }}
        >
          戻る
        </Button>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>カメラが見つかりませんでした。</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive && isFocused}
        codeScanner={codeScanner}
      />

      {/* スキャンガイドオーバーレイ */}
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.middleRow}>
          <View style={styles.overlaySide} />
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom}>
          <Text style={styles.hint}>バーコードを枠内に合わせてください</Text>
        </View>
      </View>
    </View>
  );
}

const SCAN_SIZE = 260;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;
const CORNER_COLOR = '#FF6B35';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFF8F0',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    marginTop: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  description: {
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  settingsButton: {
    marginTop: 24,
    borderRadius: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  middleRow: {
    flexDirection: 'row',
    height: SCAN_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  scanArea: {
    width: SCAN_SIZE,
    height: SCAN_SIZE,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    paddingTop: 24,
  },
  hint: {
    color: '#fff',
    fontSize: 14,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
});
