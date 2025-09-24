import { useState } from "react";

export function usePrediction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<any>(null);

  async function getPrediction(symptoms: string[], vitals: any) {
    setLoading(true);
    setError(null);

    try {
      // Convert symptoms into {symptomName: 1/0}
      const symptomsPayload: Record<string, number> = {};
      symptoms.forEach(s => { symptomsPayload[s] = 1; });

      const res = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: symptomsPayload,
          vitals
        })
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      setPrediction(data);
      return data;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { getPrediction, prediction, loading, error };
}
