

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Calendar as CalendarIcon, User, Lock, Trash2, Pencil, Phone, MapPin, Linkedin, Twitter, Github, Instagram, KeyRound, ShieldCheck, Star, NotebookPen } from "lucide-react";
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
import { Textarea } from "./ui/textarea";

export function ProfileEditForm() {
  const [profile, setProfile] = useState<Partial<UserData> | null>(null);
  const [skillsString, setSkillsString] = useState("");
  
  // Security Tab state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Note Password Tab state
  const [notePassword, setNotePassword] = useState('');
  const [confirmNotePassword, setConfirmNotePassword] = useState('');
  const [currentNotePassword, setCurrentNotePassword] = useState('');
  const [showNotePassword, setShowNotePassword] = useState(false);
  const [showConfirmNotePassword, setShowConfirmNotePassword] = useState(false);
  const [showCurrentNotePassword, setShowCurrentNotePassword] = useState(false);


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
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
        ...data,
        fullName: data.fullName || '',
        email: userEmail,
        phone: data.phone || '',
        address: data.address || '',
        dob: data.dob || '',
        linkedin: data.linkedin || '',
        twitter: data.twitter || '',
        github: data.github || '',
        instagram: data.instagram || '',
      });
      setNotePassword(data.notePassword || '');
      setSkillsString((data.skills || []).join(', '));
    });

    return () => unsub();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!profile) return;
    const { name, value } = e.target;
    setProfile(prev => prev ? ({ ...prev, [name]: value }) : null);
  };
  
  const handleSkillsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setSkillsString(e.target.value);
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date && profile) {
      setProfile(prev => prev ? ({ ...prev, dob: format(date, 'yyyy-MM-dd') }) : null);
    }
  };

  const handleSaveChanges = async () => {
    if (activeTab === 'account') {
        await handleSaveAccount();
    } else if (activeTab === 'security') {
        await handleChangePassword();
    } else if (activeTab === 'note-pass') {
        await handleSaveNotePassword();
    }
  }

  const handleSaveAccount = async () => {
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
        });
        
        const skillsArray = skillsString.split(',').map(s => s.trim()).filter(Boolean);

        const profileToSave = {
            ...profile,
            skills: skillsArray,
        };

        await updateUserData(user.email!, profileToSave);

        localStorage.setItem("userProfile", JSON.stringify(profileToSave));
        window.dispatchEvent(new StorageEvent('storage', { key: 'userProfile', newValue: JSON.stringify(profileToSave) }));
        
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
  
  const handleSaveNotePassword = async () => {
    if (notePassword !== confirmNotePassword) {
        toast({ title: "Passwords do not match", variant: "destructive" });
        return;
    }
    if (profile?.notePassword && !currentNotePassword) {
        toast({ title: "Current password required", description: "Please enter your current note password to set a new one.", variant: "destructive" });
        return;
    }
    if (profile?.notePassword && currentNotePassword !== profile.notePassword) {
        toast({ title: "Incorrect current password", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
        await updateUserData(profile?.email!, { notePassword });
        toast({ title: "Note Password Updated", description: "Your notes password has been set successfully." });
        setConfirmNotePassword('');
        setCurrentNotePassword('');
    } catch(err) {
        toast({ title: "Update failed", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
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
    <div className="min-h-screen flex justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl"
      >
        <div className="mb-6">
          <Button variant="secondary" className="rounded-xl shadow-md" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
          </Button>
        </div>

        <Card className="p-8 shadow-2xl rounded-3xl border border-gray-200 bg-white">
          <CardContent className="p-0">
            <h2 className="text-2xl font-bold mb-2 text-center">Edit Profile</h2>
            <p className="text-sm text-gray-500 mb-8 text-center">Update your personal information and security settings.</p>

            <Tabs defaultValue="account" onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-8 bg-gray-100 rounded-lg p-1">
                <TabsTrigger value="account" className="rounded-md">Account</TabsTrigger>
                <TabsTrigger value="security" className="rounded-md">Security</TabsTrigger>
                <TabsTrigger value="note-pass" className="rounded-md">Note Pass</TabsTrigger>
              </TabsList>

              <TabsContent value="account">
                <div className="flex flex-col items-center mb-8">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100"
                  >
                     <Avatar className="w-full h-full">
                        <AvatarImage src={profile.profileImage || `https://i.pravatar.cc/150?u=${profile.email}`} />
                        <AvatarFallback><User/></AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsPhotoEditorOpen(true)}>Change Photo</Button>
                </div>

                <div className="space-y-5 text-left">
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <Input name="fullName" type="text" value={profile.fullName || ''} onChange={handleInputChange} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <Input type="email" value={profile.email || ''} disabled className="mt-1 bg-gray-100" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone size={18} className="text-gray-500" />
                      <Input name="phone" type="tel" value={profile.phone || ''} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Address</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin size={18} className="text-gray-500" />
                      <Input name="address" type="text" value={profile.address || ''} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Date of Birth</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal mt-1">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {profile.dob ? format(parseISO(profile.dob), "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar mode="single" selected={profile.dob ? parseISO(profile.dob) : undefined} onSelect={handleDateChange} captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} initialFocus/>
                        </PopoverContent>
                    </Popover>
                  </div>
                   <div>
                    <Label className="text-sm font-medium">Skills & Interests</Label>
                    <div className="flex items-center gap-2 mt-1">
                        <Star size={18} className="text-gray-500" />
                        <Textarea name="skills" value={skillsString} onChange={handleSkillsChange} placeholder="e.g., React, UI/UX, Cricket" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">LinkedIn</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Linkedin size={18} className="text-gray-500" />
                      <Input name="linkedin" type="url" value={profile.linkedin || ''} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Twitter</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Twitter size={18} className="text-gray-500" />
                      <Input name="twitter" type="url" value={profile.twitter || ''} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">GitHub</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Github size={18} className="text-gray-500" />
                      <Input name="github" type="url" value={profile.github || ''} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Instagram</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Instagram size={18} className="text-gray-500" />
                      <Input name="instagram" type="url" value={profile.instagram || ''} onChange={handleInputChange} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security">
                <div className="space-y-5 text-left">
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
                  <div className="flex items-center justify-between mt-6 p-4 border rounded-xl bg-gray-50">
                    <div className="flex items-center gap-2">
                      <ShieldCheck size={20} className="text-gray-600" />
                      <span className="text-sm font-medium">Two-Factor Authentication</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Coming Soon!", description: "2FA will be available in a future update."})}>Enable</Button>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="note-pass">
                <div className="space-y-5 text-left">
                  <p className="text-sm text-muted-foreground">Set a password to lock and protect sensitive notes.</p>
                  {profile.notePassword && (
                    <div>
                        <Label className="text-sm font-medium">Current Note Password</Label>
                        <div className="flex items-center gap-2 mt-1">
                            <Lock size={18} className="text-gray-500" />
                            <Input type={showCurrentNotePassword ? "text" : "password"} placeholder="Enter current note password" value={currentNotePassword} onChange={e => setCurrentNotePassword(e.target.value)} />
                        </div>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">New Note Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <KeyRound size={18} className="text-gray-500" />
                      <Input type={showNotePassword ? "text" : "password"} placeholder="Enter new note password" value={notePassword} onChange={e => setNotePassword(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Confirm New Password</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <KeyRound size={18} className="text-gray-500" />
                      <Input type={showConfirmNotePassword ? "text" : "password"} placeholder="Confirm new note password" value={confirmNotePassword} onChange={e => setConfirmNotePassword(e.target.value)} />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Button onClick={handleSaveChanges} className="w-full mt-8 py-3 text-base rounded-xl" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>

            <p className="mt-8 text-xs text-gray-500 text-center">© 2025 Sutradhaar | Owned by Aman Yadav.</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
