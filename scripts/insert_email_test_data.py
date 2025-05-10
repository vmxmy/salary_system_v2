import os
import sys
from datetime import datetime
import json

# Add the parent directory to the sys.path to import modules from webapp
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))

from webapp.database import SessionLocal, engine, Base
from webapp.models import Employee, EmailServerConfig, EmailLog
from webapp.core.config import settings # Assuming settings contains database URL

# Ensure tables are created (optional, migrations handle this in production)
# Base.metadata.create_all(bind=engine)

def insert_test_data():
    db = SessionLocal()
    try:
        # Insert test EmailServerConfig data
        print("Inserting test email server config...")
        test_server_config = EmailServerConfig(
            server_name="Test Email Server",
            host="smtp.test.com",
            port=587,
            use_tls=True,
            use_ssl=False,
            username="test_user@test.com",
            # In a real application, you would encrypt the password here
            encrypted_password="fake_encrypted_password_123",
            encryption_method="fake_method",
            sender_email="test_sender@test.com"
        )
        db.add(test_server_config)
        db.commit()
        db.refresh(test_server_config)
        print(f"Inserted email server config with ID: {test_server_config.id}")

        # Insert test EmailLog data
        print("Inserting test email logs...")

        # Get a sample employee if available
        sample_employee = db.query(Employee).first()
        sender_employee_id = sample_employee.id if sample_employee else None

        test_email_log_1 = EmailLog(
            sender_email="test_sender@test.com",
            recipient_emails=json.dumps(["recipient1@example.com", "recipient2@example.com"]),
            subject="Test Email 1",
            body="This is the body of test email 1.",
            status="sent",
            sent_at=datetime.utcnow(),
            sender_employee_id=sender_employee_id
        )
        test_email_log_2 = EmailLog(
            sender_email="test_sender@test.com",
            recipient_emails=json.dumps(["recipient3@example.com"]),
            subject="Test Email 2 (Failed)",
            body="This is the body of test email 2.",
            status="failed",
            sent_at=datetime.utcnow(),
            error_message="Connection refused.",
            sender_employee_id=sender_employee_id
        )

        db.add_all([test_email_log_1, test_email_log_2])
        db.commit()
        print("Inserted test email logs.")

        # Optional: Update existing employees with test email addresses
        print("Updating existing employees with test emails...")
        employees = db.query(Employee).limit(5).all() # Update first 5 employees
        for i, employee in enumerate(employees):
            employee.email = f"test_employee_{i+1}@example.com"
            db.add(employee)
        db.commit()
        print(f"Updated {len(employees)} employees with test emails.")


    except Exception as e:
        db.rollback()
        print(f"An error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    insert_test_data()
    print("Test data insertion complete.")