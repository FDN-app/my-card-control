-- Migración: Gestión de estados en suscripciones
ALTER TABLE suscripciones ADD COLUMN IF NOT EXISTS estado text DEFAULT 'Activa';

-- Asegurar que las existentes tengan el valor por defecto
UPDATE suscripciones SET estado = 'Activa' WHERE estado IS NULL;
