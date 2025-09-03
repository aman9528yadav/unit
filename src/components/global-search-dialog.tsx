
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, StickyNote, History, HelpCircle, Settings, X, CornerDownLeft } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Note, NOTES_STORAGE_KEY_BASE } from './notepad';
import { FAQ, FAQ_STORAGE_KEY } from './help';

interface SearchResult {
  type: 'Note' | 'History' | 'Help' | 'Setting';
  title: string;
  description?: string;
  id: string;
  href: string;
}

const SETTINGS_PAGES: Omit<SearchResult, 'id'>[] = [
  { type: 'Setting', title: 'General Settings', description: 'Edit profile, notifications, language, theme.', href: '/settings' },
  { type: 'Setting', title: 'Custom Units', description: 'Manage custom units and categories.', href: '/settings/custom-units' },
  { type: 'Setting', title: 'Theme Editor', description: 'Customize the application theme colors.', href: '/settings/theme' },
  { type: 'Setting', title: 'Developer Panel', description: 'Access tools for debugging and testing.', href: '/dev' },
];

const getUserNotesKey = (email: string | null) => email ? `${email}_${NOTES_STORAGE_KEY_BASE}` : `guest_${NOTES_STORAGE_KEY_BASE}`;

export function GlobalSearchDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [profile, setProfile] = useState<{ email: string } | null>(null);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
  }, [isOpen]);

  const search = useCallback(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    const lowerQuery = debouncedQuery.toLowerCase();
    const allResults: SearchResult[] = [];

    // Search Notes
    const notesKey = getUserNotesKey(profile?.email || null);
    const notesData = localStorage.getItem(notesKey);
    if (notesData) {
      const notes: Note[] = JSON.parse(notesData);
      notes
        .filter(n => !n.deletedAt && (n.title.toLowerCase().includes(lowerQuery) || n.content.toLowerCase().includes(lowerQuery)))
        .forEach(n => allResults.push({
          type: 'Note',
          title: n.title || 'Untitled Note',
          description: n.content.replace(/<[^>]*>?/gm, '').substring(0, 100),
          id: n.id,
          href: `/notes/edit/${n.id}`,
        }));
    }

    // Search History
    const historyData = localStorage.getItem('conversionHistory');
    if (historyData) {
      const history: string[] = JSON.parse(historyData);
      history
        .filter(h => h.toLowerCase().includes(lowerQuery))
        .forEach(h => allResults.push({
          type: 'History',
          title: h,
          id: h,
          href: `/converter`, // Restore action will be handled on page load
        }));
    }

    // Search Help/FAQs
    const faqData = localStorage.getItem(FAQ_STORAGE_KEY);
    if (faqData) {
      const faqs: FAQ[] = JSON.parse(faqData);
      faqs
        .filter(f => f.question.toLowerCase().includes(lowerQuery) || f.answer.toLowerCase().includes(lowerQuery))
        .forEach(f => allResults.push({
          type: 'Help',
          title: f.question,
          description: f.answer.replace(/<[^>]*>?/gm, '').substring(0, 100),
          id: f.id,
          href: '/help',
        }));
    }

    // Search Settings
    SETTINGS_PAGES
      .filter(p => p.title.toLowerCase().includes(lowerQuery) || p.description?.toLowerCase().includes(lowerQuery))
      .forEach(p => allResults.push({ ...p, id: p.href }));

    setResults(allResults);
  }, [debouncedQuery, profile]);

  useEffect(() => {
    search();
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const handleSelectResult = (result: SearchResult) => {
    if (result.type === 'History') {
        localStorage.setItem('restoreConversion', result.id);
    }
    router.push(result.href);
    setIsOpen(false);
    setQuery('');
  }

  const ResultIcon = ({ type }: { type: SearchResult['type'] }) => {
    switch (type) {
      case 'Note': return <StickyNote className="w-5 h-5 text-yellow-500" />;
      case 'History': return <History className="w-5 h-5 text-blue-500" />;
      case 'Help': return <HelpCircle className="w-5 h-5 text-green-500" />;
      case 'Setting': return <Settings className="w-5 h-5 text-gray-500" />;
      default: return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Search />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl p-0 gap-0">
        <DialogHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
                <Search className="text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search notes, history, help, settings..."
                    className="w-full bg-transparent border-none focus:ring-0 h-auto p-0 text-base"
                    autoFocus
                />
                 <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </DialogHeader>
        <div className="p-4 max-h-[400px] overflow-y-auto">
            {debouncedQuery && results.length > 0 ? (
                <ul className="space-y-2">
                    {results.map((result) => (
                        <li 
                          key={`${result.type}-${result.id}`} 
                          className="flex items-center gap-4 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                          onClick={() => handleSelectResult(result)}
                        >
                            <ResultIcon type={result.type} />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-semibold truncate">{result.title}</p>
                                {result.description && <p className="text-sm text-muted-foreground truncate">{result.description}</p>}
                            </div>
                            <CornerDownLeft className="w-4 h-4 text-muted-foreground" />
                        </li>
                    ))}
                </ul>
            ) : debouncedQuery ? (
                <p className="text-center text-muted-foreground py-8">No results found for "{debouncedQuery}".</p>
            ) : (
                <p className="text-center text-muted-foreground py-8">Search for anything in your app.</p>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
