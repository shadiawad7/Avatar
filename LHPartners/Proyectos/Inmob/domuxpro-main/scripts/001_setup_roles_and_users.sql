-- Crear el tipo enum para roles si no existe
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('cliente', 'arquitecto', 'gestor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Modificar la tabla usuarios para asegurar que tenga la estructura correcta
ALTER TABLE usuarios 
  ALTER COLUMN rol TYPE user_role USING rol::user_role;

-- Crear índice en email para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Función para sincronizar usuarios de Stack Auth con nuestra tabla
CREATE OR REPLACE FUNCTION sync_stack_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO usuarios (email, nombre, apellido, rol)
  VALUES (
    NEW.email,
    COALESCE(NEW.name, ''),
    '',
    'cliente' -- rol por defecto
  )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para sincronizar automáticamente
DROP TRIGGER IF EXISTS sync_user_on_insert ON neon_auth.users_sync;
CREATE TRIGGER sync_user_on_insert
  AFTER INSERT ON neon_auth.users_sync
  FOR EACH ROW
  EXECUTE FUNCTION sync_stack_auth_user();

-- Insertar algunos usuarios de ejemplo para testing
INSERT INTO usuarios (email, nombre, apellido, rol) VALUES
  ('cliente@test.com', 'Juan', 'Pérez', 'cliente'),
  ('arquitecto@test.com', 'María', 'García', 'arquitecto'),
  ('gestor@test.com', 'Carlos', 'López', 'gestor')
ON CONFLICT (email) DO NOTHING;
