const CONFIG = {
  SUPABASE_URL: 'https://gbpwnmxiqraqawonvlnu.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdicHdubXhpcXJhcWF3b252bG51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MjgxNjAsImV4cCI6MjEwMTAwNDE2MH0.wapFuPZXawp64H7y7vwRtjvFGUup7kUaswfH9pxX844',
  PRODOTTO_SLUG: 'floorbot-pro',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
};

function formatMoney(n) {
  return '€' + n.toFixed(2).replace('.', ',');
}