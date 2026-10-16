import { useEffect, useId, useRef } from 'react'
import type { Card } from '../board'

// Asks before `card` is deleted. Mount it only while it is open.
// Cancel is first in the DOM, so showModal() focuses it and not the destructive button.
function DeleteCardDialog({
  card,
  onConfirm,
  onClose,
}: {
  card: Pick<Card, 'title'>
  onConfirm: () => void
  onClose: () => void
}) {
  const headingId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => dialogRef.current?.showModal(), [])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      // Esc and Cancel end up here; Delete closes first so the page is not blocked when onConfirm runs.
      // React bubbles onClose up the tree, which would close the Edit dialog around this one too.
      onClose={(event) => {
        event.stopPropagation()
        onClose()
      }}
      className="m-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="space-y-2 p-6">
        <h2
          id={headingId}
          className="text-base font-bold tracking-tight wrap-break-word"
        >
          Delete “{card.title}”?
        </h2>
        <p
          id={descriptionId}
          className="text-sm text-slate-600 dark:text-slate-400"
        >
          This cannot be undone.
        </p>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="cursor-pointer rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.close()
              onConfirm()
            }}
            className="cursor-pointer rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-500"
          >
            Delete
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default DeleteCardDialog
