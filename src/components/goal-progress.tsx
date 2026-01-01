import { Progress } from "./ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface GoalProgressProps {
  type: "movie" | "book";
  current: number;
  target: number;
}

export function GoalProgress({ type, current, target }: GoalProgressProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const label = type === "movie" ? "Movies" : "Books";
  const emoji = type === "movie" ? "🎬" : "📚";

  return (
    <Card className="card-glow">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <span className="text-gradient font-bold">{label}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm mb-3">
          <span className="font-medium">
            {current} / {target}
          </span>
          <span className="text-gradient font-bold">{Math.round(percentage)}%</span>
        </div>
        <Progress value={percentage} className="h-3" />
      </CardContent>
    </Card>
  );
}
