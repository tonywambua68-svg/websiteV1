-- OREMITECH Knowledge Centre: extends the existing blog for a complete content
-- marketing system. Additive only. Existing products, orders, customers and
-- blog rows are preserved. Safe to run more than once.

alter table public.blog_articles
  add column if not exists author_name text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists tags text[] not null default '{}',
  add column if not exists faq jsonb not null default '[]'::jsonb,
  add column if not exists related_product_ids uuid[] not null default '{}',
  add column if not exists reading_minutes int;

create index if not exists idx_blog_articles_featured
  on public.blog_articles (is_featured) where publication_status = 'published';
create index if not exists idx_blog_articles_tags
  on public.blog_articles using gin (tags);
create index if not exists idx_blog_articles_published
  on public.blog_articles (published_at desc);

-- ---------------------------------------------------------------------------
-- Initial knowledge-centre categories
-- ---------------------------------------------------------------------------

insert into public.blog_categories (name, slug, description, seo_title, seo_description, sort_order)
values
  ('Laptop Buying Guides', 'laptop-buying-guides',
   'Practical guidance on choosing the right laptop for study, work and home use in Kenya.',
   'Laptop Buying Guides | OREMITECH Kenya',
   'Practical laptop buying guides for Kenyan buyers: compare specifications, avoid common mistakes and choose a machine that fits your budget.', 1),
  ('Laptop Comparisons', 'laptop-comparisons',
   'Side-by-side comparisons of processors, memory, storage and laptop models.',
   'Laptop Comparisons | OREMITECH Kenya',
   'Understand the real differences between laptop processors, memory and storage options before you buy.', 2),
  ('Computer Tips and Tutorials', 'computer-tips-and-tutorials',
   'Step-by-step tutorials for Windows, macOS and everyday computer tasks.',
   'Computer Tips and Tutorials | OREMITECH Kenya',
   'Simple, tested tutorials that help you get more from your computer without technical jargon.', 3),
  ('Laptop Maintenance and Troubleshooting', 'laptop-maintenance-and-troubleshooting',
   'Keep your laptop healthy and fix common problems with confidence.',
   'Laptop Maintenance and Troubleshooting | OREMITECH Kenya',
   'Practical maintenance routines and troubleshooting steps for common laptop problems.', 4),
  ('Computer Accessories', 'computer-accessories',
   'Buying advice for chargers, storage, memory, bags and peripherals.',
   'Computer Accessories | OREMITECH Kenya',
   'Choose compatible chargers, SSDs, RAM and peripherals with guidance written for Kenyan buyers.', 5),
  ('Technology for Students', 'technology-for-students',
   'Technology advice for university, college and school students in Kenya.',
   'Technology for Students | OREMITECH Kenya',
   'Buying and using technology for study: laptop choices, battery life, software and budgeting.', 6),
  ('Business Technology', 'business-technology',
   'Practical technology decisions for small businesses and teams.',
   'Business Technology | OREMITECH Kenya',
   'Technology guidance for small businesses: reliable laptops, backups, security and sensible upgrades.', 7),
  ('Technology News and Updates', 'technology-news-and-updates',
   'Plain-language updates on hardware and software that affect Kenyan buyers.',
   'Technology News and Updates | OREMITECH Kenya',
   'Clear summaries of technology changes that matter to laptop and computer buyers in Kenya.', 8)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Scheduled publishing helper. Runs only when called by the service role
-- (for example a scheduled database job), never from the public frontend.
-- ---------------------------------------------------------------------------

create or replace function public.publish_due_scheduled_articles()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.blog_articles
     set publication_status = 'published',
         published_at = coalesce(published_at, scheduled_at, now()),
         scheduled_at = null
   where publication_status = 'scheduled'
     and scheduled_at is not null
     and scheduled_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.publish_due_scheduled_articles() from public, anon, authenticated;
grant execute on function public.publish_due_scheduled_articles() to service_role;

-- ---------------------------------------------------------------------------
-- Two hand-written starter drafts. They are NOT published: an administrator
-- must review, edit and publish them from the article dashboard.
-- ---------------------------------------------------------------------------

insert into public.blog_articles (
  title, slug, excerpt, content, featured_image_alt, category_id, author_name,
  tags, faq, publication_status, reading_minutes
)
select
  'SSD vs HDD: What Is the Difference?',
  'ssd-vs-hdd-what-is-the-difference',
  'Both store your files, but they work in very different ways. This guide explains the practical differences between solid-state drives and hard disk drives so you can choose with confidence.',
  '<p>A storage drive keeps your operating system, applications and personal files. The two main types are the <strong>hard disk drive (HDD)</strong> and the <strong>solid-state drive (SSD)</strong>. They serve the same purpose, but the technology inside is completely different.</p>
<h2>How each drive works</h2>
<p>An HDD uses spinning magnetic platters and a moving read/write head. Because parts physically move, an HDD is sensitive to knocks and takes longer to reach data that is spread across the disk.</p>
<p>An SSD stores data in flash memory chips. It has no moving parts, so it can read and write data far faster and is more resistant to everyday bumps.</p>
<h2>Practical differences</h2>
<table>
  <thead><tr><th>Consideration</th><th>HDD</th><th>SSD</th></tr></thead>
  <tbody>
    <tr><td>Speed</td><td>Slower start-up and file access</td><td>Fast start-up and application loading</td></tr>
    <tr><td>Moving parts</td><td>Yes, spinning platters</td><td>No</td></tr>
    <tr><td>Noise</td><td>Faint mechanical hum</td><td>Silent</td></tr>
    <tr><td>Power use</td><td>Higher</td><td>Lower</td></tr>
    <tr><td>Cost per gigabyte</td><td>Usually lower</td><td>Usually higher</td></tr>
    <tr><td>Best for</td><td>Bulk archives and backups</td><td>Operating systems, apps and daily work</td></tr>
  </tbody>
</table>
<h2>Why an SSD feels faster</h2>
<p>Most of the delay you notice on a computer comes from reading many small files at once, especially during start-up and when opening applications. Because flash memory has no seek time, an SSD handles those requests much more quickly. This is why an SSD upgrade often feels more dramatic than a small processor upgrade on an older machine.</p>
<h2>When an HDD still makes sense</h2>
<p>For large video archives, backup drives or a desktop where capacity matters more than speed, an HDD can still be good value. Many laptops and desktops use both: a smaller SSD for the operating system and a larger HDD for bulk files.</p>
<h2>What to check before buying</h2>
<ul>
  <li>Confirm the drive interface your machine supports (for example SATA or NVMe).</li>
  <li>Check the physical size and connector before ordering a replacement drive.</li>
  <li>Plan to back up your files before any storage change.</li>
  <li>Buy from a seller who can confirm the drive is genuine and compatible.</li>
</ul>
<p>If you are upgrading a laptop for everyday work, an SSD is usually the single most noticeable improvement. Browse our <a href="/shop?category=storage-devices">storage devices</a>, or compare complete <a href="/shop?category=laptops">laptops</a> if you would rather replace the whole machine.</p>
<h2>References</h2>
<ul>
  <li>Backblaze publishes real-world drive reliability data: <a href="https://www.backblaze.com/cloud-storage/resources/hard-drive-test-data" rel="noopener noreferrer" target="_blank">Backblaze Drive Stats</a>.</li>
  <li>Microsoft explains storage and drive management in Windows: <a href="https://support.microsoft.com/windows" rel="noopener noreferrer" target="_blank">Microsoft Support</a>.</li>
</ul>',
  'Solid-state drive and hard disk drive comparison',
  (select id from public.blog_categories where slug = 'computer-accessories'),
  'OREMITECH Editorial',
  array['SSD', 'HDD', 'storage', 'upgrades'],
  '[{"question":"Is an SSD always better than an HDD?","answer":"For everyday use an SSD is usually faster and more durable, but an HDD can still be good value when you mainly need large-capacity storage."},{"question":"Can I replace my laptop hard drive with an SSD?","answer":"Often yes, but it depends on the laptop model and the drive interface it supports. Confirm compatibility before buying a replacement."}]'::jsonb,
  'draft',
  6
where not exists (
  select 1 from public.blog_articles where slug = 'ssd-vs-hdd-what-is-the-difference'
);

insert into public.blog_articles (
  title, slug, excerpt, content, featured_image_alt, category_id, author_name,
  tags, faq, publication_status, reading_minutes
)
select
  'How Much RAM Do You Need?',
  'how-much-ram-do-you-need',
  'Memory decides how many tasks your computer can handle at once. Here is a practical way to choose the right amount for study, office work, design and programming.',
  '<p>RAM (random-access memory) is your computer''s short-term workspace. When you open applications and browser tabs, they load into RAM. If RAM runs out, the system slows down while it moves data to storage. Choosing the right amount is about matching your daily workload.</p>
<h2>A practical starting point</h2>
<table>
  <thead><tr><th>Typical use</th><th>Reasonable starting point</th></tr></thead>
  <tbody>
    <tr><td>Browsing, email, documents</td><td>8 GB</td></tr>
    <tr><td>University work with many tabs</td><td>8–16 GB</td></tr>
    <tr><td>Programming and virtual machines</td><td>16 GB or more</td></tr>
    <tr><td>Photo and video editing</td><td>16–32 GB</td></tr>
  </tbody>
</table>
<p>These are general guideposts, not strict rules. Heavy multitasking, large datasets or professional software can justify more memory.</p>
<h2>Why 8 GB can feel tight</h2>
<p>A modern browser can use several gigabytes on its own when many tabs are open. Add a video call, a document editor and a music app, and an 8 GB machine may begin swapping data to storage. Windows 11 requires at least 4 GB to run, but everyday use benefits from headroom above the minimum.</p>
<h2>When more RAM will not help</h2>
<p>If your computer is slow during start-up, opening files or launching applications, storage speed is often the bigger bottleneck. A full drive and an ageing hard disk can slow a machine even when memory is sufficient. Check both before upgrading.</p>
<h2>Upgrade or replace?</h2>
<ul>
  <li>Many business laptops allow a memory upgrade; some thin models have soldered memory.</li>
  <li>Confirm the memory type, speed and maximum capacity supported by your exact model.</li>
  <li>If the machine is otherwise healthy, a RAM upgrade can extend its useful life.</li>
</ul>
<p>If you are unsure, our team can help you compare specifications on available <a href="/shop?category=laptops">laptops</a> and compatible <a href="/shop?category=computer-accessories">accessories</a>.</p>
<h2>References</h2>
<ul>
  <li>Microsoft lists Windows 11 requirements: <a href="https://www.microsoft.com/windows/windows-11-specifications" rel="noopener noreferrer" target="_blank">Windows 11 specifications</a>.</li>
</ul>',
  'Laptop memory modules installed on a motherboard',
  (select id from public.blog_categories where slug = 'laptop-buying-guides'),
  'OREMITECH Editorial',
  array['RAM', 'memory', 'buying advice'],
  '[{"question":"Is 8 GB of RAM enough for a student laptop?","answer":"8 GB is workable for documents, email and moderate browsing. If you keep many browser tabs or run demanding software, 16 GB gives more headroom."},{"question":"Can I add RAM later?","answer":"Many laptops allow it, but some models use soldered memory. Check the exact model specifications before relying on a future upgrade."}]'::jsonb,
  'draft',
  5
where not exists (
  select 1 from public.blog_articles where slug = 'how-much-ram-do-you-need'
);
