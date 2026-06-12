import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#171717",
          color: "#FFFFFF",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          justifyContent: "center",
          width: "100%"
        }}
      >
        <div
          style={{
            alignItems: "center",
            background: "#F5F5F5",
            borderRadius: 112,
            color: "#171717",
            display: "flex",
            fontSize: 148,
            fontWeight: 800,
            height: 344,
            justifyContent: "center",
            letterSpacing: 0,
            width: 344
          }}
        >
          HM
        </div>
      </div>
    ),
    size
  );
}
