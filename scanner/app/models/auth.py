"""
Authentication models and database management for scanner system.
"""
import sqlite3
import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class AuthDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path
        # Ensure the database directory exists
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self.init_db()

    def get_db(self):
        """Get database connection"""
        return sqlite3.connect(self.db_path)

    def init_db(self):
        """Initialize authentication database tables"""
        conn = self.get_db()
        c = conn.cursor()

        try:
            # Create admin authentication table
            c.execute('''
                CREATE TABLE IF NOT EXISTS admin_auth (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    password_hash BLOB NOT NULL,
                    is_initialized BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')

            conn.commit()
            logger.info("Authentication database initialized successfully")

            # In development phase, set default password if not initialized
            if AuthConfig.DEVELOPMENT_PHASE and not self.is_initialized():
                logger.info("Development phase detected - setting default password")
                self.set_admin_password(AuthConfig.DEFAULT_PASSWORD)
        except Exception as e:
            logger.error(f"Error initializing authentication database: {e}")
            raise
        finally:
            conn.close()

    def set_admin_password(self, password: str) -> bool:
        """Set or update admin password"""
        conn = self.get_db()
        c = conn.cursor()
        try:
            # Use bcrypt for password encryption
            password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
            
            # Check if there is already a record
            c.execute('SELECT id FROM admin_auth LIMIT 1')
            result = c.fetchone()
            
            if result:
                # Update existing record
                c.execute('''
                    UPDATE admin_auth 
                    SET password_hash = ?, 
                        is_initialized = TRUE,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                ''', (password_hash, result[0]))
            else:
                # Insert new record
                c.execute('''
                    INSERT INTO admin_auth 
                    (password_hash, is_initialized) 
                    VALUES (?, TRUE)
                ''', (password_hash,))
            
            conn.commit()
            logger.info("Admin password set successfully")
            return True
        except Exception as e:
            logger.error(f"Error setting password: {e}")
            return False
        finally:
            conn.close()

    def verify_password(self, password: str) -> bool:
        """Verify admin password"""
        conn = self.get_db()
        c = conn.cursor()
        try:
            c.execute('SELECT password_hash FROM admin_auth WHERE is_initialized = TRUE')
            result = c.fetchone()
            
            if not result:
                return False
            
            stored_hash = result[0]
            return bcrypt.checkpw(password.encode(), stored_hash)
        except Exception as e:
            logger.error(f"Error verifying password: {e}")
            return False
        finally:
            conn.close()

    def is_initialized(self) -> bool:
        """Check if admin is initialized"""
        conn = self.get_db()
        c = conn.cursor()
        try:
            c.execute('SELECT is_initialized FROM admin_auth WHERE is_initialized = TRUE')
            return bool(c.fetchone())
        except Exception as e:
            logger.error(f"Error checking initialization: {e}")
            return False
        finally:
            conn.close()

    def verify_token(self, token: str, secret_key: str) -> bool:
        """Verify JWT token"""
        try:
            jwt.decode(token, secret_key, algorithms=["HS256"])
            return True
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return False
        except jwt.InvalidTokenError:
            logger.warning("Invalid token")
            return False

    def generate_token(self, secret_key: str, expires_in_days: int = 1) -> str:
        """Generate JWT token"""
        payload = {
            'exp': datetime.utcnow() + timedelta(days=expires_in_days),
            'iat': datetime.utcnow(),
        }
        return jwt.encode(payload, secret_key, algorithm='HS256')

class AuthConfig:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    DATABASE_PATH = os.getenv('AUTH_DATABASE_PATH', 'scanner/auth.db')
    DEVELOPMENT_PHASE = os.getenv('DEVELOPMENT_PHASE', 'false').lower() == 'true'
    DEFAULT_PASSWORD = os.getenv('DEFAULT_PASSWORD', 'admin123')

# Global auth database instance
auth_db = AuthDatabase(AuthConfig.DATABASE_PATH)