import { auth } from './auth'

// ---- Tipos espelhando os DTOs da API ---------------------------------------

export type FieldError = { field: string; message: string }

export type ApiErrorBody = {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fields: FieldError[]
}

export class ApiError extends Error {
  readonly status: number
  readonly fields: FieldError[]

  constructor(status: number, message: string, fields: FieldError[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

export type TopicStatus = 'OPEN' | 'SOLVED' | 'CLOSED'

export type Topic = {
  id: number
  title: string
  message: string
  status: TopicStatus
  authorId: number
  authorName: string
  createdAt: string
  updatedAt: string
}

export type Reply = {
  id: number
  message: string
  solution: boolean
  topicId: number
  authorId: number
  authorName: string
  createdAt: string
  updatedAt: string
}

export type Page<T> = {
  content: T[]
  page: { size: number; number: number; totalElements: number; totalPages: number }
}

export type AuthResponse = { token: string; type: string; expiresInSeconds: number }
export type Health = { application: string; status: string }

export type RegisterInput = { name: string; email: string; password: string }
export type LoginInput = { email: string; password: string }
export type TopicInput = { title: string; message: string }
export type ReplyInput = { message: string }
export type TopicsQuery = { page: number; size: number; sort: string }

// ---- Cliente HTTP ------------------------------------------------------------

const BASE_URL = '/api/v1'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')

  const token = auth.getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers })

  if (response.status === 204) return undefined as T

  const text = await response.text()
  const body: unknown = text ? JSON.parse(text) : undefined

  if (!response.ok) {
    // Token expirado ou inválido em rota protegida: derruba a sessão local.
    if (response.status === 401 && token && !path.startsWith('/auth/')) auth.logout()

    const error = body as Partial<ApiErrorBody> | undefined
    throw new ApiError(response.status, error?.message ?? `Erro HTTP ${response.status}`, error?.fields ?? [])
  }

  return body as T
}

function json(body: unknown): RequestInit {
  return { body: JSON.stringify(body) }
}

// ---- Endpoints (um método por rota da API) -----------------------------------

export const api = {
  health: () => request<Health>('/health'),

  auth: {
    register: (input: RegisterInput) => request<AuthResponse>('/auth/register', { method: 'POST', ...json(input) }),
    login: (input: LoginInput) => request<AuthResponse>('/auth/login', { method: 'POST', ...json(input) }),
  },

  topics: {
    list: ({ page, size, sort }: TopicsQuery) =>
      request<Page<Topic>>(`/topics?page=${page}&size=${size}&sort=${encodeURIComponent(sort)}`),
    get: (id: number) => request<Topic>(`/topics/${id}`),
    create: (input: TopicInput) => request<Topic>('/topics', { method: 'POST', ...json(input) }),
    update: (id: number, input: TopicInput) => request<Topic>(`/topics/${id}`, { method: 'PUT', ...json(input) }),
    remove: (id: number) => request<void>(`/topics/${id}`, { method: 'DELETE' }),
    close: (id: number) => request<Topic>(`/topics/${id}/close`, { method: 'PATCH' }),
    solve: (id: number) => request<Topic>(`/topics/${id}/solve`, { method: 'PATCH' }),
  },

  replies: {
    list: (topicId: number) => request<Reply[]>(`/topics/${topicId}/replies`),
    create: (topicId: number, input: ReplyInput) =>
      request<Reply>(`/topics/${topicId}/replies`, { method: 'POST', ...json(input) }),
    markSolution: (topicId: number, replyId: number) =>
      request<Reply>(`/topics/${topicId}/replies/${replyId}/solution`, { method: 'PATCH' }),
  },
}
