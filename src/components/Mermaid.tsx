import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
});

interface MermaidProps {
  chart: string;
}

/**
 * Sanitize AI-generated Mermaid syntax biar gak gampang error
 */
/**
 * Sanitize AI-generated Mermaid syntax to ensure compatibility with Mermaid v11
 */
function sanitizeChart(raw: string): string {
  let chart = raw.trim();

  // 1. Basic cleanup
  chart = chart.replace(/^```mermaid\s*/i, '').replace(/```\s*$/, '');
  chart = chart.replace(/\uFEFF/g, '');

  // Force Top-Down (TD) direction
  if (/^flowchart|^graph/i.test(chart)) {
    chart = chart.replace(/^(flowchart|graph)\s+(LR|RL|BT)/i, '$1 TD');
  } else {
    chart = 'flowchart TD\n' + chart;
  }

  const lines = chart.split('\n');
  const fixedLines: string[] = [];

  const getSafeId = (text: string) => {
    return 'node_' + text.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  };

  for (const line of lines) {
    let fixed = line.trim();
    if (!fixed || /^flowchart|^graph/i.test(fixed) || fixed === 'end' || fixed.startsWith('style ') || fixed.startsWith('classDef ')) {
      fixedLines.push(fixed || '');
      continue;
    }

    // Handle Subgraphs
    if (fixed.toLowerCase().startsWith('subgraph ')) {
      const parts = fixed.split(/\s+/);
      const id = parts[1] || 'sub';
      const label = parts.slice(2).join(' ').replace(/[\[\]"{}()]/g, '') || id;
      fixedLines.push(`    subgraph ${getSafeId(id)}["${label}"]`);
      continue;
    }

    // Handle Connections (the core problem area)
    if (fixed.includes('-->') || fixed.includes('---') || fixed.includes('==>')) {
      const separator = fixed.includes('-->') ? '-->' : fixed.includes('==>') ? '==>' : '---';
      const parts = fixed.split(separator);
      
      const processedParts = parts.map(part => {
        let p = part.trim();
        // Check if it already has an ID[Label] pattern
        const match = p.match(/^([a-zA-Z0-9_]+)\s*[\[\(\{](.*)[\]\)\}]$/);
        if (match) {
          const id = match[1];
          const label = match[2].replace(/"/g, "'").trim();
          return `${id}["${label}"]`;
        }
        
        // If it's just text, treat it as a label and generate an ID
        const label = p.replace(/"/g, "'");
        const id = getSafeId(label);
        return `${id}["${label}"]`;
      });

      fixedLines.push('    ' + processedParts.join(` ${separator} `));
      continue;
    }

    // Handle standalone nodes
    const nodeMatch = fixed.match(/^([a-zA-Z0-9_]+)\s*[\[\(\{](.*)[\]\)\}]$/);
    if (nodeMatch) {
      fixedLines.push(`    ${nodeMatch[1]}["${nodeMatch[2].replace(/"/g, "'").trim()}"]`);
      continue;
    }

    fixedLines.push('    ' + fixed);
  }

  return fixedLines.join('\n');
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && chart) {
      ref.current.removeAttribute('data-processed');

      const renderChart = async () => {
        const sanitized = sanitizeChart(chart);

        try {
          // Reset container
          if (ref.current) ref.current.innerHTML = '';
          
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, sanitized);

          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        } catch (error) {
          console.error('Mermaid parsing error:', error);
          console.log('Attempted chart:\n', sanitized);

          if (ref.current) {
            const escapedChart = sanitized
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');

            ref.current.innerHTML = `
              <div class="text-red-400 p-4 border border-red-500/20 bg-red-500/10 rounded-lg w-full">
                <p class="font-bold mb-2">Error rendering diagram:</p>
                <pre class="text-xs overflow-auto text-red-300 p-2 bg-red-950/50 rounded">${escapedChart}</pre>
              </div>
            `;
          }
        }
      };

      renderChart();
    }
  }, [chart]);

  return (
    <div
      className="mermaid-container w-full overflow-auto flex justify-center py-4"
      ref={ref}
    />
  );
};

export default Mermaid;