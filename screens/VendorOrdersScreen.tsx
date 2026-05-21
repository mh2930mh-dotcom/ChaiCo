// Vendor orders page
import { useState, useEffect } from 'react'
import {
  View, Text, FlatList,
  TouchableOpacity, StyleSheet, Alert
} from 'react-native'
import { supabase } from '../lib/supabase'
import useSettingsStore from '../store/settingsStore'
import { lightTheme, darkTheme } from '../lib/theme'
import { formatPrice } from '../lib/currency'
import { t } from '../lib/i18n'

export default function VendorOrdersScreen() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const theme = useSettingsStore((state) => state.theme)
  const colors = theme === 'dark' ? darkTheme : lightTheme

  useEffect(() => {
    getOrders()
    const channel = supabase
      .channel(`orders-changes-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => getOrders()
      )
      .subscribe()

    return () => { void channel.unsubscribe() }
  }, [])

  async function getOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select()
      .order('created_at', { ascending: false })

    if (error) console.log(error)
    setOrders(data ?? [])
    setLoading(false)
  }

  async function updateStatus(orderId: number, status: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    getOrders()
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return '#D3968C'
      case 'confirmed': return '#0A3323'
      case 'delivered': return '#105666'
      case 'cancelled': return '#D3968C'
      default: return '#839958'
    }
  }

  if (loading) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.primary }]}>{t('vendorOrders.loading')}</Text>
      </View>
    )
  }

  if (orders.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.primary }]}>{t('vendorOrders.none')}</Text>
        <Text style={[styles.emptySubText, { color: colors.subtext }]}>
          {t('vendorOrders.willAppearHere')}
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.primary }]}>{t('vendorOrders.title')}</Text>
        <Text style={[styles.count, { color: colors.subtext }]}>
          {orders.length} {t('vendorOrders.count')}
        </Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

            <View style={styles.cardHeader}>
              <Text style={[styles.orderId, { color: colors.text }]}>
                {t('vendorOrders.orderNumber')} {item.id}
              </Text>
              <Text style={[styles.date, { color: colors.subtext }]}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>

            {item.items.map((product: any, index: number) => (
              <View key={index} style={styles.itemRow}>
                <Text style={[styles.itemName, { color: colors.text }]}>
                  {product.name} x{product.quantity}
                </Text>
                <Text style={[styles.itemPrice, { color: colors.primary }]}>
                  {formatPrice(product.price * product.quantity)}
                </Text>
              </View>
            ))}

            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.total, { color: colors.text }]}>
                {t('vendorOrders.total')}: {formatPrice(item.total)}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{t(`vendorOrderStatus.${item.status}`)}</Text>
              </View>
            </View>

            <View style={styles.statusButtons}>
              {item.status === 'pending' && (
                <>
                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: getStatusColor('confirmed') }]}
                    onPress={() => updateStatus(item.id, 'confirmed')}
                  >
                    <Text style={styles.statusBtnText}>{t('vendorOrders.confirm')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statusBtn, { backgroundColor: getStatusColor('cancelled') }]}
                    onPress={() => updateStatus(item.id, 'cancelled')}
                  >
                    <Text style={styles.statusBtnText}>{t('vendorOrders.cancel')}</Text>
                  </TouchableOpacity>
                </>
              )}
              {item.status === 'confirmed' && (
                <TouchableOpacity
                  style={[styles.statusBtn, { backgroundColor: getStatusColor('delivered') }]}
                  onPress={() => updateStatus(item.id, 'delivered')}
                >
                  <Text style={styles.statusBtnText}>{t('vendorOrders.markDelivered')}</Text>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  count: {
    fontSize: 14,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 13,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusButtons: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statusBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statusBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
})