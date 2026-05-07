// Lightweight placeholder for the Three.js OpsPanelGlobe. Renders the
// same outer panel + header chip + stat strip layout so the page
// doesn't reflow when the real globe hydrates. The "globe" inside is a
// pure-SVG stand-in (4 latitude + 3 longitude ellipses) so visitors on
// slow connections still see something on-brand.

const RADIUS = 170;
const CENTER = 200;

export function OpsPanelGlobeFallback() {
  return (
    <div className="glass-card-static ops-panel">
      <div className="ops-panel-head">
        <span>Nexus · Live map</span>
        <span className="live">
          <span className="dot" aria-hidden /> Loading
        </span>
      </div>

      <div className="globe-wrap" aria-hidden>
        <svg viewBox="0 0 400 400">
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="rgba(2, 6, 14, 0.85)"
            stroke="rgba(95, 255, 215, 0.40)"
            strokeWidth="1.2"
          />
          {[0.6, 1.0, 1.4].map((rx, i) => (
            <ellipse
              key={`lon-${i}`}
              cx={CENTER}
              cy={CENTER}
              rx={RADIUS * rx * 0.55}
              ry={RADIUS}
              fill="none"
              stroke="rgba(95, 217, 255, 0.18)"
              strokeWidth="1"
            />
          ))}
          {[0.35, 0.65, 0.85, 0.95].map((ry, i) => (
            <ellipse
              key={`lat-${i}`}
              cx={CENTER}
              cy={CENTER}
              rx={RADIUS}
              ry={RADIUS * ry}
              fill="none"
              stroke="rgba(95, 217, 255, 0.18)"
              strokeWidth="1"
            />
          ))}
        </svg>
      </div>

      <div className="globe-stat-strip">
        <div className="cell">
          <span className="k">Active now</span>
          <span className="v num-tab">-</span>
        </div>
        <div className="cell">
          <span className="k">Recent · 60m</span>
          <span className="v num-tab">-</span>
        </div>
        <div className="cell">
          <span className="k">Countries</span>
          <span className="v num-tab">-</span>
        </div>
      </div>
    </div>
  );
}
