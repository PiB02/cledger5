'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Bot, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Users,
  Activity,
  Send,
  Zap
} from 'lucide-react';
import { AgentType, AgentConversationType, TaskTypeType } from '@cledger5/types';

interface AgentsDashboardProps {
  agents: AgentType[];
  conversations: AgentConversationType[];
  stats: any;
}

const taskTypes: { value: TaskTypeType; label: string }[] = [
  { value: 'database_issue', label: 'Database Issue' },
  { value: 'api_bug_fix', label: 'API Bug Fix' },
  { value: 'performance_optimization', label: 'Performance Optimization' },
  { value: 'ui_improvement', label: 'UI Improvement' },
  { value: 'ai_integration', label: 'AI Integration' },
  { value: 'deployment_issue', label: 'Deployment Issue' },
  { value: 'security_review', label: 'Security Review' },
  { value: 'code_review', label: 'Code Review' },
  { value: 'architecture_design', label: 'Architecture Design' },
  { value: 'troubleshooting', label: 'Troubleshooting' }
];

export function AgentsDashboard({ agents, conversations, stats }: AgentsDashboardProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [taskType, setTaskType] = useState<TaskTypeType>('troubleshooting');
  const [taskDescription, setTaskDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      window.location.reload();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleInvokeAgent = async () => {
    if (!selectedAgent || !taskDescription.trim()) {
      toast.error('Please select an agent and provide a task description');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/agents/invoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || ''
        },
        body: JSON.stringify({
          target_agent: selectedAgent,
          task_type: taskType,
          task_description: taskDescription,
          request_data: {
            invoked_from: 'admin_dashboard',
            timestamp: new Date().toISOString()
          },
          priority: 1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      toast.success(`Agent invoked successfully! Conversation ID: ${result.conversation_id}`);
      setTaskDescription('');
      
      // Refresh the page to show new conversation
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      console.error('Agent invocation error:', error);
      toast.error(`Failed to invoke agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelegateTask = async () => {
    if (!taskDescription.trim()) {
      toast.error('Please provide a task description');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/agents/delegate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.NEXT_PUBLIC_ADMIN_SECRET || ''
        },
        body: JSON.stringify({
          task_description: taskDescription,
          context: {
            delegated_from: 'admin_dashboard',
            timestamp: new Date().toISOString()
          },
          priority: 2
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      toast.success(`Task delegated to ${result.data.selected_agent_name}! Conversation ID: ${result.conversation_id}`);
      setTaskDescription('');
      
      // Refresh the page to show new conversation
      setTimeout(() => window.location.reload(), 1000);
      
    } catch (error) {
      console.error('Task delegation error:', error);
      toast.error(`Failed to delegate task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">Specialized agents available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversations}</div>
            <p className="text-xs text-muted-foreground">Inter-agent communications</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeConversations}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.averageExecutionTime / 1000)}s</div>
            <p className="text-xs text-muted-foreground">Average completion time</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="invoke">Invoke Agent</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current state of the agent system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Completed Tasks</span>
                  <Badge className="bg-green-100 text-green-800">
                    {stats.completedConversations}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Failed Tasks</span>
                  <Badge className="bg-red-100 text-red-800">
                    {stats.failedConversations}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Success Rate</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {stats.totalConversations > 0 
                      ? Math.round((stats.completedConversations / stats.totalConversations) * 100)
                      : 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Agent Hierarchy</CardTitle>
                <CardDescription>Agent levels and delegation capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents.sort((a, b) => b.hierarchy_level - a.hierarchy_level).map((agent) => (
                    <div key={agent.id} className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({agent.role})</span>
                      </div>
                      <Badge variant="outline">
                        Level {agent.hierarchy_level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    {agent.name}
                  </CardTitle>
                  <CardDescription>{agent.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium">Hierarchy Level:</span>
                      <Badge className="ml-2" variant="outline">
                        {agent.hierarchy_level}/5
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Capabilities:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {agent.capabilities.slice(0, 3).map((capability) => (
                          <Badge key={capability} variant="secondary" className="text-xs">
                            {capability.replace('_', ' ')}
                          </Badge>
                        ))}
                        {agent.capabilities.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{agent.capabilities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Can Invoke:</span>
                      <div className="text-xs text-gray-500 mt-1">
                        {agent.can_invoke.length > 0 
                          ? `${agent.can_invoke.length} agents`
                          : 'No delegation permissions'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>Recent Conversations</CardTitle>
              <CardDescription>Latest inter-agent communications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversations.slice(0, 10).map((conversation) => (
                  <div key={conversation.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(conversation.status)}
                        <Badge className={getStatusColor(conversation.status)}>
                          {conversation.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {conversation.from_agent} → {conversation.to_agent}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(conversation.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="mb-2">
                      <Badge variant="outline" className="mr-2">
                        {conversation.task_type.replace('_', ' ')}
                      </Badge>
                      <span className="text-sm">{conversation.task_description}</span>
                    </div>
                    {conversation.completed_at && conversation.started_at && (
                      <div className="text-xs text-gray-500">
                        Execution time: {Math.round(
                          (new Date(conversation.completed_at).getTime() - 
                           new Date(conversation.started_at).getTime()) / 1000
                        )}s
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoke">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Direct Agent Invocation
                </CardTitle>
                <CardDescription>
                  Invoke a specific agent for a targeted task
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Agent</label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an agent..." />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.name} - {agent.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Task Type</label>
                  <Select value={taskType} onValueChange={(value) => setTaskType(value as TaskTypeType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Task Description</label>
                  <Textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Describe the task you want the agent to handle..."
                    className="min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={handleInvokeAgent}
                  disabled={isLoading || !selectedAgent || !taskDescription.trim()}
                  className="w-full"
                >
                  {isLoading ? 'Invoking...' : 'Invoke Agent'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Intelligent Task Delegation
                </CardTitle>
                <CardDescription>
                  Let the system choose the best agent for your task
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Task Description</label>
                  <Textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Describe your task and let AI choose the best agent..."
                    className="min-h-[150px]"
                  />
                </div>

                <Button
                  onClick={handleDelegateTask}
                  disabled={isLoading || !taskDescription.trim()}
                  className="w-full"
                  variant="secondary"
                >
                  {isLoading ? 'Delegating...' : 'Auto-Delegate Task'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}