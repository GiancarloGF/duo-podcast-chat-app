import * as React from 'react'

import { cn } from '@/shared/presentation/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-2 border-border placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:ring-2 aria-invalid:ring-destructive aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-[6px] bg-input px-3 py-2 text-base shadow-[4px_4px_0_0_var(--color-border)] transition-[color,box-shadow,transform] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
