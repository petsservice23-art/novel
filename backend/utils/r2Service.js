const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for Cloudflare R2 to prevent DNS lookup errors
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'novelverse';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-b1544d29b48d4b3cb7a1972a2a3b6b70.r2.dev';

/**
 * Uploads chapter content (string or array of paragraphs) to Cloudflare R2
 */
const uploadChapterContent = async (novelId, chapterNumber, content) => {
  const key = `novels/${novelId}/chapter_${chapterNumber}.json`;
  const bodyData = typeof content === 'string' ? content : JSON.stringify(content);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: bodyData,
    ContentType: typeof content === 'string' ? 'text/plain; charset=utf-8' : 'application/json',
  });

  await s3Client.send(command);
  return key;
};

/**
 * Retrieves chapter content from Cloudflare R2 by key
 */
const getChapterContent = async (key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    const bodyString = await response.Body.transformToString();

    try {
      return JSON.parse(bodyString);
    } catch {
      return bodyString;
    }
  } catch (error) {
    console.error(`Error fetching key ${key} from R2:`, error.message);
    return null;
  }
};

/**
 * Uploads an image (like book cover or illustration) to R2
 */
const uploadImage = async (key, buffer, contentType = 'image/jpeg') => {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return `${PUBLIC_URL}/${key}`;
};

/**
 * Deletes an object from R2
 */
const deleteR2Object = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (err) {
    console.error(`Failed to delete ${key} from R2:`, err.message);
    return false;
  }
};

module.exports = {
  s3Client,
  uploadChapterContent,
  getChapterContent,
  uploadImage,
  deleteR2Object,
  BUCKET_NAME,
  PUBLIC_URL
};
