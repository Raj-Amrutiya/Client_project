// server/controllers/medicalRecordController.js
const MedicalRecord = require('../models/MedicalRecord');
const Prescription  = require('../models/Prescription');
const Doctor        = require('../models/Doctor');
const Patient       = require('../models/Patient');
const User          = require('../models/User');
const Appointment   = require('../models/Appointment');

const genPrescNo = () => 'RX' + Date.now().toString().slice(-8);

// POST /api/medical-records
exports.create = async (req, res) => {
  try {
    const { patient_id, appointment_id, chief_complaint, symptoms, diagnosis, treatment_plan,
            vital_bp, vital_pulse, vital_temp, vital_weight, vital_height, vital_spo2,
            follow_up_date, notes, medicines } = req.body;

    const doc = await Doctor.findOne({ user_id: req.user.id });
    if (!doc) return res.status(403).json({ success: false, message: 'Only doctors can create medical records' });

    const mr = await MedicalRecord.create({
      patient_id, doctor_id: doc._id, appointment_id: appointment_id || null,
      chief_complaint, symptoms, diagnosis, treatment_plan,
      vital_bp, vital_pulse, vital_temp, vital_weight, vital_height, vital_spo2,
      follow_up_date: follow_up_date || null, notes: notes || null
    });

    // Create prescription if medicines given
    if (medicines && medicines.length) {
      const prescNo = genPrescNo();
      const items = medicines.map(m => ({
        medicine_name: m.medicine_name, dosage: m.dosage,
        frequency: m.frequency, duration: m.duration,
        instructions: m.instructions || null, quantity: m.quantity || 1
      }));
      await Prescription.create({
        prescription_number: prescNo,
        medical_record_id: mr._id,
        patient_id, doctor_id: doc._id, items
      });
    }

    // Update appointment status
    if (appointment_id) {
      await Appointment.findByIdAndUpdate(appointment_id, {
        status: 'completed', follow_up_date: follow_up_date || null
      });
    }

    res.status(201).json({ success: true, message: 'Medical record created', id: mr._id });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/medical-records/:id
exports.getOne = async (req, res) => {
  try {
    const mr = await MedicalRecord.findById(req.params.id)
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } })
      .populate({ path: 'patient_id', select: 'user_id' });
    
    if (!mr) return res.status(404).json({ success: false, message: 'Not found' });

    // Access control: only admin, the doctor who created it, or the patient can view
    if (req.user.role !== 'admin') {
      if (req.user.role === 'doctor') {
        if (!mr.doctor_id._id.equals(req.user.id)) {
          const doc = await Doctor.findOne({ user_id: req.user.id });
          if (!doc || !doc._id.equals(mr.doctor_id._id)) {
            return res.status(403).json({ success: false, message: 'Access denied' });
          }
        }
      } else if (req.user.role === 'patient') {
        const pat = await Patient.findOne({ user_id: req.user.id });
        if (!pat || !pat._id.equals(mr.patient_id._id)) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }
      } else {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const prescriptions = await Prescription.find({ medical_record_id: mr._id });

    const obj = mr.toObject();
    obj.doctor_name    = mr.doctor_id?.user_id?.name || '';
    obj.specialization = mr.doctor_id?.specialization || '';
    obj.prescriptions  = prescriptions.map(p => {
      const po = p.toObject();
      po.medicines = p.items.map(i => ({
        medicine: i.medicine_name, dosage: i.dosage,
        frequency: i.frequency, duration: i.duration, quantity: i.quantity
      }));
      return po;
    });

    res.json({ success: true, data: obj });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/medical-records (get all for a patient - with access control)
exports.getAll = async (req, res) => {
  try {
    const { patient_id, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    let filter = {};

    // Access control
    if (req.user.role === 'patient') {
      const pat = await Patient.findOne({ user_id: req.user.id });
      if (!pat) return res.status(403).json({ success: false, message: 'Patient record not found' });
      filter.patient_id = pat._id;
    } else if (req.user.role === 'doctor') {
      const doc = await Doctor.findOne({ user_id: req.user.id });
      if (!doc) return res.status(403).json({ success: false, message: 'Doctor record not found' });
      filter.doctor_id = doc._id;
    } else if (req.user.role === 'admin') {
      // Admin can filter by patient_id if provided
      if (patient_id) filter.patient_id = patient_id;
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const records = await MedicalRecord.find(filter)
      .populate({ path: 'doctor_id', populate: { path: 'user_id', select: 'name' } })
      .sort({ created_at: -1 })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await MedicalRecord.countDocuments(filter);

    const data = records.map(r => {
      const obj = r.toObject();
      obj.doctor_name = r.doctor_id?.user_id?.name || '';
      return obj;
    });

    res.json({ success: true, data, total, page: Number(page), limit: Number(limit) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
