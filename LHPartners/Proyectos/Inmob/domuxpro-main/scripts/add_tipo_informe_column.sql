-- Añadir columna tipo_informe a la tabla informes
ALTER TABLE informes 
ADD COLUMN IF NOT EXISTS tipo_informe TEXT DEFAULT 'basico' CHECK (tipo_informe IN ('basico', 'tecnico_completo', 'documental_completo'));

-- Actualizar informes existentes a tipo básico por defecto
UPDATE informes SET tipo_informe = 'basico' WHERE tipo_informe IS NULL;

COMMENT ON COLUMN informes.tipo_informe IS 'Tipo de informe: basico (solo datos básicos), tecnico_completo (con estructura e instalaciones), documental_completo (informe completo con todas las secciones)';
