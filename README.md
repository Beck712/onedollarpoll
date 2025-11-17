# OneDollarPoll MVP

A simple, secure polling application that allows anonymous voting with a $1 micro-payment to view results.

## 🚀 Live Demo

**Deployed URL:** [Coming after deployment]

## ✨ Features

- **Create Polls**: Simple form to create polls with multiple options
- **Anonymous Voting**: No registration required, vote anonymously
- **Flexible Results Access**: 
  - Pay $1 to view results
  - Free public polls 
  - Auto-reveal after N votes
- **Admin Panel**: Manage polls and view analytics
- **Secure Payments**: Stripe integration with webhook verification
- **Anti-fraud**: Rate limiting and client fingerprinting

## 🛠 Tech Stack

- **Frontend + Backend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL 
- **Payments**: Stripe Checkout + Webhooks
- **Hosting**: Vercel

## 🏗 Setup Instructions

### 1. Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
DATABASE_URL=postgresql://username:password@host:port/database
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production
APP_BASE_URL=http://localhost:3000 # or your production URL
```

### 2. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database: `createdb onedollarpoll`
3. Run the schema: `psql onedollarpoll < schema.sql`

#### Option B: Supabase (Recommended)
1. Create a new project at [supabase.com](https://supabase.com)
2. Copy the connection string from Settings → Database
3. Run the SQL from `schema.sql` in the Supabase SQL editor

#### Option C: PlanetScale
1. Create a new database at [planetscale.com](https://planetscale.com)
2. Get the connection string
3. Adapt the schema for MySQL (remove PostgreSQL-specific features)

### 3. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Get your test API keys from the dashboard
3. Set up a webhook endpoint:
   - URL: `https://your-domain.com/api/webhook/stripe`
   - Events: `checkout.session.completed`
   - Copy the webhook secret

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to a Git repository
2. Connect your repo to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Deploy to Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your Git repository
3. Set build command: `npm run build`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy!

### Deploy to Netlify

1. Build the project: `npm run build`
2. Deploy the `.next` folder to [Netlify](https://netlify.com)
3. Configure environment variables
4. Set up serverless functions for API routes

## 🧪 Testing the Complete Flow

### End-to-End Test

1. **Create a Poll**:
   - Go to the homepage
   - Fill in poll details
   - Set visibility to "Pay $1 to view results"
   - Submit and save the admin URL

2. **Vote on the Poll**:
   - Open the poll URL in an incognito window
   - Select options and vote
   - Confirm "Vote recorded" message appears

3. **Test Payment Flow**:
   - Click "Pay $1 to View Results"
   - Use Stripe test card: `4242 4242 4242 4242`
   - Exp: Any future date, CVC: Any 3 digits
   - Complete payment

4. **Verify Results**:
   - After payment, results should appear
   - Refresh page to confirm results persist

5. **Test Admin Panel**:
   - Visit the admin URL
   - Verify analytics show vote and payment data
   - Test poll deletion

### Test Cards

- **Success**: `4242 4242 4242 4242`
- **Declined**: `4000 0000 0000 0002`
- **Requires 3D Secure**: `4000 0025 0000 3155`

## 🏗 Database Schema

The application uses three main tables:

- **polls**: Store poll data and configuration
- **votes**: Record anonymous votes with client fingerprinting
- **payments**: Track Stripe payments and reveal tokens

See `schema.sql` for the complete database structure.

## 🔒 Security Features

- **Rate Limiting**: Prevents spam voting and payment abuse
- **Client Fingerprinting**: Anonymous tracking without personal data
- **Webhook Verification**: Stripe webhook signature validation
- **SQL Injection Protection**: Parameterized queries
- **Admin Token Security**: UUID-based admin access

## 📈 Known Limitations

- **Client Fingerprinting**: Not 100% unique, determined users can vote multiple times
- **No reCAPTCHA**: Would improve anti-spam protection
- **Basic Analytics**: Could include more detailed insights
- **No Email Notifications**: Admin doesn't get notified of activity
- **Limited Poll Types**: Only single/multi choice, no ranked voting

## 🔮 Recommended Next Features

1. **Enhanced Security**: Add reCAPTCHA v3 integration
2. **Better Analytics**: Geographic data, time-series charts
3. **Poll Templates**: Pre-built poll types and themes
4. **Social Sharing**: Open Graph meta tags, Twitter cards
5. **Export Data**: CSV/JSON export for poll results
6. **Custom Pricing**: Allow poll creators to set result price
7. **Bulk Operations**: Admin panel for managing multiple polls
8. **API Access**: REST API for integrations

## 📝 License

MIT License - feel free to use this code for your projects!

## 🐛 Issues & Support

If you encounter any issues:

1. Check that all environment variables are set correctly
2. Verify database connection and schema is applied
3. Confirm Stripe webhooks are configured properly
4. Check browser console and server logs for errors

For deployment issues, consult the platform-specific documentation for Next.js applications.