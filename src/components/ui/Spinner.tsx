interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
}

export default function Spinner({
  size = "md",
  fullScreen = false,
  className = "",
}: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const spinner = (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-2 rounded-full animate-spin flex-shrink-0`}
        style={{
          borderColor: "rgba(46, 230, 214, 0.15)",
          borderTopColor: "var(--color-mint)",
          borderRightColor: "rgba(46, 230, 214, 0.15)",
          borderBottomColor: "rgba(46, 230, 214, 0.15)",
        }}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}
