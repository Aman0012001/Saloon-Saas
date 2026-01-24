import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ResponsiveDashboardLayout } from "@/components/dashboard/ResponsiveDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle,
  TrendingDown,
  ShoppingCart,
  Boxes,
  BarChart3,
  Edit,
  MoreHorizontal,
  Calendar,
  IndianRupee,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Filter
} from "lucide-react";

const InventoryPage = () => {
  const [activeTab, setActiveTab] = useState("products");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const isMobile = useMobile();
  const { toast } = useToast();

  // Mock data
  const products = [
    {
      id: "P001",
      name: "Hair Shampoo - L'Oreal",
      category: "Hair Care",
      stock: 25,
      minStock: 10,
      price: 450,
      supplier: "Beauty Supplies Co.",
      lastRestocked: "2024-01-15",
      image: "🧴"
    },
    {
      id: "P002",
      name: "Hair Conditioner - Pantene",
      category: "Hair Care", 
      stock: 5,
      minStock: 10,
      price: 380,
      supplier: "Beauty Supplies Co.",
      lastRestocked: "2024-01-10",
      image: "🧴"
    },
    {
      id: "P003",
      name: "Face Cream - Olay",
      category: "Skin Care",
      stock: 15,
      minStock: 8,
      price: 650,
      supplier: "Cosmetics Ltd.",
      lastRestocked: "2024-01-18",
      image: "🧴"
    },
    {
      id: "P004",
      name: "Hair Oil - Parachute",
      category: "Hair Care",
      stock: 2,
      minStock: 5,
      price: 120,
      supplier: "Local Distributor",
      lastRestocked: "2024-01-05",
      image: "🛢️"
    },
    {
      id: "P005",
      name: "Nail Polish - Lakme",
      category: "Nail Care",
      stock: 0,
      minStock: 6,
      price: 250,
      supplier: "Cosmetics Ltd.",
      lastRestocked: "2024-01-01",
      image: "💅"
    }
  ];

  const stats = [
    {
      title: "Total Products",
      value: "156",
      change: "+12",
      icon: Package,
      color: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: "Low Stock Items",
      value: "8",
      change: "+3",
      icon: AlertTriangle,
      alert: true,
      color: "from-orange-500 to-orange-600",
      bg: "bg-orange-50",
      textColor: "text-orange-700"
    },
    {
      title: "Out of Stock",
      value: "2",
      change: "+1",
      icon: XCircle,
      alert: true,
      color: "from-red-500 to-red-600",
      bg: "bg-red-50",
      textColor: "text-red-700"
    },
    {
      title: "Inventory Value",
      value: "₹45,600",
      change: "+5%",
      icon: BarChart3,
      color: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50",
      textColor: "text-emerald-700"
    }
  ];

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) {
      return (
        <Badge className="bg-gradient-to-r from-red-100 to-red-200 text-red-700 border-0 font-medium text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          Out of Stock
        </Badge>
      );
    } else if (stock <= minStock) {
      return (
        <Badge className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border-0 font-medium text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low Stock
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-700 border-0 font-medium text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          In Stock
        </Badge>
      );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "hair care":
        return "💇‍♀️";
      case "skin care":
        return "🧴";
      case "nail care":
        return "💅";
      default:
        return "📦";
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ResponsiveDashboardLayout
      showBackButton={true}
      headerActions={
        isMobile ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9"
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-accent to-accent/90 text-white px-3"
              onClick={() => {
                toast({
                  title: "Add Product",
                  description: "Add product feature will be available soon",
                });
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className={`space-y-${isMobile ? '4' : '6'} pb-${isMobile ? '20' : '0'}`}>
        {/* Mobile Search Bar */}
        {isMobile && showSearch && (
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-10 bg-secondary/30 border-border/50 focus:bg-white transition-colors"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mobile Stats Cards */}
        {isMobile && (
          <div className="grid grid-cols-2 gap-3">
            {stats.map((stat, index) => (
              <Card key={index} className={`border-0 shadow-sm bg-gradient-to-br ${stat.bg} to-${stat.bg.replace('50', '100')}`}>
                <CardContent className="p-3 text-center">
                  <stat.icon className={`w-5 h-5 ${stat.textColor} mx-auto mb-1`} />
                  <p className={`text-lg font-bold ${stat.textColor}`}>{stat.value}</p>
                  <p className={`text-xs ${stat.textColor} font-medium`}>
                    {stat.title.replace(' Items', '').replace(' Stock', '')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
              <p className="text-muted-foreground">
                Track products, stock levels, and suppliers
              </p>
            </div>
            <Button 
              className="bg-accent hover:bg-accent/90 gap-2"
              onClick={() => {
                toast({
                  title: "Add Product",
                  description: "Add product feature will be available soon",
                });
              }}
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        )}

        {/* Desktop Stats Grid */}
        {!isMobile && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="border-border shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      stat.alert ? 'bg-orange-500/10' : 'bg-accent/10'
                    }`}>
                      <stat.icon className={`w-5 h-5 ${
                        stat.alert ? 'text-orange-600' : 'text-accent'
                      }`} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-sm">
                    <span className={stat.alert ? 'text-orange-600' : 'text-sage'}>
                      {stat.change}
                    </span>
                    <span className="text-muted-foreground">this month</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Mobile Tab Filters */}
        {isMobile && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={activeTab === "products" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("products")}
              className={`flex-shrink-0 ${activeTab === "products" ? "bg-accent text-white" : ""}`}
            >
              <Package className="w-4 h-4 mr-2" />
              Products
            </Button>
            <Button
              variant={activeTab === "suppliers" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("suppliers")}
              className={`flex-shrink-0 ${activeTab === "suppliers" ? "bg-blue-500 text-white hover:bg-blue-600" : ""}`}
            >
              <Boxes className="w-4 h-4 mr-2" />
              Suppliers
            </Button>
            <Button
              variant={activeTab === "orders" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("orders")}
              className={`flex-shrink-0 ${activeTab === "orders" ? "bg-emerald-500 text-white hover:bg-emerald-600" : ""}`}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Orders
            </Button>
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {!isMobile && (
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
              <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="products" className="space-y-4">
            {/* Desktop Search */}
            {!isMobile && (
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className={`${isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
                      Product Inventory ({filteredProducts.length})
                    </CardTitle>
                    {!isMobile && (
                      <CardDescription>
                        Manage your salon products and stock levels
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className={isMobile ? 'px-4 pb-4' : ''}>
                {filteredProducts.length === 0 ? (
                  <div className={`text-center ${isMobile ? 'py-8' : 'py-12'}`}>
                    <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <Package className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-muted-foreground`} />
                    </div>
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-foreground mb-2`}>No products found</h3>
                    <p className={`text-muted-foreground mb-4 ${isMobile ? 'text-sm' : ''}`}>
                      {searchTerm 
                        ? "Try adjusting your search criteria"
                        : "Add your first product to get started"
                      }
                    </p>
                    <Button 
                      size={isMobile ? "sm" : "default"}
                      className="bg-gradient-to-r from-accent to-accent/90 text-white"
                      onClick={() => {
                        toast({
                          title: "Add Product",
                          description: "Add product feature will be available soon",
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Product
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`group ${isMobile ? 'p-4 rounded-xl bg-white border border-border/30 shadow-sm' : 'flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors'}`}
                      >
                        {isMobile ? (
                          // Mobile Layout - Card Style
                          <div className="space-y-3">
                            {/* Header Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 flex items-center justify-center border border-accent/20 text-lg">
                                  {getCategoryIcon(product.category)}
                                </div>
                                <div>
                                  <p className="font-semibold text-foreground text-sm">{product.id}</p>
                                  <p className="text-xs text-muted-foreground">{product.category}</p>
                                </div>
                              </div>
                              {getStockStatus(product.stock, product.minStock)}
                            </div>

                            {/* Product Info */}
                            <div className="bg-secondary/20 rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground text-sm mb-1 line-clamp-2">{product.name}</p>
                                  <p className="text-xs text-muted-foreground mb-2">Supplier: {product.supplier}</p>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(product.lastRestocked).toLocaleDateString('en-IN', { 
                                        day: 'numeric', 
                                        month: 'short' 
                                      })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <IndianRupee className="w-3 h-3" />
                                      {product.price}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right ml-3">
                                  <p className="text-xl font-bold text-foreground">{product.stock}</p>
                                  <p className="text-xs text-muted-foreground">units</p>
                                  <p className="text-xs text-muted-foreground">min: {product.minStock}</p>
                                </div>
                              </div>
                            </div>

                            {/* Action Row */}
                            <div className="flex items-center justify-between pt-2 border-t border-border/20">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs"
                                  onClick={() => {
                                    toast({
                                      title: "Edit Product",
                                      description: `Editing ${product.name}`,
                                    });
                                  }}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                {product.stock <= product.minStock && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                                    onClick={() => {
                                      toast({
                                        title: "Restock Product",
                                        description: `Restocking ${product.name}`,
                                      });
                                    }}
                                  >
                                    <Truck className="w-3 h-3 mr-1" />
                                    Restock
                                  </Button>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8"
                                onClick={() => {
                                  toast({
                                    title: "More Options",
                                    description: "Additional options will be available soon",
                                  });
                                }}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Desktop Layout - Horizontal
                          <>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-xl">
                                {getCategoryIcon(product.category)}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.category}</p>
                                <p className="text-xs text-muted-foreground">
                                  Supplier: {product.supplier}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="font-medium text-foreground">
                                  Stock: {product.stock} units
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Min: {product.minStock} units
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ₹{product.price} per unit
                                </p>
                              </div>
                              {getStockStatus(product.stock, product.minStock)}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  toast({
                                    title: "Edit Product",
                                    description: `Editing ${product.name}`,
                                  });
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className={`${isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}`}>
                <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Suppliers</CardTitle>
                {!isMobile && (
                  <CardDescription>
                    Manage your product suppliers
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className={`space-y-4 ${isMobile ? 'px-4 pb-4' : ''}`}>
                <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-2 gap-4'}`}>
                  <div className={`${isMobile ? 'p-3' : 'p-4'} border border-border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Boxes className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-700">Beauty Supplies Co.</span>
                    </div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600 mb-1`}>
                      Contact: +91 98765 43210
                    </p>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-600`}>
                      Products: Hair care, Styling products
                    </p>
                  </div>
                  <div className={`${isMobile ? 'p-3' : 'p-4'} border border-border rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Boxes className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium text-emerald-700">Cosmetics Ltd.</span>
                    </div>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-emerald-600 mb-1`}>
                      Contact: +91 87654 32109
                    </p>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-emerald-600`}>
                      Products: Skin care, Face treatments
                    </p>
                  </div>
                  {isMobile && (
                    <div className="p-3 border border-border rounded-lg bg-gradient-to-r from-purple-50 to-purple-100">
                      <div className="flex items-center gap-3 mb-2">
                        <Boxes className="w-5 h-5 text-purple-600" />
                        <span className="font-medium text-purple-700">Local Distributor</span>
                      </div>
                      <p className="text-xs text-purple-600 mb-1">
                        Contact: +91 76543 21098
                      </p>
                      <p className="text-xs text-purple-600">
                        Products: Hair oils, Natural products
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className={`${isMobile ? 'pb-3 px-4 pt-4' : 'pb-4'}`}>
                <CardTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>Purchase Orders</CardTitle>
                {!isMobile && (
                  <CardDescription>
                    Track your product orders and deliveries
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className={`space-y-4 ${isMobile ? 'px-4 pb-4' : ''}`}>
                <div className={`text-center ${isMobile ? 'py-8' : 'py-8'}`}>
                  <ShoppingCart className={`${isMobile ? 'w-12 h-12' : 'w-12 h-12'} mx-auto mb-3 text-muted-foreground opacity-50`} />
                  <p className="text-muted-foreground mb-4">No purchase orders yet</p>
                  <Button 
                    className="bg-accent hover:bg-accent/90 gap-2"
                    onClick={() => {
                      toast({
                        title: "Create Purchase Order",
                        description: "Purchase order feature will be available soon",
                      });
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Create Purchase Order
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveDashboardLayout>
  );
};

export default InventoryPage;