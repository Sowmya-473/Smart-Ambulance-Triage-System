from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from geopy.distance import geodesic
import requests
import tensorflow as tf
import numpy as np
import joblib, json, os
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch_geometric.nn import HypergraphConv

# -------------------------
# Flask App
# -------------------------
app = Flask(__name__)
CORS(app)

# -------------------------
# Supabase Setup
# -------------------------
SUPABASE_URL = "https://kzyvhvfvlfxvrisydsrl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6eXZodmZ2bGZ4dnJpc3lkc3JsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzg2MTM4NCwiZXhwIjoyMDczNDM3Mzg0fQ.Vwkb4af4vrh0GUUwH44jKwtvF7sU6hwzfW1aqZ3smP4"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# -------------------------
# ORS API
# -------------------------
ORS_API_KEY = "5b3ce3597851110001cf62485b716a7e823c469091cbc7ffcb430448"

# -------------------------
# Condition Prediction Model
# -------------------------
MODEL_PATH = "SymptomVitalsModel_multiinput.keras"
LE_PATH = "label_encoder (2).pkl"
SYM_PATH = "symptom_cols.json"
VIT_PATH = "vital_cols.json"

model = tf.keras.models.load_model(MODEL_PATH)
le = joblib.load(LE_PATH)
with open(SYM_PATH) as f:
    symptom_cols = json.load(f)
with open(VIT_PATH) as f:
    vital_cols = json.load(f)

# -------------------------
# HGNN Placeholder (not used yet)
# -------------------------
class HospitalHGNN(nn.Module):
    def __init__(self, in_dim, hidden_dim, out_dim):
        super().__init__()
        self.conv1 = HypergraphConv(in_dim, hidden_dim)
        self.conv2 = HypergraphConv(hidden_dim, out_dim)

    def forward(self, x, edge_index):
        h = F.relu(self.conv1(x, edge_index))
        h = self.conv2(h, edge_index)
        return h

# -------------------------
# Helpers
# -------------------------
def calculate_score(hospital, condition, patient_location):
    dist_km = geodesic(patient_location, (hospital["Latitude"], hospital["Longitude"])).km
    distance_score = max(0, 10 - dist_km)
    emergency_score = 10 if hospital.get("Emergency_Care") == "Yes" else 0
    icu_beds = hospital.get("Beds_ICU", 0) or 0
    capacity_score = min(10, icu_beds / 10)
    specialty_score = 0
    if condition and hospital.get("Specialties"):
        if condition.lower() in hospital["Specialties"].lower():
            specialty_score = 15
    return distance_score + emergency_score + capacity_score + specialty_score

# -------------------------
# Routes
# -------------------------
@app.route("/", methods=["GET"])
def home():
    return "🚑 API is running. Use POST /predict or /predict_and_match"

@app.route("/schema", methods=["GET"])
def schema():
    return jsonify({"symptom_cols": symptom_cols, "vital_cols": vital_cols})

from flask import send_file

@app.route("/symptom-cols", methods=["GET"])
def get_symptom_cols():
    return send_file("symptom_cols.json", mimetype="application/json")

@app.route("/predict", methods=["POST"])
def predict():
    """
    Input: {"symptoms": ["fever","fatigue"], "vitals": {"HR":120, "SpO2":90}}
    """
    data = request.get_json()
    symptoms = data.get("symptoms", [])
    vitals = data.get("vitals", {})

    # Build vectors
    sym_vec = [1 if s in symptoms else 0 for s in symptom_cols]
    vit_vec = [vitals.get(c, 0) for c in vital_cols]

    Xsym = np.array(sym_vec).reshape(1, -1)
    Xvit = np.array(vit_vec).reshape(1, -1)

    probs = model.predict([Xsym, Xvit], verbose=0)[0]
    top_idx = np.argmax(probs)
    condition = le.inverse_transform([top_idx])[0]
    confidence = float(probs[top_idx])

    return jsonify({
        "condition": condition,
        "confidence": round(confidence * 100, 2),
        "severity": "medium",
        "department": "General Medicine",
        "recommendations": None,
        "timeToTreat": None
    })

@app.route("/match_hospitals", methods=["POST"])
def match_hospitals():
    data = request.json
    condition = data.get("condition")
    patient_location = tuple(data.get("location"))

    # Domain lookup
    domain_resp = supabase.table("disease_domain").select("Domain").eq("Disease", condition.lower()).execute()
    domain = domain_resp.data[0]["Domain"] if domain_resp.data else None

    # Facilities lookup
    required_facilities = []
    if domain:
        req_facilities_resp = supabase.table("domain_facility_requirements").select("MinimumFacilities").eq("Domain", domain).execute()
        if req_facilities_resp.data:
            facilities_str = req_facilities_resp.data[0]["MinimumFacilities"]
            required_facilities = facilities_str.split(";") if facilities_str else []

    # Hospitals
    response = supabase.table("hospitals").select("*").execute()
    hospitals = response.data or []

    ranked_list = []
    for h in hospitals:
        if not h.get("Latitude") or not h.get("Longitude"):
            continue
        h["distance"] = geodesic(patient_location, (h["Latitude"], h["Longitude"])).km
        score = calculate_score(h, condition, patient_location)

        # Penalize for missing facilities
        hospital_facilities = h.get("Facilities", "").lower()
        for f in required_facilities:
            if f.lower() not in hospital_facilities:
                score -= 3

        h["score"] = score
        ranked_list.append(h)

    ranked = sorted(ranked_list, key=lambda x: x["score"], reverse=True)[:5]
    return jsonify(ranked)

@app.route("/predict_and_match", methods=["POST"])
def predict_and_match():
    """
    Input: {"symptoms": ["fever"], "vitals": {"HR":120}, "location": [13.05, 80.22]}
    """
    data = request.json
    symptoms = data.get("symptoms", [])
    vitals = data.get("vitals", {})
    patient_location = tuple(data.get("location", []))

    if not patient_location:
        return jsonify({"error": "Location is required"}), 400

    # Predict condition
    sym_vec = [1 if s in symptoms else 0 for s in symptom_cols]
    vit_vec = [vitals.get(c, 0) for c in vital_cols]
    Xsym = np.array(sym_vec).reshape(1, -1)
    Xvit = np.array(vit_vec).reshape(1, -1)

    probs = model.predict([Xsym, Xvit], verbose=0)[0]
    top_idx = np.argmax(probs)
    condition = le.inverse_transform([top_idx])[0]
    confidence = float(probs[top_idx])

    # Match hospitals
    domain_resp = supabase.table("disease_domain").select("Domain").eq("Disease", condition.lower()).execute()
    domain = domain_resp.data[0]["Domain"] if domain_resp.data else None

    required_facilities = []
    if domain:
        req_facilities_resp = supabase.table("domain_facility_requirements").select("MinimumFacilities").eq("Domain", domain).execute()
        if req_facilities_resp.data:
            facilities_str = req_facilities_resp.data[0]["MinimumFacilities"]
            required_facilities = facilities_str.split(";") if facilities_str else []

    response = supabase.table("hospitals").select("*").execute()
    hospitals = response.data or []
    ranked_list = []
    for h in hospitals:
        if not h.get("Latitude") or not h.get("Longitude"):
            continue
        h["distance"] = geodesic(patient_location, (h["Latitude"], h["Longitude"])).km
        score = calculate_score(h, condition, patient_location)
        hospital_facilities = h.get("Facilities", "").lower()
        for f in required_facilities:
            if f.lower() not in hospital_facilities:
                score -= 3
        h["score"] = score
        ranked_list.append(h)

    ranked = sorted(ranked_list, key=lambda x: x["score"], reverse=True)[:5]

    return jsonify({
        "condition": condition,
        "confidence": round(confidence * 100, 2),
        "hospitals": ranked
    })

@app.route("/get_route", methods=["POST"])
def get_route():
    data = request.json
    start = data.get("start")
    end = data.get("end")
    if not start or not end:
        return jsonify({"error": "Start and End coordinates required"}), 400

    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    headers = {"Authorization": ORS_API_KEY, "Content-Type": "application/json"}
    body = {"coordinates": [[start[1], start[0]], [end[1], end[0]]]}
    resp = requests.post(url, json=body, headers=headers)
    if resp.status_code != 200:
        return jsonify({"error": "ORS API failed", "details": resp.text}), 500
    return jsonify(resp.json())

# -------------------------
# Run
# -------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
