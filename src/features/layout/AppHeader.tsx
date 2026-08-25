import { ArrowLeft, Search, Settings2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type AppHeaderProps = {
  businessMark: string
  businessName: string
  isSettings: boolean
  showBack: boolean
  onBack: () => void
  onOpenHome: () => void
  onOpenSettings: () => void
}

export function AppHeader({
  businessMark,
  businessName,
  isSettings,
  showBack,
  onBack,
  onOpenHome,
  onOpenSettings,
}: AppHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className="topbar">
      <div className="topbar-leading">
        {showBack ? (
          <button className="topbar-back" onClick={onBack} aria-label={t('common.back')}>
            <ArrowLeft size={18} />
          </button>
        ) : null}
        <button className="wordmark" onClick={onOpenHome}>
          <span className="brand-mark">{businessMark}</span>
          <span>{businessName}</span>
        </button>
      </div>
      <button
        onClick={onOpenSettings}
        className={isSettings ? 'icon-button icon-button-active' : 'icon-button'}
        aria-label={t('settings.open')}
      >
        <Settings2 size={19} />
      </button>
      <button className="icon-button" aria-label={t('common.search')}>
        <Search size={19} />
      </button>
    </header>
  )
}
