// Data validation utilities for checking realistic input values and country compatibility

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

// Major Ethiopian cities and locations
const ETHIOPIAN_LOCATIONS = new Set([
  'addis', 'addis ababa', 'addis abeba', 'finfinne', 'hawassa', 'awassa',
  'gonder', 'gondar', 'mekelle', 'mekele', 'dire dawa', 'bahir dar', 'adama',
  'nazret', 'jimma', 'jijiga', 'bishoftu', 'debre zeit', 'debre berhan',
  'debre markos', 'dessie', 'dese', 'arba minch', 'harar', 'shashamane',
  'sodo', 'bale', 'hosaena', 'nekemte', 'axum', 'aksum', 'wolkite', 'dilla',
  'ambo', 'welkite', 'kombolcha'
]);

// Major UK cities
const UK_EXCLUSIVE_CITIES = new Set([
  'london', 'birmingham', 'manchester', 'glasgow', 'edinburgh', 'liverpool',
  'bristol', 'leeds', 'sheffield', 'belfast', 'newcastle', 'nottingham',
  'southampton', 'portsmouth', 'cardiff', 'leicester', 'aberdeen', 'oxford',
  'cambridge', 'brighton', 'plymouth', 'derby', 'stoke', 'wolverhampton',
  'coventry', 'hull', 'swansea', 'sunderland', 'york', 'bath', 'exeter'
]);

// Major US cities
const US_EXCLUSIVE_CITIES = new Set([
  'chicago', 'houston', 'phoenix', 'philadelphia', 'san antonio', 'san diego',
  'dallas', 'san jose', 'austin', 'jacksonville', 'fort worth', 'columbus',
  'charlotte', 'san francisco', 'indianapolis', 'seattle', 'denver',
  'washington', 'boston', 'el paso', 'nashville', 'detroit', 'oklahoma city',
  'portland', 'las vegas', 'memphis', 'louisville', 'baltimore', 'milwaukee',
  'albuquerque', 'tucson', 'fresno', 'sacramento', 'mesa', 'kansas city',
  'atlanta', 'omaha', 'colorado springs', 'raleigh', 'long beach',
  'virginia beach', 'miami', 'oakland', 'minneapolis', 'tampa', 'tulsa',
  'arlington', 'new orleans', 'wichita', 'cleveland', 'orlando'
]);

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

  if (/(.)\1{3,}/.test(lower)) {
    return { isValid: false, error: `Please enter a valid ${fieldLabel.toLowerCase()}` };
  }

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

  if (/^(\d)\1+$/.test(digitsOnly)) {
    return { isValid: false, error: 'Please enter a valid, non-repetitive phone number' };
  }

  if (/(.)\1{4,}/.test(digitsOnly)) {
    return { isValid: false, error: 'Please enter a valid phone number (too many repeated digits)' };
  }

  if ('1234567890987654321'.includes(digitsOnly)) {
    return { isValid: false, error: 'Please enter a real phone number' };
  }

  // Country-specific phone checks
  const targetCountry = (country || 'Ethiopia').trim();

  // 1. Ethiopia
  const isEthiopia = targetCountry === 'Ethiopia' || trimmed.startsWith('+251') || digitsOnly.startsWith('251');
  if (isEthiopia) {
    let localDigits = digitsOnly;
    if (localDigits.startsWith('251')) localDigits = localDigits.slice(3);
    if (localDigits.startsWith('0')) localDigits = localDigits.slice(1);

    if (localDigits.length !== 9) {
      return { isValid: false, error: 'Ethiopian mobile number must be 9 digits (e.g. 911234567)' };
    }
    if (!localDigits.startsWith('9') && !localDigits.startsWith('7')) {
      return { isValid: false, error: 'Ethiopian mobile numbers start with 9 or 7' };
    }
  }

  // 2. United Kingdom
  const isUK = targetCountry === 'United Kingdom' || trimmed.startsWith('+44') || digitsOnly.startsWith('44');
  if (isUK && targetCountry === 'United Kingdom') {
    let localDigits = digitsOnly;
    if (localDigits.startsWith('44')) localDigits = localDigits.slice(2);
    if (localDigits.startsWith('0')) localDigits = localDigits.slice(1);

    if (localDigits.length !== 10) {
      return { isValid: false, error: 'UK phone number must have 10 digits after +44 (e.g. 7884123456)' };
    }
    if (localDigits.startsWith('7') && localDigits.length !== 10) {
      return { isValid: false, error: 'UK mobile number must be 10 digits starting with 7' };
    }
  }

  // 3. United States / Canada
  const isUSorCA = (targetCountry === 'United States' || targetCountry === 'Canada') && (trimmed.startsWith('+1') || digitsOnly.length === 10 || digitsOnly.startsWith('1'));
  if (isUSorCA && (targetCountry === 'United States' || targetCountry === 'Canada')) {
    let localDigits = digitsOnly;
    if (localDigits.length === 11 && localDigits.startsWith('1')) localDigits = localDigits.slice(1);
    if (localDigits.length !== 10) {
      return { isValid: false, error: `${targetCountry} phone number must be 10 digits (area code + number)` };
    }
  }

  return { isValid: true };
}

/**
 * Validates detailed street address and checks country compatibility
 */
export function validateStreet(street: string, country?: string): { isValid: boolean; error?: string } {
  const trimmed = (street || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Street address is required' };
  }

  if (trimmed.length < 5) {
    return { isValid: false, error: 'Please enter a full street address (at least 5 characters)' };
  }

  const lower = trimmed.toLowerCase();
  const targetCountry = (country || 'Ethiopia').trim();

  // Reject single-word dummy street names
  const DUMMY_STREETS = ['addis', 'china', 'street', 'address', 'test', 'asdf', '12345', 'house', 'home', 'road', 'none', 'n/a'];
  if (DUMMY_STREETS.includes(lower)) {
    return { isValid: false, error: 'Please enter a complete street address (e.g. Bole Road, House 123)' };
  }

  // Check if user entered an Ethiopian city/location in street field while selecting non-Ethiopian country
  if (targetCountry !== 'Ethiopia') {
    const isEthLoc = Array.from(ETHIOPIAN_LOCATIONS).some((loc) => lower === loc || lower.startsWith(`${loc} `) || lower.endsWith(` ${loc}`));
    if (isEthLoc) {
      return {
        isValid: false,
        error: `"${trimmed}" is an Ethiopian location and cannot be used for ${targetCountry} delivery. Please enter a valid address in ${targetCountry}.`
      };
    }
  }

  const hasSpace = /\s/.test(trimmed);
  const hasDigitsAndLetters = /\d/.test(trimmed) && /[a-zA-Z\u1200-\u137F]/.test(trimmed);

  if (!hasSpace && !hasDigitsAndLetters) {
    return { isValid: false, error: 'Please enter a complete street address with building number or street name' };
  }

  return { isValid: true };
}

/**
 * Validates city name and enforces country compatibility
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
  const targetCountry = (country || 'Ethiopia').trim();

  // 1. Prevent city from being identical to country (e.g. Country: China, City: china)
  if (targetCountry && lower === targetCountry.toLowerCase()) {
    return { isValid: false, error: `City name cannot be identical to country name (${targetCountry})` };
  }

  // 2. Reject dummy city strings
  const DUMMY_CITIES = ['test', 'city', 'asdf', 'qwerty', 'xxx', 'na', 'n/a', 'none', '123'];
  if (DUMMY_CITIES.includes(lower)) {
    return { isValid: false, error: 'Please enter a valid city name' };
  }

  // 3. Country mismatch check: Ethiopian cities entered for non-Ethiopian countries
  if (targetCountry !== 'Ethiopia') {
    if (ETHIOPIAN_LOCATIONS.has(lower) || Array.from(ETHIOPIAN_LOCATIONS).some((loc) => lower.includes(loc))) {
      return {
        isValid: false,
        error: `"${trimmed}" is an Ethiopian city and cannot be used for ${targetCountry} delivery. Please enter a city in ${targetCountry}.`
      };
    }
  }

  // 4. UK mismatch check: UK city entered for non-UK country
  if (targetCountry !== 'United Kingdom' && UK_EXCLUSIVE_CITIES.has(lower)) {
    return {
      isValid: false,
      error: `"${trimmed}" is a UK city and cannot be used for ${targetCountry} delivery.`
    };
  }

  // 5. US mismatch check: US city entered for non-US country
  if (targetCountry !== 'United States' && US_EXCLUSIVE_CITIES.has(lower)) {
    return {
      isValid: false,
      error: `"${trimmed}" is a US city and cannot be used for ${targetCountry} delivery.`
    };
  }

  return { isValid: true };
}

/**
 * Validates postal code format matching the selected country
 */
export function validateZipCode(zip: string, country?: string): { isValid: boolean; error?: string } {
  const trimmed = (zip || '').trim();
  const targetCountry = (country || 'Ethiopia').trim();

  // If Ethiopia, postal code is optional
  if (targetCountry === 'Ethiopia' && !trimmed) {
    return { isValid: true };
  }

  // For international delivery, postal code is required for UK, US, Canada, China, EU, etc.
  const REQUIRES_POSTCODE = new Set([
    'United Kingdom', 'United States', 'Canada', 'China', 'Germany', 'France',
    'Italy', 'Spain', 'Australia', 'Netherlands', 'Japan', 'Brazil'
  ]);

  if (REQUIRES_POSTCODE.has(targetCountry) && !trimmed) {
    return { isValid: false, error: `Postal code is required for ${targetCountry}` };
  }

  if (!trimmed) {
    return { isValid: true };
  }

  // Basic sanity check
  if (trimmed.length < 3 || trimmed.length > 10) {
    return { isValid: false, error: 'Postal code must be between 3 and 10 characters' };
  }

  if (/^(\d)\1+$/.test(trimmed) || trimmed === '12345' || trimmed === '00000') {
    return { isValid: false, error: 'Please enter a real postal code' };
  }

  // Country-specific postal code format checks:

  // 1. United Kingdom: e.g., SW1A 1AA, W1D 3BF, M1 1AE, EC1A 1BB
  if (targetCountry === 'United Kingdom') {
    const ukPostcodeRegex = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/;
    if (!ukPostcodeRegex.test(trimmed)) {
      return {
        isValid: false,
        error: `"${trimmed}" is not a valid UK postcode. UK postcodes contain letters & numbers (e.g. SW1A 1AA, M1 1AE, W1D 3BF).`
      };
    }
  }

  // 2. United States: 5 digits or ZIP+4 (e.g. 90210 or 10001-1234)
  if (targetCountry === 'United States') {
    const usZipRegex = /^\d{5}(-\d{4})?$/;
    if (!usZipRegex.test(trimmed)) {
      return {
        isValid: false,
        error: `"${trimmed}" is not a valid US ZIP code. US ZIP codes must be 5 digits (e.g. 90210 or 10001-1234).`
      };
    }
  }

  // 3. Canada: A1A 1A1 format
  if (targetCountry === 'Canada') {
    const caPostalRegex = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
    if (!caPostalRegex.test(trimmed)) {
      return {
        isValid: false,
        error: `"${trimmed}" is not a valid Canadian postal code (e.g. K1A 0B1).`
      };
    }
  }

  // 4. China: 6 digits
  if (targetCountry === 'China') {
    const cnZipRegex = /^\d{6}$/;
    if (!cnZipRegex.test(trimmed)) {
      return {
        isValid: false,
        error: `"${trimmed}" is not a valid China postal code (must be 6 digits, e.g. 100000).`
      };
    }
  }

  // 5. Germany / France / Spain / Italy: 5 digits
  if (['Germany', 'France', 'Spain', 'Italy'].includes(targetCountry)) {
    if (!/^\d{5}$/.test(trimmed)) {
      return {
        isValid: false,
        error: `Postal code for ${targetCountry} must be 5 digits (e.g. 75001 or 10115).`
      };
    }
  }

  // 6. Australia: 4 digits
  if (targetCountry === 'Australia') {
    if (!/^\d{4}$/.test(trimmed)) {
      return {
        isValid: false,
        error: `Australia postal code must be 4 digits (e.g. 2000 or 3000).`
      };
    }
  }

  // 7. Ethiopia: 4 digits if entered
  if (targetCountry === 'Ethiopia') {
    if (!/^\d{4}$/.test(trimmed)) {
      return {
        isValid: false,
        error: `Ethiopia postal code should be 4 digits (e.g. 1000).`
      };
    }
  }

  return { isValid: true };
}
