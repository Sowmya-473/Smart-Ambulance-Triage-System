import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Pencil, Activity, Heart, Thermometer, Droplets, Gauge, Brain } from "lucide-react";

interface VitalsData {
  HR: number; // Heart Rate
  SpO2: number; // Oxygen Saturation
  SBP: number; // Systolic Blood Pressure
  DBP: number; // Diastolic Blood Pressure
  Temp: number; // Temperature in Celsius
  Glucose: number; // Blood Glucose
  GCS: number; // Glasgow Coma Scale
  lastUpdated: string;
}

interface VitalsPanelProps {
  vitals: VitalsData;
  onVitalsUpdate: (vitals: VitalsData) => void;
  isLiveMode: boolean;
}

export function VitalsPanel({ vitals, onVitalsUpdate, isLiveMode }: VitalsPanelProps) {
  const [editingVitals, setEditingVitals] = useState<VitalsData>(vitals);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSave = () => {
    onVitalsUpdate(editingVitals);
    setIsDialogOpen(false);
  };

  const getVitalStatus = (vital: string, value: number) => {
    switch (vital) {
      case "HR":
        if (value < 60) return "low";
        if (value > 100) return "high";
        return "normal";
      case "SpO2":
        if (value < 95) return "low";
        return "normal";
      case "SBP":
        if (value < 90) return "low";
        if (value > 140) return "high";
        return "normal";
      case "DBP":
        if (value < 60) return "low";
        if (value > 90) return "high";
        return "normal";
      case "Temp":
        if (value < 36) return "low";
        if (value > 37.5) return "high";
        return "normal";
      case "Glucose":
        if (value < 70) return "low";
        if (value > 180) return "high";
        return "normal";
      case "GCS":
        if (value < 13) return "low";
        return "normal";
      default:
        return "normal";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "low":
        return "bg-blue-100 text-blue-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Vital Signs
            {isLiveMode && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Live
              </Badge>
            )}
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Vital Signs</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="HR" className="text-right">HR (bpm)</Label>
                  <Input
                    id="HR"
                    type="number"
                    className="col-span-3"
                    value={editingVitals.HR}
                    onChange={(e) => setEditingVitals({
                      ...editingVitals,
                      HR: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="SpO2" className="text-right">SpO₂ (%)</Label>
                  <Input
                    id="SpO2"
                    type="number"
                    className="col-span-3"
                    value={editingVitals.SpO2}
                    onChange={(e) => setEditingVitals({
                      ...editingVitals,
                      SpO2: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="SBP" className="text-right">SBP (mmHg)</Label>
                  <Input
                    id="SBP"
                    type="number"
                    className="col-span-3"
                    value={editingVitals.SBP}
                    onChange={(e) => setEditingVitals({
                      ...editingVitals,
                      SBP: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="DBP" className="text-right">DBP (mmHg)</Label>
                  <Input
                    id="DBP"
                    type="number"
                    className="col-span-3"
                    value={editingVitals.DBP}
                    onChange={(e) => setEditingVitals({
                      ...editingVitals,
                      DBP: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="Temp" className="text-right">Temp (°C)</Label>
                  <Input
                    id="Temp"
                    type="number"
                    step="0.1"
                    className="col-span-3"
                    value={editingVitals.Temp}
                    onChange={(e) => setEditingVitals({
                      ...editingVitals,
                      Temp: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="Glucose" className="text-right">Glucose (mg/dL)</Label>
                  <Input
                    id="Glucose"
                    type="number"
                    className="col-span-3"
                    value={editingVitals.Glucose}
                    onChange={(e) => setEditingVitals({
                      ...editingVitals,
                      Glucose: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="GCS" className="text-right">GCS</Label>
                  <Input
                    id="GCS"
                    type="number"
                    min="3"
                    max="15"
                    className="col-span-3"
                    value={editingVitals.GCS}
                    onChange={(e) => setEditingVitals({
                      ...editingVitals,
                      GCS: parseInt(e.target.value) || 3
                    })}
                  />
                </div>
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-sm text-muted-foreground">HR</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">{vitals.HR ?? "—"} bpm</span>
                <Badge className={getStatusColor(getVitalStatus("HR", vitals.HR))}>
                  {getVitalStatus("HR", vitals.HR)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">SpO₂</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">{vitals.SpO2 ?? "—"}%</span>
                <Badge className={getStatusColor(getVitalStatus("SpO2", vitals.SpO2))}>
                  {getVitalStatus("SpO2", vitals.SpO2)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">SBP</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">{vitals.SBP ?? "—"} mmHg</span>
                <Badge className={getStatusColor(getVitalStatus("SBP", vitals.SBP))}>
                  {getVitalStatus("SBP", vitals.SBP)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">DBP</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">{vitals.DBP ?? "—"} mmHg</span>
                <Badge className={getStatusColor(getVitalStatus("DBP", vitals.DBP))}>
                  {getVitalStatus("DBP", vitals.DBP)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-sm text-muted-foreground">Temp</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">{vitals.Temp ?? "—"} °C</span>
                <Badge className={getStatusColor(getVitalStatus("Temp", vitals.Temp))}>
                  {getVitalStatus("Temp", vitals.Temp)}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Glucose</p>
              <div className="flex items-center gap-2">
                <span className="text-sm">{vitals.Glucose ?? "—"} mg/dL</span>
                <Badge className={getStatusColor(getVitalStatus("Glucose", vitals.Glucose))}>
                  {getVitalStatus("Glucose", vitals.Glucose)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-indigo-500" />
          <div>
            <p className="text-sm text-muted-foreground">GCS</p>
            <div className="flex items-center gap-2">
              <span className="text-sm">{vitals.GCS ?? "—"}/15</span>
              <Badge className={getStatusColor(getVitalStatus("GCS", vitals.GCS))}>
                {getVitalStatus("GCS", vitals.GCS)}
              </Badge>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Last updated: {vitals.lastUpdated ?? "—"}
        </p>
      </CardContent>
    </Card>
  );
}
