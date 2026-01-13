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
import { Banknote, TrendingUp, Users, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Investment {
  id: string;
  user_id: string;
  amount: number;
  bonus_percentage: number;
  bonus_amount: number;
  status: string;
  created_at: string;
  user_email?: string;
}

interface Stats {
  totalInvestments: number;
  totalAmount: number;
  totalBonusPaid: number;
  activeCount: number;
}

const AdminInvestments = () => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalInvestments: 0,
    totalAmount: 0,
    totalBonusPaid: 0,
    activeCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

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

      // Fetch investments
      const { data: investmentsData, error } = await supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const enrichedInvestments = (investmentsData || []).map(inv => ({
        ...inv,
        user_email: profileMap.get(inv.user_id) || 'Unknown'
      }));
      setInvestments(enrichedInvestments);

      // Calculate stats
      const totalAmount = investmentsData?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
      const totalBonusPaid = investmentsData?.reduce((sum, inv) => sum + inv.bonus_amount, 0) || 0;
      const activeCount = investmentsData?.filter(inv => inv.status === 'active').length || 0;

      setStats({
        totalInvestments: investmentsData?.length || 0,
        totalAmount,
        totalBonusPaid,
        activeCount
      });
    } catch (error) {
      console.error("Error fetching investments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Investments" description="View direct investments">
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
    <AdminLayout title="Investments" description="View direct investments without packages">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvestments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeCount} currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAmount.toLocaleString()} PKR</div>
            <p className="text-xs text-muted-foreground">
              Total investment amount
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bonuses Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{stats.totalBonusPaid.toLocaleString()} PKR</div>
            <p className="text-xs text-muted-foreground">
              Direct investment bonuses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Return</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalAmount > 0 
                ? Math.round((stats.totalBonusPaid / stats.totalAmount) * 100) 
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average bonus percentage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Investments Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bonus %</TableHead>
              <TableHead>Bonus Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.map((investment) => (
              <TableRow key={investment.id}>
                <TableCell>
                  <span className="font-medium">{investment.user_email}</span>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{investment.amount.toLocaleString()} PKR</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{investment.bonus_percentage}%</Badge>
                </TableCell>
                <TableCell>
                  <span className="font-medium text-accent">
                    +{investment.bonus_amount.toLocaleString()} PKR
                  </span>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={
                      investment.status === 'active' 
                        ? 'bg-primary/10 text-primary' 
                        : investment.status === 'completed'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-destructive/10 text-destructive'
                    }
                  >
                    {investment.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(investment.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {investments.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No direct investments found
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminInvestments;