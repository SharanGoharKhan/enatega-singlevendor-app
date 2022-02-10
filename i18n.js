import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Localization from 'expo-localization'
import i18n from 'i18n-js'
import { Platform } from 'react-native'
import { de } from './translations/de'
import { en } from './translations/en'
import { fr } from './translations/fr'
import { km } from './translations/km'
import { zh } from './translations/zh'

i18n.initAsync = async() => {
  i18n.fallbacks = true
  i18n.translations = { fr, en, km, zh, de }
  // i18n.locale = 'km'
  if (Platform.OS === 'android') {
    const lang = await AsyncStorage.getItem('enatega-language')
    i18n.locale = lang || 'en'
  } else {
    i18n.locale = Localization.locale
  }
}

export default i18n
