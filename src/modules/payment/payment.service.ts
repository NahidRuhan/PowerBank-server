import { prisma } from '../../lib/prisma.js';
import { NotFoundError, ValidationError } from '../../lib/errors.js';
import { env } from '../../lib/env.js';
import Stripe from 'stripe';

const stripe = new Stripe(env.STRIPE_SECRET_KEY || 'dummy_key', {
  apiVersion: '2023-10-16',
});

export class PaymentService {
  static async initiatePayment(billId: string, userId: string) {
    const bill = await prisma.bill.findUnique({ where: { id: billId } });
    if (!bill) throw new NotFoundError('Bill not found');
    if (bill.userId !== userId) throw new NotFoundError('Bill not found');
    if (bill.status === 'PAID') throw new ValidationError('Bill is already paid');

    // Create a new PENDING payment
    const payment = await prisma.payment.create({
      data: {
        billId: bill.id,
        userId: bill.userId,
        amount: bill.totalAmount,
        currency: 'bdt',
      },
    });

    if (!env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured in this environment');
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'bdt',
            product_data: {
              name: `PowerBank Bill - ${bill.month}`,
              description: `Load shedding management bill for ${bill.month}`,
            },
            unit_amount: Math.round(bill.totalAmount * 100), // Stripe expects amounts in cents/paisa
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:5000/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5000/payment-cancel`,
      client_reference_id: payment.id,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: session.id },
    });

    return { checkoutUrl: session.url };
  }

  static async handleWebhook(signature: string, rawBody: Buffer) {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error('Stripe webhook secret is not configured');
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      throw new ValidationError(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const paymentId = session.client_reference_id;
      if (paymentId) {
        await prisma.$transaction(async (tx) => {
          const payment = await tx.payment.update({
            where: { id: paymentId },
            data: {
              status: 'SUCCEEDED',
              stripePaymentId: session.payment_intent as string,
            },
          });

          await tx.bill.update({
            where: { id: payment.billId },
            data: { status: 'PAID' },
          });
        });
      }
    } else if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.client_reference_id;
      if (paymentId) {
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: 'FAILED' },
        });
      }
    }

    return { received: true };
  }

  static async getMyPayments(userId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.status) where.status = query.status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { bill: { select: { month: true } } },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      payments,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  static async refundPayment(paymentId: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundError('Payment not found');
    if (payment.status !== 'SUCCEEDED' || !payment.stripePaymentId) {
      throw new ValidationError('Can only refund succeeded payments');
    }

    await stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
    });

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' },
      });
      await tx.bill.update({
        where: { id: payment.billId },
        data: { status: 'UNPAID' },
      });
    });

    return { message: 'Refund initiated successfully' };
  }
}
