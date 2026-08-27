# Sanaa Thrumylens CDN — Setup Guide

This guide walks you through setting up a secure image CDN on
**`cdn.sanaathrumylens.co.ke`** using your DirectAdmin hosting.

---

## What you'll have at the end

- A CDN subdomain that serves images over HTTPS with long-lived caching
- An authenticated upload endpoint (`POST /upload.php`) that accepts images
- Your blog's CMS able to upload images directly to the CDN from the post editor
- All files stored on your own hosting (no third-party dependencies)

---

## Files in this folder

| File | Purpose |
|------|---------|
| `upload.php` | The upload API endpoint (authenticated, image-only) |
| `config.example.php` | Template for the config file — copy to `config.php` |
| `.htaccess` | Caching, CORS, HTTPS redirect, and security rules |
| `index.html` | Placeholder page shown when visiting the CDN root |

---

## Step 1 — Verify the subdomain in DirectAdmin

1. Log in to **DirectAdmin** at `https://d7.my-control-panel.com:2222`
2. Go to **Account Manager → Subdomains**
3. Confirm `cdn.sanaathrumylens.co.ke` exists. If not:
   - Click **Add Subdomain**
   - Subdomain: `cdn`
   - Domain: `sanaathrumylens.co.ke`
   - Click **Create**

4. Note the **document root**. DirectAdmin usually creates it at:
   ```
   /domains/sanaathrumylens.co.ke/public_html/cdn
   ```
   (You can confirm this in **File Manager**.)

---

## Step 2 — Enable SSL (HTTPS) for the subdomain

Your blog uses HTTPS, so the CDN must too (otherwise browsers will block
mixed-content image loads).

1. In DirectAdmin, go to **Advanced Features → SSL Certificates**
2. Select the domain `sanaathrumylens.co.ke` (SSL usually covers the subdomain too,
   via a wildcard or SAN entry)
3. If you have **Let's Encrypt** available:
   - Click **Free & automatic certificate from Let's Encrypt**
   - Make sure `cdn.sanaathrumylens.co.ke` is checked in the subdomain list
   - Click **Save / Request**
   - Wait for the certificate to be issued (30–60 seconds)
4. If you already have a wildcard cert for `*.sanaathrumylens.co.ke`, the subdomain
   is already covered — no action needed.
5. Go to **Advanced Features → Domain Setup → sanaathrumylens.co.ke → SSL** and
   ensure **Force HTTPS with HTTPS Redirect** is enabled (or use the `.htaccess`
   rule in this folder — it's already included).

**Verify:** Visit `https://cdn.sanaathrumylens.co.ke/` — you should see a padlock
icon and the placeholder page (or a blank page if nothing's uploaded yet).

---

## Step 3 — Upload the CDN files

Using **DirectAdmin File Manager** or **FTP/SFTP**:

1. Navigate to the subdomain's document root:
   ```
   /domains/sanaathrumylens.co.ke/public_html/cdn
   ```
2. Upload these 4 files from the `cdn-files/` folder:
   - `upload.php`
   - `config.example.php`
   - `.htaccess`
   - `index.html`
3. Create a new folder called `images/` inside the `cdn` folder.
   This is where uploaded images will be stored.
   - Right-click → **Create New Folder** → name it `images`
   - Set permissions to **755**

Your folder structure should now be:
```
/domains/sanaathrumylens.co.ke/public_html/cdn/
├── .htaccess
├── config.example.php
├── index.html
├── upload.php
└── images/              ← uploaded files go here
    └── (empty for now)
```

---

## Step 4 — Create the config file with your API key

1. In File Manager, copy `config.example.php` to `config.php`
   - Right-click `config.example.php` → **Copy** → name it `config.php`
2. Edit `config.php`:
   - Set `'api_key'` to a **long random string** (32+ characters)
   - Generate one at https://passwordsgenerator.net (check all character types)
   - Example: `'api_key' => 'sk_st_9Kf2mQ7xR3vB8nL4pW6yH1jZ0aE5tC',`
3. Save the file
4. **Important:** Set permissions on `config.php` to **600** (readable only by owner)
   - Right-click → **Permissions** → set to `600`

> ⚠️ **Keep the API key secret.** Anyone with this key can upload files to your CDN.
> Never commit `config.php` to git. The `.htaccess` already blocks direct web access to it.

---

## Step 5 — Verify PHP is working

1. Visit `https://cdn.sanaathrumylens.co.ke/upload.php` in your browser
2. You should see a JSON response like:
   ```json
   {
     "ok": true,
     "service": "sanaa-thrumylens-cdn",
     "methods": { "POST": "upload image (multipart/form-data, field name: file)" },
     "auth": "Bearer token required"
   }
   ```
3. If you see a 500 error saying "CDN not configured", double-check that
   `config.php` exists and is readable.
4. If you see raw PHP code, PHP is not executing — contact your host to enable PHP
   for the subdomain (DirectAdmin usually does this automatically).

---

## Step 6 — Test an upload from the command line

From your computer's terminal, test the upload endpoint:

```bash
curl -X POST https://cdn.sanaathrumylens.co.ke/upload.php \
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \
  -F "file=@/path/to/a/test/image.jpg"
```

You should get a `201 Created` response:
```json
{
  "ok": true,
  "url": "https://cdn.sanaathrumylens.co.ke/images/2026/08/test-image-a1b2c3d4.jpg",
  "file": {
    "name": "test-image-a1b2c3d4.jpg",
    "path": "2026/08/test-image-a1b2c3d4.jpg",
    "mime": "image/jpeg",
    "size": 245678,
    "width": 1200,
    "height": 800
  }
}
```

Verify the image is accessible at the returned URL.

---

## Step 7 — Add the CDN credentials to the blog

In the blog's `.env` file, add:

```env
CDN_URL="https://cdn.sanaathrumylens.co.ke"
CDN_API_KEY="YOUR_API_KEY_HERE"
```

Use the **same API key** you set in `config.php` on the CDN.

---

## Step 8 — Use the CDN from the blog's CMS

The blog's CMS post editor has been updated to support image uploads:

1. Go to **CMS → Posts → New Post** (or edit an existing post)
2. In the content editor toolbar, click the **Image** button (🖼)
3. This inserts an `<img>` tag placeholder — but to **upload** an image:
   - Use the **Cover image** field's upload button (top-right of the editor sidebar)
   - Or paste a CDN URL directly into the `<img src="...">` attribute

The CMS upload button sends the file to the blog's `/api/upload` route, which
proxies it to the CDN with your API key. The CDN returns the public URL, and
the CMS inserts it into the post.

---

## Security summary

| Layer | Protection |
|-------|-----------|
| Transport | HTTPS enforced via `.htaccess` redirect |
| Authentication | Bearer token (32+ char API key) required for uploads |
| File validation | MIME-type checked via `finfo`, not just extension |
| File types | Only images: jpg, png, gif, webp, avif, svg |
| File size | Configurable max (default 10MB) |
| CORS | Only your blog's domains can trigger uploads from the browser |
| Config file | `config.php` blocked from web access via `.htaccess` |
| Directory listing | Disabled |
| Cache headers | Images cached for 1 year (immutable), SVG for 1 month |

---

## Troubleshooting

**"401 Unauthorized" when uploading**
→ The API key in your blog's `.env` doesn't match the one in `config.php`.

**"415 Unsupported file type"**
→ The file isn't a recognized image. Re-save it as JPG/PNG/WebP.

**"500 Failed to create upload directory"**
→ The `images/` folder doesn't exist or has wrong permissions. Create it and
   set permissions to `755`.

**Images don't load on the blog (mixed content)**
→ Make sure you're loading them via `https://cdn.sanaathrumylens.co.ke/...`
   (not http://). The `.htaccess` forces HTTPS, but check the URL in your post.

**CORS error in browser console**
→ The blog's domain isn't in `allowed_origins` in `config.php`. Add it.

**Large images fail to upload**
→ Check `upload_max_filesize` and `post_max_size` in your PHP config
   (DirectAdmin → **Advanced Features → PHP Settings**). Set both to at least
   `12M` to allow 10MB uploads with overhead.
