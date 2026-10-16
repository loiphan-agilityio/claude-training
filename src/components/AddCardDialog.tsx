import { useId, useRef } from 'react'
import type { FormEvent, Ref } from 'react'
import type { Column, Priority } from '../board'
import { useBoardStore } from '../store'

const labelClass =
  'block text-xs font-semibold text-slate-700 dark:text-slate-300'
const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 dark:border-slate-700 dark:scheme-dark dark:bg-slate-950 dark:text-slate-100'

// a native modal <dialog> gives focus trapping, Esc to close and focus restore for free
function AddCardDialog({
  ref,
  column,
}: {
  ref: Ref<HTMLDialogElement>
  column: Pick<Column, 'id' | 'title'>
}) {
  const headingId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const addCard = useBoardStore((state) => state.addCard)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const data = new FormData(event.currentTarget)
    // empty optional fields are left out so the card does not render them
    const optional = (name: string) =>
      String(data.get(name)).trim() || undefined

    addCard(column.id, {
      title: String(data.get('title')).trim(),
      description: optional('description'),
      priority: String(data.get('priority')) as Priority,
      assignee: optional('assignee'),
      dueDate: optional('dueDate'),
    })
    event.currentTarget.closest('dialog')?.close()
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={headingId}
      // Esc, Cancel and Add card all end up here
      onClose={() => formRef.current?.reset()}
      className="m-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-0 text-slate-900 shadow-xl backdrop:bg-slate-950/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
    >
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 p-6">
        <h2 id={headingId} className="text-base font-bold tracking-tight">
          Add card to {column.title}
        </h2>

        <label className={labelClass}>
          Title
          <input
            name="title"
            required
            // required alone lets whitespace through
            pattern=".*\S.*"
            title="Enter a title"
            className={inputClass}
          />
        </label>

        <label className={labelClass}>
          Description
          <textarea name="description" rows={3} className={inputClass} />
        </label>

        <label className={labelClass}>
          Priority
          <select name="priority" defaultValue="medium" className={inputClass}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>

        <label className={labelClass}>
          Assignee
          <input name="assignee" className={inputClass} />
        </label>

        <label className={labelClass}>
          Due date
          <input name="dueDate" type="date" className={inputClass} />
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={(event) => event.currentTarget.closest('dialog')?.close()}
            className="cursor-pointer rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Add card
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default AddCardDialog
