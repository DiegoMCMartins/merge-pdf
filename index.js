const { PDFDocument } = require("pdf-lib");
const fsPromise = require('fs/promises');
const path = require("path");

const mergePDFs = async (pdfFilePath, pdfsToIncludePaths = []) => {
  const doc = await PDFDocument.create();

  const embededPDFs = await Promise.all([pdfFilePath, ...pdfsToIncludePaths].map(async pdfPath => {
    const buffer = await fsPromise.readFile(pdfPath);

    const [embeded] = await doc.embedPdf(buffer);

    return embeded;
  }));

  await Promise.all(embededPDFs.map(async embedPDF => {
    const page = doc.addPage();

    page.drawPage(embedPDF);
  }));

  const savedPDF = await doc.save();

  const mainPDFName = path.basename(pdfFilePath);

  await fsPromise.writeFile(path.resolve('generated', mainPDFName), savedPDF);
}

const start = async () => {
  const filesPath = path.resolve(__dirname, 'files');
  const includePath = path.resolve(__dirname, 'include')

  const [pdfFiles, pdfsToInclude] = await Promise.all([
    fsPromise.readdir(filesPath),
    fsPromise.readdir(includePath)
  ]);
  
  await Promise.all(pdfFiles.map(pdfFile => mergePDFs(path.resolve(filesPath, pdfFile), pdfsToInclude.map(pdfFile => path.resolve(includePath, pdfFile)))));
}

start();