// Vendor product form
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Image
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { decode } from 'base64-arraybuffer'
import { supabase } from '../lib/supabase'
import useSettingsStore from '../store/settingsStore'
import { lightTheme, darkTheme } from '../lib/theme'

const categories = ['Green Tea', 'Black Tea', 'Herbal Tea', 'White Tea', 'Oolong Tea']

export default function VendorAddProductScreen({ navigation }: any) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Green Tea')
  const [stock, setStock] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const theme = useSettingsStore((state) => state.theme)
  const colors = theme === 'dark' ? darkTheme : lightTheme

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photos!')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access!')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  async function uploadImage(uri: string): Promise<string> {
    const fileName = `product_${Date.now()}.jpg`
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: 'base64',
    })

    console.log('Base64 length:', base64.length)
    const { data, error } = await supabase.storage
      .from('vendor_products')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: true,
      })

    if (error) {
      throw error
    }
    const { data: { publicUrl } } = supabase.storage
      .from('vendor_products')
      .getPublicUrl(fileName)
    return publicUrl
  }

  async function addProduct() {
    if (!name || !price || !description || !stock) {
      Alert.alert('Missing Info', 'Please fill in all fields!')
      return
    }

    if (!image) {
      Alert.alert('Missing Image', 'Please select a product image!')
      return
    }

    setLoading(true)

    try {
      const imageUrl = await uploadImage(image)
      const { error } = await supabase
        .from('products')
        .insert({
          name,
          price: parseFloat(price),
          description,
          category,
          stock: parseInt(stock),
          image_url: imageUrl,
        })

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      Alert.alert('Success!', 'Product added with image!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ])

    } catch (e: any) {
      console.log('Full error:', e)
      Alert.alert('Upload Failed', e.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
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
          <Text style={[styles.title, { color: colors.primary }]}>Add Product</Text>
        </View>

        <View style={[styles.imageSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.filterBtn }]}>
              <Text style={[styles.imagePlaceholderText, { color: colors.subtext }]}>
                No image selected
              </Text>
            </View>
          )}

          <View style={styles.imageButtons}>
            <TouchableOpacity
              style={[styles.imageBtn, { backgroundColor: colors.primary }]}
              onPress={pickImage}
            >
              <Text style={styles.imageBtnText}>Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.imageBtn, { backgroundColor: colors.primary }]}
              onPress={takePhoto}
            >
              <Text style={styles.imageBtnText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Product Details</Text>

          <Text style={[styles.label, { color: colors.primary }]}>Product Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder="Enter product name"
            placeholderTextColor={colors.subtext}
            value={name}
            onChangeText={setName}
          />

          <Text style={[styles.label, { color: colors.primary }]}>Price (USD)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder="Enter price"
            placeholderTextColor={colors.subtext}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.label, { color: colors.primary }]}>Stock</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder="Enter stock quantity"
            placeholderTextColor={colors.subtext}
            value={stock}
            onChangeText={setStock}
            keyboardType="number-pad"
          />

          <Text style={[styles.label, { color: colors.primary }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
            placeholder="Enter product description"
            placeholderTextColor={colors.subtext}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryBtn,
                  { backgroundColor: colors.filterBtn, borderColor: colors.border },
                  category === cat && styles.categoryBtnActive
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[
                  styles.categoryText,
                  { color: colors.primary },
                  category === cat && styles.categoryTextActive
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }, loading && styles.submitBtnDisabled]}
          onPress={addProduct}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Uploading Image...' : 'Add Product'}
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
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
  imageSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  imagePlaceholderText: {
    fontSize: 16,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  imageBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  imageBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
  },
  categoryBtnActive: {
    backgroundColor: '#0A3323',
    borderColor: '#0A3323',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  submitBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  submitBtnDisabled: {
    backgroundColor: '#839958',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
})