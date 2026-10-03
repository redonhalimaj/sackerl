-- SCKRL-501: seeded recipe catalog for stock-based suggestions.

create table if not exists public.recipes (
  id text primary key,
  name text not null,
  image text not null,
  ingredients text[] not null,
  serves smallint not null,
  time_minutes smallint not null,
  created_at timestamptz not null default now(),
  constraint recipes_id_check check (id ~ '^[a-z][a-z0-9-]{1,63}$'),
  constraint recipes_name_check check (char_length(trim(name)) between 1 and 120),
  constraint recipes_image_check check (char_length(trim(image)) between 1 and 240),
  constraint recipes_ingredients_check check (cardinality(ingredients) between 1 and 30),
  constraint recipes_serves_check check (serves > 0 and serves <= 12),
  constraint recipes_time_minutes_check check (time_minutes > 0 and time_minutes <= 240)
);

create index if not exists recipes_name_idx
  on public.recipes (name);

alter table public.recipes enable row level security;

drop policy if exists "Recipes are readable" on public.recipes;
create policy "Recipes are readable"
  on public.recipes
  for select
  using (true);

insert into public.recipes (id, name, image, ingredients, serves, time_minutes)
values
  (
    'tomato-pasta',
    'Tomato Pasta',
    '/recipes/tomato-pasta.jpg',
    array['spaghetti', 'tomatoes', 'garlic', 'olive oil', 'basil']::text[],
    2,
    25
  ),
  (
    'veggie-omelette',
    'Veggie Omelette',
    '/recipes/veggie-omelette.jpg',
    array['eggs', 'milk', 'bell pepper', 'spinach', 'cheese']::text[],
    2,
    15
  ),
  (
    'rice-bean-bowl',
    'Rice Bean Bowl',
    '/recipes/rice-bean-bowl.jpg',
    array['rice', 'canned beans', 'corn', 'tomatoes', 'onion']::text[],
    2,
    20
  ),
  (
    'chicken-rice-soup',
    'Chicken Rice Soup',
    '/recipes/chicken-rice-soup.jpg',
    array['chicken', 'rice', 'carrots', 'celery', 'onion']::text[],
    4,
    45
  ),
  (
    'potato-leek-soup',
    'Potato Leek Soup',
    '/recipes/potato-leek-soup.jpg',
    array['potatoes', 'leek', 'cream', 'onion', 'butter']::text[],
    4,
    35
  ),
  (
    'tuna-pasta-salad',
    'Tuna Pasta Salad',
    '/recipes/tuna-pasta-salad.jpg',
    array['tuna', 'pasta', 'corn', 'cucumber', 'yogurt']::text[],
    2,
    20
  ),
  (
    'apple-porridge',
    'Apple Porridge',
    '/recipes/apple-porridge.jpg',
    array['oats', 'milk', 'apple', 'cinnamon', 'honey']::text[],
    2,
    12
  ),
  (
    'banana-pancakes',
    'Banana Pancakes',
    '/recipes/banana-pancakes.jpg',
    array['bananas', 'eggs', 'flour', 'milk', 'baking powder']::text[],
    2,
    20
  ),
  (
    'lentil-curry',
    'Lentil Curry',
    '/recipes/lentil-curry.jpg',
    array['lentils', 'coconut milk', 'tomatoes', 'onion', 'curry powder']::text[],
    4,
    35
  ),
  (
    'cheese-toastie',
    'Cheese Toastie',
    '/recipes/cheese-toastie.jpg',
    array['bread', 'cheese', 'butter', 'tomatoes']::text[],
    1,
    10
  ),
  (
    'freezer-veg-fried-rice',
    'Freezer Veg Fried Rice',
    '/recipes/freezer-veg-fried-rice.jpg',
    array['rice', 'frozen vegetables', 'eggs', 'soy sauce', 'onion']::text[],
    2,
    18
  ),
  (
    'sausage-potato-traybake',
    'Sausage Potato Traybake',
    '/recipes/sausage-potato-traybake.jpg',
    array['sausage', 'potatoes', 'carrots', 'onion', 'oil']::text[],
    4,
    45
  ),
  (
    'greek-yogurt-bowl',
    'Greek Yogurt Bowl',
    '/recipes/greek-yogurt-bowl.jpg',
    array['yogurt', 'berries', 'oats', 'honey', 'nuts']::text[],
    1,
    8
  ),
  (
    'tomato-rice-stuffed-peppers',
    'Tomato Rice Stuffed Peppers',
    '/recipes/tomato-rice-stuffed-peppers.jpg',
    array['bell pepper', 'rice', 'tomatoes', 'cheese', 'onion']::text[],
    4,
    50
  ),
  (
    'chickpea-salad',
    'Chickpea Salad',
    '/recipes/chickpea-salad.jpg',
    array['chickpeas', 'cucumber', 'tomatoes', 'onion', 'feta']::text[],
    2,
    15
  ),
  (
    'creamy-mushroom-pasta',
    'Creamy Mushroom Pasta',
    '/recipes/creamy-mushroom-pasta.jpg',
    array['pasta', 'mushrooms', 'cream', 'garlic', 'cheese']::text[],
    2,
    25
  ),
  (
    'fish-potato-packets',
    'Fish Potato Packets',
    '/recipes/fish-potato-packets.jpg',
    array['fish', 'potatoes', 'lemon', 'butter', 'parsley']::text[],
    2,
    30
  ),
  (
    'cabbage-noodles',
    'Cabbage Noodles',
    '/recipes/cabbage-noodles.jpg',
    array['cabbage', 'noodles', 'onion', 'butter']::text[],
    2,
    20
  ),
  (
    'roasted-vegetable-wrap',
    'Roasted Vegetable Wrap',
    '/recipes/roasted-vegetable-wrap.jpg',
    array['tortilla', 'zucchini', 'bell pepper', 'cheese', 'yogurt']::text[],
    2,
    25
  ),
  (
    'egg-fried-noodles',
    'Egg Fried Noodles',
    '/recipes/egg-fried-noodles.jpg',
    array['noodles', 'eggs', 'carrots', 'soy sauce', 'spring onion']::text[],
    2,
    15
  ),
  (
    'beef-chili',
    'Beef Chili',
    '/recipes/beef-chili.jpg',
    array['minced beef', 'canned beans', 'tomatoes', 'corn', 'chili powder']::text[],
    4,
    45
  ),
  (
    'spinach-feta-pasta',
    'Spinach Feta Pasta',
    '/recipes/spinach-feta-pasta.jpg',
    array['pasta', 'spinach', 'feta', 'garlic', 'cream']::text[],
    2,
    22
  ),
  (
    'broccoli-cheddar-soup',
    'Broccoli Cheddar Soup',
    '/recipes/broccoli-cheddar-soup.jpg',
    array['broccoli', 'cheese', 'milk', 'onion', 'potatoes']::text[],
    4,
    35
  ),
  (
    'carrot-ginger-soup',
    'Carrot Ginger Soup',
    '/recipes/carrot-ginger-soup.jpg',
    array['carrots', 'ginger', 'onion', 'coconut milk']::text[],
    4,
    30
  ),
  (
    'ham-cheese-quesadilla',
    'Ham Cheese Quesadilla',
    '/recipes/ham-cheese-quesadilla.jpg',
    array['tortilla', 'ham', 'cheese', 'bell pepper']::text[],
    2,
    12
  ),
  (
    'overnight-oats',
    'Overnight Oats',
    '/recipes/overnight-oats.jpg',
    array['oats', 'milk', 'yogurt', 'banana', 'honey']::text[],
    1,
    5
  ),
  (
    'tomato-mozzarella-salad',
    'Tomato Mozzarella Salad',
    '/recipes/tomato-mozzarella-salad.jpg',
    array['tomatoes', 'mozzarella', 'basil', 'olive oil']::text[],
    2,
    10
  ),
  (
    'chicken-caesar-wrap',
    'Chicken Caesar Wrap',
    '/recipes/chicken-caesar-wrap.jpg',
    array['chicken', 'lettuce', 'tortilla', 'cheese', 'yogurt']::text[],
    2,
    20
  ),
  (
    'pea-risotto',
    'Pea Risotto',
    '/recipes/pea-risotto.jpg',
    array['rice', 'peas', 'onion', 'cheese', 'butter']::text[],
    2,
    35
  ),
  (
    'vegetable-couscous',
    'Vegetable Couscous',
    '/recipes/vegetable-couscous.jpg',
    array['couscous', 'cucumber', 'tomatoes', 'chickpeas', 'parsley']::text[],
    2,
    15
  ),
  (
    'creamy-potato-gratin',
    'Creamy Potato Gratin',
    '/recipes/creamy-potato-gratin.jpg',
    array['potatoes', 'cream', 'cheese', 'garlic']::text[],
    4,
    55
  ),
  (
    'lentil-bolognese',
    'Lentil Bolognese',
    '/recipes/lentil-bolognese.jpg',
    array['lentils', 'pasta', 'tomatoes', 'carrots', 'onion']::text[],
    4,
    40
  ),
  (
    'salmon-rice-bowl',
    'Salmon Rice Bowl',
    '/recipes/salmon-rice-bowl.jpg',
    array['salmon', 'rice', 'cucumber', 'soy sauce', 'carrots']::text[],
    2,
    25
  ),
  (
    'bean-tomato-soup',
    'Bean Tomato Soup',
    '/recipes/bean-tomato-soup.jpg',
    array['canned beans', 'tomatoes', 'onion', 'carrots']::text[],
    4,
    25
  ),
  (
    'vegetable-frittata',
    'Vegetable Frittata',
    '/recipes/vegetable-frittata.jpg',
    array['eggs', 'potatoes', 'spinach', 'cheese', 'onion']::text[],
    4,
    30
  ),
  (
    'peanut-noodle-salad',
    'Peanut Noodle Salad',
    '/recipes/peanut-noodle-salad.jpg',
    array['noodles', 'peanut butter', 'cucumber', 'carrots', 'soy sauce']::text[],
    2,
    15
  ),
  (
    'chicken-curry',
    'Chicken Curry',
    '/recipes/chicken-curry.jpg',
    array['chicken', 'rice', 'coconut milk', 'curry powder', 'onion']::text[],
    4,
    35
  ),
  (
    'pesto-gnocchi',
    'Pesto Gnocchi',
    '/recipes/pesto-gnocchi.jpg',
    array['gnocchi', 'pesto', 'tomatoes', 'cheese']::text[],
    2,
    15
  ),
  (
    'ham-potato-hash',
    'Ham Potato Hash',
    '/recipes/ham-potato-hash.jpg',
    array['ham', 'potatoes', 'eggs', 'onion']::text[],
    2,
    25
  ),
  (
    'cauliflower-cheese-bake',
    'Cauliflower Cheese Bake',
    '/recipes/cauliflower-cheese-bake.jpg',
    array['cauliflower', 'cheese', 'milk', 'breadcrumbs']::text[],
    4,
    40
  ),
  (
    'black-bean-tacos',
    'Black Bean Tacos',
    '/recipes/black-bean-tacos.jpg',
    array['black beans', 'tortilla', 'corn', 'tomatoes', 'cheese']::text[],
    2,
    20
  ),
  (
    'yogurt-cucumber-dip-plate',
    'Yogurt Cucumber Dip Plate',
    '/recipes/yogurt-cucumber-dip-plate.jpg',
    array['yogurt', 'cucumber', 'garlic', 'bread', 'carrots']::text[],
    2,
    12
  ),
  (
    'minestrone',
    'Minestrone',
    '/recipes/minestrone.jpg',
    array['pasta', 'canned beans', 'tomatoes', 'carrots', 'celery']::text[],
    4,
    40
  ),
  (
    'tuna-melt',
    'Tuna Melt',
    '/recipes/tuna-melt.jpg',
    array['tuna', 'bread', 'cheese', 'tomatoes', 'onion']::text[],
    2,
    12
  ),
  (
    'vegetable-lasagna-skillet',
    'Vegetable Lasagna Skillet',
    '/recipes/vegetable-lasagna-skillet.jpg',
    array['pasta', 'zucchini', 'tomatoes', 'cheese', 'spinach']::text[],
    4,
    35
  ),
  (
    'apple-cheddar-salad',
    'Apple Cheddar Salad',
    '/recipes/apple-cheddar-salad.jpg',
    array['apple', 'lettuce', 'cheese', 'nuts', 'bread']::text[],
    2,
    10
  ),
  (
    'fried-potato-eggs',
    'Fried Potato Eggs',
    '/recipes/fried-potato-eggs.jpg',
    array['potatoes', 'eggs', 'onion', 'butter']::text[],
    2,
    20
  ),
  (
    'frozen-berry-smoothie',
    'Frozen Berry Smoothie',
    '/recipes/frozen-berry-smoothie.jpg',
    array['frozen berries', 'yogurt', 'banana', 'milk']::text[],
    2,
    8
  ),
  (
    'simple-shakshuka',
    'Simple Shakshuka',
    '/recipes/simple-shakshuka.jpg',
    array['eggs', 'tomatoes', 'bell pepper', 'onion', 'spices']::text[],
    2,
    30
  ),
  (
    'pantry-tomato-soup',
    'Pantry Tomato Soup',
    '/recipes/pantry-tomato-soup.jpg',
    array['canned tomatoes', 'cream', 'bread', 'basil']::text[],
    4,
    20
  )
on conflict (id) do update
  set name = excluded.name,
      image = excluded.image,
      ingredients = excluded.ingredients,
      serves = excluded.serves,
      time_minutes = excluded.time_minutes;
