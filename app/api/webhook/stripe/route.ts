import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  try {
    const body = await request.text();
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const { poll_id, client_hash } = session.metadata;

      if (!poll_id || !client_hash) {
        console.error('Missing metadata in webhook:', session.metadata);
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
      }

      const client = await pool.connect();
      
      try {
        // Mark payment as completed and set paid timestamp
        const result = await client.query(
          `UPDATE payments 
           SET paid = true, paid_at = NOW(), stripe_payment_intent_id = $1
           WHERE poll_id = $2 AND client_hash = $3 AND stripe_checkout_session_id = $4
           RETURNING reveal_token`,
          [session.payment_intent, poll_id, client_hash, session.id]
        );

        if (result.rowCount === 0) {
          console.error('Payment record not found for session:', session.id);
        } else {
          console.log('Payment marked as completed:', session.id);
          // The reveal_token will be used by the client to access results
        }
      } finally {
        client.release();
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 400 });
  }
}