-- The showcase: a student team's site, with an admin the team runs themselves.
--
-- Classic Cars has three people and no developer, so they are not building this
-- in Anvil. They get the site built for them and the part that actually teaches
-- them something: the console behind it. Adding a car and watching it appear on
-- a public page is site administration, and it is the half of the web that
-- nobody shows a thirteen year old.
--
-- Keyed by team_slug rather than hard-wired to one team, because the next team
-- without a developer should cost a row rather than a schema.
--
-- Every table has is_example. The rows seeded below are placeholders put there
-- so the site is not empty on the first day; the admin marks them so the team
-- knows what is theirs to replace. Choosing the cars is their assignment and
-- this must not quietly do it for them.

create table if not exists public.showcase_cars (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  slug text not null,
  name text not null,
  year integer,
  top_speed integer,
  horsepower integer,
  special text,
  -- Path inside the showcase-media bucket. Null means no photo yet, which the
  -- site shows on purpose rather than hiding: an empty frame is the clearest
  -- possible instruction to go and add one.
  image_path text,
  is_example boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (team_slug, slug)
);

create table if not exists public.showcase_parts (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  slug text not null,
  name text not null,
  what_it_does text not null default '',
  if_upgraded text not null default '',
  -- Horsepower this part adds in the builder.
  --
  -- The null/zero distinction carries real meaning and is easy to lose: null
  -- means the part is not something you bolt on, so it does not appear in the
  -- builder at all. Zero means it does appear and adds nothing, which is the
  -- honest answer for tires and the most interesting square on the screen.
  hp_gain integer,
  is_example boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (team_slug, slug)
);

create table if not exists public.showcase_quiz (
  id uuid primary key default gen_random_uuid(),
  team_slug text not null,
  question text not null,
  -- The answers to choose from, in order. The right one is answer_index.
  choices jsonb not null default '[]'::jsonb,
  answer_index integer not null default 0,
  is_example boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists showcase_cars_team_idx on public.showcase_cars (team_slug, sort_order, created_at);
create index if not exists showcase_parts_team_idx on public.showcase_parts (team_slug, sort_order, created_at);
create index if not exists showcase_quiz_team_idx on public.showcase_quiz (team_slug, sort_order, created_at);

alter table public.showcase_cars enable row level security;
alter table public.showcase_parts enable row level security;
alter table public.showcase_quiz enable row level security;

-- Reading is public, because the content is. These rows are the car pages
-- anybody can open, so a select policy is not a weaker copy of the access
-- rules, it is the access rule.
--
-- Writing is not: the admin is gated by a shared passcode checked on the server
-- rather than by a database identity, so there is no role here that should be
-- able to write, and there is deliberately no insert, update or delete policy.
-- Every write goes through the service role, which bypasses RLS.

drop policy if exists showcase_cars_public_read on public.showcase_cars;
create policy showcase_cars_public_read on public.showcase_cars for select using (true);

drop policy if exists showcase_parts_public_read on public.showcase_parts;
create policy showcase_parts_public_read on public.showcase_parts for select using (true);

drop policy if exists showcase_quiz_public_read on public.showcase_quiz;
create policy showcase_quiz_public_read on public.showcase_quiz for select using (true);

-- Car photos. Private and served through the app, the same choice site-assets
-- makes: it keeps the storage URLs out of the open and leaves the cache headers
-- ours to set.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'showcase-media', 'showcase-media', false, 8388608,
  array['image/jpeg','image/png','image/webp','image/avif','image/gif']
)
on conflict (id) do nothing;

-- Example content for Classic Cars.
--
-- The parts and the quiz are seeded in full: what a turbo does is a fact rather
-- than a creative choice, and the five parts named here are the five their own
-- build card names.
--
-- The cars are seeded too, but they are the part the team is supposed to
-- choose, so all four are flagged as examples and the console says so. The
-- horsepower figures are the manufacturers' original factory ratings and the
-- top speeds are approximate; both are the kind of number a real site would
-- cite a source for, which is worth saying to them.

insert into public.showcase_parts
  (team_slug, slug, name, what_it_does, if_upgraded, hp_gain, is_example, sort_order)
values
  ('period-2-classic-cars', 'engine', 'Engine',
   'The engine burns fuel and air in its cylinders. Each small explosion shoves a piston down, the pistons turn a crankshaft, and that spinning is what eventually turns the wheels. Everything else on this page exists to help the engine do that better.',
   'A bigger engine burns more fuel and air at once, so it makes more power. It also gets heavier and drinks more, which is why the fastest car is not always the one with the biggest engine.',
   null, true, 1),
  ('period-2-classic-cars', 'turbo', 'Turbocharger',
   'A turbo is a fan driven by the exhaust gas rushing out of the engine. That fan spins a second fan, which shoves extra air into the cylinders. More air means more fuel can be burned, and burning more fuel makes more power. The engine is, in effect, feeding itself.',
   'A turbo is the biggest single power gain on this list, because it changes how much air the engine gets rather than just how easily air moves. It also makes heat, so a turbocharged engine needs better cooling.',
   100, true, 2),
  ('period-2-classic-cars', 'exhaust', 'Exhaust',
   'Once the fuel has burned, the leftover gas has to get out. The exhaust is the pipe it leaves through, and it also quiets the noise and cleans up some of what comes out.',
   'A freer flowing exhaust lets the used gas out faster, so the engine spends less effort pushing against itself. It is a smaller gain than a turbo, and it is most of where the sound comes from.',
   25, true, 3),
  ('period-2-classic-cars', 'intake', 'Air intake',
   'The intake is where the engine breathes in. Air comes through a filter and down into the cylinders to be mixed with fuel.',
   'A better intake lets more air in with less resistance. It is the cheapest real gain on this list, and on its own it is a small one, because the engine can still only burn as much as it can pull in.',
   20, true, 4),
  ('period-2-classic-cars', 'brakes', 'Brakes',
   'Brakes squeeze a pad against a disc attached to the wheel. The rubbing turns the car''s movement into heat, and the car slows down. All of a car''s speed has to go somewhere, and with brakes it goes into the air as heat.',
   'Better brakes do not make a car faster in a straight line. They let you stay fast for longer before you have to slow down, which on a track is the same thing.',
   null, true, 5),
  ('period-2-classic-cars', 'tires', 'Tires',
   'The tires are the only part of the car touching the road. Every bit of power the engine makes has to get to the ground through four patches of rubber each about the size of your hand.',
   'Stickier tires add no horsepower at all. What they add is grip, so more of the power you already have actually reaches the road instead of spinning the wheels. This is the most useful thing on this page and the number in the builder is zero.',
   0, true, 6)
on conflict (team_slug, slug) do nothing;

insert into public.showcase_cars
  (team_slug, slug, name, year, top_speed, horsepower, special, is_example, sort_order)
values
  ('period-2-classic-cars', 'shelby-gt500', 'Shelby GT500', 1967, 130, 355,
   'A Mustang with a 428 cubic inch V8 dropped into it. Carroll Shelby''s idea was simple: take a car people already liked and put a much larger engine in it.',
   true, 1),
  ('period-2-classic-cars', 'charger-rt-hemi', 'Dodge Charger R/T 426 Hemi', 1970, 130, 425,
   'The 426 Hemi is named for its hemispherical combustion chambers, a dome shape that let the engine breathe better than its rivals. It was rare and expensive even when new.',
   true, 2),
  ('period-2-classic-cars', 'camaro-z28', 'Chevrolet Camaro Z/28', 1969, 124, 290,
   'Built to a rule rather than to a spec: racing limited engines to 305 cubic inches, so Chevrolet built a 302 that revved hard rather than a bigger one that did not.',
   true, 3),
  ('period-2-classic-cars', 'corvette-sting-ray', 'Chevrolet Corvette Sting Ray', 1963, 140, 360,
   'The fuel injected one. Most cars of the era mixed fuel and air with a carburettor; this squirted fuel in directly, which was unusual enough in 1963 to be a headline.',
   true, 4)
on conflict (team_slug, slug) do nothing;

insert into public.showcase_quiz
  (team_slug, question, choices, answer_index, is_example, sort_order)
values
  ('period-2-classic-cars', 'What does a turbocharger actually do?',
   '["Makes the exhaust louder","Pushes extra air into the engine","Cools the engine down","Stops the wheels spinning"]'::jsonb,
   1, true, 1),
  ('period-2-classic-cars', 'Which of these adds no horsepower at all?',
   '["A turbocharger","A freer exhaust","Stickier tires","A better air intake"]'::jsonb,
   2, true, 2),
  ('period-2-classic-cars', 'Where does a car''s speed go when you brake?',
   '["It goes back into the fuel tank","It turns into noise","It disappears","It turns into heat"]'::jsonb,
   3, true, 3),
  ('period-2-classic-cars', 'Why does letting more air in make more power?',
   '["More air means more fuel can be burned","Air is what pushes the pistons","Cold air is heavier","It makes the engine lighter"]'::jsonb,
   0, true, 4),
  ('period-2-classic-cars', 'How much of the car is actually touching the road?',
   '["The whole width of each tire","Four patches about the size of your hand","Only the front tires","It depends how fast you are going"]'::jsonb,
   1, true, 5)
on conflict do nothing;
