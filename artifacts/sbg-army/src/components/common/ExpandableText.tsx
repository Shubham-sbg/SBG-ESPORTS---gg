import { useState } from 'react';

interface Props {
  text: string;
  limit?: number;
  className?: string;
}

export default function ExpandableText({ text, limit = 150, className = '' }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!text) return null;

  if (text.length <= limit) {
    return <p className={className}>{text}</p>;
  }

  return (
    <p className={className}>
      {expanded ? text : text.substring(0, limit) + '...'}
      {' '}
      <span
        onClick={() => setExpanded(v => !v)}
        style={{ color: 'var(--sbg-primary, #ff6b00)', cursor: 'pointer', fontWeight: 600, marginLeft: 4 }}
      >
        {expanded ? 'Read Less' : 'Read More'}
      </span>
    </p>
  );
}
