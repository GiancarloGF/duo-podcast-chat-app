import * as React from 'react'

import { cn } from '@/shared/presentation/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-2 border-border h-10 w-full min-w-0 rounded-[6px] bg-input px-3 py-1 text-base shadow-[4px_4px_0_0_var(--color-border)] transition-[color,box-shadow,transform] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'aria-invalid:ring-2 aria-invalid:ring-destructive aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
