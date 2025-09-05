
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


const defaultAvatars = [
    { src: "https://picsum.photos/seed/avatar1/200", hint: "man portrait" },
    { src: "https://picsum.photos/seed/avatar2/200", hint: "woman portrait" },
    { src: "https://picsum.photos/seed/avatar3/200", hint: "man smiling" },
    { src: "https://picsum.photos/seed/avatar4/200", hint: "woman smiling" },
    { src: "https://picsum.photos/seed/avatar5/200", hint: "abstract design" },
];


interface ProfilePhotoEditorProps {
    currentImage: string;
    onSave: (newImage: string | null) => void;
    onClose: () => void;
}

export function ProfilePhotoEditor({ currentImage, onSave, onClose }: ProfilePhotoEditorProps) {
    const [image, setImage] = useState<string | null>(currentImage);
    const [zoom, setZoom] = useState(1);
    const [mode, setMode] = useState<"edit" | "camera">("edit");
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
    
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

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
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    }, [toast]);

    useEffect(() => {
        if (mode === "camera") {
            getCameraPermission();
        }
    }, [mode, getCameraPermission]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
             if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const capture = () => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setImage(imageSrc);
            setMode("edit");
        }
    };

    const handleSave = () => {
        onSave(image);
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-card rounded-2xl shadow-lg border p-6">
            <header className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Change Profile Photo</h2>
                <Button variant="ghost" size="icon" onClick={onClose}><X /></Button>
            </header>

            {mode === "edit" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-48 h-48 rounded-full overflow-hidden flex items-center justify-center bg-muted">
                           <Avatar className="w-full h-full">
                                <AvatarImage src={image ?? undefined} alt="Profile Preview" style={{ transform: `scale(${zoom})` }} />
                                <AvatarFallback className="text-6xl"><User/></AvatarFallback>
                           </Avatar>
                        </div>
                        <div className="w-full">
                            <Label htmlFor="zoom">Zoom</Label>
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
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                             <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                                <Upload className="mr-2 h-4 w-4"/> Upload
                             </Button>
                             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg, image/png" className="hidden" />
                             <Button variant="outline" className="w-full" onClick={() => setMode("camera")}>
                                <Camera className="mr-2 h-4 w-4"/> Take Photo
                             </Button>
                             <Button variant="outline" className="w-full" onClick={() => setImage(null)}>
                                <Trash2 className="mr-2 h-4 w-4"/> Remove
                             </Button>
                        </div>
                        <div>
                            <p className="text-sm font-medium mb-2">Or choose from defaults</p>
                            <div className="flex gap-2">
                                {defaultAvatars.map(avatar => (
                                     <Avatar key={avatar.src} className="w-12 h-12 cursor-pointer hover:ring-2 ring-primary" onClick={() => setImage(avatar.src)}>
                                        <AvatarImage src={avatar.src} alt="Default avatar" data-ai-hint={avatar.hint} />
                                        <AvatarFallback />
                                    </Avatar>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Supported: JPG, PNG up to 5MB. Your photo is visible across Sutradhaar.
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
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access to use this feature.
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="flex gap-4">
                        <Button onClick={capture} disabled={!hasCameraPermission}>Capture photo</Button>
                        <Button variant="outline" onClick={() => setMode("edit")}>Back to editor</Button>
                    </div>
                </div>
            )}
            
            <footer className="mt-8 pt-6 border-t flex justify-between items-center gap-4">
                <Button variant="ghost" onClick={() => setImage(currentImage)}><RotateCcw className="mr-2 h-4 w-4"/> Reset</Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save</Button>
                </div>
            </footer>
        </div>
    );
}
