// Purpose: Let users choose a simple 1–5 star rating without a numeric select.

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
        const active = value !== null && star <= value

        if (!onChange) {
          return (
            <span
              key={star}
              aria-hidden="true"
              className={`text-2xl leading-none ${
                active ? 'text-[#d28b41]' : 'text-[#ddc9bb]'
              }`}
            >
              ★
            </span>
          )
        }

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-label={`${star} out of 5 stars`}
            aria-checked={value === star}
            onClick={() => onChange(star)}
            className={`rounded-lg px-1 text-3xl leading-none transition hover:bg-[#fbe4d7] ${
              active ? 'text-[#d28b41]' : 'text-[#ddc9bb]'
            }`}
          >
            ★
          </button>
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
