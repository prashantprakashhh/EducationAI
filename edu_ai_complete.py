import streamlit as st
import os
import json
import openai
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

# --- 1. SETUP & CONFIGURATION ---
st.set_page_config(page_title="EDU AI OS", layout="wide", page_icon="🎓")
load_dotenv()

# Attempt to load keys - with error handling so app doesn't crash on black screen
try:
    openai.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    KEYS_LOADED = True
except Exception as e:
    KEYS_LOADED = False
    st.error(f"⚠️ API Key Error: {e}. Please check your .env file.")

# --- 2. AGENT CLASSES (Defined directly here to avoid Import Errors) ---

class TeacherAgent:
    def generate_lesson_plan(self, topic):
        if not KEYS_LOADED: return {"error": "No API Keys"}
        prompt = f"""
        You are an elite curriculum designer. Create a dynamic 4-slide lesson plan on: '{topic}'.
        Strictly output JSON in this format:
        {{
            "slides": [
                {{ "title": "Slide Title", "content": ["Bullet 1", "Bullet 2"], "interactive_element": "Poll?" }}
            ],
            "teacher_script": "Brief intro script."
        }}
        """
        try:
            response = openai.client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "system", "content": "Output JSON only."}, {"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            return {"error": str(e)}

    def grade_homework(self, image_file, rubric_text):
        if not KEYS_LOADED: return "Error: No API Keys"
        try:
            model = genai.GenerativeModel('gemini-1.5-pro')
            prompt = f"Transcribe this homework, grade it based on this rubric: {rubric_text}, and give a score (0-100)."
            response = model.generate_content([prompt, image_file])
            return response.text
        except Exception as e:
            return f"Error: {e}"

    def take_attendance(self, image_file):
        if not KEYS_LOADED: return "Error"
        try:
            model = genai.GenerativeModel('gemini-1.5-pro')
            prompt = "Count the students in this photo. Return ONLY the number."
            response = model.generate_content([prompt, image_file])
            return response.text.strip()
        except Exception as e:
            return "Error"

class StudentAgent:
    def chat_with_persona(self, user_text, persona_name, chat_history):
        if not KEYS_LOADED: return "Error: No API Keys"
        system_prompt = f"You are {persona_name}. Stay deeply in character. Be concise."
        messages = [{"role": "system", "content": system_prompt}] + chat_history + [{"role": "user", "content": user_text}]
        try:
            response = openai.client.chat.completions.create(model="gpt-4o", messages=messages)
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {e}"

    def gamify_homework(self, topic, interest):
        if not KEYS_LOADED: return "Error: No API Keys"
        prompt = f"Convert a homework about '{topic}' into a '{interest}' text adventure game (3 levels)."
        try:
            response = openai.client.chat.completions.create(model="gpt-4o", messages=[{"role": "user", "content": prompt}])
            return response.choices[0].message.content
        except Exception as e:
            return f"Error: {e}"

# --- 3. MAIN APP UI ---

# Initialize Agents
teacher_agent = TeacherAgent()
student_agent = StudentAgent()

# CSS Styling
st.markdown("""
<style>
    .card { background-color: #f0f2f6; padding: 20px; border-radius: 10px; margin-bottom: 10px; }
</style>
""", unsafe_allow_html=True)

# Sidebar
st.sidebar.title("🎓 EDU AI OS")
role = st.sidebar.radio("Select View:", ["Teacher Dashboard", "Student Portal", "Parent Connect"])

if role == "Teacher Dashboard":
    st.title("👨‍🏫 Teacher Command Center")
    tab1, tab2, tab3 = st.tabs(["Smart Attendance", "Lesson Generator", "AI Grader"])
    
    with tab1:
        st.header("📸 AI Attendance")
        img_file = st.camera_input("Take Class Photo")
        if img_file:
            st.image(img_file)
            if st.button("Count Students"):
                with st.spinner("Counting..."):
                    count = teacher_agent.take_attendance(Image.open(img_file))
                    st.success(f"Count: {count}")

    with tab2:
        st.header("✨ Lesson Planner")
        topic = st.text_input("Enter Topic")
        if st.button("Generate") and topic:
            with st.spinner("Generating..."):
                data = teacher_agent.generate_lesson_plan(topic)
                if "slides" in data:
                    for slide in data['slides']:
                        st.markdown(f"<div class='card'><h3>{slide['title']}</h3><p>{slide['content']}</p></div>", unsafe_allow_html=True)

    with tab3:
        st.header("📝 AI Grader")
        hw_file = st.file_uploader("Upload Homework")
        if hw_file and st.button("Grade"):
            st.write(teacher_agent.grade_homework(Image.open(hw_file), "Standard Rubric"))

elif role == "Student Portal":
    st.title("🎒 Student Portal")
    mode = st.selectbox("Mode", ["Time Travel Chat", "Gamify Homework"])
    
    if mode == "Time Travel Chat":
        persona = st.selectbox("Chat with:", ["Albert Einstein", "Shakespeare"])
        if "messages" not in st.session_state: st.session_state.messages = []
        
        for msg in st.session_state.messages: st.chat_message(msg["role"]).write(msg["content"])
        
        if prompt := st.chat_input("Type here..."):
            st.session_state.messages.append({"role": "user", "content": prompt})
            st.chat_message("user").write(prompt)
            resp = student_agent.chat_with_persona(prompt, persona, st.session_state.messages)
            st.session_state.messages.append({"role": "assistant", "content": resp})
            st.chat_message("assistant").write(resp)

    if mode == "Gamify Homework":
        t = st.text_input("Homework Topic")
        i = st.text_input("Your Interest")
        if st.button("Gamify!"):
            st.write(student_agent.gamify_homework(t, i))

elif role == "Parent Connect":
    st.title("🏡 Parent Insight")
    st.success("Alex attended all classes today! (Mood: Happy)")