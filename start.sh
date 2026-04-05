#!/bin/bash
# ============================================
# EduAI — Start Everything (Laptop Deployment)
# Usage: ./start.sh
# ============================================

echo "🎓 Starting EduAI..."
echo ""

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️  GEMINI_API_KEY not set. AI features will be disabled."
    echo "   To enable AI: export GEMINI_API_KEY=your_key_here"
    echo ""
fi

# Step 1: Build & Start Backend
echo "🔧 Building & Starting Backend..."
cd server
./mvnw spring-boot:run -q &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo "   Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:8080/graphql > /dev/null 2>&1; then
        echo "   ✅ Backend is ready!"
        break
    fi
    sleep 2
done

# Step 2: Start Frontend dev server
echo ""
echo "🎨 Starting Frontend..."
cd ../client
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "============================================"
echo "🎓 EduAI is running!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8080"
echo "   H2 Console: http://localhost:8080/h2-console"
echo ""
echo "   Press Ctrl+C to stop everything"
echo "============================================"

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo '🛑 EduAI stopped.'" EXIT
wait
