const buyerFields = ['name', 'email', 'password', 'phone', 'address'];
const sellerFields = [
  'ownerName',
  'storeName',
  'email',
  'password',
  'phone',
  'storeAddress',
  'nib',
  'ktp',
  'npwp',
];

const isValidIndonesianPhoneNumber = (phone) =>
  /^(?:08|628)[1-9][0-9]{7,10}$/.test(phone);

const isValidEmail = (email) => {
  if (typeof email !== 'string' || email.length === 0 || /\s/.test(email)) {
    return false;
  }

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

const hasRequiredStringFields = (data, fields, trimPassword) =>
  fields.every(
    (field) =>
      typeof data[field] === 'string' &&
      (field === 'password' && !trimPassword
        ? data[field]
        : data[field].trim())
  );

const validateBuyerRegistration = (data) =>
  hasRequiredStringFields(data, buyerFields, false) &&
  isValidEmail(data.email) &&
  isValidIndonesianPhoneNumber(data.phone);

const validateSellerRegistration = (data) =>
  hasRequiredStringFields(data, sellerFields, true) &&
  isValidEmail(data.email) &&
  isValidIndonesianPhoneNumber(data.phone) &&
  /^\d{13}$/.test(data.nib) &&
  /^\d{16}$/.test(data.ktp) &&
  /^\d{21}$/.test(data.npwp);

module.exports = {
  validateBuyerRegistration,
  validateSellerRegistration,
  isValidIndonesianPhoneNumber,
  isValidEmail,
};
