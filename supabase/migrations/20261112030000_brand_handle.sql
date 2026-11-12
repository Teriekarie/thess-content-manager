-- Social handle shown on designed graphics. Thess gave @teriekarie on 12 November 2026.
alter table public.brand_settings add column handle text not null default '';
update public.brand_settings set handle = '@teriekarie' where handle = '';
