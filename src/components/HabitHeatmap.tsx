import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format, startOfYear, eachDayOfInterval, endOfYear, isSameDay } from "date-fns";

interface CheckinData {
  date: string;
  habit_id: string;
}

interface HabitHeatmapProps {
  checkins: CheckinData[];
  selectedHabitId?: string;
}

export const HabitHeatmap = ({ checkins, selectedHabitId }: HabitHeatmapProps) => {
  const currentYear = new Date().getFullYear();
  const startDate = startOfYear(new Date(currentYear, 0, 1));
  const endDate = endOfYear(new Date(currentYear, 11, 31));
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Filter checkins for selected habit or all habits
  const filteredCheckins = selectedHabitId 
    ? checkins.filter(c => c.habit_id === selectedHabitId)
    : checkins;

  // Group checkins by date
  const checkinsByDate = filteredCheckins.reduce((acc, checkin) => {
    const dateKey = checkin.date;
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getIntensity = (count: number) => {
    if (count === 0) return "bg-muted/20";
    if (count === 1) return "bg-green-200";
    if (count === 2) return "bg-green-400";
    if (count >= 3) return "bg-green-600";
    return "bg-green-800";
  };

  const getTooltip = (day: Date, count: number) => {
    const dateStr = format(day, "MMM d, yyyy");
    if (count === 0) return `${dateStr}: No activity`;
    return `${dateStr}: ${count} habit${count > 1 ? 's' : ''} completed`;
  };

  // Group days by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  days.forEach((day, index) => {
    if (index === 0) {
      // Add empty cells for days before the first day of the year
      const dayOfWeek = day.getDay();
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push(new Date(0)); // placeholder
      }
    }
    
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  // Add the last week if it has days
  if (currentWeek.length > 0) {
    // Fill the rest with empty cells
    while (currentWeek.length < 7) {
      currentWeek.push(new Date(0)); // placeholder
    }
    weeks.push(currentWeek);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Activity Heatmap - {currentYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Month labels */}
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            {[
              "Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
            ].map((month, index) => (
              <span key={month} className="flex-1 text-center">
                {index % 2 === 0 ? month : ""}
              </span>
            ))}
          </div>
          
          {/* Heatmap grid */}
          <div className="overflow-x-auto">
            <div className="inline-flex flex-col gap-1 min-w-fit">
              {/* Day labels */}
              <div className="flex gap-1 mb-1">
                <div className="w-3"></div> {/* spacer for day labels */}
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className="w-3 h-3 text-xs flex items-center justify-center text-muted-foreground"
                      >
                        {dayIndex === 1 && day.getTime() !== 0 ? "M" : ""}
                        {dayIndex === 3 && day.getTime() !== 0 ? "W" : ""}
                        {dayIndex === 5 && day.getTime() !== 0 ? "F" : ""}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              
              {/* Heatmap */}
              <div className="flex gap-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => {
                      if (day.getTime() === 0) {
                        return <div key={dayIndex} className="w-3 h-3"></div>;
                      }
                      
                      const dateKey = format(day, "yyyy-MM-dd");
                      const count = checkinsByDate[dateKey] || 0;
                      
                      return (
                        <div
                          key={dayIndex}
                          className={`w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:scale-110 ${getIntensity(count)}`}
                          title={getTooltip(day, count)}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted/20"></div>
              <div className="w-3 h-3 rounded-sm bg-green-200"></div>
              <div className="w-3 h-3 rounded-sm bg-green-400"></div>
              <div className="w-3 h-3 rounded-sm bg-green-600"></div>
              <div className="w-3 h-3 rounded-sm bg-green-800"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};