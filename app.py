from flask import Flask, render_template, redirect, url_for, request, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, Committee, Event, Registration, Message
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv() # Loads variables from .env
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-key-for-dev')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///default.db')


db.init_app(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- HELPERS ---
def get_leaderboard(committee_id=None):
    branches = ['IT', 'CS', 'Mech', 'Prod', 'Text', 'EXTC', 'Tronics', 'Trical', 'Civil', 'Diploma']
    query = Event.query.filter_by(is_completed=True)
    if committee_id:
        query = query.filter_by(committee_id=committee_id)
    
    events = query.all()
    leaderboard = {branch: 0 for branch in branches} 
    
    for e in events:
        for branch, pts in [(e.first_place_branch, 10), (e.second_place_branch, 5), (e.third_place_branch, 3)]:
            if branch in leaderboard: 
                leaderboard[branch] += pts
                
    return sorted(leaderboard.items(), key=lambda x: x[1], reverse=True)

# --- NAVIGATION & INDEX ---
@app.route('/')
def index():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    
    if current_user.role in ['head', 'admin']:
        return redirect(url_for('dashboard'))
    
    today = datetime.now().date()
    
    # Discovery Hub Data
    upcoming = Event.query.filter(Event.date >= today, Event.is_completed == False).order_by(Event.date).all()
    past = Event.query.filter_by(is_completed=True).order_by(Event.date.desc()).limit(6).all()
    committees = Committee.query.all()
    
    # Personalized Recommendations
    recommended = []
    if current_user.department:
        search_term = f"%{current_user.department}%"
        recommended = Event.query.filter(Event.tags.ilike(search_term), Event.is_completed == False).limit(5).all()

    return render_template('index.html', committees=committees, upcoming=upcoming, recommended=recommended, past=past)

@app.route('/committee/<int:id>')
@login_required
def committee_home(id):
    committee = Committee.query.get_or_404(id)
    leaderboard = get_leaderboard(id)
    
    # We fetch upcoming events for this specific committee to power the horizontal scroller
    upcoming_events = Event.query.filter_by(committee_id=id, is_completed=False).order_by(Event.date.asc()).all()
    
    registered_event_ids = []
    participants = []

    if current_user.role == 'student':
        regs = Registration.query.filter_by(user_id=current_user.id).all()
        registered_event_ids = [r.event_id for r in regs]
    
    if current_user.role == 'head':
        participants = Registration.query.join(Event).filter(Event.committee_id == id).all()

    return render_template('committee.html', 
                           committee=committee, 
                           leaderboard=leaderboard, 
                           upcoming_events=upcoming_events,
                           registered_event_ids=registered_event_ids,
                           participants=participants)

# --- THE UNIFIED DASHBOARD ENGINE ---
@app.route('/dashboard')
@login_required
def dashboard():
    if current_user.role == 'head' and not current_user.is_approved:
        return render_template('pending_approval.html')

    if current_user.role == 'student':
        # Get active registrations for the student
        user_regs = Registration.query.filter_by(user_id=current_user.id).all()
        my_events = [r.event for r in user_regs if not r.event.is_completed]
        messages = Message.query.filter_by(user_id=current_user.id).order_by(Message.timestamp.desc()).all()
        
        return render_template('dashboard.html', my_events=my_events, messages=messages)

    elif current_user.role == 'head':
        committee = Committee.query.get(current_user.assigned_committee)
        active_events = Event.query.filter_by(committee_id=committee.id, is_completed=False).all()
        return render_template('dashboard.html', committee=committee, active_events=active_events)

    elif current_user.role == 'admin':
        # YOU NEED THESE THREE LINES:
        all_events = Event.query.order_by(Event.date.desc()).all()
        pending_heads = User.query.filter_by(role='head', is_approved=False).all()
        committees = Committee.query.all()
        
        return render_template('dashboard.html', 
                               all_events=all_events, 
                               pending_heads=pending_heads, 
                               committees=committees)

# --- REGISTRATION LOGIC ---
@app.route('/register_event/<int:event_id>', methods=['GET', 'POST'])
@login_required
def register_event(event_id):
    new_event = Event.query.get_or_404(event_id)
    existing_reg = Registration.query.filter_by(user_id=current_user.id, event_id=event_id).first()
    
    if existing_reg:
        flash('Already registered for this event.', 'info')
        return redirect(url_for('dashboard'))

    # Time Conflict Check
    user_regs = Registration.query.filter_by(user_id=current_user.id).all()
    for reg in user_regs:
        e = reg.event
        if e.date == new_event.date:
            if not (new_event.end_time <= e.start_time or new_event.start_time >= e.end_time):
                flash(f'Time Conflict! Already registered for {e.title} at this time.', 'danger')
                return redirect(url_for('index'))

    db.session.add(Registration(user_id=current_user.id, event_id=event_id))
    db.session.commit()
    flash('Successfully registered!', 'success')
    return redirect(url_for('dashboard'))

@app.route('/unregister/<int:reg_id>')
@login_required
def unregister(reg_id):
    reg = Registration.query.get_or_404(reg_id)
    if reg.user_id == current_user.id:
        db.session.delete(reg)
        db.session.commit()
        flash('Registration cancelled.', 'info')
    return redirect(url_for('dashboard'))

# --- HEAD MANAGEMENT ACTIONS ---
@app.route('/add_event/<int:committee_id>', methods=['POST'])
@login_required
def add_event(committee_id):
    if current_user.role in ['admin', 'head']:
        new_event = Event(
            title=request.form.get('title'),
            date=datetime.strptime(request.form.get('date'), '%Y-%m-%d').date(),
            start_time=datetime.strptime(request.form.get('start_time'), '%H:%M').time(),
            end_time=datetime.strptime(request.form.get('end_time'), '%H:%M').time(),
            details=request.form.get('details'),
            tags=request.form.get('tags', ""),
            committee_id=committee_id
        )
        db.session.add(new_event)
        db.session.commit()
        flash('Event created!', 'success')
    return redirect(url_for('committee_home', id=committee_id))

@app.route('/edit_event/<int:event_id>', methods=['POST'])
@login_required
def edit_event(event_id):
    event = Event.query.get_or_404(event_id)
    if current_user.role == 'admin' or (current_user.role == 'head' and current_user.assigned_committee == event.committee_id):
        event.title = request.form.get('title')
        event.details = request.form.get('details')
        event.tags = request.form.get('tags', "")
        event.date = datetime.strptime(request.form.get('date'), '%Y-%m-%d').date()
        event.start_time = datetime.strptime(request.form.get('start_time'), '%H:%M').time()
        event.end_time = datetime.strptime(request.form.get('end_time'), '%H:%M').time()
        db.session.commit()
        flash('Event updated!', 'success')
    return redirect(url_for('committee_home', id=event.committee_id))

@app.route('/delete_event/<int:event_id>')
@login_required
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)
    comm_id = event.committee_id
    if current_user.role == 'admin' or (current_user.role == 'head' and current_user.assigned_committee == comm_id):
        Registration.query.filter_by(event_id=event.id).delete()
        db.session.delete(event)
        db.session.commit()
        flash('Event deleted.', 'info')
    return redirect(url_for('committee_home', id=comm_id))

@app.route('/mark_attendance/<int:reg_id>')
@login_required
def mark_attendance(reg_id):
    reg = Registration.query.get_or_404(reg_id)
    if current_user.role == 'head' and current_user.assigned_committee == reg.event.committee_id:
        reg.status = 'Attended'
        db.session.commit()
        flash(f'Attendance marked for {reg.user.username}', 'success')
    return redirect(url_for('committee_home', id=reg.event.committee_id))

@app.route('/broadcast/<int:event_id>', methods=['POST'])
@login_required
def broadcast(event_id):
    event = Event.query.get_or_404(event_id)
    if current_user.role == 'head' and current_user.assigned_committee == event.committee_id:
        regs = Registration.query.filter_by(event_id=event_id).all()
        for r in regs:
            db.session.add(Message(user_id=r.user_id, title=f"Update: {event.title}", content=request.form.get('message')))
        db.session.commit()
        flash('Broadcast sent!', 'success')
    return redirect(url_for('committee_home', id=event.committee_id))

@app.route('/declare_winners/<int:event_id>', methods=['POST'])
@login_required
def declare_winners(event_id):
    event = Event.query.get_or_404(event_id)
    if current_user.role == 'head' and current_user.assigned_committee == event.committee_id:
        event.first_place_branch = request.form.get('first')
        event.second_place_branch = request.form.get('second')
        event.third_place_branch = request.form.get('third')
        event.is_completed = True
        db.session.commit()
        flash('Results published!', 'success')
    return redirect(url_for('committee_home', id=event.committee_id))

# --- AUTH & ADMIN ---
@app.route('/approve_head/<int:user_id>')
@login_required
def approve_head(user_id):
    if current_user.role == 'admin':
        user = User.query.get_or_404(user_id)
        user.is_approved = True
        db.session.commit()
        flash('Head approved.', 'success')
    return redirect(url_for('dashboard'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form.get('username')).first()
        if user and user.password == request.form.get('password'):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Invalid Credentials', 'danger')
    return render_template('login.html', committees=Committee.query.all())

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/signup', methods=['POST'])
def signup():
    role = request.form.get('role')
    new_user = User(
        username=request.form.get('username'),
        password=request.form.get('password'),
        role=role,
        department=request.form.get('department'),
        assigned_committee=request.form.get('committee_id') if role == 'head' else None,
        is_approved=(role == 'student')
    )
    db.session.add(new_user)
    db.session.commit()
    login_user(new_user)
    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)