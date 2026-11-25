-- Remove v_count check from decide_product function (allow approve/publish without verification)
create or replace function public.decide_product(p_id uuid, p_decision text, p_note text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_profile_role() is distinct from 'owner' then
    raise exception 'Only the owner can approve or publish products';
  end if;

  if p_decision = 'approved' then
    update public.products
      set publication_status = 'approved', review_note = p_note
      where id = p_id and deleted_at is null;
  elsif p_decision = 'published' then
    update public.products
      set publication_status = 'published', review_note = p_note
      where id = p_id and deleted_at is null and publication_status = 'approved';
  elsif p_decision = 'rejected' then
    update public.products
      set publication_status = 'rejected', review_note = p_note
      where id = p_id and deleted_at is null;
  elsif p_decision = 'changes' then
    update public.products
      set publication_status = 'draft', review_note = p_note
      where id = p_id and deleted_at is null;
  else
    raise exception 'Unknown decision';
  end if;
end;
$$;

revoke all on function public.decide_product(uuid, text, text) from public;
grant execute on function public.decide_product(uuid, text, text) to authenticated;