import type { AnyFieldApi } from '@tanstack/react-form'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'
import { ApiError, type TopicStatus } from '../lib/api'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

// ---- Botões ------------------------------------------------------------------

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variants: Record<Variant, string> = {
  primary: 'bg-indigo-500 text-white hover:bg-indigo-400 disabled:bg-indigo-500/40',
  secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 disabled:bg-zinc-800/50 disabled:text-zinc-500',
  danger: 'bg-red-500/90 text-white hover:bg-red-400 disabled:bg-red-500/40',
  ghost: 'text-zinc-300 hover:bg-zinc-800 disabled:text-zinc-600',
}

export function Button({
  variant = 'primary',
  className,
  loading,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed',
        variants[variant],
        className,
      )}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  )
}

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ---- Layout ------------------------------------------------------------------

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg shadow-black/20', className)}>
      {children}
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
      <p className="font-medium text-zinc-200">{title}</p>
      {children && <div className="mt-2 text-sm text-zinc-400">{children}</div>}
    </div>
  )
}

// ---- Status ------------------------------------------------------------------

const statusStyles: Record<TopicStatus, string> = {
  OPEN: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  SOLVED: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  CLOSED: 'bg-zinc-500/15 text-zinc-300 ring-zinc-500/30',
}

const statusLabels: Record<TopicStatus, string> = {
  OPEN: 'Aberto',
  SOLVED: 'Resolvido',
  CLOSED: 'Fechado',
}

export function StatusBadge({ status }: { status: TopicStatus }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', statusStyles[status])}>
      {statusLabels[status]}
    </span>
  )
}

// ---- Erros da API ---------------------------------------------------------------

export function ErrorAlert({ error, className }: { error: unknown; className?: string }) {
  if (!error) return null

  const message = error instanceof Error ? error.message : String(error)
  const fields = error instanceof ApiError ? error.fields : []
  const status = error instanceof ApiError ? error.status : undefined

  return (
    <div role="alert" className={cn('rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200', className)}>
      <p className="font-medium">
        {status && <span className="mr-2 rounded bg-red-500/20 px-1.5 py-0.5 font-mono text-xs">{status}</span>}
        {message}
      </p>
      {fields.length > 0 && (
        <ul className="mt-2 list-disc space-y-0.5 pl-5 text-red-300/90">
          {fields.map((field) => (
            <li key={`${field.field}-${field.message}`}>
              <span className="font-mono text-xs">{field.field}</span>: {field.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---- Campos integrados ao TanStack Form -------------------------------------------

const inputClass =
  'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 disabled:opacity-60 aria-[invalid=true]:border-red-500'

function FieldErrors({ field }: { field: AnyFieldApi }) {
  if (!field.state.meta.isTouched || field.state.meta.errors.length === 0) return null
  return (
    <p className="mt-1 text-xs text-red-400">
      {field.state.meta.errors.map((e) => (typeof e === 'string' ? e : JSON.stringify(e))).join(', ')}
    </p>
  )
}

function hasError(field: AnyFieldApi) {
  return field.state.meta.isTouched && field.state.meta.errors.length > 0
}

export function TextField({
  field,
  label,
  ...props
}: { field: AnyFieldApi; label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onBlur'>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-300">{label}</span>
      <input
        {...props}
        id={field.name}
        name={field.name}
        value={field.state.value as string}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={hasError(field)}
        className={inputClass}
      />
      <FieldErrors field={field} />
    </label>
  )
}

export function TextAreaField({
  field,
  label,
  ...props
}: { field: AnyFieldApi; label: string } & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange' | 'onBlur'>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-300">{label}</span>
      <textarea
        {...props}
        id={field.name}
        name={field.name}
        value={field.state.value as string}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={hasError(field)}
        className={cn(inputClass, 'min-h-28 resize-y')}
      />
      <FieldErrors field={field} />
    </label>
  )
}

// ---- Utilidades ---------------------------------------------------------------

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

export function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso))
}
