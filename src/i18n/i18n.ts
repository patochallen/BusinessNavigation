import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources, type Locale } from './locales'

export const supportedLocales: Locale[] = ['es', 'en']
export const localeStorageKey = 'business-navigation.locale'

export function normalizeLocale(value: string | undefined): Locale {
  return value?.toLowerCase().startsWith('en') ? 'en' : 'es'
}

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'es'
  const savedLocale = window.localStorage.getItem(localeStorageKey)
  return savedLocale === 'en' || savedLocale === 'es'
    ? savedLocale
    : normalizeLocale(window.navigator.language)
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: detectLocale(),
    fallbackLng: 'es',
    interpolation: { escapeValue: false },
  })
}

export default i18n
