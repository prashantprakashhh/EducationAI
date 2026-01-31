import os
import json
import openai
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Initialize Clients
# We use a try-except block here to prevent crashes if keys are missing during import
try:
    openai.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
except Exception as e:
    print(f"Warning: API Keys not fully loaded yet. {e}")

class TeacherAgent:
    def generate_lesson_plan(self, topic):
        """Generates structured JSON slides using OpenAI."""
        prompt = f"""
        You are an elite curriculum designer. Create a dynamic 4-slide lesson plan on: '{topic}'.
        
        Strictly output JSON in this format:
        {{
            "slides": [
                {{
                    "title": "Slide Title",
                    "content": ["Bullet 1", "Bullet 2", "Bullet 3"],
                    "interactive_element": "A quick poll question for the class"
                }}
            ],
            "teacher_script": "A brief, engaging intro script for the teacher."
        }}
        """
        
        try:
            response = openai.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "system", "content": "You are a helpful education assistant. Output JSON only."},
                          {"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            return {"error": str(e)}

    def grade_homework(self, image_file, rubric_text):
        """Uses Gemini Vision to grade handwritten homework."""
        try:
            model = genai.GenerativeModel('gemini-1.5-pro')
            prompt = f"""
            You are a strict but fair teacher. 
            1. Transcribe the handwritten text in this image.
            2. Grade it based on this rubric: {rubric_text}.
            3. Highlight grammar errors.
            4. Assign a score (0-100).
            
            Output format:
            **Transcribed Text:** ...
            **Corrections:** ...
            **Score:** X/100
            **Feedback:** ...
            """
            response = model.generate_content([prompt, image_file])
            return response.text
        except Exception as e:
            return f"Error analyzing image: {e}"

    def take_attendance(self, image_file):
        """Uses Gemini Vision to count heads."""
        try:
            model = genai.GenerativeModel('gemini-1.5-pro')
            prompt = "Analyze this classroom photo. Count the number of students present. Return ONLY the number."
            response = model.generate_content([prompt, image_file])
            return response.text.strip()
        except Exception as e:
            return "Error"