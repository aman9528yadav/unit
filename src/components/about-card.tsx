
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, ExternalLink } from "lucide-react";
import Link from 'next/link';
import { useEffect, useState } from "react";
import { listenToAboutInfoFromRtdb, type AppInfo } from "@/services/firestore";
import { Skeleton } from "./ui/skeleton";

const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="text-sm text-right text-foreground font-medium">{value}</div>
    </div>
);

export function AboutCard() {
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);

    useEffect(() => {
        const unsubscribe = listenToAboutInfoFromRtdb((data) => {
            if (data?.appInfo) {
                setAppInfo(data.appInfo);
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <Card className="bg-card border-border shadow-sm">
            <CardHeader>
                <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="divide-y divide-border">
                    <DetailRow
                        label="App"
                        value={<span>Sutradhaar • Unit Converter</span>}
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
                                    <a href="mailto:amanyadavyadav9458@gmail.com">
                                        <Mail className="mr-2 h-3 w-3"/> Email
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
        </Card>
    );
}
