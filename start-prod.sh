#!/bin/bash
# ============================================
# EduAI — Production Start (Laptop with Domain)
# 
# This builds the React app and runs everything
# as a single Spring Boot server serving both
# frontend + backend on port 8080.
# ============================================

echo "🎓 EduAI — Production Build & Start"
echo ""

# --- Required Configuration ---
# Set your domain here (the one you bought on Hostinger)
DOMAIN="${DOMAIN:-clatone.co.in}"

export GEMINI_API_KEY="${GEMINI_API_KEY:?❌ Set GEMINI_API_KEY first: export GEMINI_API_KEY=your_key}"
export CORS_ALLOWED_ORIGINS="https://${DOMAIN},http://${DOMAIN},http://localhost:5173"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-LetsaimtotheMoon@24}"

echo "📋 Configuration:"
echo "   Domain: ${DOMAIN}"
echo "   CORS Origins: ${CORS_ALLOWED_ORIGINS}"
echo "   Database: H2 (file: ./server/data/edudb)"
echo ""

# Step 1: Build React frontend
echo "🎨 Building frontend..."
cd client
VITE_API_BASE_URL="https://${DOMAIN}" npm run build
echo "   ✅ Frontend built!"

# Step 2: Copy built frontend into Spring Boot static resources
echo ""
echo "📦 Packaging frontend into backend..."
rm -rf ../server/src/main/resources/static/*
cp -r dist/* ../server/src/main/resources/static/
echo "   ✅ Frontend packaged!"

# Step 3: Start Spring Boot (serves both frontend + backend)
echo ""
echo "🚀 Starting EduAI server on port 8080..."
cd ../server
./mvnw spring-boot:run -Dspring-boot.run.arguments="--server.port=8080"

