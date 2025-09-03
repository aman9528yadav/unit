
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { FAQ, FAQ_STORAGE_KEY, defaultFaqs } from '../help';


export function HelpEditor() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const { toast } = useToast();
    
    useEffect(() => {
        setIsClient(true);
        loadFaqs();
    }, []);

    const loadFaqs = () => {
        const storedFaqs = localStorage.getItem(FAQ_STORAGE_KEY);
        if (storedFaqs) {
            setFaqs(JSON.parse(storedFaqs));
        } else {
            setFaqs(defaultFaqs);
        }
    };
    
    const updateStoredFaqs = (updatedFaqs: FAQ[]) => {
        setFaqs(updatedFaqs);
        localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(updatedFaqs));
        window.dispatchEvent(new StorageEvent('storage', { key: FAQ_STORAGE_KEY, newValue: JSON.stringify(updatedFaqs) }));
    };

    const handleOpenDialog = (faq: FAQ | null = null) => {
        setEditingFaq(faq);
        if (faq) {
            setQuestion(faq.question);
            setAnswer(faq.answer);
        } else {
            setQuestion('');
            setAnswer('');
        }
        setIsDialogOpen(true);
    };
    
    const handleSave = () => {
        if (!question || !answer) {
            toast({ title: "Incomplete Information", description: "Please fill out both question and answer.", variant: "destructive" });
            return;
        }

        if (editingFaq) {
            // Update existing FAQ
            const updatedFaqs = faqs.map(f => f.id === editingFaq.id ? { ...f, question, answer } : f);
            updateStoredFaqs(updatedFaqs);
            toast({ title: "FAQ Updated!", description: "The FAQ item has been successfully updated." });
        } else {
            // Add new FAQ
            const newFaq: FAQ = { id: uuidv4(), question, answer };
            const updatedFaqs = [...faqs, newFaq];
            updateStoredFaqs(updatedFaqs);
            toast({ title: "FAQ Added!", description: "The new FAQ item has been added." });
        }

        setIsDialogOpen(false);
    };

    const handleDelete = (faqId: string) => {
        if (window.confirm("Are you sure you want to delete this FAQ item?")) {
            const updatedFaqs = faqs.filter(f => f.id !== faqId);
            updateStoredFaqs(updatedFaqs);
            toast({ title: "FAQ Deleted", description: "The FAQ item has been removed." });
        }
    };

    if (!isClient) {
        return null;
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6 h-screen">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dev">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold">Manage Help Content</h1>
                </div>
                 <Button size="icon" onClick={() => handleOpenDialog()}>
                    <Plus />
                </Button>
            </header>

            <div className="flex-grow space-y-2">
                {faqs.map((faq) => (
                    <div key={faq.id} className="bg-card p-4 rounded-lg flex justify-between items-center">
                        <div className="flex-1 overflow-hidden">
                            <p className="font-bold truncate">{faq.question}</p>
                            <div className="text-sm text-muted-foreground line-clamp-1" dangerouslySetInnerHTML={{ __html: faq.answer }}/>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(faq)}>
                                <Edit className="text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(faq.id)}>
                                <Trash2 className="text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}
                {faqs.length === 0 && (
                    <div className="text-center text-muted-foreground mt-8 flex flex-col items-center gap-4 bg-card p-6 rounded-lg">
                        <p>No FAQ items found.</p>
                        <p>Click the '+' button to add one.</p>
                    </div>
                )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
                        <DialogDescription>
                            {editingFaq ? 'Update the question and answer for this FAQ item.' : 'Create a new question and answer for the help page.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="question" className="text-right">Question</Label>
                            <Input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="answer" className="text-right mt-2">Answer</Label>
                            <Textarea id="answer" value={answer} onChange={(e) => setAnswer(e.target.value)} className="col-span-3" rows={8} placeholder="You can use HTML tags like <p>, <ul>, <li>, <strong> etc."/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
