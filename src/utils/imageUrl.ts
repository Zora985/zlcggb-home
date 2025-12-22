/**
 * 图片URL工具函数
 * 开发环境：使用代理路径 /api/images/...
 * 生产环境：使用完整URL https://file.unilumin-gtm.com/...
 */

const IMAGE_BASE_URL = 'https://file.unilumin-gtm.com';
const PROXY_PREFIX = '/api/images';

/**
 * 将图片路径转换为正确的URL
 * @param imagePath 图片路径，例如：719dd328-3fee-4364-80a7-fb7a2a4e2881/1765715886689-蝎子.png
 * @returns 完整的图片URL
 */
export function getImageUrl(imagePath: string): string {
  // 如果已经是完整URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // 如果已经是 data URL，直接返回
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  // 开发环境：使用代理路径
  if (import.meta.env.DEV) {
    // 如果已经是代理路径，直接返回
    if (imagePath.startsWith(PROXY_PREFIX)) {
      return imagePath;
    }
    // 否则添加代理前缀
    return `${PROXY_PREFIX}/${imagePath}`;
  }

  // 生产环境：使用完整URL
  // 如果已经是代理路径，转换为完整URL
  if (imagePath.startsWith(PROXY_PREFIX)) {
    const path = imagePath.replace(PROXY_PREFIX, '');
    return `${IMAGE_BASE_URL}${path}`;
  }
  
  // 否则直接拼接
  return `${IMAGE_BASE_URL}/${imagePath}`;
}

/**
 * 批量转换图片URL数组
 */
export function getImageUrls(imagePaths: string[]): string[] {
  return imagePaths.map(getImageUrl);
}

