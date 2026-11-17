from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

# ─── Normalized Lookup Tables ─────────────────────────────────────

class Department(db.Model):
    """Normalized department/branch entity — eliminates raw string 
    references scattered across User and Event winner columns."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    users = db.relationship('User', backref='dept', lazy=True)
    event_results = db.relationship('EventResult', backref='department', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }


class Tag(db.Model):
    """Normalized tag entity — replaces the comma-separated 
    Event.tags string to satisfy 1NF."""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }


# ─── Junction / Association Tables ────────────────────────────────

class EventTag(db.Model):
    """Many-to-many junction between Event and Tag (1NF fix)."""
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    tag_id = db.Column(db.Integer, db.ForeignKey('tag.id'), nullable=False)


class EventResult(db.Model):
    """Normalized event placements — replaces the three 
    first/second/third_place_branch columns in Event (3NF fix).
    Each row represents one placement for one event."""
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'), nullable=False)
    place = db.Column(db.Integer, nullable=False)  # 1, 2, or 3
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'), nullable=False)

    event = db.relationship('Event', backref='results')

    def to_dict(self):
        return {
            'id': self.id,
            'event_id': self.event_id,
            'place': self.place,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None
        }


# ─── Core Domain Tables ──────────────────────────────────────────

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='student')
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'), nullable=True)
    assigned_committee = db.Column(db.Integer, db.ForeignKey('committee.id'), nullable=True)
    is_approved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    registrations = db.relationship('Registration', backref='user', lazy=True, cascade="all, delete-orphan")
    messages = db.relationship('Message', backref='recipient', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'department': self.dept.name if self.dept else None,
            'department_id': self.department_id,
            'assigned_committee': self.assigned_committee,
            'is_approved': self.is_approved,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Committee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    events = db.relationship('Event', backref='committee', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }


class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    committee_id = db.Column(db.Integer, db.ForeignKey('committee.id'))
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    details = db.Column(db.Text)
    is_completed = db.Column(db.Boolean, default=False)
    registrations = db.relationship('Registration', backref='event', lazy=True, cascade="all, delete-orphan")
    tags = db.relationship('Tag', secondary='event_tag', backref='events', lazy=True)

    def _get_place(self, place_num):
        """Helper to get the department name for a specific podium place."""
        for r in self.results:
            if r.place == place_num:
                return r.department.name if r.department else None
        return None

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'committee_id': self.committee_id,
            'committee_name': self.committee.name if self.committee else None,
            'date': self.date.isoformat() if self.date else None,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'details': self.details,
            'tags': ', '.join(t.name for t in self.tags) if self.tags else '',
            'is_completed': self.is_completed,
            'first_place_branch': self._get_place(1),
            'second_place_branch': self._get_place(2),
            'third_place_branch': self._get_place(3),
            'registration_count': len(self.registrations) if self.registrations else 0
        }


class Registration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'))
    status = db.Column(db.String(20), default='Registered')
    rating = db.Column(db.Integer, nullable=True)
    feedback = db.Column(db.Text, nullable=True)
    scanned_at = db.Column(db.DateTime, nullable=True)  # set when the ticket QR is scanned at entry

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_id': self.event_id,
            'status': self.status,
            'scanned_at': self.scanned_at.isoformat() if self.scanned_at else None,
            'rating': self.rating,
            'feedback': self.feedback,
            'username': self.user.username if self.user else None,
            'department': self.user.dept.name if self.user and self.user.dept else None,
            'event_title': self.event.title if self.event else None,
            'event_committee_name': self.event.committee.name if self.event and self.event.committee else None
        }


class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100))
    content = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'is_read': self.is_read
        }