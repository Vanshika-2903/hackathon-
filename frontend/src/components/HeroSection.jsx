import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);

  // ACCENT COLOR: #EFB6AD (from current project)
  // BG COLOR: #050103 (from current project)
  const ACCENT_COLOR = 0xEFB6AD;
  const BG_COLOR = '#050103';

  useEffect(() => {
    if (!canvasRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    canvasRef.current.appendChild(renderer.domElement);

    // --- Icosahedron Wireframe ---
    const geometry = new THREE.IcosahedronGeometry(1.8, 1);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({ 
      color: ACCENT_COLOR, 
      transparent: true, 
      opacity: 0.4 
    });
    const wireframe = new THREE.LineSegments(edges, material);
    scene.add(wireframe);

    // --- Particle Field (300 points) ---
    const particlesCount = 300;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }
    const particlesGeometry = new THREE.BufferGeometry();
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.015,
      color: ACCENT_COLOR,
      transparent: true,
      opacity: 0.6,
    });
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);

    camera.position.z = 5;

    // --- Mouse Interaction ---
    const handleMouseMove = (event) => {
      mouseRef.current.x = (event.clientX / window.innerWidth) - 0.5;
      mouseRef.current.y = (event.clientY / window.innerHeight) - 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // --- Animation Loop ---
    let frameId;
    const animate = (time) => {
      frameId = requestAnimationFrame(animate);

      // Rotate wireframe
      wireframe.rotation.y += 0.003;
      
      // Lerp toward mouse
      const targetRX = mouseRef.current.y * 0.3;
      const targetRY = mouseRef.current.x * 0.3;
      wireframe.rotation.x += (targetRX - wireframe.rotation.x) * 0.05;
      wireframe.rotation.y += (targetRY - wireframe.rotation.y) * 0.05;

      // Pulse particles
      particlesMaterial.opacity = 0.3 + Math.sin(time * 0.002) * 0.2;
      particlesMesh.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };
    animate();

    // --- Handle Resize ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    setIsLoaded(true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (canvasRef.current && canvasRef.current.contains(renderer.domElement)) {
        canvasRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  const staggerVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.12,
        duration: 0.7,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <div className="relative h-screen w-full bg-[#050103] overflow-hidden font-mono selection:bg-[#EFB6AD]/30">
      {/* Three.js Background */}
      <motion.div 
        ref={canvasRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* Glow Layer */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(circle, rgba(239,182,173,0.07) 0%, transparent 65%)'
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-8 text-center">
        <motion.div
          custom={0}
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8 text-[11px] font-bold uppercase tracking-[0.4em] text-[#EFB6AD]/70"
        >
          Cognitive Engine v1.0
        </motion.div>

        <motion.h1
          custom={1}
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
          className="mb-10 text-6xl md:text-8xl font-light tracking-tighter text-white"
        >
          Stay in <span className="bg-gradient-to-r from-white via-[#EFB6AD] to-[#EFB6AD]/40 bg-clip-text text-transparent">Flow State.</span>
        </motion.h1>

        <motion.p
          custom={2}
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
          className="mb-12 max-w-2xl text-base md:text-lg text-[#8899AA] leading-relaxed"
        >
          Flux-State reads your stress. <br />
          Intervenes before you break.
        </motion.p>

        <motion.div
          custom={3}
          variants={staggerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-6"
        >
          <Link
            to="/editor"
            className="rounded-none bg-[#EFB6AD] px-10 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:brightness-110 hover:shadow-[0_0_30px_rgba(239,182,173,0.3)]"
          >
            Launch Editor
          </Link>
        </motion.div>

        {/* Stress Bar UI */}
        <div className="absolute bottom-20 left-0 right-0 px-8 flex flex-col items-center">
          <div className="w-full max-w-lg">
            <div className="mb-3 flex justify-between items-end">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/40">Cognitive Load</span>
              <span className="text-xs font-bold text-[#EFB6AD]">73%</span>
            </div>
            
            <div className="h-1.5 w-full bg-white/5 border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '73%' }}
                transition={{ duration: 1.6, ease: 'easeOut', delay: 0.8 }}
                className="h-full bg-[#EFB6AD]"
                style={{ boxShadow: '0 0 12px #EFB6AD' }}
              />
            </div>

            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] font-bold tracking-widest text-white/40 uppercase">
              <span>Focus 94%</span>
              <div className="h-3 w-px bg-white/20" />
              <span className="text-[#EFB6AD]/80">Flow Active</span>
              <div className="h-3 w-px bg-white/20" />
              <span>AI Standby</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap');
        
        .font-mono {
          font-family: 'JetBrains Mono', monospace !important;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;
