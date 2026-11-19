import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { BusinessApp } from './BusinessApp'
import { BusinessMap } from './BusinessMap'
import { BusinessPreview } from './BusinessPreview'
import { AttractionMap } from './AttractionMap'

export function App() {
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault()
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<BusinessApp />} />
        <Route path="/:businessId" element={<BusinessPreview />} />
        <Route path="/map/:businessId" element={<BusinessMap />} />
        <Route path="/attraction" element={<AttractionMap />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
