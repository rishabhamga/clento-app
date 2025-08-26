Looking at the screenshots and the sample flow JSON, I can see you want to create a sophisticated workflow 

## **Comprehensive Implementation Prompt: Advanced LinkedIn  and email Automation Workflow Builder**

### **Project Overview**
Replace the current workflow selection in the campaign creation flow with a sophisticated React Flow-based visual workflow builder that integrates with Unipile APIs for LinkedIn automation. The interface should match the screenshots provided, featuring smooth animations, conditional branching, and comprehensive settings management.

### **Core Requirements**

#### **1. React Flow Integration & Setup**
```bash
npm install @xyflow/react @xyflow/node-resizer framer-motion
```

**File Structure:**
```
src/components/workflow/
├── WorkflowBuilder.tsx          # Main workflow component
├── nodes/
│   ├── ActionNode.tsx          # Base action node component
│   ├── ConditionalNode.tsx     # Connection request with branching
│   ├── AddStepNode.tsx         # Add step placeholder nodes
│   └── NodeTypes.ts            # Node type definitions
├── edges/
│   ├── CustomEdge.tsx          # Custom edge with delay indicators
│   ├── ConditionalEdge.tsx     # Branching edges (accepted/not accepted)
│   └── EdgeTypes.ts            # Edge type definitions
├── panels/
│   ├── ActionPanel.tsx         # Settings panel for each action
│   ├── FlowControls.tsx        # Import/Export/Save controls
│   └── NodeSettings/           # Individual action settings
│       ├── VisitProfileSettings.tsx
│       ├── LikePostSettings.tsx
│       ├── CommentSettings.tsx
│       ├── ConnectionRequestSettings.tsx
│       ├── SendMessageSettings.tsx
│       ├── SendEmailSettings.tsx
│       ├── FollowProfileSettings.tsx
│       └── FollowCompanySettings.tsx
├── types/
│   └── WorkflowTypes.ts        # TypeScript definitions
└── utils/
    ├── FlowUtils.ts            # Flow manipulation utilities
    └── FlowValidation.ts       # Flow validation logic
```

#### **2. Node Types & Actions**

**Available Actions (matching your requirements):**
1. **Visit Profile** - View prospect's LinkedIn profile
2. **Like Recent Post** - Like prospect's most recent post(s)
3. **Comment on Post** - AI-generated or custom comments
4. **Send InMail** - LinkedIn InMail messages
5. **Connection Request** - Send connection request (with branching)
6. **Follow Profile** - Follow the prospect
7. **Follow Company** - Follow prospect's company
8. **Send Email** - Email outreach via Unipile

#### **3. Visual Design System**

**Color Scheme & Styling:**
```typescript
// Match current Clento design theme
const workflowTheme = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  glassBg: 'rgba(255, 255, 255, 0.9)',
  darkGlassBg: 'rgba(26, 32, 44, 0.9)',
  borderColor: 'rgba(255, 255, 255, 0.2)',
  accentGradient: 'linear-gradient(45deg, #667eea, #764ba2)',
  nodeColors: {
    visit_profile: '#4F46E5',
    like_post: '#EF4444', 
    comment_post: '#F59E0B',
    send_inmail: '#0EA5E9',
    connection_request: '#10B981',
    follow_profile: '#8B5CF6',
    follow_company: '#F97316',
    send_email: '#EC4899'
  }
}
```

**Node Design:**
- **Glassmorphism effect** with backdrop blur
- **Rounded corners** (12px border radius)
- **Gradient borders** for active/selected states
- **Icon + Label** layout with action-specific icons
- **Status indicators** (configured/unconfigured)
- **Smooth hover animations** with scale and glow effects

#### **4. Node Components Implementation**

**Base Action Node:**
```typescript
interface ActionNodeData {
  type: string;
  label: string;
  isConfigured: boolean;
  config: Record<string, any>;
  pathType?: 'accepted' | 'not-accepted';
  integrationLogoUrl?: string;
  subtitle?: string;
}

interface ActionNodeProps {
  id: string;
  data: ActionNodeData;
  selected: boolean;
}
```

**Features per node:**
- **Configuration status indicator** (green checkmark when configured)
- **Settings button** that opens configuration panel
- **Delete button** on hover
- **Connection handles** (top input, bottom output)
- **Smooth animations** for state changes

#### **5. Conditional Branching System**

**Connection Request Node Special Handling:**
- **Dual output handles** for "Accepted" and "Not Accepted" paths
- **Visual branch indicators** with different colored edges
- **Automatic path labeling** on edges
- **Delay configuration** for each branch separately

**Edge Types:**
1. **Standard Edge** - Normal sequential flow with delay indicators
2. **Conditional Edge** - Branching edges with path labels
3. **Button Edge** - Interactive edges with delay configuration

#### **6. Settings Panel System**

**Dynamic Settings Panel:**
- **Slide-in animation** from right side
- **Action-specific forms** based on node type
- **Real-time preview** where applicable
- **Save/Cancel buttons** with proper state management
- **Form validation** with error states

**Settings Categories:**
- **AI Configuration** (for comments, messages)
- **Timing & Delays** (wait times between actions)
- **Personalization** (custom variables, templates)
- **Conditions** (post recency, connection status)
- **Integration Settings** (Unipile API parameters)

#### **7. Animation System**

**Node Animations:**
```typescript
// Framer Motion variants
const nodeVariants = {
  initial: { scale: 0, opacity: 0, y: 20 },
  animate: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  },
  hover: { 
    scale: 1.05, 
    boxShadow: "0 10px 25px rgba(102, 126, 234, 0.3)",
    transition: { duration: 0.2 }
  },
  exit: { scale: 0, opacity: 0, transition: { duration: 0.2 } }
}
```

**Add Step Animation:**
- **Floating "+" button** with pulse animation
- **Action selection modal** with staggered list animation
- **Node creation** with spring animation from add button position
- **Auto-connection** with animated edge drawing

#### **8. Flow Controls & Management**

**Top Toolbar:**
- **Import Flow** button (JSON file upload)
- **Export Flow** button (download JSON)
- **Save Draft** button (auto-save to localStorage)
- **Validate Flow** button (check for errors)
- **Zoom controls** and **fit view** button

**Flow Validation:**
- **Orphaned nodes** detection
- **Missing configurations** warnings
- **Circular dependencies** prevention
- **Path completeness** validation

#### **9. Data Structure & JSON Format**

**Flow Data Structure** (matching your sample-flow.json):
```typescript
interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  timestamp: string;
}

interface FlowNode {
  id: string;
  type: 'action' | 'addStep';
  position: { x: number; y: number };
  data: {
    type: string;
    label: string;
    isConfigured: boolean;
    config: Record<string, any>;
    pathType?: 'accepted' | 'not-accepted';
    integrationLogoUrl?: string;
    subtitle?: string;
  };
  measured?: { width: number; height: number };
  selected?: boolean;
}
```

#### **10. Integration Points**

**Unipile API Integration:**
- **Authentication handling** in node configurations
- **API endpoint mapping** for each action type
- **Rate limiting** considerations in timing settings
- **Error handling** and retry logic
- **Webhook configuration** for status updates

**Campaign Integration:**
- **Replace current workflow step** in campaign creation
- **Save flow data** to campaign settings
- **Load existing flows** for editing
- **Preview mode** for flow visualization

#### **11. Advanced Features**

**Smart Suggestions:**
- **Template flows** for common sequences
- **AI-powered recommendations** for next steps
- **Best practice warnings** (timing, sequence optimization)
- **Performance analytics** integration

**Collaboration Features:**
- **Flow sharing** via JSON export/import
- **Version history** with diff visualization
- **Comments and annotations** on nodes
- **Team templates** library

#### **12. Performance Optimizations**

**React Flow Optimizations:**
- **Node virtualization** for large flows
- **Memoized components** to prevent unnecessary re-renders
- **Efficient edge rendering** with custom edge components
- **Lazy loading** of settings panels

**State Management:**
- **Zustand store** for flow state
- **Optimistic updates** for better UX
- **Debounced auto-save** functionality
- **Undo/redo** capability

#### **13. Responsive Design**

**Mobile Adaptations:**
- **Touch-friendly** node interactions
- **Collapsible sidebar** for settings
- **Gesture support** for pan/zoom
- **Simplified node layout** for smaller screens

#### **14. Testing Strategy**

**Component Testing:**
- **Node rendering** tests
- **Flow manipulation** tests
- **Settings panel** functionality tests
- **JSON import/export** validation tests

**Integration Testing:**
- **Unipile API** integration tests
- **Campaign creation** flow tests
- **Data persistence** tests

### **Implementation Priority**

**Phase 1: Core Infrastructure**
1. React Flow setup and basic node/edge components
2. Node type system and basic styling
3. Add step functionality with animations

**Phase 2: Settings & Configuration**
1. Settings panel system
2. Individual action configuration forms
3. Flow validation and error handling

**Phase 3: Advanced Features**
1. Conditional branching for connection requests
2. Import/export functionality
3. Integration with campaign creation flow

**Phase 4: Polish & Optimization**
1. Advanced animations and micro-interactions
2. Performance optimizations
3. Mobile responsiveness
4. Testing and bug fixes
