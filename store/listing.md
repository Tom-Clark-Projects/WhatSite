# CookieSpy — Store Submission Pack

Everything needed to fill in the Chrome Web Store and Microsoft Edge Add-ons
submission forms. Copy/paste from here. Items marked **[ACTION]** need a
decision or input from you.

---

## 1. Basics

| Field | Value |
|-------|-------|
| Extension name | CookieSpy |
| Version | 1.0.0 |
| Category | **Chrome:** "Privacy & Security" · **Edge:** "Productivity" (Edge has no privacy category) |
| Language | English |
| Privacy policy URL | **[ACTION]** Publish `store/PRIVACY.md` on cloudsecurity.global and paste the URL, e.g. `https://cloudsecurity.global/cookiespy/privacy` |

> **[ACTION] — Check the name is free.** Search "CookieSpy" in both stores
> before submitting. If another live extension already uses it, you'll need a
> variant (e.g. "CookieSpy — Connection Tracker"). Update `name` in
> `manifest.json` to match whatever you submit.

---

## 2. Short description / summary

Used as the one-line summary (max 132 characters). This matches the
`manifest.json` description:

```
Per-tab visibility into cookies, third-party connections, IP geolocation and live threat scores, with optional auto-blocking.
```

---

## 3. Detailed description

Paste into the store's "Detailed description" field:

```
CookieSpy shows you exactly what every web page is doing behind the scenes —
which cookies it sets, which external companies it talks to, and whether any
of those connections are risky.

WHAT YOU SEE, PER TAB

• First-party cookies — cookies set by the site you're actually on
• Third-party cookies — cookies from other domains
• External connections — every outside domain the page contacts, with a
  request count and IP geolocation (country, city, hosting provider)
• Threat score — each external domain is scored 0–100 using free, reputable
  threat-intelligence sources

The toolbar icon shows a live, colour-coded badge so you can spot a heavily-
tracked page at a glance, without even opening the popup.

THREAT INTELLIGENCE

Every external domain is checked against:

• URLhaus (abuse.ch) — a malware-distribution database
• A DNS-over-HTTPS comparison between Cloudflare's malware-filtering resolver
  and a plain resolver

Domains with live malware activity are scored high and clearly flagged.

AUTO-BLOCKING WITH TIMED RELEASE

High-risk domains are blocked automatically. If a block ever gets in your way,
you can release it for just the current site, for a duration you choose —
10 minutes, 1 hour, or until you close the tab — after which the block returns
on its own. No permanent whitelist that quietly erodes your protection.

HOVER INSPECTOR

Switch on the Hover Inspector and move your mouse over any image, iframe or
video on a page to instantly see which domain served it, whether it's first-
or third-party, and its threat score.

PRIVACY BY DESIGN

• No analytics, no ads, no tracking, no account required.
• Page analysis happens locally and is cleared when you leave the page.
• The developer runs no server and receives none of your data.
• The only data that leaves your browser are individual domain names, sent to
  reputation and geolocation APIs so the extension can show you the results.
• Full details in the privacy policy.

NOTE ON THREAT INTELLIGENCE

The strongest threat source, URLhaus, now requires a free Auth-Key from
abuse.ch. CookieSpy works without one (using the DNS-based checks), but for
full coverage you can add a free key on the extension's Settings page — it
takes about two minutes.

CookieSpy is open source.
```

> **[ACTION]** If you want the source repo linked in the description, add the
> public GitHub URL at the end.

---

## 4. Single-purpose statement

Chrome requires a single, narrow purpose. Paste this into the "single purpose"
field:

```
CookieSpy gives users visibility into, and control over, the cookies and
third-party network connections of the web pages they visit. It displays
first/third-party cookie counts, external connections with IP geolocation and
threat scores, and can block domains flagged as malicious. Every feature
serves that one purpose.
```

---

## 5. Permission justifications

Chrome's submission form asks for a justification per permission. Paste each:

**`cookies`**
```
Reads the cookies associated with each page the user views in order to count
them and classify them as first-party or third-party for display in the popup.
```

**`webRequest`**
```
Used only to observe completed and failed network requests (non-blocking) so
the extension can count and list the external domains each tab connects to. It
is not used to modify or block requests.
```

**`declarativeNetRequestWithHostAccess`**
```
Used to block network requests to domains that threat-intelligence sources
flag as malicious, and to apply user-granted, time-limited per-site exceptions
to those blocks.
```

**`webNavigation`**
```
Detects top-level page navigations so the extension can reset a tab's tracking
data when the user moves to a new page.
```

**`alarms`**
```
Schedules the automatic expiry of temporary "allow" exceptions, so a released
domain is re-blocked when the user's chosen time window ends.
```

**`storage`**
```
Stores two non-personal preferences on the user's device: their optional
abuse.ch Auth-Key and the Hover Inspector on/off setting.
```

**Host permission `<all_urls>`**
```
CookieSpy analyses cookies and connections on whatever site the user chooses
to visit, and applies block/allow rules across all sites. Because it cannot
know in advance which sites the user will want analysed, it requires access to
all URLs. It does not single out specific websites.
```

---

## 6. Remote code

**Question: "Does your extension use remote code?" → Answer: NO.**

Justification if asked:
```
The extension executes only the JavaScript bundled inside its package. It
makes HTTPS requests to third-party APIs, but those return data (JSON) only —
no code is fetched or executed.
```

---

## 7. Data-use disclosures (Chrome "Privacy practices" tab)

Tick / declare as follows:

- **Data collected:** "Website content" — specifically, the domain names of
  third-party resources loaded by visited pages, which are sent to threat-
  intelligence and geolocation APIs.
- **Not collected:** personally identifiable information, health information,
  financial/payment information, authentication information, personal
  communications, location, user activity (keystrokes/clicks).
- **Certifications (tick all three — all true):**
  - I do not sell or transfer user data to third parties outside of approved
    use cases.
  - I do not use or transfer user data for purposes unrelated to the
    extension's single purpose.
  - I do not use or transfer user data to determine creditworthiness or for
    lending purposes.

Note: domain names are transmitted to third-party APIs **only as functional
lookups** to deliver the extension's core feature. This is disclosed in the
privacy policy and is consistent with the certifications above.

---

## 8. Screenshots

**[ACTION] — you need to capture these.** Requirements:

- Size: **1280×800** (preferred) or 640×400. PNG or JPEG.
- Chrome: 1–5 screenshots. Edge: 1–10. Provide at least 3–4.

Because the popup is only 360px wide, take each screenshot with the popup open
over a real web page, then crop/pad the result to exactly 1280×800.

Suggested set:

1. The popup on a busy site — External Connections tab, showing the score and
   request columns.
2. The popup with the First-Party / Third-Party cookie tabs visible.
3. A blocked high-risk domain with the timed-allow menu open (use
   `testsafebrowsing.appspot.com` to force this).
4. The Hover Inspector tooltip over an image on a page.
5. The Settings page (the abuse.ch Auth-Key screen).

Optional Chrome promo tile: 440×280.

---

## 9. Pre-submission checklist

- [ ] Name confirmed free in both stores; `manifest.json` `name` matches
- [ ] Privacy policy published; URL pasted into both forms
- [ ] `git archive` ZIP built from the committed tree (see handoff notes)
- [ ] ZIP opened to confirm `manifest.json` is at its root, no `.git`/`store/`
- [ ] Extension loaded once from the ZIP contents and smoke-tested
- [ ] 3–5 screenshots at 1280×800
- [ ] Detailed description, justifications and disclosures pasted in
