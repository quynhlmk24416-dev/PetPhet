-- =========================================================================
-- PET PHẾT – ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_schedules ENABLE ROW LEVEL SECURITY;

-- Helper function to check if requesting user is Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. USERS POLICIES
-- Customers can only read and update their own profile; cannot alter their role.
CREATE POLICY "Users view own profile or admin all"
ON users FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users update own profile"
ON users FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND role = (SELECT role FROM users WHERE user_id = auth.uid()) -- Prevents escalating to admin
);

-- 2. PETS POLICIES
-- Customer can only view, insert, update pets belonging to their own user_id. Admin can view all.
CREATE POLICY "View pets"
ON pets FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Insert pets"
ON pets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own pets"
ON pets FOR UPDATE
USING (auth.uid() = user_id OR is_admin())
WITH CHECK (auth.uid() = user_id OR is_admin());

-- 3. BOOKINGS POLICIES
-- Customer only sees their bookings; Admin sees all
CREATE POLICY "View bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Create booking"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customer reschedule or cancel own booking"
ON bookings FOR UPDATE
USING (auth.uid() = user_id OR is_admin());

-- 4. PAYMENTS POLICIES
-- Customers only view payment records tied to their bookings. Admin can update and reconcile.
CREATE POLICY "View payments"
ON payments FOR SELECT
USING (
  EXISTS (SELECT 1 FROM bookings b WHERE b.booking_id = payments.booking_id AND b.user_id = auth.uid())
  OR is_admin()
);

CREATE POLICY "Admin manage payments"
ON payments FOR ALL
USING (is_admin());

-- 5. REVIEWS POLICIES
-- Anyone can read reviews; Customers can only write a review for their own completed booking.
CREATE POLICY "Public read reviews"
ON reviews FOR SELECT
USING (TRUE);

CREATE POLICY "Customer create review"
ON reviews FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.booking_id = reviews.booking_id 
      AND bookings.user_id = auth.uid() 
      AND bookings.status = 'completed'
  )
);

CREATE POLICY "Customer update own review"
ON reviews FOR UPDATE
USING (auth.uid() = user_id OR is_admin());

-- 6. SERVICES & CATEGORIES (Public read, admin write)
CREATE POLICY "Public read active services"
ON services FOR SELECT
USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admin write services"
ON services FOR ALL
USING (is_admin());

CREATE POLICY "Public read categories"
ON service_categories FOR SELECT
USING (is_active = TRUE OR is_admin());

-- 7. PET POINTS
CREATE POLICY "View own pet points"
ON pet_point_transactions FOR SELECT
USING (auth.uid() = user_id OR is_admin());
