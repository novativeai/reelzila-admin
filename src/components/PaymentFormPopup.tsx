// src/components/PaymentFormPopup.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export interface BillingDetails {
  nameOnCard: string;
  address: string;
  city: string;
  state: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

interface PaymentFormPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: BillingDetails) => void;
  isProcessing: boolean;
}

export const PaymentFormPopup: React.FC<PaymentFormPopupProps> = ({ isOpen, onClose, onSubmit, isProcessing }) => {
  const [details, setDetails] = useState<BillingDetails>({
    nameOnCard: "", address: "", city: "", state: "",
    cardNumber: "", expiry: "", cvv: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(details);
  };
  
  const inputStyles = "bg-transparent border-0 border-b border-neutral-700 rounded-none px-0 text-base h-10 focus-visible:ring-0 focus-visible:border-b-white transition-colors";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1C1C1C] border-neutral-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Billing Information</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Your card details are sent securely to our payment provider and are not stored on our servers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-8 pt-4">
          <div className="grid gap-2">
            <Label htmlFor="nameOnCard">Name on Card</Label>
            <Input id="nameOnCard" name="nameOnCard" onChange={handleChange} className={inputStyles} />
          </div>

          <div className="grid grid-cols-6 gap-4">
            <div className="grid gap-2 col-span-6">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input id="cardNumber" name="cardNumber" onChange={handleChange} className={inputStyles} />
            </div>
            <div className="grid gap-2 col-span-3">
                <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                <Input id="expiry" name="expiry" onChange={handleChange} className={inputStyles} />
            </div>
            <div className="grid gap-2 col-span-3">
                <Label htmlFor="cvv">CVV</Label>
                <Input id="cvv" name="cvv" onChange={handleChange} className={inputStyles} />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" onChange={handleChange} className={inputStyles} />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" onChange={handleChange} className={inputStyles} />
            </div>
             <div className="grid gap-2">
                <Label htmlFor="state">State / Province</Label>
                <Input id="state" name="state" onChange={handleChange} className={inputStyles} />
            </div>
          </div>
          
          <Button type="submit" size="lg" className="w-full bg-[#D4FF4F] text-black font-bold hover:bg-[#c2ef4a] text-lg transition-colors" disabled={isProcessing}>
            {isProcessing ? <Loader2 className="animate-spin" /> : "Confirm and Pay"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};