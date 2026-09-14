import { useEffect } from 'react'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import { Link, Outlet, createRootRouteWithContext, useLocation, useNavigate } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { auth, useAuth, type Auth } from '../lib/auth'
import { healthQuery } from '../lib/queries'
import { Button, cn } from '../components/ui'

export type RouterContext = {
  queryClient: QueryClient
  auth: Auth
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Se a API responder 401 (token expirado), o store zera o token e voltamos ao login.
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login') {
      void navigate({ to: '/login', search: { redirect: location.href } })
    }
  }, [isAuthenticated, location.pathname, location.href, navigate])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-7 place-items-center rounded-lg bg-indigo-500 text-sm text-white">F</span>
            ForumHub
          </Link>

          <div className="flex items-center gap-3 text-sm">
            <HealthIndicator />
            {isAuthenticated && user && (
              <>
                <span className="hidden text-zinc-400 sm:inline" title={`Sessão expira em ${user.expiresAt.toLocaleTimeString('pt-BR')}`}>
                  {user.email}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => {
                    auth.logout()
                    void navigate({ to: '/login' })
                  }}
                >
                  Sair
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <TanStackRouterDevtools position="bottom-right" />
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </div>
  )
}

/** Consome GET /api/v1/health a cada 15s e mostra se a API está no ar. */
function HealthIndicator() {
  const health = useQuery(healthQuery)
  const up = health.data?.status === 'UP'

  return (
    <span className="flex items-center gap-1.5 text-xs text-zinc-400" title={health.error ? String(health.error) : health.data?.application}>
      <span className={cn('size-2 rounded-full', health.isPending ? 'bg-zinc-500' : up ? 'bg-emerald-400' : 'bg-red-400')} />
      {health.isPending ? 'verificando' : up ? 'API online' : 'API offline'}
    </span>
  )
}

function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl font-bold text-zinc-700">404</p>
      <p className="mt-4 text-zinc-300">Essa página não existe.</p>
      <Link to="/" className="mt-6 inline-block text-indigo-400 hover:underline">
        Voltar para os tópicos
      </Link>
    </div>
  )
}
