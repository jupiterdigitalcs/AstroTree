import SlideIntro from './slides/SlideIntro.jsx'
import SlideVibeCheck from './slides/SlideVibeCheck.jsx'
import SlideSuperlative from './slides/SlideSuperlative.jsx'
import SlideEmotionalForecast from './slides/SlideEmotionalForecast.jsx'
import SlideCosmicDuo from './slides/SlideCosmicDuo.jsx'
import SlideWildcard from './slides/SlideWildcard.jsx'
import SlideCosmicDNA from './slides/SlideCosmicDNA.jsx'
import SlideOutro from './slides/SlideOutro.jsx'
import SlideGlue from './slides/SlideGlue.jsx'
import SlideElementClash from './slides/SlideElementClash.jsx'
import SlideClone from './slides/SlideClone.jsx'
import SlideVenusVibes from './slides/SlideVenusVibes.jsx'
import SlideMarsEnergy from './slides/SlideMarsEnergy.jsx'
import SlideMoonMirror from './slides/SlideMoonMirror.jsx'
import SlideOldSoul from './slides/SlideOldSoul.jsx'
import SlideRebel from './slides/SlideRebel.jsx'
import SlideGenBridge from './slides/SlideGenBridge.jsx'
import SlideRareOne from './slides/SlideRareOne.jsx'
import SlidePaywall from './slides/SlidePaywall.jsx'

const SLIDE_COMPONENTS = {
  intro: SlideIntro,
  vibeCheck: SlideVibeCheck,
  superlative: SlideSuperlative,
  emotionalForecast: SlideEmotionalForecast,
  cosmicDuo: SlideCosmicDuo,
  wildcard: SlideWildcard,
  cosmicDNA: SlideCosmicDNA,
  outro: SlideOutro,
  glue: SlideGlue,
  elementClash: SlideElementClash,
  clone: SlideClone,
  venusVibes: SlideVenusVibes,
  marsEnergy: SlideMarsEnergy,
  moonMirror: SlideMoonMirror,
  oldSoul: SlideOldSoul,
  rebel: SlideRebel,
  genBridge: SlideGenBridge,
  rareOne: SlideRareOne,
  paywall: SlidePaywall,
}

export default function DigSlide({ slide, state, onShare, sharing, onUpgrade }) {
  const Component = SLIDE_COMPONENTS[slide.type]
  if (!Component) return null

  const className = [
    'dig-slide',
    state === 'active' && 'dig-slide--active',
    state === 'exit-left' && 'dig-slide--exit-left',
    state === 'exit-right' && 'dig-slide--exit-right',
  ].filter(Boolean).join(' ')

  return (
    <div className={className}>
      <div className={`dig-bg dig-bg--${slide.mood}`} />
      <Component data={slide.data} active={state === 'active'} onShare={onShare} sharing={sharing} onUpgrade={onUpgrade} />
      {slide.type !== 'intro' && slide.type !== 'paywall' && onShare && (
        <button
          type="button"
          className="dig-slide-share"
          onClick={(e) => { e.stopPropagation(); onShare() }}
          disabled={sharing}
        >{sharing ? '...' : '↑ Share This Slide'}</button>
      )}
      <div className="dig-slide-brand">
        <span className="dig-slide-brand-name">✦ astrodig.com</span>
        <span className="dig-slide-brand-sep">·</span>
        <span className="dig-slide-brand-studio">Jupiter Digital LLC</span>
        <span className="dig-slide-brand-sep">·</span>
        <span className="dig-slide-brand-ig">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
          @jupreturn
        </span>
      </div>
    </div>
  )
}
