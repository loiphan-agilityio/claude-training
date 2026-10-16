import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Card, Column, Priority } from '../board'
import { useBoardStore } from '../store'
import DeleteCardDialog from './DeleteCardDialog'

const labelClass =
  'block text-xs font-semibold text-slate-700 dark:text-slate-300'
const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-700 dark:scheme-dark dark:bg-slate-950 dark:text-slate-100'

// Adds a card to `column`, or edits `card` when given (and can delete it).
// Mount it only while it is open: the fields take their defaults from `card`
// once, on mount. `onClose` says whether the card was deleted: its Edit button
// is gone, so the native focus restore has nowhere to go.
// A native modal <dialog> gives focus trapping, Esc to close and focus restore for free.
function CardDialog({
  column,
  card,
  onClose,
}: {
  column: Pick<Column, 'id' | 'title'>
  card?: Card
  onClose: (deleted: boolean) => void
}) {
  const headingId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const deleted = useRef(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const addCard = useBoardStore((state) => state.addCard)
  const updateCard = useBoardStore((state) => state.updateCard)
  const deleteCard = useBoardStore((state) => state.deleteCard)

  useEffect(() => dialogRef.current?.showModal(), [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    // empty optional fields are left out so the card does not render them
    const optional = (name: string) =>
      String(data.get(name)).trim() || undefined
    const fields = {
      title: String(data.get('title')).trim(),
      description: optional('description'),
      priority: String(data.get('priority')) as Priority,
      assignee: optional('assignee'),
      dueDate: optional('dueDate'),
    }

    if (card) {
      updateCard(card.id, fields)
    } else {
      addCard(column.id, fields)
    }

    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={headingId}
      // Esc, Cancel, Save and Delete all end up here
      onClose={() => onClose(deleted.current)}
      className="m-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <h2 id={headingId} className="text-base font-bold tracking-tight">
          {card ? 'Edit card' : `Add card to ${column.title}`}
        </h2>

        <label className={labelClass}>
          Title
          <input
            name="title"
            defaultValue={card?.title}
            required
            // required alone lets whitespace through
            pattern=".*\S.*"
            title="Enter a title"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Description
          <textarea
            name="description"
            defaultValue={card?.description}
            rows={3}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Priority
          <select
            name="priority"
            defaultValue={card?.priority ?? 'medium'}
            className={inputClass}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className={labelClass}>
          Assignee
          <input
            name="assignee"
            defaultValue={card?.assignee}
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Due date
          <input
            name="dueDate"
            type="date"
            defaultValue={card?.dueDate}
            className={inputClass}
          />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          {card && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="mr-auto cursor-pointer rounded-lg border border-rose-300 px-3.5 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="cursor-pointer rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            {card ? 'Save' : 'Add card'}
          </button>
        </div>
      </form>

      {confirmingDelete && card && (
        <DeleteCardDialog
          card={card}
          onConfirm={() => {
            deleteCard(card.id)
            deleted.current = true
            dialogRef.current?.close()
          }}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </dialog>
  )
}

export default CardDialog
