"use client";

import React, { useState, useEffect } from "react";
import { Mail, Phone, MessageSquare, Send, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/TopBar";

export default function ContactUs() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; points: number; role?: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            setName(data.user.name || "");
          }
        }
      } catch (err) {
        console.error("Failed to load user in contact-us:", err);
      }
    }
    loadUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Simple validation
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError("Please fill in all the fields.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);

    try {
      // Simulate API submission
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      // Reset form
      setSubject("");
      setMessage("");
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface pb-24 bg-pitch overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute top-[-10%] left-[-10%] w-[450px] h-[450px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #c6c0ff, transparent)" }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #43df9e, transparent)" }}
        />
      </div>

      <TopBar
        userName={user?.name}
        userPoints={user?.points}
        userRole={user?.role}
      />

      <main className="relative z-10 max-w-2xl mx-auto px-4 pt-24">
        {/* Back Button */}
        <button
          onClick={() => router.push("/contests")}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white text-xs font-bold transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Page Title Header */}
        <section className="mb-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3 surface-glass-1 border border-primary/20">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Get In Touch</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Contact Us</h1>
          <p className="text-white/40 text-sm mt-1.5 font-medium">Have a question or feedback? We'd love to hear from you.</p>
        </section>

        {/* Form Container Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Support Channels Info (4 Cols on desktop) */}
          <div className="md:col-span-4 space-y-4">
            <div className="surface-glass-1 rounded-2xl border border-white/8 p-5 space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-white/40">Direct Channels</h2>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/30 uppercase font-bold">Email Support</p>
                  <a href="mailto:support@skorio.com" className="text-xs font-bold text-white hover:text-primary transition-colors truncate block">
                    support@skorio.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-white/30 uppercase font-bold">Phone Support</p>
                  <a href="tel:+919567983967" className="text-xs font-bold text-white hover:text-primary transition-colors truncate block">
                    +91 9567983967
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card (8 Cols on desktop) */}
          <div className="md:col-span-8">
            <div className="surface-glass-1 rounded-2xl border border-white/8 p-6 sm:p-8 backdrop-blur-xl shadow-2xl relative">
              {success ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Message Sent!</h3>
                    <p className="text-white/40 text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
                      Thank you for contacting us. We will get back to you as soon as possible, typically within 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={() => setSuccess(false)}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 cursor-pointer border border-white/8"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-left">
                  {/* Name field */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-name" className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1">
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-slate-950/50 border border-white/8 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 transition-all"
                    />
                  </div>

                  {/* Email field */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-email" className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1">
                      Your Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full bg-slate-950/50 border border-white/8 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 transition-all"
                    />
                  </div>

                  {/* Subject field */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-subject" className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1">
                      Subject
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="How can we help?"
                      className="w-full bg-slate-950/50 border border-white/8 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 transition-all"
                    />
                  </div>

                  {/* Message field */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="contact-message" className="text-[10px] font-bold uppercase tracking-wider text-white/40 px-1">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what's on your mind..."
                      className="w-full bg-slate-950/50 border border-white/8 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/20 transition-all resize-none"
                    />
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-500 to-indigo-500 hover:brightness-105 active:scale-[0.98] transition-all text-white shadow-lg disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <span>Sending...</span>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
