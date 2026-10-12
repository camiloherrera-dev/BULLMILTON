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
import { CardCheckbox } from '../../components/forms/CardCheckbox'
import { CategoryMultiPicker } from '../../components/forms/CategoryMultiPicker'
import { DateChips } from '../../components/forms/DateChips'
import { AuditNote, FormFooter, VoidSection, VoidedNotice } from '../../components/forms/FormParts'
import { MoneyInput } from '../../components/forms/MoneyInput'
import { NoteField } from '../../components/forms/NoteField'
import { SplitEditor } from '../../components/forms/SplitEditor'
import { defaultSplit, splitFromForm, splitToForm } from '../../components/forms/split'
import { useSavedToast } from '../../components/forms/useSavedToast'
import { Button } from '../../components/ui/Button'
import { Field, TextInput } from '../../components/ui/Field'
import { Page, PageHeader } from '../../components/ui/PageHeader'
import { Segmented } from '../../components/ui/Segmented'
import { EmptyState } from '../../components/ui/States'
import { useToast } from '../../components/ui/toast-context'

function ExpenseForm({ expense }: { expense?: Expense }) {
  const data = useHousehold()
  const goBack = useGoBack()
  const toast = useToast()
  const savedToast = useSavedToast()
  const readOnly = expense?.status === 'voided'

  const categories = data.categories.filter(
    (category) =>
      category.kind === 'expense' &&
      (!category.archivedAt ||
        category.id === expense?.categoryId ||
        expense?.extraCategoryIds.includes(category.id)),
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
        categoryIds: [expense.categoryId, ...expense.extraCategoryIds],
        paidBy: expense.paidBy,
        notes: expense.notes ?? '',
        paidWithCard: expense.paidWithCard,
        ...splitToForm(expense.splitType, expense.splits, data.members),
      }
    return {
      description: '',
      amount: '',
      date: todayBogota(),
      categoryIds: [],
      paidBy: data.userId,
      notes: '',
      paidWithCard: false,
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
      categoryIds: values.categoryIds,
      paidBy: values.paidBy,
      split: splitFromForm(values),
      notes: values.notes.trim(),
      paidWithCard: values.paidWithCard,
    }
    try {
      if (expense) {
        await updateExpense(expense.id, input)
        invalidateData()
        toast.show('Gasto actualizado')
      } else {
        const id = await createExpense(data.household.id, input)
        invalidateData()
        savedToast({
          message: 'Gasto guardado',
          undo: () => voidExpense(id),
          undoneMessage: 'Gasto anulado',
          againPath: '/gastos/nuevo',
        })
      }
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

        <Controller
          control={control}
          name="date"
          render={({ field }) => (
            <DateChips value={field.value} onChange={field.onChange} error={errors.date?.message} />
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
          name="categoryIds"
          render={({ field }) => (
            <CategoryMultiPicker
              label="Categorías"
              categories={categories}
              value={field.value}
              onChange={field.onChange}
              error={errors.categoryIds?.message}
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

        <CardCheckbox registration={register('paidWithCard')} />

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

        <NoteField
          registration={register('notes')}
          hasValue={Boolean(defaultValues.notes)}
          error={errors.notes?.message}
        />
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
