import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const FlashContext = createContext(null);

export function FlashProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const addFlash = useCallback((text, type = 'info') => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== id));
    }, 4000);
  }, []);

  return (
    <FlashContext.Provider value={addFlash}>
      {children}
      <div className="flash-container">
        {messages.map(m => (
          <div key={m.id} className={`flash-msg flash-${m.type}`}>
            <i className={`fas ${m.type === 'success' ? 'fa-check-circle' : m.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
            {m.text}
          </div>
        ))}
      </div>
    </FlashContext.Provider>
  );
}

export function useFlash() {
  return useContext(FlashContext);
}
