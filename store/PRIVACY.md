# WhatSite — Privacy Policy

**Effective date:** 20 May 2026
**Extension:** WhatSite — Cookie & Connection Tracker
**Developer:** Tom Clark · [cloudsecurity.global](https://cloudsecurity.global)

WhatSite is built privacy-first. This policy explains exactly what the
extension accesses, what (if anything) leaves your device, and what is stored.
In plain terms: **the developer operates no server, runs no analytics, and
receives none of your data.**

---

## Summary

- WhatSite does **not** collect, store, or transmit your personal information.
- It does **not** track your browsing history, build a profile, or show ads.
- All page analysis happens **locally, in memory**, and is cleared when you
  leave the page or close the tab.
- The only data that leaves your browser are **individual domain names**, sent
  to third-party reputation and geolocation APIs so the extension can show you
  IP and threat information. These requests are not linked to your identity.
- The developer has **no back-end** and never sees any of your data.

---

## What the extension accesses

To do its job, WhatSite reads the following **on your device only**:

- **Cookies** for the pages you visit — to classify them as first-party or
  third-party and show you the counts.
- **Network requests** made by the pages you visit (observed, via the browser's
  `webRequest` API) — to list the external domains each page connects to.
- **The active tab and navigation events** — to know which page's data to show
  and to reset that data when you navigate away.

This information is held in memory, per tab, and is **discarded when you
navigate away or close the tab**. It is never written to disk and never sent
to the developer.

---

## What data leaves your browser

To enrich each external domain with geolocation and threat information,
WhatSite sends a single piece of data — either **the domain name alone** (for
example, `cdn.example.com`) or the **server IP address** the connection
already went to — to the following third-party services over HTTPS:

| Service | Purpose | Provider's privacy policy |
|---------|---------|---------------------------|
| `api.ipquery.io` | Geolocation of a server IP address (country, city, hosting provider) | https://ipquery.io/ |
| `urlhaus-api.abuse.ch` | Malware-reputation lookup (only if you configure an Auth-Key) | https://abuse.ch/ |
| `security.cloudflare-dns.com` | DNS-over-HTTPS, malware-filtering resolver | https://www.cloudflare.com/privacypolicy/ |
| `dns.google` | DNS-over-HTTPS, plain resolver (used for comparison) | https://policies.google.com/privacy |

Important limits on what is sent:

- Only a **bare domain name** or a **server IP address** is sent — never full
  URLs, never page content, never form data, never cookies, and never anything
  that identifies you.
- Requests are sent **as functional API lookups**. The developer does not
  receive copies of them and operates no intermediary server.
- Each unique domain is queried **at most once per browsing session** and the
  result is cached in memory only.

If you choose to configure an abuse.ch Auth-Key (an optional, free key you
obtain yourself), that key is sent to `urlhaus-api.abuse.ch` to authenticate
those lookups, exactly as abuse.ch requires.

---

## What is stored on your device

WhatSite persists only two small, non-personal items, both in local browser
storage on your device — never on a remote server:

1. **Your optional abuse.ch Auth-Key**, if you enter one on the Settings page.
   It is held in the browser's native extension storage, scoped to this browser
   profile — it does not sync to other browsers, profiles, or devices. This is
   configuration you supplied; you can clear it at any time from Settings.
2. **The Hover Inspector on/off preference.**

In addition, when WhatSite auto-blocks a high-risk domain or you grant a
temporary "allow" exception, the browser stores the corresponding block/allow
**rule** (a domain name and, for timed allows, an expiry timestamp) in its own
`declarativeNetRequest` and `alarms` stores. These contain no browsing history
and are removed automatically when the rule is lifted.

No browsing history, no analytics, and no personal data are ever stored.

---

## What WhatSite never does

- It never collects names, email addresses, or other personal identifiers.
- It never collects authentication credentials, financial or health data, or
  personal communications.
- It never records or transmits the list of pages you visit.
- It never sells or shares data with advertisers or data brokers.
- It never executes remote code — it loads only the JavaScript shipped inside
  the extension package.

---

## Permissions

WhatSite requests broad host access (`<all_urls>`) because it is designed to
work on every site you visit — there is no way to know in advance which sites
you will want analysed. Each permission is used solely for the features
described above and for no other purpose.

---

## Children's privacy

WhatSite is a general-purpose security utility, is not directed at children,
and does not knowingly collect any information from anyone.

---

## Changes to this policy

If this policy changes, the updated version will be published at this URL with
a new effective date. Material changes will also be reflected in the
extension's store listing.

---

## Contact

Questions about this policy or WhatSite's privacy practices can be directed to
the developer via [cloudsecurity.global](https://cloudsecurity.global).
