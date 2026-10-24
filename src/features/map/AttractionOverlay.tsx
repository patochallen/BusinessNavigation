import './AttractionOverlay.css'
import type { AttractionModel } from '../../domain/scene-model'
import { IconButton } from '../layout/IconButton'
import { X } from 'lucide-react'

type AttractionOverlayProps = {
  selectedAttraction: AttractionModel
  onClose: () => void
  onNavigate: () => void
}

export const AttractionOverlay = ({
  selectedAttraction,
  onClose,
  onNavigate,
}: AttractionOverlayProps) => {
  return (
    <div className="attraction-overlay">
      <IconButton icon={<X />} position="topRight" onClick={onClose} aria-label="Cerrar" />
      <span className="attraction-overlay-name">{selectedAttraction.getName()}</span>
      <p className="attraction-overlay-description">
        {selectedAttraction.getDescription() ?? 'This attraction has no description.'}
      </p>
      <button className="attraction-overlay-navigate" onClick={onNavigate}>
        Navigate
      </button>
    </div>
  )
}
