

"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, ShieldCheck, LifeBuoy, Mail, AlertTriangle, Globe, User, ChevronDown, ChevronUp, Sparkles, Star, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { listenToAboutInfoFromRtdb, AppInfo, ReleasePlanItem, listenToOwnerInfoFromRtdb, OwnerInfo } from "@/services/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const defaultAppInfo: AppInfo = {
    version: 'Beta 1.2',
    build: 'Sutradhaar1',
    releaseChannel: 'Beta',
    license: 'None',
};

const defaultOwnerInfo: OwnerInfo = {
    name: 'Aman Yadav',
    imageUrl: '/aman.jpeg',
};

const defaultReleasePlan: ReleasePlanItem[] = [
    { id: '1', title: 'Beta 1', date: '15/07/2025', description: 'Core release with unit conversion, notes, and history features.' },
    { id: '2', title: 'Next Steps', date: 'Upcoming', description: 'Smarter, faster conversions with notes & history\nModern UI in Figma\nResponsive React components\nContinuous feature updates\nSutradhaar web app\nTesting & optimizations\nCross-platform official release' },
];


export function About() {
  const router = useRouter();
  const [appInfo, setAppInfo] = useState<AppInfo>(defaultAppInfo);
  const [releasePlan, setReleasePlan] = useState<ReleasePlanItem[]>(defaultReleasePlan);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo>(defaultOwnerInfo);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [showConfetti, setShowConfetti] = useState(false);
  
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

    return () => {
        unsubscribeAbout();
        unsubscribeOwner();
    }
  }, []);

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
    <div className="relative p-4 sm:p-8 space-y-16 bg-gradient-to-b from-purple-50 via-white to-purple-100 text-gray-800 overflow-hidden">
      <header className="absolute top-4 left-4 z-10">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
        </Button>
      </header>
      {/* Floating Background Animation */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
      >
        <motion.div
          className="absolute top-20 left-1/4 w-40 h-40 bg-purple-300 rounded-full blur-3xl"
          animate={{ y: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 6 }}
        />
        <motion.div
          className="absolute bottom-20 right-1/4 w-56 h-56 bg-pink-300 rounded-full blur-3xl"
          animate={{ y: [0, -40, 0] }}
          transition={{ repeat: Infinity, duration: 8 }}
        />
      </motion.div>

      {/* Hero Section */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative text-center pt-10">
        <h1 className="text-4xl sm:text-6xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          Sutradhaar 🚀
        </h1>
        <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto">
          <strong>Sutradhaar</strong> is a modern, smart, and simple unit converter app built by <strong>Aman Yadav</strong>. 
          It blends <span className="text-purple-600 font-semibold">speed</span>, <span className="text-pink-600 font-semibold">accuracy</span>, and 
          <span className="text-purple-600 font-semibold"> elegant design</span> to make your calculations effortless.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:gap-16">
          <motion.div whileHover={{ scale: 1.1 }} className="text-center bg-white rounded-2xl shadow-xl p-6 border-t-4 border-purple-500">
            <p className="text-3xl sm:text-4xl font-bold text-purple-700">10,000+</p>
            <p className="text-gray-600">Happy Users</p>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }} className="text-center bg-white rounded-2xl shadow-xl p-6 border-t-4 border-pink-500">
            <p className="text-3xl sm:text-4xl font-bold text-pink-600">1M+</p>
            <p className="text-gray-600">Calculations Done</p>
          </motion.div>
        </div>
      </motion.div>

      {/* App Information */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Card className="shadow-lg rounded-2xl border-l-4 border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader>
            <CardTitle className="text-purple-700 flex items-center gap-2"><Rocket className="w-5 h-5 text-pink-500" /> App Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div><p className="font-semibold text-purple-600">Version</p><p>{appInfo.version}</p></div>
            <div><p className="font-semibold text-purple-600">Build</p><p>{appInfo.build}</p></div>
            <div><p className="font-semibold text-purple-600">Channel</p><p>{appInfo.releaseChannel}</p></div>
            <div><p className="font-semibold text-purple-600">License</p><p>{appInfo.license}</p></div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Roadmap */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-3xl font-bold text-center text-purple-700 mb-8 flex justify-center items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-500" /> Release Plan & Roadmap
            </h2>
            <div className="relative border-l-4 border-purple-400 ml-6 space-y-8">
                {releasePlan.map((item, index) => (
                    <div key={item.id} className="ml-6">
                        <div className={`absolute -left-3.5 w-6 h-6 ${index % 2 === 0 ? 'bg-purple-500' : 'bg-pink-500'} rounded-full border-4 border-white`}></div>
                        <h3 className={`font-semibold ${index % 2 === 0 ? 'text-purple-600' : 'text-pink-600'} flex items-start gap-2 cursor-pointer`} onClick={() => toggleExpand(item.id)}>
                            <div className="flex-1">
                                📝 {item.title}
                                <span className="block text-xs font-normal text-gray-500">{item.date}</span>
                            </div>
                            {expandedItems[item.id] ? <ChevronUp className="w-4 h-4 mt-1" /> : <ChevronDown className="w-4 h-4 mt-1" />}
                        </h3>
                        {expandedItems[item.id] && (
                            <motion.div className="text-gray-700 mt-2 whitespace-pre-line" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
          className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg flex items-center gap-2 mx-auto"
        >
          <Star className="w-5 h-5" /> Click for WOW!
        </motion.button>
        {showConfetti && (
          <motion.div
            className="absolute inset-0 flex justify-center items-center text-6xl text-pink-500 font-bold"
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
        <h2 className="text-3xl font-bold mb-6 text-center text-purple-700">What Our Users Say</h2>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="p-6 shadow-lg bg-purple-50 hover:scale-105 transition-transform">
              <p className="italic text-gray-700">"{testimonial.text}"</p>
              <p className="mt-4 font-semibold text-purple-700">{testimonial.name}, {testimonial.location}</p>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Founder Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <h2 className="text-3xl font-bold mb-4 text-purple-700">Credits & Founder</h2>
        {ownerInfo.imageUrl && (
             <Image 
                src={ownerInfo.imageUrl}
                alt={ownerInfo.name}
                width={120}
                height={120}
                className="rounded-full object-cover border-4 border-white shadow-lg mx-auto mb-4"
                data-ai-hint="man portrait"
            />
        )}
        <p className="text-gray-700 flex justify-center items-center gap-2"><User className="w-5 h-5 text-purple-600" /> {ownerInfo.name} – Founder & Engineer</p>
        <p className="mt-6 max-w-2xl mx-auto text-gray-700 italic">
          "Hi, I’m Aman Yadav, the creator of Sutradhaar. My vision is to build a simple yet powerful productivity tool that helps people save time, focus better, and achieve more with ease."
        </p>
      </motion.div>

      {/* Footer Links */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid md:grid-cols-3 gap-8 text-center">
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform">
          <h3 className="font-semibold mb-3 text-purple-600 flex justify-center items-center gap-2"><BookOpen className="w-5 h-5" /> Learn More</h3>
          <Link href="/updates" className="block hover:text-purple-700 cursor-pointer">Updates</Link>
          <Link href="/how-to-use" className="block hover:text-purple-700 cursor-pointer">How to Use</Link>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform">
          <h3 className="font-semibold mb-3 text-purple-600 flex justify-center items-center gap-2"><ShieldCheck className="w-5 h-5" /> Legal</h3>
          <Link href="#" className="block hover:text-purple-700 cursor-pointer">Terms of Service</Link>
          <Link href="/privacy-policy" className="block hover:text-purple-700 cursor-pointer">Privacy Policy</Link>
          <Link href="#" className="block hover:text-purple-700 cursor-pointer">Open Source</Link>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-transform">
          <h3 className="font-semibold mb-3 text-purple-600 flex justify-center items-center gap-2"><LifeBuoy className="w-5 h-5" /> Support</h3>
          <Link href="/how-to-use" className="block hover:text-purple-700 cursor-pointer flex justify-center items-center gap-2"><Globe className="w-4 h-4" /> Help Center</Link>
          <a href="mailto:amanyadavyadav9458@gmail.com" className="block hover:text-purple-700 cursor-pointer flex justify-center items-center gap-2"><Mail className="w-4 h-4" /> Contact Us</a>
          <a href="https://aman9528.wixstudio.com/my-site-3" target="_blank" rel="noopener noreferrer" className="block hover:text-purple-700 cursor-pointer flex justify-center items-center gap-2"><AlertTriangle className="w-4 h-4" /> Report an Issue</a>
        </div>
      </motion.div>
    </div>
  );
}

    
