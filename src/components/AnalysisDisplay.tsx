import React from 'react'
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Grid,
  Text,
  Heading,
  Badge,
  List,
  ListItem,
  ListIcon,
  Tag,
  TagLabel,
  Wrap,
  WrapItem,
  Icon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useColorModeValue
} from '@chakra-ui/react'
import {
  FiTarget,
  FiUsers,
  FiTrendingUp,
  FiBookOpen,
  FiGift,
  FiStar,
  FiSettings
} from 'react-icons/fi'
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons'

// Types
interface PersonaData {
  title: string
  company_size: string
  industry: string
  pain_points: string[]
  desired_outcomes: string[]
  challenges: string[]
  demographics: {
    seniority_level: string
    department: string
    decision_making_authority: string
  }
}

interface CaseStudy {
  title: string
  industry: string
  challenge: string
  solution: string
  results: string[]
  metrics?: string
  client_info?: string
}

interface LeadMagnet {
  title: string
  type: string
  description: string
  target_audience: string
  call_to_action: string
  url?: string
}

interface ICPAnalysis {
  core_offer: string
  industry: string
  business_model: string
  icp_summary: string
  target_personas?: PersonaData[]
  case_studies?: CaseStudy[]
  lead_magnets?: LeadMagnet[]
  competitive_advantages?: string[]
  tech_stack?: string[]
  social_proof?: {
    testimonials: Array<{
      quote: string
      author: string
      company?: string
      position?: string
    }>
    client_logos: string[]
    metrics: Array<{
      metric: string
      value: string
    }>
  }
  confidence_score: number
  pages_analyzed?: number
  completed_at?: string
}

interface AnalysisDisplayProps {
  analysis: ICPAnalysis
  showHeader?: boolean
  compact?: boolean
}

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({
  analysis,
  showHeader = true,
  compact = false
}) => {
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const personaBg = useColorModeValue('gray.50', 'gray.700')
  const personaBorderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <VStack spacing={6} w="full">
      {/* Header Card */}
      {showHeader && (
        <Card bg={cardBg} shadow="xl" borderWidth="1px" borderColor={borderColor} w="full">
          <CardHeader>
            <VStack spacing={3}>
              <Heading size="lg" textAlign="center" color="green.500">
                ✅ Analysis Complete!
              </Heading>
              <HStack spacing={4}>
                <Badge colorScheme="blue" fontSize="sm">
                  Confidence: {Math.round(analysis.confidence_score * 100)}%
                </Badge>
                <Badge colorScheme="green" fontSize="sm">
                  Industry: {analysis.industry}
                </Badge>
                <Badge colorScheme="purple" fontSize="sm">
                  {analysis.business_model}
                </Badge>
              </HStack>
            </VStack>
          </CardHeader>
        </Card>
      )}

      {/* Core Offer */}
      <Card bg={cardBg} shadow="lg" borderWidth="1px" borderColor={borderColor} w="full">
        <CardHeader>
          <HStack>
            <Icon as={FiTarget} color="blue.500" />
            <Heading size="md">Core Offering</Heading>
          </HStack>
        </CardHeader>
        <CardBody>
          <Text fontSize="md" lineHeight="tall">{analysis.core_offer}</Text>
        </CardBody>
      </Card>

      {/* ICP Summary */}
      <Card bg={cardBg} shadow="lg" borderWidth="1px" borderColor={borderColor} w="full">
        <CardHeader>
          <HStack>
            <Icon as={FiUsers} color="purple.500" />
            <Heading size="md">Ideal Customer Profile</Heading>
          </HStack>
        </CardHeader>
        <CardBody>
          <Text fontSize="md" lineHeight="tall">{analysis.icp_summary}</Text>
        </CardBody>
      </Card>

      {/* Target Personas */}
      {analysis.target_personas && analysis.target_personas.length > 0 && (
        <Card bg={cardBg} shadow="lg" borderWidth="1px" borderColor={borderColor} w="full">
          <CardHeader>
            <HStack>
              <Icon as={FiUsers} color="green.500" />
              <Heading size="md">Target Personas</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <Grid templateColumns={compact ? "1fr" : "repeat(auto-fit, minmax(400px, 1fr))"} gap={4}>
              {analysis.target_personas.map((persona, index) => (
                <Box key={index} p={4} bg={personaBg} borderRadius="md" border="1px" borderColor={personaBorderColor}>
                  <VStack align="start" spacing={3}>
                    {persona.title && <Heading size="sm" color="blue.600">{persona.title}</Heading>}
                    <HStack wrap="wrap">
                      {persona.company_size && <Badge colorScheme="blue">{persona.company_size}</Badge>}
                      {persona.industry && <Badge colorScheme="green">{persona.industry}</Badge>}
                      {persona.demographics?.seniority_level && <Badge colorScheme="purple">{persona.demographics.seniority_level}</Badge>}
                    </HStack>

                    <Box>
                      <Text fontWeight="semibold" fontSize="sm" color="red.600">Pain Points:</Text>
                      <List spacing={1} fontSize="sm">
                        {persona.pain_points.slice(0, compact ? 2 : 3).map((point, i) => (
                          <ListItem key={i}>
                            <ListIcon as={WarningIcon} color="red.400" />
                            {point}
                          </ListItem>
                        ))}
                      </List>
                    </Box>

                    <Box>
                      <Text fontWeight="semibold" fontSize="sm" color="green.600">Desired Outcomes:</Text>
                      <List spacing={1} fontSize="sm">
                        {persona.desired_outcomes.slice(0, compact ? 2 : 3).map((outcome, i) => (
                          <ListItem key={i}>
                            <ListIcon as={CheckCircleIcon} color="green.400" />
                            {outcome}
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  </VStack>
                </Box>
              ))}
            </Grid>
          </CardBody>
        </Card>
      )}

      {/* Competitive Advantages */}
      {analysis.competitive_advantages && analysis.competitive_advantages.length > 0 && (
        <Card bg={cardBg} shadow="lg" borderWidth="1px" borderColor={borderColor} w="full">
          <CardHeader>
            <HStack>
              <Icon as={FiTrendingUp} color="orange.500" />
              <Heading size="md">Competitive Advantages</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <Wrap spacing={2}>
              {analysis.competitive_advantages.map((advantage, index) => (
                <WrapItem key={index}>
                  <Tag size="lg" colorScheme="orange" borderRadius="full">
                    <TagLabel>{advantage}</TagLabel>
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </CardBody>
        </Card>
      )}

      {/* Tech Stack */}
      {analysis.tech_stack && analysis.tech_stack.length > 0 && (
        <Card bg={cardBg} shadow="lg" borderWidth="1px" borderColor={borderColor} w="full">
          <CardHeader>
            <HStack>
              <Icon as={FiSettings} color="gray.500" />
              <Heading size="md">Technology Stack</Heading>
            </HStack>
          </CardHeader>
          <CardBody>
            <Wrap spacing={2}>
              {analysis.tech_stack.map((tech, index) => (
                <WrapItem key={index}>
                  <Tag size="md" colorScheme="gray" borderRadius="full">
                    <TagLabel>{tech}</TagLabel>
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </CardBody>
        </Card>
      )}

      {/* Expandable Sections */}
      {((analysis.case_studies && analysis.case_studies.length > 0) ||
        (analysis.lead_magnets && analysis.lead_magnets.length > 0) ||
        (analysis.social_proof && analysis.social_proof.testimonials && analysis.social_proof.testimonials.length > 0)) && (
        <Card bg={cardBg} shadow="lg" borderWidth="1px" borderColor={borderColor} w="full">
          <CardBody>
            <Accordion allowMultiple>
              {/* Case Studies */}
              {analysis.case_studies && analysis.case_studies.length > 0 && (
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Icon as={FiBookOpen} color="blue.500" />
                        <Heading size="md">Case Studies ({analysis.case_studies.length})</Heading>
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={4} align="stretch">
                      {analysis.case_studies.map((study, index) => (
                        <Box key={index} p={4} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                          <VStack align="start" spacing={2}>
                            <Heading size="sm" color="blue.700">{study.title}</Heading>
                            <Badge colorScheme="blue">{study.industry}</Badge>
                            <Text fontSize="sm"><strong>Challenge:</strong> {study.challenge}</Text>
                            <Text fontSize="sm"><strong>Solution:</strong> {study.solution}</Text>
                            {study.results.length > 0 && (
                              <Box>
                                <Text fontSize="sm" fontWeight="semibold">Results:</Text>
                                <List spacing={1} fontSize="sm">
                                  {study.results.map((result, i) => (
                                    <ListItem key={i}>
                                      <ListIcon as={CheckCircleIcon} color="green.500" />
                                      {result}
                                    </ListItem>
                                  ))}
                                </List>
                              </Box>
                            )}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              )}

              {/* Lead Magnets */}
              {analysis.lead_magnets && analysis.lead_magnets.length > 0 && (
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Icon as={FiGift} color="purple.500" />
                        <Heading size="md">Lead Magnets ({analysis.lead_magnets.length})</Heading>
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
                      {analysis.lead_magnets.map((magnet, index) => (
                        <Box key={index} p={4} bg="purple.50" borderRadius="md" border="1px" borderColor="purple.200">
                          <VStack align="start" spacing={2}>
                            <HStack>
                              <Heading size="sm" color="purple.700">{magnet.title}</Heading>
                              <Badge colorScheme="purple">{magnet.type}</Badge>
                            </HStack>
                            <Text fontSize="sm">{magnet.description}</Text>
                            <Text fontSize="sm"><strong>Target:</strong> {magnet.target_audience}</Text>
                            <Text fontSize="sm"><strong>CTA:</strong> {magnet.call_to_action}</Text>
                          </VStack>
                        </Box>
                      ))}
                    </Grid>
                  </AccordionPanel>
                </AccordionItem>
              )}

              {/* Social Proof */}
              {analysis.social_proof && ((analysis.social_proof.testimonials && analysis.social_proof.testimonials.length > 0) || (analysis.social_proof.metrics && analysis.social_proof.metrics.length > 0)) && (
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      <HStack>
                        <Icon as={FiStar} color="yellow.500" />
                        <Heading size="md">Social Proof</Heading>
                      </HStack>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <VStack spacing={4} align="stretch">
                      {/* Testimonials */}
                      {analysis.social_proof.testimonials && analysis.social_proof.testimonials.length > 0 && (
                        <Box>
                          <Heading size="sm" mb={3}>Testimonials</Heading>
                          <VStack spacing={3}>
                            {analysis.social_proof.testimonials.map((testimonial, index) => (
                              <Box key={index} p={3} bg="yellow.50" borderRadius="md" border="1px" borderColor="yellow.200" w="full">
                                <Text fontSize="sm" fontStyle="italic">"{testimonial.quote}"</Text>
                                <Text fontSize="xs" mt={2} color="gray.600">
                                  - {testimonial.author}
                                  {testimonial.company && `, ${testimonial.company}`}
                                  {testimonial.position && ` (${testimonial.position})`}
                                </Text>
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      )}

                      {/* Metrics */}
                      {analysis.social_proof.metrics && analysis.social_proof.metrics.length > 0 && (
                        <Box>
                          <Heading size="sm" mb={3}>Key Metrics</Heading>
                          <Wrap spacing={2}>
                            {analysis.social_proof.metrics.map((metric, index) => (
                              <WrapItem key={index}>
                                <Tag size="lg" colorScheme="green">
                                  <TagLabel>{metric.metric}: {metric.value}</TagLabel>
                                </Tag>
                              </WrapItem>
                            ))}
                          </Wrap>
                        </Box>
                      )}
                    </VStack>
                  </AccordionPanel>
                </AccordionItem>
              )}
            </Accordion>
          </CardBody>
        </Card>
      )}
    </VStack>
  )
}

export default AnalysisDisplay