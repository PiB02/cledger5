/**
 * France Travail GPT-4o-mini Client
 * Production-ready implementation with anti-markdown measures and robust error handling
 */

import OpenAI from 'openai'
import type { FTOffer } from '@/lib/france-travail'
import { 
  OPTIMIZED_FT_SYSTEM_PROMPT,
  ANTI_MARKDOWN_INSTRUCTIONS,
  OPTIMAL_GPT_PARAMS,
  compressFTOfferForPrompt,
  preprocessFTOffer
} from './france-travail-prompt-optimizer'
import {
  FranceTravailExtractionSchema,
  validateFrenchExtraction,
  isHighQualityExtraction,
  type FranceTravailExtraction
} from './france-travail-extraction-schema'
import {
  calculateGlobalConfidence,
  calculateSkillConfidence,
  calculateSeniorityConfidence,
  assessExtractionQuality,
  ConfidenceTrendAnalyzer
} from './france-travail-confidence'
import {
  validateFTOfferInput,
  parseGPTResponse,
  handleFrenchMarketEdgeCases,
  generateFallbackExtraction,
  BatchErrorRecovery,
  FTExtractionErrorType,
  type FTExtractionError
} from './france-travail-error-handling'

// Initialize OpenAI client with optimized settings
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000, // 30 second timeout
  maxRetries: 2,   // Limited retries for cost control
})

export interface FTExtractionResult {
  success: boolean
  data?: FranceTravailExtraction
  error?: FTExtractionError
  metadata: {
    tokenUsage: {
      input: number
      output: number
      total: number
    }
    processingTime: number
    costEstimate: number
    retryCount: number
    qualityAssessment: {
      isProduction: boolean
      qualityScore: number
      issues: string[]
      recommendations: string[]
    }
  }
}

export interface BatchExtractionOptions {
  maxRetries: number
  confidenceThreshold: number
  includeLowConfidence: boolean
  useProgressCallback: boolean
  fallbackMode: boolean
}

/**
 * Extracts structured data from France Travail job offer using GPT-4o-mini
 */
export async function extractFromFranceTravailOffer(
  offer: FTOffer,
  options: Partial<BatchExtractionOptions> = {}
): Promise<FTExtractionResult> {
  const startTime = Date.now()
  let retryCount = 0
  const maxRetries = options.maxRetries || 2
  
  // Pre-validation
  const inputErrors = validateFTOfferInput(offer)
  if (inputErrors.some(e => !e.retryable)) {
    const criticalError = inputErrors.find(e => !e.retryable)!
    return {
      success: false,
      error: criticalError,
      metadata: {
        tokenUsage: { input: 0, output: 0, total: 0 },
        processingTime: Date.now() - startTime,
        costEstimate: 0,
        retryCount: 0,
        qualityAssessment: {
          isProduction: false,
          qualityScore: 0,
          issues: ['critical_input_error'],
          recommendations: [criticalError.suggestion || 'Fix input data']
        }
      }
    }
  }

  // Preprocessing with token optimization
  const { compressed, metadata: preprocMeta } = preprocessFTOffer(offer)
  
  while (retryCount <= maxRetries) {
    try {
      // Enhanced user prompt with anti-markdown instructions
      const userPrompt = `${compressed}\n\n${ANTI_MARKDOWN_INSTRUCTIONS}`
      
      console.log(`🔄 Processing FT offer ${offer.id} (attempt ${retryCount + 1}/${maxRetries + 1})`)
      
      // GPT API call with optimized parameters
      const completion = await openai.chat.completions.create({
        ...OPTIMAL_GPT_PARAMS,
        messages: [
          { role: 'system', content: OPTIMIZED_FT_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }, // Force JSON mode
        user: `ft_extraction_${offer.id}` // For tracking
      })

      const usage = completion.usage
      const rawResponse = completion.choices[0]?.message?.content

      if (!rawResponse) {
        throw new Error('No response content from GPT-4o-mini')
      }

      // Parse response with robust error handling
      const parseResult = parseGPTResponse(rawResponse)
      if (!parseResult.success) {
        if (retryCount < maxRetries && parseResult.error?.retryable) {
          retryCount++
          console.log(`⚠️ Parse error, retrying: ${parseResult.error.message}`)
          continue
        }
        
        // Generate fallback if all retries failed
        if (options.fallbackMode) {
          const fallback = generateFallbackExtraction(offer, [parseResult.error])
          const processingTime = Date.now() - startTime
          
          return {
            success: false,
            error: parseResult.error,
            data: fallback as FranceTravailExtraction,
            metadata: {
              tokenUsage: {
                input: usage?.prompt_tokens || preprocMeta.compressedTokens,
                output: usage?.completion_tokens || 0,
                total: usage?.total_tokens || preprocMeta.compressedTokens
              },
              processingTime,
              costEstimate: preprocMeta.estimatedCost,
              retryCount,
              qualityAssessment: {
                isProduction: false,
                qualityScore: 0.3,
                issues: ['fallback_extraction'],
                recommendations: ['Manual review required']
              }
            }
          }
        }
        
        return {
          success: false,
          error: parseResult.error,
          metadata: {
            tokenUsage: {
              input: usage?.prompt_tokens || preprocMeta.compressedTokens,
              output: usage?.completion_tokens || 0,
              total: usage?.total_tokens || preprocMeta.compressedTokens
            },
            processingTime: Date.now() - startTime,
            costEstimate: preprocMeta.estimatedCost,
            retryCount,
            qualityAssessment: {
              isProduction: false,
              qualityScore: 0,
              issues: ['parse_failure'],
              recommendations: ['Check GPT response format']
            }
          }
        }
      }

      // Validate extraction schema
      let extraction: FranceTravailExtraction
      try {
        extraction = validateFrenchExtraction(parseResult.data)
      } catch (schemaError) {
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`⚠️ Schema validation error, retrying: ${schemaError}`)
          continue
        }
        
        return {
          success: false,
          error: {
            type: FTExtractionErrorType.INVALID_SCHEMA,
            message: 'Extracted data does not match expected schema',
            details: schemaError,
            retryable: true,
            suggestion: 'Validate GPT response format against schema'
          },
          metadata: {
            tokenUsage: {
              input: usage?.prompt_tokens || preprocMeta.compressedTokens,
              output: usage?.completion_tokens || 0,
              total: usage?.total_tokens || preprocMeta.compressedTokens
            },
            processingTime: Date.now() - startTime,
            costEstimate: preprocMeta.estimatedCost,
            retryCount,
            qualityAssessment: {
              isProduction: false,
              qualityScore: 0,
              issues: ['schema_validation_failed'],
              recommendations: ['Review extraction schema compatibility']
            }
          }
        }
      }

      // Handle French market edge cases
      const { updatedExtraction, warnings } = handleFrenchMarketEdgeCases(extraction, offer)
      
      if (warnings.length > 0) {
        console.log(`⚠️ French market adjustments applied: ${warnings.join(', ')}`)
      }

      // Quality assessment
      const qualityAssessment = assessExtractionQuality(updatedExtraction)
      
      // Check confidence threshold
      const meetsThreshold = updatedExtraction.confidence_scores.global >= (options.confidenceThreshold || 0.8)
      
      if (!meetsThreshold && !options.includeLowConfidence) {
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`⚠️ Low confidence (${updatedExtraction.confidence_scores.global.toFixed(3)}), retrying`)
          continue
        }
        
        return {
          success: false,
          error: {
            type: FTExtractionErrorType.LOW_CONFIDENCE,
            message: `Confidence ${updatedExtraction.confidence_scores.global.toFixed(3)} below threshold`,
            details: { 
              confidence: updatedExtraction.confidence_scores.global,
              threshold: options.confidenceThreshold || 0.8
            },
            retryable: false,
            suggestion: 'Lower confidence threshold or include low confidence results'
          },
          data: updatedExtraction,
          metadata: {
            tokenUsage: {
              input: usage?.prompt_tokens || 0,
              output: usage?.completion_tokens || 0,
              total: usage?.total_tokens || 0
            },
            processingTime: Date.now() - startTime,
            costEstimate: preprocMeta.estimatedCost,
            retryCount,
            qualityAssessment
          }
        }
      }

      // Success!
      const processingTime = Date.now() - startTime
      console.log(`✅ Successfully processed FT offer ${offer.id} - Confidence: ${updatedExtraction.confidence_scores.global.toFixed(3)}`)
      
      return {
        success: true,
        data: updatedExtraction,
        metadata: {
          tokenUsage: {
            input: usage?.prompt_tokens || 0,
            output: usage?.completion_tokens || 0,
            total: usage?.total_tokens || 0
          },
          processingTime,
          costEstimate: (usage?.total_tokens || 0) * 0.000000175, // Actual GPT-4o-mini cost
          retryCount,
          qualityAssessment
        }
      }

    } catch (apiError: any) {
      console.error(`❌ GPT API error for offer ${offer.id}:`, apiError)
      
      // Handle specific API errors
      if (apiError.code === 'rate_limit_exceeded') {
        return {
          success: false,
          error: {
            type: FTExtractionErrorType.RATE_LIMIT_EXCEEDED,
            message: 'OpenAI rate limit exceeded',
            details: apiError,
            retryable: true,
            suggestion: 'Implement exponential backoff and retry'
          },
          metadata: {
            tokenUsage: { input: 0, output: 0, total: 0 },
            processingTime: Date.now() - startTime,
            costEstimate: 0,
            retryCount,
            qualityAssessment: {
              isProduction: false,
              qualityScore: 0,
              issues: ['api_error'],
              recommendations: ['Implement rate limiting']
            }
          }
        }
      }
      
      if (retryCount < maxRetries) {
        retryCount++
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        continue
      }
      
      return {
        success: false,
        error: {
          type: FTExtractionErrorType.GPT_API_ERROR,
          message: `GPT API error after ${retryCount + 1} attempts: ${apiError.message}`,
          details: apiError,
          retryable: false,
          suggestion: 'Check API key, quota, and service status'
        },
        metadata: {
          tokenUsage: { input: 0, output: 0, total: 0 },
          processingTime: Date.now() - startTime,
          costEstimate: 0,
          retryCount,
          qualityAssessment: {
            isProduction: false,
            qualityScore: 0,
            issues: ['api_failure'],
            recommendations: ['Review API configuration']
          }
        }
      }
    }
  }

  // Should never reach here, but TypeScript requires it
  throw new Error('Unexpected end of extraction function')
}

/**
 * Batch processing for multiple France Travail offers
 */
export class FranceTravailBatchProcessor {
  private confidenceTrends = new ConfidenceTrendAnalyzer()
  private errorRecovery = new BatchErrorRecovery()
  private progressCallback?: (progress: { processed: number, total: number, current: string }) => void
  
  constructor(progressCallback?: (progress: { processed: number, total: number, current: string }) => void) {
    this.progressCallback = progressCallback
  }
  
  async processBatch(
    offers: FTOffer[],
    options: BatchExtractionOptions = {
      maxRetries: 2,
      confidenceThreshold: 0.8,
      includeLowConfidence: false,
      useProgressCallback: true,
      fallbackMode: true
    }
  ): Promise<{
    results: FTExtractionResult[]
    summary: {
      total: number
      successful: number
      failed: number
      lowConfidence: number
      averageConfidence: number
      totalCost: number
      totalTokens: number
      avgProcessingTime: number
      recommendations: string[]
    }
  }> {
    const results: FTExtractionResult[] = []
    let totalCost = 0
    let totalTokens = 0
    let totalProcessingTime = 0
    
    console.log(`🚀 Starting batch processing of ${offers.length} France Travail offers`)
    
    for (let i = 0; i < offers.length; i++) {
      const offer = offers[i]
      
      // Progress reporting
      if (this.progressCallback && options.useProgressCallback) {
        this.progressCallback({
          processed: i,
          total: offers.length,
          current: offer.intitule.substring(0, 50) + '...'
        })
      }
      
      // Check if we should pause due to high error rate
      const errorAction = this.errorRecovery.getRecommendedAction()
      if (errorAction.action === 'pause') {
        console.log(`⏸️ Pausing batch processing: ${errorAction.reason}`)
        break
      }
      
      if (errorAction.action === 'fallback_mode') {
        console.log(`🔄 Switching to fallback mode: ${errorAction.reason}`)
        options.fallbackMode = true
      }
      
      try {
        const result = await extractFromFranceTravailOffer(offer, options)
        results.push(result)
        
        // Track metrics
        totalCost += result.metadata.costEstimate
        totalTokens += result.metadata.tokenUsage.total
        totalProcessingTime += result.metadata.processingTime
        
        if (result.success && result.data) {
          this.confidenceTrends.addResult(result.data.confidence_scores.global)
          this.errorRecovery.recordSuccess()
        } else if (result.error) {
          this.errorRecovery.recordError(result.error)
        }
        
        // Rate limiting: 60 RPM max for GPT-4o-mini
        if (i < offers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1100)) // Just over 1 second
        }
        
      } catch (unexpectedError) {
        console.error(`💥 Unexpected error processing offer ${offer.id}:`, unexpectedError)
        
        results.push({
          success: false,
          error: {
            type: FTExtractionErrorType.GPT_API_ERROR,
            message: `Unexpected error: ${unexpectedError}`,
            retryable: false
          },
          metadata: {
            tokenUsage: { input: 0, output: 0, total: 0 },
            processingTime: 0,
            costEstimate: 0,
            retryCount: 0,
            qualityAssessment: {
              isProduction: false,
              qualityScore: 0,
              issues: ['unexpected_error'],
              recommendations: ['Debug error cause']
            }
          }
        })
        
        this.errorRecovery.recordError({
          type: FTExtractionErrorType.GPT_API_ERROR,
          message: `Unexpected error: ${unexpectedError}`,
          retryable: false
        })
      }
    }
    
    // Final progress update
    if (this.progressCallback && options.useProgressCallback) {
      this.progressCallback({
        processed: results.length,
        total: offers.length,
        current: 'Completed'
      })
    }
    
    // Calculate summary statistics
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const lowConfidence = results.filter(r => 
      r.success && r.data && r.data.confidence_scores.global < options.confidenceThreshold
    ).length
    
    const validConfidences = results
      .filter(r => r.success && r.data)
      .map(r => r.data!.confidence_scores.global)
    
    const averageConfidence = validConfidences.length > 0 
      ? validConfidences.reduce((sum, conf) => sum + conf, 0) / validConfidences.length 
      : 0
    
    const trends = this.confidenceTrends.getStats()
    const errorStats = this.errorRecovery.getStats()
    
    // Generate recommendations
    const recommendations: string[] = []
    if (errorStats.successRate < 0.8) {
      recommendations.push(`Low success rate (${Math.round(errorStats.successRate * 100)}%) - review input quality`)
    }
    if (averageConfidence < options.confidenceThreshold) {
      recommendations.push(`Average confidence (${averageConfidence.toFixed(3)}) below threshold - consider prompt optimization`)
    }
    if (trends && trends.trend === 'declining') {
      recommendations.push('Confidence trending downward - model may be degrading')
    }
    if (totalCost > 10) {
      recommendations.push(`High processing cost ($${totalCost.toFixed(4)}) - optimize token usage`)
    }
    
    console.log(`🎉 Batch processing completed: ${successful}/${results.length} successful`)
    
    return {
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        lowConfidence,
        averageConfidence: Math.round(averageConfidence * 1000) / 1000,
        totalCost: Math.round(totalCost * 10000) / 10000,
        totalTokens,
        avgProcessingTime: Math.round(totalProcessingTime / results.length),
        recommendations
      }
    }
  }
}