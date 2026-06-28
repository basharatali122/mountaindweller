import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Mail, MailOpen, Phone, MapPin, Trash2, Inbox, CheckCircle2 } from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  interest: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Failed to load messages", description: error.message, variant: "destructive" });
    } else {
      setMessages(data || []);
    }
    setIsLoading(false);
  };

  const toggleRead = async (msg: ContactMessage) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: !msg.is_read })
      .eq("id", msg.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: !m.is_read } : m)));
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast({ title: "Message deleted" });
  };

  const unreadCount = messages.filter((m) => !m.is_read).length;

  if (isLoading) {
    return (
      <AdminLayout title="Messages" description="Contact form submissions">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Messages" description="Contact form submissions">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{messages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <Mail className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Read</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{messages.length - unreadCount}</div>
          </CardContent>
        </Card>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border border-border">
          <Inbox className="w-12 h-12 mx-auto mb-3 opacity-50" />
          No messages yet. Submissions from the Contact page will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card key={msg.id} className={!msg.is_read ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{msg.name}</h3>
                      {!msg.is_read && <Badge>New</Badge>}
                      <Badge variant="outline" className="capitalize">{msg.interest}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => toggleRead(msg)}>
                      {msg.is_read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                      <span className="ml-1 hidden sm:inline">{msg.is_read ? "Mark unread" : "Mark read"}</span>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteMessage(msg.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  <a href={`mailto:${msg.email}`} className="flex items-center gap-1.5 hover:text-primary">
                    <Mail className="w-4 h-4" /> {msg.email}
                  </a>
                  <a href={`tel:${msg.phone}`} className="flex items-center gap-1.5 hover:text-primary">
                    <Phone className="w-4 h-4" /> {msg.phone}
                  </a>
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-4 h-4" /> {msg.city}
                  </span>
                </div>
                {msg.message && (
                  <div className="bg-muted/50 rounded-lg p-3 text-sm whitespace-pre-wrap">
                    {msg.message}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMessages;
