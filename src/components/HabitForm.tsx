import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Habit {
  id: string;
  name: string;
  goal_type: "daily" | "weekly";
  created_at: string;
  user_id: string;
}

interface HabitFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; goal_type: "daily" | "weekly" }) => void;
  habit?: Habit;
  loading?: boolean;
}

export const HabitForm = ({
  open,
  onOpenChange,
  onSubmit,
  habit,
  loading = false,
}: HabitFormProps) => {
  const [name, setName] = useState(habit?.name || "");
  const [goalType, setGoalType] = useState<"daily" | "weekly">(habit?.goal_type || "daily");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    onSubmit({
      name: name.trim(),
      goal_type: goalType,
    });
    
    // Reset form if it's a new habit
    if (!habit) {
      setName("");
      setGoalType("daily");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    // Reset form when closing
    if (!newOpen && !habit) {
      setName("");
      setGoalType("daily");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {habit ? "Edit Habit" : "Create New Habit"}
          </DialogTitle>
          <DialogDescription>
            {habit 
              ? "Update your habit details below."
              : "Create a new habit to start tracking your progress."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Read for 30 minutes"
              required
            />
          </div>
          
          <div className="space-y-3">
            <Label>Goal Type</Label>
            <RadioGroup
              value={goalType}
              onValueChange={(value) => setGoalType(value as "daily" | "weekly")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="daily" />
                <Label htmlFor="daily">Daily - Track every day</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly">Weekly - Track progress throughout the week</Label>
              </div>
            </RadioGroup>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Saving..." : habit ? "Update Habit" : "Create Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};