import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useInView } from "framer-motion";
import {
  Brain,
  Zap,
  MousePointerClick,
  Sparkles,
  ArrowRight,
  Code2,
  Gauge,
  Eye,
} from "lucide-react";
import { clsx } from "clsx";

/* ─────────────────────────────────────────
   CUSTOM CURSOR
───────────────────────────────────────── */
function CustomCursor() {
  const mx = useMotionValue(-80);
  const my = useMotionValue(-80);

  const sx = useSpring(mx, { stiffness: 120, damping: 18, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 120, damping: 18, mass: 0.5 });

  useEffect(() => {
    const move = (e) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);

  return (
    <>
      {/* Outer glow ring — lags behind */}
      <motion.div
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
        className="pointer-events-none fixed top-0 left-0 z-[9999] w-9 h-9 rounded-full border border-light/40"
      />
      {/* Inner dot — snaps instantly via mx/my */}
      <motion.div
        style={{ x: mx, y: my, translateX: "-50%", translateY: "-50%" }}
        className="pointer-events-none fixed top-0 left-0 z-[9999] w-2.5 h-2.5 rounded-full bg-light shadow-glow"
      />
    </>
  );
}

/* ─────────────────────────────────────────
   FADE-IN-UP ON SCROLL WRAPPER
───────────────────────────────────────── */
function FadeUp({ children, delay = 0, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   NAVBAR
───────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={clsx(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-base/80 backdrop-blur-lg border-b border-darkest/70 py-3"
          : "py-5"
      )}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Brain size={16} className="text-light" />
          </div>
          <span className="font-display font-700 text-lg tracking-tight text-white">
            Flux<span className="text-light">-State</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-body text-white/50">
          {["Features", "How It Works", "Docs"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="hover:text-light transition-colors duration-200"
            >
              {l}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a
          href="#hero"
          className="hidden md:inline-flex items-center gap-2 text-sm font-body font-500 px-4 py-2 rounded-lg border border-primary/50 text-light hover:bg-primary/15 transition-all duration-200"
        >
          Get Early Access <ArrowRight size={13} />
        </a>
      </div>
    </motion.nav>
  );
}

/* ─────────────────────────────────────────
   HERO
───────────────────────────────────────── */
function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden"
    >
      {/* Background grid + radial glow */}
      <div className="absolute inset-0 bg-hero-grid bg-grid opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Decorative orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/40 bg-darkest/50 text-light text-xs font-mono mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-light animate-pulse" />
          Powered by Gemini · Hackathon 2025
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-800 text-5xl sm:text-6xl md:text-7xl leading-[1.05] tracking-tight text-white mb-6"
        >
          Your Code Editor That{" "}
          <span className="relative inline-block">
            <span className="text-light drop-shadow-[0_0_24px_rgba(239,136,173,0.6)]">
              Knows When
            </span>
          </span>
          <br />
          You're Stuck.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.65 }}
          className="font-body text-lg md:text-xl text-white/55 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Flux-State silently tracks your keystroke velocity and rage-clicks to
          detect frustration in real time — then instantly surfaces AI-powered
          fixes before you even think to ask.
        </motion.p>

        {/* CTA button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-xl font-display font-600 text-white text-base
                       bg-primary hover:bg-primary/90 transition-all duration-200
                       shadow-[0_0_32px_4px_rgba(165,56,96,0.45)] hover:shadow-[0_0_48px_8px_rgba(165,56,96,0.6)]
                       animate-pulse_glow"
          >
            Launch Workspace
            <Zap
              size={16}
              className="group-hover:rotate-12 transition-transform duration-200"
            />
          </button>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-light transition-colors font-body"
          >
            See how it works <ArrowRight size={13} />
          </a>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/20 text-xs font-mono"
        >
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-primary/50 to-transparent animate-pulse" />
          scroll
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   HOW IT WORKS
───────────────────────────────────────── */
const steps = [
  {
    number: "01",
    icon: Code2,
    title: "You code normally.",
    desc: "Open your project and write as you always do. Flux-State runs silently in the background — no setup, no friction.",
  },
  {
    number: "02",
    icon: Gauge,
    title: "You hit a wall.",
    desc: "Flux-State detects rage-clicks, erratic typing speed, and backspace storms. It scores your frustration in real time.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Flux-State adapts & fixes.",
    desc: "The editor shifts into Zen Mode, dims distractions, and surfaces a Gemini-powered suggestion for exactly where you're stuck.",
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-32 px-6 overflow-hidden"
    >
      {/* Section label */}
      <FadeUp className="text-center mb-16">
        <p className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-4">
          The Loop
        </p>
        <h2 className="font-display font-700 text-4xl md:text-5xl text-white tracking-tight">
          How It Works
        </h2>
      </FadeUp>

      {/* Steps */}
      <div className="relative max-w-5xl mx-auto">
        {/* Vertical connector line */}
        <div className="absolute left-[calc(50%-0.5px)] top-8 bottom-8 hidden lg:block w-px bg-gradient-to-b from-primary/0 via-primary/30 to-primary/0" />

        <div className="flex flex-col gap-12 lg:gap-0">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isLeft = i % 2 === 0;
            return (
              <FadeUp key={step.number} delay={i * 0.12}>
                <div
                  className={clsx(
                    "flex items-center gap-8 lg:gap-16",
                    !isLeft && "lg:flex-row-reverse"
                  )}
                >
                  {/* Card */}
                  <div className="flex-1 glass border border-darkest rounded-2xl p-8 group hover:border-primary/50 transition-all duration-300 hover:shadow-card-hover">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
                        <Icon size={20} className="text-light" />
                      </div>
                      <div>
                        <p className="font-mono text-xs text-primary/60 mb-1">
                          Step {step.number}
                        </p>
                        <h3 className="font-display font-600 text-xl text-white mb-2">
                          {step.title}
                        </h3>
                        <p className="font-body text-white/50 text-sm leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Center dot (desktop) */}
                  <div className="hidden lg:flex w-5 h-5 shrink-0 rounded-full bg-primary border-2 border-light/50 shadow-glow z-10" />

                  {/* Spacer on other side */}
                  <div className="flex-1 hidden lg:block" />
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FEATURES
───────────────────────────────────────── */
const features = [
  {
    icon: Brain,
    title: "Gemini Intent Prediction",
    desc: "Our Gemini integration reads the semantic intent behind your code — not just syntax — to predict what you're trying to build and serve relevant completions.",
    tag: "AI-Powered",
    large: true,
  },
  {
    icon: MousePointerClick,
    title: "Rage-Click & Velocity Tracking",
    desc: "Real-time telemetry on your interaction patterns. Unusually fast typing, backspace sprees, or repeated clicks trigger the frustration pipeline.",
    tag: "Biometrics",
  },
  {
    icon: Eye,
    title: "Dynamic UI Zen-Mode",
    desc: "When stress peaks, Flux-State dims the chrome, collapses panels, and creates a focused environment to help you think.",
    tag: "Adaptive UI",
  },
];

function FeatureCard({ feature, idx }) {
  const Icon = feature.icon;
  return (
    <FadeUp delay={idx * 0.1}>
      <div
        className={clsx(
          "group relative glass border border-darkest rounded-2xl p-7 h-full",
          "hover:border-primary/60 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-card-hover",
          feature.large && "md:col-span-1 lg:col-span-1"
        )}
      >
        {/* Top glow on hover */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-light/0 group-hover:via-light/40 to-transparent transition-all duration-500 rounded-t-2xl" />

        {/* Tag */}
        <span className="inline-block px-2.5 py-0.5 rounded-md bg-darkest border border-primary/30 text-primary text-[10px] font-mono tracking-wide mb-5">
          {feature.tag}
        </span>

        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:border-primary/50 transition-all duration-300 group-hover:shadow-glow">
          <Icon size={22} className="text-light" />
        </div>

        {/* Text */}
        <h3 className="font-display font-600 text-xl text-white mb-3 tracking-tight">
          {feature.title}
        </h3>
        <p className="font-body text-sm text-white/45 leading-relaxed">
          {feature.desc}
        </p>
      </div>
    </FadeUp>
  );
}

function Features() {
  return (
    <section id="features" className="py-32 px-6">
      <FadeUp className="text-center mb-16">
        <p className="font-mono text-xs text-primary tracking-[0.2em] uppercase mb-4">
          Under the Hood
        </p>
        <h2 className="font-display font-700 text-4xl md:text-5xl text-white tracking-tight">
          Built Different
        </h2>
        <p className="font-body text-white/40 mt-4 max-w-xl mx-auto text-base">
          Three core systems working in concert to keep you in flow state.
        </p>
      </FadeUp>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((f, i) => (
          <FeatureCard key={f.title} feature={f} idx={i} />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FOOTER
───────────────────────────────────────── */
function Footer() {
  return (
    <footer className="border-t border-darkest/60 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-body text-white/30">
          <Brain size={14} className="text-primary" />
          <span>
            Flux-State — built for{" "}
            <span className="text-light/60">Hackathon 2025</span>
          </span>
        </div>
        <p className="text-xs font-mono text-white/20">
          Powered by Gemini · React · Tailwind
        </p>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────
   PAGE ASSEMBLY
───────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <CustomCursor />
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Features />
      </main>
      <Footer />
    </>
  );
}
