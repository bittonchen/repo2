export const APP_NAME = 'VetFlow';

export const USER_ROLES = ['owner', 'admin', 'veterinarian', 'technician', 'receptionist'] as const;

export const ANIMAL_SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'reptile', 'fish', 'other'] as const;

export const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'] as const;

export const INVENTORY_CATEGORIES = ['medication', 'food', 'equipment', 'supplies', 'other'] as const;

export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'partially_paid', 'cancelled'] as const;

export const PAYMENT_METHODS = ['cash', 'credit_card', 'bank_transfer', 'check'] as const;

export const DEFAULT_WORKING_HOURS = {
  sunday: { start: '08:00', end: '18:00' },
  monday: { start: '08:00', end: '18:00' },
  tuesday: { start: '08:00', end: '18:00' },
  wednesday: { start: '08:00', end: '18:00' },
  thursday: { start: '08:00', end: '18:00' },
  friday: { start: '08:00', end: '14:00' },
  saturday: null,
};

export const DEFAULT_APPOINTMENT_DURATION = 30; // minutes

export const DEFAULT_LOCALE = 'he';
export const DEFAULT_CURRENCY = 'ILS';
export const DEFAULT_TIMEZONE = 'Asia/Jerusalem';

export const VAT_RATE = 0.17; // Israel VAT 17%
