import { useState, useEffect } from 'react';

/**
 * Technovanza Event Discovery — Unstop-style hackathon browse system.
 * Filters events by difficulty, team size, duration on client side.
 */
export default function TechnovanzaDiscovery({ events = [], onRegister, registeredIds = [] }) {
  const [filter, setFilter] = useState({ difficulty: 'all', teamSize: 'all', type: 'all' });
  const [filteredEvents, setFilteredEvents] = useState(events);

  useEffect(() => {
    let result = [...events];

    if (filter.type !== 'all') {
      result = result.filter(e => {
        const tags = (e.tags || '').toLowerCase();
        const title = (e.title || '').toLowerCase();
        if (filter.type === 'hackathon') return tags.includes('hackathon') || title.includes('hackathon');
        if (filter.type === 'robowars') return tags.includes('robo') || title.includes('robo');
        if (filter.type === 'workshop') return tags.includes('workshop') || title.includes('workshop');
        if (filter.type === 'competition') return tags.includes('competition') || tags.includes('contest');
        return true;
      });
    }

    if (filter.difficulty !== 'all') {
      result = result.filter(e => {
        const tags = (e.tags || '').toLowerCase();
        return tags.includes(filter.difficulty);
      });
    }

    setFilteredEvents(result);
  }, [filter, events]);

  return (
    <div className="techno-discovery">
      {/* Filter Bar */}
      <div className="techno-filters">
        <div className="techno-filter-group">
          <label className="techno-filter-label">Event Type</label>
          <div className="techno-filter-pills">
            {['all', 'hackathon', 'robowars', 'workshop', 'competition'].map(t => (
              <button
                key={t}
                className={`techno-pill ${filter.type === t ? 'active' : ''}`}
                onClick={() => setFilter({ ...filter, type: t })}
              >
                {t === 'all' ? '🌐 All' : t === 'hackathon' ? '💻 Hackathons' : t === 'robowars' ? '🤖 RoboWars' : t === 'workshop' ? '🔧 Workshops' : '🏁 Contests'}
              </button>
            ))}
          </div>
        </div>
        <div className="techno-filter-group">
          <label className="techno-filter-label">Difficulty</label>
          <div className="techno-filter-pills">
            {['all', 'beginner', 'intermediate', 'advanced'].map(d => (
              <button
                key={d}
                className={`techno-pill ${filter.difficulty === d ? 'active' : ''}`}
                onClick={() => setFilter({ ...filter, difficulty: d })}
              >
                {d === 'all' ? 'Any Level' : d.charAt(0).toUpperCase() + d.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="techno-results-count">
        <span className="techno-results-number">{filteredEvents.length}</span>
        <span> events found</span>
      </div>

      {/* Event Grid */}
      {filteredEvents.length > 0 ? (
        <div className="techno-grid">
          {filteredEvents.map(event => {
            const isRegistered = registeredIds.includes(event.id);
            const tags = event.tags ? event.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
            return (
              <div className="techno-event-card" key={event.id}>
                <div className="techno-card-header">
                  <div className="techno-card-icon">
                    {tags.some(t => t.toLowerCase().includes('robo')) ? '🤖' :
                     tags.some(t => t.toLowerCase().includes('hack')) ? '💻' :
                     tags.some(t => t.toLowerCase().includes('workshop')) ? '🔧' : '⚡'}
                  </div>
                  <div className="techno-card-meta">
                    <span className="techno-card-date">
                      {event.date ? new Date(event.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                    <span className="techno-card-time">{event.start_time}</span>
                  </div>
                </div>
                <h3 className="techno-card-title">{event.title}</h3>
                {event.details && (
                  <p className="techno-card-desc">
                    {event.details.length > 100 ? event.details.substring(0, 100) + '...' : event.details}
                  </p>
                )}
                <div className="techno-card-tags">
                  {tags.slice(0, 3).map(tag => (
                    <span className="techno-tag" key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="techno-card-stats">
                  <span><i className="fas fa-users"></i> {event.registration_count || 0} registered</span>
                </div>
                <div className="techno-card-actions">
                  {isRegistered ? (
                    <span className="techno-registered-badge">
                      <i className="fas fa-check-circle"></i> Registered
                    </span>
                  ) : (
                    <button className="techno-register-btn" onClick={() => onRegister && onRegister(event.id)}>
                      <i className="fas fa-bolt"></i> Register Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="techno-empty">
          <div className="techno-empty-icon">🔍</div>
          <p>No events match your filters. Try adjusting the criteria.</p>
        </div>
      )}
    </div>
  );
}
