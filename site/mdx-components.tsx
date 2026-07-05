import type { MDXComponents } from 'mdx/types';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: (props) => <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 44, margin: '0 0 12px' }} {...props} />,
    h2: (props) => <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 22, margin: '28px 0 8px' }} {...props} />,
    p: (props) => <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, lineHeight: 1.7, margin: '0 0 12px' }} {...props} />,
    strong: (props) => <strong style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }} {...props} />,
    em: (props) => <em style={{ fontFamily: 'var(--font-italic)', fontStyle: 'italic' }} {...props} />,
    ...components
  };
}
