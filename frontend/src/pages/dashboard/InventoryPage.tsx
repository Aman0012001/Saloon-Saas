import { useState, useEffect, useCallback } from "react";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useSalon } from "@/hooks/useSalon";
import api from "@/services/api";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ShoppingCart,
  Boxes,
  BarChart3,
  Edit,
  MoreHorizontal,
  Calendar,
  Banknote,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock_quantity: number;
  min_stock_level: number;
  unit_price: number;
  supplier_name: string;
  last_restocked_at: string | null;
}

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
}

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [newItem, setNewItem] = useState({
    name: "",
    category: "Hair Care",
    stock_quantity: 0,
    min_stock_level: 5,
    unit_price: 0,
    supplier_name: "",
  });

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  });

  const isMobile = useMobile();
  const { toast } = useToast();
  const { currentSalon, loading: salonLoading } = useSalon();

  const fetchData = useCallback(async () => {
    if (!currentSalon) return;
    setLoading(true);
    try {
      const [productsData, suppliersData] = await Promise.all([
        api.inventory.getBySalon(currentSalon.id),
        api.inventory.getSuppliers(currentSalon.id)
      ]);
      setProducts(Array.isArray(productsData) ? productsData : []);
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : []);
    } catch (error: any) {
      console.error("Error fetching inventory:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load inventory data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentSalon, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddItem = async () => {
    if (!currentSalon || !newItem.name) return;
    setIsSubmitting(true);
    try {
      await api.inventory.create({
        ...newItem,
        salon_id: currentSalon.id
      });
      toast({ title: "Success", description: "Product added to inventory" });
      setShowAddDialog(false);
      setNewItem({
        name: "",
        category: "Hair Care",
        stock_quantity: 0,
        min_stock_level: 5,
        unit_price: 0,
        supplier_name: "",
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add product", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (item: InventoryItem) => {
    setEditingItem(item);
    setShowEditDialog(true);
  };

  const handleUpdateItem = async () => {
    if (!currentSalon || !editingItem) return;
    setIsSubmitting(true);
    try {
      await api.inventory.update(editingItem.id, {
        ...editingItem,
        salon_id: currentSalon.id
      });
      toast({ title: "Success", description: "Product updated successfully" });
      setShowEditDialog(false);
      setEditingItem(null);
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update product", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSupplier = async () => {
    if (!currentSalon || !newSupplier.name) return;
    setIsSubmitting(true);
    try {
      await api.inventory.create({
        ...newSupplier,
        salon_id: currentSalon.id,
        is_supplier: true
      });
      toast({ title: "Success", description: "Supplier added successfully" });
      setShowSupplierDialog(false);
      setNewSupplier({
        name: "",
        contact_person: "",
        phone: "",
        email: "",
        address: "",
      });
      fetchData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add supplier", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!currentSalon || !confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.inventory.delete(id, currentSalon.id);
      toast({ title: "Deleted", description: "Item removed from inventory" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    }
  };

  const stats = [
    {
      title: "Total Products",
      value: products.length.toString(),
      icon: Package,
      bg: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: "Low Stock Items",
      value: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level).length.toString(),
      icon: AlertTriangle,
      alert: true,
      bg: "bg-orange-50",
      textColor: "text-orange-700"
    },
    {
      title: "Out of Stock",
      value: products.filter(p => p.stock_quantity === 0).length.toString(),
      icon: XCircle,
      alert: true,
      bg: "bg-red-50",
      textColor: "text-red-700"
    },
    {
      title: "Inventory Value",
      value: `RM ${products.reduce((acc, p) => acc + (p.stock_quantity * p.unit_price), 0).toLocaleString()}`,
      icon: BarChart3,
      bg: "bg-emerald-50",
      textColor: "text-emerald-700"
    }
  ];

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) {
      return (
        <Badge className="bg-red-100 text-red-700 border-0 font-bold px-3 uppercase text-[10px]">
          Out of Stock
        </Badge>
      );
    } else if (stock <= minStock) {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-0 font-bold px-3 uppercase text-[10px]">
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-0 font-bold px-3 uppercase text-[10px]">
          In Stock
        </Badge>
      );
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || salonLoading) {
    return (
      <ResponsiveDashboardLayout showBackButton={true}>
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin shadow-lg shadow-accent/20" />
          <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] animate-pulse">Syncing Inventory...</p>
        </div>
      </ResponsiveDashboardLayout>
    );
  }

  return (
    <ResponsiveDashboardLayout
      showBackButton={true}
      headerActions={
        isMobile ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchData}>
              <RefreshCw className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              className="bg-accent text-white font-bold rounded-xl"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className={`space-y-6 pb-20 md:pb-0`}>
        {/* Header */}
        {!isMobile && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">Inventory Management</h1>
              <p className="text-muted-foreground font-medium">
                Track products, stock levels, and suppliers in real-time
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={fetchData} className="rounded-xl font-bold bg-white">
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button
                className="bg-accent hover:bg-accent/90 gap-2 text-white font-black rounded-xl shadow-lg shadow-accent/20"
                onClick={() => setShowAddDialog(true)}
              >
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="border-none shadow-sm bg-white rounded-2xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.textColor}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{stat.title}</p>
                  <p className="text-xl font-black text-slate-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 p-1 rounded-2xl h-12">
            <TabsTrigger value="products" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Products</TabsTrigger>
            <TabsTrigger value="suppliers" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Suppliers</TabsTrigger>
            <TabsTrigger value="orders" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold">Product List ({filteredProducts.length})</CardTitle>
                <div className="relative w-64 lg:block hidden">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-secondary/30 border-none rounded-xl"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredProducts.length === 0 ? (
                  <div className="py-20 text-center text-muted-foreground font-medium">
                    No products found in your inventory.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-accent">
                            <Package className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-black text-slate-900">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-slate-200 text-slate-600 border-0 font-bold text-[9px] uppercase px-2">{product.category}</Badge>
                              <p className="text-xs font-bold text-slate-400">Supplier: {product.supplier_name || "N/A"}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 px-4 flex flex-col md:flex-row items-center gap-4 md:gap-12 justify-center">
                          <div className="text-center">
                            <p className="text-lg font-black text-slate-900">{product.stock_quantity}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Current Stock</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-black text-slate-500">RM {product.unit_price}</p>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Unit Price</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {getStockStatus(product.stock_quantity, product.min_stock_level)}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-9 w-9 bg-white shadow-sm hover:text-accent"
                              onClick={() => handleEditClick(product)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl h-9 w-9 bg-white shadow-sm hover:text-red-500"
                              onClick={() => handleDeleteItem(product.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold">Suppliers ({suppliers.length})</CardTitle>
                <Button
                  onClick={() => setShowSupplierDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 px-4"
                >
                  <Plus className="w-4 h-4 mr-2" /> New Supplier
                </Button>
              </CardHeader>
              <CardContent>
                {suppliers.length === 0 ? (
                  <div className="py-20 text-center text-muted-foreground font-medium">
                    No suppliers added yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suppliers.map(sup => (
                      <div key={sup.id} className="p-5 rounded-3xl bg-slate-50 border border-slate-100 relative group">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                              <Boxes className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-black text-slate-900 text-lg">{sup.name}</p>
                              <p className="text-sm font-bold text-slate-500">{sup.contact_person || "No Contact Person"}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl text-slate-400 group-hover:text-red-500"
                            onClick={() => api.inventory.delete(sup.id, currentSalon!.id, true).then(() => fetchData())}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium flex items-center gap-2 text-slate-600">
                            <Truck className="w-4 h-4" /> {sup.phone || "No phone"}
                          </p>
                          <p className="text-sm font-medium flex items-center gap-2 text-slate-600">
                            <ShoppingCart className="w-4 h-4" /> {sup.email || "No email"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
              <CardContent className="py-20 text-center">
                <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-slate-200" />
                <p className="text-xl font-black text-slate-400">Restock Center</p>
                <p className="text-muted-foreground font-medium max-w-xs mx-auto mt-2">
                  Platform orders and restock requests will appear here once you connect with suppliers.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md rounded-3xl border-none p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Add Product</DialogTitle>
            <DialogDescription className="font-medium">Populate your salon's local inventory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Product Name</Label>
              <Input
                placeholder="e.g. Lavender Shampoo"
                value={newItem.name}
                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                className="bg-secondary/30 border-none h-12 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category</Label>
                <Input
                  placeholder="Hair Care"
                  value={newItem.category}
                  onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                  className="bg-secondary/30 border-none h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Unit Price (RM)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={newItem.unit_price}
                  onChange={e => setNewItem({ ...newItem, unit_price: parseFloat(e.target.value) })}
                  className="bg-secondary/30 border-none h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Current Stock</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newItem.stock_quantity}
                  onChange={e => setNewItem({ ...newItem, stock_quantity: parseInt(e.target.value) })}
                  className="bg-secondary/30 border-none h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Min. Alert Level</Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={newItem.min_stock_level}
                  onChange={e => setNewItem({ ...newItem, min_stock_level: parseInt(e.target.value) })}
                  className="bg-secondary/30 border-none h-12 rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddItem}
              disabled={isSubmitting || !newItem.name}
              className="bg-accent text-white font-black w-full h-12 rounded-xl shadow-lg shadow-accent/20"
            >
              {isSubmitting ? "Adding..." : "Save Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md rounded-3xl border-none p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Edit Product</DialogTitle>
            <DialogDescription className="font-medium">Update product details in your inventory.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Product Name</Label>
              <Input
                placeholder="e.g. Lavender Shampoo"
                value={editingItem?.name || ""}
                onChange={e => setEditingItem(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="bg-secondary/30 border-none h-12 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category</Label>
                <Input
                  placeholder="Hair Care"
                  value={editingItem?.category || ""}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, category: e.target.value } : null)}
                  className="bg-secondary/30 border-none h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Unit Price (RM)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={editingItem?.unit_price || 0}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, unit_price: parseFloat(e.target.value) } : null)}
                  className="bg-secondary/30 border-none h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Current Stock</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={editingItem?.stock_quantity || 0}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, stock_quantity: parseInt(e.target.value) } : null)}
                  className="bg-secondary/30 border-none h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Min. Alert Level</Label>
                <Input
                  type="number"
                  placeholder="5"
                  value={editingItem?.min_stock_level || 0}
                  onChange={e => setEditingItem(prev => prev ? { ...prev, min_stock_level: parseInt(e.target.value) } : null)}
                  className="bg-secondary/30 border-none h-12 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Supplier Name</Label>
              <Input
                placeholder="e.g. Acme Supplies"
                value={editingItem?.supplier_name || ""}
                onChange={e => setEditingItem(prev => prev ? { ...prev, supplier_name: e.target.value } : null)}
                className="bg-secondary/30 border-none h-12 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleUpdateItem}
              disabled={isSubmitting || !editingItem?.name}
              className="bg-accent text-white font-black w-full h-12 rounded-xl shadow-lg shadow-accent/20"
            >
              {isSubmitting ? "Updating..." : "Update Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="max-w-md rounded-3xl border-none p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">New Supplier</DialogTitle>
            <DialogDescription className="font-medium">Add a supplier to your network.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Company Name</Label>
              <Input
                placeholder="Supplies Co."
                value={newSupplier.name}
                onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                className="bg-secondary/30 border-none h-12 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Contact Person</Label>
                <Input
                  placeholder="John Doe"
                  value={newSupplier.contact_person}
                  onChange={e => setNewSupplier({ ...newSupplier, contact_person: e.target.value })}
                  className="bg-secondary/30 border-none h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Phone</Label>
                <Input
                  placeholder="+60..."
                  value={newSupplier.phone}
                  onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className="bg-secondary/30 border-none h-12 rounded-xl"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddSupplier}
              disabled={isSubmitting || !newSupplier.name}
              className="bg-blue-600 text-white font-black w-full h-12 rounded-xl shadow-lg shadow-blue/20"
            >
              {isSubmitting ? "Saving..." : "Register Supplier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ResponsiveDashboardLayout>
  );
};

export default InventoryPage;
