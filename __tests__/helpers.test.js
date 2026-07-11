const {
  calculateAge,
  hitungKesimpulan,
  hitungKriteriaGula,
  buildSugarCriteria,
  formatPatientResponse,
} = require('../utils/helpers');

describe('calculateAge', () => {
  test('returns null for null input', () => {
    expect(calculateAge(null)).toBeNull();
  });

  test('returns null for invalid date', () => {
    expect(calculateAge('invalid')).toBeNull();
  });

  test('calculates correct age for past birthdate', () => {
    const today = new Date();
    const birthdate = `${today.getFullYear() - 25}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(calculateAge(birthdate)).toBe(25);
  });

  test('returns correct age when birthday not yet passed this year', () => {
    const today = new Date();
    const futureMonth = today.getMonth() + 2;
    const birthdate = `${today.getFullYear() - 20}-${String(futureMonth > 12 ? futureMonth - 12 : futureMonth).padStart(2, '0')}-01`;
    const age = calculateAge(birthdate);
    expect(age).toBe(19);
  });
});

describe('hitungKesimpulan', () => {
  test('returns Sangat kurus for BMI < 17', () => {
    const result = hitungKesimpulan(40, 170);
    expect(result.status).toBe('Sangat kurus');
  });

  test('returns Kurus for BMI 17-18.5', () => {
    const result = hitungKesimpulan(50, 170);
    expect(result.status).toBe('Kurus');
  });

  test('returns Normal for BMI 18.5-25', () => {
    const result = hitungKesimpulan(65, 170);
    expect(result.status).toBe('Normal');
  });

  test('returns Gemuk for BMI 25-27', () => {
    const result = hitungKesimpulan(78, 170);
    expect(result.status).toBe('Gemuk');
  });

  test('returns Obesitas for BMI > 27', () => {
    const result = hitungKesimpulan(90, 170);
    expect(result.status).toBe('Obesitas');
  });

  test('returns bmi as string with 2 decimal places', () => {
    const result = hitungKesimpulan(65, 170);
    expect(result.bmi).toMatch(/^\d+\.\d{2}$/);
  });
});

describe('hitungKriteriaGula', () => {
  test('returns null for non-finite input', () => {
    expect(hitungKriteriaGula(30, 'abc')).toBeNull();
  });

  test('returns Rendah for sugar < 70', () => {
    const result = hitungKriteriaGula(30, 60);
    expect(result.label).toBe('Rendah');
    expect(result.colorClass).toBe('sugar-low');
  });

  test('returns Normal for sugar 70-100 (age < 50)', () => {
    const result = hitungKriteriaGula(30, 90);
    expect(result.label).toBe('Normal');
    expect(result.colorClass).toBe('sugar-normal');
  });

  test('returns Normal for sugar 70-110 (age >= 50)', () => {
    const result = hitungKriteriaGula(55, 105);
    expect(result.label).toBe('Normal');
    expect(result.colorClass).toBe('sugar-normal');
  });

  test('returns Tinggi for sugar > threshold (age < 50)', () => {
    const result = hitungKriteriaGula(30, 120);
    expect(result.label).toBe('Tinggi');
    expect(result.colorClass).toBe('sugar-high');
  });

  test('returns Tinggi for sugar > 110 (age >= 50)', () => {
    const result = hitungKriteriaGula(55, 115);
    expect(result.label).toBe('Tinggi');
    expect(result.colorClass).toBe('sugar-high');
  });
});

describe('buildSugarCriteria', () => {
  test('returns null when both result and description are falsy', () => {
    expect(buildSugarCriteria(null, null)).toBeNull();
    expect(buildSugarCriteria('', '')).toBeNull();
  });

  test('returns correct criteria for Rendah', () => {
    const result = buildSugarCriteria('Rendah', 'Kadar gula rendah');
    expect(result.label).toBe('Rendah');
    expect(result.colorClass).toBe('sugar-low');
    expect(result.description).toBe('Kadar gula rendah');
  });

  test('returns correct criteria for Normal', () => {
    const result = buildSugarCriteria('Normal', 'Kadar gula normal');
    expect(result.label).toBe('Normal');
    expect(result.colorClass).toBe('sugar-normal');
  });

  test('returns correct criteria for Tinggi', () => {
    const result = buildSugarCriteria('Tinggi', 'Kadar gula tinggi');
    expect(result.label).toBe('Tinggi');
    expect(result.colorClass).toBe('sugar-high');
  });

  test('uses defaults for missing values', () => {
    const result = buildSugarCriteria(null, 'some desc');
    expect(result.label).toBe('Tidak ada');
    expect(result.description).toBe('some desc');
  });
});

describe('formatPatientResponse', () => {
  test('returns safe defaults for null inputs', () => {
    const result = formatPatientResponse(null, null, null, null, null);
    expect(result.id).toBeUndefined();
    expect(result.nik).toBe('');
    expect(result.name).toBe('');
    expect(result.age).toBeNull();
  });

  test('formats patient with identity and BMI data', () => {
    const identity = { id: 1, id_user: 1, nik: '123', name: 'Test', height: 170, birthdate: '2000-01-01', birthplace: 'Jakarta', address: 'Jl. Test' };
    const bmiRow = { weight: 65, age: 24, status: 'current' };
    const kesimpulan = { bmi: '22.49', status: 'Normal' };
    const result = formatPatientResponse(identity, bmiRow, null, kesimpulan, null);
    expect(result.id).toBe(1);
    expect(result.name).toBe('Test');
    expect(result.bmi).toBe('22.49');
    expect(result.result).toBe('Normal');
    expect(result.weight).toBe(65);
  });
});
