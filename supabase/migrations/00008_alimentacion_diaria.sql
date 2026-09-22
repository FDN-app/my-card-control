CREATE TABLE public.alimentacion_diaria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  menu SMALLINT NOT NULL DEFAULT 1 CHECK (menu BETWEEN 1 AND 3),
  comidas_completadas INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, fecha),
  CONSTRAINT comidas_validas CHECK (
    comidas_completadas <@ ARRAY[1, 2, 3, 4, 5]
  )
);

ALTER TABLE public.alimentacion_diaria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own alimentacion_diaria"
  ON public.alimentacion_diaria
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER set_alimentacion_diaria_updated_at
  BEFORE UPDATE ON public.alimentacion_diaria
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
