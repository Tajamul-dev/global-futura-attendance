import { useState } from 'react';
import { Globe } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ size = 'md', className = '' }: LogoProps) {
  const [imgError, setImgError] = useState(false);

  const heightClass = size === 'lg' ? 'h-24' : size === 'md' ? 'h-11' : 'h-8';

  if (imgError) {
    return (
      <div
        className={`inline-flex items-center gap-2 bg-white text-slate-900 rounded-lg px-3 py-1.5 font-bold tracking-tight shadow-sm ${className}`}
      >
        <Globe className={size === 'lg' ? 'w-7 h-7 text-emerald-700' : 'w-4 h-4 text-emerald-700'} />
        <div className="text-left leading-tight">
          <span className={size === 'lg' ? 'text-base block' : 'text-xs block'}>GLOBAL FUTURA</span>
          {size === 'lg' && (
            <span className="text-[10px] font-medium text-slate-500 block">Pure Quality · Global Reach</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <img
      src="https://www.globaloils.us/wp-content/uploads/2026/06/new-logo-1024x545.avif"
      alt="Global Futura Inc"
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={`${heightClass} w-auto bg-white rounded-lg p-1.5 object-contain ${className}`}
    />
  );
}
