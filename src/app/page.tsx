"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, Trash2, Printer, Download, RotateCcw, 
  Upload, Building, User, Receipt, 
  Percent, FileText, Landmark, Eye, EyeOff
} from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  hsnSac: string;
  qty: number;
  unit: string;
  rate: number;
}

interface InvoiceData {
  // Seller Information
  sellerLogo: string;
  sellerName: string;
  sellerAddress: string;
  sellerGstin: string;
  sellerMobile: string;
  sellerEmail: string;

  // Invoice Details
  invoiceNo: string;
  invoiceDate: string;

  // Customer Information
  customerName: string;
  customerAddress: string;
  customerGstin: string;
  customerPan: string;
  customerMobile: string;
  placeOfSupply: string;

  // Invoice Items
  items: InvoiceItem[];

  // Taxes Configuration
  taxRatePercent: number; // e.g. 18 -> CGST 9%, SGST 9%
  isInterState: boolean; // if true, use IGST instead of CGST + SGST

  // Bank Details
  bankName: string;
  bankBranch: string;
  accountNo: string;
  ifscCode: string;
  accountHolder: string;

  // Additional Info
  workOrderNo: string;
  paymentTerm: string;
  termsAndConditions: string;
}

const defaultInvoiceData: InvoiceData = {
  sellerLogo: "/zk_logo.png",
  sellerName: "Z K ENTERPRISES",
  sellerAddress: "4-3-103/2, SYED WALI MASJID, OLD BHOIGUDA, SECUNDERABAD, Hyderabad, Telangana, pin: 500020",
  sellerGstin: "36ADXPO2412Q1ZS",
  sellerMobile: "9848137533",
  sellerEmail: "zkenterprises788@gmail.com",
  
  invoiceNo: "2",
  invoiceDate: "2026-07-17",

  customerName: "SRINIVASA RESORTS LTD",
  customerAddress: "6-3-1187,, HOTEL ITC KAKATIYA, BEGUMPET Road, BEGUMPET, Hyderabad, Telangana, 500016",
  customerGstin: "36AADCS4190F1ZD",
  customerPan: "AADCS4190",
  customerMobile: "7980188581",
  placeOfSupply: "Telangana",

  items: [
    {
      id: "1",
      description: "AHU Air Blower and pully Replacement 8 Topper pully 2 way",
      hsnSac: "-",
      qty: 1,
      unit: "QTY",
      rate: 5000
    },
    {
      id: "2",
      description: "Service Charge",
      hsnSac: "-",
      qty: 1,
      unit: "QTY",
      rate: 1500
    },
    {
      id: "3",
      description: "6 AHU Pulley",
      hsnSac: "-",
      qty: 1,
      unit: "QTY",
      rate: 3000
    }
  ],

  taxRatePercent: 18,
  isInterState: false,

  bankName: "State Bank of India",
  bankBranch: "MUSHEERABAD",
  accountNo: "41542402153",
  ifscCode: "SBIN0012989",
  accountHolder: "ZK ENTERPRISES",

  workOrderNo: "3700282930",
  paymentTerm: "07 Days from invoice date",
  termsAndConditions: "Payment Term: 07 Days from invoice date"
};

// Number to Words converter (Indian System)
function numberToIndianWords(num: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    let str = "";
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (str !== "") str += "and ";
      if (n < 20) {
        str += a[n] + " ";
      } else {
        str += b[Math.floor(n / 10)] + " ";
        if (n % 10 > 0) {
          str += a[n % 10] + " ";
        }
      }
    }
    return str.trim();
  }

  if (num === 0) return "Zero Rupees Only";

  let crores = Math.floor(num / 10000000);
  num %= 10000000;
  let lakhs = Math.floor(num / 100000);
  num %= 100000;
  let thousands = Math.floor(num / 1000);
  num %= 1000;
  let hundredsAndBelow = Math.floor(num);
  let paise = Math.round((num - Math.floor(num)) * 100);

  let res = "";
  if (crores > 0) {
    res += convertLessThanThousand(crores) + " Crore ";
  }
  if (lakhs > 0) {
    res += convertLessThanThousand(lakhs) + " Lakh ";
  }
  if (thousands > 0) {
    res += convertLessThanThousand(thousands) + " Thousand ";
  }
  if (hundredsAndBelow > 0) {
    res += convertLessThanThousand(hundredsAndBelow);
  }

  res = res.trim() + " Rupees";

  if (paise > 0) {
    res += " and " + convertLessThanThousand(paise) + " Paise";
  }

  return res + " Only";
}

export default function InvoiceGenerator() {
  const [data, setData] = useState<InvoiceData>(defaultInvoiceData);
  const [previewScale, setPreviewScale] = useState(1);
  const [logoPreview, setLogoPreview] = useState<string | null>(defaultInvoiceData.sellerLogo);
  const previewRef = useRef<HTMLDivElement>(null);
  const [mobileTab, setMobileTab] = useState<"form" | "preview">("form");

  // Password gate
  const HARDCODED_PASSWORD = "ZK@invoice2026";
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (passwordInput === HARDCODED_PASSWORD) {
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  // Auto-handle resizing of preview A4 container to fit screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        // Desktop two-column layout
        const scaleVal = Math.min((window.innerWidth - 640) / 950, 1);
        setPreviewScale(scaleVal < 0.65 ? 0.65 : scaleVal);
      } else if (window.innerWidth >= 768) {
        // Tablet: full width preview
        const scaleVal = (window.innerWidth - 64) / 794;
        setPreviewScale(scaleVal < 0.5 ? 0.5 : scaleVal);
      } else {
        // Mobile: scale to fit screen width
        const scaleVal = (window.innerWidth - 32) / 794;
        setPreviewScale(scaleVal < 0.35 ? 0.35 : scaleVal);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setData(prev => ({ ...prev, [name]: checked }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        setData(prev => ({ ...prev, sellerLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...data.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    } as InvoiceItem;
    setData(prev => ({ ...prev, items: newItems }));
  };

  const addItemRow = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      hsnSac: "-",
      qty: 1,
      unit: "QTY",
      rate: 0
    };
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItemRow = (index: number) => {
    const newItems = data.items.filter((_, i) => i !== index);
    setData(prev => ({ ...prev, items: newItems }));
  };

  const resetForm = () => {
    if (window.confirm("Are you sure you want to reset all fields to default demo data?")) {
      setData(defaultInvoiceData);
      setLogoPreview(defaultInvoiceData.sellerLogo);
    }
  };

  // Calculations
  const subtotal = data.items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const totalQty = data.items.reduce((acc, item) => acc + item.qty, 0);

  // Tax Breakdown
  const taxRate = data.taxRatePercent / 100;
  const cgstRate = data.isInterState ? 0 : taxRate / 2;
  const sgstRate = data.isInterState ? 0 : taxRate / 2;
  const igstRate = data.isInterState ? taxRate : 0;

  const cgstAmount = subtotal * cgstRate;
  const sgstAmount = subtotal * sgstRate;
  const igstAmount = subtotal * igstRate;
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const grandTotal = subtotal + totalTax;

  const formattedDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  // Trigger Print API
  const handlePrint = () => {
    window.print();
  };

  // Trigger PDF Generation
  const handleDownloadPDF = async () => {
    const element = previewRef.current;
    if (!element) return;

    try {
      // Dynamic imports to avoid SSR issues
      const html2canvasPro = (await import("html2canvas-pro")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvasPro(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        letterRendering: true
      } as any);

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      
      // Page size A4 portrait (210mm x 297mm)
      // Since container height is 296mm, we draw it at 0, 0 position, 210mm width and 296mm height.
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "JPEG", 0, 0, 210, 296);
      pdf.save(`Invoice_${data.invoiceNo || "GST"}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Error generating PDF. Please use the 'Print / Save PDF' option.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 w-full max-w-sm shadow-2xl">
          <h1 className="text-xl font-bold text-white mb-1">GST Invoice Generator</h1>
          <p className="text-xs text-slate-400 mb-6">Enter your password to continue</p>
          <div className="space-y-3">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 pr-10 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="text-red-400 text-xs">Incorrect password. Please try again.</p>
            )}
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-2 text-sm font-semibold transition"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800 py-3 px-4 md:px-6 flex items-center justify-between shadow-lg print:hidden">
        <div>
          <h1 className="text-base md:text-lg font-bold tracking-tight text-white">GST Invoice Generator</h1>
        </div>
        <div className="flex items-center space-x-1.5 md:space-x-2">
          <button 
            onClick={resetForm}
            className="flex items-center space-x-1.5 px-2 md:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-sm font-medium transition cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden md:inline">Reset Demo</span>
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-2 md:px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-sm font-medium transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden md:inline">Print / Save PDF</span>
          </button>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center space-x-1.5 px-2 md:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-sm font-medium transition cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span className="hidden md:inline">Download PDF</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="xl:hidden flex border-b border-slate-800 bg-slate-950 print:hidden">
        <button
          onClick={() => setMobileTab("form")}
          className={`flex-1 py-2.5 text-sm font-semibold transition ${
            mobileTab === "form"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Edit Form
        </button>
        <button
          onClick={() => setMobileTab("preview")}
          className={`flex-1 py-2.5 text-sm font-semibold transition ${
            mobileTab === "preview"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Preview
        </button>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col xl:flex-row overflow-hidden print:bg-white print:text-black">
        {/* Left Side: Editor Form */}
        <div className={`w-full xl:w-[580px] bg-slate-950/80 border-r border-slate-800 p-4 md:p-6 overflow-y-auto space-y-6 print:hidden ${
          mobileTab === "form" ? "block" : "hidden xl:block"
        }`}>
          {/* Seller Information */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Building className="h-4 w-4 text-blue-400" />
              <h2 className="font-semibold text-sm tracking-wider uppercase text-blue-400">Seller Details</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Company Logo</label>
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md cursor-pointer transition text-xs">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Upload Logo Image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  </label>
                  {logoPreview && (
                    <img src={logoPreview} alt="Logo preview" className="h-10 w-10 object-contain rounded border border-slate-700 bg-white p-0.5" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Company Name</label>
                <input 
                  type="text" 
                  name="sellerName" 
                  value={data.sellerName} 
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Address</label>
                <textarea 
                  name="sellerAddress" 
                  value={data.sellerAddress} 
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">GST Number</label>
                  <input 
                    type="text" 
                    name="sellerGstin" 
                    value={data.sellerGstin} 
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Mobile No</label>
                  <input 
                    type="text" 
                    name="sellerMobile" 
                    value={data.sellerMobile} 
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Email</label>
                <input 
                  type="email" 
                  name="sellerEmail" 
                  value={data.sellerEmail} 
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Receipt className="h-4 w-4 text-blue-400" />
              <h2 className="font-semibold text-sm tracking-wider uppercase text-blue-400">Invoice Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Invoice Number</label>
                <input 
                  type="text" 
                  name="invoiceNo" 
                  value={data.invoiceNo} 
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Invoice Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    name="invoiceDate" 
                    value={data.invoiceDate} 
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500 [color-scheme:dark] cursor-pointer" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <User className="h-4 w-4 text-blue-400" />
              <h2 className="font-semibold text-sm tracking-wider uppercase text-blue-400">Customer Details</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Customer Name</label>
                <input 
                  type="text" 
                  name="customerName" 
                  value={data.customerName} 
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Billing Address</label>
                <textarea 
                  name="customerAddress" 
                  value={data.customerAddress} 
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">GSTIN</label>
                  <input 
                    type="text" 
                    name="customerGstin" 
                    value={data.customerGstin} 
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">PAN Number</label>
                  <input 
                    type="text" 
                    name="customerPan" 
                    value={data.customerPan} 
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Mobile No</label>
                  <input 
                    type="text" 
                    name="customerMobile" 
                    value={data.customerMobile} 
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Place of Supply</label>
                  <input 
                    type="text" 
                    name="placeOfSupply" 
                    value={data.placeOfSupply} 
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Receipt className="h-4 w-4 text-blue-400" />
                <h2 className="font-semibold text-sm tracking-wider uppercase text-blue-400">Invoice Items</h2>
              </div>
              <button 
                onClick={addItemRow}
                className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600/80 hover:bg-blue-600 text-white rounded text-xs transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-4">
              {data.items.map((item, index) => (
                <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-semibold uppercase">Item #{index + 1}</span>
                    {data.items.length > 1 && (
                      <button 
                        onClick={() => removeItemRow(index)}
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                        title="Remove row"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Description</label>
                    <input 
                      type="text" 
                      value={item.description} 
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500" 
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Qty</label>
                      <input 
                        type="number" 
                        value={item.qty} 
                        onChange={(e) => handleItemChange(index, "qty", parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Unit</label>
                      <input 
                        type="text" 
                        value={item.unit} 
                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Rate (₹)</label>
                      <input 
                        type="number" 
                        value={item.rate} 
                        onChange={(e) => handleItemChange(index, "rate", parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-0.5">Amount (₹)</label>
                      <div className="w-full bg-slate-900/40 border border-slate-800/40 rounded px-2.5 py-1 text-xs text-slate-400 font-semibold select-none flex items-center justify-end h-[26px]">
                        {(item.qty * item.rate).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Taxes Configuration */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Percent className="h-4 w-4 text-blue-400" />
              <h2 className="font-semibold text-sm tracking-wider uppercase text-blue-400">Tax Setup</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">GST Rate (%)</label>
                <input 
                  type="number" 
                  name="taxRatePercent" 
                  value={data.taxRatePercent} 
                  onChange={(e) => setData(prev => ({ ...prev, taxRatePercent: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center space-x-2 cursor-pointer pb-2">
                  <input 
                    type="checkbox" 
                    name="isInterState" 
                    checked={data.isInterState} 
                    onChange={handleCheckboxChange}
                    className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500 h-4 w-4" 
                  />
                  <span className="text-xs text-slate-300 font-medium">Inter-state (IGST only)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <Landmark className="h-4 w-4 text-blue-400" />
              <h2 className="font-semibold text-sm tracking-wider uppercase text-blue-400">Bank details</h2>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Account Holder Name</label>
                <input 
                  type="text" 
                  name="accountHolder" 
                  value={data.accountHolder} 
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Bank Name</label>
                  <input 
                    type="text" 
                    name="bankName" 
                    value={data.bankName} 
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Branch Name</label>
                  <input 
                    type="text" 
                    name="bankBranch" 
                    value={data.bankBranch} 
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Account Number</label>
                  <input 
                    type="text" 
                    name="accountNo" 
                    value={data.accountNo} 
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">IFSC Code</label>
                  <input 
                    type="text" 
                    name="ifscCode" 
                    value={data.ifscCode} 
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Details */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
              <FileText className="h-4 w-4 text-blue-400" />
              <h2 className="font-semibold text-sm tracking-wider uppercase text-blue-400">Additional Fields</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Work Order Number</label>
                <input 
                  type="text" 
                  name="workOrderNo" 
                  value={data.workOrderNo} 
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Payment Term / Notes</label>
                <input 
                  type="text" 
                  name="paymentTerm" 
                  value={data.paymentTerm} 
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Terms & Conditions</label>
                <textarea 
                  name="termsAndConditions" 
                  value={data.termsAndConditions} 
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: A4 Page Preview */}
        <div className={`flex-1 bg-slate-900 flex justify-center items-start overflow-y-auto p-4 md:p-8 relative print:p-0 print:bg-white print:overflow-visible ${
          mobileTab === "preview" ? "block" : "hidden xl:flex"
        }`}>
          {/* A4 Container Scaling Wrapper */}
          <div 
            style={{ transform: `scale(${previewScale})`, transformOrigin: "top center" }}
            className="transition-transform duration-200 shadow-2xl print:transform-none print:shadow-none"
          >
            {/* The A4 Invoice Element */}
            <div 
              ref={previewRef}
              id="invoice-print-area"
              className="w-[210mm] h-[296mm] min-h-[296mm] max-h-[296mm] bg-white text-black flex flex-col font-sans select-text border border-gray-300 print:border-0 print:p-0 print:m-0 relative"
              style={{ boxSizing: "border-box", padding: 0, fontFamily: "Arial, sans-serif" }}
            >
              {/* Inner wrapper to handle padding correctly in html2canvas */}
              <div style={{ padding: "12mm", width: "100%", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
                {/* Top Meta Tag */}
                <div className="flex items-center space-x-1.5 mb-2.5" style={{ paddingTop: "14px" }}>
                  <span 
                    style={{ 
                      display: "inline-block", 
                      border: "1px solid black", 
                      padding: "6px 8px 6px 8px", 
                      fontSize: "10px", 
                      fontWeight: "bold", 
                      letterSpacing: "0.05em",
                      textTransform: "uppercase", 
                      lineHeight: "1", 
                      boxSizing: "border-box" 
                    }}
                    className="text-black"
                  >
                    TAX INVOICE
                  </span>
                  <span 
                    style={{ 
                      display: "inline-block", 
                      border: "1px solid #d1d5db", 
                      padding: "6px 8px 6px 8px", 
                      fontSize: "9px", 
                      fontWeight: "600", 
                      textTransform: "uppercase", 
                      lineHeight: "1", 
                      boxSizing: "border-box" 
                    }}
                    className="text-gray-500"
                  >
                    ORIGINAL
                  </span>
                </div>

                {/* Main Outer Border Grid */}
                <div 
                  className="border border-black flex-1 relative" 
                  style={{ boxSizing: "border-box", height: "250mm", minHeight: "250mm" }}
                >
                  {/* Header Grid: Seller and Invoice Details */}
                  <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "1px solid black" }}>
                    <colgroup>
                      <col style={{ width: "60%" }} />
                      <col style={{ width: "40%" }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        {/* Seller Info */}
                        <td style={{ borderRight: "1px solid black", padding: "10px", verticalAlign: "top" }}>
                          <div className="flex items-start space-x-3">
                            {data.sellerLogo ? (
                              <img src={data.sellerLogo} alt="Logo" className="w-12 h-12 object-contain rounded shrink-0" />
                            ) : (
                              <div className="w-12 h-12 border border-black flex items-center justify-center font-bold text-lg leading-none shrink-0 bg-gray-100 select-none">
                                ZK
                              </div>
                            )}
                            <div style={{ lineHeight: "1.2" }}>
                              <div className="font-extrabold text-sm tracking-wide text-black">{data.sellerName}</div>
                              <div className="text-[10px] text-gray-950 max-w-[260px] mt-0.5">{data.sellerAddress}</div>
                              <div className="pt-1.5 font-semibold text-[10px] text-black">
                                <div>GSTIN: <span className="font-bold">{data.sellerGstin}</span></div>
                                <div style={{ marginTop: "1px" }}>Mobile: <span className="font-bold">{data.sellerMobile}</span></div>
                                <div style={{ marginTop: "1px" }}>Email: <span className="font-bold">{data.sellerEmail}</span></div>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Invoice Details */}
                        <td style={{ padding: 0, verticalAlign: "middle" }}>
                          <table style={{ width: "100%", height: "100%", borderCollapse: "collapse" }}>
                            <colgroup>
                              <col style={{ width: "34%" }} />
                              <col style={{ width: "33%" }} />
                              <col style={{ width: "33%" }} />
                            </colgroup>
                            <tbody>
                              <tr>
                                <td style={{ borderRight: "1px solid black", padding: "10px", textAlign: "center" }}>
                                  <div style={{ fontSize: "9px", color: "#4b5563", fontWeight: "bold" }}>Invoice No.</div>
                                  <div style={{ fontSize: "13px", fontWeight: "900", marginTop: "4px" }}>{data.invoiceNo}</div>
                                </td>
                                <td style={{ borderRight: "1px solid black", padding: "10px", textAlign: "center" }}>
                                  <div style={{ fontSize: "9px", color: "#4b5563", fontWeight: "bold" }}>Work Order No.</div>
                                  <div style={{ fontSize: "11px", fontWeight: "900", marginTop: "4px" }}>{data.workOrderNo}</div>
                                </td>
                                <td style={{ padding: "10px", textAlign: "center" }}>
                                  <div style={{ fontSize: "9px", color: "#4b5563", fontWeight: "bold" }}>Invoice Date</div>
                                  <div style={{ fontSize: "12px", fontWeight: "900", marginTop: "4px" }}>{formattedDate(data.invoiceDate)}</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Customer Info (BILL TO) */}
                  <div style={{ padding: "10px", borderBottom: "1px solid black" }}>
                    <div style={{ fontSize: "9px", fontWeight: "900", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>BILL TO</div>
                    <div className="font-extrabold text-xs text-black" style={{ marginBottom: "2px" }}>{data.customerName}</div>
                    <div className="text-[10px] text-gray-950 max-w-[650px]" style={{ marginBottom: "6px", lineHeight: "1.3" }}>{data.customerAddress}</div>
                    
                    <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #e5e7eb", paddingTop: "4px" }}>
                      <colgroup>
                        <col style={{ width: "25%" }} />
                        <col style={{ width: "30%" }} />
                        <col style={{ width: "22%" }} />
                        <col style={{ width: "23%" }} />
                      </colgroup>
                      <tbody>
                        <tr style={{ fontSize: "10px", fontWeight: "600", color: "black" }}>
                          <td style={{ padding: "4px 0 0 0" }}>GSTIN: <span className="font-bold">{data.customerGstin}</span></td>
                          <td style={{ padding: "4px 0 0 0" }}>Place of Supply: <span className="font-bold">{data.placeOfSupply}</span></td>
                          <td style={{ padding: "4px 0 0 0" }}>Mobile: <span className="font-bold">{data.customerMobile}</span></td>
                          <td style={{ padding: "4px 0 0 0" }}>PAN Number: <span className="font-bold">{data.customerPan}</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Invoice Items Table */}
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "10px" }}>
                    <colgroup>
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "52%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "15%" }} />
                    </colgroup>
                    <thead>
                      <tr style={{ borderBottom: "1px solid black", background: "#f9fafb", fontWeight: "800", textTransform: "uppercase", fontSize: "9px" }}>
                        <th style={{ borderRight: "1px solid black", padding: "6px 8px", textAlign: "center" }}>S.NO.</th>
                        <th style={{ borderRight: "1px solid black", padding: "6px 8px" }}>SERVICES</th>
                        <th style={{ borderRight: "1px solid black", padding: "6px 8px", textAlign: "center" }}>QTY.</th>
                        <th style={{ borderRight: "1px solid black", padding: "6px 8px", textAlign: "right" }}>RATE</th>
                        <th style={{ padding: "6px 8px", textAlign: "right" }}>AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((item, idx) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb", verticalAlign: "top" }}>
                          <td style={{ borderRight: "1px solid black", padding: "6px 8px", textAlign: "center", color: "#4b5563", fontWeight: "600" }}>{idx + 1}</td>
                          <td style={{ borderRight: "1px solid black", padding: "6px 8px", fontWeight: "600", color: "#111827", overflowWrap: "anywhere" }}>
                            {item.description || "—"}
                          </td>
                          <td style={{ borderRight: "1px solid black", padding: "6px 8px", textAlign: "center", fontWeight: "bold" }}>
                            {item.qty} {item.unit || "QTY"}
                          </td>
                          <td style={{ borderRight: "1px solid black", padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>
                            {item.rate.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold", color: "#111827" }}>
                            {(item.qty * item.rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      
                      {/* Blank fill rows to maintain A4 aesthetic structure if items are few */}
                      {Array.from({ length: Math.max(0, 6 - data.items.length) }).map((_, idx) => (
                        <tr key={`blank-${idx}`} style={{ height: "24px" }}>
                          <td style={{ borderRight: "1px solid black" }}></td>
                          <td style={{ borderRight: "1px solid black" }}></td>
                          <td style={{ borderRight: "1px solid black" }}></td>
                          <td style={{ borderRight: "1px solid black" }}></td>
                          <td></td>
                        </tr>
                      ))}

                      {/* Total Before Tax row */}
                      <tr style={{ borderTop: "1px solid black", fontWeight: "700", color: "#1f2937", background: "#f3f4f6" }}>
                        <td style={{ borderRight: "1px solid black" }}></td>
                        <td style={{ borderRight: "1px solid black", padding: "6px 8px", textAlign: "right", textTransform: "uppercase" }}>Total Before Tax</td>
                        <td style={{ borderRight: "1px solid black" }}></td>
                        <td style={{ borderRight: "1px solid black" }}></td>
                        <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>
                          ₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>

                      {/* Sub-tax entries row inside services */}
                      {!data.isInterState ? (
                        <>
                          <tr style={{ fontWeight: "600", color: "#374151" }}>
                            <td style={{ borderRight: "1px solid black" }}></td>
                            <td style={{ borderRight: "1px solid black", padding: "6px 8px", textAlign: "right", fontWeight: "extrabold", fontStyle: "italic" }}>
                              CGST @{(data.taxRatePercent / 2)}%
                            </td>
                            <td style={{ borderRight: "1px solid black", textAlign: "center" }}>-</td>
                            <td style={{ borderRight: "1px solid black", textAlign: "center" }}>-</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>
                              ₹ {cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr style={{ fontWeight: "600", color: "#374151" }}>
                            <td style={{ borderRight: "1px solid black" }}></td>
                            <td style={{ borderRight: "1px solid black", padding: "6px 8px", textAlign: "right", fontWeight: "extrabold", fontStyle: "italic" }}>
                              SGST @{(data.taxRatePercent / 2)}%
                            </td>
                            <td style={{ borderRight: "1px solid black", textAlign: "center" }}>-</td>
                            <td style={{ borderRight: "1px solid black", textAlign: "center" }}>-</td>
                            <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>
                              ₹ {sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr style={{ borderTop: "1px solid black", fontWeight: "600", color: "#374151" }}>
                          <td style={{ borderRight: "1px solid black" }}></td>
                          <td style={{ borderRight: "1px solid black", padding: "6px 8px", textAlign: "right", fontWeight: "extrabold", fontStyle: "italic" }}>
                            IGST @{data.taxRatePercent}%
                          </td>
                          <td style={{ borderRight: "1px solid black", textAlign: "center" }}>-</td>
                          <td style={{ borderRight: "1px solid black", textAlign: "center" }}>-</td>
                          <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>
                            ₹ {igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      )}

                      {/* Total row */}
                      <tr style={{ borderTop: "1px solid black", background: "#f9fafb", fontWeight: "900", fontSize: "10.5px" }}>
                        <td style={{ borderRight: "1px solid black" }}></td>
                        <td style={{ borderRight: "1px solid black", padding: "6px 8px", textTransform: "uppercase", textAlign: "right" }}>TOTAL</td>
                        <td style={{ borderRight: "1px solid black", padding: "6px 8px", textAlign: "center" }}>{totalQty}</td>
                        <td style={{ borderRight: "1px solid black" }}></td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>
                          ₹ {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Lower Tax Breakdown Table */}
                  <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid black", borderBottom: "1px solid black", textAlign: "center", fontSize: "9px" }}>
                    <colgroup>
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "18%" }} />
                      {!data.isInterState ? (
                        <>
                          <col style={{ width: "11%" }} />
                          <col style={{ width: "14%" }} />
                          <col style={{ width: "11%" }} />
                          <col style={{ width: "14%" }} />
                        </>
                      ) : (
                        <>
                          <col style={{ width: "22%" }} />
                          <col style={{ width: "28%" }} />
                        </>
                      )}
                      <col style={{ width: "17%" }} />
                    </colgroup>
                    <thead>
                      <tr style={{ borderBottom: "1px solid black", background: "#f9fafb", fontWeight: "800", textTransform: "uppercase" }}>
                        <th style={{ borderRight: "1px solid black", padding: "5px 4px 15px 4px", verticalAlign: "top" }} rowSpan={2}>HSN/SAC</th>
                        <th style={{ borderRight: "1px solid black", padding: "5px 4px 15px 4px", verticalAlign: "top" }} rowSpan={2}>Taxable Value</th>
                        {!data.isInterState ? (
                          <>
                            <th style={{ borderRight: "1px solid black", borderBottom: "1px solid black", padding: "3px 2px 6px 2px" }} colSpan={2}>CGST</th>
                            <th style={{ borderRight: "1px solid black", borderBottom: "1px solid black", padding: "3px 2px 6px 2px" }} colSpan={2}>SGST</th>
                          </>
                        ) : (
                          <th style={{ borderRight: "1px solid black", borderBottom: "1px solid black", padding: "3px 2px 6px 2px" }} colSpan={2}>IGST</th>
                        )}
                        <th style={{ padding: "5px 4px 15px 4px", verticalAlign: "top" }} rowSpan={2}>Total Tax Amount</th>
                      </tr>
                      <tr style={{ background: "#f9fafb", fontWeight: "800", borderBottom: "1px solid black" }}>
                        {!data.isInterState ? (
                          <>
                            <th style={{ borderRight: "1px solid black", padding: "3px 2px 6px 2px" }}>Rate</th>
                            <th style={{ borderRight: "1px solid black", padding: "3px 2px 6px 2px" }}>Amount</th>
                            <th style={{ borderRight: "1px solid black", padding: "3px 2px 6px 2px" }}>Rate</th>
                            <th style={{ borderRight: "1px solid black", padding: "3px 2px 6px 2px" }}>Amount</th>
                          </>
                        ) : (
                          <>
                            <th style={{ borderRight: "1px solid black", padding: "3px 2px 6px 2px" }}>Rate</th>
                            <th style={{ borderRight: "1px solid black", padding: "3px 2px 6px 2px" }}>Amount</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ fontWeight: "600", color: "#374151" }}>
                        <td style={{ borderRight: "1px solid black", padding: "4px" }}>-</td>
                        <td style={{ borderRight: "1px solid black", padding: "4px", textAlign: "right" }}>
                          {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        {!data.isInterState ? (
                          <>
                            <td style={{ borderRight: "1px solid black", padding: "2px" }}>{(data.taxRatePercent / 2)}%</td>
                            <td style={{ borderRight: "1px solid black", padding: "2px", textAlign: "right" }}>
                              {cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ borderRight: "1px solid black", padding: "2px" }}>{(data.taxRatePercent / 2)}%</td>
                            <td style={{ borderRight: "1px solid black", padding: "2px", textAlign: "right" }}>
                              {sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ borderRight: "1px solid black", padding: "2px" }}>{data.taxRatePercent}%</td>
                            <td style={{ borderRight: "1px solid black", padding: "2px", textAlign: "right" }}>
                              {igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </>
                        )}
                        <td style={{ padding: "4px", textAlign: "right", fontWeight: "bold", color: "black" }}>
                          ₹ {totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {/* Total Breakdown Row */}
                      <tr style={{ borderTop: "1px solid black", background: "#f9fafb", fontWeight: "800", color: "black" }}>
                        <td style={{ borderRight: "1px solid black", padding: "4px" }}>Total</td>
                        <td style={{ borderRight: "1px solid black", padding: "4px", textAlign: "right" }}>
                          {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                        {!data.isInterState ? (
                          <>
                            <td style={{ borderRight: "1px solid black", padding: "2px" }}></td>
                            <td style={{ borderRight: "1px solid black", padding: "2px", textAlign: "right" }}>
                              {cgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ borderRight: "1px solid black", padding: "2px" }}></td>
                            <td style={{ borderRight: "1px solid black", padding: "2px", textAlign: "right" }}>
                              {sgstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ borderRight: "1px solid black", padding: "2px" }}></td>
                            <td style={{ borderRight: "1px solid black", padding: "2px", textAlign: "right" }}>
                              {igstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                          </>
                        )}
                        <td style={{ padding: "4px", textAlign: "right", fontWeight: "900" }}>
                          ₹ {totalTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Total Amount in Words */}
                  <div style={{ padding: "8px", borderBottom: "1px solid black" }}>
                    <div style={{ fontSize: "8.5px", fontWeight: "800", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Total Amount (in words)
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: "900", color: "black", marginTop: "2px" }}>
                      {numberToIndianWords(grandTotal)}
                    </div>
                  </div>

                  {/* Bottom details block (Notes, Bank Details, Terms) positioned absolutely at bottom of outer border */}
                  <table 
                    style={{ 
                      width: "100%", 
                      borderCollapse: "collapse", 
                      position: "absolute", 
                      bottom: 0, 
                      left: 0, 
                      right: 0, 
                      borderTop: "1px solid black", 
                      fontSize: "9px" 
                    }}
                  >
                    <colgroup>
                      <col style={{ width: "33.33%" }} />
                      <col style={{ width: "33.33%" }} />
                      <col style={{ width: "33.34%" }} />
                    </colgroup>
                    <tbody>
                      <tr>
                        {/* Notes */}
                        <td style={{ borderRight: "1px solid black", padding: "8px", verticalAlign: "top" }}>
                          <div style={{ fontSize: "9px", fontWeight: "900", color: "#4b5563", marginBottom: "4px" }}>Notes</div>
                          {data.workOrderNo && (
                            <div style={{ fontWeight: "600", color: "black" }}>
                              Work Order No: <span style={{ fontWeight: "800" }}>{data.workOrderNo}</span>
                            </div>
                          )}
                          {data.paymentTerm && (
                            <div style={{ fontWeight: "600", color: "black", marginTop: "2px" }}>
                              Payment Term: <span style={{ fontWeight: "800" }}>{data.paymentTerm}</span>
                            </div>
                          )}
                        </td>

                        {/* Bank Details */}
                        <td style={{ borderRight: "1px solid black", padding: "8px", verticalAlign: "top" }}>
                          <div style={{ fontSize: "9px", fontWeight: "900", color: "#4b5563", marginBottom: "4px" }}>Bank Details</div>
                          <table style={{ width: "100%", fontSize: "9px", borderCollapse: "collapse" }}>
                            <tbody>
                              <tr>
                                <td style={{ fontWeight: "bold", color: "#4b5563", width: "60px", padding: "1px 0" }}>Name:</td>
                                <td style={{ fontWeight: "800", color: "black", padding: "1px 0" }}>{data.accountHolder}</td>
                              </tr>
                              <tr>
                                <td style={{ fontWeight: "bold", color: "#4b5563", padding: "1px 0" }}>IFSC Code:</td>
                                <td style={{ fontWeight: "800", color: "black", padding: "1px 0" }}>{data.ifscCode}</td>
                              </tr>
                              <tr>
                                <td style={{ fontWeight: "bold", color: "#4b5563", padding: "1px 0" }}>Account No:</td>
                                <td style={{ fontWeight: "800", color: "black", padding: "1px 0" }}>{data.accountNo}</td>
                              </tr>
                              <tr>
                                <td style={{ fontWeight: "bold", color: "#4b5563", padding: "1px 0" }}>Bank:</td>
                                <td style={{ fontWeight: "800", color: "black", padding: "1px 0", lineHeight: "1.1" }}>{data.bankName}, {data.bankBranch}</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>

                        {/* Terms & Conditions */}
                        <td style={{ padding: "8px", verticalAlign: "top" }}>
                          <div style={{ fontSize: "9px", fontWeight: "900", color: "#4b5563", marginBottom: "4px" }}>Terms and Conditions</div>
                          <div style={{ fontWeight: "600", color: "black", whiteSpace: "pre-line", lineHeight: "1.2" }}>
                            {data.termsAndConditions}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

