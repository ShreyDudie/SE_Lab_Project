import { useState, useEffect } from 'react';

/**
 * Team Formation System for Technovanza.
 * Uses localStorage for mock persistence — no backend changes.
 */

const STORAGE_KEY = 'vjti_technovanza_teams';

function loadTeams() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveTeams(teams) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}

export default function TeamFormation({ currentUser }) {
  const [teams, setTeams] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', skills: '', slots: 4, description: '' });

  useEffect(() => {
    setTeams(loadTeams());
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    const newTeam = {
      id: Date.now(),
      name: form.name,
      skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
      slots: parseInt(form.slots) || 4,
      description: form.description,
      members: [currentUser?.username || 'Anonymous'],
      createdBy: currentUser?.username || 'Anonymous',
      createdAt: new Date().toISOString(),
    };
    const updated = [newTeam, ...teams];
    setTeams(updated);
    saveTeams(updated);
    setShowCreate(false);
    setForm({ name: '', skills: '', slots: 4, description: '' });
  };

  const handleJoin = (teamId) => {
    const updated = teams.map(t => {
      if (t.id === teamId && t.members.length < t.slots) {
        const username = currentUser?.username || 'Anonymous';
        if (!t.members.includes(username)) {
          return { ...t, members: [...t.members, username] };
        }
      }
      return t;
    });
    setTeams(updated);
    saveTeams(updated);
  };

  const handleLeave = (teamId) => {
    const username = currentUser?.username || 'Anonymous';
    const updated = teams.map(t => {
      if (t.id === teamId) {
        return { ...t, members: t.members.filter(m => m !== username) };
      }
      return t;
    }).filter(t => t.members.length > 0);
    setTeams(updated);
    saveTeams(updated);
  };

  const isInTeam = (team) => {
    return team.members.includes(currentUser?.username || 'Anonymous');
  };

  return (
    <div className="team-formation">
      <div className="team-header">
        <div>
          <h3 className="team-section-title">
            <i className="fas fa-users"></i> Team Formation Hub
          </h3>
          <p className="team-section-desc">Find teammates or create a team for upcoming hackathons & competitions</p>
        </div>
        <button className="techno-register-btn" onClick={() => setShowCreate(!showCreate)}>
          <i className="fas fa-plus"></i> {showCreate ? 'Cancel' : 'Create Team'}
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form className="team-create-form" onSubmit={handleCreate}>
          <div className="team-form-row">
            <div className="team-form-group">
              <label>Team Name</label>
              <input
                type="text"
                placeholder="e.g. ByteForce"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="team-form-group">
              <label>Team Size</label>
              <select value={form.slots} onChange={e => setForm({ ...form, slots: e.target.value })}>
                <option value="2">2 members</option>
                <option value="3">3 members</option>
                <option value="4">4 members</option>
                <option value="5">5 members</option>
                <option value="6">6 members</option>
              </select>
            </div>
          </div>
          <div className="team-form-group">
            <label>Required Skills (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. Python, ML, React, Arduino"
              value={form.skills}
              onChange={e => setForm({ ...form, skills: e.target.value })}
            />
          </div>
          <div className="team-form-group">
            <label>Description</label>
            <textarea
              placeholder="What are you building? What roles do you need?"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            ></textarea>
          </div>
          <button type="submit" className="techno-register-btn" style={{ width: '100%' }}>
            <i className="fas fa-rocket"></i> Launch Team
          </button>
        </form>
      )}

      {/* Team Cards */}
      {teams.length > 0 ? (
        <div className="team-grid">
          {teams.map(team => (
            <div className="team-card" key={team.id}>
              <div className="team-card-top">
                <div className="team-card-avatar">
                  {team.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="team-card-name">{team.name}</h4>
                  <span className="team-card-creator">by {team.createdBy}</span>
                </div>
              </div>
              {team.description && (
                <p className="team-card-desc">{team.description}</p>
              )}
              <div className="team-card-skills">
                {team.skills.map(skill => (
                  <span className="team-skill-tag" key={skill}>{skill}</span>
                ))}
              </div>
              <div className="team-card-slots">
                <div className="team-slots-visual">
                  {Array.from({ length: team.slots }).map((_, i) => (
                    <div
                      key={i}
                      className={`team-slot ${i < team.members.length ? 'filled' : 'empty'}`}
                      title={i < team.members.length ? team.members[i] : 'Open slot'}
                    >
                      {i < team.members.length ? team.members[i].slice(0, 2).toUpperCase() : '+'}
                    </div>
                  ))}
                </div>
                <span className="team-slots-text">
                  {team.members.length}/{team.slots} members
                </span>
              </div>
              <div className="team-card-action">
                {isInTeam(team) ? (
                  <button className="team-leave-btn" onClick={() => handleLeave(team.id)}>
                    <i className="fas fa-sign-out-alt"></i> Leave Team
                  </button>
                ) : team.members.length < team.slots ? (
                  <button className="techno-register-btn" onClick={() => handleJoin(team.id)}>
                    <i className="fas fa-user-plus"></i> Join Team
                  </button>
                ) : (
                  <span className="team-full-badge">Team Full</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="techno-empty" style={{ marginTop: '1rem' }}>
          <div className="techno-empty-icon">🤝</div>
          <p>No teams yet. Be the first to create one!</p>
        </div>
      )}
    </div>
  );
}
