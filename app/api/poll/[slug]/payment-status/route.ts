import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateClientHash } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const clientHash = generateClientHash(request);

    const client = await pool.connect();

    try {
      // Get poll ID
      const pollResult = await client.query(
        'SELECT id FROM polls WHERE slug = $1',
        [slug]
      );

      if (pollResult.rows.length === 0) {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }

      const pollId = pollResult.rows[0].id;

      // Check for paid payment and return reveal token
      const paymentResult = await client.query(
        'SELECT reveal_token FROM payments WHERE poll_id = $1 AND client_hash = $2 AND paid = true',
        [pollId, clientHash]
      );

      if (paymentResult.rows.length > 0) {
        return NextResponse.json({ 
          reveal_token: paymentResult.rows[0].reveal_token,
          paid: true 
        });
      }

      return NextResponse.json({ paid: false });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}