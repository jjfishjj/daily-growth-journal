import { useActiveMarqueeMessages, useMarqueeConfig } from '@/hooks/useMarquee';
import { Volume2 } from 'lucide-react';

export function MarqueeBanner() {
  const { data: config } = useMarqueeConfig();
  const { data: messages } = useActiveMarqueeMessages();

  if (!config?.is_enabled) return null;
  if (!messages || messages.length === 0) return null;

  // Render each message as its own segment with its own colors.
  // Use a single horizontally scrolling track that loops by duplicating the segment list.
  const speed = Math.max(10, config.scroll_speed || 40);

  const renderSegment = (key: string) => (
    <div className="flex items-center shrink-0" key={key}>
      {messages.map((m, i) => {
        const inner = (
          <span className="px-6 py-2 text-sm font-medium whitespace-nowrap">
            {i === 0 && <Volume2 className="inline-block h-4 w-4 mr-2 -mt-0.5" />}
            {m.content}
          </span>
        );
        const style = { backgroundColor: m.bg_color, color: m.text_color };
        return m.link_url ? (
          <a
            key={`${key}-${m.id}`}
            href={m.link_url}
            target={m.link_url.startsWith('http') ? '_blank' : undefined}
            rel="noreferrer"
            className="hover:opacity-90 transition-opacity"
            style={style}
          >
            {inner}
          </a>
        ) : (
          <span key={`${key}-${m.id}`} style={style}>
            {inner}
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="w-full overflow-hidden border-b border-border/50">
      <div
        className="flex w-max marquee-track"
        style={{ animationDuration: `${speed}s` }}
      >
        {renderSegment('a')}
        {renderSegment('b')}
      </div>
      <style>{`
        @keyframes marqueeScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track {
          animation-name: marqueeScroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}
