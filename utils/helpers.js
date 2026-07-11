const calculateAge = (birthdate) => {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
};

const hitungKesimpulan = (weight, heightCm) => {
  const heightM = heightCm / 100;
  const bmi = weight / (heightM * heightM);
  if (bmi < 17) return { bmi: bmi.toFixed(2), status: 'Sangat kurus' };
  if (bmi >= 17 && bmi < 18.5) return { bmi: bmi.toFixed(2), status: 'Kurus' };
  if (bmi >= 18.5 && bmi <= 25) return { bmi: bmi.toFixed(2), status: 'Normal' };
  if (bmi > 25 && bmi <= 27) return { bmi: bmi.toFixed(2), status: 'Gemuk' };
  return { bmi: bmi.toFixed(2), status: 'Obesitas' };
};

const hitungKriteriaGula = (age, sugarValue) => {
  const sugar = Number(sugarValue);
  if (!Number.isFinite(sugar)) return null;
  const ageFactor = Number(age) >= 50 ? 10 : 0;
  const batasNormal = 100 + ageFactor;
  if (sugar < 70) return { label: 'Rendah', colorClass: 'sugar-low', description: 'Kadar gula Anda rendah.' };
  if (sugar <= batasNormal) return { label: 'Normal', colorClass: 'sugar-normal', description: 'Kadar gula Anda normal.' };
  return { label: 'Tinggi', colorClass: 'sugar-high', description: 'Kadar gula Anda tinggi.' };
};

const buildSugarCriteria = (result, description) => {
  if (!result && !description) return null;
  const label = result || 'Tidak ada';
  const colorClass = label === 'Rendah' ? 'sugar-low' : label === 'Normal' ? 'sugar-normal' : label === 'Tinggi' ? 'sugar-high' : '';
  return { label, colorClass, description: description || '' };
};

const formatPatientResponse = (identity, bmiRow, sugarRow, kesimpulan, sugarCriteria) => {
  const safeIdentity = identity || {};
  const safeBmi = bmiRow || {};
  const age = calculateAge(safeIdentity.birthdate) ?? safeBmi.age ?? sugarRow?.age ?? null;
  const { bmi, status } = kesimpulan || {};
  return {
    id: safeIdentity.id,
    id_user: safeIdentity.id_user,
    nik: safeIdentity.nik ?? '',
    name: safeIdentity.name ?? '',
    height: safeIdentity.height ?? '',
    weight: safeBmi.weight ?? '',
    birthplace: safeIdentity.birthplace ?? '',
    birthdate: safeIdentity.birthdate ?? '',
    address: safeIdentity.address ?? '',
    age,
    bmi,
    result: status || null,
    bmi_status: safeBmi.status || null,
    sugarCriteria: sugarCriteria || buildSugarCriteria(sugarRow?.result, sugarRow?.conclusion),
    sugar_status: sugarRow?.status || null,
  };
};

const sendWhatsApp = async (phone, code) => {
  const apiUrl = process.env.WHATSAPP_API_URL;
  if (apiUrl) {
    const apiKey = process.env.WHATSAPP_API_KEY;
    const payload = { phone, message: `Kode verifikasi 2FA Anda: ${code}. Berlaku 5 menit.` };
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    await fetch(apiUrl, { method: 'POST', headers, body: JSON.stringify(payload) });
    return true;
  }
  return false;
};

module.exports = {
  calculateAge,
  hitungKesimpulan,
  hitungKriteriaGula,
  buildSugarCriteria,
  formatPatientResponse,
  sendWhatsApp,
};
