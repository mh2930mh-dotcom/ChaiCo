// Main products page
import { useState, useEffect } from 'react'
import { StyleSheet, View, FlatList, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import * as Battery from 'expo-battery'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../lib/supabase'
import { formatPrice } from '../lib/currency'
import { t } from '../lib/i18n'
import { lightTheme, darkTheme } from '../lib/theme'
import { Ionicons } from '@expo/vector-icons'
import useCartStore from '../store/cartStore'
import useSettingsStore from '../store/settingsStore'
const categories = ['All', 'Green Tea', 'Black Tea', 'Herbal Tea']

export default function HomeScreen({ role }: { role?: string | null }) {
  const [products, setProducts] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [wishlistedIds, setWishlistedIds] = useState<number[]>([])
  const [isLowBattery, setIsLowBattery] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const addToCart = useCartStore((state) => state.addToCart)
  const currency = useSettingsStore((state) => state.currency)
  const theme = useSettingsStore((state) => state.theme)
  const colors = theme === 'dark' ? darkTheme : lightTheme

    useEffect(() => {
    getProducts('All')
    loadWishlistedIds()
    checkBattery()
    const batterySub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      const low = batteryLevel <= 0.2
      setIsLowBattery(low)
    })
    let channel: any = null

    Battery.getBatteryLevelAsync().then((level) => {
      if (level > 0.2) {
        channel = supabase
          .channel(`products-changes-${Date.now()}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'products' },
            (payload) => {
              getProducts(selectedCategory)
            }
          )
          .subscribe()
      } else {
      }
    })
    return () => {
      batterySub.remove()
      if (channel) channel.unsubscribe()
    }
  }, [])

    async function checkBattery() {
    const level = await Battery.getBatteryLevelAsync()
    setIsLowBattery(level <= 0.2)
  }

    async function getProducts(category: string = 'All') {
    try {
      let query = supabase.from('products').select()
      if (category !== 'All') {
        query = query.eq('category', category)
      }
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network timeout')), 5000)
      )
      const { data, error } = await Promise.race([query, timeout]) as any

      if (error) throw error

      if (data) {
        setProducts(data)
        setIsOffline(false)
        await AsyncStorage.setItem(
          `products_cache_${category}`,
          JSON.stringify(data)
        )
      }
    } catch (err) {
      try {
        const cached = await AsyncStorage.getItem(`products_cache_${category}`)
        if (cached) {
          setProducts(JSON.parse(cached))
          setIsOffline(true)
        }
      } catch (cacheErr) {
      }
    }
  }

    async function loadWishlistedIds() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('wishlist')
        .select('product_id')
        .eq('user_id', user.id)

      if (data) {
        setWishlistedIds(data.map((w) => w.product_id))
      }
    } catch (err) {
    }
  }

    async function addToWishlist(productId: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (wishlistedIds.includes(productId)) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId)
        setWishlistedIds(wishlistedIds.filter((id) => id !== productId))
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert({ user_id: user.id, product_id: productId })
        if (!error) {
          setWishlistedIds([...wishlistedIds, productId])
        }
      }
    } catch (err) {
    }
  }

    async function deleteProduct(productId: number) {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId)
              
              if (error) {
                Alert.alert('Error', error.message)
              } else {
                getProducts(selectedCategory)
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to delete product')
            }
          }
        }
      ]
    )
  }
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.welcome, { color: colors.primary }]}>
          {role === 'vendor' ? 'Vendor Dashboard' : t('welcome')}
        </Text>
        {isLowBattery && (
          <Text style={[styles.batteryWarning, { color: colors.error }]}> 
            🔋 Low Battery — Sync Paused
          </Text>
        )}
      </View>

      {isOffline && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.filterBtn, borderColor: colors.border }]}> 
          <Text style={[styles.offlineBannerText, { color: colors.text }]}> 
            📦 Viewing cached products — No internet
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 8 }}
        style={{ marginBottom: 16, flexGrow: 0 }}
      >
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => {
              setSelectedCategory(cat)
              getProducts(cat)
            }}
            style={[
              styles.filterBtn,
              { backgroundColor: colors.filterBtn, borderColor: colors.border },
              selectedCategory === cat && { backgroundColor: colors.success, borderColor: colors.success }
            ]}
          >
            <Text style={[
              styles.filterText,
              { color: colors.text },
              selectedCategory === cat && { color: colors.black, fontWeight: '700' }
            ]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.image}
              contentFit="cover"
            />

            {role !== 'vendor' && (
              <TouchableOpacity
                style={styles.heartBtn}
                onPress={() => addToWishlist(item.id)}
              >
                <Ionicons
                  name={wishlistedIds.includes(item.id) ? 'heart' : 'heart-outline'}
                  size={24}
                  color={wishlistedIds.includes(item.id) ? '#FF0000' : '#FFFFFF'}
                />
              </TouchableOpacity>
            )}

            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>
                {item.name}
              </Text>
              
              <Text style={[styles.category, { color: colors.text }]}> 
                {item.category}
              </Text>
              
              <Text style={[styles.price, { color: colors.price }]}> 
                {formatPrice(item.price)}
              </Text>
              
              <Text style={[styles.description, { color: colors.subtext }]}>
                {item.description}
              </Text>
              <Text style={[
                styles.stock,
                item.stock === 0 ? { color: colors.error } : { color: colors.success }
              ]}>
                {item.stock === 0
                  ? t('outOfStock') + ' ❌'
                  : `${t('inStock')}: ${item.stock} ✅`
                }
              </Text>

              {role === 'vendor' ? (
                <View style={styles.vendorButtons}>
                  <TouchableOpacity
                    style={[styles.editBtn, { backgroundColor: colors.primary }]}
                    onPress={() => Alert.alert('Edit', `Edit ${item.name} - coming soon!`)}
                  >
                    <Text style={styles.editBtnText}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteBtn, { backgroundColor: colors.error }]}
                    onPress={() => deleteProduct(item.id)}
                  >
                    <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.addToCartBtn,
                    { backgroundColor: item.stock === 0 ? colors.border : colors.success }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    addToCart({
                      id: item.id,
                      name: item.name,
                      price: item.price,
                      image_url: item.image_url,
                      quantity: 1,
                    })
                  }}
                  disabled={item.stock === 0}
                >
                  <Text style={styles.addToCartText}>
                    {item.stock === 0 ? t('outOfStock') : t('addToCart')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      />
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  header: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  batteryWarning: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  offlineBanner: {
    padding: 10,
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  offlineBannerText: {
    fontWeight: '600',
    fontSize: 13,
  },
  card: {
    borderRadius: 14,
    marginBottom: 18,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: 180,
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    fontSize: 18,
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 13,
    marginTop: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
  },
  description: {
    fontSize: 13,
    marginTop: 4,
  },
  stock: {
    fontSize: 13,
    color: '#038956',
    marginTop: 4,
    fontWeight: '600',
  },
  outOfStock: {
    color: '#D3968C',
  },
  addToCartBtn: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addToCartBtnDisabled: {
    opacity: 0.7,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  vendorButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  editBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  editBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    height: 36,
  },
  filterBtnActive: {
    backgroundColor: '#0A3323',
    borderColor: '#0A3323',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#f7efef',
  },
})