import { QRCodeSVG } from "qrcode.react";

interface QRCodeDisplayProps {
  url: string;
  sessionId: string;
}

export function QRCodeDisplay({ url, sessionId }: QRCodeDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-6 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
        QR-Code für Zuhörer
      </h3>
      <div className="rounded-lg bg-white p-4">
        <QRCodeSVG value={url} size={200} level="M" />
      </div>
      <div className="text-center">
        <p className="text-xs text-gray-400 break-all max-w-64">{url}</p>
        <p className="text-xs text-gray-400 mt-1">Session: {sessionId}</p>
      </div>
    </div>
  );
}
