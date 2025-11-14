'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import type { UserProfile } from '@/lib/types';
import { Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProfileForm({ profile }: { profile: UserProfile }) {
  const { toast } = useToast();
  // Using a static avatar for now
  const avatarId = 'avatar-1';
  const avatar = PlaceHolderImages.find((img) => img.id === avatarId);
  
  const handleUpdate = () => {
      // Here you would handle the form submission, e.g., via a server action
      toast({
          title: "Profile Updated",
          description: "Your information has been successfully updated.",
      });
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {avatar && <AvatarImage src={avatar?.imageUrl} data-ai-hint={avatar?.imageHint} />}
            <AvatarFallback>{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{profile.name}</CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" defaultValue={profile.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={profile.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" defaultValue={profile.mobile_number} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="e.g. 123, Innovation Drive..." />
          </div>
        </form>
      </CardContent>
      <CardFooter className="border-t pt-6">
        <Button className="ml-auto" onClick={handleUpdate}>
          <Edit className="mr-2 h-4 w-4" />
          Update Profile
        </Button>
      </CardFooter>
    </Card>
  );
}
