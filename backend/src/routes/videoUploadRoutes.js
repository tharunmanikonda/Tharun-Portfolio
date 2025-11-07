const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// In-memory storage for upload sessions
const uploadSessions = new Map();
const processedVideos = new Map();

// Initialize chunked upload session
router.post('/init', (req, res) => {
  const { fileName, fileSize, totalChunks, fileType, chunkSize } = req.body;

  if (!fileName || !fileSize || !totalChunks) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const uploadId = crypto.randomBytes(16).toString('hex');

  // Calculate chunk details
  const chunks = [];
  for (let i = 0; i < totalChunks; i++) {
    const isLast = i === totalChunks - 1;
    const size = isLast ? fileSize - (chunkSize * i) : chunkSize;
    chunks.push({
      index: i,
      size: size,
      status: 'pending',
      uploadedAt: null
    });
  }

  uploadSessions.set(uploadId, {
    fileName,
    fileSize,
    fileType: fileType || 'video',
    totalChunks,
    chunkSize,
    chunks,
    uploadedChunks: [],
    status: 'initialized',
    startTime: Date.now(),
    metadata: {
      mimeType: req.body.mimeType || getMimeType(fileType, fileName),
      duration: null
    }
  });

  res.json({
    uploadId,
    message: 'Upload session initialized',
    nextChunk: 0,
    chunks: chunks.map(c => ({ index: c.index, size: c.size }))
  });
});

function getMimeType(fileType, fileName) {
  if (fileType === 'video') return 'video/mp4';
  if (fileType === 'audio') return 'audio/mpeg';
  if (fileType === 'image') return 'image/jpeg';
  if (fileType === 'document') return 'application/pdf';

  // Fallback based on extension
  const ext = fileName.split('.').pop().toLowerCase();
  const mimeMap = {
    'mp4': 'video/mp4', 'avi': 'video/x-msvideo', 'mov': 'video/quicktime',
    'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'flac': 'audio/flac',
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png', 'gif': 'image/gif',
    'pdf': 'application/pdf', 'doc': 'application/msword', 'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return mimeMap[ext] || 'application/octet-stream';
}

// Upload individual chunk
router.post('/chunk/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const { chunkIndex, chunkSize, checksum } = req.body;

  const session = uploadSessions.get(uploadId);

  if (!session) {
    return res.status(404).json({ error: 'Upload session not found' });
  }

  // Simulate chunk validation
  if (session.uploadedChunks.includes(chunkIndex)) {
    return res.status(409).json({
      error: 'Chunk already uploaded',
      nextChunk: Math.max(...session.uploadedChunks) + 1
    });
  }

  // Simulate network delay (50-150ms)
  const delay = Math.floor(Math.random() * 100) + 50;

  setTimeout(() => {
    // Add chunk to uploaded list
    session.uploadedChunks.push(chunkIndex);
    session.uploadedChunks.sort((a, b) => a - b);

    // Update chunk status
    if (session.chunks[chunkIndex]) {
      session.chunks[chunkIndex].status = 'uploaded';
      session.chunks[chunkIndex].uploadedAt = Date.now();
    }

    const uploadedBytes = session.uploadedChunks.length * chunkSize;
    const progress = Math.min((uploadedBytes / session.fileSize) * 100, 100);

    // Check if upload is complete
    if (session.uploadedChunks.length === session.totalChunks) {
      session.status = 'processing';
      session.completedAt = Date.now();

      // Trigger processing simulation
      startProcessing(uploadId, session.fileType);

      return res.json({
        success: true,
        progress: 100,
        status: 'complete',
        message: 'Upload complete, starting processing...',
        chunks: session.chunks
      });
    }

    session.status = 'uploading';

    res.json({
      success: true,
      chunkIndex,
      uploadedChunks: session.uploadedChunks.length,
      totalChunks: session.totalChunks,
      progress: progress.toFixed(2),
      nextChunk: chunkIndex + 1,
      estimatedTimeRemaining: calculateETA(session),
      chunks: session.chunks
    });
  }, delay);
});

// Get upload status
router.get('/status/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const session = uploadSessions.get(uploadId);

  if (!session) {
    return res.status(404).json({ error: 'Upload session not found' });
  }

  const uploadedBytes = session.uploadedChunks.length * (session.fileSize / session.totalChunks);
  const progress = Math.min((uploadedBytes / session.fileSize) * 100, 100);

  res.json({
    uploadId,
    fileName: session.fileName,
    fileSize: session.fileSize,
    uploadedChunks: session.uploadedChunks.length,
    totalChunks: session.totalChunks,
    progress: progress.toFixed(2),
    status: session.status,
    metadata: session.metadata,
    processingStage: session.processingStage || null
  });
});

// Pause upload (client-side action, just returns current state)
router.post('/pause/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const session = uploadSessions.get(uploadId);

  if (!session) {
    return res.status(404).json({ error: 'Upload session not found' });
  }

  session.status = 'paused';

  res.json({
    message: 'Upload paused',
    uploadedChunks: session.uploadedChunks.length,
    nextChunk: Math.max(...session.uploadedChunks, -1) + 1
  });
});

// Resume upload
router.post('/resume/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const session = uploadSessions.get(uploadId);

  if (!session) {
    return res.status(404).json({ error: 'Upload session not found' });
  }

  session.status = 'uploading';

  res.json({
    message: 'Upload resumed',
    nextChunk: Math.max(...session.uploadedChunks, -1) + 1
  });
});

// Cancel upload
router.delete('/cancel/:uploadId', (req, res) => {
  const { uploadId } = req.params;

  if (!uploadSessions.has(uploadId)) {
    return res.status(404).json({ error: 'Upload session not found' });
  }

  uploadSessions.delete(uploadId);

  res.json({
    message: 'Upload cancelled and cleaned up'
  });
});

// Helper: Calculate ETA
function calculateETA(session) {
  const elapsedTime = Date.now() - session.startTime;
  const uploadedChunks = session.uploadedChunks.length;
  const remainingChunks = session.totalChunks - uploadedChunks;

  if (uploadedChunks === 0) return 'Calculating...';

  const avgTimePerChunk = elapsedTime / uploadedChunks;
  const eta = Math.round((remainingChunks * avgTimePerChunk) / 1000); // in seconds

  if (eta < 60) return `${eta}s`;
  if (eta < 3600) return `${Math.round(eta / 60)}m`;
  return `${Math.round(eta / 3600)}h`;
}

// Get processing stages based on file type
function getProcessingStages(fileType) {
  const stagesByType = {
    video: [
      { name: 'validating', duration: 1000, message: 'Validating video format...' },
      { name: 'extracting_metadata', duration: 1500, message: 'Extracting metadata (duration, resolution, codec)...' },
      { name: 'generating_thumbnail', duration: 2000, message: 'Generating thumbnails...' },
      { name: 'transcoding_360p', duration: 3000, message: 'Transcoding to 360p (H.264)...' },
      { name: 'transcoding_720p', duration: 3500, message: 'Transcoding to 720p (H.264)...' },
      { name: 'transcoding_1080p', duration: 4000, message: 'Transcoding to 1080p (H.264)...' },
      { name: 'hls_segmentation', duration: 2500, message: 'Creating HLS segments for streaming...' },
      { name: 'optimizing', duration: 2000, message: 'Optimizing for web delivery...' },
      { name: 'complete', duration: 500, message: 'Video processing complete!' }
    ],
    audio: [
      { name: 'validating', duration: 800, message: 'Validating audio format...' },
      { name: 'extracting_metadata', duration: 1000, message: 'Extracting metadata (bitrate, sample rate)...' },
      { name: 'generating_waveform', duration: 1500, message: 'Generating waveform visualization...' },
      { name: 'transcoding_mp3', duration: 2000, message: 'Transcoding to MP3 (320kbps)...' },
      { name: 'transcoding_aac', duration: 2000, message: 'Transcoding to AAC (256kbps)...' },
      { name: 'normalizing', duration: 1500, message: 'Normalizing audio levels...' },
      { name: 'optimizing', duration: 1000, message: 'Optimizing for streaming...' },
      { name: 'complete', duration: 500, message: 'Audio processing complete!' }
    ],
    image: [
      { name: 'validating', duration: 500, message: 'Validating image format...' },
      { name: 'extracting_metadata', duration: 800, message: 'Extracting EXIF data...' },
      { name: 'generating_thumbnail', duration: 1000, message: 'Generating thumbnail (150x150)...' },
      { name: 'resizing_small', duration: 1200, message: 'Creating small version (480px)...' },
      { name: 'resizing_medium', duration: 1500, message: 'Creating medium version (1024px)...' },
      { name: 'resizing_large', duration: 1800, message: 'Creating large version (2048px)...' },
      { name: 'converting_webp', duration: 1500, message: 'Converting to WebP format...' },
      { name: 'optimizing', duration: 1000, message: 'Compressing and optimizing...' },
      { name: 'complete', duration: 300, message: 'Image processing complete!' }
    ],
    document: [
      { name: 'validating', duration: 600, message: 'Validating document format...' },
      { name: 'extracting_metadata', duration: 1000, message: 'Extracting document metadata...' },
      { name: 'generating_preview', duration: 2000, message: 'Generating preview images...' },
      { name: 'text_extraction', duration: 1800, message: 'Extracting text for search indexing...' },
      { name: 'creating_thumbnail', duration: 1200, message: 'Creating thumbnail from first page...' },
      { name: 'virus_scan', duration: 2500, message: 'Running security scan...' },
      { name: 'optimizing', duration: 1500, message: 'Compressing PDF...' },
      { name: 'complete', duration: 400, message: 'Document processing complete!' }
    ]
  };

  return stagesByType[fileType] || stagesByType.video;
}

// Simulate media processing pipeline
function startProcessing(uploadId, fileType = 'video') {
  const session = uploadSessions.get(uploadId);
  if (!session) return;

  const stages = getProcessingStages(fileType);

  let currentStage = 0;

  function processStage() {
    if (currentStage >= stages.length) {
      session.status = 'ready';
      session.processingStage = null;

      // Store processed video info
      processedVideos.set(uploadId, {
        fileName: session.fileName,
        fileSize: session.fileSize,
        duration: '2:45', // Simulated
        resolutions: ['360p', '720p', '1080p'],
        thumbnail: `https://via.placeholder.com/320x180/667/fff?text=${encodeURIComponent(session.fileName)}`,
        streamingUrl: `/stream/${uploadId}`,
        processedAt: Date.now()
      });

      return;
    }

    const stage = stages[currentStage];
    session.processingStage = {
      name: stage.name,
      message: stage.message,
      progress: Math.round((currentStage / stages.length) * 100)
    };

    setTimeout(() => {
      currentStage++;
      processStage();
    }, stage.duration);
  }

  processStage();
}

// Get processed video info
router.get('/processed/:uploadId', (req, res) => {
  const { uploadId } = req.params;
  const video = processedVideos.get(uploadId);

  if (!video) {
    return res.status(404).json({ error: 'Video not found or still processing' });
  }

  res.json(video);
});

module.exports = router;
