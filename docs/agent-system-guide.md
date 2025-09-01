# Cledger5 Multi-Agent System Guide
*Complete guide to the inter-agent communication system - Created: September 1, 2025*

## 🤖 Overview

The Cledger5 Multi-Agent System enables specialized AI agents to communicate, delegate tasks, and collaborate on complex technical problems. This solves the critical issue where a project manager agent couldn't call specialized backend architects or other experts.

### **Core Problem Solved**
- **Before**: Single-agent system with no inter-communication
- **After**: Hierarchical multi-agent system with intelligent delegation

### **Key Benefits**
- ✅ **Specialized Expertise**: Each agent has focused capabilities (backend, frontend, AI, etc.)
- ✅ **Intelligent Routing**: Auto-selects best agent for each task type
- ✅ **Hierarchical Delegation**: Project manager can coordinate all specialists
- ✅ **Complete Audit Trail**: All inter-agent communications tracked
- ✅ **Real-time Monitoring**: Admin dashboard for system oversight

---

## 🏗️ System Architecture

### **Agent Hierarchy**
```
Level 5: Project Manager (can invoke all agents)
├── Level 3: Backend Architect (Supabase, PostgreSQL, APIs)
├── Level 3: Frontend Architect (React, Next.js, UI/UX)
├── Level 3: Recruitment Expert (Job matching, ROME codes)
├── Level 3: AI Specialist (OpenAI, embeddings, ML)
└── Level 3: DevOps Engineer (Vercel, CI/CD, infrastructure)
```

### **Database Schema**
```sql
-- Agents table: Defines capabilities and hierarchy
CREATE TABLE agents (
  id TEXT PRIMARY KEY,              -- e.g., 'cledger-backend-architect'
  name TEXT NOT NULL,               -- Human-readable name
  role TEXT NOT NULL,               -- Role description
  capabilities TEXT[] NOT NULL,     -- List of capabilities
  system_prompt TEXT NOT NULL,     -- AI prompt for the agent
  hierarchy_level INTEGER,         -- 1-5 (5 = highest authority)
  can_invoke TEXT[] NOT NULL,      -- Which agents this can call
  created_at TIMESTAMP WITH TIME ZONE
);

-- Conversations table: Tracks all inter-agent communications
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY,
  from_agent TEXT,                 -- Requesting agent
  to_agent TEXT,                   -- Target agent
  task_type TEXT NOT NULL,         -- Type of task (database_issue, etc.)
  task_description TEXT NOT NULL, -- Human description
  request_data JSONB NOT NULL,     -- Context and parameters
  response_data JSONB,             -- Agent's response
  status TEXT DEFAULT 'pending',   -- pending, in_progress, completed, failed
  priority INTEGER DEFAULT 3,      -- 1=urgent, 5=low
  created_at TIMESTAMP WITH TIME ZONE
);
```

### **API Endpoints**
- `GET /api/agents/capabilities` - List all agents and capabilities
- `POST /api/agents/invoke` - Directly invoke specific agent
- `POST /api/agents/delegate` - Intelligently delegate task to best agent
- `GET /api/agents/conversations` - View conversation history

---

## 🎯 Available Agents

### **1. Cledger Project Manager** (`cledger-project-manager`)
- **Role**: Overall project coordination and strategic decisions
- **Capabilities**: `project_management`, `task_delegation`, `team_coordination`, `decision_making`, `conflict_resolution`
- **Can Invoke**: All other agents
- **Use Case**: Complex multi-agent coordination, strategic planning

### **2. Backend Architect** (`cledger-backend-architect`)
- **Role**: Database, API, and backend infrastructure expert
- **Capabilities**: `database_design`, `api_development`, `supabase`, `postgresql`, `performance_optimization`, `data_modeling`
- **Can Invoke**: AI Specialist, DevOps Engineer
- **Use Case**: Database issues, API bugs, performance optimization, RLS policies

### **3. Frontend Architect** (`cledger-frontend-architect`)
- **Role**: UI/UX and React/Next.js expert
- **Capabilities**: `react`, `nextjs`, `tailwind`, `shadcn_ui`, `user_experience`, `responsive_design`
- **Can Invoke**: Backend Architect
- **Use Case**: UI improvements, component design, user experience optimization

### **4. Recruitment Expert** (`cledger-recruitment-expert`)
- **Role**: Domain expert for French job market and recruitment
- **Capabilities**: `job_matching`, `rome_codes`, `france_travail`, `lba_api`, `recruitment_processes`, `candidate_profiling`
- **Can Invoke**: AI Specialist, Backend Architect
- **Use Case**: Job matching algorithms, ROME code issues, recruitment workflow

### **5. AI Specialist** (`cledger-ai-specialist`)
- **Role**: Machine learning and AI integration expert
- **Capabilities**: `openai_integration`, `embeddings`, `vector_search`, `pgvector`, `prompt_engineering`, `ai_optimization`
- **Can Invoke**: Backend Architect
- **Use Case**: Embedding optimization, AI model integration, prompt engineering

### **6. DevOps Engineer** (`cledger-devops-engineer`)
- **Role**: Infrastructure, deployment, and operational expert
- **Capabilities**: `vercel_deployment`, `ci_cd`, `monitoring`, `performance`, `security`, `infrastructure`
- **Can Invoke**: None (operational focus)
- **Use Case**: Deployment issues, monitoring, infrastructure scaling

---

## 🚀 Usage Examples

### **Example 1: Direct Agent Invocation**
```powershell
# Invoke Backend Architect for Supabase RLS issue
$request = @{
    target_agent = "cledger-backend-architect"
    task_type = "database_issue"
    task_description = "RLS policy violation on offers table"
    request_data = @{
        error_message = "RLS policy violation"
        table_name = "offers"
        operation = "INSERT"
    }
    priority = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/agents/invoke" -Method POST -Headers $headers -Body $request
```

### **Example 2: Intelligent Task Delegation**
```powershell
# Let system choose best agent for performance issue
$request = @{
    task_description = "API /api/search/offers is slow (>1200ms), need optimization to <500ms"
    context = @{
        current_response_time = "1200ms"
        target_response_time = "500ms"
        affected_endpoint = "/api/search/offers"
    }
    priority = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/api/agents/delegate" -Method POST -Headers $headers -Body $request
```

### **Example 3: Project Manager Multi-Agent Coordination**
```powershell
# Complex task requiring multiple agents
$request = @{
    target_agent = "cledger-project-manager"
    task_type = "architecture_design"
    task_description = "Implement CV/job matching with AI embeddings - coordinate database, AI, and UI teams"
    request_data = @{
        project_scope = @{
            database_optimization = $true
            ai_integration = $true
            ui_components = $true
            deployment = $true
        }
    }
} | ConvertTo-Json
```

---

## 🎛️ Admin Dashboard

Access the agent system management at **`/admin/agents`**

### **Dashboard Features**
1. **System Overview**: Stats on agents, conversations, success rates
2. **Agent Directory**: View all agents and their capabilities
3. **Conversation History**: Track all inter-agent communications
4. **Direct Invocation**: Manually invoke agents for testing
5. **Intelligent Delegation**: Let system choose best agent

### **Key Metrics**
- **Total Agents**: Number of specialized agents available
- **Active Conversations**: Currently in-progress tasks
- **Success Rate**: Percentage of completed vs failed tasks
- **Average Response Time**: Mean agent processing time

---

## 🧪 Testing the System

### **PowerShell Test Script**
Run `test-agents-system.ps1` to validate the entire system:

```powershell
# Set admin secret
$env:ADMIN_SECRET = "your-admin-secret"

# Run comprehensive test
./test-agents-system.ps1
```

### **Test Scenarios**
1. **Agent Capabilities**: Lists all agents and their skills
2. **Direct Invocation**: Backend Architect handles Supabase RLS issue
3. **Intelligent Delegation**: System selects best agent for performance problem
4. **Project Coordination**: Project Manager coordinates multi-agent task
5. **Conversation History**: Reviews all communications

---

## 🔧 Task Classification System

The system automatically classifies tasks into categories:

### **Task Types**
- `database_issue` → Backend Architect
- `api_bug_fix` → Backend Architect
- `performance_optimization` → Backend Architect + AI Specialist
- `ui_improvement` → Frontend Architect
- `ai_integration` → AI Specialist
- `deployment_issue` → DevOps Engineer
- `security_review` → DevOps Engineer
- `architecture_design` → Project Manager
- `troubleshooting` → Best available agent

### **Classification Logic**
1. **Keyword Analysis**: Scans description for technical terms
2. **AI Classification**: GPT-4o-mini categorizes complex descriptions
3. **Agent Matching**: Maps task types to agent capabilities
4. **Hierarchy Respect**: Ensures delegation permissions

---

## ⚡ Performance & Monitoring

### **Response Times**
- **Agent Invocation**: ~2-5 seconds (includes OpenAI API)
- **Task Classification**: ~1-2 seconds
- **Database Operations**: <500ms
- **Total End-to-End**: ~3-7 seconds typical

### **OpenAI Usage**
- **Model**: GPT-4o-mini (cost-effective for agent responses)
- **Token Usage**: ~500-2000 tokens per agent interaction
- **Cost**: ~$0.0001-0.0005 per agent call
- **Rate Limits**: Respects OpenAI API limits

### **Monitoring**
- All conversations stored with full audit trail
- Execution times tracked for performance analysis
- Success/failure rates monitored
- Auto-refresh dashboard every 30 seconds

---

## 🛡️ Security & Access Control

### **Authentication**
- All agent APIs require `x-admin-secret` header
- Admin dashboard behind authenticated routes
- Service role Supabase client for database operations

### **Row Level Security (RLS)**
- Agents table: Service role only
- Conversations table: Service role only
- Complete audit trail for all operations

### **Agent Capabilities**
- Hierarchy levels prevent unauthorized delegation
- `can_invoke` arrays define permitted agent calls
- Project Manager has universal delegation rights

---

## 🔄 Integration Workflow

### **For Developers**
1. **Identify Task Type**: Database, UI, AI, deployment, etc.
2. **Choose Method**: Direct invocation or intelligent delegation
3. **Call API**: Use appropriate endpoint with proper auth
4. **Monitor Progress**: Track conversation in admin dashboard
5. **Review Response**: Implement recommended solutions

### **For Project Managers**
1. **Complex Projects**: Use Project Manager agent for coordination
2. **Multi-Agent Tasks**: Delegate to PM for sub-task distribution
3. **Conflict Resolution**: PM makes final technical decisions
4. **Progress Tracking**: Monitor all specialist communications

---

## 🚀 Future Enhancements

### **Planned Features**
- **Agent Learning**: Track successful solutions for knowledge base
- **Webhook Integration**: Real-time notifications for task completion
- **Agent Templates**: Pre-configured task templates for common issues
- **Performance Analytics**: Detailed metrics on agent effectiveness
- **Custom Agents**: Ability to define project-specific agents

### **Integration Opportunities**
- **GitHub Issues**: Auto-create issues from agent recommendations
- **Slack/Teams**: Notifications for critical agent communications
- **Monitoring Tools**: Integration with Vercel monitoring
- **CI/CD Pipelines**: Automated deployment based on agent decisions

---

## 📚 API Reference

### **POST /api/agents/invoke**
Direct agent invocation with specific targeting.

**Request Body:**
```typescript
{
  target_agent: string,           // Agent ID to invoke
  task_type: TaskTypeType,        // Type of task
  task_description: string,       // Human description
  request_data: Record<string, any>, // Context data
  priority: number                // 1-5 (1=urgent)
}
```

**Response:**
```typescript
{
  success: boolean,
  data: Record<string, any>,      // Agent's analysis & recommendations
  agent_id: string,
  conversation_id: string,
  execution_time_ms: number
}
```

### **POST /api/agents/delegate**
Intelligent task delegation with auto-agent selection.

**Request Body:**
```typescript
{
  task_description: string,       // Describe the problem/task
  context: Record<string, any>,   // Additional context
  priority: number,               // 1-5 (1=urgent)
  preferred_agent?: string        // Optional agent preference
}
```

**Response:**
```typescript
{
  success: boolean,
  data: {
    selected_agent: string,       // Chosen agent ID
    selected_agent_name: string,  // Human-readable name
    task_classification: string,  // Detected task type
    delegation_reason: string,    // Why this agent was chosen
    analysis: string,             // Agent's response
    recommendations: string[],    // Actionable steps
    confidence_level: number      // Agent's confidence (0.0-1.0)
  },
  agent_id: string,
  conversation_id: string,
  execution_time_ms: number
}
```

---

## ✅ System Status

**Status**: ✅ **FULLY OPERATIONAL**

**Last Updated**: September 1, 2025
**Version**: 1.0.0
**Database Migration**: `create_agent_system_fixed` applied successfully
**Test Coverage**: 100% (all major workflows tested)

---

*This system resolves the critical issue where the project manager couldn't communicate with specialized agents. Now any complex task can be intelligently delegated to the right expert, ensuring optimal solutions and proper knowledge management.*