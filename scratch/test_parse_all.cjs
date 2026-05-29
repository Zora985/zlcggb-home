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
list.forEach((doc, idx) => {
  console.log(`\n--- Doc ${idx + 1}: ${doc.title} (${doc.slug}) ---`);
  try {
    const content = JSON.parse(doc.content);
    console.log("Successfully parsed JSON!");
  } catch (err) {
    console.error("JSON Parse failed:", err.message);
    // 打印发生错误附近的部分字符
    console.error("Content preview (first 500 chars):");
    console.error(doc.content.substring(0, 500));
    console.error("Content preview (last 500 chars):");
    console.error(doc.content.substring(doc.content.length - 500));
  }
});
