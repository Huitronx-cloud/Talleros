-- ── Imagen de portada de los artículos del blog ───────────────────────────────
-- El blog no tenía imágenes en ninguna capa: ni columna, ni renderizado, ni
-- imagen al compartir. Un artículo compartido en WhatsApp o Facebook salía como
-- un enlace de texto pelado, que es la forma más rápida de que nadie lo abra.
--
-- Una sola columna de texto, que admite las dos formas de guardar la imagen sin
-- tener que elegir ahora:
--   · ruta local servida por la propia app  → '/blog/mi-articulo.webp'
--   · URL de Supabase Storage o del CDN     → 'https://…/storage/v1/object/…'
-- Ambas están permitidas en images.remotePatterns de next.config.mjs, así que
-- next/image las optimiza igual.
--
-- Sin texto alternativo propio: se usa el título del artículo, que ya describe
-- la imagen razonablemente. Si algún día hace falta uno distinto por imagen, se
-- añade otra columna; hoy sería inventar trabajo.

alter table public.articulos_blog
  add column if not exists imagen_url text;

comment on column public.articulos_blog.imagen_url is
  'Portada del artículo. Ruta local (/blog/x.webp) o URL absoluta. Null = sin imagen.';
