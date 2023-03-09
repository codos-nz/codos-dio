import { ImageResponse } from "@vercel/og";
import backgroundDots from "../../assets/background-dots.svg";

export const config = {
  runtime: "edge",
};

export default async function handler() {
  return new ImageResponse(
    (
      <div
        class="absolute inset-0 z-0 overflow-hidden"
        style={{
          display: "flex",
          textAlign: "center",
          justifyContent: "center",
          alignItems: "center",
          margin: 0,
          maxWidth: "100vw",
          backgroundSize: "100% 100%",
          backgroundPosition: "0px 0px, 0px 0px",
          backgroundImage:
            "radial-gradient(100% 100% at 93% 99%, #104735ff 0%, #07041100 100%),radial-gradient(100% 100% at 0% 100%, #46111e 0%, #070411ff 100%)",
        }}
      >
        <img
          class="bubbles object-cover"
          src={backgroundDots}
          alt="bubbly background"
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
