export const LOAD_STATUS = {
  PENDING: 'pending',
  BOOKED: 'booked',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  PAID: 'paid',
} as const

export type LoadStatus = typeof LOAD_STATUS[keyof typeof LOAD_STATUS]

export const LOAD_STATUS_LABELS: Record<LoadStatus, string> = {
  pending: 'Pendiente',
  booked: 'Reservado',
  picked_up: 'Recogido',
  delivered: 'Entregado',
  paid: 'Pagado',
}

export const LOAD_STATUS_COLORS: Record<LoadStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  picked_up: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export const PAID_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
} as const

export type PaidStatus = typeof PAID_STATUS[keyof typeof PAID_STATUS]

// Orden de transición de estados (para el dropdown en tabla)
export const LOAD_STATUS_TRANSITIONS: Partial<Record<LoadStatus, LoadStatus>> = {
  pending: 'booked',
  booked: 'picked_up',
  picked_up: 'delivered',
  delivered: 'paid',
}
