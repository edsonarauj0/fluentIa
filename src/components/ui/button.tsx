import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-extrabold uppercase tracking-wide ' +
    'transition-all duration-100 select-none ' +
    'active:translate-y-1 active:shadow-none ' +
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 ' +
    'disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:   'bg-brand-500 text-white shadow-chunky hover:bg-brand-600',
        secondary: 'bg-white text-brand-600 border-2 border-brand-100 shadow-chunky-neutral hover:bg-brand-50',
        outline:   'bg-white text-navy-900 border-2 border-brand-100 shadow-chunky-neutral hover:bg-brand-50',
        success:   'bg-success text-white shadow-chunky-success hover:brightness-105',
        danger:    'bg-danger text-white shadow-chunky-danger hover:brightness-105',
        ghost:     'bg-transparent text-brand-600 shadow-none active:translate-y-0 hover:bg-brand-100',
        mico:      'bg-mico text-navy-900 shadow-chunky-mico hover:brightness-105',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-11 px-5 text-sm',
        lg: 'h-14 px-7 text-base',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
