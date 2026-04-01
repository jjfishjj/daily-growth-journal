
-- Add status column to guanxin_leaves
ALTER TABLE public.guanxin_leaves 
ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Add admin_note column for approval/rejection notes
ALTER TABLE public.guanxin_leaves 
ADD COLUMN admin_note text;

-- Add reviewed_at timestamp
ALTER TABLE public.guanxin_leaves 
ADD COLUMN reviewed_at timestamp with time zone;

-- Allow admins to update guanxin_leaves (for approval)
CREATE POLICY "Admins can update guanxin leaves"
ON public.guanxin_leaves
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
