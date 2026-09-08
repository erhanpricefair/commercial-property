# Getting the site live

## First: where do you run commands?

Fair question, and I should have answered it earlier. Commands like
`npm run coverage:seed` are **terminal commands** — they run on a computer with
the project's code on it, or inside your hosting provider's console. They are
not something you type into a browser.

**The good news: you no longer need a terminal for the things you'd actually
do day to day.** Creating your login and adding your coverage both happen in
the browser now. You need a terminal (or someone with one) exactly once: to
get the site onto the internet the first time.

Three honest options for that one step:

| Option | Effort | Cost | Best if |
| --- | --- | --- | --- |
| **Pay a developer** | You send a link, they do it | ~1–2 hours of their time | You'd rather not touch this at all |
| **Railway's website** | ~30 min, mostly clicking | ~US$5–10/month | You're comfortable following steps |
| **Terminal (Fly.io)** | ~30 min, typing commands | ~US$5/month | You've used a terminal before |

If you go the developer route, send them this file and `fly.toml` — it'll take
them less time than reading the brief.

---

## Option A: hand it to a developer

Send them:

> The repo is `erhanpricefair/commercial-property`, branch
> `claude/commercial-property-leads-mfm0zn`. It's a Next.js app with SQLite on
> a persistent volume. `Dockerfile` and `fly.toml` are ready to go. **The
> filesystem must persist** — it holds the lead database — so not Vercel
> unless you migrate to Postgres first. Once it's up and the domain points at
> it, I'll do the rest through the admin.

Ask them to give you the live URL and confirm `/api/health` returns `ok: true`.

---

## Option B: Railway, through their website

Railway builds straight from GitHub with no terminal.

**1. Sign up** at railway.app and connect your GitHub account.

**2. New Project → Deploy from GitHub repo.** Pick
`erhanpricefair/commercial-property`, and set the branch to
`claude/commercial-property-leads-mfm0zn`.

**3. Add a volume.** In the service, go to **Variables → Volumes → New Volume**
and set the mount path to `/data`.

> This is the step you cannot skip. The volume is where the lead database
> lives. Without it, every redeploy wipes every lead you've collected.

**4. Set your variables.** In **Variables**, add:

| Variable | Value |
| --- | --- |
| `DATABASE_PATH` | `/data/platform.db` |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com.au` |
| `NEXT_PUBLIC_SITE_NAME` | Your business name |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Your contact email |
| `OWNER_ALERT_EMAIL` | Where hot-lead alerts should land |
| `ADMIN_SETUP_TOKEN` | Any long random phrase you invent |

`ADMIN_SETUP_TOKEN` is a password you'll type once when creating your login.
Setting it means nobody else can claim the account in the minutes after you
deploy. Invent something long and keep it handy.

**5. Add your domain.** Settings → Networking → Custom Domain, then add the DNS
record Railway shows you at your domain registrar. Wait for HTTPS to go green
before doing anything else — the admin won't log in over plain HTTP.

**6. Done.** Everything from here happens in the browser.

---

## Option C: Fly.io, with a terminal

You'll need [Node.js](https://nodejs.org) and the
[Fly CLI](https://fly.io/docs/flyctl/install/) installed.

```bash
git clone https://github.com/erhanpricefair/commercial-property.git
cd commercial-property
git checkout claude/commercial-property-leads-mfm0zn

# Edit fly.toml: set the app name and NEXT_PUBLIC_* build args first
fly launch --no-deploy --copy-config
fly volumes create data --size 1 --region syd
fly secrets set OWNER_ALERT_EMAIL=you@yourdomain.com.au ADMIN_SETUP_TOKEN="a long random phrase"
fly deploy
```

---

## Then, all in your browser

**1. Create your login.** Visit `https://yourdomain.com.au/admin`. It sends you
to a setup page. Enter your name, email and a password (plus the setup key if
you set one). **Do this immediately after deploying** — the page closes forever
the moment you submit.

**2. Add your coverage.** Admin → Coverage. Either add your own areas, or press
**Add starter areas** for a set covering Melbourne's main industrial and
commercial precincts, then correct them. Every one is marked `VERIFY` until you
confirm it. Budget fifteen minutes; it's the difference between a call list you
trust and one you don't.

**3. Set your target.** Admin → Settings. Your revenue target and commission
rate, so the dashboard can tell you where you stand.

**4. Test it yourself.** Open your own site, register as if you were an
investor, and check that:

- the lead appears in Admin → Investors
- the alert email reaches you
- the coverage matches look right

If all three work, you're live.

---

## Two things that still need a schedule

Neither is urgent on day one, but the follow-up emails won't send without the
first.

**Follow-up emails.** Queued messages need something to send them every 15
minutes or so. On Railway: add a **Cron** service running
`npm run email:dispatch`. On Fly: a scheduled machine. Ask whoever set up the
deploy — it's a five-minute job.

**Backups.** The database is your entire lead pipeline. Railway volumes can be
backed up from their dashboard; on Fly use
`fly ssh sftp get /data/platform.db`. Set a reminder if nothing automatic.

---

## Before you spend money on ads

```
npm run audit:privacy -- https://yourdomain.com.au
```

That's a terminal command — ask whoever deployed it to run it, or skip it and
check by hand:

- [ ] `yourdomain.com.au/api/health` shows `ok: true`
- [ ] Registering on your live site creates a lead in the admin
- [ ] The hot-lead alert reached your inbox
- [ ] Signing out and visiting `/admin` sends you to the login page
- [ ] Your coverage is verified, not left on the seeded defaults
- [ ] The database is backed up somewhere other than the host

---

## If something's wrong

**Site won't load** — check the deploy logs in Railway/Fly for a red error.

**Admin won't log in** — confirm the address starts `https://`, not `http://`.

**Leads disappeared after a deploy** — the volume isn't mounted at `/data`, or
`DATABASE_PATH` isn't set to `/data/platform.db`. Fix both, and treat anything
collected before now as lost.

**Setup page says an account already exists** — it's been used. Sign in at
`/admin/login`, or reset the password from a terminal with
`npm run admin:create`.
