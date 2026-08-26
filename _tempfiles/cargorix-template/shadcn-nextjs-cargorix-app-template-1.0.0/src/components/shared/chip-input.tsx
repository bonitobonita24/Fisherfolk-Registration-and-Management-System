'use client'

// React Imports
import { useState } from 'react'

// Third-party Imports
import { ChevronDownIcon, XIcon } from 'lucide-react'

// Component Imports
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type ChipInputProps = {
  id?: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  suggestions?: string[]
  'aria-label'?: string
}

const ChipInput = ({ id, value, onChange, placeholder, suggestions, ...rest }: ChipInputProps) => {
  // States
  const [draft, setDraft] = useState('')

  const commitDraft = () => {
    const next = draft.trim()

    if (next && !value.includes(next)) onChange([...value, next])
    setDraft('')
  }

  const removeChip = (chip: string) => onChange(value.filter(v => v !== chip))

  const toggleSuggestion = (suggestion: string) => {
    if (value.includes(suggestion)) removeChip(suggestion)
    else onChange([...value, suggestion])
  }

  return (
    <div className='border-input flex min-h-8 w-full flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2.5 py-1 text-sm shadow-xs'>
      {value.map(chip => (
        <Badge key={chip} variant='secondary' className='gap-1 pr-1'>
          {chip}
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-4 rounded-full p-0 hover:bg-transparent'
            onClick={() => removeChip(chip)}
            aria-label={`Remove ${chip}`}
          >
            <XIcon className='size-3' />
          </Button>
        </Badge>
      ))}
      <Input
        id={id}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            commitDraft()
          } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
            removeChip(value[value.length - 1])
          }
        }}
        onBlur={commitDraft}
        placeholder={value.length === 0 ? placeholder : ''}
        className='h-auto min-w-24 flex-1 rounded-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0'
        {...rest}
      />
      {suggestions && suggestions.length > 0 && (
        <Popover>
          <PopoverTrigger
            render={
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='size-6 shrink-0'
                aria-label='Choose from suggestions'
              />
            }
          >
            <ChevronDownIcon className='size-4' />
          </PopoverTrigger>
          <PopoverContent align='end' className='w-48 p-1'>
            {suggestions.map(suggestion => (
              <Button
                key={suggestion}
                type='button'
                variant='ghost'
                className='w-full justify-start font-normal'
                onClick={() => toggleSuggestion(suggestion)}
              >
                {value.includes(suggestion) ? `✓ ${suggestion}` : suggestion}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}

export default ChipInput
