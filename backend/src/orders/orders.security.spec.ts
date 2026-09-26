import { ForbiddenException } from '@nestjs/common';
import { OrdersService } from './orders.service';

describe('Buyer payment confirmation regression', () => {
  it.each(['BANK_TRANSFER', 'CARD', 'CASH'])('cannot mark an approved order paid using %s', async (paymentMethod) => {
    const prisma = { orders: { update: jest.fn() } };
    const payments = { createEscrowPayment: jest.fn() };
    const invoices = { generateInvoice: jest.fn() };
    const service = new OrdersService(prisma as any, payments as any, {} as any, {} as any, invoices as any);
    jest.spyOn(service, 'findOne').mockResolvedValue({ id: 'order', status: 'APPROVED' } as any);

    await expect(service.initiatePayment('order', 'buyer', {
      paymentMethod, transactionId: 'client-supplied-reference',
    })).rejects.toBeInstanceOf(ForbiddenException);

    expect(payments.createEscrowPayment).not.toHaveBeenCalled();
    expect(prisma.orders.update).not.toHaveBeenCalled();
    expect(invoices.generateInvoice).not.toHaveBeenCalled();
  });
});
