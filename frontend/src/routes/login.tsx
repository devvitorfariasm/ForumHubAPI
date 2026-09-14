import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { createFileRoute, redirect, useNavigate, type SearchSchemaInput } from '@tanstack/react-router'
import { api, type AuthResponse } from '../lib/api'
import { auth } from '../lib/auth'
import { Button, Card, ErrorAlert, TextField, cn } from '../components/ui'

export const Route = createFileRoute('/login')({
  validateSearch: (search: { redirect?: unknown } & SearchSchemaInput) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  // Quem já está logado não precisa ver o login.
  beforeLoad: ({ context, search }) => {
    if (context.auth.isAuthenticated()) throw redirect({ href: search.redirect ?? '/' })
  },
  component: LoginPage,
})

type Mode = 'login' | 'register'

function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const { redirect: redirectTo } = Route.useSearch()
  const navigate = useNavigate()

  const onAuthenticated = (response: AuthResponse) => {
    auth.login(response.token)
    void navigate({ href: redirectTo ?? '/' })
  }

  const login = useMutation({ mutationFn: api.auth.login, onSuccess: onAuthenticated })
  const register = useMutation({ mutationFn: api.auth.register, onSuccess: onAuthenticated })

  return (
    <div className="mx-auto max-w-md pt-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo ao ForumHub</h1>
        <p className="mt-1 text-sm text-zinc-400">Entre ou crie uma conta para participar das discussões.</p>
      </div>

      <Card>
        <div className="mb-6 grid grid-cols-2 rounded-lg bg-zinc-800 p-1 text-sm">
          {(['login', 'register'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={cn(
                'rounded-md py-1.5 font-medium transition-colors',
                mode === option ? 'bg-zinc-950 text-white shadow' : 'text-zinc-400 hover:text-zinc-200',
              )}
            >
              {option === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        {mode === 'login' ? (
          <LoginForm onSubmit={(values) => login.mutateAsync(values)} error={login.error} />
        ) : (
          <RegisterForm onSubmit={(values) => register.mutateAsync(values)} error={register.error} />
        )}
      </Card>
    </div>
  )
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? undefined : 'Informe um e-mail válido.'
}

function LoginForm({ onSubmit, error }: { onSubmit: (v: { email: string; password: string }) => Promise<unknown>; error: unknown }) {
  const form = useForm({
    defaultValues: { email: '', password: '' },
    onSubmit: async ({ value }) => {
      await onSubmit(value).catch(() => undefined) // o erro já é exibido pelo ErrorAlert
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field name="email" validators={{ onChange: ({ value }) => validateEmail(value) }}>
        {(field) => <TextField field={field} label="E-mail" type="email" autoComplete="email" placeholder="voce@example.com" />}
      </form.Field>

      <form.Field name="password" validators={{ onChange: ({ value }) => (value ? undefined : 'Informe a senha.') }}>
        {(field) => <TextField field={field} label="Senha" type="password" autoComplete="current-password" />}
      </form.Field>

      <ErrorAlert error={error} />

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" className="w-full" disabled={!canSubmit} loading={isSubmitting}>
            Entrar
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}

function RegisterForm({
  onSubmit,
  error,
}: {
  onSubmit: (v: { name: string; email: string; password: string }) => Promise<unknown>
  error: unknown
}) {
  const form = useForm({
    defaultValues: { name: '', email: '', password: '' },
    onSubmit: async ({ value }) => {
      await onSubmit(value).catch(() => undefined)
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }) => (value.trim().length >= 2 ? undefined : 'Informe seu nome.'),
        }}
      >
        {(field) => <TextField field={field} label="Nome" autoComplete="name" placeholder="Maria Silva" maxLength={120} />}
      </form.Field>

      <form.Field name="email" validators={{ onChange: ({ value }) => validateEmail(value) }}>
        {(field) => <TextField field={field} label="E-mail" type="email" autoComplete="email" placeholder="voce@example.com" />}
      </form.Field>

      <form.Field
        name="password"
        validators={{
          onChange: ({ value }) => (value.length >= 8 ? undefined : 'A senha precisa ter pelo menos 8 caracteres.'),
        }}
      >
        {(field) => <TextField field={field} label="Senha" type="password" autoComplete="new-password" />}
      </form.Field>

      <ErrorAlert error={error} />

      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting] as const}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" className="w-full" disabled={!canSubmit} loading={isSubmitting}>
            Criar conta
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
