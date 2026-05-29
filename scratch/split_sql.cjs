const fs = require('fs');
const sql = fs.readFileSync('/Users/zora/.gemini/antigravity-ide/brain/2cdd7d6b-7657-4b9b-905a-925011ae777c/scratch/insert_tutorials.sql', 'utf8');
const statements = sql.split('INSERT INTO public.zlcggb_tutorials');
let count = 1;
for (let part of statements) {
  part = part.trim();
  if (!part) continue;
  const fullStatement = 'INSERT INTO public.zlcggb_tutorials ' + part;
  fs.writeFileSync(`/Users/zora/.gemini/antigravity-ide/brain/2cdd7d6b-7657-4b9b-905a-925011ae777c/scratch/insert_${count}.sql`, fullStatement);
  console.log(`Saved scratch/insert_${count}.sql`);
  count++;
}
