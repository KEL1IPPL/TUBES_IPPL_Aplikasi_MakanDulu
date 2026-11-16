export const isValidName = (name: string) =>
  /^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(name.trim()) && name.trim().length >= 3;

export const isValidAddress = (address: string) =>
  address.trim().length >= 10 && /^[a-zA-Z0-9\s,.]+$/.test(address.trim());

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
  const domain = email.slice(atIndex + 1).toLowerCase();
  return (
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(username) &&
    !username.startsWith('.') &&
    !username.endsWith('.') &&
    !username.includes('..') &&
    /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)
  );
};
