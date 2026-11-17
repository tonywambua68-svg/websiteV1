import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = process.env.SITE_URL || 'https://oremitech.co.ke';

// Supabase client for server-side queries
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API is running' });
});

// Dynamic sitemap.xml — includes only published products
app.get('/sitemap.xml', async (req, res) => {
  const urls = [
    { loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${SITE_URL}/shop`, changefreq: 'daily', priority: '0.9' },
    { loc: `${SITE_URL}/about`, changefreq: 'monthly', priority: '0.8' },
    { loc: `${SITE_URL}/faq`, changefreq: 'monthly', priority: '0.8' },
    { loc: `${SITE_URL}/contact`, changefreq: 'monthly', priority: '0.8' },
    { loc: `${SITE_URL}/order-tracking`, changefreq: 'monthly', priority: '0.5' },
    { loc: `${SITE_URL}/blog`, changefreq: 'daily', priority: '0.8' },
  ];

  // Category pages
  const categories = [
    'laptops', 'business-laptops', 'gaming-laptops', 'student-laptops',
    'workstations', 'computer-accessories', 'monitors', 'storage-devices',
  ];
  categories.forEach((cat) => {
    urls.push({ loc: `${SITE_URL}/shop?category=${cat}`, changefreq: 'daily', priority: '0.8' });
  });

  // Published product pages
  if (supabase) {
    try {
      const { data: products, error } = await supabase
        .from('catalogue_products')
        .select('slug, updated_at')
        .eq('publication_status', 'published');

      if (!error && products) {
        products.forEach((p) => {
          urls.push({
            loc: `${SITE_URL}/product/${p.slug}`,
            changefreq: 'weekly',
            priority: '0.7',
            lastmod: p.updated_at,
          });
        });
      }
    } catch (err) {
      console.error('Sitemap product fetch error:', err);
    }

    // Published blog articles
    try {
      const { data: articles, error: artErr } = await supabase
        .from('blog_articles')
        .select('slug, updated_at, published_at')
        .eq('publication_status', 'published');

      if (!artErr && articles) {
        articles.forEach((a) => {
          urls.push({
            loc: `${SITE_URL}/blog/${a.slug}`,
            changefreq: 'monthly',
            priority: '0.6',
            lastmod: a.updated_at || a.published_at,
          });
        });
      }
    } catch (err) {
      console.error('Sitemap article fetch error:', err);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(xml);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!' 
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
