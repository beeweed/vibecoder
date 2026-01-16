import { type NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const { files } = await request.json();

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files to export' },
        { status: 400 }
      );
    }

    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.path, file.content);
    }

    const zipArrayBuffer = await zip.generateAsync({ type: 'arraybuffer' });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    return new NextResponse(zipArrayBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="vibecoder-export-${timestamp}.zip"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
