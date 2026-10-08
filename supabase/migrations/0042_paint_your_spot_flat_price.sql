-- Paint Your Spot: one flat price, no art student option.
--
-- Dr. Johnson set every spot at $30, so the survey no longer asks about
-- price comfort, and the art student option is gone, so it no longer asks
-- who paints. The columns stay for answers already given, but new answers
-- leave them empty instead of inventing a value.

alter table public.pys_interest_responses alter column painter drop not null;
alter table public.pys_interest_responses alter column price_comfort drop not null;

update public.pys_settings set value = '30', updated_at = now()
where key = 'standard_fee' and value = '';
