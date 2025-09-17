

"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, ShieldCheck, LifeBuoy, Mail, AlertTriangle, Globe, User, ChevronDown, ChevronUp, Sparkles, Star, Rocket, Lightbulb, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, useInView, useSpring } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { listenToAboutInfoFromRtdb, AppInfo, ReleasePlanItem, listenToOwnerInfoFromRtdb, OwnerInfo, AboutStats, listenToAboutStatsFromRtdb } from "@/services/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { suggestFeatures, type SuggestFeaturesOutput } from "@/ai/flows/suggest-features-flow";
import * as LucideIcons from "lucide-react";

const defaultAppInfo: AppInfo = {
    version: 'Beta 1.2',
    build: 'Sutradhaar1',
    releaseChannel: 'Beta',
    license: 'None',
};

const defaultOwnerInfo: OwnerInfo = {
    name: 'Aman Yadav',
    imageUrl: 'https://picsum.photos/seed/aman/120/120',
};

const defaultAboutStats: AboutStats = {
    happyUsers: '10,000+',
    calculationsDone: '1M+',
};

const defaultReleasePlan: ReleasePlanItem[] = [
    { id: '1', title: 'Beta 1', date: '15/07/2025', description: 'Core release with unit conversion, notes, and history features.' },
    { id: '2', title: 'Next Steps', date: 'Upcoming', description: 'Smarter, faster conversions with notes & history\nModern UI in Figma\nResponsive React components\nContinuous feature updates\nSutradhaar web app\nTesting & optimizations\nCross-platform official release' },
];

const currentFeaturesList = [
    'Unit Converter (Length, Weight, Temp, etc.)',
    'Calculator with History',
    'Rich-text Notes with attachments',
    'Cross-tool History (Conversions, Calculations)',
    'Favorites for quick access',
    'User Authentication',
    'Profile & Statistics Tracking',
    'Customizable Themes & UI',
    'PWA for offline use',
    'AI-powered natural language conversion parsing'
];


const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center py-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-semibold text-foreground text-right">{value}</p>
    </div>
);

const AnimatedStat = ({ value }: { value: string }) => {
    const ref = useRef<HTMLParagraphElement>(null);
    const isInView = useInView(ref, { once: true });
    
    // Check if the value is a number with a suffix like 'k' or 'M'
    const numericMatch = value.match(/^([\d.,]+)/);
    const suffix = numericMatch ? value.substring(numericMatch[0].length) : '';
    const numericValue = numericMatch ? parseFloat(numericMatch[0].replace(/,/g, '')) : 0;
    
    const spring = useSpring(0, {
        mass: 0.8,
        stiffness: 75,
        damping: 15,
    });

    useEffect(() => {
        if (isInView) {
            spring.set(numericValue);
        }
    }, [isInView, spring, numericValue]);
    
    useEffect(() => {
        const unsubscribe = spring.on("change", (latest) => {
            if (ref.current) {
                ref.current.textContent = Math.round(latest).toLocaleString() + suffix;
            }
        });
        return unsubscribe;
    }, [spring, suffix]);

    return <p ref={ref} className="text-3xl sm:text-4xl font-bold text-foreground">{value}</p>;
};


export function About() {
  const router = useRouter();
  const [appInfo, setAppInfo] = useState<AppInfo>(defaultAppInfo);
  const [releasePlan, setReleasePlan] = useState<ReleasePlanItem[]>(defaultReleasePlan);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo>(defaultOwnerInfo);
  const [aboutStats, setAboutStats] = useState<AboutStats>(defaultAboutStats);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [featureSuggestions, setFeatureSuggestions] = useState<SuggestFeaturesOutput | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  
  const toggleExpand = (id: string) => {
    setExpandedItems(prev => ({...prev, [id]: !prev[id]}));
  };

  useEffect(() => {
    const unsubscribeAbout = listenToAboutInfoFromRtdb((data) => {
        setAppInfo(data?.appInfo || defaultAppInfo);
        setReleasePlan(data?.releasePlan || defaultReleasePlan);
    });
    
    const unsubscribeOwner = listenToOwnerInfoFromRtdb((data) => {
        setOwnerInfo(data || defaultOwnerInfo);
    });
    
    const unsubscribeStats = listenToAboutStatsFromRtdb((stats) => {
        setAboutStats(stats || defaultAboutStats);
    });

    return () => {
        unsubscribeAbout();
        unsubscribeOwner();
        unsubscribeStats();
    }
  }, []);

  const handleSuggestFeatures = async () => {
      setIsSuggesting(true);
      setFeatureSuggestions(null);
      try {
          const suggestions = await suggestFeatures({ currentFeatures: currentFeaturesList });
          setFeatureSuggestions(suggestions);
      } catch (error) {
          console.error("Failed to suggest features:", error);
      } finally {
          setIsSuggesting(false);
      }
  };

  useEffect(() => {
    if (showConfetti) {
      const timeout = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [showConfetti]);

  const testimonials = [
      {
          name: "Priya Sharma",
          location: "Mumbai",
          text: "This app is a lifesaver for my freelance work. The currency converter is always up-to-date, and the notes feature keeps everything in one place.",
      },
      {
          name: "Rohan Kumar",
          location: "Delhi",
          text: "As a student, I use the calculator and unit converter daily. It's fast, accurate, and the interface is clean and easy to use.",
      },
      {
          name: "Anjali Gupta",
          location: "Bangalore",
          text: "The custom units feature is a game-changer for my niche projects. I can create my own conversions, saving me so much time.",
      }
  ];

  return (
    <div className="relative p-4 sm:p-8 space-y-16 bg-background text-foreground overflow-hidden">
      <header className="absolute top-4 left-4 z-10">
        <Button variant="secondary" className="rounded-xl shadow-md" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
      </header>
      {/* Floating Background Animation */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
      >
        <motion.div
          className="absolute top-20 left-1/4 w-40 h-40 bg-primary/20 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 6 }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-56 h-56 bg-accent/20 rounded-full blur-3xl"
          animate={{ y: [0, -40, 0] }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
      </motion.div>

      {/* Hero Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative text-center pt-10">
        <h1 className="text-4xl sm:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
          Sutradhaar 🚀
        </h1>
        <p className="text-base sm:text-lg text-foreground/80 max-w-2xl mx-auto">
          <strong>Sutradhaar</strong> is a modern, smart, and simple unit converter app built by <strong>Aman Yadav</strong>. 
          It blends <span className="text-primary font-semibold">speed</span>, <span className="text-accent font-semibold">accuracy</span>, and 
          <span className="text-primary font-semibold"> elegant design</span> to make your calculations effortless.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:gap-16">
          <motion.div whileHover={{ scale: 1.1 }} className="text-center bg-card rounded-2xl shadow-xl p-6 border-t-4 border-primary">
            <AnimatedStat value={aboutStats.happyUsers} />
            <p className="text-card-foreground/80">Happy Users</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} className="text-center bg-card rounded-2xl shadow-xl p-6 border-t-4 border-accent">
            <AnimatedStat value={aboutStats.calculationsDone} />
            <p className="text-card-foreground/80">Calculations Done</p>
          </motion.div>
        </div>
      </motion.div>

      {/* App Information */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="shadow-lg rounded-2xl border-l-4 border-primary bg-card/80">
          <CardHeader>
            <CardTitle className="text-primary flex items-center gap-2"><Rocket className="w-5 h-5 text-accent" /> App Information</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/50">
             <DetailRow label="Version" value={appInfo.version} />
             <DetailRow label="Build" value={appInfo.build} />
             <DetailRow label="Channel" value={appInfo.releaseChannel} />
             <DetailRow label="License" value={appInfo.license} />
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Feature Suggestion Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="shadow-lg rounded-2xl border-l-4 border-accent bg-card/80">
            <CardHeader className="text-center">
                <CardTitle className="text-accent flex items-center gap-2 justify-center"><Lightbulb className="w-5 h-5"/> What's Next for Sutradhaar?</CardTitle>
                <CardDescription>Click the button to get AI-powered feature suggestions!</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <Button onClick={handleSuggestFeatures} disabled={isSuggesting}>
                    {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                    {isSuggesting ? "Brainstorming..." : "Suggest New Features"}
                </Button>
                {featureSuggestions && (
                    <div className="mt-6 space-y-4 text-left">
                        {featureSuggestions.features.map((feature, index) => {
                            const Icon = (LucideIcons as any)[feature.icon] || LucideIcons.Zap;
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-4 bg-secondary rounded-lg flex items-start gap-4"
                                >
                                    <div className="p-2 bg-primary/10 rounded-full text-primary mt-1">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-foreground">{feature.title}</h4>
                                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
      </motion.div>

      {/* Roadmap */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-3xl font-bold text-center text-primary mb-8 flex justify-center items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" /> Release Plan & Roadmap
            </h2>
            <div className="relative border-l-4 border-primary/50 ml-6 space-y-8">
                {releasePlan.map((item, index) => (
                    <div key={item.id} className="ml-6">
                        <div className={`absolute -left-3.5 w-6 h-6 ${index % 2 === 0 ? 'bg-primary' : 'bg-accent'} rounded-full border-4 border-background`}></div>
                        <div className="flex items-start gap-2 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                            <div className="flex-1">
                                <h3 className="font-semibold text-primary">📝 {item.title}</h3>
                                <span className="block text-xs font-normal text-muted-foreground">{item.date}</span>
                            </div>
                            {expandedItems[item.id] ? <ChevronUp className="w-4 h-4 mt-1 text-primary" /> : <ChevronDown className="w-4 h-4 mt-1 text-primary" />}
                        </div>
                        {expandedItems[item.id] && (
                            <motion.div className="text-foreground/80 mt-2 whitespace-pre-line" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                               {item.description}
                            </motion.div>
                        )}
                    </div>
                ))}
            </div>
        </motion.div>


      {/* WOW Button */}
      <div className="text-center">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowConfetti(true)}
          className="px-6 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-bold shadow-lg flex items-center gap-2 mx-auto"
        >
          <Star className="w-5 h-5" /> Click for WOW!
        </motion.button>
        {showConfetti && (
          <motion.div
            className="absolute inset-0 flex justify-center items-center text-6xl text-accent font-bold"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            🎉 WOW 🎉
          </motion.div>
        )}
      </div>

      {/* Testimonials */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="text-3xl font-bold mb-6 text-center text-primary">What Our Users Say</h2>
        <div className="grid grid-cols-1 gap-8">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="p-6 shadow-lg bg-card hover:scale-105 transition-transform">
              <p className="italic text-card-foreground/80">"{testimonial.text}"</p>
              <p className="mt-4 font-semibold text-primary">{testimonial.name}, {testimonial.location}</p>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Founder Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <h2 className="text-3xl font-bold mb-4 text-primary">Credits & Founder</h2>
        {ownerInfo.imageUrl && (
             <Image 
                src={ownerInfo.imageUrl}
                alt={ownerInfo.name}
                width={120}
                height={120}
                className="rounded-full object-cover border-4 border-background shadow-lg mx-auto mb-4"
                data-ai-hint="man portrait"
            />
        )}
        <p className="text-foreground/80 flex justify-center items-center gap-2"><User className="w-5 h-5 text-primary" /> {ownerInfo.name} – Founder & Engineer</p>
        <p className="mt-6 max-w-2xl mx-auto text-foreground/80 italic">
          "Hi, I’m Aman Yadav, the creator of Sutradhaar. My vision is to build a simple yet powerful productivity tool that helps people save time, focus better, and achieve more with ease."
        </p>
      </motion.div>

      {/* Footer Links */}
       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-8 text-center">
        <div className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform">
          <h3 className="font-semibold mb-3 text-primary flex justify-center items-center gap-2"><BookOpen className="w-5 h-5" /> Learn More</h3>
          <Link href="/updates" className="block text-foreground hover:text-accent cursor-pointer">Updates</Link>
          <Link href="/how-to-use" className="block text-foreground hover:text-accent cursor-pointer">How to Use</Link>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform">
          <h3 className="font-semibold mb-3 text-primary flex justify-center items-center gap-2"><ShieldCheck className="w-5 h-5" /> Legal</h3>
          <Link href="#" className="block text-foreground hover:text-accent cursor-pointer">Terms of Service</Link>
          <Link href="/privacy-policy" className="block text-foreground hover:text-accent cursor-pointer">Privacy Policy</Link>
          <Link href="#" className="block text-foreground hover:text-accent cursor-pointer">Open Source</Link>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform">
          <h3 className="font-semibold mb-3 text-primary flex justify-center items-center gap-2"><LifeBuoy className="w-5 h-5" /> Support</h3>
          <a href="https://aman9528.wixstudio.com/my-site-3/aman" target="_blank" rel="noopener noreferrer" className="block text-foreground hover:text-accent cursor-pointer flex justify-center items-center gap-2"><Mail className="w-4 h-4" /> Contact Us</a>
          <a href="https://aman9528.wixstudio.com/my-site-3" target="_blank" rel="noopener noreferrer" className="block text-foreground hover:text-accent cursor-pointer flex justify-center items-center gap-2"><AlertTriangle className="w-4 h-4" /> Report an Issue</a>
        </div>
      </motion.div>
    </div>
  );
}
