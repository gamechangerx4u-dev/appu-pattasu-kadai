import { Media } from '../models/Media.js';
import { getPublicApiUrl } from './publicUrl.js';

export function buildMediaUrl(req, mediaId) {
  return `${getPublicApiUrl(req)}/api/media/${mediaId}`;
}

export function toMediaBuffer(data) {
  if (!data) return null;
  if (Buffer.isBuffer(data)) return data;
  if (data.buffer) return Buffer.from(data.buffer);
  return Buffer.from(data);
}

export async function saveMedia({ kind, buffer, contentType, filename, replaceExisting = false }) {
  if (replaceExisting) {
    await Media.deleteMany({ kind });
  }

  const doc = await Media.create({
    kind,
    data: buffer,
    content_type: contentType || 'application/octet-stream',
    filename: filename || 'file',
  });

  return doc;
}

export async function getMediaById(mediaId) {
  return Media.findById(mediaId)
    .select('kind filename content_type data created_at')
    .lean();
}

export async function getLatestMediaByKind(kind) {
  return Media.findOne({ kind })
    .sort({ created_at: -1 })
    .select('kind filename content_type data created_at')
    .lean();
}
