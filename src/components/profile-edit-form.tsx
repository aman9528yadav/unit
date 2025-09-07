
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Calendar as CalendarIcon, User, Lock, Trash2 } from "lucide-react";
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
import { useLanguage } from "@/context/language-context";


export function ProfileEditForm() {
  const [profile, setProfile] = useState({ fullName: '', email: '', dob: '' });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { t } = useLanguage();


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

  const handleSaveChanges = async () => {
    if (!profile.fullName) {
      toast({ title: t('profileEdit.toast.nameRequired'), variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, {
          displayName: profile.fullName,
        });

        const storedProfile = localStorage.getItem("userProfile");
        const existingProfile = storedProfile ? JSON.parse(storedProfile) : {};
        const updatedProfile = { ...existingProfile, ...profile };

        localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
        window.dispatchEvent(new StorageEvent('storage', { key: 'userProfile', newValue: JSON.stringify(updatedProfile) }));
        
        toast({ title: t('profileEdit.toast.profileUpdated.title'), description: t('profileEdit.toast.profileUpdated.description') });
        router.push("/profile/success");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: t('profileEdit.toast.updateFailed.title'), description: t('profileEdit.toast.updateFailed.description'), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: t('profileEdit.toast.passwordFieldsRequired'), variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('profileEdit.toast.passwordsNoMatch'), variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
        toast({ title: t('profileEdit.toast.passwordTooShort.title'), description: t('profileEdit.toast.passwordTooShort.description'), variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    const user = auth.currentUser;
    if (user && user.email) {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      try {
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
        toast({ title: t('profileEdit.toast.passwordChanged.title'), description: t('profileEdit.toast.passwordChanged.description') });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } catch (error: any) {
        console.error("Password change error:", error);
        let title = t('profileEdit.toast.passwordChangeFailed.title');
        let description = t('profileEdit.toast.passwordChangeFailed.description');
        if (error.code === 'auth/wrong-password') {
            title = t('profileEdit.toast.incorrectPassword.title');
            description = t('profileEdit.toast.incorrectPassword.description');
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
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">{t('profileEdit.title')}</h1>
      </header>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">{t('profileEdit.tabs.account')}</TabsTrigger>
          <TabsTrigger value="security">{t('profileEdit.tabs.security')}</TabsTrigger>
        </TabsList>
        <TabsContent value="account">
          <Card>
            <CardHeader className="items-center">
              <CardTitle>{t('profileEdit.account.title')}</CardTitle>
              <CardDescription>{t('profileEdit.account.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fullName">{t('profileEdit.account.fullName')}</Label>
                <Input id="fullName" name="fullName" value={profile.fullName} onChange={handleInputChange} />
              </div>
              <div>
                <Label htmlFor="email">{t('profileEdit.account.email')}</Label>
                <Input id="email" type="email" value={profile.email} disabled />
              </div>
              <div>
                <Label htmlFor="dob">{t('profileEdit.account.dob')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {profile.dob ? format(new Date(profile.dob), "PPP") : <span>{t('profileEdit.account.pickDate')}</span>}
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
                {isSubmitting ? t('profileEdit.account.saving') : t('profileEdit.account.save')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{t('profileEdit.security.title')}</CardTitle>
              <CardDescription>{t('profileEdit.security.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Label htmlFor="currentPassword">{t('profileEdit.security.currentPassword')}</Label>
                <Input id="currentPassword" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                <Button variant="ghost" size="icon" className="absolute right-1 top-6" onClick={() => setShowCurrentPassword(!showCurrentPassword)}><IconEye show={showCurrentPassword} /></Button>
              </div>
              <div className="relative">
                <Label htmlFor="newPassword">{t('profileEdit.security.newPassword')}</Label>
                <Input id="newPassword" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <Button variant="ghost" size="icon" className="absolute right-1 top-6" onClick={() => setShowNewPassword(!showNewPassword)}><IconEye show={showNewPassword} /></Button>
              </div>
              <div className="relative">
                <Label htmlFor="confirmPassword">{t('profileEdit.security.confirmPassword')}</Label>
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <Button variant="ghost" size="icon" className="absolute right-1 top-6" onClick={() => setShowConfirmPassword(!showConfirmPassword)}><IconEye show={showConfirmPassword} /></Button>
              </div>
              <Button onClick={handleChangePassword} variant="secondary" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('profileEdit.security.updating') : t('profileEdit.security.update')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


function IconEye({ show }: {show: boolean}) {
  return show ? <EyeOff /> : <Eye />;
}
