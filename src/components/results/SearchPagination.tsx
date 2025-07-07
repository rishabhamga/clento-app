'use client'

import React from 'react'
import {
  Box,
  HStack,
  Button,
  Text,
  Select,
  IconButton,
  Tooltip,
  useColorModeValue,
  Flex,
  Spacer,
} from '@chakra-ui/react'
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiChevronsLeft, 
  FiChevronsRight 
} from 'react-icons/fi'
import { useSearchPagination, useSearchResults } from '@/hooks/useApolloSearch'

interface SearchPaginationProps {
  className?: string
}

export function SearchPagination({ className }: SearchPaginationProps) {
  const { pagination, goToPage, nextPage, prevPage, canGoNext, canGoPrev } = useSearchPagination()
  const { loading } = useSearchResults()
  
  const buttonBg = useColorModeValue('white', 'gray.700')
  const buttonBorder = useColorModeValue('gray.200', 'gray.600')
  
  if (!pagination) {
    return null
  }

  const { page, per_page, total_entries, total_pages } = pagination
  
  const startEntry = ((page - 1) * per_page) + 1
  const endEntry = Math.min(page * per_page, total_entries)

  // Generate page numbers to show
  const generatePageNumbers = () => {
    const pages: number[] = []
    const maxPagesToShow = 7
    
    if (total_pages <= maxPagesToShow) {
      // Show all pages if total is small
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)
      
      const startPage = Math.max(2, page - 2)
      const endPage = Math.min(total_pages - 1, page + 2)
      
      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push(-1) // -1 represents ellipsis
      }
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      
      // Add ellipsis before last page if needed
      if (endPage < total_pages - 1) {
        pages.push(-1) // -1 represents ellipsis
      }
      
      // Always show last page if more than 1 page
      if (total_pages > 1) {
        pages.push(total_pages)
      }
    }
    
    return pages
  }

  const pageNumbers = generatePageNumbers()

  const handlePerPageChange = async (newPerPage: number) => {
    // Calculate what page we should be on to maintain roughly the same position
    const currentFirstEntry = (page - 1) * per_page + 1
    const newPage = Math.ceil(currentFirstEntry / newPerPage)
    await goToPage(newPage)
  }

  return (
    <Box className={className}>
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        align={{ base: 'stretch', md: 'center' }}
        gap={4}
        p={4}
        bg={buttonBg}
        border="1px solid"
        borderColor={buttonBorder}
        borderRadius="lg"
      >
        {/* Results info */}
        <Box>
          <Text fontSize="sm" color="gray.600">
            Showing <strong>{startEntry.toLocaleString()}</strong> to{' '}
            <strong>{endEntry.toLocaleString()}</strong> of{' '}
            <strong>{total_entries.toLocaleString()}</strong> results
          </Text>
        </Box>

        <Spacer />

        {/* Page size selector */}
        <HStack spacing={2}>
          <Text fontSize="sm" color="gray.600">
            Show:
          </Text>
          <Select 
            size="sm" 
            w="auto" 
            value={per_page}
            onChange={(e) => handlePerPageChange(Number(e.target.value))}
            isDisabled={loading}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </Select>
          <Text fontSize="sm" color="gray.600">
            per page
          </Text>
        </HStack>

        {/* Pagination controls */}
        <HStack spacing={1}>
          {/* First page */}
          <Tooltip label="First page">
            <IconButton
              aria-label="First page"
              icon={<FiChevronsLeft />}
              size="sm"
              variant="outline"
              onClick={() => goToPage(1)}
              isDisabled={!canGoPrev || loading}
            />
          </Tooltip>

          {/* Previous page */}
          <Tooltip label="Previous page">
            <IconButton
              aria-label="Previous page"
              icon={<FiChevronLeft />}
              size="sm"
              variant="outline"
              onClick={prevPage}
              isDisabled={!canGoPrev || loading}
            />
          </Tooltip>

          {/* Page numbers */}
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === -1) {
              return (
                <Text key={`ellipsis-${index}`} px={2} color="gray.500">
                  ...
                </Text>
              )
            }

            return (
              <Button
                key={pageNum}
                size="sm"
                variant={pageNum === page ? 'solid' : 'outline'}
                colorScheme={pageNum === page ? 'purple' : 'gray'}
                onClick={() => goToPage(pageNum)}
                isDisabled={loading}
                minW="40px"
              >
                {pageNum}
              </Button>
            )
          })}

          {/* Next page */}
          <Tooltip label="Next page">
            <IconButton
              aria-label="Next page"
              icon={<FiChevronRight />}
              size="sm"
              variant="outline"
              onClick={nextPage}
              isDisabled={!canGoNext || loading}
            />
          </Tooltip>

          {/* Last page */}
          <Tooltip label="Last page">
            <IconButton
              aria-label="Last page"
              icon={<FiChevronsRight />}
              size="sm"
              variant="outline"
              onClick={() => goToPage(total_pages)}
              isDisabled={!canGoNext || loading}
            />
          </Tooltip>
        </HStack>
      </Flex>
    </Box>
  )
}

export default SearchPagination 