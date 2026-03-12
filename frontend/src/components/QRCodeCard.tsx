interface QRCodeCardProps {
  url: string;
  label?: string;
  size?: number;
}

const QRCodeCard = ({ url, label, size = 200 }: QRCodeCardProps) => {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=000000&margin=10`;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="rounded-lg overflow-hidden border border-border bg-white"
        style={{ width: size, height: size }}
      >
        <img
          src={qrSrc}
          alt="QR Code"
          width={size}
          height={size}
          loading="lazy"
        />
      </div>
      {label && (
        <p className="text-xs text-muted-foreground font-body text-center break-all max-w-[200px]">
          {label}
        </p>
      )}
    </div>
  );
};

export default QRCodeCard;
