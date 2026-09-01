UPDATE "fisherfolk" SET "status" = 'NEW' WHERE "status" = 'ACTIVE';
UPDATE "fisherfolk" SET "status" = 'EXPIRED' WHERE "status" = 'INACTIVE';
-- (ARCHIVED, RENEWED left untouched)
