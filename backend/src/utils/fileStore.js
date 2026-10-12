import fs from "node:fs";
import mongoose from "mongoose";

// Uploads used to live on the server's disk, which hosts like Render's free
// tier wipe on every restart — leaving DB records pointing at vanished files.
// GridFS keeps the bytes in MongoDB itself, so they survive restarts and
// redeploys with no extra service to run.
const BUCKET_NAME = "uploads";
const FILE_URL_PREFIX = "/files/";

function getBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET_NAME });
}

// Moves a multer disk file into GridFS, deletes the temp copy, and returns
// the public URL path to store on the record (e.g. "/files/<id>").
export async function storeUploadedFile(file) {
  const bucket = getBucket();
  const upload = bucket.openUploadStream(file.originalname, {
    metadata: { contentType: file.mimetype },
  });

  await new Promise((resolve, reject) => {
    fs.createReadStream(file.path).pipe(upload).on("error", reject).on("finish", resolve);
  });
  fs.unlink(file.path, () => {});

  return `${FILE_URL_PREFIX}${upload.id}`;
}

// Best-effort removal of a stored file by the URL we handed out. Legacy
// "/uploads/..." URLs (from before GridFS) have nothing to delete.
export async function deleteStoredFile(url) {
  if (!url?.startsWith(FILE_URL_PREFIX)) return;
  try {
    await getBucket().delete(new mongoose.Types.ObjectId(url.slice(FILE_URL_PREFIX.length)));
  } catch {
    // already gone — nothing to do
  }
}

// GET /files/:id — public (img/audio tags can't send auth headers), with
// Range support so audio can seek and play on Safari/iOS, which refuses
// to play media from servers that ignore Range requests.
export async function serveStoredFile(req, res) {
  let id;
  try {
    id = new mongoose.Types.ObjectId(req.params.id);
  } catch {
    return res.status(404).end();
  }

  const files = await mongoose.connection.db
    .collection(`${BUCKET_NAME}.files`)
    .find({ _id: id })
    .limit(1)
    .toArray();
  const file = files[0];
  if (!file) return res.status(404).end();

  const size = file.length;
  res.setHeader("Content-Type", file.metadata?.contentType || "application/octet-stream");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");

  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    let start = range[1] === "" ? NaN : Number(range[1]);
    let end = range[2] === "" ? size - 1 : Number(range[2]);
    if (Number.isNaN(start)) {
      // suffix range: "bytes=-500" means the last 500 bytes
      start = Math.max(0, size - Number(range[2]));
      end = size - 1;
    }
    end = Math.min(end, size - 1);
    if (start > end || start >= size) {
      res.setHeader("Content-Range", `bytes */${size}`);
      return res.status(416).end();
    }
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${size}`);
    res.setHeader("Content-Length", end - start + 1);
    return getBucket()
      .openDownloadStream(id, { start, end: end + 1 })
      .on("error", () => res.end())
      .pipe(res);
  }

  res.setHeader("Content-Length", size);
  getBucket()
    .openDownloadStream(id)
    .on("error", () => res.end())
    .pipe(res);
}
