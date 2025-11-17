import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateClientHash, getClientIP } from '@/lib/utils';
import { voteLimiter, checkRateLimit } from '@/lib/rate-limiter';

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const clientHash = generateClientHash(request);
    const ip = getClientIP(request);

    // Rate limiting
    const canProceed = await checkRateLimit(voteLimiter, { ip, clientHash });
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Too many vote attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { selected_options } = body;

    // Validate selected options
    if (!Array.isArray(selected_options) || selected_options.length === 0) {
      return NextResponse.json({ error: 'Must select at least one option' }, { status: 400 });
    }

    const client = await pool.connect();
    
    try {
      // Get poll details
      const pollResult = await client.query(
        'SELECT id, options, type, max_choices FROM polls WHERE slug = $1',
        [slug]
      );

      if (pollResult.rows.length === 0) {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }

      const poll = pollResult.rows[0];
      const options = JSON.parse(poll.options);

      // Validate selections
      if (selected_options.some((idx: number) => idx < 0 || idx >= options.length)) {
        return NextResponse.json({ error: 'Invalid option selection' }, { status: 400 });
      }

      if (poll.type === 'single' && selected_options.length !== 1) {
        return NextResponse.json({ error: 'Single choice polls allow only one selection' }, { status: 400 });
      }

      if (poll.type === 'multi' && selected_options.length > poll.max_choices) {
        return NextResponse.json(
          { error: `Too many selections. Maximum is ${poll.max_choices}` },
          { status: 400 }
        );
      }

      // Check if this client has already voted
      const existingVote = await client.query(
        'SELECT id FROM votes WHERE poll_id = $1 AND client_hash = $2',
        [poll.id, clientHash]
      );

      if (existingVote.rows.length > 0) {
        return NextResponse.json({ error: 'You have already voted in this poll' }, { status: 400 });
      }

      // Record the vote
      await client.query(
        `INSERT INTO votes (poll_id, client_hash, ip_address, selected_options)
         VALUES ($1, $2, $3, $4)`,
        [poll.id, clientHash, ip, JSON.stringify(selected_options)]
      );

      return NextResponse.json({ success: true, message: 'Vote recorded successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error recording vote:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}