type PageLoadingProps = {
  title?: string
  message?: string
}

function PageLoading({
  title = 'Loading',
  message = 'Please wait...',
}: PageLoadingProps) {
  return (
    <div className="page-state">
      <div className="page-state-card">
        <div className="app-loading-spinner"></div>

        <h2>
          {title}
        </h2>

        <p>
          {message}
        </p>
      </div>
    </div>
  )
}

export default PageLoading