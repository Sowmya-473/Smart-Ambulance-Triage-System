"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Ambulance, Bed, Activity, Zap, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { HospitalMap } from "./HospitalMap";
import {ReportCanvas} from "./ReportCanvas";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Badge } from "./ui/badge";

// 🛠️ Helper to get color by severity
const getSeverityColor = (severity: string) => {
  switch (severity?.toLowerCase()) {
    case "critical": return "bg-red-100 text-red-800";
    case "high": return "bg-orange-100 text-orange-800";
    case "medium": return "bg-yellow-100 text-yellow-800";
    default: return "bg-green-100 text-green-800";
  }
};

export function HospitalDashboard({ hospitalId, onLogout }: { hospitalId: string; onLogout: () => void }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [accepted, setAccepted] = useState<any[]>([]);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);

  // ✅ Fetch requests (replace with Supabase later)
  useEffect(() => {
    const sample = [
      {
        id: "1",
        patient: { name: "Sarah Johnson", age: 55, gender: "F" },
        prediction: { condition: "Myocardial Infarction", confidence: 92, severity: "critical", department: "Cardiology" },
        vitals: { hr: 110, sbp: 160, dbp: 95, spo2: 94 },
        eta: "8 min",
        symptoms: ["Chest pain", "Shortness of breath"],
        status: "pending",
      },
      {
        id: "2",
        patient: { name: "Anonymous", age: 67, gender: "M" },
        prediction: { condition: "Cerebrovascular Accident", confidence: 85, severity: "high", department: "Neurology" },
        vitals: { hr: 88, sbp: 180, dbp: 100, spo2: 97 },
        eta: "12 min",
        symptoms: ["Facial droop", "Arm weakness", "Slurred speech"],
        status: "pending",
      },
    ];
    setRequests(sample);
  }, []);

  // ✅ Handle Accept/Reject
  const handleAction = (req: any, action: "accept" | "reject") => {
    if (action === "accept") {
      setAccepted((prev) => [...prev, { ...req, status: "arriving" }]);
    }
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Ambulance className="h-5 w-5 text-primary" />
          City General Hospital Portal
        </h1>
        <Button size="sm" variant="outline" onClick={onLogout}>
          Logout
        </Button>
      </div>

      {/* Main Grid */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Requests */}
        <div className="w-1/3 border-r bg-muted/10 flex flex-col">
          <Tabs defaultValue="incoming" className="flex-1 flex flex-col">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="incoming">Incoming Requests ({requests.length})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted Queue ({accepted.length})</TabsTrigger>
            </TabsList>

            {/* Incoming Requests */}
            <TabsContent value="incoming" className="flex-1">
              <ScrollArea className="h-full p-4 space-y-4">
                {requests.length === 0 && <p className="text-muted-foreground text-sm">No incoming requests</p>}
                {requests.map((req) => (
                  <Card key={req.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{req.patient.name}</h3>
                        <p className="text-xs text-muted-foreground">{req.prediction.condition}</p>
                        <div className="flex gap-2 mt-2">
                          {req.symptoms.map((s: string) => (
                            <Badge key={s} variant="secondary">{s}</Badge>
                          ))}
                        </div>
                        <div className="flex gap-2 mt-2 text-xs">
                          <span className="font-semibold">HR:</span> {req.vitals.hr} |
                          <span className="font-semibold"> BP:</span> {req.vitals.sbp}/{req.vitals.dbp} |
                          <span className="font-semibold"> SpO₂:</span> {req.vitals.spo2}%
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" onClick={() => { handleAction(req, "accept"); setActiveRequest(req); }}>Accept</Button>
                        <Button size="sm" variant="outline" onClick={() => handleAction(req, "reject")}>Decline</Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </ScrollArea>
            </TabsContent>

            {/* Accepted Queue */}
            <TabsContent value="accepted" className="flex-1">
              <ScrollArea className="h-full p-4 space-y-4">
                {accepted.length === 0 && <p className="text-muted-foreground text-sm">No accepted patients</p>}
                {accepted.map((req) => (
                  <Card key={req.id} className="p-4" onClick={() => setActiveRequest(req)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{req.patient.name}</h3>
                        <p className="text-xs text-muted-foreground">{req.prediction.condition}</p>
                      </div>
                      <Badge className={getSeverityColor(req.prediction.severity)}>{req.status}</Badge>
                    </div>
                  </Card>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* CENTER: Map */}
        <div className="flex-1 bg-muted/5">
          <HospitalMap /> {/* Replace with your Google/Leaflet Map */}
        </div>

        {/* RIGHT: Resources & Alerts */}
        <div className="w-1/4 border-l bg-muted/10 p-4 flex flex-col gap-4">
          <Card>
            <CardHeader><CardTitle>Hospital Resources</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span>Beds</span> <Badge>12 Free</Badge></div>
              <div className="flex justify-between"><span>ICU</span> <Badge variant="destructive">2 Free</Badge></div>
              <div className="flex justify-between"><span>Cardiologist</span> <Badge>Available</Badge></div>
              <div className="flex justify-between"><span>Neurologist</span> <Badge variant="secondary">On-Call</Badge></div>
              <div className="flex justify-between"><span>Trauma Team</span> <Badge variant="destructive">Unavailable</Badge></div>
              <div className="flex justify-between"><span>Pulmonologist</span> <Badge>Available</Badge></div>
              <div className="flex justify-between"><span>Ventilators</span> <Badge>Available</Badge></div>
              <div className="flex justify-between"><span>Oxygen Tanks</span> <Badge variant="secondary">Low</Badge></div>
              <div className="flex justify-between"><span>Defibrillators</span> <Badge>Available</Badge></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Alerts & Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-red-600"><AlertCircle className="h-4 w-4" /> Bed shortage warning: 2 beds left.</div>
              <div className="flex items-center gap-2 text-yellow-600"><AlertCircle className="h-4 w-4" /> Ambulance REQ-002: Patient vitals unstable.</div>
              <div className="flex items-center gap-2 text-blue-600"><AlertCircle className="h-4 w-4" /> Neurologist on-call, 30 min response time.</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Slide-Out Report */}
      <Sheet open={!!activeRequest} onOpenChange={() => setActiveRequest(null)}>
        <SheetContent side="right" className="w-[600px]">
          <SheetHeader>
            <SheetTitle>Pre-Arrival Report</SheetTitle>
          </SheetHeader>
          {activeRequest && <ReportCanvas request={activeRequest} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}
