-- ============================================================================
-- autobladi.ma — seed data
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
insert into public.categories (name_ar, name_fr, slug, icon, order_index) values
  ('سيارة مدينة',    'Citadine',   'citadine',   'car',         1),
  ('صالون',          'Berline',    'berline',    'car-front',   2),
  ('دفع رباعي خفيف', 'SUV',        'suv',        'truck',       3),
  ('دفع رباعي',      '4x4',        '4x4',        'mountain',    4),
  ('بريك',           'Break',      'break',      'caravan',     5),
  ('كوبيه',          'Coupé',      'coupe',      'car-sport',   6),
  ('مكشوفة',         'Cabriolet',  'cabriolet',  'sun',         7),
  ('نفعية',          'Utilitaire', 'utilitaire', 'truck-pickup',8);

-- ---------------------------------------------------------------------------
-- Cities
-- ---------------------------------------------------------------------------
insert into public.cities (name_ar, name_fr, slug, region) values
  ('الدار البيضاء', 'Casablanca', 'casablanca', 'Casablanca-Settat'),
  ('الرباط',        'Rabat',      'rabat',      'Rabat-Salé-Kénitra'),
  ('مراكش',         'Marrakech',  'marrakech',  'Marrakech-Safi'),
  ('فاس',           'Fès',        'fes',        'Fès-Meknès'),
  ('طنجة',          'Tanger',     'tanger',     'Tanger-Tétouan-Al Hoceïma'),
  ('أكادير',        'Agadir',     'agadir',     'Souss-Massa'),
  ('مكناس',         'Meknès',     'meknes',     'Fès-Meknès'),
  ('وجدة',          'Oujda',      'oujda',      'Oriental'),
  ('القنيطرة',      'Kenitra',    'kenitra',    'Rabat-Salé-Kénitra'),
  ('تطوان',         'Tétouan',    'tetouan',    'Tanger-Tétouan-Al Hoceïma'),
  ('سلا',           'Salé',       'sale',       'Rabat-Salé-Kénitra'),
  ('الناظور',       'Nador',      'nador',      'Oriental');

-- ---------------------------------------------------------------------------
-- Brands
-- ---------------------------------------------------------------------------
insert into public.brands (name, slug, order_index) values
  ('Dacia',       'dacia',       1),
  ('Renault',     'renault',     2),
  ('Peugeot',     'peugeot',     3),
  ('Toyota',      'toyota',      4),
  ('Hyundai',     'hyundai',     5),
  ('BMW',         'bmw',         6),
  ('Mercedes',    'mercedes',    7),
  ('Audi',        'audi',        8),
  ('Volkswagen',  'volkswagen',  9),
  ('Kia',         'kia',        10),
  ('Ford',        'ford',       11),
  ('Citroen',     'citroen',    12),
  ('Fiat',        'fiat',       13),
  ('Nissan',      'nissan',     14),
  ('Skoda',       'skoda',      15),
  ('Seat',        'seat',       16),
  ('Opel',        'opel',       17),
  ('Mazda',       'mazda',      18),
  ('Honda',       'honda',      19),
  ('Suzuki',      'suzuki',     20);

-- ---------------------------------------------------------------------------
-- Car models
-- ---------------------------------------------------------------------------
with b as (select id, slug from public.brands)
insert into public.car_models (brand_id, name, slug)
select b.id, m.name, m.slug from b
join (values
  -- Dacia
  ('dacia', 'Logan',          'logan'),
  ('dacia', 'Sandero',        'sandero'),
  ('dacia', 'Duster',         'duster'),
  ('dacia', 'Lodgy',          'lodgy'),
  ('dacia', 'Dokker',         'dokker'),
  ('dacia', 'Stepway',        'stepway'),
  -- Renault
  ('renault', 'Clio',         'clio'),
  ('renault', 'Megane',       'megane'),
  ('renault', 'Captur',       'captur'),
  ('renault', 'Kadjar',       'kadjar'),
  ('renault', 'Kangoo',       'kangoo'),
  ('renault', 'Symbol',       'symbol'),
  ('renault', 'Twingo',       'twingo'),
  -- Peugeot
  ('peugeot', '208',          '208'),
  ('peugeot', '308',          '308'),
  ('peugeot', '2008',         '2008'),
  ('peugeot', '3008',         '3008'),
  ('peugeot', '5008',         '5008'),
  ('peugeot', '508',          '508'),
  ('peugeot', 'Partner',      'partner'),
  -- Toyota
  ('toyota', 'Yaris',         'yaris'),
  ('toyota', 'Corolla',       'corolla'),
  ('toyota', 'RAV4',          'rav4'),
  ('toyota', 'Hilux',         'hilux'),
  ('toyota', 'Land Cruiser',  'land-cruiser'),
  ('toyota', 'Camry',         'camry'),
  ('toyota', 'C-HR',          'c-hr'),
  -- Hyundai
  ('hyundai', 'i10',          'i10'),
  ('hyundai', 'i20',          'i20'),
  ('hyundai', 'i30',          'i30'),
  ('hyundai', 'Tucson',       'tucson'),
  ('hyundai', 'Santa Fe',     'santa-fe'),
  ('hyundai', 'Accent',       'accent'),
  ('hyundai', 'Elantra',      'elantra'),
  -- BMW
  ('bmw', 'Serie 1',          'serie-1'),
  ('bmw', 'Serie 3',          'serie-3'),
  ('bmw', 'Serie 5',          'serie-5'),
  ('bmw', 'X1',               'x1'),
  ('bmw', 'X3',               'x3'),
  ('bmw', 'X5',               'x5'),
  ('bmw', 'X6',               'x6'),
  -- Mercedes
  ('mercedes', 'Classe A',    'classe-a'),
  ('mercedes', 'Classe C',    'classe-c'),
  ('mercedes', 'Classe E',    'classe-e'),
  ('mercedes', 'Classe S',    'classe-s'),
  ('mercedes', 'GLA',         'gla'),
  ('mercedes', 'GLC',         'glc'),
  ('mercedes', 'GLE',         'gle'),
  -- Audi
  ('audi', 'A1',              'a1'),
  ('audi', 'A3',              'a3'),
  ('audi', 'A4',              'a4'),
  ('audi', 'A5',              'a5'),
  ('audi', 'A6',              'a6'),
  ('audi', 'Q3',              'q3'),
  ('audi', 'Q5',              'q5'),
  ('audi', 'Q7',              'q7'),
  -- Volkswagen
  ('volkswagen', 'Golf',      'golf'),
  ('volkswagen', 'Polo',      'polo'),
  ('volkswagen', 'Passat',    'passat'),
  ('volkswagen', 'Tiguan',    'tiguan'),
  ('volkswagen', 'Touareg',   'touareg'),
  ('volkswagen', 'Jetta',     'jetta'),
  ('volkswagen', 'T-Roc',     't-roc'),
  -- Kia
  ('kia', 'Picanto',          'picanto'),
  ('kia', 'Rio',              'rio'),
  ('kia', 'Cerato',           'cerato'),
  ('kia', 'Sportage',         'sportage'),
  ('kia', 'Sorento',          'sorento'),
  ('kia', 'Stonic',           'stonic'),
  ('kia', 'Niro',             'niro'),
  -- Ford
  ('ford', 'Fiesta',          'fiesta'),
  ('ford', 'Focus',           'focus'),
  ('ford', 'Kuga',            'kuga'),
  ('ford', 'EcoSport',        'ecosport'),
  ('ford', 'Ranger',          'ranger'),
  ('ford', 'Mondeo',          'mondeo'),
  ('ford', 'Mustang',         'mustang'),
  -- Citroen
  ('citroen', 'C3',           'c3'),
  ('citroen', 'C4',           'c4'),
  ('citroen', 'C5 Aircross',  'c5-aircross'),
  ('citroen', 'Berlingo',     'berlingo'),
  ('citroen', 'C-Elysée',     'c-elysee'),
  ('citroen', 'DS3',          'ds3'),
  ('citroen', 'DS7',          'ds7'),
  -- Fiat
  ('fiat', '500',             '500'),
  ('fiat', 'Panda',           'panda'),
  ('fiat', 'Punto',           'punto'),
  ('fiat', 'Tipo',            'tipo'),
  ('fiat', 'Doblo',           'doblo'),
  ('fiat', '500X',            '500x'),
  ('fiat', '500L',            '500l'),
  -- Nissan
  ('nissan', 'Micra',         'micra'),
  ('nissan', 'Juke',          'juke'),
  ('nissan', 'Qashqai',       'qashqai'),
  ('nissan', 'X-Trail',       'x-trail'),
  ('nissan', 'Navara',        'navara'),
  ('nissan', 'Patrol',        'patrol'),
  ('nissan', 'Sunny',         'sunny'),
  -- Skoda
  ('skoda', 'Fabia',          'fabia'),
  ('skoda', 'Octavia',        'octavia'),
  ('skoda', 'Superb',         'superb'),
  ('skoda', 'Kodiaq',         'kodiaq'),
  ('skoda', 'Karoq',          'karoq'),
  ('skoda', 'Rapid',          'rapid'),
  ('skoda', 'Scala',          'scala'),
  -- Seat
  ('seat', 'Ibiza',           'ibiza'),
  ('seat', 'Leon',            'leon'),
  ('seat', 'Arona',           'arona'),
  ('seat', 'Ateca',           'ateca'),
  ('seat', 'Tarraco',         'tarraco'),
  ('seat', 'Toledo',          'toledo'),
  ('seat', 'Alhambra',        'alhambra'),
  -- Opel
  ('opel', 'Corsa',           'corsa'),
  ('opel', 'Astra',           'astra'),
  ('opel', 'Insignia',        'insignia'),
  ('opel', 'Mokka',           'mokka'),
  ('opel', 'Crossland',       'crossland'),
  ('opel', 'Grandland',       'grandland'),
  ('opel', 'Zafira',          'zafira'),
  -- Mazda
  ('mazda', 'Mazda 2',        'mazda-2'),
  ('mazda', 'Mazda 3',        'mazda-3'),
  ('mazda', 'Mazda 6',        'mazda-6'),
  ('mazda', 'CX-3',           'cx-3'),
  ('mazda', 'CX-5',           'cx-5'),
  ('mazda', 'CX-30',          'cx-30'),
  ('mazda', 'MX-5',           'mx-5'),
  -- Honda
  ('honda', 'Jazz',           'jazz'),
  ('honda', 'Civic',          'civic'),
  ('honda', 'Accord',         'accord'),
  ('honda', 'CR-V',           'cr-v'),
  ('honda', 'HR-V',           'hr-v'),
  ('honda', 'City',           'city'),
  ('honda', 'Pilot',          'pilot'),
  -- Suzuki
  ('suzuki', 'Swift',         'swift'),
  ('suzuki', 'Vitara',        'vitara'),
  ('suzuki', 'Jimny',         'jimny'),
  ('suzuki', 'Baleno',        'baleno'),
  ('suzuki', 'Ignis',         'ignis'),
  ('suzuki', 'S-Cross',       's-cross'),
  ('suzuki', 'Celerio',       'celerio')
) as m(brand_slug, name, slug) on b.slug = m.brand_slug;

-- ---------------------------------------------------------------------------
-- Ad placements
-- ---------------------------------------------------------------------------
insert into public.ad_placements (name, slug, width, height, description) values
  ('Home — Top banner',     'home_top',          970, 250, 'Bannière en haut de la page d''accueil'),
  ('Home — Middle banner',  'home_middle',       970, 250, 'Bannière au milieu de la page d''accueil'),
  ('Listings — Sidebar',    'listings_sidebar',  300, 600, 'Encart latéral sur la page des annonces'),
  ('Annonce detail',        'annonce_detail',    728,  90, 'Bannière sur la page de détail d''une annonce'),
  ('Footer banner',         'footer',            970, 120, 'Bannière en pied de page (toutes pages)');

-- ---------------------------------------------------------------------------
-- Default site settings
-- ---------------------------------------------------------------------------
insert into public.site_settings (key, value) values
  ('watermark_text',         '"autobladi.ma"'::jsonb),
  ('rib',                    '""'::jsonb),
  ('annonce_duration_days',  '60'::jsonb),
  ('annonce_duration_days_pro', '90'::jsonb),
  ('free_max_annonces',      '3'::jsonb),
  ('seo_default',            '{"title":"autobladi.ma — Annonces voitures au Maroc","description":"Achetez et vendez votre voiture au Maroc sur autobladi.ma","og_image":"/images/og-default.jpg"}'::jsonb),
  ('contact_email',          '"contact@autobladi.ma"'::jsonb),
  ('contact_phone',          '""'::jsonb),
  ('social_links',           '{"facebook":"","instagram":"","youtube":"","tiktok":""}'::jsonb);
