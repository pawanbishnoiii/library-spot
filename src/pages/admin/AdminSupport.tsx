import { useState } from "react";
import { motion } from "framer-motion";
import { 
  MessageSquare, Search, Filter, Clock, CheckCircle, 
  AlertCircle, User, Building2, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { toast } from "@/hooks/use-toast";

// Mock support tickets
const mockTickets = [
  {
    id: '1',
    subject: 'Unable to book seats',
    user: 'Rahul Kumar',
    userType: 'user',
    status: 'open',
    priority: 'high',
    createdAt: '2024-01-15T10:30:00',
    lastMessage: 'I am trying to book a seat but getting error...',
  },
  {
    id: '2',
    subject: 'Payment not reflected',
    user: 'Pawan Kumar',
    userType: 'owner',
    status: 'in_progress',
    priority: 'medium',
    createdAt: '2024-01-14T14:20:00',
    lastMessage: 'Student paid but payment not showing in dashboard',
  },
  {
    id: '3',
    subject: 'Feature request - Multiple shifts',
    user: 'Priya Sharma',
    userType: 'owner',
    status: 'resolved',
    priority: 'low',
    createdAt: '2024-01-13T09:15:00',
    lastMessage: 'Thank you for the update!',
  },
];

const AdminSupport = () => {
  const [tickets, setTickets] = useState(mockTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<typeof mockTickets[0] | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const handleSendReply = () => {
    if (!replyMessage.trim()) return;
    toast({ title: "Reply sent successfully" });
    setReplyMessage("");
  };

  const updateTicketStatus = (ticketId: string, status: string) => {
    setTickets(prev => prev.map(t => 
      t.id === ticketId ? { ...t, status } : t
    ));
    toast({ title: `Ticket marked as ${status}` });
  };

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-destructive/10 text-destructive';
      case 'in_progress':
        return 'bg-warning/10 text-warning';
      case 'resolved':
        return 'bg-success/10 text-success';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive text-destructive-foreground';
      case 'medium':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout title="Support">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Support Tickets</h2>
            <p className="text-muted-foreground">Manage user support requests</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              {tickets.filter(t => t.status === 'open').length} Open
            </Badge>
            <Badge variant="outline" className="gap-1">
              <span className="w-2 h-2 rounded-full bg-warning" />
              {tickets.filter(t => t.status === 'in_progress').length} In Progress
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tickets</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets Grid */}
        <div className="grid lg:grid-cols-2 gap-4">
          {filteredTickets.map((ticket) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl border border-border p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{ticket.subject}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    {ticket.userType === 'owner' ? (
                      <Building2 className="w-3 h-3" />
                    ) : (
                      <User className="w-3 h-3" />
                    )}
                    <span>{ticket.user}</span>
                    <span>•</span>
                    <Clock className="w-3 h-3" />
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {ticket.lastMessage}
              </p>

              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="text-center py-16 bg-card rounded-2xl border border-border">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No tickets found</p>
            <p className="text-muted-foreground">All support requests will appear here</p>
          </div>
        )}

        {/* Ticket Detail Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTicket?.subject}</DialogTitle>
            </DialogHeader>

            {selectedTicket && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority} priority
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    from {selectedTicket.user} ({selectedTicket.userType})
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm">{selectedTicket.lastMessage}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(selectedTicket.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    rows={4}
                  />
                  <div className="flex justify-between">
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(value) => updateTicketStatus(selectedTicket.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleSendReply} className="gap-2">
                      <Send className="w-4 h-4" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminSupport;
