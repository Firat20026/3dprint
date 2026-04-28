-- Prevent duplicate (name, type) pairs in the materials table.
-- If existing data has duplicates the migration will fail; clean up
-- in production with:
--   SELECT name, type, COUNT(*) FROM "Material" GROUP BY name, type HAVING COUNT(*) > 1;
-- and merge / rename before applying.
CREATE UNIQUE INDEX "Material_name_type_key" ON "Material" ("name", "type");
