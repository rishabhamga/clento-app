import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  Link,
  Button,
} from '@chakra-ui/react';
import { DownloadIcon, InfoIcon } from '@chakra-ui/icons';

export const CSVFormatGuide: React.FC = () => {
  const fields = [
    { name: 'first_name', required: true, example: 'John', description: 'First name of the lead' },
    { name: 'last_name', required: true, example: 'Doe', description: 'Last name of the lead' },
    { name: 'email', required: false, example: 'john.doe@company.com', description: 'Business email address' },
    { name: 'company', required: false, example: 'Acme Inc', description: 'Company name' },
    { name: 'title', required: false, example: 'Senior Developer', description: 'Job title' },
    { name: 'phone', required: false, example: '+1-555-0123', description: 'Contact phone number' },
    { name: 'location', required: false, example: 'San Francisco, CA', description: 'Location of the lead' },
    { name: 'linkedin_url', required: false, example: 'https://linkedin.com/in/johndoe', description: 'LinkedIn profile URL' },
    { name: 'website', required: false, example: 'https://company.com', description: 'Company website' },
    { name: 'industry', required: false, example: 'Technology', description: 'Industry sector' },
    { name: 'company_size', required: false, example: '50-200', description: 'Company size range' },
    { name: 'department', required: false, example: 'Engineering', description: 'Department name' },
  ];

  const sampleCSV = fields.map(f => f.name).join(',') + '\\n' +
    fields.map(f => f.example).join(',');

  const handleDownloadSample = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <VStack spacing={6} align="stretch" w="100%" p={4}>
      <Box bg="blue.50" p={4} borderRadius="md">
        <HStack spacing={3}>
          <Icon as={InfoIcon} color="blue.500" boxSize={5} />
          <Text fontSize="md">
            Upload your leads data in CSV format. Download our template below to ensure correct formatting.
          </Text>
        </HStack>
      </Box>

      <Button
        leftIcon={<DownloadIcon />}
        colorScheme="blue"
        variant="outline"
        onClick={handleDownloadSample}
        w="fit-content"
      >
        Download CSV Template
      </Button>

      <Box overflowX="auto">
        <Table variant="simple" size="sm">
          <Thead bg="gray.50">
            <Tr>
              <Th>Field Name</Th>
              <Th>Required</Th>
              <Th>Example</Th>
              <Th>Description</Th>
            </Tr>
          </Thead>
          <Tbody>
            {fields.map((field) => (
              <Tr key={field.name}>
                <Td fontFamily="mono">{field.name}</Td>
                <Td>
                  {field.required ? (
                    <Badge colorScheme="red">Required</Badge>
                  ) : (
                    <Badge colorScheme="gray">Optional</Badge>
                  )}
                </Td>
                <Td fontFamily="mono">{field.example}</Td>
                <Td>{field.description}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      <Box bg="gray.50" p={4} borderRadius="md">
        <Text fontSize="sm" color="gray.600">
          <strong>Note:</strong> Make sure your CSV file:
          <VStack align="stretch" mt={2} spacing={1}>
            <Text>• Has a header row with the exact field names shown above</Text>
            <Text>• Uses comma (,) as the delimiter</Text>
            <Text>• Contains UTF-8 encoded text</Text>
            <Text>• Has no empty rows</Text>
          </VStack>
        </Text>
      </Box>
    </VStack>
  );
}; 