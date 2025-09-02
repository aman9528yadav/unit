
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileEditForm() {
  const [fullName, setFullName] = useState("Madison Smith");
  const [email, setEmail] = useState("madisons@example.com");
  const [mobile, setMobile] = useState("+123 567 89000");
  const [dob, setDob] = useState("01 / 04 / 199X");
  const [weight, setWeight] = useState("75 Kg");
  const [height, setHeight] = useState("1.65 CM");

  const handleUpdate = () => {
    // Handle profile update logic
    console.log("Profile Updated");
  };

  return (
    <div className="w-full max-w-md mx-auto text-white flex flex-col">
      <div className="bg-indigo-400/90 pb-8 rounded-b-3xl">
        <header className="p-4 flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Edit Profile</h1>
        </header>

        <div className="flex flex-col items-center text-center gap-2 mt-2">
          <div className="relative w-28 h-28">
            <Image
              src="https://picsum.photos/200"
              alt="Aman Yadav"
              width={112}
              height={112}
              className="rounded-full border-4 border-white"
              data-ai-hint="profile picture"
            />
            <Button
              variant="outline"
              size="icon"
              className="absolute bottom-0 right-0 rounded-full w-8 h-8 bg-yellow-400 border-yellow-400 hover:bg-yellow-500"
            >
              <Pencil className="w-4 h-4 text-black" />
            </Button>
          </div>
          <h2 className="text-2xl font-bold mt-2">Aman Yadav</h2>
          <p className="text-sm">aman@example.com</p>
          <p className="text-sm">Birthday: April 1st</p>
        </div>
      </div>

      <div className="bg-card text-card-foreground p-4 rounded-xl -mt-6 mx-4 shadow-lg flex justify-around text-center">
        <div>
          <p className="text-lg font-bold">12 Days</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </div>
        <div className="border-l border-border"></div>
        <div>
          <p className="text-lg font-bold">06 Days</p>
          <p className="text-xs text-muted-foreground">Current Streak</p>
        </div>
        <div className="border-l border-border"></div>
        <div>
          <p className="text-lg font-bold">04 Days</p>
          <p className="text-xs text-muted-foreground">Not Open</p>
        </div>
      </div>

      <div className="mt-6 px-4 flex-grow w-full">
        <form className="space-y-4">
          <div>
            <Label htmlFor="fullName" className="text-muted-foreground">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} className="bg-secondary mt-1 h-12 rounded-lg" />
          </div>
          <div>
            <Label htmlFor="email" className="text-muted-foreground">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-secondary mt-1 h-12 rounded-lg" />
          </div>
          <div>
            <Label htmlFor="mobile" className="text-muted-foreground">Mobile Number</Label>
            <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="bg-secondary mt-1 h-12 rounded-lg" />
          </div>
          <div>
            <Label htmlFor="dob" className="text-muted-foreground">Date of birth</Label>
            <Input id="dob" value={dob} onChange={(e) => setDob(e.target.value)} className="bg-secondary mt-1 h-12 rounded-lg" />
          </div>
          <div>
            <Label htmlFor="weight" className="text-muted-foreground">Weight</Label>
            <Input id="weight" value={weight} onChange={(e) => setWeight(e.target.value)} className="bg-secondary mt-1 h-12 rounded-lg" />
          </div>
          <div>
            <Label htmlFor="height" className="text-muted-foreground">Height</Label>
            <Input id="height" value={height} onChange={(e) => setHeight(e.target.value)} className="bg-secondary mt-1 h-12 rounded-lg" />
          </div>
          <Button
            type="button"
            onClick={handleUpdate}
            className="w-full h-12 bg-yellow-400 text-black font-bold text-base rounded-lg hover:bg-yellow-500 mt-6"
          >
            Update Profile
          </Button>
        </form>
      </div>
    </div>
  );
}
