import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Building2, Ambulance, Truck, ChevronRight } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "../lib/supabaseClient";

interface LoginPageProps {
  onAmbulanceLogin: (ambulanceId: string) => void;
  onHospitalLogin: (hospitalId: string) => void;
}

export function LoginPage({ onAmbulanceLogin, onHospitalLogin }: LoginPageProps) {
  const [ambulanceId, setAmbulanceId] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [hospitals, setHospitals] = useState<
    { Hospital_ID: string; Hospital_Name: string; Address?: string | null }[]
  >([]);
  const [filteredHospitals, setFilteredHospitals] = useState<
    { Hospital_ID: string; Hospital_Name: string; Address?: string | null }[]
  >([]);

  // ✅ Fetch hospitals from Supabase
  useEffect(() => {
    const fetchHospitals = async () => {
      const { data, error } = await supabase
        .from("hospitals")
        .select("Hospital_ID, Hospital_Name, Address");

      if (error) {
        console.error("Error fetching hospitals", error);
      } else {
        setHospitals(data || []);
        setFilteredHospitals(data || []);
      }
    };
    fetchHospitals();
  }, []);

  // ✅ Autocomplete filter
  useEffect(() => {
    if (!searchQuery) {
      setFilteredHospitals([]);
    } else {
      setFilteredHospitals(
        hospitals.filter(
          (h) =>
            h.Hospital_Name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (h.Address || "").toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [searchQuery, hospitals]);

  // ✅ Ambulance login validation
  const handleAmbulanceLogin = async (id: string) => {
    if (!id) {
      alert("Please enter a valid Ambulance ID");
      return;
    }

    const { data, error } = await supabase
      .from("ambulances")
      .select("ambulance_id")
      .eq("ambulance_id", id)
      .maybeSingle();

    if (error) {
      console.error("Error checking ambulance", error);
      return;
    }

    if (!data) {
      await supabase.from("ambulances").insert({
        ambulance_id: id,
        status: "inactive",
        current_location_lat: null,
        current_location_lon: null,
        user_id: null,
      });
    }

    onAmbulanceLogin(id);
  };

  // ✅ Hospital login
  const handleHospitalLogin = () => {
    if (selectedHospital) {
      onHospitalLogin(selectedHospital);
    } else {
      alert("Please select a hospital first");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
              <Truck className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              MediRoute
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            AI-Powered Emergency Response and Hospital Routing
          </p>
        </div>

        {/* Login Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* 🚑 Ambulance Portal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Ambulance className="h-5 w-5 text-primary" /> Ambulance Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Label>Ambulance ID</Label>
              <Input
                type="text"
                placeholder="AMB-001"
                value={ambulanceId}
                onChange={(e) => setAmbulanceId(e.target.value)}
              />
              <Button onClick={() => handleAmbulanceLogin(ambulanceId)} disabled={!ambulanceId.trim()}>
                Launch Dashboard <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* 🏥 Hospital Portal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Building2 className="h-5 w-5 text-accent" /> Hospital Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Label>Search Hospital</Label>
              <Input
                type="text"
                placeholder="Type hospital name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {/* Suggestions */}
              {filteredHospitals.length > 0 && (
                <div className="border rounded-md bg-white shadow max-h-40 overflow-y-auto">
                  {filteredHospitals.map((h) => (
                    <div
                      key={h.Hospital_ID}
                      className="p-2 hover:bg-accent cursor-pointer"
                      onClick={() => {
                        setSelectedHospital(h.Hospital_ID);
                        setSearchQuery(h.Hospital_Name); // show name in input
                        setFilteredHospitals([]); // close dropdown
                      }}
                    >
                      <p className="font-medium">{h.Hospital_Name}</p>
                      <p className="text-xs text-muted-foreground">{h.Address || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
              <Button onClick={handleHospitalLogin} disabled={!selectedHospital}>
                Launch Portal <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
