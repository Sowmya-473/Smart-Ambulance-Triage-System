import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { MapPin, Phone, Star, Check, X } from "lucide-react";
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from "@react-google-maps/api";
import { supabase } from "../lib/supabaseClient";

type HospitalFromAPI = {
  Hospital_ID: string;
  Hospital_Name: string;
  distance: number;
  Contact_No?: string | null;
  Address?: string | null;
  Latitude: number | null;
  Longitude: number | null;
};

// ✅ Declare libraries constant outside to prevent re-renders
const libraries: ("places")[] = ["places"];

export function HospitalMap({
  hospitals = [],
  onHospitalSelect,
  selectedId,
  patientLocation = { lat: 13.0827, lng: 80.2707 },
  ambulanceId = "A1",
}: {
  hospitals?: HospitalFromAPI[];
  onHospitalSelect?: (h: HospitalFromAPI) => void;
  selectedId?: string | null;
  patientLocation?: { lat: number; lng: number };
  ambulanceId?: string;
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyC2-NfCnIT1DCZZgxS4aTgpZa_cYbI6ECw", // 🔑 Replace with your key
    libraries,
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [statuses, setStatuses] = useState<Record<string, "pending" | "accepted" | "rejected">>({});

  // ✅ sort hospitals safely
  const sorted = useMemo(
    () => [...(hospitals || [])].sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0)),
    [hospitals]
  );

  // 🔹 Fetch directions when hospital is selected
  useEffect(() => {
    if (!selectedId) {
      setDirections(null);
      return;
    }

    const hospital = hospitals?.find((h) => h.Hospital_ID === selectedId);
    if (!hospital || !hospital.Latitude || !hospital.Longitude) {
      setDirections(null);
      return;
    }

    const service = new google.maps.DirectionsService();
    service.route(
      {
        origin: patientLocation,
        destination: { lat: hospital.Latitude, lng: hospital.Longitude },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
        } else {
          console.error("❌ Directions request failed:", status);
        }
      }
    );
  }, [selectedId, hospitals, patientLocation]);

  // 🔹 Send hospital request
  const sendRequest = async (hospital: HospitalFromAPI) => {
    try {
      // ✅ 1. latest patient
      const { data: patient } = await supabase
        .from("patients")
        .select("id")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      // ✅ 2. latest prediction
     const { data: predData, error: predError } = await supabase
        .from("predictions")
        .select("prediction_id")
        .eq("ambulance_id", ambulanceId)
        .order("predicted_at", { ascending: false })
        .limit(1);

      if (predError) {
        console.error("❌ Error fetching prediction:", predError);
        return;
      }

      if (!predData || predData.length === 0) {
        console.error("⚠️ No prediction found for this ambulance");
        return;
      }

      const predictionId = predData[0].prediction_id; // ✅ safe

      // ✅ 3. ensure ambulance exists
      const { data: ambulance } = await supabase
        .from("ambulances")
        .select("ambulance_id")
        .eq("ambulance_id", ambulanceId)
        .maybeSingle();

      if (!ambulance) {
        alert(`❌ Ambulance ID ${ambulanceId} not found in system.`);
        return;
      }

      // ✅ 4. check if request already exists for prediction
      const { data: reqData, error: reqError } = await supabase
        .from("requests")
        .insert({
          ambulance_id: ambulanceId,
          hospital_id: hospital.Hospital_ID,
          patient_id: patientId,
          prediction_id: predictionId, // ✅ now defined
          status: "pending",
        })
        .select();

      if (reqError) {
        console.error("❌ Error inserting request:", reqError);
      } else {
        console.log("✅ Request inserted:", reqData);
      }

      // ✅ 5. insert new request
      const { error } = await supabase.from("requests").insert({
        id: crypto.randomUUID(),
        hospital_id: hospital.Hospital_ID,
        ambulance_id: ambulanceId,
        patient_id: patient?.id ?? null,
        prediction_id: prediction?.prediction_id ?? null,
        status: "pending",
        request_time: new Date().toISOString(),
      });

      if (error) {
        console.error("❌ Error inserting request:", error.message);
        alert("Unable to send request");
        return;
      }

      // update local UI status
      setStatuses((prev) => ({ ...prev, [hospital.Hospital_ID]: "pending" }));

      alert(`✅ Request sent to ${hospital.Hospital_Name}`);
    } catch (e) {
      console.error("❌ sendRequest exception:", e);
    }
  };

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <Card className="w-full h-full">
      <CardHeader className="flex justify-between items-center pb-3">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" /> Nearby Hospitals & Ambulance
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            List
          </Button>
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("map")}
          >
            Map
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-[28rem] overflow-y-auto">
        {/* LIST VIEW */}
        {viewMode === "list" &&
          sorted.map((h) => {
            const status = statuses[h.Hospital_ID];
            return (
              <div
                key={h.Hospital_ID}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedId === h.Hospital_ID
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground"
                }`}
                onClick={() => onHospitalSelect?.(h)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{h.Hospital_Name}</h4>
                    <p>
                      {(h.distance ?? 0).toFixed(2)} km • {h.Address || "No address available"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {h.Contact_No && (
                      <Button asChild variant="outline" size="sm">
                        <a href={`tel:${h.Contact_No}`}>
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </a>
                      </Button>
                    )}
                    <Button size="sm" onClick={() => sendRequest(h)}>
                      Request
                    </Button>
                    {status === "pending" && (
                      <span className="text-xs text-yellow-600 flex items-center gap-1">
                        ⏳ Pending
                      </span>
                    )}
                    {status === "accepted" && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Accepted
                      </span>
                    )}
                    {status === "rejected" && (
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <X className="h-3 w-3" /> Rejected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

        {/* MAP VIEW */}
        {viewMode === "map" && (
          <GoogleMap
            center={patientLocation}
            zoom={13}
            mapContainerStyle={{ width: "100%", height: "500px" }}
          >
            {/* 🚑 Ambulance Marker (Green) */}
            <Marker
              position={patientLocation}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                scaledSize: new google.maps.Size(40, 40),
              }}
            />

            {/* 🏥 Hospitals */}
            {sorted.map(
              (h) =>
                h.Latitude &&
                h.Longitude && (
                  <Marker
                    key={h.Hospital_ID}
                    position={{ lat: h.Latitude, lng: h.Longitude }}
                    label="🏥"
                    onClick={() => onHospitalSelect?.(h)}
                  />
                )
            )}

            {/* 🛣️ Route */}
            {directions && <DirectionsRenderer directions={directions} />}
          </GoogleMap>
        )}
      </CardContent>
    </Card>
  );
}
