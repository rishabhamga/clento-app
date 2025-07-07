// CSV Upload Types and Interfaces

export interface CSVLeadData {
  // Required fields
  first_name: string
  last_name: string
  email?: string
  company?: string
  title?: string
  
  // Optional fields
  phone?: string
  location?: string
  linkedin_url?: string
  website?: string
  industry?: string
  company_size?: string
  department?: string
  
  // Internal tracking
  source: 'csv_upload'
  upload_date: string
  validation_status: 'valid' | 'invalid' | 'pending'
  validation_message?: string
}

export interface CSVUploadState {
  file: File | null
  uploadProgress: number
  validationStatus: 'idle' | 'validating' | 'success' | 'error'
  validationMessage: string
  parsedData: CSVLeadData[]
  selectedRows: string[] // Array of indices or IDs of selected leads
  error: string | null
}

export interface CSVValidationResult {
  isValid: boolean
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  warnings: Array<{
    row: number
    field: string
    message: string
  }>
  data: CSVLeadData[]
} 