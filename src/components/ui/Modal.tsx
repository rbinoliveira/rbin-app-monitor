'use client'

import { Fragment, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, children, className }: ModalProps) {
  if (!open) return null

  return (
    <Fragment>
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'relative max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl bg-white p-6 shadow-xl',
            className,
          )}
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      </div>
    </Fragment>
  )
}

export function ModalHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function ModalTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-lg font-semibold text-gray-900', className)}
      {...props}
    >
      {children}
    </h2>
  )
}

export function ModalDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('mt-1 text-sm text-gray-500', className)} {...props}>
      {children}
    </p>
  )
}

export function ModalContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

export function ModalFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-6 flex justify-end gap-3', className)} {...props}>
      {children}
    </div>
  )
}
