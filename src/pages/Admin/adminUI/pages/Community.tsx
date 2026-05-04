import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
// import { Button } from "../../Admin dashboard for EmpowerHer/src/app/components/ui/button";
// import { Avatar, AvatarFallback, AvatarImage } from "../../Admin dashboard for EmpowerHer/src/app/components/ui/avatar";
// import { Badge } from "../../Admin dashboard for EmpowerHer/src/app/components/ui/badge";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Heart, MessageCircle, CheckCircle, XCircle } from "lucide-react";

const postsData = [
  {
    id: 1,
    author: "Sarah Johnson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    date: "2 hours ago",
    content:
      "Just launched my first online course! So excited to share my digital marketing knowledge with fellow entrepreneurs. What topics would you like to learn next?",
    likes: 48,
    comments: 12,
    status: "Approved",
  },
  {
    id: 2,
    author: "Emily Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    date: "5 hours ago",
    content:
      "Looking for a mentor in the e-commerce space. I'm building a sustainable fashion brand and would love to connect with someone who's been there!",
    likes: 32,
    comments: 8,
    status: "Pending",
  },
  {
    id: 3,
    author: "Maria Garcia",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
    date: "1 day ago",
    content:
      "Just hit $10k in monthly sales! Thank you to this amazing community for all the support and guidance. Never give up on your dreams! 💪",
    likes: 156,
    comments: 34,
    status: "Approved",
  },
  {
    id: 4,
    author: "Aisha Patel",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aisha",
    date: "1 day ago",
    content:
      "Hosting a free webinar next week on financial planning for startups. Who's interested? Drop a comment below!",
    likes: 67,
    comments: 19,
    status: "Approved",
  },
  {
    id: 5,
    author: "Jessica Williams",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica",
    date: "2 days ago",
    content:
      "Has anyone here dealt with scaling challenges? I'm growing faster than expected and need advice on hiring and delegation.",
    likes: 41,
    comments: 15,
    status: "Pending",
  },
  {
    id: 6,
    author: "Lisa Anderson",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa",
    date: "3 days ago",
    content:
      "New product alert! Just added handmade ceramic collections to my store. Check them out and let me know what you think!",
    likes: 53,
    comments: 11,
    status: "Approved",
  },
];

export function Community() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Community Posts</h1>
        <p className="text-muted-foreground">
          Moderate and manage community engagement
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Posts</p>
                <p className="text-3xl">1,234</p>
              </div>
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pending Review</p>
                <p className="text-3xl">23</p>
              </div>
              <CheckCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Engagement</p>
                <p className="text-3xl">8.5k</p>
              </div>
              <Heart className="w-8 h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {postsData.map((post) => (
              <div
                key={post.id}
                className="pb-6 border-b last:border-0 last:pb-0"
              >
                <div className="flex gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={post.avatar} />
                    <AvatarFallback>
                      {post.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{post.author}</p>
                        <p className="text-xs text-muted-foreground">
                          {post.date}
                        </p>
                      </div>
                      <Badge
                        variant={
                          post.status === "Approved" ? "default" : "secondary"
                        }
                      >
                        {post.status}
                      </Badge>
                    </div>
                    <p className="text-sm mb-3">{post.content}</p>
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Heart className="w-4 h-4" />
                        <span>{post.likes} likes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        <span>{post.comments} comments</span>
                      </div>
                    </div>
                    {post.status === "Pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
