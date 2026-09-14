import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

/**
 * Layout "pathless": tudo que estiver em routes/_auth/ exige autenticação.
 * O guard roda antes do loader, então nenhuma chamada à API acontece sem token.
 */
export const Route = createFileRoute('/_auth')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated()) {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: () => <Outlet />,
})
