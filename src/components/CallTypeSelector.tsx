import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Video, Users, Target, Search, PhoneIncoming, HeartHandshake, PhoneOutgoing } from 'lucide-react';

interface CallTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const callTypes = [
  { 
    value: 'follow_up', 
    label: 'Follow-up Call',
    icon: Phone,
    description: 'Check in on previous conversation'
  },
  { 
    value: 'demo', 
    label: 'Product Demo',
    icon: Video,
    description: 'Show product features and benefits'
  },
  { 
    value: 'discovery', 
    label: 'Discovery Call',
    icon: Search,
    description: 'Understand customer needs'
  },
  { 
    value: 'closing', 
    label: 'Closing Call',
    icon: Target,
    description: 'Finalize the sale'
  },
  { 
    value: 'retention', 
    label: 'Retention Call',
    icon: HeartHandshake,
    description: 'Keep existing customers engaged'
  },
  { 
    value: 'incoming_sales', 
    label: 'Incoming Sales',
    icon: PhoneIncoming,
    description: 'Handle inbound inquiries'
  },
  { 
    value: 'outbound', 
    label: 'Outbound Sales',
    icon: PhoneOutgoing,
    description: 'Proactive outreach'
  },
  { 
    value: 'cold_call', 
    label: 'Cold Call',
    icon: Phone,
    description: 'First contact with prospect'
  },
  { 
    value: 'general', 
    label: 'General Call',
    icon: Users,
    description: 'Other call types'
  },
];

export function CallTypeSelector({ value, onChange, disabled = false }: CallTypeSelectorProps) {
  const selectedType = callTypes.find(t => t.value === value);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select call type">
          {selectedType && (
            <div className="flex items-center gap-2">
              <selectedType.icon className="h-4 w-4" />
              <span>{selectedType.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {callTypes.map((type) => {
          const Icon = type.icon;
          return (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex items-start gap-3 py-1">
                <Icon className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{type.label}</span>
                  <span className="text-xs text-muted-foreground">{type.description}</span>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
