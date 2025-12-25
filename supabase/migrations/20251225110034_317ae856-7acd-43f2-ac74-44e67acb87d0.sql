-- Admin policies for managing all data

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage packages
CREATE POLICY "Admins can insert packages" ON public.packages
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update packages" ON public.packages
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete packages" ON public.packages
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all packages (including inactive)
CREATE POLICY "Admins can view all packages" ON public.packages
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage products
CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all products (including inactive)
CREATE POLICY "Admins can view all products" ON public.products
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all wallets
CREATE POLICY "Admins can view all wallets" ON public.wallets
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all wallets
CREATE POLICY "Admins can update all wallets" ON public.wallets
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions" ON public.transactions
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert transactions
CREATE POLICY "Admins can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can view all withdrawals
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all withdrawals
CREATE POLICY "Admins can update all withdrawals" ON public.withdrawals
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Admins can view all referrals
CREATE POLICY "Admins can view all referrals" ON public.referrals
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update referrals
CREATE POLICY "Admins can update all referrals" ON public.referrals
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Admins can manage user roles
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));