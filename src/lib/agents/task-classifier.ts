import { TaskTypeType } from '@cledger5/types';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Classifies a task description into a specific task type using AI
 */
export async function classifyTaskType(
  taskDescription: string,
  context: Record<string, any> = {}
): Promise<TaskTypeType> {
  
  // Simple keyword-based classification first (fast fallback)
  const keywords = taskDescription.toLowerCase();
  
  // Database/Backend keywords
  if (keywords.includes('supabase') || keywords.includes('database') || keywords.includes('sql') || 
      keywords.includes('migration') || keywords.includes('query') || keywords.includes('rls')) {
    return 'database_issue';
  }
  
  // API keywords
  if (keywords.includes('api') || keywords.includes('endpoint') || keywords.includes('route') ||
      keywords.includes('request') || keywords.includes('response')) {
    return 'api_bug_fix';
  }
  
  // Performance keywords
  if (keywords.includes('performance') || keywords.includes('slow') || keywords.includes('optimize') ||
      keywords.includes('speed') || keywords.includes('timeout')) {
    return 'performance_optimization';
  }
  
  // UI keywords
  if (keywords.includes('ui') || keywords.includes('interface') || keywords.includes('component') ||
      keywords.includes('design') || keywords.includes('tailwind') || keywords.includes('react')) {
    return 'ui_improvement';
  }
  
  // AI keywords
  if (keywords.includes('ai') || keywords.includes('openai') || keywords.includes('embedding') ||
      keywords.includes('gpt') || keywords.includes('model') || keywords.includes('prompt')) {
    return 'ai_integration';
  }
  
  // Deployment keywords
  if (keywords.includes('deploy') || keywords.includes('vercel') || keywords.includes('build') ||
      keywords.includes('ci/cd') || keywords.includes('production')) {
    return 'deployment_issue';
  }
  
  // Security keywords
  if (keywords.includes('security') || keywords.includes('auth') || keywords.includes('permission') ||
      keywords.includes('vulnerability') || keywords.includes('attack')) {
    return 'security_review';
  }

  // Try AI classification for more complex cases
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a task classifier for a job matching platform (Cledger). 
          
          Analyze the task description and classify it into one of these categories:
          - database_issue: Database problems, SQL, Supabase issues
          - api_bug_fix: API endpoints, routes, HTTP issues
          - performance_optimization: Speed, optimization, performance issues
          - ui_improvement: Frontend, React, UI/UX issues
          - ai_integration: OpenAI, embeddings, AI/ML related
          - deployment_issue: Vercel, CI/CD, infrastructure
          - security_review: Security, authentication, permissions
          - code_review: Code quality, reviews
          - architecture_design: System design, architecture
          - data_analysis: Data analysis, reporting
          - user_research: User research, UX research
          - testing: Testing, QA
          - documentation: Documentation tasks
          - troubleshooting: General troubleshooting
          
          Return ONLY the category name, nothing else.`
        },
        {
          role: "user",
          content: `Task: ${taskDescription}\n\nContext: ${JSON.stringify(context, null, 2)}`
        }
      ],
      max_tokens: 50,
      temperature: 0.1
    });

    const classification = completion.choices[0]?.message?.content?.trim();
    
    // Validate that the classification is one of our valid types
    const validTypes: TaskTypeType[] = [
      'database_issue', 'api_bug_fix', 'performance_optimization', 'ui_improvement',
      'ai_integration', 'deployment_issue', 'security_review', 'code_review',
      'architecture_design', 'data_analysis', 'user_research', 'testing',
      'documentation', 'troubleshooting'
    ];
    
    if (classification && validTypes.includes(classification as TaskTypeType)) {
      return classification as TaskTypeType;
    }
    
  } catch (error) {
    console.error('AI classification failed, using fallback:', error);
  }
  
  // Ultimate fallback
  return 'troubleshooting';
}