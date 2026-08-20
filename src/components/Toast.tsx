import {
  useEffect,
} from 'react'

export type ToastType =
  | 'success'
  | 'error'
  | 'graduate'

type ToastProps = {
  type: ToastType
  message: string
  onClose: () => void
  duration?: number
}

function Toast({
  type,
  message,
  onClose,
  duration = 2500,
}: ToastProps) {
  useEffect(() => {
    const timer =
      window.setTimeout(
        onClose,
        duration,
      )

    return () => {
      window.clearTimeout(
        timer,
      )
    }
  }, [
    duration,
    onClose,
  ])

  const icon =
    type === 'success'
      ? '✓'
      : type === 'graduate'
        ? '★'
        : '!'

  return (
    <div
      className={`app-toast ${type}`}
      role="status"
      aria-live="polite"
    >
      <div className="app-toast-icon">
        {icon}
      </div>

      <div className="app-toast-message">
        {message}
      </div>

      <button
        className="app-toast-close"
        type="button"
        aria-label="Close notification"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  )
}

export default Toast