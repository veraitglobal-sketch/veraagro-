const RESUME_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_RESUMES: ReadonlyArray<{
  mime: string;
  checkMagic: (b: Buffer) => boolean;
}> = [
  {
    mime: 'application/pdf',
    checkMagic: (b) => b.length >= 5 && b.subarray(0, 5).toString('utf8') === '%PDF-',
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    checkMagic: (b) => b.length >= 4 && b.readUInt32LE(0) === 0x04034b50,
  },
  {
    mime: 'application/msword',
    checkMagic: (b) =>
      b.length >= 8 && b.subarray(0, 8).toString('hex').toLowerCase() === 'd0cf11e0a1b11ae1',
  },
];

export function sanitizeResumeFilename(raw: string): string | null {
  const stripped = raw.replace(/^.*[/\\]/, '').trim().slice(0, 180);
  if (!stripped || stripped.includes('..')) return null;
  const lower = stripped.toLowerCase();
  const hasOkExt =
    lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx');
  if (!hasOkExt) return null;
  return stripped;
}

export function parseResumeFromBase64(
  base64: string | undefined,
  fileNameRaw: string | undefined,
  mimeRaw: string | undefined,
): { error: string } | { filename: string; buffer: Buffer; contentType: string } {
  if (!base64 || !fileNameRaw) {
    return { error: 'Resume (CV) is required.' };
  }
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64.replace(/\s+/g, ''), 'base64');
  } catch {
    return { error: 'Invalid resume file encoding.' };
  }
  if (buffer.length < 64) return { error: 'Resume file is empty or corrupted.' };
  if (buffer.length > RESUME_MAX_BYTES) return { error: 'Resume exceeds maximum size (5 MB).' };

  const filename = sanitizeResumeFilename(fileNameRaw);
  if (!filename) {
    return { error: 'Use a PDF or Word file (.pdf, .doc, .docx).' };
  }

  const mimeFromClient = mimeRaw?.toLowerCase().trim();
  let rule = ALLOWED_RESUMES.find((r) => r.mime === mimeFromClient);

  const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
  if (!rule) {
    if (ext === '.pdf') rule = ALLOWED_RESUMES[0];
    else if (ext === '.docx') rule = ALLOWED_RESUMES[1];
    else if (ext === '.doc') rule = ALLOWED_RESUMES[2];
  }
  if (!rule) return { error: 'Invalid file type. Use PDF or Word (.pdf, .doc, .docx).' };

  if (!rule.checkMagic(buffer)) return { error: 'File content does not match the selected format.' };

  return { filename, buffer, contentType: rule.mime };
}
