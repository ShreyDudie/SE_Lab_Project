import { useState, useMemo } from 'react';

/**
 * Smart tag-based search component.
 * Filters events by tags with autocomplete suggestions.
 */
export default function SearchBar({ events = [], onFilter, allTags = [] }) {
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

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!query.trim()) return tags.filter(t => !activeTags.includes(t)).slice(0, 8);
    return tags
      .filter(t => t.includes(query.toLowerCase()) && !activeTags.includes(t))
      .slice(0, 6);
  }, [query, tags, activeTags]);

  const addTag = (tag) => {
    const newTags = [...activeTags, tag];
    setActiveTags(newTags);
    setQuery('');
    filterEvents(newTags, '');
  };

  const removeTag = (tag) => {
    const newTags = activeTags.filter(t => t !== tag);
    setActiveTags(newTags);
    filterEvents(newTags, query);
  };

  const filterEvents = (tagList, textQuery) => {
    if (!onFilter) return;

    const filtered = events.filter(event => {
      // Tag match
      const eventTags = (event.tags || '').toLowerCase();
      const eventName = (event.title || '').toLowerCase();
      const eventCommittee = (event.committee_name || '').toLowerCase();
      const combined = `${eventTags} ${eventName} ${eventCommittee}`;

      const tagMatch = tagList.length === 0 || tagList.every(t => combined.includes(t));

      // Text match (fuzzy-ish)
      const textMatch = !textQuery.trim() || combined.includes(textQuery.toLowerCase());

      return tagMatch && textMatch;
    });

    onFilter(filtered);
  };

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    filterEvents(activeTags, val);
  };

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
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div className="search-suggestions">
          <span className="search-suggestions-label">
            {query ? 'Matching tags' : 'Popular tags'}
          </span>
          <div className="search-suggestions-list">
            {suggestions.map(tag => (
              <button
                key={tag}
                className="search-suggestion-pill"
                onMouseDown={(e) => { e.preventDefault(); addTag(tag); }}
              >
                <i className="fas fa-tag"></i> {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
