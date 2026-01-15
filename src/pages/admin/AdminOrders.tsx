import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Package, ChevronDown, ChevronUp, MapPin, Phone, Building2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  user_email?: string;
  user_name?: string;
  items?: OrderItem[];
  delivery_address?: string;
  delivery_phone?: string;
  delivery_city?: string;
  delivery_notes?: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Fetch profiles for user info
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name");

      // Fetch order items
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("*");

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const itemsMap = new Map<string, OrderItem[]>();
      
      orderItems?.forEach(item => {
        const existing = itemsMap.get(item.order_id) || [];
        existing.push(item);
        itemsMap.set(item.order_id, existing);
      });

      const ordersWithDetails = (ordersData || []).map(order => {
        const profile = profileMap.get(order.user_id);
        return {
          ...order,
          user_email: profile?.email || "Unknown",
          user_name: profile?.full_name || "Unnamed",
          items: itemsMap.get(order.id) || [],
        };
      });

      setOrders(ordersWithDetails);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredOrders = orders.filter(order =>
    order.user_email?.toLowerCase().includes(search.toLowerCase()) ||
    order.user_name?.toLowerCase().includes(search.toLowerCase()) ||
    order.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0);

  return (
    <AdminLayout title="Orders" description="View and manage all customer orders">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold">{orders.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold text-primary">Rs. {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Completed Orders</p>
          <p className="text-2xl font-bold text-green-500">
            {orders.filter(o => o.status === "completed").length}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, email, or order ID..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge variant="outline">{filteredOrders.length} orders</Badge>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <Collapsible key={order.id} asChild open={expandedOrders.has(order.id)}>
                <>
                  <TableRow className="cursor-pointer hover:bg-secondary/50" onClick={() => toggleExpand(order.id)}>
                    <TableCell>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-auto">
                          {expandedOrders.has(order.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell>
                      <code className="bg-secondary px-2 py-1 rounded text-xs">
                        {order.id.slice(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.user_name}</p>
                        <p className="text-sm text-muted-foreground">{order.user_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span>{order.items?.length || 0} items</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary">
                        Rs. {order.total_amount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent asChild>
                    <TableRow className="bg-secondary/30">
                      <TableCell colSpan={7} className="p-0">
                        <div className="p-4 space-y-4">
                          {/* Delivery Details Section */}
                          {(order.delivery_address || order.delivery_phone || order.delivery_city) && (
                            <div className="bg-primary/5 rounded-lg border border-primary/20 p-4">
                              <p className="text-sm font-medium text-primary mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Delivery Details
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {order.delivery_address && (
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Address</p>
                                      <p className="text-sm font-medium">{order.delivery_address}</p>
                                    </div>
                                  </div>
                                )}
                                {order.delivery_phone && (
                                  <div className="flex items-start gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Phone</p>
                                      <p className="text-sm font-medium">{order.delivery_phone}</p>
                                    </div>
                                  </div>
                                )}
                                {order.delivery_city && (
                                  <div className="flex items-start gap-2">
                                    <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">City</p>
                                      <p className="text-sm font-medium">{order.delivery_city}</p>
                                    </div>
                                  </div>
                                )}
                                {order.delivery_notes && (
                                  <div className="flex items-start gap-2 md:col-span-2">
                                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Delivery Notes</p>
                                      <p className="text-sm font-medium">{order.delivery_notes}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Order Items Section */}
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">Order Items</p>
                            <div className="bg-background rounded-lg border border-border overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Unit Price</TableHead>
                                    <TableHead>Total</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {order.items?.map((item) => (
                                    <TableRow key={item.id}>
                                      <TableCell className="font-medium">{item.product_name}</TableCell>
                                      <TableCell>{item.quantity}</TableCell>
                                      <TableCell>Rs. {item.unit_price.toLocaleString()}</TableCell>
                                      <TableCell className="font-semibold">
                                        Rs. {item.total_price.toLocaleString()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </>
              </Collapsible>
            ))}
          </TableBody>
        </Table>
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No orders found
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminOrders;