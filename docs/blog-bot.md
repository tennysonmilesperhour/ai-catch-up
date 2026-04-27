# Newsletter bot integration

The blog at `/blog` reads MDX files from `/content/blog/`. Posts can be added
two ways:

1. Commit a `<slug>.mdx` file directly to `/content/blog/` and push.
2. POST a JSON payload to `/api/blog/publish`. The endpoint commits the file
   to GitHub on your behalf, which triggers a Vercel rebuild and the post
   goes live within ~1 minute.

This doc is option 2: the bot path.

## What the bot needs

| Item | Where |
| --- | --- |
| Endpoint URL | `https://ai-catch-up.vercel.app/api/blog/publish` |
| Auth header | `Authorization: Bearer <BLOG_PUBLISH_SECRET>` |
| Method | `POST` |
| Content-Type | `application/json` |

## Server-side env vars (set in Vercel)

| Var | Required | What |
| --- | --- | --- |
| `BLOG_PUBLISH_SECRET` | yes | Long random string. Generate with `openssl rand -hex 32`. The bot sends the same value as the bearer token. |
| `GITHUB_BLOG_TOKEN` | yes | Fine-grained PAT with **Contents: Read & Write** on the repo. Used by the endpoint to commit the post. |
| `GITHUB_BLOG_REPO_OWNER` | no | Defaults to `tennysonmilesperhour`. |
| `GITHUB_BLOG_REPO` | no | Defaults to `ai-catch-up`. |
| `GITHUB_BLOG_BRANCH` | no | Defaults to `main`. Set to a feature branch for staging. |

## Request payload

```json
{
  "title": "When prompts go stale",
  "body": "Markdown body here. Headers, lists, code blocks, links all work.\n\nMultiple paragraphs are fine.",
  "summary": "Optional one-line tagline shown on the index and the home page.",
  "slug": "when-prompts-go-stale",
  "date": "2026-04-30",
  "author": "Tennyson",
  "overwrite": false
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Up to 200 chars. |
| `body` | yes | Up to 50,000 chars. Markdown. Use `\n` for newlines in JSON. |
| `summary` | no | Up to 500 chars. Recommended. |
| `slug` | no | If omitted, derived from the title. Lowercase letters, digits, hyphens. |
| `date` | no | `YYYY-MM-DD`. Defaults to today UTC. |
| `author` | no | Up to 80 chars. |
| `overwrite` | no | If `true`, replaces an existing post with the same slug. Defaults to `false`. |

## Responses

`201 Created` on a new post. `200 OK` on overwrite. Body:

```json
{
  "ok": true,
  "slug": "when-prompts-go-stale",
  "path": "content/blog/when-prompts-go-stale.mdx",
  "action": "created",
  "commitSha": "abc123...",
  "githubUrl": "https://github.com/tennysonmilesperhour/ai-catch-up/blob/main/content/blog/when-prompts-go-stale.mdx",
  "blogUrl": "/blog/when-prompts-go-stale"
}
```

Errors return JSON `{ "error": "..." }` with the appropriate status:

| Status | Meaning |
| --- | --- |
| 400 | Bad payload (missing field, too long, control chars, bad slug). |
| 401 | Missing or invalid bearer token. |
| 405 | Method other than POST. |
| 409 | Slug already exists. Pass `overwrite: true` or use a different slug. |
| 500 | Server misconfigured (env vars missing). |
| 502 | GitHub API failure. The error message is forwarded for debugging. |

## Quick test from the command line

```bash
curl -X POST "https://ai-catch-up.vercel.app/api/blog/publish" \
  -H "Authorization: Bearer $BLOG_PUBLISH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Hello from the bot",
    "summary": "Test post.",
    "body": "If you can read this, the wire is working."
  }'
```

## Common bot platforms

- **n8n**: HTTP Request node. Set Method=POST, URL=the endpoint, Authentication=Header Auth (name=`Authorization`, value=`Bearer {{$credentials.blogSecret}}`), Body Content Type=JSON, paste the payload schema.
- **Zapier**: Webhooks > POST. Same headers and body.
- **Make (Integromat)**: HTTP > Make a request. Same shape.
- **GitHub Action**: `curl` step inside the weekly cron workflow.
- **Custom Node script**: `fetch(url, { method: "POST", headers: {...}, body: JSON.stringify(payload) })`.

## Notes and gotchas

- The bot does not need to know about MDX, frontmatter, or git. The endpoint
  builds the file and commits.
- Each successful publish produces one git commit on the configured branch.
  Vercel rebuilds and deploys automatically.
- If the bot retries the same payload on a transient failure, idempotency is
  not free: a duplicate slug returns 409 unless `overwrite: true`. The bot
  should treat 409 as success after the first attempt.
- The endpoint runs in the Node.js runtime (not Edge) because it calls
  GitHub's REST API and uses Buffer for base64 encoding.
- Date format is strictly `YYYY-MM-DD`. Anything else is ignored and today's
  UTC date is used instead.
