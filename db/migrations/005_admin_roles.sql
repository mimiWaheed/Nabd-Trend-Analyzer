-- NABD — add admin role system
-- Set default role to 'analyst' for all users without a role
-- Set bizzlingmari@gmail.com as superadmin

UPDATE users SET role = 'analyst' WHERE role IS NULL OR role = '';

UPDATE users SET role = 'superadmin' WHERE lower(email) = lower('bizzlingmari@gmail.com');
