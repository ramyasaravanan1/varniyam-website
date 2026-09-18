# VARNIYAM Website

This is the build-free client delivery version of the VARNIYAM website. The homepage remains a plain HTML/CSS/JavaScript site, while each Wardrobe collection now has its own dedicated catalogue page powered by the existing Supabase `products` table and `product-images` bucket.

## Project structure

```text
VARNIYAM/
├── index.html
├── indian-elegance.html
├── modern-gowns.html
├── everyday-feminine.html
├── getaway.html
├── after-hours.html
├── css/
│   └── style.css
├── js/
│   ├── config.js
│   ├── main.js
│   ├── hero.js
│   ├── auth.js
│   ├── reviews.js
│   ├── products.js
│   ├── collections.js
│   ├── collection-page.js
│   └── whatsapp.js
├── assets/
│   ├── images/
│   ├── icons/
│   └── video/
├── SUPABASE_WARDROBE_UPLOAD_GUIDE.md
└── README.md
```

## Wardrobe navigation change

The homepage no longer expands a product catalogue underneath the Wardrobe section.

The five existing Wardrobe Explore links now open five real pages:

1. `indian-elegance.html` — Indian Elegance
2. `modern-gowns.html` — Modern Gowns
3. `everyday-feminine.html` — Everyday Feminine
4. `getaway.html` — Getaway
5. `after-hours.html` — After Hours

Each page only loads products belonging to that category. This lets the catalogue grow without changing the homepage alignment or length.

## Which file controls what

- `index.html` — main VARNIYAM website and Wardrobe links.
- The five collection `.html` files — dedicated product catalogue pages.
- `css/style.css` — shared styling for the homepage and collection pages.
- `js/config.js` — browser-safe Supabase URL/publishable key and the single shared `window.varniyamSupabase` client.
- `js/main.js` — homepage navigation, reveal effects and Wardrobe animations.
- `js/hero.js` — hero gaze-video behavior.
- `js/auth.js` — email/password authentication, account creation, guest access, password reset/recovery, session persistence, My Account and logout. It is also loaded on the collection pages so the account session remains available across the site.
- `js/reviews.js` — review form, review image uploads/loading and pagination.
- `js/products.js` — loads the current dedicated collection page from the `products` table and opens the product-detail dialog.
- `js/collections.js` — homepage mobile Wardrobe carousel behavior.
- `js/collection-page.js` — navigation/back-to-top behavior used by the five dedicated collection pages.
- `js/whatsapp.js` — WhatsApp community JOIN form and existing RPC.
- `SUPABASE_WARDROBE_UPLOAD_GUIDE.md` — exact process for adding images/products without editing the website.

## Supabase catalogue mapping

The five collection display names are unchanged. The product loader accepts the existing title or slug:

| Collection | Accepted values |
|---|---|
| Indian Elegance | `Indian Elegance` or `indian` |
| Modern Gowns | `Modern Gowns` or `gowns` |
| Everyday Feminine | `Everyday Feminine` or `everyday` |
| Getaway | `Getaway` or `getaway` |
| After Hours | `After Hours` or `after-hours` |

The collection pages read these existing fields from `products`:

`id`, `name`, `category`, `description`, `price`, `currency`, `image_paths`, `published`, `sort_order`, `created_at`.

Only rows where `published = true` are displayed. Items are ordered by `sort_order` ascending and then `created_at` descending.

## Supabase configuration

Frontend configuration remains in `js/config.js` and uses the same browser-safe Supabase publishable key/client as the supplied website.

Do not place service-role keys, secret keys, SMS/email-provider secrets, passwords or other server credentials in this frontend project.

## Supabase features this site depends on

- Supabase Auth — email/password sign in, account creation, email confirmation, password recovery, session persistence and logout.
- `reviews` table and `review-images` bucket.
- `products` table and `product-images` bucket.
- `join_varniyam_whatsapp` RPC.

The current product code uses `getPublicUrl()` for `product-images`, so that bucket needs to remain public unless the frontend is later changed to signed/authenticated URLs.

## Run locally

For the most reliable behavior, serve the folder over HTTP instead of relying on `file://`:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

An internet connection is required for Supabase and the existing external resources.

## Upload to hosting

Upload the **entire contents of this folder together** to the site's public/root directory. Do not upload only `index.html`, because the five new collection pages, CSS, JavaScript and assets are linked using relative paths.

No npm, Vite, React, Webpack or build command is required.

## Adding Wardrobe products

See `SUPABASE_WARDROBE_UPLOAD_GUIDE.md` for the step-by-step workflow. In short:

1. Upload photographs to Supabase Storage → `product-images`.
2. Add/update a row in Supabase Table Editor → `products`.
3. Put the Storage paths into `image_paths`.
4. Use the correct `category`.
5. Set `published = true`.
6. Reload the corresponding collection page.

No HTML edit is required for each new product.

## Validation performed for this version

- All five homepage Wardrobe image/Explore links now point to dedicated HTML pages.
- The old homepage `#collection-gallery` section and product dialog were removed.
- `js/products.js` is no longer loaded by the homepage.
- All five collection pages include the shared stylesheet, Supabase library/config, auth session logic, collection-page navigation and product loader.
- Every local file referenced by the HTML pages exists.
- Every JavaScript file passes `node --check` syntax validation.
- The five existing collection names and original Supabase table/bucket names are preserved.
- No additional Supabase client was introduced.

### Network-dependent limitation

A full end-to-end catalogue query requires internet access and the live Supabase project. The environment used to package this delivery could perform static and JavaScript validation, but its headless browser smoke test stalled while waiting on external network resources. The live Supabase integration was therefore preserved rather than mocked or replaced.

## Final collection-page close behaviour

Each of the five Wardrobe collection pages includes a **Close wardrobe ×** control in the upper-right area. It returns the visitor to `index.html#wardrobe`, effectively closing the dedicated catalogue experience and restoring the main site at the Wardrobe section.

