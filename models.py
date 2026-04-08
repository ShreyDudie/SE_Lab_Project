from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), default='student')  # 'student', 'head', or 'admin'
    department = db.Column(db.String(50))  
    assigned_committee = db.Column(db.Integer, db.ForeignKey('committee.id'), nullable=True)
    
    # FIX: default=False ensures Heads stay pending. 
    # Logic in app.py will set Students to True upon signup.
    is_approved = db.Column(db.Boolean, default=False) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    # backref='user' in registrations, backref='recipient' in messages
    registrations = db.relationship('Registration', backref='user', lazy=True, cascade="all, delete-orphan")
    messages = db.relationship('Message', backref='recipient', lazy=True, cascade="all, delete-orphan")

class Committee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    events = db.relationship('Event', backref='committee', lazy=True, cascade="all, delete-orphan")

class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    committee_id = db.Column(db.Integer, db.ForeignKey('committee.id'))
    
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    
    details = db.Column(db.Text)
    tags = db.Column(db.String(200), default="") # Set default to empty string to avoid 'NoneType' split errors
    is_completed = db.Column(db.Boolean, default=False)

    # Branch War Results
    first_place_branch = db.Column(db.String(50))  
    second_place_branch = db.Column(db.String(50)) 
    third_place_branch = db.Column(db.String(50))  

    # Relationships
    registrations = db.relationship('Registration', backref='event', lazy=True, cascade="all, delete-orphan")

class Registration(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    event_id = db.Column(db.Integer, db.ForeignKey('event.id'))
    
    status = db.Column(db.String(20), default='Registered') # 'Registered', 'Attended'
    rating = db.Column(db.Integer, nullable=True)  
    feedback = db.Column(db.Text, nullable=True)

class Message(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100))
    content = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)