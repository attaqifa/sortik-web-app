/* SORTIK — koneksi Supabase.
   Ganti dua nilai di bawah punya Anda sendiri:
   Dashboard Supabase → Project Settings → API → Project URL & anon public key.
   (anon key aman dipublikasikan — keamanannya dijaga RLS di database) */
const sb = supabase.createClient(
  "https://osogxpkbatfwdcwylksm.supabase.co",   // ← Project URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zb2d4cGtiYXRmd2Rjd3lsa3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNjgzMDcsImV4cCI6MjEwODc0NDMwN30.cmQATV1DiYyLw6CqFXKWiOC4Q0n-pchFpKn6a49ZwVg"                    // ← anon public key
);
