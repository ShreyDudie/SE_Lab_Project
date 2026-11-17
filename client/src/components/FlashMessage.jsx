import { useState, createContext, useContext, useCallback } from 'react';

import { playSound } from '../utils/sound';

const FlashContext = createContext(null);

export function FlashProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const dismiss = useCallback((id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const addFlash = useCallback((text, type = 'info') => {
    const id = Date.now() + Math.random();
    setMessages(prev => [...prev, { id, text, type }]);
    playSound(type === 'success' ? 'pop' : type === 'error' ? 'error' : 'tick');
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== id));
    }, 4000);
  }, []);

  return (
    <FlashContext.Provider value={addFlash}>
      {children}
      <div className="flash-container" role="status" aria-live="polite">
        {messages.map(m => (
          <div key={m.id} className={`flash-msg flash-${m.type}`}>
            <i className={`fas ${m.type === 'success' ? 'fa-check-circle' : m.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
            <span className="flash-text">{m.text}</span>
            <button type="button" className="flash-close" onClick={() => dismiss(m.id)} aria-label="Dismiss notification">
              <i className="fas fa-times"></i>
            </button>
            <span className="flash-progress"></span>
          </div>
        ))}
      </div>
    </FlashContext.Provider>
  );
}

export function useFlash() {
  return useContext(FlashContext);
}
