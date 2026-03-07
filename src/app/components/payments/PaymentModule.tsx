
import React, { useState } from 'react';
import { dbService, User } from '../../services/dbService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { IndianRupee, QrCode, CreditCard, Smartphone, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface PaymentProps {
    amount: number;
    onSuccess: () => void;
    onCancel: () => void;
}

export const PaymentModule: React.FC<PaymentProps> = ({ amount, onSuccess, onCancel }) => {
    const [method, setMethod] = useState<'upi' | 'card' | 'qr'>('upi');
    const [upiId, setUpiId] = useState('');
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
    const [message, setMessage] = useState('');
    const user = dbService.getCurrentUser() as User;

    const validateUpi = (vpa: string) => /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(vpa);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');

        if (method === 'upi' && !validateUpi(upiId)) {
            setMessage('Invalid UPI ID format. Please check and try again.');
            return;
        }

        setStatus('processing');
        
        // Simulating Razorpay Handshake
        setTimeout(() => {
            const success = Math.random() > 0.1; // 90% success rate for demo
            
            if (success) {
                const updatedUser = { ...user, walletBalance: user.walletBalance + amount };
                dbService.setSession(updatedUser);
                // In a real app, update the main DB as well
                setStatus('success');
                setTimeout(onSuccess, 1500);
            } else {
                setStatus('failed');
                setMessage('Payment unsuccessful. Try again.');
                setTimeout(() => setStatus('idle'), 3000);
            }
        }, 2000);
    };

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-800 rounded-3xl shadow-2xl">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle className="text-green-600 w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Payment Successful!</h2>
                <p className="text-slate-500">₹{amount} added to your EV Wallet.</p>
            </div>
        );
    }

    return (
        <Card className="max-w-md w-full border-0 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in duration-300">
            <CardHeader className="bg-slate-900 text-white p-8">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-bold">Secure Payment</CardTitle>
                    <div className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Razorpay</div>
                </div>
                <div className="mt-6 flex flex-col items-center gap-1">
                    <span className="text-slate-400 text-sm font-medium">Recharge Amount</span>
                    <h3 className="text-4xl font-black flex items-center gap-2">
                        <IndianRupee className="w-8 h-8 text-blue-400" /> {amount}
                    </h3>
                </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6 bg-white dark:bg-slate-800">
                <div className="grid grid-cols-3 gap-3">
                    <Button 
                        variant={method === 'upi' ? 'default' : 'outline'} 
                        onClick={() => setMethod('upi')}
                        className={`h-auto flex-col py-3 gap-2 rounded-2xl border-2 transition-all duration-200 ${method === 'upi' ? 'border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-50' : 'hover:border-slate-200'}`}>
                        <Smartphone className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">UPI ID</span>
                    </Button>
                    <Button 
                        variant={method === 'qr' ? 'default' : 'outline'} 
                        onClick={() => setMethod('qr')}
                        className={`h-auto flex-col py-3 gap-2 rounded-2xl border-2 transition-all duration-200 ${method === 'qr' ? 'border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-50' : 'hover:border-slate-200'}`}>
                        <QrCode className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Scan QR</span>
                    </Button>
                    <Button 
                        variant={method === 'card' ? 'default' : 'outline'} 
                        onClick={() => setMethod('card')}
                        className={`h-auto flex-col py-3 gap-2 rounded-2xl border-2 transition-all duration-200 ${method === 'card' ? 'border-blue-600 bg-blue-50 text-blue-600 hover:bg-blue-50' : 'hover:border-slate-200'}`}>
                        <CreditCard className="w-6 h-6" />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Debit/Credit</span>
                    </Button>
                </div>

                <form onSubmit={handlePayment} className="space-y-6">
                    {method === 'upi' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" /> Unified Payments Interface
                                </Label>
                                <Input 
                                    className="h-14 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-lg font-medium" 
                                    placeholder="yourname@upi" 
                                    value={upiId} 
                                    onChange={(e) => setUpiId(e.target.value)} 
                                />
                            </div>
                        </div>
                    )}

                    {method === 'qr' && (
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200">
                            <QrCode className="w-32 h-32 text-slate-300 mb-2" />
                            <p className="text-xs font-bold text-slate-500 uppercase text-center max-w-[200px]">Open your preferred app and scan this code</p>
                            <div className="mt-4 px-3 py-1 bg-white rounded-full text-[10px] font-bold shadow-sm">PAY_ID: {Date.now()}</div>
                        </div>
                    )}

                    {method === 'card' && (
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center text-center opacity-70">
                            <CreditCard className="w-12 h-12 text-slate-400 mb-3" />
                            <p className="font-bold text-slate-500 uppercase text-xs">Debit/Credit Card Secure Gateway</p>
                            <p className="text-[10px] text-slate-400 mt-1 italic italic">Under Maintenance - Use UPI for Instant Credit</p>
                        </div>
                    )}

                    {message && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100 animate-in shake duration-300">
                            <XCircle className="w-5 h-5" /> {message}
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <Button 
                            type="submit" 
                            disabled={status === 'processing'} 
                            className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-xl shadow-blue-200 transition-all active:scale-95">
                            {status === 'processing' ? <Loader2 className="w-6 h-6 animate-spin" /> : `Complete ₹${amount} Payment`}
                        </Button>
                        <Button variant="ghost" onClick={onCancel} className="text-slate-400 hover:text-slate-900 transition-colors font-bold uppercase text-xs tracking-widest">
                            Cancel & Return
                        </Button>
                    </div>
                </form>
            </CardContent>
            <div className="bg-slate-50 p-4 border-t flex justify-center items-center gap-4 grayscale opacity-50">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo.png" alt="UPI" className="h-4" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Razorpay_logo.svg/1024px-Razorpay_logo.svg.png" alt="Razorpay" className="h-4" />
                <img src="https://cdn.worldvectorlogo.com/logos/visa.svg" alt="Visa" className="h-3" />
            </div>
        </Card>
    );
};
