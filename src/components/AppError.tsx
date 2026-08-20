type AppErrorProps = {
  title?: string
  message?: string
  onRetry?: () => void
}

function AppError({
  title = 'Something went wrong',
  message = 'We could not load your data.',
  onRetry,
}: AppErrorProps) {
  return (
    <div className="global-state-page">
      <div className="global-state-card error">
        <div className="global-error-icon">
          !
        </div>

        <h1>
          {title}
        </h1>

        <p>
          {message}
        </p>

        <span className="global-error-note">
          Your saved data has not been changed.
        </span>

        {onRetry && (
          <button
            className="global-retry-button"
            type="button"
            onClick={
              onRetry
            }
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}

export default AppError