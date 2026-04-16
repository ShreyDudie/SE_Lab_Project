from app import app, db
from models import User, Committee, Department

def setup_database():
    with app.app_context():
        db.create_all()
        
        # Seed Departments (normalized lookup table)
        dept_names = ['IT', 'CS', 'Mech', 'Prod', 'Text', 'EXTC', 'Tronics', 'Trical', 'Civil', 'Diploma']
        for name in dept_names:
            if not Department.query.filter_by(name=name).first():
                db.session.add(Department(name=name))
        db.session.commit()
        print("Departments initialized.")

        # Seed Committees
        if not Committee.query.first():
            committees_data = [
                {"name": "COC", "description": "The coding hub of VJTI."},
                {"name": "Enthusia", "description": "The ultimate sports extravaganza."},
                {"name": "Technovanza", "description": "Technological excellence."},
                {"name": "Pratibimb", "description": "Celebrating VJTI's cultural spirit."}
            ]
            for data in committees_data:
                db.session.add(Committee(**data))
            db.session.commit()
            print("Committees initialized.")

        # Seed Users (admin + committee heads)
        initial_users = [
            ("admin", "admin123", "admin", None, None),
            ("cochead", "cochead123", "head", "COC", "Faculty"),
            ("enthuhead", "enthuhead123", "head", "Enthusia", "Faculty"),
            ("technohead", "technohead123", "head", "Technovanza", "Faculty"),
            ("pratihead", "pratihead123", "head", "Pratibimb", "Faculty")
        ]

        for username, password, role, comm_name, dept_name in initial_users:
            if not User.query.filter_by(username=username).first():
                comm_id = None
                if comm_name:
                    target_comm = Committee.query.filter_by(name=comm_name).first()
                    if target_comm:
                        comm_id = target_comm.id

                dept_id = None
                if dept_name:
                    dept = Department.query.filter_by(name=dept_name).first()
                    if dept:
                        dept_id = dept.id

                new_user = User(
                    username=username, 
                    password=password, 
                    role=role, 
                    assigned_committee=comm_id,
                    department_id=dept_id
                )
                db.session.add(new_user)
        
        db.session.commit()
        print("All Admin and Head users have been initialized!")

if __name__ == "__main__":
    setup_database()