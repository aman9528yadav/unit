
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Calendar as CalendarIcon, User, Lock, Trash2, Pencil, Phone, MapPin, Linkedin, Twitter, Github, Instagram, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { updateProfile, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/context/language-context";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ProfilePhotoEditor } from "./profile-photo-editor";
import { updateUserData, listenToUserData, UserData } from "@/services/firestore";

export function ProfileEditForm() {
  const [profile, setProfile] = useState<Partial<UserData> | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const { t } = useLanguage();

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const userEmail = auth.currentUser?.email || (localStorage.getItem("userProfile") ? JSON.parse(localStorage.getItem("userProfile")!).email : null);
    
    if (!userEmail) {
      router.replace('/welcome');
      return;
    }

    const unsub = listenToUserData(userEmail, (data) => {
      if (!data) {
        const currentUser = auth.currentUser;
        if(currentUser) {
            setProfile({
                fullName: currentUser.displayName || '',
                email: currentUser.email || '',
                profileImage: currentUser.photoURL || ''
            });
        }
        return;
      };
      setProfile({
        fullName: data.fullName || '',
        email: userEmail,
        dob: data.dob || '',
        profileImage: data.profileImage || '',
        phone: data.phone || '',
        address: data.address || '',
        linkedin: data.linkedin || '',
        twitter: data.twitter || '',
        github: data.github || '',
        instagram: data.instagram || '',
      });
    });

    return () => unsub();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const { name, value } = e.target;
    setProfile(prev => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date && profile) {
      setProfile(prev => prev ? ({ ...prev, dob: format(date, 'yyyy-MM-dd') }) : null);
    }
  };

  const handleSaveChanges = async () => {
    if (!profile || !profile.fullName) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, {
          displayName: profile.fullName,
          photoURL: profile.profileImage
        });
        
        await updateUserData(user.email, {
            ...profile
        });

        localStorage.setItem("userProfile", JSON.stringify(profile));
        window.dispatchEvent(new StorageEvent('storage', { key: 'userProfile', newValue: JSON.stringify(profile) }));
        
        toast({ title: "Profile Updated", description: "Your personal information has been updated." });
        router.push("/profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Update Failed", description: "Could not update your profile.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSavePhoto = async (newImage: string | null) => {
    if (!profile) return;
    const updatedProfile = { ...profile, profileImage: newImage || '' };
    setProfile(updatedProfile);
    setIsPhotoEditorOpen(false);
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
        toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
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
        let description = "Could not update password. Please try again.";
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


  if (!isClient || !profile) {
    return null; 
  }
  
  if (isPhotoEditorOpen) {
    return (
      <ProfilePhotoEditor
          currentImage={profile.profileImage || ''}
          onSave={handleSavePhoto}
          onClose={() => setIsPhotoEditorOpen(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex justify-center p-6 bg-gray-50 text-gray-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl"
      >
        <div className="mb-4">
            <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => router.back()}>
                <ArrowLeft size={16} /> Back
            </Button>
        </div>

        <Card className="p-6 shadow-xl rounded-2xl">
          <CardContent className="p-0">
            <h2 className="text-xl font-semibold mb-4 text-center">Edit Profile</h2>
            <p className="text-sm text-gray-500 mb-6 text-center">Manage your account and security details below.</p>

            <Tabs defaultValue="account">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="account">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-28 h-28 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
                    <img
                      src={profile.profileImage || `https://i.pravatar.cc/150?u=${profile.email}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsPhotoEditorOpen(true)}>Change Photo</Button>
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <Input name="fullName" type="text" value={profile.fullName} onChange={handleInputChange} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <Input type="email" value={profile.email} disabled className="mt-1 bg-gray-100" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone size={18} className="text-gray-500" />
                      <Input name="phone" type="tel" value={profile.phone} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Address</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin size={18} className="text-gray-500" />
                      <Input name="address" type="text" value={profile.address} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date of Birth</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar size={18} className="text-gray-500" />
                      <Input name="dob" type="date" value={profile.dob ? format(parseISO(profile.dob), 'yyyy-MM-dd') : ''} onChange={handleInputChange} />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">LinkedIn</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Linkedin size={18} className="text-gray-500" />
                      <Input name="linkedin" type="url" value={profile.linkedin} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Twitter</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Twitter size={18} className="text-gray-500" />
                      <Input name="twitter" type="url" value={profile.twitter} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">GitHub</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Github size={18} className="text-gray-500" />
                      <Input name="github" type="url" value={profile.github} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Instagram</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Instagram size={18} className="text-gray-500" />
                      <Input name="instagram" type="url" value={profile.instagram} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security">
                <div className="space-y-4 text-left">
                  <div>
                    <Label className="text-sm font-medium">Current Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Lock size={18} className="text-gray-500" />
                      <Input type={showCurrentPassword ? "text" : "password"} placeholder="Enter current password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">New Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <KeyRound size={18} className="text-gray-500" />
                      <Input type={showNewPassword ? "text" : "password"} placeholder="Enter new password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Confirm New Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <KeyRound size={18} className="text-gray-500" />
                      <Input type={showConfirmPassword ? "text" : "password"} placeholder="Confirm new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                   <Button onClick={handleChangePassword} className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Updating...' : 'Update Password'}
                    </Button>
                </div>
              </TabsContent>
            </Tabs>

            <Button className="w-full mt-6" onClick={handleSaveChanges} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>

            <p className="mt-6 text-xs text-gray-500 text-center">© 2025 Sutradhar | Owned by Aman Yadav.</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
