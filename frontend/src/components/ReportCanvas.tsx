import React, { useState } from "react";
import { Button } from "./ui/button";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import {
  formatPatientName,
  formatMedicalCondition,
  formatDepartmentName,
  formatBloodType,
  formatGender,
  toTitleCase,
} from "../lib/textUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "./ui/dialog";

interface ReportCanvasProps {
  patientData: {
    id: string;
    name: string;
    age: number;
    gender: string;
    bloodType: string;
  };
  vitals: any;
  symptoms: string[];
  prediction: any;
}

function generateDefaultSummary(
  patientData: any,
  symptoms: string[],
  vitals: any,
  prediction: any
) {
  const symptomList =
    symptoms?.length ? symptoms.map(toTitleCase).join(", ") : "no reported symptoms";

  const vitalSummary = [
    vitals?.HR ? `heart rate of ${vitals.HR} bpm` : "",
    vitals?.SBP && vitals?.DBP ? `blood pressure of ${vitals.SBP}/${vitals.DBP} mmHg` : "",
    vitals?.SpO2 ? `SpO₂ of ${vitals.SpO2}%` : "",
    vitals?.Temp ? `temperature of ${vitals.Temp}°F` : "",
    vitals?.Glucose ? `glucose ${vitals.Glucose} mg/dL` : "",
    vitals?.GCS ? `Glasgow Coma Scale ${vitals.GCS}/15` : "",
  ]
    .filter(Boolean)
    .join(", ");

  return `The patient (${formatPatientName(patientData?.name)}, age ${patientData?.age}, gender ${formatGender(
    patientData?.gender
  )}, blood type ${formatBloodType(patientData?.bloodType)}) presents with ${symptomList}${
    vitalSummary ? ", with vital signs including " + vitalSummary : ""
  }.\n\nPredicted condition is ${formatMedicalCondition(
    prediction?.condition
  )} (${prediction?.confidence || "--"}% confidence). Immediate assessment and intervention are recommended.`;
}

export function ReportCanvas({
  patientData,
  vitals,
  symptoms,
  prediction,
}: ReportCanvasProps) {
  const [open, setOpen] = useState(false);

  const downloadReport = () => {
    const text = generateDefaultSummary(patientData, symptoms, vitals, prediction);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `emergency-report-${patientData?.id}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success("Report downloaded successfully");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Trigger button */}
      <DialogTrigger asChild>
        <Button className="w-full mt-2">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </DialogTrigger>

      {/* Popup (smaller, with internal scroll) */}
      <DialogContent
        className="
          sm:max-w-md w-[460px] max-w-[calc(100%-2rem)] 
          p-0 rounded-lg
        "
      >
        {/* Make the whole inside scrollable and cap height */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* Sticky header inside the scroll container */}
          <div className="sticky top-0 z-10 bg-white border-b">
            <DialogHeader className="px-5 py-3">
              <DialogTitle>Emergency Medical Report</DialogTitle>
              <DialogDescription>
                Auto-generated patient summary with vitals and predictions.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-6 text-sm text-gray-800 leading-relaxed">
            {/* Patient Info */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h3 className="font-semibold mb-2">Patient Information</h3>
              <p><strong>Name:</strong> {formatPatientName(patientData?.name)}</p>
              <p><strong>ID:</strong> {patientData?.id}</p>
              <p><strong>Age:</strong> {patientData?.age}</p>
              <p><strong>Gender:</strong> {formatGender(patientData?.gender)}</p>
              <p><strong>Blood Type:</strong> {formatBloodType(patientData?.bloodType)}</p>
            </div>

            {/* Symptoms */}
            <div className="bg-blue-50 rounded-lg p-4 border">
              <h3 className="font-semibold mb-2">Reported Symptoms</h3>
              {symptoms?.length ? (
                <ul className="list-disc pl-5 space-y-1">
                  {symptoms.map((s, i) => (
                    <li key={i}>{toTitleCase(s)}</li>
                  ))}
                </ul>
              ) : (
                <p>No symptoms reported</p>
              )}
            </div>

            {/* Vitals */}
            <div className="bg-green-50 rounded-lg p-4 border">
              <h3 className="font-semibold mb-2">Live Vital Signs</h3>
              <p>Heart Rate: {vitals?.HR || "N/A"} bpm</p>
              <p>Blood Pressure: {vitals?.SBP || "N/A"}/{vitals?.DBP || "N/A"} mmHg</p>
              <p>SpO₂: {vitals?.SpO2 || "N/A"}%</p>
              <p>Temperature: {vitals?.Temp || "N/A"}°F</p>
              <p>Glucose: {vitals?.Glucose || "N/A"} mg/dL</p>
              <p>GCS: {vitals?.GCS || "N/A"}/15</p>
            </div>

            {/* Prediction */}
            <div className="bg-purple-50 rounded-lg p-4 border">
              <h3 className="font-semibold mb-2">Predicted Analysis</h3>
              <p>
                <strong>Condition:</strong> {formatMedicalCondition(prediction?.condition)} (
                {prediction?.confidence || "--"}% confidence)
              </p>
              <p>
                <strong>Department:</strong> {formatDepartmentName(prediction?.department)}
              </p>
              <p><strong>Urgency:</strong> Critical - Immediate Care</p>
            </div>

            {/* Clinical Summary */}
            <div className="bg-amber-50 rounded-lg p-4 border">
              <h3 className="font-semibold mb-2">Clinical Summary & Next Steps</h3>
              <p className="whitespace-pre-line">
                {prediction?.summary?.trim()
                  ? prediction.summary
                  : generateDefaultSummary(patientData, symptoms, vitals, prediction)}
              </p>
            </div>

            {/* Sticky footer inside scroll container */}
            <div className="sticky bottom-0 bg-gray-50 border-t -mx-5 px-5 py-3 flex justify-center">
              <Button onClick={downloadReport} size="sm" className="px-4 py-1">
                <Download className="h-3 w-3 mr-1" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
