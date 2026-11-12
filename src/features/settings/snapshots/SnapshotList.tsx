import type { StoredSnapshot } from '../../../data/storage-repository'
import { useState, useEffect } from 'react'
import { SnapshotRepository } from '../../../data/storage-repository'
import { Camera, Layers, TrashIcon, X } from 'lucide-react'
import { radToDeg } from 'three/src/math/MathUtils.js'
import './SnapshotList.css'
import { SnapshotView } from './SnapshotView'
import type { SceneObject } from '../../../domain/scene-model'

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'

const formatDate = (snapshot: StoredSnapshot) => {
  const timestamp = snapshot.createdAt // snapshot.date ?? snapshot.timestamp
  if (timestamp == null) return 'Sin fecha'
  const date = new Date(timestamp)
  return Number.isNaN(date.getTime())
    ? 'Sin fecha'
    : date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export const SnapshotList = ({ scene, onClose }: { scene: SceneObject; onClose: () => void }) => {
  const [snapshots, setSnapshots] = useState<StoredSnapshot[]>([])
  // SnapshotRepository.getStoredSnapshots().then(setSnapshots)
  //   return []
  // })
  const [selectedSnapshot, setSelectedSnapshot] = useState<StoredSnapshot | null>(null)

  useEffect(() => {
    SnapshotRepository.getStoredSnapshots().then(setSnapshots)
  }, [])

  const deleteSnapshot = async (index: number) => {
    SnapshotRepository.removeStoredSnapshot(index)
    setSnapshots(await SnapshotRepository.getStoredSnapshots())
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (selectedSnapshot) setSelectedSnapshot(null)
      else onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, selectedSnapshot])

  if (selectedSnapshot)
    return (
      <SnapshotView
        scene={scene}
        snapshot={selectedSnapshot}
        onClose={() => setSelectedSnapshot(null)}
      />
    )

  return (
    <section className="snapshot-library" aria-label="Snapshots">
      <header className="snapshot-library-header">
        <div className="snapshot-library-heading">
          <span className="snapshot-library-icon">
            <Layers size={24} aria-hidden="true" />
          </span>
          <div>
            <h2>
              Snapshots <span className="snapshot-library-count">{snapshots.length}</span>
            </h2>
            <p>Seleccioná una captura para explorar su vista.</p>
          </div>
        </div>
        <button
          type="button"
          className="snapshot-library-close"
          onClick={onClose}
          aria-label="Cerrar snapshots"
        >
          <X size={22} aria-hidden="true" />
        </button>
      </header>

      <div className="snapshot-library-body">
        {snapshots.length === 0 ? (
          <div className="snapshot-library-empty">
            <Camera size={36} strokeWidth={1.5} aria-hidden="true" />
            <h3>Todavía no hay capturas</h3>
            <p>Guardá un snapshot desde la pantalla de ajustes para encontrarlo acá.</p>
          </div>
        ) : (
          <ul className="snapshot-library-list">
            {snapshots.map((snapshot, index) => (
              <li key={index}>
                <button
                  type="button"
                  className="snapshot-card"
                  onClick={() => setSelectedSnapshot(snapshot)}
                >
                  <span className="snapshot-card-header">
                    <span className="snapshot-card-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="snapshot-card-heading">
                      <span className="snapshot-card-title">Captura {index + 1}</span>
                      <span className="snapshot-card-date">{formatDate(snapshot)}</span>
                    </span>
                    <button
                      type="button"
                      className="snapshot-card-icon-button-danger"
                      aria-label={`Eliminar snapshot ${index + 1}`}
                      onClick={(e) => {
                        deleteSnapshot(index)
                        e.stopPropagation()
                      }}
                    >
                      <TrashIcon />
                    </button>
                  </span>
                  <span className="snapshot-card-metrics">
                    <span>
                      <span className="snapshot-card-label">Posición · X / Y</span>
                      <span className="snapshot-card-value">
                        {formatNumber(snapshot.position.x)} / {formatNumber(snapshot.position.y)}
                      </span>
                    </span>
                    <span>
                      <span className="snapshot-card-label">Campo de visión</span>
                      <span className="snapshot-card-value">
                        {formatNumber(snapshot.cameraFov)}°
                      </span>
                    </span>
                    <span>
                      <span className="snapshot-card-label">Altura</span>
                      <span className="snapshot-card-value">
                        {formatNumber(snapshot.cameraHeight)}
                      </span>
                    </span>
                  </span>
                  <span className="snapshot-card-rotation">
                    <span className="snapshot-card-label">Rotación</span>
                    <span className="snapshot-card-axes">
                      <span>X {formatNumber(radToDeg(snapshot.cameraRotation.x))}°</span>
                      <span>Y {formatNumber(radToDeg(snapshot.cameraRotation.y))}°</span>
                      <span>Z {formatNumber(radToDeg(snapshot.cameraRotation.z))}°</span>
                    </span>
                    <span className="snapshot-card-order">{snapshot.cameraRotation.order}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
