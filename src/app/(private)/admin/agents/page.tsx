import { createSupabaseServer } from '@/lib/supabase/server';
import { AgentsDashboard } from './agents-dashboard';
import { AgentType, AgentConversationType } from '@cledger5/types';

export const metadata = {
  title: 'Agent System Management - Cledger5 Admin',
  description: 'Monitor and manage inter-agent communication system',
};

async function getAgentsData() {
  const supabase = await createSupabaseServer();
  
  // Fetch all agents
  const { data: agents, error: agentsError } = await supabase
    .from('agents')
    .select('*')
    .order('hierarchy_level', { ascending: false })
    .order('name');

  if (agentsError) {
    console.error('Error fetching agents:', agentsError);
    return { agents: [], conversations: [], stats: null };
  }

  // Fetch recent conversations
  const { data: conversations, error: conversationsError } = await supabase
    .from('agent_conversations')
    .select(`
      *,
      from_agent_data:agents!agent_conversations_from_agent_fkey(id, name, role),
      to_agent_data:agents!agent_conversations_to_agent_fkey(id, name, role)
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (conversationsError) {
    console.error('Error fetching conversations:', conversationsError);
  }

  // Calculate stats
  const stats = {
    totalAgents: agents?.length || 0,
    totalConversations: conversations?.length || 0,
    activeConversations: conversations?.filter(c => c.status === 'in_progress').length || 0,
    completedConversations: conversations?.filter(c => c.status === 'completed').length || 0,
    failedConversations: conversations?.filter(c => c.status === 'failed').length || 0,
    averageExecutionTime: 0
  };

  // Calculate average execution time for completed conversations
  const completedConvs = conversations?.filter(c => 
    c.status === 'completed' && 
    c.started_at && 
    c.completed_at
  );

  if (completedConvs && completedConvs.length > 0) {
    const totalTime = completedConvs.reduce((acc, conv) => {
      const start = new Date(conv.started_at!).getTime();
      const end = new Date(conv.completed_at!).getTime();
      return acc + (end - start);
    }, 0);
    stats.averageExecutionTime = Math.round(totalTime / completedConvs.length);
  }

  return {
    agents: agents as AgentType[] || [],
    conversations: conversations as AgentConversationType[] || [],
    stats
  };
}

export default async function AgentsPage() {
  const { agents, conversations, stats } = await getAgentsData();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤖 Agent System Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage the inter-agent communication system
          </p>
        </div>

        <AgentsDashboard 
          agents={agents}
          conversations={conversations}
          stats={stats}
        />
      </div>
    </div>
  );
}