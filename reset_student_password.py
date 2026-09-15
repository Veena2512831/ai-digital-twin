import hashlib
import secrets
from getpass import getpass

from database.session import SessionLocal
from database.models import Student


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)

    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000,
    )

    return f"{salt}${hashed.hex()}"


email = input("Enter your registered email: ").strip()
new_password = getpass("Enter new password: ")

if not new_password:
    print("Password cannot be empty.")
    exit()

db = SessionLocal()

try:
    student = (
        db.query(Student)
        .filter(Student.email == email)
        .first()
    )

    if not student:
        print("Student not found with this email.")
    else:
        student.password_hash = hash_password(new_password)

        db.commit()

        print("\nPassword updated successfully!")
        print(f"Account: {student.email}")

except Exception as error:
    db.rollback()
    print("\nError updating password:")
    print(error)

finally:
    db.close()