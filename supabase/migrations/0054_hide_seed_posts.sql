alter table public.community_posts disable trigger community_posts_guard;
update public.community_posts set hidden = true,
  hidden_reason = coalesce(nullif(hidden_reason, ''), 'Seed/namuna post (muallif yo‘q) — QA4')
 where author_id is null and not hidden;
alter table public.community_posts enable trigger community_posts_guard;
select id, hidden from public.community_posts order by id;
