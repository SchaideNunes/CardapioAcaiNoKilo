import fs from 'fs';
import { PNG } from 'pngjs';

const inputPath = 'public/assets/mascoteComendoBosta.png';
const outputPath = 'public/assets/Mascote_comendo.png';

fs.createReadStream(inputPath)
  .pipe(new PNG({ filterType: 4 }))
  .on('parsed', function() {
    const width = this.width;
    const height = this.height;
    const data = this.data;

    // Check pixel at (0,0)
    console.log(`Dimensions: ${width}x${height}`);
    console.log(`Top-left pixel: R=${data[0]}, G=${data[1]}, B=${data[2]}, A=${data[3]}`);

    // Flood fill from border
    const visited = new Uint8Array(width * height);
    const queue = [];

    // Helper to get index
    function getIdx(x, y) {
      return (y * width + x) * 4;
    }

    function isBackground(x, y) {
      const idx = getIdx(x, y);
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a === 0) return true;

      // Checkerboard is white (#FFFFFF) and light gray (#E0E0E0 to #F0F0F0)
      const isWhite = r >= 240 && g >= 240 && b >= 240;
      const isGray = r >= 195 && r <= 240 && g >= 195 && g <= 240 && b >= 195 && b <= 240 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15;

      return isWhite || isGray;
    }

    // Add enclosed seeds
    queue.push([620, 480]);
    visited[480 * width + 620] = 1;
    queue.push([310, 760]);
    visited[760 * width + 310] = 1;

    // Add all border pixels
    for (let x = 0; x < width; x++) {
      if (isBackground(x, 0)) {
        queue.push([x, 0]);
        visited[0 * width + x] = 1;
      }
      if (isBackground(x, height - 1)) {
        queue.push([x, height - 1]);
        visited[(height - 1) * width + x] = 1;
      }
    }
    for (let y = 0; y < height; y++) {
      if (isBackground(0, y)) {
        queue.push([0, y]);
        visited[y * width + 0] = 1;
      }
      if (isBackground(width - 1, y)) {
        queue.push([width - 1, y]);
        visited[y * width + (width - 1)] = 1;
      }
    }

    console.log(`Starting floodfill with ${queue.length} seeds...`);

    let transparentCount = 0;
    let head = 0;
    while (head < queue.length) {
      const [x, y] = queue[head++];
      const idx = getIdx(x, y);
      data[idx + 3] = 0; // Set Alpha to 0
      transparentCount++;

      const neighbors = [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const vIdx = ny * width + nx;
          if (!visited[vIdx] && isBackground(nx, ny)) {
            visited[vIdx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }

    console.log(`Made ${transparentCount} pixels transparent!`);

    this.pack().pipe(fs.createWriteStream(outputPath)).on('finish', () => {
      console.log('Saved transparent PNG to ' + outputPath);
    });
  });
