export default function SlideIntro({ data }) {
  return (
    <div className="dig-slide-content">
      <p className="dig-label dig-fly-in" style={{ '--i': 0 }}>The DIG</p>
      <h1 className="dig-headline dig-headline--gold dig-fly-in" style={{ '--i': 1 }}>
        Your {data.familyName === 'group' ? "Group's" : "Family's"} Cosmic DNA
      </h1>
      <div className="dig-divider dig-fly-in" style={{ '--i': 2 }} />
      <p className="dig-body dig-fly-in" style={{ '--i': 3 }}>
        {data.memberCount} members. Millions of cosmic combinations.
        <br />Here's what makes yours unique.
      </p>
    </div>
  )
}
