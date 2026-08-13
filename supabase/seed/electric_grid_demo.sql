-- Demonstration content for Electric Grid.
--
-- Run this to populate the club before a user test. Run
-- `select app.purge_site_demo_rows(id) from sites where slug = 'electricgrid';`
-- to take all of it out again. The site cannot be published while any of it is
-- still here, because 0024 puts a trigger on `sites` that refuses.
--
-- Idempotent. Every row has a fixed id and an `on conflict do nothing`, so
-- running it twice changes nothing and running it after a partial failure
-- finishes the job.
--
-- ---------------------------------------------------------------------------
-- The two content rules, and why they are rules
-- ---------------------------------------------------------------------------
--
-- **Fictional employers only, never a real utility.** Every organization named
-- below is invented. If one of them turns out to match a real company, it is a
-- collision rather than a reference, and it should be renamed rather than
-- explained. Worth a glance from James before the user test, since he knows the
-- industry's names better than this file does.
--
-- **No fabricated statistics, anywhere.** Not one number appears in any article
-- body. This is the rule that matters most. A seeded article inventing a load
-- growth figure, attached to a plausible utility's name, is exactly the kind of
-- thing that gets screenshotted, outlives the demo, and ends up quoted back at
-- somebody. The pieces below are about method and judgement, which is what the
-- club is actually for and which needs no invented evidence.
--
-- A third rule, inherited from build plan section 3: nothing here uses the
-- coordination language this industry reads badly. No collaborating, no
-- coordinating, no agreeing, no standardizing. The articles talk about methods
-- and published results and stay away from forward-looking plans and capacity.
--
-- ---------------------------------------------------------------------------
-- What this does not seed, and why
-- ---------------------------------------------------------------------------
--
-- The audio piece and the video piece are left as **drafts**. Both need an
-- artifact this file cannot produce: a real recording in the member-media
-- bucket, and a real video id that actually resolves. Inventing either would
-- give a tester a player that does not play, which is worse than one fewer
-- article.
--
-- Those two are the session 5 gate. The last section of this file is the two
-- statements that publish them once the artifacts exist.
--
-- Reactions, comments, and events come with sessions 6 and 7, so expect to
-- extend this file rather than replace it.

do $$
declare
  v_site uuid;

  -- Fixed ids, so this file is idempotent and so the purge and the articles
  -- below can reference members without a lookup.
  v_dana   uuid := '00000000-0000-4000-a000-00000000d001';
  v_tomas  uuid := '00000000-0000-4000-a000-00000000d002';
  v_priya  uuid := '00000000-0000-4000-a000-00000000d003';
  v_aiko   uuid := '00000000-0000-4000-a000-00000000d004';
  v_elena  uuid := '00000000-0000-4000-a000-00000000d005';
  v_marcus uuid := '00000000-0000-4000-a000-00000000d006';
  v_series uuid := '00000000-0000-4000-a000-00000000e001';
begin
  select id into v_site from sites where slug = 'electricgrid';
  if v_site is null then
    raise exception 'No site with slug electricgrid. Nothing seeded.';
  end if;

  -- -------------------------------------------------------------------------
  -- People
  -- -------------------------------------------------------------------------
  --
  -- auth_user_id stays null, which is the same shape an invitation has before
  -- it is accepted. Their addresses are at .invalid, a reserved top level
  -- domain nobody can register, so no real person can ever receive mail as one
  -- of them. lib/auth.ts also refuses to let a demo row be claimed at all.

  insert into site_members (id, site_id, email, display_name, role, status, is_demo, profile)
  values
    (v_dana, v_site, 'dana.okafor@demo.invalid', 'Dana Okafor', 'member', 'active', true,
     jsonb_build_object(
       'employer', 'Cascade Power Authority',
       'title', 'Director of Transmission Planning',
       'location', 'Portland, United States',
       'career', 'Twenty years in transmission planning, most of it on interconnection studies and the long range plan. I came up through the study group and still do my own load flow work when nobody is watching.' || E'\n\n' || 'What I care about is the gap between what a model says and what the people reading it think it says.',
       'interests', 'Forecast assumptions, interconnection study methods, and how planning teams actually make decisions when the model is ambiguous.'
     )),

    (v_tomas, v_site, 'tomas.lindqvist@demo.invalid', 'Tomas Lindqvist', 'member', 'active', true,
     jsonb_build_object(
       'employer', 'Ravensbourne Electric Cooperative',
       'title', 'Head of Load Forecasting',
       'location', 'Malmo, Sweden',
       'career', 'I run the forecasting group at a cooperative with a service territory that is half agricultural and half suburban, which means my two halves rarely behave the same way in the same year.' || E'\n\n' || 'Before this I spent six years in market operations, which is where I learned that a forecast is read by people who were not in the room when it was built.',
       'interests', 'Weather normalisation, the practical limits of machine learning on short histories, and how to present uncertainty to a board.'
     )),

    (v_priya, v_site, 'priya.raghunathan@demo.invalid', 'Priya Raghunathan', 'member', 'active', true,
     jsonb_build_object(
       'employer', 'Meridian Grid Services',
       'title', 'Principal Engineer',
       'location', 'Bengaluru, India',
       'career', 'I work on the tooling planners use rather than on the plans themselves. Most of my week is spent finding out why two teams got different answers from what they believed was the same model.',
       'interests', 'Model provenance, reproducibility, and interviewing people who have been doing this longer than I have.'
     )),

    (v_aiko, v_site, 'aiko.tanabe@demo.invalid', 'Aiko Tanabe', 'member', 'active', true,
     jsonb_build_object(
       'employer', 'Thornbury Compute',
       'title', 'Head of Site Selection',
       'location', 'Osaka, Japan',
       'career', 'I sit on the other side of the interconnection request. My job is to find places where a large compute site can be built and energised on a timeline the business can plan around.' || E'\n\n' || 'I joined this forum because most of what I know about how utilities read my requests, I learned by getting them wrong.',
       'interests', 'What a utility planner actually needs from a request, and why the answer differs so much between regions.'
     )),

    (v_elena, v_site, 'elena.duarte@demo.invalid', 'Elena Duarte', 'member', 'active', true,
     jsonb_build_object(
       'employer', 'Kestrel Applied Intelligence',
       'title', 'Research Lead',
       'location', 'Lisbon, Portugal',
       'career', 'I lead a small research group working on forecasting and anomaly detection for physical infrastructure. My background is statistics rather than power systems, and I have spent the last three years learning how much that matters.',
       'interests', 'Where machine learning genuinely helps on this problem, where it does not, and how to tell the difference before a pilot rather than after one.'
     )),

    (v_marcus, v_site, 'marcus.bell@demo.invalid', 'Marcus Bell', 'guest', 'active', true,
     jsonb_build_object(
       'employer', 'Cascade Power Authority',
       'title', 'Regulatory Affairs Manager',
       'location', 'Portland, United States',
       'career', 'I translate between the planning group and the commission. Twelve years of it, and I still find the translation harder than either language.',
       'interests', 'How planning assumptions survive a regulatory proceeding, and what documentation makes that easier.'
     ))
  on conflict do nothing;

  -- Marcus is seeded as a guest, so the user test has one of those to look at.
  -- A window well past the test, because a guest whose access lapses mid-test
  -- would be testing the wrong thing.
  update site_members
     set access_expires_at = now() + interval '180 days'
   where id = v_marcus and access_expires_at is null;

  -- -------------------------------------------------------------------------
  -- A series
  -- -------------------------------------------------------------------------

  insert into site_article_series (id, site_id, slug, title, description, created_by, is_demo)
  values (
    v_series, v_site, 'forecasting-from-the-inside', 'Forecasting, from the inside',
    'Three members on how a load forecast is actually built, where it goes wrong, and what it looks like from the other side of an interconnection request.',
    v_dana, true
  )
  on conflict do nothing;

  -- -------------------------------------------------------------------------
  -- Articles
  -- -------------------------------------------------------------------------
  --
  -- published_at is normally written by the trigger in 0023, which is what stops
  -- an author dating their own piece to the top of the library forever. A seed
  -- wants a spread of dates rather than six articles published in the same
  -- second, so the trigger comes off for these inserts the same way the test
  -- suites take a trigger off for a fixture. It goes straight back on.

  alter table site_articles disable trigger stamp_publication;

  insert into site_articles
    (id, site_id, author_id, kind, status, slug, title, summary, body,
     series_id, series_position, published_at, is_demo)
  values
    ('00000000-0000-4000-a000-00000000f001', v_site, v_dana, 'written', 'published',
     'what-a-load-forecast-is-made-of',
     'What a load forecast is actually made of',
     'A forecast is not a number. It is a stack of assumptions made by different people for different reasons, and the number on top is only as good as the least examined thing underneath it.',
     'Every planning conversation eventually arrives at a forecast, and most of them treat it as a single number. It is not. It is a stack of assumptions, each one made by a different person for a different reason, and the figure at the top is only as good as the least examined thing underneath it.

The bottom of the stack is usually weather. Somebody chose a set of historical years to stand for normal conditions, and somebody else decided how far back normal should reach. Those two choices move the answer more than most of what sits above them, and they are rarely revisited once they have been written into a spreadsheet and inherited by the next analyst.

Above that sits customer growth, which is where a forecast stops being arithmetic and starts being judgement. Counting premises is straightforward. Counting what is inside them is not, and what is inside them has changed faster in the last decade than the methods built to count it.

The layer getting the most attention now is large single loads. A manufacturing plant or a compute site does not arrive gradually. It arrives as one request with a date attached, and the date is frequently wrong in both directions. Planners have learned to treat these as probabilities rather than commitments, which is a real change in method and one worth being explicit about rather than making quietly in the corner of a model.

None of this is a criticism of forecasting. It is an argument for showing the stack. A forecast presented as a number invites an argument about the number. A forecast presented as its assumptions invites an argument about the assumptions, which is the argument worth having.',
     v_series, 1, now() - interval '34 days', true),

    ('00000000-0000-4000-a000-00000000f002', v_site, v_tomas, 'written', 'published',
     'where-a-forecast-usually-goes-wrong',
     'Where a forecast usually goes wrong',
     'In my experience it is almost never the model. It is the handoff: the assumption somebody carried forward without being told it was an assumption.',
     'I have been asked to explain a missed forecast more times than I would like, and in my experience the model is almost never the problem. The problem is a handoff.

A forecast passes through several hands on its way to being used. Somebody produces it, somebody summarises it, somebody puts the summary in front of people making a decision. At each step a caveat is dropped, because caveats do not survive summarising. By the time it reaches the decision, the range has become a line and the line has become a fact.

The second common failure is a history that is too short for the question. A method that needs several cycles of a pattern to learn it will produce a confident answer from one cycle, and it will not tell you which situation you are in. That is not a flaw in the method. It is a flaw in asking it a question it cannot answer, and the responsibility for noticing sits with the person asking.

The third is more uncomfortable. Forecasts get revised when they are wrong in one direction and defended when they are wrong in the other, because the two errors have different consequences for the person who published them. Nobody decides to do this. It emerges from an entirely reasonable set of incentives, and the only defence I know is to write down in advance what would count as being wrong.

What has helped my group most is unglamorous. We keep the previous forecast next to the new one, with a written note on what changed and why. It takes an afternoon a cycle. It has caught more than any of the modelling work I am prouder of.',
     v_series, 2, now() - interval '21 days', true),

    ('00000000-0000-4000-a000-00000000f003', v_site, v_priya, 'audio', 'draft',
     'a-conversation-about-forecasting-horizons',
     'A conversation about forecasting horizons',
     'Dana Okafor and Tomas Lindqvist on why the one year and the ten year forecast are different jobs, and what goes wrong when one team is asked to do both.',
     'Notes from the conversation, for anybody who would rather read than listen.

We started on the obvious point and spent most of the time on it: a short horizon forecast and a long horizon one are different jobs that happen to share a name. The short one is largely an operational question with a lot of recent signal. The long one is a question about what the service territory becomes, and almost none of the signal that matters is in the load history.

Tomas made the point that asking one team to do both is common and rarely examined. The habits that make somebody good at the short horizon, which are mostly about respecting recent data, are the habits that make them cautious about the structural change the long horizon has to take a position on.

Dana talked about what she does when the two disagree, which was the most useful part of the conversation and the hardest to summarise. The short version is that she treats the disagreement as the finding rather than as a problem to reconcile before publishing.

We finished on documentation, because both of them got there independently, and on what a planner owes a reader who was not in the room.',
     v_series, 3, null, true),

    ('00000000-0000-4000-a000-00000000f004', v_site, v_aiko, 'written', 'published',
     'reading-a-data-centre-interconnection-request',
     'Reading an interconnection request, from the side that sends them',
     'What is actually behind the date on a large load request, why it moves, and what a planner could ask for that would make it more useful.',
     'I send interconnection requests for a living, and I have learned most of what I know about how they are read by getting them wrong. This is an attempt to describe what is behind one, in case it makes the next one easier to read.

The date on a request is not a commitment. It is the earliest date the project could energise if everything the business currently believes turns out to be true. Several of those beliefs are outside our control, and some are outside our knowledge. When the date moves, it is almost never because somebody changed their mind about the grid.

The size is a more interesting number than it looks. A large site does not draw its full request from the first day, and the shape of the ramp is often better known to us than the final figure. In most of the processes I have been through, nobody asked for the ramp. When a planner has asked, the conversation that followed was more useful than anything in the form.

The part I would change is the silence between submitting and hearing back. Not the duration, which I understand. The silence. A request that has been read and parked is a very different thing to plan around than one that has not been read, and from the outside they look identical.

What I would ask for, if I could ask for one thing: tell us which of our numbers you are actually using. We produce several, we are guessing at which one matters, and we would happily produce a better version of the one that does.',
     null, null, now() - interval '13 days', true),

    ('00000000-0000-4000-a000-00000000f005', v_site, v_elena, 'written', 'published',
     'questions-worth-asking-before-a-pilot',
     'Questions worth asking before a pilot',
     'Six things I now ask before agreeing to a machine learning pilot on infrastructure data, most of which I learned by not asking them.',
     'My group does applied machine learning on physical infrastructure data. We say yes to fewer pilots than we used to, and the reason is a short list of questions we now ask first. None of them is technical.

What decision changes if this works? A surprising number of pilots cannot answer this. The output is interesting, somebody would read it, and nothing anybody does would be different. That is a research project, and it is worth running as one, but it should not be called a pilot.

Who is accountable for the decision today, and what do they use now? If the answer is a person with thirty years of experience and a spreadsheet, the bar is that person, not zero. In several of our early pilots the spreadsheet won, and the useful finding was why.

How much history is there, and how many times has the pattern we care about actually happened? This is the question that ends the most conversations. A method cannot learn from a thing that has occurred twice.

What happens when it is wrong, and who finds out? Physical infrastructure has consequences that a recommendation engine does not. The failure mode needs an owner before the model has a user.

Is the data actually available at the moment of the decision, or only afterwards? This one is embarrassing to discover late, and we have discovered it late.

What does the person doing the job think of the idea? Not a governance question. A useful one. They usually know why the obvious approach does not work, and they are rarely asked before the pilot rather than after it.',
     null, null, now() - interval '6 days', true),

    ('00000000-0000-4000-a000-00000000f006', v_site, v_marcus, 'video', 'draft',
     'a-walkthrough-of-an-interconnection-queue',
     'A walkthrough of an interconnection queue',
     'A recorded screen walkthrough of how a request moves through a queue, what each state actually means, and where the waiting happens.',
     'A short recorded walkthrough for members who have never seen a queue from the inside. It follows one request from submission to study, with a pause on each state to say what it means in practice rather than what the documentation says it means.

There is nothing confidential here. Everything shown is from published process documentation, and the request being followed is an invented one.',
     null, null, null, true)
  on conflict do nothing;

  alter table site_articles enable trigger stamp_publication;
end $$;

-- ---------------------------------------------------------------------------
-- The two statements for the session 5 gate
-- ---------------------------------------------------------------------------
--
-- Both of the drafts above need an artifact a SQL file cannot make. These are
-- the statements that finish them once the artifacts exist. They are commented
-- out because running them before there is anything to point at would publish
-- a player that does not play.
--
-- 1. THE AUDIO. Sign in as an administrator, open the piece at
--    /write, upload a recording through the form, and publish it there. The
--    form is the thing being gated, so doing it in SQL would skip the test.
--    Note the piece belongs to a seeded member, so an administrator has to
--    publish it from the article page rather than from /write.
--
--    Failing that, once the bytes are in the member-media bucket at
--    <site_id>/<member_id>/<file>:
--
--      update site_articles
--         set media_path = '<site_id>/00000000-0000-4000-a000-00000000d003/<file>',
--             media_mime = 'audio/mpeg',
--             status = 'published'
--       where id = '00000000-0000-4000-a000-00000000f003';
--
-- 2. THE VIDEO. Pick a real YouTube or Vimeo video the club is happy to have in
--    its library, then:
--
--      update site_articles
--         set embed_provider = 'youtube',   -- or 'vimeo'
--             embed_id = '<the eleven character id, or the vimeo number>',
--             status = 'published'
--       where id = '00000000-0000-4000-a000-00000000f006';
--
--    Or paste the link into the editor, which is the path a member would take
--    and therefore the one worth testing.
--
-- ---------------------------------------------------------------------------
-- The purge
-- ---------------------------------------------------------------------------
--
--   select * from app.purge_site_demo_rows(
--     (select id from sites where slug = 'electricgrid')
--   );
--
-- It returns what it removed, plus the storage paths of any recording attached
-- to a demo article. Those bytes are not deleted by the row going away, so
-- remove them from the member-media bucket separately.
--
-- Until it has run, `update sites set status = 'published'` on this site raises.
-- That refusal is the point: see 0024.
