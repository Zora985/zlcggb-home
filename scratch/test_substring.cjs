const fs = require('fs');
const fileContent = fs.readFileSync('/Users/zora/.gemini/antigravity-ide/brain/2cdd7d6b-7657-4b9b-905a-925011ae777c/.system_generated/steps/381/output.txt', 'utf8');
const wrapper = JSON.parse(fileContent);
const resultStr = wrapper.result;
const match = resultStr.match(/\[\s*\{[\s\S]+\}\s*\]/);
if (!match) {
  console.log("No array match found");
  process.exit(1);
}
const list = JSON.parse(match[0]);
const doc = list.find(item => item.slug === 'design-thinking-and-color');
const content = JSON.parse(doc.content);
const tableNode = content.content.find(node => node.type === 'codeBlock' && node.attrs && node.attrs.language === 'table');
console.log('Table text:');
console.log(tableNode.content[0].text);
