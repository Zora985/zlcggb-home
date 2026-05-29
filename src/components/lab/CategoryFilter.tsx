interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect('')}
        className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
          selected === ''
            ? 'bg-apple-blue text-white scale-105'
            : 'bg-white text-apple-gray-500 border border-apple-gray-200 hover:border-apple-blue/30 hover:text-apple-blue'
        }`}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
            selected === cat
              ? 'bg-apple-blue text-white scale-105'
              : 'bg-white text-apple-gray-500 border border-apple-gray-200 hover:border-apple-blue/30 hover:text-apple-blue'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
