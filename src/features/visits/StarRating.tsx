// Purpose: Let users choose and view ratings in half-star steps.

type StarRatingProps = {
  value: number | null
  onChange?: (value: number | null) => void
  label?: string
}

export function StarRating({
  value,
  onChange,
  label = 'Rating',
}: StarRatingProps) {
  const isInteractive = Boolean(onChange)

  return (
    <div
      className="flex items-center gap-1"
      role={isInteractive ? 'radiogroup' : undefined}
      aria-label={label}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const fillPercentage = value === null
          ? 0
          : Math.min(100, Math.max(0, (value - (star - 1)) * 100))

        if (!onChange) {
          return (
            <span
              key={star}
              className="relative inline-block h-7 w-7 text-2xl leading-none"
            >
              <span className="absolute inset-0 text-[#ddc9bb]" aria-hidden="true">
                ★
              </span>
              <span
                className="absolute inset-y-0 left-0 overflow-hidden text-[#d28b41]"
                style={{ width: `${fillPercentage}%` }}
                aria-hidden="true"
              >
                <span>★</span>
              </span>
            </span>
          )
        }

        return (
          <span
            key={star}
            className="relative inline-block h-10 w-10 text-3xl leading-none"
          >
            <span className="pointer-events-none absolute inset-0 px-1 text-[#ddc9bb]" aria-hidden="true">
              ★
            </span>
            <span
              className="pointer-events-none absolute inset-y-0 left-0 overflow-hidden px-1 text-[#d28b41]"
              style={{ width: `${fillPercentage}%` }}
              aria-hidden="true"
            >
              <span>★</span>
            </span>
            <button
              type="button"
              role="radio"
              aria-label={`${star - 0.5} out of 5 stars`}
              aria-checked={value === star - 0.5}
              onClick={() => onChange(star - 0.5)}
              className="absolute inset-y-0 left-0 z-10 w-1/2 rounded-l-lg hover:bg-[#fbe4d7]/70"
            />
            <button
              type="button"
              role="radio"
              aria-label={`${star} out of 5 stars`}
              aria-checked={value === star}
              onClick={() => onChange(star)}
              className="absolute inset-y-0 right-0 z-10 w-1/2 rounded-r-lg hover:bg-[#fbe4d7]/70"
            />
          </span>
        )
      })}

      {onChange && value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 text-xs font-semibold text-[#806f64] underline"
        >
          Clear
        </button>
      )}
    </div>
  )
}
