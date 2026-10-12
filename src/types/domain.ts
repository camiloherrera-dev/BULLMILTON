// Modelo de dominio del frontend. Los montos son enteros en la unidad mínima (COP).

export type Role = 'owner' | 'member'
export type CategoryKind = 'expense' | 'income'
export type SplitType = 'equal' | 'percentage'
export type RecordStatus = 'active' | 'voided'
export type Frequency = 'monthly' | 'quarterly'

export interface Member {
  userId: string
  displayName: string
  role: Role
  joinedAt: string
  active: boolean
}

export interface Household {
  id: string
  name: string
  currency: string
}

export interface Category {
  id: string
  kind: CategoryKind
  name: string
  icon: string | null
  archivedAt: string | null
}

export interface Audit {
  createdBy: string | null
  createdAt: string
  updatedBy: string | null
  updatedAt: string
}

export interface ExpenseSplit {
  userId: string
  shareBp: number
  amount: number
}

export interface Expense extends Audit {
  kind: 'expense'
  id: string
  description: string
  amount: number
  currency: string
  date: string
  categoryId: string
  paidBy: string
  splitType: SplitType
  splits: ExpenseSplit[]
  notes: string | null
  status: RecordStatus
  recurringExpenseId: string | null
}

export interface Income extends Audit {
  kind: 'income'
  id: string
  userId: string
  source: string
  amount: number
  currency: string
  date: string
  categoryId: string | null
  notes: string | null
  status: RecordStatus
}

export interface Transfer extends Audit {
  kind: 'transfer'
  id: string
  fromUser: string
  toUser: string
  amount: number
  currency: string
  date: string
  notes: string | null
  status: RecordStatus
}

export type Movement = Expense | Income | Transfer
export type MovementKind = Movement['kind']

export interface RecurringSplit {
  userId: string
  shareBp: number
}

export interface RecurringExpense extends Audit {
  id: string
  name: string
  amount: number
  currency: string
  frequency: Frequency
  nextDueDate: string
  categoryId: string
  paidBy: string
  splitType: SplitType
  splits: RecurringSplit[]
  notes: string | null
  active: boolean
}

/** División pedida al crear/editar: participantes (iguales) o porcentajes en puntos básicos. */
export type SplitInput =
  { type: 'equal'; participants: string[] } | { type: 'percentage'; shares: RecurringSplit[] }
