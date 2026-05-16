import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { User, Bell, DollarSign, Shield, Download } from "lucide-react";

type SettingsData = {
  firstName: string;
  lastName: string;
  email: string;
  currency: string;
  dateFormat: string;
  emailNotifications: boolean;
  budgetAlerts: boolean;
  goalReminders: boolean;
};

const STORAGE_KEY = "fintrack_settings";

const defaultSettings: SettingsData = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  currency: "USD",
  dateFormat: "MM/DD/YYYY",
  emailNotifications: true,
  budgetAlerts: true,
  goalReminders: true,
};

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      setSettings({
        ...defaultSettings,
        ...parsed,
      });
    } catch (error) {
      console.error("Failed to load saved settings:", error);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleExportCSV = () => {
    const rows = [
      ["field", "value"],
      ["firstName", settings.firstName],
      ["lastName", settings.lastName],
      ["email", settings.email],
      ["currency", settings.currency],
      ["dateFormat", settings.dateFormat],
      ["emailNotifications", String(settings.emailNotifications)],
      ["budgetAlerts", String(settings.budgetAlerts)],
      ["goalReminders", String(settings.goalReminders)],
    ];

    const csv = rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fintrack-settings.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(settings, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fintrack-settings.json";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and account settings.</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  First Name
                </label>
                <input
                  type="text"
                  value={settings.firstName}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                  Last Name
                </label>
                <input
                  type="text"
                  value={settings.lastName}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <DollarSign className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Default Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, currency: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="CAD">CAD — Canadian Dollar</option>
                <option value="AUD">AUD — Australian Dollar</option>
                <option value="JPY">JPY — Japanese Yen</option>
                <option value="INR">INR — Indian Rupee</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Date Format
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, dateFormat: e.target.value }))
                }
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                key: "emailNotifications" as const,
                label: "Email Notifications",
                desc: "Receive weekly summaries and reports",
              },
              {
                key: "budgetAlerts" as const,
                label: "Budget Alerts",
                desc: "Alert when spending approaches budget limit",
              },
              {
                key: "goalReminders" as const,
                label: "Goal Reminders",
                desc: "Reminders to contribute to your savings goals",
              },
            ].map(({ key, label, desc }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    settings[key] ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      settings[key] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Data & Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Export your financial data for use in other applications.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Download className="h-4 w-4" />
                Export as CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Download className="h-4 w-4" />
                Export as JSON
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <CardTitle className="text-base">Security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`rounded-md px-6 py-2.5 text-sm font-semibold transition-all ${
              saved
                ? "bg-green-600 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            }`}
          >
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>
    </AppLayout>
  );
}