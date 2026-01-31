import os
import streamlit as st

st.title("🔍 Debug Mode")

# 1. Test Imports
st.write("Checking libraries...")
try:
    from dotenv import load_dotenv
    import openai
    import google.generativeai as genai
    st.success("✅ Libraries are installed!")
except ImportError as e:
    st.error(f"❌ Library missing: {e}")
    st.stop()

# 2. Test Keys
load_dotenv()
openai_key = os.getenv("OPENAI_API_KEY")
google_key = os.getenv("GOOGLE_API_KEY")

if openai_key:
    st.success(f"✅ OpenAI Key found: starts with {openai_key[:5]}...")
else:
    st.error("❌ OpenAI Key NOT found. Check your .env file name.")

if google_key:
    st.success(f"✅ Google Key found: starts with {google_key[:5]}...")
else:
    st.error("❌ Google Key NOT found. Check your .env file name.")