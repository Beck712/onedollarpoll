-- OneDollarPoll Database Schema
-- Create database tables for the MVP

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Polls table
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    admin_token UUID NOT NULL DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    options JSONB NOT NULL, -- Array of option strings
    type VARCHAR(10) NOT NULL CHECK (type IN ('single', 'multi')),
    max_choices INTEGER DEFAULT 1,
    visibility VARCHAR(20) NOT NULL CHECK (visibility IN ('pay_to_view', 'public', 'reveal_after_n_votes')),
    reveal_after_n_votes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    client_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    selected_options JSONB NOT NULL, -- Array of selected option indices
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
    client_hash VARCHAR(255) NOT NULL,
    stripe_checkout_session_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),
    amount INTEGER NOT NULL, -- Amount in cents
    paid BOOLEAN DEFAULT FALSE,
    reveal_token UUID DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_polls_slug ON polls(slug);
CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_client_hash ON votes(client_hash);
CREATE INDEX idx_payments_poll_id ON payments(poll_id);
CREATE INDEX idx_payments_client_hash ON payments(client_hash);
CREATE INDEX idx_payments_stripe_session ON payments(stripe_checkout_session_id);
CREATE INDEX idx_payments_reveal_token ON payments(reveal_token);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON polls 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();