
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart, Calendar, Lightbulb, Code, Sparkles, Globe, Wrench, Rocket, FileText, Shield, LifeBuoy, Flag, Info, FileClock, Users, Activity, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { listenToAboutInfoFromRtdb, AppInfo, ReleasePlanItem, listenToOwnerInfoFromRtdb, OwnerInfo } from "@/services/firestore";
import { Skeleton } from "./ui/skeleton";

const defaultAppInfo: AppInfo = {
    version: 'Beta 1.0.0',
    build: '2025.09.01',
    releaseChannel: 'Beta',
    license: 'MIT',
};

const defaultOwnerInfo: OwnerInfo = {
    name: 'Aman Yadav',
    imageUrl: '/aman.jpeg',
};

const defaultReleasePlan: ReleasePlanItem[] = [
    { id: '1', title: 'Planning', date: '12 May 2025' },
    { id: '2', title: 'Beta Test 1', date: '29 Dec 2025' },
    { id: '3', title: 'Beta Test 2', date: '1 July 2026' },
    { id: '4', title: 'Beta Test 3', date: '12 Oct 2027' },
    { id: '5', title: 'Final Release', date: '15 Aug 2028' },
];


function AppInfoSkeleton() {
    return (
        <div className="bg-white shadow-lg rounded-2xl p-4">
            <h2 className="text-2xl font-bold text-indigo-600 mb-4"><Skeleton className="h-8 w-1/2" /></h2>
            <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        </div>
    )
}

export function About() {
  const router = useRouter();
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [releasePlan, setReleasePlan] = useState<ReleasePlanItem[] | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);


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

  const features = [
    {
      title: "App Feature",
      desc: "Deep dive into the main features of Sutradhaar, designed to make unit conversion smarter and faster.",
      icon: <BarChart className="w-8 h-8 text-indigo-500" />,
    },
    {
      title: "Release Plan",
      desc: "Planned roadmap with milestones, beta releases, and public launch dates.",
      icon: <Calendar className="w-8 h-8 text-indigo-500" />,
    },
    {
      title: "Figma UI",
      desc: "Designing a modern UI prototype in Figma to ensure user-friendly layouts.",
      icon: <Lightbulb className="w-8 h-8 text-indigo-500" />,
    },
    {
      title: "Convert Into Code",
      desc: "Transforming UI prototypes into responsive and clean React components.",
      icon: <Code className="w-8 h-8 text-indigo-500" />,
    },
    {
      title: "Add Updates",
      desc: "Regular feature enhancements and improvements after launch.",
      icon: <Sparkles className="w-8 h-8 text-indigo-500" />,
      href: "/updates"
    },
    {
      title: "Make a Website",
      desc: "Deploying a full-featured Sutradhaar website for online access.",
      icon: <Globe className="w-8 h-8 text-indigo-500" />,
    },
    {
      title: "Proper Testing",
      desc: "Ensuring app stability through bug fixes, testing cycles, and optimizations.",
      icon: <Wrench className="w-8 h-8 text-indigo-500" />,
    },
    {
      title: "Make App",
      desc: "Official release of the Sutradhaar app across platforms.",
      icon: <Rocket className="w-8 h-8 text-indigo-500" />,
    },
  ];
  
  const legalLinks = [
    { title: 'Terms of Service', href: '#', icon: <FileText/> },
    { title: 'Privacy Policy', href: '/privacy-policy', icon: <Shield/> },
    { title: 'Open Source', href: '#', icon: <Code/> },
  ];

  const supportLinks = [
    { title: 'Help Center', href: '/how-to-use', icon: <LifeBuoy/> },
    { title: 'Contact Us', href: 'https://aman9528.wixstudio.com/my-site-3', icon: <Globe/> },
    { title: 'Report an Issue', href: 'https://aman9528.wixstudio.com/my-site-3', icon: <Flag/> },
  ];
  
  const testimonials = [
      {
          name: "Priya Sharma",
          location: "Mumbai",
          text: "This app is a lifesaver for my freelance work. The currency converter is always up-to-date, and the notes feature helps me keep track of everything in one place. Highly recommended!",
          image: "https://picsum.photos/seed/woman1/100/100"
      },
      {
          name: "Rohan Kumar",
          location: "Delhi",
          text: "As a student, I use the calculator and unit converter daily. It's fast, accurate, and the interface is so clean and easy to use. The best all-in-one productivity tool I've found.",
          image: "https://picsum.photos/seed/man1/100/100"
      },
      {
          name: "Anjali Gupta",
          location: "Bangalore",
          text: "The custom units feature is a game-changer for my niche projects. I can create my own conversion categories, which saves me so much time. A truly powerful and flexible app.",
          image: "https://picsum.photos/seed/woman2/100/100"
      }
  ];


  return (
    <motion.div 
        className="w-full max-w-lg mx-auto flex flex-col items-center px-6 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="w-full">
        <header className="w-full mb-12">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
        </header>
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            About Sutradhaar
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-600">
            Sutradhaar is a modern, smart, and simple unit converter app built by Aman Yadav. It combines design, speed, and accuracy to help you calculate effortlessly.
          </p>
           <div className="mt-8 flex justify-center gap-6 text-center">
                <div>
                    <p className="text-3xl font-bold text-indigo-600">10,000+</p>
                    <p className="text-sm text-muted-foreground">Happy Users</p>
                </div>
                <div>
                    <p className="text-3xl font-bold text-indigo-600">1M+</p>
                    <p className="text-sm text-muted-foreground">Calculations Done</p>
                </div>
            </div>
        </section>

        {/* App Info Section */}
        <section className="mt-12 grid grid-cols-1 gap-8 w-full">
            {!appInfo || !releasePlan ? (
                <>
                    <AppInfoSkeleton />
                    <AppInfoSkeleton />
                </>
            ) : (
                <>
                  <div className="bg-white shadow-lg rounded-2xl p-4 hover:shadow-xl transition">
                    <h2 className="text-2xl font-bold text-indigo-600 mb-4">App Information</h2>
                    <ul className="text-gray-600 leading-relaxed space-y-2">
                        <li><strong>Version:</strong> {appInfo.version}</li>
                        <li><strong>Build:</strong> {appInfo.build}</li>
                        <li><strong>Release Channel:</strong> {appInfo.releaseChannel}</li>
                        <li><strong>License:</strong> {appInfo.license}</li>
                    </ul>
                  </div>

                  <div className="bg-white shadow-lg rounded-2xl p-4 hover:shadow-xl transition">
                    <h2 className="text-2xl font-bold text-indigo-600 mb-4">Release Plan</h2>
                    <ul className="text-gray-600 leading-relaxed space-y-2">
                      {releasePlan.map(item => (
                          <li key={item.id}>📝 <strong>{item.title}:</strong> {item.date}</li>
                      ))}
                    </ul>
                  </div>
                </>
            )}
        </section>

        {/* Roadmap Section */}
        <section className="mt-16 w-full">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
            Feature & Roadmap
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {features.map((step, idx) => {
              const cardContent = (
                <motion.div
                  className="relative bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition group border-t-2 border-indigo-400"
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="text-3xl mb-2">{step.icon}</div>
                  <h3 className="text-md font-bold text-indigo-600 mb-1 group-hover:text-purple-600">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-xs leading-relaxed">{step.desc}</p>
                </motion.div>
              );

              if (step.href) {
                return (
                  <Link href={step.href} key={idx}>
                    {cardContent}
                  </Link>
                );
              }

              return <div key={idx}>{cardContent}</div>;
            })}
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="mt-16 w-full">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
            What Our Users Say
          </h2>
          <div className="space-y-8">
            {testimonials.map((testimonial, idx) => (
                 <motion.div 
                    key={idx}
                    className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                    <div className="flex items-start gap-4">
                        <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            width={60}
                            height={60}
                            className="rounded-full border-2 border-indigo-200"
                            data-ai-hint="person photo"
                        />
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                            </div>
                            <p className="text-gray-700 italic mt-2">"{testimonial.text}"</p>
                            <p className="text-right mt-4 font-semibold text-indigo-600">- {testimonial.name}, <span className="font-normal text-gray-500">{testimonial.location}</span></p>
                        </div>
                    </div>
                </motion.div>
            ))}
          </div>
        </section>


        {/* Credits Section */}
        <section className="mt-16 w-full text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-10">Credits</h2>
          {ownerInfo ? (
              <div className="flex flex-wrap justify-center gap-8">
                <div className="flex flex-col items-center">
                  <Image 
                    src={ownerInfo.imageUrl}
                    alt={ownerInfo.name}
                    width={120}
                    height={120}
                    className="rounded-full object-cover border-4 border-white shadow-lg"
                    data-ai-hint="man portrait"
                  />
                  <h3 className="mt-3 text-lg font-semibold text-indigo-600">{ownerInfo.name}</h3>
                  <p className="text-gray-600 text-sm">Founder & Engineer</p>
                </div>
              </div>
          ) : <Skeleton className="h-40 w-full" />}
        </section>

        {/* About Owner Section */}
        <section className="mt-16 w-full text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">About the Owner</h2>
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <p className="text-gray-600 leading-relaxed text-lg">
              Hi, I'm <span className="font-semibold text-indigo-600">{ownerInfo?.name || 'Aman Yadav'}</span>, the founder and engineer behind Sutradhaar.
              My vision with this project is to create a simple yet powerful productivity tool that helps people save time,
              focus on their work, and achieve more with ease.
            </p>
          </div>
        </section>

        <section className="mt-16 w-full">
            <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
                Learn More
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/updates">
                    <motion.div 
                        className="bg-white shadow-lg rounded-2xl p-6 h-40 flex flex-col items-center justify-center hover:shadow-xl transition text-center group"
                        whileHover={{ y: -5 }}
                    >
                        <div className="text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                            <FileClock className="w-10 h-10" />
                        </div>
                        <p className="text-lg font-semibold text-gray-800">Updates</p>
                        <p className="text-sm text-muted-foreground">See the latest features.</p>
                    </motion.div>
                </Link>
                <Link href="/how-to-use">
                    <motion.div 
                        className="bg-white shadow-lg rounded-2xl p-6 h-40 flex flex-col items-center justify-center hover:shadow-xl transition text-center group"
                        whileHover={{ y: -5 }}
                    >
                        <div className="text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                            <Info className="w-10 h-10" />
                        </div>
                        <p className="text-lg font-semibold text-gray-800">How to Use</p>
                        <p className="text-sm text-muted-foreground">Learn about the app.</p>
                    </motion.div>
                </Link>
            </div>
        </section>

        {/* Legal Section */}
         <section className="mt-16 w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Legal</h2>
            <div className="grid grid-cols-3 gap-4">
              {legalLinks.map(link => (
                <Link href={link.href} key={link.title}>
                   <motion.div 
                        className="bg-white shadow-lg rounded-2xl p-4 h-24 flex flex-col items-center justify-center hover:shadow-xl transition text-center group"
                        whileHover={{ scale: 1.05 }}
                    >
                      <div className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform">{link.icon}</div>
                      <p className="text-sm font-semibold text-gray-700">{link.title}</p>
                   </motion.div>
                </Link>
              ))}
            </div>
        </section>

        {/* Support Section */}
        <section className="mt-16 w-full">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Support</h2>
            <div className="grid grid-cols-3 gap-4">
               {supportLinks.map(link => (
                <a href={link.href} key={link.title} target="_blank" rel="noopener noreferrer">
                   <motion.div 
                        className="bg-white shadow-lg rounded-2xl p-4 h-24 flex flex-col items-center justify-center hover:shadow-xl transition text-center group"
                        whileHover={{ scale: 1.05 }}
                    >
                       <div className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform">{link.icon}</div>
                      <p className="text-sm font-semibold text-gray-700">{link.title}</p>
                   </motion.div>
                </a>
              ))}
            </div>
        </section>
      </div>
    </motion.div>
  );
}

    