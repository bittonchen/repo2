export interface ChargeRequest {
  amount: number;
  currency?: string;
  cardNumber?: string;
  expMonth?: string;
  expYear?: string;
  cvv?: string;
  holderId?: string;
  description?: string;
  invoiceId?: string;
}

export interface ChargeResult {
  success: boolean;
  transactionId?: string;
  approvalNumber?: string;
  errorMessage?: string;
}

export interface PaymentProvider {
  charge(request: ChargeRequest): Promise<ChargeResult>;
  getPaymentPageUrl?(amount: number, invoiceId: string): Promise<string>;
}
