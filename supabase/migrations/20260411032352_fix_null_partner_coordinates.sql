/*
  # Fix NULL GPS Coordinates for Existing Partners

  ## Problem
  Partners who set up their profiles before GPS coordinate capture was implemented
  have service_areas entries but NULL values for service_areas_center_lat and
  service_areas_center_lng. These partners show "Distance unknown" in browse results
  and are excluded from distance-based filtering.

  ## Fix
  For each partner profile where:
  - is_partner = true
  - service_areas_center_lat IS NULL
  - service_areas has at least one entry with lat/lng coordinates

  Extract the first service area that has valid lat/lng coordinates and populate
  service_areas_center_lat and service_areas_center_lng from it.

  ## Notes
  - Only updates rows where coordinates are currently NULL
  - Only uses coordinate data already stored in the service_areas JSONB column
  - Partners with only manually-entered (no-coordinate) service areas remain NULL
    and will need to re-save their profile with a map-verified location
  - Safe to re-run; WHERE clause prevents double-updates
*/

UPDATE profiles
SET
  service_areas_center_lat = (
    SELECT (area->>'lat')::numeric
    FROM jsonb_array_elements(service_areas) AS area
    WHERE (area->>'lat') IS NOT NULL
      AND (area->>'lat') != 'null'
      AND (area->>'lng') IS NOT NULL
      AND (area->>'lng') != 'null'
    LIMIT 1
  ),
  service_areas_center_lng = (
    SELECT (area->>'lng')::numeric
    FROM jsonb_array_elements(service_areas) AS area
    WHERE (area->>'lat') IS NOT NULL
      AND (area->>'lat') != 'null'
      AND (area->>'lng') IS NOT NULL
      AND (area->>'lng') != 'null'
    LIMIT 1
  )
WHERE
  is_partner = true
  AND service_areas_center_lat IS NULL
  AND service_areas IS NOT NULL
  AND jsonb_array_length(service_areas) > 0
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(service_areas) AS area
    WHERE (area->>'lat') IS NOT NULL
      AND (area->>'lat') != 'null'
  );
