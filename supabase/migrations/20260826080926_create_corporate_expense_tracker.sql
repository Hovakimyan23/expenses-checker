/*
# Corporate Expense Tracker — Multi-user schema with organizations, roles, approvals

Creates tables first, then applies RLS policies (so cross-table references resolve).
Tables: organizations, org_members, transactions, budgets.
All RLS-scoped through org membership with role-based access (admin/manager/employee).
*/

-- ============================================================
-- Step 1: Create all tables first (no policies yet)
-- ============================================================

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','manager','employee')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, user_id)
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  category text NOT NULL,
  type text NOT NULL CHECK (type IN ('income','expense')),
  date date NOT NULL,
  payment_method text NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','rejected')),
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category text NOT NULL,
  budget_limit numeric NOT NULL CHECK (budget_limit > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, category)
);

-- ============================================================
-- Step 2: Enable RLS on all tables
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Step 3: organizations policies
-- ============================================================

DROP POLICY IF EXISTS "select_orgs_as_member" ON organizations;
CREATE POLICY "select_orgs_as_member" ON organizations FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM org_members WHERE org_members.org_id = organizations.id AND org_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_org_as_creator" ON organizations;
CREATE POLICY "insert_org_as_creator" ON organizations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_own_org" ON organizations;
CREATE POLICY "update_own_org" ON organizations FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- ============================================================
-- Step 4: org_members policies
-- ============================================================

DROP POLICY IF EXISTS "select_members_in_my_org" ON org_members;
CREATE POLICY "select_members_in_my_org" ON org_members FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM org_members om WHERE om.org_id = org_members.org_id AND om.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_member_as_admin" ON org_members;
CREATE POLICY "insert_member_as_admin" ON org_members FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "update_members_as_admin" ON org_members;
CREATE POLICY "update_members_as_admin" ON org_members FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "delete_members_as_admin" ON org_members;
CREATE POLICY "delete_members_as_admin" ON org_members FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = org_members.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- ============================================================
-- Step 5: transactions policies
-- ============================================================

DROP POLICY IF EXISTS "select_tx_in_my_org" ON transactions;
CREATE POLICY "select_tx_in_my_org" ON transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM org_members WHERE org_members.org_id = transactions.org_id AND org_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_tx_in_my_org" ON transactions;
CREATE POLICY "insert_tx_in_my_org" ON transactions FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM org_members WHERE org_members.org_id = transactions.org_id AND org_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_tx_owner_or_manager" ON transactions;
CREATE POLICY "update_tx_owner_or_manager" ON transactions FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = user_id)
    OR
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = transactions.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin','manager')
    )
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM org_members WHERE org_members.org_id = transactions.org_id AND org_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_tx_owner_or_admin" ON transactions;
CREATE POLICY "delete_tx_owner_or_admin" ON transactions FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = transactions.org_id
        AND om.user_id = auth.uid()
        AND om.role = 'admin'
    )
  );

-- ============================================================
-- Step 6: budgets policies
-- ============================================================

DROP POLICY IF EXISTS "select_budgets_in_my_org" ON budgets;
CREATE POLICY "select_budgets_in_my_org" ON budgets FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM org_members WHERE org_members.org_id = budgets.org_id AND org_members.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_budgets_as_manager" ON budgets;
CREATE POLICY "insert_budgets_as_manager" ON budgets FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = budgets.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin','manager')
    )
  );

DROP POLICY IF EXISTS "update_budgets_as_manager" ON budgets;
CREATE POLICY "update_budgets_as_manager" ON budgets FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = budgets.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin','manager')
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = budgets.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin','manager')
    )
  );

DROP POLICY IF EXISTS "delete_budgets_as_manager" ON budgets;
CREATE POLICY "delete_budgets_as_manager" ON budgets FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.org_id = budgets.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('admin','manager')
    )
  );

-- ============================================================
-- Step 7: Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_org_id ON transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_budgets_org_id ON budgets(org_id);

-- ============================================================
-- Step 8: updated_at trigger for transactions
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_transactions_updated_at ON transactions;
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
