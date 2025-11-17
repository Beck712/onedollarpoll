import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT id, title, options, type, max_choices, visibility, reveal_after_n_votes FROM polls WHERE slug = $1',
        [slug]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
      }

      const poll = result.rows[0];

      return NextResponse.json({
        id: poll.id,
        title: poll.title,
        options: JSON.parse(poll.options),
        type: poll.type,
        max_choices: poll.max_choices,
        visibility: poll.visibility,
        reveal_after_n_votes: poll.reveal_after_n_votes,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching poll:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
      const result = await client.query(
        'DELETE FROM polls WHERE slug = $1 AND admin_token = $2 RETURNING id',
        [slug, adminToken]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Poll not found or invalid admin token' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: 'Poll deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting poll:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}