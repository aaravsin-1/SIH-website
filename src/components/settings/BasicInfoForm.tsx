import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail } from 'lucide-react';

interface BasicInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface BasicInfoFormProps {
  basicInfo: BasicInfo;
  onBasicInfoChange: (field: string, value: string) => void;
}

export const BasicInfoForm = ({ basicInfo, onBasicInfoChange }: BasicInfoFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">Basic Information</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={basicInfo.firstName}
            onChange={(e) => onBasicInfoChange('firstName', e.target.value)}
            placeholder="First name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={basicInfo.lastName}
            onChange={(e) => onBasicInfoChange('lastName', e.target.value)}
            placeholder="Last name"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={basicInfo.email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={basicInfo.phone}
            onChange={(e) => onBasicInfoChange('phone', e.target.value)}
            placeholder="Your phone number"
          />
        </div>
      </div>
    </div>
  );
};