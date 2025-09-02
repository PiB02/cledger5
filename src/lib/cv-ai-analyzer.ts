import OpenAI from 'openai'
import { ParsedDocument } from './cv-parser'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface CVAnalysisResult {
  // Personal Information (will be encrypted)
  personalInfo: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    postalCode?: string
  }
  
  // Professional Summary
  summary: {
    professionalTitle?: string
    yearsExperience?: number
    careerLevel: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'executive'
    objective?: string
  }
  
  // Skills
  skills: {
    technical: Array<{ name: string; level?: string; confidence: number }>
    soft: Array<{ name: string; confidence: number }>
    languages: Array<{ 
      language: string
      level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'native' | 'unknown'
      confidence: number 
    }>
  }
  
  // Education
  education: Array<{
    degree: string
    field: string
    institution: string
    year?: number
    eqfLevel?: number // European Qualifications Framework level 1-8
    confidence: number
  }>
  
  // Experience
  experience: Array<{
    title: string
    company: string
    startDate?: string
    endDate?: string
    duration?: string
    description: string
    responsibilities: string[]
    achievements: string[]
    confidence: number
  }>
  
  // ROME codes (French job classification)
  romeCodes: Array<{
    code: string
    title: string
    confidence: number
  }>
  
  // Analysis metadata
  analysisMetadata: {
    confidence: number // Overall confidence 0-1
    processingTime: number
    tokensUsed: number
    warnings: string[]
    extractedSections: string[]
  }
}

export class CVAIAnalyzer {
  /**
   * Main analysis method using GPT-4o-mini
   */
  public async analyzeCVText(parsedDoc: ParsedDocument): Promise<CVAnalysisResult> {
    const startTime = Date.now()
    
    try {
      const prompt = this.buildAnalysisPrompt(parsedDoc.text)
      
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Tu es un expert en analyse de CV pour le marché français de l'emploi. 
            Tu extrais et structures les informations des CV avec une haute précision.
            Tu dois retourner uniquement un JSON valide sans texte supplémentaire.
            Utilise les codes ROME français quand possible et les niveaux EQF pour l'éducation.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent extraction
        max_tokens: 4000,
        response_format: { type: 'json_object' }
      })
      
      const responseText = response.choices[0].message.content
      if (!responseText) {
        throw new Error('Empty response from OpenAI')
      }
      
      // Parse JSON response
      const analysisResult = JSON.parse(responseText)
      
      // Calculate processing time and add metadata
      const processingTime = Date.now() - startTime
      
      return {
        ...analysisResult,
        analysisMetadata: {
          ...analysisResult.analysisMetadata,
          processingTime,
          tokensUsed: response.usage?.total_tokens || 0
        }
      } as CVAnalysisResult
      
    } catch (error) {
      throw new Error(`CV analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  /**
   * Build the analysis prompt for GPT-4o-mini
   */
  private buildAnalysisPrompt(cvText: string): string {
    return `Analyse ce CV français et extrait les informations structurées suivantes au format JSON :

CV TEXT:
${cvText}

Retourne un JSON avec cette structure exacte :
{
  "personalInfo": {
    "firstName": "string",
    "lastName": "string", 
    "email": "string",
    "phone": "string",
    "address": "string",
    "city": "string",
    "postalCode": "string"
  },
  "summary": {
    "professionalTitle": "string",
    "yearsExperience": "number",
    "careerLevel": "intern|junior|mid|senior|lead|manager|executive",
    "objective": "string"
  },
  "skills": {
    "technical": [{"name": "string", "level": "string", "confidence": "number 0-1"}],
    "soft": [{"name": "string", "confidence": "number 0-1"}],
    "languages": [{"language": "string", "level": "A1|A2|B1|B2|C1|C2|native|unknown", "confidence": "number 0-1"}]
  },
  "education": [
    {
      "degree": "string",
      "field": "string", 
      "institution": "string",
      "year": "number",
      "eqfLevel": "number 1-8",
      "confidence": "number 0-1"
    }
  ],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "startDate": "YYYY-MM format or null",
      "endDate": "YYYY-MM format or null", 
      "duration": "string",
      "description": "string",
      "responsibilities": ["string"],
      "achievements": ["string"],
      "confidence": "number 0-1"
    }
  ],
  "romeCodes": [
    {
      "code": "string (ex: M1805)",
      "title": "string", 
      "confidence": "number 0-1"
    }
  ],
  "analysisMetadata": {
    "confidence": "number 0-1",
    "warnings": ["string"],
    "extractedSections": ["string"]
  }
}

Instructions importantes :
- Utilise uniquement les informations présentes dans le CV
- Assigne un score de confiance (0-1) pour chaque information extraite
- Pour careerLevel, base-toi sur l'expérience : 0-2 ans=junior, 2-5 ans=mid, 5-10 ans=senior, 10+ ans=lead/manager
- Pour les codes ROME, utilise la nomenclature officielle française (ex: M1805 pour développement informatique)
- Pour eqfLevel, utilise l'échelle européenne : Bac=4, Bac+2=5, Bac+3=6, Bac+5=7, Doctorat=8
- Ne retourne que le JSON, pas de texte explicatif`
  }
  
  /**
   * Generate embeddings for the CV using text-embedding-3-small
   */
  public async generateEmbedding(cvText: string, context: 'semantic' | 'skills' = 'semantic'): Promise<number[]> {
    try {
      // Truncate text if too long (max ~8000 tokens for text-embedding-3-small)
      const maxLength = 30000 // Conservative estimate for token limit
      const truncatedText = cvText.length > maxLength 
        ? cvText.substring(0, maxLength) + '...'
        : cvText
        
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: truncatedText,
        dimensions: 1536 // Standard dimension for this model
      })
      
      return response.data[0].embedding
      
    } catch (error) {
      throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Export singleton instance
export const cvAIAnalyzer = new CVAIAnalyzer()