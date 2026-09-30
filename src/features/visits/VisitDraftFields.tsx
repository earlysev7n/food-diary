// Purpose: Collect the visit details while saving a place from Add.

import { StarRating } from './StarRating'

type VisitDraftFieldsProps = {
  visitedAt: string
  onVisitedAtChange: (value: string) => void
  rating: number | null
  onRatingChange: (value: number | null) => void
  note: string
  onNoteChange: (value: string) => void
  photos: File[]
  onPhotosChange: (photos: File[]) => void
}

export function VisitDraftFields({
  visitedAt,
  onVisitedAtChange,
  rating,
  onRatingChange,
  note,
  onNoteChange,
  photos,
  onPhotosChange,
}: VisitDraftFieldsProps) {
  return (
    <div className="mt-4 space-y-4 rounded-2xl bg-[#fffaf5] p-4">
      <div>
        <p className="text-sm font-semibold text-[#34251f]">
          Visit details
        </p>
        <p className="mt-1 text-xs text-[#806f64]">
          These details will appear in your Diary.
        </p>
      </div>

      <label className="block text-sm font-medium text-[#59483f]">
        Date visited
        <input
          required
          type="date"
          value={visitedAt}
          onChange={(event) => onVisitedAtChange(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-[#ddc9bb] bg-white px-4 py-3"
        />
      </label>

      <div>
        <p className="text-sm font-medium text-[#59483f]">
          Overall rating
        </p>
        <div className="mt-2">
          <StarRating
            value={rating}
            onChange={onRatingChange}
            label="Overall visit rating"
          />
        </div>
      </div>

      <label className="block text-sm font-medium text-[#59483f]">
        Memory or note
        <textarea
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          placeholder="What do you remember about this visit?"
          rows={4}
          className="mt-2 w-full resize-none rounded-2xl border border-[#ddc9bb] bg-white px-4 py-3"
        />
      </label>

      <div>
        <p className="text-sm font-medium text-[#59483f]">
          Photos
        </p>
        <label className="mt-2 flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-[#ddc9bb] bg-white px-4 py-4 text-sm font-semibold text-[#59483f] hover:bg-[#fff3e8]">
          {photos.length > 0
            ? `Add more photos (${photos.length} selected)`
            : 'Choose photos'}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              onPhotosChange([
                ...photos,
                ...Array.from(event.target.files ?? []),
              ])
              event.currentTarget.value = ''
            }}
            className="sr-only"
          />
        </label>

        {photos.length > 0 && (
          <ul className="mt-2 space-y-1 text-xs text-[#806f64]">
            {photos.map((photo, index) => (
              <li
                key={`${photo.name}-${index}`}
                className="flex justify-between gap-2"
              >
                <span className="truncate">{photo.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    onPhotosChange(
                      photos.filter((_, photoIndex) => photoIndex !== index),
                    )
                  }
                  className="font-semibold text-[#ad3f2d]"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
