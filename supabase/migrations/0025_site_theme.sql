-- Each club's design tokens, on the club's own row (session 5b).
--
-- The member area is multi-tenant, and until now its five colours were typed
-- by hand into apps/members/src/app/globals.css. That is correct for exactly as
-- long as there is one club. The second one would inherit Electric Grid's navy
-- and green, which is the opposite of "adding a club is configuration rather
-- than a project".
--
-- So the tokens move to where the rest of a club's configuration already lives.
-- `resolveTenant` reads them with the hostname lookup it already does, and the
-- layout emits them as CSS custom properties, so a club's colours arrive with
-- its identity rather than with its deployment.
--
-- ---------------------------------------------------------------------------
-- Why jsonb rather than five columns
-- ---------------------------------------------------------------------------
--
-- The same reasoning as site_members.profile in 0013. This shape is not
-- settled: the marketing renderer already carries two font stacks alongside the
-- colours, and a later design pass will want a radius, a shadow, or a second
-- accent. Adding one is an application change here and a migration if these
-- were columns.
--
-- Nothing queries inside it, so there is no index to lose either.
--
-- ---------------------------------------------------------------------------
-- These values end up inside a <style> tag
-- ---------------------------------------------------------------------------
--
-- Which makes this column an injection surface if anything unvalidated is ever
-- written to it. The application refuses to emit a token it cannot recognise,
-- in apps/members/src/lib/theme.ts, and that check has a unit test. This
-- comment is here so that whoever later adds a theme editor to the admin
-- console knows the check exists and does not conclude that the column is
-- free-form because it is jsonb.
--
-- Only staff and site administrators can write it, which the existing policies
-- on `sites` already enforce.

alter table sites add column if not exists theme jsonb;

comment on column sites.theme is
  'Design tokens for this club: colors and fonts. Read by apps/members and emitted as CSS custom properties. Values are validated before they reach a style tag; see apps/members/src/lib/theme.ts. Null means the platform default.';

-- Electric Grid's palette, which is already live on their marketing page.
--
-- Copied from ELECTRIC_GRID_THEME in apps/platform/src/lib/clients/electric-grid.ts,
-- which remains what builds the marketing page. The two now agree by having
-- been written at the same moment rather than by construction, and closing that
-- gap means teaching the site renderer to read this column too. Worth doing,
-- and a bigger change than this session: the renderer produces a static export
-- for a site that may not have a row yet at build time.
--
-- Blue and green per the client intake, resolved for a professional utility
-- audience: deep navy carries the authority the audience expects, and the green
-- reads as energy and reliability rather than as sustainability marketing.
update sites
   set theme = jsonb_build_object(
     'colors', jsonb_build_object(
       'background', '#ffffff',
       'text', '#132330',
       'primary', '#0d2b45',
       'accent', '#2f9e6f',
       'muted', '#5b6f7d'
     ),
     'fonts', jsonb_build_object(
       'body', '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
       'heading', '"Source Serif 4", Georgia, "Times New Roman", serif'
     )
   )
 where slug = 'electricgrid'
   and theme is null;
