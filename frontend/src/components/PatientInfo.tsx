import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

interface PatientInfoProps {
  patient: {
    id?: string;
    name?: string;
    age?: number;
    gender?: string;
    photo?: string | null;
    blood_type?: string | null;
    allergies?: string[] | null;
    emergencyContact?: string | null;
  } | null;
}

export function PatientInfo({ patient }: PatientInfoProps) {
  if (!patient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Patient Data</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarImage src={patient.photo || undefined} alt={patient.name || "Patient"} />
            <AvatarFallback className="text-lg">
              {patient?.name ? patient.name.split(" ").map(n => n[0]).join("") : "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg">{patient.name ?? "Anonymous"}</h3>
            <p className="text-sm text-muted-foreground">ID: {patient.id ?? "—"}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Age</p>
            <p>{patient.age ?? "—"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gender</p>
            <p>{patient.gender ?? "—"}</p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">Blood Type</p>
          <Badge variant="secondary">{patient.blood_type ?? "—"}</Badge>
        </div>

        {patient.allergies && patient.allergies.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground">Allergies</p>
            <div className="flex flex-wrap gap-1">
              {patient.allergies.map((allergy, i) => (
                <Badge key={i} variant="destructive" className="text-xs">
                  {allergy}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {patient.emergencyContact && (
          <div>
            <p className="text-sm text-muted-foreground">Emergency Contact</p>
            <p className="text-sm">{patient.emergencyContact}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
