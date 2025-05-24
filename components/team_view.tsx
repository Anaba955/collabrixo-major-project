import { useState } from "react";


type TeamMember = {
  id: number;
  name: string;
  designation: string;
};

export default function SimpleTooltip({
  items,
  onAddMember,
}: {
  items: TeamMember[];
  onAddMember: () => void;
}) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 3;

  const startIndex = page * pageSize;
  const visibleItems = items.slice(startIndex, startIndex + pageSize);
  const isLastPage = startIndex + pageSize >= items.length;
  const remainingCount = Math.max(items.length - (startIndex + pageSize), 0);

  const handleNext = () => {
    if (isLastPage) {
      // Do nothing or loop back if you want
    } else {
      setPage(page + 1);
    }
  };

  const handleAdd = () => {
    onAddMember();
    setPage(0); // Optional: reset to first page after adding
  };

  const getRandomColor = (seed: number): string => {
    const colors: string[] = [
      "#f87171", // red-400
      "#facc15", // yellow-400
      "#34d399", // green-400
      "#60a5fa", // blue-400
      "#a78bfa", // purple-400
      "#f472b6", // pink-400
    ];
    return colors[seed % colors.length];
  };

  return (
    <div className="flex -space-x-3">
      {visibleItems.map((item, index) => (
        <div
          key={item.id}
          className="relative group"
          onMouseEnter={() => setActiveId(item.id)}
          onMouseLeave={() => setActiveId(null)}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold cursor-pointer border-2 border-white"
            style={{ backgroundColor: getRandomColor(index) }}
          >
            {item.name.charAt(0).toUpperCase()}
          </div>

          {activeId === item.id && (
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-40 p-2 bg-white border border-gray-200 rounded-lg shadow-lg text-center z-50">
              <p className="text-sm font-semibold text-gray-800">{item.name}</p>
              <p className="text-xs text-gray-500">{item.designation}</p>
            </div>
          )}
        </div>
      ))}

      {/* +X Circle or Add (+) Button */}
      {items.length > pageSize && !isLastPage ? (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-300 text-gray-700 text-sm font-semibold border-2 border-white cursor-pointer"
          onClick={handleNext}
          title="Show next members"
        >
          +{remainingCount}
        </div>
      ) : (
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-300 text-white text-xl font-bold border-2 border-white cursor-pointer"
          onClick={handleAdd}
          title="Add new member"
        >
          +
        </div>
      )}
    </div>
  );
}
