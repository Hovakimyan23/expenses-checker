/*
# Fix: Set search_path on update_updated_at function

Secures the trigger function by setting an explicit search_path, addressing
the security advisor warning about mutable search_path.
*/

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
DROP FUNCTION IF EXISTS update_updated_at();

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
