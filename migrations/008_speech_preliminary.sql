-- TADR-006: transcript-only speech results are marked `preliminary`,
-- distinct from `analyzed` (audio-backed pronunciation/tone). Add the value
-- to the speech_attempts.status check constraint.
ALTER TABLE speech_attempts
  DROP CONSTRAINT speech_attempts_status_check,
  ADD CONSTRAINT speech_attempts_status_check
    CHECK (status IN ('pending','preliminary','analyzed','failed'));
