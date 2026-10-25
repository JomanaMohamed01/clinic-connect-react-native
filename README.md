# Bloom Clinic (React Native)

Expo remake of the Bloom Clinic website. Patients book 15-minute visits, and reception manages the same day's reservations.

Both apps are meant to use **one** Supabase project: the same URL, anon key, `bookings` table, and Auth users as `clinic-connect`.

## Run

```bash
npm install
npx expo start
```

Open the project in Expo Go, or press `a` / `i` for a simulator.

Copy `.env.example` to `.env` and add the existing clinic Supabase values before signing in. Restart with `npx expo start -c` after changing `.env`.
