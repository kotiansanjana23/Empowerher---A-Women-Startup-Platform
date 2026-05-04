import { Card, CardContent } from "../components/ui/card";
import { Mail } from "lucide-react";

export function Messages() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Messages & Support</h1>
        <p className="text-muted-foreground">
          Manage user messages and support tickets
        </p>
      </div>

      <Card>
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <Mail className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl mb-2">Messages & Support</h3>
          <p className="text-muted-foreground">
            This section will display user messages, support tickets, and
            communication tools.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
