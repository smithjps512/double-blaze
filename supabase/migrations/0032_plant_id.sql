-- Name That Plant: the class puts names on the greenhouse photos nobody labelled.
--
-- Third period's plant photos arrived in a Drive folder with names like
-- "image (4).png". Nineteen of them are unidentified, and four more are of
-- plants we can name but whose photos belong to commercial nurseries, so we
-- need a replacement before they can go on the site.
--
-- No accounts and no student identity, the same rule the Trail Crew question
-- table follows. A student is a browser here and nothing more: `voter_key` is
-- a random token the page generates and keeps in local storage so one device
-- can change its own vote and cannot stuff the ballot. It says nothing about
-- who is holding the Chromebook, and it is deliberately not linkable to
-- anything else.
--
-- The value of this table is the class arriving at an answer together. The
-- teacher settles the winning name, and that is what reaches the website.

create table if not exists public.plant_id_specimens (
  -- Slug of the Drive filename, so a row stays tied to the photo it came from.
  id text primary key,
  file_name text not null,
  -- 'unknown': nobody knows what it is.
  -- 'needs_photo': we know the species, the photo is the problem.
  kind text not null check (kind in ('unknown', 'needs_photo')),
  species text,
  common_name text,
  -- Who owns the photo we cannot use, for the 'needs_photo' rows.
  photo_source text,
  -- Path under apps/platform/public. Null means the photo is not in the repo
  -- yet, which the page shows on purpose rather than hiding.
  image_path text,
  settled_name text,
  settled_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.plant_id_names (
  id uuid primary key default gen_random_uuid(),
  specimen_id text not null references public.plant_id_specimens (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index if not exists plant_id_names_specimen_idx
  on public.plant_id_names (specimen_id, created_at);

create table if not exists public.plant_id_votes (
  id uuid primary key default gen_random_uuid(),
  specimen_id text not null references public.plant_id_specimens (id) on delete cascade,
  name_id uuid not null references public.plant_id_names (id) on delete cascade,
  -- Random per-browser token. Not an account, not a person.
  voter_key text not null,
  created_at timestamptz not null default now(),
  -- One vote per plant per device, enforced here rather than trusted from the
  -- browser. Changing your mind updates this row instead of adding another.
  unique (specimen_id, voter_key)
);

create index if not exists plant_id_votes_name_idx
  on public.plant_id_votes (name_id);

alter table public.plant_id_specimens enable row level security;
alter table public.plant_id_names enable row level security;
alter table public.plant_id_votes enable row level security;

-- No policies on purpose, matching trail_crew_questions. Everything goes
-- through the server with the service role key, which bypasses RLS. The page
-- is anonymous and public, so the browser is never trusted with the database.

-- The roster: the 23 photos sitting in the "site images" Drive folder.
-- image_path stays null until the photo itself is committed to the repo.
insert into public.plant_id_specimens (id, file_name, kind, sort_order) values
  ('27399-1800x1800-jpg', '27399_1800x1800.jpg', 'unknown', 1),
  ('direct-gardening-perennials-09062-64-1000-jpg', 'direct-gardening-perennials-09062-64_1000.jpg', 'unknown', 2),
  ('img-7577-1920x1012-jpg', 'IMG_7577-1920x1012.jpg', 'unknown', 3),
  ('images-16-jpeg', 'images (16).jpeg', 'unknown', 4),
  ('images-17-jpeg', 'images (17).jpeg', 'unknown', 5),
  ('image-png', 'image.png', 'unknown', 6),
  ('image-1-png', 'image (1).png', 'unknown', 7),
  ('image-2-png', 'image (2).png', 'unknown', 8),
  ('image-3-png', 'image (3).png', 'unknown', 9),
  ('image-4-png', 'image (4).png', 'unknown', 10),
  ('image-5-png', 'image (5).png', 'unknown', 11),
  ('image-6-png', 'image (6).png', 'unknown', 12),
  ('image-7-png', 'image (7).png', 'unknown', 13),
  ('unnamed-png', 'unnamed.png', 'unknown', 14),
  ('unnamed-1-png', 'unnamed (1).png', 'unknown', 15),
  ('screenshot-2026-09-02-10-15-45-png', 'Screenshot 2026-09-02 10.15.45.png', 'unknown', 16),
  ('screenshot-2026-09-09-10-31-43-am-png', 'Screenshot 2026-09-09 10.31.43 AM.png', 'unknown', 17),
  ('screenshot-2026-09-09-10-31-43-am-1-png', 'Screenshot 2026-09-09 10.31.43 AM (1).png', 'unknown', 18),
  ('screenshot-2026-09-09-10-37-43-am-png', 'Screenshot 2026-09-09 10.37.43 AM.png', 'unknown', 19)
on conflict (id) do nothing;

insert into public.plant_id_specimens
  (id, file_name, kind, species, common_name, photo_source, sort_order) values
  ('rudbeckia-hirta-nursery', 'Rudbeckia hirta.cmyk.bcwebmerv.20180619_103700__35615.jpg',
   'needs_photo', 'Rudbeckia hirta', 'Black-eyed Susan', 'a plant nursery', 20),
  ('baptisia-proven-winners', 'Baptisia-Decadence-Periwinkle-Popsicle-Photo-Credit-Proven-Winners-400x533.jpg',
   'needs_photo', 'Baptisia australis', 'Blue wild indigo', 'Proven Winners', 21),
  ('coreopsis-pubescens-nursery', 'Coreopsis pubescens cmykbcweb. sw__00958.webp',
   'needs_photo', 'Coreopsis pubescens', 'Star tickseed', 'a plant nursery', 22),
  ('viola-sororia-nursery', 'Viola_sororiaP4160003BCWEB__90757.jpg',
   'needs_photo', 'Viola sororia', 'Common blue violet', 'a plant nursery', 23)
on conflict (id) do nothing;
