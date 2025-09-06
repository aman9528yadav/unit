
"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart, Calendar, Lightbulb, Code, Sparkles, Globe, Wrench, Rocket, FileText, Shield, LifeBuoy, Flag } from "lucide-react";
import { useRouter } from "next/navigation";

export function About() {
  const router = useRouter();
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 flex flex-col items-center px-6 py-12 w-full">
      <div className="w-full max-w-lg mx-auto">
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
        </section>

        {/* App Info Section */}
        <section className="mt-12 grid md:grid-cols-2 gap-8 w-full">
          <div className="bg-white shadow-lg rounded-2xl p-4 hover:shadow-xl transition">
            <h2 className="text-2xl font-bold text-indigo-600 mb-4">App Information</h2>
            <ul className="text-gray-600 leading-relaxed space-y-2">
              <li><strong>Version:</strong> Beta 1.0.0</li>
              <li><strong>Build:</strong> 2025.09.01</li>
              <li><strong>Release Channel:</strong> Beta</li>
              <li><strong>License:</strong> MIT</li>
            </ul>
          </div>

          <div className="bg-white shadow-lg rounded-2xl p-4 hover:shadow-xl transition">
            <h2 className="text-2xl font-bold text-indigo-600 mb-4">Release Plan</h2>
            <ul className="text-gray-600 leading-relaxed space-y-2">
              <li>📝 <strong>Planning:</strong> 12 May 2025</li>
              <li>🧪 <strong>Beta Test 1:</strong> 29 Dec 2025</li>
              <li>🧪 <strong>Beta Test 2:</strong> 1 July 2026</li>
              <li>🧪- <strong>Beta Test 3:</strong> 12 Oct 2027</li>
              <li>🚀 <strong>Final Release:</strong> 15 Aug 2028</li>
            </ul>
          </div>
        </section>

        {/* Roadmap Section */}
        <section className="mt-16 w-full">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
            Feature & Roadmap
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {features.map((step, idx) => (
              <div
                key={idx}
                className="relative bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition group border-t-2 border-indigo-400"
              >
                <div className="text-3xl mb-2">{step.icon}</div>
                <h3 className="text-md font-bold text-indigo-600 mb-1 group-hover:text-purple-600">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Credits Section */}
        <section className="mt-16 w-full text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-10">Credits</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex flex-col items-center">
              <h3 className="mt-3 text-lg font-semibold text-indigo-600">Aman Yadav</h3>
              <p className="text-gray-600 text-sm">Founder & Engineer</p>
            </div>
          </div>
        </section>

        {/* About Owner Section */}
        <section className="mt-16 w-full text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">About the Owner</h2>
          <div className="bg-white rounded-2xl shadow-lg p-4">
            <p className="text-gray-600 leading-relaxed text-lg">
              Hi, I'm <span className="font-semibold text-indigo-600">Aman Yadav</span>, the founder and engineer behind Sutradhaar.
              My vision with this project is to create a simple yet powerful productivity tool that helps people save time,
              focus on their work, and achieve more with ease.
            </p>
          </div>
        </section>

        {/* Legal Section */}
         <section className="mt-16 w-full">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Legal</h2>
            <div className="grid grid-cols-3 gap-4">
              {legalLinks.map(link => (
                <Link href={link.href} key={link.title}>
                   <div className="bg-white shadow-lg rounded-2xl p-4 h-24 flex flex-col items-center justify-center hover:shadow-xl transition text-center group">
                      <div className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform">{link.icon}</div>
                      <p className="text-sm font-semibold text-gray-700">{link.title}</p>
                   </div>
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
                   <div className="bg-white shadow-lg rounded-2xl p-4 h-24 flex flex-col items-center justify-center hover:shadow-xl transition text-center group">
                       <div className="text-indigo-500 mb-2 group-hover:scale-110 transition-transform">{link.icon}</div>
                      <p className="text-sm font-semibold text-gray-700">{link.title}</p>
                   </div>
                </a>
              ))}
            </div>
        </section>
      </div>
    </div>
  );
}
