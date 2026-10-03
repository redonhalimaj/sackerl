-- SCKRL-511 follow-up: prevent duplicate open recipe shopping-list rows.

with duplicate_recipe_items as (
  select
    id,
    row_number() over (
      partition by household_id, recipe_id, lower(name)
      order by created_at asc, id asc
    ) as duplicate_rank
  from public.shopping_list_items
  where source = 'recipe'
    and recipe_id is not null
    and checked_at is null
)
delete from public.shopping_list_items
where id in (
  select id
  from duplicate_recipe_items
  where duplicate_rank > 1
);

create unique index if not exists shopping_list_items_open_recipe_unique_idx
  on public.shopping_list_items (household_id, recipe_id, lower(name))
  where source = 'recipe'
    and recipe_id is not null
    and checked_at is null;
