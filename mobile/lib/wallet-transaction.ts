/** The API uses signed amounts and EARNED/REFUNDED/etc, not CREDIT/DEBIT. */
export interface WalletTransactionResponse {
  id: string; type: string; amount: number; status: string; description: string; createdAt: string; orderId?: string;
}
export function walletTransactionView(row: WalletTransactionResponse) {
  return { ...row, sourceType: row.type, type: (row.amount >= 0 ? 'CREDIT' : 'DEBIT') as 'CREDIT' | 'DEBIT', amount: Math.abs(row.amount) };
}
