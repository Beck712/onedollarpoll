import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const adminToken = request.nextUrl.searchParams.get('admin_token');

    if (!adminToken) {
      return NextResponse.json({ error: 'Admin token required' }, { status: 401 });
    }

    const client = await pool.connect();

    try {
      // Verify admin access and get poll data
      const pollResult = await client.query(
        'SELECT id, title, options, visibility, created_at FROM polls WHERE slug = $1 AND admin_token = $2',
        [slug, adminToken]
      );

      if (pollResult.rows.length === 0) {
        return NextResponse.json({ error: 'Poll not found or invalid admin token' }, { status: 404 });
      }

      const poll = pollResult.rows[0];

      // Get vote analytics
      const votesResult = await client.query(
        `SELECT 
           COUNT(*) as total_votes,
           COUNT(DISTINCT client_hash) as unique_voters
         FROM votes 
         WHERE poll_id = $1`,
        [poll.id]
      );

      // Get payment analytics
      const paymentsResult = await client.query(
        `SELECT 
           COUNT(*) as total_payments,
           COALESCE(SUM(amount), 0) as revenue
         FROM payments 
         WHERE poll_id = $1 AND paid = true`,
        [poll.id]
      );

      // Get recent votes
      const recentVotesResult = await client.query(
        `SELECT selected_options, created_at, ip_address
         FROM votes 
         WHERE poll_id = $1 
         ORDER BY created_at DESC 
         LIMIT 20`,
        [poll.id]
      );

      const analytics = {
        totalVotes: parseInt(votesResult.rows[0].total_votes),
        uniqueVoters: parseInt(votesResult.rows[0].unique_voters),
        totalPayments: parseInt(paymentsResult.rows[0].total_payments),
        revenue: parseInt(paymentsResult.rows[0].revenue),
        recentVotes: recentVotesResult.rows.map(vote => ({
          selected_options: JSON.parse(vote.selected_options),
          created_at: vote.created_at,
          ip_address: vote.ip_address,
        })),
      };

      return NextResponse.json({
        poll: {
          title: poll.title,
          options: JSON.parse(poll.options),
          visibility: poll.visibility,
          created_at: poll.created_at,
        },
        analytics,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}