/**
 * Decorative side panels for the empty left/right margins on wide screens.
 *
 * Purely visual (aria-hidden, pointer-events none, hidden on narrow viewports).
 * Which variant shows is driven by CSS from <body data-theme="...">, which the
 * committee page sets for students; every other page gets the default
 * institutional look.
 */
const RAIN = [
  '01{}</>0x1F&&fn()=>10[];',
  'if(x){run();}while(1)01;',
  'git push && 0b1010 <T>;',
  'def go(): return 1 << 0;',
  '#include <vjti> int main',
];

function Rain({ offset = 0 }) {
  return (
    <div className="sd-rain">
      {RAIN.map((s, i) => (
        <span key={i} style={{ left: `${8 + ((i + offset) * 19) % 78}%`, animationDelay: `${-(i * 3.1 + offset)}s`, animationDuration: `${13 + i * 2.3}s` }}>
          {s}
        </span>
      ))}
    </div>
  );
}

function Side({ side }) {
  const left = side === 'left';
  return (
    <div className={`sd-side sd-${side}`}>
      {/* ── Default (institutional) ── */}
      <div className="sd-layer sd-default">
        <div className="sd-dots"></div>
        <div className="sd-line"></div>
        <span className="sd-orb o1"></span>
        <span className="sd-orb o2"></span>
        <div className="sd-vtext">{left ? 'VJTI · EST. 1887' : 'COMMITTEE MANAGER'}</div>
        <div className="sd-icons">
          {left ? (
            <>
              <i className="fas fa-code" style={{ '--c': '#22C55E' }}></i>
              <i className="fas fa-microchip" style={{ '--c': '#3B82F6' }}></i>
            </>
          ) : (
            <>
              <i className="fas fa-palette" style={{ '--c': '#DC2626' }}></i>
              <i className="fas fa-futbol" style={{ '--c': '#F59E0B' }}></i>
            </>
          )}
        </div>
      </div>

      {/* ── Technovanza: neon grid ── */}
      <div className="sd-layer sd-technovanza">
        <div className="sd-grid"></div>
        <div className="sd-line"></div>
        <span className="sd-scan"></span>
        <span className="sd-node n1"></span>
        <span className="sd-node n2"></span>
        <span className="sd-node n3"></span>
        <div className="sd-vtext">{left ? 'TECHNOVANZA' : 'SILVER JUBILEE · 25 YEARS'}</div>
      </div>

      {/* ── COC: code rain ── */}
      <div className="sd-layer sd-coc">
        <Rain offset={left ? 0 : 2} />
        <div className="sd-line"></div>
        <div className="sd-vtext">{left ? 'CODE. COMPETE. CONQUER.' : '</> COC'}</div>
      </div>

      {/* ── Enthusia: stadium stripes ── */}
      <div className="sd-layer sd-enthusia">
        <div className="sd-stripes"></div>
        <div className="sd-line"></div>
        <i className={`sd-bigicon fas ${left ? 'fa-trophy' : 'fa-futbol'}`}></i>
        <div className="sd-vtext">{left ? 'ENTHUSIA' : 'CELEBRATING WOMEN CHAMPIONS'}</div>
      </div>

      {/* ── Pratibimb: film strip + curtain ── */}
      <div className="sd-layer sd-pratibimb">
        <div className="sd-curtain"></div>
        <div className="sd-film"></div>
        <div className="sd-line"></div>
        <i className={`sd-bigicon fas ${left ? 'fa-palette' : 'fa-music'}`}></i>
        <div className="sd-vtext glitch">{left ? 'PRATIBIMB' : 'POP MEETS PARADOX'}</div>
      </div>
    </div>
  );
}

export default function SideDecor() {
  return (
    <div className="side-decor" aria-hidden="true">
      <Side side="left" />
      <Side side="right" />
    </div>
  );
}
