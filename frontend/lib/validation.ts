// Data validation utilities for checking realistic input values, country compatibility, City-ZIP cross-validation, and global phone verification

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

// Recognized street designators for real street address validation
const STREET_DESIGNATORS = new Set([
  'street', 'st', 'avenue', 'ave', 'road', 'rd', 'boulevard', 'blvd',
  'drive', 'dr', 'lane', 'ln', 'way', 'place', 'pl', 'court', 'ct',
  'circle', 'cir', 'parkway', 'pkwy', 'highway', 'hwy', 'kebele',
  'house', 'block', 'apt', 'suite', 'unit', 'building', 'bldg', 'floor', 'fl'
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
 * Universal & Worldwide Real Phone Number Validation (All Countries)
 */
export function validatePhone(phone: string, country?: string): { isValid: boolean; error?: string } {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Phone number is required' };
  }

  const digitsOnly = trimmed.replace(/\D/g, '');
  const cLower = (country || 'Ethiopia').trim().toLowerCase();

  const isEthiopia = cLower === 'ethiopia' || cLower === 'et' || trimmed.startsWith('+251') || digitsOnly.startsWith('251');
  const isUS = cLower === 'united states' || cLower === 'us' || cLower === 'usa';
  const isCanada = cLower === 'canada' || cLower === 'ca';
  const isUK = cLower === 'united kingdom' || cLower === 'uk' || cLower === 'gb' || trimmed.startsWith('+44');
  const isChina = cLower === 'china' || cLower === 'cn' || trimmed.startsWith('+86');
  const isIndia = cLower === 'india' || cLower === 'in' || trimmed.startsWith('+91');
  const isKenya = cLower === 'kenya' || cLower === 'ke' || trimmed.startsWith('+254');
  const isNigeria = cLower === 'nigeria' || cLower === 'ng' || trimmed.startsWith('+234');
  const isUAE = cLower === 'united arab emirates' || cLower === 'uae' || trimmed.startsWith('+971');
  const isGermany = cLower === 'germany' || cLower === 'de' || trimmed.startsWith('+49');
  const isFrance = cLower === 'france' || cLower === 'fr' || trimmed.startsWith('+33');
  const isAustralia = cLower === 'australia' || cLower === 'au' || trimmed.startsWith('+61');

  // Determine dial code
  let dialCode = '';
  if (isEthiopia) dialCode = '251';
  else if (isUS || isCanada) dialCode = '1';
  else if (isUK) dialCode = '44';
  else if (isChina) dialCode = '86';
  else if (isIndia) dialCode = '91';
  else if (isKenya) dialCode = '254';
  else if (isNigeria) dialCode = '234';
  else if (isUAE) dialCode = '971';
  else if (isGermany) dialCode = '49';
  else if (isFrance) dialCode = '33';
  else if (isAustralia) dialCode = '61';

  // Separate dial code from national subscriber number
  let subscriberDigits = digitsOnly;
  if (dialCode && digitsOnly.startsWith(dialCode)) {
    subscriberDigits = digitsOnly.slice(dialCode.length);
  }

  // Check for redundant leading zero after dial code (e.g. +44 07... or +251 09...)
  if (dialCode && digitsOnly.startsWith(dialCode) && subscriberDigits.startsWith('0')) {
    return { isValid: false, error: `Please remove the leading 0 after the country code (+${dialCode})` };
  }

  // Strip leading 0 on national number if present
  if (subscriberDigits.startsWith('0') && subscriberDigits.length > 7) {
    subscriberDigits = subscriberDigits.slice(1);
  }

  // Length check: Subscriber digits must be between 6 and 12 digits (or 7-15 total)
  if (digitsOnly.length < 7 || digitsOnly.length > 15 || subscriberDigits.length < 6) {
    return { isValid: false, error: `Phone number is invalid (too short or too long)` };
  }

  // 1. Rejections for dummy repeating numbers (e.g. 0000000, 55555555, 9999999)
  if (/^(\d)\1+$/.test(subscriberDigits) || /^(\d)\1+$/.test(digitsOnly)) {
    return { isValid: false, error: 'Please enter a valid, non-repetitive phone number' };
  }

  // 2. Max 4 consecutive identical digits allowed anywhere (rejects 55555, 00000, 999999)
  if (/(.)\1{4,}/.test(subscriberDigits)) {
    return { isValid: false, error: 'Phone number contains too many repeated consecutive digits' };
  }

  // 3. Unique digit count (entropy): Subscriber number >= 7 digits must have at least 4 unique digits
  if (subscriberDigits.length >= 7) {
    const uniqueCount = new Set(subscriberDigits.split('')).size;
    if (uniqueCount < 4) {
      return { isValid: false, error: 'Please enter a real phone number (insufficient digit variety)' };
    }
  }

  // 4. Sequential patterns (12345678, 98765432, 23456789)
  if ('1234567890987654321'.includes(subscriberDigits)) {
    return { isValid: false, error: 'Please enter a real phone number' };
  }

  // 5. Repeating block patterns (123123123, 99009900)
  if (/^(\d{2,4})\1+$/.test(subscriberDigits)) {
    return { isValid: false, error: 'Please enter a real phone number' };
  }

  // ─── Country-Specific National Mobile/Landline Rules ───

  // Ethiopia (+251)
  if (isEthiopia) {
    if (subscriberDigits.length !== 9) {
      return { isValid: false, error: 'Ethiopian mobile number must be 9 digits (e.g. 911234567)' };
    }
    if (!subscriberDigits.startsWith('9') && !subscriberDigits.startsWith('7')) {
      return { isValid: false, error: 'Ethiopian mobile numbers must start with 9 or 7' };
    }
  }

  // United States & Canada (+1 NANP)
  if (isUS || isCanada) {
    let localDigits = subscriberDigits;
    if (digitsOnly.length === 11 && digitsOnly.startsWith('1')) localDigits = digitsOnly.slice(1);

    if (localDigits.length !== 10) {
      return { isValid: false, error: `Phone number must be 10 digits (area code + 7 digits)` };
    }

    const areaCode = localDigits.slice(0, 3);
    const exchangeCode = localDigits.slice(3, 6);

    if (areaCode.startsWith('0') || areaCode.startsWith('1')) {
      return { isValid: false, error: `Invalid area code (${areaCode}): area code cannot start with 0 or 1` };
    }
    if (exchangeCode.startsWith('0') || exchangeCode.startsWith('1')) {
      return { isValid: false, error: `Invalid phone exchange (${exchangeCode}): exchange cannot start with 0 or 1` };
    }
    if (exchangeCode === '555') {
      return { isValid: false, error: `Exchange 555 numbers are fictitious test numbers` };
    }
  }

  // United Kingdom (+44)
  if (isUK) {
    if (subscriberDigits.length !== 10) {
      return { isValid: false, error: 'UK phone number must have 10 digits after +44 (e.g. 7884123456)' };
    }
    if (!/^[1237]/.test(subscriberDigits)) {
      return { isValid: false, error: 'UK numbers start with 7 (mobile) or 1/2/3 (landline)' };
    }
  }

  // China (+86)
  if (isChina) {
    if (subscriberDigits.length !== 11) {
      return { isValid: false, error: 'China mobile number must be 11 digits starting with 1 (e.g. 13812345678)' };
    }
    if (!subscriberDigits.startsWith('1')) {
      return { isValid: false, error: 'China mobile numbers must start with 1 (e.g. 13x, 15x, 18x)' };
    }
  }

  // India (+91)
  if (isIndia) {
    if (subscriberDigits.length !== 10) {
      return { isValid: false, error: 'India mobile number must be 10 digits' };
    }
    if (!/^[6789]/.test(subscriberDigits)) {
      return { isValid: false, error: 'India mobile numbers must start with 6, 7, 8, or 9' };
    }
  }

  // Kenya (+254)
  if (isKenya) {
    if (subscriberDigits.length !== 9) {
      return { isValid: false, error: 'Kenya mobile number must be 9 digits' };
    }
    if (!/^[71]/.test(subscriberDigits)) {
      return { isValid: false, error: 'Kenya mobile numbers start with 7 or 1' };
    }
  }

  // Nigeria (+234)
  if (isNigeria) {
    if (subscriberDigits.length !== 10) {
      return { isValid: false, error: 'Nigeria mobile number must be 10 digits' };
    }
    if (!/^[789]/.test(subscriberDigits)) {
      return { isValid: false, error: 'Nigeria mobile numbers start with 7, 8, or 9' };
    }
  }

  // United Arab Emirates (+971)
  if (isUAE) {
    if (subscriberDigits.length !== 9) {
      return { isValid: false, error: 'UAE mobile number must be 9 digits (e.g. 501234567)' };
    }
    if (!subscriberDigits.startsWith('5')) {
      return { isValid: false, error: 'UAE mobile numbers start with 5 (e.g. 50, 52, 54, 55, 56)' };
    }
  }

  // Germany (+49)
  if (isGermany) {
    if (subscriberDigits.length < 10 || subscriberDigits.length > 11) {
      return { isValid: false, error: 'German phone number must be 10 to 11 digits' };
    }
  }

  // France (+33)
  if (isFrance) {
    if (subscriberDigits.length !== 9) {
      return { isValid: false, error: 'France phone number must be 9 digits' };
    }
    if (!/^[1-7]/.test(subscriberDigits)) {
      return { isValid: false, error: 'France phone numbers start with 6/7 (mobile) or 1-5 (landline)' };
    }
  }

  // Australia (+61)
  if (isAustralia) {
    if (subscriberDigits.length !== 9) {
      return { isValid: false, error: 'Australia phone number must be 9 digits' };
    }
    if (!/^[42378]/.test(subscriberDigits)) {
      return { isValid: false, error: 'Australia mobile numbers start with 4' };
    }
  }

  return { isValid: true };
}

/**
 * Validates detailed street address and checks country & street designators
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

  // Reject short 2-3 character non-address abbreviations (e.g. "dc", "ny", "la", "sf")
  if (/^[a-zA-Z]{1,3}$/.test(trimmed)) {
    return { isValid: false, error: `"${trimmed}" is not a valid street address. Please enter a full street address (e.g. 1600 Pennsylvania Ave NW)` };
  }

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

  const words = lower.split(/\s+/);
  const hasDigit = /\d/.test(trimmed);
  const hasDesignator = words.some((w) => STREET_DESIGNATORS.has(w));

  if (!hasDigit && !hasDesignator && words.length < 2) {
    return { isValid: false, error: 'Please enter a complete street address with building number or street type (e.g. 123 Main St)' };
  }

  return { isValid: true };
}

/**
 * Validates city name, expands known abbreviations, and enforces country compatibility
 */
export function validateCity(city: string, country?: string): { isValid: boolean; error?: string } {
  let trimmed = (city || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'City is required' };
  }

  const lower = trimmed.toLowerCase();
  const targetCountry = (country || 'Ethiopia').trim();

  // Handle known 2-letter city abbreviations
  if (lower === 'dc' && targetCountry === 'United States') {
    trimmed = 'Washington DC';
  } else if (lower === 'ny' || lower === 'nyc') {
    trimmed = 'New York';
  } else if (lower === 'la') {
    trimmed = 'Los Angeles';
  } else if (lower === 'sf') {
    trimmed = 'San Francisco';
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'City name must be at least 2 characters' };
  }

  const cityRegex = /^[a-zA-Z\u1200-\u137F\s',.-]+$/;
  if (!cityRegex.test(trimmed)) {
    return { isValid: false, error: 'City should contain letters only' };
  }

  const normLower = trimmed.toLowerCase();

  if (targetCountry && normLower === targetCountry.toLowerCase()) {
    return { isValid: false, error: `City name cannot be identical to country name (${targetCountry})` };
  }

  const DUMMY_CITIES = ['test', 'city', 'asdf', 'qwerty', 'xxx', 'na', 'n/a', 'none', '123'];
  if (DUMMY_CITIES.includes(normLower)) {
    return { isValid: false, error: 'Please enter a valid city name' };
  }

  if (targetCountry !== 'Ethiopia') {
    if (ETHIOPIAN_LOCATIONS.has(normLower) || Array.from(ETHIOPIAN_LOCATIONS).some((loc) => normLower.includes(loc))) {
      return {
        isValid: false,
        error: `"${trimmed}" is an Ethiopian city and cannot be used for ${targetCountry} delivery. Please enter a city in ${targetCountry}.`
      };
    }
  }

  if (targetCountry !== 'United Kingdom' && UK_EXCLUSIVE_CITIES.has(normLower)) {
    return {
      isValid: false,
      error: `"${trimmed}" is a UK city and cannot be used for ${targetCountry} delivery.`
    };
  }

  if (targetCountry !== 'United States' && US_EXCLUSIVE_CITIES.has(normLower)) {
    return {
      isValid: false,
      error: `"${trimmed}" is a US city and cannot be used for ${targetCountry} delivery.`
    };
  }

  return { isValid: true };
}

/**
 * Validates postal code format and checks City-to-ZIP cross-compatibility
 */
export function validateZipCode(zip: string, country?: string, city?: string): { isValid: boolean; error?: string } {
  const trimmed = (zip || '').trim();
  const targetCountry = (country || 'Ethiopia').trim();
  const targetCity = (city || '').trim().toLowerCase();

  if (targetCountry === 'Ethiopia' && !trimmed) {
    return { isValid: true };
  }

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

  if (trimmed.length < 3 || trimmed.length > 10) {
    return { isValid: false, error: 'Postal code must be between 3 and 10 characters' };
  }

  if (/^(\d)\1+$/.test(trimmed) || trimmed === '12345' || trimmed === '00000') {
    return { isValid: false, error: 'Please enter a real postal code' };
  }

  if (targetCountry === 'United States' && /^[1-9]0000$/.test(trimmed)) {
    return { isValid: false, error: `"${trimmed}" is an unassigned USPS postal code. Valid US ZIP codes are specific to deliverable city areas.` };
  }

  // United Kingdom
  if (targetCountry === 'United Kingdom') {
    const ukPostcodeRegex = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/;
    if (!ukPostcodeRegex.test(trimmed)) {
      return {
        isValid: false,
        error: `"${trimmed}" is not a valid UK postcode. UK postcodes contain letters & numbers (e.g. SW1A 1AA, M1 1AE, W1D 3BF).`
      };
    }

    if (targetCity) {
      const outward = trimmed.toUpperCase().split(' ')[0];
      if ((targetCity.includes('london') || targetCity === 'london') && !/^(EC|WC|E|N|NW|SE|SW|W)\d/.test(outward)) {
        return { isValid: false, error: `Postcode "${trimmed}" does not match City 'London' (London postcodes start with EC, WC, E, N, NW, SE, SW, or W)` };
      }
      if (targetCity.includes('manchester') && !outward.startsWith('M')) {
        return { isValid: false, error: `Postcode "${trimmed}" does not match City 'Manchester' (Manchester postcodes start with M)` };
      }
      if (targetCity.includes('birmingham') && !outward.startsWith('B')) {
        return { isValid: false, error: `Postcode "${trimmed}" does not match City 'Birmingham' (Birmingham postcodes start with B)` };
      }
    }
  }

  // United States
  if (targetCountry === 'United States') {
    const usZipRegex = /^\d{5}(-\d{4})?$/;
    if (!usZipRegex.test(trimmed)) {
      return {
        isValid: false,
        error: `"${trimmed}" is not a valid US ZIP code. US ZIP codes must be 5 digits (e.g. 90210 or 10001-1234).`
      };
    }

    const zipNum = parseInt(trimmed.slice(0, 5), 10);

    if (targetCity) {
      if (targetCity.includes('dc') || targetCity.includes('washington')) {
        if (zipNum < 20001 || zipNum > 20599) {
          return { isValid: false, error: `ZIP code ${trimmed} does not match City 'Washington DC' (DC ZIP codes are between 20001 and 20599)` };
        }
      } else if (targetCity.includes('new york') || targetCity === 'nyc') {
        if (zipNum < 10001 || zipNum > 10292) {
          return { isValid: false, error: `ZIP code ${trimmed} does not match City 'New York' (NYC ZIP codes are between 10001 and 10292)` };
        }
      } else if (targetCity.includes('los angeles') || targetCity === 'la') {
        if (zipNum < 90001 || zipNum > 90294) {
          return { isValid: false, error: `ZIP code ${trimmed} does not match City 'Los Angeles' (LA ZIP codes are between 90001 and 90294)` };
        }
      } else if (targetCity.includes('chicago')) {
        if (zipNum < 60601 || zipNum > 60827) {
          return { isValid: false, error: `ZIP code ${trimmed} does not match City 'Chicago' (Chicago ZIP codes are between 60601 and 60827)` };
        }
      } else if (targetCity.includes('houston')) {
        if (zipNum < 77001 || zipNum > 77299) {
          return { isValid: false, error: `ZIP code ${trimmed} does not match City 'Houston' (Houston ZIP codes are between 77001 and 77299)` };
        }
      } else if (targetCity.includes('miami')) {
        if (zipNum < 33101 || zipNum > 33299) {
          return { isValid: false, error: `ZIP code ${trimmed} does not match City 'Miami' (Miami ZIP codes are between 33101 and 33299)` };
        }
      } else if (targetCity.includes('san francisco') || targetCity === 'sf') {
        if (zipNum < 94101 || zipNum > 94188) {
          return { isValid: false, error: `ZIP code ${trimmed} does not match City 'San Francisco' (SF ZIP codes are between 94101 and 94188)` };
        }
      }
    }
  }

  // Canada
  if (targetCountry === 'Canada') {
    const caPostalRegex = /^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/;
    if (!caPostalRegex.test(trimmed)) {
      return {
        isValid: false,
        error: `"${trimmed}" is not a valid Canadian postal code (e.g. K1A 0B1).`
      };
    }
  }

  // China
  if (targetCountry === 'China') {
    const cnZipRegex = /^\d{6}$/;
    if (!cnZipRegex.test(trimmed)) {
      return {
        isValid: false,
        error: `"${trimmed}" is not a valid China postal code (must be 6 digits, e.g. 100000).`
      };
    }
  }

  // Germany / France / Spain / Italy
  if (['Germany', 'France', 'Spain', 'Italy'].includes(targetCountry)) {
    if (!/^\d{5}$/.test(trimmed)) {
      return {
        isValid: false,
        error: `Postal code for ${targetCountry} must be 5 digits (e.g. 75001 or 10115).`
      };
    }
  }

  // Australia
  if (targetCountry === 'Australia') {
    if (!/^\d{4}$/.test(trimmed)) {
      return {
        isValid: false,
        error: `Australia postal code must be 4 digits (e.g. 2000 or 3000).`
      };
    }
  }

  // Ethiopia
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
