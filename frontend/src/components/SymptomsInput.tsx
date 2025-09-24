import { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import { X, Plus, Search } from "lucide-react";
import { ReportCanvas } from "./ReportCanvas";


interface SymptomsInputProps {
  symptoms: string[];
  onSymptomsChange: (symptoms: string[]) => void;
  patientData?: any;
  vitals?: any;
  prediction?: any;
}

// Pre-made full list
import allSymptoms from "../symptom_cols.json"; // ✅ move your JSON into /src/backend or /public

// Fuzzy search (unchanged)
function fuzzySearch(query: string, symptoms: string[]): string[] {
  if (!query.trim()) return symptoms.slice(0, 5);
  const queryLower = query.toLowerCase().trim();
  return symptoms.filter((s) => s.toLowerCase().includes(queryLower));
}

export function SymptomsInput({
  symptoms,
  onSymptomsChange,
  patientData,
  vitals,
  prediction,
}: SymptomsInputProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered symptoms list
  const filteredSymptoms = useMemo(() => {
    const results = fuzzySearch(searchQuery, allSymptoms);
    return results.filter((s) => !symptoms.includes(s));
  }, [searchQuery, symptoms]);

  const addSymptom = (symptom: string) => {
    if (symptom.trim() && !symptoms.includes(symptom.trim())) {
      onSymptomsChange([...symptoms, symptom.trim()]);
      setSearchQuery(""); // reset search
    }
  };

  const removeSymptom = (symptom: string) => {
    onSymptomsChange(symptoms.filter((s) => s !== symptom));
  };

  const displayedSymptoms = searchQuery.trim()
    ? filteredSymptoms.slice(0, 15)
    : filteredSymptoms.slice(0, 5);

  return (
    <div className="h-full bg-card border rounded-lg flex flex-col">
      {/* Header */}
      <div className="p-3 pb-2 border-b">
        <h3 className="text-base font-medium flex items-center gap-2">
          <Search className="h-4 w-4" />
          Symptoms
        </h3>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b flex gap-2">
        <Input
          placeholder="Search or type symptoms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-sm"
        />
        <Button size="sm" onClick={() => addSymptom(searchQuery)}>
          Add
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 overflow-hidden" style={{ minHeight: "500px" }}>
        <ScrollArea className="h-full">
          {/* Selected Symptoms */}
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium text-muted-foreground">
              Selected Symptoms ({symptoms.length})
            </p>
            {symptoms.map((symptom, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-primary/10 rounded-md border"
              >
                <span className="text-sm">{symptom}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeSymptom(symptom)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {symptoms.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No symptoms selected
              </p>
            )}
          </div>

          {/* Available Symptoms */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Available Symptoms{" "}
              {searchQuery.trim() ? (
                <span className="text-blue-600">
                  ({filteredSymptoms.length} matches)
                </span>
              ) : (
                <span className="text-muted-foreground">
                  (showing 5 of {allSymptoms.length - symptoms.length}, search
                  to see more)
                </span>
              )}
            </p>
            <div className="space-y-2">
              {displayedSymptoms.map((symptom) => (
                <Button
                  key={symptom}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-auto p-2 text-left text-xs"
                  onClick={() => addSymptom(symptom)}
                >
                  <Plus className="h-3 w-3 mr-2 flex-shrink-0" />
                  {symptom}
                </Button>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Footer with ReportCanvas */}
      <div className="p-3 pt-2 border-t space-y-2">
        <div className="text-xs text-muted-foreground">
          {symptoms.length} symptom(s) selected
        </div>
        <ReportCanvas
          patientData={patientData}
          vitals={vitals}
          symptoms={symptoms}
          prediction={prediction}
        />
      </div>
    </div>
  );
}
