
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Pencil, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { getStreakData, StreakData } from "@/lib/streak";


const defaultProfile = {
    fullName: "Aman Yadav",
    email: "aman@example.com",
    birthday: "April 1st",
    mobile: "+123 567 89000",
    dob: "1990-04-01",
    weight: "75 Kg",
    height: "1.65 CM",
    profileImage: "https://picsum.photos/200",
};

interface UserProfile extends ReturnType<typeof defaultProfile> {}


export function ProfileEditForm() {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [dob, setDob] = useState<Date | undefined>(new Date(defaultProfile.dob));
  const [imagePreview, setImagePreview] = useState<string>(defaultProfile.profileImage);
  const [streakData, setStreakData] = useState<StreakData>({ bestStreak: 0, currentStreak: 0, daysNotOpened: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfile(parsedProfile);
        if (parsedProfile.dob && !isNaN(new Date(parsedProfile.dob).getTime())) {
          setDob(new Date(parsedProfile.dob));
        }
        if(parsedProfile.profileImage) {
            setImagePreview(parsedProfile.profileImage);
        }
        setStreakData(getStreakData(parsedProfile.email));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfile(prev => ({ ...prev, [id]: value }));
  };
  
  const handleDateChange = (date: Date | undefined) => {
    setDob(date);
    if(date) {
      setProfile(prev => ({ ...prev, dob: format(date, "yyyy-MM-dd"), birthday: format(date, "MMMM do") }));
    }
  }

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

  const handleUpdate = () => {
    localStorage.setItem("userProfile", JSON.stringify(profile));
    toast({
      title: "Profile Updated",
      description: "Your changes have been saved successfully.",
    });
    router.push("/profile/success");
  };

  return (
    <div className="w-full max-w-md mx-auto text-foreground flex flex-col">
      <div className="bg-primary/80 text-primary-foreground pb-8 rounded-b-3xl">
        <header className="p-4 flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="hover:bg-white/20">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </header>

        <div className="flex flex-col items-center text-center gap-2 mt-2">
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
          <h2 className="text-2xl font-bold mt-2">{profile.fullName}</h2>
          <p className="text-sm">{profile.email}</p>
          <p className="text-sm">Birthday: {profile.birthday}</p>
        </div>
      </div>

      <div className="bg-card text-card-foreground p-4 rounded-xl -mt-6 mx-4 shadow-lg flex justify-around text-center">
        <div>
          <p className="text-lg font-bold">{streakData.bestStreak} Days</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </div>
        <div className="border-l border-border"></div>
        <div>
          <p className="text-lg font-bold">{streakData.currentStreak} Days</p>
          <p className="text-xs text-muted-foreground">Current Streak</p>
        </div>
        <div className="border-l border-border"></div>
        <div>
          <p className="text-lg font-bold">{streakData.daysNotOpened} Days</p>
          <p className="text-xs text-muted-foreground">Not Open</p>
        </div>
      </div>

      <div className="mt-6 px-4 flex-grow w-full">
        <form className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="text-muted-foreground">Full name</Label>
            <Input id="fullName" value={profile.fullName} onChange={handleChange} className="bg-secondary mt-1 h-12 rounded-lg" />
          </div>
          <div>
            <Label htmlFor="email" className="text-muted-foreground">Email</Label>
            <Input id="email" type="email" value={profile.email} className="bg-secondary mt-1 h-12 rounded-lg" readOnly/>
          </div>
          <div>
            <Label htmlFor="mobile" className="text-muted-foreground">Mobile Number</Label>
            <Input id="mobile" value={profile.mobile} onChange={handleChange} className="bg-secondary mt-1 h-12 rounded-lg" />
          </div>
          <div>
            <Label htmlFor="dob" className="text-muted-foreground">Date of birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal bg-secondary mt-1 h-12 rounded-lg",
                    !dob && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dob ? format(dob, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dob}
                  onSelect={handleDateChange}
                  initialFocus
                  captionLayout="dropdown-buttons"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label htmlFor="weight" className="text-muted-foreground">Weight</Label>
            <Input id="weight" value={profile.weight} onChange={handleChange} className="bg-secondary mt-1 h-12 rounded-lg" />
          </div>
          <div>
            <Label htmlFor="height" className="text-muted-foreground">Height</Label>
            <Input id="height" value={profile.height} onChange={handleChange} className="bg-secondary mt-1 h-12 rounded-lg" />
          </div>
          <Button
            type="button"
            onClick={handleUpdate}
            className="w-full h-12 bg-accent text-accent-foreground font-bold text-base rounded-lg hover:bg-accent/90 mt-6"
          >
            Update Profile
          </Button>
        </form>
      </div>
    </div>
  );
}
