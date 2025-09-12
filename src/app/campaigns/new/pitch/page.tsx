'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Card,
  CardHeader,
  CardBody,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  IconButton,
  Button,
  Badge,
  Heading,
  useColorModeValue,
  Spinner,
  Divider,
  Collapse,
  SimpleGrid
} from '@chakra-ui/react'
import { keyframes } from '@emotion/react'
import { FiPlus, FiTrash2, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { GradientButton } from '@/components/ui/GradientButton'
import { CampaignStepper } from '@/components/ui/CampaignStepper'
import { AnalysisDisplay } from '@/components/AnalysisDisplay'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useOrganization } from '@clerk/nextjs'

// Enhanced animations
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
`

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3); }
  50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.5); }
`

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`

interface PainPoint {
  id: string
  title: string
  description: string
}

interface ProofPoint {
  id: string
  title: string
  description: string
}

interface CoachingPoint {
  id: string
  instruction: string
  editable: boolean
}

interface WebsiteAnalysis {
  summary: string
  valueProposition: string
  features: string[]
  painPoints: PainPoint[]
  proofPoints: ProofPoint[]
}

// ICP Analysis interface for comprehensive analysis data
interface ICPAnalysis {
  core_offer: string
  industry: string
  business_model: string
  icp_summary: string
  target_personas: Array<{
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
  }>
  case_studies: Array<{
    title: string
    industry: string
    challenge: string
    solution: string
    results: string[]
    metrics?: string
    client_info?: string
  }>
  lead_magnets: Array<{
    title: string
    type: string
    description: string
    target_audience: string
    call_to_action: string
    url?: string
  }>
  competitive_advantages: string[]
  tech_stack: string[]
  social_proof: {
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

export default function PitchPage() {
  const router = useRouter()
  const { user } = useUser()
  const { organization } = useOrganization()
  const [selectedAgent, setSelectedAgent] = useState<string>('ai-sdr')

  // Load selected agent from localStorage
  useEffect(() => {
    const savedAgent = localStorage.getItem('selectedAgent')
    if (savedAgent) {
      setSelectedAgent(savedAgent)
    }
  }, [])

  // Agent-specific page configurations
  const agentPageConfigs = {
    'ai-sdr': {
      pageTitle: 'Create Your Pitch',
      pageDescription: 'Analyze your website and create compelling messaging that converts prospects into customers',
      sections: [
        { id: 'website', title: 'Website Analysis', emoji: '🌐' },
        { id: 'value-prop', title: 'Your Value Proposition', emoji: '🚀' },
        { id: 'pain-points', title: 'Customer Pain Points', emoji: '😓' },
        { id: 'proof-points', title: 'Success Stories & Proof', emoji: '📈' }
      ]
    },
    'ai-recruiter': {
      pageTitle: 'Create Your Job Offer',
      pageDescription: 'Add job details and create compelling recruitment messages that attract top candidates',
      sections: [
        { id: 'job-details', title: 'Job Details', emoji: '📋' },
        { id: 'job-requirements', title: 'Job Requirements', emoji: '✅' },
        { id: 'benefits-perks', title: 'Benefits & Perks', emoji: '🎁' },
        { id: 'company-culture', title: 'Company Culture', emoji: '🏢' }
      ]
    },
    'ai-marketer': {
      pageTitle: 'Create Your Marketing Campaign',
      pageDescription: 'Define your campaign details and create compelling marketing messages that engage your audience',
      sections: [
        { id: 'campaign-goals', title: 'Campaign Goals', emoji: '🎯' },
        { id: 'value-prop', title: 'Value Proposition', emoji: '💎' },
        { id: 'audience-pain', title: 'Audience Pain Points', emoji: '💡' },
        { id: 'social-proof', title: 'Social Proof', emoji: '⭐' }
      ]
    }
  }

  const currentConfig = agentPageConfigs[selectedAgent as keyof typeof agentPageConfigs] || agentPageConfigs['ai-sdr']

  // Enhanced color mode values with glassmorphism
  const cardBg = useColorModeValue('rgba(255, 255, 255, 0.9)', 'rgba(26, 32, 44, 0.9)')
  const glassBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
  const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')
  const grayBg = useColorModeValue('rgba(247, 250, 252, 0.9)', 'rgba(45, 55, 72, 0.9)')
  const gradientBg = useColorModeValue(
    'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    'linear-gradient(135deg, #4c1d95 0%, #5b21b6 50%, #7c3aed 100%)'
  )
  const accentGradient = useColorModeValue(
    'linear-gradient(45deg, #667eea, #764ba2)',
    'linear-gradient(45deg, #5b21b6, #7c3aed)'
  )

  // Enhanced color values for specific sections
  const yellowBg = useColorModeValue('rgba(255, 235, 59, 0.1)', 'rgba(255, 193, 7, 0.1)')
  const blueBg = useColorModeValue('rgba(33, 150, 243, 0.1)', 'rgba(33, 150, 243, 0.1)')
  const greenBg = useColorModeValue('rgba(76, 175, 80, 0.1)', 'rgba(76, 175, 80, 0.1)')
  const yellowBorderColor = useColorModeValue('rgba(255, 235, 59, 0.3)', 'rgba(255, 193, 7, 0.3)')
  const blueBorderColor = useColorModeValue('rgba(33, 150, 243, 0.3)', 'rgba(33, 150, 243, 0.3)')
  const greenBorderColor = useColorModeValue('rgba(76, 175, 80, 0.3)', 'rgba(76, 175, 80, 0.3)')

  // Shared state management
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [showAnalysisSection, setShowAnalysisSection] = useState(false)

  // AI SDR specific state
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [websiteAnalysis, setWebsiteAnalysis] = useState<WebsiteAnalysis | null>(null)
  const [icpAnalysis, setICPAnalysis] = useState<ICPAnalysis | null>(null)
  const [offeringDescription, setOfferingDescription] = useState('')
  const [painPoints, setPainPoints] = useState<PainPoint[]>([])
  const [proofPoints, setProofPoints] = useState<ProofPoint[]>([])

  // AI Recruiter specific state
  const [jobPostingUrl, setJobPostingUrl] = useState('')
  const [isParsingJob, setIsParsingJob] = useState(false)
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobRequirements, setJobRequirements] = useState<string[]>([''])
  const [jobBenefits, setJobBenefits] = useState<string[]>([''])
  const [salaryRange, setSalaryRange] = useState('')
  const [jobLocation, setJobLocation] = useState('')
  const [companyCulture, setCompanyCulture] = useState('')
  const [jobType, setJobType] = useState('')

  // AI Marketer specific state  
  const [campaignGoals, setCampaignGoals] = useState('')
  const [marketingValueProp, setMarketingValueProp] = useState('')
  const [audiencePainPoints, setAudiencePainPoints] = useState<string[]>([''])
  const [socialProof, setSocialProof] = useState<string[]>([''])

  // Universal coaching points that adapt based on agent
  const [coachingPoints, setCoachingPoints] = useState<CoachingPoint[]>([])

  // Initialize coaching points based on selected agent
  useEffect(() => {
    const agentCoachingPoints = {
      'ai-sdr': [
        { id: '1', instruction: 'DO NOT ASK ANY QUESTIONS', editable: false },
        { id: '2', instruction: 'Start all emails with "Hello" or "Hi" and say the prospect\'s first name.', editable: false },
        { id: '3', instruction: 'Mention the name of the lead\'s company once per email.', editable: false },
        { id: '4', instruction: 'Break the email into multiple paragraphs. NO MORE THAN 3. Always isolate the Call To Action.', editable: false },
        { id: '5', instruction: 'Do not come off as assumptive of the prospect\'s situation.', editable: false },
      ],
      'ai-recruiter': [
        { id: '1', instruction: 'Address candidates by their first name', editable: false },
        { id: '2', instruction: 'Mention the specific job title and company name', editable: false },
        { id: '3', instruction: 'Highlight 2-3 key benefits or growth opportunities', editable: false },
        { id: '4', instruction: 'Include next steps (apply, schedule call, etc.)', editable: false },
        { id: '5', instruction: 'Keep tone professional but friendly and encouraging', editable: false },
      ],
      'ai-marketer': [
        { id: '1', instruction: 'Personalize with company name and relevant pain points', editable: false },
        { id: '2', instruction: 'Lead with value proposition in first paragraph', editable: false },
        { id: '3', instruction: 'Include social proof or case study reference', editable: false },
        { id: '4', instruction: 'End with clear call-to-action', editable: false },
        { id: '5', instruction: 'Keep subject lines under 50 characters', editable: false },
      ]
    }
    
    const points = agentCoachingPoints[selectedAgent as keyof typeof agentCoachingPoints] || agentCoachingPoints['ai-sdr']
    setCoachingPoints(points)
  }, [selectedAgent])

  // Email coaching functions
  const [emailCoachingPoints, setEmailCoachingPoints] = useState<CoachingPoint[]>([
    { id: 'email-1', instruction: 'Keep subject lines under 50 characters for better open rates', editable: true },
    { id: 'email-2', instruction: 'End with a single, clear call-to-action', editable: true },
  ])
  // Save pitch data to localStorage with validation
  const savePitchDataToLocalStorage = (pitchData) => {
    try {
      if (pitchData && typeof pitchData === 'object') {
        localStorage.setItem('campaignPitchData', JSON.stringify(pitchData));
        console.log('✅ Saved pitchData to localStorage:', pitchData);
      } else {
        console.warn('Invalid pitchData structure, not saving to localStorage:', pitchData);
      }
    } catch (error) {
      console.error('Error saving campaignPitchData to localStorage:', error);
    }
  };

  //Load old data if any
useEffect(() => {
    // Try to load from localStorage first
    const localData = JSON.parse(localStorage.getItem('campaignPitchData') || '{}');
    let loadedFromLocal = false;

    if (localData && typeof localData === 'object' && Object.keys(localData).length > 0) {
        if (localData.websiteUrl) setWebsiteUrl(localData.websiteUrl);
        if (localData.websiteAnalysis) setWebsiteAnalysis(localData.websiteAnalysis);
        if (localData.offeringDescription) setOfferingDescription(localData.offeringDescription);
        if (Array.isArray(localData.painPoints)) setPainPoints(localData.painPoints);
        if (Array.isArray(localData.proofPoints)) setProofPoints(localData.proofPoints);
        if (Array.isArray(localData.coachingPoints)) setCoachingPoints(localData.coachingPoints);
        if (Array.isArray(localData.emailCoachingPoints)) setEmailCoachingPoints(localData.emailCoachingPoints);
        loadedFromLocal = true;
        setIsLoadingProfile(false);
    }

    // If no local data, load from backend
    if (!loadedFromLocal && user) {
        const loadExistingAnalysis = async () => {
            try {
                const response = await fetch('/api/user/profile');
                if (response.ok) {
                    const data = await response.json();
                    // UPDATED: Use latestAnalysis instead of profile.icp
                    if (data.latestAnalysis) {
                        console.log('✅ Found latest analysis in profile response:', {
                            analysisId: data.latestAnalysis.id,
                            website: data.latestAnalysis.website_url,
                            coreOffer: data.latestAnalysis.core_offer,
                            confidence: data.latestAnalysis.confidence_score
                        })
                        
                        setICPAnalysis(data.latestAnalysis);
                        setWebsiteAnalysis(data.latestAnalysis);
                        setWebsiteUrl(data.latestAnalysis.website_url || data.profile?.website_url || '');
                        setOfferingDescription(data.latestAnalysis.core_offer || '');
                        setShowAnalysisSection(true);

                        // Extract pain points and proof points from personas if available
                        if (data.latestAnalysis.target_personas && data.latestAnalysis.target_personas.length > 0) {
                            const allPainPoints: PainPoint[] = [];
                            const allProofPoints: ProofPoint[] = [];
                            data.latestAnalysis.target_personas.forEach((persona: any, personaIndex: number) => {
                                if (persona.pain_points) {
                                    persona.pain_points.forEach((point: string, index: number) => {
                                        allPainPoints.push({
                                            id: `persona-${personaIndex}-pain-${index}`,
                                            title: `Pain Point ${allPainPoints.length + 1}`,
                                            description: point
                                        });
                                    });
                                }
                                if (persona.desired_outcomes) {
                                    persona.desired_outcomes.forEach((outcome: string, index: number) => {
                                        allProofPoints.push({
                                            id: `persona-${personaIndex}-outcome-${index}`,
                                            title: `Success Outcome ${allProofPoints.length + 1}`,
                                            description: outcome
                                        });
                                    });
                                }
                            });
                            if (allPainPoints.length > 0) setPainPoints(allPainPoints);
                            if (allProofPoints.length > 0) setProofPoints(allProofPoints);
                        }
                        
                        console.log('✅ [LOADED FROM LATEST ANALYSIS] Analysis data loaded:', {
                            hasICPAnalysis: !!data.latestAnalysis,
                            coreOffer: data.latestAnalysis.core_offer,
                            targetPersonasCount: data.latestAnalysis.target_personas?.length || 0
                        });
                    } else {
                        // Fallback to profile website_url if no analysis
                        setWebsiteUrl(data.profile?.website_url || '');
                        console.log('📋 No latest analysis found, using profile data only')
                    }
                }
            } catch (error) {
                console.error('Error loading existing analysis:', error);
            } finally {
                setIsLoadingProfile(false);
            }
        };
        loadExistingAnalysis();
    }
}, [user]);

  const handleAnalyzeWebsite = async () => {
    if (!websiteUrl.trim()) {
      console.log('Website URL required')
      return
    }

    // Add protocol if missing
    let urlToAnalyze = websiteUrl.trim()
    if (!urlToAnalyze.startsWith('http://') && !urlToAnalyze.startsWith('https://')) {
      urlToAnalyze = 'https://' + urlToAnalyze
    }

    setIsAnalyzing(true)
    setWebsiteAnalysis(null)
    setICPAnalysis(null)

    try {
      const response = await fetch('/api/analyze-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: urlToAnalyze }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to analyze website')
      }

      const data = await response.json()

      if (data.analysisId) {
        // Poll for results
        let pollCount = 0
        const maxPolls = 60 // 2 minutes timeout

        const pollForResults = async () => {
          try {
            pollCount++

            if (pollCount > maxPolls) {
              console.log('Pitch page polling timeout reached')
              setIsAnalyzing(false)
              console.log('Analysis timeout - took too long')
              return
            }
            const resultResponse = await fetch(`/api/analyze-site?id=${data.analysisId}`)
            if (resultResponse.ok) {
              const resultData = await resultResponse.json()

              console.log('=== PITCH PAGE POLLING DEBUG ===')
              console.log('Result data:', resultData)
              console.log('Result data status:', resultData.status)
              console.log('Analysis status:', resultData.analysis?.status)
              console.log('===============================')

              if (resultData.success && resultData.analysis && resultData.analysis.status === 'completed') {
                console.log('=== ANALYSIS DATA DEBUG ===')
                console.log('Full analysis data:', resultData.analysis)
                console.log('Target personas:', resultData.analysis.target_personas)
                console.log('Target personas length:', resultData.analysis.target_personas?.length)
                console.log('==========================')

                setICPAnalysis(resultData.analysis)
                setWebsiteAnalysis(resultData.analysis) // ✅ FIX: Set websiteAnalysis for saving
                setOfferingDescription(resultData.analysis.core_offer || '')
                setShowAnalysisSection(true)

                console.log('✅ [ANALYSIS COMPLETE] Website analysis data set:', {
                  hasICPAnalysis: !!resultData.analysis,
                  hasWebsiteAnalysis: !!resultData.analysis,
                  analysisKeys: Object.keys(resultData.analysis || {}),
                  coreOffer: resultData.analysis?.core_offer,
                  targetPersonasCount: resultData.analysis?.target_personas?.length || 0
                })

                // CRITICAL FIX: Clear localStorage to prevent stale data issues
                localStorage.removeItem('campaignPitchData')
                console.log('🧹 Cleared localStorage to prevent stale data from showing')

                // CRITICAL FIX: Also refresh profile data to ensure consistency
                try {
                  console.log('🔄 Refreshing user profile data after analysis completion')
                  const profileResponse = await fetch('/api/user/profile')
                  if (profileResponse.ok) {
                    const profileData = await profileResponse.json()
                    console.log('✅ Profile refreshed, latest analysis integrated:', {
                      profileUrl: profileData.profile?.website_url,
                      hasICP: !!profileData.profile?.icp,
                      coreOffer: profileData.profile?.icp?.core_offer
                    })
                  }
                } catch (profileError) {
                  console.warn('⚠️ Could not refresh profile data:', profileError)
                }

                // Extract pain points and proof points from personas
                if (resultData.analysis.target_personas && resultData.analysis.target_personas.length > 0) {
                  const allPainPoints: PainPoint[] = []
                  const allProofPoints: ProofPoint[] = []

                  resultData.analysis.target_personas.forEach((persona: any, personaIndex: number) => {
                    if (persona.pain_points) {
                      persona.pain_points.forEach((point: string, index: number) => {
                        allPainPoints.push({
                          id: `persona-${personaIndex}-pain-${index}`,
                          title: `Pain Point ${allPainPoints.length + 1}`,
                          description: point
                        })
                      })
                    }

                    if (persona.desired_outcomes) {
                      persona.desired_outcomes.forEach((outcome: string, index: number) => {
                        allProofPoints.push({
                          id: `persona-${personaIndex}-outcome-${index}`,
                          title: `Success Outcome ${allProofPoints.length + 1}`,
                          description: outcome
                        })
                      })
                    }
                  })

                  console.log('Extracted pain points:', allPainPoints)
                  console.log('Extracted proof points:', allProofPoints)
                  setPainPoints(allPainPoints)
                  setProofPoints(allProofPoints)
                } else {
                  console.log('No target_personas found or empty. Checking for alternative data structures...')

                  // Check if there are pain points in other fields
                  const alternativePainPoints: PainPoint[] = []
                  const alternativeProofPoints: ProofPoint[] = []

                  // Check case studies for proof points
                  if (resultData.analysis.case_studies && Array.isArray(resultData.analysis.case_studies)) {
                    resultData.analysis.case_studies.forEach((caseStudy: any, index: number) => {
                      if (caseStudy.results && Array.isArray(caseStudy.results)) {
                        caseStudy.results.forEach((result: string, resultIndex: number) => {
                          alternativeProofPoints.push({
                            id: `case-study-${index}-result-${resultIndex}`,
                            title: `Case Study Result ${alternativeProofPoints.length + 1}`,
                            description: result
                          })
                        })
                      }
                    })
                  }

                  // Check competitive advantages for proof points
                  if (resultData.analysis.competitive_advantages && Array.isArray(resultData.analysis.competitive_advantages)) {
                    resultData.analysis.competitive_advantages.forEach((advantage: string, index: number) => {
                      alternativeProofPoints.push({
                        id: `advantage-${index}`,
                        title: `Competitive Advantage ${alternativeProofPoints.length + 1}`,
                        description: advantage
                      })
                    })
                  }

                  // Check social proof testimonials for proof points
                  if (resultData.analysis.social_proof?.testimonials && Array.isArray(resultData.analysis.social_proof.testimonials)) {
                    resultData.analysis.social_proof.testimonials.forEach((testimonial: any, index: number) => {
                      alternativeProofPoints.push({
                        id: `testimonial-${index}`,
                        title: `Client Testimonial ${alternativeProofPoints.length + 1}`,
                        description: testimonial.quote
                      })
                    })
                  }

                  console.log('Alternative pain points found:', alternativePainPoints.length)
                  console.log('Alternative proof points found:', alternativeProofPoints.length)

                  if (alternativeProofPoints.length > 0) {
                    setProofPoints(alternativeProofPoints)
                  }
                  if (alternativePainPoints.length > 0) {
                    setPainPoints(alternativePainPoints)
                  }
                }

                console.log('Analysis complete - website analyzed successfully')

                setIsAnalyzing(false)
              } else if (resultData.analysis && resultData.analysis.status === 'failed') {
                throw new Error('Analysis failed')
              } else {
                // Still processing, continue polling
                setTimeout(pollForResults, 2000)
              }
            } else {
              throw new Error('Failed to fetch analysis results')
            }
          } catch (error) {
            console.error('Error polling for results:', error)
            setIsAnalyzing(false)
            console.log('Analysis error:', error instanceof Error ? error.message : 'Failed to complete analysis')
          }
        }

        // Start polling
        setTimeout(pollForResults, 1000)

        console.log('Analysis started - analyzing website...')
      } else {
        throw new Error('Failed to start analysis')
      }
    } catch (error) {
      console.error('Error analyzing website:', error)
      setIsAnalyzing(false)
      console.log('Analysis error:', error instanceof Error ? error.message : 'Failed to analyze website')
    }
  }

  const addPainPoint = () => {
    const newId = Date.now().toString()
    setPainPoints([...painPoints, {
      id: newId,
      title: '',
      description: ''
    }])
  }

  const updatePainPoint = (id: string, field: 'title' | 'description', value: string) => {
    setPainPoints(painPoints.map(point =>
      point.id === id ? { ...point, [field]: value } : point
    ))
  }

  const removePainPoint = (id: string) => {
    setPainPoints(painPoints.filter(point => point.id !== id))
  }

  const addProofPoint = () => {
    const newId = Date.now().toString()
    setProofPoints([...proofPoints, {
      id: newId,
      title: '',
      description: ''
    }])
  }

  const updateProofPoint = (id: string, field: 'title' | 'description', value: string) => {
    setProofPoints(proofPoints.map(point =>
      point.id === id ? { ...point, [field]: value } : point
    ))
  }

  const removeProofPoint = (id: string) => {
    setProofPoints(proofPoints.filter(point => point.id !== id))
  }

  const addCoachingPoint = () => {
    const newId = Date.now().toString()
    setCoachingPoints([...coachingPoints, {
      id: newId,
      instruction: '',
      editable: true
    }])
  }

  const updateCoachingPoint = (id: string, instruction: string) => {
    setCoachingPoints(coachingPoints.map(point =>
      point.id === id ? { ...point, instruction } : point
    ))
  }

  const removeCoachingPoint = (id: string) => {
    setCoachingPoints(coachingPoints.filter(point => point.id !== id))
  }

  const addEmailCoachingPoint = () => {
    const newId = Date.now().toString()
    setEmailCoachingPoints([...emailCoachingPoints, {
      id: newId,
      instruction: '',
      editable: true
    }])
  }

  const updateEmailCoachingPoint = (id: string, instruction: string) => {
    setEmailCoachingPoints(emailCoachingPoints.map(point =>
      point.id === id ? { ...point, instruction } : point
    ))
  }

  const removeEmailCoachingPoint = (id: string) => {
    setEmailCoachingPoints(emailCoachingPoints.filter(point => point.id !== id))
  }

  const saveDraftToBackend = async (step: string) => {
    try {
      const draftBody = {
        campaignName: 'Untitled Campaign',
        websiteUrl,
        websiteAnalysis,
        offeringDescription,
        painPoints,
        proofPoints,
        coachingPoints,
        emailBodyCoaching: emailCoachingPoints,
        step
      }

      const response = await fetch('/api/campaigns/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(draftBody)
      })

      if (!response.ok) {
        const errText = await response.text()
        console.error('❌ [PITCH SAVE] Save failed:', errText)
        throw new Error(errText || 'Failed to save draft')
      }

      const data = await response.json()
      console.log('✅ [PITCH SAVE] Save successful:', data)
      return data
    } catch (error) {
      console.error('💥 [PITCH SAVE] Error saving draft:', error)
      throw error
    }
  }

  const handleContinueToOutreach = async () => {
    // Agent-specific validation
    if (selectedAgent === 'ai-recruiter') {
      if (!jobTitle.trim() || !jobDescription.trim()) {
        console.log('Incomplete job information - need title and description')
        return
      }
    } else if (selectedAgent === 'ai-marketer') {
      if (!campaignGoals.trim() || !marketingValueProp.trim()) {
        console.log('Incomplete campaign information - need goals and value proposition')
        return
      }
    } else {
      // AI SDR validation
      if (!offeringDescription.trim() && painPoints.length === 0 && proofPoints.length === 0) {
        console.log('Incomplete information - need offering description, pain point, or proof point')
        return
      }
    }

    const pitchData = {
      selectedAgent,
      // AI SDR data
      websiteUrl,
      websiteAnalysis,
      offeringDescription,
      painPoints,
      proofPoints,
      // AI Recruiter data
      jobPostingUrl,
      jobTitle,
      jobDescription,
      jobRequirements: jobRequirements.filter(req => req.trim()),
      jobBenefits: jobBenefits.filter(benefit => benefit.trim()),
      salaryRange,
      jobLocation,
      companyCulture,
      jobType,
      // AI Marketer data
      campaignGoals,
      marketingValueProp,
      audiencePainPoints: audiencePainPoints.filter(point => point.trim()),
      socialProof: socialProof.filter(proof => proof.trim()),
      // Universal
      coachingPoints,
      emailCoachingPoints
    }

    console.log('💾 [PITCH NAVIGATE] Pitch data prepared for localStorage:', {
      websiteUrl: pitchData.websiteUrl,
      hasWebsiteAnalysis: !!pitchData.websiteAnalysis,
      websiteAnalysisKeys: pitchData.websiteAnalysis ? Object.keys(pitchData.websiteAnalysis) : 'null',
      websiteAnalysisValue: pitchData.websiteAnalysis,
      offeringDescriptionLength: pitchData.offeringDescription?.length || 0,
      painPointsCount: pitchData.painPoints?.length || 0,
      proofPointsCount: pitchData.proofPoints?.length || 0,
      coachingPointsCount: pitchData.coachingPoints?.length || 0,
      emailCoachingPointsCount: pitchData.emailCoachingPoints?.length || 0
    })

    savePitchDataToLocalStorage(pitchData)

    try {
      await saveDraftToBackend('pitch')
      const agentNames = { 'ai-sdr': 'pitch', 'ai-recruiter': 'job offer', 'ai-marketer': 'marketing campaign' }
      const configType = agentNames[selectedAgent as keyof typeof agentNames] || 'campaign'
      
      console.log(`${configType} data saved successfully`)
    } catch (error) {
      console.error('❌ [PITCH NAVIGATE] Failed to save draft:', error)
      console.log('Failed to save draft:', error instanceof Error ? error.message : 'Unknown error occurred')
    }

    console.log('🔄 [PITCH NAVIGATE] Navigating to outreach page in 500ms')
    setTimeout(() => {
      router.push('/campaigns/new/outreach')
    }, 500)
  }

  const handleSaveDraft = async () => {
    const pitchData = {
      selectedAgent,
      // AI SDR data
      websiteUrl,
      websiteAnalysis,
      offeringDescription,
      painPoints,
      proofPoints,
      // AI Recruiter data
      jobPostingUrl,
      jobTitle,
      jobDescription,
      jobRequirements: jobRequirements.filter(req => req.trim()),
      jobBenefits: jobBenefits.filter(benefit => benefit.trim()),
      salaryRange,
      jobLocation,
      companyCulture,
      jobType,
      // AI Marketer data
      campaignGoals,
      marketingValueProp,
      audiencePainPoints: audiencePainPoints.filter(point => point.trim()),
      socialProof: socialProof.filter(proof => proof.trim()),
      // Universal
      coachingPoints,
      emailCoachingPoints
    }

    savePitchDataToLocalStorage(pitchData)

    try {
      await saveDraftToBackend('pitch')
      const agentNames = { 'ai-sdr': 'pitch', 'ai-recruiter': 'job offer', 'ai-marketer': 'marketing campaign' }
      const configType = agentNames[selectedAgent as keyof typeof agentNames] || 'pitch'
      
      console.log(`Draft saved - ${configType} data saved securely`)
    } catch (error) {
      console.log('Failed to save draft:', error instanceof Error ? error.message : 'Unknown error occurred')
    }
  }

  const handleBackToTargeting = () => {
    router.push('/campaigns/new/targeting/b2b-filters')
  }

  // Debugging hooks
  useEffect(() => {
    console.log("Updated websiteUrl:", websiteUrl);
  }, [websiteUrl]);

  useEffect(() => {
    console.log("Updated websiteAnalysis:", websiteAnalysis);
  }, [websiteAnalysis]);

  useEffect(() => {
    console.log("Updated offeringDescription:", offeringDescription);
  }, [offeringDescription]);

  useEffect(() => {
    console.log("Updated painPoints:", painPoints);
  }, [painPoints]);

  useEffect(() => {
    console.log("Updated proofPoints:", proofPoints);
  }, [proofPoints]);

  useEffect(() => {
    console.log("Updated coachingPoints:", coachingPoints);
  }, [coachingPoints]);

  useEffect(() => {
    console.log("Updated emailCoachingPoints:", emailCoachingPoints);
  }, [emailCoachingPoints]);

  if (isLoadingProfile) {
    return (
      <Box
        minH="100vh"
        bg={gradientBg}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="white" />
          <Text color="white" fontSize="lg">Loading your profile...</Text>
        </VStack>
      </Box>
    )
  }

  // Job posting URL parser function
  const parseJobPosting = async () => {
    if (!jobPostingUrl.trim()) return
    setIsParsingJob(true)
    try {
      const res = await fetch('/api/parse-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: jobPostingUrl })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Failed to parse job posting')
      }
      const job = data.job || {}
      if (job.title) setJobTitle(job.title)
      if (job.description) setJobDescription(job.description)
      if (Array.isArray(job.requirements)) setJobRequirements(job.requirements)
      if (Array.isArray(job.benefits)) setJobBenefits(job.benefits)
      if (job.salaryRange) setSalaryRange(job.salaryRange)
      if (job.jobLocation) setJobLocation(job.jobLocation)
      if (job.jobType) setJobType(job.jobType)
      if (job.companyCulture) setCompanyCulture(job.companyCulture)

      console.log('Job parsed successfully - extracted job details from posting')
    } catch (error) {
      console.log('Parse error:', error instanceof Error ? error.message : 'Could not parse the job posting. Please enter details manually.')
    } finally {
      setIsParsingJob(false)
    }
  }

  // Render functions for different agents
  const renderRecruiterContent = () => (
    <VStack spacing={8} align="stretch">
      {/* Job Details Section */}
      <Card
        bg={cardBg}
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor={borderColor}
        shadow="xl"
        borderRadius="2xl"
        overflow="hidden"
      >
        <CardHeader pb={3}>
          <HStack>
            <Badge colorScheme="green" px={3} py={1} borderRadius="full">
              📋 JOB DETAILS
            </Badge>
            <Heading size="lg" color="gray.800">
              Job Posting Information
            </Heading>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={4} align="stretch">
            {/* Job Posting URL */}
            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                Job Posting URL (Optional)
              </Text>
              <HStack>
                <Input
                  placeholder="Paste job posting URL to auto-fill details..."
                  value={jobPostingUrl}
                  onChange={(e) => setJobPostingUrl(e.target.value)}
                  bg={glassBg}
                  border="1px solid"
                  borderColor={borderColor}
                  _focus={{
                    borderColor: 'green.400',
                    boxShadow: `0 0 0 1px rgba(34, 197, 94, 0.4)`,
                  }}
                />
                <GradientButton
                  onClick={parseJobPosting}
                  isLoading={isParsingJob}
                  loadingText="Parsing..."
                  disabled={!jobPostingUrl.trim()}
                  leftIcon={<FiRefreshCw />}
                  variant="primary"
                >
                  Parse Job
                </GradientButton>
              </HStack>
            </Box>

            {/* Manual Job Details */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                  Job Title *
                </Text>
                <Input
                  placeholder="e.g., Senior Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  bg={glassBg}
                  border="1px solid"
                  borderColor={borderColor}
                  _focus={{
                    borderColor: 'green.400',
                    boxShadow: `0 0 0 1px rgba(34, 197, 94, 0.4)`,
                  }}
                />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                  Job Location
                </Text>
                <Input
                  placeholder="e.g., Remote, San Francisco, CA"
                  value={jobLocation}
                  onChange={(e) => setJobLocation(e.target.value)}
                  bg={glassBg}
                  border="1px solid"
                  borderColor={borderColor}
                  _focus={{
                    borderColor: 'green.400',
                    boxShadow: `0 0 0 1px rgba(34, 197, 94, 0.4)`,
                  }}
                />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                  Salary Range
                </Text>
                <Input
                  placeholder="e.g., $120K - $150K"
                  value={salaryRange}
                  onChange={(e) => setSalaryRange(e.target.value)}
                  bg={glassBg}
                  border="1px solid"
                  borderColor={borderColor}
                  _focus={{
                    borderColor: 'green.400',
                    boxShadow: `0 0 0 1px rgba(34, 197, 94, 0.4)`,
                  }}
                />
              </Box>
              <Box>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                  Job Type
                </Text>
                <Input
                  placeholder="e.g., Full-time, Contract, Remote"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                  bg={glassBg}
                  border="1px solid"
                  borderColor={borderColor}
                  _focus={{
                    borderColor: 'green.400',
                    boxShadow: `0 0 0 1px rgba(34, 197, 94, 0.4)`,
                  }}
                />
              </Box>
            </SimpleGrid>

            <Box>
              <Text fontSize="sm" fontWeight="medium" color="gray.700" mb={2}>
                Job Description *
              </Text>
              <Textarea
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                bg={glassBg}
                border="1px solid"
                borderColor={borderColor}
                minH="120px"
                _focus={{
                  borderColor: 'green.400',
                  boxShadow: `0 0 0 1px rgba(34, 197, 94, 0.4)`,
                }}
              />
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Job Requirements Section */}
      <Card
        bg={cardBg}
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor={borderColor}
        shadow="xl"
        borderRadius="2xl"
        overflow="hidden"
      >
        <CardHeader pb={3}>
          <HStack justify="space-between">
            <HStack>
              <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                ✅ REQUIREMENTS
              </Badge>
              <Heading size="md" color="gray.800">
                Job Requirements
              </Heading>
            </HStack>
            <IconButton
              aria-label="Add requirement"
              icon={<FiPlus />}
              onClick={() => setJobRequirements([...jobRequirements, ''])}
              colorScheme="blue"
              variant="ghost"
              size="sm"
            />
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={3} align="stretch">
            {jobRequirements.map((req, index) => (
              <HStack key={index}>
                <Text fontSize="xs" fontWeight="bold" color="blue.600" minW="16px">
                  {index + 1}
                </Text>
                <Input
                  placeholder={`Requirement ${index + 1} (e.g., 5+ years experience with React)`}
                  value={req}
                  onChange={(e) => {
                    const newReqs = [...jobRequirements]
                    newReqs[index] = e.target.value
                    setJobRequirements(newReqs)
                  }}
                  bg={glassBg}
                  border="1px solid"
                  borderColor={borderColor}
                  size="sm"
                />
                {jobRequirements.length > 1 && (
                  <IconButton
                    aria-label="Delete requirement"
                    icon={<FiTrash2 />}
                    onClick={() => setJobRequirements(jobRequirements.filter((_, i) => i !== index))}
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                  />
                )}
              </HStack>
            ))}
          </VStack>
        </CardBody>
      </Card>

      {/* Benefits & Perks Section */}
      <Card
        bg={cardBg}
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor={borderColor}
        shadow="xl"
        borderRadius="2xl"
        overflow="hidden"
      >
        <CardHeader pb={3}>
          <HStack justify="space-between">
            <HStack>
              <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
                🎁 BENEFITS
              </Badge>
              <Heading size="md" color="gray.800">
                Benefits & Perks
              </Heading>
            </HStack>
            <IconButton
              aria-label="Add benefit"
              icon={<FiPlus />}
              onClick={() => setJobBenefits([...jobBenefits, ''])}
              colorScheme="purple"
              variant="ghost"
              size="sm"
            />
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <VStack spacing={3} align="stretch">
            {jobBenefits.map((benefit, index) => (
              <HStack key={index}>
                <Text fontSize="xs" fontWeight="bold" color="purple.600" minW="16px">
                  {index + 1}
                </Text>
                <Input
                  placeholder={`Benefit ${index + 1} (e.g., Health insurance, Stock options)`}
                  value={benefit}
                  onChange={(e) => {
                    const newBenefits = [...jobBenefits]
                    newBenefits[index] = e.target.value
                    setJobBenefits(newBenefits)
                  }}
                  bg={glassBg}
                  border="1px solid"
                  borderColor={borderColor}
                  size="sm"
                />
                {jobBenefits.length > 1 && (
                  <IconButton
                    aria-label="Delete benefit"
                    icon={<FiTrash2 />}
                    onClick={() => setJobBenefits(jobBenefits.filter((_, i) => i !== index))}
                    colorScheme="red"
                    variant="ghost"
                    size="sm"
                  />
                )}
              </HStack>
            ))}
          </VStack>
        </CardBody>
      </Card>

      {/* Company Culture Section */}
      <Card
        bg={cardBg}
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor={borderColor}
        shadow="xl"
        borderRadius="2xl"
        overflow="hidden"
      >
        <CardHeader pb={3}>
          <HStack>
            <Badge colorScheme="orange" px={3} py={1} borderRadius="full">
              🏢 CULTURE
            </Badge>
            <Heading size="lg" color="gray.800">
              Company Culture
            </Heading>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <Textarea
            placeholder="Describe your company culture, work environment, and what makes your team special..."
            value={companyCulture}
            onChange={(e) => setCompanyCulture(e.target.value)}
            bg={glassBg}
            border="1px solid"
            borderColor={borderColor}
            minH="120px"
            _focus={{
              borderColor: 'orange.400',
              boxShadow: `0 0 0 1px rgba(249, 115, 22, 0.4)`,
            }}
          />
        </CardBody>
      </Card>
    </VStack>
  )

  const renderMarketerContent = () => (
    <VStack spacing={8} align="stretch">
      {/* Campaign Goals Section */}
      <Card
        bg={cardBg}
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor={borderColor}
        shadow="xl"
        borderRadius="2xl"
        overflow="hidden"
      >
        <CardHeader pb={3}>
          <HStack>
            <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
              🎯 GOALS
            </Badge>
            <Heading size="lg" color="gray.800">
              Campaign Goals
            </Heading>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <Textarea
            placeholder="What do you want to achieve with this marketing campaign? (e.g., increase brand awareness, generate leads, drive product adoption)"
            value={campaignGoals}
            onChange={(e) => setCampaignGoals(e.target.value)}
            bg={glassBg}
            border="1px solid"
            borderColor={borderColor}
            minH="100px"
            _focus={{
              borderColor: 'blue.400',
              boxShadow: `0 0 0 1px rgba(59, 130, 246, 0.4)`,
            }}
          />
        </CardBody>
      </Card>

      {/* Value Proposition Section */}
      <Card
        bg={cardBg}
        backdropFilter="blur(10px)"
        border="1px solid"
        borderColor={borderColor}
        shadow="xl"
        borderRadius="2xl"
        overflow="hidden"
      >
        <CardHeader pb={3}>
          <HStack>
            <Badge colorScheme="purple" px={3} py={1} borderRadius="full">
              💎 VALUE PROP
            </Badge>
            <Heading size="lg" color="gray.800">
              Value Proposition
            </Heading>
          </HStack>
        </CardHeader>
        <CardBody pt={0}>
          <Textarea
            placeholder="What unique value does your product/service provide to your target audience?"
            value={marketingValueProp}
            onChange={(e) => setMarketingValueProp(e.target.value)}
            bg={glassBg}
            border="1px solid"
            borderColor={borderColor}
            minH="120px"
            _focus={{
              borderColor: 'purple.400',
              boxShadow: `0 0 0 1px rgba(147, 51, 234, 0.4)`,
            }}
          />
        </CardBody>
      </Card>
    </VStack>
  )

  const renderSDRContent = () => (
    <>
      {/* Existing SDR content will be rendered here */}
    </>
  )

  return (
    <Box
      minH="100vh"
      bg={gradientBg}
      position="relative"
      overflow="hidden"
    >
      {/* Animated background elements */}
      <Box
        position="absolute"
        top="8%"
        right="12%"
        w="280px"
        h="280px"
        borderRadius="50%"
        bg={accentGradient}
        opacity={0.1}
        animation={`${float} 8s ease-in-out infinite`}
        zIndex={0}
      />
      <Box
        position="absolute"
        bottom="15%"
        left="8%"
        w="220px"
        h="220px"
        borderRadius="50%"
        bg={accentGradient}
        opacity={0.08}
        animation={`${float} 10s ease-in-out infinite reverse`}
        zIndex={0}
      />

      <Container maxW="7xl" py={8} position="relative" zIndex={1}>
        <VStack spacing={8} align="stretch">
          {/* Header with Campaign Stepper */}
          <CampaignStepper currentStep={1} />

          {/* Page Title */}
          <Box textAlign="center" mb={8}>
            <Heading
              as="h1"
              size="2xl"
              mb={4}
              bgGradient="linear(to-r, white, purple.100)"
              bgClip="text"
              fontWeight="800"
              letterSpacing="-0.02em"
              animation={`${glow} 2s ease-in-out infinite`}
            >
              {currentConfig.pageTitle}
            </Heading>
            <Text
              fontSize="xl"
              color="whiteAlpha.900"
              fontWeight="500"
              maxW="2xl"
              mx="auto"
            >
              {currentConfig.pageDescription}
            </Text>
          </Box>

          {/* Agent-specific content */}
          {selectedAgent === 'ai-recruiter' && renderRecruiterContent()}
          {selectedAgent === 'ai-marketer' && renderMarketerContent()}

          {/* Website Analysis Section - Only for SDR */}
          {selectedAgent === 'ai-sdr' && (
            <>
          <Card
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor}
            shadow="xl"
            borderRadius="2xl"
            overflow="hidden"
            animation={`${glow} 5s ease-in-out infinite`}
          >
            <CardHeader pb={3}>
              <HStack>
                <Badge
                  colorScheme="blue"
                  px={3}
                  py={1}
                  borderRadius="full"
                >
                  🤖 AI Analysis
                </Badge>
                <Heading size="lg" color="gray.800">
                  Website Analysis
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={6} align="stretch">
                <HStack>
                  <Input
                    placeholder="Enter your website URL (e.g., yourcompany.com)"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    bg={glassBg}
                    border="1px solid"
                    borderColor={borderColor}
                    _focus={{
                      borderColor: 'purple.400',
                      boxShadow: `0 0 0 1px rgba(102, 126, 234, 0.4)`,
                    }}
                    size="lg"
                  />
                  <GradientButton
                    onClick={handleAnalyzeWebsite}
                    isLoading={isAnalyzing}
                    loadingText="Analyzing..."
                    disabled={!websiteUrl.trim()}
                    size="lg"
                    px={8}
                    leftIcon={<FiRefreshCw />}
                    _hover={{
                      transform: 'translateY(-2px)',
                      shadow: 'xl',
                    }}
                    transition="all 0.3s ease"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </GradientButton>
                </HStack>

                {isAnalyzing && (
                  <Card
                    bg={blueBg}
                    border="1px solid"
                    borderColor={blueBorderColor}
                    borderRadius="xl"
                  >
                    <CardBody>
                      <VStack spacing={3}>
                        <HStack>
                          <Spinner size="sm" color="purple.500" />
                          <Text fontWeight="medium">Analyzing your website...</Text>
                        </HStack>
                        <Text fontSize="sm" color="gray.600">
                          This may take up to 2 minutes as we analyze your content, value proposition, and target market.
                        </Text>
                      </VStack>
                    </CardBody>
                  </Card>
                )}

                <Collapse in={showAnalysisSection} animateOpacity>
                  {icpAnalysis && (
                    <Card
                      bg={cardBg}
                      backdropFilter="blur(10px)"
                      border="1px solid"
                      borderColor={borderColor}
                      shadow="xl"
                      borderRadius="2xl"
                      overflow="hidden"
                    >
                      <CardBody>
                        <AnalysisDisplay analysis={icpAnalysis} />
                      </CardBody>
                    </Card>
                  )}
                </Collapse>
              </VStack>
            </CardBody>
          </Card>

          {/* Offering Description */}
          <Card
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor}
            shadow="xl"
            borderRadius="2xl"
            overflow="hidden"
          >
            <CardHeader pb={3}>
              <HStack>
                <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
                  📝 Core Offer
                </Badge>
                <Heading size="lg" color="gray.800">
                  Your Value Proposition
                </Heading>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <Textarea
                placeholder="Describe what your company offers and its core value proposition..."
                value={offeringDescription}
                onChange={(e) => setOfferingDescription(e.target.value)}
                bg={glassBg}
                border="1px solid"
                borderColor={borderColor}
                _focus={{
                  borderColor: 'purple.400',
                  boxShadow: `0 0 0 1px rgba(147, 51, 234, 0.4)`,
                }}
                minH="120px"
                size="lg"
              />
            </CardBody>
          </Card>

          {/* Pain Points Section */}
          <Card
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor}
            shadow="xl"
            borderRadius="2xl"
            overflow="hidden"
          >
            <CardHeader pb={3}>
              <HStack justify="space-between">
                <HStack>
                  <Badge colorScheme="red" px={3} py={1} borderRadius="full">
                    🎯 PAIN POINTS
                  </Badge>
                  <Heading size="md" color="gray.800">
                    Customer Pain Points
                  </Heading>
                </HStack>
                <IconButton
                  aria-label="Add pain point"
                  icon={<FiPlus />}
                  onClick={addPainPoint}
                  colorScheme="red"
                  variant="ghost"
                  size="sm"
                  _hover={{
                    transform: 'scale(1.05)',
                  }}
                  transition="all 0.2s ease"
                />
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={2} align="stretch">
                {painPoints.map((point, index) => (
                  <HStack
                    key={point.id}
                    p={3}
                    bg={glassBg}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    spacing={3}
                    _hover={{
                      borderColor: 'red.300',
                      shadow: 'sm'
                    }}
                    transition="all 0.2s ease"
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="red.600"
                      minW="16px"
                      textAlign="center"
                    >
                      {index + 1}
                    </Text>
                    <Input
                      placeholder={`Pain point ${index + 1} (e.g., "High operational costs in loan collection")`}
                      value={point.description || point.title}
                      onChange={(e) => {
                        updatePainPoint(point.id, 'description', e.target.value)
                      }}
                      variant="unstyled"
                      fontSize="sm"
                      _placeholder={{ color: 'gray.400' }}
                      flex={1}
                    />
                    <IconButton
                      aria-label="Remove pain point"
                      icon={<FiTrash2 />}
                      onClick={() => removePainPoint(point.id)}
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      opacity={0.6}
                      _hover={{ opacity: 1 }}
                    />
                  </HStack>
                ))}

                {painPoints.length === 0 && (
                  <Box
                    p={4}
                    textAlign="center"
                    border="2px dashed"
                    borderColor="gray.300"
                    borderRadius="md"
                    bg="gray.50"
                  >
                    <Text color="gray.500" fontSize="sm">
                      Add customer pain points that your solution addresses
                    </Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Proof Points Section */}
          <Card
            bg={cardBg}
            backdropFilter="blur(10px)"
            border="1px solid"
            borderColor={borderColor}
            shadow="xl"
            borderRadius="2xl"
            overflow="hidden"
          >
            <CardHeader pb={3}>
              <HStack justify="space-between">
                <HStack>
                  <Badge colorScheme="green" px={3} py={1} borderRadius="full">
                    🏆 PROOF POINTS
                  </Badge>
                  <Heading size="md" color="gray.800">
                    Success Stories & Proof
                  </Heading>
                </HStack>
                <IconButton
                  aria-label="Add proof point"
                  icon={<FiPlus />}
                  onClick={addProofPoint}
                  colorScheme="green"
                  variant="ghost"
                  size="sm"
                  _hover={{
                    transform: 'scale(1.05)',
                  }}
                  transition="all 0.2s ease"
                />
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={2} align="stretch">
                {proofPoints.map((point, index) => (
                  <HStack
                    key={point.id}
                    p={3}
                    bg={glassBg}
                    border="1px solid"
                    borderColor={borderColor}
                    borderRadius="md"
                    spacing={3}
                    _hover={{
                      borderColor: 'green.300',
                      shadow: 'sm'
                    }}
                    transition="all 0.2s ease"
                  >
                    <Text
                      fontSize="xs"
                      fontWeight="bold"
                      color="green.600"
                      minW="16px"
                      textAlign="center"
                    >
                      {index + 1}
                    </Text>
                    <Input
                      placeholder={`Success story ${index + 1} (e.g., "Reduced processing time by 60% for 500+ client company")`}
                      value={point.description || point.title}
                      onChange={(e) => {
                        updateProofPoint(point.id, 'description', e.target.value)
                      }}
                      variant="unstyled"
                      fontSize="sm"
                      _placeholder={{ color: 'gray.400' }}
                      flex={1}
                    />
                    <IconButton
                      aria-label="Remove proof point"
                      icon={<FiTrash2 />}
                      onClick={() => removeProofPoint(point.id)}
                      size="xs"
                      colorScheme="red"
                      variant="ghost"
                      opacity={0.6}
                      _hover={{ opacity: 1 }}
                    />
                  </HStack>
                ))}

                {proofPoints.length === 0 && (
                  <Box
                    p={4}
                    textAlign="center"
                    border="2px dashed"
                    borderColor="gray.300"
                    borderRadius="md"
                    bg="gray.50"
                  >
                    <Text color="gray.500" fontSize="sm">
                      Add success stories, case studies, or social proof
                    </Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
            </>
          )}

          {/* Navigation Actions */}
          <HStack justify="space-between" align="center">
            <Button
              onClick={handleBackToTargeting}
              leftIcon={<Text>←</Text>}
              size="lg"
              bg="white"
              color="purple.600"
              borderColor="purple.300"
              borderWidth="2px"
              variant="outline"
              _hover={{
                bg: 'purple.50',
                borderColor: 'purple.400',
                transform: 'translateY(-2px)',
                shadow: 'lg',
              }}
              _active={{
                bg: 'purple.100'
              }}
              transition="all 0.3s ease"
              fontWeight="600"
              minW="160px"
            >
              Back to {selectedAgent === 'ai-recruiter' ? 'Candidate Search' : selectedAgent === 'ai-marketer' ? 'Audience Targeting' : 'Targeting'}
            </Button>

            <HStack spacing={4}>
              <Button
                onClick={handleSaveDraft}
                size="lg"
                bg="white"
                color="gray.600"
                borderColor="gray.300"
                borderWidth="2px"
                variant="outline"
                _hover={{
                  bg: 'gray.50',
                  borderColor: 'gray.400'
                }}
                _active={{
                  bg: 'gray.100'
                }}
                transition="all 0.2s ease"
                fontWeight="600"
              >
                💾 Save Draft
              </Button>

              <GradientButton
                onClick={handleContinueToOutreach}
                rightIcon={<Text>→</Text>}
                size="lg"
                _hover={{
                  transform: 'translateY(-2px)',
                  shadow: 'xl',
                }}
                transition="all 0.3s ease"
                minW="180px"
              >
                Continue to {selectedAgent === 'ai-recruiter' ? 'Interview Process' : selectedAgent === 'ai-marketer' ? 'Campaign Setup' : 'Outreach'}
              </GradientButton>
            </HStack>
          </HStack>
        </VStack>
      </Container>
    </Box>
  )
}