CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL CHECK (language IN ('en','zh-CN')),
  code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  version integer NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','retired')),
  published_at timestamptz,
  content_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, version)
);

CREATE TABLE IF NOT EXISTS units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_version_id uuid NOT NULL REFERENCES course_versions(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  level integer NOT NULL CHECK (level BETWEEN 1 AND 7),
  outcomes_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (course_version_id, sequence)
);

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  type text NOT NULL CHECK (type IN ('listening','reading','speaking','review','vocabulary','grammar')),
  estimated_minutes integer NOT NULL DEFAULT 10 CHECK (estimated_minutes BETWEEN 1 AND 60),
  schema_version integer NOT NULL DEFAULT 1,
  content_json jsonb NOT NULL,
  UNIQUE (unit_id, sequence)
);

CREATE TABLE IF NOT EXISTS exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  sequence integer NOT NULL,
  type text NOT NULL,
  prompt_json jsonb NOT NULL,
  answer_key_ref text,
  rubric_id uuid,
  UNIQUE (lesson_id, sequence)
);

CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  language text NOT NULL CHECK (language IN ('en','zh-CN')),
  code text NOT NULL,
  modality text NOT NULL CHECK (modality IN ('listening','reading','speaking','vocabulary','grammar')),
  parent_id uuid REFERENCES skills(id) ON DELETE SET NULL,
  prerequisite_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (language, code)
);

CREATE TABLE IF NOT EXISTS exercise_skills (
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  weight numeric NOT NULL DEFAULT 1 CHECK (weight BETWEEN 0 AND 1),
  PRIMARY KEY (exercise_id, skill_id)
);

CREATE TABLE IF NOT EXISTS rubrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  version integer NOT NULL DEFAULT 1,
  dimensions_json jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','retired')),
  created_at timestamptz NOT NULL DEFAULT now()
);
