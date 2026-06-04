/**
 * 轻量 Markdown → HTML 转换器
 * 用于编辑器粘贴时将 Markdown 文本转换为 HTML，再由 Tiptap parseHTML 安全渲染。
 * 
 * 支持：标题、加粗、斜体、删除线、行内代码、链接、图片、
 *       无序/有序列表、引用、代码围栏、表格、分割线、段落。
 * 
 * 安全说明：生成的 HTML 不会直接插入 DOM（不使用 innerHTML/dangerouslySetInnerHTML），
 * 而是通过 Tiptap editor.commands.insertContent() 由 ProseMirror schema 安全解析。
 */

/** 检测文本是否包含 Markdown 语法特征 */
export function looksLikeMarkdown(text: string): boolean {
  // 至少匹配 2 个不同的 Markdown 语法特征才判定为 Markdown
  let score = 0;
  const checks = [
    /^#{1,6}\s+\S/m,                 // 标题
    /\*\*[^*]+\*\*/,                 // 加粗
    /\*[^*]+\*/,                     // 斜体
    /^[-*+]\s+\S/m,                  // 无序列表
    /^\d+\.\s+\S/m,                  // 有序列表
    /^>\s+\S/m,                      // 引用
    /^```/m,                         // 代码围栏
    /\[.+?\]\(.+?\)/,               // 链接
    /^---$/m,                        // 分割线
    /^\|.+\|$/m,                     // 表格
    /~~[^~]+~~/,                     // 删除线
    /`[^`]+`/,                       // 行内代码
  ];
  for (const re of checks) {
    if (re.test(text)) score++;
    if (score >= 2) return true;
  }
  return false;
}

/** 转义 HTML 特殊字符，防止注入 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 处理行内 Markdown 语法 */
function parseInline(text: string): string {
  let result = escapeHtml(text);

  // 行内代码（先处理，避免内部被其他规则干扰）
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // 图片 ![alt](src)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

  // 链接 [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // 加粗 **text**
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 斜体 *text*（不匹配已被加粗处理的）
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // 删除线 ~~text~~
  result = result.replace(/~~([^~]+)~~/g, '<s>$1</s>');

  return result;
}

/** 解析 Markdown 表格块 → HTML <table> */
function parseTable(lines: string[]): string {
  // lines[0] = header row, lines[1] = separator, lines[2..] = data rows
  const parseRow = (line: string, cellTag: string) => {
    const cells = line.split('|').slice(1, -1); // 去掉首尾空元素
    if (cells.length === 0) return '';
    const cellsHtml = cells
      .map(c => `<${cellTag}>${parseInline(c.trim())}</${cellTag}>`)
      .join('');
    return `<tr>${cellsHtml}</tr>`;
  };

  let html = '<table>';
  html += `<thead>${parseRow(lines[0], 'th')}</thead>`;
  html += '<tbody>';
  for (let i = 2; i < lines.length; i++) {
    html += parseRow(lines[i], 'td');
  }
  html += '</tbody></table>';
  return html;
}

/** 主转换函数：Markdown 文本 → HTML 字符串 */
export function markdownToHtml(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const htmlParts: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── 代码围栏 ```
    const fenceMatch = line.match(/^```(\w*)/);
    if (fenceMatch) {
      const lang = fenceMatch[1] || '';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // 跳过结束的 ```
      const langAttr = lang ? ` data-language="${escapeHtml(lang)}"` : '';
      htmlParts.push(
        `<pre${langAttr}><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`
      );
      continue;
    }

    // ── 表格（连续 | 开头的行，第二行是分隔符）
    if (/^\|.+\|$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|$/.test(lines[i + 1])) {
      const tableLines: string[] = [line];
      let j = i + 1;
      while (j < lines.length && /^\|.+\|$/.test(lines[j])) {
        tableLines.push(lines[j]);
        j++;
      }
      htmlParts.push(parseTable(tableLines));
      i = j;
      continue;
    }

    // ── 分割线
    if (/^(---+|\*\*\*+|___+)\s*$/.test(line)) {
      htmlParts.push('<hr />');
      i++;
      continue;
    }

    // ── 标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      htmlParts.push(`<h${level}>${parseInline(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    // ── 引用块 >
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      // 递归处理引用内容（支持引用中嵌套其他语法）
      htmlParts.push(`<blockquote>${markdownToHtml(quoteLines.join('\n'))}</blockquote>`);
      continue;
    }

    // ── 无序列表
    if (/^[-*+]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[-*+]\s+/, ''));
        i++;
      }
      const itemsHtml = listItems.map(item => `<li>${parseInline(item)}</li>`).join('');
      htmlParts.push(`<ul>${itemsHtml}</ul>`);
      continue;
    }

    // ── 有序列表
    if (/^\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\.\s+/, ''));
        i++;
      }
      const itemsHtml = listItems.map(item => `<li>${parseInline(item)}</li>`).join('');
      htmlParts.push(`<ol>${itemsHtml}</ol>`);
      continue;
    }

    // ── 空行
    if (line.trim() === '') {
      i++;
      continue;
    }

    // ── 普通段落
    htmlParts.push(`<p>${parseInline(line)}</p>`);
    i++;
  }

  return htmlParts.join('');
}
