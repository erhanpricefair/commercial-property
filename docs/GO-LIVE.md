# Go live

Nothing in this repository earns anything until it is on a domain taking
registrations. This is the shortest path there.

Budget about 30 minutes for steps 1–5.

---

## 1. Choose hosting that keeps your data

**The lead database is the business.** It is SQLite, on disk.

> On Vercel, Netlify, Cloud Run and most serverless platforms the filesystem is
> ephemeral. Every deploy would silently destroy every lead you had collected.
> Do not deploy there without first migrating to Postgres.

Anything with a persistent volume works as-is: Fly.io, Railway, Render with a
disk, a VPS, or any container host with a mount. `fly.toml` in the repo is
configured for Fly with a Sydney region and a 1GB volume.

## 2. Deploy

```bash
# Edit fly.toml first: set app name and the NEXT_PUBLIC_* build args to your
# real domain. Public config is inlined at build time, so getting it right
# before the first build saves rebuilding.

fly launch --no-deploy --copy-config
fly volumes create data --size 1 --region syd
fly deploy
```

Confirm it came up healthy:

```bash
curl https://your-app.fly.dev/api/health
# {"ok":true,"database":"connected","investors":0,...}
```

## 3. Create your admin account

```bash
fly ssh console -c "npm run admin:create -- you@yourdomain.com.au 'Your Name'"
```

It prints a generated password once. Store it in your password manager.

**If you seeded a demo database, delete the seeded admin now** — it has a
publicly known password.

## 4. Point your domain

Add the domain in your host, then create the DNS records it gives you. Confirm
HTTPS works before running any ads — session cookies are `secure` in
production, and the admin will not log in over plain HTTP.

## 5. Set your secrets

```bash
fly secrets set \
  EMAIL_PROVIDER=resend \
  RESEND_API_KEY=... \
  EMAIL_FROM="Commercial Investor Access <invest@yourdomain.com.au>" \
  OWNER_ALERT_EMAIL=you@yourdomain.com.au
```

`OWNER_ALERT_EMAIL` is the one that matters most on day one: it is what pings
you the moment a HOT lead registers, with their number as a tap-to-call link.

Optional but worth doing before spending on ads:

```bash
fly secrets set \
  NEXT_PUBLIC_META_PIXEL_ID=... \
  NEXT_PUBLIC_GA_MEASUREMENT_ID=... \
  SLACK_WEBHOOK_URL=...
```

Note the `NEXT_PUBLIC_*` values are inlined at **build** time — set them as
build args in `fly.toml` and redeploy, not just as runtime secrets.

## 6. Record your coverage

Matching needs to know what you can source. It does **not** need your partner's
stocklist — see [`COVERAGE.md`](COVERAGE.md) for why that distinction matters.

```bash
fly ssh console -c "npm run coverage:seed"
```

That seeds ten broad Victorian bands, every one marked `VERIFY`. Then open
**Admin → Coverage** and correct each band to what you can genuinely source.
Takes about ten minutes and it is the difference between a call list you can
trust and one you can't.

## 7. Schedule the follow-up dispatcher

Queued emails only send when something drains the queue.

```bash
fly ssh console -c "npm run email:dispatch"   # test it once by hand
```

Then run it every 15 minutes — a Fly scheduled machine, a cron job, or an
external scheduler hitting a small endpoint you add. Without this, nobody
receives the welcome email.

## 8. Back up the database

```bash
fly ssh sftp get /data/platform.db ./backup-$(date +%F).db
```

Do this on a schedule. Losing the volume means losing every lead, every note
and every deal.

---

## Pre-flight checklist

Run this before you spend a dollar on traffic:

```bash
npm run audit:privacy -- https://yourdomain.com.au
```

It should report 0 failures. Then check by hand:

- [ ] `/api/health` returns `ok: true`
- [ ] Registering on your live site produces a lead in `/admin/investors`
- [ ] You received the HOT lead alert email
- [ ] The welcome email arrived after running the dispatcher
- [ ] `/admin` redirects to login when signed out
- [ ] Your coverage areas are recorded and verified (not left as `VERIFY`)
- [ ] A test investor shows coverage matches that look right to you
- [ ] The database is backed up somewhere off the host

---

## Moving to Postgres later

All SQL is plain and confined to `src/lib/db.ts` and `src/lib/repositories/`.
Swap the driver, port the schema (`AUTOINCREMENT` → `IDENTITY`,
`datetime('now')` → `now()`), adapt the repository functions. Nothing else in
the application touches the database.

Worth doing when you have more than one person in the admin at once, or when
you want managed backups more than you want simplicity.
