import SlideIntro from './slides/SlideIntro.jsx'
import SlideVibeCheck from './slides/SlideVibeCheck.jsx'
import SlideSuperlative from './slides/SlideSuperlative.jsx'
import SlideEmotionalForecast from './slides/SlideEmotionalForecast.jsx'
import SlideCosmicDuo from './slides/SlideCosmicDuo.jsx'
import SlideWildcard from './slides/SlideWildcard.jsx'
import SlideCosmicDNA from './slides/SlideCosmicDNA.jsx'
import SlideOutro from './slides/SlideOutro.jsx'

const SLIDE_COMPONENTS = {
  intro: SlideIntro,
  vibeCheck: SlideVibeCheck,
  superlative: SlideSuperlative,
  emotionalForecast: SlideEmotionalForecast,
  cosmicDuo: SlideCosmicDuo,
  wildcard: SlideWildcard,
  cosmicDNA: SlideCosmicDNA,
  outro: SlideOutro,
}

export default function DigSlide({ slide, state, onShare, sharing }) {
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
      <Component data={slide.data} active={state === 'active'} onShare={onShare} sharing={sharing} />
    </div>
  )
}
