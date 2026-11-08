export const isValidIndonesianPhoneNumber = (phone: string) =>
  /^(?:08|628)[1-9][0-9]{7,10}$/.test(phone);

export const isValidEmail = (email: string) => {
  if (!email || /\s/.test(email)) return false;

  const atIndex = email.indexOf('@');
  if (
    atIndex <= 0 ||
    atIndex !== email.lastIndexOf('@') ||
    atIndex === email.length - 1
  ) {
    return false;
  }

  const username = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  return (
    !username.includes('..') &&
    domain.includes('.') &&
    !domain.includes('..') &&
    !domain.startsWith('.') &&
    !domain.endsWith('.') &&
    domain.slice(domain.lastIndexOf('.') + 1).length > 0
  );
};
