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
    HEADCOUNT_OPTIONS,
    REVENUE_RANGE_OPTIONS,
    FUNDING_STAGE_OPTIONS,
    COMMON_INDUSTRIES,
    COMMON_JOB_TITLES,
    COMMON_INTENT_TOPICS,
    getTechnologies,
} from '@/types/apollo'
import { TechnologySelect } from './TechnologySelect'
import { useApolloSearch } from '../../hooks/useApolloSearch'

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
        if (value.trim() && !values.includes(value) && (!maxTags || values?.length < maxTags)) {
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
                            {values?.length}/{maxTags}
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
                        isDisabled={maxTags ? values?.length >= maxTags : false}
                    />
                    <IconButton
                        aria-label="Add"
                        icon={<FiPlus />}
                        size="sm"
                        onClick={() => handleAdd(inputValue)}
                        isDisabled={!inputValue.trim() || (maxTags ? values?.length >= maxTags : false)}
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
                {values?.map((value) => (
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
                    {values?.length > 0 && (
                        <Badge ml={2} colorScheme="purple" fontSize="xs">
                            {values?.length} selected
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
                            flex={columns > 1 ? `0 0 ${100 / columns}%` : undefined}
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
    filters: ApolloFilterInput
    onChange: (field: keyof CompanyFilterInput | keyof ApolloFilterInput, value: any) => void
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

            {/* Location */}
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardHeader pb={2}>
                    <Text fontSize="lg" fontWeight="semibold">📍 Location</Text>
                </CardHeader>
                <CardBody pt={2}>
                    <VStack spacing={4} align="stretch">
                        <TagInput
                            label="Person Locations"
                            placeholder="e.g., California, Ireland, Chicago"
                            values={filters.personLocations}
                            onAdd={(value) => onChange('personLocations', [...filters.personLocations, value])}
                            onRemove={(value) => onChange('personLocations', filters.personLocations.filter(item => item !== value))}
                            maxTags={50}
                            description="Where people live (cities, states, countries)"
                            colorScheme="blue"
                        />
                    </VStack>
                </CardBody>
            </Card>

        </VStack>
    )
}

// Company-specific filter components
interface CompanyFiltersProps {
    filters: any
    onChange: (field: keyof ApolloFilterInput, value: any) => void
}

export function CompanyFilters({ filters, onChange }: CompanyFiltersProps) {
    const cardBg = useColorModeValue('white', 'gray.800')
    const borderColor = useColorModeValue('gray.200', 'gray.600')
    const [COMMON_TECHNOLOGIES, setCommonTechnologies] = useState<string[]>([]);

    React.useEffect(() => {
        let mounted = true;
        getTechnologies().then(techs => {
            if (mounted) setCommonTechnologies(techs);
        });
        return () => { mounted = false; };
    }, []);

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
                            label="Company Domains"
                            placeholder="e.g., google.com, microsoft.com, salesforce.com"
                            values={filters.companyDomains || []}
                            onAdd={(value) => onChange('companyDomains', [...(filters.companyDomains || []), value])}
                            onRemove={(value) => onChange('companyDomains', (filters.companyDomains || []).filter(item => item !== value))}
                            maxTags={100}
                            description="Target specific company domains"
                            colorScheme="green"
                        />

                    </VStack>
                </CardBody>
            </Card>

            {/* Organization Location */}
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardHeader pb={2}>
                    <Text fontSize="lg" fontWeight="semibold">🏢 Organization Location</Text>
                </CardHeader>
                <CardBody pt={2}>
                    <VStack spacing={4} align="stretch">
                        <TagInput
                            label="Organization Locations"
                            placeholder="e.g., San Francisco, New York, London"
                            values={filters.organizationLocations}
                            onAdd={(value) => onChange('organizationLocations', [...filters.organizationLocations, value])}
                            onRemove={(value) => onChange('organizationLocations', filters.organizationLocations.filter(item => item !== value))}
                            maxTags={50}
                            description="Company headquarters locations"
                            colorScheme="green"
                        />
                    </VStack>
                </CardBody>
            </Card>

            {/* Organization Job Details */}
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardHeader pb={2}>
                    <Text fontSize="lg" fontWeight="semibold">💼 Organization Job Details</Text>
                </CardHeader>
                <CardBody pt={2}>
                    <VStack spacing={4} align="stretch">
                        <TagInput
                            label="Organization Job Titles"
                            placeholder="e.g., sales manager, research analyst"
                            values={filters.organizationJobTitles || []}
                            onAdd={(value) => onChange('organizationJobTitles', [...(filters.organizationJobTitles || []), value])}
                            onRemove={(value) => onChange('organizationJobTitles', (filters.organizationJobTitles || []).filter(item => item !== value))}
                            maxTags={20}
                            description="Job titles listed in active job postings at the company"
                            colorScheme="purple"
                        />

                        <TagInput
                            label="Organization Job Locations"
                            placeholder="e.g., Atlanta, Japan"
                            values={filters.organizationJobLocations || []}
                            onAdd={(value) => onChange('organizationJobLocations', [...(filters.organizationJobLocations || []), value])}
                            onRemove={(value) => onChange('organizationJobLocations', (filters.organizationJobLocations || []).filter(item => item !== value))}
                            maxTags={20}
                            description="Locations of active job postings"
                            colorScheme="blue"
                        />

                        {/* Number of Active Job Postings Range */}
                        <NumberRange
                            label="Number of Active Job Postings"
                            minValue={filters.organizationNumJobsMin ?? 0}
                            maxValue={filters.organizationNumJobsMax ?? 0}
                            onMinChange={(val) => {
                                const parsed = parseInt(String(val), 10)
                                onChange('organizationNumJobsMin', isNaN(parsed) || parsed < 0 ? 0 : parsed)
                            }}
                            onMaxChange={(val) => {
                                const parsed = parseInt(String(val), 10)
                                onChange('organizationNumJobsMax', isNaN(parsed) || parsed < 0 ? 0 : parsed)
                            }}
                            min={0}
                            max={10000}
                            step={10}
                            description="Set a range for the count of open roles at the company"
                        />

                        {/* Job Posted Date Range */}
                        <FormControl>
                            <FormLabel fontSize="sm">Job Posted Date Range</FormLabel>
                            <HStack>
                                <Input
                                    type="date"
                                    value={filters.organizationJobPostedAtMin || ''}
                                    onChange={(e) => onChange('organizationJobPostedAtMin', e.target.value || null)}
                                    size="sm"
                                />
                                <Input
                                    type="date"
                                    value={filters.organizationJobPostedAtMax || ''}
                                    onChange={(e) => onChange('organizationJobPostedAtMax', e.target.value || null)}
                                    size="sm"
                                />
                            </HStack>
                            <Text fontSize="xs" color="gray.600" mt={1}>Filter companies based on when jobs were posted</Text>
                        </FormControl>
                    </VStack>
                </CardBody>
            </Card>

            {/* Company Size & Revenue */}
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardHeader pb={2}>
                    <Text fontSize="lg" fontWeight="semibold">Company Size & Revenue</Text>
                </CardHeader>
                <CardBody pt={2}>
                    <VStack spacing={4} align="stretch">
                        <MultiSelect
                            label="Company Headcount"
                            options={HEADCOUNT_OPTIONS}
                            values={filters.companyHeadcount || []}
                            onChange={(values) => onChange('companyHeadcount', values)}
                            description="Filter by number of employees"
                            columns={2}
                        />

                        <NumberRange
                            label="Revenue Range"
                            minValue={filters.revenueMin || 0}
                            maxValue={filters.revenueMax || 1000000000}
                            onMinChange={(value) => onChange('revenueMin', Math.floor(value))}
                            onMaxChange={(value) => onChange('revenueMax', Math.floor(value))}
                            min={0}
                            max={1000000000}
                            step={1000}
                            description="Filter by estimated annual revenue (integers only, no commas or currency symbols)"
                        />
                    </VStack>
                </CardBody>
            </Card>

            {/* Technologies */}
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardHeader pb={2}>
                    <Text fontSize="lg" fontWeight="semibold">⚙️ Technologies</Text>
                </CardHeader>
                <CardBody pt={2}>
                    <VStack spacing={4} align="stretch">
                        <TagInput
                            label="Technologies Used"
                            placeholder="e.g., salesforce, workday, hubspot"
                            values={filters.technologyUids || []}
                            onAdd={(value) => onChange('technologyUids', [...(filters.technologyUids || []), value])}
                            onRemove={(value) => onChange('technologyUids', (filters.technologyUids || []).filter(item => item !== value))}
                            maxTags={20}
                            suggestions={COMMON_TECHNOLOGIES}
                            description="Technologies the company uses (Apollo verified list)"
                            colorScheme="orange"
                        />

                        <TagInput
                            label="Exclude Technologies"
                            placeholder="e.g., microsoft, oracle, sap"
                            values={filters.excludeTechnologyUids || []}
                            onAdd={(value) => onChange('excludeTechnologyUids', [...(filters.excludeTechnologyUids || []), value])}
                            onRemove={(value) => onChange('excludeTechnologyUids', (filters.excludeTechnologyUids || []).filter(item => item !== value))}
                            maxTags={20}
                            suggestions={COMMON_TECHNOLOGIES}
                            description="Exclude companies that use these technologies"
                            colorScheme="red"
                        />
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
    onChange: (field: keyof ApolloFilterInput, value: any) => void
}

export function CommonFilters({ searchType, filters, onChange }: CommonFiltersProps) {
    const cardBg = useColorModeValue('white', 'gray.800')
    const borderColor = useColorModeValue('gray.200', 'gray.600')

    return (
        <VStack spacing={6} align="stretch">

            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardHeader pb={2}>
                    <Text fontSize="lg" fontWeight="semibold">🔍 Keywords</Text>
                </CardHeader>
                <CardBody pt={2}>
                    <TagInput
                        label="Keywords"
                        placeholder="Enter keywords"
                        values={filters.keywords}
                        onAdd={(value) => onChange('keywords', [...filters.keywords, value])}
                        onRemove={(value) => onChange('keywords', filters.keywords.filter(item => item !== value))}
                        maxTags={5}
                        description="Extra Keywords"
                        colorScheme="pink"
                    />
                </CardBody>
            </Card>
        </VStack>
    )
}

interface ApolloFiltersProps {
    filters: ApolloFilterInput
    onChange: (field: keyof CompanyFilterInput | keyof ApolloFilterInput, value: any) => void
    savedProfiles?: any[]
    onSaveProfile?: (name: string, description?: string) => void
    onLoadProfile?: (profile: any) => void
}

export function ApolloPeopleFilters({
    filters,
    onChange,
    savedProfiles = [],
    onSaveProfile,
    onLoadProfile
}: ApolloFiltersProps) {
    return (
        <VStack spacing={6} align="stretch">
            <PeopleFilters filters={filters} onChange={onChange} />
            <CompanyFilters filters={filters} onChange={onChange} />
            <CommonFilters searchType="people" filters={filters} onChange={onChange} />
        </VStack>
    )
}

// Company-only wrapper component that binds the UI to the company filter slice
export function ApolloCompanyFilters({ filters,
    onChange }: { filters: CompanyFilterInput, onChange: (field: keyof CompanyFilterInput | keyof ApolloFilterInput, value: any) => void }) {
    const { companyFilters, updateCompanyFilter, setSearchType } = useApolloSearch()

    React.useEffect(() => {
        setSearchType('company')
    }, [setSearchType])

    return (
        <VStack spacing={6} align="stretch">
            <CompanyFiltersFull filters={companyFilters} onChange={onChange} />
            {/* {/* <CompanyFilters filters={companyFilters} onChange={onChange} /> */}
            {/* <CommonFilters searchType="company" filters={companyFilters} onChange={onChange} /> */}
        </VStack>
    )
}

// Compant Filters
const CompanyFiltersFull = ({ filters, onChange }: { filters: CompanyFilterInput, onChange: (field: keyof CompanyFilterInput, value: any) => void }) => {
    const cardBg = useColorModeValue('white', 'gray.800')
    const borderColor = useColorModeValue('gray.200', 'gray.600')

    const NumberOfEmployeesRanges = [
        '1-10',
        '11-50',
        '51-100',
        '101-250',
        '251-500',
        '501-1000',
        '1001-5000',
        '5001-10000',
        '10001-50000',
        '50001-100000',
    ]

    const [COMMON_TECHNOLOGIES, setCommonTechnologies] = useState<string[]>([]);

    React.useEffect(() => {
        let mounted = true;
        getTechnologies().then(techs => {
            if (mounted) setCommonTechnologies(techs);
        });
        return () => { mounted = false; };
    }, []);
    return (
        <VStack spacing={6} align="stretch">
            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                <CardHeader pb={2}>
                    <Text fontSize="lg" fontWeight="semibold">Company Filters</Text>
                </CardHeader>
                <CardBody pt={2}>
                    <VStack spacing={4} align="stretch">
                        <TagInput
                            label="Number of Employees Range"
                            placeholder="Number of Employees Range"
                            values={filters.organizationNumEmployeesRange || []}
                            onAdd={(value) => onChange('organizationNumEmployeesRange', [...(filters.organizationNumEmployeesRange || []), value.split('-').join(',')])}
                            onRemove={(value) => onChange('organizationNumEmployeesRange', (filters.organizationNumEmployeesRange || []).filter(item => item !== value.split('-').join(',')))}
                            maxTags={20}
                            suggestions={NumberOfEmployeesRanges}
                            description="Filter Organizations based on number of employees"
                            colorScheme="orange"
                        />
                        <TagInput
                            label="Organization Locations"
                            placeholder="Organization Locations"
                            values={filters.organizationLocations || []}
                            onAdd={(value) => onChange('organizationLocations', [...(filters.organizationLocations || []), value])}
                            onRemove={(value) => onChange('organizationLocations', (filters.organizationLocations || []).filter(item => item !== value))}
                            maxTags={20}
                            description="Filter Organizations Based on Locations"
                            colorScheme="orange"
                        />
                        <TagInput
                            label="Exclude Organization Locations"
                            placeholder="Exclude Organization Locations"
                            values={filters.excludeOrganizationLocations || []}
                            onAdd={(value) => onChange('excludeOrganizationLocations', [...(filters.excludeOrganizationLocations || []), value])}
                            onRemove={(value) => onChange('excludeOrganizationLocations', (filters.excludeOrganizationLocations || []).filter(item => item !== value))}
                            maxTags={20}
                            description="Exclude Organizations Based on Locations"
                            colorScheme="orange"
                        />
                        <NumberRange
                            label="Revenue Range"
                            minValue={filters.revenueRangeMin || 0}
                            maxValue={filters.revenueRangeMax || 1000000000}
                            onMinChange={(value) => onChange('revenueRangeMin', Math.floor(value))}
                            onMaxChange={(value) => onChange('revenueRangeMax', Math.floor(value))}
                            min={0}
                            max={1000000000}
                            step={1000}
                            description="Filter by estimated annual revenue (integers only, no commas or currency symbols)"
                        />
                        <TagInput
                            label="Technologies"
                            placeholder="Technologies"
                            values={filters.companyTechnologies || []}
                            onAdd={(value) => onChange('companyTechnologies', [...(filters.companyTechnologies || []), value.split('-').join(',')])}
                            onRemove={(value) => onChange('companyTechnologies', (filters.companyTechnologies || []).filter(item => item !== value.split('-').join(',')))}
                            maxTags={20}
                            suggestions={COMMON_TECHNOLOGIES}
                            description="Filters Organizations Based on Technologies "
                            colorScheme="orange"
                        />
                        <TagInput
                            label="Keywords"
                            placeholder="Enter keywords"
                            values={filters.companyKeywords}
                            onAdd={(value) => onChange('companyKeywords', [...filters.companyKeywords, value])}
                            onRemove={(value) => onChange('companyKeywords', filters.companyKeywords.filter(item => item !== value))}
                            maxTags={5}
                            description="Extra Keywords"
                            colorScheme="pink"
                        />
                        <Input
                            placeholder="Organization Name"
                            // Keep this field controlled: always pass a string value.
                            value={filters.organizationName ?? ''}
                            onChange={(e) => onChange('organizationName', (e.target as HTMLInputElement).value)}
                        />
                        <NumberRange
                            label="Latest Funding Amount"
                            minValue={filters.latestFundingAmountMin || 0}
                            maxValue={filters.latestFundingAmountMax || 1000000000}
                            onMinChange={(value) => onChange('latestFundingAmountMax', Math.floor(value))}
                            onMaxChange={(value) => onChange('latestFundingAmountMax', Math.floor(value))}
                            min={0}
                            max={1000000000}
                            step={1000}
                            description="Filter organizations by Latest Funding Round Amount"
                        />
                        <NumberRange
                            label="Total Funding Range"
                            minValue={filters.totalFundingMin || 0}
                            maxValue={filters.totalFundingMax || 1000000000}
                            onMinChange={(value) => onChange('totalFundingMin', Math.floor(value))}
                            onMaxChange={(value) => onChange('totalFundingMax', Math.floor(value))}
                            min={0}
                            max={1000000000}
                            step={1000}
                            description="Filter organizations by Total Amount"
                        />
                        <FormControl>
                            <FormLabel fontSize="sm">Latest Funding Date Range</FormLabel>
                            <HStack>
                                <Input
                                    type="date"
                                    value={filters.latestFundingDateRangeMin || ''}
                                    onChange={(e) => onChange('latestFundingDateRangeMin', e.target.value || null)}
                                    size="sm"
                                />
                                <Input
                                    type="date"
                                    value={filters.latestFundingDateRangeMax || ''}
                                    onChange={(e) => onChange('latestFundingDateRangeMax', e.target.value || null)}
                                    size="sm"
                                />
                            </HStack>
                            <Text fontSize="xs" color="gray.600" mt={1}>Filter companies based on when jobs were posted</Text>
                        </FormControl>
                        <TagInput
                            label="Organization Job Titles"
                            placeholder="Organization Job Titles"
                            values={filters.organizationJobTitles || []}
                            onAdd={(value) => onChange('organizationJobTitles', [...(filters.organizationJobTitles || []), value])}
                            onRemove={(value) => onChange('organizationJobTitles', (filters.organizationJobTitles || []).filter(item => item !== value))}
                            maxTags={20}
                            suggestions={COMMON_JOB_TITLES}
                            description="Filters Organizations Based on Technologies "
                            colorScheme="orange"
                        />
                        <TagInput
                            label="Organization Job Locations"
                            placeholder="Organization Job Locations"
                            values={filters.organizationJobLocations || []}
                            onAdd={(value) => onChange('organizationJobLocations', [...(filters.organizationJobLocations || []), value])}
                            onRemove={(value) => onChange('organizationJobLocations', (filters.organizationJobLocations || []).filter(item => item !== value))}
                            maxTags={20}
                            description="Filter Organizations Based on Job Locations"
                            colorScheme="orange"
                        />
                        <NumberRange
                            label="Number of Jobs in organization"
                            minValue={filters.organizationJobsMin || 0}
                            maxValue={filters.organizationJobsMax || 1000000000}
                            onMinChange={(value) => onChange('organizationJobsMin', Math.floor(value))}
                            onMaxChange={(value) => onChange('organizationJobsMax', Math.floor(value))}
                            min={0}
                            max={1000000000}
                            step={1000}
                            description="Number of Jobs available in organization"
                        />
                        <FormControl>
                            <FormLabel fontSize="sm">Job Posted At Date Range</FormLabel>
                            <HStack>
                                <Input
                                    type="date"
                                    value={filters.organizationJobPostedAtRangeMin || ''}
                                    onChange={(e) => onChange('organizationJobPostedAtRangeMin', e.target.value || null)}
                                    size="sm"
                                />
                                <Input
                                    type="date"
                                    value={filters.organizationJobPostedAtRangeMax || ''}
                                    onChange={(e) => onChange('organizationJobPostedAtRangeMax', e.target.value || null)}
                                    size="sm"
                                />
                            </HStack>
                            <Text fontSize="xs" color="gray.600" mt={1}>Filter companies based on when jobs were posted</Text>
                        </FormControl>
                    </VStack>
                </CardBody>
            </Card>
        </VStack>
    )

}