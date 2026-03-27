import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useInView, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
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
import { FeatureCarousel } from "../components/ui/animated-feature-carousel";
import HeroSection from "../components/HeroSection";

/* ─────────────────────────────────────────
   CUSTOM CURSOR
   Upgraded with backdrop-blur and spring-ring
───────────────────────────────────────── */
function CustomCursor() {
  const mx = useMotionValue(-100);
  const my = useMotionValue(-100);
  
  // Spring for the outer ring (slight lag / elastic feel)
  const sx = useSpring(mx, { stiffness: 150, damping: 20, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 150, damping: 20, mass: 0.6 });

  useEffect(() => {
    const move = (e) => {
      mx.set(e.clientX);
      my.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [mx, my]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      {/* Outer interactive ring */}
      <motion.div
        style={{ x: sx, y: sy, translateX: "-50%", translateY: "-50%" }}
        className="absolute top-0 left-0 w-14 h-14 rounded-full border border-white/20 backdrop-blur-[2px] shadow-[0_0_20px_rgba(239,182,173,0.15)]"
      />
      {/* Core glowing dot */}
      <motion.div
        style={{ x: mx, y: my, translateX: "-50%", translateY: "-50%" }}
        className="absolute top-0 left-0 w-3 h-3 rounded-full bg-[#EFB6AD] shadow-[0_0_15px_6px_rgba(239,182,173,0.7)]"
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   FADE-IN-UP ON SCROLL WRAPPER
───────────────────────────────────────── */
function FadeUp({ children, delay = 0, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        paddingTop: scrolled ? "14px" : "28px",
        paddingBottom: scrolled ? "14px" : "28px",
        background: scrolled ? "rgba(5,1,3,0.7)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between font-inter">
        {/* Logo */}
        <div className="flex items-center gap-4 group cursor-pointer">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white/[0.03] border border-white/10 group-hover:border-[#EFB6AD]/40 transition-colors duration-500">
            <Brain size={24} className="text-[#EFB6AD] group-hover:scale-110 transition-transform duration-500" />
          </div>
          <span className="font-space font-bold text-2xl tracking-tight text-white">
            Flux<span className="text-[#EFB6AD] transition-opacity group-hover:opacity-80">-State</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-12 text-base font-medium tracking-wide border border-white/5 bg-white/[0.02] px-10 py-3 rounded-full backdrop-blur-md">
          {["Features", "How It Works"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/ /g, "-")}`}
              className="text-white/80 hover:text-white transition-colors duration-300"
            >
              {l}
            </a>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/editor"
          className="hidden md:inline-flex items-center gap-2.5 text-base font-bold px-8 py-3 rounded-full text-black bg-white hover:bg-[#EFB6AD] transition-all duration-300"
        >
          Launch Editor
        </Link>
      </div>
    </motion.nav>
  );
}

/* ─────────────────────────────────────────
   HOW IT WORKS (BENTO STYLE)
───────────────────────────────────────── */
const steps = [
  {
    icon: Code2,
    title: "Fluid Workflow",
    desc: "Write code in our high-performance Monaco environment. No lag, no bloat, just pure focus.",
  },
  {
    icon: Gauge,
    title: "Cognitive Scoring",
    desc: "We analyze keystroke rhythm and biometric hand tracking to build your unique stress profile.",
  },
  {
    icon: Sparkles,
    title: "AI Synthesis",
    desc: "Gemini 2.0 interprets your roadblocks and offers surgical fixes without breaking your flow.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-40 px-6 scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        <FadeUp className="mb-20">
          <h2 className="font-space text-4xl font-bold text-white tracking-tight mb-4">How it works</h2>
          <p className="font-inter text-white/30 max-w-md">Our continuous loop of telemetry and prediction.</p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="group relative p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-500 overflow-hidden h-full">
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#EFB6AD]/5 blur-[60px] group-hover:bg-[#EFB6AD]/10 transition-colors duration-500" />
                  
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mb-8">
                       <Icon size={24} className="text-[#EFB6AD]" />
                    </div>
                    <h3 className="font-space text-3xl font-bold text-white mb-4">{step.title}</h3>
                    <p className="font-inter text-lg text-white/80 leading-relaxed font-light">{step.desc}</p>
                  </div>
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
function Features() {
  return (
    <section id="features" className="py-40 px-6 bg-white/[0.01] scroll-mt-20">
       <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-20 items-center">
          <FadeUp className="lg:w-1/2">
             <span className="font-mono text-sm uppercase tracking-[0.3em] text-[#EFB6AD] mb-6 block font-bold">Capabilities</span>
             <h2 className="font-space text-6xl font-bold text-white leading-tight mb-8">
                Built for the <br />
                unrelenting developer.
             </h2>
             <p className="font-inter text-2xl text-white/80 mb-10 font-light leading-relaxed">
                We've combined hand telemetry, facial expression analysis, and local code execution into a single, cohesive experience.
             </p>
             <Link to="/editor" className="inline-flex items-center gap-2 font-space font-bold text-white border-b-2 border-[#EFB6AD] pb-1 hover:opacity-70 transition-opacity">
                Explore the workspace <ArrowRight size={16} />
             </Link>
          </FadeUp>
          
          <FadeUp className="lg:w-1/2 grid grid-cols-2 gap-4" delay={0.2}>
             <div className="aspect-square bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col justify-end">
                <p className="font-space text-2xl text-white font-bold mb-2">98%</p>
                <p className="text-[12px] uppercase tracking-wider text-white/30 font-bold">Prediction Accuracy</p>
             </div>
             <div className="aspect-square bg-[#EFB6AD] rounded-3xl p-8 flex flex-col justify-end text-black">
                <p className="font-space text-2xl font-bold mb-2">0ms</p>
                <p className="text-[12px] uppercase tracking-wider font-bold opacity-60">Latency Lag</p>
             </div>
             <div className="col-span-2 h-32 bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex items-center justify-between">
                <div>
                   <p className="font-space text-xl text-white font-bold">Gemini 2.0 Flash</p>
                   <p className="text-[12px] uppercase text-white/40 font-bold mt-1">Native Integration</p>
                </div>
                <Sparkles className="text-[#EFB6AD]" size={28} />
             </div>
          </FadeUp>
       </div>
    </section>
  );
}

/* ─────────────────────────────────────────
   FOOTER
───────────────────────────────────────── */
function Footer() {
  return (
    <footer className="py-20 px-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="flex flex-col gap-6">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                 <Brain size={16} className="text-[#EFB6AD]" />
              </div>
              <span className="font-space font-bold text-white tracking-tight">Flux-State</span>
           </div>
           <p className="text-white/20 text-sm font-light max-w-xs leading-relaxed">
              Crafting the future of human-AI collaboration for the next generation of engineers.
           </p>
        </div>
        
        <div className="grid grid-cols-2 gap-20">
           <div className="flex flex-col gap-4">
              <p className="text-white font-space font-bold text-sm">Platform</p>
              {["Editor", "Telemetry", "Zen Mode"].map(l => (
                 <span key={l} className="text-white/30 text-[13px] hover:text-[#EFB6AD] cursor-pointer transition-colors">{l}</span>
              ))}
           </div>
           <div className="flex flex-col gap-4">
              <p className="text-white font-space font-bold text-sm">Company</p>
              {["About", "Privacy", "GitHub"].map(l => (
                 <span key={l} className="text-white/30 text-[13px] hover:text-[#EFB6AD] cursor-pointer transition-colors">{l}</span>
              ))}
           </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center bg-transparent">
         <p className="text-[10px] font-mono text-white/10 uppercase tracking-widest">© 2026 FLUX-STATE INC. ALL RIGHTS RESERVED.</p>
         <div className="flex gap-8 mt-4 md:mt-0">
            <span className="text-[10px] font-mono text-white/10 hover:text-[#EFB6AD] cursor-pointer">TWITTER</span>
            <span className="text-[10px] font-mono text-white/10 hover:text-[#EFB6AD] cursor-pointer">DISCORD</span>
         </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────
   PAGE ASSEMBLY
───────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="bg-[#050103] text-white selection:bg-[#EFB6AD]/30 selection:text-white no-scrollbar min-h-screen overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorks />
        
        <section className="py-20 px-6">
          <FadeUp>
            <FeatureCarousel
              image={{
                alt: "Flux-State Core Features",
                step1img1: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?q=80&w=1740&auto=format&fit=crop",
                step1img2: "https://images.unsplash.com/photo-1607705703571-c5a8695f18f6?q=80&w=1740&auto=format&fit=crop",
                step2img1: "https://images.unsplash.com/photo-1542393545-10f5cde2c810?q=80&w=1661&auto=format&fit=crop",
                step2img2: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?q=80&w=1674&auto=format&fit=crop",
                step3img: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=1740&auto=format&fit=crop",
                step4img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1742&auto=format&fit=crop",
              }}
            />
          </FadeUp>
        </section>

        <Features />
      </main>
      <Footer />
    </div>
  );
}
