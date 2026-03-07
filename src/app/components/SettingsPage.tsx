import React, { useState, useEffect } from "react";
import { DashboardLayout } from "./DashboardLayout";
import {
  Settings,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  Smartphone,
  Mail,
  MapPin,
  Zap,
  Save,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { cn } from "./ui/utils";

interface SettingsState {
  notifications: {
    chargingAlerts: boolean;
    paymentAlerts: boolean;
    peakHourWarnings: boolean;
    promotions: boolean;
  };
  preferences: {
    defaultConnector: string;
    maxChargeLimit: number;
    preferredLanguage: string;
    distanceUnit: string;
    currency: string;
  };
  privacy: {
    shareLocation: boolean;
    shareUsageData: boolean;
    twoFactorAuth: boolean;
  };
}

const Toggle = ({ enabled, onChange, label }: { enabled: boolean; onChange: () => void; label: string }) => (
  <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
    <span className="text-sm font-bold text-gray-700">{label}</span>
    <button onClick={onChange} className="transition-colors">
      {enabled ? (
        <ToggleRight size={28} className="text-blue-600" />
      ) : (
        <ToggleLeft size={28} className="text-gray-300" />
      )}
    </button>
  </div>
);

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    notifications: {
      chargingAlerts: true,
      paymentAlerts: true,
      peakHourWarnings: true,
      promotions: false,
    },
    preferences: {
      defaultConnector: "CCS2",
      maxChargeLimit: 80,
      preferredLanguage: "English",
      distanceUnit: "km",
      currency: "INR",
    },
    privacy: {
      shareLocation: true,
      shareUsageData: false,
      twoFactorAuth: false,
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem("ev_settings");
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch {}
    }
  }, []);

  const saveSettings = () => {
    // Validate max charge limit
    const limit = settings.preferences.maxChargeLimit;
    if (limit < 50 || limit > 100) {
      toast.error("Max charge limit must be between 50% and 100%.");
      return;
    }
    if (!settings.preferences.defaultConnector) {
      toast.error("Please select a default connector type.");
      return;
    }

    // Persist settings
    localStorage.setItem("ev_settings", JSON.stringify(settings));

    // Also update user profile with relevant preferences
    try {
      const savedProfile = localStorage.getItem("user_profile");
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        profile.preferredConnector = settings.preferences.defaultConnector;
        profile.maxChargeLimit = settings.preferences.maxChargeLimit;
        profile.language = settings.preferences.preferredLanguage;
        localStorage.setItem("user_profile", JSON.stringify(profile));
      }
    } catch {}

    toast.success("Settings saved successfully!");
  };

  const updateNotification = (key: keyof SettingsState["notifications"]) => {
    setSettings((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] },
    }));
  };

  const updatePrivacy = (key: keyof SettingsState["privacy"]) => {
    setSettings((prev) => ({
      ...prev,
      privacy: { ...prev.privacy, [key]: !prev.privacy[key] },
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto pb-10">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Settings</h1>
            <p className="text-gray-500 font-medium mt-1">
              Manage your account preferences and notifications.
            </p>
          </div>
          <Button
            onClick={saveSettings}
            className="bg-blue-600 hover:bg-blue-700 font-black px-6 py-2 rounded-xl shadow-lg shadow-blue-200"
          >
            <Save size={16} className="mr-2" /> Save Changes
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Notifications */}
          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-gray-50">
              <CardTitle className="text-base font-black flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                  <Bell size={18} />
                </div>
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-2">
              <Toggle
                label="Charging session alerts"
                enabled={settings.notifications.chargingAlerts}
                onChange={() => updateNotification("chargingAlerts")}
              />
              <Toggle
                label="Payment confirmations"
                enabled={settings.notifications.paymentAlerts}
                onChange={() => updateNotification("paymentAlerts")}
              />
              <Toggle
                label="Peak hour warnings"
                enabled={settings.notifications.peakHourWarnings}
                onChange={() => updateNotification("peakHourWarnings")}
              />
              <Toggle
                label="Promotional offers"
                enabled={settings.notifications.promotions}
                onChange={() => updateNotification("promotions")}
              />
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card className="border-none shadow-lg bg-white overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-gray-50">
              <CardTitle className="text-base font-black flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-xl text-green-600">
                  <Shield size={18} />
                </div>
                Privacy & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-2">
              <Toggle
                label="Share location for charger discovery"
                enabled={settings.privacy.shareLocation}
                onChange={() => updatePrivacy("shareLocation")}
              />
              <Toggle
                label="Share anonymous usage data"
                enabled={settings.privacy.shareUsageData}
                onChange={() => updatePrivacy("shareUsageData")}
              />
              <Toggle
                label="Two-factor authentication"
                enabled={settings.privacy.twoFactorAuth}
                onChange={() => updatePrivacy("twoFactorAuth")}
              />
            </CardContent>
          </Card>

          {/* Charging Preferences */}
          <Card className="border-none shadow-lg bg-white overflow-hidden lg:col-span-2">
            <CardHeader className="px-6 py-5 border-b border-gray-50">
              <CardTitle className="text-base font-black flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Zap size={18} />
                </div>
                Charging Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    Default Connector
                  </Label>
                  <select
                    value={settings.preferences.defaultConnector}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        preferences: { ...prev.preferences, defaultConnector: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-xl transition-all font-bold text-gray-900 outline-none"
                  >
                    <option value="CCS2">CCS2 (DC Fast)</option>
                    <option value="Type 2">Type 2 (AC)</option>
                    <option value="CHAdeMO">CHAdeMO</option>
                    <option value="Bharat AC001">Bharat AC001</option>
                    <option value="Bharat DC001">Bharat DC001</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    Max Charge Limit
                  </Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="5"
                      value={settings.preferences.maxChargeLimit}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          preferences: { ...prev.preferences, maxChargeLimit: parseInt(e.target.value) },
                        }))
                      }
                      className="flex-1 accent-blue-600"
                    />
                    <span className="text-lg font-black text-blue-600 w-12 text-right">
                      {settings.preferences.maxChargeLimit}%
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold">
                    Charging above 80% degrades battery health over time
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                    Language
                  </Label>
                  <select
                    value={settings.preferences.preferredLanguage}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        preferences: { ...prev.preferences, preferredLanguage: e.target.value },
                      }))
                    }
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:bg-white focus:border-blue-600 rounded-xl transition-all font-bold text-gray-900 outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                    <option value="Telugu">Telugu (తెలుగు)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* About Section */}
        <div className="flex items-start gap-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
          <Info size={20} className="text-gray-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-gray-700">EV-PORTAL — Smart EV Charging Platform v2.0</p>
            <p className="text-xs text-gray-500 mt-1">
              Built for the Indian EV ecosystem. Supports Bharat AC001, Bharat DC001, CCS2, Type 2
              and CHAdeMO connector standards. Compliant with TNERC and CEA guidelines.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
