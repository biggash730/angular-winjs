import { create } from 'zustand'

interface BookingDraft {
  slug: string | null
  serviceId: string | null
  scheduledStart: string | null
  clientName: string
  clientEmail: string
  clientPhone: string
  notes: string
}

interface BookingDraftState extends BookingDraft {
  setDraft: (draft: Partial<BookingDraft>) => void
  clearDraft: () => void
}

const initialDraft: BookingDraft = {
  slug: null,
  serviceId: null,
  scheduledStart: null,
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  notes: '',
}

export const useBookingDraftStore = create<BookingDraftState>((set) => ({
  ...initialDraft,
  setDraft: (draft) => set((state) => ({ ...state, ...draft })),
  clearDraft: () => set(initialDraft),
}))
