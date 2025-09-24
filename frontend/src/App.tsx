import { useEffect, useMemo, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { VitalsPanel } from "./components/VitalsPanel";
import { SymptomsInput } from "./components/SymptomsInput";
import { PredictedCondition } from "./components/PredictedCondition";
import { HospitalMap } from "./components/HospitalMap";
import { LoginPage } from "./components/LoginPage";
import { ThemeToggle } from "./components/ThemeToggle";
import { ArrowLeft, Pencil } from "lucide-react";
import { supabase } from "./lib/supabaseClient";
import { HospitalDashboard } from "./components/HospitalDashboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "./components/ui/dialog";

type Vitals = {
  hr: number;
  spo2: number;
  sbp: number;
  dbp: number;
  temp: number;
  glucose: number;
  gcs: number;
  updated_at: string;
};

type Prediction = {
  condition: string;
  confidence: number;
  severity: "low" | "medium" | "high" | "critical";
  department: string;
  recommendations: string[] | null;
  timeToTreat: string | null;
};

type HospitalAPI = {
  Hospital_ID: string;
  Hospital_Name: string;
  distance: number;
  score?: number;
  Contact_No?: string | null;
  Address?: string | null;
  Latitude: number;
  Longitude: number;
  Type?: string | null;
};

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5001";
const DEFAULT_PATIENT_ID = "p1";

export default function App() {
  // Nav
  const [currentView, setCurrentView] = useState<"login" | "ambulance" | "hospital">("login");
  const [currentAmbulanceId, setCurrentAmbulanceId] = useState<string | null>(null);
  const [currentHospitalId, setCurrentHospitalId] = useState<string | null>(null);

  // Patient
  const [patientId] = useState(DEFAULT_PATIENT_ID);
  const [patient, setPatient] = useState<{
    id: string;
    name: string;
    age: number;
    gender: string;
    bloodType: string;
  } | null>(null);
  const [editedPatient, setEditedPatient] = useState({ name: "", age: "", gender: "", bloodType: "" });
  const [showPatientEditor, setShowPatientEditor] = useState(false); // ✅ added

  // Vitals
  const [vitals, setVitals] = useState<Vitals | null>(null);

  // Symptoms
  const [symptoms, setSymptoms] = useState<string[]>([
    "shortness of breath / sharp chest pain",
    "irregular heartbeat / breathing fast",
    "difficulty speaking / cough",
  ]);

  // Prediction
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  // Hospitals
  const [hospitals, setHospitals] = useState<HospitalAPI[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  // 🚑 Ambulance live location
  const [ambulanceLocation, setAmbulanceLocation] = useState<{ lat: number; lng: number }>({
    lat: 13.0827,
    lng: 80.2707,
  });

  // 📍 Human-readable address
  const [ambulanceAddress, setAmbulanceAddress] = useState<string>("Fetching location...");

  // 🧪 Test location override
  const [useTestLocation, setUseTestLocation] = useState(false);

  // 📍 Watch GPS
  useEffect(() => {
    if (useTestLocation) return;

    if (!navigator.geolocation) {
      console.warn("Geolocation not supported, using fallback (Chennai)");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setAmbulanceLocation(loc);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}`
          );
          const data = await res.json();
          setAmbulanceAddress(data.display_name || "Unknown Location");
        } catch {
          setAmbulanceAddress("Unknown Location");
        }

        if (currentAmbulanceId) {
          supabase
            .from("ambulances")
            .update({
              current_location_lat: loc.lat,
              current_location_lon: loc.lng,
              status: "active",
            })
            .eq("ambulance_id", currentAmbulanceId);
        }
      },
      (err) => console.error("Geolocation error:", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [currentAmbulanceId, useTestLocation]);

  // --- load patient
  useEffect(() => {
    const load = async () => {
      const { data: p } = await supabase
        .from("patients")
        .select("id, name, age, gender, blood_type")
        .eq("id", patientId)
        .maybeSingle();
      if (p) {
        setPatient({
          id: p.id,
          name: p.name,
          age: p.age ?? 0,
          gender: p.gender ?? "Gender",
          bloodType: p.blood_type ?? "Blood Type",
        });
        setEditedPatient({
          name: p.name ?? "",
          age: p.age?.toString() ?? "",
          gender: p.gender ?? "",
          bloodType: p.blood_type ?? "",
        });
      }
    };
    load();
  }, [patientId]);

  // --- prediction
  useEffect(() => {
    const run = async () => {
      if (symptoms.length === 0) {
        setPrediction(null);
        return;
      }
      setIsPredicting(true);
      try {
        const body = {
          symptoms,
          vitals: {
            HR: vitals?.hr ?? 0,
            SpO2: vitals?.spo2 ?? 0,
            SBP: vitals?.sbp ?? 0,
            DBP: vitals?.dbp ?? 0,
            Temp: vitals?.temp ?? 0,
            Glucose: vitals?.glucose ?? 0,
            GCS: vitals?.gcs ?? 0,
          },
        };
        const res = await fetch(`${BACKEND}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        setPrediction({
          condition: data.condition ?? "Unknown",
          confidence: Math.round(data.confidence ?? 0),
          severity: (data.severity ?? "medium") as Prediction["severity"],
          department: data.department ?? "General Medicine",
          recommendations: data.recommendations ?? null,
          timeToTreat: data.timeToTreat ?? null,
        });
      } catch {
        setPrediction(null);
      } finally {
        setIsPredicting(false);
      }
    };
    run();
  }, [symptoms, vitals]);

  // --- hospital matches
  const conditionForMatch = useMemo(
    () => prediction?.condition?.toLowerCase() || "sepsis",
    [prediction]
  );

  useEffect(() => {
    const getMatches = async () => {
      if (!ambulanceLocation.lat || !ambulanceLocation.lng) return;
      try {
        const location = [ambulanceLocation.lat, ambulanceLocation.lng];
        const res = await fetch(`${BACKEND}/match_hospitals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ condition: conditionForMatch, location }),
        });

        if (!res.ok) return;

        const data = await res.json();
        setHospitals(
          (Array.isArray(data) ? data : []).map((h: any) => ({
            Hospital_ID: h.Hospital_ID,
            Hospital_Name: h.Hospital_Name,
            distance: Number(h.distance ?? 0),
            score: Number(h.score ?? 0),
            Contact_No: h.Contact_No ?? null,
            Address: h.Address ?? null,
            Latitude: h.Latitude,
            Longitude: h.Longitude,
            Type: h.Type ?? null,
          }))
        );
      } catch {
        setHospitals([]);
      }
    };
    getMatches();
  }, [conditionForMatch, ambulanceLocation]);

  const handleLogout = () => setCurrentView("login");
  const handlePatientSave = async () => {
    if (!patient) return;
    await supabase
      .from("patients")
      .update({
        name: editedPatient.name,
        age: parseInt(editedPatient.age) || 0,
        gender: editedPatient.gender,
        blood_type: editedPatient.bloodType,
      })
      .eq("id", patientId);
    setPatient({
      ...patient,
      name: editedPatient.name,
      age: parseInt(editedPatient.age) || 0,
      gender: editedPatient.gender,
      bloodType: editedPatient.bloodType,
    });
  };

  // --- Routing
  if (currentView === "login") {
    return (
      <LoginPage
        onAmbulanceLogin={(id) => {
          setCurrentAmbulanceId(id);
          setCurrentView("ambulance");
        }}
        onHospitalLogin={(id) => {
          setCurrentHospitalId(id);
          setCurrentView("hospital");
        }}
      />
    );
  }

  if (currentView === "hospital" && currentHospitalId) {
    return (
      <HospitalDashboard
        hospitalId={currentHospitalId}
        onLogout={() => setCurrentView("login")}
        onSwitchHospital={(id) => setCurrentHospitalId(id)}
      />
    );
  }

  // 🚑 Ambulance Dashboard
  return (
    <div className="h-screen bg-background p-4 flex flex-col">
      <div className="max-w-[1600px] mx-auto w-full flex-1 flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between mb-3">
          <Button variant="outline" onClick={handleLogout}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 p-2 bg-card rounded-lg border">
              <div className="text-right">
                <div className="text-sm font-medium">Ambulance ID: {currentAmbulanceId ?? "—"}</div>
                <div className="text-xs text-muted-foreground">Patient: {patient?.name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">📍 {ambulanceAddress}</div>
                <div className="text-xs text-muted-foreground italic">
                  Mode: {useTestLocation ? "🧪 Test Location" : "Live GPS"}
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* 🚩 Test Location Selector */}
        <div className="flex items-center gap-2 mb-4">
          <label className="text-sm font-medium">Test Location:</label>
          <select
            className="border rounded p-1 text-sm"
            onChange={(e) => {
              if (e.target.value === "live") {
                setUseTestLocation(false);
                return;
              }
              setUseTestLocation(true);
              const coords = e.target.value.split(",");
              setAmbulanceLocation({ lat: parseFloat(coords[0]), lng: parseFloat(coords[1]) });
            }}
          >
            <option value="live">🚑 Use Live GPS</option>
            <optgroup label="Main Chennai Areas">
              <option value="13.0521,80.2255">📍 Kodambakkam</option>
              <option value="13.0850,80.2101">📍 Anna Nagar</option>
              <option value="13.0418,80.2341">📍 T. Nagar</option>
              <option value="13.0368,80.2676">📍 Mylapore</option>
              <option value="13.0012,80.2565">📍 Adyar</option>
            </optgroup>
            <optgroup label="Outer/Non-Main Areas">
              <option value="12.9249,80.1000">📍 Tambaram</option>
              <option value="12.9516,80.1462">📍 Chromepet</option>
              <option value="12.9755,80.2207">📍 Velachery</option>
              <option value="12.9200,80.1920">📍 Medavakkam</option>
              <option value="12.9416,80.2362">📍 Thoraipakkam</option>
            </optgroup>
          </select>
        </div>

        {/* layout */}
        <div className="grid grid-cols-12 gap-4 flex-1 min-h-0">
          {/* left: patient info + vitals + prediction */}
          <div className="col-span-3 flex flex-col gap-2 min-h-0">
            {/* Patient Info + Edit Dialog */}
            <Dialog open={showPatientEditor} onOpenChange={setShowPatientEditor}>
              <div className="p-3 border rounded-lg bg-card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Patient Information</h3>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                </div>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {patient?.name ?? "—"}</p>
                  <p><strong>Age:</strong> {patient?.age ?? "—"}</p>
                  <p><strong>Gender:</strong> {patient?.gender ?? "Unknown"}</p>
                  <p><strong>Blood Type:</strong> {patient?.bloodType ?? "Unknown"}</p>
                </div>
              </div>

              <DialogContent className="sm:max-w-[320px]">
                <DialogHeader>
                  <DialogTitle>Edit Patient Info</DialogTitle>
                  <DialogDescription>Update patient details below.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-4">
                  <Input
                    placeholder="Name"
                    value={editedPatient.name}
                    onChange={(e) => setEditedPatient({ ...editedPatient, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Age"
                    value={editedPatient.age}
                    onChange={(e) => setEditedPatient({ ...editedPatient, age: e.target.value })}
                  />
                  <Input
                    placeholder="Gender"
                    value={editedPatient.gender}
                    onChange={(e) => setEditedPatient({ ...editedPatient, gender: e.target.value })}
                  />
                  <Input
                    placeholder="Blood Type"
                    value={editedPatient.bloodType}
                    onChange={(e) => setEditedPatient({ ...editedPatient, bloodType: e.target.value })}
                  />
                </div>

                <DialogFooter className="mt-6 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowPatientEditor(false)}>Cancel</Button>
                  <Button onClick={async () => { await handlePatientSave(); setShowPatientEditor(false); }}>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Vitals */}
            <div className="h-3/5">
              <VitalsPanel
                vitals={{
                  HR: vitals?.hr ?? 0,
                  SpO2: vitals?.spo2 ?? 0,
                  SBP: vitals?.sbp ?? 0,
                  DBP: vitals?.dbp ?? 0,
                  Temp: vitals?.temp ?? 0,
                  Glucose: vitals?.glucose ?? 0,
                  GCS: vitals?.gcs ?? 0,
                  lastUpdated: vitals?.updated_at ?? "",
                }}
                onVitalsUpdate={async (nv) => {
                  setVitals({
                    hr: nv.HR,
                    spo2: nv.SpO2,
                    sbp: nv.SBP,
                    dbp: nv.DBP,
                    temp: nv.Temp,
                    glucose: nv.Glucose,
                    gcs: nv.GCS,
                    updated_at: new Date().toISOString(),
                  });
                  await supabase.from("vitals").insert({
                    id: crypto.randomUUID(),
                    patient_id: patientId,
                    hr: nv.HR,
                    spo2: nv.SpO2,
                    sbp: nv.SBP,
                    dbp: nv.DBP,
                    temp: nv.Temp,
                    glucose: nv.Glucose,
                    gcs: nv.GCS,
                    updated_at: new Date().toISOString(),
                  });
                }}
                isLiveMode={!useTestLocation}
              />
            </div>

            <div className="h-2/5">
              <PredictedCondition prediction={prediction} isLoading={isPredicting} />
            </div>
          </div>

          {/* center: hospitals + map */}
          <div className="col-span-5 min-h-0">
            <HospitalMap
              hospitals={hospitals}
              selectedId={selectedHospitalId}
              onHospitalSelect={(h) => setSelectedHospitalId(h.Hospital_ID)}
              patientLocation={ambulanceLocation}
              ambulanceId={currentAmbulanceId ?? ""}
            />
          </div>

          {/* right: symptoms */}
          <div className="col-span-4 min-h-0">
            <SymptomsInput
              symptoms={symptoms}
              onSymptomsChange={setSymptoms}
              patientData={patient ?? undefined}
              vitals={{
                HR: vitals?.hr ?? 0,
                SpO2: vitals?.spo2 ?? 0,
                SBP: vitals?.sbp ?? 0,
                DBP: vitals?.dbp ?? 0,
                Temp: vitals?.temp ?? 0,
                Glucose: vitals?.glucose ?? 0,
                GCS: vitals?.gcs ?? 0,
              }}
              prediction={prediction ?? undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
