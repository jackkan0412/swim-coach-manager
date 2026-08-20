type MoneyDisplayProps = {
  amount: number
  decimals?: number
  className?: string
}

function MoneyDisplay({
  amount,
  decimals = 2,
  className = '',
}: MoneyDisplayProps) {
  const formattedAmount =
    amount.toLocaleString(
      'en-MY',
      {
        minimumFractionDigits:
          decimals,

        maximumFractionDigits:
          decimals,
      },
    )

  return (
    <div
      className={`money-display ${className}`}
    >
      <span className="money-display-value">
        RM{' '}
        {
          formattedAmount
        }
      </span>
    </div>
  )
}

export default MoneyDisplay