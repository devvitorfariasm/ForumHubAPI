import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { api, type TopicsQuery } from './api'

/** Chaves hierárquicas: invalidar ['topics'] atualiza lista, detalhes e respostas de uma vez. */
export const topicKeys = {
  all: ['topics'] as const,
  list: (query: TopicsQuery) => ['topics', 'list', query] as const,
  detail: (id: number) => ['topics', 'detail', id] as const,
  replies: (id: number) => ['topics', 'detail', id, 'replies'] as const,
}

export const healthQuery = queryOptions({
  queryKey: ['health'],
  queryFn: api.health,
  refetchInterval: 15_000,
  retry: false,
})

export const topicsListQuery = (query: TopicsQuery) =>
  queryOptions({
    queryKey: topicKeys.list(query),
    queryFn: () => api.topics.list(query),
    // Mantém a página anterior visível enquanto a próxima carrega (paginação sem "piscar").
    placeholderData: keepPreviousData,
  })

export const topicQuery = (id: number) =>
  queryOptions({
    queryKey: topicKeys.detail(id),
    queryFn: () => api.topics.get(id),
  })

export const repliesQuery = (topicId: number) =>
  queryOptions({
    queryKey: topicKeys.replies(topicId),
    queryFn: () => api.replies.list(topicId),
  })
