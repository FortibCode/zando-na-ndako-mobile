export interface CountryInfo {
  id: string;
  label: string;
  flag: string;
  dialCode: string; // e.g. "+242"
  digitLength: {
    min: number;
    max: number;
  };
  example: string; // e.g. "06 123 4567"
}

export const DEFAULT_COUNTRY: CountryInfo = {
  id: 'cg',
  label: 'Congo-Brazzaville',
  flag: '🇨🇬',
  dialCode: '+242',
  digitLength: { min: 9, max: 9 },
  example: '06 123 45 67',
};

export const COUNTRIES: CountryInfo[] = [
  DEFAULT_COUNTRY,
  { id: 'cd', label: 'Congo-Kinshasa (RDC)', flag: '🇨🇩', dialCode: '+243', digitLength: { min: 9, max: 9 }, example: '81 234 56 78' },
  { id: 'fr', label: 'France', flag: '🇫🇷', dialCode: '+33', digitLength: { min: 9, max: 9 }, example: '6 12 34 56 78' },
  { id: 'be', label: 'Belgique', flag: '🇧🇪', dialCode: '+32', digitLength: { min: 8, max: 9 }, example: '470 12 34 56' },
  { id: 'ca', label: 'Canada', flag: '🇨🇦', dialCode: '+1', digitLength: { min: 10, max: 10 }, example: '514 123 4567' },
  { id: 'us', label: 'États-Unis', flag: '🇺🇸', dialCode: '+1', digitLength: { min: 10, max: 10 }, example: '202 555 0123' },
  { id: 'ch', label: 'Suisse', flag: '🇨🇭', dialCode: '+41', digitLength: { min: 9, max: 9 }, example: '79 123 45 67' },
  { id: 'cm', label: 'Cameroun', flag: '🇨🇲', dialCode: '+237', digitLength: { min: 9, max: 9 }, example: '6 71 23 45 67' },
  { id: 'ci', label: 'Côte d’Ivoire', flag: '🇨🇮', dialCode: '+225', digitLength: { min: 10, max: 10 }, example: '07 01 23 45 67' },
  { id: 'ga', label: 'Gabon', flag: '🇬🇦', dialCode: '+241', digitLength: { min: 7, max: 8 }, example: '66 12 34 56' },
  { id: 'sn', label: 'Sénégal', flag: '🇸🇳', dialCode: '+221', digitLength: { min: 9, max: 9 }, example: '77 123 45 67' },
  { id: 'ma', label: 'Maroc', flag: '🇲🇦', dialCode: '+212', digitLength: { min: 9, max: 9 }, example: '6 12 34 56 78' },
  { id: 'tn', label: 'Tunisie', flag: '🇹🇳', dialCode: '+216', digitLength: { min: 8, max: 8 }, example: '20 123 456' },
  { id: 'gb', label: 'Royaume-Uni', flag: '🇬🇧', dialCode: '+44', digitLength: { min: 10, max: 10 }, example: '7911 123456' },
  { id: 'de', label: 'Allemagne', flag: '🇩🇪', dialCode: '+49', digitLength: { min: 10, max: 11 }, example: '151 12345678' },
  { id: 'it', label: 'Italie', flag: '🇮🇹', dialCode: '+39', digitLength: { min: 9, max: 10 }, example: '312 345 6789' },
  { id: 'es', label: 'Espagne', flag: '🇪🇸', dialCode: '+34', digitLength: { min: 9, max: 9 }, example: '612 34 56 78' },
  { id: 'pt', label: 'Portugal', flag: '🇵🇹', dialCode: '+351', digitLength: { min: 9, max: 9 }, example: '912 345 678' },
  { id: 'ao', label: 'Angola', flag: '🇦🇴', dialCode: '+244', digitLength: { min: 9, max: 9 }, example: '912 345 678' },
  { id: 'za', label: 'Afrique du Sud', flag: '🇿🇦', dialCode: '+27', digitLength: { min: 9, max: 9 }, example: '82 123 4567' },
  { id: 'bj', label: 'Bénin', flag: '🇧🇯', dialCode: '+229', digitLength: { min: 8, max: 8 }, example: '97 12 34 56' },
  { id: 'bf', label: 'Burkina Faso', flag: '🇧🇫', dialCode: '+226', digitLength: { min: 8, max: 8 }, example: '70 12 34 56' },
  { id: 'tg', label: 'Togo', flag: '🇹🇬', dialCode: '+228', digitLength: { min: 8, max: 8 }, example: '90 12 34 56' },
  { id: 'ml', label: 'Mali', flag: '🇲🇱', dialCode: '+223', digitLength: { min: 8, max: 8 }, example: '66 12 34 56' },
  { id: 'gn', label: 'Guinée', flag: '🇬🇳', dialCode: '+224', digitLength: { min: 9, max: 9 }, example: '621 12 34 56' },
  { id: 'ne', label: 'Niger', flag: '🇳🇪', dialCode: '+227', digitLength: { min: 8, max: 8 }, example: '90 12 34 56' },
  { id: 'td', label: 'Tchad', flag: '🇹🇩', dialCode: '+235', digitLength: { min: 8, max: 8 }, example: '66 12 34 56' },
  { id: 'cf', label: 'République centrafricaine', flag: '🇨🇫', dialCode: '+236', digitLength: { min: 8, max: 8 }, example: '75 12 34 56' },
  { id: 'gq', label: 'Guinée équatoriale', flag: '🇬🇶', dialCode: '+240', digitLength: { min: 9, max: 9 }, example: '222 12 34 56' },
  { id: 'rw', label: 'Rwanda', flag: '🇷🇼', dialCode: '+250', digitLength: { min: 9, max: 9 }, example: '78 123 4567' },
  { id: 'bi', label: 'Burundi', flag: '🇧🇮', dialCode: '+257', digitLength: { min: 8, max: 8 }, example: '79 12 34 56' },
  { id: 'ke', label: 'Kenya', flag: '🇰🇪', dialCode: '+254', digitLength: { min: 9, max: 9 }, example: '712 345 678' },
  { id: 'tz', label: 'Tanzanie', flag: '🇹🇿', dialCode: '+255', digitLength: { min: 9, max: 9 }, example: '712 345 678' },
  { id: 'ug', label: 'Ouganda', flag: '🇺🇬', dialCode: '+256', digitLength: { min: 9, max: 9 }, example: '772 123 456' },
  { id: 'gh', label: 'Ghana', flag: '🇬🇭', dialCode: '+233', digitLength: { min: 9, max: 9 }, example: '24 123 4567' },
  { id: 'ng', label: 'Nigéria', flag: '🇳🇬', dialCode: '+234', digitLength: { min: 10, max: 10 }, example: '802 123 4567' },
  { id: 'dz', label: 'Algérie', flag: '🇩🇿', dialCode: '+213', digitLength: { min: 9, max: 9 }, example: '550 12 34 56' },
  { id: 'eg', label: 'Égypte', flag: '🇪🇬', dialCode: '+20', digitLength: { min: 10, max: 10 }, example: '100 123 4567' },
  { id: 'tr', label: 'Turquie', flag: '🇹🇷', dialCode: '+90', digitLength: { min: 10, max: 10 }, example: '501 123 45 67' },
  { id: 'ae', label: 'Émirats arabes unis', flag: '🇦🇪', dialCode: '+971', digitLength: { min: 9, max: 9 }, example: '50 123 4567' },
  { id: 'sa', label: 'Arabie saoudite', flag: '🇸🇦', dialCode: '+966', digitLength: { min: 9, max: 9 }, example: '50 123 4567' },
  { id: 'cn', label: 'Chine', flag: '🇨🇳', dialCode: '+86', digitLength: { min: 11, max: 11 }, example: '138 1234 5678' },
  { id: 'in', label: 'Inde', flag: '🇮🇳', dialCode: '+91', digitLength: { min: 10, max: 10 }, example: '98123 45678' },
  { id: 'br', label: 'Brésil', flag: '🇧🇷', dialCode: '+55', digitLength: { min: 11, max: 11 }, example: '11 91234 5678' },
  { id: 'ru', label: 'Russie', flag: '🇷🇺', dialCode: '+7', digitLength: { min: 10, max: 10 }, example: '912 345 67 89' },
  { id: 'jp', label: 'Japon', flag: '🇯🇵', dialCode: '+81', digitLength: { min: 10, max: 10 }, example: '90 1234 5678' },
  { id: 'kr', label: 'Corée du Sud', flag: '🇰🇷', dialCode: '+82', digitLength: { min: 10, max: 10 }, example: '10 1234 5678' },
  { id: 'au', label: 'Australie', flag: '🇦🇺', dialCode: '+61', digitLength: { min: 9, max: 9 }, example: '412 345 678' },
  { id: 'lu', label: 'Luxembourg', flag: '🇱🇺', dialCode: '+352', digitLength: { min: 9, max: 9 }, example: '621 123 456' },
  { id: 'nl', label: 'Pays-Bas', flag: '🇳🇱', dialCode: '+31', digitLength: { min: 9, max: 9 }, example: '6 12345678' },
  { id: 'se', label: 'Suède', flag: '🇸🇪', dialCode: '+46', digitLength: { min: 9, max: 9 }, example: '70 123 45 67' },
  { id: 'no', label: 'Norvège', flag: '🇳🇴', dialCode: '+47', digitLength: { min: 8, max: 8 }, example: '412 34 567' },
  { id: 'dk', label: 'Danemark', flag: '🇩🇰', dialCode: '+45', digitLength: { min: 8, max: 8 }, example: '20 12 34 56' },
  { id: 'fi', label: 'Finlande', flag: '🇫🇮', dialCode: '+358', digitLength: { min: 9, max: 10 }, example: '40 123 4567' },
  { id: 'ie', label: 'Irlande', flag: '🇮🇪', dialCode: '+353', digitLength: { min: 9, max: 9 }, example: '83 123 4567' },
  { id: 'pl', label: 'Pologne', flag: '🇵🇱', dialCode: '+48', digitLength: { min: 9, max: 9 }, example: '512 345 678' },
  { id: 'ro', label: 'Roumanie', flag: '🇷🇴', dialCode: '+40', digitLength: { min: 9, max: 9 }, example: '712 345 678' },
  { id: 'gr', label: 'Grèce', flag: '🇬🇷', dialCode: '+30', digitLength: { min: 10, max: 10 }, example: '691 234 5678' },
  { id: 'ua', label: 'Ukraine', flag: '🇺🇦', dialCode: '+380', digitLength: { min: 9, max: 9 }, example: '50 123 4567' },
  { id: 'ht', label: 'Haïti', flag: '🇭🇹', dialCode: '+509', digitLength: { min: 8, max: 8 }, example: '34 12 3456' },
  { id: 'mg', label: 'Madagascar', flag: '🇲🇬', dialCode: '+261', digitLength: { min: 9, max: 9 }, example: '32 12 345 67' },
  { id: 'mu', label: 'Maurice', flag: '🇲🇺', dialCode: '+230', digitLength: { min: 8, max: 8 }, example: '5123 4567' },
  { id: 'km', label: 'Comores', flag: '🇰🇲', dialCode: '+269', digitLength: { min: 7, max: 7 }, example: '321 23 45' },
  { id: 'sc', label: 'Seychelles', flag: '🇸🇨', dialCode: '+248', digitLength: { min: 7, max: 7 }, example: '2 51 23 45' },
  { id: 'cv', label: 'Cap-Vert', flag: '🇨🇻', dialCode: '+238', digitLength: { min: 7, max: 7 }, example: '912 34 56' },
  { id: 'st', label: 'Sao Tomé-et-Principe', flag: '🇸🇹', dialCode: '+239', digitLength: { min: 7, max: 7 }, example: '991 23 45' },
  { id: 'mr', label: 'Mauritanie', flag: '🇲🇷', dialCode: '+222', digitLength: { min: 8, max: 8 }, example: '45 12 34 56' },
  { id: 'gm', label: 'Gambie', flag: '🇬🇲', dialCode: '+220', digitLength: { min: 7, max: 7 }, example: '701 2345' },
  { id: 'gw', label: 'Guinée-Bissau', flag: '🇬🇼', dialCode: '+245', digitLength: { min: 7, max: 7 }, example: '955 12 34' },
  { id: 'lr', label: 'Libéria', flag: '🇱🇷', dialCode: '+231', digitLength: { min: 8, max: 8 }, example: '77 012 3456' },
  { id: 'sl', label: 'Sierra Leone', flag: '🇸🇱', dialCode: '+232', digitLength: { min: 8, max: 8 }, example: '76 123 456' },
  { id: 'na', label: 'Namibie', flag: '🇳🇦', dialCode: '+264', digitLength: { min: 9, max: 9 }, example: '81 123 4567' },
  { id: 'bw', label: 'Botswana', flag: '🇧🇼', dialCode: '+267', digitLength: { min: 8, max: 8 }, example: '71 234 567' },
  { id: 'zm', label: 'Zambie', flag: '🇿🇲', dialCode: '+260', digitLength: { min: 9, max: 9 }, example: '97 123 4567' },
  { id: 'zw', label: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263', digitLength: { min: 9, max: 9 }, example: '71 234 5678' },
  { id: 'mz', label: 'Mozambique', flag: '🇲🇿', dialCode: '+258', digitLength: { min: 9, max: 9 }, example: '82 123 4567' },
  { id: 'mw', label: 'Malawi', flag: '🇲🇼', dialCode: '+265', digitLength: { min: 9, max: 9 }, example: '99 123 4567' },
  { id: 'ls', label: 'Lesotho', flag: '🇱🇸', dialCode: '+266', digitLength: { min: 8, max: 8 }, example: '58 12 34 56' },
  { id: 'sz', label: 'Eswatini', flag: '🇸🇿', dialCode: '+268', digitLength: { min: 8, max: 8 }, example: '76 12 34 56' },
];

/**
 * Finds a country by label name (e.g. "France", "Congo-Brazzaville")
 */
export function getCountryByLabel(label?: string): CountryInfo {
  if (!label) return DEFAULT_COUNTRY;
  const normalized = label.trim().toLowerCase();
  const found = COUNTRIES.find((c) => c.label.toLowerCase() === normalized || c.id.toLowerCase() === normalized);
  return found || DEFAULT_COUNTRY;
}

/**
 * Validates whether digits match the country requirement.
 * Strips non-digits first.
 */
export function validatePhoneNumber(phoneDigits: string, country: CountryInfo): {
  isValid: boolean;
  error?: string;
  cleanDigits: string;
} {
  const cleanDigits = phoneDigits.replace(/\D/g, '');
  
  if (!cleanDigits) {
    return { isValid: false, error: 'Numéro de téléphone requis', cleanDigits: '' };
  }

  const { min, max } = country.digitLength;

  if (cleanDigits.length < min) {
    if (min === max) {
      return {
        isValid: false,
        error: `Le numéro doit comporter exactement ${min} chiffres (actuellement ${cleanDigits.length})`,
        cleanDigits,
      };
    }
    return {
      isValid: false,
      error: `Le numéro doit comporter au moins ${min} chiffres`,
      cleanDigits,
    };
  }

  if (cleanDigits.length > max) {
    return {
      isValid: false,
      error: `Le numéro ne peut pas dépasser ${max} chiffres`,
      cleanDigits,
    };
  }

  // Specific check for Congo (+242): numbers must start with valid prefixes (04, 05, 06) if 9 digits, or 4/5/6 if 9 digits
  if (country.dialCode === '+242') {
    if (cleanDigits.length === 9 && !/^(04|05|06|4|5|6)/.test(cleanDigits)) {
      return {
        isValid: false,
        error: 'Un numéro congolais valide commence par 04, 05 ou 06',
        cleanDigits,
      };
    }
  }

  return { isValid: true, cleanDigits };
}

/**
 * Formats full phone number with dial code (e.g., "+242061234567")
 */
export function formatFullPhoneNumber(dialCode: string, rawPhoneDigits: string): string {
  const clean = rawPhoneDigits.replace(/\D/g, '');
  const cleanDial = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return `${cleanDial}${clean}`;
}
