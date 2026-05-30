export function createPaymentProofFile() {
  const base64Png =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2P8z/C/HwAFgwJ/l8McZAAAAABJRU5ErkJggg==";

  return {
    name: "payment-proof.png",
    mimeType: "image/png",
    buffer: Buffer.from(base64Png, "base64"),
  };
}
