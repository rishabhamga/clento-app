'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { GradientButton } from '@/components/ui/GradientButton'
import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    CardBody,
    Container,
    Flex,
    Heading,
    HStack,
    Icon,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    Progress,
    Select,
    SimpleGrid,
    Spinner,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tooltip,
    Tr,
    useColorModeValue,
    VStack,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Divider,
    Link
} from '@chakra-ui/react'
import { useOrganization } from '@clerk/nextjs'
import {
    Activity,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    ExternalLink,
    Eye,
    Linkedin,
    Mail,
    MessageCircle,
    Plus,
    Search,
    TrendingUp,
    Users,
    Phone,
    Calendar,
    Building,
    MapPin,
    Star,
    CheckCircle,
    XCircle,
    AlertCircle,
    Send,
    Reply
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'
import { useOrgPlan } from '../../hooks/useOrgPlan'

// Mock data for AI SDR leads
const mockSDRLeads = [
    {
        id: '1',
        name: 'Sarah Chen',
        title: 'VP of Engineering',
        company: 'TechFlow Solutions',
        email: 'sarah.chen@techflow.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        linkedinUrl: 'https://linkedin.com/in/sarahchen',
        status: 'interested',
        score: 92,
        lastActivity: '2 hours ago',
        campaignName: 'Tech Leaders Q4',
        tags: ['Hot Lead', 'Decision Maker'],
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Sarah, I noticed TechFlow Solutions recently raised Series B funding. Congratulations! I\'d love to discuss how Observe.ai can help you scale your customer service operations with AI-powered insights.',
                timestamp: '2024-01-15T10:30:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Thanks for reaching out! We\'re definitely looking at AI solutions for our customer support. Can you send me some case studies?',
                timestamp: '2024-01-15T14:20:00Z'
            },
            {
                id: '3',
                type: 'sent',
                content: 'Absolutely! I\'ve attached case studies from similar companies in your space. Would you be available for a 15-minute call this week to discuss your specific needs?',
                timestamp: '2024-01-15T15:45:00Z',
                status: 'opened'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 3,
            opens: 2,
            clicks: 1,
            replies: 1
        }
    },
    {
        id: '2',
        name: 'Marcus Rodriguez',
        title: 'CTO',
        company: 'DataVault Inc',
        email: 'marcus@datavault.io',
        phone: '+1 (555) 987-6543',
        location: 'Austin, TX',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        linkedinUrl: 'https://linkedin.com/in/marcusrodriguez',
        status: 'replied',
        score: 87,
        lastActivity: '1 day ago',
        campaignName: 'CTO Outreach',
        tags: ['Technical', 'Enterprise'],
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Marcus, I saw your recent blog post about scaling customer support with AI. Your insights on conversation analytics really resonated with me.',
                timestamp: '2024-01-14T09:15:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Thanks for reading! Always happy to discuss AI in customer service. What\'s your take on real-time sentiment analysis?',
                timestamp: '2024-01-14T16:30:00Z'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 2,
            opens: 2,
            clicks: 1,
            replies: 1
        }
    },
    {
        id: '3',
        name: 'Jennifer Walsh',
        title: 'Head of Customer Success',
        company: 'CloudScale Systems',
        email: 'j.walsh@cloudscale.com',
        phone: '+1 (555) 456-7890',
        location: 'Seattle, WA',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        linkedinUrl: 'https://linkedin.com/in/jenniferwalsh',
        status: 'meeting_scheduled',
        score: 95,
        lastActivity: '3 hours ago',
        campaignName: 'Customer Success Leaders',
        tags: ['Meeting Booked', 'High Priority'],
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Jennifer, I noticed CloudScale recently expanded to 500+ employees. Managing customer success at that scale must be challenging!',
                timestamp: '2024-01-13T11:00:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'You\'re absolutely right! We\'re struggling with visibility into customer conversations across our support channels.',
                timestamp: '2024-01-13T13:45:00Z'
            },
            {
                id: '3',
                type: 'sent',
                content: 'That\'s exactly what Observe.ai helps with. Would you be interested in a quick demo to see how we\'ve helped similar companies gain 360° visibility?',
                timestamp: '2024-01-13T14:00:00Z',
                status: 'opened'
            },
            {
                id: '4',
                type: 'received',
                content: 'Yes, let\'s schedule something. How about Thursday at 2 PM PST?',
                timestamp: '2024-01-13T14:15:00Z'
            }
        ],
        metrics: {
            emailsReceived: 2,
            emailsSent: 4,
            opens: 3,
            clicks: 2,
            replies: 2
        }
    },
    {
        id: '4',
        name: 'David Park',
        title: 'Director of Operations',
        company: 'FinanceFirst Bank',
        email: 'david.park@financefirst.com',
        phone: '+1 (555) 234-5678',
        location: 'New York, NY',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        linkedinUrl: 'https://linkedin.com/in/davidpark',
        status: 'interested',
        score: 89,
        lastActivity: '5 hours ago',
        campaignName: 'Financial Services',
        tags: ['Compliance Focus', 'Large Enterprise'],
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi David, I understand FinanceFirst is focused on improving customer experience while maintaining compliance. Observe.ai helps financial institutions monitor 100% of customer interactions for quality and compliance.',
                timestamp: '2024-01-12T14:30:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Interesting! We\'re always looking for better ways to ensure compliance across our call centers. How does your solution handle PCI requirements?',
                timestamp: '2024-01-12T16:45:00Z'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 2,
            opens: 1,
            clicks: 1,
            replies: 1
        }
    },
    {
        id: '5',
        name: 'Lisa Thompson',
        title: 'VP Customer Experience',
        company: 'RetailMax Corp',
        email: 'lisa.thompson@retailmax.com',
        phone: '+1 (555) 345-6789',
        location: 'Chicago, IL',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        linkedinUrl: 'https://linkedin.com/in/lisathompson',
        status: 'replied',
        score: 91,
        lastActivity: '1 day ago',
        campaignName: 'Retail CX Leaders',
        tags: ['Customer Experience', 'Multi-Channel'],
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Lisa, RetailMax\'s customer-first approach is impressive! I\'d love to show you how Observe.ai can help you maintain that excellence across all customer touchpoints with real-time conversation intelligence.',
                timestamp: '2024-01-11T11:15:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Thanks! We\'re definitely interested in better visibility into our customer interactions. Do you have experience with omnichannel retail environments?',
                timestamp: '2024-01-11T15:30:00Z'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 2,
            opens: 2,
            clicks: 1,
            replies: 1
        }
    },
    {
        id: '6',
        name: 'Robert Kim',
        title: 'Chief Technology Officer',
        company: 'HealthTech Innovations',
        email: 'robert.kim@healthtech.com',
        phone: '+1 (555) 456-7890',
        location: 'Boston, MA',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        linkedinUrl: 'https://linkedin.com/in/robertkim',
        status: 'not_interested',
        score: 76,
        lastActivity: '3 days ago',
        campaignName: 'Healthcare Tech',
        tags: ['Healthcare', 'HIPAA Compliance'],
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Robert, I know healthcare organizations like HealthTech need to balance patient experience with strict compliance requirements. Observe.ai provides HIPAA-compliant conversation analytics for healthcare contact centers.',
                timestamp: '2024-01-10T13:00:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Thanks for reaching out, but we\'re currently focused on other priorities. Maybe we can revisit this next quarter.',
                timestamp: '2024-01-10T17:20:00Z'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 1,
            opens: 1,
            clicks: 0,
            replies: 1
        }
    },
    {
        id: '7',
        name: 'Amanda Foster',
        title: 'Director of Customer Support',
        company: 'TravelEase Platform',
        email: 'amanda.foster@travelease.com',
        phone: '+1 (555) 567-8901',
        location: 'Miami, FL',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        linkedinUrl: 'https://linkedin.com/in/amandafoster',
        status: 'meeting_scheduled',
        score: 94,
        lastActivity: '4 hours ago',
        campaignName: 'Travel & Hospitality',
        tags: ['Demo Scheduled', 'High Volume'],
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Amanda, I noticed TravelEase handles thousands of customer inquiries daily. Observe.ai can help you maintain service quality at scale with automated conversation scoring and real-time coaching.',
                timestamp: '2024-01-09T10:45:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'That sounds exactly like what we need! Our volume has grown 300% but our quality scores are slipping. Can we schedule a demo?',
                timestamp: '2024-01-09T14:30:00Z'
            },
            {
                id: '3',
                type: 'sent',
                content: 'Absolutely! I\'ll send you a calendar link. We can show you how similar travel companies improved their CSAT by 25% using our platform.',
                timestamp: '2024-01-09T15:00:00Z',
                status: 'opened'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 3,
            opens: 2,
            clicks: 1,
            replies: 1
        }
    },
    {
        id: '8',
        name: 'Michael Chen',
        title: 'VP of Customer Operations',
        company: 'InsuranceHub',
        email: 'michael.chen@insurancehub.com',
        phone: '+1 (555) 678-9012',
        location: 'Denver, CO',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        linkedinUrl: 'https://linkedin.com/in/michaelchen',
        status: 'replied',
        score: 88,
        lastActivity: '6 hours ago',
        campaignName: 'Insurance Leaders',
        tags: ['Insurance', 'Regulatory'],
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Michael, Insurance companies need to balance efficiency with regulatory compliance. Observe.ai helps insurers like yours monitor every customer interaction for compliance while improving resolution times.',
                timestamp: '2024-01-08T12:20:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'We\'re definitely interested in compliance monitoring solutions. How does your platform handle state-specific insurance regulations?',
                timestamp: '2024-01-08T16:45:00Z'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 2,
            opens: 1,
            clicks: 1,
            replies: 1
        }
    }
]

// Mock data for AI Recruiter candidates
const mockRecruiterCandidates = [
    {
        id: '1',
        name: 'Alex Thompson',
        title: 'Senior Software Engineer',
        company: 'Meta',
        email: 'alex.thompson@gmail.com',
        phone: '+1 (555) 234-5678',
        location: 'Menlo Park, CA',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        linkedinUrl: 'https://linkedin.com/in/alexthompson',
        githubUrl: 'https://github.com/alexthompson',
        status: 'interested',
        score: 94,
        lastActivity: '4 hours ago',
        campaignName: 'Senior Engineers Q1',
        tags: ['React Expert', 'Available'],
        experience: '7 years',
        skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'GraphQL'],
        salary: '$180k - $220k',
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Alex, I came across your profile and was impressed by your work on React performance optimization at Meta. We have an exciting Senior Engineer role at Observe.ai that I think would be perfect for you.',
                timestamp: '2024-01-15T09:30:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Thanks for reaching out! I\'m always interested in hearing about new opportunities. What can you tell me about the role and the team?',
                timestamp: '2024-01-15T11:45:00Z'
            },
            {
                id: '3',
                type: 'sent',
                content: 'Great! You\'d be joining our AI Platform team, working on real-time conversation analytics. The role involves React, Node.js, and ML integrations. Competitive package: $200-240k + equity. Interested in a quick call?',
                timestamp: '2024-01-15T12:15:00Z',
                status: 'opened'
            }
        ],
        metrics: {
            emailsReceived: 2,
            emailsSent: 3,
            opens: 3,
            clicks: 1,
            replies: 2
        }
    },
    {
        id: '2',
        name: 'Priya Patel',
        title: 'ML Engineer',
        company: 'Google',
        email: 'priya.patel@gmail.com',
        phone: '+1 (555) 345-6789',
        location: 'Mountain View, CA',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        linkedinUrl: 'https://linkedin.com/in/priyapatel',
        githubUrl: 'https://github.com/priyapatel',
        status: 'interview_scheduled',
        score: 98,
        lastActivity: '1 day ago',
        campaignName: 'ML Engineers',
        tags: ['PhD', 'Interview Scheduled'],
        experience: '5 years',
        skills: ['Python', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision'],
        salary: '$190k - $250k',
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Priya, your research on conversational AI at Google caught my attention. We\'re building cutting-edge ML models for conversation analytics at Observe.ai and would love to chat.',
                timestamp: '2024-01-12T10:00:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Hi! That sounds really interesting. I\'ve been looking for opportunities to apply my NLP research in a product setting. Can you tell me more about the technical challenges?',
                timestamp: '2024-01-12T14:30:00Z'
            },
            {
                id: '3',
                type: 'sent',
                content: 'Absolutely! We\'re working on real-time sentiment analysis, intent classification, and conversation summarization at scale. Would you be available for a technical interview next week?',
                timestamp: '2024-01-12T15:00:00Z',
                status: 'opened'
            },
            {
                id: '4',
                type: 'received',
                content: 'Yes, I\'d love to learn more. How about Tuesday at 3 PM?',
                timestamp: '2024-01-12T15:30:00Z'
            }
        ],
        metrics: {
            emailsReceived: 2,
            emailsSent: 4,
            opens: 3,
            clicks: 2,
            replies: 2
        }
    },
    {
        id: '3',
        name: 'David Kim',
        title: 'Product Manager',
        company: 'Stripe',
        email: 'david.kim@gmail.com',
        phone: '+1 (555) 456-7891',
        location: 'San Francisco, CA',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        linkedinUrl: 'https://linkedin.com/in/davidkim',
        status: 'not_interested',
        score: 76,
        lastActivity: '3 days ago',
        campaignName: 'Product Managers',
        tags: ['Not Available', 'Future Opportunity'],
        experience: '6 years',
        skills: ['Product Strategy', 'Data Analysis', 'A/B Testing', 'User Research'],
        salary: '$170k - $200k',
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi David, I\'ve been following your work on Stripe\'s ML-powered fraud detection. We have a Senior PM role focusing on AI products that might interest you.',
                timestamp: '2024-01-10T11:00:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Thanks for thinking of me! I\'m really happy at Stripe right now and not looking to make a move. Maybe we can connect again in the future?',
                timestamp: '2024-01-10T16:20:00Z'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 2,
            opens: 1,
            clicks: 0,
            replies: 1
        }
    },
    {
        id: '4',
        name: 'Sarah Martinez',
        title: 'Senior Data Scientist',
        company: 'Netflix',
        email: 'sarah.martinez@gmail.com',
        phone: '+1 (555) 789-0123',
        location: 'Los Gatos, CA',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        linkedinUrl: 'https://linkedin.com/in/sarahmartinez',
        githubUrl: 'https://github.com/sarahmartinez',
        status: 'interested',
        score: 92,
        lastActivity: '2 hours ago',
        campaignName: 'Data Scientists',
        tags: ['NLP Expert', 'Available Soon'],
        experience: '6 years',
        skills: ['Python', 'R', 'SQL', 'NLP', 'Deep Learning', 'Spark'],
        salary: '$170k - $210k',
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Sarah, your work on recommendation systems and NLP at Netflix is impressive! Observe.ai is looking for a Senior Data Scientist to work on conversation intelligence and I think you\'d be a great fit.',
                timestamp: '2024-01-14T11:30:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Thanks for reaching out! I\'m intrigued by conversation intelligence. What kind of NLP challenges are you working on at Observe.ai?',
                timestamp: '2024-01-14T15:45:00Z'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 2,
            opens: 2,
            clicks: 1,
            replies: 1
        }
    },
    {
        id: '5',
        name: 'James Wilson',
        title: 'DevOps Engineer',
        company: 'Uber',
        email: 'james.wilson@gmail.com',
        phone: '+1 (555) 890-1234',
        location: 'San Francisco, CA',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        linkedinUrl: 'https://linkedin.com/in/jameswilson',
        githubUrl: 'https://github.com/jameswilson',
        status: 'replied',
        score: 85,
        lastActivity: '1 day ago',
        campaignName: 'DevOps Engineers',
        tags: ['Kubernetes', 'Cloud Native'],
        experience: '8 years',
        skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'Python', 'Go'],
        salary: '$160k - $200k',
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi James, I saw your contributions to Uber\'s infrastructure scaling. Observe.ai is looking for a DevOps Engineer to help scale our conversation analytics platform. Interested in learning more?',
                timestamp: '2024-01-13T14:20:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Hi! I\'m always interested in infrastructure challenges. What\'s the scale you\'re operating at and what technologies are you using?',
                timestamp: '2024-01-13T17:30:00Z'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 2,
            opens: 1,
            clicks: 1,
            replies: 1
        }
    },
    {
        id: '6',
        name: 'Emily Chen',
        title: 'Frontend Engineer',
        company: 'Airbnb',
        email: 'emily.chen@gmail.com',
        phone: '+1 (555) 901-2345',
        location: 'San Francisco, CA',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        linkedinUrl: 'https://linkedin.com/in/emilychen',
        githubUrl: 'https://github.com/emilychen',
        status: 'meeting_scheduled',
        score: 90,
        lastActivity: '3 hours ago',
        campaignName: 'Frontend Engineers',
        tags: ['React', 'Meeting Scheduled'],
        experience: '5 years',
        skills: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'CSS-in-JS'],
        salary: '$150k - $190k',
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Emily, your work on Airbnb\'s design system caught my attention. Observe.ai is building beautiful, intuitive interfaces for conversation analytics and we\'d love to have you join our frontend team.',
                timestamp: '2024-01-12T10:15:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'That sounds interesting! I\'d love to learn more about the product and the technical challenges. Are you available for a call this week?',
                timestamp: '2024-01-12T13:45:00Z'
            },
            {
                id: '3',
                type: 'sent',
                content: 'Absolutely! I\'ll send you a calendar link. We can discuss the role and show you some of the exciting UI challenges we\'re working on.',
                timestamp: '2024-01-12T14:00:00Z',
                status: 'opened'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 3,
            opens: 2,
            clicks: 1,
            replies: 1
        }
    },
    {
        id: '7',
        name: 'Michael Rodriguez',
        title: 'Security Engineer',
        company: 'Cloudflare',
        email: 'michael.rodriguez@gmail.com',
        phone: '+1 (555) 012-3456',
        location: 'Austin, TX',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        linkedinUrl: 'https://linkedin.com/in/michaelrodriguez',
        githubUrl: 'https://github.com/michaelrodriguez',
        status: 'not_interested',
        score: 78,
        lastActivity: '4 days ago',
        campaignName: 'Security Engineers',
        tags: ['Security', 'Not Available'],
        experience: '7 years',
        skills: ['Cybersecurity', 'Penetration Testing', 'Python', 'Go', 'AWS Security'],
        salary: '$160k - $200k',
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Michael, your expertise in cloud security at Cloudflare is impressive. Observe.ai is looking for a Security Engineer to help secure our conversation analytics platform. Would you be interested?',
                timestamp: '2024-01-09T16:30:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Thanks for reaching out! I\'m really focused on my current projects at Cloudflare and not looking to make a change right now.',
                timestamp: '2024-01-09T18:45:00Z'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 1,
            opens: 1,
            clicks: 0,
            replies: 1
        }
    },
    {
        id: '8',
        name: 'Lisa Park',
        title: 'UX Designer',
        company: 'Figma',
        email: 'lisa.park@gmail.com',
        phone: '+1 (555) 123-4567',
        location: 'San Francisco, CA',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        linkedinUrl: 'https://linkedin.com/in/lisapark',
        status: 'interested',
        score: 88,
        lastActivity: '5 hours ago',
        campaignName: 'UX Designers',
        tags: ['Design Systems', 'B2B Experience'],
        experience: '6 years',
        skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'B2B UX'],
        salary: '$140k - $180k',
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Lisa, your work on Figma\'s collaborative features is amazing! Observe.ai is looking for a UX Designer to help make conversation analytics more intuitive for enterprise users. Interested in chatting?',
                timestamp: '2024-01-11T12:00:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Thank you! I\'m always interested in B2B design challenges. What kind of users would I be designing for at Observe.ai?',
                timestamp: '2024-01-11T16:20:00Z'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 2,
            opens: 2,
            clicks: 1,
            replies: 1
        }
    },
    {
        id: '9',
        name: 'Kevin Zhang',
        title: 'Backend Engineer',
        company: 'Slack',
        email: 'kevin.zhang@gmail.com',
        phone: '+1 (555) 234-5678',
        location: 'San Francisco, CA',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        linkedinUrl: 'https://linkedin.com/in/kevinzhang',
        githubUrl: 'https://github.com/kevinzhang',
        status: 'replied',
        score: 86,
        lastActivity: '2 days ago',
        campaignName: 'Backend Engineers',
        tags: ['Microservices', 'Scala'],
        experience: '6 years',
        skills: ['Scala', 'Java', 'Kafka', 'PostgreSQL', 'Redis', 'Microservices'],
        salary: '$160k - $200k',
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Kevin, your work on Slack\'s messaging infrastructure is impressive! Observe.ai is building real-time conversation processing systems and we\'d love to have someone with your expertise join our backend team.',
                timestamp: '2024-01-10T09:45:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Thanks! Real-time processing sounds interesting. What kind of scale are you handling and what\'s your tech stack like?',
                timestamp: '2024-01-10T14:30:00Z'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 2,
            opens: 1,
            clicks: 1,
            replies: 1
        }
    },
    {
        id: '10',
        name: 'Rachel Foster',
        title: 'Technical Program Manager',
        company: 'Apple',
        email: 'rachel.foster@gmail.com',
        phone: '+1 (555) 345-6789',
        location: 'Cupertino, CA',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        linkedinUrl: 'https://linkedin.com/in/rachelfoster',
        status: 'interview_scheduled',
        score: 93,
        lastActivity: '1 hour ago',
        campaignName: 'Technical PMs',
        tags: ['TPM', 'Interview Scheduled'],
        experience: '8 years',
        skills: ['Program Management', 'Agile', 'Cross-functional Leadership', 'Technical Strategy'],
        salary: '$180k - $220k',
        messages: [
            {
                id: '1',
                type: 'sent',
                content: 'Hi Rachel, your experience leading cross-functional teams at Apple is exactly what we\'re looking for. Observe.ai needs a Technical Program Manager to help coordinate our AI platform development. Interested?',
                timestamp: '2024-01-08T11:30:00Z',
                status: 'opened'
            },
            {
                id: '2',
                type: 'received',
                content: 'Hi! I\'m definitely interested in learning more about the role and the technical challenges. Can we schedule a call to discuss?',
                timestamp: '2024-01-08T15:45:00Z'
            },
            {
                id: '3',
                type: 'sent',
                content: 'Perfect! I\'ll send you a calendar link. We can discuss the role and how you\'d help coordinate our engineering and product teams.',
                timestamp: '2024-01-08T16:00:00Z',
                status: 'opened'
            }
        ],
        metrics: {
            emailsReceived: 1,
            emailsSent: 3,
            opens: 2,
            clicks: 1,
            replies: 1
        }
    }
]

// Agent configuration
const agentPageConfig = {
    'ai-sdr': {
        pageTitle: 'Leads',
        entityName: 'leads',
        gradient: 'linear(to-r, purple.400, pink.400)',
        mockData: mockSDRLeads
    },
    'ai-recruiter': {
        pageTitle: 'Candidates',
        entityName: 'candidates',
        gradient: 'linear(to-r, blue.400, teal.400)',
        mockData: mockRecruiterCandidates
    },
    'ai-marketer': {
        pageTitle: 'Prospects',
        entityName: 'prospects',
        gradient: 'linear(to-r, green.400, blue.400)',
        mockData: mockSDRLeads // Using SDR data for now
    }
}

export default function LeadsPage() {
    const router = useRouter()
    const { organization } = useOrganization()
    const { hasPlan } = useOrgPlan()
    const [selectedAgent, setSelectedAgent] = useState<string>('ai-sdr')
    const [loading, setLoading] = useState(false)
    const [selectedLead, setSelectedLead] = useState<any>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const currentPageConfig = agentPageConfig[selectedAgent as keyof typeof agentPageConfig] || agentPageConfig['ai-sdr']
    const leads = currentPageConfig.mockData || []
    
    const cardBg = useColorModeValue('rgba(255, 255, 255, 0.8)', 'rgba(26, 32, 44, 0.8)')
    const borderColor = useColorModeValue('rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)')

    // Load selected agent from localStorage
    useEffect(() => {
        const agent = localStorage.getItem('selectedAgent') || 'ai-sdr'
        setSelectedAgent(agent)
    }, [])

    // Filter leads based on search and status
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            lead.title.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'interested': return 'green'
            case 'replied': return 'blue'
            case 'meeting_scheduled': return 'purple'
            case 'interview_scheduled': return 'purple'
            case 'not_interested': return 'red'
            default: return 'gray'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'interested': return CheckCircle
            case 'replied': return Reply
            case 'meeting_scheduled': return Calendar
            case 'interview_scheduled': return Calendar
            case 'not_interested': return XCircle
            default: return AlertCircle
        }
    }

    return (
        <DashboardLayout>
            <Container maxW="7xl" py={8}>
                <VStack spacing={8} align="stretch">
                    {/* Header Section */}
                    <Box>
                        <HStack justify="space-between" align="center" mb={6}>
                            <VStack spacing={1} align="start">
                                <Heading
                                    size="xl"
                                    bgGradient={currentPageConfig.gradient}
                                    bgClip="text"
                                    fontWeight="bold"
                                >
                                    {currentPageConfig.pageTitle}
                                </Heading>
                                <Text color="gray.600" fontSize="lg">
                                    Manage your {currentPageConfig.entityName} and track engagement
                                </Text>
                            </VStack>
                            <HStack spacing={4}>
                                <GradientButton
                                    leftIcon={<Plus size={20} />}
                                    onClick={() => router.push('/campaigns/new')}
                                >
                                    Create Campaign
                                </GradientButton>
                            </HStack>
                        </HStack>

                        {/* Stats Cards */}
                        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} mb={6}>
                            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                                <CardBody>
                                    <VStack spacing={2}>
                                        <Icon as={Users} boxSize={6} color="purple.500" />
                                        <Text fontSize="2xl" fontWeight="bold">{leads.length}</Text>
                                        <Text fontSize="sm" color="gray.600">Total {currentPageConfig.entityName}</Text>
                                    </VStack>
                                </CardBody>
                            </Card>
                            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                                <CardBody>
                                    <VStack spacing={2}>
                                        <Icon as={MessageCircle} boxSize={6} color="blue.500" />
                                        <Text fontSize="2xl" fontWeight="bold">
                                            {leads.reduce((sum, lead) => sum + lead.metrics.replies, 0)}
                                        </Text>
                                        <Text fontSize="sm" color="gray.600">Total Replies</Text>
                                    </VStack>
                                </CardBody>
                            </Card>
                            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                                <CardBody>
                                    <VStack spacing={2}>
                                        <Icon as={TrendingUp} boxSize={6} color="green.500" />
                                        <Text fontSize="2xl" fontWeight="bold">
                                            {Math.round((leads.filter(l => l.status === 'interested' || l.status === 'meeting_scheduled' || l.status === 'interview_scheduled').length / leads.length) * 100)}%
                                        </Text>
                                        <Text fontSize="sm" color="gray.600">Response Rate</Text>
                                    </VStack>
                                </CardBody>
                            </Card>
                            <Card bg={cardBg} border="1px solid" borderColor={borderColor}>
                                <CardBody>
                                    <VStack spacing={2}>
                                        <Icon as={Calendar} boxSize={6} color="orange.500" />
                                        <Text fontSize="2xl" fontWeight="bold">
                                            {leads.filter(l => l.status === 'meeting_scheduled' || l.status === 'interview_scheduled').length}
                                        </Text>
                                        <Text fontSize="sm" color="gray.600">Meetings Booked</Text>
                                    </VStack>
                                </CardBody>
                            </Card>
                        </SimpleGrid>

                        {/* Filters */}
                        <HStack spacing={4} mb={6}>
                            <InputGroup maxW="400px">
                                <InputLeftElement>
                                    <Icon as={Search} boxSize={5} color="gray.400" />
                                </InputLeftElement>
                                <Input
                                    placeholder={`Search ${currentPageConfig.entityName}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </InputGroup>
                            <Select maxW="200px" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                <option value="all">All Status</option>
                                <option value="interested">Interested</option>
                                <option value="replied">Replied</option>
                                <option value="meeting_scheduled">Meeting Scheduled</option>
                                <option value="interview_scheduled">Interview Scheduled</option>
                                <option value="not_interested">Not Interested</option>
                            </Select>
                        </HStack>
                    </Box>

                    {/* Main Content */}
                    <Flex gap={6}>
                        {/* Leads List */}
                        <Box flex="1">
                            <VStack spacing={4} align="stretch">
                                {filteredLeads.map((lead) => {
                                    const StatusIcon = getStatusIcon(lead.status)
                                    return (
                                        <Card
                                            key={lead.id}
                                            bg={cardBg}
                                            border="1px solid"
                                            borderColor={selectedLead?.id === lead.id ? 'purple.300' : borderColor}
                                            borderRadius="xl"
                                            cursor="pointer"
                                            onClick={() => setSelectedLead(lead)}
                                            _hover={{ borderColor: 'purple.200', transform: 'translateY(-1px)' }}
                                            transition="all 0.2s"
                                        >
                                            <CardBody>
                                                <HStack spacing={4}>
                                                    <Avatar src={lead.avatar} name={lead.name} size="md" />
                                                    <VStack align="start" spacing={1} flex="1">
                                                        <HStack justify="space-between" w="100%">
                                                            <Text fontWeight="bold" fontSize="lg">{lead.name}</Text>
                                                            <Badge colorScheme={getStatusColor(lead.status)} variant="subtle">
                                                                <HStack spacing={1}>
                                                                    <Icon as={StatusIcon} boxSize={3} />
                                                                    <Text>{lead.status.replace('_', ' ')}</Text>
                                                                </HStack>
                                                            </Badge>
                                                        </HStack>
                                                        <Text color="gray.600">{lead.title} at {lead.company}</Text>
                                                        <HStack spacing={4} fontSize="sm" color="gray.500">
                                                            <HStack spacing={1}>
                                                                <Icon as={MapPin} boxSize={3} />
                                                                <Text>{lead.location}</Text>
                                                            </HStack>
                                                            <HStack spacing={1}>
                                                                <Icon as={Clock} boxSize={3} />
                                                                <Text>{lead.lastActivity}</Text>
                                                            </HStack>
                                                            <HStack spacing={1}>
                                                                <Icon as={Star} boxSize={3} />
                                                                <Text>{lead.score}/100</Text>
                                                            </HStack>
                                                        </HStack>
                                                        <HStack spacing={2} mt={2}>
                                                            {lead.tags.map((tag, index) => (
                                                                <Badge key={index} size="sm" colorScheme="purple" variant="outline">
                                                                    {tag}
                                                                </Badge>
                                                            ))}
                                                        </HStack>
                                                        {/* Metrics */}
                                                        <HStack spacing={4} mt={2} fontSize="sm">
                                                            <HStack spacing={1}>
                                                                <Icon as={Send} boxSize={3} color="blue.500" />
                                                                <Text>{lead.metrics.emailsSent} sent</Text>
                                                            </HStack>
                                                            <HStack spacing={1}>
                                                                <Icon as={Reply} boxSize={3} color="green.500" />
                                                                <Text>{lead.metrics.replies} replies</Text>
                                                            </HStack>
                                                            <HStack spacing={1}>
                                                                <Icon as={Eye} boxSize={3} color="purple.500" />
                                                                <Text>{lead.metrics.opens} opens</Text>
                                                            </HStack>
                                                        </HStack>
                                                    </VStack>
                                                </HStack>
                                            </CardBody>
                                        </Card>
                                    )
                                })}
                            </VStack>
                        </Box>

                        {/* Lead Detail Panel */}
                        {selectedLead && (
                            <Box w="400px">
                                <Card bg={cardBg} border="1px solid" borderColor={borderColor} borderRadius="xl">
                                    <CardBody>
                                        <VStack spacing={4} align="stretch">
                                            {/* Header */}
                                            <HStack spacing={4}>
                                                <Avatar src={selectedLead.avatar} name={selectedLead.name} size="lg" />
                                                <VStack align="start" spacing={1}>
                                                    <Text fontWeight="bold" fontSize="xl">{selectedLead.name}</Text>
                                                    <Text color="gray.600">{selectedLead.title}</Text>
                                                    <Text color="gray.500">{selectedLead.company}</Text>
                                                </VStack>
                                            </HStack>

                                            <Divider />

                                            {/* Contact Info */}
                                            <VStack align="stretch" spacing={2}>
                                                <HStack>
                                                    <Icon as={Mail} boxSize={4} color="gray.500" />
                                                    <Link href={`mailto:${selectedLead.email}`} color="blue.500">
                                                        {selectedLead.email}
                                                    </Link>
                                                </HStack>
                                                <HStack>
                                                    <Icon as={Phone} boxSize={4} color="gray.500" />
                                                    <Text>{selectedLead.phone}</Text>
                                                </HStack>
                                                <HStack>
                                                    <Icon as={Linkedin} boxSize={4} color="gray.500" />
                                                    <Link href={selectedLead.linkedinUrl} color="blue.500" isExternal>
                                                        LinkedIn Profile
                                                    </Link>
                                                </HStack>
                                                {selectedLead.githubUrl && (
                                                    <HStack>
                                                        <Icon as={ExternalLink} boxSize={4} color="gray.500" />
                                                        <Link href={selectedLead.githubUrl} color="blue.500" isExternal>
                                                            GitHub Profile
                                                        </Link>
                                                    </HStack>
                                                )}
                                            </VStack>

                                            {/* Recruiter-specific info */}
                                            {selectedAgent === 'ai-recruiter' && (
                                                <>
                                                    <Divider />
                                                    <VStack align="stretch" spacing={2}>
                                                        <Text fontWeight="semibold">Candidate Details</Text>
                                                        <HStack justify="space-between">
                                                            <Text color="gray.600">Experience:</Text>
                                                            <Text>{selectedLead.experience}</Text>
                                                        </HStack>
                                                        <HStack justify="space-between">
                                                            <Text color="gray.600">Salary Range:</Text>
                                                            <Text>{selectedLead.salary}</Text>
                                                        </HStack>
                                                        <Box>
                                                            <Text color="gray.600" mb={2}>Skills:</Text>
                                                            <HStack spacing={1} flexWrap="wrap">
                                                                {selectedLead.skills?.map((skill: string, index: number) => (
                                                                    <Badge key={index} size="sm" colorScheme="blue">
                                                                        {skill}
                                                                    </Badge>
                                                                ))}
                                                            </HStack>
                                                        </Box>
                                                    </VStack>
                                                </>
                                            )}

                                            <Divider />

                                            {/* Messages */}
                                            <Box>
                                                <Text fontWeight="semibold" mb={3}>Conversation</Text>
                                                <VStack spacing={3} align="stretch" maxH="400px" overflowY="auto">
                                                    {selectedLead.messages.map((message: any) => (
                                                        <Box
                                                            key={message.id}
                                                            bg={message.type === 'sent' ? 'purple.50' : 'gray.50'}
                                                            p={3}
                                                            borderRadius="lg"
                                                            border="1px solid"
                                                            borderColor={message.type === 'sent' ? 'purple.200' : 'gray.200'}
                                                        >
                                                            <HStack justify="space-between" mb={2}>
                                                                <Badge
                                                                    colorScheme={message.type === 'sent' ? 'purple' : 'gray'}
                                                                    size="sm"
                                                                >
                                                                    {message.type === 'sent' ? 'Sent' : 'Received'}
                                                                </Badge>
                                                                <Text fontSize="xs" color="gray.500">
                                                                    {new Date(message.timestamp).toLocaleDateString()}
                                                                </Text>
                                                            </HStack>
                                                            <Text fontSize="sm">{message.content}</Text>
                                                            {message.status && (
                                                                <Text fontSize="xs" color="gray.500" mt={1}>
                                                                    Status: {message.status}
                                                                </Text>
                                                            )}
                                                        </Box>
                                                    ))}
                                                </VStack>
                                            </Box>
                                        </VStack>
                                    </CardBody>
                                </Card>
                            </Box>
                        )}
                    </Flex>
                </VStack>
            </Container>
        </DashboardLayout>
    )
}

const LeadNoPlan = () => {
    return (
        <Card bg="purple.50" border="2px solid" borderColor="purple.200">
            <CardBody textAlign="center" py={12}>
                <VStack spacing={4}>
                    <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                        Not started
                    </Badge>
                    <Heading size="md" color="purple.700">
                        We Haven't Started Your Sending
                    </Heading>
                    <Text color="purple.600" maxW="md">
                        We haven't started your sending yet contact your POC for more Information.
                    </Text>
                </VStack>
            </CardBody>
        </Card>
    )
}