import React, { useState, useEffect } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  alt?: string;
  className?: string;
  sizeClassName?: string;
}

export function UserAvatar({
  src,
  name = 'Learner',
  alt,
  className = '',
  sizeClassName = 'w-full h-full',
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Reset error state whenever src changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const initial = (name.trim().charAt(0) || 'L').toUpperCase();
  const effectiveAlt = alt || name || 'User avatar';

  // If no source or image failed to load, show initials badge
  if (!src || hasError) {
    return (
      <div
        className={`${sizeClassName} ${className} flex items-center justify-center bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white font-bold select-none`}
        title={name}
        aria-label={effectiveAlt}
      >
        <span className="text-sm font-semibold tracking-wider">{initial}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={effectiveAlt}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={() => setHasError(true)}
      className={`${sizeClassName} ${className} object-cover`}
    />
  );
}

export default UserAvatar;
