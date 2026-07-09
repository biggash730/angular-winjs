import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ArrowUpRight, Banknote, Receipt, Smartphone, Wallet as WalletIcon } from 'lucide-react'
import { Card, CardHeader } from '../../components/ui/Card'
import { StatCard } from '../../components/ui/StatCard'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { Table, Tbody, Td, Th, Thead, Tr } from '../../components/ui/Table'
import { EmptyState } from '../../components/ui/EmptyState'
import { Spinner } from '../../components/ui/Spinner'
import { usePayouts, useRequestPayout, useWallet, useWalletTransactions } from '../../hooks/useWallet'
import { formatCurrency, formatDateTime } from '../../lib/utils'
import type { PayoutMethod, PayoutStatus } from '../../api/types'

const payoutSchema = z.object({
  amount: z.coerce.number().positive('Enter an amount greater than 0'),
  method: z.enum(['BankTransfer', 'MobileMoney']),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  provider: z.string().optional(),
  mobileNumber: z.string().optional(),
})

type PayoutFormValues = z.infer<typeof payoutSchema>

const PAYOUT_STATUS_TONE: Record<PayoutStatus, 'brand' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  Pending: 'warning',
  Processing: 'brand',
  Completed: 'success',
  Failed: 'danger',
}

export default function WalletPage() {
  const { data: wallet, isLoading: walletLoading } = useWallet()
  const { data: transactions, isLoading: txLoading } = useWalletTransactions({ pageSize: 15 })
  const { data: payouts, isLoading: payoutsLoading } = usePayouts({ pageSize: 10 })
  const requestPayout = useRequestPayout()
  const [modalOpen, setModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PayoutFormValues>({
    resolver: zodResolver(payoutSchema),
    defaultValues: { method: 'BankTransfer', amount: 0 },
  })

  const method = watch('method')

  const onSubmit = handleSubmit(async (values) => {
    const destination: Record<string, string> =
      values.method === 'BankTransfer'
        ? {
            bankName: values.bankName ?? '',
            accountName: values.accountName ?? '',
            accountNumber: values.accountNumber ?? '',
          }
        : {
            provider: values.provider ?? '',
            mobileNumber: values.mobileNumber ?? '',
          }

    await requestPayout.mutateAsync({
      amount: values.amount,
      method: values.method as PayoutMethod,
      destination,
    })
    reset()
    setModalOpen(false)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900 dark:text-ink-50">Wallet</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
            Track deposits and request payouts to your bank or mobile money account.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} leftIcon={<ArrowUpRight className="size-4" />}>
          Request payout
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Available balance"
          value={walletLoading ? '—' : formatCurrency(wallet?.availableBalance ?? 0, wallet?.currency)}
          icon={<WalletIcon className="size-5" />}
          tone="brand"
        />
        <StatCard
          label="Pending balance"
          value={walletLoading ? '—' : formatCurrency(wallet?.pendingBalance ?? 0, wallet?.currency)}
          icon={<Receipt className="size-5" />}
          tone="accent"
        />
      </div>

      <Card>
        <CardHeader title="Transaction history" description="Deposits held, released, refunded and payouts." />
        {txLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !transactions?.items.length ? (
          <EmptyState icon={<Receipt className="size-6" />} title="No transactions yet" />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Description</Th>
                <Th className="text-right">Amount</Th>
              </Tr>
            </Thead>
            <Tbody>
              {transactions.items.map((tx) => (
                <Tr key={tx.id}>
                  <Td>{formatDateTime(tx.createdAt)}</Td>
                  <Td>
                    <Badge tone="neutral">{tx.type}</Badge>
                  </Td>
                  <Td>{tx.description ?? '—'}</Td>
                  <Td className="text-right font-medium">
                    {tx.type === 'PayoutDebit' || tx.type === 'PayoutFee' ? '-' : '+'}
                    {formatCurrency(Math.abs(tx.amount))}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Payout requests" description="Status of your payout requests." />
        {payoutsLoading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : !payouts?.items.length ? (
          <EmptyState icon={<Banknote className="size-6" />} title="No payout requests yet" />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Requested</Th>
                <Th>Method</Th>
                <Th>Amount</Th>
                <Th>Fee</Th>
                <Th>Net</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {payouts.items.map((payout) => (
                <Tr key={payout.id}>
                  <Td>{formatDateTime(payout.createdAt)}</Td>
                  <Td>{payout.method === 'BankTransfer' ? 'Bank transfer' : 'Mobile money'}</Td>
                  <Td>{formatCurrency(payout.amount)}</Td>
                  <Td>{formatCurrency(payout.feeAmount)}</Td>
                  <Td className="font-medium">{formatCurrency(payout.netAmount)}</Td>
                  <Td>
                    <Badge tone={PAYOUT_STATUS_TONE[payout.status]}>{payout.status}</Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Request payout" description="Funds are sent from your available balance, minus the platform fee.">
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Amount (USD)"
            type="number"
            step="0.01"
            required
            hint={wallet ? `Available: ${formatCurrency(wallet.availableBalance, wallet.currency)}` : undefined}
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Select label="Payout method" required {...register('method')}>
            <option value="BankTransfer">Bank transfer</option>
            <option value="MobileMoney">Mobile money</option>
          </Select>

          {method === 'BankTransfer' ? (
            <div className="space-y-4">
              <Input label="Bank name" required {...register('bankName')} />
              <Input label="Account name" required {...register('accountName')} />
              <Input label="Account number" required {...register('accountNumber')} />
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Mobile money provider"
                placeholder="e.g. M-Pesa, MTN MoMo"
                required
                leftIcon={<Smartphone className="size-4" />}
                {...register('provider')}
              />
              <Input label="Mobile number" required {...register('mobileNumber')} />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={requestPayout.isPending}>
              Request payout
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
