// Cart page for the shop app
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import * as Haptics from 'expo-haptics'
import { formatPrice } from '../lib/currency'
import { t } from '../lib/i18n'
import { lightTheme, darkTheme } from '../lib/theme'
import useCartStore from '../store/cartStore'
import useSettingsStore from '../store/settingsStore'

export default function CartScreen({ navigation }: any) {
  const { items, removeFromCart, increaseQuantity, decreaseQuantity, getTotalPrice, clearCart } = useCartStore()
  const currency = useSettingsStore((state) => state.currency)
  const theme = useSettingsStore((state) => state.theme)
  const colors = theme === 'dark' ? darkTheme : lightTheme
  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.primary }]}>
          Your cart is empty
        </Text>
        <Text style={[styles.emptySubText, { color: colors.subtext }]}>
          Go add some teas!
        </Text>
      </View>
    )
  }
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.primary }]}>
          {t('cart')}
        </Text>
        <TouchableOpacity 
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            clearCart()
          }}
        >
          <Text style={[styles.clearText, { color: colors.error }]}> 
            {t('clearAll')}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.image}
              contentFit="cover"
            />
            
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>
                {item.name}
              </Text>
              
              <Text style={[styles.price, { color: colors.price }]}>
                {formatPrice(item.price)}
              </Text>

              <View style={styles.quantityRow}>
                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: colors.success }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    decreaseQuantity(item.id)
                  }}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>

                <Text style={[styles.qtyText, { color: colors.text }]}>
                  {item.quantity}
                </Text>

                <TouchableOpacity
                  style={[styles.qtyBtn, { backgroundColor: colors.success }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    increaseQuantity(item.id)
                  }}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                    removeFromCart(item.id)
                  }}
                >
                  <Text style={[styles.removeBtnText, { color: colors.error }]}> 
                    {t('remove')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.subtotal, { color: colors.subtext }]}>
                {t('subtotal')}: {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.footer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.total, { color: colors.primary }]}>
          {t('total')}: {formatPrice(getTotalPrice())}
        </Text>
        <TouchableOpacity
          style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            navigation.navigate('Checkout')
          }}
        >
          <Text style={styles.checkoutText}>
            {t('proceedToCheckout')}
          </Text>
        </TouchableOpacity>
      </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
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
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  qtyBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  removeBtn: {
    marginLeft: 8,
  },
  removeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  subtotal: {
    fontSize: 13,
    marginTop: 4,
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  checkoutBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
  },
})