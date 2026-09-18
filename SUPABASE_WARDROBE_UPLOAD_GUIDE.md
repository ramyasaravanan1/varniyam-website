# VARNIYAM Wardrobe — Supabase Product Upload Guide

The five Wardrobe pages load published products directly from the existing Supabase `products` table and `product-images` Storage bucket. You do **not** need to edit the HTML every time you add a new product.

## Collection pages

| Wardrobe collection | Page | Accepted `category` values |
|---|---|---|
| Indian Elegance | `indian-elegance.html` | `Indian Elegance` or `indian` |
| Modern Gowns | `modern-gowns.html` | `Modern Gowns` or `gowns` |
| Everyday Feminine | `everyday-feminine.html` | `Everyday Feminine` or `everyday` |
| Getaway | `getaway.html` | `Getaway` or `getaway` |
| After Hours | `after-hours.html` | `After Hours` or `after-hours` |

Use one of the values shown above exactly. The website accepts both the existing display name and slug so older catalogue rows continue to work.

## Part A — Upload the product photographs

1. Open your VARNIYAM project in the Supabase Dashboard.
2. Open **Storage**.
3. Open the existing bucket named **`product-images`**.
4. Optional but recommended: create folders for the five categories:
   - `indian/`
   - `gowns/`
   - `everyday/`
   - `getaway/`
   - `after-hours/`
5. Inside the appropriate category, you can create one folder per product. Example:
   - `indian/amber-half-saree/`
6. Click **Upload File** and upload the product photographs.
7. Use simple filenames such as:
   - `front.jpg`
   - `back.jpg`
   - `detail.jpg`
   - `side.jpg`
8. Note the path of each uploaded image. Example:
   - `indian/amber-half-saree/front.jpg`
   - `indian/amber-half-saree/back.jpg`

### Important: bucket visibility

The current website uses Supabase `getPublicUrl()` for product photos. Therefore `product-images` needs to be a **public bucket** for the photographs to render using the current frontend code. If your current catalogue images already display correctly, do not change this setting.

If needed, in Supabase Storage open the bucket settings/overflow menu and confirm the bucket is Public.

## Part B — Add the product to the `products` table

1. Open **Table Editor** in Supabase.
2. Open the existing table named **`products`**.
3. Click **Insert row**.
4. Fill in the product fields used by the VARNIYAM website.

### Fields used by the website

- `name` — product name shown on the card and product modal.
- `category` — determines which of the five pages displays the product.
- `description` — the product description.
- `price` — numeric price. It may be left empty if you do not want a price displayed.
- `currency` — normally `INR`.
- `image_paths` — array containing the Storage paths of the product photographs.
- `published` — must be `true` for the product to appear publicly.
- `sort_order` — smaller numbers appear first.
- `created_at` — normally leave the existing/default timestamp behavior unchanged.
- `id` — normally allow the existing database default/identity behavior to create it.

## Example product

Imagine you uploaded these photographs:

```text
indian/amber-half-saree/front.jpg
indian/amber-half-saree/back.jpg
indian/amber-half-saree/detail.jpg
```

Create a `products` row like this:

```text
name: Amber Half Saree
category: Indian Elegance
description: A warm amber half saree with embroidered detailing, designed for celebrations and traditional occasions.
price: 8490
currency: INR
image_paths: ["indian/amber-half-saree/front.jpg","indian/amber-half-saree/back.jpg","indian/amber-half-saree/detail.jpg"]
published: true
sort_order: 10
```

The **first path in `image_paths` becomes the main catalogue/card photograph**. The remaining images appear as thumbnails in the product-detail popup.

Supabase's Dashboard supports entering a Postgres text array using JSON-like array notation such as:

```text
["path/image-1.jpg","path/image-2.jpg"]
```

If your existing `image_paths` column is JSON/JSONB rather than a Postgres text array, keep the same JSON array shape already used by your current rows. The frontend only requires Supabase to return `image_paths` as a JavaScript array of strings.

## How the five pages decide what to show

The frontend performs the equivalent of:

```text
products
WHERE published = true
AND category matches the current collection
ORDER BY sort_order ASC, created_at DESC
```

Therefore:

- `published = false` keeps a product hidden.
- Changing `category` moves the product to another collection page.
- Changing `sort_order` changes its position.
- Adding more `image_paths` adds more photographs to the detail popup.
- You can add many products without changing `index.html` or the collection page HTML.

## Recommended image preparation

For good catalogue performance:

- Prefer JPEG/WebP product photos.
- Keep a consistent portrait ratio where possible, ideally close to 4:5.
- Use descriptive lowercase filenames with hyphens.
- Avoid uploading extremely large camera originals when a web-sized copy is available.
- Put the strongest/front image first in `image_paths`.

## If a product does not appear

Check these in order:

1. `published` is `true`.
2. `category` exactly matches one of the accepted values in the table at the top of this guide.
3. Every `image_paths` value is a path inside `product-images`, not a path from another bucket.
4. The `product-images` bucket is public if using the current `getPublicUrl()` implementation.
5. Your `products` table RLS policy allows the website's publishable/anonymous client to SELECT published products.
6. Reload the collection page while connected to the internet.

If the old catalogue already worked before this five-page update, your existing table/bucket policies should normally remain unchanged.
