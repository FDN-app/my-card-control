-- Migración: Telegram multiusuario
-- Corre este SQL en el editor de Supabase antes de desplegar los cambios.

-- 1. Agregar campo telegram_chat_id a configuracion_usuario
ALTER TABLE configuracion_usuario
  ADD COLUMN IF NOT EXISTS telegram_chat_id text;

-- 2. Tabla de vinculaciones temporales (código de 6 chars, expira en 10 min)
CREATE TABLE IF NOT EXISTS telegram_vinculaciones (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo      text         UNIQUE NOT NULL,
  expira_en   timestamptz  NOT NULL DEFAULT (now() + interval '10 minutes'),
  vinculado_at timestamptz,
  created_at  timestamptz  DEFAULT now()
);

ALTER TABLE telegram_vinculaciones ENABLE ROW LEVEL SECURITY;

-- El usuario solo ve (y puede insertar) sus propios registros
CREATE POLICY "Users manage own telegram_vinculaciones"
  ON telegram_vinculaciones
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
