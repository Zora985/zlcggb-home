/** 用作下载文件名的安全基名（不含扩展名） */
export function sanitizeSvgDownloadBasename(raw: string): string {
  const t = raw
    .replace(/[/\\?%*:|"<>.\s]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
  return t || 'creation';
}

/** 在浏览器中触发下载单个 SVG 文件 */
export function downloadSvgAsFile(svgSource: string, basename: string): void {
  const base = sanitizeSvgDownloadBasename(basename.replace(/\.svg$/i, ''));
  const blob = new Blob([svgSource], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${base}.svg`;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
