import React from 'react';
import { BRAND_ASSETS } from '../data/brand';

interface BrandMarkProps {
  className?: string;
}

const BrandMark: React.FC<BrandMarkProps> = ({ className = 'h-9 w-auto' }) => (
  <>
    <img
      src={BRAND_ASSETS.LOGO_DARK}
      alt="Navin Hill"
      width={240}
      height={143}
      decoding="async"
      className={`${className} block dark:hidden`}
    />
    <img
      src={BRAND_ASSETS.LOGO_WHITE}
      alt=""
      aria-hidden="true"
      width={240}
      height={143}
      decoding="async"
      className={`${className} hidden dark:block`}
    />
  </>
);

export default BrandMark;
