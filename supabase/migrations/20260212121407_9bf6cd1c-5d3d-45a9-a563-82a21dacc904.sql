
-- Drop the old public policy
DROP POLICY IF EXISTS "Everyone can view active habits" ON public.habits;

-- Create new policy: only authenticated users can view active habits
CREATE POLICY "Authenticated users can view active habits"
ON public.habits
FOR SELECT
TO authenticated
USING (is_active = true);
