/**
 * The subset of DSH's page-level UI primitives this plugin uses.
 *
 * The module is a platform seed: the page module table already carries it, and
 * the Host's client-modules graph treats it as a static dependency. It has no
 * installable type package for third-party plugins, so this local declaration
 * is the contract. Keep it in sync with the components actually used in
 * `src/client`.
 */
declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ButtonHTMLAttributes, ComponentType, InputHTMLAttributes, ReactNode } from 'react'

  export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'ghost' | 'text'
    size?: 'sm' | 'md'
    icon?: ReactNode
  }

  export const Button: ComponentType<ButtonProps>

  export interface ModalProps {
    open: boolean
    title?: ReactNode
    description?: ReactNode
    closeLabel?: string
    onClose?: () => void
    footer?: ReactNode
    className?: string
    contentClassName?: string
    headless?: boolean
    backdropBlur?: boolean
    children?: ReactNode
  }

  export const Modal: ComponentType<ModalProps>

  export interface ToastProps {
    text: ReactNode
    icon?: ReactNode
    tone?: 'success' | 'error' | 'info'
    anchor?: HTMLElement | null
    holdMs?: number
    onDone?: () => void
  }

  export const Toast: ComponentType<ToastProps>

  export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: ReactNode
  }

  export const Input: ComponentType<InputProps>

  export interface CheckboxProps {
    checked?: boolean
    disabled?: boolean
    label?: ReactNode
    title?: string
    className?: string
    onChange?: (checked: boolean) => void
  }

  export const Checkbox: ComponentType<CheckboxProps>

  export interface SegmentedTabItem {
    value: string
    label: ReactNode
    id?: string
    panelId?: string
  }

  export interface SegmentedTabsProps {
    value: string
    items: SegmentedTabItem[]
    label?: string
    className?: string
    onChange: (value: string) => void
  }

  export const SegmentedTabs: ComponentType<SegmentedTabsProps>

  export interface TagProps {
    tone?: 'outline' | 'neutral' | 'info' | 'danger'
    className?: string
    children?: ReactNode
  }

  export const Tag: ComponentType<TagProps>

  export interface StateDotProps {
    state?: 'ongoing' | 'done' | 'idle' | 'warning' | 'error'
    className?: string
  }

  export const StateDot: ComponentType<StateDotProps>

  export interface TooltipProps {
    label: ReactNode
    children: ReactNode
    side?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
    delayMs?: number
    portal?: boolean
    className?: string
  }

  export const Tooltip: ComponentType<TooltipProps>

  export interface IconProps {
    size?: number
    className?: string
  }

  export const IconArchiveOutlineRegular: ComponentType<IconProps>
  export const IconCheckOutlineRegular: ComponentType<IconProps>
  export const IconChevronLeftOutlineRegular: ComponentType<IconProps>
  export const IconChevronRightOutlineRegular: ComponentType<IconProps>
  export const IconCloseOutlineRegular: ComponentType<IconProps>
  export const IconLoadingOutlineRegular: ComponentType<IconProps>
  export const IconRefreshOutlineRegular: ComponentType<IconProps>
  export const IconSearchOutlineRegular: ComponentType<IconProps>
  export const IconTrashOutlineRegular: ComponentType<IconProps>
  export const IconUnarchiveOutlineRegular: ComponentType<IconProps>
  export const IconWarningTriangleOutlineRegular: ComponentType<IconProps>
}
