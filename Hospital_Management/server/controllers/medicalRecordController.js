// server/controllers/medicalRecordController.js
const { query, single } = require('../config/db');

const genPrescNo = () => 'RX' + Date.now().toString().slice(-8);

// POST /api/medical-records
exports.create = async (req, res) => {
  try {
    const { patient_id, appointment_id, chief_complaint, symptoms, diagnosis, treatment_plan,
            vital_bp, vital_pulse, vital_temp, vital_weight, vital_height, vital_spo2,
            follow_up_date, notes, medicines } = req.body;

    const doc = await single('SELECT id FROM doctors WHERE user_id=?', [req.user.id]);
    if (!doc) return res.status(403).json({ success: false, message: 'Only doctors can create medical records' });

    const [mrRes] = await query(
      `INSERT INTO medical_records (patient_id,doctor_id,appointment_id,chief_complaint,symptoms,diagnosis,
        treatment_plan,vital_bp,vital_pulse,vital_temp,vital_weight,vital_height,vital_spo2,follow_up_date,notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [patient_id,doc.id,appointment_id||null,chief_complaint,symptoms,diagnosis,treatment_plan,
       vital_bp,vital_pulse,vital_temp,vital_weight,vital_height,vital_spo2,follow_up_date||null,notes||null]);

    // Create prescription if medicines given
    if (medicines && medicines.length) {
      const prescNo = genPrescNo();
      const [pRes] = await query(
        'INSERT INTO prescriptions (prescription_number,medical_record_id,patient_id,doctor_id) VALUES (?,?,?,?)',
        [prescNo, mrRes.insertId, patient_id, doc.id]);
      for (const m of medicines) {
        await query('INSERT INTO prescription_items (prescription_id,medicine_name,dosage,frequency,duration,instructions,quantity) VALUES (?,?,?,?,?,?,?)',
          [pRes.insertId, m.medicine_name, m.dosage, m.frequency, m.duration, m.instructions||null, m.quantity||1]);
      }
    }

    // Update appointment status
    if (appointment_id) await query('UPDATE appointments SET status="completed", follow_up_date=? WHERE id=?', [follow_up_date||null, appointment_id]);

    res.status(201).json({ success: true, message: 'Medical record created', id: mrRes.insertId });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// GET /api/medical-records/:id
exports.getOne = async (req, res) => {
  try {
    const mr = await single(
      `SELECT mr.*, u.name AS doctor_name, d.specialization FROM medical_records mr
       JOIN doctors d ON d.id=mr.doctor_id JOIN users u ON u.id=d.user_id WHERE mr.id=?`, [req.params.id]);
    if (!mr) return res.status(404).json({ success: false, message: 'Not found' });
    const [prescriptions] = await query(
      `SELECT pr.*, JSON_ARRAYAGG(JSON_OBJECT('medicine',pi.medicine_name,'dosage',pi.dosage,'frequency',pi.frequency,'duration',pi.duration,'quantity',pi.quantity)) AS medicines
       FROM prescriptions pr JOIN prescription_items pi ON pi.prescription_id=pr.id WHERE pr.medical_record_id=? GROUP BY pr.id`, [req.params.id]);
    res.json({ success: true, data: { ...mr, prescriptions } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
