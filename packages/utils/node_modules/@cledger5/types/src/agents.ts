import { z } from 'zod';

// Agent capabilities enum
export const AgentCapability = z.enum([
  // Project Management
  'project_management',
  'task_delegation', 
  'team_coordination',
  'decision_making',
  'conflict_resolution',
  
  // Backend
  'database_design',
  'api_development',
  'supabase',
  'postgresql',
  'performance_optimization',
  'data_modeling',
  
  // Frontend
  'react',
  'nextjs', 
  'tailwind',
  'shadcn_ui',
  'user_experience',
  'responsive_design',
  
  // Recruitment
  'job_matching',
  'rome_codes',
  'france_travail',
  'lba_api',
  'recruitment_processes',
  'candidate_profiling',
  
  // AI/ML
  'openai_integration',
  'embeddings',
  'vector_search',
  'pgvector',
  'prompt_engineering',
  'ai_optimization',
  
  // DevOps
  'vercel_deployment',
  'ci_cd',
  'monitoring',
  'performance',
  'security',
  'infrastructure'
]);

export type AgentCapabilityType = z.infer<typeof AgentCapability>;

// Task types that can be delegated between agents
export const TaskType = z.enum([
  'database_issue',
  'api_bug_fix',
  'performance_optimization',
  'ui_improvement',
  'ai_integration',
  'deployment_issue',
  'security_review',
  'code_review',
  'architecture_design',
  'data_analysis',
  'user_research',
  'testing',
  'documentation',
  'troubleshooting'
]);

export type TaskTypeType = z.infer<typeof TaskType>;

// Conversation status
export const ConversationStatus = z.enum([
  'pending',
  'in_progress', 
  'completed',
  'failed',
  'escalated'
]);

export type ConversationStatusType = z.infer<typeof ConversationStatus>;

// Priority levels (1 = urgent, 5 = low)
export const Priority = z.number().int().min(1).max(5);

// Agent schema
export const Agent = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  capabilities: z.array(AgentCapability),
  system_prompt: z.string(),
  hierarchy_level: z.number().int().min(1).max(5),
  can_invoke: z.array(z.string()),
  created_at: z.union([z.string().datetime(), z.string()]).optional(),
  updated_at: z.union([z.string().datetime(), z.string()]).optional()
});

export type AgentType = z.infer<typeof Agent>;

// Agent conversation schema
export const AgentConversation = z.object({
  id: z.string().uuid(),
  from_agent: z.string(),
  to_agent: z.string(),
  task_type: TaskType,
  task_description: z.string(),
  request_data: z.record(z.any()),
  response_data: z.record(z.any()).optional(),
  status: ConversationStatus,
  priority: Priority,
  created_at: z.string().datetime(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  error_message: z.string().optional()
});

export type AgentConversationType = z.infer<typeof AgentConversation>;

// Request schemas for API routes
export const InvokeAgentRequest = z.object({
  target_agent: z.string(),
  task_type: TaskType,
  task_description: z.string(),
  request_data: z.record(z.any()),
  priority: Priority.optional().default(3)
});

export type InvokeAgentRequestType = z.infer<typeof InvokeAgentRequest>;

export const DelegateTaskRequest = z.object({
  task_description: z.string(),
  context: z.record(z.any()),
  priority: Priority.optional().default(3),
  preferred_agent: z.string().optional()
});

export type DelegateTaskRequestType = z.infer<typeof DelegateTaskRequest>;

// Response schemas
export const AgentResponse = z.object({
  success: z.boolean(),
  data: z.record(z.any()).optional(),
  error: z.string().optional(),
  agent_id: z.string(),
  conversation_id: z.string().uuid(),
  execution_time_ms: z.number().optional()
});

export type AgentResponseType = z.infer<typeof AgentResponse>;

export const CapabilitiesResponse = z.object({
  agents: z.array(Agent),
  total_count: z.number()
});

export type CapabilitiesResponseType = z.infer<typeof CapabilitiesResponse>;

// Utility functions for agent matching
export const getAgentByCapability = (agents: AgentType[], capability: AgentCapabilityType): AgentType | null => {
  return agents.find(agent => agent.capabilities.includes(capability)) || null;
};

export const getAgentsByTaskType = (agents: AgentType[], taskType: TaskTypeType): AgentType[] => {
  const taskCapabilityMap: Record<TaskTypeType, AgentCapabilityType[]> = {
    'database_issue': ['database_design', 'supabase', 'postgresql'],
    'api_bug_fix': ['api_development', 'supabase'],
    'performance_optimization': ['performance_optimization', 'database_design'],
    'ui_improvement': ['react', 'nextjs', 'user_experience'],
    'ai_integration': ['openai_integration', 'embeddings', 'ai_optimization'],
    'deployment_issue': ['vercel_deployment', 'ci_cd', 'infrastructure'],
    'security_review': ['security'],
    'code_review': ['api_development', 'react'],
    'architecture_design': ['database_design', 'user_experience'],
    'data_analysis': ['data_modeling', 'postgresql'],
    'user_research': ['user_experience', 'recruitment_processes'],
    'testing': ['api_development', 'react'],
    'documentation': ['project_management'],
    'troubleshooting': ['database_design', 'api_development', 'supabase']
  };

  const requiredCapabilities = taskCapabilityMap[taskType] || [];
  
  return agents.filter(agent => 
    requiredCapabilities.some(capability => 
      agent.capabilities.includes(capability)
    )
  ).sort((a, b) => b.hierarchy_level - a.hierarchy_level);
};

export const canAgentInvoke = (fromAgent: AgentType, toAgentId: string): boolean => {
  return fromAgent.can_invoke.includes(toAgentId) || fromAgent.hierarchy_level >= 4;
};