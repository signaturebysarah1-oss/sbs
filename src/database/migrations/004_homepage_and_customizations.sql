-- Homepage content and reusable custom-order catalogue.

ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20) NULL,
  ADD CONSTRAINT products_gender_check CHECK (gender IS NULL OR gender IN ('male', 'female', 'unisex'));

CREATE TABLE IF NOT EXISTS homepage_carousel_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL,
  image_public_id VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customization_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customization_categories_status_check CHECK (status IN ('active', 'inactive'))
);

CREATE TABLE IF NOT EXISTS customization_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES customization_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  image_url TEXT NULL,
  image_public_id VARCHAR(255) NULL,
  description TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customization_options_status_check CHECK (status IN ('active', 'inactive')),
  CONSTRAINT customization_options_category_slug_unique UNIQUE (category_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_collections_featured ON collections(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_carousel_active_sort ON homepage_carousel_items(is_active, sort_order);
CREATE INDEX IF NOT EXISTS idx_customization_categories_status_sort ON customization_categories(status, sort_order);
CREATE INDEX IF NOT EXISTS idx_customization_options_category_status_sort ON customization_options(category_id, status, sort_order);

DROP TRIGGER IF EXISTS trg_homepage_carousel_items_updated_at ON homepage_carousel_items;
CREATE TRIGGER trg_homepage_carousel_items_updated_at BEFORE UPDATE ON homepage_carousel_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_customization_categories_updated_at ON customization_categories;
CREATE TRIGGER trg_customization_categories_updated_at BEFORE UPDATE ON customization_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_customization_options_updated_at ON customization_options;
CREATE TRIGGER trg_customization_options_updated_at BEFORE UPDATE ON customization_options
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO customization_categories (name, slug, sort_order)
VALUES ('Shoe Types', 'shoe-types', 0), ('Materials', 'materials', 1), ('Soles', 'soles', 2), ('Colours', 'colours', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO customization_options (category_id, name, slug, sort_order)
SELECT c.id, v.name, v.slug, v.sort_order
FROM customization_categories c
JOIN (VALUES
  ('Oxford', 'oxford', 0), ('Derby', 'derby', 1), ('Monk Strap', 'monk-strap', 2),
  ('Loafer', 'loafer', 3), ('Wingtip Brogue', 'wingtip-brogue', 4), ('Penny Loafer', 'penny-loafer', 5),
  ('Chelsea Boot', 'chelsea-boot', 6), ('Canvas Shoe', 'canvas-shoe', 7), ('Chukka Boot', 'chukka-boot', 8),
  ('Sandal', 'sandal', 9), ('Slide', 'slide', 10), ('Flip Flop', 'flip-flop', 11), ('Clog', 'clog', 12),
  ('Cross Belt', 'cross-belt', 13), ('Closed-Toe Mules / Half Shoe', 'closed-toe-mules-half-shoe', 14),
  ('Backless Loafers', 'backless-loafers', 15)
) AS v(name, slug, sort_order) ON c.slug = 'shoe-types'
ON CONFLICT (category_id, slug) DO NOTHING;
