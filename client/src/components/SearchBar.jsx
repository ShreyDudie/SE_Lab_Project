import { useState, useMemo } from 'react';
import { getCommitteeAccent } from '../utils/committeeThemes';

/**
 * Smart event search.
 *  - Type any words: every word must appear somewhere in the event's name,
 *    tags, committee or description (order does not matter).
 *  - Event-name suggestions appear as you type; tag chips narrow things further.
 *  - Shows how many events match and jumps to the results on Enter / pick.
 */
const tokenize = (s) => s.toLowerCase().split(/\s+/).filter(Boolean);

const haystack = (e) =>
  `${e.title || ''} ${e.tags || ''} ${e.committee_name || ''} ${e.details || ''}`.toLowerCase();

export default function SearchBar({ events = [], onFilter, allTags = [], resultsId = 'upcoming' }) {
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Extract unique tags from events if not provided
  const tags = useMemo(() => {
    if (allTags.length > 0) return allTags;
    const tagSet = new Set();
    events.forEach(e => {
      if (e.tags) {
        e.tags.split(',').forEach(t => {
          const trimmed = t.trim().toLowerCase();
          if (trimmed) tagSet.add(trimmed);
        });
      }
      if (e.committee_name) tagSet.add(e.committee_name.toLowerCase());
    });
    return Array.from(tagSet);
  }, [events, allTags]);

  const matches = (event, tagList, textQuery) => {
    const hay = haystack(event);
    const tagMatch = tagList.every(t => hay.includes(t));
    const words = tokenize(textQuery);
    const textMatch = words.every(w => hay.includes(w));
    return tagMatch && textMatch;
  };

  const isFiltering = activeTags.length > 0 || query.trim().length > 0;
  const matchCount = useMemo(
    () => (isFiltering ? events.filter(e => matches(e, activeTags, query)).length : events.length),
    [events, activeTags, query, isFiltering]
  );

  // Event-name suggestions (by title first, then other fields)
  const eventSuggestions = useMemo(() => {
    const words = tokenize(query);
    if (words.length === 0) return [];
    const scored = events
      .filter(e => matches(e, activeTags, query))
      .map(e => {
        const title = (e.title || '').toLowerCase();
        const inTitle = words.every(w => title.includes(w));
        const starts = title.startsWith(words[0]);
        return { e, score: (inTitle ? 2 : 0) + (starts ? 1 : 0) };
      })
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, 5).map(x => x.e);
  }, [events, activeTags, query]);

  // Tag suggestions based on the last word being typed
  const tagSuggestions = useMemo(() => {
    const last = tokenize(query).pop() || '';
    const pool = tags.filter(t => !activeTags.includes(t));
    if (!last) return pool.slice(0, 8);
    return pool.filter(t => t.includes(last)).slice(0, 6);
  }, [query, tags, activeTags]);

  const applyFilter = (tagList, textQuery) => {
    if (!onFilter) return;
    if (tagList.length === 0 && !textQuery.trim()) {
      onFilter(null); // nothing active: show the normal, unfiltered list
      return;
    }
    onFilter(events.filter(e => matches(e, tagList, textQuery)));
  };

  const scrollToResults = () => {
    const el = document.getElementById(resultsId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const addTag = (tag) => {
    const last = tokenize(query).pop() || '';
    // drop the half-typed word that this tag completes
    const nextQuery = last && tag.includes(last)
      ? query.trim().split(/\s+/).slice(0, -1).join(' ')
      : query;
    const newTags = [...activeTags, tag];
    setActiveTags(newTags);
    setQuery(nextQuery);
    applyFilter(newTags, nextQuery);
  };

  const removeTag = (tag) => {
    const newTags = activeTags.filter(t => t !== tag);
    setActiveTags(newTags);
    applyFilter(newTags, query);
  };

  const pickEvent = (event) => {
    setQuery(event.title);
    applyFilter(activeTags, event.title);
    setShowSuggestions(false);
    setTimeout(scrollToResults, 50);
  };

  const clearAll = () => {
    setQuery('');
    setActiveTags([]);
    applyFilter([], '');
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    applyFilter(activeTags, val);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowSuggestions(false);
      scrollToResults();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Backspace' && !query && activeTags.length > 0) {
      removeTag(activeTags[activeTags.length - 1]);
    }
  };

  const hasSuggestions = eventSuggestions.length > 0 || tagSuggestions.length > 0;

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar">
        <i className="fas fa-search search-icon"></i>
        {activeTags.map(tag => (
          <span className="search-tag" key={tag} onClick={() => removeTag(tag)}>
            {tag} <i className="fas fa-times"></i>
          </span>
        ))}
        <input
          type="text"
          className="search-input"
          placeholder={activeTags.length > 0 ? 'Add more filters...' : 'Search events by name, tags, committee...'}
          value={query}
          onChange={handleQueryChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          aria-label="Search events"
          autoComplete="off"
        />
        {isFiltering && (
          <button type="button" className="search-clear" onClick={clearAll} aria-label="Clear search" title="Clear search">
            <i className="fas fa-times-circle"></i>
          </button>
        )}
      </div>

      {isFiltering && (
        <div className={`search-status ${matchCount === 0 ? 'none' : ''}`} role="status" aria-live="polite">
          {matchCount === 0
            ? <>No events match &ldquo;{[query.trim(), ...activeTags].filter(Boolean).join(' + ')}&rdquo;. Try fewer words.</>
            : <><strong>{matchCount}</strong> event{matchCount === 1 ? '' : 's'} found
                <button type="button" className="search-jump" onClick={scrollToResults}>Show results <i className="fas fa-arrow-down"></i></button></>}
        </div>
      )}

      {showSuggestions && hasSuggestions && (
        <div className="search-suggestions">
          {eventSuggestions.length > 0 && (
            <>
              <span className="search-suggestions-label">Events</span>
              <div className="search-event-list">
                {eventSuggestions.map(ev => (
                  <button
                    key={ev.id}
                    type="button"
                    className="search-event-item"
                    style={{ '--accent': getCommitteeAccent(ev.committee_name) }}
                    onMouseDown={(e) => { e.preventDefault(); pickEvent(ev); }}
                  >
                    <span className="search-event-dot"></span>
                    <span className="search-event-title">{ev.title}</span>
                    <span className="search-event-meta">
                      {ev.committee_name} &middot; {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
          {tagSuggestions.length > 0 && (
            <>
              <span className="search-suggestions-label" style={{ marginTop: eventSuggestions.length ? '0.75rem' : 0 }}>
                {query ? 'Matching tags' : 'Popular tags'}
              </span>
              <div className="search-suggestions-list">
                {tagSuggestions.map(tag => (
                  <button
                    key={tag}
                    className="search-suggestion-pill"
                    onMouseDown={(e) => { e.preventDefault(); addTag(tag); }}
                  >
                    <i className="fas fa-tag"></i> {tag}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
