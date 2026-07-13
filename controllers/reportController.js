const PDFDocument = require('pdfkit');
const { Identity, BMI, BloodSugar } = require('../models');
const { apiResponse } = require('../middlewares/apiResponse');
const { calculateAge, hitungKesimpulan, buildSugarCriteria } = require('../utils/helpers');

const getUserIdFilter = (req) => req.user.role === 'admin' ? {} : { id_user: req.user.id };

exports.exportPDF = async (req, res) => {
  try {
    const { identityId } = req.params;
    const where = { id: identityId, ...getUserIdFilter(req) };
    const identity = await Identity.findOne({ where });
    if (!identity) return apiResponse(res, { error: 'Data tidak ditemukan', status: 404 });

    const bmiRow = await BMI.findOne({ where: { id_identity: identityId, status: 'current' }, order: [['id', 'DESC']] });
    const sugarRow = await BloodSugar.findOne({ where: { id_identity: identityId, status: 'current' }, order: [['id', 'DESC']] });

    const age = calculateAge(identity.birthdate) ?? bmiRow?.age ?? sugarRow?.age ?? null;
    const kes = hitungKesimpulan(Number(bmiRow?.weight), Number(identity.height));
    const sugarCriteria = buildSugarCriteria(sugarRow?.conclusion, sugarRow?.description) || null;

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pasien-${identityId}.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text('Laporan Hasil Pemeriksaan', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('Data Pasien', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Nama: ${identity.name || '-'}`);
    doc.text(`NIK: ${identity.nik || '-'}`);
    doc.text(`Tempat Lahir: ${identity.birthplace || '-'}`);
    doc.text(`Tanggal Lahir: ${identity.birthdate || '-'}`);
    doc.text(`Alamat: ${identity.address || '-'}`);
    doc.text(`Tinggi Badan: ${identity.height || '-'} cm`);
    doc.moveDown();
    doc.text(`Berat Badan: ${bmiRow?.weight || '-'} kg`);
    doc.text(`Usia: ${age ?? '-'} tahun`);
    doc.moveDown();

    doc.fontSize(14).text('Hasil IMT', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Skor IMT: ${kes?.bmi || '-'}`);
    doc.text(`Kategori: ${kes?.status || '-'}`);
    doc.moveDown();

    doc.fontSize(14).text('Hasil Gula Darah', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`Kriteria: ${sugarCriteria?.label || '-'}`);
    doc.text(`Keterangan: ${sugarCriteria?.description || '-'}`);

    doc.end();
  } catch (err) {
    return apiResponse(res, { error: err.message, status: 500 });
  }
};
