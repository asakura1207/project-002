import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Linking, Alert, PermissionsAndroid, Platform } from 'react-native';
import { Text, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
  useCameraPermission,
} from 'react-native-vision-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BarcodeScannerScreen() {
  const navigation = useNavigation<Nav>();
  const isFocused = useIsFocused();
  const { hasPermission, requestPermission } = useCameraPermission();
  const deviceFromHook = useCameraDevice('back');
  const [deviceFromPoll, setDeviceFromPoll] = useState<import('react-native-vision-camera').CameraDevice | undefined>();
  const device = deviceFromHook ?? deviceFromPoll;
  const isScanning = useRef(false);
  const [isActive, setIsActive] = useState(true);
  const [permissionResolved, setPermissionResolved] = useState(false);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [deviceTimeout, setDeviceTimeout] = useState(false);

  useEffect(() => {
    const setup = async () => {
      // フックの初期値は不正確なことがあるため、OSに直接確認する
      const alreadyGranted =
        Platform.OS === 'android'
          ? await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA)
          : hasPermission;

      if (alreadyGranted) {
        setPermissionResolved(true);
        return;
      }

      const granted = await requestPermission();
      if (granted) {
        // 新規付与 → VisionCameraを再初期化するため画面を作り直す
        navigation.replace('BarcodeScanner');
      } else {
        setPermissionResolved(true);
      }
    };
    setup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // パーミッション取得後、デバイスが見つかるまで0.5秒ごとにポーリング
  useEffect(() => {
    if (!hasPermission || device) return;
    let stopped = false;
    let attempts = 0;

    const poll = () => {
      if (stopped) return;
      const devices = Camera.getAvailableCameraDevices();
      const back = devices.find((d) => d.position === 'back');
      if (back) {
        setDeviceFromPoll(back);
      } else if (attempts < 20) {
        attempts++;
        setTimeout(poll, 500);
      } else {
        setDeviceTimeout(true);
      }
    };

    poll();
    return () => { stopped = true; };
  }, [hasPermission, device]);

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

  const pickImageAndScan = async () => {
    setIsPickingImage(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        const scanned = await BarCodeScanner.scanFromURLAsync(uri, [
          BarCodeScanner.Constants.BarCodeType.ean13,
          BarCodeScanner.Constants.BarCodeType.ean8,
        ]);

        if (scanned.length > 0) {
          navigation.navigate('SearchResult', { janCode: scanned[0].data });
        } else {
          Alert.alert('読み取り失敗', '画像からバーコードを検出できませんでした。');
        }
      }
    } catch {
      Alert.alert('エラー', '画像の読み込みに失敗しました。');
    } finally {
      setIsPickingImage(false);
    }
  };

  if (!permissionResolved) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.message}>カメラの権限を確認中...</Text>
      </View>
    );
  }

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
        <Button mode="text" onPress={() => navigation.goBack()} style={{ marginTop: 8 }}>
          戻る
        </Button>
      </View>
    );
  }

  if (!device) {
    if (!deviceTimeout) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.message}>カメラを起動中...</Text>
        </View>
      );
    }
    return (
      <View style={styles.center}>
        <Text style={styles.message}>カメラが見つかりませんでした。</Text>
        <Button mode="text" onPress={() => navigation.goBack()} style={{ marginTop: 8 }}>
          戻る
        </Button>
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
          <IconButton
            icon="image"
            iconColor="#fff"
            size={32}
            style={styles.galleryButton}
            onPress={pickImageAndScan}
            disabled={isPickingImage}
          />
          <Text style={styles.galleryLabel}>写真から読み取る</Text>
        </View>
      </View>

      {isPickingImage && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>スキャン中...</Text>
        </View>
      )}
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
    paddingTop: 16,
  },
  hint: {
    color: '#fff',
    fontSize: 14,
  },
  galleryButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  galleryLabel: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
});
