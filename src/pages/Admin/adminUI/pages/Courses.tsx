import { Card, CardContent, CardFooter, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Search, Edit, Trash2, Plus, Users } from "lucide-react";
import { useState } from "react";

const coursesData = [
  {
    id: 1,
    title: "Digital Marketing Fundamentals",
    instructor: "Sarah Johnson",
    students: 245,
    status: "Active",
    image: "https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=400",
  },
  {
    id: 2,
    title: "Business Strategy for Women Entrepreneurs",
    instructor: "Emily Chen",
    students: 189,
    status: "Active",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400",
  },
  {
    id: 3,
    title: "Financial Planning & Management",
    instructor: "Maria Garcia",
    students: 156,
    status: "Active",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400",
  },
  {
    id: 4,
    title: "Leadership Skills Development",
    instructor: "Aisha Patel",
    students: 203,
    status: "Active",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400",
  },
  {
    id: 5,
    title: "Social Media Marketing Mastery",
    instructor: "Jessica Williams",
    students: 178,
    status: "Draft",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400",
  },
  {
    id: 6,
    title: "E-commerce & Online Sales",
    instructor: "Lisa Anderson",
    students: 134,
    status: "Active",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
  },
  {
    id: 7,
    title: "Personal Branding for Success",
    instructor: "Rachel Kim",
    students: 98,
    status: "Draft",
    image: "https://images.unsplash.com/photo-1553484771-371a605b060b?w=400",
  },
  {
    id: 8,
    title: "Tech Skills for Non-Tech Founders",
    instructor: "Olivia Martinez",
    students: 167,
    status: "Active",
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400",
  },
];

export function Courses() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Course Management</h1>
          <p className="text-muted-foreground">
            Manage all skill development programs and courses
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add New Course
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search courses by title or instructor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {coursesData.map((course) => (
          <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative h-48 overflow-hidden">
              <img
                src={course.image}
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <Badge
                className="absolute top-3 right-3"
                variant={course.status === "Active" ? "default" : "secondary"}
              >
                {course.status}
              </Badge>
            </div>
            <CardHeader>
              <h3 className="text-lg line-clamp-2 min-h-[3.5rem]">{course.title}</h3>
              <p className="text-sm text-muted-foreground">
                by {course.instructor}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{course.students} students</span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="ghost" className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
