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

function inferSvgRenderSize(svgSource: string): { w: number; h: number } {
  const vb = svgSource.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (vb) {
    const parts = vb[1].trim().split(/[\s,]+/).map((p) => parseFloat(p));
    if (parts.length >= 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3]) && parts[2] > 0 && parts[3] > 0) {
      return { w: Math.round(parts[2]), h: Math.round(parts[3]) };
    }
  }
  const wm = svgSource.match(/\bwidth\s*=\s*["']([0-9.]+)/i);
  const hm = svgSource.match(/\bheight\s*=\s*["']([0-9.]+)/i);
  const w = wm ? parseFloat(wm[1]) : 800;
  const h = hm ? parseFloat(hm[1]) : 450;
  return { w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) };
}

function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('SVG 预览加载失败'));
    img.src = url;
  });
}

/** 当前环境是否支持 canvas 导出为 WebP */
export function canExportWebp(): boolean {
  try {
    const c = document.createElement('canvas');
    return c.toDataURL('image/webp', 0.1).startsWith('data:image/webp');
  } catch {
    return false;
  }
}

/**
 * 将 SVG 光栅化为 PNG / WebP 并下载（适合像素风：关平滑，小图适度放大）
 */
export async function downloadSvgAsRaster(
  svgSource: string,
  basename: string,
  mime: 'image/png' | 'image/webp',
): Promise<void> {
  const safe = sanitizeSvgDownloadBasename(basename.replace(/\.(svg|png|webp)$/i, ''));
  const { w: vw, h: vh } = inferSvgRenderSize(svgSource);
  const blob = new Blob([svgSource], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImageFromUrl(url);
    let dw = img.naturalWidth || vw;
    let dh = img.naturalHeight || vh;
    if (!dw || !dh) {
      dw = vw;
      dh = vh;
    }
    const maxDim = Math.max(dw, dh);
    let scale = 1;
    if (maxDim < 48) scale = 8;
    else if (maxDim < 96) scale = 4;
    else if (maxDim < 256) scale = 2;
    const cap = 4096;
    const outW = Math.min(cap, Math.max(1, Math.round(dw * scale)));
    const outH = Math.min(cap, Math.max(1, Math.round(dh * scale)));

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建画布');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, outW, outH);

    const ext = mime === 'image/webp' ? 'webp' : 'png';
    const outBlob = await new Promise<Blob | null>((res) => {
      if (mime === 'image/webp') {
        canvas.toBlob((b) => res(b), mime, 0.92);
      } else {
        canvas.toBlob((b) => res(b), mime);
      }
    });
    if (!outBlob) throw new Error('导出失败');

    const a = document.createElement('a');
    const objUrl = URL.createObjectURL(outBlob);
    a.href = objUrl;
    a.download = `${safe}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}
