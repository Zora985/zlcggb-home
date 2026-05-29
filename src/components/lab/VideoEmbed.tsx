import { ExternalLink } from 'lucide-react';

interface VideoEmbedProps {
  url: string;
}

/** 白名单域名 */
const ALLOWED_DOMAINS = ['bilibili.com', 'youtube.com', 'youtu.be'] as const;

/** 解析视频 URL，提取平台和 ID */
function parseVideoUrl(url: string): { platform: 'bilibili' | 'youtube' | null; id: string } {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace('www.', '');

    // 安全校验：只允许白名单域名
    const isAllowed = ALLOWED_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
    if (!isAllowed) return { platform: null, id: '' };

    // B站
    if (hostname.includes('bilibili.com')) {
      const bvMatch = parsed.pathname.match(/\/video\/(BV[\w]+)/);
      if (bvMatch) return { platform: 'bilibili', id: bvMatch[1] };
    }

    // YouTube
    if (hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return { platform: 'youtube', id: videoId };
    }
    if (hostname === 'youtu.be') {
      const videoId = parsed.pathname.slice(1);
      if (videoId) return { platform: 'youtube', id: videoId };
    }
  } catch {
    // URL 解析失败
  }

  return { platform: null, id: '' };
}

export default function VideoEmbed({ url }: VideoEmbedProps) {
  const { platform, id } = parseVideoUrl(url);

  if (!platform) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 px-4 py-3 bg-apple-gray-100 rounded-xl text-apple-blue text-sm hover:bg-apple-blue/5 transition-colors"
      >
        <ExternalLink size={16} />
        观看视频（外链）
      </a>
    );
  }

  const src =
    platform === 'bilibili'
      ? `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(id)}&autoplay=0&high_quality=1`
      : `https://www.youtube.com/embed/${encodeURIComponent(id)}`;

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black">
      <iframe
        src={src}
        title="视频播放器"
        className="absolute inset-0 w-full h-full"
        allow="autoplay; encrypted-media; picture-in-picture"
        sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}
