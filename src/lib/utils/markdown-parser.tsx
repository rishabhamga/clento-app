import React from 'react'

/**
 * Simple markdown parser for basic formatting in messages
 * Converts **text** to bold and preserves line breaks
 */
export const parseSimpleMarkdown = (text: string): React.ReactNode => {
  if (!text) return text

  // Split by bold markers while preserving them
  const parts = text.split(/(\*\*.*?\*\*)/g)
  
  return parts.map((part, index) => {
    // Check if this part is bold text
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2) // Remove ** markers
      return (
        <strong key={index} style={{ fontWeight: '700' }}>
          {boldText}
        </strong>
      )
    }
    
    // Handle line breaks in regular text
    if (part.includes('\n')) {
      return part.split('\n').map((line, lineIndex, lines) => (
        <React.Fragment key={`${index}-${lineIndex}`}>
          {line}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      ))
    }
    
    return part
  })
} 