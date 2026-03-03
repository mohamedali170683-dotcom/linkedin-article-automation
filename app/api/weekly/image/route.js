import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALL_ALLOWED_TYPES = [...IMAGE_TYPES, ...VIDEO_TYPES];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_NUMERIC_SLOTS = 3;

function extensionFromType(type) {
  const map = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
  };
  return map[type] || 'bin';
}

function isVideoType(type) {
  return VIDEO_TYPES.includes(type);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const weekNumber = parseInt(formData.get('weekNumber'), 10);
    const slotRaw = formData.get('slot');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type. Allowed: ${ALL_ALLOWED_TYPES.join(', ')}` }, { status: 400 });
    }

    const maxSize = isVideoType(file.type) ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json({ error: `File too large. Maximum ${maxSize / (1024 * 1024)}MB.` }, { status: 400 });
    }

    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 52) {
      return NextResponse.json({ error: 'Invalid week number (1-52)' }, { status: 400 });
    }

    // Support named slots (infographic, video) and numeric slots (0, 1, 2)
    const namedSlots = ['infographic', 'video'];
    let slotKey;

    if (namedSlots.includes(slotRaw)) {
      slotKey = slotRaw;
    } else {
      const numSlot = parseInt(slotRaw, 10);
      if (isNaN(numSlot) || numSlot < 0 || numSlot >= MAX_NUMERIC_SLOTS) {
        return NextResponse.json({ error: `Invalid slot. Use 0-${MAX_NUMERIC_SLOTS - 1} or: ${namedSlots.join(', ')}` }, { status: 400 });
      }
      slotKey = `slot-${numSlot}`;
    }

    // Delete existing file at this slot
    const prefix = `weekly-images/week-${weekNumber}-${slotKey}`;
    try {
      const { blobs } = await list({ prefix });
      for (const blob of blobs) {
        await del(blob.url);
      }
    } catch {}

    // Upload new file
    const ext = extensionFromType(file.type);
    const key = `${prefix}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const blob = await put(key, buffer, {
      access: 'public',
      contentType: file.type,
    });

    return NextResponse.json({
      success: true,
      image: {
        url: blob.url,
        slot: slotRaw,
        originalName: file.name || `file-${slotKey}.${ext}`,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { weekNumber, slot } = await request.json();

    if (!weekNumber || slot === undefined) {
      return NextResponse.json({ error: 'weekNumber and slot required' }, { status: 400 });
    }

    const namedSlots = ['infographic', 'video'];
    const slotKey = namedSlots.includes(slot) ? slot : `slot-${slot}`;

    const prefix = `weekly-images/week-${weekNumber}-${slotKey}`;
    const { blobs } = await list({ prefix });

    for (const blob of blobs) {
      await del(blob.url);
    }

    return NextResponse.json({ success: true, deleted: blobs.length });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
