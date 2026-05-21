import { useState, useEffect } from 'react'
import {
  View, Text, FlatList,
  TouchableOpacity, StyleSheet
} from 'react-native'
import { supabase } from '../lib/supabase'
import useSettingsStore from '../store/settingsStore'
import { lightTheme, darkTheme } from '../lib/theme'
import { t } from '../lib/i18n'

export default function OrderHistoryScreen({ navigation }: any) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 5


  useEffect(() => {
    getOrders(0)
  }, [])

  async function getOrders(pageNum: number) {
    const { data: { user} } = await supabase.auth.getUser()
    if (!user) return
    const from = pageNum * PAGE_SIZE
    const to = from + PAGE_SIZE - 1

    const { data, error } = await supabase
      .from('orders')
      .select()
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) console.log(error)

    if (data) {
      if (pageNum === 0) {
        setOrders(data)
      } else {
        setOrders((prev) => [...prev, ...data])
      }
      setHasMore(data.length === PAGE_SIZE)
    }

    setLoading(false)
  }

  function loadMore() {
    const nextPage = page + 1
    setPage(nextPage)
    getOrders(nextPage)
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending': return '#D3968C'
      case 'confirmed': return '#0A3323'
      case 'delivered': return '#105666'
      case 'cancelled': return '#D3968C'
      default: return '#2E7D32'
    }
  }

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('orderHistoryLoading')}</Text>
      </View>
    )
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{t('orderHistoryNone')}</Text>
        <Text style={styles.emptySubText}>{t('orderHistoryPlaceFirstOrder')}</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('orderHistory')}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        ListFooterComponent={
          hasMore ? (
            <TouchableOpacity
              style={styles.loadMoreBtn}
              onPress={loadMore}
            >
              <Text style={styles.loadMoreText}>{t('orderHistoryLoadMore')}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.noMoreText}>{t('orderHistoryNoMore')}</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>{t('orderHistoryOrderNumber')} {item.id}</Text>
              <Text style={styles.date}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>

            {item.items.map((product: any, index: number) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemName}>
                  {product.name} x{product.quantity}
                </Text>
                <Text style={styles.itemPrice}>
                  ${(product.price * product.quantity).toFixed(2)}
                </Text>
              </View>
            ))}

            <View style={styles.cardFooter}>
              <Text style={styles.total}>{t('orderHistoryTotal')}: ${item.total.toFixed(2)}</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) }
              ]}>
                <Text style={styles.statusText}>{t(`orderStatus.${item.status}`)}</Text>
              </View>
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
    backgroundColor: '#000000',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F7F4D5',
  },
  emptySubText: {
    fontSize: 16,
    color: '#F7F4D5',
    marginTop: 8,
  },
  header: {
    marginBottom: 20,
  },
  backBtn: {
    fontSize: 16,
    color: '#0A3323',
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#F7F4D5',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2E7D32',
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#105666',
  },
  date: {
    fontSize: 13,
    color: '#2E7D32',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: '#105666',
  },
  itemPrice: {
    fontSize: 14,
    color: '#0A3323',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2E7D32',
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#105666',
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
  loadMoreBtn: {
    backgroundColor: '#0A3323',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  noMoreText: {
    textAlign: 'center',
    color: '#2E7D32',
    marginBottom: 20,
    fontSize: 14,
  },
})