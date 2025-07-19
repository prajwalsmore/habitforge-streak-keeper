import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { HabitCard } from "@/components/HabitCard";
import { HabitForm } from "@/components/HabitForm";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { HabitHeatmap } from "@/components/HabitHeatmap";
import { Plus, LogOut, Dumbbell } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

interface Habit {
  id: string;
  name: string;
  goal_type: "daily" | "weekly";
  created_at: string;
  user_id: string;
}

interface Checkin {
  id: string;
  habit_id: string;
  date: string;
  created_at: string;
}

interface Badge {
  id: string;
  user_id: string;
  title: string;
  unlocked_at: string;
}

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHabitForm, setShowHabitForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>();
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [habitsResponse, checkinsResponse, badgesResponse] = await Promise.all([
        supabase.from("habits").select("*").order("created_at", { ascending: false }),
        supabase.from("checkins").select("*"),
        supabase.from("badges").select("*").order("unlocked_at", { ascending: false }),
      ]);

      if (habitsResponse.error) throw habitsResponse.error;
      if (checkinsResponse.error) throw checkinsResponse.error;
      if (badgesResponse.error) throw badgesResponse.error;

      setHabits((habitsResponse.data || []) as Habit[]);
      setCheckins(checkinsResponse.data || []);
      setBadges(badgesResponse.data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (habitId: string): number => {
    const habitCheckins = checkins
      .filter(c => c.habit_id === habitId)
      .map(c => new Date(c.date))
      .sort((a, b) => b.getTime() - a.getTime());

    if (habitCheckins.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's a checkin today or yesterday
    const latestCheckin = habitCheckins[0];
    const daysDiff = Math.floor((today.getTime() - latestCheckin.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 1) return 0; // Streak broken

    let currentDate = new Date(latestCheckin);
    for (let i = 0; i < habitCheckins.length; i++) {
      const checkinDate = habitCheckins[i];
      if (checkinDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const isCheckedToday = (habitId: string): boolean => {
    const today = format(new Date(), "yyyy-MM-dd");
    return checkins.some(c => c.habit_id === habitId && c.date === today);
  };

  const calculateWeeklyProgress = (habitId: string): number => {
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    
    const weekCheckins = checkins.filter(c => {
      const checkinDate = new Date(c.date);
      return c.habit_id === habitId && 
             checkinDate >= weekStart && 
             checkinDate <= weekEnd;
    });

    return (weekCheckins.length / 7) * 100;
  };

  const handleCheckIn = async (habitId: string) => {
    if (isCheckedToday(habitId)) return;

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const { error } = await supabase
        .from("checkins")
        .insert({
          habit_id: habitId,
          date: today,
        });

      if (error) throw error;

      // Refresh checkins
      const { data: newCheckins, error: fetchError } = await supabase
        .from("checkins")
        .select("*");
      
      if (fetchError) throw fetchError;
      setCheckins(newCheckins || []);

      // Check for new badges
      await checkForNewBadges(habitId);

      toast({
        title: "Great job!",
        description: "Habit completed for today!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const checkForNewBadges = async (habitId: string) => {
    const streak = calculateStreak(habitId);
    const newBadges = [];

    if (streak === 7 && !badges.some(b => b.title === "Streak Starter")) {
      newBadges.push({ title: "Streak Starter" });
    }
    if (streak === 30 && !badges.some(b => b.title === "Consistency Champ")) {
      newBadges.push({ title: "Consistency Champ" });
    }

    for (const badge of newBadges) {
      try {
        const { error } = await supabase
          .from("badges")
          .insert({
            user_id: user?.id,
            title: badge.title,
          });

        if (!error) {
          toast({
            title: "New Badge Unlocked!",
            description: `You've earned the "${badge.title}" badge!`,
          });
        }
      } catch (error) {
        console.error("Error creating badge:", error);
      }
    }

    // Refresh badges
    const { data: updatedBadges } = await supabase
      .from("badges")
      .select("*")
      .order("unlocked_at", { ascending: false });
    
    if (updatedBadges) setBadges(updatedBadges);
  };

  const handleCreateHabit = async (data: { name: string; goal_type: "daily" | "weekly" }) => {
    try {
      setFormLoading(true);
      const { error } = await supabase
        .from("habits")
        .insert({
          ...data,
          user_id: user?.id,
        });

      if (error) throw error;

      // Check for "Habit Hero" badge (first habit)
      if (habits.length === 0 && !badges.some(b => b.title === "Habit Hero")) {
        await supabase
          .from("badges")
          .insert({
            user_id: user?.id,
            title: "Habit Hero",
          });
      }

      await fetchData();
      setShowHabitForm(false);
      
      toast({
        title: "Success!",
        description: "Habit created successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateHabit = async (data: { name: string; goal_type: "daily" | "weekly" }) => {
    if (!editingHabit) return;

    try {
      setFormLoading(true);
      const { error } = await supabase
        .from("habits")
        .update(data)
        .eq("id", editingHabit.id);

      if (error) throw error;

      await fetchData();
      setEditingHabit(undefined);
      
      toast({
        title: "Success!",
        description: "Habit updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      const { error } = await supabase
        .from("habits")
        .delete()
        .eq("id", habitId);

      if (error) throw error;

      await fetchData();
      
      toast({
        title: "Habit deleted",
        description: "Habit has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">HabitForge</h1>
          </div>
          <Button variant="ghost" onClick={handleSignOut} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            Keep building those habits. You've got {habits.length} habit{habits.length !== 1 ? 's' : ''} to work on.
          </p>
        </div>

        {/* Badges */}
        <BadgeDisplay userBadges={badges} />

        {/* Heatmap */}
        <HabitHeatmap checkins={checkins} />

        {/* Habits Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Your Habits</h3>
            <Button
              onClick={() => setShowHabitForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Habit
            </Button>
          </div>

          {habits.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">No habits yet</h4>
                <p className="text-muted-foreground mb-4">
                  Create your first habit to start building better routines!
                </p>
                <Button onClick={() => setShowHabitForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Habit
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {habits.map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  streak={calculateStreak(habit.id)}
                  isCheckedToday={isCheckedToday(habit.id)}
                  weeklyProgress={calculateWeeklyProgress(habit.id)}
                  onCheckIn={handleCheckIn}
                  onEdit={setEditingHabit}
                  onDelete={handleDeleteHabit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Habit Form Modal */}
      <HabitForm
        open={showHabitForm || !!editingHabit}
        onOpenChange={(open) => {
          setShowHabitForm(open);
          if (!open) setEditingHabit(undefined);
        }}
        onSubmit={editingHabit ? handleUpdateHabit : handleCreateHabit}
        habit={editingHabit}
        loading={formLoading}
      />
    </div>
  );
};

export default Index;
