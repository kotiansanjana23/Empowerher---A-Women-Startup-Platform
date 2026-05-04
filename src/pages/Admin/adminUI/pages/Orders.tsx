import { Card, CardContent } from "../components/ui/card";
import { ShoppingCart } from "lucide-react";

export function Orders() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Orders & Transactions</h1>
        <p className="text-muted-foreground">
          View and manage all marketplace transactions
        </p>
      </div>

      <Card>
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl mb-2">Order Management</h3>
          <p className="text-muted-foreground">
            This section will display order history, payment details, and
            transaction status.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
