'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  FormControl,
  FormLabel,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  useColorModeValue,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  Button,
  Divider,
  Badge,
  IconButton,
  Tooltip,
  Spinner,
  Alert,
  AlertIcon
} from '@chakra-ui/react'
import { FiPlus, FiSearch, FiChevronDown } from 'react-icons/fi'
import { loadSupportedTechnologies, groupTechnologiesByCategory, type TechnologyOption } from '@/utils/technologies'

interface TechnologySelectProps {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  description?: string
  maxTags?: number
  colorScheme?: string
}

export function TechnologySelect({ 
  label, 
  values, 
  onChange, 
  description,
  maxTags = 20,
  colorScheme = 'orange'
}: TechnologySelectProps) {
  const [technologies, setTechnologies] = useState<TechnologyOption[]>([])
  const [groupedTechnologies, setGroupedTechnologies] = useState<Record<string, TechnologyOption[]>>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const hoverBg = useColorModeValue('gray.50', 'gray.700')

  // Load technologies on component mount
  useEffect(() => {
    const loadTechnologies = async () => {
      try {
        setLoading(true)
        const techs = await loadSupportedTechnologies()
        setTechnologies(techs)
        setGroupedTechnologies(groupTechnologiesByCategory(techs))
        setError(null)
      } catch (err) {
        setError('Failed to load technologies')
        console.error('Error loading technologies:', err)
      } finally {
        setLoading(false)
      }
    }

    loadTechnologies()
  }, [])

  // Filter technologies based on search term
  const filteredTechnologies = React.useMemo(() => {
    if (!searchTerm) return groupedTechnologies

    const filtered: Record<string, TechnologyOption[]> = {}
    Object.entries(groupedTechnologies).forEach(([category, techs]) => {
      const matchingTechs = techs.filter(tech => 
        tech.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tech.value.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (matchingTechs.length > 0) {
        filtered[category] = matchingTechs
      }
    })
    return filtered
  }, [groupedTechnologies, searchTerm])

  const handleAdd = (technology: TechnologyOption) => {
    if (values.includes(technology.value)) return
    if (maxTags && values.length >= maxTags) return

    onChange([...values, technology.value])
    setSearchTerm('')
    setIsOpen(false)
  }

  const handleRemove = (value: string) => {
    onChange(values.filter(v => v !== value))
  }

  const getDisplayName = (value: string) => {
    const tech = technologies.find(t => t.value === value)
    return tech ? tech.label : value
  }

  if (loading) {
    return (
      <FormControl>
        <FormLabel fontSize="sm" display="flex" alignItems="center" gap={2}>
          {label}
          <Spinner size="xs" />
        </FormLabel>
        <Text fontSize="xs" color="gray.600">Loading technologies...</Text>
      </FormControl>
    )
  }

  if (error) {
    return (
      <FormControl>
        <FormLabel fontSize="sm">{label}</FormLabel>
        <Alert status="warning" size="sm">
          <AlertIcon />
          <Text fontSize="xs">{error}. Using fallback list.</Text>
        </Alert>
      </FormControl>
    )
  }

  return (
    <FormControl>
      <FormLabel fontSize="sm">{label}</FormLabel>
      
      {/* Selected Technologies */}
      {values.length > 0 && (
        <Wrap spacing={2} mb={3}>
          {values.map((value) => (
            <WrapItem key={value}>
              <Tag size="md" colorScheme={colorScheme} variant="solid">
                <TagLabel>{getDisplayName(value)}</TagLabel>
                <TagCloseButton onClick={() => handleRemove(value)} />
              </Tag>
            </WrapItem>
          ))}
        </Wrap>
      )}

      {/* Technology Selector */}
      <Popover
        isOpen={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        closeOnBlur={true}
        placement="bottom-start"
      >
        <PopoverTrigger>
          <Button
            variant="outline"
            w="full"
            justifyContent="space-between"
            rightIcon={<FiChevronDown />}
            leftIcon={<FiPlus />}
            isDisabled={maxTags ? values.length >= maxTags : false}
            _hover={{ bg: hoverBg }}
          >
            <Text fontSize="sm" color="gray.600">
              {maxTags && values.length >= maxTags 
                ? `Maximum ${maxTags} technologies selected`
                : 'Select technologies...'
              }
            </Text>
          </Button>
        </PopoverTrigger>

        <PopoverContent w="400px" maxH="400px" overflow="hidden">
          <PopoverArrow />
          <PopoverBody p={0}>
            <VStack spacing={0} align="stretch">
              {/* Search Input */}
              <Box p={3} borderBottom="1px solid" borderColor={borderColor}>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <FiSearch />
                  </InputLeftElement>
                  <Input
                    ref={inputRef}
                    placeholder="Search technologies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="sm"
                    autoFocus
                  />
                </InputGroup>
              </Box>

              {/* Technology List */}
              <Box maxH="300px" overflowY="auto">
                {Object.keys(filteredTechnologies).length === 0 ? (
                  <Box p={4} textAlign="center">
                    <Text fontSize="sm" color="gray.500">
                      No technologies found matching "{searchTerm}"
                    </Text>
                  </Box>
                ) : (
                  Object.entries(filteredTechnologies).map(([category, techs]) => (
                    <Box key={category}>
                      <Box
                        px={3}
                        py={2}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        borderBottom="1px solid"
                        borderColor={borderColor}
                      >
                        <HStack justify="space-between">
                          <Text fontSize="xs" fontWeight="semibold" color="gray.600">
                            {category}
                          </Text>
                          <Badge size="sm" colorScheme="gray">
                            {techs.length}
                          </Badge>
                        </HStack>
                      </Box>
                      {techs.map((tech) => (
                        <Box
                          key={tech.value}
                          px={3}
                          py={2}
                          cursor="pointer"
                          _hover={{ bg: hoverBg }}
                          onClick={() => handleAdd(tech)}
                          borderBottom="1px solid"
                          borderColor={borderColor}
                          opacity={values.includes(tech.value) ? 0.5 : 1}
                        >
                          <HStack justify="space-between">
                            <VStack align="start" spacing={0}>
                              <Text fontSize="sm" fontWeight="medium">
                                {tech.label}
                              </Text>
                              <Text fontSize="xs" color="gray.500">
                                {tech.value}
                              </Text>
                            </VStack>
                            {values.includes(tech.value) && (
                              <Badge colorScheme="green" size="sm">
                                Selected
                              </Badge>
                            )}
                          </HStack>
                        </Box>
                      ))}
                    </Box>
                  ))
                )}
              </Box>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>

      {description && (
        <Text fontSize="xs" color="gray.600" mt={1}>
          {description}
        </Text>
      )}

      {maxTags && (
        <Text fontSize="xs" color="gray.500" mt={1}>
          {values.length}/{maxTags} technologies selected
        </Text>
      )}
    </FormControl>
  )
} 