import React from 'react';

export function Avatar({
  src,
  alt = 'User avatar',
  fallback,
  size = 'md',
  className = '',
  status = null,
}) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl',
  };

  const statusColors = {
    online: 'bg-emerald-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
    away: 'bg-amber-500',
  };

  const baseClass = `${sizeClasses[size]} rounded-full flex-shrink-0 relative`;
  const imageClass = 'w-full h-full object-cover rounded-full shadow-sm';
  const fallbackClass =
    'w-full h-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex flex-col items-center justify-center font-bold shadow-md rounded-full uppercase';

  const defaultFallback =
    typeof fallback === 'string'
      ? fallback.charAt(0).toUpperCase()
      : typeof alt === 'string' && alt.length > 0
      ? alt.charAt(0).toUpperCase()
      : '?';

  return (
    <div className={`${baseClass} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className={imageClass} />
      ) : (
        <div className={fallbackClass}>{defaultFallback}</div>
      )}
      {status && statusColors[status] && (
        <div
          className={`absolute bottom-0 right-0 w-[25%] h-[25%] min-w-[10px] min-h-[10px] rounded-full border-2 border-white ${statusColors[status]}`}
        />
      )}
    </div>
  );
}
