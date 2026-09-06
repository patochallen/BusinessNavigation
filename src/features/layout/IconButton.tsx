import type { LucideProps } from 'lucide-react'
import { cloneElement } from 'react'

type IconPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: React.ReactElement<LucideProps>
  position?: IconPosition
  onClick?: () => void
}

export const IconButton = ({ icon, position, onClick, ...props }: IconButtonProps) => {
  return (
    <button
      {...props}
      style={{
        position: 'absolute',
        width: '31px',
        height: '31px',
        top: position === 'topLeft' || position === 'topRight' ? '1rem' : 'auto',
        bottom: position === 'bottomLeft' || position === 'bottomRight' ? '1rem' : 'auto',
        right: position === 'topRight' || position === 'bottomRight' ? '1rem' : 'auto',
        left: position === 'topLeft' || position === 'bottomLeft' ? '1rem' : 'auto',
        border: '0',
        backgroundColor: '#fff',
        borderRadius: '50%',
        background: 'rgba(246, 244, 238, 0.78)',
        color: '#283632',
        display: 'grid',
        alignItems: 'center',
        justifyItems: 'center',
        zIndex: 20,
      }}
      onClick={onClick}
    >
      {cloneElement(icon, { size: 17 })}
    </button>
  )
}
