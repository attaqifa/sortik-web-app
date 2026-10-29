/* SORTIK — koneksi Supabase.
   Ganti dua nilai di bawah punya Anda sendiri:
   Dashboard Supabase → Project Settings → API → Project URL & anon public key.
   (anon key aman dipublikasikan — keamanannya dijaga RLS di database) */
const sb = supabase.createClient(
  "https://fjmmcnbeioiooioycmdt.supabase.co",   // ← Project URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbW1jbmJlaW9pb29pb3ljbWR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNjYxOTcsImV4cCI6MjEwODg0MjE5N30.8R8PFku_7tSOzt4-IQELRWK-qEC-OoaG9dGFAqsX7_o"                    // ← anon public key
);
