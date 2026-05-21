import { useState } from 'react'
import {
  View, Text, StyleSheet, Alert, TouchableOpacity
} from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { supabase } from '../lib/supabase'
import useCartStore from '../store/cartStore'
import useSettingsStore from '../store/settingsStore'
import { lightTheme, darkTheme } from '../lib/theme'
import { t } from '../lib/i18n'

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const addToCart = useCartStore((state) => state.addToCart)
  const theme = useSettingsStore((state) => state.theme)
  const colors = theme === 'dark' ? darkTheme : lightTheme

  if (!permission) {
    return <View />
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.primary }]}>
          {t('scan.needCameraPermission')}
        </Text>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={requestPermission}
        >
          <Text style={[styles.buttonText, { color: colors.white }]}>
            {t('scan.grantPermission')}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned) return
    setScanned(true)

    const { data: products, error } = await supabase
      .from('products')
      .select()
      .eq('barcode', data)

    if (error) {
      Alert.alert(t('scan.error'), error.message)
      return
    }

    if (products && products.length > 0) {
      setProduct(products[0])
    } else {
      Alert.alert(
        t('scan.notFound'),
        t('scan.noProductFound'),
        [{ text: t('scan.ok'), onPress: () => setScanned(false) }]
      )
    }
  }

  if (product) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('scan.productFound')}</Text>
        <View style={styles.card}>
          <Text style={styles.name}>{product.name}</Text>
          <Text style={styles.category}>{product.category}</Text>
          <Text style={styles.price}>${product.price}</Text>
          <Text style={styles.description}>{product.description}</Text>
          <Text style={styles.stock}>
            {product.stock === 0 ? t('outOfStock') : `${t('inStock')}: ${product.stock}`}
          </Text>

          <TouchableOpacity
            style={[
              styles.addToCartBtn,
              product.stock === 0 && styles.addToCartBtnDisabled
            ]}
            onPress={() => addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.image_url,
              quantity: 1,
            })}
            disabled={product.stock === 0}
          >
            <Text style={styles.addToCartText}>
              {product.stock === 0 ? t('outOfStock') : t('addToCart')}
            </Text>
          </TouchableOpacity>

        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setScanned(false)
            setProduct(null)
          }}
        >
          <Text style={styles.buttonText}>{t('scan.scanAgain')}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.primary }]}>
        {t('scan.scanAPrompt')}
      </Text>
      <CameraView
        style={[styles.camera, { backgroundColor: colors.camera }]}
        facing="back"
        onBarcodeScanned={handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'upc_a'],
        }}
      />
      {scanned && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => setScanned(false)}
        >
          <Text style={styles.buttonText}>{t('scan.tapToScanAgain')}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  camera: {
    width: '100%',
    height: 350,
    borderRadius: 12,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    marginBottom: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    marginBottom: 4,
  },
  stock: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addToCartBtn: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addToCartBtnDisabled: {
    backgroundColor: '#ccc',
  },
  addToCartText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
})