"""
Demo data seeder for VJTI Committee Manager.

Populates the database with a realistic-looking year of activity for the four
committees (Pratibimb, Enthusia, Technovanza, COC): completed events with
podium results (which drive the inter-branch leaderboard), upcoming events,
students, registrations, attendance, ratings and broadcast notifications.

All dates are generated RELATIVE TO TODAY, so the upcoming events always sit in
the future and the countdowns / timeline always look alive, whenever you run it.

Usage:
    python init_db.py            # once, creates tables + admin/head accounts
    python seed_demo_data.py     # populate demo data (safe to re-run)

Re-running is safe: it clears events / registrations / results / messages /
tags and regenerates them. User accounts are kept (demo students are upserted).
"""
import random
from datetime import date, datetime, time, timedelta

from app import app, db
from models import (
    Committee, Department, Event, EventResult, EventTag, Message,
    Registration, Tag, User,
)
from init_db import setup_database

rng = random.Random(2026)  # deterministic -> same demo every run
TODAY = date.today()


def t(hhmm):
    h, m = hhmm.split(':')
    return time(int(h), int(m))


# ─── Event catalogue ──────────────────────────────────────────────
# (title, day_offset_from_today, start, end, tags, popularity, details)
# Negative offset => completed event with podium. Positive => upcoming.

COC_EVENTS = [
    # ---- completed
    ("LeetCode Weekly Battle: Branch Edition", -4, "17:00", "19:00",
     "contest, coding, dsa, intermediate, CS, IT", 0.50,
     "A rapid-fire 4-problem contest where every branch fields its best problem solvers.\n"
     "Format: Individual, 2 hours, ranked on penalty-adjusted score.\nVenue: Computer Centre Labs\n"
     "Prizes: Certificates + department points for the top 3 branches."),
    ("Game Jam 1.0", -33, "10:00", "22:00",
     "hackathon, game-dev, coding, beginner, CS, IT, EXTC", 0.40,
     "12 hours, one theme revealed at kick-off, one playable game. Teams of 2-3 build, playtest and demo.\n"
     "Format: Team (2-3)\nVenue: Seminar Hall\nTools: Unity / Godot / Pygame / Phaser - anything goes."),
    ("SQL Showdown", -61, "14:00", "16:30",
     "contest, database, beginner, IT, CS, Tronics", 0.35,
     "Query your way to the top: joins, window functions and one very evil subquery.\n"
     "Format: Individual\nVenue: Computer Centre Labs"),
    ("Hack the Algo: DSA Treasure Hunt", -95, "15:00", "18:00",
     "competition, dsa, coding, intermediate, CS, IT", 0.45,
     "Solve a chain of clues, each hiding a DSA puzzle, to find the final flag across the campus.\n"
     "Format: Team (2)\nVenue: Main Building + Computer Centre"),
    ("Inter-Branch Codeathon 2026", -140, "10:00", "16:00",
     "contest, coding, competitive-programming, advanced, CS, IT, EXTC", 0.65,
     "The flagship inter-branch coding battle. 6 problems, 5 hours, one leaderboard.\n"
     "Format: Individual, scores aggregated per branch\nVenue: Computer Centre Labs\n"
     "Prizes: Cash prizes + goodies for top 3."),
    ("CP League - Round 1", -190, "16:00", "18:30",
     "contest, competitive-programming, coding, intermediate, CS, IT", 0.50,
     "Opening round of the season-long Competitive Programming League. Ratings update after every round."),
    ("CodeRush 2.0", -240, "11:00", "17:00",
     "contest, coding, dsa, beginner, CS, IT, Mech", 0.70,
     "Beginner-friendly algorithm sprint with problems from arrays to basic DP.\n"
     "Format: Individual\nVenue: Computer Centre Labs\nOpen to all branches - first-years especially welcome!"),
    ("Python Pitfalls: Debugging Duel", -300, "15:00", "17:00",
     "competition, python, coding, beginner, Text, Civil, Prod, Diploma", 0.40,
     "Spot the bug, fix it fastest. Head-to-head debugging rounds on tricky Python snippets."),
    # ---- upcoming
    ("Git & GitHub Workshop: Your First Pull Request", 3, "16:00", "18:00",
     "workshop, git, open-source, beginner, CS, IT, Mech, Civil", 0.55,
     "Hands-on session: clone, branch, commit, push and raise a PR to a real repo.\n"
     "Format: Workshop (bring your laptop)\nVenue: Seminar Hall\nCertificates for all attendees."),
    ("CP League - Round 2", 9, "15:00", "17:30",
     "contest, competitive-programming, coding, intermediate, CS, IT, EXTC", 0.60,
     "Round 2 of the season. Ratings are live - climb the ladder and qualify for the finals.\n"
     "Format: Individual, 2.5 hours\nVenue: Computer Centre Labs"),
    ("Game Jam 2.0", 16, "10:00", "22:00",
     "hackathon, game-dev, coding, intermediate, CS, IT, EXTC, Tronics", 0.55,
     "Bigger, louder, better. A new theme, a new engine workshop at kick-off and 12 hours to ship.\n"
     "Format: Team (2-4)\nVenue: Seminar Hall\nPrizes: Cash + internship referrals for top teams."),
    ("Competitive Programming Workshop: Graphs & DP", 24, "15:00", "18:00",
     "workshop, competitive-programming, dsa, advanced, CS, IT", 0.50,
     "Deep-dive by VJTI alumni who have been to ICPC regionals: BFS/DFS patterns, shortest paths, knapsack variants."),
    ("Mock Placement OA Contest", 38, "17:00", "19:30",
     "contest, placements, dsa, intermediate, CS, IT, EXTC, Tronics, Trical", 0.65,
     "Simulates a real online assessment: 3 DSA problems + 15 MCQs under a strict timer. Detailed analysis shared after."),
    ("Winter Codeathon 2027", 55, "10:00", "17:00",
     "contest, coding, competitive-programming, advanced, CS, IT, EXTC", 0.70,
     "The big winter showdown. Individual rounds, branch-wise standings and a live scoreboard on the big screen."),
]

TECHNO_EVENTS = [
    # ---- completed
    ("Capture The Flag: CyberSiege", -7, "11:00", "19:00",
     "competition, cybersecurity, ctf, advanced, CS, IT, EXTC", 0.45,
     "8 hours of web, crypto, forensics and reverse-engineering challenges. Dynamic scoring.\n"
     "Format: Team (2-3)\nVenue: Computer Centre Labs"),
    ("Techno Quiz: Mind Matrix", -29, "15:00", "17:00",
     "competition, quiz, beginner, Mech, Civil, Prod, Text, Trical", 0.40,
     "From semiconductors to space missions - a multi-round tech quiz with a buzzer finale."),
    ("Drone Racing Challenge", -57, "10:00", "17:00",
     "competition, drones, robotics, advanced, Mech, Tronics, EXTC, Trical", 0.55,
     "Fly through gates, loops and an obstacle tunnel. Fastest clean lap wins.\n"
     "Format: Team (2-4)\nVenue: Gymkhana Ground"),
    ("Line Follower Challenge 2.0", -88, "11:00", "16:00",
     "competition, robotics, robo-race, intermediate, EXTC, Tronics, Mech", 0.55,
     "Autonomous bots chase the fastest lap on a track with curves, intersections and a surprise gap section."),
    ("Hardware Hackathon: 24 Hours", -120, "09:00", "21:00",
     "hackathon, hardware, iot, advanced, EXTC, Tronics, Trical, CS", 0.60,
     "Build a working hardware prototype around a given problem statement. Components partially provided.\n"
     "Format: Team (3-4)\nVenue: Electronics Lab Block"),
    ("Robo Soccer", -170, "10:00", "17:00",
     "robowars, robotics, competition, intermediate, Mech, Prod, Tronics", 0.60,
     "Two bots, one ball, no mercy. Wireless-controlled soccer in a mini arena, knock-out format."),
    ("RoboWars 2026", -272, "10:00", "18:00",
     "robowars, robotics, competition, advanced, Mech, Prod, Tronics, Trical", 0.85,
     "The heavyweight showdown - 60kg and 15kg weight categories, knock-out arena battles in front of a packed audience.\n"
     "Format: Team (3-5)\nVenue: Main Quadrangle Arena\nPrizes: Cash prizes + trophy."),
    ("Techno Hackathon 2026", -270, "09:00", "21:00",
     "hackathon, software, ai, advanced, CS, IT, EXTC", 0.80,
     "36-hour build sprint on real-world problem statements from industry partners. Mentors on call."),
    # ---- upcoming
    ("Arduino & IoT Workshop: Smart Campus", 5, "14:00", "17:30",
     "workshop, iot, arduino, hardware, beginner, EXTC, Tronics, Mech, Civil", 0.55,
     "Build a smart-campus sensor node: temperature, occupancy and a live dashboard.\n"
     "Format: Workshop - kits provided\nVenue: Electronics Lab Block"),
    ("Technovanza Hackathon 2027: 12-Hour Sprint", 9, "10:00", "22:00",
     "hackathon, software, ai, intermediate, CS, IT, EXTC, Tronics", 0.80,
     "Pre-fest qualifier hackathon. Top 10 teams get a direct entry into the Silver Jubilee edition finale.\n"
     "Format: Team (2-4)\nVenue: Seminar Hall + Computer Centre"),
    ("AI/ML Workshop: Train Your First Model", 13, "15:00", "18:00",
     "workshop, ai, machine-learning, beginner, CS, IT, EXTC, Tronics", 0.65,
     "From dataset to deployed demo in three hours using scikit-learn and a little PyTorch."),
    ("RoboWars 2027 - Qualifiers", 21, "10:00", "17:00",
     "robowars, robotics, competition, advanced, Mech, Prod, Tronics, Trical", 0.70,
     "Weight and safety checks followed by qualifier bouts. Only 16 bots make it to the main arena."),
    ("Autonomous Drone Challenge", 33, "10:00", "16:00",
     "competition, drones, robotics, advanced, Mech, EXTC, Tronics, CS", 0.50,
     "Waypoint navigation and precision landing, entirely autonomous. Computer vision strongly encouraged."),
    ("Technovanza Silver Jubilee: Curtain Raiser", 48, "17:00", "20:00",
     "ceremony, showcase, beginner, CS, IT, Mech, Prod, Text, EXTC, Tronics, Trical, Civil, Diploma", 0.75,
     "The 25th edition begins here: reveal of the theme, fest schedule, sponsors and a live robotics demo."),
]

PRATI_EVENTS = [
    # ---- completed
    ("Open Mic Night: Stand-Up & Poetry", -11, "18:00", "20:30",
     "performance, comedy, poetry, beginner, Text, Civil, Diploma, EXTC", 0.50,
     "Three minutes, one mic, zero filters. Stand-up, shayari and spoken word on one stage.\nVenue: Amphitheatre"),
    ("Nukkad Natak: Street Play Showdown", -35, "16:00", "18:30",
     "competition, theatre, street-play, intermediate, Civil, Text, Mech, Prod", 0.50,
     "Branch troupes perform 10-minute street plays on social themes. Judged on script, energy and impact."),
    ("Rangoli & Mehendi Contest", -64, "11:00", "14:00",
     "competition, art, traditional, beginner, Text, Civil, Diploma, Trical", 0.45,
     "Colours, patterns and some very patient hands. Themes announced on the spot."),
    ("Battle of Bands 2026", -100, "17:00", "21:30",
     "concert, music, band, intermediate, EXTC, Tronics, Mech, CS", 0.80,
     "Eight bands, one stage, one winner. Original compositions earn bonus points.\nVenue: Main Auditorium"),
    ("Nritya: Inter-Branch Group Dance", -150, "16:00", "20:00",
     "performance, dance, competition, intermediate, Text, Civil, EXTC, IT", 0.75,
     "Choreographed group dances up to 8 minutes. Any style from classical to contemporary."),
    ("Mr. & Ms. Pratibimb 2026", -205, "17:00", "21:00",
     "ceremony, showcase, personality, intermediate, Text, IT, CS, Civil", 0.65,
     "Talent, ramp and a rapid-fire Q&A round to crown this year's faces of Pratibimb."),
    ("Pratibimb Antakshari Night", -262, "18:00", "20:30",
     "competition, music, fun, beginner, Mech, Prod, Trical, Diploma", 0.40,
     "Team antakshari with Bollywood, retro and regional rounds. Prepare to be humbled by the seniors."),
    ("Photography Contest: Frames of Mumbai", -285, "09:00", "13:00",
     "competition, photography, art, beginner, Civil, CS, IT, Text", 0.35,
     "A two-hour photo-walk across Matunga, followed by a live gallery and judging."),
    # ---- upcoming
    ("Pratibimb Auditions: Solo Singing", 4, "15:00", "18:00",
     "audition, music, singing, beginner, Text, Civil, EXTC, IT, CS", 0.50,
     "Audition for the solo slot in the Cultural Night. Two songs, any language. Backing tracks allowed."),
    ("Pratibimb Auditions: Dance Crews", 9, "15:00", "18:00",
     "audition, dance, intermediate, Text, Civil, EXTC, IT, CS, Mech", 0.55,
     "Crews of 4-10 audition for the main-stage Cultural Night performance."),
    ("Short Film Festival: Reel VJTI", 18, "16:00", "20:00",
     "competition, film, creative, intermediate, CS, IT, Civil, Text", 0.45,
     "Films up to 8 minutes, made by students. Screening, audience vote and a jury award."),
    ("Battle of Bands 2027 - Qualifiers", 27, "17:00", "21:00",
     "concert, music, band, intermediate, EXTC, Tronics, Mech, CS", 0.70,
     "Eight bands are shortlisted for the Cultural Night after tonight's qualifier."),
    ("Mehendi & Rangoli Carnival", 40, "11:00", "15:00",
     "competition, art, traditional, beginner, Text, Civil, Diploma, Trical", 0.40,
     "Winter edition of the beloved art contest. New themes, bigger canvas."),
    ("Pratibimb 2027: Cultural Night Curtain Raiser", 60, "17:30", "21:30",
     "ceremony, showcase, music, dance, beginner, CS, IT, Mech, Prod, Text, EXTC, Tronics, Trical, Civil, Diploma", 0.85,
     "The grand preview of Pratibimb 2027: dance, music, drama and the theme reveal.\nVenue: Main Auditorium"),
]

ENTHU_EVENTS = [
    # ---- completed
    ("Valorant E-Sports Cup", -9, "14:00", "20:00",
     "e-sports, valorant, competition, intermediate, CS, IT, EXTC, Tronics", 0.55,
     "5v5 tactical shooter bracket. Double-elimination, best-of-3 finals streamed live."),
    ("Inter-Branch Badminton Championship", -31, "09:00", "17:00",
     "individual, badminton, competition, intermediate, Mech, Civil, Prod, Trical", 0.45,
     "Singles and doubles brackets across all branches.\nVenue: Gymkhana Hall"),
    ("Chess Open: Checkmate VJTI", -58, "10:00", "16:00",
     "individual, chess, competition, beginner, CS, IT, EXTC, Text", 0.40,
     "7-round Swiss, 15+10 time control. Rated and unrated brackets."),
    ("Basketball 3x3 Showdown", -92, "16:00", "20:00",
     "team-sport, basketball, competition, intermediate, Mech, Civil, Prod, Trical", 0.55,
     "Fast, loud and physical. Teams of 4 (3 + 1 sub) on a half-court."),
    ("Kabaddi Premier League", -130, "16:00", "19:30",
     "team-sport, kabaddi, competition, intermediate, Mech, Prod, Civil, Trical", 0.60,
     "Seven-a-side kabaddi with branch franchises and a packed crowd.\nVenue: Gymkhana Ground"),
    ("Inter-Branch Football League", -178, "15:30", "19:30",
     "team-sport, football, competition, intermediate, Mech, Civil, Prod, EXTC", 0.80,
     "League + knock-out format with 7-a-side matches. The most-watched Enthusia event every year."),
    ("Inter-Branch Cricket Cup", -230, "08:00", "18:00",
     "team-sport, cricket, competition, intermediate, Mech, Civil, Prod, CS", 0.85,
     "T10 format, one branch crowned champions. Umpires from the Mumbai Cricket Association panel."),
    ("Athletics Meet: Track & Field Day", -265, "07:30", "13:00",
     "athletics, individual, competition, beginner, Mech, Civil, Prod, Trical, Diploma", 0.60,
     "100m, 400m, long jump, shot put and the 4x100m relay. Points awarded branch-wise."),
    # ---- upcoming
    ("Women's Throwball Championship", 7, "15:00", "18:30",
     "team-sport, throwball, women, competition, beginner, Mech, Civil, Prod, Text, EXTC, IT, CS", 0.55,
     "Celebrating women champions: an inter-branch throwball championship open to all branches.\n"
     "Venue: Gymkhana Ground"),
    ("Box Cricket Bash", 12, "16:00", "20:00",
     "team-sport, cricket, competition, beginner, Mech, Civil, Prod, CS, IT", 0.70,
     "Six-a-side box cricket. Quick 4-over matches, loud cheering squads."),
    ("BGMI Squad Showdown", 19, "13:00", "19:00",
     "e-sports, bgmi, competition, intermediate, CS, IT, EXTC, Tronics, Mech", 0.60,
     "Squad-based tournament, 4 matches, aggregated points. Custom lobby on a LAN."),
    ("VJTI 5K Run: Run for a Cause", 28, "06:30", "09:00",
     "athletics, running, individual, beginner, Mech, Civil, Prod, Text, Trical, EXTC, CS, IT, Tronics, Diploma", 0.75,
     "A 5 km run around the Matunga campus loop. Proceeds support an NGO partnered with the Gymkhana."),
    ("Inter-Branch Volleyball League", 36, "15:30", "19:00",
     "team-sport, volleyball, competition, intermediate, Mech, Civil, Prod, Trical", 0.50,
     "Six-a-side volleyball, round-robin followed by semi-finals and a final."),
    ("Enthusia 2027 Curtain Raiser: Women Champions Torch Relay", 52, "16:30", "19:00",
     "ceremony, athletics, women, beginner, CS, IT, Mech, Prod, Text, EXTC, Tronics, Trical, Civil, Diploma", 0.70,
     "A ceremonial torch relay across the campus kicks off Enthusia 2027, themed 'Celebrating Women Champions'."),
]

# Which branches tend to win each committee's events (relative weights)
WINNER_WEIGHTS = {
    "COC":         {"CS": 8, "IT": 8, "EXTC": 5, "Tronics": 2, "Mech": 1, "Prod": 1, "Text": 1, "Trical": 1, "Civil": 1, "Diploma": 1},
    "Technovanza": {"Mech": 7, "EXTC": 7, "Tronics": 6, "CS": 3, "IT": 3, "Prod": 5, "Trical": 4, "Civil": 2, "Text": 1, "Diploma": 1},
    "Pratibimb":   {"Text": 8, "Civil": 7, "EXTC": 6, "IT": 5, "CS": 4, "Mech": 3, "Prod": 3, "Trical": 3, "Diploma": 4, "Tronics": 2},
    "Enthusia":    {"Mech": 9, "Civil": 8, "Prod": 7, "Trical": 5, "EXTC": 3, "CS": 3, "IT": 3, "Text": 2, "Diploma": 3, "Tronics": 2},
}

CATALOGUE = {
    "COC": COC_EVENTS,
    "Technovanza": TECHNO_EVENTS,
    "Pratibimb": PRATI_EVENTS,
    "Enthusia": ENTHU_EVENTS,
}

# ─── People ───────────────────────────────────────────────────────
FIRST = ["Aarav", "Vivaan", "Aditya", "Ishaan", "Arjun", "Rohan", "Karan", "Siddharth", "Atharv", "Yash",
         "Ananya", "Diya", "Isha", "Meera", "Kavya", "Riya", "Sneha", "Pooja", "Neha", "Tanvi",
         "Saanvi", "Aditi", "Shruti", "Prachi", "Nikhil", "Pranav", "Omkar", "Tejas", "Harsh", "Mihir"]
LAST = ["Sharma", "Patil", "Kulkarni", "Deshmukh", "Joshi", "Shah", "Mehta", "Iyer", "Nair", "Gupta",
        "Jadhav", "More", "Pawar", "Naik", "Desai", "Chavan", "Kamat", "Bhosale", "Rane", "Sawant"]
DEPT_POOL = (["CS"] * 12 + ["IT"] * 10 + ["EXTC"] * 9 + ["Mech"] * 8 + ["Prod"] * 5 + ["Text"] * 4 +
             ["Tronics"] * 5 + ["Trical"] * 5 + ["Civil"] * 5 + ["Diploma"] * 3)

FEEDBACK = [
    "Superbly organised, loved the energy!", "Great event, would love a longer version next time.",
    "Judging felt fair and transparent.", "Please add more seating next year.",
    "Best event I attended this semester.", "Volunteers were really helpful.",
    "Registration was smooth and quick.", "The venue was a little crowded but worth it.",
]


def overlaps(a, b):
    return a.date == b.date and not (a.end_time <= b.start_time or a.start_time >= b.end_time)


def weighted_podium(weights):
    pool = dict(weights)
    podium = []
    for _ in range(3):
        names = list(pool.keys())
        pick = rng.choices(names, weights=[pool[n] for n in names], k=1)[0]
        podium.append(pick)
        del pool[pick]
    return podium


def seed():
    with app.app_context():
        setup_database()  # tables, departments, committees, admin + head accounts

        depts = {d.name: d for d in Department.query.all()}
        committees = {c.name: c for c in Committee.query.all()}

        # ── Clear event-related demo data (users are preserved) ──
        Message.query.delete()
        Registration.query.delete()
        EventResult.query.delete()
        EventTag.query.delete()
        Event.query.delete()
        Tag.query.delete()
        db.session.commit()

        # ── Richer committee descriptions ──
        descriptions = {
            "COC": "The coding hub of VJTI - contests, DSA, competitive programming and open source.",
            "Enthusia": "The ultimate sports extravaganza - from cricket and football to e-sports and athletics.",
            "Technovanza": "VJTI's technical festival - robotics, hackathons, workshops and RoboWars.",
            "Pratibimb": "Celebrating VJTI's cultural spirit - music, dance, theatre, art and fashion.",
        }
        for name, desc in descriptions.items():
            if name in committees:
                committees[name].description = desc

        # ── Approve the four committee heads so every console is usable ──
        pending_demo = {"aditya_head", "meera_head"}
        for u in User.query.filter_by(role='head').all():
            u.is_approved = u.username not in pending_demo
        admin = User.query.filter_by(username='admin').first()
        if admin:
            admin.is_approved = True

        # ── Two pending head requests so the admin approval flow can be demoed ──
        for uname, cname, dname in [("aditya_head", "Technovanza", "CS"), ("meera_head", "Pratibimb", "EXTC")]:
            if not User.query.filter_by(username=uname).first():
                db.session.add(User(username=uname, password="pass123", role="head",
                                    department_id=depts[dname].id,
                                    assigned_committee=committees[cname].id, is_approved=False))

        # ── Students ──
        students = []
        # Fixed, documented demo logins first
        fixed = [("student1", "pass123", "IT"), ("student", "student123", "IT")]
        for uname, pwd, dname in fixed:
            u = User.query.filter_by(username=uname).first()
            if not u:
                u = User(username=uname, password=pwd, role="student", is_approved=True)
                db.session.add(u)
            u.department_id = depts[dname].id
            u.is_approved = True
            students.append(u)

        combos = [(f, l) for f in FIRST for l in LAST]
        rng.shuffle(combos)
        for first, last in combos[:60]:
            uname = f"{first.lower()}.{last.lower()}"
            u = User.query.filter_by(username=uname).first()
            if not u:
                u = User(username=uname, password="pass123", role="student", is_approved=True,
                         department_id=depts[rng.choice(DEPT_POOL)].id,
                         created_at=datetime.utcnow() - timedelta(days=rng.randint(10, 400)))
                db.session.add(u)
            students.append(u)
        db.session.commit()

        # ── Events ──
        events = []  # (Event, popularity, committee_name)
        for cname, items in CATALOGUE.items():
            for title, off, st, en, tags, pop, details in items:
                ev = Event(title=title, committee_id=committees[cname].id,
                           date=TODAY + timedelta(days=off), start_time=t(st), end_time=t(en),
                           details=details, is_completed=(off < 0))
                db.session.add(ev)
                db.session.flush()
                for tag_name in [x.strip() for x in tags.split(",") if x.strip()]:
                    tag = Tag.query.filter_by(name=tag_name).first()
                    if not tag:
                        tag = Tag(name=tag_name)
                        db.session.add(tag)
                        db.session.flush()
                    db.session.add(EventTag(event_id=ev.id, tag_id=tag.id))
                if off < 0:  # podium -> drives the leaderboard (10 / 5 / 3 pts)
                    for place, dname in enumerate(weighted_podium(WINNER_WEIGHTS[cname]), start=1):
                        db.session.add(EventResult(event_id=ev.id, place=place, department_id=depts[dname].id))
                events.append((ev, pop, cname))
        db.session.commit()

        # ── Registrations (no overlapping slots per student, like the real API) ──
        events.sort(key=lambda x: (x[0].date, x[0].start_time))
        by_title = {ev.title: ev for ev, _, _ in events}
        # Demo students always hold this conflict-free schedule. They are deliberately
        # NOT registered for "CP League - Round 2" (15:00-17:30, same day as the hackathon)
        # so the live "Time Conflict!" check can be demonstrated.
        demo_must = [by_title["Git & GitHub Workshop: Your First Pull Request"],
                     by_title["Technovanza Hackathon 2027: 12-Hour Sprint"],
                     by_title["Women's Throwball Championship"]]
        demo_block = {"CP League - Round 2"}

        for stu in students:
            is_demo = stu.username in ("student1", "student")
            mine = list(demo_must) if is_demo else []
            if is_demo:
                for ev in demo_must:
                    db.session.add(Registration(user_id=stu.id, event_id=ev.id))
            boost = 0.8 if is_demo else 1.0
            for ev, pop, cname in events:
                if ev in mine or (is_demo and ev.title in demo_block):
                    continue
                p = min(pop * boost, 0.95)
                # students lean towards events tagged with their department
                if stu.dept and any(tg.name == stu.dept.name for tg in ev.tags):
                    p = min(p + 0.15, 0.95)
                if rng.random() > p * 0.55:   # scale so counts look natural, not saturated
                    continue
                if any(overlaps(ev, other) for other in mine):
                    continue
                mine.append(ev)
                status = "Registered"
                rating = feedback = None
                if ev.is_completed:
                    if rng.random() < 0.82:
                        status = "Attended"
                        rating = rng.choice([3, 4, 4, 5, 5, 5])
                        feedback = rng.choice(FEEDBACK) if rng.random() < 0.3 else None
                db.session.add(Registration(user_id=stu.id, event_id=ev.id, status=status,
                                            rating=rating, feedback=feedback))
        db.session.commit()

        # ── Broadcast notifications (what committee heads send from the console) ──
        broadcasts = [
            ("Git & GitHub Workshop: Your First Pull Request",
             "Please carry your laptop and create a GitHub account beforehand. Seats are limited - arrive 10 minutes early.", 2),
            ("Technovanza Hackathon 2027: 12-Hour Sprint",
             "Team lists are due 48 hours before the event. Problem statements will be released at the kick-off.", 1),
            ("Women's Throwball Championship",
             "Reporting time is 14:30 sharp at the Gymkhana Ground. Branch jerseys are mandatory.", 1),
            ("Arduino & IoT Workshop: Smart Campus",
             "Kits will be provided at the venue. Install the Arduino IDE before you come.", 3),
            ("Pratibimb Auditions: Solo Singing",
             "Audition slots are allotted on a first-come basis. Bring your backing track on a pen drive.", 2),
        ]
        for title, text, days_ago in broadcasts:
            ev = Event.query.filter_by(title=title).first()
            if not ev:
                continue
            for reg in Registration.query.filter_by(event_id=ev.id).all():
                db.session.add(Message(user_id=reg.user_id, title=f"Update: {ev.title}", content=text,
                                       timestamp=datetime.utcnow() - timedelta(days=days_ago, hours=rng.randint(0, 6))))
        db.session.commit()

        # ── Report ──
        print("\nDemo data seeded.")
        print(f"  Students     : {len(students)}")
        print(f"  Events       : {Event.query.count()} ({Event.query.filter_by(is_completed=True).count()} completed)")
        print(f"  Registrations: {Registration.query.count()}")
        print(f"  Results      : {EventResult.query.count()}")
        pts = {d: 0 for d in depts}
        for r in EventResult.query.all():
            pts[r.department.name] += {1: 10, 2: 5, 3: 3}[r.place]
        print("  Inter-branch standings:")
        for d, p in sorted(pts.items(), key=lambda x: -x[1]):
            print(f"    {d:8s} {p}")


if __name__ == "__main__":
    seed()
