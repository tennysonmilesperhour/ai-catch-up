export type ChecklistStatus = "not-started" | "in-progress" | "done";

export type ChecklistActionKind =
  | "open-url"
  | "copy-prompt"
  | "copy-commands"
  | "view-steps";

export interface ChecklistAction {
  kind: ChecklistActionKind;
  label: string;
  payload: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  actions?: ChecklistAction[];
}

export interface ChecklistPhase {
  id: string;
  label: string;
  title: string;
  subtitle: string;
  items: ChecklistItem[];
}

export const LAUNCH_CHECKLIST: ChecklistPhase[] = [
  {
    id: "infrastructure",
    label: "Phase 1",
    title: "Infrastructure",
    subtitle: "Make it actually work",
    items: [
      {
        id: "github-repo",
        title: "GitHub repo created and code pushed",
        description: "The repo exists, your code is on main, and you can pull from it on either Mac.",
        actions: [
          { kind: "open-url", label: "Open GitHub new repo", payload: "https://github.com/new" },
          { kind: "copy-commands", label: "Copy push commands", payload: "git init\ngit add .\ngit commit -m 'initial commit'\ngit branch -M main\ngit remote add origin [YOUR_REPO_URL]\ngit push -u origin main" }
        ]
      },
      {
        id: "vercel-deploy",
        title: "Vercel project connected and deployed",
        description: "The site is live at a *.vercel.app URL and rebuilds on every push to main.",
        actions: [
          { kind: "open-url", label: "Open Vercel new project", payload: "https://vercel.com/new" },
          { kind: "view-steps", label: "See connection steps", payload: "# Connecting GitHub to Vercel\n\n1. Go to vercel.com/new\n2. Click 'Import Git Repository'\n3. Authorize Vercel to access your GitHub if you haven't\n4. Find your repo and click Import\n5. Framework Preset should auto-detect as Next.js\n6. Leave build commands default\n7. Don't set env vars yet, we do that next\n8. Click Deploy\n9. Wait 1-2 minutes\n10. You'll get a live *.vercel.app URL\n\n## Why this matters\n\nEvery push to main now rebuilds the site automatically. You never manually deploy again." }
        ]
      },
      {
        id: "custom-domain",
        title: "Custom domain pointed at Vercel",
        description: "If you have a domain, it's connected. If you don't, the vercel.app subdomain is fine for v1.0.",
        actions: [
          { kind: "view-steps", label: "See domain setup", payload: "# Connecting a custom domain to Vercel\n\n## If you have a domain\n\n1. In your Vercel project, go to Settings > Domains\n2. Type your domain and click Add\n3. Vercel shows you DNS records to add\n4. Go to your domain registrar (Namecheap, Google Domains, etc.)\n5. Find the DNS settings for your domain\n6. Add the records Vercel gave you (usually an A record and a CNAME)\n7. Wait 5-60 minutes for DNS to propagate\n8. Vercel will auto-generate an SSL certificate\n\n## If you don't have a domain\n\nThe *.vercel.app URL is totally fine for v1.0. Skip this item. You can always add a domain later." }
        ]
      },
      {
        id: "env-vars",
        title: "Environment variables set in Vercel",
        description: "STRIPE_PAYMENT_LINK, ADMIN_PASSWORD, NEXT_PUBLIC_SITE_URL are all set in Vercel's Environment Variables panel.",
        actions: [
          { kind: "view-steps", label: "See env var setup", payload: "# Setting env vars in Vercel\n\n1. In your Vercel project, go to Settings > Environment Variables\n2. For each variable in your .env.example file, add it here\n3. Make sure to set it for all environments (Production, Preview, Development)\n4. Click Save after each\n5. Redeploy the site (Deployments tab > click the three dots on the latest deploy > Redeploy)\n\n## Which variables\n\n- STRIPE_PAYMENT_LINK (your Stripe payment link URL)\n- ADMIN_PASSWORD (any strong password for the admin panel)\n- NEXT_PUBLIC_SITE_URL (your live URL, e.g. https://yourdomain.com)\n\n## Why redeploy\n\nEnv vars are baked into the build. Changing them requires a new build." }
        ]
      },
      {
        id: "admin-password",
        title: "Admin password set and tested",
        description: "You've logged into /admin with your password and confirmed it rejects wrong ones."
      },
      {
        id: "stripe-link",
        title: "Stripe payment link created and pasted in",
        description: "You have a real Stripe account, you've made a payment link for $49, and the link is in your Vercel env vars.",
        actions: [
          { kind: "open-url", label: "Open Stripe dashboard", payload: "https://dashboard.stripe.com/payment-links" },
          { kind: "view-steps", label: "See payment link setup", payload: "# Creating a Stripe payment link\n\n1. Sign up or log in at stripe.com\n2. Activate your account (requires business info, takes a few minutes)\n3. Go to Payment Links in the dashboard\n4. Click 'New payment link'\n5. Create a product:\n   - Name: [Your product name]\n   - Description: 60-minute AI onboarding for the person who's become the AI person by default\n   - Price: $49.00 USD\n   - One-time payment\n6. Under 'After payment', select 'Don't show confirmation page, redirect customers to your website'\n7. Redirect URL: [YOUR_SITE_URL]/thank-you\n8. Create the link\n9. Copy the payment link URL\n10. Paste it into STRIPE_PAYMENT_LINK in Vercel\n11. Redeploy\n\n## Test it\n\nUse Stripe's test mode first. Card number: 4242 4242 4242 4242, any future expiry, any CVC." }
        ]
      },
      {
        id: "email-capture",
        title: "Email capture tested with a real submission",
        description: "You submitted your own email on the footer form and confirmed it landed in /data/subscribers.json.",
        actions: [
          { kind: "copy-prompt", label: "Copy Claude Code test prompt", payload: "I want to test the email capture on my site. Walk me through: 1) going to the live URL, 2) submitting my own email on the footer form, 3) confirming it saved to /data/subscribers.json in the deployed Vercel environment, 4) flagging any issues. Note: in production, /data/subscribers.json may not persist between deploys on Vercel. Tell me if this is a problem and suggest the cheapest fix." }
        ]
      },
      {
        id: "error-pages",
        title: "Error pages render (404, 500)",
        description: "Visit a bogus URL and a 404 page shows. If possible, force a 500 and confirm it has a graceful error page.",
        actions: [
          { kind: "copy-prompt", label: "Copy 404/500 page prompt", payload: "Create custom 404 and 500 pages for this Next.js site. They should match the existing design (warm cream background, Georgia serif, subtle terracotta accent). Include: a clear message about what happened, a link back to the home page, and no AI-sounding phrases. Match the tone of the landing page, which is direct and slightly editorial." }
        ]
      }
    ]
  },
  {
    id: "content",
    label: "Phase 2",
    title: "Content",
    subtitle: "Make it ready to show to a human",
    items: [
      {
        id: "hero-video",
        title: "Hero video recorded and embedded",
        description: "The Plateau video exists, is uploaded somewhere (YouTube, Vimeo, or Mux), and the embed works on the landing page.",
        actions: [
          { kind: "view-steps", label: "See video embed steps", payload: "# Embedding your hero video\n\n## Easiest path: YouTube unlisted\n\n1. Upload the video to YouTube\n2. Set visibility to 'Unlisted' (not public, not private)\n3. Copy the embed code from the Share > Embed button\n4. Ask Claude Code to replace the video placeholder div on the landing page with the embed\n\n## Better path if you can afford it: Mux\n\n- Higher quality, faster playback, better analytics\n- $0.005 per minute of video streamed\n- For a 6-minute video with 1000 viewers, that's about $30/month\n- Worth it once you're getting real traffic\n\n## Avoid: self-hosting\n\nVideo files are big and expensive to serve. Don't host the file on Vercel." }
        ]
      },
      {
        id: "plateau-rewrite",
        title: "Plateau story rewritten in your voice",
        description: "You've rewritten the Plateau copy in /content/landing/plateau.mdx so it sounds like you, not like AI."
      },
      {
        id: "no-em-dashes",
        title: "All MDX content reviewed for em dashes",
        description: "You've searched every .mdx file for the em dash character and replaced them all. Em dashes read as AI-generated.",
        actions: [
          { kind: "copy-commands", label: "Copy grep search command", payload: "grep -rn '-' content/ components/ app/ && echo 'If this returned nothing, you are clean.'" }
        ]
      },
      {
        id: "ai-phrase-audit",
        title: "All MDX content reviewed for AI-sounding phrases",
        description: "Searched for: 'unlock', 'harness', 'transform', 'unleash', 'leverage', 'journey', 'seamless', 'robust', 'in today's world', 'at the end of the day'. Replaced any found.",
        actions: [
          { kind: "copy-prompt", label: "Copy phrase audit prompt", payload: "Search every .mdx and .md file in this repo for these AI-sounding words and phrases: unlock, harness, transform, unleash, leverage, journey, seamless, robust, in today's world, at the end of the day, dive deep, game-changer, empower, revolutionize, cutting-edge, streamline. For each one found, show me the file, line, and surrounding context, then suggest a more human replacement. Don't auto-replace anything. Let me review and approve each change." }
        ]
      },
      {
        id: "prompts-tested",
        title: "Every prompt in the library tested by pasting into Claude",
        description: "You've actually pasted each of the 20 prompts into Claude or Claude Code with real inputs and confirmed they produce useful output."
      },
      {
        id: "nexus-accuracy",
        title: "Nexus node descriptions reviewed for accuracy",
        description: "You've hovered every node and confirmed the description is correct, current, and in your voice."
      },
      {
        id: "missing-repos",
        title: "Missing repos added to Nexus",
        description: "You've checked your GitHub against the Nexus and added any repos that are missing, archived any that shouldn't be there.",
        actions: [
          { kind: "open-url", label: "Open your GitHub repos", payload: "https://github.com/tennysonmilesperhour?tab=repositories" }
        ]
      },
      {
        id: "ghost-nodes-reviewed",
        title: "Ghost nodes reviewed",
        description: "You've looked at every ghost node and confirmed each one is still a real gap you care about. Removed any that aren't."
      }
    ]
  },
  {
    id: "launch-readiness",
    label: "Phase 3",
    title: "Launch Readiness",
    subtitle: "Make it real",
    items: [
      {
        id: "seo-meta",
        title: "SEO meta tags set",
        description: "Title, description, keywords, and canonical URL are set correctly in the Next.js metadata.",
        actions: [
          { kind: "copy-prompt", label: "Copy SEO metadata prompt", payload: "Set up the SEO metadata for this site. In app/layout.tsx, add the Next.js Metadata object with: title, description (under 160 chars), canonical URL, and keywords. The title should be distinctive and include the product name. The description should capture the positioning: a 60-minute AI onboarding for solo entrepreneurs and small-team leads who became the AI person by default. Avoid AI-sounding words." }
        ]
      },
      {
        id: "og-image",
        title: "Open Graph image created",
        description: "A 1200x630 image exists at /public/og-image.png so link previews on Twitter, LinkedIn, and Messages look intentional.",
        actions: [
          { kind: "view-steps", label: "See OG image options", payload: "# Creating an Open Graph image\n\n## Easiest path: Figma or Canva\n\n1. Create a 1200x630 canvas\n2. Match your brand: cream background, Georgia serif, terracotta accent\n3. Big headline text: the hero headline from your site\n4. Small tag at top: your product name or URL\n5. Export as PNG\n6. Save to /public/og-image.png\n\n## Better path: dynamic OG via @vercel/og\n\n- Generates OG images on demand\n- Can include dynamic content (like the user's name later in v1.1)\n- Ask Claude Code: 'Add @vercel/og to generate OG images dynamically. Match the site aesthetic.'\n\n## Reference it\n\nIn your Next.js Metadata object, add:\nopenGraph: { images: ['/og-image.png'] }" }
        ]
      },
      {
        id: "favicon",
        title: "Favicon set",
        description: "A proper favicon exists at /public/favicon.ico. No default Next.js favicon."
      },
      {
        id: "analytics",
        title: "Analytics installed",
        description: "Plausible or Umami or simple server-side logging is set up so you can see traffic without Google Analytics bloat.",
        actions: [
          { kind: "open-url", label: "Open Plausible", payload: "https://plausible.io" },
          { kind: "copy-prompt", label: "Copy analytics setup prompt", payload: "Add Plausible analytics to this Next.js site. Use the official Plausible script. Add a PLAUSIBLE_DOMAIN env var. Do not use Google Analytics. Add simple event tracking for: landing page loaded, pricing CTA clicked, email captured, admin page viewed." }
        ]
      },
      {
        id: "legal-pages",
        title: "Legal pages drafted",
        description: "A basic Terms of Service and Privacy Policy exist. They don't have to be perfect, but they need to exist for Stripe to consider you legitimate.",
        actions: [
          { kind: "copy-prompt", label: "Copy legal draft prompt", payload: "Draft a basic Terms of Service and Privacy Policy for this product. I am a solo operator in Utah, USA. The product is a one-time $49 digital purchase with no subscription. I collect emails for a free newsletter. Payments go through Stripe. Legal text should be clear and human, not dense legalese. Flag anywhere I should consult a lawyer. These go in /app/terms/page.tsx and /app/privacy/page.tsx." }
        ]
      },
      {
        id: "end-to-end-purchase",
        title: "Test purchase completed end-to-end",
        description: "Using Stripe test mode or a small real purchase, you've gone from landing page click through Stripe checkout to the thank-you page and confirmed it all works."
      },
      {
        id: "mobile-layout",
        title: "Mobile layout reviewed on actual phone",
        description: "Not just Chrome devtools. A real phone. You've scrolled the whole landing page and the admin on a mobile device."
      },
      {
        id: "accessibility",
        title: "Accessibility quick check",
        description: "Tab through the site using only the keyboard. Can you complete the buy flow? Check color contrast on key text.",
        actions: [
          { kind: "copy-prompt", label: "Copy accessibility audit prompt", payload: "Do a quick accessibility audit of this site. Check: keyboard navigation (can you tab through every interactive element in a logical order?), color contrast on all text (must meet WCAG AA), alt text on images, semantic HTML (headings in order, landmarks, buttons that are actually buttons), and focus states. Report any issues with specific file and line references. Don't fix anything yet. Let me review and prioritize." }
        ]
      },
      {
        id: "soft-launch-list",
        title: "Soft launch recipient list written",
        description: "You have a list of 5-10 specific people who will get the link first, a week before public launch. This lets you catch embarrassing bugs with low stakes."
      }
    ]
  }
];
