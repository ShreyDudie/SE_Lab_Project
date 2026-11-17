from flask import Flask, request, jsonify, session, send_from_directory
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_cors import CORS
from models import db, User, Committee, Event, Registration, Message, Department, Tag, EventTag, EventResult
from datetime import datetime
import os
import socket
from itsdangerous import URLSafeSerializer, BadSignature
from dotenv import load_dotenv

load_dotenv() 
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'fallback-key-for-dev')
# Local default is a SQLite file. In production set DATABASE_URL to a Postgres URL so data persists.
_db_url = os.getenv('DATABASE_URL', 'sqlite:///default.db')
if _db_url.startswith('postgres://'):            # some hosts still hand out the old scheme
    _db_url = 'postgresql://' + _db_url[len('postgres://'):]
app.config['SQLALCHEMY_DATABASE_URI'] = _db_url
# Hosted databases drop idle connections: test each one before use and recycle them regularly
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'pool_pre_ping': True, 'pool_recycle': 280}

# Session cookie hardening (set SESSION_COOKIE_SECURE=1 when served over HTTPS)
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SECURE'] = os.getenv('SESSION_COOKIE_SECURE', '0') == '1'

# Behind a hosting platform's HTTPS proxy (Render sets RENDER=true), trust its forwarded headers
if os.getenv('RENDER') or os.getenv('BEHIND_PROXY') == '1':
    from werkzeug.middleware.proxy_fix import ProxyFix
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)

CORS(app, supports_credentials=True)

db.init_app(app)
ticket_serializer = URLSafeSerializer(app.config['SECRET_KEY'], salt='vjti-ticket')
login_manager = LoginManager(app)

# Return 401 JSON instead of redirecting to login page
@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({'error': 'Authentication required'}), 401

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def get_leaderboard(committee_id=None):
    """Build leaderboard from normalized EventResult + Department tables."""
    departments = Department.query.all()
    leaderboard = {d.name: 0 for d in departments}
    
    points_map = {1: 10, 2: 5, 3: 3}
    
    query = EventResult.query.join(Event).filter(Event.is_completed == True)
    if committee_id:
        query = query.filter(Event.committee_id == committee_id)
    
    results = query.all()
    for r in results:
        dept_name = r.department.name
        if dept_name in leaderboard:
            leaderboard[dept_name] += points_map.get(r.place, 0)
                
    return sorted(leaderboard.items(), key=lambda x: x[1], reverse=True)

def event_with_reg(reg):
    """Event dict plus the student's registration id/status (used for digital tickets)."""
    d = reg.event.to_dict()
    d['registration_id'] = reg.id
    d['registration_status'] = reg.status
    d['scanned_at'] = reg.scanned_at.isoformat() if reg.scanned_at else None
    return d


def ticket_payload(reg):
    """Public-safe description of a ticket (what a gate scanner needs to see)."""
    e = reg.event
    return {
        'registration_id': reg.id,
        'event': {
            'id': e.id, 'title': e.title, 'committee_id': e.committee_id,
            'committee_name': e.committee.name if e.committee else None,
            'date': e.date.isoformat(), 'start_time': e.start_time.strftime('%H:%M'),
            'end_time': e.end_time.strftime('%H:%M'), 'details': e.details,
        },
        'attendee': reg.user.username if reg.user else None,
        'department': reg.user.dept.name if reg.user and reg.user.dept else None,
        'status': reg.status,
        'scanned_at': reg.scanned_at.isoformat() if reg.scanned_at else None,
    }


def registration_from_token(token):
    try:
        reg_id = ticket_serializer.loads(token)
    except BadSignature:
        return None
    return db.session.get(Registration, reg_id)


def detect_lan_ip():
    """Best-effort LAN address, so a phone on the same Wi-Fi can open the scan link."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1))  # no packet is actually sent
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()

# ─── Auth Endpoints ──────────────────────────────────────────────

# ─── Digital ticket + QR scanning ────────────────────────────────

@app.route('/api/network_info')
def network_info():
    return jsonify({'lan_ip': detect_lan_ip()})

@app.route('/api/tickets/<int:reg_id>')
@login_required
def get_ticket(reg_id):
    """The ticket owner fetches the signed token that goes into the QR code."""
    reg = Registration.query.get_or_404(reg_id)
    if reg.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify({'token': ticket_serializer.dumps(reg.id), **ticket_payload(reg)})

@app.route('/api/verify_ticket/<token>')
def verify_ticket(token):
    """Public: what the scan page shows. Does not change anything."""
    reg = registration_from_token(token)
    if not reg:
        return jsonify({'error': 'This ticket could not be verified.'}), 404
    return jsonify(ticket_payload(reg))

@app.route('/api/verify_ticket/<token>/scan', methods=['POST'])
def scan_ticket(token):
    """Public: record the entry scan. A ticket is single-use: only the first scan admits."""
    reg = registration_from_token(token)
    if not reg:
        return jsonify({'error': 'This ticket could not be verified.'}), 404
    first = reg.scanned_at is None
    if first:
        reg.scanned_at = datetime.utcnow()
        db.session.commit()
    return jsonify({'first_scan': first, **ticket_payload(reg)})

@app.route('/api/tickets/<int:reg_id>/reset_scan', methods=['POST'])
@login_required
def reset_ticket_scan(reg_id):
    """Un-scan a ticket (owner, that committee's head, or admin): handy for re-running the scan demo."""
    reg = Registration.query.get_or_404(reg_id)
    allowed = (
        reg.user_id == current_user.id
        or current_user.role == 'admin'
        or (current_user.role == 'head' and current_user.assigned_committee == reg.event.committee_id)
    )
    if not allowed:
        return jsonify({'error': 'Unauthorized'}), 403
    reg.scanned_at = None
    db.session.commit()
    return jsonify({'message': 'Ticket reset.'})

@app.route('/api/me')
def get_current_user():
    if current_user.is_authenticated:
        return jsonify({'user': current_user.to_dict()})
    return jsonify({'user': None})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data.get('username')).first()
    if user and user.password == data.get('password'):
        login_user(user)
        return jsonify({'user': user.to_dict(), 'message': 'Login successful'})
    return jsonify({'error': 'Invalid Credentials'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    role = data.get('role')
    
    existing = User.query.filter_by(username=data.get('username')).first()
    if existing:
        return jsonify({'error': 'Username already taken'}), 400
    
    # Resolve department name to FK
    department_id = None
    dept_name = data.get('department')
    if dept_name:
        dept = Department.query.filter_by(name=dept_name).first()
        if dept:
            department_id = dept.id
    
    new_user = User(
        username=data.get('username'),
        password=data.get('password'),
        role=role,
        department_id=department_id,
        assigned_committee=data.get('committee_id') if role == 'head' else None,
        is_approved=(role == 'student')
    )
    db.session.add(new_user)
    db.session.commit()
    login_user(new_user)
    return jsonify({'user': new_user.to_dict(), 'message': 'Account created successfully'})

# ─── Data Endpoints ──────────────────────────────────────────────

@app.route('/api/departments')
def get_departments():
    """Return all departments for dropdowns."""
    depts = Department.query.order_by(Department.name).all()
    return jsonify({'departments': [d.to_dict() for d in depts]})

@app.route('/api/public/committees')
def public_committees():
    """Committee id + name only, so the sign-up form can list them before login."""
    return jsonify({'committees': [{'id': c.id, 'name': c.name} for c in Committee.query.order_by(Committee.name).all()]})

@app.route('/api/index')
@login_required
def index():
    today = datetime.now().date()
    
    upcoming = Event.query.filter(Event.date >= today, Event.is_completed == False).order_by(Event.date).all()
    past = Event.query.filter_by(is_completed=True).order_by(Event.date.desc()).limit(4).all()
    committees = Committee.query.all()
    
    # Recommendations: find events tagged with user's department
    recommended = []
    if current_user.dept:
        dept_tag = Tag.query.filter_by(name=current_user.dept.name).first()
        if dept_tag:
            recommended = Event.query.filter(
                Event.tags.any(Tag.id == dept_tag.id),
                Event.is_completed == False
            ).limit(5).all()

    my_events = []
    if current_user.role == 'student':
        user_regs = Registration.query.filter_by(user_id=current_user.id).all()
        my_events = [event_with_reg(r) for r in user_regs if not r.event.is_completed]

    return jsonify({
        'committees': [c.to_dict() for c in committees],
        'upcoming': [e.to_dict() for e in upcoming],
        'recommended': [e.to_dict() for e in recommended],
        'past': [e.to_dict() for e in past],
        'my_events': my_events,
        'leaderboard': [{'branch': b, 'score': s} for b, s in get_leaderboard()],
        'stats': {
            'total_events': Event.query.count(),
            'completed_events': Event.query.filter_by(is_completed=True).count(),
            'total_registrations': Registration.query.count(),
            'participants': db.session.query(Registration.user_id).distinct().count()
        }
    })

@app.route('/api/committees')
@login_required
def get_committees():
    committees = Committee.query.all()
    return jsonify({'committees': [c.to_dict() for c in committees]})

@app.route('/api/committee/<int:id>')
@login_required
def committee_home(id):
    committee = Committee.query.get_or_404(id)
    leaderboard = get_leaderboard(id)
    upcoming_events = Event.query.filter_by(committee_id=id, is_completed=False).order_by(Event.date.asc()).all()
    past_events = Event.query.filter_by(committee_id=id, is_completed=True).order_by(Event.date.desc()).limit(4).all()
    
    registered_event_ids = []
    participants = []
    my_events = []

    if current_user.role == 'student':
        regs = Registration.query.filter_by(user_id=current_user.id).all()
        registered_event_ids = [r.event_id for r in regs]
        # Get active events registered by this user specifically for this committee
        committee_regs = Registration.query.filter_by(user_id=current_user.id).join(Event).filter(Event.committee_id == id, Event.is_completed == False).all()
        my_events = [event_with_reg(r) for r in committee_regs]
    
    if current_user.role == 'head':
        participants = Registration.query.join(Event).filter(Event.committee_id == id).order_by(Registration.id.desc()).all()

    return jsonify({
        'committee': committee.to_dict(),
        'leaderboard': [{'branch': b, 'score': s} for b, s in leaderboard],
        'upcoming_events': [e.to_dict() for e in upcoming_events],
        'registered_event_ids': registered_event_ids,
        'participants': [r.to_dict() for r in participants],
        'all_events': [e.to_dict() for e in committee.events],
        'past': [e.to_dict() for e in past_events],
        'my_events': my_events
    })

@app.route('/api/dashboard')
@login_required
def dashboard():
    if current_user.role == 'head' and not current_user.is_approved:
        return jsonify({'pending_approval': True, 'user': current_user.to_dict()})

    if current_user.role == 'student':
        user_regs = Registration.query.filter_by(user_id=current_user.id).all()
        my_events = [event_with_reg(r) for r in user_regs if not r.event.is_completed]
        messages = [m.to_dict() for m in Message.query.filter_by(user_id=current_user.id).order_by(Message.timestamp.desc()).all()]
        past = Event.query.filter_by(is_completed=True).order_by(Event.date.desc()).limit(4).all()

        # Participation history + department standing (additive, used for the student's stats)
        history = []
        for r in sorted([r for r in user_regs if r.event.is_completed], key=lambda r: r.event.date, reverse=True):
            item = r.event.to_dict()
            item['status'] = r.status
            item['rating'] = r.rating
            history.append(item)
        board = get_leaderboard()
        dept_name = current_user.dept.name if current_user.dept else None
        dept_standing = None
        if dept_name:
            for idx, (b, sc) in enumerate(board):
                if b == dept_name:
                    dept_standing = {'department': b, 'rank': idx + 1, 'score': sc, 'total': len(board)}
                    break

        return jsonify({
            'role': 'student',
            'my_events': my_events,
            'messages': messages,
            'past': [e.to_dict() for e in past],
            'history': history,
            'dept_standing': dept_standing,
            'department': dept_name
        })

    elif current_user.role == 'head':
        committee = Committee.query.get(current_user.assigned_committee)
        
        active_events = Event.query.filter_by(committee_id=committee.id, is_completed=False).order_by(Event.date.asc()).all()
        past_events = Event.query.filter_by(committee_id=committee.id, is_completed=True).order_by(Event.date.desc()).all()
        
        committee_regs = Registration.query.join(Event).filter(Event.committee_id == committee.id).all()
        attended = sum(1 for r in committee_regs if r.status == 'Attended')
        past_regs = [r for r in committee_regs if r.event.is_completed]
        past_attended = sum(1 for r in past_regs if r.status == 'Attended')

        return jsonify({
            'role': 'head',
            'committee': committee.to_dict(),
            'active_events': [e.to_dict() for e in active_events],
            'past_events': [e.to_dict() for e in past_events],
            'stats': {
                'total_registrations': len(committee_regs),
                'attended': attended,
                'attendance_rate': round(past_attended / len(past_regs) * 100, 1) if past_regs else 0
            },
            'leaderboard': [{'branch': b, 'score': s} for b, s in get_leaderboard(committee.id)]
        })

    elif current_user.role == 'admin':
        all_events = Event.query.order_by(Event.date.desc()).all()
        pending_heads = User.query.filter_by(role='head', is_approved=False).all()
        committees = Committee.query.all()
        
        return jsonify({
            'role': 'admin',
            'all_events': [e.to_dict() for e in all_events],
            'pending_heads': [u.to_dict() for u in pending_heads],
            'committees': [c.to_dict() for c in committees],
            'leaderboard': [{'branch': b, 'score': s} for b, s in get_leaderboard()]
        })

# ─── Action Endpoints ────────────────────────────────────────────

@app.route('/api/register_event/<int:event_id>', methods=['POST'])
@login_required
def register_event(event_id):
    new_event = Event.query.get_or_404(event_id)
    existing_reg = Registration.query.filter_by(user_id=current_user.id, event_id=event_id).first()
    
    if existing_reg:
        return jsonify({'message': 'Already registered for this event.'}), 400

    user_regs = Registration.query.filter_by(user_id=current_user.id).all()
    for reg in user_regs:
        e = reg.event
        if e.date == new_event.date:
            if not (new_event.end_time <= e.start_time or new_event.start_time >= e.end_time):
                return jsonify({'error': f'Time Conflict! Already registered for {e.title} at this time.'}), 400

    db.session.add(Registration(user_id=current_user.id, event_id=event_id))
    db.session.commit()
    return jsonify({'message': 'Successfully registered!'})

@app.route('/api/unregister/<int:reg_id>', methods=['POST'])
@login_required
def unregister(reg_id):
    reg = Registration.query.get_or_404(reg_id)
    if reg.user_id == current_user.id:
        if reg.scanned_at:
            return jsonify({'error': 'This ticket has already been scanned for entry and can no longer be cancelled.'}), 400
        db.session.delete(reg)
        db.session.commit()
        return jsonify({'message': 'Registration cancelled.'})
    return jsonify({'error': 'Unauthorized'}), 403

def _sync_event_tags(event, tags_string):
    """Parse a comma-separated tags string and sync to normalized Tag + EventTag tables."""
    # Clear existing tags
    EventTag.query.filter_by(event_id=event.id).delete()
    
    if not tags_string:
        return
    
    tag_names = [t.strip() for t in tags_string.split(',') if t.strip()]
    for name in tag_names:
        tag = Tag.query.filter_by(name=name).first()
        if not tag:
            tag = Tag(name=name)
            db.session.add(tag)
            db.session.flush()  # get the ID
        db.session.add(EventTag(event_id=event.id, tag_id=tag.id))

@app.route('/api/add_event/<int:committee_id>', methods=['POST'])
@login_required
def add_event(committee_id):
    if current_user.role in ['admin', 'head']:
        data = request.get_json()
        new_event = Event(
            title=data.get('title'),
            date=datetime.strptime(data.get('date'), '%Y-%m-%d').date(),
            start_time=datetime.strptime(data.get('start_time'), '%H:%M').time(),
            end_time=datetime.strptime(data.get('end_time'), '%H:%M').time(),
            details=data.get('details'),
            committee_id=committee_id
        )
        db.session.add(new_event)
        db.session.flush()  # get ID before syncing tags
        _sync_event_tags(new_event, data.get('tags', ''))
        db.session.commit()
        return jsonify({'message': 'Event created!', 'event': new_event.to_dict()})
    return jsonify({'error': 'Unauthorized'}), 403

@app.route('/api/edit_event/<int:event_id>', methods=['POST'])
@login_required
def edit_event(event_id):
    event = Event.query.get_or_404(event_id)
    if current_user.role == 'admin' or (current_user.role == 'head' and current_user.assigned_committee == event.committee_id):
        data = request.get_json()
        event.title = data.get('title')
        event.details = data.get('details')
        event.date = datetime.strptime(data.get('date'), '%Y-%m-%d').date()
        event.start_time = datetime.strptime(data.get('start_time'), '%H:%M').time()
        event.end_time = datetime.strptime(data.get('end_time'), '%H:%M').time()
        _sync_event_tags(event, data.get('tags', ''))
        db.session.commit()
        return jsonify({'message': 'Event updated!', 'event': event.to_dict()})
    return jsonify({'error': 'Unauthorized'}), 403

@app.route('/api/delete_event/<int:event_id>', methods=['POST'])
@login_required
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)
    comm_id = event.committee_id
    if current_user.role == 'admin' or (current_user.role == 'head' and current_user.assigned_committee == comm_id):
        Registration.query.filter_by(event_id=event.id).delete()
        EventTag.query.filter_by(event_id=event.id).delete()
        EventResult.query.filter_by(event_id=event.id).delete()
        db.session.delete(event)
        db.session.commit()
        return jsonify({'message': 'Event deleted.'})
    return jsonify({'error': 'Unauthorized'}), 403

@app.route('/api/mark_attendance/<int:reg_id>', methods=['POST'])
@login_required
def mark_attendance(reg_id):
    reg = Registration.query.get_or_404(reg_id)
    if current_user.role == 'head' and current_user.assigned_committee == reg.event.committee_id:
        reg.status = 'Attended'
        db.session.commit()
        return jsonify({'message': f'Attendance marked for {reg.user.username}'})
    return jsonify({'error': 'Unauthorized'}), 403

@app.route('/api/broadcast/<int:event_id>', methods=['POST'])
@login_required
def broadcast(event_id):
    event = Event.query.get_or_404(event_id)
    if current_user.role == 'head' and current_user.assigned_committee == event.committee_id:
        data = request.get_json()
        regs = Registration.query.filter_by(event_id=event_id).all()
        for r in regs:
            db.session.add(Message(user_id=r.user_id, title=f"Update: {event.title}", content=data.get('message')))
        db.session.commit()
        return jsonify({'message': 'Broadcast sent!'})
    return jsonify({'error': 'Unauthorized'}), 403

@app.route('/api/declare_winners/<int:event_id>', methods=['POST'])
@login_required
def declare_winners(event_id):
    event = Event.query.get_or_404(event_id)
    if current_user.role == 'head' and current_user.assigned_committee == event.committee_id:
        data = request.get_json()
        
        # Clear any existing results for this event
        EventResult.query.filter_by(event_id=event_id).delete()
        
        # Create normalized EventResult rows
        for place, key in [(1, 'first'), (2, 'second'), (3, 'third')]:
            dept_name = data.get(key)
            if dept_name:
                dept = Department.query.filter_by(name=dept_name).first()
                if dept:
                    db.session.add(EventResult(event_id=event_id, place=place, department_id=dept.id))
        
        event.is_completed = True
        db.session.commit()
        return jsonify({'message': 'Results published!'})
    return jsonify({'error': 'Unauthorized'}), 403

@app.route('/api/approve_head/<int:user_id>', methods=['POST'])
@login_required
def approve_head(user_id):
    if current_user.role == 'admin':
        user = User.query.get_or_404(user_id)
        user.is_approved = True
        db.session.commit()
        return jsonify({'message': 'Head approved.'})
    return jsonify({'error': 'Unauthorized'}), 403

@app.route('/api/event_results/<int:event_id>')
@login_required
def event_results(event_id):
    event = Event.query.get_or_404(event_id)
    
    # Security: Only allow Admin or the specific Committee Head to see detailed results
    if current_user.role != 'admin' and not (current_user.role == 'head' and current_user.assigned_committee == event.committee_id):
        return jsonify({'error': 'Unauthorized access to event records.'}), 403

    # Calculate Attendance Analytics
    registrations = Registration.query.filter_by(event_id=event_id).all()
    total_reg = len(registrations)
    attended_count = sum(1 for r in registrations if r.status == 'Attended')
    attendance_rate = (attended_count / total_reg * 100) if total_reg > 0 else 0
    
    # Filter only attendees for the participant list
    attendees = [r.to_dict() for r in registrations if r.status == 'Attended']

    return jsonify({
        'event': event.to_dict(),
        'total_reg': total_reg,
        'attended_count': attended_count,
        'attendance_rate': round(attendance_rate, 1),
        'attendees': attendees
    })

@app.route('/api/leaderboard')
@login_required
def leaderboard():
    lb = get_leaderboard()
    return jsonify({'leaderboard': [{'branch': b, 'score': s} for b, s in lb]})

@app.route('/api/leaderboard/<int:committee_id>')
@login_required
def leaderboard_by_committee(committee_id):
    lb = get_leaderboard(committee_id)
    return jsonify({'leaderboard': [{'branch': b, 'score': s} for b, s in lb]})

# ─── Production: serve the built React app from the same server ─────

CLIENT_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'client', 'dist')

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Static files from client/dist, falling back to index.html so React Router can handle the URL."""
    if path.startswith('api/'):
        return jsonify({'error': 'Not found'}), 404
    if path and os.path.isfile(os.path.join(CLIENT_DIST, path)):
        return send_from_directory(CLIENT_DIST, path)
    if os.path.isfile(os.path.join(CLIENT_DIST, 'index.html')):
        return send_from_directory(CLIENT_DIST, 'index.html')
    return jsonify({'message': 'VJTI Committee Manager API is running. Build the client (npm run build in /client) to serve the website from here.'})


def ensure_schema():
    """Create tables and add columns introduced after the first release (SQLite has no auto-migrate)."""
    with app.app_context():
        db.create_all()
        # Works on SQLite and Postgres alike (the old PRAGMA check was SQLite-only)
        inspector = db.inspect(db.engine)
        if inspector.has_table('registration'):
            cols = [c['name'] for c in inspector.get_columns('registration')]
            if 'scanned_at' not in cols:
                col_type = 'DATETIME' if db.engine.dialect.name == 'sqlite' else 'TIMESTAMP'
                db.session.execute(db.text(f"ALTER TABLE registration ADD COLUMN scanned_at {col_type}"))
                db.session.commit()

ensure_schema()

if __name__ == '__main__':
    app.run(debug=os.getenv('FLASK_DEBUG', '1') == '1')