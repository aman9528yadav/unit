
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Note } from './notepad';
import Image from 'next/image';
import { useLanguage } from '@/context/language-context';
import { listenToUserNotes } from '@/services/firestore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface UserProfile {
    fullName: string;
    email: string;
    [key: string]: any;
}


export function NoteViewer({ noteId }: { noteId: string }) {
    const [note, setNote] = useState<Note | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useLanguage();

    useEffect(() => {
        const storedProfile = localStorage.getItem('userProfile');
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
        } else {
            router.push('/notes');
        }
    }, [router]);

    useEffect(() => {
        if (!profile) return;
        
        const unsubscribe = listenToUserNotes(profile.email, (notesFromDb) => {
            const noteToView = notesFromDb.find(n => n.id === noteId);
            if (noteToView) {
                setNote(noteToView);
            } else {
                toast({ title: t('noteEditor.toast.notFound'), variant: "destructive" });
                router.push('/notes');
            }
        });
        
        return () => unsubscribe();

    }, [noteId, router, toast, profile, t]);

    const renderAttachment = () => {
        if (!note?.attachment) return null;

        const parts = note.attachment.split('|');
        const fileName = parts.length > 1 ? parts[0] : 'attachment';
        const dataUri = parts.length > 1 ? parts[1] : note.attachment;

        const isImage = dataUri.startsWith('data:image/');

        if (isImage) {
            return (
                <div className="relative w-full h-64 my-4 rounded-lg overflow-hidden">
                    <Image src={dataUri} alt={t('notepad.attachmentAlt')} layout="fill" objectFit="contain" />
                </div>
            )
        }

        return (
            <div className="p-4 border rounded-lg my-4 bg-secondary">
                <a href={dataUri} download={fileName} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                    <File className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate font-medium">{fileName}</span>
                </a>
            </div>
        )
    }

    if (!note) {
        // You can return a skeleton loader here
        return null;
    }

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
            <header className="flex items-center justify-between sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/notes')}>
                    <ArrowLeft />
                </Button>
                <div className="flex items-center gap-2">
                     <Button asChild>
                        <Link href={`/notes/edit/${note.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                </div>
            </header>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold break-words">{note.title || t('notepad.untitled')}</CardTitle>
                    {note.category && (
                        <div className="flex gap-2 pt-2">
                             <Badge variant="secondary">{note.category}</Badge>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {renderAttachment()}
                    <div 
                        className="prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: note.content }}
                    />
                </CardContent>
            </Card>

        </div>
    );
}
