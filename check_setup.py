import os
import sys

print("--- STARTING DIAGNOSTIC ---")

# 1. Check Directory Structure
print(f"Checking folder: {os.getcwd()}")
if not os.path.exists("agents"):
    print("❌ CRITICAL: 'agents' folder is MISSING.")
else:
    print("✅ 'agents' folder found.")
    if not os.path.exists("agents/__init__.py"):
        print("⚠️ WARNING: 'agents/__init__.py' is missing. Creating it now...")
        with open("agents/__init__.py", "w") as f:
            f.write("")
        print("✅ Created 'agents/__init__.py'")
    else:
        print("✅ 'agents/__init__.py' exists.")

    if not os.path.exists("agents/teacher_agent.py"):
        print("❌ CRITICAL: 'agents/teacher_agent.py' is MISSING.")
    if not os.path.exists("agents/student_agent.py"):
        print("❌ CRITICAL: 'agents/student_agent.py' is MISSING.")

# 2. Check .env and Keys
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ 'python-dotenv' library is installed.")
    
    openai_key = os.getenv("OPENAI_API_KEY")
    google_key = os.getenv("GOOGLE_API_KEY")
    
    if not openai_key:
        print("❌ ERROR: OPENAI_API_KEY is missing or empty.")
    elif openai_key.startswith("sk-"):
        print("✅ OPENAI_API_KEY found (looks valid).")
    else:
        print(f"⚠️ WARNING: OpenAI key looks weird: {openai_key[:5]}...")

    if not google_key:
        print("❌ ERROR: GOOGLE_API_KEY is missing.")
    elif google_key.startswith("AIza"):
        print("✅ GOOGLE_API_KEY found (looks valid).")
    else:
        print(f"⚠️ WARNING: Google key looks weird: {google_key[:5]}...")

except ImportError:
    print("❌ ERROR: 'python-dotenv' library is NOT installed.")

# 3. Test Imports (The most likely crash cause)
print("\n--- TESTING IMPORTS ---")
try:
    from agents.teacher_agent import TeacherAgent
    print("✅ Successfully imported TeacherAgent.")
except Exception as e:
    print(f"❌ CRASHED importing TeacherAgent: {e}")

try:
    from agents.student_agent import StudentAgent
    print("✅ Successfully imported StudentAgent.")
except Exception as e:
    print(f"❌ CRASHED importing StudentAgent: {e}")

print("\n--- DIAGNOSTIC COMPLETE ---")