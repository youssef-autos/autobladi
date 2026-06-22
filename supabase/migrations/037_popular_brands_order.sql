-- Set order_index for the most popular brands in Morocco (shown on homepage)
-- Lower order_index = shown first in the homepage grid

UPDATE public.brands SET order_index = 1  WHERE slug = 'dacia';
UPDATE public.brands SET order_index = 2  WHERE slug = 'renault';
UPDATE public.brands SET order_index = 3  WHERE slug = 'peugeot';
UPDATE public.brands SET order_index = 4  WHERE slug = 'hyundai';
UPDATE public.brands SET order_index = 5  WHERE slug = 'volkswagen';
UPDATE public.brands SET order_index = 6  WHERE slug = 'citroen';
UPDATE public.brands SET order_index = 7  WHERE slug = 'toyota';
UPDATE public.brands SET order_index = 8  WHERE slug = 'mercedes-benz';
UPDATE public.brands SET order_index = 9  WHERE slug = 'kia';
UPDATE public.brands SET order_index = 10 WHERE slug = 'fiat';
UPDATE public.brands SET order_index = 11 WHERE slug = 'ford';
UPDATE public.brands SET order_index = 12 WHERE slug = 'bmw';

-- Push all other brands after the popular ones
UPDATE public.brands SET order_index = 100 + order_index
WHERE slug NOT IN (
  'dacia','renault','peugeot','hyundai','volkswagen','citroen',
  'toyota','mercedes-benz','kia','fiat','ford','bmw'
);
