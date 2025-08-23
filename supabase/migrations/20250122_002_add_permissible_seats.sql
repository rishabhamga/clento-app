-- Add permissible_seats column to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS permissible_seats INTEGER DEFAULT 5 NOT NULL;

-- Add a check constraint to ensure permissible_seats is positive
ALTER TABLE public.organizations 
ADD CONSTRAINT check_permissible_seats_positive 
CHECK (permissible_seats > 0);

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_organizations_permissible_seats 
ON public.organizations(permissible_seats);

-- Update existing organizations to have a default of 5 seats
UPDATE public.organizations 
SET permissible_seats = 5 
WHERE permissible_seats IS NULL;
