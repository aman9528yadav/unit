
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, ExternalLink, ChevronDown } from "lucide-react";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { listenToAboutInfoFromRtdb, type AppInfo } from "@/services/firestore";
import { Skeleton } from "./ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="text-sm text-right text-foreground font-medium">{value}</div>
    </div>
);

export function AboutCard() {
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = listenToAboutInfoFromRtdb((data) => {
            if (data?.appInfo) {
                setAppInfo(data.appInfo);
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <Card className="bg-card shadow-sm border rounded-2xl">
            <CardHeader onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-primary text-base">About</CardTitle>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                        <ChevronDown className="h-5 w-5 text-muted-foreground"/>
                    </motion.div>
                </div>
            </CardHeader>
            <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                >
                    <CardContent className="space-y-4 pt-0">
                        <div className="divide-y divide-border">
                            <DetailRow
                                label="App"
                                value={<span>Sutradhaar · Unit Converter</span>}
                            />
                            <DetailRow
                                label="Version"
                                value={
                                    appInfo ? (
                                        <span>{appInfo.version}</span>
                                    ) : (
                                        <Skeleton className="h-4 w-24" />
                                    )
                                }
                            />
                            <DetailRow
                                label="Developer"
                                value="Aman Yadav"
                            />
                            <DetailRow
                                label="Support"
                                value={
                                    <div className="flex items-center gap-2">
                                        <Button asChild variant="outline" size="sm">
                                            <a href="https://aman9528.wixstudio.com/my-site-3/aman" target="_blank" rel="noopener noreferrer">
                                                <Mail className="mr-2 h-3 w-3"/> Contact
                                            </a>
                                        </Button>
                                        <Button asChild variant="outline" size="sm">
                                            <Link href="/about">
                                                <ExternalLink className="mr-2 h-3 w-3"/> About Us
                                            </Link>
                                        </Button>
                                    </div>
                                }
                            />
                        </div>
                    </CardContent>
                 </motion.div>
            )}
            </AnimatePresence>
        </Card>
    );
}
