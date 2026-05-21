-- Team invite / enterprise intent columns on assessment sessions
ALTER TABLE public.ai_level_assessments
  ADD COLUMN IF NOT EXISTS custom_offering_interest boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enterprise_interest boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enterprise_team_size text,
  ADD COLUMN IF NOT EXISTS enterprise_goal text,
  ADD COLUMN IF NOT EXISTS enterprise_company text,
  ADD COLUMN IF NOT EXISTS enterprise_phone text;
