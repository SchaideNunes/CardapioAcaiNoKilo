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

    const visited = new Uint8Array(width * height);

    function isCheckerPixel(x, y) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      if (a === 0) return true;

      const isWhite = r >= 244 && g >= 244 && b >= 244;
      const isGray = r >= 190 && r <= 246 && g >= 190 && g <= 246 && b >= 190 && b <= 246 && Math.abs(r - g) <= 12 && Math.abs(g - b) <= 12;

      return isWhite || isGray;
    }

    let totalRemoved = 0;

    // Scan all pixels and find connected white/gray components
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const vIdx = y * width + x;
        if (!visited[vIdx] && isCheckerPixel(x, y)) {
          const comp = [];
          const queue = [[x, y]];
          visited[vIdx] = 1;
          let hasGray = false;
          let touchesBorder = false;

          while (queue.length > 0) {
            const [cx, cy] = queue.pop();
            comp.push([cx, cy]);

            if (cx === 0 || cx === width - 1 || cy === 0 || cy === height - 1) {
              touchesBorder = true;
            }

            const cIdx = (cy * width + cx) * 4;
            const r = data[cIdx];
            const g = data[cIdx + 1];
            const b = data[cIdx + 2];

            // True gray checkerboard pixel (not pure character highlight)
            if (r >= 195 && r <= 242 && g >= 195 && g <= 242 && b >= 195 && b <= 242 && Math.abs(r - g) <= 8 && Math.abs(g - b) <= 8) {
              hasGray = true;
            }

            const neighbors = [
              [cx + 1, cy],
              [cx - 1, cy],
              [cx, cy + 1],
              [cx, cy - 1]
            ];

            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nv = ny * width + nx;
                if (!visited[nv] && isCheckerPixel(nx, ny)) {
                  visited[nv] = 1;
                  queue.push([nx, ny]);
                }
              }
            }
          }

          // If it touches border OR contains gray checkerboard pixels, it is background!
          // Exclude teeth (y between 420 and 480, x between 440 and 640)
          const isTeeth = comp.every(([px, py]) => px >= 440 && px <= 640 && py >= 420 && py <= 480);

          if ((touchesBorder || hasGray) && !isTeeth) {
            for (const [px, py] of comp) {
              const idx = (py * width + px) * 4;
              data[idx + 3] = 0; // Alpha = 0
              totalRemoved++;
            }
          }
        }
      }
    }

    console.log(`Total removed background pixels: ${totalRemoved}`);

    this.pack().pipe(fs.createWriteStream(outputPath)).on('finish', () => {
      console.log('Saved 100% transparent PNG to ' + outputPath);
    });
  });
