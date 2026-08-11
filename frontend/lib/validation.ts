// Data validation utilities for checking realistic input values

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'test.com', 'example.com', 'foo.com', 'bar.com', 'asdf.com', 'fake.com',
  'tempmail.com', '10minutemail.com', 'mailinator.com', 'yopmail.com',
  'dispostable.com', 'trashmail.com', 'sharklasers.com', 'gmx.com.fake'
]);

const DUMMY_NAME_PATTERNS = [
  'asdf', 'qwerty', 'zxcv', 'qwert', 'test', 'fake', 'dummy',
  'null', 'undefined', 'user', 'admin', 'name', 'first', 'last',
  'xxxx', 'aaaa', 'zzzz', 'abcd', '1234'
];

/**
 * Validates an email address for real format and non-disposable domain
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = (email || '').trim().toLowerCase();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required' };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@example.com)' };
  }

  const parts = trimmed.split('@');
  const localPart = parts[0];
  const domain = parts[1];

  if (localPart.length < 2) {
    return { isValid: false, error: 'Email username is too short' };
  }

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { isValid: false, error: 'Please use a valid, permanent email address' };
  }

  if (DUMMY_NAME_PATTERNS.some((pat) => localPart === pat || domain.startsWith(pat))) {
    return { isValid: false, error: 'Please enter a real email address' };
  }

  return { isValid: true };
}

/**
 * Validates first name or last name for realistic human name
 */
export function validateName(name: string, fieldLabel = 'Name'): { isValid: boolean; error?: string } {
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

  // Letters (Latin + Ge'ez/Amharic range \u1200-\u137F), spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z\u1200-\u137F\s'-]+$/;
  if (!nameRegex.test(trimmed)) {
    return { isValid: false, error: `${fieldLabel} should contain letters only (no numbers or special symbols)` };
  }

  const lower = trimmed.toLowerCase();

  // Reject repeating single character 4+ times (e.g., "aaaaa")
  if (/(.)\1{3,}/.test(lower)) {
    return { isValid: false, error: `Please enter a valid ${fieldLabel.toLowerCase()}` };
  }

  // Reject known dummy text / keyboard mash
  if (DUMMY_NAME_PATTERNS.some((pat) => lower === pat || lower.includes('asdf') || lower.includes('qwerty'))) {
    return { isValid: false, error: `Please enter a real ${fieldLabel.toLowerCase()}` };
  }

  return { isValid: true };
}

/**
 * Validates phone numbers against realistic patterns & country rules
 */
export function validatePhone(phone: string, country?: string): { isValid: boolean; error?: string } {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Phone number is required' };
  }

  const digitsOnly = trimmed.replace(/\D/g, '');

  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return { isValid: false, error: 'Phone number must be between 7 and 15 digits' };
  }

  // Reject all identical digits (e.g. 000000000, 555555555)
  if (/^(\d)\1+$/.test(digitsOnly)) {
    return { isValid: false, error: 'Please enter a valid, non-repetitive phone number' };
  }

  // Reject more than 5 consecutive identical digits (e.g. 084555555555)
  if (/(.)\1{4,}/.test(digitsOnly)) {
    return { isValid: false, error: 'Please enter a valid phone number (too many repeated digits)' };
  }

  // Reject sequential digits (123456789, 987654321)
  if ('1234567890987654321'.includes(digitsOnly)) {
    return { isValid: false, error: 'Please enter a real phone number' };
  }

  // Specific check for Ethiopia
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
      return { isValid: false, error: 'Ethiopian mobile number must be 9 digits (e.g., 911234567)' };
    }

    if (!localDigits.startsWith('9') && !localDigits.startsWith('7')) {
      return { isValid: false, error: 'Ethiopian mobile numbers start with 9 or 7 (e.g. 911... or 711...)' };
    }
  }

  return { isValid: true };
}

/**
 * Validates detailed street address
 */
export function validateStreet(street: string): { isValid: boolean; error?: string } {
  const trimmed = (street || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Street address is required' };
  }

  if (trimmed.length < 5) {
    return { isValid: false, error: 'Please enter a full street address (at least 5 characters)' };
  }

  const lower = trimmed.toLowerCase();

  // Reject single-word dummy street names that match common generic words
  const DUMMY_STREETS = ['addis', 'china', 'street', 'address', 'test', 'asdf', '12345', 'house', 'home', 'road', 'none', 'n/a'];
  if (DUMMY_STREETS.includes(lower)) {
    return { isValid: false, error: 'Please enter a complete street address (e.g. Bole Road, House 123)' };
  }

  // Must have a space separating words, or contain numbers + letters
  const hasSpace = /\s/.test(trimmed);
  const hasDigitsAndLetters = /\d/.test(trimmed) && /[a-zA-Z\u1200-\u137F]/.test(trimmed);

  if (!hasSpace && !hasDigitsAndLetters) {
    return { isValid: false, error: 'Please enter a complete street address with building number or street name' };
  }

  return { isValid: true };
}

/**
 * Validates city name
 */
export function validateCity(city: string, country?: string): { isValid: boolean; error?: string } {
  const trimmed = (city || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'City is required' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'City name must be at least 2 characters' };
  }

  const cityRegex = /^[a-zA-Z\u1200-\u137F\s'-]+$/;
  if (!cityRegex.test(trimmed)) {
    return { isValid: false, error: 'City should contain letters only' };
  }

  const lower = trimmed.toLowerCase();

  // Prevent city from being identical to country (e.g. Country: China, City: china)
  if (country && lower === country.toLowerCase().trim()) {
    return { isValid: false, error: `City name cannot be the same as country name (${country})` };
  }

  // Dummy checks
  const DUMMY_CITIES = ['test', 'city', 'asdf', 'qwerty', 'xxx', 'na', 'n/a', 'none', '123'];
  if (DUMMY_CITIES.includes(lower)) {
    return { isValid: false, error: 'Please enter a valid city name' };
  }

  return { isValid: true };
}

/**
 * Validates optional postal code
 */
export function validateZipCode(zip: string): { isValid: boolean; error?: string } {
  const trimmed = (zip || '').trim();
  if (!trimmed) {
    return { isValid: true }; // Optional
  }

  if (trimmed.length < 3 || trimmed.length > 10) {
    return { isValid: false, error: 'Postal code must be 3 to 10 characters' };
  }

  if (!/^[a-zA-Z0-9\s-]+$/.test(trimmed)) {
    return { isValid: false, error: 'Postal code contains invalid characters' };
  }

  if (/^(\d)\1+$/.test(trimmed) || trimmed === '12345' || trimmed === '00000') {
    return { isValid: false, error: 'Please enter a real postal code' };
  }

  return { isValid: true };
}
