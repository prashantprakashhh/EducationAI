import os
import openai
from dotenv import load_dotenv

load_dotenv()
try:
    openai.client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
except:
    pass

class StudentAgent:
    def chat_with_persona(self, user_text, persona_name, chat_history):
        """Chat with historical figures or AI debaters."""
        system_prompt = f"""
        You are {persona_name}. Stay deeply in character. 
        If {persona_name} is a historical figure, use their specific speech patterns and knowledge limit.
        If {persona_name} is an AI Debater, politely but firmly counter the student's arguments.
        Keep responses concise (under 3 sentences) to keep the debate flowing.
        """
        
        # Format history for OpenAI
        messages = [{"role": "system", "content": system_prompt}] 
        messages += chat_history
        messages.append({"role": "user", "content": user_text})
        
        response = openai.client.chat.completions.create(
            model="gpt-4o",
            messages=messages
        )
        return response.choices[0].message.content

    def gamify_homework(self, topic, interest):
        """Converts boring homework into a text adventure."""
        prompt = f"""
        Convert a homework assignment about '{topic}' into a '{interest}' style mini-game.
        
        Example output: 
        "Level 1: You are a warrior in 1500s. To unlock the gate, you must answer: Who wrote the Ramayana?"
        
        Create 3 levels of increasing difficulty.
        """
        
        response = openai.client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content