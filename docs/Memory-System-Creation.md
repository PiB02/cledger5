> > Copy & Paste starts here
KEY PROMPT:
[ … Below you’ll find a simple instruction on how to build a simple memory. So you know, you are an Ai builder helping me build my project. But in your words “I can only see the conversation history that's available in our current session, but I don't retain information between different conversations or sessions. This makes it really difficult to maintain context about the complex architecture of any project, that we've been building together over time.” So we need to build you a memory. This build cannot modify anything that has been done, no UX or UI necessary. And you will build all necessary files system as per below … ]

The Memory System Architecture
1. Documentation Structure
Create a docs/ folder if it does not exists and add four core memory files:

docs/
├── memory.md            # Main overview & AI instructions
├── architecture.md      # Technical deep-dive
├── development-notes.md # Running context & status
└── troubleshooting.md   # Common issues & solutions
2. AI Self-Instruction System
The key innovation is placing AI instructions at the top of memory.md that trigger when you say "Look in memory.md" or you are appointed to look at the memory.md file. This creates a standardized protocol:

## 🤖 AI INSTRUCTIONS - READ THIS FIRST
**Trigger Command**: When user says "Look in memory.md", follow this protocol:

### Step 1: Memory Context Loading
1. Read `docs/memory.md` (this file)
2. Read `docs/architecture.md` for technical details
3. Read `docs/development-notes.md` for current context
4. Read `docs/troubleshooting.md` if dealing with issues

### Step 2: Code Context Review
1. Use search tools to find relevant components/functions
2. Examine key files based on user's request
3. Check database schema if needed in 01-DB-Architecture.md
4. Check console logs for debugging
5. if still question read the relevant docs : 
- PRD: `00-cledger5-PRD.md`
- DB: `01-DB-Architecture.md`, `02-DB-SQL-Queries.md`
- Intégrations: `03-FT-Integration.md`, `04-LBA-Integration.md`
- Règles dev: `05-Cursor-Dev-Rules.md`
- Config env: `06-Env-Config.md`
- Contrats API internes: `07-API-Contracts.md`
- SSE: `08-SSE-Protocols.md`
- Runbooks: `09-Runbooks.md`
- MCP: `10-MCP-Config.md`
- Tests: `11-Testing-Strategy.md`
- Emails: `12-Email-Templates.md`
- Prompting: `13-Prompting-Guidelines.md`

### Step 3: Analysis & Response
1. Understand the full context before proposing solutions
2. Consider architecture, existing patterns, and constraints
3. Propose minimal, focused changes that align with current design
4. Follow established design principles
5. Check for best practices via Context7 MCP server

### Step 4: Memory Updates
After implementing changes, update relevant memory docs:
- Update "Recent Development Context" 
- Add new issues to troubleshooting.md
- Update development-notes.md with progress/status
- Maintain accuracy of feature status and known issues
File Templates
Please follow the structure of the templates, do not make any assumptions, review all implemented in the project, functions databases, schema, UI and UX intent, components, and tools all before proceeding.

memory.md Template
# cledger5 Memory System
*Last Updated: 26/08/2025*

## 🤖 AI INSTRUCTIONS - READ THIS FIRST
[Include the AI instructions from above]

---

## What is cledger5?
[Brief project description and core purpose]

## Core Architecture
### Frontend Structure
[Route structure and key pages]

### User Flow
[Main user journeys through the app]

### Key Features Status
- ✅ [Completed features]
- 🚧 [In progress features]  
- ❌ [Planned features]

## Database Schema Overview
**Key Tables:**
[List main database tables and their purposes]

## Integration Points
[External services, APIs, payment systems, etc.]

## Recent Development Context
### [Recent Major Work]
- **Issue**: [What problem was solved]
- **Solution**: [How it was solved]
- **Architecture**: [Technical approach taken]

### Current Architecture Patterns
[Established patterns for auth, data fetching, styling, etc.]

### Active Development Areas
[What's currently being worked on]

## Design System
[UI/UX patterns, color schemes, component libraries]

## Business Logic
[Key business rules, user roles, revenue streams]

## Known Issues & Monitoring
[Current problems being tracked]
architecture.md Template
# [Project Name] Technical Architecture

## Frontend Architecture
- **Tech Stack**: [List technologies]
- **Route Structure**: [Detailed route breakdown]
- **Component Architecture**: [How components are organized]
- **State Management**: [How state is handled]

## Backend Architecture
- **Functions/Endpoints**: [List all backend functions]
- **Database Schema**: [Detailed table structures]
- **Integration Architecture**: [How external services connect]

## Authentication & Security
[Auth flows, permissions, security measures]

## Performance Considerations
[Optimization strategies, caching, etc.]

## Monitoring & Debugging
[How to debug issues, logging strategies]
development-notes.md Template
# [Project Name] Development Progress

## Recently Completed Features
[What was just finished]

## High Priority Tasks
[What needs to be done next]

## Medium Priority Tasks
[Future planned work]

## Known Issues
[Current bugs and problems]

## Technical Debt
[Areas that need refactoring]

## Next Sprint Priorities
[Immediate focus areas]

## Development Patterns
[Coding standards and conventions]

## Environment Setup
[Required environment variables, setup commands]

## Testing Strategy
[How to test features, integration points]
troubleshooting.md Template
# [Project Name] Troubleshooting Guide

## Authentication Issues
[Common auth problems and solutions]

## [Feature Category] Issues
[Problems specific to major features]

## Database Issues
[SQL, query, and data problems]

## Performance Issues
[Speed and optimization problems]

## General Debugging Tools
[How to debug frontend, backend, database]

## Development Environment
[Local setup issues and solutions]
Implementation Protocol
Please follow this implementation protocol, do not make any assumptions, base your output on reviewed and validated data form prior steps.

Step 1: Create the Structure
Create docs/ folder in project root

Create all four memory files using the templates above

Fill in project-specific information

Step 2: Establish the Trigger
Train yourself and team members to start requests with:
"Look in memory.md" + [your actual request]

Step 3: Maintain the Memory
After each significant change or solution:

Update relevant sections in memory files

Add new issues to troubleshooting.md

Update feature status and development notes

Keep architecture.md current with system changes

Step 4: Use Consistently
Every time you work with AI on the project:

Start with "Look in memory.md"

Let AI read all context first

AI proposes solution based on full understanding

Update memory after implementation

> > Copy & Paste Ends here (invoque only in Chat mode!)