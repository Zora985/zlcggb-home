const fs = require('fs');
const sql = fs.readFileSync('/Users/zora/.gemini/antigravity-ide/brain/2cdd7d6b-7657-4b9b-905a-925011ae777c/scratch/insert_tutorials.sql', 'utf8');
const idx = sql.indexOf('Git 提交失败或网络超时');
if (idx !== -1) {
  console.log('Context:');
  console.log(sql.substring(idx - 100, idx + 600));
} else {
  console.log('Not found');
}
