import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate, type ErrorComponentProps } from '@tanstack/react-router'
import { ApiError, api, type Reply, type Topic } from '../../lib/api'
import { repliesQuery, topicKeys, topicQuery } from '../../lib/queries'
import { useAuth } from '../../lib/auth'
import { TopicForm } from '../../components/TopicForm'
import { Button, Card, EmptyState, ErrorAlert, StatusBadge, TextAreaField, cn, formatDate } from '../../components/ui'

export const Route = createFileRoute('/_auth/topics/$topicId')({
  params: {
    parse: (raw) => ({ topicId: Number(raw.topicId) }),
    stringify: (params) => ({ topicId: String(params.topicId) }),
  },
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(topicQuery(params.topicId)),
      context.queryClient.ensureQueryData(repliesQuery(params.topicId)),
    ]),
  errorComponent: TopicError,
  component: TopicPage,
})

function TopicError({ error }: ErrorComponentProps) {
  const notFound = error instanceof ApiError && error.status === 404
  const message = error instanceof Error ? error.message : String(error)
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="text-5xl font-bold text-zinc-700">{notFound ? '404' : 'Erro'}</p>
      <p className="mt-4 text-zinc-300">{message}</p>
      <Link to="/" className="mt-6 inline-block text-indigo-400 hover:underline">
        Voltar para os tópicos
      </Link>
    </div>
  )
}

function TopicPage() {
  const { topicId } = Route.useParams()
  const { data: topic } = useSuspenseQuery(topicQuery(topicId))
  const { data: replies } = useSuspenseQuery(repliesQuery(topicId))

  return (
    <div className="space-y-8">
      <TopicCard topic={topic} />
      <RepliesSection topic={topic} replies={replies} />
    </div>
  )
}

/** Hook que centraliza as mutações do tópico e a invalidação do cache. */
function useTopicMutations(topicId: number) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: topicKeys.all })

  return {
    update: useMutation({ mutationFn: (input: { title: string; message: string }) => api.topics.update(topicId, input), onSuccess: invalidate }),
    close: useMutation({ mutationFn: () => api.topics.close(topicId), onSuccess: invalidate }),
    solve: useMutation({ mutationFn: () => api.topics.solve(topicId), onSuccess: invalidate }),
    remove: useMutation({
      mutationFn: () => api.topics.remove(topicId),
      onSuccess: async () => {
        await invalidate()
        await navigate({ to: '/' })
      },
    }),
  }
}

function TopicCard({ topic }: { topic: Topic }) {
  const [editing, setEditing] = useState(false)
  const { user } = useAuth()
  const mutations = useTopicMutations(topic.id)

  const isClosed = topic.status === 'CLOSED'
  const actionError = mutations.close.error ?? mutations.solve.error ?? mutations.remove.error

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← Tópicos
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{topic.title}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            por <span className="text-zinc-200">{topic.authorName}</span> · criado em {formatDate(topic.createdAt)}
            {topic.updatedAt !== topic.createdAt && <> · editado em {formatDate(topic.updatedAt)}</>}
          </p>
        </div>
        <StatusBadge status={topic.status} />
      </div>

      {editing ? (
        <TopicForm
          initial={{ title: topic.title, message: topic.message }}
          submitLabel="Salvar"
          error={mutations.update.error}
          onCancel={() => setEditing(false)}
          onSubmit={(values) =>
            mutations.update
              .mutateAsync(values)
              .then(() => setEditing(false))
              .catch(() => undefined)
          }
        />
      ) : (
        <p className="whitespace-pre-wrap leading-relaxed text-zinc-200">{topic.message}</p>
      )}

      {!editing && (
        <div className="mt-6 border-t border-zinc-800 pt-4">
          <p className="mb-3 text-xs text-zinc-500">
            Ações permitidas ao autor, moderadores e administradores. Outros usuários recebem 403 da API.
            {user && ` Você está como ${user.email}.`}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setEditing(true)} disabled={isClosed}>
              Editar
            </Button>
            <Button
              variant="secondary"
              onClick={() => mutations.solve.mutate()}
              loading={mutations.solve.isPending}
              disabled={isClosed || topic.status === 'SOLVED'}
            >
              Marcar como resolvido
            </Button>
            <Button variant="secondary" onClick={() => mutations.close.mutate()} loading={mutations.close.isPending} disabled={isClosed}>
              Fechar tópico
            </Button>
            <Button
              variant="danger"
              className="ml-auto"
              loading={mutations.remove.isPending}
              onClick={() => {
                if (window.confirm('Apagar este tópico e todas as respostas?')) mutations.remove.mutate()
              }}
            >
              Apagar
            </Button>
          </div>
          <ErrorAlert error={actionError} className="mt-3" />
        </div>
      )}
    </Card>
  )
}

function RepliesSection({ topic, replies }: { topic: Topic; replies: Reply[] }) {
  const queryClient = useQueryClient()
  const isClosed = topic.status === 'CLOSED'

  const markSolution = useMutation({
    mutationFn: (replyId: number) => api.replies.markSolution(topic.id, replyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicKeys.all }),
  })

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold">
        Respostas <span className="text-sm font-normal text-zinc-500">({replies.length})</span>
      </h2>

      {replies.length === 0 ? (
        <EmptyState title="Ninguém respondeu ainda">Seja a primeira pessoa a ajudar.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {replies.map((reply) => (
            <li
              key={reply.id}
              className={cn(
                'rounded-2xl border p-5',
                reply.solution ? 'border-sky-500/40 bg-sky-500/5' : 'border-zinc-800 bg-zinc-900/40',
              )}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-zinc-400">
                  <span className="font-medium text-zinc-200">{reply.authorName}</span> · {formatDate(reply.createdAt)}
                </span>
                {reply.solution ? (
                  <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-xs font-medium text-sky-300 ring-1 ring-inset ring-sky-500/30">
                    ✓ Solução
                  </span>
                ) : (
                  <Button
                    variant="ghost"
                    className="text-xs"
                    disabled={isClosed}
                    loading={markSolution.isPending && markSolution.variables === reply.id}
                    onClick={() => markSolution.mutate(reply.id)}
                  >
                    Marcar como solução
                  </Button>
                )}
              </div>
              <p className="whitespace-pre-wrap text-zinc-200">{reply.message}</p>
            </li>
          ))}
        </ul>
      )}

      <ErrorAlert error={markSolution.error} className="mt-3" />

      <div className="mt-6">
        {isClosed ? (
          <p className="rounded-lg border border-zinc-800 px-4 py-3 text-sm text-zinc-400">
            Este tópico está fechado e não aceita novas respostas.
          </p>
        ) : (
          <ReplyForm topicId={topic.id} />
        )}
      </div>
    </section>
  )
}

function ReplyForm({ topicId }: { topicId: number }) {
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (message: string) => api.replies.create(topicId, { message }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: topicKeys.all }),
  })

  const form = useForm({
    defaultValues: { message: '' },
    onSubmit: async ({ value, formApi }) => {
      await create.mutateAsync(value.message.trim()).then(() => formApi.reset()).catch(() => undefined)
    },
  })

  return (
    <Card className="p-5">
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          void form.handleSubmit()
        }}
      >
        <form.Field name="message" validators={{ onChange: ({ value }) => (value.trim() ? undefined : 'Escreva uma resposta.') }}>
          {(field) => <TextAreaField field={field} label="Sua resposta" placeholder="Compartilhe o que sabe" />}
        </form.Field>

        <ErrorAlert error={create.error} />

        <div className="flex justify-end">
          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
                Responder
              </Button>
            )}
          </form.Subscribe>
        </div>
      </form>
    </Card>
  )
}
