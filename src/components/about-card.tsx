
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, ExternalLink } from "lucide-react";
import Link from 'next/link';

const DetailRow = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="text-sm text-right text-foreground font-medium">{value}</div>
    </div>
);

export function AboutCard() {
    return (
        <Card className="bg-card border-border shadow-sm">
            <CardHeader>
                <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="divide-y divide-border">
                    <DetailRow
                        label="App"
                        value={
                            <div className="flex items-center gap-2">
                                <span>Sutradhaar • Unit Converter</span>
                                <Badge variant="outline">v1.0.0</Badge>
                            </div>
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
                                    <a href="mailto:support@sutradhaar.app">
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
