import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { api } from '../../lib/api'
import { topicKeys } from '../../lib/queries'
import { TopicForm } from '../../components/TopicForm'
import { Card, PageHeader } from '../../components/ui'

export const Route = createFileRoute('/_auth/topics/new')({
  component: NewTopicPage,
})

function NewTopicPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const create = useMutation({
    mutationFn: api.topics.create,
    onSuccess: async (topic) => {
      await queryClient.invalidateQueries({ queryKey: topicKeys.all })
      await navigate({ to: '/topics/$topicId', params: { topicId: topic.id } })
    },
  })

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Novo tópico" description="Título e mensagem são obrigatórios. Tópicos duplicados são recusados pela API (409)." />
      <Card>
        <TopicForm
          submitLabel="Publicar"
          error={create.error}
          onSubmit={(values) => create.mutateAsync(values).catch(() => undefined)}
          onCancel={() => void navigate({ to: '/' })}
        />
      </Card>
      <p className="mt-4 text-center text-sm text-zinc-500">
        <Link to="/" className="hover:text-zinc-300">
          Voltar para a lista
        </Link>
      </p>
    </div>
  )
}
