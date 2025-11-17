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
    const adminToken = request.nextUrl.searchParams.get('admin_token');
    const revealToken = request.nextUrl.searchParams.get('reveal_token');

    const client = await pool.connect();

    try {
      // Get poll details
      const pollResult = await client.query(
        'SELECT id, title, options, visibility, reveal_after_n_votes, admin_token FROM polls WHERE slug = $1',
        [slug]
      );

      if (pollResult.rows.length === 0) {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }

      const poll = pollResult.rows[0];
      const options = JSON.parse(poll.options);

      // Check access permissions
      let hasAccess = false;

      if (poll.visibility === 'public') {
        hasAccess = true;
      } else if (adminToken && adminToken === poll.admin_token) {
        hasAccess = true;
      } else if (poll.visibility === 'pay_to_view') {
        // Check for payment or reveal token
        if (revealToken) {
          const paymentResult = await client.query(
            'SELECT id FROM payments WHERE poll_id = $1 AND reveal_token = $2 AND paid = true',
            [poll.id, revealToken]
          );
          hasAccess = paymentResult.rows.length > 0;
        } else {
          const paymentResult = await client.query(
            'SELECT id FROM payments WHERE poll_id = $1 AND client_hash = $2 AND paid = true',
            [poll.id, clientHash]
          );
          hasAccess = paymentResult.rows.length > 0;
        }
      } else if (poll.visibility === 'reveal_after_n_votes') {
        // Check if enough votes have been cast
        const voteCountResult = await client.query(
          'SELECT COUNT(*) as count FROM votes WHERE poll_id = $1',
          [poll.id]
        );
        const totalVotes = parseInt(voteCountResult.rows[0].count);
        hasAccess = totalVotes >= poll.reveal_after_n_votes;
      }

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied. Payment required to view results.' }, { status: 403 });
      }

      // Get vote counts
      const votesResult = await client.query(
        'SELECT selected_options FROM votes WHERE poll_id = $1',
        [poll.id]
      );

      // Calculate results
      const results = options.map(() => 0);
      let totalVotes = 0;

      votesResult.rows.forEach(vote => {
        const selectedOptions = JSON.parse(vote.selected_options);
        selectedOptions.forEach((optionIndex: number) => {
          results[optionIndex]++;
          totalVotes++;
        });
      });

      const formattedResults = options.map((option: string, index: number) => ({
        option,
        votes: results[index],
        percentage: totalVotes > 0 ? Math.round((results[index] / totalVotes) * 100) : 0,
      }));

      return NextResponse.json({
        poll: {
          title: poll.title,
          options,
        },
        results: formattedResults,
        totalVotes: votesResult.rows.length,
        totalChoices: totalVotes,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error getting results:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}