-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "nameRu" TEXT,
ADD COLUMN     "nameUz" TEXT,
ADD COLUMN     "tagline" TEXT,
ADD COLUMN     "taglineRu" TEXT,
ADD COLUMN     "taglineUz" TEXT;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "descriptionRu" TEXT,
ADD COLUMN     "descriptionUz" TEXT,
ADD COLUMN     "nameRu" TEXT,
ADD COLUMN     "nameUz" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "descriptionRu" TEXT,
ADD COLUMN     "descriptionUz" TEXT,
ADD COLUMN     "nameRu" TEXT,
ADD COLUMN     "nameUz" TEXT,
ADD COLUMN     "shortDescriptionRu" TEXT,
ADD COLUMN     "shortDescriptionUz" TEXT;

-- AlterTable
ALTER TABLE "ProductSpec" ADD COLUMN     "groupRu" TEXT,
ADD COLUMN     "groupUz" TEXT,
ADD COLUMN     "labelRu" TEXT,
ADD COLUMN     "labelUz" TEXT,
ADD COLUMN     "valueRu" TEXT,
ADD COLUMN     "valueUz" TEXT;

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "nameRu" TEXT,
ADD COLUMN     "nameUz" TEXT,
ADD COLUMN     "valueRu" TEXT,
ADD COLUMN     "valueUz" TEXT;

-- CreateIndex
CREATE INDEX "Brand_nameRu_idx" ON "Brand" USING GIN ("nameRu" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Brand_nameUz_idx" ON "Brand" USING GIN ("nameUz" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Category_nameRu_idx" ON "Category" USING GIN ("nameRu" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Category_nameUz_idx" ON "Category" USING GIN ("nameUz" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Product_nameRu_idx" ON "Product" USING GIN ("nameRu" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Product_nameUz_idx" ON "Product" USING GIN ("nameUz" gin_trgm_ops);

-- Search support -------------------------------------------------------------

-- Diacritics are folded on both sides of a search, so «oʻzbek» and «ozbek» are
-- the same query, and so is «café» against «cafe».
CREATE EXTENSION IF NOT EXISTS unaccent;

-- The built-in `unaccent(text)` is STABLE rather than IMMUTABLE, because it
-- resolves its dictionary from the search path at call time, and Postgres will
-- not build an index over a non-immutable expression. This wrapper names the
-- dictionary explicitly, which makes the result depend only on the argument,
-- so it is honest to mark IMMUTABLE and safe to index.
CREATE OR REPLACE FUNCTION ziyo_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;

-- Full-text indexes, one per language, over the text the search reads. The
-- language configuration is what gives the query stemming: «рубашки» finds
-- «рубашка» through the Russian dictionary. Uzbek Latin has no stemming
-- configuration in stock Postgres, so it uses `simple`, which tokenizes and
-- lowercases without trying to reduce words to a root — better than the wrong
-- stemmer, which would silently rewrite Uzbek words into English ones.
CREATE INDEX "Product_search_en_idx" ON "Product" USING GIN (
  to_tsvector('english', ziyo_unaccent(
    coalesce("name", '') || ' ' || coalesce("shortDescription", '') || ' ' || coalesce("description", '')
  ))
);

CREATE INDEX "Product_search_ru_idx" ON "Product" USING GIN (
  to_tsvector('russian', ziyo_unaccent(
    coalesce("nameRu", '') || ' ' || coalesce("shortDescriptionRu", '') || ' ' || coalesce("descriptionRu", '')
  ))
);

CREATE INDEX "Product_search_uz_idx" ON "Product" USING GIN (
  to_tsvector('simple', ziyo_unaccent(
    coalesce("nameUz", '') || ' ' || coalesce("shortDescriptionUz", '') || ' ' || coalesce("descriptionUz", '')
  ))
);
