
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Eye, EyeOff, Calendar as CalendarIcon, User, Lock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { ProfilePhotoEditor } from "./profile-photo-editor";


export function ProfileEditForm() {
  const [profile, setProfile] = useState({ fullName: '', email: '', dob: '', profileImage: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);


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

  const handlePhotoSave = (newImage: string) => {
    setProfile(prev => ({ ...prev, profileImage: newImage }));
    setIsPhotoEditorOpen(false);
    toast({ title: "Image ready", description: "Click 'Save Changes' to apply." });
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

        const storedProfile = localStorage.getItem("userProfile");
        const existingProfile = storedProfile ? JSON.parse(storedProfile) : {};
        const updatedProfile = { ...existingProfile, ...profile };

        localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
        window.dispatchEvent(new StorageEvent('storage', { key: 'userProfile', newValue: JSON.stringify(updatedProfile) }));
        
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
        let description = "The current password you entered is incorrect.";
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
    return null; 
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

      <Dialog open={isPhotoEditorOpen} onOpenChange={setIsPhotoEditorOpen}>
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardHeader className="items-center">
                  <DialogTrigger asChild>
                    <div className="relative group cursor-pointer">
                        <Avatar className="w-32 h-32 text-6xl">
                            <AvatarImage src={profile.profileImage} alt={profile.fullName} />
                            <AvatarFallback>
                                <User/>
                            </AvatarFallback>
                        </Avatar>
                        <div 
                            className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Camera className="text-white w-8 h-8"/>
                        </div>
                    </div>
                  </DialogTrigger>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Make changes to your personal details here. Click save when you're done.</CardDescription>
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
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password here. After saving, you'll be logged out.</CardDescription>
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
          </TabsContent>
        </Tabs>
        <DialogContent className="max-w-2xl">
          <ProfilePhotoEditor
            currentImage={profile.profileImage}
            onSave={handlePhotoSave}
            onClose={() => setIsPhotoEditorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}


function IconEye({ show }: {show: boolean}) {
  return show ? <EyeOff /> : <Eye />;
}

    