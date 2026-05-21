// Checkout page and receipt generation
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native'
import { supabase } from '../lib/supabase'
import useCartStore from '../store/cartStore'
import useSettingsStore from '../store/settingsStore'
import * as Haptics from 'expo-haptics'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { formatPrice } from '../lib/currency'
import { t } from '../lib/i18n'
import { lightTheme, darkTheme } from '../lib/theme'
import { sendLocalNotification } from '../lib/notifications'

export default function CheckoutScreen({ navigation }: any) {
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const { items, getTotalPrice, clearCart } = useCartStore()
  const currency = useSettingsStore((state) => state.currency)
  const theme = useSettingsStore((state) => state.theme)
  const colors = theme === 'dark' ? darkTheme : lightTheme

  async function generateReceipt(orderItems: any[], total: number) {
    const itemsHtml = orderItems.map((item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${formatPrice(item.price)}</td>
        <td>${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `).join('')

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 20px; }
            h1 { color: #0A3323; text-align: center; }
            h3 { color: #0A3323; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #0A3323; color: white; padding: 10px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #839958; }
            .total { font-size: 18px; font-weight: bold; text-align: right; margin-top: 20px; color: #0A3323; }
            .footer { text-align: center; margin-top: 40px; color: #839958; font-size: 12px; }
            .info { margin-bottom: 20px; }
            .info p { margin: 4px 0; color: #666; }
          </style>
        </head>
        <body>
          <h1>ChaiCo</h1>
          <h3>Order Receipt</h3>
          <div class="info">
            <p><strong>Name:</strong> ${fullName}</p>
            <p><strong>Address:</strong> ${address}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleTimeString()}</p>
          </div>
          <table>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
            ${itemsHtml}
          </table>
          <div class="total">Total: ${formatPrice(total)}</div>
          <div class="footer">Thank you for shopping with ChaiCo!</div>
        </body>
      </html>
    `

    const { uri } = await Print.printToFileAsync({ html })
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Save or Share Receipt',
    })
  }

  async function placeOrder() {
    if (!fullName || !address || !phone) {
      Alert.alert('Missing Info', 'Please fill in all fields!')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        items: items,
        total: getTotalPrice(),
        status: 'pending',
      })
    if (error) {
      Alert.alert('Error', error.message)
      setLoading(false)
      return
    }
    const orderItems = [...items]
    const orderTotal = getTotalPrice()

    clearCart()
    setLoading(false)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    try {
      await sendLocalNotification(
        'Order Placed!',
        'Your ChaiCo order is confirmed and on its way!'
      )
    } catch (e) {
      console.log('Notification error:', e)
    }
    try {
      await generateReceipt(orderItems, orderTotal)
    } catch (e) {
      console.log('PDF error:', e)
    }

    Alert.alert(
      'Order Placed!',
      'Your tea is on its way!',
      [{ text: 'OK', onPress: () => navigation.navigate('Tabs') }]
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.primary }]}>{t('checkout')}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.orderItem}>
              <Text style={[styles.orderItemName, { color: colors.text }]}>
                {item.name} x{item.quantity}
              </Text>
              <Text style={[styles.orderItemPrice, { color: colors.primary }]}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>{t('total')}</Text>
            <Text style={[styles.totalPrice, { color: colors.price }]}>
              {formatPrice(getTotalPrice())}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('deliveryInfo')}</Text>

          <Text style={[styles.label, { color: colors.primary }]}>{t('fullName')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder={t('fullName')}
            placeholderTextColor={colors.subtext}
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={[styles.label, { color: colors.primary }]}>{t('address')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder={t('address')}
            placeholderTextColor={colors.subtext}
            value={address}
            onChangeText={setAddress}
          />

          <Text style={[styles.label, { color: colors.primary }]}>{t('phone')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder={t('phone')}
            placeholderTextColor={colors.subtext}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.orderBtn, { backgroundColor: loading ? colors.border : colors.primary }]}
          onPress={placeOrder}
          disabled={loading}
        >
          <Text style={[styles.orderBtnText, { color: colors.white }]}>
            {loading ? '...' : t('placeOrder')}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    marginBottom: 20,
  },
  backBtn: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 14,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
  },
  orderBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  orderBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
})