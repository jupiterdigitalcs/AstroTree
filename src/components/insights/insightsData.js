// Static data tables and constants extracted from InsightsPanel.jsx.
// These are objects and arrays that never change at runtime.

export const ELEMENT_ENERGY = {
  Fire:  'passionate and driven',
  Earth: 'grounded and practical',
  Air:   'communicative and curious',
  Water: 'intuitive and emotional',
}

// Richer per-element language for the Sun / Moon Element Makeup cards.
// Sun = identity, outward self. Moon = inner world, emotional needs.
export const SUN_ELEMENT_DESC = {
  Fire:  'bold, driven identities that lead with action and spark',
  Earth: 'steady, practical identities that build through patience and effort',
  Air:   'curious, social identities that lead with ideas and conversation',
  Water: 'sensitive, intuitive identities that lead with feeling and empathy',
}

export const MOON_ELEMENT_DESC = {
  Fire:  'big, expressive emotions that ignite fast and need room to burn',
  Earth: 'steady emotional needs rooted in routine, safety, and physical comfort',
  Air:   'inner worlds that process feeling through words, needing space to talk it out',
  Water: 'deep emotional lives shaped by intuition, empathy, and what they sense in others',
}

export const SIGN_SYMBOLS = {
  Aries:'♈', Taurus:'♉', Gemini:'♊', Cancer:'♋', Leo:'♌', Virgo:'♍',
  Libra:'♎', Scorpio:'♏', Sagittarius:'♐', Capricorn:'♑', Aquarius:'♒', Pisces:'♓',
}

export const SIGN_FLAVOR = {
  Aries:       'when this energy shows up in a group, it tends to push everyone toward action. The spark that gets things started.',
  Taurus:      'this energy brings a grounding quality to the group. Patience, steadiness, and a reminder to slow down and enjoy the process.',
  Gemini:      'this energy keeps the group curious and connected. New ideas, lively conversation, and a restless need to keep learning.',
  Cancer:      'this energy anchors the group emotionally. A deep attunement to feelings, memory, and what makes a place feel like home.',
  Leo:         'this energy brings warmth and creative confidence to the group. A natural ability to make others feel seen and celebrated.',
  Virgo:       'this energy shows up as quiet competence. The group member who notices what needs doing and handles it without fanfare.',
  Libra:       'this energy smooths the group dynamic. A pull toward fairness, beauty, and keeping things in balance.',
  Scorpio:     'this energy brings depth and perception. The willingness to go beneath the surface and sit with difficult truths.',
  Sagittarius: 'this energy expands the group\'s vision. A philosophical streak and a pull toward meaning, travel, and big questions.',
  Capricorn:   'this energy brings structure and long-term thinking. The part of the group that plans, commits, and follows through.',
  Aquarius:    'this energy challenges the group to think differently. Independence, innovation, and a vision that may run ahead of its time.',
  Pisces:      'this energy brings empathy and imagination. A sensitivity to what others feel and a deep inner world.',
}

export const PLANET_GLYPH = { sun: '☀', moon: '☽', mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃', saturn: '♄' }

export const VENUS_SIGN_BLURB = {
  Aries:       'Tends to be direct and impulsive in love. May act on attraction quickly and value honesty over subtlety.',
  Taurus:      'Often drawn to comfort, sensuality, and lasting loyalty. May show love through physical presence and steadiness.',
  Gemini:      'Tends to connect through conversation and mental spark. May need variety and intellectual stimulation in love.',
  Cancer:      'Often nurturing and emotionally invested. May build love around a sense of home and emotional safety.',
  Leo:         'Tends to be warm and generous in love. May need to feel appreciated and often expresses affection openly.',
  Virgo:       'Often shows love through thoughtful gestures and attention to detail. May express care more through doing than saying.',
  Libra:       'Tends to seek harmony and beauty in relationships. May prioritize partnership and go out of their way to avoid conflict.',
  Scorpio:     'Often loves with depth and intensity. May take time to trust but tends to be deeply loyal once committed.',
  Sagittarius: 'Tends to need space and adventure in love. May connect through shared experiences and philosophical conversation.',
  Capricorn:   'Often reserved in expressing affection. May show love through commitment, reliability, and quiet devotion.',
  Aquarius:    'Tends to approach love unconventionally. May value friendship, independence, and intellectual connection as the basis of intimacy.',
  Pisces:      'Often deeply empathetic and emotionally open. May love without boundaries and absorb a partner\'s feelings easily.',
}

export const MERCURY_SIGN_BLURB = {
  Aries:       'Tends to think fast and speak directly. May reach conclusions quickly and prefer getting straight to the point.',
  Taurus:      'Often deliberate in thought and speech. May take time to decide but tends to hold steady once they do.',
  Gemini:      'Tends to be quick, curious, and verbal. May juggle several ideas at once and think out loud.',
  Cancer:      'Often processes through feeling and memory. May communicate indirectly but tends to read the room well.',
  Leo:         'Tends to communicate with warmth and conviction. May tell a story rather than recite the facts.',
  Virgo:       'Often precise and detail-oriented in thought. May notice what others miss and prefer clear, practical language.',
  Libra:       'Tends to weigh both sides before speaking. May soften a message to keep the conversation in balance.',
  Scorpio:     'Often perceptive and private in thought. May say little but notice everything, preferring depth over small talk.',
  Sagittarius: 'Tends to think in big pictures and speak candidly. May skip the details in favor of the meaning.',
  Capricorn:   'Often measured and pragmatic in communication. May think in structures and say only what needs saying.',
  Aquarius:    'Tends to approach ideas from unexpected angles. May enjoy debate and resist conventional thinking.',
  Pisces:      'Often intuitive and associative in thought. May communicate through impressions more than linear logic.',
}

export const MARS_SIGN_BLURB = {
  Aries:       'Tends to act quickly and directly. May be the first to take initiative and can bring high energy to any situation.',
  Taurus:      'Often slow to start but persistent once moving. May surprise others with quiet determination and staying power.',
  Gemini:      'Tends to channel energy through ideas and conversation. May approach challenges mentally before physically.',
  Cancer:      'Often driven by emotion and a protective instinct. May fight hardest when someone they care about is affected.',
  Leo:         'Tends to bring warmth and confidence to action. May need recognition for their efforts and often leads naturally.',
  Virgo:       'Often precise and methodical in how they apply effort. May channel energy into getting things right rather than getting them fast.',
  Libra:       'Tends to approach conflict through dialogue and diplomacy. May be uncomfortable with direct confrontation but firm on fairness.',
  Scorpio:     'Often focused and deeply committed once engaged. May approach goals with quiet intensity and persistence.',
  Sagittarius: 'Tends to bring enthusiasm and optimism to challenges. May need a meaningful goal to sustain effort over time.',
  Capricorn:   'Often strategic and disciplined. May take a long-term approach and work steadily without needing external motivation.',
  Aquarius:    'Tends to be driven by ideas and principles. May channel energy into innovation or challenging established systems.',
  Pisces:      'Often motivated by compassion and creative vision. May direct energy toward helping, imagining, or connecting on a deeper level.',
}

export const ELEMENT_THREAD_BLURB = {
  Fire:  'A family line of passion, courage, and creative drive',
  Earth: 'A legacy of groundedness, patience, and practical wisdom',
  Air:   'Generations of quick minds, curiosity, and a gift for connection',
  Water: 'Deep emotional intelligence and intuition flowing through the generations',
}

export const SIBLING_ADAPTABILITY = {
  'Cardinal-Cardinal': 'both initiators. May compete for direction, but together spark real momentum.',
  'Cardinal-Fixed':    'initiation meets endurance. One starts it, one sees it through.',
  'Cardinal-Mutable':  'spark meets flow. One launches, one shapes the path.',
  'Fixed-Fixed':       'immovable force. Deep loyalty, shared stubbornness, and lasting bonds.',
  'Fixed-Mutable':     'anchor meets adapter. One holds steady while the other evolves.',
  'Mutable-Mutable':   'highly adaptable together. Fluid, curious, and ever-shifting.',
}

export const PLUTO_GENS = {
  Cancer:      { years: '~1914–1939', flavor: 'shaped by home, survival, and deep loyalty to their people' },
  Leo:         { years: '~1939–1957', flavor: 'driven by identity, pride, and a need to leave their mark' },
  Virgo:       { years: '~1958–1971', flavor: 'defined by craft, critical thinking, and a drive to improve' },
  Libra:       { years: '~1972–1983', flavor: 'formed by ideals of fairness, partnership, and social harmony' },
  Scorpio:     { years: '~1984–1995', flavor: 'marked by transformation, intensity, and truth-seeking' },
  Sagittarius: { years: '~1996–2008', flavor: 'colored by idealism, global thinking, and the search for meaning' },
  Capricorn:   { years: '~2008–2023', flavor: 'shaped by ambition, structure, and rethinking the rules' },
  Aquarius:    { years: '2024+',      flavor: 'awakening into collective vision, technology, and radical change' },
}

export const PLUTO_ORDER = ['Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius']

export const OPPOSITE_SIGNS = {
  Aries: 'Libra',        Libra:       'Aries',
  Taurus: 'Scorpio',     Scorpio:     'Taurus',
  Gemini: 'Sagittarius', Sagittarius: 'Gemini',
  Cancer: 'Capricorn',   Capricorn:   'Cancer',
  Leo:    'Aquarius',    Aquarius:    'Leo',
  Virgo:  'Pisces',      Pisces:      'Virgo',
}

export const ELEMENT_QUALITY = {
  Fire:  'bold and passionate',
  Earth: 'steady and grounded',
  Air:   'curious and communicative',
  Water: 'sensitive and emotionally deep',
}

export const MOON_STYLE = {
  Aries:       'tends to process emotions quickly and move on fast',
  Taurus:      'tends to take time to open up and often craves security above all',
  Gemini:      'tends to talk through feelings and may need mental space to process',
  Cancer:      'tends to feel deeply and hold onto emotional memory',
  Leo:         'tends to need appreciation and often expresses feelings openly',
  Virgo:       'tends to process by analyzing and may show love through acts of service',
  Libra:       'tends to avoid conflict and often needs harmony to feel emotionally safe',
  Scorpio:     'tends to feel things intensely and may hold onto emotions for a long time',
  Sagittarius: 'tends to need freedom and may stay upbeat on the surface',
  Capricorn:   'tends to keep emotions private and handle things practically',
  Aquarius:    'tends to step back to process and may need intellectual independence',
  Pisces:      'tends to absorb the emotions of others and may need quiet to recharge',
}

export const ZODIAC_THREAD_BLURB = {
  Aries:       'A streak of boldness runs in this family. Independent thinkers who act on instinct and resist being told what to do.',
  Taurus:      'A deep rootedness passes through the generations. Stability, comfort, and building things that last matter here.',
  Gemini:      'Curiosity is the family inheritance. Quick minds, a gift for conversation, and a need to keep learning.',
  Cancer:      'The home and its memory bind this family. Emotional attunement, loyalty, and a fierce protectiveness of those they love.',
  Leo:         'A warmth and need for self-expression flows through. There\'s a natural light here that doesn\'t shrink from being seen.',
  Virgo:       'A thread of precision and quiet devotion. These are the ones who notice the details, show up consistently, and fix things without being asked.',
  Libra:       'A need for harmony and fairness is woven through. Beauty, balance, and keeping the peace are core values, sometimes to a fault.',
  Scorpio:     'Emotional depth and perception run strong. People here feel things fully, see beneath the surface, and are shaped by transformation.',
  Sagittarius: 'An expansive, searching spirit recurs. Restless with meaning, drawn to big ideas, travel, and the question of why.',
  Capricorn:   'An ambition to build something lasting runs in the blood. Discipline is respected, trust is earned slowly, and the long game wins.',
  Aquarius:    'An independent streak and a vision that runs ahead of its time. This family thinks differently and doesn\'t follow trends.',
  Pisces:      'A deep empathy and sensitivity recurs across the line. This family feels the world more than most and carries a strong imaginative inner life.',
}

// Same threads, written for friend/coworker charts (no lineage language)
export const ZODIAC_THREAD_BLURB_GROUP = {
  Aries:       'A streak of boldness runs through this group. Independent thinkers who act on instinct and resist being told what to do.',
  Taurus:      'A shared steadiness holds this group together. People who prize comfort, loyalty, and things that last.',
  Gemini:      'Curiosity is the common thread. Quick minds, a gift for conversation, and a need to keep learning.',
  Cancer:      'Care runs deep here. Emotional attunement, loyalty, and a fierce protectiveness of their own.',
  Leo:         'A warmth and need for self-expression flows through. This group carries a natural light and doesn\'t shrink from being seen.',
  Virgo:       'A thread of precision and quiet devotion. These are the ones who notice the details, show up consistently, and fix things without being asked.',
  Libra:       'A need for harmony and fairness is woven through. Beauty, balance, and keeping the peace are core values, sometimes to a fault.',
  Scorpio:     'Emotional depth and perception run strong. People here feel things fully, see beneath the surface, and are shaped by transformation.',
  Sagittarius: 'An expansive, searching spirit recurs. This group is restless with meaning, drawn to big ideas, travel, and the question of why.',
  Capricorn:   'A shared ambition to build something lasting. Discipline is respected, trust is earned slowly, and the long game wins.',
  Aquarius:    'An independent streak and a vision that runs ahead of its time. This group thinks differently and doesn\'t follow trends.',
  Pisces:      'A deep empathy and sensitivity recurs across the group. People who feel the world more than most and carry strong imaginative inner lives.',
}

export const SIGN_SHORT = {
  Aries:       'energetic and bold, but can be impulsive. Acts first, thinks later.',
  Taurus:      'reliable and patient, but can be stubborn. Values stability above all.',
  Gemini:      'social and curious, but can be scattered. Mentally restless, rarely still.',
  Cancer:      'nurturing and sensitive, but can be moody. Home and family come first.',
  Leo:         'loyal and generous, but can be demanding. Needs to be seen and to make others shine.',
  Virgo:       'organized and devoted, but can be a perfectionist. Notices what everyone else misses.',
  Libra:       'charming and fair-minded, but can be indecisive. Needs balance, avoids conflict.',
  Scorpio:     'perceptive and magnetic, but can be intense. Feels everything deeply.',
  Sagittarius: 'candid and freedom-loving, but can be blunt. Always chasing meaning and the horizon.',
  Capricorn:   'disciplined and ambitious, but can be serious. Plays the long game, built to endure.',
  Aquarius:    'independent and innovative, but can be distant. Marches to their own beat.',
  Pisces:      'empathic and intuitive, but can be detached. Absorbs the feelings of the room.',
}

export const SQUAD_ELEMENT_VIBE = {
  Fire:  { label: 'The Spark Squad', vibe: 'Your crew runs hot. There\'s always someone ready to start something, rally people, or turn a quiet night into an event. This group moves fast and feeds off each other\'s energy.' },
  Earth: { label: 'The Anchor Crew', vibe: 'This group keeps things real. You\'re the ones who follow through, show up when it matters, and build something lasting together. Reliable, grounded, and probably good at splitting the check.' },
  Air:   { label: 'The Idea Table', vibe: 'Conversation is the connective tissue here. Your group trades ideas, stays curious, and probably has three group chats going at once. You connect through what you think, not just what you do.' },
  Water: { label: 'The Deep End', vibe: 'This group goes beneath the surface. You know each other\'s real stories, not just the highlights. Emotionally tuned in, sometimes to a fault, but that\'s what makes the bond rare.' },
}

export const SQUAD_MODALITY_VIBE = {
  Cardinal: 'initiators, always planning the next thing and pushing each other to start',
  Fixed:    'ride-or-die loyal. Once this group forms, it holds',
  Mutable:  'adaptable and flexible, the kind of group that goes with the flow and rarely gets stuck',
}

export const SQUAD_POLARITY_NOTE = {
  active:    'Leans active (Fire + Air). This group tends toward doing, talking, and going, not a crew that sits still for long.',
  receptive: 'Leans receptive (Earth + Water). This group tends toward depth, steadiness, and processing. You recharge each other.',
  balanced:  'Balanced between active and receptive energy. This group can rally and also know when to slow down.',
}

export const ASPECT_PAIR_BLURB = {
  // Personal × Personal
  'Moon:Sun': {
    soft: 'Identity and emotional life in alignment: an ease with knowing who one is',
    hard: 'A recurring tension between inner feeling and outward self: what\'s felt versus what\'s shown',
    conj: 'Identity and emotion deeply fused, living from the inside out',
  },
  'Mercury:Sun': {
    soft: 'Mind and identity in sync: clear, confident expression as a recurring thread',
    hard: 'Intellect and ego in tension, self-image tested through communication',
    conj: 'Thinking and identity tightly linked, defined largely by how one communicates',
  },
  'Sun:Venus': {
    soft: 'Warmth and a natural ease with love: identity and affection closely linked',
    hard: 'Self-worth and love in recurring tension: what\'s deserved versus what\'s given',
    conj: 'Identity and values deeply intertwined, defining oneself through loves and loyalties',
  },
  'Mars:Sun': {
    soft: 'Drive and identity reinforcing each other: knowing what\'s wanted and going after it',
    hard: 'Will and ego in tension, asserting oneself without overriding connection',
    conj: 'Ambition and identity fused, acting from a place of strong personal will',
  },
  'Moon:Mercury': {
    soft: 'Thinking and feeling in complement: emotion expressed with unusual clarity',
    hard: 'Head and heart in recurring conflict, logic and emotion rarely landing in the same place',
    conj: 'Thinking and feeling hard to separate, emotion and logic running together',
  },
  'Moon:Venus': {
    soft: 'Warmth and emotional openness as a recurring thread',
    hard: 'Emotional needs and affection misaligned: a recurring push-pull around love and belonging',
    conj: 'Love and emotional life deeply fused, feeling love intensely and personally',
  },
  'Mars:Moon': {
    soft: 'Emotional energy that translates into action, protective instinct and motivation together',
    hard: 'Strong emotional reactions that can escalate: defensiveness or volatility under pressure',
    conj: 'Intense emotional reactions and a fierce protective instinct, feeling things quickly and acting on them',
  },
  'Mercury:Venus': {
    soft: 'Warmth expressed through words, affection and communication naturally linked',
    hard: 'Words and affection at cross-purposes: tone and intention often getting crossed',
    conj: 'Love expressed through language, needing to talk through feelings to feel close',
  },
  'Mars:Mercury': {
    soft: 'Sharp, direct minds, speaking without holding back',
    hard: 'Sharp tongues and quick tempers: prone to arguments and cutting words',
    conj: 'Mind and action tightly linked, thinking fast and acting faster',
  },
  'Mars:Venus': {
    soft: 'Passion and desire in an easy flow, comfortable with wanting and being wanted',
    hard: 'Desire and conflict running close together: push-pull between attraction and friction',
    conj: 'Passion and the magnetism of desire, love lived as intensity',
  },
  // Personal × Social
  'Jupiter:Sun': {
    soft: 'Generous, optimistic self-expression: broad vision and a belief in what\'s possible',
    hard: 'Ambition and overreach in tension, sometimes reaching beyond the grasp',
    conj: 'Expansive, generous identity, thinking big and leading with faith in oneself',
  },
  'Saturn:Sun': {
    soft: 'Discipline and high standards woven into identity, building steadily through earned responsibility',
    hard: 'Heavy expectations and self-doubt as a recurring thread: achievement that comes at a cost',
    conj: 'The weight of high standards in identity, shaped by responsibility and hard-won respect',
  },
  'Jupiter:Moon': {
    soft: 'Emotional generosity and optimism: comfort found in abundance and meaning',
    hard: 'Emotional excess and overreach: a tendency to feel things to an overwhelming degree',
    conj: 'Feelings on a grand scale, experiencing emotion expansively and deeply',
  },
  'Moon:Saturn': {
    soft: 'Emotional discipline that builds depth, security earned slowly and held carefully',
    hard: 'A recurring pattern of emotional withholding: warmth that can feel conditional or hard to access',
    conj: 'Emotional restraint and the dance between nurturing and limitation, love expressed through duty',
  },
  'Jupiter:Mercury': {
    soft: 'Broad thinking and expansive communication, storytelling and big ideas as a recurring thread',
    hard: 'Big talk and overconfidence: ideas that don\'t always match reality',
    conj: 'Thinking big and arguing well, wide-ranging ideas and a love of debate',
  },
  'Mercury:Saturn': {
    soft: 'Careful, deliberate communication, words chosen with intention',
    hard: 'Communication carrying weight and criticism: words that can wound or withhold',
    conj: 'Serious, precise thinking, not speaking lightly',
  },
  'Jupiter:Venus': {
    soft: 'Warmth, generosity, and an easy love of beauty as a recurring thread',
    hard: 'Excess in love: tending to overdo affection or avoid hard truths in relationships',
    conj: 'A love of beauty and abundance, giving generously and expecting to be met in kind',
  },
  'Saturn:Venus': {
    soft: 'Love that builds slowly and lasts, loyalty earned through time and commitment',
    hard: 'Love and restriction running together: emotional distance or withheld affection as a pattern',
    conj: 'A cautious approach to love: loyalty earned slowly, felt deeply, sometimes carried as burden',
  },
  'Jupiter:Mars': {
    soft: 'Enthusiasm and momentum, moving toward what\'s exciting with confidence',
    hard: 'Reckless action and overreach: burning out or overextending in pursuit of more',
    conj: 'Appetite for action and adventure, moving toward what\'s exciting without much hesitation',
  },
  'Mars:Saturn': {
    soft: 'Drive channeled through discipline, acting with patience and purpose',
    hard: 'Action blocked by structure or turned inward as frustration: effort that keeps running into walls',
    conj: 'Drive tempered by discipline, acting strategically, even when it costs something',
  },
  // Personal × Outer
  'Sun:Uranus': {
    soft: 'Originality and independence as a recurring thread, doing things a different way',
    hard: 'Disruption and identity instability: individuality in tension with belonging',
    conj: 'Independence woven into identity, never quite following the script',
  },
  'Neptune:Sun': {
    soft: 'Sensitivity and spiritual openness as a thread, drawn to beauty, meaning, and ideals',
    hard: 'A recurring pattern of idealization or confusion: seeing what one wants to see',
    conj: 'Identity and idealism fused, blurring the line between who one is and who one wishes to be',
  },
  'Pluto:Sun': {
    soft: 'A gift for transformation: reinventing and growing stronger through change',
    hard: 'Recurring encounters with power, control, and loss, shaped by forces not always chosen',
    conj: 'Intensity and reinvention as a recurring thread, forged by depth and transformation',
  },
  'Moon:Uranus': {
    soft: 'Emotional independence and a need for space, freedom valued within close bonds',
    hard: 'Emotional unpredictability and instability: nurturing that can feel erratic or suddenly absent',
    conj: 'A restless emotional life, valuing space and individuality even in intimate bonds',
  },
  'Moon:Neptune': {
    soft: 'Deep empathy and emotional sensitivity, feeling others\' pain as one\'s own',
    hard: 'Emotional confusion and porous boundaries: prone to absorbing others\' feelings or losing oneself in them',
    conj: 'The line between inner feeling and the world\'s is thin, deep empathy that can blur into dissolution',
  },
  'Moon:Pluto': {
    soft: 'Emotional depth and resilience, feeling as a process of becoming',
    hard: 'Emotional intensity that can become consuming or controlling: grief and power struggles as recurring themes',
    conj: 'Deep emotional intensity, feeling everything fully, including the most difficult parts',
  },
  'Mercury:Uranus': {
    soft: 'Quick, unconventional thinking, surprising insights that don\'t follow the usual logic',
    hard: 'Erratic communication and restless minds: disrupting conversations without always landing',
    conj: 'Fast, unpredictable minds, surprising others with what comes out of their mouths',
  },
  'Mercury:Neptune': {
    soft: 'Intuitive, imaginative communication, finding truth in metaphor and story',
    hard: 'A tendency toward vagueness or wishful thinking: clarity that\'s hard to pin down',
    conj: 'Intuitive minds and imaginative communication, truth and imagination as close neighbors',
  },
  'Mercury:Pluto': {
    soft: 'Deep, searching minds, probing beneath the surface and finding what others miss',
    hard: 'A tendency toward obsessive or controlling communication: words used to uncover but also to dominate',
    conj: 'Probing minds with a need to know the truth, uncovering what others gloss over',
  },
  'Uranus:Venus': {
    soft: 'An unconventional approach to love, freshness and freedom in relationships',
    hard: 'Sudden disruptions in love and difficulty with commitment: resisting being tied down',
    conj: 'Love on one\'s own terms, not following the relationship rulebook',
  },
  'Neptune:Venus': {
    soft: 'Romantic idealism and a capacity for transcendent, compassionate love',
    hard: 'A tendency to idealize love and feel let down by reality: prone to illusion in relationships',
    conj: 'A romantic thread: love as a spiritual longing, sometimes at odds with what\'s real',
  },
  'Pluto:Venus': {
    soft: 'Transformative love: bonds that go deep and change people in lasting ways',
    hard: 'Obsession and power dynamics in love: a pattern of all-or-nothing relationships',
    conj: 'Intense, consuming bonds, love that transforms but doesn\'t always survive the transformation',
  },
  'Mars:Uranus': {
    soft: 'Bursts of inspiration and original action, moving when others hesitate',
    hard: 'Impulsive and erratic action: prone to sudden outbursts and unpredictable choices',
    conj: 'Unpredictable energy and sudden action, surprising others, and sometimes oneself',
  },
  'Mars:Neptune': {
    soft: 'Drive in service of something meaningful, channeling energy toward ideals',
    hard: 'Energy dissipated or misdirected: acting on unclear impulses or sacrificing too easily',
    conj: 'Drive meets idealism, energy channeled toward something that can\'t always be seen or measured',
  },
  'Mars:Pluto': {
    soft: 'Powerful, focused determination, committing fully and enduring',
    hard: 'Intense will and a tendency toward compulsion or conflict: pushing hard without letting go',
    conj: 'Intense drive and unyielding will, power and determination as a recurring thread',
  },
  // Social × Social
  'Jupiter:Saturn': {
    soft: 'Expansion and structure in balance, building big with patience',
    hard: 'Growth and restraint in ongoing tension: caught between wanting more and holding back',
    conj: 'Vision and discipline fused, capable of enormous effort when committed to a direction',
  },
  // Social × Outer
  'Jupiter:Uranus': {
    soft: 'A pull toward breakthroughs and new possibilities, drawn to what\'s just over the horizon',
    hard: 'Restless expansion and sudden reversals: upending one\'s own progress',
    conj: 'Breakthrough moments and a hunger for what\'s new, unable to stay still for long',
  },
  'Jupiter:Neptune': {
    soft: 'Dreaming big and finding meaning beyond the ordinary',
    hard: 'A tendency toward escapism or grandiose idealism: losing oneself in visions',
    conj: 'Seeking something transcendent, drawn to faith, dreams, and unanswerable questions',
  },
  'Jupiter:Pluto': {
    soft: 'A drive for transformation on a large scale, thinking in decades',
    hard: 'A hunger for power dressed as ambition: overstepping in pursuit of transformation',
    conj: 'Transformation at scale, not just changing oneself but what\'s around them',
  },
  'Saturn:Uranus': {
    soft: 'Structure and disruption in balance, innovating without losing footing',
    hard: 'Ongoing friction between holding on and breaking free: tradition versus change',
    conj: 'Structure meets disruption, navigating between the need for stability and the pull toward something new',
  },
  'Neptune:Saturn': {
    soft: 'Idealism grounded in reality, pursuing meaning without losing footing',
    hard: 'Reality and illusion in conflict: struggling to bridge the practical and the transcendent',
    conj: 'Reality and idealism in ongoing conversation, carrying both the practical and the transcendent',
  },
  'Pluto:Saturn': {
    soft: 'Resilience and endurance, shaped by challenge but not defined by it',
    hard: 'Recurring encounters with loss, control, and deep pressure: having to earn endurance the hard way',
    conj: 'Endurance under pressure, shaped by difficulty, survival, and quiet resilience',
  },
}

// Cross-chart (synastry) blurbs, keyed by sorted planet pair.
// Shared by Partner Compatibility (InsightsPanel) and PersonView.
export const SYNASTRY_BLURBS = {
  'Venus:Mars': { soft: 'Desire and affection tend to flow easily between them.', hard: 'A push-pull of attraction that\'s magnetic but may require patience.' },
  'Venus:Sun':  { soft: 'One person naturally admires and is drawn to the other.', hard: 'Admiration is there, but expressing it may not always land as intended.' },
  'Moon:Sun':   { soft: 'A natural comfort. One person\'s identity tends to nurture the other\'s emotional needs.', hard: 'Identity and emotional needs can bump. Growth comes from not taking reactions personally.' },
  'Moon:Venus': { soft: 'Emotional warmth flows easily. They tend to feel safe with each other.', hard: 'Care is there, but the way it\'s expressed may sometimes miss the mark.' },
  'Moon:Mars':  { soft: 'Feelings and drive complement each other, a lively but supportive dynamic.', hard: 'One person\'s energy may sometimes overwhelm the other\'s emotional space.' },
  'Venus:Venus':{ soft: 'They tend to value and enjoy the same things, a natural ease in shared taste.', hard: 'Similar values expressed in clashing ways. They want the same things but pursue them differently.' },
  'Sun:Mars':   { soft: 'They tend to energize each other, with action and identity in easy collaboration.', hard: 'A competitive spark that can fuel motivation or create friction depending on the day.' },
  'Moon:Moon':  { soft: 'Emotional rhythms in sync. They tend to understand each other\'s moods instinctively.', hard: 'Both have strong emotional needs that can sometimes collide.' },
  'Sun:Sun':    { soft: 'A feeling of recognition. They may see themselves reflected in each other.', hard: 'Two strong identities that may sometimes compete for the spotlight.' },
  'Sun:Saturn': { soft: 'A stabilizing bond where one person helps ground and structure the other.', hard: 'One person may feel held back or judged by the other, even when that\'s not the intent.' },
  'Moon:Saturn':{ soft: 'Emotional security through commitment, a bond that tends to deepen over time.', hard: 'Warmth may sometimes feel conditional. This bond asks both to grow.' },
  'Venus:Saturn':{ soft: 'Love that builds slowly and lasts, loyalty and devotion over flash.', hard: 'Affection meets restraint. One may need more warmth than the other easily gives.' },
}

export function getSynastryBlurb(pA, pB, aspect) {
  const key = [pA, pB].sort().join(':')
  const entry = SYNASTRY_BLURBS[key]
  if (!entry) return null
  const isHard = aspect === 'square' || aspect === 'opposition'
  return isHard ? entry.hard : entry.soft
}
