import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Image } from 'expo-image'
import { supabase } from '../lib/supabase'
import useCartStore from '../store/cartStore'
import useSettingsStore from '../store/settingsStore'
import { formatPrice } from '../lib/currency'
import { t } from '../lib/i18n'
import { lightTheme, darkTheme } from '../lib/theme'

export default function WishlistScreen() {
  const [wishlist, setWishlist] = useState<any[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const addToCart = useCartStore((state) => state.addToCart)
  const currency = useSettingsStore((state) => state.currency)
  const theme = useSettingsStore((state) => state.theme)
  const colors = theme === 'dark' ? darkTheme : lightTheme

  useEffect(() => {
    getUserAndWishlist()
  }, [])

  async function getUserAndWishlist() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      getWishlist(user.id)
    }
  }

  async function getWishlist(uid: string) {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*, products(*)')
      .eq('user_id', uid)
    if (error) console.log(error)
    setWishlist(data ?? [])
  }

  async function removeFromWishlist(wishlistId: number) {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', wishlistId)
    if (error) {
      Alert.alert('Error', error.message)
      return
    }
    if (userId) getWishlist(userId)
  }

  if (wishlist.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.primary }]}>{t('wishlist')}</Text>
        <Text style={[styles.emptySubText, { color: colors.subtext }]}>Add some teas you love!</Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.primary }]}>{t('wishlist')}</Text>
      </View>

      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image
              source={{ uri: item.products.image_url }}
              style={styles.image}
              contentFit="cover"
            />
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>{item.products.name}</Text>
              <Text style={[styles.category, { color: colors.primary }]}>{item.products.category}</Text>
              <Text style={[styles.price, { color: colors.price }]}>{formatPrice(item.products.price)}</Text>

              <TouchableOpacity
                style={[styles.addToCartBtn, { backgroundColor: colors.success }]}
                onPress={() => addToCart({
                  id: item.products.id,
                  name: item.products.name,
                  price: item.products.price,
                  image_url: item.products.image_url,
                  quantity: 1,
                })}
              >
                <Text style={[styles.addToCartText, { color: colors.white }]}>{t('addToCart')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => removeFromWishlist(item.id)}
              >
                <Text style={[styles.removeBtnText, { color: colors.error }]}>
                  {t('remove')}
                </Text>
              </TouchableOpacity>
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 16,
    marginTop: 8,
  },
  header: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: {
    width: 100,
    height: 100,
  },
  info: {
    flex: 1,
    padding: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 13,
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  addToCartBtn: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addToCartText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  removeBtn: {
    marginTop: 6,
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
})