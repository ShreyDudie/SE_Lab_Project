import { useSyncExternalStore } from 'react';
import { isSoundEnabled, setSoundEnabled, subscribeSound, playSound } from '../utils/sound';

/** Navbar mute / unmute switch for sound effects (remembered between visits). */
export default function SoundToggle() {
  const on = useSyncExternalStore(subscribeSound, isSoundEnabled, () => true);

  const toggle = () => {
    const next = !on;
    setSoundEnabled(next);
    if (next) playSound('tick'); // audible confirmation that sound is back on
  };

  return (
    <button
      type="button"
      className={`sound-toggle ${on ? '' : 'is-off'}`}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Mute sound effects' : 'Turn on sound effects'}
      title={on ? 'Sound on (click to mute)' : 'Sound off (click to unmute)'}
    >
      <i className={`fas ${on ? 'fa-volume-up' : 'fa-volume-mute'}`}></i>
    </button>
  );
}
