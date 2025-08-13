import React from "react";

interface MindMapProps {
  root: string;
  childrenLabels: string[];
  width?: number;
  height?: number;
}

export const MindMap: React.FC<MindMapProps> = ({ root, childrenLabels, width = 480, height = 220 }) => {
  const padding = 16;
  const rootX = width / 2;
  const rootY = 32;
  const childY = 140;
  const childCount = childrenLabels.length;
  const spacing = Math.max(120, Math.min(220, (width - padding * 2) / Math.max(1, childCount)));
  const startX = rootX - (spacing * (childCount - 1)) / 2;

  const box = (x: number, y: number, label: string, isRoot = false) => (
    <g key={`${label}-${x}-${y}`}> 
      <rect
        x={x - 70}
        y={y - 18}
        rx={10}
        ry={10}
        width={140}
        height={36}
        className={isRoot ? "fill-primary/10 stroke-primary/30" : "fill-secondary/50 stroke-border"}
      />
      <text x={x} y={y + 4} textAnchor="middle" className="text-xs fill-foreground select-none">
        {label.length > 26 ? label.slice(0, 24) + "…" : label}
      </text>
    </g>
  );

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="block">
        {/* Connections */}
        {childrenLabels.map((label, i) => {
          const cx = startX + i * spacing;
          return (
            <g key={`line-${i}`}>
              <line x1={rootX} y1={rootY + 18} x2={cx} y2={childY - 18} className="stroke-border" strokeWidth={1.5} />
            </g>
          );
        })}

        {/* Nodes */}
        {box(rootX, rootY, root, true)}
        {childrenLabels.length === 0 ? (
          <text x={width/2} y={childY} textAnchor="middle" className="text-xs fill-muted-foreground">No sources selected</text>
        ) : (
          childrenLabels.map((label, i) => box(startX + i * spacing, childY, label))
        )}
      </svg>
    </div>
  );
};
