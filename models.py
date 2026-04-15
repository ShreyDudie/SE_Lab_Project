from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='student')  
    department = db.Column(db.String(50))  
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
            'department': self.department,
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
    tags = db.Column(db.String(200), default="") 
    is_completed = db.Column(db.Boolean, default=False)
    first_place_branch = db.Column(db.String(50))  
    second_place_branch = db.Column(db.String(50)) 
    third_place_branch = db.Column(db.String(50))  
    registrations = db.relationship('Registration', backref='event', lazy=True, cascade="all, delete-orphan")

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
            'tags': self.tags,
            'is_completed': self.is_completed,
            'first_place_branch': self.first_place_branch,
            'second_place_branch': self.second_place_branch,
            'third_place_branch': self.third_place_branch,
            'registration_count': len(self.registrations) if self.registrations else 0
        }

class Registration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'))
    status = db.Column(db.String(20), default='Registered') 
    rating = db.Column(db.Integer, nullable=True)  
    feedback = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event_id': self.event_id,
            'status': self.status,
            'rating': self.rating,
            'feedback': self.feedback,
            'username': self.user.username if self.user else None,
            'department': self.user.department if self.user else None,
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