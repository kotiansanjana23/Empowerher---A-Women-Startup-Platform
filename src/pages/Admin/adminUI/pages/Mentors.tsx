import { Card, CardContent } from "../components/ui/card";
import { UserCircle } from "lucide-react";

export function Mentors() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Mentor Management</h1>
        <p className="text-muted-foreground">
          Manage mentors and mentorship programs
        </p>
      </div>

      <Card>
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <UserCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl mb-2">Mentor Management</h3>
          <p className="text-muted-foreground">
            This section will display mentor profiles, specializations, and
            mentorship connections.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
