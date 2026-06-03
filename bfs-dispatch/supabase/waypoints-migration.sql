-- ============================================================
-- Migration: Add waypoints JSONB column to routes
-- Stores intermediate stops for multi-pickup/multi-delivery routes.
-- Structure: [{sequence, location_id, type: "pickup"|"delivery", lat, lng}]
-- ============================================================

ALTER TABLE routes
  ADD COLUMN IF NOT EXISTS waypoints JSONB DEFAULT '[]';
