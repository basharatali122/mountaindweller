import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, Clock, Users, Gift, Package, Banknote, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ReferralBonus {
  id: string;
  user_id: string;
  referrer_id: string;
  level: number;
  bonus_amount: number;
  source_type: string;
  source_amount: number;
  created_at: string;
  referrer_email?: string;
  user_email?: string;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  bonus_amount: number;
  is_paid: boolean;
  created_at: string;
  referrer_email?: string;
  referred_email?: string;
}

interface Stats {
  totalReferrals: number;
  paidReferrals: number;
  pendingReferrals: number;
  totalBonusPaid: number;
  packageBonuses: number;
  investmentBonuses: number;
  level1Bonuses: number;
  level2Bonuses: number;
}

const AdminReferrals = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [bonuses, setBonuses] = useState<ReferralBonus[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReferrals: 0,
    paidReferrals: 0,
    pendingReferrals: 0,
    totalBonusPaid: 0,
    packageBonuses: 0,
    investmentBonuses: 0,
    level1Bonuses: 0,
    level2Bonuses: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all profiles for email lookup
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, email");
      
      const profileMap = new Map<string, string>();
      profilesData?.forEach(p => profileMap.set(p.id, p.email));
      setProfiles(profileMap);

      // Fetch referrals
      const { data: referralsData, error: refError } = await supabase
        .from("referrals")
        .select("*")
        .order("created_at", { ascending: false });

      if (refError) throw refError;

      const enrichedReferrals = (referralsData || []).map(r => ({
        ...r,
        referrer_email: profileMap.get(r.referrer_id) || 'Unknown',
        referred_email: profileMap.get(r.referred_id) || 'Unknown'
      }));
      setReferrals(enrichedReferrals);

      // Fetch referral bonuses
      const { data: bonusesData, error: bonusError } = await supabase
        .from("referral_bonuses")
        .select("*")
        .order("created_at", { ascending: false });

      if (!bonusError && bonusesData) {
        const enrichedBonuses = bonusesData.map(b => ({
          ...b,
          referrer_email: profileMap.get(b.referrer_id) || 'Unknown',
          user_email: profileMap.get(b.user_id) || 'Unknown'
        }));
        setBonuses(enrichedBonuses);

        // Calculate stats from bonuses
        const packageBonuses = bonusesData.filter(b => b.source_type === 'package').reduce((sum, b) => sum + b.bonus_amount, 0);
        const investmentBonuses = bonusesData.filter(b => b.source_type === 'investment').reduce((sum, b) => sum + b.bonus_amount, 0);
        const level1Bonuses = bonusesData.filter(b => b.level === 1).reduce((sum, b) => sum + b.bonus_amount, 0);
        const level2Bonuses = bonusesData.filter(b => b.level === 2).reduce((sum, b) => sum + b.bonus_amount, 0);

        setStats({
          totalReferrals: referralsData?.length || 0,
          paidReferrals: referralsData?.filter(r => r.is_paid).length || 0,
          pendingReferrals: referralsData?.filter(r => !r.is_paid).length || 0,
          totalBonusPaid: packageBonuses + investmentBonuses,
          packageBonuses,
          investmentBonuses,
          level1Bonuses,
          level2Bonuses
        });
      } else {
        // Fallback stats from referrals table
        setStats({
          totalReferrals: referralsData?.length || 0,
          paidReferrals: referralsData?.filter(r => r.is_paid).length || 0,
          pendingReferrals: referralsData?.filter(r => !r.is_paid).length || 0,
          totalBonusPaid: referralsData?.reduce((sum, r) => sum + (r.bonus_amount || 0), 0) || 0,
          packageBonuses: 0,
          investmentBonuses: 0,
          level1Bonuses: 0,
          level2Bonuses: 0
        });
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Referrals" description="View referral network and bonuses">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Referrals" description="View referral network and bonuses">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.paidReferrals} activated, {stats.pendingReferrals} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bonuses Paid</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.totalBonusPaid.toLocaleString()} PKR</div>
            <p className="text-xs text-muted-foreground">
              All referral bonuses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Package Bonuses</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gold">{stats.packageBonuses.toLocaleString()} PKR</div>
            <p className="text-xs text-muted-foreground">
              From package purchases
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment Bonuses</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{stats.investmentBonuses.toLocaleString()} PKR</div>
            <p className="text-xs text-muted-foreground">
              From direct investments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Level Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level 1 Bonuses</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.level1Bonuses.toLocaleString()} PKR</div>
            <p className="text-xs text-muted-foreground">Direct referral bonuses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level 2 Bonuses</CardTitle>
            <TrendingUp className="h-4 w-4 text-sky" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky">{stats.level2Bonuses.toLocaleString()} PKR</div>
            <p className="text-xs text-muted-foreground">Indirect referral bonuses</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="bonuses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bonuses">Bonus History</TabsTrigger>
          <TabsTrigger value="referrals">Referral Network</TabsTrigger>
        </TabsList>

        <TabsContent value="bonuses">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>From User</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source Amount</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bonuses.map((bonus) => (
                  <TableRow key={bonus.id}>
                    <TableCell>
                      <span className="text-sm font-medium">{bonus.referrer_email}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{bonus.user_email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={bonus.level === 1 ? "default" : "secondary"}>
                        Level {bonus.level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={bonus.source_type === 'package' ? 'border-gold text-gold' : 'border-emerald-500 text-emerald-500'}>
                        {bonus.source_type === 'package' ? (
                          <><Package className="w-3 h-3 mr-1" /> Package</>
                        ) : (
                          <><Banknote className="w-3 h-3 mr-1" /> Investment</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {bonus.source_amount.toLocaleString()} PKR
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-accent">{bonus.bonus_amount.toLocaleString()} PKR</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(bonus.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {bonuses.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No bonus history found
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="referrals">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Referrer</TableHead>
                  <TableHead>Referred User</TableHead>
                  <TableHead>Initial Bonus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {referrals.map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell>
                      <span className="text-sm font-medium">{referral.referrer_email}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{referral.referred_email}</span>
                    </TableCell>
                    <TableCell>
                      {referral.bonus_amount > 0 ? (
                        <span className="font-medium text-accent">{referral.bonus_amount.toLocaleString()} PKR</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {referral.is_paid ? (
                        <Badge className="bg-primary/10 text-primary">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Activated
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {referrals.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No referrals found
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminReferrals;