"use client";

import { useRef, useState } from "react";
import { ScanBarcode } from "lucide-react";

type BarcodeScanButtonProps = {
  onDetected: (label: string) => void;
};

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

function getBarcodeDetector(): (new (options?: { formats: string[] }) => BarcodeDetectorLike) | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as typeof window & { BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorLike })
    .BarcodeDetector ?? null;
}

async function lookupProduct(code: string) {
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`);

    if (!response.ok) {
      return code;
    }

    const payload = (await response.json()) as {
      product?: { product_name?: string; brands?: string };
    };
    const name = payload.product?.product_name?.trim();
    const brand = payload.product?.brands?.split(",")[0]?.trim();

    if (name && brand) {
      return `${brand} ${name}`;
    }

    return name || code;
  } catch {
    return code;
  }
}

export function BarcodeScanButton({ onDetected }: BarcodeScanButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function handleFile(file: File) {
    const Detector = getBarcodeDetector();

    if (!Detector) {
      setStatus("Scan barcode butuh Chrome/Edge. Ketik nama barang di catatan.");
      return;
    }

    setStatus("Membaca barcode...");
    const bitmap = await createImageBitmap(file);
    const detector = new Detector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "qr_code", "code_128"] });
    const codes = await detector.detect(bitmap);
    bitmap.close();
    const value = codes[0]?.rawValue?.trim();

    if (!value) {
      setStatus("Barcode tidak terbaca. Ambil foto lebih dekat.");
      return;
    }

    const label = await lookupProduct(value);
    onDetected(label);
    setStatus(`Ketemu: ${label}`);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";

          if (file) {
            void handleFile(file);
          }
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-9 items-center gap-1.5 rounded-[12px] bg-white px-3 text-xs font-bold text-[#171717] shadow-sm"
      >
        <ScanBarcode size={15} strokeWidth={1.8} />
        Scan barcode
      </button>
      {status ? <p className="mt-1.5 text-[11px] font-medium text-[#737373]">{status}</p> : null}
    </div>
  );
}
