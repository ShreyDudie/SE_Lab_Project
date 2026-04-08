from app import app, db
from models import User, Committee

def setup_database():
    with app.app_context():
        # Create tables
        db.create_all()
        
        # 1. Initialize Committees
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

        # 2. Initialize Users Dynamically
        # Format: (Username, Password, Role, Committee_Name)
        initial_users = [
            ("admin", "admin123", "admin", None),
            ("cochead", "cochead123", "head", "COC"),
            ("enthuhead", "enthuhead123", "head", "Enthusia"),
            ("technohead", "technohead123", "head", "Technovanza"),
            ("pratihead", "pratihead123", "head", "Pratibimb")
        ]

        for username, password, role, comm_name in initial_users:
            if not User.query.filter_by(username=username).first():
                comm_id = None
                if comm_name:
                    # Look up the ID by name so it's always correct
                    target_comm = Committee.query.filter_by(name=comm_name).first()
                    if target_comm:
                        comm_id = target_comm.id

                new_user = User(
                    username=username, 
                    password=password, 
                    role=role, 
                    assigned_committee=comm_id,
                    department="Central" if role == "admin" else "Faculty" # Optional default
                )
                db.session.add(new_user)
        
        db.session.commit()
        print("All Admin and Head users have been initialized!")

if __name__ == "__main__":
    setup_database()