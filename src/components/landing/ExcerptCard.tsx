// components/landing/ExcerptCard.tsx
type Props = {
  text: string;
  className?: string;
};

export const ExcerptCard = ({ text, className = '' }: Props) => (
  <blockquote className={`rounded-xl border border-white/10 bg-white/5 p-4 leading-relaxed text-neutral-300 ${className}`}>
    <span className="text-neutral-400">“</span>
    {text}
    <span className="text-neutral-400">”</span>
    <footer className="mt-3 text-xs text-neutral-500">— Member</footer>
  </blockquote>
);