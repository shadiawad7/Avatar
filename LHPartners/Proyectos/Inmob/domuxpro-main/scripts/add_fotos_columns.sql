-- Añadir columna fotos a las tablas especificadas
-- La columna almacenará un array de URLs de las fotos subidas a Vercel Blob

ALTER TABLE informacion_general 
ADD COLUMN IF NOT EXISTS fotos TEXT[];

ALTER TABLE estructura_horizontal 
ADD COLUMN IF NOT EXISTS fotos TEXT[];

ALTER TABLE estructura_vertical 
ADD COLUMN IF NOT EXISTS fotos TEXT[];

ALTER TABLE cubiertas 
ADD COLUMN IF NOT EXISTS fotos TEXT[];

ALTER TABLE carpinterias 
ADD COLUMN IF NOT EXISTS fotos TEXT[];

ALTER TABLE instalacion_agua_acs 
ADD COLUMN IF NOT EXISTS fotos TEXT[];

ALTER TABLE instalacion_electrica 
ADD COLUMN IF NOT EXISTS fotos TEXT[];

ALTER TABLE calefaccion 
ADD COLUMN IF NOT EXISTS fotos TEXT[];
