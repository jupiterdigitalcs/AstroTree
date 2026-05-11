/**
 * transitChapters.js — Plain-English life chapter copy for transit events
 *
 * Each chapter has:
 *   description — present tense (active / happening now)
 *   past        — past tense
 *   future      — future tense / anticipatory
 *   child       — optional present-tense reframe for age < 13 (when adult language doesn't fit)
 *   childPast   — optional past-tense child version
 *   childFuture — optional future-tense child version
 *   frequency   — how often it occurs
 *   rarity      — 'common' | 'notable' | 'rare' | 'once'
 */

const CHAPTERS = {

  // ── Jupiter (~12yr orbit) ────────────────────────────────────────────────────

  Jupiter_conjunction_Sun: {
    title:       'A Lucky Break',
    description: 'Doors open. Confidence rises. This is a window to expand — say yes.',
    past:        'Doors opened. Confidence rose. This was a window to expand and say yes.',
    future:      'Doors will open and confidence will rise. A window to expand — be ready to say yes.',
    child:       'A bright, expansive stretch — things tend to go your way and growth feels natural.',
    childPast:   'A bright, expansive stretch — things went your way and growth felt natural.',
    childFuture: 'A bright, expansive stretch is coming — things will tend to go your way.',
    frequency:   'Every 12 years or so',
    rarity:      'common',
  },

  Jupiter_opposition_Sun: {
    title:       'The Reach',
    description: 'Big opportunity arrives, but it may overextend you. Balance is the lesson.',
    past:        'Big opportunity arrived, but it may have overextended you. Balance was the lesson.',
    future:      'Big opportunity will arrive — but watch for overreach. Balance will be the lesson.',
    child:       'Something exciting opens up, but it might be a stretch. Learning when to reach and when to wait.',
    childPast:   'Something exciting opened up, but it may have been a stretch. A lesson in knowing your limits.',
    childFuture: 'Something exciting will open up — but it might be a stretch. Knowing when to reach matters.',
    frequency:   'Every 12 years or so',
    rarity:      'common',
  },

  Jupiter_conjunction_Moon: {
    title:       'The Heart Opens',
    description: 'Emotional warmth and generosity flow easily. A feel-good chapter.',
    past:        'Emotional warmth and generosity flowed easily. A feel-good chapter.',
    future:      'Emotional warmth and generosity will flow easily. A feel-good chapter ahead.',
    child:       'A warm, happy stretch — kindness comes naturally and home life feels good.',
    childPast:   'A warm, happy stretch — kindness came naturally and home life felt good.',
    childFuture: 'A warm, happy stretch ahead — kindness will come naturally and home life will feel good.',
    frequency:   'Every 12 years or so',
    rarity:      'common',
  },

  Jupiter_conjunction_Jupiter: {
    title:       'A Fresh Chapter',
    description: 'Your 12-year cycle resets. What new direction is calling you forward?',
    past:        'Your 12-year cycle reset. A new direction called you forward.',
    future:      'Your 12-year cycle will reset. A new direction will call you forward.',
    child:       'A big reset — the start of a new chapter in how you move through the world.',
    childPast:   'A big reset — a new chapter began in how you moved through the world.',
    childFuture: 'A big reset is coming — a new chapter in how you move through the world.',
    frequency:   'Every 12 years (around age 12, 24, 36, 48…)',
    rarity:      'common',
  },

  // ── Saturn (~29yr orbit) ─────────────────────────────────────────────────────

  Saturn_conjunction_Sun: {
    title:       'The Weight of the World',
    description: "A demanding stretch. You're being asked to build something real — on your own terms.",
    past:        "A demanding stretch. You were asked to build something real — on your own terms.",
    future:      "A demanding stretch ahead. You'll be asked to build something real — on your own terms.",
    child:       "A serious, focused stretch — things require more effort, but what you build lasts.",
    childPast:   "A serious, focused stretch — things required more effort, but what you built lasted.",
    childFuture: "A serious, focused stretch is coming — things will require more effort, but what you build will last.",
    frequency:   'A few times in a lifetime',
    rarity:      'notable',
  },

  Saturn_square_Sun: {
    title:       'The Proving Ground',
    description: "Obstacles show up to test what you're made of. Push through — it compounds.",
    past:        "Obstacles showed up to test what you were made of. Pushing through compounded.",
    future:      "Obstacles will show up to test what you're made of. Push through — it compounds.",
    child:       "A stretch where things feel harder than usual — school, friendships, or home life. What you learn now sticks.",
    childPast:   "A stretch where things felt harder than usual. What you learned then has stayed with you.",
    childFuture: "A stretch where things will feel harder than usual. What you learn then will stick.",
    frequency:   'Every 7 years or so',
    rarity:      'common',
  },

  Saturn_opposition_Sun: {
    title:       'Midcourse Correction',
    description: "A reality check on the path you've built so far. Adjust what isn't working.",
    past:        "A reality check on the path you'd built so far. A time to adjust what wasn't working.",
    future:      "A reality check on the path you've built so far. You'll need to adjust what isn't working.",
    child:       "A moment that calls for adjustment — something shifts in how you fit into your world.",
    childPast:   "A moment that called for adjustment — something shifted in how you fit into your world.",
    childFuture: "A moment that will call for adjustment — something will shift in how you fit into your world.",
    frequency:   'Every 14–15 years',
    rarity:      'notable',
  },

  Saturn_conjunction_Moon: {
    title:       'The Hard Feelings',
    description: 'Emotional weight and responsibility arrive together. Grief, duty, growing pains.',
    past:        'Emotional weight and responsibility arrived together. Grief, duty, growing pains.',
    future:      'Emotional weight and responsibility will arrive together. Grief, duty, growing pains.',
    child:       'A heavy, serious stretch emotionally. Feelings run deep and things feel more solemn than usual.',
    childPast:   'A heavy, serious stretch emotionally. Feelings ran deep and things felt more solemn than usual.',
    childFuture: 'A heavy, serious stretch emotionally is coming. Feelings will run deep.',
    frequency:   'A few times in a lifetime',
    rarity:      'notable',
  },

  Saturn_square_Moon: {
    title:       'Processing the Past',
    description: "What you've been carrying surfaces. This is the season to finally deal with it.",
    past:        "What you'd been carrying surfaced. It was the season to finally deal with it.",
    future:      "What you've been carrying will surface. This will be the season to finally deal with it.",
    child:       "Old feelings come up that need attention — a time for honesty about what's really going on inside.",
    childPast:   "Old feelings came up that needed attention — a time of honesty about what was really going on inside.",
    childFuture: "Old feelings will come up that need attention — a time for honesty about what's really going on inside.",
    frequency:   'Every 7 years or so',
    rarity:      'common',
  },

  Saturn_conjunction_Venus: {
    title:       'Love Gets Real',
    description: 'Relationships are tested for depth. The ones that hold are worth keeping.',
    past:        'Relationships were tested for depth. The ones that held were worth keeping.',
    future:      'Relationships will be tested for depth. The ones that hold will be worth keeping.',
    child:       'Friendships are tested — who really shows up for you? The ones that do are worth holding onto.',
    childPast:   'Friendships were tested — you found out who really shows up. Those connections matter.',
    childFuture: "Friendships will be tested — you'll find out who really shows up. Those connections matter.",
    frequency:   'A few times in a lifetime',
    rarity:      'notable',
  },

  Saturn_conjunction_Saturn: {
    title:       'Growing Up for Real',
    description: 'The Saturn Return. A defining life reckoning that reshapes nearly everything.',
    past:        'The Saturn Return. A defining life reckoning that reshaped nearly everything.',
    future:      'The Saturn Return. A defining life reckoning that will reshape nearly everything.',
    frequency:   'Two or three times in a lifetime (around age 29 and 58)',
    rarity:      'rare',
  },

  // ── Uranus (~84yr orbit) ─────────────────────────────────────────────────────

  Uranus_conjunction_Sun: {
    title:       'Lightning Strike',
    description: 'A rare, electric upheaval. Life reinvents itself suddenly, with or without a plan.',
    past:        'A rare, electric upheaval. Life reinvented itself suddenly, with or without a plan.',
    future:      'A rare, electric upheaval is coming. Life will reinvent itself suddenly, with or without a plan.',
    child:       "Everything shifts — your world changes in ways you didn't see coming.",
    childPast:   "Everything shifted — your world changed in ways you didn't see coming.",
    childFuture: "Everything will shift — your world will change in ways you can't yet see.",
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  Uranus_square_Sun: {
    title:       'Breaking Free',
    description: "A restless pull toward something completely different. It's okay to follow it.",
    past:        "A restless pull toward something completely different. It was okay to follow it.",
    future:      "A restless pull toward something completely different. It will be okay to follow it.",
    child:       "A restless stretch — you're outgrowing something and ready for something new.",
    childPast:   "A restless stretch — you were outgrowing something and ready for something new.",
    childFuture: "A restless stretch is coming — you'll be outgrowing something and ready for something new.",
    frequency:   'A few times in a lifetime',
    rarity:      'notable',
  },

  Uranus_opposition_Sun: {
    title:       'The Great Awakening',
    description: "An electric jolt that reframes everything. What's been real, and what's been a performance?",
    past:        "An electric jolt that reframed everything. What was real, and what was performance?",
    future:      "An electric jolt that will reframe everything. What's been real, and what's been a performance?",
    frequency:   'Once or twice in a lifetime',
    rarity:      'rare',
  },

  Uranus_conjunction_Moon: {
    title:       'The Inner Earthquake',
    description: "A sudden, electric shift in your emotional world. Who you've been at your core is changing.",
    past:        "A sudden, electric shift in your emotional world. Who you'd been at your core changed.",
    future:      "A sudden, electric shift in your emotional world is coming. Who you are at your core will change.",
    child:       'A sudden change in your home life or emotional world — things shift in big ways.',
    childPast:   'A sudden change in your home life or emotional world — things shifted in big ways.',
    childFuture: 'A sudden change in your home life or emotional world is coming — things will shift in big ways.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  Uranus_square_Moon: {
    title:       'Emotional Revolution',
    description: 'Your inner world shifts without warning. Old emotional patterns start to break.',
    past:        'Your inner world shifted without warning. Old emotional patterns started to break.',
    future:      'Your inner world will shift without warning. Old emotional patterns will start to break.',
    child:       'Your feelings and home life go through a shakeup — things that used to feel stable shift.',
    childPast:   'Your feelings and home life went through a shakeup — things that used to feel stable shifted.',
    childFuture: 'Your feelings and home life will go through a shakeup — things that feel stable will shift.',
    frequency:   'A few times in a lifetime',
    rarity:      'notable',
  },

  Uranus_opposition_Moon: {
    title:       'Freedom vs. Security',
    description: "A tension between what nurtures you and what you've outgrown. Both are real.",
    past:        "A tension between what nurtured you and what you'd outgrown. Both were real.",
    future:      "A tension between what nurtures you and what you've outgrown. Both will be real.",
    child:       "A pull between the familiar and something new — it's okay to want both.",
    childPast:   "A pull between the familiar and something new — wanting both was okay.",
    childFuture: "A pull between the familiar and something new is coming — it will be okay to want both.",
    frequency:   'Once or twice in a lifetime',
    rarity:      'rare',
  },

  Uranus_conjunction_Venus: {
    title:       'Everything Changes in Love',
    description: 'Relationships or desires overturn suddenly. What you want is transforming.',
    past:        'Relationships or desires overturned suddenly. What you wanted transformed.',
    future:      'Relationships or desires will overturn suddenly. What you want will transform.',
    child:       'Your friendships and what matters most to you shift suddenly — new connections, new interests.',
    childPast:   'Your friendships and what mattered most to you shifted suddenly — new connections, new interests.',
    childFuture: 'Your friendships and what matters most to you will shift suddenly — new connections, new interests.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  // ── Neptune (~165yr orbit) ───────────────────────────────────────────────────

  Neptune_conjunction_Sun: {
    title:       'Becoming Someone New',
    description: 'Identity softens and reshapes slowly. A quiet but total reinvention.',
    past:        'Identity softened and reshaped slowly. A quiet but total reinvention.',
    future:      'Identity will soften and reshape slowly. A quiet but total reinvention ahead.',
    child:       "A dreamy, shifting stretch — who you are is quietly changing.",
    childPast:   "A dreamy, shifting stretch — who you were quietly changed.",
    childFuture: "A dreamy, shifting stretch is coming — who you are will quietly change.",
    frequency:   'Once in a generation',
    rarity:      'once',
  },

  Neptune_square_Sun: {
    title:       'Who Am I, Really?',
    description: 'The fog chapter. Clarity is coming — but not yet. Trust the drift.',
    past:        'The fog chapter. Clarity came — but not right away. The drift had its purpose.',
    future:      'The fog chapter is coming. Clarity will arrive — but not yet. Trust the drift.',
    child:       "A hazy stretch where things feel unclear. It clears in time — trust the process.",
    childPast:   "A hazy stretch where things felt unclear. It cleared — the drift had its purpose.",
    childFuture: "A hazy stretch is coming where things feel unclear. It clears in time — trust the process.",
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  Neptune_square_Moon: {
    title:       'The Fog',
    description: 'Emotional boundaries dissolve. Intuition rises; grounding is everything.',
    past:        'Emotional boundaries dissolved. Intuition rose; grounding was everything.',
    future:      'Emotional boundaries will dissolve. Intuition will rise; grounding will be everything.',
    child:       'Emotions feel blurry and hard to pin down. Intuition is strong — lean into it.',
    childPast:   'Emotions felt blurry and hard to pin down. Intuition was strong.',
    childFuture: 'Emotions will feel blurry and hard to pin down. Intuition will be strong — lean into it.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  Neptune_conjunction_Venus: {
    title:       'Rose-Colored Everything',
    description: 'Love and creativity reach a dreamy, idealized peak. Beautiful, but hard to see clearly.',
    past:        'Love and creativity reached a dreamy, idealized peak. Beautiful, but hard to see clearly.',
    future:      'Love and creativity will reach a dreamy, idealized peak. Beautiful, but hard to see clearly.',
    child:       'A beautiful, dreamy stretch — creativity soars and everything feels magical.',
    childPast:   'A beautiful, dreamy stretch — creativity soared and everything felt magical.',
    childFuture: 'A beautiful, dreamy stretch is coming — creativity will soar and everything will feel magical.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },

  // ── Pluto (~248yr orbit) ─────────────────────────────────────────────────────

  Pluto_conjunction_Sun: {
    title:       'Rebirth',
    description: 'Total transformation of who you are. Nothing looks quite the same after this.',
    past:        'Total transformation of who you were. Nothing looked quite the same after this.',
    future:      'Total transformation of who you are is coming. Nothing will look quite the same after this.',
    child:       "A total reinvention — who you're becoming is fundamentally different from who you were.",
    childPast:   "A total reinvention — who you became was fundamentally different from who you were.",
    childFuture: "A total reinvention is coming — who you'll become will be fundamentally different.",
    frequency:   'Once in a generation',
    rarity:      'once',
  },

  Pluto_square_Sun: {
    title:       'The Pressure Chamber',
    description: "Deep, unavoidable transformation. What doesn't serve you is falling away.",
    past:        "Deep, unavoidable transformation. What didn't serve you fell away.",
    future:      "Deep, unavoidable transformation is coming. What doesn't serve you will fall away.",
    child:       "A deep, intense stretch — things that no longer fit your life start to go.",
    childPast:   "A deep, intense stretch — things that no longer fit your life fell away.",
    childFuture: "A deep, intense stretch is coming — things that no longer fit your life will start to go.",
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  Pluto_opposition_Sun: {
    title:       'The Reckoning',
    description: 'Power, control, and truth collide. A chapter of profound and lasting change.',
    past:        'Power, control, and truth collided. A chapter of profound and lasting change.',
    future:      'Power, control, and truth will collide. A chapter of profound and lasting change ahead.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },

  Pluto_conjunction_Moon: {
    title:       'The Underworld',
    description: "What's buried rises. Deep emotional transformation — often through loss or intensity.",
    past:        "What was buried rose. Deep emotional transformation — often through loss or intensity.",
    future:      "What's buried will rise. Deep emotional transformation — often through loss or intensity.",
    child:       'Deep feelings surface — things that were hidden come to light, often through big changes at home.',
    childPast:   'Deep feelings surfaced — things that were hidden came to light, often through big changes at home.',
    childFuture: 'Deep feelings will surface — things that are hidden will come to light, often through big changes at home.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },

  Pluto_square_Moon: {
    title:       'Emotional Overhaul',
    description: 'Old wounds surface for healing. Intense, yes — but ultimately freeing.',
    past:        'Old wounds surfaced for healing. Intense, yes — but ultimately freeing.',
    future:      'Old wounds will surface for healing. Intense, yes — but ultimately freeing.',
    child:       'Old hurts come up to be dealt with. It can feel intense — but getting through it frees you.',
    childPast:   'Old hurts came up to be dealt with. Intense — but getting through it freed you.',
    childFuture: 'Old hurts will come up to be dealt with. It will feel intense — but getting through it will free you.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  Pluto_conjunction_Venus: {
    title:       'Obsession & Intensity',
    description: 'Love and desire go deep. Power dynamics in relationships come into sharp focus.',
    past:        'Love and desire went deep. Power dynamics in relationships came into sharp focus.',
    future:      'Love and desire will go deep. Power dynamics in relationships will come into sharp focus.',
    child:       'Friendships and attachments become intense — what you care about feels all-consuming.',
    childPast:   'Friendships and attachments became intense — what you cared about felt all-consuming.',
    childFuture: 'Friendships and attachments will become intense — what you care about will feel all-consuming.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },

}

const CHILD_AGE_THRESHOLD = 13

/**
 * Get chapter copy for a transit, adjusted for timing tense and age.
 *
 * @param {string} transitingPlanet
 * @param {string} aspect
 * @param {string} natalPlanet
 * @param {number} [ageAtTransit] — age at the transit's peak date (used to pick child copy)
 * @returns {{ title, description, pastDesc, futureDesc, frequency, rarity }}
 */
export function getChapter(transitingPlanet, aspect, natalPlanet, ageAtTransit = 99) {
  const key = `${transitingPlanet}_${aspect}_${natalPlanet}`
  const ch  = CHAPTERS[key]

  if (!ch) {
    const fallback = `${transitingPlanet} ${aspect} ${natalPlanet}`
    return {
      title:       fallback,
      description: 'A significant planetary influence.',
      pastDesc:    'A significant planetary influence.',
      futureDesc:  'A significant planetary influence ahead.',
      frequency:   null,
      rarity:      'notable',
    }
  }

  const isChild = ageAtTransit < CHILD_AGE_THRESHOLD

  return {
    title:       ch.title,
    description: (isChild && ch.child)        ? ch.child        : ch.description,
    pastDesc:    (isChild && ch.childPast)     ? ch.childPast    : ch.past ?? ch.description,
    futureDesc:  (isChild && ch.childFuture)   ? ch.childFuture  : ch.future ?? ch.description,
    frequency:   ch.frequency,
    rarity:      ch.rarity,
  }
}
