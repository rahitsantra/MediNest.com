from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import re
import json
import datetime
from typing import Dict, List, Tuple, Optional

app = Flask(__name__)
CORS(app)

class MedicalDatabase:
    def __init__(self):
        self.symptoms_database = {
            'fever': {'conditions': ['flu', 'cold', 'infection'], 'severity': 'medium'},
            'headache': {'conditions': ['migraine', 'tension', 'dehydration'], 'severity': 'low'},
            'chest_pain': {'conditions': ['heart_attack', 'angina', 'anxiety'], 'severity': 'high'},
            'cough': {'conditions': ['cold', 'flu', 'pneumonia'], 'severity': 'medium'},
            'shortness_of_breath': {'conditions': ['asthma', 'pneumonia', 'heart_failure'], 'severity': 'high'},
            'fatigue': {'conditions': ['anemia', 'depression', 'thyroid'], 'severity': 'low'},
            'dizziness': {'conditions': ['low_blood_pressure', 'dehydration', 'vertigo'], 'severity': 'medium'}
        }
        
        self.medications_database = {
            'flu': ['paracetamol', 'ibuprofen', 'rest', 'fluids'],
            'cold': ['decongestants', 'throat_lozenges', 'warm_water', 'rest'],
            'headache': ['aspirin', 'ibuprofen', 'rest', 'hydration'],
            'fever': ['paracetamol', 'ibuprofen', 'cooling_methods', 'fluids'],
            'cough': ['cough_syrup', 'honey', 'warm_liquids', 'humidifier']
        }
        
        self.emergency_symptoms = ['chest_pain', 'shortness_of_breath', 'severe_bleeding', 'unconsciousness']


class SymptomAnalyzer:
    def __init__(self, database: MedicalDatabase):
        self.database = database
        self.symptom_patterns = {
            r'(head\s*ache|headache)': 'headache',
            r'(fever|temperature|hot)': 'fever',
            r'(chest\s*pain|heart\s*pain)': 'chest_pain',
            r'(cough|coughing)': 'cough',
            r'(breath|breathing|breathe)': 'shortness_of_breath',
            r'(nausea|sick|vomit)': 'nausea',
            r'(tired|fatigue|exhausted)': 'fatigue',
            r'(dizzy|dizziness|lightheaded)': 'dizziness'
        }
    
    def extract_symptoms(self, text: str) -> List[str]:
        symptoms = []
        text_lower = text.lower()
        
        for pattern, symptom in self.symptom_patterns.items():
            if re.search(pattern, text_lower):
                symptoms.append(symptom)
        
        return list(set(symptoms))
    
    def analyze_severity(self, symptoms: List[str]) -> str:
        severity_levels = {'low': 1, 'medium': 2, 'high': 3}
        max_severity = 0
        
        for symptom in symptoms:
            if symptom in self.database.symptoms_database:
                severity = self.database.symptoms_database[symptom]['severity']
                max_severity = max(max_severity, severity_levels[severity])
        
        severity_map = {1: 'low', 2: 'medium', 3: 'high'}
        return severity_map[max_severity] if max_severity > 0 else 'low'


class DiagnosisEngine:
    def __init__(self, database: MedicalDatabase):
        self.database = database

    def generate_possible_conditions(self, symptoms: List[str]) -> Dict[str, int]:
        condition_scores = {}
        
        for symptom in symptoms:
            if symptom in self.database.symptoms_database:
                conditions = self.database.symptoms_database[symptom]['conditions']
                for condition in conditions:
                    condition_scores[condition] = condition_scores.get(condition, 0) + 1
        
        return dict(sorted(condition_scores.items(), key=lambda x: x[1], reverse=True))
    
    def get_treatment_recommendations(self, conditions: List[str]) -> List[str]:
        treatment = []
          
        for condition in conditions:
            if condition in self.database.medications_database:
                treatment.extend(self.database.medications_database[condition])
        
        return list(set(treatment))


class PatientRecord:
    def __init__(self, patient_id: str, name: str, age: int, gender: str):
        self.patient_id = patient_id
        self.name = name
        self.age = age
        self.gender = gender
        self.medical_history = []
        self.consultation_history = []
    
    def add_consultation(self, symptoms: List[str], diagnosis: Dict[str, int], 
                        treatments: List[str], severity: str):
        consultation = {
            'date': datetime.datetime.now().isoformat(),
            'symptoms': symptoms,
            'diagnosis': diagnosis,
            'treatments': treatments,
            'severity': severity
        }
        self.consultation_history.append(consultation)
    
    def get_recent_consultations(self, limit: int = 5) -> List[Dict]:
        return self.consultation_history[-limit:]


class EmergencyChecker:
    def __init__(self, database: MedicalDatabase):
        self.database = database

    def check_emergency(self, symptoms: List[str]) -> Tuple[bool, str]:
        for symptom in symptoms:
            if symptom in self.database.emergency_symptoms:
                return True, f"EMERGENCY: {symptom.replace('_', ' ')} requires immediate medical attention!"
        
        return False, "No immediate emergency detected."


class MedicalAI:
    def __init__(self):
        self.database = MedicalDatabase()
        self.symptom_analyzer = SymptomAnalyzer(self.database)
        self.diagnosis_engine = DiagnosisEngine(self.database)
        self.emergency_checker = EmergencyChecker(self.database)
        self.patients = {}

    def register_patient(self, patient_id: str, name: str, age: int, gender: str) -> bool:
        if patient_id not in self.patients:
            self.patients[patient_id] = PatientRecord(patient_id, name, age, gender)
            return True
        return False
    
    def diagnose(self, patient_id: str, symptom_description: str) -> Dict:
        if patient_id not in self.patients:
            return {"error": "Patient not registered"}
        
        patient = self.patients[patient_id]
        
        symptoms = self.symptom_analyzer.extract_symptoms(symptom_description)
        
        if not symptoms:
            return {"error": "No recognizable symptoms found"}
        
        is_emergency, emergency_message = self.emergency_checker.check_emergency(symptoms)
        severity = self.symptom_analyzer.analyze_severity(symptoms)
        possible_conditions = self.diagnosis_engine.generate_possible_conditions(symptoms)
        
        top_conditions = list(possible_conditions.keys())[:3]
        treatments = self.diagnosis_engine.get_treatment_recommendations(top_conditions)
        
        patient.add_consultation(symptoms, possible_conditions, treatments, severity)
        
        result = {
            "patient_name": patient.name,
            "symptoms_detected": symptoms,
            "severity": severity,
            "possible_conditions": possible_conditions,
            "recommended_treatments": treatments,
            "emergency": is_emergency,
            "emergency_message": emergency_message if is_emergency else None,
            "consultation_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        return result
    
    def get_patient_history(self, patient_id: str) -> Dict:
        if patient_id not in self.patients:
            return {"error": "Patient not found"}
        
        patient = self.patients[patient_id]
        return {
            "patient_info": {
                "id": patient.patient_id,
                "name": patient.name,
                "age": patient.age,
                "gender": patient.gender
            },
            "consultation_history": patient.get_recent_consultations()
        }


# Initialize the Medical AI system
medical_ai = MedicalAI()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/register', methods=['POST'])
def register_patient():
    data = request.json
    patient_id = data.get('patient_id') # type: ignore
    name = data.get('name') # type: ignore
    age = data.get('age') # type: ignore
    gender = data.get('gender') # type: ignore
    
    if medical_ai.register_patient(patient_id, name, age, gender):
        return jsonify({"success": True, "message": f"Patient {name} registered successfully!"})
    else:
        return jsonify({"success": False, "message": "Patient already exists!"}), 400


@app.route('/api/diagnose', methods=['POST'])
def diagnose():
    data = request.json
    patient_id = data.get('patient_id') # type: ignore
    symptoms = data.get('symptoms') # type: ignore
    
    result = medical_ai.diagnose(patient_id, symptoms)
    
    if "error" in result:
        return jsonify({"success": False, "error": result["error"]}), 400
    
    return jsonify({"success": True, "data": result})


@app.route('/api/history/<patient_id>', methods=['GET'])
def get_history(patient_id):
    history = medical_ai.get_patient_history(patient_id)
    
    if "error" in history:
        return jsonify({"success": False, "error": history["error"]}), 404
    
    return jsonify({"success": True, "data": history})


if __name__ == '__main__':
    app.run(debug=True, port=5000)