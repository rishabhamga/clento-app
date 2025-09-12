export interface MeetingParticipant {
  name: string;
  role: string;
  company: string;
}

export interface MeetingTranscript {
  id: string;
  accountName: string;
  date: string;
  participants: MeetingParticipant[];
  meetingType: 'discovery' | 'demo' | 'technical' | 'closing' | 'implementation' | 'follow-up';
  duration: string;
  transcript: Array<{
    speaker: string;
    timestamp: string;
    text: string;
  }>;
  summary?: string;
  actionItems?: string[];
  keyTopics?: string[];
}

export const mockTranscripts: MeetingTranscript[] = [
  {
    id: "1",
    accountName: "Acme Corp",
    date: "2024-09-05",
    participants: [
      { name: "Sarah Johnson", role: "VP Sales", company: "Observe.ai" },
      { name: "Mike Chen", role: "Head of Customer Success", company: "Acme Corp" },
      { name: "Lisa Rodriguez", role: "IT Director", company: "Acme Corp" }
    ],
    meetingType: "discovery",
    duration: "45 minutes",
    transcript: [
      {
        speaker: "Sarah Johnson",
        timestamp: "00:01:30",
        text: "Thanks for taking the time today. I'd love to understand your current challenges with call center quality monitoring."
      },
      {
        speaker: "Mike Chen",
        timestamp: "00:02:15",
        text: "We're struggling with manual quality assurance. Our team can only review about 2% of calls, and we're missing critical insights."
      },
      {
        speaker: "Lisa Rodriguez",
        timestamp: "00:03:20",
        text: "From a compliance perspective, we need to ensure GDPR compliance for all customer interactions. Data residency is crucial for us."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:04:10",
        text: "That's exactly what Observe.ai excels at. We can analyze 100% of your calls while maintaining strict GDPR compliance with EU data centers."
      },
      {
        speaker: "Mike Chen",
        timestamp: "00:05:45",
        text: "What about integration with our existing Salesforce CRM? We need seamless data flow."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:06:30",
        text: "We have native Salesforce integration. I can show you how conversation insights automatically sync to opportunity records."
      },
      {
        speaker: "Lisa Rodriguez",
        timestamp: "00:08:15",
        text: "Security is paramount. Do you have SOC 2 Type II certification? What about data encryption standards?"
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:09:00",
        text: "Absolutely. We're SOC 2 Type II certified, ISO 27001 compliant, and use AES-256 encryption for all data at rest and in transit."
      },
      {
        speaker: "Mike Chen",
        timestamp: "00:12:30",
        text: "This sounds promising. What would implementation look like for our 200-agent contact center?"
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:13:15",
        text: "Typically 4-6 weeks for full deployment. We'd start with a pilot group of 20 agents, then scale gradually."
      }
    ],
    summary: "Discovery call focused on Acme Corp's quality monitoring challenges, compliance requirements, and technical integration needs.",
    actionItems: [
      "Send SOC 2 and ISO 27001 certificates",
      "Schedule technical demo with Salesforce integration",
      "Provide GDPR compliance documentation",
      "Create implementation timeline for 200 agents"
    ],
    keyTopics: ["GDPR Compliance", "Salesforce Integration", "Security Certifications", "Implementation Timeline"]
  },
  {
    id: "2",
    accountName: "Acme Corp",
    date: "2024-09-12",
    participants: [
      { name: "Sarah Johnson", role: "VP Sales", company: "Observe.ai" },
      { name: "Tom Wilson", role: "Solutions Engineer", company: "Observe.ai" },
      { name: "Mike Chen", role: "Head of Customer Success", company: "Acme Corp" },
      { name: "Lisa Rodriguez", role: "IT Director", company: "Acme Corp" },
      { name: "David Park", role: "QA Manager", company: "Acme Corp" }
    ],
    meetingType: "demo",
    duration: "60 minutes",
    transcript: [
      {
        speaker: "Tom Wilson",
        timestamp: "00:02:00",
        text: "Let me show you how Observe.ai analyzes customer sentiment in real-time during calls."
      },
      {
        speaker: "David Park",
        timestamp: "00:03:45",
        text: "This is impressive. Can it detect when customers are getting frustrated before they escalate?"
      },
      {
        speaker: "Tom Wilson",
        timestamp: "00:04:20",
        text: "Exactly. Our AI identifies emotional indicators and can trigger real-time coaching alerts to supervisors."
      },
      {
        speaker: "Mike Chen",
        timestamp: "00:07:10",
        text: "How accurate is the speech-to-text conversion? We deal with various accents and background noise."
      },
      {
        speaker: "Tom Wilson",
        timestamp: "00:07:55",
        text: "Our accuracy rate is 95%+ even with challenging audio. The system learns and improves over time."
      },
      {
        speaker: "Lisa Rodriguez",
        timestamp: "00:12:30",
        text: "I notice the Salesforce integration shows conversation scores directly in opportunity records. That's exactly what we need."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:13:15",
        text: "And those scores automatically update your lead scoring models, helping prioritize follow-ups."
      },
      {
        speaker: "David Park",
        timestamp: "00:18:45",
        text: "The automated coaching recommendations would save our supervisors hours each week."
      },
      {
        speaker: "Mike Chen",
        timestamp: "00:22:30",
        text: "What's the pricing model for our volume? We process about 50,000 calls monthly."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:23:10",
        text: "For your volume, we can offer a per-agent monthly subscription with volume discounts. I'll prepare a detailed proposal."
      }
    ],
    summary: "Technical demonstration showcasing AI capabilities, Salesforce integration, and addressing technical concerns.",
    actionItems: [
      "Prepare pricing proposal for 50,000 monthly calls",
      "Share accuracy metrics and case studies",
      "Schedule pilot program discussion",
      "Provide technical integration documentation"
    ],
    keyTopics: ["Real-time Sentiment Analysis", "Speech Recognition Accuracy", "Salesforce Integration", "Pricing Discussion"]
  },
  {
    id: "3",
    accountName: "TechFlow Solutions",
    date: "2024-09-08",
    participants: [
      { name: "Sarah Johnson", role: "VP Sales", company: "Observe.ai" },
      { name: "Jennifer Kim", role: "CEO", company: "TechFlow Solutions" },
      { name: "Robert Martinez", role: "CTO", company: "TechFlow Solutions" }
    ],
    meetingType: "discovery",
    duration: "30 minutes",
    transcript: [
      {
        speaker: "Jennifer Kim",
        timestamp: "00:01:00",
        text: "We're a fast-growing SaaS company and our customer support is becoming a bottleneck. We need better insights into customer conversations."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:01:45",
        text: "Tell me more about your current support structure. How many agents and what channels?"
      },
      {
        speaker: "Robert Martinez",
        timestamp: "00:02:30",
        text: "We have 15 support agents handling phone, chat, and email. We're using Zendesk but getting limited insights."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:03:15",
        text: "Observe.ai can integrate with Zendesk and provide AI-powered insights across all those channels."
      },
      {
        speaker: "Jennifer Kim",
        timestamp: "00:05:20",
        text: "Our main concern is customer churn. We're losing customers but don't know why until it's too late."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:06:05",
        text: "Our platform identifies early churn signals in conversations - things like frustration, unresolved issues, or competitive mentions."
      },
      {
        speaker: "Robert Martinez",
        timestamp: "00:08:45",
        text: "What about API access? We'd want to build custom dashboards and integrate with our internal tools."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:09:30",
        text: "We have comprehensive REST APIs and webhooks for real-time data streaming. Very developer-friendly."
      },
      {
        speaker: "Jennifer Kim",
        timestamp: "00:12:15",
        text: "This could be a game-changer for us. What's the typical ROI companies see?"
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:13:00",
        text: "Most customers see 25-30% improvement in customer satisfaction and 15% reduction in churn within 6 months."
      }
    ],
    summary: "Initial discovery with fast-growing SaaS company focused on customer retention and support optimization.",
    actionItems: [
      "Send ROI case studies from similar SaaS companies",
      "Provide API documentation and developer resources",
      "Schedule demo focusing on churn prevention features",
      "Connect with their Zendesk integration team"
    ],
    keyTopics: ["Customer Churn Prevention", "Zendesk Integration", "API Access", "ROI Metrics"]
  },
  {
    id: "4",
    accountName: "Global Finance Corp",
    date: "2024-09-10",
    participants: [
      { name: "Sarah Johnson", role: "VP Sales", company: "Observe.ai" },
      { name: "Amanda Thompson", role: "Compliance Officer", company: "Global Finance Corp" },
      { name: "Steve Wilson", role: "Call Center Director", company: "Global Finance Corp" }
    ],
    meetingType: "technical",
    duration: "90 minutes",
    transcript: [
      {
        speaker: "Amanda Thompson",
        timestamp: "00:02:00",
        text: "As a financial services company, we have strict regulatory requirements. We need to ensure all recordings are compliant with PCI DSS standards."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:02:45",
        text: "Observe.ai is PCI DSS Level 1 certified. We automatically redact sensitive information like credit card numbers and SSNs."
      },
      {
        speaker: "Steve Wilson",
        timestamp: "00:05:30",
        text: "We handle over 100,000 calls monthly across different time zones. Can your system handle that scale?"
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:06:15",
        text: "Absolutely. We process millions of interactions daily for enterprise clients. Our cloud infrastructure auto-scales."
      },
      {
        speaker: "Amanda Thompson",
        timestamp: "00:10:20",
        text: "What about data retention policies? We need 7-year retention for audit purposes but also right-to-be-forgotten compliance."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:11:05",
        text: "We support flexible retention policies and have automated data deletion workflows for GDPR compliance."
      },
      {
        speaker: "Steve Wilson",
        timestamp: "00:15:45",
        text: "Our agents work with highly regulated scripts. Can the system detect script deviations and compliance violations?"
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:16:30",
        text: "Yes, we can create custom compliance scorecards that flag when agents deviate from required disclosures or scripts."
      },
      {
        speaker: "Amanda Thompson",
        timestamp: "00:22:10",
        text: "We'll need a comprehensive security audit before any implementation. Do you have a security questionnaire we can review?"
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:22:55",
        text: "Of course. I'll send our security documentation package including penetration test results and compliance certificates."
      }
    ],
    summary: "Deep technical and compliance discussion for financial services implementation with focus on regulatory requirements.",
    actionItems: [
      "Send comprehensive security documentation package",
      "Provide PCI DSS certification and audit reports",
      "Create custom compliance scorecard examples",
      "Schedule security audit coordination call",
      "Share data retention and deletion policy documentation"
    ],
    keyTopics: ["PCI DSS Compliance", "Data Retention Policies", "Script Compliance Monitoring", "Security Audit", "Regulatory Requirements"]
  },

  // Medtronic meetings - Copilot Implementation
  {
    id: "21",
    accountName: "Medtronic",
    date: "2024-09-30",
    participants: [
      { name: "Sarah Johnson", role: "VP Sales", company: "Observe.AI" },
      { name: "Dr. Michael Stevens", role: "VP Customer Experience", company: "Medtronic" },
      { name: "Jennifer Walsh", role: "Director of Contact Center Operations", company: "Medtronic" },
      { name: "Robert Chen", role: "Head of Quality Assurance", company: "Medtronic" }
    ],
    meetingType: "discovery",
    duration: "75 minutes",
    transcript: [
      {
        speaker: "Dr. Michael Stevens",
        timestamp: "00:02:00",
        text: "As a leading medical technology company, Medtronic handles complex customer support for life-saving devices. Our agents need real-time assistance to provide accurate, compliant responses about medical products."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:03:30",
        text: "That's exactly what our Copilot solution addresses. It provides real-time agent assistance with medical device knowledge, compliance prompts, and escalation guidance during live conversations."
      },
      {
        speaker: "Jennifer Walsh",
        timestamp: "00:05:45",
        text: "We handle over 50,000 customer interactions monthly about medical devices, troubleshooting, and clinical support. Accuracy and compliance are critical - lives depend on it."
      },
      {
        speaker: "Robert Chen",
        timestamp: "00:07:20",
        text: "Our biggest challenge is ensuring agents have instant access to the right medical information and regulatory guidelines during calls, especially for complex device inquiries."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:09:00",
        text: "Copilot can integrate with your medical device knowledge base and provide real-time prompts for FDA compliance, device specifications, and clinical protocols based on the conversation context."
      },
      {
        speaker: "Dr. Michael Stevens",
        timestamp: "00:12:15",
        text: "This could significantly improve our response accuracy and reduce the risk of providing incorrect medical device information. What about integration with our existing systems?"
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:13:45",
        text: "Copilot integrates seamlessly with your contact center platform and can pull real-time data from your device databases, clinical documentation, and regulatory compliance systems."
      }
    ],
    summary: "Discovery call with Medtronic to explore Copilot real-time agent assistance for medical device customer support with focus on accuracy, compliance, and clinical guidance.",
    actionItems: [
      "Provide medical device industry compliance documentation",
      "Schedule Copilot demo focusing on real-time medical knowledge assistance",
      "Share FDA compliance automation capabilities",
      "Discuss integration with Medtronic's existing medical device databases"
    ],
    keyTopics: ["Real-time Agent Assistance", "Medical Device Support", "FDA Compliance", "Clinical Knowledge Integration", "Patient Safety"]
  },
  {
    id: "22",
    accountName: "Medtronic",
    date: "2024-10-07",
    participants: [
      { name: "Tom Wilson", role: "Solutions Engineer", company: "Observe.AI" },
      { name: "Dr. Lisa Rodriguez", role: "Medical Affairs Specialist", company: "Observe.AI" },
      { name: "Dr. Michael Stevens", role: "VP Customer Experience", company: "Medtronic" },
      { name: "Jennifer Walsh", role: "Director of Contact Center Operations", company: "Medtronic" },
      { name: "Dr. Amanda Foster", role: "Chief Medical Officer", company: "Medtronic" }
    ],
    meetingType: "demo",
    duration: "90 minutes",
    transcript: [
      {
        speaker: "Tom Wilson",
        timestamp: "00:02:00",
        text: "I'll demonstrate how Copilot provides real-time assistance during medical device support calls. Dr. Rodriguez will show the clinical knowledge integration."
      },
      {
        speaker: "Dr. Lisa Rodriguez",
        timestamp: "00:03:45",
        text: "As a former cardiac surgeon, I've helped design Copilot's medical device support capabilities to ensure clinical accuracy and patient safety."
      },
      {
        speaker: "Dr. Amanda Foster",
        timestamp: "00:05:30",
        text: "Can Copilot distinguish between different device models and provide model-specific guidance? We have hundreds of device variations."
      },
      {
        speaker: "Tom Wilson",
        timestamp: "00:06:15",
        text: "Yes, Copilot can identify the specific device model from the conversation and instantly surface relevant technical specifications, troubleshooting steps, and safety protocols."
      },
      {
        speaker: "Jennifer Walsh",
        timestamp: "00:09:45",
        text: "The real-time compliance prompts are impressive. Can it detect when agents need to provide specific FDA warnings or contraindications?"
      },
      {
        speaker: "Dr. Lisa Rodriguez",
        timestamp: "00:10:30",
        text: "Absolutely. Copilot monitors conversations for clinical scenarios that require specific regulatory disclosures and prompts agents with the exact FDA-approved language."
      },
      {
        speaker: "Dr. Michael Stevens",
        timestamp: "00:15:20",
        text: "This level of real-time clinical support could transform our customer experience while ensuring the highest safety standards."
      }
    ],
    summary: "Technical demonstration of Copilot's real-time agent assistance capabilities specifically designed for Medtronic's medical device customer support requirements.",
    actionItems: [
      "Provide medical device-specific Copilot configuration examples",
      "Share clinical knowledge integration specifications",
      "Schedule technical integration discussion with Medtronic's systems",
      "Prepare FDA compliance automation documentation"
    ],
    keyTopics: ["Copilot Real-time Assistance", "Medical Device Knowledge", "FDA Compliance Automation", "Clinical Safety Protocols"]
  },
  {
    id: "23",
    accountName: "Medtronic",
    date: "2024-10-14",
    participants: [
      { name: "Sarah Johnson", role: "VP Sales", company: "Observe.AI" },
      { name: "Alex Kumar", role: "Implementation Specialist", company: "Observe.AI" },
      { name: "Dr. Michael Stevens", role: "VP Customer Experience", company: "Medtronic" },
      { name: "James Thompson", role: "CTO", company: "Medtronic" },
      { name: "Robert Chen", role: "Head of Quality Assurance", company: "Medtronic" }
    ],
    meetingType: "technical",
    duration: "80 minutes",
    transcript: [
      {
        speaker: "James Thompson",
        timestamp: "00:02:30",
        text: "For Copilot integration, we need to understand how it accesses our medical device databases and clinical documentation systems in real-time."
      },
      {
        speaker: "Alex Kumar",
        timestamp: "00:03:45",
        text: "Copilot uses secure API connections to your existing systems. We can integrate with your device databases, clinical protocols, and regulatory documentation without disrupting current workflows."
      },
      {
        speaker: "Robert Chen",
        timestamp: "00:06:15",
        text: "What about data security and HIPAA compliance? We handle sensitive patient information and device data."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:07:30",
        text: "Copilot is fully HIPAA compliant with enterprise-grade encryption. All patient data remains within your secure environment while Copilot provides contextual assistance."
      },
      {
        speaker: "James Thompson",
        timestamp: "00:11:45",
        text: "How does Copilot handle the complexity of our global operations? We have different regulatory requirements across regions."
      },
      {
        speaker: "Alex Kumar",
        timestamp: "00:12:30",
        text: "Copilot can be configured with region-specific regulatory requirements and device approvals, automatically applying the appropriate guidance based on customer location and device type."
      }
    ],
    summary: "Technical architecture discussion covering Copilot integration with Medtronic's medical device databases, clinical systems, and global regulatory compliance requirements.",
    actionItems: [
      "Provide detailed Copilot integration architecture documentation",
      "Share HIPAA compliance and medical data security specifications",
      "Create region-specific regulatory configuration plans",
      "Schedule security review with Medtronic's InfoSec team"
    ],
    keyTopics: ["Copilot Integration Architecture", "Medical Data Security", "HIPAA Compliance", "Global Regulatory Requirements"]
  },
  {
    id: "24",
    accountName: "Medtronic",
    date: "2024-10-20",
    participants: [
      { name: "Sarah Johnson", role: "VP Sales", company: "Observe.AI" },
      { name: "Dr. Michael Stevens", role: "VP Customer Experience", company: "Medtronic" },
      { name: "Karen Miller", role: "Chief Executive Officer", company: "Medtronic" },
      { name: "Dr. Amanda Foster", role: "Chief Medical Officer", company: "Medtronic" }
    ],
    meetingType: "closing",
    duration: "50 minutes",
    transcript: [
      {
        speaker: "Karen Miller",
        timestamp: "00:02:00",
        text: "The potential for Copilot to enhance patient safety through improved agent support aligns perfectly with Medtronic's mission to alleviate pain, restore health, and extend life."
      },
      {
        speaker: "Dr. Amanda Foster",
        timestamp: "00:03:30",
        text: "Real-time clinical guidance during customer interactions could significantly improve patient outcomes and device utilization. This is transformational for medical device support."
      },
      {
        speaker: "Dr. Michael Stevens",
        timestamp: "00:05:15",
        text: "The ROI analysis shows substantial improvements in first-call resolution and compliance adherence. We're ready to proceed with Copilot implementation."
      },
      {
        speaker: "Sarah Johnson",
        timestamp: "00:06:45",
        text: "We're honored to partner with Medtronic in advancing patient care through intelligent conversation technology. Copilot will help ensure every patient interaction meets the highest clinical standards."
      }
    ],
    summary: "Executive approval meeting with Medtronic leadership to finalize Copilot implementation for real-time agent assistance in medical device customer support.",
    actionItems: [
      "Execute Copilot implementation contract with medical device specifications",
      "Begin pilot program planning for cardiac device support team",
      "Assign dedicated healthcare customer success manager",
      "Schedule implementation kickoff with clinical and technical teams"
    ],
    keyTopics: ["Executive Approval", "Patient Safety Mission", "Clinical Excellence", "Medical Device Support Innovation"]
  },
  {
    id: "25",
    accountName: "Medtronic",
    date: "2024-10-25",
    participants: [
      { name: "Dr. Lisa Rodriguez", role: "Medical Affairs Specialist", company: "Observe.AI" },
      { name: "Alex Kumar", role: "Implementation Specialist", company: "Observe.AI" },
      { name: "Jennifer Walsh", role: "Director of Contact Center Operations", company: "Medtronic" },
      { name: "Robert Chen", role: "Head of Quality Assurance", company: "Medtronic" },
      { name: "Dr. Sarah Kim", role: "Clinical Training Manager", company: "Medtronic" }
    ],
    meetingType: "implementation",
    duration: "70 minutes",
    transcript: [
      {
        speaker: "Dr. Lisa Rodriguez",
        timestamp: "00:02:00",
        text: "Welcome to the Medtronic Copilot implementation kickoff. We'll be deploying real-time agent assistance for your cardiac device support team first, then expanding to other product lines."
      },
      {
        speaker: "Jennifer Walsh",
        timestamp: "00:03:45",
        text: "We've selected our most experienced cardiac device specialists for the pilot. They'll help validate the clinical accuracy and effectiveness of Copilot's real-time guidance."
      },
      {
        speaker: "Alex Kumar",
        timestamp: "00:05:30",
        text: "Copilot will integrate with your cardiac device database and clinical protocols. Agents will receive real-time prompts for device specifications, troubleshooting, and safety considerations."
      },
      {
        speaker: "Dr. Sarah Kim",
        timestamp: "00:07:15",
        text: "What training will our agents need for the new Copilot interface and real-time guidance features?"
      },
      {
        speaker: "Dr. Lisa Rodriguez",
        timestamp: "00:08:00",
        text: "We'll provide comprehensive training on Copilot's medical device features, focusing on how to effectively use real-time clinical prompts while maintaining natural conversation flow."
      }
    ],
    summary: "Copilot implementation kickoff for Medtronic's real-time agent assistance deployment, starting with cardiac device support team.",
    actionItems: [
      "Begin Copilot pilot deployment with cardiac device support team",
      "Configure medical device knowledge base and clinical protocols",
      "Set up real-time agent assistance dashboards and monitoring",
      "Schedule agent training sessions on Copilot medical device features"
    ],
    keyTopics: ["Copilot Implementation", "Real-time Agent Assistance", "Medical Device Support", "Clinical Training", "Cardiac Device Specialization"]
  },

  // Additional Paycor meetings
  {
    id: "26",
    accountName: "Paycor",
    date: "2024-10-18",
    participants: [
      { name: "Maria Santos", role: "Customer Success Manager", company: "Observe.AI" },
      { name: "Jennifer Kim", role: "Head of Quality", company: "Paycor" },
      { name: "Lisa Chen", role: "Senior QA Manager", company: "Paycor" },
      { name: "Mark Johnson", role: "Contact Center Supervisor", company: "Paycor" }
    ],
    meetingType: "follow-up",
    duration: "45 minutes",
    transcript: [
      {
        speaker: "Maria Santos",
        timestamp: "00:02:00",
        text: "Great to see the pilot results! Your 20-agent test group is showing 35% improvement in first-call resolution for HR and payroll inquiries."
      },
      {
        speaker: "Jennifer Kim",
        timestamp: "00:03:30",
        text: "The real-time coaching has been transformational. Our agents are much more confident handling complex payroll discrepancies and benefits questions."
      },
      {
        speaker: "Lisa Chen",
        timestamp: "00:05:15",
        text: "The automated quality scoring is saving us 15+ hours weekly. We can now focus on strategic coaching rather than manual call reviews."
      },
      {
        speaker: "Mark Johnson",
        timestamp: "00:07:45",
        text: "Agents love the instant knowledge base suggestions. When customers ask about FMLA or 401k vesting, the system immediately surfaces the right information."
      },
      {
        speaker: "Maria Santos",
        timestamp: "00:09:30",
        text: "Based on these results, are you ready to expand to the full 200-agent team? We can complete the rollout by end of November."
      }
    ],
    summary: "Pilot program review showing excellent results for Paycor's HR and payroll conversation intelligence implementation with plans for full rollout.",
    actionItems: [
      "Prepare full rollout plan for remaining 180 agents",
      "Schedule advanced training for supervisors on new coaching insights",
      "Configure additional HR compliance scorecards",
      "Plan go-live timeline for November deployment"
    ],
    keyTopics: ["Pilot Results", "Performance Improvement", "Full Rollout Planning", "Agent Satisfaction", "Quality Automation"]
  },
  {
    id: "27",
    accountName: "Paycor",
    date: "2024-11-02",
    participants: [
      { name: "Alex Kumar", role: "Implementation Specialist", company: "Observe.AI" },
      { name: "Maria Santos", role: "Customer Success Manager", company: "Observe.AI" },
      { name: "Michael Rodriguez", role: "VP Customer Success", company: "Paycor" },
      { name: "Jennifer Kim", role: "Head of Quality", company: "Paycor" },
      { name: "David Thompson", role: "IT Director", company: "Paycor" }
    ],
    meetingType: "implementation",
    duration: "60 minutes",
    transcript: [
      {
        speaker: "Alex Kumar",
        timestamp: "00:02:00",
        text: "We've successfully completed the full rollout to all 200 agents. The Genesys integration is performing flawlessly with 99.8% uptime."
      },
      {
        speaker: "Michael Rodriguez",
        timestamp: "00:03:45",
        text: "The impact on our customer satisfaction scores has been remarkable. We've seen a 28% increase in CSAT for payroll-related inquiries."
      },
      {
        speaker: "Jennifer Kim",
        timestamp: "00:05:30",
        text: "Our compliance scores have improved dramatically. The system catches 100% of required disclosures compared to our previous 85% manual catch rate."
      },
      {
        speaker: "David Thompson",
        timestamp: "00:08:15",
        text: "The technical performance has exceeded expectations. Real-time response times are under 200ms, and the system scales perfectly with our peak volumes."
      },
      {
        speaker: "Maria Santos",
        timestamp: "00:10:45",
        text: "What additional features would be valuable as we move into the optimization phase? We have advanced analytics and predictive coaching capabilities available."
      }
    ],
    summary: "Full deployment completion review for Paycor's conversation intelligence implementation with outstanding performance metrics and discussion of advanced features.",
    actionItems: [
      "Enable advanced analytics dashboards for leadership team",
      "Configure predictive coaching for complex HR scenarios",
      "Set up automated reporting for monthly business reviews",
      "Plan integration with Paycor's workforce analytics platform"
    ],
    keyTopics: ["Full Deployment Success", "Performance Metrics", "System Reliability", "Advanced Features", "Optimization Planning"]
  },

  // Additional Included Health meetings
  {
    id: "28",
    accountName: "Included Health",
    date: "2024-10-22",
    participants: [
      { name: "Dr. Michael Torres", role: "Healthcare Solutions Specialist", company: "Observe.AI" },
      { name: "Dr. Sarah Kim", role: "Clinical Quality Director", company: "Included Health" },
      { name: "James Wilson", role: "VP Member Experience", company: "Included Health" },
      { name: "Rachel Martinez", role: "Compliance Director", company: "Included Health" }
    ],
    meetingType: "follow-up",
    duration: "55 minutes",
    transcript: [
      {
        speaker: "Dr. Michael Torres",
        timestamp: "00:02:00",
        text: "The clinical quality metrics from your pilot are exceptional. We're seeing 42% improvement in care navigation accuracy and 95% compliance with clinical protocols."
      },
      {
        speaker: "Dr. Sarah Kim",
        timestamp: "00:03:45",
        text: "Our care advocates are providing much more consistent guidance. The real-time clinical prompts ensure they never miss critical health screening questions."
      },
      {
        speaker: "James Wilson",
        timestamp: "00:06:20",
        text: "Member satisfaction scores have increased by 31%. Members feel more confident in the care guidance they're receiving from our advocates."
      },
      {
        speaker: "Rachel Martinez",
        timestamp: "00:08:15",
        text: "The HIPAA compliance automation is working perfectly. All PHI is properly protected while still providing valuable insights for quality improvement."
      },
      {
        speaker: "Dr. Michael Torres",
        timestamp: "00:11:30",
        text: "Based on these results, shall we proceed with expanding to your full care navigation team? We can also add specialized modules for chronic care management."
      }
    ],
    summary: "Pilot program review for Included Health showing significant improvements in clinical quality, member satisfaction, and compliance with plans for full expansion.",
    actionItems: [
      "Prepare expansion plan for full care navigation team",
      "Configure chronic care management conversation modules",
      "Set up member outcome tracking dashboards",
      "Schedule clinical training for advanced health coaching features"
    ],
    keyTopics: ["Clinical Quality Improvement", "Member Satisfaction", "HIPAA Compliance", "Care Navigation Excellence", "Expansion Planning"]
  },
  {
    id: "29",
    accountName: "Included Health",
    date: "2024-11-05",
    participants: [
      { name: "Dr. Michael Torres", role: "Healthcare Solutions Specialist", company: "Observe.AI" },
      { name: "Maria Santos", role: "Customer Success Manager", company: "Observe.AI" },
      { name: "Dr. Amanda Foster", role: "Chief Medical Officer", company: "Included Health" },
      { name: "James Wilson", role: "VP Member Experience", company: "Included Health" },
      { name: "Dr. Sarah Kim", role: "Clinical Quality Director", company: "Included Health" }
    ],
    meetingType: "implementation",
    duration: "65 minutes",
    transcript: [
      {
        speaker: "Dr. Michael Torres",
        timestamp: "00:02:00",
        text: "We've successfully deployed conversation intelligence across your entire care navigation platform. All 150 care advocates now have access to real-time clinical guidance."
      },
      {
        speaker: "Dr. Amanda Foster",
        timestamp: "00:04:15",
        text: "The impact on clinical outcomes has been remarkable. We're seeing improved care plan adherence and more appropriate care referrals across all member interactions."
      },
      {
        speaker: "James Wilson",
        timestamp: "00:06:45",
        text: "Our Net Promoter Score has increased by 18 points since full deployment. Members consistently mention the quality and accuracy of care guidance in their feedback."
      },
      {
        speaker: "Dr. Sarah Kim",
        timestamp: "00:09:20",
        text: "The chronic care management modules are particularly valuable. Care advocates can now provide specialized guidance for diabetes, hypertension, and mental health support."
      },
      {
        speaker: "Maria Santos",
        timestamp: "00:12:30",
        text: "What's next for optimization? We have predictive health risk scoring and proactive care outreach capabilities that could further enhance member outcomes."
      }
    ],
    summary: "Full deployment success review for Included Health's healthcare conversation intelligence with focus on clinical outcomes and member experience improvements.",
    actionItems: [
      "Enable predictive health risk scoring for proactive care",
      "Configure automated care gap identification",
      "Set up population health analytics dashboards",
      "Plan integration with Included Health's clinical decision support systems"
    ],
    keyTopics: ["Clinical Outcomes", "Member Experience Excellence", "Chronic Care Management", "Predictive Analytics", "Population Health"]
  },
  {
    id: "30",
    accountName: "Included Health",
    date: "2024-11-12",
    participants: [
      { name: "Dr. Michael Torres", role: "Healthcare Solutions Specialist", company: "Observe.AI" },
      { name: "Dr. Amanda Foster", role: "Chief Medical Officer", company: "Included Health" },
      { name: "Lisa Rodriguez", role: "CEO", company: "Included Health" },
      { name: "James Wilson", role: "VP Member Experience", company: "Included Health" }
    ],
    meetingType: "follow-up",
    duration: "40 minutes",
    transcript: [
      {
        speaker: "Lisa Rodriguez",
        timestamp: "00:02:00",
        text: "The conversation intelligence platform has transformed our ability to deliver personalized healthcare guidance at scale. This aligns perfectly with our mission to make healthcare work for everyone."
      },
      {
        speaker: "Dr. Amanda Foster",
        timestamp: "00:03:30",
        text: "We're now able to identify health risks earlier and provide more targeted interventions. The clinical insights are helping us prevent health issues before they become serious."
      },
      {
        speaker: "James Wilson",
        timestamp: "00:05:45",
        text: "Member engagement has increased significantly. They trust our care advocates more because the guidance is consistently accurate and personalized to their specific health needs."
      },
      {
        speaker: "Dr. Michael Torres",
        timestamp: "00:07:20",
        text: "The predictive analytics are showing promising results for identifying members who would benefit from preventive care programs. This could significantly impact population health outcomes."
      }
    ],
    summary: "Strategic review of Included Health's conversation intelligence success with focus on population health impact and preventive care opportunities.",
    actionItems: [
      "Develop case studies on clinical outcome improvements",
      "Explore expansion to mental health conversation intelligence",
      "Plan integration with wearable device data for comprehensive health insights",
      "Schedule quarterly business review to track long-term health outcomes"
    ],
    keyTopics: ["Population Health Impact", "Preventive Care", "Member Engagement", "Clinical Excellence", "Strategic Healthcare Innovation"]
  }
];

export const mockAccounts = [
  {
    id: "paycor",
    name: "Paycor",
    industry: "HR Technology",
    meetingCount: 7,
    lastMeeting: "2024-11-02",
    status: "deployed"
  },
  {
    id: "included-health",
    name: "Included Health",
    industry: "Healthcare Technology",
    meetingCount: 8,
    lastMeeting: "2024-11-12",
    status: "deployed"
  },
  {
    id: "medtronic",
    name: "Medtronic",
    industry: "Medical Technology",
    meetingCount: 5,
    lastMeeting: "2024-10-25",
    status: "implementation"
  }
];
