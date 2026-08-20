type AppLoadingProps = {
  title?: string
  message?: string
}

function AppLoading({
  title = 'SwimCoach',
  message = 'Loading your data...',
}: AppLoadingProps) {
  return (
    <div className="global-state-page">
      <div className="global-state-card loading">
        <div className="global-state-logo">
          🏊
        </div>

        <h1>
          {title}
        </h1>

        <p>
          {message}
        </p>

        <div className="global-loading-spinner">
          <span></span>
        </div>
      </div>
    </div>
  )
}

export default AppLoading