// Shared in-memory storage for CV processing
// In production, this should be replaced with database storage

export const uploadStorage = new Map<string, any>()
export const processingStorage = new Map<string, any>()