import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { localeStorageKey } from './i18n'
import type { Locale } from './locales'
import './LanguageSwitcher.css'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const locale = (i18n.resolvedLanguage === 'en' ? 'en' : 'es') as Locale

  const changeLocale = (nextLocale: Locale) => {
    window.localStorage.setItem(localeStorageKey, nextLocale)
    void i18n.changeLanguage(nextLocale)
    document.documentElement.lang = nextLocale
  }

  return (
    <label className="language-switcher">
      <Languages size={16} aria-hidden="true" />
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(event) => changeLocale(event.target.value as Locale)}
        aria-label="Language"
      >
        <option value="es">ES</option>
        <option value="en">EN</option>
      </select>
    </label>
  )
}
