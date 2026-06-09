declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PDFData {
    numpages: number
    numrender: number
    info: Record<string, unknown>
    metadata: unknown
    text: string
    version: string
  }
  function pdfParse(data: Buffer): Promise<PDFData>
  export = pdfParse
}
