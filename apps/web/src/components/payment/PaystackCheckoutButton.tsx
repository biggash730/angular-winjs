import { usePaystackPayment } from 'react-paystack'
import { Button } from '../ui/Button'

interface PaystackCheckoutButtonProps {
  email: string
  amount: number
  reference: string
  publicKey: string
  onSuccess: () => void
  onClose?: () => void
}

export function PaystackCheckoutButton({
  email,
  amount,
  reference,
  publicKey,
  onSuccess,
  onClose,
}: PaystackCheckoutButtonProps) {
  const initializePayment = usePaystackPayment({
    email,
    amount: Math.round(amount * 100),
    reference,
    publicKey,
    currency: 'NGN',
  })

  return (
    <Button
      type="button"
      className="w-full"
      onClick={() => {
        initializePayment({
          onSuccess: () => onSuccess(),
          onClose: () => onClose?.(),
        })
      }}
    >
      Pay deposit with Paystack
    </Button>
  )
}
