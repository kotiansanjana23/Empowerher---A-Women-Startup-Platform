import type { ComponentType } from "react";
import { Card, CardContent } from "./card";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: ComponentType<{ className?: string }>;
  trend?: "up" | "down";
}

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  trend,
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl mb-2">{value}</p>
            {change && (
              <p
                className={`text-xs ${
                  trend === "up" ? "text-green-600" : "text-destructive"
                }`}
              >
                {change}
              </p>
            )}
          </div>
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
