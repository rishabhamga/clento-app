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
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
  Select,
  Button,
} from '@chakra-ui/react'
import { FiPlus, FiInfo, FiSave, FiX } from 'react-icons/fi'
import { TechnologySelect } from './TechnologySelect'
import { 
  type ExplorimFilters,
  type FilterOption,
  type ICPFilterProfile,
  COMPANY_SIZE_OPTIONS,
  ANNUAL_REVENUE_OPTIONS,
  JOB_LEVEL_OPTIONS,
  ALL_COUNTRIES,
  CITIES_BY_COUNTRY,
} from '@/types/explorium'

// Location Filter Component with cascading dropdowns
interface LocationFilterProps {
  selectedCountries: string[]
  selectedCities: string[]
  onCountriesChange: (countries: string[]) => void
  onCitiesChange: (cities: string[]) => void
  label?: string
  description?: string
}

export function LocationFilter({ 
  selectedCountries, 
  selectedCities, 
  onCountriesChange, 
  onCitiesChange,
  label = "Location",
  description = "Select countries and cities"
}: LocationFilterProps) {
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  
  // Get available cities based on selected countries
  const availableCities = selectedCountries.length > 0 
    ? selectedCountries.flatMap(countryCode => 
        CITIES_BY_COUNTRY[countryCode] || []
      )
    : []

  const handleCountrySelect = (countryCode: string) => {
    if (!selectedCountries.includes(countryCode)) {
      onCountriesChange([...selectedCountries, countryCode])
    }
    setShowCountryDropdown(false)
  }

  const handleCitySelect = (cityValue: string) => {
    if (!selectedCities.includes(cityValue)) {
      onCitiesChange([...selectedCities, cityValue])
    }
    setShowCityDropdown(false)
  }

  const removeCountry = (countryCode: string) => {
    const newCountries = selectedCountries.filter(c => c !== countryCode)
    onCountriesChange(newCountries)
    
    // Remove cities from removed countries
    const remainingCities = selectedCities.filter(city => {
      const cityCountry = city.split(', ')[2]?.toLowerCase()
      return newCountries.some(country => cityCountry === country)
    })
    onCitiesChange(remainingCities)
  }

  const removeCity = (cityValue: string) => {
    onCitiesChange(selectedCities.filter(c => c !== cityValue))
  }

  const getCountryLabel = (countryCode: string) => {
    return ALL_COUNTRIES.find(c => c.value === countryCode)?.label || countryCode
  }

  const getCityLabel = (cityValue: string) => {
    const parts = cityValue.split(', ')
    return parts.length >= 2 ? `${parts[0]}, ${parts[1]}` : cityValue
  }

  return (
    <FormControl>
      <FormLabel>
        <HStack>
          <Text fontWeight="medium">{label}</Text>
          {description && (
            <Tooltip label={description} hasArrow>
              <Box cursor="help">
                <FiInfo size={14} />
              </Box>
            </Tooltip>
          )}
        </HStack>
      </FormLabel>
      
      <VStack spacing={3} align="stretch">
        {/* Countries Section */}
        <Box>
          <Text fontSize="sm" color="gray.600" mb={2}>Countries</Text>
          
          {/* Selected Countries */}
          {selectedCountries.length > 0 && (
            <Wrap spacing={2} mb={2}>
              {selectedCountries.map(countryCode => (
                <WrapItem key={countryCode}>
                  <Tag size="md" colorScheme="green">
                    <TagLabel>{getCountryLabel(countryCode)}</TagLabel>
                    <TagCloseButton onClick={() => removeCountry(countryCode)} />
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          )}
          
          {/* Country Dropdown */}
          <Box position="relative">
            <Select
              placeholder="Select countries..."
              onChange={(e) => e.target.value && handleCountrySelect(e.target.value)}
              value=""
            >
              {ALL_COUNTRIES
                .filter(country => !selectedCountries.includes(country.value))
                .map(country => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
            </Select>
          </Box>
        </Box>

        {/* Cities Section */}
        <Box>
          <Text fontSize="sm" color="gray.600" mb={2}>
            Cities
            {selectedCountries.length === 0 && (
              <Text as="span" fontSize="xs" color="gray.400" ml={2}>
                (Select countries first)
              </Text>
            )}
          </Text>
          
          {/* Selected Cities */}
          {selectedCities.length > 0 && (
            <Wrap spacing={2} mb={2}>
              {selectedCities.map(cityValue => (
                <WrapItem key={cityValue}>
                  <Tag size="md" colorScheme="blue">
                    <TagLabel>{getCityLabel(cityValue)}</TagLabel>
                    <TagCloseButton onClick={() => removeCity(cityValue)} />
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          )}
          
          {/* City Dropdown */}
          <Select
            placeholder={selectedCountries.length > 0 ? "Select cities..." : "Select countries first"}
            disabled={selectedCountries.length === 0}
            onChange={(e) => e.target.value && handleCitySelect(e.target.value)}
            value=""
          >
            {availableCities
              .filter(city => !selectedCities.includes(city.value))
              .map(city => (
                <option key={city.value} value={city.value}>
                  {city.label}
                </option>
              ))}
          </Select>
        </Box>
      </VStack>
    </FormControl>
  )
}

// Base component for adding tags (locations, industries, etc.)
interface TagInputProps {
  label: string
  placeholder: string
  values: string[]
  onAdd: (value: string) => void
  onRemove: (value: string) => void
  suggestions?: FilterOption[]
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
      suggestion.label.toLowerCase().includes(inputValue.toLowerCase()) &&
      !values.includes(suggestion.value)
  ).slice(0, 10)

  const handleAdd = (value: string, label?: string) => {
    if (value.trim() && !values.includes(value) && (!maxTags || values.length < maxTags)) {
      onAdd(value.trim())
      setInputValue('')
      setShowSuggestions(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      handleAdd(inputValue)
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <FormControl>
      <FormLabel>
        <HStack>
          <Text fontWeight="medium">{label}</Text>
          {description && (
            <Tooltip label={description} hasArrow>
              <Box cursor="help">
                <FiInfo size={14} />
              </Box>
            </Tooltip>
          )}
          {maxTags && (
            <Badge size="sm" colorScheme="gray">
              {values.length}/{maxTags}
            </Badge>
          )}
        </HStack>
      </FormLabel>
      
      {/* Selected Tags */}
      {values.length > 0 && (
        <Wrap spacing={2} mb={2}>
          {values.map(value => (
            <WrapItem key={value}>
              <Tag size="md" colorScheme={colorScheme}>
                <TagLabel>{value}</TagLabel>
                <TagCloseButton onClick={() => onRemove(value)} />
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      )}
      
      {/* Input with suggestions */}
      <Box position="relative">
        <Input
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowSuggestions(e.target.value.length > 0)
          }}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestions(inputValue.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          isDisabled={maxTags ? values.length >= maxTags : false}
        />
        
        {/* Add button */}
        {inputValue.trim() && (
          <IconButton
            aria-label="Add"
            icon={<FiPlus />}
            size="sm"
            position="absolute"
            right={2}
            top="50%"
            transform="translateY(-50%)"
            onClick={() => handleAdd(inputValue)}
            colorScheme={colorScheme}
          />
        )}
        
        {/* Suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <Box
            position="absolute"
            top="100%"
            left={0}
            right={0}
            zIndex={10}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            shadow="lg"
            maxH="200px"
            overflowY="auto"
          >
            {filteredSuggestions.map(suggestion => (
              <Box
                key={suggestion.value}
                p={3}
                cursor="pointer"
                _hover={{ bg: 'gray.50' }}
                onClick={() => handleAdd(suggestion.value, suggestion.label)}
              >
                <Text fontSize="sm">{suggestion.label}</Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </FormControl>
  )
}

// Multi-select component for predefined options
interface MultiSelectProps {
  label: string
  options: FilterOption[]
  values: string[]
  onChange: (values: string[]) => void
  description?: string
  columns?: number
}

export function MultiSelect({ 
  label, 
  options, 
  values, 
  onChange, 
  description, 
  columns = 1 
}: MultiSelectProps) {
  const handleChange = (selectedValues: string[]) => {
    onChange(selectedValues)
  }

  return (
    <FormControl>
      <HStack justify="space-between" align="flex-end">
        <FormLabel mb={2} fontSize="sm" fontWeight="semibold">
          {label}
        </FormLabel>
        {description && (
          <Tooltip label={description} fontSize="sm">
            <IconButton
              icon={<FiInfo />}
              size="xs"
              variant="ghost"
              aria-label={`Info about ${label}`}
            />
          </Tooltip>
        )}
      </HStack>
      
      <CheckboxGroup value={values} onChange={handleChange}>
        <Stack direction="column" spacing={2}>
          {options.map((option) => (
            <Checkbox key={option.value} value={option.value} size="sm">
              <Text fontSize="sm">{option.label}</Text>
            </Checkbox>
          ))}
        </Stack>
      </CheckboxGroup>

      {values.length > 0 && (
        <Box mt={2}>
          <Text fontSize="xs" color="gray.600" mb={1}>Selected:</Text>
          <Wrap spacing={1}>
            {values.map((value) => {
              const option = options.find(o => o.value === value)
              return (
                <WrapItem key={value}>
                  <Badge size="sm" colorScheme="purple">
                    {option?.label || value}
                  </Badge>
                </WrapItem>
              )
            })}
          </Wrap>
        </Box>
      )}
    </FormControl>
  )
}

// Number range component for experience filters
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
  suffix?: string
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
  description,
  suffix = ""
}: NumberRangeProps) {
  return (
    <FormControl>
      <HStack justify="space-between" align="flex-end">
        <FormLabel mb={2} fontSize="sm" fontWeight="semibold">
          {label}
        </FormLabel>
        {description && (
          <Tooltip label={description} fontSize="sm">
            <IconButton
              icon={<FiInfo />}
              size="xs"
              variant="ghost"
              aria-label={`Info about ${label}`}
            />
          </Tooltip>
        )}
      </HStack>
      
      <HStack spacing={4}>
        <Box flex={1}>
          <Text fontSize="xs" color="gray.600" mb={1}>Minimum</Text>
          <NumberInput
            value={minValue}
            onChange={(_, num) => !isNaN(num) && onMinChange(num)}
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
        
        <Box flex={1}>
          <Text fontSize="xs" color="gray.600" mb={1}>Maximum</Text>
          <NumberInput
            value={maxValue}
            onChange={(_, num) => !isNaN(num) && onMaxChange(num)}
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
      
      {suffix && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          Range: {minValue} - {maxValue} {suffix}
        </Text>
      )}
    </FormControl>
  )
}

// Main Prospect Filters Component
interface ProspectFiltersProps {
  filters: ExplorimFilters
  onChange: (field: keyof ExplorimFilters, value: any) => void
}

export function ProspectFilters({ filters, onChange }: ProspectFiltersProps) {
  const cardBg = useColorModeValue('white', 'gray.800')
  
  return (
    <Accordion allowMultiple defaultIndex={[0]}>
      <AccordionItem>
        <AccordionButton>
          <Box flex="1" textAlign="left">
            <Text fontWeight="semibold" color="purple.600">👤 Prospect Filters</Text>
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel pb={4}>
          <VStack spacing={4} align="stretch">
            {/* Job Information */}
            <TagInput
              label="Job Titles"
              placeholder="e.g. CEO, CTO, Head of Engineering"
              values={filters.job_title || []}
              onAdd={(value) => onChange('job_title', [...(filters.job_title || []), value])}
              onRemove={(value) => onChange('job_title', (filters.job_title || []).filter(v => v !== value))}
              description="Keywords in job titles (substring matching)"
              colorScheme="blue"
            />

            <MultiSelect
              label="Job Levels (Seniority)"
              options={JOB_LEVEL_OPTIONS}
              values={filters.job_level || []}
              onChange={(values) => onChange('job_level', values)}
              description="Filter by seniority category"
            />

            <LocationFilter
              label="Person Location"
              description="Filter by where people live (cities, states, countries)"
              selectedCountries={filters.person_locations?.filter(loc => 
                ALL_COUNTRIES.some(country => country.value === loc)
              ) || []}
              selectedCities={filters.person_locations?.filter(loc => 
                !ALL_COUNTRIES.some(country => country.value === loc)
              ) || []}
              onCountriesChange={(countries) => {
                const cities = filters.person_locations?.filter(loc => 
                  !ALL_COUNTRIES.some(country => country.value === loc)
                ) || []
                onChange('person_locations', [...countries, ...cities])
              }}
              onCitiesChange={(cities) => {
                const countries = filters.person_locations?.filter(loc => 
                  ALL_COUNTRIES.some(country => country.value === loc)
                ) || []
                onChange('person_locations', [...countries, ...cities])
              }}
            />








          </VStack>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

// Company Filters Component  
interface CompanyFiltersProps {
  filters: ExplorimFilters
  onChange: (field: keyof ExplorimFilters, value: any) => void
  isProspectSearch?: boolean
}

export function CompanyFilters({ filters, onChange, isProspectSearch = true }: CompanyFiltersProps) {
  const fieldPrefix = isProspectSearch ? 'company_' : ''
  
  const getFieldName = (field: string) => {
    return `${fieldPrefix}${field}` as keyof ExplorimFilters
  }

  const getFieldValue = (field: string) => {
    return filters[getFieldName(field)]
  }

  const getStringArrayValue = (field: string): string[] => {
    const value = getFieldValue(field)
    return Array.isArray(value) ? value : []
  }

  const setFieldValue = (field: string, value: any) => {
    onChange(getFieldName(field), value)
  }

  return (
    <Accordion allowMultiple defaultIndex={[0]}>
      <AccordionItem>
        <AccordionButton>
          <Box flex="1" textAlign="left">
            <Text fontWeight="semibold" color="purple.600">🏢 Company Filters</Text>
          </Box>
          <AccordionIcon />
        </AccordionButton>
        <AccordionPanel pb={4}>
          <VStack spacing={4} align="stretch">
            {/* Location */}
            <LocationFilter
              selectedCountries={getStringArrayValue('country_code')}
              selectedCities={getStringArrayValue('city_region_country')}
              onCountriesChange={(countries) => setFieldValue('country_code', countries)}
              onCitiesChange={(cities) => setFieldValue('city_region_country', cities)}
              label="Location"
              description="Filter by company headquarters country and city"
            />

            {/* Company Size & Financials */}
            <MultiSelect
              label="Company Size (Employees)"
              options={COMPANY_SIZE_OPTIONS}
              values={getStringArrayValue('size')}
              onChange={(values) => setFieldValue('size', values)}
              description="Number of employees"
            />

            <MultiSelect
              label="Annual Revenue"
              options={ANNUAL_REVENUE_OPTIONS}
              values={getStringArrayValue('annual_revenue')}
              onChange={(values) => setFieldValue('annual_revenue', values)}
              description="Company annual revenue range"
            />

            {/* Technologies */}
            <TechnologySelect
              label="Technologies Used (UIDs)"
              values={getStringArrayValue('currently_using_any_of_technology_uids')}
              onChange={(values) => setFieldValue('currently_using_any_of_technology_uids', values)}
              description="Find companies currently using any of the selected technologies"
              maxTags={20}
              colorScheme="orange"
            />

            <TechnologySelect
              label="Exclude Technologies (UIDs)"
              values={getStringArrayValue('currently_not_using_any_of_technology_uids')}
              onChange={(values) => setFieldValue('currently_not_using_any_of_technology_uids', values)}
              description="Exclude companies using any of the selected technologies"
              maxTags={20}
              colorScheme="red"
            />

            {/* Organization Job Details */}
            <Text fontWeight="semibold" color="purple.600">💼 Organization Job Details</Text>

            <TagInput
              label="Organization Job Titles"
              placeholder="e.g., sales manager, research analyst"
              values={getStringArrayValue('organization_job_titles')}
              onAdd={(val) => setFieldValue('organization_job_titles', [...getStringArrayValue('organization_job_titles'), val])}
              onRemove={(val) => setFieldValue('organization_job_titles', getStringArrayValue('organization_job_titles').filter(item => item !== val))}
              maxTags={20}
              description="Job titles listed in active job postings at the company"
              colorScheme="purple"
            />

            <TagInput
              label="Organization Job Locations"
              placeholder="e.g., Atlanta, Japan"
              values={getStringArrayValue('organization_job_locations')}
              onAdd={(val) => setFieldValue('organization_job_locations', [...getStringArrayValue('organization_job_locations'), val])}
              onRemove={(val) => setFieldValue('organization_job_locations', getStringArrayValue('organization_job_locations').filter(item => item !== val))}
              maxTags={20}
              description="Locations of active job postings"
              colorScheme="blue"
            />

            <NumberRange
              label="Number of Active Job Postings"
              minValue={typeof getFieldValue('organization_num_jobs_range_min') === 'number' ? (getFieldValue('organization_num_jobs_range_min') as number) : 0}
              maxValue={typeof getFieldValue('organization_num_jobs_range_max') === 'number' ? (getFieldValue('organization_num_jobs_range_max') as number) : 0}
              onMinChange={(val) => setFieldValue('organization_num_jobs_range_min', val)}
              onMaxChange={(val) => setFieldValue('organization_num_jobs_range_max', val)}
              min={0}
              max={10000}
              step={10}
              description="Set a range for the count of open roles at the company"
            />

            <FormControl>
              <FormLabel fontSize="sm">Job Posted Date Range</FormLabel>
              <HStack>
                <Input
                  type="date"
                  value={typeof getFieldValue('organization_job_posted_at_range_min') === 'string' ? (getFieldValue('organization_job_posted_at_range_min') as string) : ''}
                  onChange={(e) => setFieldValue('organization_job_posted_at_range_min', e.target.value || null)}
                  size="sm"
                />
                <Input
                  type="date"
                  value={typeof getFieldValue('organization_job_posted_at_range_max') === 'string' ? (getFieldValue('organization_job_posted_at_range_max') as string) : ''}
                  onChange={(e) => setFieldValue('organization_job_posted_at_range_max', e.target.value || null)}
                  size="sm"
                />
              </HStack>
              <Text fontSize="xs" color="gray.600" mt={1}>Filter companies based on when jobs were posted</Text>
            </FormControl>
















          </VStack>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  )
}

// Profile Management Component
interface ProfileManagementProps {
  filters: ExplorimFilters
  onSaveProfile: (name: string, description?: string) => void
  onLoadProfile: (profile: ICPFilterProfile) => void
  savedProfiles: ICPFilterProfile[]
}

export function ProfileManagement({ 
  filters, 
  onSaveProfile, 
  onLoadProfile, 
  savedProfiles 
}: ProfileManagementProps) {
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profileDescription, setProfileDescription] = useState('')

  const handleSave = () => {
    if (profileName.trim()) {
      onSaveProfile(profileName.trim(), profileDescription.trim() || undefined)
      setProfileName('')
      setProfileDescription('')
      setShowSaveForm(false)
    }
  }

  return (
    <Box>
      <HStack justify="space-between" mb={3}>
        <Text fontWeight="semibold" color="purple.600">💾 ICP Profile Manager</Text>
        <Button
          size="sm"
          leftIcon={<FiSave />}
          colorScheme="purple"
          variant="outline"
          onClick={() => setShowSaveForm(!showSaveForm)}
        >
          Save Profile
        </Button>
      </HStack>

      {showSaveForm && (
        <Box p={3} bg="purple.50" borderRadius="md" mb={3}>
          <VStack spacing={2} align="stretch">
            <Input
              placeholder="Profile name (e.g. Mid-size US SaaS)"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              size="sm"
            />
            <Input
              placeholder="Description (optional)"
              value={profileDescription}
              onChange={(e) => setProfileDescription(e.target.value)}
              size="sm"
            />
            <HStack>
              <Button size="sm" colorScheme="purple" onClick={handleSave}>
                Save
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setShowSaveForm(false)}
                leftIcon={<FiX />}
              >
                Cancel
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      {savedProfiles.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb={2}>Saved Profiles:</Text>
          <VStack spacing={1} align="stretch">
            {savedProfiles.map((profile) => (
              <Box
                key={profile.id}
                p={2}
                bg="gray.50"
                borderRadius="md"
                cursor="pointer"
                _hover={{ bg: 'gray.100' }}
                onClick={() => onLoadProfile(profile)}
              >
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="medium">{profile.profile_name}</Text>
                    {profile.description && (
                      <Text fontSize="xs" color="gray.600">{profile.description}</Text>
                    )}
                  </VStack>
                  <Badge size="sm">
                    {profile.usage_count || 0} uses
                  </Badge>
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </Box>
  )
}

// Main ExplorimFilters Component
interface ExplorimFiltersProps {
  filters: ExplorimFilters
  onChange: (field: keyof ExplorimFilters, value: any) => void
  savedProfiles?: ICPFilterProfile[]
  onSaveProfile?: (name: string, description?: string) => void
  onLoadProfile?: (profile: ICPFilterProfile) => void
}

export function ExplorimFilters({ 
  filters, 
  onChange, 
  savedProfiles = [], 
  onSaveProfile, 
  onLoadProfile 
}: ExplorimFiltersProps) {
  return (
    <VStack spacing={4} align="stretch">
      {/* Profile Management */}
      {onSaveProfile && onLoadProfile && (
        <>
          <ProfileManagement
            filters={filters}
            onSaveProfile={onSaveProfile}
            onLoadProfile={onLoadProfile}
            savedProfiles={savedProfiles}
          />
          <Divider />
        </>
      )}

      {/* Prospect Filters */}
      <ProspectFilters filters={filters} onChange={onChange} />
      
      {/* Company Filters */}
      <CompanyFilters filters={filters} onChange={onChange} isProspectSearch={true} />
    </VStack>
  )
}

export default ExplorimFilters 