<!--
  SYNC IMPACT REPORT
  ==================
  Version change: 2.2.0 → 2.3.0 (MINOR — Added Phase V cloud-native, event-driven architecture
  with Dapr, Kafka, OpenAI Agents SDK, SDD enforcement, and agent compliance principles XVIII–XXIII)

  Modified principles:
    - I. Multi-Tier Isolation → Extended to include /recurring-service, /notification-service directories
    - XV. Kubernetes-Native Orchestration → Extended to include cloud Kubernetes targets (OKE, AKS, GKE, DOKS)
    - Phase IV "Future Phases" → Phase V reclassified from Planned to Active

  Added sections:
    - Phase V Principles: Cloud-Native, Event-Driven, SDD-Enforced Architecture (XVIII–XXIII)
    - Phase V Technology Stack
    - Phase V Development & Deployment Workflow
    - Phase V Success Criteria
    - Phase V Notes

  Removed sections: None

  Templates requiring updates:
    - ✅ plan-template.md (Constitution Check gates aligned with Phase V principles)
    - ✅ spec-template.md (requirements aligned with event-driven and Dapr constraints)
    - ✅ tasks-template.md (task categorization covers Dapr, Kafka, cloud-deploy task types)

  Follow-up TODOs: None — all placeholders resolved.
-->

# Full-Stack Todo Evolution Constitution

**Project Phases**:
- **Phase I**: In-memory Python CLI (complete)
- **Phase II**: Full-stack web app with Next.js + FastAPI + PostgreSQL (complete)
- **Phase III**: AI-powered conversational chatbot with OpenAI Agents SDK + MCP tools (complete)
- **Phase IV**: Local Kubernetes deployment with AI-assisted containerization and orchestration (complete)
- **Phase V**: Cloud-native, event-driven microservices with Dapr, Kafka, and cloud Kubernetes (active)

---

## Core Principles (Phases I–III)

### I. Multi-Tier Isolation

All code MUST reside strictly within designated directories:
- **Frontend code**: `/frontend/` (Next.js UI with ChatKit interface)
- **Backend code**: `/backend/` (FastAPI REST API + OpenAI Agents SDK + MCP tools) *(Phase III)*
- **Specification files**: `/specs/` (Agent and MCP tool specifications) *(Phase III)*
- **Deployment artifacts**: `/helm/` (Helm charts), `/k8s/` (Kubernetes manifests) *(Phase IV)*
- **Recurring service**: `/recurring-service/` (Kafka consumer for scheduled/recurring tasks) *(Phase V)*
- **Notification service**: `/notification-service/` (Kafka consumer for notifications) *(Phase V)*
- **Dapr components**: `/dapr/` (Component definitions: pubsub, statestore, secrets) *(Phase V)*

**Rationale**: Clear separation enables independent deployment, testing, and scaling of each
architectural tier. Frontend handles presentation and chat UI; backend handles business logic,
data persistence, and conversational AI orchestration. Specifications live separately for
documentation and discoverability. Deployment artifacts are isolated to maintain
infrastructure-as-code best practices. Event-driven services are isolated to enforce
single-responsibility and independent scalability.

**Enforcement**:
- Code reviews MUST reject any code outside designated directories
- Build pipelines MUST only process files within the isolation boundary
- Shared types or contracts MUST be duplicated or published as packages, never imported
  across tiers directly
- Communication between frontend and backend MUST occur only via documented protocols
  (REST API, MCP tools)
- Deployment artifacts MUST NOT contain application code; only configuration and
  orchestration definitions
- Services MUST communicate asynchronously via Kafka (Dapr PubSub); direct inter-service
  HTTP calls are prohibited except where Dapr Service Invocation is explicitly specified

### II. Persistence First

All data MUST be persisted to Neon PostgreSQL using SQLModel as the ORM layer. In-memory
storage is prohibited for production data.

**Phase III Extension**: All conversation state (messages, agent runs, tool invocations) MUST
be stored in the database. The backend MUST remain stateless—no in-memory session or
conversation context. Each request MUST be independently reproducible from database state.

**Phase V Extension**: Dapr State Store (backed by Neon PostgreSQL) MUST be used for any
shared state accessed by multiple microservices. Kafka consumer offsets MUST be managed by
the broker, not stored in application memory.

**Rationale**: Durable persistence enables conversation history, multi-device access, audit
trails, and system resilience. Stateless backend design ensures horizontal scalability and
simplifies deployment.

**Requirements**:
- Every entity (including messages, conversations, agent runs, tool calls) MUST have a
  corresponding SQLModel class
- Database migrations MUST be managed via Alembic
- Connection pooling MUST be configured for production workloads
- All queries MUST use parameterized statements (SQLModel handles this by default)
- Conversation state MUST be stored in normalized tables with proper foreign keys and indexes
- Agent context MUST be reconstructed from database on each request
- Dapr State Store component MUST point to Neon PostgreSQL in all environments

### III. Secure by Design

Every API request MUST be validated via Better Auth JWT tokens. No unauthenticated endpoints
are permitted except health checks and public metadata.

**Phase III Extension**: All MCP tool invocations MUST include user context derived from JWT
tokens. Agent tools MUST enforce user-scoped authorization for all task operations (create,
read, update, delete). Cross-user data access MUST be blocked at the database query level.

**Phase V Extension**: All secrets (database URLs, API keys, JWT secrets, Kafka credentials)
MUST be sourced from Kubernetes Secrets or the Dapr Secrets Store. Hardcoded secrets in any
artifact (code, Helm values, ConfigMaps, Docker images) are strictly prohibited and constitute
a critical violation.

**Rationale**: Security is not an afterthought. Authentication and authorization MUST be baked
into the architecture from day one to prevent data leakage and unauthorized access. Agents
operate on behalf of users and MUST respect user isolation boundaries.

**Requirements**:
- JWT verification MUST use shared secret between Next.js and FastAPI
- Tokens MUST include user identity claims for authorization decisions
- Token expiry MUST be enforced; refresh token flow MUST be implemented
- All endpoints MUST declare their authentication requirements explicitly
- Failed authentication MUST return 401; failed authorization MUST return 403
- Agent tools MUST propagate user_id from JWT to backend for all operations
- Database queries MUST filter by user_id to enforce data isolation
- Secrets MUST be stored in Kubernetes Secrets or Dapr Secrets Store; never in plaintext files
- `.env` files MUST be listed in `.gitignore` and MUST NOT be committed to version control

### IV. Zero Manual Coding

All code within project directories MUST be generated by Claude Code. Manual edits are
prohibited.

**Phase III Extension**: Agent system prompts, MCP tool definitions, and ChatKit configurations
are considered code artifacts and MUST be generated by Claude Code following the
Spec → Plan → Tasks → Implement workflow.

**Phase IV Extension**: Dockerfiles, Helm charts, Kubernetes manifests, and all deployment
configuration files are considered code artifacts and MUST be generated by Claude Code.

**Phase V Extension**: Dapr component definitions, Kafka consumer implementations, event schema
definitions, and cloud Kubernetes manifests are considered code artifacts and MUST be generated
by Claude Code following the SDD workflow (speckit.specify → speckit.plan → speckit.tasks →
speckit.implement).

**Rationale**: This project demonstrates AI-assisted development workflow across the entire
software lifecycle—from application code to infrastructure-as-code and deployment automation.
Maintaining this constraint ensures reproducibility, traceability, and validates the AI coding
assistant's capabilities for full DevOps automation.

**Enforcement**:
- Every code change MUST be traceable to a Claude Code session via PHR
- Manual hotfixes are prohibited; issues MUST be resolved through new Claude Code prompts
- Code reviews MUST verify AI-generation provenance
- Prompt engineering, tool schema definitions, Dockerfiles, Helm charts, K8s manifests,
  Dapr components, and Kafka configurations all fall under this principle
- All implementation MUST reference a speckit.tasks Task ID

### V. Test-First Discipline

Tests SHOULD be written before implementation when explicitly requested. Red-Green-Refactor
cycle is the preferred development pattern.

**Phase III Extension**: Agent behavior tests SHOULD verify tool selection, parameter
extraction, conversation flow, and natural language understanding before implementing agent
logic.

**Phase V Extension**: Event-driven integration tests SHOULD verify that publishing a task
event to Kafka results in the correct consumer behavior. Dapr component tests SHOULD validate
state store reads/writes and secret retrieval before wiring into services.

**Rationale**: Test-first development catches design issues early and ensures every feature
has verification coverage from inception. For AI systems, tests codify expected behavior and
catch regressions in prompt engineering and tool selection logic.

**Guidelines**:
- Contract tests for API endpoints SHOULD be defined before implementation
- Integration tests SHOULD cover critical user journeys (including conversational flows)
- Unit tests SHOULD cover business logic in isolation
- Agent tests SHOULD verify correct tool selection for representative user inputs
- Agent tests SHOULD validate parameter extraction from natural language
- Test files MUST reside in appropriate `tests/` directories per tier
- Event integration tests MUST verify correct topic publishing and consumer processing

### VI. API Contract Enforcement

Frontend and backend MUST communicate exclusively via REST API with JSON payloads. Agent and
backend MUST communicate via MCP tools. All contracts MUST be documented and versioned.

**Phase III Extension**: All task operations MUST be exposed as MCP tools using the Official
MCP SDK. Tool definitions serve as the contract between agent and backend. Tool schemas MUST
match backend API contracts exactly.

**Phase V Extension**: Event schemas published to Kafka topics (task-events, reminders,
task-updates) are treated as contracts. Breaking schema changes MUST be versioned. Consumers
MUST be backward-compatible with the previous event schema version during rolling deployments.

**Rationale**: Explicit contracts enable independent development of each tier, facilitate
testing, and provide clear documentation for all consumers. MCP provides a standard,
discoverable interface for agent tools. Event schemas are first-class contracts for
event-driven services.

**Requirements**:
- All REST endpoints MUST follow REST conventions (proper HTTP methods, status codes)
- Request/response schemas MUST be documented (OpenAPI/Swagger auto-generation via FastAPI)
- Breaking changes MUST increment API version
- Error responses MUST follow a consistent structure
- MCP tool definitions MUST declare parameters, types, and descriptions
- Tool responses MUST match documented schemas
- Tools MUST invoke backend REST API endpoints (not bypass them)
- Kafka event schemas MUST be defined in `/specs/` before implementation
- Event schema changes MUST be backward-compatible or versioned

---

## Phase III Principles: AI-Powered Chatbot

### VII. Agent-First Architecture

The conversational interface is the PRIMARY user interaction model for task management in
Phase III. All user task operations MUST be handled through an AI agent built with the
OpenAI Agents SDK.

**Rationale**: Modern AI agents provide natural language understanding, context management,
and intelligent tool orchestration. Agent-first design enables users to manage tasks through
conversation rather than clicking through UI forms, lowering the barrier to entry and
improving accessibility.

**Requirements**:
- The agent MUST be built using the OpenAI Agents SDK
- The agent MUST handle multi-turn conversations with context preservation
- The agent MUST provide helpful, friendly responses for all user inputs
- The agent MUST handle ambiguous requests and ask clarifying questions when needed
- The agent MUST confirm destructive operations before executing
- The frontend MUST render agent responses in a conversational chat interface
- The REST API MUST remain available for direct programmatic access (not deprecated)

### VIII. MCP Tool-Based System Design

All task operations (create, read, update, delete, list) MUST be exposed as stateless MCP
tools using the Official MCP SDK. The agent MUST interact with the application exclusively
through these tools.

**Rationale**: MCP (Model Context Protocol) provides a standard, discoverable, and type-safe
interface for agent tools. Tools encapsulate backend logic, enforce contracts, and provide
clear boundaries for what the agent can do. Stateless tools simplify testing, debugging, and
horizontal scaling.

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

The backend MUST remain stateless. No in-memory session or conversation state is permitted.
All conversation history MUST be stored in the database. Each request MUST be independently
reproducible.

**Rationale**: Stateless backends enable horizontal scaling, simplify deployment, avoid
session management complexity, and improve fault tolerance. Storing conversation state in
the database enables multi-device access, conversation history persistence, audit trails,
and disaster recovery.

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

The frontend MUST use OpenAI ChatKit as the primary user interface for task management.
All task operations MUST be accessible through natural language via the chat interface.

**Rationale**: ChatKit provides a modern, accessible, and mobile-friendly conversational UI.
It handles message rendering, streaming responses, typing indicators, and accessibility
features out of the box. Users can manage tasks without learning commands or navigating
complex UIs.

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

The system MUST interpret user intent from conversational input and map it to the appropriate
MCP tools. All task CRUD operations MUST be performable via natural language. All actions
MUST return clear, friendly confirmations.

**Rationale**: Natural language interfaces lower the barrier to entry and make task management
more accessible to all users. Users can express intent without memorizing commands, clicking
through forms, or navigating complex UIs. Friendly confirmations build trust and provide
feedback.

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

All AI, agent, MCP, and chat features MUST follow the same Spec-Driven Development workflow
as traditional features. Prompts and tool definitions are code artifacts requiring the same
rigor.

**Rationale**: AI systems are complex software systems that benefit from upfront planning,
documented requirements, and testable acceptance criteria. Prompts, tool definitions, and
conversation flows require design, review, and iteration just like application code.
Ad-hoc prompt engineering leads to inconsistent behavior and regressions.

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

All agent tool calls MUST be logged, traceable, and optionally returned in API responses.
Tool execution MUST be debuggable and auditable.

**Rationale**: AI agent behavior can be opaque and difficult to debug. Logging all tool
invocations enables debugging, auditing, compliance, and understanding agent behavior.
Transparent tool calls help users understand what the agent is doing on their behalf.
Observability is essential for production AI systems.

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

All application components MUST be containerized using Docker with AI-assisted image building
via Gordon. Containers MUST be production-ready, optimized, and secure.

**Rationale**: Containerization enables consistent deployment across environments, simplifies
dependency management, improves resource utilization, and facilitates horizontal scaling.
AI-assisted Docker operations (Gordon) streamline Dockerfile generation, optimize image layers,
and apply security best practices automatically.

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

All containerized services MUST be deployed to Kubernetes. Phase IV targets local Minikube.
Phase V extends to cloud Kubernetes clusters (OKE, AKS, GKE, or DOKS).

**Rationale**: Kubernetes provides industry-standard container orchestration with built-in
service discovery, load balancing, self-healing, and horizontal scaling. Cloud deployment
validates production-readiness for real-world workloads at scale.

**Requirements**:
- Frontend and backend MUST be deployed as separate Kubernetes Deployments
- Each deployment MUST specify replica count (default: 2 for high availability)
- Services MUST be exposed via NodePort for local Minikube access; Ingress for cloud
- Resource limits (CPU, memory) MUST be defined for all containers
- Liveness and readiness probes MUST be configured for health monitoring
- ConfigMaps MUST be used for non-sensitive configuration
- Secrets MUST be used for sensitive data (database credentials, API keys, JWT secrets)
- Rolling update strategy MUST be configured for zero-downtime deployments
- Horizontal Pod Autoscaler (HPA) SHOULD be configured for auto-scaling
- All Kubernetes manifests MUST be versioned and stored in `/k8s/` directory
- Namespace isolation SHOULD be used for environment separation (dev, staging, prod)
- Cloud Kubernetes deployment MUST support OKE, AKS, GKE, or DOKS as target platform

### XVI. Helm-Based Package Management

All Kubernetes resources MUST be packaged as Helm charts for simplified deployment,
versioning, and configuration management.

**Rationale**: Helm provides package management for Kubernetes, enabling templated manifests,
version control, rollback capabilities, and environment-specific configuration.

**Requirements**:
- Frontend and backend MUST each have dedicated Helm charts in `/helm/` directory
- Chart structure MUST follow Helm best practices:
  - `Chart.yaml` with metadata (name, version, description)
  - `values.yaml` with default configuration
  - `templates/` directory with templated Kubernetes manifests
- Values MUST be parameterized for environment-specific overrides
- Helm charts MUST include all necessary resources (Deployments, Services, ConfigMaps, Secrets)
- Chart versioning MUST follow semantic versioning (MAJOR.MINOR.PATCH)
- `helm install`, `helm upgrade`, and `helm rollback` commands MUST work correctly
- Chart documentation MUST be included in `README.md` within each chart directory

### XVII. AI-Assisted DevOps Operations

All Kubernetes operations (deploy, scale, monitor, troubleshoot) MUST be performed using
AI-assisted tools: kubectl-ai for natural language Kubernetes commands and Kagent for
cluster analysis and optimization. Manual kubectl commands are discouraged.

**Rationale**: AI-assisted DevOps tools lower the barrier to Kubernetes operations, reduce
human error, accelerate troubleshooting, and apply best practices automatically.

**Requirements**:
- **kubectl-ai** MUST be installed and used for all routine Kubernetes operations
- **Kagent** MUST be installed for cluster health monitoring and optimization analysis
- All deployment operations SHOULD use AI-assisted commands
- Resource optimization recommendations from Kagent MUST be reviewed and applied when beneficial
- AI operation logs MUST be captured in PHRs for traceability
- Manual kubectl commands are permitted only when AI tools fail or for scripting/automation

---

## Phase V Principles: Cloud-Native, Event-Driven, SDD-Enforced Architecture

### XVIII. Spec-Driven Development Enforcement

Every line of implementation code MUST be traceable to a speckit.tasks Task ID. No
implementation work MAY begin without a completed specification chain:
speckit.specify → speckit.plan → speckit.tasks.

**Rationale**: Phase V introduces significant architectural complexity (Dapr, Kafka, cloud
Kubernetes, multi-service event flows). Without strict SDD enforcement, implementations
diverge from intent, introduce unspecified dependencies, and create maintenance hazards.
Enforcing traceability at the task level ensures all changes are intentional, reviewable,
and reversible.

**Requirements**:
- Every implementation task MUST reference a speckit.tasks Task ID (e.g., `T042`)
- Agents MUST refuse implementation requests that lack a corresponding spec.md and tasks.md
- All implementation MUST follow the chain:
  `/sp.specify` → `/sp.plan` → `/sp.tasks` → `/sp.implement`
- Agents MUST surface a blocking error if spec.md or tasks.md is missing or incomplete
- PRs MUST include Task ID references in commit messages and PR descriptions
- PHRs MUST be created for every implementation session with Task IDs listed
- Architectural decisions discovered during implementation MUST pause work and trigger
  an ADR suggestion before proceeding
- Spec amendments discovered mid-implementation MUST be written back to spec.md before
  the implementation continues

### XIX. Event-Driven Architecture

All task lifecycle operations (create, update, complete, delete) MUST publish domain events
to Kafka via Dapr PubSub. Services MUST communicate asynchronously via events; synchronous
inter-service HTTP calls are prohibited for cross-service business logic.

**Rationale**: Event-driven architecture decouples services, enables independent scaling,
provides a natural audit trail, and supports extensibility without modifying producers.
Kafka ensures durable, ordered delivery. Dapr PubSub abstracts the broker, allowing future
broker changes without application code changes.

**Required Topics**:
- `task-events`: Published by backend on every task create/update/complete/delete
- `reminders`: Published by backend or Dapr Jobs API for scheduled reminder triggers
- `task-updates`: Published for real-time frontend update propagation

**Requirements**:
- Backend MUST publish to `task-events` topic on every task mutation (CRUD operations)
- Recurring service MUST subscribe to `reminders` topic and process scheduled tasks
- Notification service MUST subscribe to `task-events` and `reminders` topics
- All event publishing MUST use Dapr PubSub API (not direct Kafka client calls)
- Events MUST include: event_type, task_id, user_id, timestamp, payload
- Event schemas MUST be defined in `/specs/` before implementation
- Consumers MUST be idempotent — processing the same event twice MUST NOT cause
  duplicate side effects
- Dead-letter topic handling MUST be configured for failed message processing
- Services MUST NOT share a database directly; cross-service data access MUST go via events
  or documented REST/Dapr Service Invocation

### XX. Dapr Building Blocks Integration

All inter-service communication, state management, secret retrieval, and job scheduling MUST
use Dapr building blocks. Direct use of Kafka client libraries, raw database connections from
microservices, or external secret managers without Dapr abstraction is prohibited.

**Rationale**: Dapr provides a consistent, portable API for cloud-native building blocks.
Using Dapr abstractions avoids vendor lock-in, simplifies local development (Dapr sidecar
replaces broker/store infrastructure), and centralizes operational concerns in component
definitions rather than application code.

**Required Dapr Building Blocks**:

| Building Block | Implementation | Purpose |
|---|---|---|
| **Pub/Sub** | Kafka (via Dapr component) | Async event messaging |
| **State Store** | Neon PostgreSQL (via Dapr component) | Shared service state |
| **Service Invocation** | Dapr sidecar | Synchronous inter-service calls where needed |
| **Jobs API** | Dapr Jobs | Reminder and scheduled task triggers |
| **Secrets Store** | Kubernetes Secrets (via Dapr component) | Credential retrieval |

**Requirements**:
- All services MUST run with a Dapr sidecar injected (`dapr.io/enabled: "true"` annotation)
- Pub/Sub component definition MUST be stored in `/dapr/components/pubsub.yaml`
- State Store component definition MUST be stored in `/dapr/components/statestore.yaml`
- Secrets Store component definition MUST be stored in `/dapr/components/secretstore.yaml`
- Jobs API MUST be used for all reminder scheduling (no cron jobs in application code)
- Dapr component manifests MUST NOT contain hardcoded secrets; MUST reference Kubernetes Secrets
- Dapr Dashboard SHOULD be deployed for local development observability
- All Dapr API calls MUST use the Dapr HTTP/gRPC SDK (not raw sidecar HTTP calls)

### XXI. Cloud Kubernetes Deployment

All services MUST be deployable to a cloud Kubernetes cluster. Target platforms:
OKE (Oracle), AKS (Azure), GKE (Google), or DOKS (DigitalOcean). Cloud deployment MUST
replicate Minikube behavior with production-grade Ingress, TLS, and auto-scaling.

**Rationale**: Cloud Kubernetes validates that the architecture scales beyond a local
developer machine and operates under real network conditions, resource constraints, and
multi-tenant security boundaries. Helm charts designed for Minikube MUST work on cloud
clusters with environment-specific value overrides.

**Requirements**:
- All Helm charts MUST support environment-specific `values-cloud.yaml` override files
- Cloud deployments MUST use Ingress (not NodePort) for external traffic routing
- TLS MUST be configured via cert-manager or cloud-native certificate management
- All services MUST be deployed in a dedicated Kubernetes namespace (e.g., `todo-prod`)
- Cloud cluster MUST have Dapr installed via Helm before service deployment
- Kafka MUST be deployed as a Kubernetes StatefulSet or managed service (Confluent Cloud,
  MSK, Aiven) with connection details in Kubernetes Secrets
- HPA MUST be configured for backend, recurring-service, and notification-service
- Pod Disruption Budgets (PDB) MUST ensure at least 1 replica available during upgrades
- Resource requests and limits MUST be tuned for cloud node sizes (not Minikube defaults)
- Container images MUST be pushed to a container registry (GHCR, Docker Hub, or cloud registry)
  before cloud deployment

### XXII. Secrets Management Hardening

No secret, credential, API key, connection string, or token MAY appear in plaintext in any
file committed to version control or baked into container images. All secrets MUST be
retrieved at runtime from Kubernetes Secrets or Dapr Secrets Store.

**Rationale**: Hardcoded secrets are the leading cause of cloud security breaches. This
principle enforces defense-in-depth: secrets never transit through source control, never
appear in image layers, and are rotatable without rebuilding images.

**Prohibited Practices** (constitute critical violations):
- Hardcoded secrets in any `.py`, `.ts`, `.yaml`, `.json`, `.toml`, `.env` file committed to git
- Secrets in Helm `values.yaml` committed to git (override files with secrets MUST be
  `.gitignore`d)
- Secrets as Docker build args baked into image layers
- Secrets printed to stdout or application logs

**Requirements**:
- All secrets MUST be stored in Kubernetes Secrets before deployment
- All secrets MUST be referenced via Dapr Secrets Store API in application code
- `.env` files MUST be listed in `.gitignore`; a `.env.example` with placeholder values
  MUST be committed instead
- Secret rotation MUST not require application redeployment (secrets mounted as volumes
  or retrieved at request time)
- CI/CD secrets MUST be stored in the pipeline secret store (GitHub Actions Secrets),
  never in repository files
- Security scans MUST run on PRs to detect accidental secret commits (e.g., gitleaks,
  truffleHog)

### XXIII. Agent Compliance with SDD Workflow

All AI coding agents (Claude Code and any future agents) operating on this project MUST
comply with the Spec-Driven Development workflow. Agents MUST refuse to implement features
not covered by an approved spec and MUST cite Task IDs in all implementation artifacts.

**Rationale**: AI agents operating without spec constraints generate code that may be
correct locally but misaligned with system-level design, security requirements, or
architectural boundaries. SDD enforcement ensures agents amplify architect intent, not
replace it.

**Requirements**:
- Agents MUST check for the existence of `specs/<feature>/spec.md` and
  `specs/<feature>/tasks.md` before any implementation
- Agents MUST surface a blocking message if spec is absent:
  "Implementation blocked: No spec found. Run `/sp.specify` to define the feature."
- Agents MUST cite the Task ID (e.g., `[T042]`) in every file they create or modify
- Agents MUST NOT invent APIs, data models, event schemas, or service interfaces not
  specified in plan.md or contracts/
- Agents MUST suggest ADRs for any architectural decision not covered by an existing ADR
- Agents MUST create a PHR after every implementation session
- Agents MUST NOT skip or abbreviate the SDD workflow under time pressure
- Agents MAY ask clarifying questions but MUST NOT assume answers and proceed silently

---

## Phase V Technology Stack

| **Category** | **Technology** | **Purpose** |
|---|---|---|
| **Event Bus** | Apache Kafka | Durable, ordered async messaging |
| **Service Mesh / Runtime** | Dapr | Building blocks: Pub/Sub, State, Secrets, Jobs, Service Invocation |
| **Pub/Sub Abstraction** | Dapr PubSub (Kafka backend) | Decoupled event publishing/consuming |
| **State Store** | Dapr State Store (Neon PostgreSQL) | Shared microservice state |
| **Jobs / Scheduling** | Dapr Jobs API | Reminder triggers and scheduled tasks |
| **Secrets** | Dapr Secrets Store (Kubernetes Secrets) | Runtime secret retrieval |
| **Recurring Service** | Python FastAPI + Dapr SDK | Kafka consumer for recurring/scheduled tasks |
| **Notification Service** | Python FastAPI + Dapr SDK | Kafka consumer for user notifications |
| **Cloud Kubernetes** | OKE / AKS / GKE / DOKS | Production cluster hosting |
| **Ingress** | Nginx Ingress Controller or cloud-native | External traffic routing + TLS |
| **TLS** | cert-manager or cloud certificate service | HTTPS termination |
| **Container Registry** | GHCR / Docker Hub / cloud registry | Image storage for cloud pull |
| **Frontend** | Next.js 16+ + ChatKit (containerized) | Conversational UI |
| **Backend** | FastAPI + OpenAI Agents SDK (containerized) | REST API + AI agent + MCP tools |
| **Database** | Neon PostgreSQL | Persistent data storage |
| **Auth** | Better Auth JWT | Authentication and authorization |
| **Development** | Claude Code | AI-assisted code generation (SDD-compliant) |

---

## Phase V Development & Deployment Workflow

### SDD-Enforced Feature Development Flow

1. **`/sp.specify`** — Define feature requirements, event schemas, Dapr components needed,
   and acceptance criteria
2. **`/sp.plan`** — Design service architecture, topic definitions, Dapr component
   configurations, and Kubernetes manifest changes
3. **`/sp.tasks`** — Generate dependency-ordered tasks with explicit Task IDs
4. **`/sp.implement`** — Implement tasks citing Task IDs in every commit and file header
5. **Validate** — Run event integration tests; verify Dapr sidecar logs; confirm cloud deployment

### Event-Driven Service Development Flow

1. Define event schema in `/specs/<feature>/contracts/events.md`
2. Define Dapr PubSub component in `/dapr/components/pubsub.yaml`
3. Implement producer (backend publishes to `task-events`)
4. Implement consumers (recurring-service, notification-service subscribe)
5. Test idempotency: publish duplicate events; verify no duplicate side effects
6. Deploy to Minikube with Dapr sidecar injection
7. Verify event flow via Dapr Dashboard
8. Deploy to cloud Kubernetes with production Kafka endpoint

### Dapr Integration Flow

1. Install Dapr on cluster: `dapr init --kubernetes`
2. Apply component definitions: `kubectl apply -f /dapr/components/`
3. Annotate deployments with `dapr.io/enabled: "true"` and `dapr.io/app-id: "<service>"`
4. Verify sidecar injection: `kubectl get pods` (should show 2/2 containers per pod)
5. Test Pub/Sub: publish test event via Dapr API; verify consumer receives it
6. Test State Store: write and read state via Dapr API
7. Test Secrets: retrieve secret via Dapr API; verify correct value returned

### Cloud Deployment Flow

1. Build and push images to container registry
2. Create cloud Kubernetes cluster (OKE/AKS/GKE/DOKS)
3. Install Dapr on cloud cluster: `dapr init --kubernetes`
4. Create Kubernetes namespace: `kubectl create namespace todo-prod`
5. Create Kubernetes Secrets for all credentials
6. Apply Dapr component manifests
7. Deploy Kafka (StatefulSet or managed service)
8. Deploy services via Helm with cloud values overrides:
   ```bash
   helm install frontend ./helm/frontend -f values-cloud.yaml -n todo-prod
   helm install backend ./helm/backend -f values-cloud.yaml -n todo-prod
   helm install recurring-service ./helm/recurring-service -f values-cloud.yaml -n todo-prod
   helm install notification-service ./helm/notification-service -f values-cloud.yaml -n todo-prod
   ```
9. Configure Ingress and TLS
10. Verify end-to-end event flow in cloud environment

---

## Phase V Success Criteria

### SDD Enforcement Success Criteria
- [ ] Every implementation task references a speckit.tasks Task ID
- [ ] No implementation work started without approved spec.md + tasks.md
- [ ] Agents surface blocking message when spec is missing
- [ ] All PHRs contain Task ID references
- [ ] All commits reference Task IDs

### Event-Driven Success Criteria
- [ ] Backend publishes to `task-events` on every task CRUD operation
- [ ] Recurring service consumes from `reminders` topic and processes correctly
- [ ] Notification service consumes from `task-events` and `reminders` topics
- [ ] Consumers are idempotent (duplicate event causes no duplicate side effect)
- [ ] Dead-letter handling configured for failed consumer processing
- [ ] Event schemas documented in `/specs/` before implementation

### Dapr Integration Success Criteria
- [ ] All services run with Dapr sidecar injected (2/2 containers per pod)
- [ ] Pub/Sub component deployed and functional (Kafka backend)
- [ ] State Store component deployed and functional (Neon PostgreSQL backend)
- [ ] Secrets Store component deployed; all secrets retrieved via Dapr API
- [ ] Dapr Jobs API scheduling reminder events correctly
- [ ] No hardcoded secrets in any committed file

### Cloud Kubernetes Success Criteria
- [ ] All services deployed to cloud Kubernetes cluster (OKE/AKS/GKE/DOKS)
- [ ] Ingress configured with TLS (HTTPS)
- [ ] HPA configured for backend, recurring-service, notification-service
- [ ] All Phase III chatbot features work on cloud cluster
- [ ] Conversation state persists after pod restart in cloud environment
- [ ] Rolling updates work without downtime

### Secrets Management Success Criteria
- [ ] Zero hardcoded secrets detected by gitleaks scan on PR
- [ ] All secrets sourced from Kubernetes Secrets at runtime
- [ ] `.env` files excluded from git; `.env.example` committed with placeholders
- [ ] Secret rotation possible without image rebuild or redeployment

---

## Phase V Notes

### Development Constraints
- **SDD Mandatory**: All Phase V features MUST start with `/sp.specify`. No exceptions.
- **Dapr-First**: Use Dapr building blocks for all inter-service communication, state, and
  secrets. Direct Kafka client library calls are prohibited.
- **Cloud-Ready Design**: All Helm charts MUST support cloud value overrides from day one.
  Minikube-only configuration is insufficient.
- **Event Schema First**: Define event schemas in `/specs/` before writing producer or
  consumer code.

### New Services in Phase V

**Recurring Service** (`/recurring-service/`):
- FastAPI application with Dapr sidecar
- Subscribes to `reminders` topic
- Processes recurring task logic (reschedule, notify)
- Publishes back to `task-events` after processing

**Notification Service** (`/notification-service/`):
- FastAPI application with Dapr sidecar
- Subscribes to `task-events` and `reminders` topics
- Sends user notifications (email, push, in-app)
- Idempotent processing with deduplication key

### Deployment Prerequisites (Phase V additions)
- **Dapr CLI**: MUST be installed (`dapr --version`)
- **Dapr on Kubernetes**: MUST be initialized (`dapr init --kubernetes`)
- **Kafka**: Running as Kubernetes StatefulSet (local) or managed service (cloud)
- **Container Registry**: Account configured for image push/pull
- **Cloud CLI**: Appropriate cloud CLI installed (oci, az, gcloud, or doctl)

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

### Backend Container (FastAPI + Agents SDK)

**Dockerfile Requirements**:
- **Base Image**: `python:3.13-slim` (official, minimal)
- **Multi-stage Build**:
  - Stage 1: Install dependencies (`uv sync`)
  - Stage 2: Production runtime (copy dependencies, run `uvicorn`)
- **Non-root User**: Create and use `fastapi` user
- **Health Check**: HTTP GET on `/api/health` endpoint
- **Environment Variables**: `DATABASE_URL`, `OPENAI_API_KEY`, `BETTER_AUTH_SECRET`,
  `BETTER_AUTH_URL`, `DAPR_HTTP_ENDPOINT`
- **Exposed Port**: 8000
- **Working Directory**: `/app`

### Recurring Service Container

**Dockerfile Requirements**:
- **Base Image**: `python:3.13-slim`
- **Non-root User**: Create and use `service` user
- **Health Check**: HTTP GET on `/health` endpoint
- **Environment Variables**: Retrieved via Dapr Secrets Store at runtime
- **Exposed Port**: 8001 (app port for Dapr sidecar communication)

### Notification Service Container

**Dockerfile Requirements**:
- **Base Image**: `python:3.13-slim`
- **Non-root User**: Create and use `service` user
- **Health Check**: HTTP GET on `/health` endpoint
- **Environment Variables**: Retrieved via Dapr Secrets Store at runtime
- **Exposed Port**: 8002 (app port for Dapr sidecar communication)

---

## Kubernetes & Helm Specifications

### Helm Chart Structure (All Services)

```
helm/<service>/
├── Chart.yaml               # name, version (semver), description
├── values.yaml              # defaults for Minikube
├── values-cloud.yaml        # cloud overrides (gitignored if containing secrets)
├── templates/
│   ├── deployment.yaml      # Deployment with Dapr annotations
│   ├── service.yaml         # ClusterIP (cloud) or NodePort (local)
│   ├── configmap.yaml       # Non-sensitive config
│   ├── hpa.yaml             # HorizontalPodAutoscaler
│   ├── pdb.yaml             # PodDisruptionBudget
│   └── _helpers.tpl
└── README.md
```

### Dapr Annotations (All Service Deployments)

```yaml
annotations:
  dapr.io/enabled: "true"
  dapr.io/app-id: "<service-name>"
  dapr.io/app-port: "<app-port>"
  dapr.io/log-level: "info"
```

### Secret Management Pattern

```bash
# Create secrets before Helm install
kubectl create secret generic <service>-secrets \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=openai-api-key="$OPENAI_API_KEY" \
  --from-literal=auth-secret="$BETTER_AUTH_SECRET" \
  -n todo-prod
```

---

## Project Structure & Deliverables

### Repository Structure

```
/frontend              # ChatKit-based conversational UI (Next.js + TypeScript)
/backend               # FastAPI + OpenAI Agents SDK + MCP tools (Python)
/recurring-service     # Kafka consumer for recurring tasks (Python + Dapr) [Phase V]
/notification-service  # Kafka consumer for notifications (Python + Dapr) [Phase V]
/specs                 # Specification files (spec.md, plan.md, tasks.md, contracts/)
/dapr                  # Dapr component definitions (pubsub, statestore, secrets) [Phase V]
/helm                  # Helm charts for all services
/k8s                   # Raw Kubernetes manifests (Ingress, NetworkPolicy, etc.)
/history               # Prompt History Records (PHRs) and Architecture Decision Records
/.specify              # Spec-Driven Development templates and configuration
README.md              # Setup, architecture, deployment guide
.env.example           # Placeholder environment variable template (committed)
.gitignore             # MUST include .env, values-cloud.yaml with secrets
```

### Working Chatbot Deliverables

The Phase III implementation MUST deliver a working chatbot with the following capabilities:

**Core Functionality**:
1. **Natural Language Task Management**: Create, read, update, delete tasks through
   conversational input
2. **Conversation Context Persistence**: Store all conversation history in PostgreSQL;
   resume across restarts
3. **Helpful User Experience**: Clear confirmations, graceful error handling, streaming
   responses, typing indicators
4. **Tool-Based Architecture**: All task operations as MCP tools with full observability

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
- **Language**: Python 3.13+
- **State Management**: Database-backed (PostgreSQL via backend API)

### Phase V Microservices Stack
- **Framework**: FastAPI + Dapr Python SDK
- **Event Bus**: Apache Kafka (via Dapr PubSub component)
- **State**: Dapr State Store (Neon PostgreSQL backend)
- **Secrets**: Dapr Secrets Store (Kubernetes Secrets backend)
- **Jobs**: Dapr Jobs API
- **Language**: Python 3.13+

### Communication Protocols
- **Frontend ↔ Backend**: REST API over HTTPS (JSON payloads)
- **Agent ↔ Backend**: MCP tools invoking REST API endpoints
- **Agent ↔ Frontend**: Server-Sent Events (SSE) or WebSocket for streaming responses
- **Microservices ↔ Microservices**: Dapr PubSub (Kafka) for async; Dapr Service Invocation
  for synchronous where required
- **Kubernetes Services**: ClusterIP for internal, Ingress for cloud external access

### Development Tools
- **Package Management**: uv (backend/agent/services), pnpm (frontend)
- **Linting**: ruff (Python), ESLint (TypeScript)
- **Formatting**: ruff format (Python), Prettier (TypeScript)
- **Testing**: pytest (backend/agent), Jest/Vitest (frontend)
- **Type Checking**: mypy (Python), tsc (TypeScript)

### Deployment Tools
- **Containerization**: Docker 20+ with BuildKit
- **Docker AI**: Gordon CLI for AI-assisted Dockerfile generation
- **Orchestration**: Kubernetes 1.28+ (Minikube local, cloud cluster for Phase V)
- **Service Mesh Runtime**: Dapr 1.13+
- **Package Manager**: Helm 3.12+
- **AI DevOps**: kubectl-ai, Kagent
- **Secrets Scan**: gitleaks or truffleHog (CI/CD)
- **Secrets Management**: Kubernetes Secrets + Dapr Secrets Store

---

## Development Workflow

### Spec-Driven Development (SDD) Cycle
1. **`/sp.specify`** — Define feature requirements and acceptance criteria
2. **`/sp.plan`** — Create implementation architecture and technical design
3. **`/sp.tasks`** — Generate actionable, dependency-ordered tasks with Task IDs
4. **`/sp.implement`** — Execute tasks with AI assistance, citing Task IDs
5. **Validate** — Test against spec and iterate

### Version Control
- **Feature branches**: `###-feature-name` format
- **Commits** MUST reference task IDs (e.g., `feat(backend): add task event publisher [T042]`)
- **PRs** MUST include summary, task ID references, and test plan
- **Agent prompts and tool definitions** in version control treated as code

### Quality Gates
- All tests MUST pass before merge
- Linting MUST pass with zero warnings
- Type checking MUST pass (mypy for Python, tsc for TypeScript)
- Security scans MUST run on PRs (gitleaks for secret detection)
- Agent tests SHOULD verify tool selection for key conversational scenarios
- MCP tool schemas MUST validate successfully
- Event integration tests MUST verify correct topic publishing and consumer processing
- Dapr component syntax MUST validate before deployment (`dapr components validate`)

---

## Governance

This constitution supersedes all other development practices for all phases of the
Full-Stack Todo Evolution project.

### Amendment Process
1. Propose change via `/sp.constitution` command with rationale
2. Document impact on existing code and templates
3. Update version according to semantic versioning:
   - **MAJOR**: Principle removal, backward-incompatible redefinition, or paradigm shift
   - **MINOR**: New principle or materially expanded guidance
   - **PATCH**: Clarifications, wording, or non-semantic refinements
4. Update dependent templates and documentation
5. Create Sync Impact Report documenting all changes

### Compliance
- All PRs MUST verify compliance with applicable principles
- Violations MUST be documented with justification in Complexity Tracking section of plan.md
- Architectural decisions SHOULD be recorded via ADR when meeting significance criteria
- Agent prompts, tool definitions, ChatKit configurations, Dapr components, and event schemas
  fall under the same compliance requirements as application code
- **Phase V**: Every implementation artifact MUST cite a speckit.tasks Task ID

### Runtime Guidance
- Use `.specify/` templates for all specification artifacts
- Consult this constitution before making architectural decisions
- When in doubt, ask for clarification rather than assume
- Document significant prompt engineering decisions in ADRs
- Test agent behavior thoroughly before deploying to production
- Monitor tool invocation logs and Dapr sidecar logs for anomalies and errors
- Verify Dapr component health before running integration tests

### Cross-Phase Principles
These principles apply across ALL phases (I, II, III, IV, V):
- **Multi-Tier Isolation** (I) — Extended with deployment artifacts (IV) and new services (V)
- **Persistence First** (II) — Extended with conversation state (III), Dapr State Store (V)
- **Secure by Design** (III) — Extended with agent tool authorization (III), container security
  (IV), Kubernetes/Dapr Secrets (V)
- **Zero Manual Coding** (IV) — Extended with AI artifacts (III), Dockerfiles/Helm (IV),
  Dapr components/event schemas (V)
- **Test-First Discipline** (V) — Extended with agent tests (III), deployment validation (IV),
  event integration tests (V)
- **API Contract Enforcement** (VI) — Extended with MCP tools (III), K8s Services (IV),
  Kafka event schemas (V)

Phase III principles (VII–XIII) are additive and do not override Phase I/II principles.
Phase IV principles (XIV–XVII) are additive and do not override Phase I/II/III principles.
Phase V principles (XVIII–XXIII) are additive and do not override Phase I/II/III/IV principles.

---

**Version**: 2.3.0 | **Ratified**: 2026-01-22 | **Last Amended**: 2026-02-21
