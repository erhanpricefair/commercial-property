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
> `claude/optimistic-cori-p76c47`. It's a Next.js app with SQLite on
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
`claude/optimistic-cori-p76c47`.

**3. Add a volume.** In the service, go to **Variables → Volumes → New Volume**
and set the mount path to `/data`.

> This is the step you cannot skip. The volume is where the lead database
> lives. Without it, every redeploy wipes every lead you've collected.

**4. Set your variables.** In **Variables**, add:

| Variable | Value |
| --- | --- |
| `DATABASE_PATH` | `/data/platform.db` |
| `OWNER_ALERT_EMAIL` | `erhan@newpfproperty.com.au` (where hot-lead alerts land) |
| `ADMIN_SETUP_TOKEN` | Any long random phrase you invent |

The site address, business name, licence and contact details are already set
in the code (`src/lib/site.ts`) — no need to enter them here.

`ADMIN_SETUP_TOKEN` is a password you'll type once when creating your login.
Setting it means nobody else can claim the account in the minutes after you
deploy. Invent something long and keep it handy.

**5. Add your domain.** Settings → Networking → Custom Domain → enter
`www.newpfproperty.com.au`. Railway shows you a CNAME value (it ends in
`.up.railway.app`) — you'll paste it into GoDaddy in the section
[Moving newpfproperty.com.au off the GoDaddy site](#moving-newpfpropertycomau-off-the-godaddy-site).

**6. Done.** Everything from here happens in the browser.

---

## Option C: Fly.io, with a terminal

You'll need [Node.js](https://nodejs.org) and the
[Fly CLI](https://fly.io/docs/flyctl/install/) installed.

```bash
git clone https://github.com/erhanpricefair/commercial-property.git
cd commercial-property
git checkout claude/optimistic-cori-p76c47

# fly.toml is already set up for NewPF (app "newpf-townhouses")
fly launch --no-deploy --copy-config
fly volumes create data --size 1 --region syd
fly secrets set OWNER_ALERT_EMAIL=erhan@newpfproperty.com.au ADMIN_SETUP_TOKEN="a long random phrase"
fly deploy
fly certs add www.newpfproperty.com.au
```

Your CNAME value for GoDaddy (next section) is `newpf-townhouses.fly.dev`.

---

## Moving newpfproperty.com.au off the GoDaddy site

Your domain currently shows a GoDaddy-built website. You're going to point it
at the new site instead. **Your email (erhan@newpfproperty.com.au) must keep
working, so you only touch the two things below.**

Do this only after the new site works at its temporary address (the
`.up.railway.app` or `.fly.dev` one).

**1. Take a screenshot of your DNS first.** GoDaddy → My Products →
newpfproperty.com.au → **DNS**. Screenshot the whole list of records. If
anything goes wrong, this is how you put it back.

**2. Leave the email records alone.** In that list, do not edit or delete:
- anything of type **MX**
- **TXT** records (especially ones starting `v=spf1`, and any named `_dmarc`)
- **CNAME** records named `autodiscover`, `email`, `lyncdiscover`, `sip`,
  `enterpriseregistration` or similar

**3. Point `www` at the new site.** Find the **CNAME** record named **www**
(it usually says `@` today) → Edit → change the value to your CNAME value
(the `.up.railway.app` address from Railway, or `newpf-townhouses.fly.dev`)
→ Save.

> If GoDaddy won't let you edit it because the domain is connected to your
> GoDaddy website, disconnect the domain in that website's settings first
> (or ask GoDaddy support: "please disconnect newpfproperty.com.au from my
> Website Builder site so I can edit the www record — keep my email as is").

**4. Send the bare domain to www.** Same DNS page → **Forwarding** → Add
forwarding for `newpfproperty.com.au` → forward to
`https://www.newpfproperty.com.au` → **Permanent (301)** → Save. This means
people who type it without "www" still arrive.

**5. Wait, then check.** It usually takes from a few minutes to a few hours.
When `https://www.newpfproperty.com.au` shows the new site with a padlock,
and you've sent yourself a test email that arrives, you're switched over.

**6. Only then cancel the GoDaddy website plan** — and check the cancellation
doesn't include your domain or your email, which are separate products.

Old page addresses from the GoDaddy site (`/about-us`, `/contact-us`,
`/services` and similar) are already redirected to the new home page. If your
old site had other pages, add their addresses to `next.config.ts`.

---

## Then, all in your browser

**1. Create your login.** Visit `https://www.newpfproperty.com.au/admin`. It sends you
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

## Email sending and backups

**Email.** The server sends queued email itself every 5 minutes
(`EMAIL_DISPATCH_INTERVAL_SECONDS`), but only once `EMAIL_PROVIDER` is set to
a real provider with its key. Until then nothing is sent — confirmations and
guide links wait in the queue. Keep the app on ONE machine (fly.toml does):
two machines would each have their own database. `npm run email:dispatch`
still works for previewing messages locally.

**Backups — not automatic.** The database is your entire lead pipeline. Railway volumes can be
backed up from their dashboard; on Fly use
`fly ssh sftp get /data/platform.db`. Set a reminder if nothing automatic.

---

## Before you spend money on ads

```
npm run audit:privacy -- https://www.newpfproperty.com.au
```

That's a terminal command — ask whoever deployed it to run it, or skip it and
check by hand:

- [ ] `www.newpfproperty.com.au/api/health` shows `ok: true`
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
