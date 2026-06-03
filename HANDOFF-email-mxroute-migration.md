# HANDOFF — usforeclosurerecovery.com email moved Hostinger → MXRoute (2026-06-03)

Read this before touching anything email/draft related in this app.

## TL;DR
- `usforeclosurerecovery.com` inbound email was migrated from **Hostinger** to **MXRoute** (`redbull.mxrouting.net`, DirectAdmin account `startmyb`).
- Two new agents added: **Ira Katz** and **Marie Daniel**, both on MXRoute, fully set up for draft creation.
- Rebecca + Joshua **deactivated** (inactive agents — removed from comms resolution).
- App code now picks IMAP host per-mailbox. MX/SPF/DKIM cut over in Cloudflare.

## What changed

### 1. MXRoute mailboxes (DirectAdmin `startmyb` @ redbull.mxrouting.net)
Created (all password `Thepassword#123`): `ira@`, `marie@`, `claim@`, `rebecca@`, `joshua@`, `catchall@`.
- Domain added to account after passing `_da-verify` TXT (added in Cloudflare).
- IMAP/SMTP host: `redbull.mxrouting.net` (IMAP 993 SSL). Webmail: `https://redbull.mxrouting.net/roundcube/`.

### 2. Cloudflare DNS (zone `fcb72b732201ff950f663486e570bf5c`)
- **MX**: now single record `redbull.mxrouting.net` pri 10 (was `mx1/mx2.hostinger.com`).
- **SPF**: `v=spf1 include:mxroute.com -all` (was Hostinger).
- **DKIM**: added `x._domainkey` (MXRoute). Legacy `hostingermail-a._domainkey` left in place (harmless).
- Verified authoritative on 1.1.1.1 + 8.8.8.8.

### 3. App code — `src/app/api/email-draft/route.ts`
- Was hardcoded `const IMAP_HOST = "imap.hostinger.com"`.
- Now `IMAP_HOST_MAP` + `resolveImapHost(senderEmail)`. `ira@`, `marie@`, `claim@` → `redbull.mxrouting.net`; everyone else (incl. `contact@premiersurplusclaims.com`, still Hostinger) → `DEFAULT_IMAP_HOST = imap.hostinger.com`.
- `imapAppendDraft()` now takes an `imapHost` param.
- Commits: `f8e3e37` (ira/marie), `2065367` (claim@ + cutover). Deployed to prod (Vercel, aliased usforeclosureleads.com).

### 4. Vercel env
- `IMAP_CLAIM_PASSWORD` changed `Thepassword#1234` (old Hostinger) → `Thepassword#123` (MXRoute).

### 5. DB `user_pins` (Cognabase foreclosure-db)
- Inserted: Ira Katz (`id 7baab1cf…`, ext 7) + Marie Daniel (`id 60424530…`, ext 8). `email`=`sender_email`=their mailbox, `package_type=partnership`, `imap_password=Thepassword#123`.
- Deactivated (`is_active=false`): Rebecca (`afa2241b…`), Joshua (`2afaac84…`).

## How drafts work (context)
Agent "templates" are NOT stored in mailboxes — they're rendered in code from the agent's `user_pins` row (`src/lib/operator-config.ts` + `email-draft/route.ts`), then pushed into the mailbox `Drafts` folder via direct IMAP APPEND. So a new agent = one `user_pins` row + working IMAP host/password. Nothing to copy mailbox-side.

## VERIFIED
- IMAP login + Drafts APPEND succeed for `ira@` and `marie@` (the exact app operation) → dashboard "Create Draft" works for them.
- MX/SPF/DKIM live on public resolvers.
- claim@ old mail migrating into MXRoute box (idempotent).

## PENDING / next session TODO
1. **Live external inbound test** — send a real email from an outside address (Gmail/phone) to `ira@usforeclosurerecovery.com`, confirm via IMAP it lands in the MXRoute INBOX. (Couldn't do non-interactively: Cox blocks SMTP/25, WARP blocks 25, same-domain sends ambiguous.)
2. **Clerk logins for Ira & Marie** — they must sign in with `ira@`/`marie@usforeclosurerecovery.com`. Option: pre-create Clerk users (skip email verification) so they log in immediately. Verification emails now land in MXRoute.
3. **Old-mail migration** — `claim@` was ~9,743 msgs, copying at ~1.86/s (resumable). `rebecca@`/`joshua@` queued after. Script: `/tmp/migrate.sh` on R740xd, log `/tmp/migrate.log`. Re-run safe (idempotent).
4. **Catch-all** — `catchall@` box created but DirectAdmin API kept catch-all at `:fail:`. Set it in the panel if you want unknown-address mail captured instead of bounced.

## DUPLICATE ACCOUNTS (known, intentional 2026-06-03)
Ira & Marie each already had OTHER dashboard logins before today; per Corey's call we KEEP the new mailbox logins and leave the old ones alone.
- **Canonical going forward**: `ira@usforeclosurerecovery.com` / `marie@usforeclosurerecovery.com` (Clerk pw `Thepassword#123`, user_pins ids `7baab1cf`/`60424530`, partnership). Agents should log in ONLY with these.
- **Old accounts still active (untouched, not deleted):** Ira — Clerk `ira@ikatzlawoffices.com`; user_pins `ira@jamlibconsulting.com` (owner_operator) + `ira@ikatzlawoffices.com` (partnership). Marie — Clerk `brightfuturear@gmail.com` ("D Daniel").
- **RISK**: if an agent logs into an OLD profile, its `sender_email` is null → resolves to `claim@` admin default → drafts go out under the wrong identity. If this becomes a problem, deactivate the old duplicate `user_pins` rows (`is_active=false`). Not done yet (no instruction to).
- No passwords were reset on any pre-existing account; `createUser` only created new ones.

## GOTCHAS (important)
- **redbull.mxrouting.net 993/443/2222/25 are Cox-blocked** from Corey's PC AND R740xd (same ISP). To reach DirectAdmin (2222) or IMAP (993) you MUST go through the **WARP SOCKS5 proxy on R740xd: `127.0.0.1:40000`**. Examples: DirectAdmin via `curl --proxy socks5h://127.0.0.1:40000`; IMAP via PySocks (`socks.set_default_proxy(socks.SOCKS5,"127.0.0.1",40000)` then monkeypatch `socket.socket`). proxychains4 config at `~/pc.conf` on R740xd.
- **The Vercel app is NOT blocked** — it reaches redbull:993 directly. So production drafts work even though local tests need the proxy.
- R740xd SSH: `admin1@192.168.0.141` (pw `Chicoislove4u`). (10.28.28.x IPs are STALE.)
- MXRoute account: DirectAdmin `startmyb` / `yGZJP%+_0qiY` @ `https://redbull.mxrouting.net:2222`.
- `premiersurplusclaims.com` (Amariyon) stays on Hostinger — do NOT flip its IMAP host.
- After full confidence, you can simplify by flipping `DEFAULT_IMAP_HOST` to redbull and removing per-entry mappings — but only once ALL Hostinger-hosted senders are gone.
