// Type Imports
import type { ExportCell, ExportTable } from '@/types'

const toText = (cell: ExportCell) => (typeof cell === 'number' ? String(cell) : cell)

const escapeCsvCell = (cell: ExportCell) => `"${toText(cell).replace(/"/g, '""')}"`

const escapeHtml = (cell: ExportCell) =>
  toText(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export const toCsv = ({ headers, rows }: ExportTable): string =>
  [headers.map(escapeCsvCell).join(','), ...rows.map(row => row.map(escapeCsvCell).join(','))].join('\n')

export const toTsv = ({ headers, rows }: ExportTable): string =>
  [headers, ...rows].map(row => row.map(cell => toText(cell).replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n')

export const downloadCsv = (table: ExportTable, filename: string) => {
  const blob = new Blob(['﻿', toCsv(table)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export const copyTable = async (table: ExportTable) => {
  const text = toTsv(table)

  try {
    await navigator.clipboard.writeText(text)

    return true
  } catch {
    const area = document.createElement('textarea')

    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()

    const copied = document.execCommand('copy')

    area.remove()

    return copied
  }
}

const buildPrintHtml = ({ headers, rows }: ExportTable, title: string) => `<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
*{box-sizing:border-box}
body{font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#18181b;margin:32px}
h1{font-size:18px;margin:0 0 4px}
p{font-size:12px;color:#71717a;margin:0 0 20px}
table{width:100%;border-collapse:collapse;font-size:11px}
thead{display:table-header-group}
tr{page-break-inside:avoid}
th,td{border:1px solid #e4e4e7;padding:6px 8px;text-align:left;vertical-align:top}
th{background:#f4f4f5;font-weight:600;white-space:nowrap}
tbody tr:nth-child(even){background:#fafafa}
@page{margin:14mm}
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<p>${rows.length} record${rows.length === 1 ? '' : 's'}</p>
<table><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
<tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
</table></body></html>`

export const printTable = (table: ExportTable, title: string) => {
  const frame = document.createElement('iframe')

  frame.setAttribute('aria-hidden', 'true')
  frame.style.position = 'fixed'
  frame.style.right = '0'
  frame.style.bottom = '0'
  frame.style.width = '0'
  frame.style.height = '0'
  frame.style.border = '0'
  document.body.appendChild(frame)

  const doc = frame.contentWindow?.document

  if (!doc) {
    frame.remove()

    return false
  }

  doc.open()
  doc.write(buildPrintHtml(table, title))
  doc.close()

  const cleanup = () => frame.remove()

  frame.contentWindow?.addEventListener('afterprint', cleanup)
  frame.contentWindow?.focus()
  frame.contentWindow?.print()
  setTimeout(cleanup, 60000)

  return true
}
