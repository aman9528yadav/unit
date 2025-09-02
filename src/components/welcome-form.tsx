
"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

const defaultProfile = {
    fullName: "Madison Smith",
    nickname: "Madison",
    email: "madisons@example.com",
    mobile: "+123 567 89000",
    profileImage: "https://picsum.photos/200",
};

export function WelcomeForm() {
  const [profile, setProfile] = useState(defaultProfile);
  const [imagePreview, setImagePreview] = useState<string>(profile.profileImage);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfile(prev => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setProfile(prev => ({ ...prev, profileImage: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStart = () => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    toast({
      title: "Profile Created!",
      description: "Welcome to UniConvert.",
    });
    router.push("/profile/success");
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-8 p-4 sm:p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Fill Your Profile</h1>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
          This data is only stored on your device and is not collected by us.
        </p>
      </div>
      
      <div className="bg-primary/20 py-8 rounded-2xl flex flex-col items-center relative">
         <div className="relative w-28 h-28">
            <Image
              src={imagePreview}
              alt={profile.fullName}
              width={112}
              height={112}
              className="rounded-full border-4 border-white object-cover w-28 h-28"
              data-ai-hint="profile picture"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-0 right-0 rounded-full w-8 h-8 bg-accent border-accent hover:bg-accent/90"
              onClick={() => fileInputRef.current?.click()}
            >
              <Pencil className="w-4 h-4 text-accent-foreground" />
            </Button>
          </div>
      </div>

      <div className="flex-grow w-full">
        <form className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="text-muted-foreground">Full name</Label>
            <Input id="fullName" value={profile.fullName} onChange={handleChange} className="bg-secondary mt-1 h-12 rounded-lg border-none" />
          </div>
          <div>
            <Label htmlFor="nickname" className="text-muted-foreground">Nickname</Label>
            <Input id="nickname" value={profile.nickname} onChange={handleChange} className="bg-secondary mt-1 h-12 rounded-lg border-none" />
          </div>
          <div>
            <Label htmlFor="email" className="text-muted-foreground">Email</Label>
            <Input id="email" type="email" value={profile.email} onChange={handleChange} className="bg-secondary mt-1 h-12 rounded-lg border-none" />
          </div>
          <div>
            <Label htmlFor="mobile" className="text-muted-foreground">Mobile Number</Label>

            <Input id="mobile" value={profile.mobile} onChange={handleChange} className="bg-secondary mt-1 h-12 rounded-lg border-none" />
          </div>
          <div className="pt-4">
            <Button
              type="button"
              onClick={handleStart}
              className="w-full h-14 bg-accent text-accent-foreground font-bold text-lg rounded-full hover:bg-accent/90"
            >
              Continue
            </Button>
          </div>
        </form>
         <p className="text-center text-sm text-muted-foreground mt-4">
            Or, sign up with a provider:
        </p>
         <div className="pt-4">
            <Button asChild  className="w-full h-12 bg-card text-card-foreground font-bold text-base rounded-lg hover:bg-card/90 border flex items-center justify-center gap-2">
             <Link href="/signup">
                <Image src="/google-logo.svg" alt="Google" width={24} height={24} />
                Sign up with Google
             </Link>
            </Button>
          </div>
      </div>
    </div>
  );
}
