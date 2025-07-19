import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Target, Award } from "lucide-react";

interface BadgeData {
  id: string;
  title: string;
  unlocked_at: string;
}

interface BadgeDisplayProps {
  userBadges: BadgeData[];
}

const AVAILABLE_BADGES = [
  {
    title: "Streak Starter",
    description: "Complete a 7-day streak",
    icon: Star,
    requirement: 7,
    color: "bg-blue-500",
  },
  {
    title: "Consistency Champ",
    description: "Complete a 30-day streak",
    icon: Trophy,
    requirement: 30,
    color: "bg-yellow-500",
  },
  {
    title: "Habit Hero",
    description: "Create your first habit",
    icon: Target,
    requirement: 1,
    color: "bg-green-500",
  },
  {
    title: "Century Club",
    description: "Complete a 100-day streak",
    icon: Award,
    requirement: 100,
    color: "bg-purple-500",
  },
];

export const BadgeDisplay = ({ userBadges }: BadgeDisplayProps) => {
  const unlockedTitles = userBadges.map(badge => badge.title);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {AVAILABLE_BADGES.map((badge) => {
            const isUnlocked = unlockedTitles.includes(badge.title);
            const IconComponent = badge.icon;
            
            return (
              <div
                key={badge.title}
                className={`p-4 rounded-lg border-2 text-center transition-all duration-200 ${
                  isUnlocked
                    ? `${badge.color} text-white border-transparent shadow-lg scale-105`
                    : "bg-muted/20 text-muted-foreground border-dashed border-muted-foreground/20 grayscale"
                }`}
              >
                <IconComponent 
                  className={`h-8 w-8 mx-auto mb-2 ${
                    isUnlocked ? "text-white" : "text-muted-foreground"
                  }`} 
                />
                <div className="space-y-1">
                  <div className={`font-semibold text-sm ${
                    isUnlocked ? "text-white" : "text-muted-foreground"
                  }`}>
                    {badge.title}
                  </div>
                  <div className={`text-xs ${
                    isUnlocked ? "text-white/80" : "text-muted-foreground/60"
                  }`}>
                    {badge.description}
                  </div>
                  {isUnlocked && (
                    <Badge variant="secondary" className="mt-1 bg-white/20 text-white text-xs">
                      Unlocked!
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};