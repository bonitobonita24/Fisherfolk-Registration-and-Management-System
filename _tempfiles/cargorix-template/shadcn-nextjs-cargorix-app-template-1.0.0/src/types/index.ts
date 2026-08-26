export type ExportCell = string | number

export type ExportTable = {
  headers: string[]
  rows: ExportCell[][]
}
