type ModelTabProps = {
  modelName: string;
  isSelected: boolean;
  isLoading: boolean;
  isCompleted: boolean;
  onClick: () => void;
};

export function ModelTab({
  modelName,
  isSelected,
  isLoading,
  isCompleted,
  onClick,
}: ModelTabProps) {
  return (
    <div
      className={`text-white p-4 w-1/3 text-xl hover:bg-gray-100/10 cursor-pointer transition-all ${
        isSelected ? "border-b-2 border-white" : ""
      }`}
      onClick={onClick}>
      {modelName}
      <div className="text-base text-gray-500 flex items-center gap-1">
        {isLoading ? (
          <>
            <span>응답 생성 중...</span>
          </>
        ) : isCompleted ? (
          "Completed"
        ) : (
          "Ready"
        )}
      </div>
    </div>
  );
}
