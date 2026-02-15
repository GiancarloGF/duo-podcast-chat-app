import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/presentation/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-[6px] border-2 border-border px-2 py-0.2 text-[11px] font-bold uppercase tracking-wide w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-[color,box-shadow] overflow-hidden shadow-[2px_2px_0_0_var(--color-border)]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground [a&]:hover:brightness-95',
        secondary:
          'bg-secondary text-secondary-foreground [a&]:hover:brightness-95',
        destructive:
          'bg-destructive text-white [a&]:hover:brightness-95',
        outline: 'bg-card text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
