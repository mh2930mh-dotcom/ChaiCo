import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet,
  TouchableOpacity, Alert
} from 'react-native'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import * as Location from 'expo-location'
import useSettingsStore from '../store/settingsStore'
import { lightTheme, darkTheme } from '../lib/theme'

const stores = [
  {
    id: 1,
    name: 'ChaiCo - Cairo Mall',
    address: 'Cairo Festival City Mall, Cairo',
    latitude: 30.0280,
    longitude: 31.4913,
  },
  {
    id: 2,
    name: 'ChaiCo - Zamalek',
    address: '26th of July St, Zamalek, Cairo',
    latitude: 30.0621,
    longitude: 31.2189,
  },
  {
    id: 3,
    name: 'ChaiCo - Maadi',
    address: 'Road 9, Maadi, Cairo',
    latitude: 29.9602,
    longitude: 31.2569,
  },
  {
    id: 4,
    name: 'ChaiCo - New Cairo',
    address: 'Fifth Settlement, New Cairo',
    latitude: 30.0074,
    longitude: 31.4913,
  },
]

export default function StoreLocatorScreen({ navigation }: any) {
  const [location, setLocation] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const theme = useSettingsStore((state) => state.theme)
  const colors = theme === 'dark' ? darkTheme : lightTheme

  useEffect(() => {
    getLocation()
  }, [])

  async function getLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow location access!')
      setLoading(false)
      return
    }

    const loc = await Location.getCurrentPositionAsync({})
    setLocation(loc.coords)
    setLoading(false)
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.loadingText, { color: colors.primary }]}>
          Getting your location...
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.primary }]}>
          Store Locator
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          Find ChaiCo stores near you
        </Text>
      </View>

      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: location?.latitude ?? 30.0444,
          longitude: location?.longitude ?? 31.2357,
          latitudeDelta: 0.2,
          longitudeDelta: 0.2,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="You are here"
            pinColor="blue"
          />
        )}

        {stores.map((store) => (
          <Marker
            key={store.id}
            coordinate={{
              latitude: store.latitude,
              longitude: store.longitude,
            }}
            title={store.name}
            description={store.address}
            pinColor={colors.primary}
          />
        ))}
      </MapView>

      <View style={[styles.storeList, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.storeListTitle, { color: colors.text }]}>
          Nearby Stores
        </Text>
        {stores.map((store) => (
          <View key={store.id} style={[styles.storeItem, { borderBottomColor: colors.border }]}>
            <Text style={[styles.storeName, { color: colors.primary }]}>{store.name}</Text>
            <Text style={[styles.storeAddress, { color: colors.subtext }]}>{store.address}</Text>
          </View>
        ))}
      </View>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  backBtn: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  map: {
    width: '100%',
    height: 300,
  },
  storeList: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  storeListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  storeItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
  },
  storeAddress: {
    fontSize: 12,
    marginTop: 2,
  },
})