import { useMutation } from '@apollo/react-hooks'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation, useTheme } from '@react-navigation/native'
import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Localization from 'expo-localization'
import * as Notifications from 'expo-notifications'
import * as Updates from 'expo-updates'
import gql from 'graphql-tag'
import React, { useContext, useEffect, useRef, useState } from 'react'
import {
  AppState,
  Linking,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native'
import { Modalize } from 'react-native-modalize'
import i18n from '../../../i18n'
import {
  profile,
  pushToken,
  updateNotificationStatus
} from '../../apollo/server'
import {
  CustomIcon,
  FlashMessage,
  Spinner,
  TextDefault,
  WrapperView
} from '../../components'
import SwitchBtn from '../../components/FdSwitch/SwitchBtn'
import UserContext from '../../context/User'
import { alignment } from '../../utils/alignment'
import { ICONS_NAME } from '../../utils/constant'
import { scale } from '../../utils/scaling'
import SettingModal from './components/SettingModal'
import useStyle from './styles'

const languageTypes = [
  { value: 'English', code: 'en', index: 0 },
  { value: 'français', code: 'fr', index: 1 },
  { value: 'ភាសាខ្មែរ', code: 'km', index: 2 },
  { value: '中文', code: 'zh', index: 3 },
  { value: 'Deutsche', code: 'de', index: 4 }
]

const PUSH_TOKEN = gql`
  ${pushToken}
`
const UPDATE_NOTIFICATION_TOKEN = gql`
  ${updateNotificationStatus}
`
const PROFILE = gql`
  ${profile}
`

function Settings() {
  const styles = useStyle()
  const { colors } = useTheme()
  const navigation = useNavigation()
  const { profile } = useContext(UserContext)

  const [languageName, languageNameSetter] = useState('English')
  const [offerNotification, offerNotificationSetter] = useState(
    profile.is_offer_notification
  )
  const [orderNotification, orderNotificationSetter] = useState(
    profile.is_order_notification
  )
  const [activeRadio, activeRadioSetter] = useState(languageTypes[0].index)
  // eslint-disable-next-line no-unused-vars
  const [appState, setAppState] = useState(AppState.currentState)
  const [uploadToken] = useMutation(PUSH_TOKEN)
  const [mutate, { loading }] = useMutation(UPDATE_NOTIFICATION_TOKEN, {
    onCompleted,
    onError,
    refetchQueries: [{ query: PROFILE }]
  })
  const modalizeRef = useRef(null)

  useEffect(() => {
    navigation.setOptions({
      headerTitle: i18n.t('titleSettings'),
      headerRight: null
    })
    selectLanguage()
    checkPermission()
  }, [navigation])

  const _handleAppStateChange = async nextAppState => {
    if (nextAppState === 'active') {
      let token = null
      const permission = await getPermission()
      if (permission === 'granted') {
        if (!profile.notificationToken) {
          token = (await Notifications.getExpoPushTokenAsync()).data
          uploadToken({ variables: { token } })
        }
        offerNotificationSetter(profile.is_offer_notification)
        orderNotificationSetter(profile.is_order_notification)
      } else {
        offerNotificationSetter(false)
        orderNotificationSetter(false)
      }
    }
    setAppState(nextAppState)
  }

  useEffect(() => {
    AppState.addEventListener('change', _handleAppStateChange)
    return () => {
      AppState.removeEventListener('change', _handleAppStateChange)
    }
  }, [])

  async function checkPermission() {
    const permission = await getPermission()
    if (permission !== 'granted') {
      offerNotificationSetter(false)
      orderNotificationSetter(false)
    } else {
      offerNotificationSetter(profile.is_offer_notification)
      orderNotificationSetter(profile.is_order_notification)
    }
  }

  async function getPermission() {
    const { status } = await Notifications.getPermissionsAsync()
    return status
  }

  async function selectLanguage() {
    const lang = await AsyncStorage.getItem('enatega-language')
    if (lang) {
      const defLang = languageTypes.findIndex(el => el.code === lang)
      const langName = languageTypes[defLang].value
      activeRadioSetter(defLang)
      languageNameSetter(langName)
    }
  }

  const onSelectedLanguage = async active => {
    const languageInd = active
    if (Platform.OS === 'android') {
      const localization = await Localization.getLocalizationAsync()
      localization.locale = languageTypes[languageInd].code
      await AsyncStorage.setItem(
        'enatega-language',
        languageTypes[languageInd].code
      )
      Updates.reloadAsync()
    }
  }

  const onClose = () => {
    modalizeRef.current.close()
  }

  function onCompleted() {
    FlashMessage({
      message: 'Notification Status Updated'
    })
  }

  function onError(error) {
    try {
      FlashMessage({
        message: error.networkError.result.errors[0].message
      })
    } catch (err) {}
  }

  async function updateNotificationStatus(notificationCheck) {
    let orderNotify, offerNotify
    if (!Device.isDevice) {
      FlashMessage({
        message: 'Notification do not work on simulator'
      })
      return
    }

    const permission = await getPermission()
    if (!profile.notificationToken || permission !== 'granted') {
      Linking.openSettings()
    }
    if (notificationCheck === 'offer') {
      offerNotificationSetter(!offerNotification)
      orderNotify = orderNotification
      offerNotify = !offerNotification
    }

    if (notificationCheck === 'order') {
      orderNotificationSetter(!orderNotification)
      orderNotify = !orderNotification
      offerNotify = offerNotification
    }
    mutate({
      variables: {
        offerNotification: offerNotify,
        orderNotification: orderNotify
      }
    })
  }

  return (
    <WrapperView>
      {loading && (
        <View style={{ ...StyleSheet.absoluteFill }}>
          <Spinner />
        </View>
      )}
      <View style={[styles.flex, styles.mainContainer]}>
        <View style={alignment.Plarge}>
          {Platform.OS === 'android' && (
            <View style={[styles.languageContainer, styles.shadow]}>
              <View style={styles.changeLanguage}>
                <View style={styles.headingLanguage}>
                  <TextDefault
                    numberOfLines={1}
                    textColor={colors.fontSecondColor}
                    medium
                    H5>
                    Language
                  </TextDefault>
                  <TextDefault medium H5>
                    ({languageName})
                  </TextDefault>
                </View>
                <TouchableOpacity
                  activeOpacity={0.5}
                  onPress={() => modalizeRef.current.open('top')}
                  style={styles.button}>
                  <CustomIcon
                    name={ICONS_NAME.Pencil}
                    size={scale(22)}
                    color={colors.fontMainColor}
                  />
                </TouchableOpacity>
              </View>
            </View>
          )}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              updateNotificationStatus('offer')
            }}
            style={[styles.notificationContainer, styles.shadow]}>
            <View style={styles.notificationChekboxContainer}>
              <TextDefault
                numberOfLines={1}
                textColor={colors.statusSecondColor}>
                {' '}
                Receive Special Offers{' '}
              </TextDefault>
              <SwitchBtn
                isEnabled={offerNotification}
                onPress={() => {
                  updateNotificationStatus('offer')
                }}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              updateNotificationStatus('order')
            }}
            style={[styles.notificationContainer, styles.shadow]}>
            <View style={styles.notificationChekboxContainer}>
              <TextDefault
                numberOfLines={1}
                textColor={colors.statusSecondColor}>
                {' '}
                Get updates on your order status!{' '}
              </TextDefault>
              <SwitchBtn
                isEnabled={orderNotification}
                onPress={() => {
                  updateNotificationStatus('order')
                }}
              />
            </View>
          </TouchableOpacity>
          <View style={styles.versionContainer}>
            <TextDefault textColor={colors.fontSecondColor}>
              Version: {Constants.manifest.version}
            </TextDefault>
          </View>
        </View>
      </View>
      <TextDefault
        textColor={colors.fontSecondColor}
        style={alignment.MBsmall}
        center>
        All rights are reserved by Enatega
      </TextDefault>

      {/* Modal for language Changes */}
      <Modalize
        ref={modalizeRef}
        adjustToContentHeight
        handlePosition="inside"
        avoidKeyboardLikeIOS={Platform.select({
          ios: true,
          android: false
        })}
        keyboardAvoidingOffset={2}
        keyboardAvoidingBehavior="height">
        <SettingModal
          onClose={onClose}
          onSelectedLanguage={onSelectedLanguage}
          activeRadio={activeRadio}
        />
      </Modalize>
    </WrapperView>
  )
}
export default Settings
