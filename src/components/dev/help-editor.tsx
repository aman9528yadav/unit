
"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Edit, Save } from 'lucide-react';
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
import type { FAQ } from '../help';
import { useRouter } from 'next/navigation';
import { setFaqsInRtdb, listenToFaqsFromRtdb } from '@/services/firestore';


export function HelpEditor() {
    const [faqs, setFaqs] = useState<FAQ[] | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
    
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const { toast } = useToast();
    const router = useRouter();
    
    useEffect(() => {
        setIsClient(true);
        const unsubscribe = listenToFaqsFromRtdb((faqsFromDb) => {
            setFaqs(faqsFromDb);
        });
        return () => unsubscribe();
    }, []);

    const handleSaveAll = async () => {
        if (!faqs) return;
        try {
            await setFaqsInRtdb(faqs);
            toast({ title: "FAQs Saved!", description: "All changes have been saved to the database." });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Failed to save FAQs.", variant: "destructive" });
        }
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
    
    const handleSaveItem = async () => {
        if (!question || !answer || !faqs) {
            toast({ title: "Incomplete Information", description: "Please fill out both question and answer.", variant: "destructive" });
            return;
        }

        let updatedFaqs;
        if (editingFaq) {
            updatedFaqs = faqs.map(f => f.id === editingFaq.id ? { ...f, question, answer } : f);
        } else {
            const newFaq: FAQ = { id: uuidv4(), question, answer };
            updatedFaqs = [...faqs, newFaq];
        }
        
        try {
            await setFaqsInRtdb(updatedFaqs);
            // The listener will update the local state automatically
            toast({ title: "Success", description: `FAQ item ${editingFaq ? 'updated' : 'added'}.`});
            setIsDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast({ title: "Save Failed", description: "Could not save the FAQ item to the database.", variant: "destructive" });
        }
    };

    const handleDelete = (faqId: string) => {
        if (!faqs) return;
        if (window.confirm("Are you sure you want to delete this FAQ item?")) {
            const updatedFaqs = faqs.filter(f => f.id !== faqId);
            setFaqsInRtdb(updatedFaqs);
            toast({ title: "FAQ Deleted", description: "The FAQ item has been removed." });
        }
    };

    if (!isClient || faqs === null) {
        return null;
    }

    return (
        <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6 h-screen">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft />
                    </Button>
                    <h1 className="text-xl font-bold">Manage Help Content</h1>
                </div>
                 <div className='flex gap-2'>
                    <Button size="icon" onClick={() => handleOpenDialog()}>
                        <Plus />
                    </Button>
                     <Button size="icon" variant="secondary" onClick={handleSaveAll}>
                        <Save />
                    </Button>
                 </div>
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
                        <Button type="submit" onClick={handleSaveItem}>{editingFaq ? 'Update Item' : 'Add Item'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

    