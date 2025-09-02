// Using dynamic imports for better Next.js compatibility

export interface ParsedDocument {
  text: string
  metadata: {
    pageCount?: number
    wordCount: number
    charCount: number
    parseTime: number
    mimeType: string
  }
}

export class CVDocumentParser {
  /**
   * Parse a PDF document
   */
  private async parsePDF(buffer: Buffer): Promise<ParsedDocument> {
    const startTime = Date.now()
    
    try {
      const pdf = (await import('pdf-parse')).default
      const data = await pdf(buffer)
      const parseTime = Date.now() - startTime
      
      return {
        text: data.text,
        metadata: {
          pageCount: data.numpages,
          wordCount: data.text.split(/\s+/).filter(word => word.length > 0).length,
          charCount: data.text.length,
          parseTime,
          mimeType: 'application/pdf'
        }
      }
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse a Word document (.docx)
   */
  private async parseWord(buffer: Buffer): Promise<ParsedDocument> {
    const startTime = Date.now()
    
    try {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      const parseTime = Date.now() - startTime
      
      const text = result.value
      
      return {
        text,
        metadata: {
          wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
          charCount: text.length,
          parseTime,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      }
    } catch (error) {
      throw new Error(`Word document parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Parse a legacy Word document (.doc)
   */
  private async parseLegacyWord(buffer: Buffer): Promise<ParsedDocument> {
    const startTime = Date.now()
    
    try {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      const parseTime = Date.now() - startTime
      
      const text = result.value
      
      return {
        text,
        metadata: {
          wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
          charCount: text.length,
          parseTime,
          mimeType: 'application/msword'
        }
      }
    } catch (error) {
      throw new Error(`Legacy Word document parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Main parsing method that routes to appropriate parser based on content type
   */
  public async parseDocument(buffer: Buffer, contentType: string): Promise<ParsedDocument> {
    // Validate input
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid document: empty buffer')
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (buffer.length > maxSize) {
      throw new Error(`File too large: ${buffer.length} bytes (max: ${maxSize} bytes)`)
    }

    // Route to appropriate parser based on content type
    switch (contentType.toLowerCase()) {
      case 'application/pdf':
        return this.parsePDF(buffer)
        
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.template':
        return this.parseWord(buffer)
        
      case 'application/msword':
      case 'application/vnd.ms-word':
        return this.parseLegacyWord(buffer)
        
      default:
        throw new Error(`Unsupported content type: ${contentType}`)
    }
  }

  /**
   * Validate that the document content is reasonable for a CV
   */
  public validateCVContent(parsed: ParsedDocument): { isValid: boolean; issues: string[] } {
    const issues: string[] = []
    
    // Check minimum content
    if (parsed.text.length < 100) {
      issues.push('Document too short (less than 100 characters)')
    }
    
    // Check maximum content
    if (parsed.text.length > 50000) {
      issues.push('Document too long (more than 50,000 characters)')
    }
    
    // Check for reasonable word count
    if (parsed.metadata.wordCount < 20) {
      issues.push('Document has very few words (less than 20)')
    }
    
    if (parsed.metadata.wordCount > 5000) {
      issues.push('Document has too many words (more than 5,000)')
    }
    
    // Basic heuristic checks for CV-like content
    const lowerText = parsed.text.toLowerCase()
    const cvKeywords = [
      'expérience', 'experience', 'formation', 'education', 'compétences', 'skills', 
      'diplôme', 'degree', 'stage', 'internship', 'emploi', 'job', 'poste', 'position',
      'email', 'téléphone', 'phone', 'adresse', 'address'
    ]
    
    const foundKeywords = cvKeywords.filter(keyword => lowerText.includes(keyword))
    
    if (foundKeywords.length < 2) {
      issues.push('Document may not be a CV (missing common CV keywords)')
    }
    
    return {
      isValid: issues.length === 0,
      issues
    }
  }
}

// Export singleton instance
export const cvParser = new CVDocumentParser()