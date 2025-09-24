import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { 
  Phone, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare 
} from "lucide-react";

interface Hospital {
  id: string;
  name: string;
  distance: number;
  estimatedTime: string;
  department: string;
  rating: number;
  availableBeds: number;
  specialization: string[];
  isBestSuited: boolean;
  phone: string;
  address: string;
  availability: 'available' | 'limited' | 'full';
  responseTime: string;
  lastResponse: string;
}

interface ContactLog {
  id: string;
  hospitalId: string;
  timestamp: string;
  type: 'call' | 'message';
  status: 'accepted' | 'declined' | 'pending';
  response: string;
}

interface HospitalContactsProps {
  hospitals: Hospital[];
  selectedHospital: Hospital | null;
  contactLogs: ContactLog[];
  onContactHospital: (hospitalId: string, type: 'call' | 'message') => void;
}

export function HospitalContacts({ 
  hospitals, 
  selectedHospital, 
  contactLogs, 
  onContactHospital 
}: HospitalContactsProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'logs'>('contacts');

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'limited':
        return 'bg-yellow-100 text-yellow-800';
      case 'full':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityIcon = (availability: string) => {
    switch (availability) {
      case 'available':
        return <CheckCircle className="h-4 w-4" />;
      case 'limited':
        return <AlertCircle className="h-4 w-4" />;
      case 'full':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const ContactsView = () => (
    <ScrollArea className="h-64">
      <div className="space-y-3">
        {hospitals.filter(h => h.isBestSuited).map((hospital) => (
          <div key={hospital.id} className="p-3 border rounded-lg">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-sm flex items-center gap-2">
                  {hospital.name}
                  {hospital.isBestSuited && (
                    <Badge className="bg-green-100 text-green-800 text-xs">Best</Badge>
                  )}
                </h4>
                <p className="text-xs text-muted-foreground">{hospital.department}</p>
              </div>
              <Badge className={getAvailabilityColor(hospital.availability)}>
                {getAvailabilityIcon(hospital.availability)}
                <span className="ml-1 text-xs">{hospital.availability}</span>
              </Badge>
            </div>
            
            <div className="space-y-1 text-xs text-muted-foreground mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                <span>{hospital.distance} mi • {hospital.estimatedTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3" />
                <span>{hospital.availableBeds} beds</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onContactHospital(hospital.id, 'call')}
                className="flex-1 h-7 text-xs"
              >
                <Phone className="h-3 w-3 mr-1" />
                Call
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onContactHospital(hospital.id, 'message')}
                className="flex-1 h-7 text-xs"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Message
              </Button>
            </div>
          </div>
        ))}
        
        <Separator />
        
        <div className="space-y-2">
          <h4 className="font-medium text-xs">Other Nearby</h4>
          {hospitals.filter(h => !h.isBestSuited).slice(0, 2).map((hospital) => (
            <div key={hospital.id} className="p-2 border rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <h5 className="font-medium text-xs">{hospital.name}</h5>
                <Badge variant="outline" className={`${getAvailabilityColor(hospital.availability)} text-xs`}>
                  {hospital.availability}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                <span>{hospital.distance} mi</span>
                <span>{hospital.availableBeds} beds</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onContactHospital(hospital.id, 'call')}
                className="w-full h-6 text-xs"
              >
                <Phone className="h-3 w-3 mr-1" />
                Call
              </Button>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );

  const LogsView = () => (
    <ScrollArea className="h-64">
      <div className="space-y-2">
        {contactLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No contact attempts yet
          </p>
        ) : (
          contactLogs.map((log) => {
            const hospital = hospitals.find(h => h.id === log.hospitalId);
            return (
              <div key={log.id} className="p-2 border rounded-lg">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {hospital?.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-xs font-medium">{hospital?.name}</p>
                      <p className="text-xs text-muted-foreground">{log.timestamp}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(log.status)}>
                    {log.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  {log.type === 'call' ? (
                    <Phone className="h-3 w-3" />
                  ) : (
                    <MessageSquare className="h-3 w-3" />
                  )}
                  <span>{log.type === 'call' ? 'Phone call' : 'Message'}</span>
                </div>
                {log.response && (
                  <p className="text-xs bg-muted p-1 rounded">"{log.response}"</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </ScrollArea>
  );

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Hospital Contacts
          </div>
          <div className="flex gap-1">
            <Button
              variant={activeTab === 'contacts' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('contacts')}
            >
              Contacts
            </Button>
            <Button
              variant={activeTab === 'logs' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('logs')}
            >
              Logs ({contactLogs.length})
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeTab === 'contacts' ? <ContactsView /> : <LogsView />}
      </CardContent>
    </Card>
  );
}