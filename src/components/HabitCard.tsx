import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, Trash2, Edit3, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Habit {
  id: string;
  name: string;
  goal_type: "daily" | "weekly";
  created_at: string;
  user_id: string;
}

interface HabitCardProps {
  habit: Habit;
  streak: number;
  isCheckedToday: boolean;
  weeklyProgress: number;
  onCheckIn: (habitId: string) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

export const HabitCard = ({
  habit,
  streak,
  isCheckedToday,
  weeklyProgress,
  onCheckIn,
  onEdit,
  onDelete,
}: HabitCardProps) => {
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckIn = async () => {
    setIsChecking(true);
    await onCheckIn(habit.id);
    setIsChecking(false);
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-yellow-500";
    if (streak >= 7) return "text-green-500";
    if (streak >= 3) return "text-blue-500";
    return "text-muted-foreground";
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-muted";
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{habit.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {habit.goal_type}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(habit.created_at), "MMM d")}
              </span>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(habit)}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(habit.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Streak Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`text-2xl font-bold ${getStreakColor(streak)}`}>
              {streak}
            </div>
            <div className="text-sm text-muted-foreground">
              day{streak !== 1 ? "s" : ""} streak
            </div>
          </div>
          
          <Button
            onClick={handleCheckIn}
            disabled={isCheckedToday || isChecking}
            variant={isCheckedToday ? "secondary" : "default"}
            size="sm"
            className="flex items-center gap-2"
          >
            {isCheckedToday ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Circle className="h-4 w-4" />
            )}
            {isChecking ? "..." : isCheckedToday ? "Done" : "Check In"}
          </Button>
        </div>

        {/* Weekly Progress */}
        {habit.goal_type === "weekly" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>This week</span>
              <span>{Math.round(weeklyProgress)}%</span>
            </div>
            <Progress 
              value={weeklyProgress} 
              className="h-2"
            />
          </div>
        )}

        {/* Daily Progress Ring for Daily Habits */}
        {habit.goal_type === "daily" && (
          <div className="flex items-center justify-center">
            <div className="relative">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted stroke-2"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={`${isCheckedToday ? 88 : 0} 88`}
                  className={`${isCheckedToday ? "text-primary" : "text-muted"} transition-all duration-300`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                {isCheckedToday ? (
                  <CheckCircle className="h-6 w-6 text-primary" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};