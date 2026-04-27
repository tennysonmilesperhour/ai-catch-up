# Page background images

The `PageBackdrop` component (`/components/shared/PageBackdrop.tsx`) loads
its image by filename from this directory. Each file is referenced by a
specific page; replacing a file replaces the background everywhere that
variant is used.

## Expected files

| Filename     | Used on                                                         | Vibe                                              |
| ------------ | --------------------------------------------------------------- | ------------------------------------------------- |
| `nexus.jpg`  | `/admin/nexus`                                                  | Deep dark night sky, sparse stars, milky way edge |
| `nebula.jpg` | `/thank-you`                                                    | Vivid colored nebula (e.g. Bubble Nebula)         |
| `stars.jpg`  | `/`, `/login`, `/preview`, `/not-found` (everything else)       | Vibrant Milky Way, pink/teal/violet cloud         |

## Sizing

Use widths around 2000-2400 px. Images are served from `/public/bg/` and
rendered as full-viewport `background-cover bg-center` with a tinted
overlay for legibility.

JPEG is preferred over PNG for these (file size). 70-80% quality is fine.

## Adding a new variant

1. Drop a new `<name>.jpg` here.
2. Add it to `VARIANT_FILE` and `VARIANT_TINT` in `PageBackdrop.tsx`.
3. Use `<PageBackdrop variant="newname" />` on the relevant page.
