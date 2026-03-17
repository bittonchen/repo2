// ===== Tenant =====
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  currency: string;
  timezone: string;
  locale: string;
  workingHours: WorkingHours;
  appointmentDuration: number; // minutes
  smsProvider?: 'inforumobile' | '019';
  paymentProvider?: 'tranzila' | 'cardcom' | 'stripe';
}

export interface WorkingHours {
  sunday: DayHours | null;
  monday: DayHours | null;
  tuesday: DayHours | null;
  wednesday: DayHours | null;
  thursday: DayHours | null;
  friday: DayHours | null;
  saturday: DayHours | null;
}

export interface DayHours {
  start: string; // "09:00"
  end: string;   // "18:00"
}

// ===== User / Employee =====
export type UserRole = 'owner' | 'admin' | 'veterinarian' | 'technician' | 'receptionist';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Client (Pet Owner) =====
export interface Client {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  idNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Animal =====
export type AnimalSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'hamster' | 'reptile' | 'fish' | 'other';
export type AnimalGender = 'male' | 'female' | 'unknown';

export interface Animal {
  id: string;
  tenantId: string;
  clientId: string;
  name: string;
  species: AnimalSpecies;
  breed?: string;
  gender: AnimalGender;
  dateOfBirth?: Date;
  weight?: number;
  microchipNumber?: string;
  imageUrl?: string;
  isNeutered: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Appointment =====
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string;
  animalId: string;
  veterinarianId: string;
  startTime: Date;
  endTime: Date;
  type: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Inventory =====
export type InventoryCategory = 'medication' | 'food' | 'equipment' | 'supplies' | 'other';

export interface InventoryItem {
  id: string;
  tenantId: string;
  name: string;
  category: InventoryCategory;
  sku?: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  costPrice?: number;
  expiryDate?: Date;
  supplierId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Medical Record =====
export interface MedicalRecord {
  id: string;
  tenantId: string;
  animalId: string;
  appointmentId?: string;
  veterinarianId: string;
  date: Date;
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  notes?: string;
  weight?: number;
  temperature?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ===== Invoice =====
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'credit_card' | 'bank_transfer' | 'check';

export interface Invoice {
  id: string;
  tenantId: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  issuedAt: Date;
  dueAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// ===== API Response =====
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
