import { GiftProvider } from "../config/GiftContext";
import { SAMPLE_GIFT } from "../config/sampleGift";
import App from "../App";

/* Plays the bundled sample gift — no backend needed. Secret code is "always". */
export function Demo() {
  return (
    <GiftProvider gift={SAMPLE_GIFT}>
      <App />
    </GiftProvider>
  );
}
