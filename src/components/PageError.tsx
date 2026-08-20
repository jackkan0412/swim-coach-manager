type PageErrorProps = {
  title?: string
  message: string

  onRetry?:
    () => void
}

function PageError({
  title = 'Unable to load page',
  message,
  onRetry,
}: PageErrorProps) {
  return (
    <div className="page-state">
      <div className="page-state-card page-state-error">
        <div className="page-state-error-icon">
          !
        </div>

        <h2>
          {title}
        </h2>

        <p>
          {message}
        </p>

        {onRetry && (
          <button
            type="button"
            className="primary-button page-state-retry"
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

export default PageError