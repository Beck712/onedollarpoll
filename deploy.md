# Deployment Instructions

## Quick Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial OneDollarPoll MVP"
   git remote add origin https://github.com/yourusername/onedollarpoll.git
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and configure build settings
   - Add these environment variables in Vercel dashboard:

   ```
   DATABASE_URL=postgresql://your-connection-string
   STRIPE_SECRET_KEY=sk_test_your_test_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
   APP_BASE_URL=https://your-app.vercel.app
   ```

3. **Set up Database** (Supabase recommended):
   - Create account at [supabase.com](https://supabase.com)
   - Create new project
   - Go to SQL Editor and run the contents of `schema.sql`
   - Copy connection string and add to Vercel env vars

4. **Configure Stripe Webhook**:
   - In Stripe dashboard, go to Developers > Webhooks
   - Add endpoint: `https://your-app.vercel.app/api/webhook/stripe`
   - Select event: `checkout.session.completed`
   - Copy signing secret and add to Vercel env vars

5. **Deploy**:
   - Vercel will automatically deploy on push
   - Visit your live URL!

## Manual Local Setup

```bash
# Install dependencies (if you have Node.js/npm)
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## Alternative: Deploy with Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## Test the Deployment

1. Create a poll with "Pay to view results"
2. Vote in incognito mode
3. Pay $1 using test card: 4242 4242 4242 4242
4. Verify results appear after payment
5. Check admin panel with saved admin URL

The MVP is complete and ready for deployment!