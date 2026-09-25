import React, { useState } from 'react';

// Olympic IOC 3-letter to ISO 3166-1 alpha-2 mapping for all 45 OCA Asian nations
const IOC_TO_ISO: Record<string, string> = {
  AFG: 'af',
  BRN: 'bh',
  BAN: 'bd',
  BHU: 'bt',
  BRU: 'bn',
  CAM: 'kh',
  CHN: 'cn',
  TPE: 'tw',
  HKG: 'hk',
  IND: 'in',
  INA: 'id',
  IRI: 'ir',
  IRQ: 'iq',
  JPN: 'jp',
  JOR: 'jo',
  KAZ: 'kz',
  KUW: 'kw',
  KGZ: 'kg',
  LAO: 'la',
  LBN: 'lb',
  MAC: 'mo',
  MAS: 'my',
  MDV: 'mv',
  MGL: 'mn',
  MYA: 'mm',
  NEP: 'np',
  PRK: 'kp',
  OMA: 'om',
  PAK: 'pk',
  PLE: 'ps',
  PHI: 'ph',
  QAT: 'qa',
  KSA: 'sa',
  SGP: 'sg',
  KOR: 'kr',
  SRI: 'lk',
  SYR: 'sy',
  TJK: 'tj',
  THA: 'th',
  TLS: 'tl',
  TKM: 'tm',
  UAE: 'ae',
  UZB: 'uz',
  VIE: 'vn',
  YEM: 'ye',
};

interface CountryFlagProps {
  code?: string;
  name?: string;
  fallbackEmoji?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  code = '',
  name = '',
  fallbackEmoji = '🏳️',
  className = '',
  size = 'md',
}) => {
  const [hasError, setHasError] = useState(false);
  const upperCode = (code || '').toUpperCase().trim();
  const isoCode = IOC_TO_ISO[upperCode] || (upperCode.length === 2 ? upperCode.toLowerCase() : null);

  const sizeClasses = {
    sm: 'w-4 h-3 rounded-[2px]',
    md: 'w-6 h-4 rounded-sm',
    lg: 'w-9 h-6 rounded-md',
    xl: 'w-14 h-9 rounded-lg',
  }[size];

  if (!isoCode || hasError) {
    return (
      <span
        className={`inline-flex items-center justify-center font-emoji ${className}`}
        role="img"
        aria-label={name || code}
      >
        {fallbackEmoji}
      </span>
    );
  }

  // High-res FlagCDN images (w80 for retina clarity)
  const flagUrl = `https://flagcdn.com/w80/${isoCode}.png`;

  return (
    <img
      src={flagUrl}
      alt={name || code}
      onError={() => setHasError(true)}
      loading="lazy"
      className={`inline-block object-cover border border-black/10 shadow-sm flex-shrink-0 ${sizeClasses} ${className}`}
    />
  );
};
