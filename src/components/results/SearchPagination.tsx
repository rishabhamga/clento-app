'use client'

import React, { useEffect, useState } from 'react'
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
    VStack,
} from '@chakra-ui/react'
import {
    FiChevronLeft,
    FiChevronRight,
    FiChevronsLeft,
    FiChevronsRight
} from 'react-icons/fi'
import { useSearchPagination, useSearchResults, useSearchFilters, useApolloSearch } from '@/hooks/useApolloSearch'

export function SearchPagination() {
    const { pagination, goToPage, nextPage, prevPage, canGoNext, canGoPrev, setPerPage } = useSearchPagination()
    const [loading, setLoading] = useState<boolean>(false)
    const { filters } = useSearchFilters()

    if (!pagination) return null

    const { page, total_entries } = pagination
    const perPage = filters.perPage || 20
    const startEntry = ((page - 1) * perPage) + 1
    const endEntry = Math.min(page * perPage, total_entries)

    const MAX_ENTRIES_ACCESSIBLE = 50000;
    const maxAllowedPages = Math.floor(MAX_ENTRIES_ACCESSIBLE / perPage);
    const safeTotalPages = Math.min(pagination.total_pages, maxAllowedPages);


    const handlePageChange = async(pageNumber: number) => {
        console.log(pageNumber);
        setLoading(true)
        await goToPage(pageNumber)
        setLoading(false)
    }

    const handlePrevAndNext = async(type: 'prev' | 'next') => {
        setLoading(true)
        if (type === 'prev'){
            await prevPage();
        }
        if(type === 'next'){
            await nextPage();
        }
        // await goToPage(pageNumber)
        setLoading(false)
    }

    const handlePerPageChange = async (newPerPage) => {
        setLoading(true)
        setPerPage(newPerPage)
        await goToPage(1)
        setLoading(false)
    }

    const generatePageNumbers = () => {
        const pages: (number | -1)[] = []
        const maxPagesToShow = 7
        if (safeTotalPages <= maxPagesToShow) {
            for (let i = 1; i <= safeTotalPages; i++) pages.push(i)
        } else {
            pages.push(1)
            let startPage = Math.max(2, page - 2)
            let endPage = Math.min(safeTotalPages - 1, page + 2)
            if (startPage > 2) pages.push(-1)
            for (let i = startPage; i <= endPage; i++) pages.push(i)
            if (endPage < safeTotalPages - 1) pages.push(-1)
            pages.push(safeTotalPages)
        }
        return pages
    }

    const pageNumbers = generatePageNumbers()

    return (
        <Box >
            <Flex direction={{ base: 'column', md: 'column' }} align={{ base: 'stretch', md: 'center' }} gap={4} p={4} bg={useColorModeValue('white', 'gray.700')} border="1px solid" borderColor={useColorModeValue('gray.200', 'gray.600')} borderRadius="lg">
                <HStack spacing={1} marginLeft={'auto'}>
                    <Tooltip label="First page"><IconButton aria-label="First page" icon={<FiChevronsLeft />} size="sm" variant="outline" onClick={() => handlePageChange(1)} isDisabled={!canGoPrev || loading} /></Tooltip>
                    <Tooltip label="Previous page"><IconButton aria-label="Previous page" icon={<FiChevronLeft />} size="sm" variant="outline" onClick={() => handlePrevAndNext('prev')} isDisabled={!canGoPrev || loading} /></Tooltip>
                    {pageNumbers.map((pageNum, idx) => pageNum === -1 ? <Text key={`ellipsis-${idx}`} px={2} color="gray.500">...</Text> : <Button key={pageNum} size="sm" variant={pageNum === page ? 'solid' : 'outline'} colorScheme={pageNum === page ? 'purple' : 'gray'} onClick={() => handlePageChange(pageNum)} isDisabled={loading} minW="40px">{pageNum}</Button>)}
                    <Tooltip label="Next page"><IconButton aria-label="Next page" icon={<FiChevronRight />} size="sm" variant="outline" onClick={() => handlePrevAndNext('next')} isDisabled={!canGoNext || loading} /></Tooltip>
                    <Tooltip label="Last page"><IconButton aria-label="Last page" icon={<FiChevronsRight />} size="sm" variant="outline" onClick={() => handlePageChange(safeTotalPages)} isDisabled={!canGoNext || loading} /></Tooltip>
                </HStack>
                <HStack display={'flex'} justifyContent={'space-between'} width={"100%"}>
                    <Box>
                        <Text fontSize="x-small" color="gray.600">
                            Showing <strong>{startEntry.toLocaleString()}</strong> to <strong>{endEntry.toLocaleString()}</strong> of <strong>{total_entries.toLocaleString()}</strong> results
                        </Text>
                    </Box>
                    <Spacer />
                    <HStack spacing={2}>
                        <Text fontSize="sm" color="gray.600">Show:</Text>
                        <Select
                            size="md"
                            w="100px"
                            value={perPage}
                            onChange={e => handlePerPageChange(Number(e.target.value))}
                            isDisabled={loading}
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </Select>
                        <Text fontSize="sm" color="gray.600">per page</Text>
                    </HStack>
                </HStack>
            </Flex>
        </Box>
    )
}

export default SearchPagination