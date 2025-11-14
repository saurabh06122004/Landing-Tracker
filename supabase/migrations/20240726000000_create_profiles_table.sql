
-- Create the user_role type
create type public.user_role as enum ('lender', 'borrower');

-- Create the profiles table
create table public.profiles (
  id uuid not null references auth.users on delete cascade,
  name text,
  email text,
  mobile_number text,
  role public.user_role,
  updated_at timestamp with time zone,
  primary key (id)
);

-- Set up Row Level Security (RLS)
alter table public.profiles
  enable row level security;

create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on public.profiles
  for update using (auth.uid() = id);

-- This trigger automatically creates a profile entry when a new user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, mobile_number, role, updated_at)
  values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    new.email,
    new.raw_user_meta_data ->> 'mobile_number',
    (new.raw_user_meta_data ->> 'role')::public.user_role,
    new.created_at
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
