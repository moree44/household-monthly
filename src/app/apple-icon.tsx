import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180
};

export const contentType = "image/png";

export default function AppleIcon() {
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
            borderRadius: 40,
            color: "#171717",
            display: "flex",
            fontSize: 52,
            fontWeight: 800,
            height: 120,
            justifyContent: "center",
            letterSpacing: 0,
            width: 120
          }}
        >
          HM
        </div>
      </div>
    ),
    size
  );
}
