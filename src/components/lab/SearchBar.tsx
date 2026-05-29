import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        size={18}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-apple-gray-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="搜索教程..."
        className="w-full pl-10 pr-10 py-2.5 bg-apple-gray-100 border border-transparent rounded-xl text-sm text-apple-gray-600 placeholder:text-apple-gray-400 focus:outline-none focus:border-apple-blue/30 focus:bg-white transition-all duration-300"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-apple-gray-400 hover:text-apple-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
