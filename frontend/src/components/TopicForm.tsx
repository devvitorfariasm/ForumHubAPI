import { useForm } from '@tanstack/react-form'
import type { TopicInput } from '../lib/api'
import { Button, ErrorAlert, TextAreaField, TextField } from './ui'

type Props = {
  initial?: TopicInput
  submitLabel: string
  onSubmit: (values: TopicInput) => Promise<unknown>
  onCancel?: () => void
  error?: unknown
}

/** Formulário de tópico com TanStack Form. Usado para criar e para editar. */
export function TopicForm({ initial, submitLabel, onSubmit, onCancel, error }: Props) {
  const form = useForm({
    defaultValues: initial ?? { title: '', message: '' },
    onSubmit: async ({ value }) => {
      await onSubmit({ title: value.title.trim(), message: value.message.trim() })
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field
        name="title"
        validators={{
          onChange: ({ value }) => {
            if (!value.trim()) return 'Informe um título.'
            if (value.length > 180) return 'O título tem no máximo 180 caracteres.'
            return undefined
          },
        }}
      >
        {(field) => <TextField field={field} label="Título" placeholder="Resuma sua dúvida" maxLength={180} />}
      </form.Field>

      <form.Field
        name="message"
        validators={{
          onChange: ({ value }) => (value.trim() ? undefined : 'Informe a mensagem.'),
        }}
      >
        {(field) => <TextAreaField field={field} label="Mensagem" placeholder="Descreva o contexto, o que já tentou e o que esperava" />}
      </form.Field>

      <ErrorAlert error={error} />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
              {submitLabel}
            </Button>
          )}
        </form.Subscribe>
      </div>
    </form>
  )
}
