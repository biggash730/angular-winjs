import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Pencil, Plus, Scissors, Trash2 } from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Table, Tbody, Td, Th, Thead, Tr } from '../../components/ui/Table'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { Modal } from '../../components/ui/Modal'
import { Input, Textarea } from '../../components/ui/Input'
import { useCreateService, useDeleteService, useServices, useUpdateService } from '../../hooks/useServices'
import type { Service } from '../../api/types'
import { formatCurrency } from '../../lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().max(500).optional(),
  durationMinutes: z.coerce.number().int().min(5, 'At least 5 minutes').max(600),
  price: z.coerce.number().min(0, 'Must be 0 or more'),
  depositPercentage: z.coerce.number().min(0).max(100),
  isActive: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const emptyValues: FormValues = {
  name: '',
  description: '',
  durationMinutes: 30,
  price: 0,
  depositPercentage: 20,
  isActive: true,
}

export default function Services() {
  const { data: services, isLoading } = useServices()
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues })

  function openCreate() {
    setEditing(null)
    reset(emptyValues)
    setModalOpen(true)
  }

  function openEdit(service: Service) {
    setEditing(service)
    reset({
      name: service.name,
      description: service.description ?? '',
      durationMinutes: service.durationMinutes,
      price: service.price,
      depositPercentage: service.depositPercentage,
      isActive: service.isActive,
    })
    setModalOpen(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    if (editing) {
      await updateService.mutateAsync({ id: editing.id, payload: values })
    } else {
      await createService.mutateAsync(values)
    }
    setModalOpen(false)
  })

  async function handleDelete(service: Service) {
    if (!window.confirm(`Delete "${service.name}"? This can't be undone.`)) return
    await deleteService.mutateAsync(service.id)
  }

  const isSaving = createService.isPending || updateService.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Services</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            What clients can book, and the deposit they pay up front.
          </p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus className="size-4" />}>
          Add service
        </Button>
      </div>

      <Card>
        <CardHeader title="All services" description={`${services?.length ?? 0} total`} />
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !services?.length ? (
          <EmptyState
            icon={<Scissors className="size-6" />}
            title="No services yet"
            description="Add your first bookable service so clients can start booking you."
            action={
              <Button onClick={openCreate} leftIcon={<Plus className="size-4" />}>
                Add service
              </Button>
            }
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Service</Th>
                <Th>Duration</Th>
                <Th>Price</Th>
                <Th>Deposit</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {services.map((service) => (
                <Tr key={service.id}>
                  <Td>
                    <p className="font-medium text-ink-900 dark:text-ink-50">{service.name}</p>
                    {service.description && (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-ink-500 dark:text-ink-400">
                        {service.description}
                      </p>
                    )}
                  </Td>
                  <Td>{service.durationMinutes} min</Td>
                  <Td>{formatCurrency(service.price)}</Td>
                  <Td>{service.depositPercentage}%</Td>
                  <Td>
                    <Badge tone={service.isActive ? 'success' : 'neutral'}>
                      {service.isActive ? 'Active' : 'Hidden'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(service)}
                        className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800"
                        aria-label={`Edit ${service.name}`}
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service)}
                        className="rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-red-600 dark:hover:bg-ink-800"
                        aria-label={`Delete ${service.name}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit service' : 'Add service'}
        description="These details appear on your public booking page."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Name" required error={errors.name?.message} {...register('name')} />
          <Textarea
            label="Description"
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (minutes)"
              type="number"
              required
              error={errors.durationMinutes?.message}
              {...register('durationMinutes')}
            />
            <Input
              label="Price (USD)"
              type="number"
              step="0.01"
              required
              error={errors.price?.message}
              {...register('price')}
            />
          </div>
          <Input
            label="Deposit percentage"
            type="number"
            hint="Percentage of the price clients pay up front to confirm a booking"
            required
            error={errors.depositPercentage?.message}
            {...register('depositPercentage')}
          />
          <label className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
            <input
              type="checkbox"
              className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              {...register('isActive')}
            />
            Visible on booking page
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {editing ? 'Save changes' : 'Add service'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
