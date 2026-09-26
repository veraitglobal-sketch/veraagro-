import { BadRequestException } from '@nestjs/common';
import sharp = require('sharp');

/** Store self-contained, decoded images in PostgreSQL; never accept a phone's local file path. */
export async function durableImage(raw: string, signature = false): Promise<string> {
  if (typeof raw !== 'string' || raw.length > 2_500_000) throw new BadRequestException('Image is missing or too large (maximum 1.8 MB).');
  const match = /^data:image\/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(raw.trim());
  if (!match) throw new BadRequestException('Send the image contents as a data URL, not a local file path or remote link.');
  const input = Buffer.from(match[1], 'base64');
  if (!input.length || input.length > 1_800_000) throw new BadRequestException('Each image must be under 1.8 MB.');
  try {
    const image = sharp(input, { limitInputPixels: 20_000_000 }).rotate();
    const output = signature ? await image.png().toBuffer() : await image.flatten({ background: '#fff' }).jpeg({ quality: 85 }).toBuffer();
    if (output.length > 1_800_000) throw new Error('Image too large');
    return `data:image/${signature ? 'png' : 'jpeg'};base64,${output.toString('base64')}`;
  } catch {
    throw new BadRequestException('Invalid image or image too large. Take a smaller photo and retry.');
  }
}
