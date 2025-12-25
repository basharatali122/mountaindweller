import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserPlus } from "lucide-react";

interface TeamMember {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  rank: string | null;
}

interface TeamMembersListProps {
  userId: string;
}

export const TeamMembersList = ({ userId }: TeamMembersListProps) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const { data, error } = await supabase
          .from("referrals")
          .select("referred_id, created_at")
          .eq("referrer_id", userId);

        if (error) throw error;

        if (data && data.length > 0) {
          const memberIds = data.map((r) => r.referred_id);
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, email, created_at, rank")
            .in("id", memberIds);

          if (profilesError) throw profilesError;
          setMembers(profiles || []);
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMembers();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display text-xl font-bold text-foreground mb-4">
          Team Members
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3">
              <div className="w-10 h-10 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          Team Members
        </h2>
        <span className="text-sm text-muted-foreground">
          {members.length} member{members.length !== 1 ? "s" : ""}
        </span>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p>No team members yet</p>
          <p className="text-sm">Share your referral code to build your team</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[300px] overflow-y-auto">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {member.full_name || "Member"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {member.email}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {member.rank || "Member"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
