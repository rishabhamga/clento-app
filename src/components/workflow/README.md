# Advanced LinkedIn Automation Workflow Builder

A sophisticated React Flow-based visual workflow builder for creating LinkedIn automation campaigns with conditional branching, AI-powered actions, and comprehensive settings management.

## 🚀 Features

### Core Functionality
- **Visual Workflow Design**: Drag-and-drop interface powered by React Flow
- **Conditional Branching**: Smart routing based on connection request responses
- **AI-Powered Actions**: Intelligent comment generation, message personalization
- **Real-time Validation**: Live error checking and workflow validation
- **Import/Export**: JSON-based workflow sharing and backup

### Action Types
1. **Visit Profile** - View prospect's LinkedIn profile
2. **Like Recent Post** - Like prospect's most recent posts
3. **Comment on Post** - AI-generated or custom comments
4. **Send InMail** - LinkedIn InMail messages
5. **Connection Request** - Send connection request with branching
6. **Send Message** - Follow-up messages to connections
7. **Follow Profile** - Follow the prospect
8. **Follow Company** - Follow prospect's company
9. **Notify Webhook** - External system notifications
10. **Withdraw Request** - Withdraw pending connection requests

### Visual Design
- **Glassmorphism UI** - Modern glass-effect styling
- **Smooth Animations** - Framer Motion powered interactions
- **Responsive Design** - Works on desktop and mobile
- **Dark/Light Mode** - Automatic theme switching
- **Color-coded Actions** - Visual categorization by action type

## 📁 File Structure

```
src/components/workflow/
├── WorkflowBuilder.tsx          # Main workflow component
├── nodes/
│   ├── ActionNode.tsx          # Base action node component
│   ├── AddStepNode.tsx         # Add step placeholder nodes
│   └── NodeTypes.ts            # Node type definitions
├── edges/
│   ├── CustomEdge.tsx          # Custom edge with delay indicators
│   └── EdgeTypes.ts            # Edge type definitions
├── panels/
│   ├── ActionSelectionModal.tsx # Action selection interface
│   └── NodeSettings/           # Individual action settings
│       └── CommentPostSettings.tsx
├── types/
│   └── WorkflowTypes.ts        # TypeScript definitions
└── utils/
    ├── ActionDefinitions.ts    # Action configurations
    └── FlowUtils.ts           # Flow manipulation utilities
```

## 🛠️ Usage

### Basic Integration

```tsx
import WorkflowBuilder from '@/components/workflow/WorkflowBuilder';
import { FlowData } from '@/components/workflow/types/WorkflowTypes';

function MyComponent() {
  const [workflow, setWorkflow] = useState<FlowData>();

  const handleSave = (flowData: FlowData) => {
    // Save to your backend
    setWorkflow(flowData);
  };

  const handleValidation = (isValid: boolean, errors: string[], warnings: string[]) => {
    // Handle validation state
    console.log('Workflow valid:', isValid);
  };

  return (
    <div className="h-screen">
      <WorkflowBuilder
        initialFlow={workflow}
        onSave={handleSave}
        onValidationChange={handleValidation}
      />
    </div>
  );
}
```

### Campaign Integration

The workflow builder is integrated into the campaign creation flow at `/campaigns/new/workflow`. It:

1. **Loads Sample Data** - Provides example workflows for new users
2. **Saves to LocalStorage** - Persists workflow state during campaign creation
3. **Validates Before Continue** - Ensures workflow is complete before proceeding
4. **Integrates with Chakra UI** - Matches existing design system

## 🎨 Customization

### Adding New Action Types

1. **Define Action Type** in `types/WorkflowTypes.ts`:
```typescript
export type ActionType = 
  | 'existing_actions'
  | 'your_new_action';
```

2. **Add Action Definition** in `utils/ActionDefinitions.ts`:
```typescript
{
  type: 'your_new_action',
  label: 'Your New Action',
  description: 'Description of what it does',
  icon: 'IconName',
  color: '#FF6B6B',
  category: 'engagement',
  defaultConfig: { /* default settings */ }
}
```

3. **Create Settings Panel** in `panels/NodeSettings/`:
```typescript
// YourNewActionSettings.tsx
export default function YourNewActionSettings({ ... }) {
  // Settings form implementation
}
```

### Styling Customization

The workflow theme is defined in `utils/ActionDefinitions.ts`:

```typescript
export const workflowTheme: WorkflowTheme = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  glassBg: 'rgba(255, 255, 255, 0.9)',
  nodeColors: {
    your_action: '#custom_color'
  }
};
```

## 🔧 API Integration

### Unipile Integration Points

The workflow builder is designed to integrate with Unipile APIs:

- **Authentication**: Node configurations include API credentials
- **Rate Limiting**: Timing settings respect API limits
- **Error Handling**: Retry logic for failed API calls
- **Webhooks**: Status updates via webhook notifications

### Data Format

Workflows are stored in JSON format matching the sample structure:

```json
{
  "nodes": [
    {
      "id": "unique-id",
      "type": "action",
      "position": { "x": 100, "y": 0 },
      "data": {
        "type": "profile_visit",
        "label": "Visit Profile",
        "isConfigured": true,
        "config": { /* action-specific settings */ }
      }
    }
  ],
  "edges": [
    {
      "id": "edge-id",
      "source": "source-node-id",
      "target": "target-node-id",
      "type": "buttonedge",
      "data": {
        "delay": "15m",
        "delayData": { "delay": 15, "unit": "m" }
      }
    }
  ],
  "timestamp": "2025-01-24T10:24:28.794Z"
}
```

## 🧪 Testing

### Component Testing
```bash
# Run component tests
npm test src/components/workflow/

# Test specific components
npm test ActionNode.test.tsx
npm test WorkflowBuilder.test.tsx
```

### Integration Testing
```bash
# Test workflow creation flow
npm test workflow-integration.test.tsx

# Test data persistence
npm test workflow-persistence.test.tsx
```

## 🚀 Performance

### Optimizations Implemented
- **React.memo** - Prevents unnecessary re-renders
- **Virtualization** - Efficient rendering of large workflows
- **Debounced Auto-save** - Reduces save frequency
- **Lazy Loading** - Settings panels load on demand

### Performance Monitoring
```typescript
// Enable React DevTools Profiler
const WorkflowBuilder = React.memo(({ ... }) => {
  // Component implementation
});
```

## 🔒 Security Considerations

- **Input Validation** - All user inputs are validated
- **XSS Prevention** - Sanitized template rendering
- **API Key Security** - Credentials stored securely
- **Rate Limiting** - Prevents API abuse

## 📱 Mobile Support

The workflow builder includes mobile-specific optimizations:
- **Touch Gestures** - Pan, zoom, and tap interactions
- **Responsive Layout** - Adapts to screen sizes
- **Simplified UI** - Reduced complexity on small screens

## 🔄 Migration Guide

### From Legacy Workflow System

1. **Export existing workflows** using the legacy system
2. **Convert to new format** using migration utilities
3. **Import into new builder** via JSON import
4. **Validate and test** the converted workflows

## 🤝 Contributing

### Development Setup
```bash
# Install dependencies
npm install @xyflow/react framer-motion lucide-react

# Start development server
npm run dev

# Run tests
npm test
```

### Code Style
- **TypeScript** - Strict type checking enabled
- **ESLint** - Consistent code formatting
- **Prettier** - Automated code formatting

## 📚 Resources

- [React Flow Documentation](https://reactflow.dev/)
- [Framer Motion Guide](https://www.framer.com/motion/)
- [Unipile API Docs](https://docs.unipile.com/)
- [LinkedIn API Reference](https://docs.microsoft.com/en-us/linkedin/)

## 🐛 Troubleshooting

### Common Issues

**Workflow not saving**
- Check localStorage availability
- Verify JSON serialization
- Check console for errors

**Nodes not connecting**
- Ensure compatible handle types
- Check edge validation rules
- Verify node positioning

**Performance issues**
- Enable React DevTools Profiler
- Check for memory leaks
- Optimize large workflows

### Debug Mode

Enable debug logging:
```typescript
// Set in localStorage
localStorage.setItem('workflow-debug', 'true');
```

## 📄 License

This workflow builder is part of the Clento platform and follows the project's licensing terms.
