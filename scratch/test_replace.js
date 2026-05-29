const cellValue = ' **30%** ';
const formattedValue = cellValue
  .replace(/\\/g, '')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
console.log('result:', formattedValue);
