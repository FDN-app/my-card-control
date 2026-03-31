-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Table: tarjetas
-- ---------------------------------------------------------------------------
CREATE TABLE tarjetas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  banco TEXT NOT NULL,
  limite_banco NUMERIC NOT NULL,
  presupuesto_propio NUMERIC NOT NULL,
  dia_cierre INT NOT NULL,
  dia_vencimiento INT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for tarjetas
ALTER TABLE tarjetas ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own tarjetas
CREATE POLICY "Users can manage their own tarjetas"
  ON tarjetas
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Table: gastos
-- ---------------------------------------------------------------------------
CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarjeta_id UUID NOT NULL REFERENCES tarjetas(id) ON DELETE CASCADE,
  descripcion TEXT NOT NULL,
  monto_total NUMERIC NOT NULL,
  cuotas_total INT NOT NULL,
  cuota_actual INT NOT NULL,
  fecha_primera_cuota DATE NOT NULL,
  monto_cuota NUMERIC NOT NULL,
  categoria TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: We include user_id on gastos for simpler RLS policies, avoiding joins.

-- Enable RLS for gastos
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own gastos
CREATE POLICY "Users can manage their own gastos"
  ON gastos
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Updated At Triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tarjetas_updated_at
  BEFORE UPDATE ON tarjetas
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_gastos_updated_at
  BEFORE UPDATE ON gastos
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
