-- Jurandir Corretor: banco e políticas. Execute no SQL Editor do Supabase.
create extension if not exists pgcrypto;

create table if not exists public.admins (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.imoveis (
  id uuid primary key default gen_random_uuid(),
  codigo text unique,
  titulo text not null,
  descricao text,
  tipo text not null default 'outro', finalidade text not null default 'venda', situacao text not null default 'pronto', status text not null default 'disponivel',
  preco numeric not null default 0, condominio numeric, iptu numeric,
  bairro text, cidade text not null default 'Diadema', endereco text,
  quartos integer not null default 0, suites integer not null default 0, banheiros integer not null default 0, vagas integer not null default 0,
  area_util_m2 numeric, area_total_m2 numeric, andar integer,
  aceita_financiamento boolean not null default false, minha_casa_minha_vida boolean not null default false, aceita_fgts boolean not null default false,
  diferenciais text[] not null default '{}', fotos text[] not null default '{}',
  destaque boolean not null default false, publicado boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint imoveis_titulo_len check (char_length(titulo) between 1 and 120),
  constraint imoveis_descricao_len check (descricao is null or char_length(descricao) <= 4000),
  constraint imoveis_enum_tipo check (tipo in ('apartamento','casa','sobrado','terreno','comercial','outro')),
  constraint imoveis_enum_finalidade check (finalidade in ('venda','locacao')),
  constraint imoveis_enum_situacao check (situacao in ('pronto','na_planta','em_obras')),
  constraint imoveis_enum_status check (status in ('disponivel','reservado','vendido')),
  constraint imoveis_nonnegative check (preco >= 0 and coalesce(condominio,0) >= 0 and coalesce(iptu,0) >= 0 and quartos >= 0 and suites >= 0 and banheiros >= 0 and vagas >= 0 and coalesce(area_util_m2,0) >= 0 and coalesce(area_total_m2,0) >= 0 and coalesce(andar,0) >= 0),
  constraint imoveis_limits check (cardinality(fotos) <= 15 and cardinality(diferenciais) <= 20),
  constraint imoveis_photo_urls check (not exists (select 1 from unnest(fotos) as f(url) where url !~ '^https://[^/]+/storage/v1/object/public/imoveis-fotos/imoveis/[0-9a-fA-F-]{36}/[0-9]+\.webp$'))
);
alter table public.imoveis enable row level security;
revoke all on public.imoveis from anon, authenticated;
grant select on public.imoveis to authenticated;
grant select (id,codigo,titulo,descricao,tipo,finalidade,situacao,status,preco,condominio,iptu,bairro,cidade,quartos,suites,banheiros,vagas,area_util_m2,area_total_m2,andar,aceita_financiamento,minha_casa_minha_vida,aceita_fgts,diferenciais,fotos,destaque,publicado,created_at,updated_at) on public.imoveis to anon;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists imoveis_touch on public.imoveis;
create trigger imoveis_touch before update on public.imoveis for each row execute function public.touch_updated_at();

-- Código curto gerado no banco, sem confiar no navegador.
create or replace function public.next_imovel_code() returns trigger language plpgsql set search_path = public as $$ declare n integer; begin if new.codigo is null or new.codigo = '' then select coalesce(max(substring(codigo from 4)::integer),0)+1 into n from public.imoveis where codigo ~ '^JC-[0-9]+$'; new.codigo = 'JC-' || lpad(n::text,4,'0'); end if; return new; end; $$;
drop trigger if exists imoveis_code on public.imoveis;
create trigger imoveis_code before insert on public.imoveis for each row execute function public.next_imovel_code();

drop policy if exists imoveis_public_select on public.imoveis;
drop policy if exists imoveis_admin_insert on public.imoveis;
drop policy if exists imoveis_admin_update on public.imoveis;
drop policy if exists imoveis_admin_delete on public.imoveis;
create policy imoveis_public_select on public.imoveis for select to anon using (publicado = true);
create policy imoveis_admin_select on public.imoveis for select to authenticated using (public.is_admin());
create policy imoveis_admin_insert on public.imoveis for insert to authenticated with check (public.is_admin());
create policy imoveis_admin_update on public.imoveis for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy imoveis_admin_delete on public.imoveis for delete to authenticated using (public.is_admin());

-- View sem endereço. security_invoker faz a política acima continuar valendo.
drop view if exists public.imoveis_publicos;
create view public.imoveis_publicos with (security_invoker = true) as select id,codigo,titulo,descricao,tipo,finalidade,situacao,status,preco,condominio,iptu,bairro,cidade,quartos,suites,banheiros,vagas,area_util_m2,area_total_m2,andar,aceita_financiamento,minha_casa_minha_vida,aceita_fgts,diferenciais,fotos,destaque,publicado,created_at,updated_at from public.imoveis where publicado = true;
revoke all on public.imoveis_publicos from public;
grant select on public.imoveis_publicos to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('imoveis-fotos','imoveis-fotos',true,5242880,array['image/webp','image/jpeg','image/png']) on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/webp','image/jpeg','image/png'];
drop policy if exists fotos_admin_insert on storage.objects;
drop policy if exists fotos_admin_update on storage.objects;
drop policy if exists fotos_admin_delete on storage.objects;
-- Não há policy SELECT em storage.objects: bucket público permite GET por URL,
-- mas anon não pode listar objetos pela API.
create policy fotos_admin_insert on storage.objects for insert to authenticated with check (bucket_id = 'imoveis-fotos' and name ~ '^imoveis/[0-9a-fA-F-]{36}/[0-9]+\.(webp|jpg|png)$' and public.is_admin());
create policy fotos_admin_update on storage.objects for update to authenticated using (bucket_id = 'imoveis-fotos' and name ~ '^imoveis/[0-9a-fA-F-]{36}/[0-9]+\.(webp|jpg|png)$' and public.is_admin()) with check (bucket_id = 'imoveis-fotos' and name ~ '^imoveis/[0-9a-fA-F-]{36}/[0-9]+\.(webp|jpg|png)$' and public.is_admin());
create policy fotos_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'imoveis-fotos' and name ~ '^imoveis/[0-9a-fA-F-]{36}/[0-9]+\.(webp|jpg|png)$' and public.is_admin());

-- Depois de criar o usuário em Authentication, substitua o UUID abaixo e execute:
-- insert into public.admins(user_id) values ('UUID-DO-USUARIO-CRIADO-NO-AUTH');
