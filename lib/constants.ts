export const LOAD_STATUS = {
  PENDING: 'pending',
  BOOKED: 'booked',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  DELAYED: 'delayed',
} as const

export type LoadStatus = typeof LOAD_STATUS[keyof typeof LOAD_STATUS]

export const LOAD_STATUS_LABELS: Record<LoadStatus, string> = {
  pending: 'Pendiente',
  booked: 'Reservado',
  picked_up: 'Recogido',
  delivered: 'Entregado',
  paid: 'Pagado',
  cancelled: 'Cancelada',
  delayed: 'Retrasada',
}

export const LOAD_STATUS_COLORS: Record<LoadStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  booked: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  picked_up: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  delayed: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
}

export const PAID_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
} as const

export type PaidStatus = typeof PAID_STATUS[keyof typeof PAID_STATUS]

// Transiciones de estados validas (para el dropdown en tabla)
export const LOAD_STATUS_TRANSITIONS: Partial<Record<LoadStatus, LoadStatus[]>> = {
  pending: ['booked'],
  booked: ['picked_up'],
  picked_up: ['delivered', 'delayed'],
  delayed: ['picked_up', 'cancelled'],
  delivered: ['paid'],
}
