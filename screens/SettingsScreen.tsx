import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import useSettingsStore from '../store/settingsStore'
import { lightTheme, darkTheme } from '../lib/theme'

const currencies = [
  { code: 'USD', label: '🇺🇸 US Dollar' },
  { code: 'EGP', label: '🇪🇬 Egyptian Pound' },
  { code: 'GBP', label: '🇬🇧 British Pound' },
  { code: 'EUR', label: '🇪🇺 Euro' },
  { code: 'AED', label: '🇦🇪 UAE Dirham' },
  { code: 'SAR', label: '🇸🇦 Saudi Riyal' },
  { code: 'JPY', label: '🇯🇵 Japanese Yen' },
  { code: 'CAD', label: '🇨🇦 Canadian Dollar' },
  { code: 'AUD', label: '🇦🇺 Australian Dollar' },
]

const languages = [
  { code: 'en', label: '🇺🇸 English' },
  { code: 'fr', label: '🇫🇷 French' },
  { code: 'es', label: '🇪🇸 Spanish' },
  { code: 'ja', label: '🇯🇵 Japanese' },
]

export default function SettingsScreen({ navigation }: any) {
  const { currency, language, theme, setCurrency, setLanguage, setTheme } = useSettingsStore()
  const colors = theme === 'dark' ? darkTheme : lightTheme

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.primary }]}>Language & Currency 🌍</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Currency</Text>
        {currencies.map((item) => (
          <TouchableOpacity
            key={item.code}
            style={[
              styles.optionBtn,
              { backgroundColor: colors.filterBtn, borderColor: colors.border },
              currency === item.code && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setCurrency(item.code)}
          >
            <Text style={[
              styles.optionText,
              { color: colors.text },
              currency === item.code && styles.optionTextActive
            ]}>
              {item.label}
            </Text>
            {currency === item.code && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Language</Text>
        {languages.map((item) => (
          <TouchableOpacity
            key={item.code}
            style={[
              styles.optionBtn,
              { backgroundColor: colors.filterBtn, borderColor: colors.border },
              language === item.code && { backgroundColor: colors.primary, borderColor: colors.primary }
            ]}
            onPress={() => setLanguage(item.code)}
          >
            <Text style={[
              styles.optionText,
              { color: colors.text },
              language === item.code && styles.optionTextActive
            ]}>
              {item.label}
            </Text>
            {language === item.code && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
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
  optionBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  optionBtnActive: {
    backgroundColor: '#0A3323',
    borderColor: '#0A3323',
  },
  optionText: {
    fontSize: 15,
  },
  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
})