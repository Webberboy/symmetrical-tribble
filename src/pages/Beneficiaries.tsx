import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus, Trash2, User } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useSettings } from "@/contexts/SettingsContext";

interface Beneficiary {
  id: number;
  name: string;
  accountNumber: string;
  type: "internal" | "external";
  bankName?: string;
}

const Beneficiaries = () => {
  const { websiteName } = useSettings();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([
    { id: 1, name: "Jane Smith", accountNumber: "1234567890", type: "internal" },
    { id: 2, name: "John Doe", accountNumber: "9876543210", type: "external", bankName: "Chase Bank" },
    { id: 3, name: "Alice Johnson", accountNumber: "5555555555", type: "internal" },
  ]);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: "",
    accountNumber: "",
    type: "internal" as "internal" | "external",
    bankName: "",
  });

  const handleAddBeneficiary = () => {
    if (!newBeneficiary.name || !newBeneficiary.accountNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    const beneficiary: Beneficiary = {
      id: Date.now(),
      name: newBeneficiary.name,
      accountNumber: newBeneficiary.accountNumber,
      type: newBeneficiary.type,
      bankName: newBeneficiary.type === "external" ? newBeneficiary.bankName : undefined,
    };

    setBeneficiaries([...beneficiaries, beneficiary]);
    toast.success("Beneficiary added successfully!");
    setShowAddDialog(false);
    setNewBeneficiary({ name: "", accountNumber: "", type: "internal", bankName: "" });
  };

  const handleDeleteBeneficiary = (id: number) => {
    setBeneficiaries(beneficiaries.filter((b) => b.id !== id));
    toast.success("Beneficiary removed");
  };

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-xl sm:text-2xl font-bold text-primary">{websiteName}</h1>
          <nav className="flex gap-2 sm:gap-4 items-center">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Saved Beneficiaries</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your frequent transfer recipients</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Beneficiary
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 sm:mx-0 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg sm:text-xl">Add New Beneficiary</DialogTitle>
                <DialogDescription className="text-sm">Add a new recipient for quick transfers</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Beneficiary Name</Label>
                  <Input
                    id="name"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    placeholder="Enter name"
                    value={newBeneficiary.name}
                    onChange={(e) => setNewBeneficiary({ ...newBeneficiary, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type" className="text-sm font-medium">Account Type</Label>
                  <Select
                    value={newBeneficiary.type}
                    onValueChange={(value: "internal" | "external") =>
                      setNewBeneficiary({ ...newBeneficiary, type: value })
                    }
                  >
                    <SelectTrigger className="h-10 sm:h-11">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal Account</SelectItem>
                      <SelectItem value="external">External Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber" className="text-sm font-medium">Account Number</Label>
                  <Input
                    id="accountNumber"
                    className="h-10 sm:h-11 text-sm sm:text-base"
                    placeholder="Enter account number"
                    value={newBeneficiary.accountNumber}
                    onChange={(e) => setNewBeneficiary({ ...newBeneficiary, accountNumber: e.target.value })}
                  />
                </div>
                {newBeneficiary.type === "external" && (
                  <div className="space-y-2">
                    <Label htmlFor="bankName" className="text-sm font-medium">Bank Name</Label>
                    <Input
                      id="bankName"
                      className="h-10 sm:h-11 text-sm sm:text-base"
                      placeholder="Enter bank name"
                      value={newBeneficiary.bankName}
                      onChange={(e) => setNewBeneficiary({ ...newBeneficiary, bankName: e.target.value })}
                    />
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleAddBeneficiary} className="w-full sm:w-auto">Add Beneficiary</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {beneficiaries.map((beneficiary) => (
            <Card key={beneficiary.id} className="hover:shadow-elegant transition-shadow">
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base sm:text-lg truncate">{beneficiary.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">Account: {beneficiary.accountNumber}</p>
                      {beneficiary.bankName && (
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{beneficiary.bankName}</p>
                      )}
                      <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${
                        beneficiary.type === "internal" 
                          ? "bg-accent/10 text-accent" 
                          : "bg-primary/10 text-primary"
                      }`}>
                        {beneficiary.type === "internal" ? "Internal" : "External"}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 ml-2"
                    onClick={() => handleDeleteBeneficiary(beneficiary.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link to="/transfer" className="flex-1">
                    <Button variant="outline" className="w-full h-9 sm:h-10 text-sm">
                      Transfer
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {beneficiaries.length === 0 && (
          <Card>
            <CardContent className="py-8 sm:py-12 text-center px-4 sm:px-6">
              <User className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No beneficiaries yet</h3>
              <p className="text-sm text-muted-foreground mb-4">Add beneficiaries for quick and easy transfers</p>
              <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Your First Beneficiary
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Beneficiaries;
