# Product Management Guide

## How to Replace or Add Products

### Step 1: Edit products.json
Open `src/data/products.json` and modify the product entries. Each product should have:
- `id`: Unique identifier (e.g., "laptop-001")
- `name`: Product name
- `category`: "Laptops", "Phones", "Gaming", or "Deals"
- `brand`: Brand name
- `price`: Price in KES (Kenya Shillings)
- `oldPrice`: Original price if on sale (null if not)
- `image`: Path to product image (e.g., "/images/products/my-product.jpg")
- `description`: Product description
- `specs`: Object with product specifications
- `inStock`: Boolean (true/false)

### Step 2: Add Product Images
Place your product images in the `public/images/products/` directory. 
- Use descriptive filenames (e.g., "hp-elitebook-840.jpg")
- Recommended size: 800x600 pixels
- Supported formats: JPG, PNG, SVG, WebP
- Update the `image` path in products.json to match your filename

### Step 3: Build and Deploy
After updating products.json and adding images:
```bash
npm run build
```
Then deploy to Cloudflare Pages as usual.

## Current Product Structure
- **8 Laptops**: laptop-001 through laptop-008
- **8 Phones**: phone-001 through phone-008
- **4 Gaming**: gaming-001 through gaming-004
- **4 Deals**: deal-001 through deal-004 (products with oldPrice set)

## Placeholder Images
Currently using SVG placeholders:
- `/images/products/laptop-placeholder.svg`
- `/images/products/phone-placeholder.svg`
- `/images/products/gaming-placeholder.svg`
- `/images/products/deal-placeholder.svg`

Replace these with actual product photos for a professional look.

## Tips
- Keep product names concise but descriptive
- Include key specs that customers care about (processor, RAM, storage, etc.)
- Set `oldPrice` only for genuine deals/discounts
- Ensure all images are optimized for web (compress before uploading)
- Test locally with `npm run dev` before deploying
