/**
 * manifest용 아이콘 생성 (선언된 크기와 일치하는 PNG)
 * sharp로 각 크기별로 실제 해상도의 PNG 생성
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'public', 'icons');
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const themeColor = { r: 224, g: 123, b: 84 }; // #E07B54

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

async function run() {
  for (const size of sizes) {
    const buffer = await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: themeColor,
      },
    })
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(dir, `icon-${size}x${size}.png`), buffer);
  }
  console.log('Created', sizes.length, 'icons with correct dimensions in public/icons');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
