import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import useSettingsStore from '../store/settingsStore'
import { lightTheme, darkTheme } from '../lib/theme'

export default function ThemeSettings({ navigation }: any) {
  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const colors = theme === 'dark' ? darkTheme : lightTheme

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.primary }]}>Theme Settings</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>

        <TouchableOpacity
          style={[
            styles.optionBtn,
            { backgroundColor: colors.filterBtn, borderColor: colors.border },
            theme === 'light' && { backgroundColor: lightTheme.primary, borderColor: lightTheme.primary },
          ]}
          onPress={() => setTheme('light')}
        >
          <Text style={[
            styles.optionText,
            { color: colors.text },
            theme === 'light' && styles.optionTextActive
          ]}>
            ☀️ Light Mode
          </Text>
          {theme === 'light' && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionBtn,
            { backgroundColor: colors.filterBtn, borderColor: colors.border },
            theme === 'dark' && { backgroundColor: darkTheme.primary, borderColor: darkTheme.primary },
          ]}
          onPress={() => setTheme('dark')}
        >
          <Text style={[
            styles.optionText,
            { color: colors.text },
            theme === 'dark' && styles.optionTextActive
          ]}>
            🌙 Dark Mode
          </Text>
          {theme === 'dark' && <Text style={styles.checkmark}>✓</Text>}
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