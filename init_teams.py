#!/usr/bin/env python3
"""
Initialize team management and create the project-enhancement team.
"""
import sys
import os

# Add the backend directory to Python path
sys.path.append('/home/rayen/Monitor-nextjs/backend')

from models.server import Server
from config import Config

def initialize_teams():
    """Initialize the team management system and create the project-enhancement team"""

    # Initialize server model with database
    server = Server(Config.DATABASE_PATH)

    # Initialize database to create teams table
    try:
        server.init_db()
        print("Database initialized successfully with teams table")
    except Exception as e:
        print(f"Database initialization failed: {e}")
        return False

    # Create the project-enhancement team
    team_name = "project-enhancement"
    team_description = "Team implementing the 10x improvement plan for the Availability Checker Dashboard project. This team will work on database implementation, testing suite, security hardening, Docker containerization, CI/CD pipeline, and real-time features."

    # Check if team already exists
    existing_team = server.get_team_by_name(team_name)
    if existing_team:
        print(f"Team '{team_name}' already exists:")
        print(f"  ID: {existing_team['id']}")
        print(f"  Description: {existing_team['description']}")
        print(f"  Created: {existing_team['created_at']}")

        # Update description if needed
        if existing_team['description'] != team_description:
            if server.update_team(team_name, team_description):
                print(f"Team description updated successfully")
            else:
                print(f"Failed to update team description")
        return True

    # Create the team
    if server.create_team(team_name, team_description):
        print(f"Team '{team_name}' created successfully!")
        print(f"Description: {team_description}")

        # Verify creation
        created_team = server.get_team_by_name(team_name)
        if created_team:
            print(f"Team ID: {created_team['id']}")
            print(f"Created at: {created_team['created_at']}")

        return True
    else:
        print(f"Failed to create team '{team_name}'")
        return False

def list_all_teams():
    """List all teams in the database"""
    server = Server(Config.DATABASE_PATH)
    teams = server.get_all_teams()

    if not teams:
        print("No teams found in the database")
        return

    print("\nAll Teams:")
    print("-" * 80)
    for team in teams:
        print(f"ID: {team['id']}")
        print(f"Name: {team['name']}")
        print(f"Description: {team['description']}")
        print(f"Created: {team['created_at']}")
        print(f"Updated: {team['updated_at']}")
        print("-" * 80)

if __name__ == "__main__":
    print("Initializing Team Management System...")
    print("=" * 50)

    # Initialize teams
    success = initialize_teams()

    if success:
        print("\n" + "=" * 50)
        list_all_teams()
    else:
        print("\nFailed to initialize team management system")
        sys.exit(1)