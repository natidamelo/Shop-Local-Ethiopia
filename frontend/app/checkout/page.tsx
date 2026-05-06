'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, CreditCard, MapPin, ShoppingBag, ChevronRight,
  Lock, Tag, ChevronDown, Zap, LogIn, Mail, Truck, X, Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/layout/Navbar';
import { useCartStore } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useSiteSettings, formatPrice } from '@/lib/useSiteSettings';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// ── Stripe publishable key (set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local) ──
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ─── Shipping method type ────────────────────────────────────────────────────
interface ShippingMethod {
  id: string;
  carrier: string;
  eta: string;
  price: number;
  isLocalPickup?: boolean;
}

const LOCAL_PICKUP: ShippingMethod = {
  id: 'local_pickup',
  carrier: 'Local Pickup',
  eta: 'Pick up at our store in Addis Ababa',
  price: 0,
  isLocalPickup: true,
};

// Fallback static rates (used before API responds)
const FALLBACK_SHIPPING: ShippingMethod[] = [
  LOCAL_PICKUP,
  { id: 'ups_expedited', carrier: 'UPS Worldwide Expedited®', eta: '4 business days', price: 8257 },
  { id: 'dhl_standard', carrier: 'DHL eCommerce Parcel Standard', eta: '11 to 19 business days', price: 10561 },
  { id: 'dhl_express', carrier: 'DHL Express Worldwide', eta: '3 to 4 business days', price: 18339 },
];

const PAYMENT_METHODS = [
  { id: 'stripe', name: 'Credit/Debit Card', desc: 'Visa, Mastercard, Amex' },
  { id: 'paypal', name: 'PayPal', desc: 'Pay with PayPal account' },
  { id: 'flutterwave', name: 'Flutterwave', desc: 'Cards, Mobile Money, Bank' },
  { id: 'chapa', name: 'Chapa', desc: 'Telebirr, CBE, Awash, Dashen' },
];

// Full world country list
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan',
  'Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia',
  'Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo (Brazzaville)','Congo (Kinshasa)',
  'Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Djibouti','Dominica','Dominican Republic','Ecuador',
  'Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France',
  'Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea','Guinea-Bissau',
  'Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland',
  'Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan',
  'Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar',
  'Malawi','Malaysia','Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia',
  'Moldova','Monaco','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal',
  'Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan',
  'Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar',
  'Romania','Russia','Rwanda','Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe','Saudi Arabia',
  'Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands','Somalia','South Africa',
  'South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan',
  'Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey','Turkmenistan',
  'Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Vanuatu','Vatican City',
  'Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

// Country dial codes — full world list, keyed by country name for auto-sync
const DIAL_CODES: { code: string; dial: string; flag: string; country: string }[] = [
  { code: 'AF', dial: '+93',   flag: '🇦🇫', country: 'Afghanistan' },
  { code: 'AL', dial: '+355',  flag: '🇦🇱', country: 'Albania' },
  { code: 'DZ', dial: '+213',  flag: '🇩🇿', country: 'Algeria' },
  { code: 'AD', dial: '+376',  flag: '🇦🇩', country: 'Andorra' },
  { code: 'AO', dial: '+244',  flag: '🇦🇴', country: 'Angola' },
  { code: 'AG', dial: '+1268', flag: '🇦🇬', country: 'Antigua and Barbuda' },
  { code: 'AR', dial: '+54',   flag: '🇦🇷', country: 'Argentina' },
  { code: 'AM', dial: '+374',  flag: '🇦🇲', country: 'Armenia' },
  { code: 'AU', dial: '+61',   flag: '🇦🇺', country: 'Australia' },
  { code: 'AT', dial: '+43',   flag: '🇦🇹', country: 'Austria' },
  { code: 'AZ', dial: '+994',  flag: '🇦🇿', country: 'Azerbaijan' },
  { code: 'BS', dial: '+1242', flag: '🇧🇸', country: 'Bahamas' },
  { code: 'BH', dial: '+973',  flag: '🇧🇭', country: 'Bahrain' },
  { code: 'BD', dial: '+880',  flag: '🇧🇩', country: 'Bangladesh' },
  { code: 'BB', dial: '+1246', flag: '🇧🇧', country: 'Barbados' },
  { code: 'BY', dial: '+375',  flag: '🇧🇾', country: 'Belarus' },
  { code: 'BE', dial: '+32',   flag: '🇧🇪', country: 'Belgium' },
  { code: 'BZ', dial: '+501',  flag: '🇧🇿', country: 'Belize' },
  { code: 'BJ', dial: '+229',  flag: '🇧🇯', country: 'Benin' },
  { code: 'BT', dial: '+975',  flag: '🇧🇹', country: 'Bhutan' },
  { code: 'BO', dial: '+591',  flag: '🇧🇴', country: 'Bolivia' },
  { code: 'BA', dial: '+387',  flag: '🇧🇦', country: 'Bosnia and Herzegovina' },
  { code: 'BW', dial: '+267',  flag: '🇧🇼', country: 'Botswana' },
  { code: 'BR', dial: '+55',   flag: '🇧🇷', country: 'Brazil' },
  { code: 'BN', dial: '+673',  flag: '🇧🇳', country: 'Brunei' },
  { code: 'BG', dial: '+359',  flag: '🇧🇬', country: 'Bulgaria' },
  { code: 'BF', dial: '+226',  flag: '🇧🇫', country: 'Burkina Faso' },
  { code: 'BI', dial: '+257',  flag: '🇧🇮', country: 'Burundi' },
  { code: 'CV', dial: '+238',  flag: '🇨🇻', country: 'Cabo Verde' },
  { code: 'KH', dial: '+855',  flag: '🇰🇭', country: 'Cambodia' },
  { code: 'CM', dial: '+237',  flag: '🇨🇲', country: 'Cameroon' },
  { code: 'CA', dial: '+1',    flag: '🇨🇦', country: 'Canada' },
  { code: 'CF', dial: '+236',  flag: '🇨🇫', country: 'Central African Republic' },
  { code: 'TD', dial: '+235',  flag: '🇹🇩', country: 'Chad' },
  { code: 'CL', dial: '+56',   flag: '🇨🇱', country: 'Chile' },
  { code: 'CN', dial: '+86',   flag: '🇨🇳', country: 'China' },
  { code: 'CO', dial: '+57',   flag: '🇨🇴', country: 'Colombia' },
  { code: 'KM', dial: '+269',  flag: '🇰🇲', country: 'Comoros' },
  { code: 'CG', dial: '+242',  flag: '🇨🇬', country: 'Congo (Brazzaville)' },
  { code: 'CD', dial: '+243',  flag: '🇨🇩', country: 'Congo (Kinshasa)' },
  { code: 'CR', dial: '+506',  flag: '🇨🇷', country: 'Costa Rica' },
  { code: 'HR', dial: '+385',  flag: '🇭🇷', country: 'Croatia' },
  { code: 'CU', dial: '+53',   flag: '🇨🇺', country: 'Cuba' },
  { code: 'CY', dial: '+357',  flag: '🇨🇾', country: 'Cyprus' },
  { code: 'CZ', dial: '+420',  flag: '🇨🇿', country: 'Czech Republic' },
  { code: 'DK', dial: '+45',   flag: '🇩🇰', country: 'Denmark' },
  { code: 'DJ', dial: '+253',  flag: '🇩🇯', country: 'Djibouti' },
  { code: 'DM', dial: '+1767', flag: '🇩🇲', country: 'Dominica' },
  { code: 'DO', dial: '+1809', flag: '🇩🇴', country: 'Dominican Republic' },
  { code: 'EC', dial: '+593',  flag: '🇪🇨', country: 'Ecuador' },
  { code: 'EG', dial: '+20',   flag: '🇪🇬', country: 'Egypt' },
  { code: 'SV', dial: '+503',  flag: '🇸🇻', country: 'El Salvador' },
  { code: 'GQ', dial: '+240',  flag: '🇬🇶', country: 'Equatorial Guinea' },
  { code: 'ER', dial: '+291',  flag: '🇪🇷', country: 'Eritrea' },
  { code: 'EE', dial: '+372',  flag: '🇪🇪', country: 'Estonia' },
  { code: 'SZ', dial: '+268',  flag: '🇸🇿', country: 'Eswatini' },
  { code: 'ET', dial: '+251',  flag: '🇪🇹', country: 'Ethiopia' },
  { code: 'FJ', dial: '+679',  flag: '🇫🇯', country: 'Fiji' },
  { code: 'FI', dial: '+358',  flag: '🇫🇮', country: 'Finland' },
  { code: 'FR', dial: '+33',   flag: '🇫🇷', country: 'France' },
  { code: 'GA', dial: '+241',  flag: '🇬🇦', country: 'Gabon' },
  { code: 'GM', dial: '+220',  flag: '🇬🇲', country: 'Gambia' },
  { code: 'GE', dial: '+995',  flag: '🇬🇪', country: 'Georgia' },
  { code: 'DE', dial: '+49',   flag: '🇩🇪', country: 'Germany' },
  { code: 'GH', dial: '+233',  flag: '🇬🇭', country: 'Ghana' },
  { code: 'GR', dial: '+30',   flag: '🇬🇷', country: 'Greece' },
  { code: 'GD', dial: '+1473', flag: '🇬🇩', country: 'Grenada' },
  { code: 'GT', dial: '+502',  flag: '🇬🇹', country: 'Guatemala' },
  { code: 'GN', dial: '+224',  flag: '🇬🇳', country: 'Guinea' },
  { code: 'GW', dial: '+245',  flag: '🇬🇼', country: 'Guinea-Bissau' },
  { code: 'GY', dial: '+592',  flag: '🇬🇾', country: 'Guyana' },
  { code: 'HT', dial: '+509',  flag: '🇭🇹', country: 'Haiti' },
  { code: 'HN', dial: '+504',  flag: '🇭🇳', country: 'Honduras' },
  { code: 'HU', dial: '+36',   flag: '🇭🇺', country: 'Hungary' },
  { code: 'IS', dial: '+354',  flag: '🇮🇸', country: 'Iceland' },
  { code: 'IN', dial: '+91',   flag: '🇮🇳', country: 'India' },
  { code: 'ID', dial: '+62',   flag: '🇮🇩', country: 'Indonesia' },
  { code: 'IR', dial: '+98',   flag: '🇮🇷', country: 'Iran' },
  { code: 'IQ', dial: '+964',  flag: '🇮🇶', country: 'Iraq' },
  { code: 'IE', dial: '+353',  flag: '🇮🇪', country: 'Ireland' },
  { code: 'IL', dial: '+972',  flag: '🇮🇱', country: 'Israel' },
  { code: 'IT', dial: '+39',   flag: '🇮🇹', country: 'Italy' },
  { code: 'JM', dial: '+1876', flag: '🇯🇲', country: 'Jamaica' },
  { code: 'JP', dial: '+81',   flag: '🇯🇵', country: 'Japan' },
  { code: 'JO', dial: '+962',  flag: '🇯🇴', country: 'Jordan' },
  { code: 'KZ', dial: '+7',    flag: '🇰🇿', country: 'Kazakhstan' },
  { code: 'KE', dial: '+254',  flag: '🇰🇪', country: 'Kenya' },
  { code: 'KI', dial: '+686',  flag: '🇰🇮', country: 'Kiribati' },
  { code: 'KW', dial: '+965',  flag: '🇰🇼', country: 'Kuwait' },
  { code: 'KG', dial: '+996',  flag: '🇰🇬', country: 'Kyrgyzstan' },
  { code: 'LA', dial: '+856',  flag: '🇱🇦', country: 'Laos' },
  { code: 'LV', dial: '+371',  flag: '🇱🇻', country: 'Latvia' },
  { code: 'LB', dial: '+961',  flag: '🇱🇧', country: 'Lebanon' },
  { code: 'LS', dial: '+266',  flag: '🇱🇸', country: 'Lesotho' },
  { code: 'LR', dial: '+231',  flag: '🇱🇷', country: 'Liberia' },
  { code: 'LY', dial: '+218',  flag: '🇱🇾', country: 'Libya' },
  { code: 'LI', dial: '+423',  flag: '🇱🇮', country: 'Liechtenstein' },
  { code: 'LT', dial: '+370',  flag: '🇱🇹', country: 'Lithuania' },
  { code: 'LU', dial: '+352',  flag: '🇱🇺', country: 'Luxembourg' },
  { code: 'MG', dial: '+261',  flag: '🇲🇬', country: 'Madagascar' },
  { code: 'MW', dial: '+265',  flag: '🇲🇼', country: 'Malawi' },
  { code: 'MY', dial: '+60',   flag: '🇲🇾', country: 'Malaysia' },
  { code: 'MV', dial: '+960',  flag: '🇲🇻', country: 'Maldives' },
  { code: 'ML', dial: '+223',  flag: '🇲🇱', country: 'Mali' },
  { code: 'MT', dial: '+356',  flag: '🇲🇹', country: 'Malta' },
  { code: 'MH', dial: '+692',  flag: '🇲🇭', country: 'Marshall Islands' },
  { code: 'MR', dial: '+222',  flag: '🇲🇷', country: 'Mauritania' },
  { code: 'MU', dial: '+230',  flag: '🇲🇺', country: 'Mauritius' },
  { code: 'MX', dial: '+52',   flag: '🇲🇽', country: 'Mexico' },
  { code: 'FM', dial: '+691',  flag: '🇫🇲', country: 'Micronesia' },
  { code: 'MD', dial: '+373',  flag: '🇲🇩', country: 'Moldova' },
  { code: 'MC', dial: '+377',  flag: '🇲🇨', country: 'Monaco' },
  { code: 'MN', dial: '+976',  flag: '🇲🇳', country: 'Mongolia' },
  { code: 'ME', dial: '+382',  flag: '🇲🇪', country: 'Montenegro' },
  { code: 'MA', dial: '+212',  flag: '🇲🇦', country: 'Morocco' },
  { code: 'MZ', dial: '+258',  flag: '🇲🇿', country: 'Mozambique' },
  { code: 'MM', dial: '+95',   flag: '🇲🇲', country: 'Myanmar' },
  { code: 'NA', dial: '+264',  flag: '🇳🇦', country: 'Namibia' },
  { code: 'NR', dial: '+674',  flag: '🇳🇷', country: 'Nauru' },
  { code: 'NP', dial: '+977',  flag: '🇳🇵', country: 'Nepal' },
  { code: 'NL', dial: '+31',   flag: '🇳🇱', country: 'Netherlands' },
  { code: 'NZ', dial: '+64',   flag: '🇳🇿', country: 'New Zealand' },
  { code: 'NI', dial: '+505',  flag: '🇳🇮', country: 'Nicaragua' },
  { code: 'NE', dial: '+227',  flag: '🇳🇪', country: 'Niger' },
  { code: 'NG', dial: '+234',  flag: '🇳🇬', country: 'Nigeria' },
  { code: 'KP', dial: '+850',  flag: '🇰🇵', country: 'North Korea' },
  { code: 'MK', dial: '+389',  flag: '🇲🇰', country: 'North Macedonia' },
  { code: 'NO', dial: '+47',   flag: '🇳🇴', country: 'Norway' },
  { code: 'OM', dial: '+968',  flag: '🇴🇲', country: 'Oman' },
  { code: 'PK', dial: '+92',   flag: '🇵🇰', country: 'Pakistan' },
  { code: 'PW', dial: '+680',  flag: '🇵🇼', country: 'Palau' },
  { code: 'PS', dial: '+970',  flag: '🇵🇸', country: 'Palestine' },
  { code: 'PA', dial: '+507',  flag: '🇵🇦', country: 'Panama' },
  { code: 'PG', dial: '+675',  flag: '🇵🇬', country: 'Papua New Guinea' },
  { code: 'PY', dial: '+595',  flag: '🇵🇾', country: 'Paraguay' },
  { code: 'PE', dial: '+51',   flag: '🇵🇪', country: 'Peru' },
  { code: 'PH', dial: '+63',   flag: '🇵🇭', country: 'Philippines' },
  { code: 'PL', dial: '+48',   flag: '🇵🇱', country: 'Poland' },
  { code: 'PT', dial: '+351',  flag: '🇵🇹', country: 'Portugal' },
  { code: 'QA', dial: '+974',  flag: '🇶🇦', country: 'Qatar' },
  { code: 'RO', dial: '+40',   flag: '🇷🇴', country: 'Romania' },
  { code: 'RU', dial: '+7',    flag: '🇷🇺', country: 'Russia' },
  { code: 'RW', dial: '+250',  flag: '🇷🇼', country: 'Rwanda' },
  { code: 'KN', dial: '+1869', flag: '🇰🇳', country: 'Saint Kitts and Nevis' },
  { code: 'LC', dial: '+1758', flag: '🇱🇨', country: 'Saint Lucia' },
  { code: 'VC', dial: '+1784', flag: '🇻🇨', country: 'Saint Vincent and the Grenadines' },
  { code: 'WS', dial: '+685',  flag: '🇼🇸', country: 'Samoa' },
  { code: 'SM', dial: '+378',  flag: '🇸🇲', country: 'San Marino' },
  { code: 'ST', dial: '+239',  flag: '🇸🇹', country: 'Sao Tome and Principe' },
  { code: 'SA', dial: '+966',  flag: '🇸🇦', country: 'Saudi Arabia' },
  { code: 'SN', dial: '+221',  flag: '🇸🇳', country: 'Senegal' },
  { code: 'RS', dial: '+381',  flag: '🇷🇸', country: 'Serbia' },
  { code: 'SC', dial: '+248',  flag: '🇸🇨', country: 'Seychelles' },
  { code: 'SL', dial: '+232',  flag: '🇸🇱', country: 'Sierra Leone' },
  { code: 'SG', dial: '+65',   flag: '🇸🇬', country: 'Singapore' },
  { code: 'SK', dial: '+421',  flag: '🇸🇰', country: 'Slovakia' },
  { code: 'SI', dial: '+386',  flag: '🇸🇮', country: 'Slovenia' },
  { code: 'SB', dial: '+677',  flag: '🇸🇧', country: 'Solomon Islands' },
  { code: 'SO', dial: '+252',  flag: '🇸🇴', country: 'Somalia' },
  { code: 'ZA', dial: '+27',   flag: '🇿🇦', country: 'South Africa' },
  { code: 'KR', dial: '+82',   flag: '🇰🇷', country: 'South Korea' },
  { code: 'SS', dial: '+211',  flag: '🇸🇸', country: 'South Sudan' },
  { code: 'ES', dial: '+34',   flag: '🇪🇸', country: 'Spain' },
  { code: 'LK', dial: '+94',   flag: '🇱🇰', country: 'Sri Lanka' },
  { code: 'SD', dial: '+249',  flag: '🇸🇩', country: 'Sudan' },
  { code: 'SR', dial: '+597',  flag: '🇸🇷', country: 'Suriname' },
  { code: 'SE', dial: '+46',   flag: '🇸🇪', country: 'Sweden' },
  { code: 'CH', dial: '+41',   flag: '🇨🇭', country: 'Switzerland' },
  { code: 'SY', dial: '+963',  flag: '🇸🇾', country: 'Syria' },
  { code: 'TW', dial: '+886',  flag: '🇹🇼', country: 'Taiwan' },
  { code: 'TJ', dial: '+992',  flag: '🇹🇯', country: 'Tajikistan' },
  { code: 'TZ', dial: '+255',  flag: '🇹🇿', country: 'Tanzania' },
  { code: 'TH', dial: '+66',   flag: '🇹🇭', country: 'Thailand' },
  { code: 'TL', dial: '+670',  flag: '🇹🇱', country: 'Timor-Leste' },
  { code: 'TG', dial: '+228',  flag: '🇹🇬', country: 'Togo' },
  { code: 'TO', dial: '+676',  flag: '🇹🇴', country: 'Tonga' },
  { code: 'TT', dial: '+1868', flag: '🇹🇹', country: 'Trinidad and Tobago' },
  { code: 'TN', dial: '+216',  flag: '🇹🇳', country: 'Tunisia' },
  { code: 'TR', dial: '+90',   flag: '🇹🇷', country: 'Turkey' },
  { code: 'TM', dial: '+993',  flag: '🇹🇲', country: 'Turkmenistan' },
  { code: 'TV', dial: '+688',  flag: '🇹🇻', country: 'Tuvalu' },
  { code: 'UG', dial: '+256',  flag: '🇺🇬', country: 'Uganda' },
  { code: 'UA', dial: '+380',  flag: '🇺🇦', country: 'Ukraine' },
  { code: 'AE', dial: '+971',  flag: '🇦🇪', country: 'United Arab Emirates' },
  { code: 'GB', dial: '+44',   flag: '🇬🇧', country: 'United Kingdom' },
  { code: 'US', dial: '+1',    flag: '🇺🇸', country: 'United States' },
  { code: 'UY', dial: '+598',  flag: '🇺🇾', country: 'Uruguay' },
  { code: 'UZ', dial: '+998',  flag: '🇺🇿', country: 'Uzbekistan' },
  { code: 'VU', dial: '+678',  flag: '🇻🇺', country: 'Vanuatu' },
  { code: 'VA', dial: '+39',   flag: '🇻🇦', country: 'Vatican City' },
  { code: 'VE', dial: '+58',   flag: '🇻🇪', country: 'Venezuela' },
  { code: 'VN', dial: '+84',   flag: '🇻🇳', country: 'Vietnam' },
  { code: 'YE', dial: '+967',  flag: '🇾🇪', country: 'Yemen' },
  { code: 'ZM', dial: '+260',  flag: '🇿🇲', country: 'Zambia' },
  { code: 'ZW', dial: '+263',  flag: '🇿🇼', country: 'Zimbabwe' },
];

const STEPS = ['Contact', 'Shipping', 'Payment'];

// ─── Stripe card form (inner component that uses Stripe hooks) ───────────────
function StripeCardForm({
  onPay,
  loading,
  total,
  currency,
}: {
  onPay: (confirmCard: () => Promise<string | null>) => void;
  loading: boolean;
  total: number;
  currency: string;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const confirmCard = async (): Promise<string | null> => {
    if (!stripe || !elements) return null;
    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return null;
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardNumber,
    });
    if (error) {
      toast.error(error.message || 'Card error');
      return null;
    }
    return paymentMethod?.id ?? null;
  };

  const stripeInputStyle = {
    style: {
      base: {
        fontSize: '14px',
        color: '#1a1008',
        fontFamily: 'inherit',
        '::placeholder': { color: '#a08060' },
      },
      invalid: { color: '#c0392b' },
    },
  };

  return (
    <div className="mt-4 space-y-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      <div className="space-y-1">
        <Label className="text-xs text-gray-500">Card number</Label>
        <div className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900">
          <CardNumberElement options={stripeInputStyle} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Expiry date</Label>
          <div className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900">
            <CardExpiryElement options={stripeInputStyle} />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-gray-500">Security code</Label>
          <div className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900">
            <CardCvcElement options={stripeInputStyle} />
          </div>
        </div>
      </div>
      <Button
        onClick={() => onPay(confirmCard)}
        disabled={loading || !stripe}
        className="w-full h-11 bg-violet-600 hover:bg-violet-700 mt-2"
      >
        <Lock className="w-4 h-4 mr-2" />
        {loading ? 'Processing...' : `Pay ${formatPrice(total, currency as any)}`}
      </Button>
    </div>
  );
}

// ─── Discount code input ─────────────────────────────────────────────────────
function DiscountInput() {
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);
  const { couponCode, applyCoupon, removeCoupon, getSubtotal, items } = useCartStore();

  const applyCode = async () => {
    if (!code.trim()) return;
    setApplying(true);
    try {
      const subtotal = getSubtotal();
      const cartItems = items.map((i) => ({
        productId: i.productId,
        price: i.price,
        quantity: i.quantity,
      }));
      const res = await api.post('/orders/validate-coupon', { code: code.trim(), subtotal, cartItems });
      const { coupon, discount } = res.data.data;
      applyCoupon(code.trim(), discount);
      toast.success(
        `Coupon applied! ${coupon?.type === 'percentage' ? `${coupon.value}% off` : `${formatPrice(coupon?.value ?? discount, 'ETB')} off`}`
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setApplying(false);
    }
  };

  if (couponCode) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">{couponCode}</span>
        </div>
        <button onClick={removeCoupon} className="text-green-600 hover:text-green-800">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Discount code or gift card"
        className="flex-1 h-9 text-sm"
        onKeyDown={(e) => e.key === 'Enter' && applyCode()}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={applyCode}
        disabled={applying || !code.trim()}
        className="h-9 px-4 text-sm"
      >
        {applying ? '...' : 'Apply'}
      </Button>
    </div>
  );
}

// ─── Phone with dial code picker ─────────────────────────────────────────────
function PhoneInput({
  value,
  onChange,
  countryName,
}: {
  value: string;
  onChange: (val: string) => void;
  countryName?: string;
}) {
  const [dialCode, setDialCode] = useState('+251');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [localNumber, setLocalNumber] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Auto-sync dial code when country changes
  useEffect(() => {
    if (!countryName) return;
    const match = DIAL_CODES.find((d) => d.country === countryName);
    if (match && match.dial !== dialCode) {
      setDialCode(match.dial);
      onChange(`${match.dial}${localNumber}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryName]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNumberChange = (num: string) => {
    setLocalNumber(num);
    onChange(`${dialCode}${num}`);
  };

  const handleDialChange = (dial: string) => {
    setDialCode(dial);
    onChange(`${dial}${localNumber}`);
    setOpen(false);
    setSearch('');
  };

  const selected = DIAL_CODES.find((d) => d.dial === dialCode && d.country === countryName)
    || DIAL_CODES.find((d) => d.dial === dialCode)
    || DIAL_CODES[0];

  const filtered = DIAL_CODES.filter((d) =>
    d.country.toLowerCase().includes(search.toLowerCase()) ||
    d.dial.includes(search)
  );

  return (
    <div ref={ref} className="flex relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setSearch(''); }}
        className="flex items-center gap-1.5 px-3 h-10 border border-r-0 rounded-l-lg bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[80px]"
      >
        <span>{selected.flag}</span>
        <span className="text-xs text-gray-600 dark:text-gray-400">{dialCode}</span>
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>
      <Input
        value={localNumber}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder="911 000 000"
        className="flex-1 rounded-l-none h-10"
        type="tel"
      />
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden w-64">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country or code..."
              className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((d) => (
              <button
                key={`${d.code}-${d.dial}`}
                type="button"
                onClick={() => handleDialChange(d.dial)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors ${
                  selected.code === d.code
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-base">{d.flag}</span>
                <span className="flex-1 truncate text-xs">{d.country}</span>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">{d.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Country select dropdown ─────────────────────────────────────────────────
function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = COUNTRIES.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setSearch(''); }}
        className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-left flex items-center justify-between hover:border-gray-300 dark:hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
      >
        <span className={value ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>{value || 'Select country'}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search country..."
              className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No countries found</p>
            ) : (
              filtered.map((country) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => { onChange(country); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    value === country
                      ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {country}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main checkout page ──────────────────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { items, getSubtotal, getTotal, couponCode, discount, clearCart, applyCoupon } = useCartStore();
  const { currency } = useSiteSettings();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('stripe');
  const [stripeClientSecret, setStripeClientSecret] = useState('');
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>(FALLBACK_SHIPPING);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState(LOCAL_PICKUP.id);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [saveInfo, setSaveInfo] = useState(false);
  const [useSameAsBilling, setUseSameAsBilling] = useState(true);
  const [discountOpen, setDiscountOpen] = useState(false);

  const [contact, setContact] = useState({
    email: user?.email || '',
  });

  const [shippingAddress, setShippingAddress] = useState({
    firstName: '',
    lastName: '',
    street: '',
    apartment: '',
    city: '',
    country: 'Ethiopia',
    zipCode: '',
    phone: '',
  });

  const [billingAddress, setBillingAddress] = useState({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    country: 'Ethiopia',
    zipCode: '',
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      router.push('/cart');
    }
  }, [items]);

  useEffect(() => {
    if (user?.email) setContact((c) => ({ ...c, email: user.email }));
  }, [user]);

  // Fetch dynamic shipping rates based on cart items
  useEffect(() => {
    if (items.length === 0) return;
    const fetchRates = async () => {
      setShippingLoading(true);
      try {
        const itemsParam = items.map((i) => `${i.productId}:${i.quantity}`).join(',');
        const res = await api.get(`/shipping/rates?items=${encodeURIComponent(itemsParam)}`);
        const rates: ShippingMethod[] = res.data.data
          .filter((r: any) => r.isActive)
          .map((r: any) => ({
            id: r.carrierId,
            carrier: r.carrierName,
            eta: r.etaMin === r.etaMax
              ? `${r.etaMin} business day${r.etaMin !== 1 ? 's' : ''}`
              : `${r.etaMin} to ${r.etaMax} business days`,
            price: r.calculatedPrice ?? r.basePrice ?? 0,
          }));
        if (rates.length > 0) {
          setShippingMethods([LOCAL_PICKUP, ...rates]);
          setSelectedShipping(LOCAL_PICKUP.id);
        }
      } catch {
        // Keep fallback rates
      } finally {
        setShippingLoading(false);
      }
    };
    fetchRates();
  }, [items]);

  // When country changes away from Ethiopia, auto-switch off local pickup
  const handleCountryChange = (country: string) => {
    setShippingAddress((p) => ({ ...p, country }));
    if (country !== 'Ethiopia' && selectedShipping === 'local_pickup') {
      const firstNonLocal = shippingMethods.find((m) => !m.isLocalPickup);
      if (firstNonLocal) setSelectedShipping(firstNonLocal.id);
    }
    if (country === 'Ethiopia' && selectedShipping !== 'local_pickup') {
      setSelectedShipping(LOCAL_PICKUP.id);
    }
  };

  const selectedShippingMethod = shippingMethods.find((m) => m.id === selectedShipping) || shippingMethods[0];
  const subtotal = mounted ? getSubtotal() : 0;
  const shippingCost = selectedShippingMethod.price;
  const total = subtotal + shippingCost - (mounted ? discount : 0);

  const createOrder = async () => {
    setLoading(true);
    try {
      const res = await api.post('/orders', {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variant: item.variant,
        })),
        shippingAddress: {
          name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
          street: shippingAddress.street + (shippingAddress.apartment ? `, ${shippingAddress.apartment}` : ''),
          city: shippingAddress.city,
          state: shippingAddress.country,
          country: shippingAddress.country,
          zipCode: shippingAddress.zipCode,
          phone: shippingAddress.phone,
        },
        couponCode,
        paymentMethod: selectedPayment,
        shippingMethod: selectedShipping,
      });
      const oid = res.data.data._id;
      setOrderId(oid);
      return oid;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create order');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (confirmCard?: () => Promise<string | null>) => {
    setLoading(true);
    try {
      const oid = orderId || (await createOrder());
      if (!oid) return;

      if (selectedPayment === 'stripe') {
        const res = await api.post('/payments/stripe/create-intent', { orderId: oid });
        const { clientSecret } = res.data.data;

        if (confirmCard) {
          // Real Stripe card collection
          const pmId = await confirmCard();
          if (!pmId) { setLoading(false); return; }

          const stripeInstance = await stripePromise;
          if (!stripeInstance) { toast.error('Stripe not loaded'); setLoading(false); return; }

          const { error, paymentIntent } = await stripeInstance.confirmCardPayment(clientSecret, {
            payment_method: pmId,
          });

          if (error) {
            toast.error(error.message || 'Payment failed');
            setLoading(false);
            return;
          }

          if (paymentIntent?.status === 'succeeded') {
            clearCart();
            router.push(`/checkout/success?orderId=${oid}`);
            return;
          }
        } else {
          // Fallback: no Stripe key configured
          toast.success('Order placed! (Stripe not configured — test mode)');
          setStep(3);
          setTimeout(() => { clearCart(); router.push(`/checkout/success?orderId=${oid}`); }, 1500);
          return;
        }
      } else if (selectedPayment === 'paypal') {
        const res = await api.post('/payments/paypal/create-order', { orderId: oid });
        if (res.data.data.approvalUrl) window.location.href = res.data.data.approvalUrl;
      } else if (selectedPayment === 'flutterwave') {
        const res = await api.post('/payments/flutterwave/initiate', {
          orderId: oid,
          customerEmail: contact.email || user?.email,
          customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim() || user?.name,
          customerPhone: shippingAddress.phone,
        });
        if (res.data.data.paymentLink) window.location.href = res.data.data.paymentLink;
      } else if (selectedPayment === 'chapa') {
        const res = await api.post('/payments/chapa/initiate', {
          orderId: oid,
          customerEmail: contact.email || user?.email,
          customerFirstName: shippingAddress.firstName || user?.name?.split(' ')[0],
          customerLastName: shippingAddress.lastName || user?.name?.split(' ').slice(1).join(' ') || 'User',
          customerPhone: shippingAddress.phone,
          currency: 'ETB',
        });
        if (res.data.data.checkoutUrl) window.location.href = res.data.data.checkoutUrl;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const isContactValid = contact.email.includes('@');
  const isLocalPickup = selectedShipping === 'local_pickup';
  const isShippingValid = isLocalPickup
    ? shippingAddress.firstName && shippingAddress.lastName && shippingAddress.phone
    : shippingAddress.firstName &&
      shippingAddress.lastName &&
      shippingAddress.street &&
      shippingAddress.city &&
      shippingAddress.country;

  // ── Render ──────────────────────────────────────────────────────────────────

  // Auth gate — shown to guests before they can proceed to checkout
  if (mounted && !isAuthenticated) {
    const cartSubtotal = getSubtotal();
    const cartTotal = getTotal();
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col lg:flex-row gap-8 items-start justify-center">

            {/* Left: sign in / create account */}
            <div className="w-full lg:max-w-md">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8"
              >
                {/* Logo / brand */}
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sign in or create an account</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter your email to sign in or create an account</p>
                </div>

                {/* Email input (visual only — directs to login) */}
                <div className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Email"
                      className="pl-10 h-11"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') router.push('/login?redirect=/checkout');
                      }}
                    />
                  </div>

                  <Button
                    className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-sm font-semibold"
                    onClick={() => router.push('/login?redirect=/checkout')}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Continue
                  </Button>

                  <div className="relative flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    <span className="text-xs text-gray-400">or</span>
                    <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full h-11 text-sm font-semibold"
                    onClick={() => router.push('/register?redirect=/checkout')}
                  >
                    Create Account
                  </Button>
                </div>

                <p className="text-xs text-center text-gray-400 mt-5">
                  By continuing, you agree to our{' '}
                  <Link href="#" className="underline hover:text-gray-600">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="#" className="underline hover:text-gray-600">Privacy Policy</Link>
                </p>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => router.back()}
                    className="text-sm text-gray-400 hover:text-gray-600 underline"
                  >
                    Back
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Right: order summary */}
            <div className="w-full lg:max-w-sm">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> Order Summary
                </h3>
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.variant}`} className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-lg object-cover border border-gray-100"
                        />
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                        {item.variant && <p className="text-xs text-gray-400">{item.variant}</p>}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatPrice(item.price * item.quantity, currency)}
                      </p>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(cartSubtotal, currency)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount {couponCode && `(${couponCode})`}</span>
                      <span>-{formatPrice(discount, currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span className="text-gray-400">Calculated at next step</span>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-bold text-base text-gray-900 dark:text-white">
                  <span>Total</span>
                  <span>{formatPrice(cartTotal, currency)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h1>
          </div>

          {/* Express checkout */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Express checkout</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => { setSelectedPayment('paypal'); handlePayment(); }}
                  className="h-11 rounded-lg flex items-center justify-center font-bold text-sm transition-opacity hover:opacity-80"
                  style={{ background: '#003087', color: '#fff' }}
                >
                  <span className="text-[#009cde]">Pay</span><span className="text-white ml-0.5">Pal</span>
                </button>
                <button
                  onClick={() => { setSelectedPayment('chapa'); handlePayment(); }}
                  className="h-11 rounded-lg flex items-center justify-center font-bold text-sm transition-opacity hover:opacity-80"
                  style={{ background: '#1a7f37', color: '#fff' }}
                >
                  🇪🇹 Chapa
                </button>
                <button
                  onClick={() => { setSelectedPayment('flutterwave'); handlePayment(); }}
                  className="h-11 rounded-lg flex items-center justify-center font-bold text-sm transition-opacity hover:opacity-80"
                  style={{ background: '#f5a623', color: '#fff' }}
                >
                  🌍 Flutterwave
                </button>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-400 uppercase tracking-wide">OR</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              <AnimatePresence mode="wait">

                {/* ── Step 0: Contact ── */}
                {step === 0 && (
                  <motion.div key="contact" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Mail className="w-4 h-4 text-violet-600" /> Contact
                        </h2>
                        {!isAuthenticated && (
                          <Link href="/login?redirect=/checkout" className="text-sm text-violet-600 hover:underline flex items-center gap-1">
                            <LogIn className="w-3.5 h-3.5" /> Sign in
                          </Link>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={contact.email}
                            onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                            placeholder="you@example.com"
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={marketingOptIn}
                            onChange={(e) => setMarketingOptIn(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Email me with news and offers</span>
                        </label>
                      </div>
                    </div>

                    {/* Delivery / Shipping Address */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm mt-4">
                      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-violet-600" /> {isLocalPickup ? 'Your contact details' : 'Delivery'}
                      </h2>
                      {isLocalPickup && (
                        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-400 flex items-center gap-2">
                          <Store className="w-4 h-4 flex-shrink-0" />
                          You chose local pickup — no delivery address needed. Just provide your name and phone so we can notify you.
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1.5">
                          <Label>Country / Region</Label>
                          <CountrySelect
                            value={shippingAddress.country}
                            onChange={handleCountryChange}
                          />
                          {shippingAddress.country && shippingAddress.country !== 'Ethiopia' && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1">
                              <Truck className="w-3 h-3" />
                              International shipping rates apply. Select a shipping method in the next step.
                            </p>
                          )}
                        </div>
                        <div className="col-span-2 grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label>First name</Label>
                            <Input
                              value={shippingAddress.firstName}
                              onChange={(e) => setShippingAddress((p) => ({ ...p, firstName: e.target.value }))}
                              placeholder="Abebe"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Last name</Label>
                            <Input
                              value={shippingAddress.lastName}
                              onChange={(e) => setShippingAddress((p) => ({ ...p, lastName: e.target.value }))}
                              placeholder="Girma"
                            />
                          </div>
                        </div>
                        {!isLocalPickup && (
                          <>
                            <div className="col-span-2 space-y-1.5">
                              <Label>Address</Label>
                              <Input
                                value={shippingAddress.street}
                                onChange={(e) => setShippingAddress((p) => ({ ...p, street: e.target.value }))}
                                placeholder="123 Bole Road"
                              />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                              <Label>Apartment, suite, etc. <span className="text-gray-400">(optional)</span></Label>
                              <Input
                                value={shippingAddress.apartment}
                                onChange={(e) => setShippingAddress((p) => ({ ...p, apartment: e.target.value }))}
                                placeholder="Apt 4B"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>City</Label>
                              <Input
                                value={shippingAddress.city}
                                onChange={(e) => setShippingAddress((p) => ({ ...p, city: e.target.value }))}
                                placeholder="Addis Ababa"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Postal code <span className="text-gray-400">(optional)</span></Label>
                              <Input
                                value={shippingAddress.zipCode}
                                onChange={(e) => setShippingAddress((p) => ({ ...p, zipCode: e.target.value }))}
                                placeholder="1000"
                              />
                            </div>
                          </>
                        )}
                        <div className="col-span-2 space-y-1.5">
                          <Label>Phone</Label>
                          <PhoneInput
                            value={shippingAddress.phone}
                            onChange={(val) => setShippingAddress((p) => ({ ...p, phone: val }))}
                            countryName={shippingAddress.country}
                          />
                        </div>
                      </div>

                      {/* Save info */}
                      <label className="flex items-center gap-2 cursor-pointer mt-4">
                        <input
                          type="checkbox"
                          checked={saveInfo}
                          onChange={(e) => setSaveInfo(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Save my information for a faster checkout</span>
                      </label>
                    </div>

                    <Button
                      onClick={() => setStep(1)}
                      disabled={!isContactValid || !isShippingValid}
                      className="w-full mt-4 h-11 bg-violet-600 hover:bg-violet-700"
                    >
                      Continue to shipping <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </motion.div>
                )}

                {/* ── Step 1: Shipping Method ── */}
                {step === 1 && (
                  <motion.div key="shipping" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                        <Truck className="w-4 h-4 text-violet-600" /> Shipping method
                      </h2>
                      <p className="text-xs text-gray-500 mb-4">
                        {shippingLoading ? 'Calculating rates for your items…' : (
                          shippingAddress.country && shippingAddress.country !== 'Ethiopia'
                            ? `Showing international rates for ${shippingAddress.country}`
                            : 'Choose a shipping method'
                        )}
                      </p>
                      <div className="space-y-3">
                        {shippingMethods.filter((m) =>
                          shippingAddress.country === 'Ethiopia' || !m.isLocalPickup
                        ).map((method) => (
                          <button
                            key={method.id}
                            onClick={() => setSelectedShipping(method.id)}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                              selectedShipping === method.id
                                ? method.isLocalPickup
                                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                  : 'border-violet-600 bg-violet-50 dark:bg-violet-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                selectedShipping === method.id
                                  ? method.isLocalPickup ? 'border-green-500' : 'border-violet-600'
                                  : 'border-gray-300'
                              }`}>
                                {selectedShipping === method.id && (
                                  <div className={`w-2.5 h-2.5 rounded-full ${method.isLocalPickup ? 'bg-green-500' : 'bg-violet-600'}`} />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                  {method.isLocalPickup && <Store className="w-3.5 h-3.5 text-green-600" />}
                                  {method.carrier}
                                  {method.isLocalPickup && (
                                    <span className="text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 px-2 py-0.5 rounded-full">
                                      Recommended for locals
                                    </span>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">{method.eta}</p>
                              </div>
                            </div>
                            <span className={`font-semibold text-sm ${method.isLocalPickup ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                              {method.price === 0 ? 'Free' : formatPrice(method.price, currency)}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Local pickup info banner */}
                      {selectedShipping === 'local_pickup' && (
                        <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex gap-3">
                          <Store className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-green-800 dark:text-green-300">Store pickup details</p>
                            <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">Bole Road, Addis Ababa — Open Mon–Sat 9 AM to 6 PM</p>
                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">You will receive an SMS when your order is ready for pickup.</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-3 mt-4">
                      <Button variant="outline" onClick={() => setStep(0)} className="flex-1">Back</Button>
                      <Button onClick={() => setStep(2)} className="flex-1 bg-violet-600 hover:bg-violet-700">
                        Continue to payment <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Payment ── */}
                {step === 2 && (
                  <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
                      <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-violet-600" /> Payment
                      </h2>
                      <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> All transactions are secure and encrypted.
                      </p>

                      <div className="space-y-3">
                        {PAYMENT_METHODS.map((method) => (
                          <div key={method.id}>
                            <button
                              onClick={() => setSelectedPayment(method.id)}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                selectedPayment === method.id
                                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                  selectedPayment === method.id ? 'border-violet-600' : 'border-gray-300'
                                }`}>
                                  {selectedPayment === method.id && (
                                    <div className="w-2.5 h-2.5 bg-violet-600 rounded-full" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-gray-900 dark:text-white">{method.name}</p>
                                  <p className="text-xs text-gray-500">{method.desc}</p>
                                </div>
                                {method.id === 'stripe' && (
                                  <div className="flex gap-1">
                                    {['VISA', 'MC', 'AMEX'].map((card) => (
                                      <span key={card} className="text-xs px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 font-mono">{card}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </button>

                            {/* Stripe Elements inline card form */}
                            {selectedPayment === 'stripe' && method.id === 'stripe' && stripePromise && (
                              <Elements stripe={stripePromise}>
                                <StripeCardForm
                                  onPay={(confirmCard) => handlePayment(confirmCard)}
                                  loading={loading}
                                  total={total}
                                  currency={currency}
                                />
                              </Elements>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Billing address toggle */}
                      <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useSameAsBilling}
                            onChange={(e) => setUseSameAsBilling(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Use shipping address as billing address</span>
                        </label>

                        {!useSameAsBilling && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 grid grid-cols-2 gap-3"
                          >
                            <div className="col-span-2 grid grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <Label>First name</Label>
                                <Input value={billingAddress.firstName} onChange={(e) => setBillingAddress((p) => ({ ...p, firstName: e.target.value }))} />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Last name</Label>
                                <Input value={billingAddress.lastName} onChange={(e) => setBillingAddress((p) => ({ ...p, lastName: e.target.value }))} />
                              </div>
                            </div>
                            <div className="col-span-2 space-y-1.5">
                              <Label>Address</Label>
                              <Input value={billingAddress.street} onChange={(e) => setBillingAddress((p) => ({ ...p, street: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                              <Label>City</Label>
                              <Input value={billingAddress.city} onChange={(e) => setBillingAddress((p) => ({ ...p, city: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Postal code</Label>
                              <Input value={billingAddress.zipCode} onChange={(e) => setBillingAddress((p) => ({ ...p, zipCode: e.target.value }))} />
                            </div>
                            <div className="col-span-2 space-y-1.5">
                              <Label>Country</Label>
                              <CountrySelect
                                value={billingAddress.country}
                                onChange={(val) => setBillingAddress((p) => ({ ...p, country: val }))}
                              />
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Pay button for non-Stripe methods */}
                    {selectedPayment !== 'stripe' && (
                      <Button
                        onClick={() => handlePayment()}
                        disabled={loading}
                        className="w-full mt-4 h-11 bg-violet-600 hover:bg-violet-700"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        {loading ? 'Processing...' : `Pay ${formatPrice(total, currency)}`}
                      </Button>
                    )}

                    {/* Stripe fallback if no key configured */}
                    {selectedPayment === 'stripe' && !stripePromise && (
                      <Button
                        onClick={() => handlePayment()}
                        disabled={loading}
                        className="w-full mt-4 h-11 bg-violet-600 hover:bg-violet-700"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        {loading ? 'Processing...' : `Pay ${formatPrice(total, currency)}`}
                      </Button>
                    )}

                    <Button variant="outline" onClick={() => setStep(1)} className="w-full mt-2">
                      Back
                    </Button>
                  </motion.div>
                )}

                {/* ── Step 3: Confirmed ── */}
                {step === 3 && (
                  <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm text-center">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Order Confirmed!</h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Thank you for your purchase. You'll receive a confirmation email shortly.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button asChild className="bg-violet-600 hover:bg-violet-700">
                          <Link href="/dashboard/orders">View Orders</Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/shop">Continue Shopping</Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Order Summary Sidebar ── */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm sticky top-24">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-violet-600" /> Order summary
                </h3>

                {/* Items */}
                <div className="space-y-3 mb-4">
                  {mounted && items.map((item) => (
                    <div key={`${item.productId}-${item.variant}`} className="flex gap-3">
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                          )}
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{item.name}</p>
                        {item.variant && <p className="text-xs text-gray-500">{item.variant}</p>}
                      </div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatPrice(item.price * item.quantity, currency)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Discount code */}
                <div className="mb-4">
                  <button
                    onClick={() => setDiscountOpen((v) => !v)}
                    className="flex items-center gap-2 text-sm text-violet-600 hover:text-violet-700 w-full"
                  >
                    <Tag className="w-4 h-4" />
                    <span>Discount code or gift card</span>
                    <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${discountOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {discountOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2"
                    >
                      <DiscountInput />
                    </motion.div>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Cost summary */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span>{formatPrice(subtotal, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                    <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                      {shippingCost === 0 ? 'Free' : formatPrice(shippingCost, currency)}
                    </span>
                  </div>
                  {mounted && discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-{formatPrice(discount, currency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-violet-600">{formatPrice(total, currency)}</span>
                  </div>
                </div>

                {/* Security note */}
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Secure & encrypted checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
