#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "✅ Loaded environment variables from .env"
else
  echo "⚠️ .env file not found"
fi

echo "=================================================="
echo "🛡️ Starting Insurance Claim Management System"
echo "=================================================="
echo "🔑 Groq API Key: ${GROQ_API_KEY:0:8}..."
echo "🤖 Groq Model:   ${GROQ_API_MODEL:-openai/gpt-oss-120b}"
echo "🗄️ MySQL Port:   ${MYSQL_PORT:-3307}"
echo "=================================================="

# Ensure MySQL is accessible on configured port
MYSQL_P=${MYSQL_PORT:-3307}
if ! nc -z 127.0.0.1 $MYSQL_P 2>/dev/null; then
  echo "🗄️ Starting MySQL instance on port $MYSQL_P..."
  /opt/homebrew/opt/mysql/bin/mysqld --port=$MYSQL_P --mysqlx=0 --socket=/tmp/mysql${MYSQL_P}.sock --datadir=/opt/homebrew/var/mysql > /dev/null 2>&1 &
  sleep 2
fi

# Kill any existing processes on 8080 or 5173
lsof -ti:8080 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

echo "☕ Starting Spring Boot Backend (Port 8080)..."
cd "insurance-management-system"
./mvnw spring-boot:run > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "⚡ Starting React Frontend (Port 5173)..."
cd "insurance-frontend"
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "🚀 Application is launching!"
echo "   - React Frontend: http://localhost:5173"
echo "   - Spring Backend: http://localhost:8080"
echo "   - Backend Logs:   tail -f backend.log"
echo ""
echo "Press Ctrl+C to stop all servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
