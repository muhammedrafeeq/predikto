"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  MoreVertical,
  Plus,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  Unlock,
  Lock,
} from "lucide-react";

interface User {
  id: number;
  name: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  predictionsCount: number;
  winRate: number;
}

export default function UserRegistry() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  // Form states for creating a new user
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserPin, setNewUserPin] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setUsers(data.users);
          }
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Filter users based on query
  const filteredUsers = users.filter((user) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      user.name.toLowerCase().includes(q) ||
      user.phone.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q)
    );
  });

  // Toggle user activation status
  const toggleUserStatus = async (user: User) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Update local state
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, isActive: data.user.isActive } : u))
          );
        }
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    } finally {
      setActiveDropdownId(null);
    }
  };

  // Toggle user role (user/admin)
  const toggleUserRole = async (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, role: data.user.role } : u))
          );
        }
      }
    } catch (err) {
      console.error("Failed to toggle role:", err);
    } finally {
      setActiveDropdownId(null);
    }
  };

  // Submit new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    if (!newUserName.trim() || !newUserPhone.trim() || !newUserPin.trim()) {
      setErrorMsg("All fields are required");
      setSubmitting(false);
      return;
    }

    if (newUserPin.trim().length !== 4 || isNaN(parseInt(newUserPin, 10))) {
      setErrorMsg("PIN must be a 4-digit number");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName.trim(),
          phone: newUserPhone.trim(),
          pin: newUserPin.trim(),
          role: newUserRole,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Add to user list
        setUsers((prev) => [data.user, ...prev]);
        // Reset form
        setNewUserName("");
        setNewUserPhone("");
        setNewUserPin("");
        setNewUserRole("user");
        setIsModalOpen(false);
      } else {
        setErrorMsg(data.error || "Failed to create user");
      }
    } catch (err) {
      console.error("Create user error:", err);
      setErrorMsg("Internal server error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Initials generator for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant animate-pulse font-mono">
          Fetching User Registry...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="headline-lg text-on-surface mb-1">User Registry</h2>
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-primary rounded-full" />
            <p className="text-on-surface-variant label-sm uppercase tracking-widest font-mono">
              Managing {users.length} Global Predictive Experts
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary label-md font-bold rounded-lg active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <UserPlus className="w-5 h-5" />
          Enroll Expert
        </button>
      </header>

      {/* Search filters */}
      <div className="surface-glass-1 rounded-xl p-3 flex items-center gap-3 w-full max-w-md">
        <Search className="w-5 h-5 text-on-surface-variant" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search expert name, phone, or role..."
          className="bg-transparent border-none focus:outline-none text-label-md flex-1 text-on-surface placeholder:text-on-surface-variant/40"
          type="text"
        />
      </div>

      {/* Users Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className={`surface-glass-1 rounded-xl p-5 flex flex-col gap-4 relative overflow-visible group transition-all duration-300 ${
              !user.isActive ? "grayscale-[0.6] opacity-75 border-red-500/10" : ""
            }`}
          >
            {/* Context menu trigger */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() =>
                  setActiveDropdownId(activeDropdownId === user.id ? null : user.id)
                }
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-on-surface-variant hover:text-on-surface"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {/* Action Dropdown Menu */}
              {activeDropdownId === user.id && (
                <>
                  <div
                    onClick={() => setActiveDropdownId(null)}
                    className="fixed inset-0 z-20"
                  />
                  <div className="absolute right-0 mt-1 w-44 bg-[#181822] border border-white/10 rounded-lg shadow-2xl z-30 py-1 overflow-hidden">
                    <button
                      onClick={() => toggleUserStatus(user)}
                      className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm hover:bg-white/5 text-on-surface transition-colors"
                    >
                      {user.isActive ? (
                        <>
                          <Lock className="w-4 h-4 text-error" />
                          Block User
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 text-secondary" />
                          Unblock User
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => toggleUserRole(user)}
                      className="flex items-center gap-3 w-full px-4 py-2 text-left text-sm hover:bg-white/5 text-on-surface transition-colors"
                    >
                      {user.role === "admin" ? (
                        <>
                          <ShieldAlert className="w-4 h-4 text-error" />
                          Revoke Admin
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-secondary" />
                          Promote Admin
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-4">
              <div className="relative select-none">
                <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary font-bold text-xl">
                  {getInitials(user.name)}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-[#131318] rounded-full shadow-[0_0_10px_currentColor] ${
                    user.isActive ? "bg-secondary text-secondary" : "bg-outline text-outline"
                  }`}
                />
              </div>
              <div>
                <h3 className="label-md text-white text-base font-bold flex items-center gap-2">
                  {user.name}
                  {user.role === "admin" && (
                    <span className="text-[9px] uppercase tracking-wider bg-primary-container/20 text-primary-container px-2 py-0.5 rounded-full font-bold">
                      Admin
                    </span>
                  )}
                </h3>
                <p className="text-on-surface-variant label-sm mt-0.5 font-mono">
                  {user.phone}
                </p>
              </div>
            </div>

            {/* Stats Breakdown */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col justify-center">
                <p className="text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold mb-1">
                  Predictions
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-headline-md font-extrabold text-primary font-mono">
                    {user.predictionsCount}
                  </span>
                  {user.predictionsCount > 0 && (
                    <span className="text-[10px] text-secondary font-bold font-mono">
                      +10%
                    </span>
                  )}
                </div>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/5 flex flex-col justify-center">
                <p className="text-[10px] uppercase text-on-surface-variant tracking-wider font-semibold mb-1">
                  Win Rate
                </p>
                <div className="flex items-baseline">
                  <span className="text-headline-md font-extrabold text-primary font-mono">
                    {user.winRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Footer indicator */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-1 select-none">
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    user.isActive ? "bg-secondary animate-pulse-slow" : "bg-outline"
                  }`}
                />
                <span
                  className={`text-[12px] font-semibold ${
                    user.isActive ? "text-secondary" : "text-on-surface-variant"
                  }`}
                >
                  {user.isActive ? "Active" : "Blocked"}
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-mono">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}

        {/* Enroll New Expert dashed card */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl border-2 border-dashed border-white/10 hover:border-primary/40 flex flex-col items-center justify-center gap-3 p-6 group transition-all duration-300 h-full min-h-[175px] hover:bg-white/5 select-none"
        >
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/5 group-hover:border-primary/20">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <p className="label-md font-bold text-on-surface-variant group-hover:text-primary transition-colors">
            Enroll New Expert
          </p>
        </button>
      </div>

      {/* Modal Dialog Overlay for Creating User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md surface-glass-1 rounded-xl p-6 relative flex flex-col gap-4 shadow-2xl border-white/15 animate-in fade-in zoom-in-95 duration-200">
            <header className="flex justify-between items-center border-b border-white/5 pb-3">
              <h3 className="headline-md font-bold text-primary tracking-tight">
                Enroll New Expert
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setErrorMsg("");
                }}
                className="p-1 hover:bg-white/10 rounded-full transition-colors text-on-surface-variant hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </header>

            {errorMsg && (
              <div className="p-3 bg-error-container/20 border border-error-container/45 text-error rounded-lg text-sm flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block label-md text-on-surface-variant mb-1">
                  Full Name
                </label>
                <input
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Marcus Rashford"
                  className="w-full bg-[#050507] border border-white/10 rounded-lg p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                  type="text"
                />
              </div>

              <div>
                <label className="block label-md text-on-surface-variant mb-1">
                  Phone Number
                </label>
                <input
                  required
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  placeholder="e.g. +447911123456"
                  className="w-full bg-[#050507] border border-white/10 rounded-lg p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-mono"
                  type="tel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block label-md text-on-surface-variant mb-1">
                    4-Digit PIN
                  </label>
                  <input
                    required
                    maxLength={4}
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full bg-[#050507] border border-white/10 rounded-lg p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none font-mono text-center tracking-widest"
                    type="password"
                  />
                </div>
                <div>
                  <label className="block label-md text-on-surface-variant mb-1">
                    System Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                    className="w-full bg-[#050507] border border-white/10 rounded-lg p-3 text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none h-[50px] cursor-pointer"
                  >
                    <option value="user">Competitor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setErrorMsg("");
                  }}
                  className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg font-bold transition-all text-on-surface cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(139,128,255,0.3)] rounded-lg font-bold transition-all disabled:opacity-50 cursor-pointer text-center flex items-center justify-center"
                >
                  {submitting ? "Saving..." : "Enroll User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
