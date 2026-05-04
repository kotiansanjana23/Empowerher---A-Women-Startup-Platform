import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Search, Edit, Trash2, CheckCircle, Plus } from "lucide-react";

const productsData = [
  {
    id: 1,
    name: "Handmade Leather Bag",
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=100",
    seller: "Sarah Johnson",
    price: 89.99,
    category: "Fashion",
    sales: 45,
    status: "Approved",
  },
  {
    id: 2,
    name: "Organic Skincare Set",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100",
    seller: "Emily Chen",
    price: 65.00,
    category: "Beauty",
    sales: 78,
    status: "Approved",
  },
  {
    id: 3,
    name: "Handcrafted Jewelry Collection",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100",
    seller: "Maria Garcia",
    price: 45.50,
    category: "Accessories",
    sales: 92,
    status: "Pending",
  },
  {
    id: 4,
    name: "Artisanal Home Decor",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=100",
    seller: "Aisha Patel",
    price: 120.00,
    category: "Home & Living",
    sales: 34,
    status: "Approved",
  },
  {
    id: 5,
    name: "Eco-Friendly Yoga Mats",
    image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=100",
    seller: "Jessica Williams",
    price: 55.00,
    category: "Wellness",
    sales: 67,
    status: "Approved",
  },
  {
    id: 6,
    name: "Custom Pottery Set",
    image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=100",
    seller: "Lisa Anderson",
    price: 95.00,
    category: "Home & Living",
    sales: 28,
    status: "Pending",
  },
  {
    id: 7,
    name: "Hand-Painted Canvas Art",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=100",
    seller: "Rachel Kim",
    price: 150.00,
    category: "Art",
    sales: 19,
    status: "Approved",
  },
  {
    id: 8,
    name: "Handwoven Scarves",
    image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=100",
    seller: "Olivia Martinez",
    price: 38.00,
    category: "Fashion",
    sales: 103,
    status: "Approved",
  },
];

export function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusBadgeVariant = (status: string) => {
    return status === "Approved" ? "default" : "secondary";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Marketplace Management</h1>
          <p className="text-muted-foreground">
            Manage products listed by women entrepreneurs
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search products or sellers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fashion">Fashion</SelectItem>
                <SelectItem value="beauty">Beauty</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
                <SelectItem value="home">Home & Living</SelectItem>
                <SelectItem value="wellness">Wellness</SelectItem>
                <SelectItem value="art">Art</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products ({productsData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productsData.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <span>{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.seller}
                  </TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>{product.sales}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(product.status)}>
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {product.status === "Pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
