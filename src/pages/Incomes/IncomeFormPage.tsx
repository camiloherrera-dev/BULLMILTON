import { useParams } from 'react-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memberName, useHousehold } from '../../app/household-context'
import { useGoBack } from '../../hooks/useGoBack'
import { invalidateData } from '../../hooks/useResource'
import { todayBogota } from '../../lib/dates'
import { toUserMessage } from '../../lib/errors'
import { formatMoneyInput, parseMoneyInput } from '../../lib/money'
import { incomeSchema, type IncomeFormValues } from '../../lib/validation/movements'
import { createIncome, updateIncome, voidIncome } from '../../services/movements'
import type { Income } from '../../types/domain'
import { CategoryPicker } from '../../components/forms/CategoryPicker'
import { AuditNote, FormFooter, VoidSection, VoidedNotice } from '../../components/forms/FormParts'
import { MoneyInput } from '../../components/forms/MoneyInput'
import { Button } from '../../components/ui/Button'
import { Field, TextArea, TextInput } from '../../components/ui/Field'
import { Page, PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/States'
import { useToast } from '../../components/ui/toast-context'

function IncomeForm({ income }: { income?: Income }) {
  const data = useHousehold()
  const goBack = useGoBack()
  const toast = useToast()
  const notMine = Boolean(income && income.userId !== data.userId)
  const voided = income?.status === 'voided'
  const readOnly = voided || notMine

  const categories = data.categories.filter(
    (category) =>
      category.kind === 'income' && (!category.archivedAt || category.id === income?.categoryId),
  )

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeSchema),
    defaultValues: income
      ? {
          source: income.source,
          amount: formatMoneyInput(String(income.amount)),
          date: income.date,
          categoryId: income.categoryId ?? '',
          notes: income.notes ?? '',
        }
      : { source: '', amount: '', date: todayBogota(), categoryId: '', notes: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    const input = {
      source: values.source,
      amount: parseMoneyInput(values.amount)!,
      date: values.date,
      categoryId: values.categoryId || null,
      notes: values.notes,
    }
    try {
      if (income) await updateIncome(income.id, input)
      else await createIncome(data.household.id, input)
      invalidateData()
      toast.show(income ? 'Ingreso actualizado' : 'Ingreso guardado')
      goBack()
    } catch (error) {
      toast.show(
        toUserMessage(error, 'No pudimos guardar el ingreso. Inténtalo de nuevo.'),
        'error',
      )
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {voided && <VoidedNotice label="ingreso" />}
      {notMine && !voided && (
        <p role="status" className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-fg-muted">
          Es un ingreso de {memberName(data, income!.userId)}: solo esa persona puede editarlo.
        </p>
      )}
      {!income && (
        <p className="text-sm text-fg-muted">
          Los ingresos son tuyos y no cambian el saldo entre ustedes; sirven para los reportes.
        </p>
      )}
      <fieldset disabled={readOnly || isSubmitting} className="flex flex-col gap-6">
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <Field label="¿Cuánto recibiste?" error={errors.amount?.message}>
              {({ id, describedBy, invalid }) => (
                <MoneyInput
                  id={id}
                  size="lg"
                  autoFocus={!income}
                  aria-describedby={describedBy}
                  aria-invalid={invalid}
                  {...field}
                />
              )}
            </Field>
          )}
        />
        <Field label="¿De dónde viene?" error={errors.source?.message}>
          {({ id, describedBy, invalid }) => (
            <TextInput
              id={id}
              placeholder="Mesada, trabajo, beca…"
              autoComplete="off"
              aria-describedby={describedBy}
              aria-invalid={invalid}
              {...register('source')}
            />
          )}
        </Field>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <CategoryPicker
              label="Categoría (opcional)"
              categories={categories}
              value={field.value}
              onChange={field.onChange}
              optional
            />
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
              {...register('notes')}
            />
          )}
        </Field>
      </fieldset>

      {!readOnly && (
        <FormFooter>
          <Button type="submit" size="lg" loading={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? 'Guardando' : income ? 'Guardar cambios' : 'Guardar ingreso'}
          </Button>
        </FormFooter>
      )}

      {income && <AuditNote audit={income} />}
      {income && !readOnly && (
        <VoidSection
          label="ingreso"
          onVoid={async () => {
            try {
              await voidIncome(income.id)
              invalidateData()
              toast.show('Ingreso anulado')
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

export function IncomeFormPage() {
  const { id } = useParams()
  const { movements } = useHousehold()
  const income = id
    ? movements.find(
        (movement): movement is Income => movement.kind === 'income' && movement.id === id,
      )
    : undefined

  return (
    <Page>
      <PageHeader title={id ? 'Ingreso' : 'Nuevo ingreso'} back="/" />
      {id && !income ? (
        <EmptyState title="No encontramos ese ingreso">Puede que el enlace esté mal.</EmptyState>
      ) : (
        <IncomeForm key={income?.id ?? 'new'} income={income} />
      )}
    </Page>
  )
}
