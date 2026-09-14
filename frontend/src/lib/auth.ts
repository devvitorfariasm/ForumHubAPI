import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'forumhub.token'

type Listener = () => void

const listeners = new Set<Listener>()
let token: string | null = readStoredToken()

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function emit() {
  listeners.forEach((listener) => listener())
}

export type AuthUser = {
  email: string
  expiresAt: Date
}

/** Decodifica o payload do JWT (sem validar assinatura: isso é papel da API). */
function decode(jwt: string): AuthUser | null {
  try {
    const base64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded)) as { sub: string; exp: number }
    return { email: payload.sub, expiresAt: new Date(payload.exp * 1000) }
  } catch {
    return null
  }
}

function isValid(jwt: string | null): boolean {
  const user = jwt ? decode(jwt) : null
  return user !== null && user.expiresAt.getTime() > Date.now()
}

/** Store mínimo de autenticação. É passado no contexto do TanStack Router para os guards. */
export const auth = {
  getToken: () => token,
  getUser: () => (token ? decode(token) : null),
  isAuthenticated: () => isValid(token),
  login(newToken: string) {
    token = newToken
    try {
      localStorage.setItem(STORAGE_KEY, newToken)
    } catch {
      // localStorage indisponível: o token vive só em memória.
    }
    emit()
  },
  logout() {
    token = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignorado
    }
    emit()
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export type Auth = typeof auth

/** Hook reativo: re-renderiza quando o token muda (login, logout, expiração detectada). */
export function useAuth() {
  const current = useSyncExternalStore(auth.subscribe, () => token)
  return {
    token: current,
    user: current ? decode(current) : null,
    isAuthenticated: isValid(current),
  }
}
