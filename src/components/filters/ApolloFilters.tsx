'use client'

import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Card,
  CardHeader,
  CardBody,
  Tag,
  TagLabel,
  TagCloseButton,
  FormControl,
  FormLabel,
  CheckboxGroup,
  Checkbox,
  Stack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Badge,
  Wrap,
  WrapItem,
  useColorModeValue,
  Tooltip,
  IconButton,
  Textarea,
} from '@chakra-ui/react'
import { FiPlus, FiInfo } from 'react-icons/fi'
import { 
  type ApolloFilterInput,
  type CompanyFilterInput,
  type SearchType,
  SENIORITY_OPTIONS,
  TIME_IN_ROLE_OPTIONS,
  EXPERIENCE_OPTIONS,
  HEADCOUNT_OPTIONS,
  REVENUE_RANGE_OPTIONS,
  FUNDING_STAGE_OPTIONS,
  COMMON_INDUSTRIES,
  COMMON_JOB_TITLES,
  COMMON_INTENT_TOPICS,
  COMMON_TECHNOLOGIES,
} from '@/types/apollo'

// Base component for adding tags (locations, industries, etc.)
interface TagInputProps {
  label: string
  placeholder: string
  values: string[]
  onAdd: (value: string) => void
  onRemove: (value: string) => void
  suggestions?: string[]
  maxTags?: number
  description?: string
  colorScheme?: string
}

export function TagInput({ 
  label, 
  placeholder, 
  values, 
  onAdd, 
  onRemove, 
  suggestions = [], 
  maxTags,
  description,
  colorScheme = 'blue'
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const filteredSuggestions = suggestions.filter(
    suggestion => 
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !values.includes(suggestion)
  ).slice(0, 10)

  const handleAdd = (value: string) => {
    if (value.trim() && !values.includes(value) && (!maxTags || values.length < maxTags)) {
      onAdd(value.trim())
      setInputValue('')
      setShowSuggestions(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd(inputValue)
    }
  }

  return (
    <FormControl>
      <HStack justify="space-between" align="center">
        <FormLabel fontSize="sm" mb={1}>
          {label}
          {maxTags && (
            <Badge ml={2} colorScheme="gray" fontSize="xs">
              {values.length}/{maxTags}
            </Badge>
          )}
        </FormLabel>
        {description && (
          <Tooltip label={description} fontSize="sm">
            <Box>
              <FiInfo size={12} />
            </Box>
          </Tooltip>
        )}
      </HStack>
      
      <Box position="relative">
        <HStack>
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            isDisabled={maxTags ? values.length >= maxTags : false}
          />
          <IconButton
            aria-label="Add"
            icon={<FiPlus />}
            size="sm"
            onClick={() => handleAdd(inputValue)}
            isDisabled={!inputValue.trim() || (maxTags ? values.length >= maxTags : false)}
          />
        </HStack>

        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            shadow="lg"
            zIndex={10}
            maxH="200px"
            overflowY="auto"
          >
            {filteredSuggestions.map((suggestion) => (
              <Box
                key={suggestion}
                p={2}
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={() => handleAdd(suggestion)}
                fontSize="sm"
              >
                {suggestion}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Selected tags */}
      <Wrap mt={2} spacing={1}>
        {values.map((value) => (
          <WrapItem key={value}>
            <Tag size="sm" colorScheme={colorScheme}>
              <TagLabel>{value}</TagLabel>
              <TagCloseButton onClick={() => onRemove(value)} />
            </Tag>
          </WrapItem>
        ))}
      </Wrap>
    </FormControl>
  )
}

// Multi-select checkbox component
interface MultiSelectProps {
  label: string
  options: Array<{ value: string; label: string }>
  values: string[]
  onChange: (values: string[]) => void
  description?: string
  columns?: number
}

export function MultiSelect({ label, options, values, onChange, description, columns = 1 }: MultiSelectProps) {
  return (
    <FormControl>
      <HStack justify="space-between" align="center" mb={2}>
        <FormLabel fontSize="sm" mb={0}>
          {label}
          {values.length > 0 && (
            <Badge ml={2} colorScheme="purple" fontSize="xs">
              {values.length} selected
            </Badge>
          )}
        </FormLabel>
        {description && (
          <Tooltip label={description} fontSize="sm">
            <Box>
              <FiInfo size={12} />
            </Box>
          </Tooltip>
        )}
      </HStack>
      
      <CheckboxGroup value={values} onChange={onChange}>
        <Stack 
          direction={columns > 1 ? "row" : "column"} 
          spacing={2}
          flexWrap={columns > 1 ? "wrap" : "nowrap"}
        >
          {options.map((option) => (
            <Checkbox 
              key={option.value} 
              value={option.value}
              size="sm"
              flex={columns > 1 ? `0 0 ${100/columns}%` : undefined}
            >
              {option.label}
            </Checkbox>
          ))}
        </Stack>
      </CheckboxGroup>
    </FormControl>
  )
}

// Number range input component
interface NumberRangeProps {
  label: string
  minValue: number
  maxValue: number
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  description?: string
}

export function NumberRange({ 
  label, 
  minValue, 
  maxValue, 
  onMinChange, 
  onMaxChange, 
  min = 0, 
  max = 100, 
  step = 1,
  description 
}: NumberRangeProps) {
  return (
    <FormControl>
      <HStack justify="space-between" align="center" mb={2}>
        <FormLabel fontSize="sm" mb={0}>{label}</FormLabel>
        {description && (
          <Tooltip label={description} fontSize="sm">
            <Box>
              <FiInfo size={12} />
            </Box>
          </Tooltip>
        )}
      </HStack>
      
      <HStack spacing={4}>
        <Box>
          <Text fontSize="xs" color="gray.600" mb={1}>Min</Text>
          <NumberInput
            value={minValue}
            onChange={(_, value) => onMinChange(value)}
            min={min}
            max={maxValue}
            step={step}
            size="sm"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </Box>
        
        <Box>
          <Text fontSize="xs" color="gray.600" mb={1}>Max</Text>
          <NumberInput
            value={maxValue}
            onChange={(_, value) => onMaxChange(value)}
            min={minValue}
            max={max}
            step={step}
            size="sm"
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </Box>
      </HStack>
    </FormControl>
  )
}

// People-specific filter components
interface PeopleFiltersProps {
  filters: any
  onChange: (field: string, value: unknown) => void
}

export function PeopleFilters({ filters, onChange }: PeopleFiltersProps) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <VStack spacing={6} align="stretch">
      {/* Job Titles */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">👤 Job Titles & Roles</Text>
        </CardHeader>
        <CardBody pt={2}>
          <VStack spacing={4} align="stretch">
            <TagInput
              label="Job Titles"
              placeholder="e.g., Software Engineer, Marketing Manager"
              values={filters.jobTitles}
              onAdd={(value) => onChange('jobTitles', [...filters.jobTitles, value])}
              onRemove={(value) => onChange('jobTitles', filters.jobTitles.filter(item => item !== value))}
              suggestions={COMMON_JOB_TITLES}
              maxTags={100}
              description="Include specific job titles you want to target"
              colorScheme="purple"
            />

            <TagInput
              label="Exclude Job Titles"
              placeholder="e.g., Intern, Student"
              values={filters.excludeJobTitles}
              onAdd={(value) => onChange('excludeJobTitles', [...filters.excludeJobTitles, value])}
              onRemove={(value) => onChange('excludeJobTitles', filters.excludeJobTitles.filter(item => item !== value))}
              maxTags={50}
              description="Exclude people with these job titles"
              colorScheme="red"
            />

            <MultiSelect
              label="Seniority Levels"
              options={SENIORITY_OPTIONS}
              values={filters.seniorities}
              onChange={(values) => onChange('seniorities', values)}
              description="Filter by career level and responsibility"
              columns={2}
            />
          </VStack>
        </CardBody>
      </Card>

      {/* Experience & Career */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">💼 Experience & Career</Text>
        </CardHeader>
        <CardBody pt={2}>
          <VStack spacing={4} align="stretch">
            <MultiSelect
              label="Time in Current Role"
              options={TIME_IN_ROLE_OPTIONS}
              values={filters.timeInCurrentRole}
              onChange={(values) => onChange('timeInCurrentRole', values)}
              description="How long they've been in their current position"
            />

            <MultiSelect
              label="Total Years Experience"
              options={EXPERIENCE_OPTIONS}
              values={filters.totalYearsExperience}
              onChange={(values) => onChange('totalYearsExperience', values)}
              description="Total professional experience"
            />
          </VStack>
        </CardBody>
      </Card>

      {/* Location */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">📍 Location</Text>
        </CardHeader>
        <CardBody pt={2}>
          <VStack spacing={4} align="stretch">
            <TagInput
              label="Include Locations"
              placeholder="e.g., San Francisco, New York, London"
              values={filters.locations}
              onAdd={(value) => onChange('locations', [...filters.locations, value])}
              onRemove={(value) => onChange('locations', filters.locations.filter(item => item !== value))}
              maxTags={50}
              description="Target people in these locations"
              colorScheme="blue"
            />

            <TagInput
              label="Exclude Locations"
              placeholder="e.g., Remote, International"
              values={filters.excludeLocations}
              onAdd={(value) => onChange('excludeLocations', [...filters.excludeLocations, value])}
              onRemove={(value) => onChange('excludeLocations', filters.excludeLocations.filter(item => item !== value))}
              maxTags={50}
              description="Exclude people from these locations"
              colorScheme="red"
            />
          </VStack>
        </CardBody>
      </Card>

      {/* Contact Information */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">📧 Contact Information</Text>
        </CardHeader>
        <CardBody pt={2}>
          <FormControl>
            <HStack justify="space-between" align="center">
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium">Require Email Address</Text>
                <Text fontSize="xs" color="gray.600">Only include people with verified email addresses</Text>
              </VStack>
              <Switch
                isChecked={filters.hasEmail === true}
                onChange={(e) => onChange('hasEmail', e.target.checked ? true : null)}
                colorScheme="purple"
              />
            </HStack>
          </FormControl>
        </CardBody>
      </Card>
    </VStack>
  )
}

// Company-specific filter components
interface CompanyFiltersProps {
  filters: any
  onChange: (field: string, value: unknown) => void
}

export function CompanyFilters({ filters, onChange }: CompanyFiltersProps) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <VStack spacing={6} align="stretch">
      {/* Company Basics */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">🏢 Company Details</Text>
        </CardHeader>
        <CardBody pt={2}>
          <VStack spacing={4} align="stretch">
            <TagInput
              label="Company Names"
              placeholder="e.g., Google, Microsoft, Salesforce"
              values={filters.companyNames}
              onAdd={(value) => onChange('companyNames', [...filters.companyNames, value])}
              onRemove={(value) => onChange('companyNames', filters.companyNames.filter(item => item !== value))}
              maxTags={100}
              description="Target specific companies"
              colorScheme="green"
            />

            <TagInput
              label="Exclude Companies"
              placeholder="e.g., Competitors, Existing Clients"
              values={filters.excludeCompanyNames}
              onAdd={(value) => onChange('excludeCompanyNames', [...filters.excludeCompanyNames, value])}
              onRemove={(value) => onChange('excludeCompanyNames', filters.excludeCompanyNames.filter(item => item !== value))}
              maxTags={100}
              description="Exclude these companies"
              colorScheme="red"
            />

            <TagInput
              label="Domains"
              placeholder="e.g., google.com, microsoft.com"
              values={filters.companyDomains}
              onAdd={(value) => onChange('companyDomains', [...filters.companyDomains, value])}
              onRemove={(value) => onChange('companyDomains', filters.companyDomains.filter(item => item !== value))}
              maxTags={50}
              description="Target companies with specific domains"
              colorScheme="blue"
            />
          </VStack>
        </CardBody>
      </Card>

      {/* Company Size & Revenue */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">📊 Company Size & Revenue</Text>
        </CardHeader>
        <CardBody pt={2}>
          <VStack spacing={4} align="stretch">
            <MultiSelect
              label="Company Headcount"
              options={HEADCOUNT_OPTIONS}
              values={filters.headcountRanges}
              onChange={(values) => onChange('headcountRanges', values)}
              description="Filter by number of employees"
              columns={2}
            />

            <MultiSelect
              label="Revenue Range"
              options={REVENUE_RANGE_OPTIONS}
              values={filters.revenueRanges}
              onChange={(values) => onChange('revenueRanges', values)}
              description="Filter by estimated annual revenue"
              columns={2}
            />
          </VStack>
        </CardBody>
      </Card>

      {/* Funding & Growth */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">💰 Funding & Growth</Text>
        </CardHeader>
        <CardBody pt={2}>
          <VStack spacing={4} align="stretch">
            <MultiSelect
              label="Funding Stage"
              options={FUNDING_STAGE_OPTIONS}
              values={filters.fundingStages}
              onChange={(values) => onChange('fundingStages', values)}
              description="Filter by funding stage"
              columns={2}
            />

            <NumberRange
              label="Founded Year Range"
              minValue={filters.foundedYearMin || 1900}
              maxValue={filters.foundedYearMax || new Date().getFullYear()}
              onMinChange={(value) => onChange('foundedYearMin', value)}
              onMaxChange={(value) => onChange('foundedYearMax', value)}
              min={1900}
              max={new Date().getFullYear()}
              description="Filter by when the company was founded"
            />

            <NumberRange
              label="Funding Amount (Million USD)"
              minValue={filters.fundingAmountMin || 0}
              maxValue={filters.fundingAmountMax || 1000}
              onMinChange={(value) => onChange('fundingAmountMin', value)}
              onMaxChange={(value) => onChange('fundingAmountMax', value)}
              min={0}
              max={10000}
              step={1}
              description="Filter by total funding raised"
            />
          </VStack>
        </CardBody>
      </Card>

      {/* Location */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">📍 Location</Text>
        </CardHeader>
        <CardBody pt={2}>
          <VStack spacing={4} align="stretch">
            <TagInput
              label="Include Locations"
              placeholder="e.g., San Francisco, New York, London"
              values={filters.locations}
              onAdd={(value) => onChange('locations', [...filters.locations, value])}
              onRemove={(value) => onChange('locations', filters.locations.filter(item => item !== value))}
              maxTags={50}
              description="Target companies in these locations"
              colorScheme="blue"
            />

            <TagInput
              label="Exclude Locations"
              placeholder="e.g., International, Remote"
              values={filters.excludeLocations}
              onAdd={(value) => onChange('excludeLocations', [...filters.excludeLocations, value])}
              onRemove={(value) => onChange('excludeLocations', filters.excludeLocations.filter(item => item !== value))}
              maxTags={50}
              description="Exclude companies from these locations"
              colorScheme="red"
            />
          </VStack>
        </CardBody>
      </Card>

      {/* Engagement Signals */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">📈 Engagement Signals</Text>
        </CardHeader>
        <CardBody pt={2}>
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium">Has Job Postings</Text>
                <Text fontSize="xs" color="gray.600">Companies actively hiring</Text>
              </VStack>
              <Switch
                isChecked={filters.jobPostings === true}
                onChange={(e) => onChange('jobPostings', e.target.checked ? true : null)}
                colorScheme="purple"
              />
            </HStack>

            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium">Recent News</Text>
                <Text fontSize="xs" color="gray.600">Companies in the news</Text>
              </VStack>
              <Switch
                isChecked={filters.newsEvents === true}
                onChange={(e) => onChange('newsEvents', e.target.checked ? true : null)}
                colorScheme="purple"
              />
            </HStack>

            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Text fontSize="sm" fontWeight="medium">High Web Traffic</Text>
                <Text fontSize="xs" color="gray.600">Companies with significant online presence</Text>
              </VStack>
              <Switch
                isChecked={filters.webTraffic === true}
                onChange={(e) => onChange('webTraffic', e.target.checked ? true : null)}
                colorScheme="purple"
              />
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  )
}

// Common filters (industries, technologies, keywords) that apply to both
interface CommonFiltersProps {
  searchType: SearchType
  filters: any
  onChange: (field: string, value: unknown) => void
}

export function CommonFilters({ searchType, filters, onChange }: CommonFiltersProps) {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <VStack spacing={6} align="stretch">
      {/* Industries */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">🏭 Industries</Text>
        </CardHeader>
        <CardBody pt={2}>
          <TagInput
            label="Target Industries"
            placeholder="e.g., Technology, Healthcare, Finance"
            values={filters.industries}
            onAdd={(value) => onChange('industries', [...filters.industries, value])}
            onRemove={(value) => onChange('industries', filters.industries.filter(item => item !== value))}
            suggestions={COMMON_INDUSTRIES}
            maxTags={25}
            description="Focus on specific industries"
            colorScheme="teal"
          />
        </CardBody>
      </Card>

      {/* Technologies */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">⚙️ Technologies</Text>
        </CardHeader>
        <CardBody pt={2}>
          <TagInput
            label="Technologies Used"
            placeholder="e.g., Salesforce, AWS, React"
            values={filters.technologies}
            onAdd={(value) => onChange('technologies', [...filters.technologies, value])}
            onRemove={(value) => onChange('technologies', filters.technologies.filter(item => item !== value))}
            suggestions={COMMON_TECHNOLOGIES}
            maxTags={20}
            description={searchType === 'people' ? 'Technologies they work with' : 'Technologies the company uses'}
            colorScheme="orange"
          />
        </CardBody>
      </Card>

      {/* Intent Topics */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">🎯 Intent Signals</Text>
        </CardHeader>
        <CardBody pt={2}>
          <TagInput
            label="Intent Topics"
            placeholder="e.g., software buying intent, digital transformation"
            values={filters.intentTopics}
            onAdd={(value) => onChange('intentTopics', [...filters.intentTopics, value])}
            onRemove={(value) => onChange('intentTopics', filters.intentTopics.filter(item => item !== value))}
            suggestions={COMMON_INTENT_TOPICS}
            maxTags={10}
            description="Target based on buying intent and interests"
            colorScheme="pink"
          />
        </CardBody>
      </Card>

      {/* Keywords */}
      <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
        <CardHeader pb={2}>
          <Text fontSize="lg" fontWeight="semibold">🔍 Keywords</Text>
        </CardHeader>
        <CardBody pt={2}>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel fontSize="sm">Additional Keywords</FormLabel>
              <Textarea
                placeholder="Enter keywords or phrases separated by commas..."
                value={filters.keywords.join(', ')}
                onChange={(e) => {
                  const keywords = e.target.value.split(',').map(k => k.trim()).filter(k => k)
                  onChange('keywords', keywords)
                }}
                rows={3}
                resize="vertical"
              />
              <Text fontSize="xs" color="gray.600" mt={1}>
                Separate multiple keywords with commas
              </Text>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  )
}

export default function ApolloFilters() {
  return <Box>Apollo Filters Component</Box>
} 