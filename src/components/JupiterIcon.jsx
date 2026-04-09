import { useId } from 'react'

export function JupiterIcon({ size = 32, className }) {
  const uid = useId()
  const id = (name) => `jup-${uid}-${name}`

  // Small: bands spread top-to-bottom, clean at tiny scale
  if (size <= 22) {
    return (
      <svg
        width={size} height={size} viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Jupiter"
      >
        <defs>
          <radialGradient id={id('sm-depth')} cx="40%" cy="35%" r="70%">
            <stop offset="0%"   stopColor="#ede6ff" stopOpacity="0.04" />
            <stop offset="55%"  stopColor="#09071a" stopOpacity="0"    />
            <stop offset="100%" stopColor="#09071a" stopOpacity="0.7"  />
          </radialGradient>
          <radialGradient id={id('sm-glint')} cx="33%" cy="26%" r="48%">
            <stop offset="0%"   stopColor="#e6c76e" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#e6c76e" stopOpacity="0"    />
          </radialGradient>
          <radialGradient id={id('sm-storm')} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#c9943e" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#c9943e" stopOpacity="0"   />
          </radialGradient>
          <clipPath id={id('sm-clip')}>
            <circle cx="12" cy="12" r="11" />
          </clipPath>
          <filter id={id('sm-blur')} x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="0.7" />
          </filter>
        </defs>
        <circle cx="12" cy="12" r="11" fill="#0d0a22" />
        <g clipPath={`url(#${id('sm-clip')})`}>
          <path d="M 1,1 L 23,1 L 23,4.5 C 16,5.2 8,3.8 1,4.5 Z" fill="#0d0a22" />
          <path d="M 1,4.5 C 8,3.8 16,5.2 23,4.5 L 23,6.5 C 16,7.2 8,5.8 1,6.5 Z" fill="#c9a84c" fillOpacity="0.55" />
          <path d="M 1,6.5 C 8,5.8 16,7.2 23,6.5 L 23,9 C 16,9.7 8,8.3 1,9 Z" fill="#1a1040" fillOpacity="0.95" />
          <path d="M 1,9 C 8,8.3 16,9.7 23,9 L 23,11.5 C 16,12.2 8,10.8 1,11.5 Z" fill="#e6c76e" fillOpacity="0.50" />
          <path d="M 1,11.5 C 8,10.8 16,12.2 23,11.5 L 23,14 C 16,14.7 8,13.3 1,14 Z" fill="#1a1040" fillOpacity="0.95" />
          <path d="M 1,14 C 8,13.3 16,14.7 23,14 L 23,16.5 C 16,17.2 8,15.8 1,16.5 Z" fill="#c9a84c" fillOpacity="0.48" />
          <path d="M 1,16.5 C 8,15.8 16,17.2 23,16.5 L 23,19 C 16,19.7 8,18.3 1,19 Z" fill="#231848" fillOpacity="0.90" />
          <path d="M 1,19 C 8,18.3 16,19.7 23,19 L 23,21 C 16,21.7 8,20.3 1,21 Z" fill="#c9a84c" fillOpacity="0.42" />
          <path d="M 1,21 C 8,20.3 16,21.7 23,21 L 23,23 L 1,23 Z" fill="#0d0a22" />
          <circle cx="12" cy="12" r="11" fill={`url(#${id('sm-depth')})`} />
          <circle cx="12" cy="12" r="11" fill={`url(#${id('sm-glint')})`} />
          <ellipse cx="17" cy="16.5" rx="3.2" ry="1.8"
            fill={`url(#${id('sm-storm')})`} filter={`url(#${id('sm-blur')})`} />
          <ellipse cx="17" cy="16.5" rx="2" ry="1.1"
            fill="#b07038" fillOpacity="0.32" />
        </g>
        <circle cx="12" cy="12" r="11" fill="none" stroke="rgba(201,168,76,0.45)" strokeWidth="0.7" />
      </svg>
    )
  }

  // Large: banded planet with storm deformation and subtle Great Storm in lower-right
  return (
    <svg
      width={size} height={size} viewBox="0 0 60 60"
      xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Jupiter"
    >
      <defs>
        <radialGradient id={id('lg-depth')} cx="42%" cy="36%" r="70%">
          <stop offset="0%"   stopColor="#ede6ff" stopOpacity="0.06" />
          <stop offset="55%"  stopColor="#09071a" stopOpacity="0"    />
          <stop offset="100%" stopColor="#09071a" stopOpacity="0.68" />
        </radialGradient>
        <radialGradient id={id('lg-glint')} cx="34%" cy="27%" r="32%">
          <stop offset="0%"   stopColor="#e6c76e" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#e6c76e" stopOpacity="0"    />
        </radialGradient>
        <radialGradient id={id('lg-glow')} cx="50%" cy="50%" r="50%">
          <stop offset="60%"  stopColor="#09071a" stopOpacity="0"    />
          <stop offset="100%" stopColor="#c9a84c" stopOpacity="0.18" />
        </radialGradient>
        <radialGradient id={id('storm-grad')} cx="45%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#c9943e" stopOpacity="0.55" />
          <stop offset="60%"  stopColor="#a06030" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7a4020" stopOpacity="0"    />
        </radialGradient>
        <clipPath id={id('lg-clip')}>
          <circle cx="30" cy="30" r="27.5" />
        </clipPath>
        <filter id={id('storm-blur')} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
      </defs>

      <circle cx="30" cy="30" r="27.5" fill="#09071a" />

      <g clipPath={`url(#${id('lg-clip')})`}>

        {/* Bands 1-4: unaffected by storm */}
        <path d="M 2,2 L 58,2 L 58,10 C 40,11.8 20,8.2 2,10 Z"
          fill="#0d0a22" />
        <path d="M 2,10 C 20,8.2 40,11.8 58,10
                 L 58,14 C 40,15.8 20,12.2 2,14 Z"
          fill="#c9a84c" fillOpacity="0.52" />
        <path d="M 2,14 C 20,12.2 40,15.8 58,14
                 L 58,19 C 40,17.2 20,20.8 2,19 Z"
          fill="#2a1858" fillOpacity="0.98" />
        <path d="M 2,19 C 20,20.8 40,17.2 58,19
                 L 58,23 C 40,24.8 20,21.2 2,23 Z"
          fill="#d4b057" fillOpacity="0.58" />
        <path d="M 2,23 C 20,21.2 40,24.8 58,23
                 L 58,29 C 40,27.2 20,30.8 2,29 Z"
          fill="#1a1040" fillOpacity="0.99" />

        {/* Bands 5-7: deform around the storm at cx=42 cy=38 */}
        <path d="M 2,29 C 20,30.8 40,27.2 58,29
                 L 58,34 C 54,33.5 50,31 46,30.5 C 42,30 37,31.5 30,33 C 20,35 8,33 2,34 Z"
          fill="#e6c76e" fillOpacity="0.52" />
        <path d="M 2,34 C 8,33 20,35 30,33 C 37,31.5 42,30 46,30.5 C 50,31 54,33.5 58,34
                 L 58,39 C 54,39 50,42 46,42.5 C 42,43 37,41 30,39.5 C 20,38 8,39.5 2,39 Z"
          fill="#2a1858" fillOpacity="0.95" />
        <path d="M 2,39 C 8,39.5 20,38 30,39.5 C 37,41 42,43 46,42.5 C 50,42 54,39 58,39
                 L 58,43 C 40,44.8 20,41.2 2,43 Z"
          fill="#c9a84c" fillOpacity="0.50" />

        {/* Bands 8+: unaffected */}
        <path d="M 2,43 C 20,41.2 40,44.8 58,43
                 L 58,48 C 40,49.8 20,46.2 2,48 Z"
          fill="#160c30" fillOpacity="0.98" />
        <path d="M 2,48 C 20,46.2 40,49.8 58,48 L 58,58 L 2,58 Z"
          fill="#0d0a22" />

        {/* Great Storm */}
        <ellipse cx="42" cy="37" rx="9" ry="5"
          fill={`url(#${id('storm-grad')})`}
          filter={`url(#${id('storm-blur')})`}
        />
        <ellipse cx="42" cy="37" rx="6.5" ry="3.5"
          fill="#b07038" fillOpacity="0.30"
        />
        <ellipse cx="41.5" cy="36.5" rx="3.5" ry="1.8"
          fill="#d4943e" fillOpacity="0.20"
        />

        {/* Depth shading + highlight glint */}
        <circle cx="30" cy="30" r="27.5" fill={`url(#${id('lg-depth')})`} />
        <circle cx="30" cy="30" r="27.5" fill={`url(#${id('lg-glint')})`} />
      </g>

      {/* Outer gold edge glow */}
      <circle cx="30" cy="30" r="27.5" fill={`url(#${id('lg-glow')})`} />

      {/* Rim */}
      <circle cx="30" cy="30" r="27.5"
        fill="none" stroke="rgba(201,168,76,0.45)" strokeWidth="1.2" />
    </svg>
  )
}
