# TaskFlow with AI Chat Assistant

A modern task management application with an integrated AI chat assistant powered by OpenAI Agents SDK.

## Features

### Task Management
- Create, update, complete, and delete tasks
- View task metrics and analytics
- Real-time task updates
- Responsive dashboard interface

### AI Chat Assistant
- Natural language task management through chat
- Powered by OpenAI Agents SDK with Model Context Protocol (MCP) tools
- Real-time conversation with persistent history
- Intelligent task operations via chat commands
- Error handling with user-friendly messages
- Responsive design (floating widget on desktop, full-screen on mobile)

## Architecture

### Frontend Stack
- **Next.js 16+** with App Router
- **React 19** for UI components
- **Tailwind CSS** for styling
- **OpenAI ChatKit SDK** for chat interface
- **Better Auth** for authentication

### Backend Stack
- **FastAPI** for REST API
- **OpenAI Agents SDK** for AI agent orchestration
- **Model Context Protocol (MCP)** for tool integration
- **SQLModel + PostgreSQL (Neon)** for data persistence
- **Pydantic** for data validation

### Data Flow

```
User → ChatKit UI → API Client → FastAPI Endpoint
                                       ↓
                              OpenAI Agent (Runner)
                                       ↓
                              MCP Tools (Backend Client)
                                       ↓
                              Database Operations
                                       ↓
                              Response ← Agent ← Tools ← DB
                                       ↓
User ← ChatKit UI ← API Client ← FastAPI Response
```

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.11+
- PostgreSQL database (Neon recommended)
- OpenAI API key

### Installation

#### 1. Clone the repository
```bash
git clone <repository-url>
cd Phase_III
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your database URL and OpenAI API key
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env.local
# Edit .env.local with your backend URL
```

### Running the Application

#### Start Backend Server
```bash
cd backend
source venv/bin/activate
uvicorn src.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000`

#### Start Frontend Server
```bash
cd frontend
pnpm dev
```

Frontend will be available at `http://localhost:3000`

## Phase IV: Docker & Kubernetes Deployment

### Containerized Deployment with Minikube

The application can be deployed to Kubernetes using Docker containers and Helm charts for production-grade orchestration.

#### Quick Start

```bash
# 1. Start Minikube cluster
minikube start --cpus=2 --memory=3072 --driver=docker

# 2. Configure Docker to use Minikube
eval $(minikube docker-env)

# 3. Build Docker images
docker build -t todo-frontend:phase4 -f Dockerfile.frontend .
docker build -t todo-backend:phase4 -f Dockerfile.backend .

# 4. Create Kubernetes secrets (use your actual credentials)
kubectl create secret generic frontend-secrets \
  --from-literal=auth-secret="$BETTER_AUTH_SECRET"

kubectl create secret generic backend-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=openai-api-key="$OPENAI_API_KEY" \
  --from-literal=auth-secret="$BETTER_AUTH_SECRET" \
  --from-literal=auth-url="$BETTER_AUTH_URL"

# 5. Deploy with Helm
helm install frontend ./helm/frontend
helm install backend ./helm/backend

# 6. Access the application
# Frontend: http://localhost:30000
# Backend API: http://localhost:30001/docs
```

#### Detailed Documentation

For complete deployment instructions, see:
- **[Quickstart Guide](./helm/QUICKSTART.md)** - Step-by-step deployment walkthrough
- **[Frontend Helm Chart](./helm/frontend/README.md)** - Frontend configuration and troubleshooting
- **[Backend Helm Chart](./helm/backend/README.md)** - Backend configuration and troubleshooting

#### Container Architecture

**Frontend Container:**
- Base image: `node:20-alpine`
- Multi-stage build (dependencies → build → production)
- Non-root user (`nextjs`)
- Health check endpoint: `/api/health`
- Image size: <500MB
- Port: 3000 (exposed as NodePort 30000)

**Backend Container:**
- Base image: `python:3.13-slim`
- Multi-stage build (dependencies → production)
- Non-root user (`fastapi`)
- Health check endpoint: `/api/health` (includes DB connectivity check)
- Image size: <1GB
- Port: 8000 (exposed as NodePort 30001)

#### Kubernetes Resources

**Frontend Deployment:**
- 2 replicas for high availability
- Resource limits: 500m CPU, 512Mi memory per pod
- Liveness & readiness probes configured
- Environment variables via ConfigMap and Secrets

**Backend Deployment:**
- 1 replica (stateful AI agent operations)
- Resource limits: 1000m CPU, 1Gi memory
- Liveness & readiness probes with longer startup delays
- All environment variables via Secrets (database, API keys)

**Services:**
- Frontend: NodePort on port 30000
- Backend: NodePort on port 30001

#### Management Commands

```bash
# Check deployment status
kubectl get pods,svc

# View logs
kubectl logs -l app=frontend
kubectl logs -l app=backend

# Scale replicas
helm upgrade frontend ./helm/frontend --set replicaCount=3

# Rollback deployment
helm rollback frontend

# Uninstall
helm uninstall frontend backend
```

#### Production Considerations

For production deployments, consider:
- **Ingress Controller**: Replace NodePort with Ingress for HTTPS and domain routing
- **Resource Tuning**: Adjust CPU/memory limits based on load testing
- **Monitoring**: Add Prometheus and Grafana for observability
- **Logging**: Centralize logs with ELK stack or Loki
- **Secrets Management**: Use external secrets manager (Vault, AWS Secrets Manager)
- **Auto-scaling**: Configure Horizontal Pod Autoscaler (HPA)
- **CI/CD**: Automate builds and deployments

## Using the AI Chat Assistant

### Opening the Chat
1. Navigate to the dashboard at `http://localhost:3000/dashboard`
2. Click the floating chat button in the bottom-right corner
3. The chat widget will open

### Chat Commands

The AI assistant understands natural language. Here are some example commands:

**Creating Tasks:**
- "Add a task to buy groceries"
- "Create a new task: Finish the report by Friday"
- "Remind me to call John tomorrow"

**Viewing Tasks:**
- "Show me all my tasks"
- "What tasks do I have?"
- "List my pending tasks"

**Updating Tasks:**
- "Mark task 5 as complete"
- "Update the grocery task to high priority"
- "Change the deadline for task 3 to next Monday"

**Deleting Tasks:**
- "Delete the grocery shopping task"
- "Remove task 7"

### Chat Features

- **Real-time Responses**: Messages are processed instantly
- **Typing Indicator**: Shows when the agent is processing
- **Error Handling**: User-friendly error messages for network issues, session expiry, etc.
- **Message History**: Conversation persists during your session
- **Responsive Design**:
  - Desktop: Floating widget (384px × 512px)
  - Mobile: Full-screen overlay
- **Markdown Support**: Rich text formatting in assistant responses
- **Timestamps**: Each message shows when it was sent

### Chat Behavior

1. **Sending a Message**:
   - Type your message in the input field
   - Press Enter or click Send
   - Your message appears immediately (right-aligned)
   - Input is disabled while waiting for response

2. **Receiving a Response**:
   - Typing indicator appears
   - Agent processes your request with MCP tools
   - Response appears (left-aligned)
   - Input is re-enabled

3. **Error Scenarios**:
   - **Network Error**: "Network error: Unable to connect to server"
   - **Session Expired**: "Session expired. Please log in again."
   - **Agent Unavailable**: "Agent is currently unavailable. Please try again later."

## API Endpoints

### Chat Endpoint
```http
POST /api/{user_id}/chat
Content-Type: application/json

Request Body:
{
  "message": "Add a task to buy groceries"
}

Response:
{
  "conversation_id": 1,
  "user_message_id": 1,
  "agent_message_id": 2,
  "agent_response": "I've added 'buy groceries' to your task list."
}
```

### Health Check
```http
GET /api/health

Response:
{
  "status": "healthy",
  "service": "agent-chat"
}
```

## Component Structure

### Frontend Components

```
frontend/
├── app/
│   └── dashboard/
│       └── page.tsx                 # Dashboard with integrated chat
├── components/
│   └── chat/
│       ├── ChatWidget.tsx           # Floating chat container
│       ├── ChatKitWrapper.tsx       # ChatKit SDK wrapper
│       └── ChatToggleButton.tsx     # Chat open/close button
├── lib/
│   ├── api/
│   │   └── chat.ts                  # API client for chat endpoint
│   └── hooks/
│       └── useChatMessages.ts       # Message state management hook
```

### Backend Components

```
backend/
└── src/
    ├── agents/
    │   ├── api/
    │   │   ├── agent_routes.py      # FastAPI routes
    │   │   ├── agent_handler.py     # Request handler
    │   │   └── schemas.py           # Pydantic schemas
    │   └── core/
    │       ├── agent.py             # Agent configuration
    │       └── runner.py            # Agent execution
    └── mcp/
        └── client/
            └── backend_client.py    # MCP tools client
```

## Development

### Code Style
- **Frontend**: ESLint + Prettier (configured)
- **Backend**: Black + isort (configured)

### Type Safety
- **Frontend**: TypeScript with strict mode
- **Backend**: Python type hints with Pydantic

### Testing

#### Frontend Tests
```bash
cd frontend
pnpm test
```

#### Backend Tests
```bash
cd backend
pytest
```

## Troubleshooting

### Chat Widget Not Opening
1. Check that the backend server is running
2. Verify user is authenticated
3. Check browser console for errors

### Messages Not Sending
1. Verify backend endpoint is accessible
2. Check network tab for failed requests
3. Verify user_id is available from session

### Agent Not Responding
1. Check OpenAI API key is configured
2. Verify MCP tools are initialized
3. Check backend logs for errors

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

For issues and questions:
- Open an issue on GitHub
- Contact the development team

## Acknowledgments

- **OpenAI** for the Agents SDK and ChatKit
- **FastAPI** for the backend framework
- **Next.js** for the frontend framework
- **Better Auth** for authentication
