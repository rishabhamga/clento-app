'use client'

import React, { useCallback, useState, useRef } from 'react'
import {
  Box,
  Button,
  Text,
  VStack,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Checkbox,
  HStack,
  Icon,
  Card,
  CardBody,
  Badge,
  Collapse,
  useDisclosure,
} from '@chakra-ui/react'
import { useDropzone } from 'react-dropzone'
import { FiUpload, FiFile, FiCheck, FiX, FiAlertCircle, FiHelpCircle } from 'react-icons/fi'
import type { CSVLeadData, CSVUploadState } from '@/types/csv'
import { CSVFormatGuide } from './CSVFormatGuide'

interface CSVUploadProps {
  onLeadsSelected: (leads: CSVLeadData[]) => void
}

export function CSVUpload({ onLeadsSelected }: CSVUploadProps) {
  const { isOpen, onToggle } = useDisclosure()
  const [state, setState] = useState<CSVUploadState>({
    file: null,
    uploadProgress: 0,
    validationStatus: 'idle',
    validationMessage: '',
    parsedData: [],
    selectedRows: [],
    error: null,
  })

  const validateLeads = async (leads: CSVLeadData[]) => {
    try {
      const response = await fetch('/api/leads/validate-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads }),
      })

      if (!response.ok) throw new Error('Validation request failed')

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Validation error:', error)
      throw error
    }
  }

  const validateAndParseCSV = async (file: File): Promise<CSVLeadData[]> => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      throw new Error('Please upload a CSV file')
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File size must be less than 10MB')
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n').filter(line => line.trim())
          
          if (lines.length < 2) {
            throw new Error('CSV must contain at least a header row and one data row')
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
          
          // Validate required columns
          const requiredFields = ['first_name', 'last_name', 'email']
          const missingFields = requiredFields.filter(field => 
            !headers.some(header => header.includes(field.replace('_', '')))
          )

          if (missingFields.length > 0) {
            throw new Error(`Missing required columns: ${missingFields.join(', ')}`)
          }

          // Parse data rows
          const leads: CSVLeadData[] = []
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
            
            if (values.length !== headers.length) {
              console.warn(`Row ${i + 1} has mismatched columns, skipping`)
              continue
            }

            const lead: any = {}
            headers.forEach((header, index) => {
              lead[header] = values[index] || ''
            })

            leads.push(lead as CSVLeadData)
          }

          if (leads.length === 0) {
            throw new Error('No valid leads found in CSV')
          }

          resolve(leads)
        } catch (error) {
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setState(prev => ({ ...prev, file, validationStatus: 'validating', uploadProgress: 0 }))

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          uploadProgress: Math.min(prev.uploadProgress + 10, 90)
        }))
      }, 100)

      const leads = await validateAndParseCSV(file)

      // Clear progress interval
      clearInterval(progressInterval)

      // Validate the data
      const validationResult = await validateLeads(leads)
      const { leads: validatedLeads, summary } = validationResult

      setState(prev => ({
        ...prev,
        uploadProgress: 100,
        validationStatus: summary.invalid === 0 ? 'success' : 'error',
        validationMessage: `Successfully parsed ${summary.total} leads (${summary.valid} valid, ${summary.invalid} invalid)`,
        parsedData: validatedLeads,
        selectedRows: validatedLeads
          .map((_, i) => i.toString())
          .filter((_, i) => validatedLeads[i].validation_status === 'valid'),
      }))

      console.log(`CSV processed: ${summary.total} leads (${summary.valid} valid, ${summary.invalid} invalid)`)

    } catch (error) {
      setState(prev => ({
        ...prev,
        validationStatus: 'error',
        validationMessage: 'Error processing CSV file',
        error: error instanceof Error ? error.message : 'Unknown error',
      }))

      console.log('CSV upload failed:', error instanceof Error ? error.message : 'Failed to process CSV file')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  })

  const handleRowSelect = (index: string) => {
    const lead = state.parsedData[parseInt(index)]
    if (lead.validation_status === 'invalid') {
      console.log('Cannot select invalid lead:', lead.validation_message)
      return
    }

    setState(prev => ({
      ...prev,
      selectedRows: prev.selectedRows.includes(index)
        ? prev.selectedRows.filter(i => i !== index)
        : [...prev.selectedRows, index]
    }))
  }

  const handleSelectAll = () => {
    const validIndices = state.parsedData
      .map((lead, index) => lead.validation_status === 'valid' ? index.toString() : null)
      .filter((index): index is string => index !== null)

    setState(prev => ({
      ...prev,
      selectedRows: prev.selectedRows.length === validIndices.length ? [] : validIndices
    }))
  }

  const handleConfirmSelection = () => {
    const selectedLeads = state.parsedData.filter((_, index) => 
      state.selectedRows.includes(index.toString())
    )
    onLeadsSelected(selectedLeads)
  }

  return (
    <VStack spacing={6} align="stretch" w="full">
      {/* Format Guide Toggle */}
      <Button
        leftIcon={<Icon as={FiHelpCircle} />}
        variant="ghost"
        colorScheme="purple"
        size="sm"
        onClick={onToggle}
        alignSelf="flex-start"
      >
        {isOpen ? 'Hide CSV Format Guide' : 'Show CSV Format Guide'}
      </Button>

      {/* Format Guide */}
      <Collapse in={isOpen} animateOpacity>
        <Card mb={4}>
          <CardBody>
            <CSVFormatGuide />
          </CardBody>
        </Card>
      </Collapse>

      {/* Upload Area */}
      <Card>
        <CardBody>
          <Box
            {...getRootProps()}
            p={6}
            border="2px dashed"
            borderColor={isDragActive ? 'purple.500' : 'gray.200'}
            borderRadius="md"
            bg={isDragActive ? 'purple.50' : 'white'}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{
              borderColor: 'purple.500',
              bg: 'purple.50'
            }}
          >
            <input {...getInputProps()} />
            <VStack spacing={2}>
              <Icon 
                as={state.file ? FiFile : FiUpload} 
                boxSize={8} 
                color={isDragActive ? 'purple.500' : 'gray.500'} 
              />
              <Text textAlign="center" color="gray.600">
                {isDragActive
                  ? 'Drop your CSV file here'
                  : state.file
                  ? `Selected: ${state.file.name}`
                  : 'Drag & drop your CSV file here, or click to select'}
              </Text>
              <Text fontSize="sm" color="gray.500">
                Required columns: first_name, last_name
              </Text>
            </VStack>
          </Box>
        </CardBody>
      </Card>

      {/* Progress and Validation */}
      {state.uploadProgress > 0 && (
        <Box>
          <Progress 
            value={state.uploadProgress} 
            size="sm" 
            colorScheme={state.validationStatus === 'error' ? 'red' : 'purple'} 
          />
          <HStack mt={2} spacing={2}>
            <Icon 
              as={state.validationStatus === 'success' ? FiCheck : state.validationStatus === 'error' ? FiX : FiAlertCircle}
              color={
                state.validationStatus === 'success' 
                  ? 'green.500' 
                  : state.validationStatus === 'error' 
                  ? 'red.500'
                  : 'orange.500'
              }
            />
            <Text fontSize="sm" color={
              state.validationStatus === 'success' 
                ? 'green.600' 
                : state.validationStatus === 'error' 
                ? 'red.600'
                : 'orange.600'
            }>
              {state.validationMessage}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Data Preview */}
      {state.parsedData.length > 0 && (
        <Card>
          <CardBody p={0}>
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th px={4} py={3}>
                      <Checkbox
                        isChecked={
                          state.selectedRows.length === state.parsedData.filter(l => l.validation_status === 'valid').length
                        }
                        isIndeterminate={
                          state.selectedRows.length > 0 &&
                          state.selectedRows.length < state.parsedData.filter(l => l.validation_status === 'valid').length
                        }
                        onChange={handleSelectAll}
                      />
                    </Th>
                    <Th>Status</Th>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Company</Th>
                    <Th>Title</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {state.parsedData.map((row, index) => (
                    <Tr key={index}>
                      <Td px={4}>
                        <Checkbox
                          isChecked={state.selectedRows.includes(index.toString())}
                          onChange={() => handleRowSelect(index.toString())}
                          isDisabled={row.validation_status === 'invalid'}
                        />
                      </Td>
                      <Td>
                        <Badge
                          colorScheme={row.validation_status === 'valid' ? 'green' : 'red'}
                          variant="subtle"
                        >
                          {row.validation_status}
                        </Badge>
                      </Td>
                      <Td>{`${row.first_name} ${row.last_name}`}</Td>
                      <Td>{row.email || '-'}</Td>
                      <Td>{row.company || '-'}</Td>
                      <Td>{row.title || '-'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </CardBody>
        </Card>
      )}

      {/* Action Buttons */}
      {state.parsedData.length > 0 && (
        <HStack justify="flex-end" spacing={4}>
          <Button
            colorScheme="purple"
            leftIcon={<FiCheck />}
            onClick={handleConfirmSelection}
            isDisabled={state.selectedRows.length === 0}
          >
            Use Selected Leads ({state.selectedRows.length})
          </Button>
        </HStack>
      )}
    </VStack>
  )
}

export default CSVUpload 