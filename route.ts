import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateClientHash, getClientIP } from '@/lib/utils';
import { stripe, PAYMENT_AMOUNT } from '@/lib/stripe';
import { checkoutLimiter, checkRateLimit } from '@/lib/rate-limiter';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const clientHash = generateClientHash(request);
    const ip = getClientIP(request);

    // Rate limiting
    const canProceed = await checkRateLimit(checkoutLimiter, `checkout:${ip}:${clientHash}`);
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const client = await pool.connect();

    try {
      // Check if poll exists and requires payment
      const pollResult = await client.query(
        'SELECT id, title, visibility FROM polls WHERE slug = $1',
        [slug]
      );

      if (pollResult.rows.length === 0) {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }

      const poll = pollResult.rows[0];

      if (poll.visibility !== 'pay_to_view') {
        return NextResponse.json({ error: 'This poll does not require payment to view results' }, { status: 400 });
      }

      // Check if user has already paid
      const existingPayment = await client.query(
        'SELECT id FROM payments WHERE poll_id = $1 AND client_hash = $2 AND paid = true',
        [poll.id, clientHash]
      );

      if (existingPayment.rows.length > 0) {
        return NextResponse.json({ error: 'You have already paid to view results for this poll' }, { status: 400 });
      }

      const baseUrl = process.env.APP_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
      
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Poll Results Access',
                description: `View results for: ${poll.title}`,
              },
              unit_amount: PAYMENT_AMOUNT,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/poll/${slug}?payment=success`,
        cancel_url: `${baseUrl}/poll/${slug}?payment=cancelled`,
        metadata: {
          poll_id: poll.id,
          client_hash: clientHash,
          slug: slug,
        },
      });

      // Store payment record
      await client.query(
        `INSERT INTO payments (poll_id, client_hash, stripe_checkout_session_id, amount)
         VALUES ($1, $2, $3, $4)`,
        [poll.id, clientHash, session.id, PAYMENT_AMOUNT]
      );

      return NextResponse.json({ url: session.url });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}