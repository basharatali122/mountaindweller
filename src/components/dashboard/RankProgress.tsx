import { CheckCircle, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RankProgressProps {
  currentRank: string | null;
  teamCount: number;
}

const RANKS = [
  { name: "MD Starter", required: 1, bonus: "40% Direct" },
  { name: "MD Explorer", required: 10, bonus: "41% Direct" },
  { name: "MD Builder", required: 25, bonus: "45% Direct + 2% Passive" },
  { name: "MD Leader", required: 50, bonus: "50% Direct + 4% Passive" },
  { name: "MD Mentor", required: 100, bonus: "60% Direct + 5% Passive" },
  { name: "MD Director", required: 250, bonus: "Elite tier" },
  { name: "MD Ambassador", required: 500, bonus: "Top tier" },
];

export const RankProgress = ({ currentRank, teamCount }: RankProgressProps) => {
  const currentRankIndex = Math.max(RANKS.findIndex((r) => r.name === currentRank), 0);
  const nextRank = RANKS[currentRankIndex + 1];
  
  const progressToNext = nextRank
    ? Math.min(
        ((teamCount - RANKS[currentRankIndex].required) /
          (nextRank.required - RANKS[currentRankIndex].required)) *
          100,
        100
      )
    : 100;

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          Rank Progress
        </h2>
        <Trophy className="w-5 h-5 text-gold" />
      </div>

      {/* Current Rank Highlight */}
      <div className="bg-gradient-hero rounded-xl p-4 mb-4 text-primary-foreground">
        <p className="text-sm opacity-80">Current Rank</p>
        <p className="font-display text-2xl font-bold">{currentRank || "MD Starter"}</p>
        {nextRank && (
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span>Progress to {nextRank.name}</span>
              <span>{teamCount}/{nextRank.required} members</span>
            </div>
            <Progress value={progressToNext} className="h-2 bg-primary-foreground/20" />
          </div>
        )}
      </div>

      {/* Rank Ladder */}
      <div className="space-y-2">
        {RANKS.map((rank, index) => {
          const isActive = currentRank === rank.name;
          const isPast = teamCount >= rank.required;

          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-primary/10 border border-primary/30"
                  : isPast
                  ? "bg-secondary/50"
                  : "opacity-60"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isPast
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {rank.required}
              </div>
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    isActive ? "text-primary" : "text-foreground"
                  }`}
                >
                  {rank.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {rank.required} members · {rank.bonus}
                </p>
              </div>
              {isPast && <CheckCircle className="w-5 h-5 text-primary" />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
