# End-to-End Testing Guide

## Complete Test Flow

### 1. Create Poll Test
1. Go to homepage
2. Fill in poll: "What's your favorite color?"
3. Options: "Red", "Blue", "Green", "Yellow" 
4. Set to "Pay $1 to view results"
5. Submit and save both URLs (share + admin)

### 2. Voting Test
1. Open share URL in incognito browser
2. Select "Blue" and submit vote
3. Verify "Vote recorded" message appears
4. Confirm "Pay $1 to View Results" button shows

### 3. Payment Test
1. Click "Pay $1 to View Results"
2. Redirected to Stripe Checkout
3. Use test card: `4242 4242 4242 4242`
4. Expiry: `12/34`, CVC: `123`
5. Complete payment
6. Redirected back to poll with success message
7. Results should appear automatically

### 4. Results Verification
1. Refresh page - results should persist
2. Open poll URL in new incognito window
3. Should still show payment required
4. Original browser should still see results

### 5. Admin Panel Test
1. Open admin URL
2. Verify analytics show:
   - 1 total vote
   - 1 unique voter
   - 1 payment
   - $1.00 revenue
3. Confirm results display correctly
4. Test poll deletion (optional)

## Expected Stripe Test Cards

- **Successful Payment**: `4242 4242 4242 4242`
- **Declined Card**: `4000 0000 0000 0002`
- **Insufficient Funds**: `4000 0000 0000 9995`

## Troubleshooting

If results don't appear after payment:
1. Check webhook logs in Stripe dashboard
2. Verify webhook endpoint is correct
3. Confirm webhook secret matches env var
4. Wait 30 seconds and refresh

If you can vote multiple times:
1. This is expected - fingerprinting isn't 100% unique
2. Clear cookies to reset client hash
3. Use different browsers/devices for testing