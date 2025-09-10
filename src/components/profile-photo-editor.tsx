
"use client";

import { useState, useEffect, useRef, useCallback }from "react";
import Webcam from "react-webcam";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Slider } from "./ui/slider";
import { Upload, Camera, Trash2, RotateCcw, X, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import { Label } from "./ui/label";
import { useLanguage } from "@/context/language-context";
import { auth } from "@/lib/firebase";
import { updateProfile } from "firebase/auth";
import { updateUserData } from "@/services/firestore";
import { cn } from "@/lib/utils";


const defaultAvatars = [
    { src: "https://picsum.photos/seed/person1/200", hint: "man portrait" },
    { src: "https://picsum.photos/seed/person2/200", hint: "woman portrait" },
    { src: "https://picsum.photos/seed/person3/200", hint: "man smiling" },
];


interface ProfilePhotoEditorProps {
    currentImage: string;
    onSave: (newImage: string | null) => void;
    onClose: () => void;
}

export function ProfilePhotoEditor({ currentImage, onSave, onClose }: ProfilePhotoEditorProps) {
    const [image, setImage] = useState<string | null>(currentImage);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [mode, setMode] = useState<"edit" | "camera">("edit");
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    const { t } = useLanguage();
    
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    // Drag to pan state
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [startOffset, setStartOffset] = useState({ x: 0, y: 0 });
    

    useEffect(() => {
        setImage(currentImage);
    }, [currentImage]);
    
    const getCameraPermission = useCallback(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        // Clean up the stream immediately as we only need to check for permission
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: t('photoEditor.toast.cameraDenied.title'),
          description: t('photoEditor.toast.cameraDenied.description'),
        });
      }
    }, [toast, t]);

    useEffect(() => {
        if (mode === "camera") {
            getCameraPermission();
        }
    }, [mode, getCameraPermission]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
             if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ title: t('photoEditor.toast.fileTooLarge.title'), description: t('photoEditor.toast.fileTooLarge.description'), variant: "destructive" });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setZoom(1);
                setOffset({ x: 0, y: 0 });
            };
            reader.readAsDataURL(file);
        }
    };

    const capture = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImage(imageSrc);
            setZoom(1);
            setOffset({ x: 0, y: 0 });
            setMode("edit");
        }
    };
    
    const handleReset = () => {
        setImage(currentImage);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
    }

    const handleSave = () => {
        if (!image) {
            onSave(null);
            return;
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new window.Image();
        img.src = image;
        img.onload = () => {
            const previewSize = 192; // The size of the preview circle
            canvas.width = previewSize;
            canvas.height = previewSize;

            // Calculate the dimensions and position of the source image to draw
            const sourceWidth = img.width / zoom;
            const sourceHeight = img.height / zoom;
            const sourceX = (img.width - sourceWidth) / 2 - (offset.x * (img.width / previewSize));
            const sourceY = (img.height - sourceHeight) / 2 - (offset.y * (img.height / previewSize));

            // Clear canvas and draw the transformed image
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, previewSize, previewSize);

            // Get the new image data
            const newImageDataUrl = canvas.toDataURL('image/png');
            onSave(newImageDataUrl);
        };
    };

     const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        setIsDragging(true);
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setStartPos({ x: clientX, y: clientY });
        setStartOffset(offset);
    };

    const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - startPos.x;
        const dy = clientY - startPos.y;

        setOffset({
            x: startOffset.x + dx,
            y: startOffset.y + dy,
        });
    }, [isDragging, startPos, startOffset, zoom]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('touchmove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchend', handleDragEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    return (
        <div className="w-full max-w-2xl mx-auto bg-card rounded-2xl shadow-lg border p-6">
            <header className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{t('photoEditor.title')}</h2>
                <Button variant="ghost" size="icon" onClick={onClose}><X /></Button>
            </header>

            {mode === "edit" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className={cn("w-48 h-48 rounded-full overflow-hidden flex items-center justify-center bg-muted", isDragging ? "cursor-grabbing" : "cursor-grab")}
                            onMouseDown={handleDragStart}
                            onTouchStart={handleDragStart}
                        >
                           <Avatar className="w-full h-full pointer-events-none">
                                <AvatarImage src={image ?? undefined} alt={t('photoEditor.previewAlt')} style={{ transform: `scale(${zoom}) translateX(${offset.x}px) translateY(${offset.y}px)` }} />
                                <AvatarFallback className="text-6xl"><User/></AvatarFallback>
                           </Avatar>
                        </div>
                        <div className="w-full space-y-4">
                            <div>
                                <Label htmlFor="zoom">{t('photoEditor.zoom')}</Label>
                                <Slider
                                    id="zoom"
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    value={[zoom]}
                                    onValueChange={(value) => setZoom(value[0])}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                             <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="h-4 w-4"/>
                             </Button>
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg, image/png" className="hidden" />
                             <Button variant="outline" size="icon" onClick={() => setMode("camera")}>
                                <Camera className="h-4 w-4"/>
                             </Button>
                             <Button variant="outline" size="icon" onClick={() => setImage(null)}>
                                <Trash2 className="h-4 w-4"/>
                             </Button>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-2">{t('photoEditor.defaults')}</p>
                            <div className="flex gap-2">
                                {defaultAvatars.map(avatar => (
                                     <Avatar key={avatar.src} className="w-12 h-12 cursor-pointer hover:ring-2 ring-primary" onClick={() => setImage(avatar.src)}>
                                        <AvatarImage src={avatar.src} alt={t('photoEditor.defaultAlt')} data-ai-hint={avatar.hint} />
                                        <AvatarFallback />
                                    </Avatar>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t('photoEditor.supportInfo')}
                        </p>
                    </div>
                </div>
            ) : ( // Camera Mode
                <div className="flex flex-col items-center gap-4">
                     <div className="w-full aspect-video rounded-md overflow-hidden bg-muted">
                        <Webcam
                            audio={false}
                            ref={webcamRef}
                            screenshotFormat="image/jpeg"
                            className="w-full h-full object-cover"
                            videoConstraints={{ facingMode: "user" }}
                        />
                    </div>
                    {hasCameraPermission === false && (
                         <Alert variant="destructive">
                            <AlertTitle>{t('photoEditor.cameraAlert.title')}</AlertTitle>
                            <AlertDescription>
                                {t('photoEditor.cameraAlert.description')}
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="flex gap-4">
                        <Button onClick={capture} disabled={!hasCameraPermission}>{t('photoEditor.capture')}</Button>
                        <Button variant="outline" onClick={() => setMode("edit")}>{t('photoEditor.back')}</Button>
                    </div>
                </div>
            )}
            
            <footer className="mt-8 pt-6 border-t flex justify-between items-center gap-4">
                <Button variant="ghost" onClick={handleReset}><RotateCcw className="mr-2 h-4 w-4"/> {t('photoEditor.reset')}</Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>{t('photoEditor.cancel')}</Button>
                    <Button onClick={handleSave}>{t('photoEditor.save')}</Button>
                </div>
            </footer>
        </div>
    );
}
