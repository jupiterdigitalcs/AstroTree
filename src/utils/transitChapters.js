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

  Jupiter_conjunction_Mars: {
    title:       'Full Throttle',
    description: 'Energy surges. Ambition rises. Physical drive and confidence peak at the same time.',
    past:        'Energy surged. Ambition rose. Physical drive and confidence peaked at the same time.',
    future:      'Energy will surge. Ambition will rise. Physical drive and confidence will peak together.',
    child:       'A high-energy stretch where you want to try everything and feel unstoppable.',
    childPast:   'A high-energy stretch where you wanted to try everything and felt unstoppable.',
    childFuture: 'A high-energy stretch is coming where you want to try everything.',
    frequency:   'Every 12 years or so',
    rarity:      'common',
  },

  Jupiter_opposition_Mars: {
    title:       'Too Much Gas',
    description: 'Drive runs high, maybe too high. The impulse is to push harder. Channel it before it scatters.',
    past:        'Drive ran high, maybe too high. The impulse was to push harder. Channeling it mattered.',
    future:      'Drive will run high, maybe too high. Channel it before it scatters.',
    child:       'Energy and excitement can tip into overdoing it. Learning to pace matters here.',
    childPast:   'Energy and excitement tipped into overdoing it. Learning to pace mattered.',
    childFuture: 'Energy and excitement can tip into overdoing it. Pacing will matter.',
    frequency:   'Every 12 years or so',
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

  Saturn_conjunction_Mars: {
    title:       'Action on Hold',
    description: 'Drive meets resistance. Everything takes longer. What you push through now is built to last.',
    past:        'Drive met resistance. Everything took longer. What you pushed through was built to last.',
    future:      'Drive will meet resistance. Everything will take longer. What you push through will last.',
    child:       'A slower, more frustrating stretch. Things take effort, but the effort pays off.',
    childPast:   'A slower, more frustrating stretch. Things took effort, but the effort paid off.',
    childFuture: 'A slower, more frustrating stretch is ahead. Things will take effort, but it pays off.',
    frequency:   'A few times in a lifetime',
    rarity:      'notable',
  },

  Saturn_square_Mars: {
    title:       'The Slow Burn',
    description: 'Friction between what you want to do and what the situation allows. Anger can simmer. Patience is the work.',
    past:        'Friction between what you wanted to do and what the situation allowed. Patience was the work.',
    future:      'Friction between what you want to do and what the situation allows. Patience will be the work.',
    child:       'Feeling held back or frustrated. The anger is real, but so is the lesson in patience.',
    childPast:   'Feeling held back or frustrated. The anger was real, but so was the lesson.',
    childFuture: 'Feeling held back or frustrated is coming. The anger will be real, but so will the lesson.',
    frequency:   'Every 7 years or so',
    rarity:      'common',
  },

  Saturn_opposition_Mars: {
    title:       'Push Meets Wall',
    description: 'External forces slow you down. Others test your will. Strategic patience wins over brute force.',
    past:        'External forces slowed you down. Others tested your will. Strategic patience won over brute force.',
    future:      'External forces will slow you down. Others will test your will. Strategic patience wins.',
    child:       'Other people or rules hold you back from what you want to do. Frustrating, but it builds resilience.',
    childPast:   'Other people or rules held you back. Frustrating, but it built resilience.',
    childFuture: 'Other people or rules may hold you back. Frustrating, but it builds resilience.',
    frequency:   'Every 14-15 years',
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

  Uranus_conjunction_Mars: {
    title:       'Spark and Powder',
    description: 'Sudden bursts of energy, recklessness, breakthroughs. If you can steer it, it transforms everything.',
    past:        'Sudden bursts of energy, recklessness, breakthroughs. When steered, it transformed everything.',
    future:      'Sudden bursts of energy, recklessness, breakthroughs ahead. Steer it and it transforms everything.',
    child:       'Impulsive energy and sudden physical changes. Wild and exciting, but it can be a lot.',
    childPast:   'Impulsive energy and sudden physical changes. Wild and exciting, but it was a lot.',
    childFuture: 'Impulsive energy and sudden changes are coming. Wild and exciting, but it can be a lot.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  Uranus_square_Mars: {
    title:       'The Reckless Edge',
    description: 'Restless, impatient energy that wants out. The urge to break free can be physical. Channel it or it channels you.',
    past:        'Restless, impatient energy that wanted out. The urge to break free was physical.',
    future:      'Restless, impatient energy will want out. The urge to break free can be physical.',
    child:       'Energy and impatience run high. A need to break out of routines. It needs a channel.',
    childPast:   'Energy and impatience ran high. The need to break out of routines was strong.',
    childFuture: 'Energy and impatience will run high. A need to break out of routines. Find a channel.',
    frequency:   'A few times in a lifetime',
    rarity:      'notable',
  },

  Uranus_opposition_Mars: {
    title:       'Flash Point',
    description: 'Others push your buttons in unexpected ways. Sudden conflicts, sudden freedom. Both are possible.',
    past:        'Others pushed your buttons in unexpected ways. Sudden conflicts, sudden freedom.',
    future:      'Others will push your buttons in unexpected ways. Sudden conflicts, sudden freedom.',
    child:       'Clashes seem to come out of nowhere. People and situations provoke reactions you did not see coming.',
    childPast:   'Clashes came out of nowhere. People and situations provoked reactions you did not see coming.',
    childFuture: 'Clashes may come out of nowhere. People and situations will provoke unexpected reactions.',
    frequency:   'Once or twice in a lifetime',
    rarity:      'rare',
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

  Neptune_opposition_Sun: {
    title:       'The Mirror Fogs',
    description: 'Who you are gets reflected in distorted ways. Others see someone you do not recognize. Stay grounded in what you know.',
    past:        'Who you were got reflected in distorted ways. Others saw someone you did not recognize.',
    future:      'Who you are will get reflected in distorted ways. Stay grounded in what you know.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  Neptune_opposition_Moon: {
    title:       'Emotional Blur',
    description: 'Emotional boundaries with others dissolve. Compassion deepens, but so can confusion. Know where you end and they begin.',
    past:        'Emotional boundaries with others dissolved. Compassion deepened, but so did confusion.',
    future:      'Emotional boundaries with others will dissolve. Compassion deepens, but so can confusion.',
    child:       'Feelings get tangled up with other people. Hard to tell whose emotions belong to whom.',
    childPast:   'Feelings got tangled up with other people. Hard to tell whose emotions belonged to whom.',
    childFuture: 'Feelings may get tangled up with other people. Knowing your own feelings from theirs will matter.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  Neptune_opposition_Venus: {
    title:       'The Longing',
    description: 'Love and desire pull toward something just out of reach. Beautiful ache, but check what is real.',
    past:        'Love and desire pulled toward something just out of reach. Beautiful ache, but clarity came later.',
    future:      'Love and desire will pull toward something just out of reach. Beautiful, but check what is real.',
    child:       'Wanting something or someone in a way that feels bigger than usual. Not everything is what it seems.',
    childPast:   'Wanting something or someone in a way that felt bigger than usual. Not everything was what it seemed.',
    childFuture: 'Wanting something or someone in a way that feels bigger than usual. Not everything will be what it seems.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },

  Neptune_conjunction_Mars: {
    title:       'The Dissolve',
    description: 'Energy and drive diffuse. Harder to know what to fight for. This is softening, not weakness.',
    past:        'Energy and drive diffused. It was harder to know what to fight for. A softening, not weakness.',
    future:      'Energy and drive will diffuse. Harder to know what to fight for. Softening, not weakness.',
    child:       'Energy feels scattered and unfocused. What used to motivate does not land the same way.',
    childPast:   'Energy felt scattered and unfocused. What used to motivate did not land the same way.',
    childFuture: 'Energy may feel scattered and unfocused. What motivates you will shift.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },

  Neptune_square_Mars: {
    title:       'Chasing Fog',
    description: 'Actions misfire. What you are chasing might be an illusion. Pause before pushing harder.',
    past:        'Actions misfired. What you were chasing may have been an illusion.',
    future:      'Actions may misfire. What you are chasing might be an illusion. Pause before pushing harder.',
    child:       'Effort does not connect like it should. Trying harder does not always help here.',
    childPast:   'Effort did not connect like it should have. Trying harder did not always help.',
    childFuture: 'Effort may not connect the way it should. Trying harder will not always help.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  Neptune_opposition_Mars: {
    title:       'The Drain',
    description: 'Others can drain your energy or mislead your efforts. Boundaries matter more than force right now.',
    past:        'Others drained energy or misled efforts. Boundaries mattered more than force.',
    future:      'Others may drain your energy or mislead your efforts. Boundaries will matter more than force.',
    child:       'Other people can sap your motivation or send you in circles. Know when to step back.',
    childPast:   'Other people sapped motivation or sent you in circles.',
    childFuture: 'Other people may sap your motivation. Know when to step back.',
    frequency:   'Once in a lifetime',
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

  Pluto_conjunction_Mars: {
    title:       'Raw Power',
    description: 'Intense, compulsive drive. Power dynamics surface in action and conflict. Controlled force transforms everything.',
    past:        'Intense, compulsive drive. Power dynamics surfaced in action and conflict. Controlled force transformed everything.',
    future:      'Intense, compulsive drive ahead. Power dynamics will surface. Controlled force will transform everything.',
    child:       'Physical intensity and strong willpower. Conflicts can feel very serious, even when they are small.',
    childPast:   'Physical intensity and strong willpower. Conflicts felt very serious, even the small ones.',
    childFuture: 'Physical intensity and strong willpower ahead. Conflicts may feel very serious.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },

  Pluto_square_Mars: {
    title:       'The Power Struggle',
    description: 'Compulsive energy and control issues. What you are fighting for reveals what matters most.',
    past:        'Compulsive energy and control issues. What you were fighting for revealed what mattered most.',
    future:      'Compulsive energy and control issues ahead. What you fight for will reveal what matters most.',
    child:       'Strong urges to push, compete, or dominate. The intensity is real and needs a healthy outlet.',
    childPast:   'Strong urges to push, compete, or dominate. The intensity was real.',
    childFuture: 'Strong urges to push, compete, or dominate will surface. The intensity will need a healthy outlet.',
    frequency:   'Once in a lifetime',
    rarity:      'once',
  },

  Pluto_opposition_Mars: {
    title:       'Force Meets Force',
    description: 'Others mirror your deepest drives back at you. Power dynamics reach a peak. Transformation comes through confrontation.',
    past:        'Others mirrored your deepest drives back at you. Power dynamics peaked.',
    future:      'Others will mirror your deepest drives back at you. Power dynamics will peak.',
    child:       'Intense clashes with others. What feels like a fight is often about something much deeper.',
    childPast:   'Intense clashes with others. What felt like a fight was about something much deeper.',
    childFuture: 'Intense clashes with others may come. What feels like a fight will be about something deeper.',
    frequency:   'Once in a generation',
    rarity:      'once',
  },

}

const CHILD_AGE_THRESHOLD = 13

/**
 * Check whether a curated chapter exists for this transit combination.
 * Used by The Current to filter out noise (transits without chapters are not
 * impactful enough to surface in group analysis).
 */
export function hasChapter(transitingPlanet, aspect, natalPlanet) {
  return `${transitingPlanet}_${aspect}_${natalPlanet}` in CHAPTERS
}

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
