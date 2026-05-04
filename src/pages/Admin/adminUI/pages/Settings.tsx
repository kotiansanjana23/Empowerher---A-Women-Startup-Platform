import { Card, CardContent } from "../components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export function Settings() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Configure platform settings and preferences
        </p>
      </div>

      <Card>
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <SettingsIcon className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl mb-2">Platform Settings</h3>
          <p className="text-muted-foreground">
            This section will include general settings, integrations, and
            configuration options.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
