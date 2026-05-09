/**
 * @param headers 
 * @param data  anfrom backend
 * @param filename strting
 * @return void save file to download directory or else someone reviewer/approver/applicant would choose
 */

export const downloadDocument=(headers:any, data:any, filename:string) =>{
    const mimeType = String(headers['content-type'] || 'application/octet-stream');
    const url = URL.createObjectURL(new Blob([data], { type: mimeType }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

}