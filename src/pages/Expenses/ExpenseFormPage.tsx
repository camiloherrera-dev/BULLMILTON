import { useMemo } from 'react'
import { useParams } from 'react-router'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useHousehold } from '../../app/household-context'
import { useGoBack } from '../../hooks/useGoBack'
import { invalidateData } from '../../hooks/useResource'
import { todayBogota } from '../../lib/dates'
import { toUserMessage } from '../../lib/errors'
import { formatMoneyInput, parseMoneyInput } from '../../lib/money'
import { expenseSchema, type ExpenseFormValues } from '../../lib/validation/movements'
import { createExpense, updateExpense, voidExpense } from '../../services/movements'
import type { Expense } from '../../types/domain'
import { CategoryPicker } from '../../components/forms/CategoryPicker'
import { AuditNote, FormFooter, VoidSection, VoidedNotice } from '../../components/forms/FormParts'
import { MoneyInput } from '../../components/forms/MoneyInput'
import { SplitEditor } from '../../components/forms/SplitEditor'
import { defaultSplit, splitFromForm, splitToForm } from '../../components/forms/split'
import { Button } from '../../components/ui/Button'
import { Field, TextArea, TextInput } from '../../components/ui/Field'
import { Page, PageHeader } from '../../components/ui/PageHeader'
import { Segmented } from '../../components/ui/Segmented'
import { EmptyState } from '../../components/ui/States'
import { useToast } from '../../components/ui/toast-context'

function ExpenseForm({ expense }: { expense?: Expense }) {
  const data = useHousehold()
  const goBack = useGoBack()
  const toast = useToast()
  const readOnly = expense?.status === 'voided'

  const categories = data.categories.filter(
    (category) =>
      category.kind === 'expense' && (!category.archivedAt || category.id === expense?.categoryId),
  )
  const activeMembers = data.members.filter(
    (member) => member.active || member.userId === expense?.paidBy,
  )

  const defaultValues = useMemo<ExpenseFormValues>(() => {
    if (expense)
      return {
        description: expense.description,
        amount: formatMoneyInput(String(expense.amount)),
        date: expense.date,
        categoryId: expense.categoryId,
        paidBy: expense.paidBy,
        notes: expense.notes ?? '',
        ...splitToForm(expense.splitType, expense.splits, data.members),
      }
    return {
      description: '',
      amount: '',
      date: todayBogota(),
      categoryId: '',
      paidBy: data.userId,
      notes: '',
      ...defaultSplit(data.members),
    }
  }, [expense, data.members, data.userId])

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<ExpenseFormValues>({ resolver: zodResolver(expenseSchema), defaultValues })

  const [amount, splitType, participants, percents] = useWatch({
    control,
    name: ['amount', 'splitType', 'participants', 'percents'],
  })

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      description: values.description.trim(),
      amount: parseMoneyInput(values.amount)!,
      date: values.date,
      categoryId: values.categoryId,
      paidBy: values.paidBy,
      split: splitFromForm(values),
      notes: values.notes.trim(),
    }
    try {
      if (expense) await updateExpense(expense.id, input)
      else await createExpense(data.household.id, input)
      invalidateData()
      toast.show(expense ? 'Gasto actualizado' : 'Gasto guardado')
      goBack()
    } catch (error) {
      toast.show(toUserMessage(error, 'No pudimos guardar el gasto. Inténtalo de nuevo.'), 'error')
    }
  })

  const percentErrors = errors.percents as
    (Record<string, { message?: string }> & { message?: string }) | undefined

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {readOnly && <VoidedNotice label="gasto" />}
      <fieldset disabled={readOnly || isSubmitting} className="flex flex-col gap-6">
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <Field label="¿Cuánto fue?" error={errors.amount?.message}>
              {({ id, describedBy, invalid }) => (
                <MoneyInput
                  id={id}
                  size="lg"
                  autoFocus={!expense}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  {...field}
                />
              )}
            </Field>
          )}
        />

        <Field label="¿En qué?" error={errors.description?.message}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              placeholder="Mercado, arriendo, gasolina…"
              autoComplete="off"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              maxLength={120}
              {...register('description')}
            />
          )}
        </Field>

        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <CategoryPicker
              label="Categoría"
              categories={categories}
              value={field.value}
              onChange={field.onChange}
              error={errors.categoryId?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="paidBy"
          render={({ field }) => (
            <Segmented
              label="¿Quién pagó?"
              value={field.value}
              onChange={field.onChange}
              options={activeMembers.map((member) => ({
                value: member.userId,
                label: member.userId === data.userId ? 'Yo' : member.displayName,
              }))}
            />
          )}
        />

        <SplitEditor
          value={{ splitType, participants, percents }}
          onChange={(next) => {
            const options = { shouldValidate: isSubmitted, shouldDirty: true }
            setValue('splitType', next.splitType, options)
            setValue('participants', next.participants, options)
            setValue('percents', next.percents, options)
          }}
          amount={parseMoneyInput(amount)}
          members={data.members}
          meId={data.userId}
          error={errors.participants?.message ?? percentErrors?.message}
          percentErrors={Object.fromEntries(
            Object.entries(percentErrors ?? {})
              .filter(([key]) => key !== 'message' && key !== 'type' && key !== 'ref')
              .map(([key, value]) => [key, (value as { message?: string })?.message]),
          )}
        />

        <Field label="Fecha" error={errors.date?.message}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              type="date"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('date')}
            />
          )}
        </Field>

        <Field label="Nota (opcional)" error={errors.notes?.message}>
          {({ id, describedBy, invalid }) => (
            <TextArea
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              maxLength={500}
              {...register('notes')}
            />
          )}
        </Field>
      </fieldset>

      {!readOnly && (
        <FormFooter>
          <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? 'Guardando' : expense ? 'Guardar cambios' : 'Guardar gasto'}
          </Button>
        </FormFooter>
      )}

      {expense && <AuditNote audit={expense} />}
      {expense && !readOnly && (
        <VoidSection
          label="gasto"
          onVoid={async () => {
            try {
              await voidExpense(expense.id)
              invalidateData()
              toast.show('Gasto anulado')
              goBack()
            } catch (error) {
              toast.show(toUserMessage(error), 'error')
            }
          }}
        />
      )}
    </form>
  )
}

export function ExpenseFormPage() {
  const { id } = useParams()
  const { movements } = useHousehold()
  const expense = id
    ? movements.find(
        (movement): movement is Expense => movement.kind === 'expense' && movement.id === id,
      )
    : undefined

  return (
    <Page>
      <PageHeader title={id ? 'Gasto' : 'Nuevo gasto'} back="/" />
      {id && !expense ? (
        <EmptyState title="No encontramos ese gasto">
          Puede que lo hayan anulado o que el enlace esté mal.
        </EmptyState>
      ) : (
        <ExpenseForm key={expense?.id ?? 'new'} expense={expense} />
      )}
    </Page>
  )
}
