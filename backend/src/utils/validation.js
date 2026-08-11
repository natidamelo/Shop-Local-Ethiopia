// Server-side input validation utilities for real data enforcement

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'test.com', 'example.com', 'foo.com', 'bar.com', 'asdf.com', 'fake.com',
  'tempmail.com', '10minutemail.com', 'mailinator.com', 'yopmail.com',
  'dispostable.com', 'trashmail.com', 'sharklasers.com'
]);

const DUMMY_NAME_PATTERNS = [
  'asdf', 'qwerty', 'zxcv', 'qwert', 'test', 'fake', 'dummy',
  'null', 'undefined', 'user', 'admin', 'name', 'first', 'last',
  'xxxx', 'aaaa', 'zzzz', 'abcd', '1234'
];

function validateEmail(email) {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email address format' };
  }

  const parts = trimmed.split('@');
  const localPart = parts[0];
  const domain = parts[1];

  if (localPart.length < 2) {
    return { isValid: false, error: 'Email username is too short' };
  }

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { isValid: false, error: 'Disposable or test email domains are not allowed' };
  }

  if (DUMMY_NAME_PATTERNS.some((pat) => localPart === pat || domain.startsWith(pat))) {
    return { isValid: false, error: 'Please provide a valid email address' };
  }

  return { isValid: true };
}

function validateName(name, fieldLabel = 'Name') {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    return { isValid: false, error: `${fieldLabel} is required` };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: `${fieldLabel} must be at least 2 characters` };
  }

  if (trimmed.length > 50) {
    return { isValid: false, error: `${fieldLabel} must be under 50 characters` };
  }

  const nameRegex = /^[a-zA-Z\u1200-\u137F\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: `${fieldLabel} must contain valid letters only (no numbers)` };
  }

  const lower = trimmed.toLowerCase();

  if (/(.)\1{3,}/.test(lower)) {
    return { isValid: false, error: `Please enter a valid ${fieldLabel.toLowerCase()}` };
  }

  if (DUMMY_NAME_PATTERNS.some((pat) => lower === pat || lower.includes('asdf') || lower.includes('qwerty'))) {
    return { isValid: false, error: `Please enter a real ${fieldLabel.toLowerCase()}` };
  }

  return { isValid: true };
}

function validatePhone(phone, country) {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Phone number is required' };
  }

  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number must be between 7 and 15 digits' };
  }

  if (/^(\d)\1+$/.test(digitsOnly)) {
    return { isValid: false, error: 'Please enter a valid non-repetitive phone number' };
  }

  if (/(.)\1{4,}/.test(digitsOnly)) {
    return { isValid: false, error: 'Phone number contains too many repeated digits' };
  }

  if ('1234567890987654321'.includes(digitsOnly)) {
    return { isValid: false, error: 'Please enter a real phone number' };
  }

  const isEthiopia = country === 'Ethiopia' || trimmed.startsWith('+251') || digitsOnly.startsWith('251');
  if (isEthiopia) {
    let localDigits = digitsOnly;
    if (localDigits.startsWith('251')) {
      localDigits = localDigits.slice(3);
    }
    if (localDigits.startsWith('0')) {
      localDigits = localDigits.slice(1);
    }

    if (localDigits.length !== 9) {
      return { isValid: false, error: 'Ethiopian mobile number must be 9 digits (e.g. 911234567)' };
    }

    if (!localDigits.startsWith('9') && !localDigits.startsWith('7')) {
      return { isValid: false, error: 'Ethiopian mobile numbers start with 9 or 7' };
    }
  }

  return { isValid: true };
}

function validateStreet(street) {
  const trimmed = (street || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Street address is required' };
  }

  if (trimmed.length < 5) {
    return { isValid: false, error: 'Street address must be at least 5 characters long' };
  }

  const lower = trimmed.toLowerCase();
  const DUMMY_STREETS = ['addis', 'china', 'street', 'address', 'test', 'asdf', '12345', 'house', 'home', 'road', 'none', 'n/a'];
  if (DUMMY_STREETS.includes(lower)) {
    return { isValid: false, error: 'Please provide a complete street address' };
  }

  const hasSpace = /\s/.test(trimmed);
  const hasDigitsAndLetters = /\d/.test(trimmed) && /[a-zA-Z\u1200-\u137F]/.test(trimmed);

  if (!hasSpace && !hasDigitsAndLetters) {
    return { isValid: false, error: 'Please enter a complete street address with building number or street name' };
  }

  return { isValid: true };
}

function validateCity(city, country) {
  const trimmed = (city || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'City is required' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'City name must be at least 2 characters' };
  }

  const cityRegex = /^[a-zA-Z\u1200-\u137F\s'-]+$/;
  if (!cityRegex.test(trimmed)) {
    return { isValid: false, error: 'City must contain valid letters only' };
  }

  const lower = trimmed.toLowerCase();
  if (country && lower === country.toLowerCase().trim()) {
    return { isValid: false, error: `City name cannot be identical to country name (${country})` };
  }

  const DUMMY_CITIES = ['test', 'city', 'asdf', 'qwerty', 'xxx', 'na', 'n/a', 'none', '123'];
  if (DUMMY_CITIES.includes(lower)) {
    return { isValid: false, error: 'Please enter a valid city name' };
  }

  return { isValid: true };
}

function validateZipCode(zip) {
  const trimmed = (zip || '').trim();
  if (!trimmed) return { isValid: true };

  if (trimmed.length < 3 || trimmed.length > 10) {
    return { isValid: false, error: 'Postal code must be between 3 and 10 characters' };
  }

  if (!/^[a-zA-Z0-9\s-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Postal code contains invalid characters' };
  }

  if (/^(\d)\1+$/.test(trimmed) || trimmed === '12345' || trimmed === '00000') {
    return { isValid: false, error: 'Please enter a real postal code' };
  }

  return { isValid: true };
}

function validateShippingAddress(address, isLocalPickup = false) {
  const errors = {};

  // Name check
  if (address.name) {
    const parts = address.name.trim().split(/\s+/);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    const fnCheck = validateName(firstName, 'First Name');
    if (!fnCheck.isValid) errors.firstName = fnCheck.error;

    if (lastName) {
      const lnCheck = validateName(lastName, 'Last Name');
      if (!lnCheck.isValid) errors.lastName = lnCheck.error;
    }
  } else {
    errors.name = 'Full name is required';
  }

  // Phone check
  const phoneCheck = validatePhone(address.phone || '', address.country);
  if (!phoneCheck.isValid) errors.phone = phoneCheck.error;

  // Address & city checks for non-local pickup
  if (!isLocalPickup) {
    const streetCheck = validateStreet(address.street || '');
    if (!streetCheck.isValid) errors.street = streetCheck.error;

    const cityCheck = validateCity(address.city || '', address.country);
    if (!cityCheck.isValid) errors.city = cityCheck.error;

    if (address.zipCode) {
      const zipCheck = validateZipCode(address.zipCode);
      if (!zipCheck.isValid) errors.zipCode = zipCheck.error;
    }
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}

module.exports = {
  validateEmail,
  validateName,
  validatePhone,
  validateStreet,
  validateCity,
  validateZipCode,
  validateShippingAddress,
};
