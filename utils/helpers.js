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
    sugarCriteria: sugarCriteria || buildSugarCriteria(sugarRow?.conclusion, sugarRow?.description),
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

const hitungRisikoKesehatan = (bmiResult, sugarCriteria, age) => {
  let score = 0;
  const reasons = [];

  if (bmiResult) {
    const bmi = parseFloat(bmiResult.bmi);
    if (bmiResult.status === 'Sangat kurus') { score += 3; reasons.push('BMI sangat kurus'); }
    else if (bmiResult.status === 'Kurus') { score += 1; reasons.push('BMI kurus'); }
    else if (bmiResult.status === 'Gemuk') { score += 2; reasons.push('BMI gemuk'); }
    else if (bmiResult.status === 'Obesitas') { score += 4; reasons.push('BMI obesitas'); }
  }

  if (sugarCriteria) {
    if (sugarCriteria.label === 'Tinggi') { score += 3; reasons.push('Gula darah tinggi'); }
    else if (sugarCriteria.label === 'Rendah') { score += 2; reasons.push('Gula darah rendah'); }
  }

  if (age && age >= 50) { score += 1; reasons.push('Usia >= 50 tahun'); }
  if (age && age >= 65) { score += 1; reasons.push('Usia >= 65 tahun'); }

  let level = 'rendah';
  if (score >= 5) level = 'tinggi';
  else if (score >= 3) level = 'sedang';

  return { score, level, reasons };
};

const analisisTren = (bmiHistory, sugarHistory, heightCm) => {
  const bmiTrend = bmiHistory.map((row) => {
    const heightM = Number(heightCm) / 100;
    const bmi = Number(row.weight) / (heightM * heightM);
    return {
      date: row.createdAt,
      weight: Number(row.weight),
      bmi: parseFloat(bmi.toFixed(2)),
      status: row.result,
    };
  });

  const sugarTrend = sugarHistory.map((row) => ({
    date: row.createdAt,
    conclusion: row.conclusion,
    age: row.age,
  }));

  let bmiDirection = 'stable';
  if (bmiTrend.length >= 2) {
    const first = bmiTrend[0].bmi;
    const last = bmiTrend[bmiTrend.length - 1].bmi;
    const diff = last - first;
    if (diff > 1) bmiDirection = 'increasing';
    else if (diff < -1) bmiDirection = 'decreasing';
  }

  let sugarDirection = 'stable';
  const sugarMap = { Rendah: -1, Normal: 0, Tinggi: 1 };
  if (sugarTrend.length >= 2) {
    const firstVal = sugarMap[sugarTrend[0].conclusion] ?? 0;
    const lastVal = sugarMap[sugarTrend[sugarTrend.length - 1].conclusion] ?? 0;
    if (lastVal > firstVal) sugarDirection = 'worsening';
    else if (lastVal < firstVal) sugarDirection = 'improving';
  }

  return {
    bmi: { direction: bmiDirection, dataPoints: bmiTrend.length, data: bmiTrend },
    bloodSugar: { direction: sugarDirection, dataPoints: sugarTrend.length, data: sugarTrend },
  };
};

const evalBloodPressure = (systolic, diastolic) => {
  const sys = Number(systolic);
  const dia = Number(diastolic);
  if (!Number.isFinite(sys) || !Number.isFinite(dia)) return null;

  if (sys < 90 || dia < 60) {
    return { label: 'Rendah', colorClass: 'sugar-low', description: 'Tekanan darah Anda rendah (hipotensi).' };
  }
  if (sys <= 120 && dia <= 80) {
    return { label: 'Normal', colorClass: 'sugar-normal', description: 'Tekanan darah Anda normal.' };
  }
  if (sys <= 129 && dia <= 80) {
    return { label: 'Elevated', colorClass: 'sugar-normal', description: 'Tekanan darah sedikit tinggi (elevated).' };
  }
  if (sys <= 139 || dia <= 89) {
    return { label: 'Tinggi Stage 1', colorClass: 'sugar-high', description: 'Tekanan darah tinggi stage 1 (hipertensi).' };
  }
  if (sys <= 180 || dia <= 120) {
    return { label: 'Tinggi Stage 2', colorClass: 'sugar-high', description: 'Tekanan darah tinggi stage 2 (hipertensi berat).' };
  }
  return { label: 'Krisis', colorClass: 'sugar-high', description: 'Tekanan darah sangat tinggi! Segera cari pertolongan medis.' };
};

const evalHeartRate = (bpm, age) => {
  const rate = Number(bpm);
  if (!Number.isFinite(rate)) return null;

  const isChild = age && age < 12;
  const isInfant = age && age < 1;

  let normalLow, normalHigh;
  if (isInfant) { normalLow = 100; normalHigh = 160; }
  else if (isChild) { normalLow = 70; normalHigh = 120; }
  else { normalLow = 60; normalHigh = 100; }

  if (rate < normalLow) {
    return { label: 'Rendah (Bradikardia)', colorClass: 'sugar-low', description: `Detak jantung rendah: ${rate} bpm (normal: ${normalLow}-${normalHigh}).` };
  }
  if (rate > normalHigh) {
    return { label: 'Tinggi (Takikardia)', colorClass: 'sugar-high', description: `Detak jantung tinggi: ${rate} bpm (normal: ${normalLow}-${normalHigh}).` };
  }
  return { label: 'Normal', colorClass: 'sugar-normal', description: `Detak jantung normal: ${rate} bpm.` };
};

const evalTemperature = (celsius) => {
  const temp = Number(celsius);
  if (!Number.isFinite(temp)) return null;

  if (temp < 35.0) {
    return { label: 'Rendah (Hipotermia)', colorClass: 'sugar-low', description: `Suhu tubuh rendah: ${temp}C (normal: 36.1-37.2C).` };
  }
  if (temp <= 37.2) {
    return { label: 'Normal', colorClass: 'sugar-normal', description: `Suhu tubuh normal: ${temp}C.` };
  }
  if (temp <= 38.0) {
    return { label: 'Sedikit Demam', colorClass: 'sugar-normal', description: `Suhu sedikit tinggi: ${temp}C (demam ringan).` };
  }
  if (temp <= 39.0) {
    return { label: 'Demam', colorClass: 'sugar-high', description: `Demam: ${temp}C. Perlu istirahat dan minum banyak air.` };
  }
  return { label: 'Demam Tinggi', colorClass: 'sugar-high', description: `Demam tinggi: ${temp}C. Segera konsultasi ke dokter.` };
};

const evalSpO2 = (percent) => {
  const val = Number(percent);
  if (!Number.isFinite(val)) return null;

  if (val < 90) {
    return { label: 'Kritis', colorClass: 'sugar-high', description: `Saturasi oksigen sangat rendah: ${val}%. Segera cari pertolongan medis!` };
  }
  if (val < 95) {
    return { label: 'Rendah', colorClass: 'sugar-high', description: `Saturasi oksigen rendah: ${val}% (normal: 95-100%).` };
  }
  return { label: 'Normal', colorClass: 'sugar-normal', description: `Saturasi oksigen normal: ${val}%.` };
};

const evalRespiratoryRate = (rate, age) => {
  const val = Number(rate);
  if (!Number.isFinite(val)) return null;

  const isChild = age && age < 12;
  const isInfant = age && age < 1;

  let normalLow, normalHigh;
  if (isInfant) { normalLow = 30; normalHigh = 60; }
  else if (isChild) { normalLow = 18; normalHigh = 30; }
  else { normalLow = 12; normalHigh = 20; }

  if (val < normalLow) {
    return { label: 'Rendah (Bradipnea)', colorClass: 'sugar-low', description: `Frekuensi pernapasan rendah: ${val}/menit (normal: ${normalLow}-${normalHigh}).` };
  }
  if (val > normalHigh) {
    return { label: 'Tinggi (Takipnea)', colorClass: 'sugar-high', description: `Frekuensi pernapasan tinggi: ${val}/menit (normal: ${normalLow}-${normalHigh}).` };
  }
  return { label: 'Normal', colorClass: 'sugar-normal', description: `Frekuensi pernapasan normal: ${val}/menit.` };
};

module.exports = {
  calculateAge,
  hitungKesimpulan,
  hitungKriteriaGula,
  buildSugarCriteria,
  formatPatientResponse,
  sendWhatsApp,
  hitungRisikoKesehatan,
  analisisTren,
  evalBloodPressure,
  evalHeartRate,
  evalTemperature,
  evalSpO2,
  evalRespiratoryRate,
};
