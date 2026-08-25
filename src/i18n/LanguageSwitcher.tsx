import { useTranslation } from 'react-i18next'
import { localeStorageKey } from './i18n'
import type { Locale } from './locales'
import './LanguageSwitcher.css'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const locale = (i18n.resolvedLanguage === 'en' ? 'en' : 'es') as Locale

  const changeLocale = (nextLocale: Locale) => {
    window.localStorage.setItem(localeStorageKey, nextLocale)
    void i18n.changeLanguage(nextLocale)
    document.documentElement.lang = nextLocale
  }

  return (
    <div className="language-switcher" role="group" aria-label={t('settings.languageTitle')}>
      <div className="language-switcher-options">
        <button
          type="button"
          className={locale === 'es' ? 'language-option is-active' : 'language-option'}
          onClick={() => changeLocale('es')}
          aria-pressed={locale === 'es'}
        >
          <span className="language-flag" aria-hidden="true">
            🇪🇸
          </span>
          {t('settings.languageSpanish')}
        </button>
        <button
          type="button"
          className={locale === 'en' ? 'language-option is-active' : 'language-option'}
          onClick={() => changeLocale('en')}
          aria-pressed={locale === 'en'}
        >
          <span className="language-flag" aria-hidden="true">
            🇬🇧
          </span>
          {t('settings.languageEnglish')}
        </button>
      </div>
    </div>
  )
}
