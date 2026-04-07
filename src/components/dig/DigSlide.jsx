import SlideIntro from './slides/SlideIntro.jsx'
import SlideSignature from './slides/SlideSignature.jsx'
import SlideRarestBond from './slides/SlideRarestBond.jsx'
import SlideZodiacThread from './slides/SlideZodiacThread.jsx'
import SlideLoneWolf from './slides/SlideLoneWolf.jsx'
import SlidePlutoGens from './slides/SlidePlutoGens.jsx'
import SlideCouple from './slides/SlideCouple.jsx'
import SlideOutro from './slides/SlideOutro.jsx'

const SLIDE_COMPONENTS = {
  intro: SlideIntro,
  signature: SlideSignature,
  rarestBond: SlideRarestBond,
  zodiacThread: SlideZodiacThread,
  loneWolf: SlideLoneWolf,
  plutoGens: SlidePlutoGens,
  couple: SlideCouple,
  outro: SlideOutro,
}

export default function DigSlide({ slide, state, onShare }) {
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
      <Component data={slide.data} active={state === 'active'} onShare={onShare} />
    </div>
  )
}
