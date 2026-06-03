import { Trophy, Activity, ArrowRight, ShieldCheck, Flame, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-base-bg text-on-surface flex flex-col p-6 md:p-8 overflow-hidden bg-pitch">
      {/* Decorative Brand Neon Glows */}
      <div className="absolute top-[-10%] left-[-15%] w-[60%] h-[50%] rounded-full bg-primary/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-15%] w-[60%] h-[50%] rounded-full bg-secondary/10 blur-[130px] pointer-events-none" />

      {/* Header Nav */}
      <header className="relative z-10 w-full max-w-container-max mx-auto flex justify-between items-center py-4 border-b border-white/5 mb-12">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-md bg-primary-container/20 text-primary">
            <Flame className="w-5 h-5" />
          </div>
          <span className="label-md uppercase tracking-wider text-on-surface select-none">
            Elite Predictive Sports
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-6">
          <a href="#rules" className="label-sm text-on-surface-variant hover:text-on-surface transition-colors">Rules</a>
          <a href="#leaderboard" className="label-sm text-on-surface-variant hover:text-on-surface transition-colors">Standings</a>
          <a href="/login" className="label-sm px-4 py-2 rounded-md surface-glass-1 hover:surface-glass-2 hover:text-primary transition-all">Sign In</a>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="relative z-10 w-full max-w-container-max mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Hand: Hero details */}
        <section className="lg:col-span-7 flex flex-col gap-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-outline-variant/30 label-sm text-secondary tracking-wider uppercase select-none w-fit">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            Season 2026 Live
          </div>
          
          <h1 className="display-lg text-on-surface bg-gradient-to-r from-on-surface via-primary to-secondary bg-clip-text text-transparent leading-none py-2">
            PREDICT WITH PRESTIGE.
          </h1>
          
          <p className="body-lg text-on-surface-variant max-w-xl">
            Welcome to the ultimate sports analytics battleground. Make precise predictions, track live analytics, and prove your football foresight.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <a
              href="/login"
              className="group flex items-center justify-center gap-2 bg-gradient-to-r from-primary-container to-primary text-on-primary-container font-semibold px-8 py-4 rounded-md shadow-lg shadow-primary/10 hover:shadow-primary/25 transition-all duration-base text-center"
            >
              Enter Arena
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-base" />
            </a>
            <a
              href="#demo"
              className="flex items-center justify-center surface-glass-1 hover:surface-glass-2 text-on-surface font-semibold px-8 py-4 rounded-md transition-all duration-base text-center"
            >
              Watch Demo
            </a>
          </div>
        </section>

        {/* Right Hand: High-fidelity sports dashboard preview */}
        <section id="demo" className="lg:col-span-5 flex flex-col gap-6 w-full">
          {/* Glass Match Card Preview */}
          <div className="surface-glass-1 rounded-lg p-6 relative overflow-hidden flex flex-col gap-4 shadow-2xl hover:border-primary/30 transition-all duration-base">
            <div className="flex justify-between items-center">
              <span className="label-sm text-outline uppercase tracking-wider">Premier League</span>
              <div className="flex items-center gap-1 text-secondary label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Live 74&apos;
              </div>
            </div>

            {/* Teams & Score Divider */}
            <div className="grid grid-cols-3 items-center justify-center py-4">
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center font-bold text-lg text-primary select-none">
                  ARS
                </div>
                <span className="label-md">Arsenal</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <span className="headline-lg text-on-surface font-mono">2 - 1</span>
                <span className="label-sm text-outline">Emirates</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center font-bold text-lg text-secondary select-none">
                  MCI
                </div>
                <span className="label-md">Man City</span>
              </div>
            </div>

            {/* Bottom Glow Action */}
            <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <div className="flex flex-col text-left">
                <span className="label-sm text-outline">Your Prediction</span>
                <span className="label-md text-secondary">Arsenal to Win 2-1</span>
              </div>
              <div className="px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 label-sm text-secondary">
                +11 pts potential
              </div>
            </div>

            {/* Accent border bottom glow */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-secondary shadow-[0_-2px_12px_rgba(67,223,158,0.4)]" />
          </div>

          {/* Leaderboard Podium Preview */}
          <div id="leaderboard" className="surface-glass-1 rounded-lg p-6 flex flex-col gap-4 shadow-2xl">
            <h3 className="label-md uppercase tracking-wider text-outline text-left">Top Predictors</h3>

            <div className="flex flex-col gap-2.5">
              {/* Gold rank */}
              <div className="flex justify-between items-center p-3.5 rounded-md bg-surface-container/60 border-l-[3px] border-gold">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gold/15 text-gold flex items-center justify-center text-xs font-bold font-mono">
                    1
                  </div>
                  <span className="body-md font-medium">Alex Thorne</span>
                </div>
                <span className="label-md text-gold">142 pts</span>
              </div>

              {/* Silver rank */}
              <div className="flex justify-between items-center p-3.5 rounded-md bg-surface-container/40 border-l-[3px] border-silver">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-silver/15 text-silver flex items-center justify-center text-xs font-bold font-mono">
                    2
                  </div>
                  <span className="body-md font-medium">Liam Vance</span>
                </div>
                <span className="label-md text-silver">138 pts</span>
              </div>

              {/* Bronze rank */}
              <div className="flex justify-between items-center p-3.5 rounded-md bg-surface-container/40 border-l-[3px] border-bronze">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-bronze/15 text-bronze flex items-center justify-center text-xs font-bold font-mono">
                    3
                  </div>
                  <span className="body-md font-medium">Sophia Chen</span>
                </div>
                <span className="label-md text-bronze">131 pts</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Rules Section */}
      <section id="rules" className="relative z-10 w-full max-w-container-max mx-auto py-16 mt-20 border-t border-white/5">
        <h2 className="headline-lg text-center mb-12">Scoring Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-lg bg-surface-container/50 border border-outline-variant/30 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">2x</div>
            <h4 className="label-md uppercase">Winner Correct</h4>
            <p className="label-sm text-on-surface-variant">Predict the correct winning team or a draw to secure 2 points.</p>
          </div>

          <div className="p-6 rounded-lg bg-surface-container/50 border border-outline-variant/30 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold">2x</div>
            <h4 className="label-md uppercase">Man of the Match</h4>
            <p className="label-sm text-on-surface-variant">Correctly guess the man of the match for another 2 points.</p>
          </div>

          <div className="p-6 rounded-lg bg-surface-container/50 border border-outline-variant/30 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center font-bold">4x</div>
            <h4 className="label-md uppercase">Exact Scoreline</h4>
            <p className="label-sm text-on-surface-variant">Pinpoint the final exact scoreline (e.g. 2-1) to claim 4 points.</p>
          </div>

          <div className="p-6 rounded-lg bg-surface-container/50 border border-outline-variant/30 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">3x</div>
            <h4 className="label-md uppercase">Perfect Bonus</h4>
            <p className="label-sm text-on-surface-variant">Secure all three parameters correctly to trigger a 3-point bonus.</p>
          </div>
        </div>
      </section>

      {/* Footer Details */}
      <footer className="relative z-10 w-full max-w-container-max mx-auto mt-auto pt-16 pb-6 text-center text-outline label-sm select-none border-t border-white/5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-secondary" />
            Secured Node Stack
          </span>
          <p className="flex items-center gap-2 flex-wrap justify-center">
            <span>Next.js 16 (Turbopack)</span>
            <span>•</span>
            <span>React 19</span>
            <span>•</span>
            <span>Tailwind v4</span>
            <span>•</span>
            <span>PostgreSQL</span>
          </p>
          <span className="text-white/20">© 2026 Elite Predictive Sports</span>
        </div>
      </footer>
    </div>
  );
}
