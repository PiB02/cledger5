import { AgentType } from '@cledger5/types';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Core agent task processing engine
 * This function takes a task and processes it using the specified agent's expertise
 */
export async function processAgentTask(
  agent: AgentType,
  taskDescription: string,
  context: Record<string, any>,
  conversationId: string
): Promise<Record<string, any>> {
  
  const startTime = Date.now();
  
  try {
    // Build the specialized prompt based on agent capabilities
    const systemPrompt = `${agent.system_prompt}

AGENT CAPABILITIES: ${agent.capabilities.join(', ')}
HIERARCHY LEVEL: ${agent.hierarchy_level}/5
CONVERSATION ID: ${conversationId}

CONTEXT PROVIDED:
${JSON.stringify(context, null, 2)}

INSTRUCTIONS:
1. Analyze the task using your specialized expertise
2. Provide actionable recommendations and solutions
3. If you need help from other agents, explicitly mention which agent to consult
4. Be specific and technical in your response
5. Include code examples or specific implementation details when relevant
6. If the task is outside your expertise, suggest escalation or delegation

RESPONSE FORMAT:
- analysis: Your technical analysis of the issue
- recommendations: Specific actionable steps
- code_examples: Any relevant code (if applicable)
- additional_agents_needed: List any other agents that should be consulted
- escalation_needed: Boolean if this needs project manager attention
- confidence_level: Your confidence in the solution (0.0-1.0)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `TASK: ${taskDescription}

Please analyze this task and provide your expert response.`
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response generated from agent');
    }

    // Try to parse structured response if it's JSON-like
    let structuredResponse: Record<string, any>;
    
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredResponse = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured response from text
        structuredResponse = {
          analysis: response,
          recommendations: "See analysis above",
          confidence_level: 0.7,
          escalation_needed: false
        };
      }
    } catch (parseError) {
      // If JSON parsing fails, structure the text response
      structuredResponse = {
        analysis: response,
        recommendations: "See analysis above",
        confidence_level: 0.7,
        escalation_needed: false,
        raw_response: response
      };
    }

    const executionTime = Date.now() - startTime;
    
    return {
      ...structuredResponse,
      agent_metadata: {
        agent_id: agent.id,
        agent_name: agent.name,
        capabilities_used: agent.capabilities,
        execution_time_ms: executionTime,
        tokens_used: completion.usage?.total_tokens || 0,
        model_used: "gpt-4o-mini"
      }
    };

  } catch (error) {
    console.error(`Agent ${agent.id} processing error:`, error);
    
    return {
      analysis: `Error processing task with ${agent.name}`,
      recommendations: ["Task could not be completed due to technical error"],
      error_details: error instanceof Error ? error.message : 'Unknown error',
      escalation_needed: true,
      confidence_level: 0.0,
      agent_metadata: {
        agent_id: agent.id,
        agent_name: agent.name,
        execution_time_ms: Date.now() - startTime,
        error: true
      }
    };
  }
}

/**
 * Processes inter-agent communication
 * When one agent needs to consult another agent
 */
export async function processInterAgentCommunication(
  fromAgent: AgentType,
  toAgent: AgentType,
  consultationTopic: string,
  sharedContext: Record<string, any>
): Promise<Record<string, any>> {
  
  const systemPrompt = `You are ${toAgent.name} (${toAgent.role}) being consulted by ${fromAgent.name} (${fromAgent.role}).

YOUR CAPABILITIES: ${toAgent.capabilities.join(', ')}
REQUESTING AGENT'S CAPABILITIES: ${fromAgent.capabilities.join(', ')}

The requesting agent needs your expertise on: ${consultationTopic}

SHARED CONTEXT:
${JSON.stringify(sharedContext, null, 2)}

Provide specialized advice within your area of expertise. Be collaborative and specific.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `I need your specialized input on: ${consultationTopic}`
        }
      ],
      max_tokens: 1500,
      temperature: 0.3
    });

    const response = completion.choices[0]?.message?.content || '';

    return {
      consultation_response: response,
      consulting_agent: toAgent.id,
      requesting_agent: fromAgent.id,
      topic: consultationTopic,
      tokens_used: completion.usage?.total_tokens || 0
    };

  } catch (error) {
    return {
      consultation_response: `Unable to provide consultation due to error: ${error}`,
      consulting_agent: toAgent.id,
      requesting_agent: fromAgent.id,
      error: true
    };
  }
}