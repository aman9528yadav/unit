
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Camera, Eye, EyeOff, Calendar as CalendarIcon, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

export function ProfileEditForm() {
  const [profile, setProfile] = useState({ fullName: '', email: '', profileImage: '', dob: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const storedProfile = localStorage.getItem("userProfile");
    if (storedProfile) {
      setProfile(JSON.parse(storedProfile));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setProfile(prev => ({ ...prev, dob: format(date, 'yyyy-MM-dd') }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (!profile.fullName) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, {
          displayName: profile.fullName,
          photoURL: profile.profileImage,
        });

        // We also need to update the dob in our local storage profile
        const storedProfile = localStorage.getItem("userProfile");
        const existingProfile = storedProfile ? JSON.parse(storedProfile) : {};
        const updatedProfile = { ...existingProfile, ...profile };

        localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
        
        toast({ title: "Profile Updated", description: "Your personal information has been updated." });
        router.push("/profile/success");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: "Could not update your profile.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: "Please fill all password fields", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
        toast({ title: "Password Too Short", description: "New password must be at least 6 characters.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    const user = auth.currentUser;
    if (user && user.email) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        toast({ title: "Password Changed", description: "Your password has been updated successfully." });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (error: any) {
        console.error("Password change error:", error);
        let title = "Password Change Failed";
        let description = "An error occurred. Please try again.";
        if (error.code === 'auth/wrong-password') {
            title = "Incorrect Password";
            description = "The current password you entered is incorrect.";
        }
        toast({ title, description, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    }
  };


  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 p-4 sm:p-6">
      <header className="flex items-center gap-4">
        <Link href="/profile">
          <Button variant="ghost" size="icon">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">Edit Profile</h1>
      </header>

      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Image
            src={profile.profileImage || "https://picsum.photos/200"}
            alt="Profile"
            width={128}
            height={128}
            className="rounded-full w-32 h-32 object-cover border-4 border-card"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />
          <Button
            size="icon"
            className="absolute bottom-1 right-1 rounded-full w-10 h-10"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User /> Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" value={profile.fullName} onChange={handleInputChange} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile.email} disabled />
          </div>
          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {profile.dob ? format(new Date(profile.dob), "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={profile.dob ? new Date(profile.dob) : undefined}
                  onSelect={handleDateChange}
                  captionLayout="dropdown-buttons"
                  fromYear={1920}
                  toYear={new Date().getFullYear()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
           <Button onClick={handleSaveChanges} className="w-full" disabled={isSubmitting}>
             {isSubmitting ? "Saving..." : "Save Personal Info"}
           </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock /> Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input id="currentPassword" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <Button variant="ghost" size="icon" className="absolute right-1 top-6" onClick={() => setShowCurrentPassword(!showCurrentPassword)}><IconEye show={showCurrentPassword} /></Button>
          </div>
          <div className="relative">
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
             <Button variant="ghost" size="icon" className="absolute right-1 top-6" onClick={() => setShowNewPassword(!showNewPassword)}><IconEye show={showNewPassword} /></Button>
          </div>
          <div className="relative">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
             <Button variant="ghost" size="icon" className="absolute right-1 top-6" onClick={() => setShowConfirmPassword(!showConfirmPassword)}><IconEye show={showConfirmPassword} /></Button>
          </div>
           <Button onClick={handleChangePassword} variant="secondary" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
      
    </div>
  );
}


function IconEye({ show }: {show: boolean}) {
  return show ? <EyeOff /> : <Eye />;
}
