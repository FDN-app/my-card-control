CREATE TABLE metas_diarias (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha        DATE NOT NULL,

  uber_horas        NUMERIC,
  uber_facturacion  NUMERIC,
  uber_realizado    BOOLEAN NOT NULL DEFAULT FALSE,

  gym_horas         NUMERIC,
  gym_tipo          TEXT,
  gym_realizado     BOOLEAN NOT NULL DEFAULT FALSE,

  estudio_horas     NUMERIC,
  estudio_tema      TEXT,
  estudio_realizado BOOLEAN NOT NULL DEFAULT FALSE,

  energia           INT CHECK (energia BETWEEN 1 AND 10),
  notas             TEXT,

  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, fecha)
);

ALTER TABLE metas_diarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own metas_diarias"
  ON metas_diarias FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
