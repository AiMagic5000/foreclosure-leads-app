-- Migration 007: allow 'owner_operator' as a subscription_tier
-- The User Data tier dropdown offers "Owner Operator", but users_subscription_tier_check
-- only permitted free/single_state/multi_state, so the PATCH silently failed and the
-- dropdown reverted to Free. Align the constraint with the UI options.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;
ALTER TABLE users ADD CONSTRAINT users_subscription_tier_check
  CHECK (subscription_tier = ANY (ARRAY['free'::text, 'single_state'::text, 'multi_state'::text, 'owner_operator'::text]));
