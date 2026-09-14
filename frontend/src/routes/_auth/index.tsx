import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, createFileRoute, type SearchSchemaInput } from '@tanstack/react-router'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  type PaginationState,
  type SortingState,
} from '@tanstack/react-table'
import type { Topic, TopicsQuery } from '../../lib/api'
import { topicsListQuery } from '../../lib/queries'
import { Button, EmptyState, ErrorAlert, PageHeader, StatusBadge, cn, formatDate } from '../../components/ui'

const PAGE_SIZES = [5, 10, 20, 50]
const SORTABLE = ['createdAt', 'updatedAt', 'title', 'status'] as const

/**
 * Paginação e ordenação vivem na URL: recarregar, compartilhar e voltar funcionam.
 * SearchSchemaInput diz ao Router que, para navegar até aqui, todos os parâmetros são opcionais.
 */
function validateSearch(search: Partial<Record<keyof TopicsQuery, unknown>> & SearchSchemaInput): TopicsQuery {
  const page = Number(search.page)
  const size = Number(search.size)
  const sort = typeof search.sort === 'string' ? search.sort : ''
  const [field, direction] = sort.split(',')

  return {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    size: PAGE_SIZES.includes(size) ? size : 10,
    sort:
      (SORTABLE as readonly string[]).includes(field) && (direction === 'asc' || direction === 'desc')
        ? `${field},${direction}`
        : 'createdAt,desc',
  }
}

export const Route = createFileRoute('/_auth/')({
  validateSearch,
  loaderDeps: ({ search }) => search,
  // O loader pré-carrega no cache do Query; o componente lê do cache sem estado de loading inicial.
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(topicsListQuery(deps)),
  component: TopicsPage,
})

const columnHelper = createColumnHelper<Topic>()

const columns = [
  columnHelper.accessor('title', {
    header: 'Título',
    cell: (info) => (
      <Link
        to="/topics/$topicId"
        params={{ topicId: info.row.original.id }}
        className="font-medium text-zinc-100 hover:text-indigo-300"
      >
        {info.getValue()}
      </Link>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  columnHelper.accessor('authorName', {
    header: 'Autor',
    enableSorting: false,
    cell: (info) => <span className="text-zinc-300">{info.getValue()}</span>,
  }),
  columnHelper.accessor('createdAt', {
    header: 'Criado em',
    cell: (info) => <span className="tabular-nums text-zinc-400">{formatDate(info.getValue())}</span>,
  }),
  columnHelper.accessor('updatedAt', {
    header: 'Atualizado',
    cell: (info) => <span className="tabular-nums text-zinc-400">{formatDate(info.getValue())}</span>,
  }),
]

function TopicsPage() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const topics = useQuery(topicsListQuery(search))

  const [sortField, sortDirection] = search.sort.split(',')
  const sorting = useMemo<SortingState>(() => [{ id: sortField, desc: sortDirection === 'desc' }], [sortField, sortDirection])
  const pagination = useMemo<PaginationState>(() => ({ pageIndex: search.page, pageSize: search.size }), [search.page, search.size])

  const table = useReactTable({
    data: topics.data?.content ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    // Ordenação e paginação são feitas pela API (Pageable), não no navegador.
    manualSorting: true,
    manualPagination: true,
    pageCount: topics.data?.page.totalPages ?? -1,
    state: { sorting, pagination },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const [first] = next
      void navigate({
        search: (prev) => ({ ...prev, page: 0, sort: first ? `${first.id},${first.desc ? 'desc' : 'asc'}` : 'createdAt,desc' }),
      })
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater
      void navigate({ search: (prev) => ({ ...prev, page: next.pageIndex, size: next.pageSize }) })
    },
  })

  const pageInfo = topics.data?.page

  return (
    <>
      <PageHeader
        title="Tópicos"
        description={pageInfo ? `${pageInfo.totalElements} tópico(s) no fórum` : undefined}
        actions={
          <Link to="/topics/new">
            <Button>Novo tópico</Button>
          </Link>
        }
      />

      <ErrorAlert error={topics.error} className="mb-4" />

      {topics.data && topics.data.content.length === 0 ? (
        <EmptyState title="Nenhum tópico ainda">
          Crie o primeiro com o botão acima.
        </EmptyState>
      ) : (
        <div className={cn('overflow-x-auto rounded-2xl border border-zinc-800', topics.isPlaceholderData && 'opacity-60')}>
          <table className="w-full text-sm">
            <thead className="bg-zinc-900/80 text-left text-xs uppercase tracking-wide text-zinc-400">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()
                    return (
                      <th key={header.id} className="px-4 py-3 font-medium">
                        <button
                          type="button"
                          disabled={!canSort}
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn('inline-flex items-center gap-1', canSort && 'hover:text-zinc-100')}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === 'asc' && <span aria-label="crescente">▲</span>}
                          {sorted === 'desc' && <span aria-label="decrescente">▼</span>}
                        </button>
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-900/60">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-400">
            <label className="flex items-center gap-2">
              Por página
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2">
              <span className="tabular-nums">
                Página {pageInfo ? pageInfo.number + 1 : 1} de {Math.max(pageInfo?.totalPages ?? 1, 1)}
              </span>
              <Button variant="secondary" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Anterior
              </Button>
              <Button variant="secondary" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Próxima
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
