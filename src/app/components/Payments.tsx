import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { DashboardLayout } from "./DashboardLayout";
import { ScanLine } from "lucide-react";

const UPI_PAY_STRING = "upi://pay?pa=ksathishreddy@ybl&pn=K%20SATHISH%20REDDY&cu=INR";

const PaymentMethods: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-[#5F259F] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-purple-200">
            <ScanLine size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Payment</h1>
        </div>

        {/* QR Scanner */}
        <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
          <QRCodeSVG
            value={UPI_PAY_STRING}
            size={280}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%235F259F'/%3E%3Ctext x='50%25' y='55%25' text-anchor='middle' dy='.35em' fill='white' font-size='18' font-weight='900' font-family='Arial'%3EPe%3C/text%3E%3C/svg%3E",
              height: 44,
              width: 44,
              excavate: true,
            }}
          />
          {/* Scanner beam animation */}
          <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-[#5F259F] to-transparent shadow-[0_0_15px_#5F259F] animate-[scanBeam_2.5s_ease-in-out_infinite] z-10" />
        </div>

        {/* Instruction text */}
        <p className="text-base font-semibold text-gray-600">
          Scan and pay using your UPI app.
        </p>
      </div>

      <style>{`@keyframes scanBeam { 0%,100% { top: 10%; } 50% { top: 85%; } }`}</style>
    </DashboardLayout>
  );
};

export default PaymentMethods;
