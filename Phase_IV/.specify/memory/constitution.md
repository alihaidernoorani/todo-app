<!--
  SYNC IMPACT REPORT
  ==================
  Version change: 2.1.0 → 2.2.0 (MINOR - Added Phase IV containerization, orchestration, and AI-assisted DevOps requirements)

  Modified principles:
    - I. Multi-Tier Isolation → Extended to include deployment artifacts (/helm, /k8s)
    - IV. Zero Manual Coding → Extended to include Dockerfiles, Helm charts, and K8s manifests

  Added sections:
    - Phase IV Principles: Containerization, Orchestration, and AI-Assisted DevOps (XIV–XVII)
    - Phase IV Technology Stack
    - Phase IV Development & Deployment Workflow
    - Containerization Specifications
    - Kubernetes & Helm Specifications
    - AI DevOps Operations

  Removed sections: None

  Templates requiring updates:
    - ✅ plan-template.md (supports deployment architecture documentation)
    - ✅ spec-template.md (supports containerization and orchestration requirements)
    - ✅ tasks-template.md (supports deployment task categorization)

  Follow-up TODOs: None
-->

# Full-Stack Todo Evolution Constitution

**Project Phases**:
- **Phase I**: In-memory Python CLI (complete)
- **Phase II**: Full-stack web app with Next.js + FastAPI + PostgreSQL (complete)
- **Phase III**: AI-powered conversational chatbot with OpenAI Agents SDK + MCP tools (complete)
- **Phase IV**: Local Kubernetes deployment with AI-assisted containerization and orchestration (active)

---

## Core Principles (Phases I–III)

### I. Multi-Tier Isolation

All code MUST reside strictly within designated directories:
- **Frontend code**: `/frontend/` (Next.js UI with ChatKit interface)
- **Backend code**: `/backend/` (FastAPI REST API + OpenAI Agents SDK + MCP tools) *(Phase III)*
- **Specification files**: `/specs/` (Agent and MCP tool specifications) *(Phase III)*
- **Deployment artifacts**: `/helm/` (Helm charts), `/k8s/` (Kubernetes manifests) *(Phase IV)*

**Rationale**: Clear separation enables independent deployment, testing, and scaling of each architectural tier. Frontend handles presentation and chat UI; backend handles business logic, data persistence, and conversational AI orchestration. Specifications live separately for documentation and discoverability. Deployment artifacts are isolated to maintain infrastructure-as-code best practices. This isolation prevents cross-contamination and maintains clean boundaries.

**Enforcement**:
- Code reviews MUST reject any code outside designated directories
- Build pipelines MUST only process files within the isolation boundary
- Shared types or contracts MUST be duplicated or published as packages, never imported across tiers directly
- Communication between frontend and backend MUST occur only via documented protocols (REST API, MCP tools)
- Deployment artifacts MUST NOT contain application code; only configuration and orchestration definitions

### II. Persistence First

All data MUST be persisted to Neon PostgreSQL using SQLModel as the ORM layer. In-memory storage is prohibited for production data.

**Phase III Extension**: All conversation state (messages, agent runs, tool invocations) MUST be stored in the database. The backend MUST remain stateless—no in-memory session or conversation context. Each request MUST be independently reproducible from database state.

**Rationale**: Durable persistence enables conversation history, multi-device access, audit trails, and system resilience. Stateless backend design ensures horizontal scalability and simplifies deployment.

**Requirements**:
- Every entity (including messages, conversations, agent runs, tool calls) MUST have a corresponding SQLModel class
- Database migrations MUST be managed via Alembic
- Connection pooling MUST be configured for production workloads
- All queries MUST use parameterized statements (SQLModel handles this by default)
- Conversation state MUST be stored in normalized tables with proper foreign keys and indexes
- Agent context MUST be reconstructed from database on each request

### III. Secure by Design

Every API request MUST be validated via Better Auth JWT tokens. No unauthenticated endpoints are permitted except health checks and public metadata.

**Phase III Extension**: All MCP tool invocations MUST include user context derived from JWT tokens. Agent tools MUST enforce user-scoped authorization for all task operations (create, read, update, delete). Cross-user data access MUST be blocked at the database query level.

**Rationale**: Security is not an afterthought. Authentication and authorization MUST be baked into the architecture from day one to prevent data leakage and unauthorized access. Agents operate on behalf of users and MUST respect user isolation boundaries.

**Requirements**:
- JWT verification MUST use shared secret between Next.js and FastAPI
- Tokens MUST include user identity claims for authorization decisions
- Token expiry MUST be enforced; refresh token flow MUST be implemented
- All endpoints MUST declare their authentication requirements explicitly
- Failed authentication MUST return 401; failed authorization MUST return 403
- Agent tools MUST propagate user_id from JWT to backend for all operations
- Database queries MUST filter by user_id to enforce data isolation

### IV. Zero Manual Coding

All code within project directories MUST be generated by Claude Code. Manual edits are prohibited.

**Phase III Extension**: Agent system prompts, MCP tool definitions, and ChatKit configurations are considered code artifacts and MUST be generated by Claude Code following the Spec → Plan → Tasks → Implement workflow.

**Phase IV Extension**: Dockerfiles, Helm charts, Kubernetes manifests, and all deployment configuration files are considered code artifacts and MUST be generated by Claude Code. AI-assisted containerization (Gordon) and orchestration (kubectl-ai, Kagent) operations MUST be executed through Claude Code prompts.

**Rationale**: This project demonstrates AI-assisted development workflow across the entire software lifecycle—from application code to infrastructure-as-code and deployment automation. Maintaining this constraint ensures reproducibility, traceability, and validates the AI coding assistant's capabilities for full DevOps automation including containerization and orchestration.

**Enforcement**:
- Every code change MUST be traceable to a Claude Code session via PHR
- Manual hotfixes are prohibited; issues MUST be resolved through new Claude Code prompts
- Code reviews MUST verify AI-generation provenance
- Prompt engineering, tool schema definitions, Dockerfiles, Helm charts, and K8s manifests fall under this principle
- All AI DevOps operations (Gordon, kubectl-ai, Kagent) MUST be invoked through Claude Code

### V. Test-First Discipline

Tests SHOULD be written before implementation when explicitly requested. Red-Green-Refactor cycle is the preferred development pattern.

**Phase III Extension**: Agent behavior tests SHOULD verify tool selection, parameter extraction, conversation flow, and natural language understanding before implementing agent logic.

**Rationale**: Test-first development catches design issues early and ensures every feature has verification coverage from inception. For AI systems, tests codify expected behavior and catch regressions in prompt engineering and tool selection logic.

**Guidelines**:
- Contract tests for API endpoints SHOULD be defined before implementation
- Integration tests SHOULD cover critical user journeys (including conversational flows)
- Unit tests SHOULD cover business logic in isolation
- Agent tests SHOULD verify correct tool selection for representative user inputs
- Agent tests SHOULD validate parameter extraction from natural language
- Test files MUST reside in appropriate `tests/` directories per tier

### VI. API Contract Enforcement

Frontend and backend MUST communicate exclusively via REST API with JSON payloads. Agent and backend MUST communicate via MCP tools. All contracts MUST be documented and versioned.

**Phase III Extension**: All task operations MUST be exposed as MCP tools using the Official MCP SDK. Tool definitions serve as the contract between agent and backend. Tool schemas MUST match backend API contracts exactly.

**Rationale**: Explicit contracts enable independent development of each tier, facilitate testing, and provide clear documentation for all consumers. MCP provides a standard, discoverable interface for agent tools. Frontend can use REST API directly or via agent; both paths must honor the same contracts.

**Requirements**:
- All REST endpoints MUST follow REST conventions (proper HTTP methods, status codes)
- Request/response schemas MUST be documented (OpenAPI/Swagger auto-generation via FastAPI)
- Breaking changes MUST increment API version
- Error responses MUST follow a consistent structure
- MCP tool definitions MUST declare parameters, types, and descriptions
- Tool responses MUST match documented schemas
- Tools MUST invoke backend REST endpoints (not bypass them)

---

## Phase III Principles: AI-Powered Chatbot

### VII. Agent-First Architecture

The conversational interface is the PRIMARY user interaction model for task management in Phase III. All user task operations MUST be handled through an AI agent built with the OpenAI Agents SDK.

**Rationale**: Modern AI agents provide natural language understanding, context management, and intelligent tool orchestration. Agent-first design enables users to manage tasks through conversation rather than clicking through UI forms, lowering the barrier to entry and improving accessibility.

**Requirements**:
- The agent MUST be built using the OpenAI Agents SDK
- The agent MUST handle multi-turn conversations with context preservation
- The agent MUST provide helpful, friendly responses for all user inputs
- The agent MUST handle ambiguous requests and ask clarifying questions when needed
- The agent MUST confirm destructive operations before executing
- The frontend MUST render agent responses in a conversational chat interface
- The REST API MUST remain available for direct programmatic access (not deprecated)

### VIII. MCP Tool-Based System Design

All task operations (create, read, update, delete, list) MUST be exposed as stateless MCP tools using the Official MCP SDK. The agent MUST interact with the application exclusively through these tools.

**Rationale**: MCP (Model Context Protocol) provides a standard, discoverable, and type-safe interface for agent tools. Tools encapsulate backend logic, enforce contracts, and provide clear boundaries for what the agent can do. Stateless tools simplify testing, debugging, and horizontal scaling.

**Requirements**:
- Every backend task operation MUST have a corresponding MCP tool definition
- Tools MUST be implemented using the Official MCP SDK
- Tools MUST be stateless—no in-memory state between invocations
- Tools MUST declare their parameters with types, descriptions, and validation rules
- Tools MUST validate inputs and return structured, typed responses
- Tools MUST enforce user-scoped authorization (user_id propagation)
- Tool errors MUST be returned in a format the agent can communicate to users
- Tool definitions MUST be co-located with agent code in `/backend/`
- Tools MUST call backend REST API endpoints (not directly access database)

### IX. Stateless Backend Principle

The backend MUST remain stateless. No in-memory session or conversation state is permitted. All conversation history MUST be stored in the database. Each request MUST be independently reproducible.

**Rationale**: Stateless backends enable horizontal scaling, simplify deployment, avoid session management complexity, and improve fault tolerance. Storing conversation state in the database enables multi-device access, conversation history persistence, audit trails, and disaster recovery.

**Requirements**:
- Backend API MUST NOT maintain in-memory session state
- Backend MUST NOT cache conversation context in-memory
- Every agent message MUST be stored in a `messages` table
- Every agent run MUST be stored in an `agent_runs` table
- Tool invocations MUST be logged to database for traceability and debugging
- Conversation context MUST be reconstructed from database on each request
- Database schema MUST support efficient queries for recent conversation history
- Proper indexing MUST be configured (user_id, conversation_id, timestamp)
- Conversation retrieval MUST be optimized (e.g., load last N messages, not entire history)

### X. ChatKit-Driven Conversational Interface

The frontend MUST use OpenAI ChatKit as the primary user interface for task management. All task operations MUST be accessible through natural language via the chat interface.

**Rationale**: ChatKit provides a modern, accessible, and mobile-friendly conversational UI. It handles message rendering, streaming responses, typing indicators, and accessibility features out of the box. Users can manage tasks without learning commands or navigating complex UIs.

**Requirements**:
- Frontend MUST integrate OpenAI ChatKit for the chat interface
- Chat interface MUST support streaming responses from the agent
- Chat interface MUST display typing indicators during agent processing
- Chat interface MUST render tool calls and results transparently when appropriate
- Chat interface MUST support message history scrolling and search
- Chat interface MUST be responsive and mobile-friendly
- Chat interface MUST meet WCAG 2.1 Level AA accessibility standards
- Traditional UI views (task list, dashboard) MAY coexist as secondary interfaces

### XI. Natural Language Task Management

The system MUST interpret user intent from conversational input and map it to the appropriate MCP tools. All task CRUD operations MUST be performable via natural language. All actions MUST return clear, friendly confirmations.

**Rationale**: Natural language interfaces lower the barrier to entry and make task management more accessible to all users. Users can express intent without memorizing commands, clicking through forms, or navigating complex UIs. Friendly confirmations build trust and provide feedback.

**Requirements**:
- Agent MUST support commands like:
  - "add a task to buy milk"
  - "show my tasks"
  - "mark task 3 as done"
  - "delete the grocery task"
  - "what tasks are due today?"
- Agent MUST handle ambiguous or incomplete requests gracefully
- Agent MUST ask clarifying questions when intent is unclear
- Agent MUST confirm destructive operations (delete, bulk updates) before executing
- Agent MUST provide helpful feedback after each operation (e.g., "Task 'Buy milk' has been added")
- Agent MUST extract entities (titles, due dates, priorities) from natural language
- Agent MUST support bulk operations when requested (e.g., "mark all today's tasks as done")
- Agent MUST handle errors gracefully and provide actionable error messages
- Agent responses MUST be conversational, friendly, and concise

### XII. Spec-Driven AI Development

All AI, agent, MCP, and chat features MUST follow the same Spec-Driven Development workflow as traditional features. Prompts and tool definitions are code artifacts requiring the same rigor.

**Rationale**: AI systems are complex software systems that benefit from upfront planning, documented requirements, and testable acceptance criteria. Prompts, tool definitions, and conversation flows require design, review, and iteration just like application code. Ad-hoc prompt engineering leads to inconsistent behavior and regressions.

**Requirements**:
- Agent system prompts MUST be documented in spec artifacts
- Tool definitions MUST be specified in plan artifacts before implementation
- Conversation flows MUST be defined as user stories with acceptance scenarios
- Agent behavior MUST have measurable, testable success criteria
- All AI/agent features MUST follow: `/sp.specify` → `/sp.plan` → `/sp.tasks` → `/sp.implement`
- Prompt engineering iterations MUST be tracked
- Significant prompt/tool decisions MUST be documented in ADRs
- Agent tests MUST verify expected behavior for representative inputs
- Regression tests MUST catch prompt engineering regressions

### XIII. Tool Observability and Transparency

All agent tool calls MUST be logged, traceable, and optionally returned in API responses. Tool execution MUST be debuggable and auditable.

**Rationale**: AI agent behavior can be opaque and difficult to debug. Logging all tool invocations enables debugging, auditing, compliance, and understanding agent behavior. Transparent tool calls help users understand what the agent is doing on their behalf. Observability is essential for production AI systems.

**Requirements**:
- Every tool invocation MUST be logged to database with:
  - Timestamp
  - User ID
  - Agent run ID
  - Tool name
  - Input parameters
  - Output result or error
  - Execution duration
- Tool logs MUST be queryable for debugging and audit purposes
- Tool calls MAY be returned in API responses when requested (e.g., debug mode)
- Frontend MAY display tool calls transparently in the chat UI for power users
- Tool execution errors MUST be logged with stack traces for debugging
- Tool performance metrics (latency, success rate) SHOULD be monitored
- Logs MUST comply with data privacy regulations (no PII in logs unless necessary and protected)

---

## Phase IV Principles: Containerization, Orchestration, and AI-Assisted DevOps

### XIV. Container-First Deployment

All application components MUST be containerized using Docker with AI-assisted image building via Gordon. Containers MUST be production-ready, optimized, and secure.

**Rationale**: Containerization enables consistent deployment across environments, simplifies dependency management, improves resource utilization, and facilitates horizontal scaling. AI-assisted Docker operations (Gordon) streamline Dockerfile generation, optimize image layers, and apply security best practices automatically.

**Requirements**:
- Frontend and backend MUST have separate Dockerfiles
- Dockerfiles MUST follow multi-stage build patterns for optimal image size
- Base images MUST be official, minimal, and security-scanned (e.g., `node:alpine`, `python:slim`)
- Non-root users MUST be configured in all containers for security
- Environment variables MUST be used for configuration (no hardcoded values)
- Health checks MUST be defined in Dockerfiles for container orchestration
- `.dockerignore` files MUST exclude unnecessary files (node_modules, .git, etc.)
- Gordon AI MUST be used for Dockerfile generation and optimization via Claude Code prompts
- Container images MUST be tagged with semantic versions
- Build logs MUST be captured and reviewed for security vulnerabilities

**Phase III Feature Mapping**:
- Frontend container: Next.js app with ChatKit UI (builds static assets, serves via Node.js)
- Backend container: FastAPI + OpenAI Agents SDK + MCP tools + PostgreSQL client
- Both containers MUST preserve all Phase III chatbot functionality after containerization
- Authentication flow (Better Auth JWT) MUST work across containerized services
- Database connection MUST be configurable via environment variables for container orchestration

### XV. Kubernetes-Native Orchestration

All containerized services MUST be deployed to local Minikube using Kubernetes manifests or Helm charts. Orchestration MUST support scaling, health monitoring, and service discovery.

**Rationale**: Kubernetes provides industry-standard container orchestration with built-in service discovery, load balancing, self-healing, and horizontal scaling. Local Minikube deployment validates production-readiness in a local environment before cloud deployment. Kubernetes patterns established here transfer directly to production clusters (EKS, GKE, AKS).

**Requirements**:
- Frontend and backend MUST be deployed as separate Kubernetes Deployments
- Each deployment MUST specify replica count (default: 2 for high availability)
- Services MUST be exposed via NodePort for local Minikube access
- Resource limits (CPU, memory) MUST be defined for all containers
- Liveness and readiness probes MUST be configured for health monitoring
- ConfigMaps MUST be used for non-sensitive configuration
- Secrets MUST be used for sensitive data (database credentials, API keys, JWT secrets)
- Rolling update strategy MUST be configured for zero-downtime deployments
- Horizontal Pod Autoscaler (HPA) SHOULD be configured for auto-scaling based on CPU/memory
- All Kubernetes manifests MUST be versioned and stored in `/k8s/` directory
- Namespace isolation SHOULD be used for environment separation (dev, staging, prod)

**Phase III Feature Mapping**:
- Frontend service: NodePort exposing Next.js on port 3000
- Backend service: NodePort exposing FastAPI on port 8000
- Database: PostgreSQL (Neon cloud or local StatefulSet with persistent volumes)
- All Phase III chatbot endpoints MUST be accessible via NodePort URLs
- Conversation persistence MUST work across pod restarts (database-backed state)
- Agent tool invocations MUST function correctly in orchestrated environment

### XVI. Helm-Based Package Management

All Kubernetes resources MUST be packaged as Helm charts for simplified deployment, versioning, and configuration management. Helm MUST be the primary deployment mechanism for local Minikube.

**Rationale**: Helm provides package management for Kubernetes, enabling templated manifests, version control, rollback capabilities, and environment-specific configuration. Helm charts are reusable, shareable, and follow industry best practices for Kubernetes deployments. Helm simplifies complex multi-resource deployments into a single `helm install` command.

**Requirements**:
- Frontend and backend MUST each have dedicated Helm charts in `/helm/` directory
- Chart structure MUST follow Helm best practices:
  - `Chart.yaml` with metadata (name, version, description)
  - `values.yaml` with default configuration
  - `templates/` directory with templated Kubernetes manifests
- Values MUST be parameterized for environment-specific overrides (replicas, resources, image tags)
- Helm charts MUST include all necessary resources (Deployments, Services, ConfigMaps, Secrets)
- Chart versioning MUST follow semantic versioning (MAJOR.MINOR.PATCH)
- `helm install`, `helm upgrade`, and `helm rollback` commands MUST work correctly
- Dependency management via `Chart.yaml` dependencies field for any third-party charts
- Chart documentation MUST be included in `README.md` within each chart directory
- Values schema validation SHOULD be included via `values.schema.json`

**Phase III Feature Mapping**:
- Frontend chart: Deploys Next.js container with ChatKit UI as Kubernetes Deployment + Service
- Backend chart: Deploys FastAPI + Agents SDK + MCP tools as Deployment + Service with database connectivity
- ConfigMap: Non-sensitive settings (backend URL, feature flags)
- Secret: Sensitive credentials (database URL, OpenAI API key, Better Auth JWT secret)
- All chatbot features MUST work identically after Helm deployment

### XVII. AI-Assisted DevOps Operations

All Kubernetes operations (deploy, scale, monitor, troubleshoot) MUST be performed using AI-assisted tools: kubectl-ai for natural language Kubernetes commands and Kagent for cluster analysis and optimization. Manual kubectl commands are discouraged.

**Rationale**: AI-assisted DevOps tools lower the barrier to Kubernetes operations, reduce human error, accelerate troubleshooting, and apply best practices automatically. Natural language interfaces (kubectl-ai) make Kubernetes accessible to developers without deep K8s expertise. Cluster analysis tools (Kagent) provide intelligent recommendations for optimization, cost reduction, and reliability improvements.

**Requirements**:
- **kubectl-ai** MUST be installed and used for all routine Kubernetes operations
- **Kagent** MUST be installed for cluster health monitoring and optimization analysis
- All deployment operations SHOULD use AI-assisted commands (see examples below)
- Cluster state queries SHOULD use natural language via kubectl-ai
- Resource optimization recommendations from Kagent MUST be reviewed and applied when beneficial
- AI operation logs MUST be captured in PHRs for traceability
- Manual kubectl commands are permitted only when AI tools fail or for scripting/automation

**Example kubectl-ai Commands** (executed via Claude Code prompts):
```bash
# Deploy application
kubectl-ai "deploy the frontend and backend helm charts to the default namespace"

# Scale deployments
kubectl-ai "scale the backend deployment to 3 replicas"

# Monitor pods
kubectl-ai "show me all pods and their status in the default namespace"

# Troubleshoot issues
kubectl-ai "why is the frontend pod crashing?"
kubectl-ai "show logs for the backend pod that's failing"

# Update configuration
kubectl-ai "update the backend configmap with new API endpoint"
```

**Example Kagent Commands** (executed via Claude Code prompts):
```bash
# Cluster analysis
kagent analyze cluster

# Resource optimization
kagent optimize resources --namespace default

# Cost analysis
kagent cost-analysis --show-recommendations

# Security audit
kagent security-scan --namespace default

# Performance diagnostics
kagent diagnose performance --deployment backend
```

**Phase III Feature Mapping**:
- Use kubectl-ai to verify chatbot endpoints are accessible: `kubectl-ai "what's the nodeport URL for the frontend service?"`
- Use Kagent to monitor agent performance: `kagent diagnose performance --deployment backend`
- Use kubectl-ai to debug conversation issues: `kubectl-ai "show me backend pod logs filtered by conversation_id"`
- Use Kagent to optimize database connections: `kagent optimize resources --focus database-connections`

---

## Phase IV Technology Stack

| **Category**           | **Technology**                              | **Purpose**                                             |
|------------------------|---------------------------------------------|---------------------------------------------------------|
| **Containerization**   | Docker                                      | Container image building and runtime                    |
| **Docker AI Assistant**| Gordon                                      | AI-assisted Dockerfile generation and optimization      |
| **Orchestration**      | Kubernetes (Minikube)                       | Local container orchestration and service management    |
| **Package Manager**    | Helm                                        | Kubernetes package management and templated deployments |
| **AI DevOps - Deploy** | kubectl-ai                                  | Natural language Kubernetes operations                  |
| **AI DevOps - Monitor**| Kagent                                      | Cluster analysis, optimization, and troubleshooting     |
| **Application - Frontend** | Next.js 16+ (containerized)             | Conversational UI (Phase III) in container              |
| **Application - Backend**  | FastAPI + Agents SDK (containerized)    | REST API + AI agent + MCP tools in container            |
| **Database**           | PostgreSQL (Neon Cloud)                     | Persistent data storage (accessed from containers)      |
| **Configuration**      | Kubernetes ConfigMaps & Secrets             | Environment-specific settings and credentials           |
| **Service Exposure**   | Kubernetes NodePort                         | Local access to frontend (3000) and backend (8000)      |
| **Development**        | Claude Code                                 | AI-assisted code, Dockerfile, chart, and manifest generation |

---

## Phase IV Development & Deployment Workflow

### AI-Driven Containerization Flow
1. **`/sp.specify`** - Define containerization requirements and success criteria
2. **`/sp.plan`** - Design Dockerfile structure, base images, multi-stage builds, and optimization strategies
3. **`/sp.tasks`** - Generate tasks for Dockerfile creation, image building, and testing
4. **`/sp.implement`** - Use Claude Code to:
   - Generate Dockerfiles via Gordon AI prompts
   - Build and test container images locally
   - Optimize image size and security
   - Validate health checks and environment variable configuration
5. **Validate** - Ensure containers run successfully with Phase III features intact

### AI-Driven Helm Chart & Kubernetes Deployment Flow
1. **`/sp.specify`** - Define deployment requirements (replicas, resources, services, ConfigMaps, Secrets)
2. **`/sp.plan`** - Design Helm chart structure, templating strategy, and Kubernetes resource definitions
3. **`/sp.tasks`** - Generate tasks for chart creation, manifest templating, and deployment testing
4. **`/sp.implement`** - Use Claude Code to:
   - Generate Helm charts with templated manifests
   - Create ConfigMaps and Secrets for configuration
   - Define Services (NodePort) for local access
   - Configure resource limits, health probes, and scaling policies
5. **Deploy** - Use kubectl-ai via Claude Code prompts:
   ```bash
   kubectl-ai "install the frontend helm chart from ./helm/frontend"
   kubectl-ai "install the backend helm chart from ./helm/backend"
   ```
6. **Validate** - Use kubectl-ai to verify deployment:
   ```bash
   kubectl-ai "show all pods and services in the default namespace"
   kubectl-ai "get the nodeport URLs for frontend and backend services"
   ```
7. **Test** - Access Phase III chatbot via NodePort URLs and verify all features work

### AI-Driven Monitoring & Optimization Flow
1. **Monitor** - Use Kagent to analyze cluster health:
   ```bash
   kagent analyze cluster
   kagent diagnose performance --namespace default
   ```
2. **Optimize** - Review Kagent recommendations and apply optimizations:
   ```bash
   kagent optimize resources --namespace default --apply
   ```
3. **Troubleshoot** - Use kubectl-ai for debugging:
   ```bash
   kubectl-ai "why is the backend pod restarting?"
   kubectl-ai "show me error logs from all pods"
   ```
4. **Iterate** - Refine Dockerfiles, Helm charts, or resource configurations based on monitoring insights

---

## Containerization Specifications

### Frontend Container (Next.js)

**Dockerfile Requirements**:
- **Base Image**: `node:20-alpine` (official, minimal)
- **Multi-stage Build**:
  - Stage 1: Install dependencies (`pnpm install`)
  - Stage 2: Build Next.js app (`pnpm build`)
  - Stage 3: Production runtime (copy build artifacts, run `next start`)
- **Non-root User**: Create and use `nextjs` user
- **Health Check**: HTTP GET on `/api/health` endpoint
- **Environment Variables**: `NEXT_PUBLIC_BACKEND_URL`, `BETTER_AUTH_SECRET`
- **Exposed Port**: 3000
- **Working Directory**: `/app`

**Example Dockerfile Structure** (generated by Claude Code + Gordon):
```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder /app/package.json ./package.json
USER nextjs
EXPOSE 3000
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
CMD ["node_modules/.bin/next", "start"]
```

### Backend Container (FastAPI + Agents SDK)

**Dockerfile Requirements**:
- **Base Image**: `python:3.13-slim` (official, minimal)
- **Multi-stage Build**:
  - Stage 1: Install dependencies (`uv sync`)
  - Stage 2: Production runtime (copy dependencies, run `uvicorn`)
- **Non-root User**: Create and use `fastapi` user
- **Health Check**: HTTP GET on `/api/health` endpoint
- **Environment Variables**: `DATABASE_URL`, `OPENAI_API_KEY`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- **Exposed Port**: 8000
- **Working Directory**: `/app`

**Example Dockerfile Structure** (generated by Claude Code + Gordon):
```dockerfile
# Stage 1: Dependencies
FROM python:3.13-slim AS deps
WORKDIR /app
RUN pip install uv
COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev

# Stage 2: Production
FROM python:3.13-slim AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 fastapi && adduser --system --uid 1001 fastapi
COPY --from=deps --chown=fastapi:fastapi /app/.venv /app/.venv
COPY --chown=fastapi:fastapi . .
USER fastapi
EXPOSE 8000
ENV PATH="/app/.venv/bin:$PATH"
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')"
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## Kubernetes & Helm Specifications

### Frontend Helm Chart

**Chart Structure**:
```
helm/frontend/
├── Chart.yaml               # Metadata (name: frontend, version: 1.0.0)
├── values.yaml              # Default values (replicas: 2, image, resources)
├── templates/
│   ├── deployment.yaml      # Deployment with Next.js container
│   ├── service.yaml         # NodePort service (port 3000)
│   ├── configmap.yaml       # Non-sensitive config
│   └── _helpers.tpl         # Template helpers
└── README.md                # Chart documentation
```

**Key Configuration** (`values.yaml`):
```yaml
replicaCount: 2
image:
  repository: todo-frontend
  tag: "1.0.0"
  pullPolicy: IfNotPresent
service:
  type: NodePort
  port: 3000
  nodePort: 30000
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi
env:
  NEXT_PUBLIC_BACKEND_URL: "http://localhost:30001"
```

### Backend Helm Chart

**Chart Structure**:
```
helm/backend/
├── Chart.yaml               # Metadata (name: backend, version: 1.0.0)
├── values.yaml              # Default values (replicas: 2, image, resources, database)
├── templates/
│   ├── deployment.yaml      # Deployment with FastAPI container
│   ├── service.yaml         # NodePort service (port 8000)
│   ├── configmap.yaml       # Non-sensitive config
│   ├── secret.yaml          # Database credentials, API keys
│   └── _helpers.tpl         # Template helpers
└── README.md                # Chart documentation
```

**Key Configuration** (`values.yaml`):
```yaml
replicaCount: 2
image:
  repository: todo-backend
  tag: "1.0.0"
  pullPolicy: IfNotPresent
service:
  type: NodePort
  port: 8000
  nodePort: 30001
resources:
  limits:
    cpu: 1000m
    memory: 1Gi
  requests:
    cpu: 500m
    memory: 512Mi
database:
  url: "postgresql://user:pass@host:5432/dbname"  # Overridden in secret
openai:
  apiKey: "sk-..."  # Overridden in secret
auth:
  secret: "..."     # Overridden in secret
  url: "http://localhost:30000"
```

**Secret Management**:
- Secrets MUST be created separately before Helm install:
  ```bash
  kubectl create secret generic backend-secrets \
    --from-literal=database-url="$DATABASE_URL" \
    --from-literal=openai-api-key="$OPENAI_API_KEY" \
    --from-literal=auth-secret="$BETTER_AUTH_SECRET"
  ```
- Helm chart MUST reference existing secrets, not create them with hardcoded values

### Deployment Verification Commands

**Deploy Charts** (via kubectl-ai):
```bash
kubectl-ai "install the frontend helm chart from ./helm/frontend with release name frontend"
kubectl-ai "install the backend helm chart from ./helm/backend with release name backend"
```

**Verify Deployment**:
```bash
kubectl-ai "show all pods and their status"
kubectl-ai "show all services and their nodeport URLs"
kubectl-ai "describe the frontend deployment"
kubectl-ai "get logs from the backend pod"
```

**Access Application**:
- Frontend: `http://localhost:30000` (ChatKit UI)
- Backend: `http://localhost:30001/docs` (FastAPI Swagger docs)
- Test chatbot: Navigate to frontend URL, authenticate, open chat widget

---

## Phase IV Success Criteria

### Containerization Success Criteria
- [x] Frontend Dockerfile builds without errors using `docker build`
- [x] Backend Dockerfile builds without errors using `docker build`
- [x] Frontend container runs successfully with `docker run` and serves on port 3000
- [x] Backend container runs successfully with `docker run` and serves on port 8000
- [x] Health checks pass for both containers
- [x] All Phase III chatbot features work when accessed via container ports
- [x] Container images are optimized (< 500MB frontend, < 1GB backend)
- [x] Containers use non-root users for security
- [x] Environment variables are correctly configured (no hardcoded secrets)

### Kubernetes Deployment Success Criteria
- [x] Minikube cluster starts successfully
- [x] Frontend Helm chart installs without errors (`helm install frontend ./helm/frontend`)
- [x] Backend Helm chart installs without errors (`helm install backend ./helm/backend`)
- [x] All pods reach `Running` state within 2 minutes
- [x] Services are exposed via NodePort (frontend: 30000, backend: 30001)
- [x] Frontend is accessible at `http://localhost:30000`
- [x] Backend API docs are accessible at `http://localhost:30001/docs`
- [x] All Phase III chatbot features work via NodePort URLs:
  - User can authenticate via Better Auth
  - User can open chat widget and send messages
  - Agent responds correctly using MCP tools
  - Task operations (create, read, update, delete) work via chat
  - Conversation history persists across pod restarts
- [x] Database connectivity works from backend pods
- [x] ConfigMaps and Secrets are correctly mounted
- [x] Resource limits are enforced (pods don't exceed defined limits)
- [x] Liveness and readiness probes pass consistently

### AI DevOps Success Criteria
- [x] kubectl-ai successfully deploys Helm charts via natural language commands
- [x] kubectl-ai can query cluster state (pods, services, logs) via natural language
- [x] Kagent analyzes cluster health and provides actionable recommendations
- [x] kubectl-ai can scale deployments and update configurations
- [x] kubectl-ai can troubleshoot pod failures and display relevant logs
- [x] All AI DevOps operations are logged in PHRs for traceability

### Integration Success Criteria
- [x] End-to-end user flow works in Kubernetes:
  1. User navigates to `http://localhost:30000`
  2. User authenticates via Better Auth
  3. User opens chat widget
  4. User sends message: "Add a task to buy milk"
  5. Agent responds: "I've added 'buy milk' to your task list."
  6. User sends message: "Show my tasks"
  7. Agent responds with task list including "buy milk"
  8. User verifies task appears in main UI
- [x] Conversation state persists after pod restart (simulated via `kubectl delete pod`)
- [x] Horizontal scaling works (scale backend to 3 replicas, verify load distribution)
- [x] Rolling updates work without downtime (update backend image, verify zero errors)

---

## Phase IV Notes

### Development Constraints
- **Manual Coding Forbidden**: All Dockerfiles, Helm charts, Kubernetes manifests, and deployment scripts MUST be generated by Claude Code following the Spec → Plan → Tasks → Implement workflow.
- **AI-First DevOps**: All Kubernetes operations (deploy, scale, monitor) SHOULD use kubectl-ai or Kagent via Claude Code prompts. Manual kubectl is permitted only for scripting or when AI tools fail.
- **Iterative Refinement**: Dockerfile optimization, Helm chart configuration, and Kubernetes resource tuning MUST be iterative. If initial deployment fails, capture errors, refine specs, and regenerate artifacts via Claude Code.

### AI Operations Expectations
- **Gordon** (Docker AI): Generates optimized, secure Dockerfiles with multi-stage builds, minimal base images, and proper health checks.
- **kubectl-ai**: Translates natural language to kubectl commands, handles deployment, scaling, monitoring, and troubleshooting.
- **Kagent**: Analyzes cluster state, identifies performance bottlenecks, recommends resource optimizations, and performs security audits.

### Deployment Prerequisites
- **Minikube**: Local Kubernetes cluster MUST be running (`minikube start`)
- **Docker**: Container runtime MUST be available (`docker --version`)
- **Helm**: Package manager MUST be installed (`helm version`)
- **kubectl-ai**: CLI MUST be installed (`kubectl-ai --version`)
- **Kagent**: CLI MUST be installed (`kagent --version`)
- **Database**: Neon PostgreSQL MUST be accessible from Kubernetes pods (connection string configured in Secret)
- **OpenAI API Key**: MUST be available in Secret for backend Agents SDK

### Troubleshooting Strategy
1. **Container Build Failures**: Review Gordon-generated Dockerfile, check base image availability, verify dependencies
2. **Pod CrashLoopBackOff**: Use kubectl-ai to view logs and diagnose (e.g., "why is the backend pod crashing?")
3. **Service Not Accessible**: Verify NodePort configuration, check Minikube IP (`minikube ip`), ensure firewall allows traffic
4. **Database Connection Issues**: Verify Secret contains correct connection string, test connectivity from pod (`kubectl exec -it <pod> -- sh`)
5. **Agent Not Responding**: Check OpenAI API key in Secret, verify MCP tools initialization, review backend logs

### Future Phases
- **Phase V** (Planned): Cloud Kubernetes deployment (EKS/GKE/AKS) with Ingress, TLS, and auto-scaling
- **Phase VI** (Planned): CI/CD pipeline with GitHub Actions, automated testing, and continuous deployment
- **Phase VII** (Planned): Monitoring and observability with Prometheus, Grafana, and distributed tracing

---

## Project Structure & Deliverables

### Repository Structure

The GitHub repository MUST contain the following directory structure:

```
/frontend          # ChatKit-based conversational UI (Next.js + TypeScript)
/backend           # FastAPI + OpenAI Agents SDK + MCP tools (Python)
/specs             # Specification files for agent and MCP tools
/helm              # Helm charts for Kubernetes deployment (Phase IV)
/k8s               # Kubernetes manifests (optional, if not using Helm) (Phase IV)
/history           # Prompt History Records (PHRs) and Architecture Decision Records (ADRs)
/.specify          # Spec-Driven Development templates and configuration
README.md          # Setup instructions and project overview
Dockerfile.frontend   # Frontend container image definition (Phase IV)
Dockerfile.backend    # Backend container image definition (Phase IV)
.dockerignore      # Docker build exclusions (Phase IV)
```

**Requirements**:
- `/frontend` MUST contain the Next.js application with ChatKit integration
- `/backend` MUST contain:
  - FastAPI application code
  - OpenAI Agents SDK integration
  - MCP tool definitions and implementations
  - SQLModel database models
  - Alembic database migration scripts
  - Test suites (pytest)
- `/specs` MUST contain:
  - Agent system prompt specifications
  - MCP tool schema definitions
  - API contract documentation
- `/helm` MUST contain *(Phase IV)*:
  - `frontend/` - Frontend Helm chart with templated manifests
  - `backend/` - Backend Helm chart with templated manifests
  - Each chart MUST have `Chart.yaml`, `values.yaml`, `templates/`, and `README.md`
- `/k8s` MAY contain *(Phase IV)*:
  - Raw Kubernetes manifests if not using Helm
  - One-off resources (Ingress, NetworkPolicy, etc.)
- `Dockerfile.frontend` and `Dockerfile.backend` MUST exist at repository root *(Phase IV)*
- `.dockerignore` MUST exclude unnecessary files from container images *(Phase IV)*
- Database migration scripts MUST be organized under `/backend/alembic/versions/`
- README.md MUST include:
  - Project overview and architecture
  - Setup instructions for local development
  - Environment variable configuration guide
  - Database setup and migration instructions
  - Running tests
  - Deployment guidance
  - **Phase IV additions**:
    - Docker image building instructions
    - Minikube setup and configuration
    - Helm chart installation commands
    - kubectl-ai and Kagent usage examples
    - NodePort access URLs for local testing

### Working Chatbot Deliverables

The Phase III implementation MUST deliver a working chatbot with the following capabilities:

**Core Functionality**:
1. **Natural Language Task Management**:
   - Create, read, update, delete tasks through conversational input
   - Support commands like "add a task to buy milk", "show my tasks", "mark task 3 as done"
   - Extract entities (titles, due dates, priorities) from natural language

2. **Conversation Context Persistence**:
   - Store all conversation history in PostgreSQL database
   - Maintain conversation context across requests (stateless server reconstructs from database)
   - Resume conversations after server restart without data loss
   - Support multi-device access (same conversation accessible from different clients)

3. **Helpful User Experience**:
   - Provide clear, friendly responses with action confirmations
   - Handle ambiguous requests by asking clarifying questions
   - Confirm destructive operations before executing (e.g., "Are you sure you want to delete all tasks?")
   - Display typing indicators during agent processing
   - Stream responses in real-time for better responsiveness

4. **Error Handling**:
   - Handle errors gracefully without exposing internal details to users
   - Provide actionable error messages (e.g., "I couldn't find that task. Would you like to see all your tasks?")
   - Log all errors to database for debugging and monitoring
   - Recover from transient failures automatically when possible

5. **Tool-Based Architecture**:
   - Expose all task operations as MCP tools
   - Log all tool invocations to database for traceability
   - Enforce user-scoped authorization for all operations
   - Support tool execution observability (optionally display tool calls in UI)

**Acceptance Criteria**:
- User can manage their entire task list through natural language conversation
- No data loss occurs on server restart
- All operations are user-scoped (no cross-user data access)
- System handles at least 100 concurrent conversations without performance degradation
- Average response latency under 2 seconds for simple operations
- All errors are logged with sufficient context for debugging

---

## Technology Standards

### Backend Stack (Phase II–III)
- **Language**: Python 3.13+
- **Framework**: FastAPI (latest stable)
- **ORM**: SQLModel
- **Database**: Neon PostgreSQL
- **Auth**: Better Auth JWT (shared secret verification)
- **Migrations**: Alembic

### Frontend Stack (Phase II–III)
- **Framework**: Next.js 16+ (App Router)
- **Chat UI**: OpenAI ChatKit *(Phase III)*
- **Styling**: Tailwind CSS with custom design system
- **Typography**: Poppins font family
- **Language**: TypeScript (strict mode)
- **Auth**: Better Auth client integration
- **UI Components**: shadcn/ui

### Agent Stack (Phase III)
- **Framework**: OpenAI Agents SDK
- **LLM**: OpenAI GPT-4 or compatible model
- **Tool Protocol**: MCP (Model Context Protocol) via Official MCP SDK
- **Language**: Python 3.13+ (preferred) or TypeScript
- **State Management**: Database-backed (PostgreSQL via backend API)
- **Tool Definitions**: MCP schema with type validation

### Communication Protocols
- **Frontend ↔ Backend**: REST API over HTTPS (JSON payloads)
- **Agent ↔ Backend**: MCP tools invoking REST API endpoints
- **Agent ↔ Frontend**: Server-Sent Events (SSE) or WebSocket for streaming responses
- **Kubernetes Services**: ClusterIP for internal, NodePort for local external access *(Phase IV)*

### Development Tools
- **Package Management**: uv (backend/agent), pnpm (frontend)
- **Linting**: ruff (Python), ESLint (TypeScript)
- **Formatting**: ruff format (Python), Prettier (TypeScript)
- **Testing**: pytest (backend/agent), Jest/Vitest (frontend)
- **Type Checking**: mypy (Python), tsc (TypeScript)

### Deployment Tools (Phase IV)
- **Containerization**: Docker 20+ with BuildKit
- **Docker AI**: Gordon CLI for AI-assisted Dockerfile generation
- **Orchestration**: Kubernetes 1.28+ (Minikube for local)
- **Package Manager**: Helm 3.12+
- **AI DevOps**: kubectl-ai, Kagent
- **Image Registry**: Docker Hub, GitHub Container Registry, or local Minikube registry
- **Secrets Management**: Kubernetes Secrets (dev), external secret stores for production (HashiCorp Vault, AWS Secrets Manager)

---

## Development Workflow

### Spec-Driven Development (SDD) Cycle
1. **`/sp.specify`** - Define feature requirements and acceptance criteria
2. **`/sp.plan`** - Create implementation architecture and technical design
3. **`/sp.tasks`** - Generate actionable, dependency-ordered tasks
4. **`/sp.implement`** - Execute tasks with AI assistance
5. **Validate** - Test against spec and iterate

### Phase III Agent Development Flow
1. Define conversational user stories in spec (e.g., "As a user, I want to add a task by saying 'remind me to buy milk'")
2. Design tool contracts in plan (tool names, parameters, backend endpoint mappings, error handling)
3. Generate tasks for:
   - Tool implementation (MCP schema + backend wiring)
   - Agent system prompt configuration
   - ChatKit integration
   - Tests (tool selection, parameter extraction, conversation flow)
4. Implement MCP tools (definitions + backend endpoint invocation)
5. Configure agent system prompt and tool selection logic
6. Integrate ChatKit in frontend with streaming response support
7. Test conversational flows with representative user inputs
8. Iterate on prompts and tools based on test results
9. Document significant decisions in ADRs (tool design, prompt strategies, error handling)

### Phase IV Deployment Flow
1. **Containerization**:
   - Define Dockerfile requirements in spec (base images, multi-stage builds, security, health checks)
   - Design Dockerfile architecture in plan (optimization strategies, layer caching, build args)
   - Generate tasks for Dockerfile creation, image building, and container testing
   - Use Claude Code + Gordon to generate optimized Dockerfiles
   - Build images locally (`docker build -t <image>:<tag> -f Dockerfile.<tier> .`)
   - Test containers locally (`docker run --env-file .env -p <port>:<port> <image>:<tag>`)
   - Validate Phase III features work in containers
2. **Helm Chart Creation**:
   - Define deployment requirements in spec (replicas, resources, services, ConfigMaps, Secrets)
   - Design Helm chart structure in plan (templating strategy, values parameterization)
   - Generate tasks for chart creation, manifest templating, and values configuration
   - Use Claude Code to generate Helm charts in `/helm/frontend/` and `/helm/backend/`
   - Validate chart syntax (`helm lint ./helm/<chart>`)
   - Dry-run installation (`helm install --dry-run --debug <release> ./helm/<chart>`)
3. **Kubernetes Deployment**:
   - Start Minikube (`minikube start`)
   - Create Secrets (`kubectl create secret generic ...`)
   - Deploy charts via kubectl-ai:
     ```bash
     kubectl-ai "install frontend helm chart from ./helm/frontend"
     kubectl-ai "install backend helm chart from ./helm/backend"
     ```
   - Verify deployment via kubectl-ai:
     ```bash
     kubectl-ai "show all pods and services"
     kubectl-ai "get nodeport URLs"
     ```
   - Test application via NodePort URLs
4. **Monitoring & Optimization**:
   - Run Kagent cluster analysis (`kagent analyze cluster`)
   - Apply optimization recommendations (`kagent optimize resources --apply`)
   - Monitor logs via kubectl-ai (`kubectl-ai "show backend pod logs"`)
5. **Iteration**:
   - Capture issues in specs
   - Refine Dockerfiles, Helm charts, or resource configs via Claude Code
   - Redeploy with `helm upgrade` via kubectl-ai
   - Repeat until success criteria met

### Version Control
- **Feature branches**: `###-feature-name` format
- **Commits** MUST reference task IDs when applicable
- **PRs** MUST include summary and test plan
- **Agent prompts and tool definitions** in version control treated as code

### Quality Gates
- All tests MUST pass before merge
- Linting MUST pass with zero warnings
- Type checking MUST pass (mypy for Python, tsc for TypeScript)
- Security scans SHOULD be run on PRs
- Agent tests SHOULD verify tool selection for key conversational scenarios
- MCP tool schemas MUST validate successfully

---

## Governance

This constitution supersedes all other development practices for all phases of the Full-Stack Todo Evolution project.

### Amendment Process
1. Propose change via `/sp.constitution` command with rationale
2. Document impact on existing code and templates
3. Update version according to semantic versioning:
   - **MAJOR**: Principle removal, backward-incompatible redefinition, or paradigm shift (e.g., adding agent tier)
   - **MINOR**: New principle or materially expanded guidance
   - **PATCH**: Clarifications, wording, or non-semantic refinements
4. Update dependent templates and documentation
5. Create Sync Impact Report documenting all changes

### Compliance
- All PRs MUST verify compliance with applicable principles
- Violations MUST be documented with justification in Complexity Tracking section of plan.md
- Architectural decisions SHOULD be recorded via ADR when meeting significance criteria
- Agent prompts, tool definitions, and ChatKit configurations fall under same compliance requirements as application code

### Runtime Guidance
- Use `.specify/` templates for all specification artifacts
- Consult this constitution before making architectural decisions
- When in doubt, ask for clarification rather than assume
- Document significant prompt engineering decisions in ADRs
- Test agent behavior thoroughly before deploying to production
- Monitor tool invocation logs for anomalies and errors

### Cross-Phase Principles
These principles apply across ALL phases (I, II, III, IV):
- **Multi-Tier Isolation** (I) - Extended with deployment artifacts in Phase IV
- **Persistence First** (II) - Extended with conversation state in Phase III
- **Secure by Design** (III) - Extended with agent tool authorization in Phase III, container security in Phase IV
- **Zero Manual Coding** (IV) - Extended with AI artifacts in Phase III, Dockerfiles/Helm charts in Phase IV
- **Test-First Discipline** (V) - Extended with agent tests in Phase III, deployment validation in Phase IV
- **API Contract Enforcement** (VI) - Extended with MCP tools in Phase III, Kubernetes Services in Phase IV

Phase III principles (VII–XIII) are additive and do not override Phase I/II principles.
Phase IV principles (XIV–XVII) are additive and do not override Phase I/II/III principles.

---

**Version**: 2.2.0 | **Ratified**: 2026-01-22 | **Last Amended**: 2026-02-16
