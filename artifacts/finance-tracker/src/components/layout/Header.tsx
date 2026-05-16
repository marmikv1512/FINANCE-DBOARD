import { Bell, Search, User, Settings, LogOut, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

type SavedSettings = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

const STORAGE_KEY = "fintrack_settings";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] = useState<SavedSettings>({});
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setProfile(JSON.parse(raw));
      }
    } catch (error) {
      console.error("Failed to load header profile:", error);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstName = profile.firstName?.trim() || "John";
  const lastName = profile.lastName?.trim() || "Doe";
  const email = profile.email?.trim() || "john.doe@example.com";

  const initials = `${firstName[0] || "J"}${lastName[0] || "D"}`.toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background/80 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="search-field"
              className="pl-10 bg-secondary/50 border-transparent focus-visible:bg-background focus-visible:ring-1"
              placeholder="Search transactions..."
              type="search"
              name="search"
            />
          </div>
        </form>

        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex items-center gap-x-3 rounded-full p-1 hover:bg-secondary/60 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-blue-500 text-primary-foreground text-xs font-bold">
                {initials}
              </div>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                <div className="border-b border-border px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">
                    {firstName} {lastName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{email}</p>
                </div>

                <div className="py-2">
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>

                  <Link
                    href="/accounts"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary/60 transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <CreditCard className="h-4 w-4" />
                    Accounts
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      window.location.href = "/dashboard";
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Close Menu
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}