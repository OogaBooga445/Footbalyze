function validatePassword(password, field = 'password') {
  if (password.length < 8)
    return { field, message: 'Password must be at least 8 characters.' };
  if (password.length > 72)
    return { field, message: 'Password must be 72 characters or fewer.' };
  if (!/[A-Z]/.test(password))
    return { field, message: 'Password must contain at least one uppercase letter.' };
  if (!/[0-9]/.test(password))
    return { field, message: 'Password must contain at least one number.' };
  return null;
}

module.exports = { validatePassword };
