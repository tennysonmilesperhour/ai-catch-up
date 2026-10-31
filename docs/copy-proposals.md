# Copy proposals waiting for approval

Content in `/content/` belongs to Strategy Claude and Tennyson (see `CLAUDE.md`, "Handoff protocol"). Claude Code does not change it on its own judgment. This file holds proposed replacement copy so Tennyson can approve, edit or reject it. Once approved, paste the chosen text into `HANDOFF.md` under "Pending instructions" (or tell Claude Code directly) and it will be applied, and the entry here deleted.

## 1. Support claims that promise something that does not exist (ship-plan 0.6)

Opened 2026-10-31. Status: **waiting on Tennyson.**

### The problem

The landing page promises live chat with "real humans" and a "14-min average" response time. There is no chat widget anywhere in the app, no support inbox wired up, and the 14-minute figure has no data behind it. A buyer who looks for the chat icon will not find one. That is the kind of gap that turns into refund requests and chargebacks.

### The one decision needed first

Pick the real support channel and the response window you can actually keep. The proposals below assume:

- **Channel:** email, at an address you own (written below as `SUPPORT_EMAIL`; for example `support@` on your domain, or your own inbox).
- **Window:** a reply within 2 business days.

If you choose something else, swap those two values in every line below. Do not publish a response time you have not measured.

### Proposed replacements

**`content/landing/faq.mdx`, line 8 (`lead`)**

- Now: `If your question isn't here, the chat icon up top works. A real human reads it.`
- Proposed: `If your question isn't here, email SUPPORT_EMAIL. I read every message myself and reply within two business days.`

**`content/landing/pricing.mdx`, line 5 (`sub`)**

- Now: `No tiers. No upsells. The setup, artifacts, chat support, lifetime access to all future updates.`
- Proposed: `No tiers. No upsells. The setup, the artifacts, email support, lifetime access to all future updates.`

**`content/landing/pricing.mdx`, line 14 (features list)**

- Now: `Real humans on chat (14-min average)`
- Proposed: `Email support from the person who built it`

**`content/landing/pricing.mdx`, line 20 (aside row)**

- Now: `{ k: "Support", v: "Real humans", small: "14-min avg" }`
- Proposed: `{ k: "Support", v: "Email", small: "reply in 2 business days" }`

**`components/landing/Pricing.tsx`, line 72 (the "The price" hover hint).** This one is component code, so Claude Code owns the file, but it is still a buyer-facing claim, so it waits for the same approval and ships together with the content changes above.

- Now: `$49 one-time. Locked in v1.0; never going up for existing buyers. Includes lifetime updates, the full prompt library, the live Workspace Pulse, and chat support with real humans.`
- Proposed: `$49 one-time. Locked in v1.0; never going up for existing buyers. Includes lifetime updates, the full prompt library, the live Workspace Pulse, and email support from the person who built it.`

### Nearby claims worth a second look (not changed, just flagged)

While reading these files, three more lines looked like promises that may not be backed yet. Worth deciding on in the same pass:

- `content/landing/pricing.mdx`, aside row `Cancellation: Anytime, keep what you built`. The product is a one-time payment, so there is nothing to cancel. Suggest replacing the row, for example `{ k: "Payment", v: "Once", small: "no subscription" }`.
- `content/landing/faq.mdx`, "Updates push automatically when Claude releases new capabilities" and "Updates ship to your repo and your prompt library". Nothing in the code pushes updates to a buyer's repo today. If updates will arrive by email or inside the workspace instead, the copy should say that.
- `content/landing/faq.mdx` and `pricing.mdx`, "30-day refund, no questions". Fine if that is the policy; make sure the Stripe receipt and any terms page say the same thing.
