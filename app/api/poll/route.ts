import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { generateSlug, generateClientHash, getClientIP, validatePollOptions, validatePollType } from '@/lib/utils';
import { createPollLimiter, checkRateLimit } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const clientHash = generateClientHash(request);
    const ip = getClientIP(request);

    // Rate limiting
    const canProceed = await checkRateLimit(createPollLimiter, { ip, clientHash });
    if (!canProceed) {
      return NextResponse.json(
        { error: 'Too many poll creation attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { title, options, type, max_choices, visibility, reveal_after_n_votes } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 500) {
      return NextResponse.json({ error: 'Invalid title' }, { status: 400 });
    }

    if (!validatePollOptions(options)) {
      return NextResponse.json(
        { error: 'Options must be an array of 2-10 strings, each up to 200 characters' },
        { status: 400 }
      );
    }

    if (!['single', 'multi'].includes(type)) {
      return NextResponse.json({ error: 'Type must be single or multi' }, { status: 400 });
    }

    if (!validatePollType(type, max_choices, options.length)) {
      return NextResponse.json({ error: 'Invalid max_choices for poll type' }, { status: 400 });
    }

    if (!['pay_to_view', 'public', 'reveal_after_n_votes'].includes(visibility)) {
      return NextResponse.json({ error: 'Invalid visibility option' }, { status: 400 });
    }

    if (visibility === 'reveal_after_n_votes' && (!reveal_after_n_votes || reveal_after_n_votes < 1)) {
      return NextResponse.json(
        { error: 'reveal_after_n_votes must be a positive number' },
        { status: 400 }
      );
    }

    const slug = generateSlug();
    const client = await pool.connect();

    try {
      const result = await client.query(
        `INSERT INTO polls (slug, title, options, type, max_choices, visibility, reveal_after_n_votes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING admin_token`,
        [
          slug,
          title.trim(),
          JSON.stringify(options.map((opt: string) => opt.trim())),
          type,
          max_choices,
          visibility,
          visibility === 'reveal_after_n_votes' ? reveal_after_n_votes : null,
        ]
      );

      const adminToken = result.rows[0].admin_token;
      const baseUrl = process.env.APP_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
      const adminUrl = `${baseUrl}/poll/${slug}/admin/${adminToken}`;

      return NextResponse.json({ slug, adminUrl });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}