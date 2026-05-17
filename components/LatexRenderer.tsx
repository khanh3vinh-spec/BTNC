import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  content: string;
}

const LatexRenderer: React.FC<LatexRendererProps> = ({ content }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const render = async () => {
      if (!containerRef.current) return;

      try {
        // Parse markdown - marked.parse can be async in newer versions
        const htmlContent = await marked.parse(content);
        containerRef.current.innerHTML = htmlContent;

        renderMathInElement(containerRef.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true },
          ],
          throwOnError: false,
          trust: true,
          strict: false
        });
      } catch (err) {
        console.error("Math rendering failure:", err);
      }
    };

    render();
  }, [content]);

  return (
    <div 
      ref={containerRef} 
      className="prose prose-blue max-w-none text-gray-800 math-content"
    />
  );
};

export default LatexRenderer;