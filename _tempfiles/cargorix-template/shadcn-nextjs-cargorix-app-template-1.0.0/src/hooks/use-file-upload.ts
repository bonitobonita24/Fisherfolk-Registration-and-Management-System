'use client'

// React Imports
import { useCallback, useRef, useState } from 'react'

export type FileMetadata = {
  id: string
  name: string
  size: number
  type: string
  url: string
}

export type FileWithPreview = {
  id: string
  file: File | FileMetadata
  preview?: string
}

type FileUploadOptions = {
  maxFiles?: number
  maxSize?: number
  accept?: string
  multiple?: boolean
  initialFiles?: FileMetadata[]
  onFilesChange?: (files: FileWithPreview[]) => void
  onFilesAdded?: (addedFiles: FileWithPreview[]) => void
}

type FileUploadState = {
  files: FileWithPreview[]
  isDragging: boolean
  errors: string[]
}

type FileUploadActions = {
  addFiles: (files: FileList | File[]) => void
  removeFile: (id: string) => void
  clearFiles: () => void
  clearErrors: () => void
  handleDragEnter: (e: React.DragEvent<HTMLElement>) => void
  handleDragLeave: (e: React.DragEvent<HTMLElement>) => void
  handleDragOver: (e: React.DragEvent<HTMLElement>) => void
  handleDrop: (e: React.DragEvent<HTMLElement>) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  openFileDialog: () => void
  getInputProps: (
    props?: React.InputHTMLAttributes<HTMLInputElement>
  ) => React.InputHTMLAttributes<HTMLInputElement> & { ref: React.RefObject<HTMLInputElement | null> }
}

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'

  const units = ['Bytes', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent

  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`
}

const isFileMetadata = (file: File | FileMetadata): file is FileMetadata => 'url' in file

export function useFileUpload(options: FileUploadOptions = {}): [FileUploadState, FileUploadActions] {
  const {
    maxFiles = 1,
    maxSize = Infinity,
    accept,
    multiple = false,
    initialFiles = [],
    onFilesChange,
    onFilesAdded
  } = options

  const [files, setFiles] = useState<FileWithPreview[]>(() =>
    initialFiles.map(meta => ({ id: meta.id, file: meta, preview: meta.url }))
  )

  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const notify = useCallback(
    (next: FileWithPreview[]) => {
      setFiles(next)
      onFilesChange?.(next)
    },
    [onFilesChange]
  )

  const validate = useCallback(
    (file: File) => {
      if (accept) {
        const patterns = accept.split(',').map(pattern => pattern.trim())

        const matches = patterns.some(pattern => {
          if (pattern.startsWith('.')) return file.name.toLowerCase().endsWith(pattern.toLowerCase())
          if (pattern.endsWith('/*')) return file.type.startsWith(pattern.replace('/*', '/'))

          return file.type === pattern
        })

        if (!matches) return `"${file.name}" is not an accepted file type`
      }

      if (file.size > maxSize) return `"${file.name}" exceeds the ${formatBytes(maxSize)} limit`

      return null
    },
    [accept, maxSize]
  )

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const incomingArray = Array.from(incoming)
      const nextErrors: string[] = []
      const accepted: FileWithPreview[] = []

      for (const file of incomingArray) {
        if (files.length + accepted.length >= maxFiles) {
          nextErrors.push(`You can only upload up to ${maxFiles} file${maxFiles === 1 ? '' : 's'}`)
          break
        }

        const error = validate(file)

        if (error) {
          nextErrors.push(error)
          continue
        }

        accepted.push({
          id: crypto.randomUUID(),
          file,
          preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        })
      }

      if (accepted.length > 0) {
        const next = multiple ? [...files, ...accepted] : accepted.slice(0, 1)

        notify(next)
        onFilesAdded?.(accepted)
      }

      setErrors(nextErrors)
    },
    [files, maxFiles, multiple, notify, onFilesAdded, validate]
  )

  const removeFile = useCallback(
    (id: string) => {
      const target = files.find(f => f.id === id)

      if (target?.preview && !isFileMetadata(target.file)) URL.revokeObjectURL(target.preview)
      notify(files.filter(f => f.id !== id))
    },
    [files, notify]
  )

  const clearFiles = useCallback(() => {
    files.forEach(f => {
      if (f.preview && !isFileMetadata(f.file)) URL.revokeObjectURL(f.preview)
    })
    notify([])
  }, [files, notify])

  const clearErrors = useCallback(() => setErrors([]), [])

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
    },
    [addFiles]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) addFiles(e.target.files)
      e.target.value = ''
    },
    [addFiles]
  )

  const openFileDialog = useCallback(() => inputRef.current?.click(), [])

  const getInputProps = useCallback(
    (props: React.InputHTMLAttributes<HTMLInputElement> = {}) => ({
      ...props,
      ref: inputRef,
      type: 'file' as const,
      accept,
      multiple,
      onChange: handleFileChange
    }),
    [accept, multiple, handleFileChange]
  )

  return [
    { files, isDragging, errors },
    {
      addFiles,
      removeFile,
      clearFiles,
      clearErrors,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      handleFileChange,
      openFileDialog,
      getInputProps
    }
  ]
}
