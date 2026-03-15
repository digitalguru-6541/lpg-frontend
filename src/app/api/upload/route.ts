import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";

export async function POST(req: Request) {
  try {
    // 1. DYNAMIC ENV CHECK: Read variables at runtime inside the request
    const projectId = process.env.GCP_PROJECT_ID;
    const clientEmail = process.env.GCP_CLIENT_EMAIL;
    const privateKey = process.env.GCP_PRIVATE_KEY;
    const bucketName = process.env.GCS_BUCKET_NAME;

    // Log what the server actually sees (hiding the actual private key value for safety)
    console.log("🔍 DIAGNOSTIC ENV CHECK:", {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      foundBucketName: bucketName || "MISSING",
    });

    // 2. STRICT GATEKEEPER: Stop immediately if bucket is missing
    if (!bucketName) {
      console.error("🚨 FATAL: GCS_BUCKET_NAME is undefined. Check your .env.local file.");
      return NextResponse.json(
        { error: "Server Configuration Error: GCS_BUCKET_NAME is missing in .env.local" },
        { status: 500 }
      );
    }

    // 3. INITIALIZE STORAGE
    const storage = new Storage({
      projectId: projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey?.replace(/\\n/g, "\n"),
      },
    });

    // 4. Parse the incoming file
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided for upload." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Only images are permitted." }, { status: 403 });
    }

    // 5. Upload to Google Cloud Storage
    const bucket = storage.bucket(bucketName);
    const uniqueFilename = `properties/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const blob = bucket.file(uniqueFilename);

    const buffer = Buffer.from(await file.arrayBuffer());

    await blob.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFilename}`;

    console.log(`✅ Successfully uploaded to GCS: ${publicUrl}`);

    return NextResponse.json({ url: publicUrl, success: true }, { status: 200 });
  } catch (error) {
    console.error("🚨 GCS Upload Failed:", error);
    return NextResponse.json({ error: "Internal Server Error during file upload." }, { status: 500 });
  }
}