#!/bin/bash
# 写真をWeb掲載用に整える（内部ツール。サイトからは参照されない）
#
#   ./prepare-photo.sh <入力ファイル> <出力名>
#   例) ./prepare-photo.sh ~/icu-photos-inbox/IMG_1234.HEIC picco
#       → media/photos/picco.jpg が作られる
#
# やっていること:
#   1) HEIC（iPhoneの標準形式）なら JPEG に変換する
#   2) 長辺1600pxに縮小する（元の数MBのままだと表示が遅いため）
#   3) Exif（撮影場所のGPS・カメラ機種・撮影日時）を完全に削除する
#      → 病院内で撮った写真から撮影場所が特定されるのを防ぐ
#   4) 画質85%のJPEGとして media/photos/ に保存する

set -euo pipefail

SRC="${1:?使い方: ./prepare-photo.sh <入力ファイル> <出力名>}"
NAME="${2:?使い方: ./prepare-photo.sh <入力ファイル> <出力名>}"

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
OUTDIR="$REPO/media/photos"
OUT="$OUTDIR/$NAME.jpg"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$OUTDIR"

# 1) HEIC は macOS 標準の sips で JPEG に変換（PILはHEICを読めない）
case "${SRC##*.}" in
  heic|HEIC|heif|HEIF)
    sips -s format jpeg "$SRC" --out "$TMP/in.jpg" >/dev/null
    WORK="$TMP/in.jpg"
    ;;
  *)
    WORK="$SRC"
    ;;
esac

# 2-4) 縮小・Exif除去・保存
python3 - "$WORK" "$OUT" <<'PY'
import sys
from PIL import Image, ImageOps

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src)

# 撮影時の向き情報を画像そのものに反映してから、向き情報を捨てる
# （これをやらないと、縦で撮った写真が横向きで表示される）
im = ImageOps.exif_transpose(im)
im = im.convert("RGB")

# 長辺1600pxに縮小（すでに小さい画像は拡大しない）
LONG = 1600
w, h = im.size
if max(w, h) > LONG:
    if w >= h:
        im = im.resize((LONG, round(h * LONG / w)), Image.LANCZOS)
    else:
        im = im.resize((round(w * LONG / h), LONG), Image.LANCZOS)

# Image.new で作り直すことで、Exif・GPS・カラープロファイル等の
# 付帯情報を一切引き継がせない
clean = Image.new("RGB", im.size)
clean.putdata(list(im.getdata()))
clean.save(out, "JPEG", quality=85, optimize=True, progressive=True)

print(f"{out}  {clean.size[0]}x{clean.size[1]}")
PY

# 念のため、Exifが本当に消えているか確認する
if command -v exiftool >/dev/null 2>&1; then
  echo "--- 残っている情報の確認 ---"
  exiftool -GPS:all -Make -Model -DateTimeOriginal "$OUT"
else
  python3 -c "
from PIL import Image
im = Image.open('$OUT')
e = im.getexif()
print('Exif:', 'なし（OK）' if not e else f'残っている！ {dict(e)}')
"
fi

ls -lh "$OUT"
