import { NextResponse } from 'next/server';
import { put, list, del } from '@vercel/blob';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_SLOTS = 3;

function extensionFromType(type) {
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
  return map[type] || 'png';
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const weekNumber = parseInt(formData.get('weekNumber'), 10);
    const slot = parseInt(formData.get('slot'), 10);

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}` }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 5MB.' }, { status: 400 });
    }
    if (isNaN(weekNumber) || weekNumber < 1 || weekNumber > 52) {
      return NextResponse.json({ error: 'Invalid week number (1-52)' }, { status: 400 });
    }
    if (isNaN(slot) || slot < 0 || slot >= MAX_SLOTS) {
      return NextResponse.json({ error: `Invalid slot (0-${MAX_SLOTS - 1})` }, { status: 400 });
    }

    // Delete existing image at this slot
    const prefix = `weekly-images/week-${weekNumber}-slot-${slot}`;
    try {
      const { blobs } = await list({ prefix });
      for (const blob of blobs) {
        await del(blob.url);
      }
    } catch (e) {
      // Ignore delete errors — slot may be empty
    }

    // Upload new image
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
        slot,
        originalName: file.name || `image-${slot}.${ext}`,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { weekNumber, slot } = await request.json();

    if (!weekNumber || slot === undefined) {
      return NextResponse.json({ error: 'weekNumber and slot required' }, { status: 400 });
    }

    const prefix = `weekly-images/week-${weekNumber}-slot-${slot}`;
    const { blobs } = await list({ prefix });

    for (const blob of blobs) {
      await del(blob.url);
    }

    return NextResponse.json({ success: true, deleted: blobs.length });
  } catch (error) {
    console.error('Image delete error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
