var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
import_dotenv.default.config();
if (!import_firebase_admin.default.apps.length) {
  import_firebase_admin.default.initializeApp();
}
var dbAdmin = import_firebase_admin.default.firestore();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/naver/orders", async (req, res) => {
    try {
      const orderData = req.body;
      if (!orderData || !orderData.productOrderId) {
        console.warn("[Webhook] Invalid or empty order data received:", orderData);
        return res.status(400).json({ error: "INVALID_DATA", message: "productOrderId is required" });
      }
      console.log(`[Webhook] Received order: ${orderData.productOrderId} for ${orderData.ordererName}`);
      const docData = {
        productOrderId: orderData.productOrderId,
        ordererName: orderData.ordererName || "N/A",
        ordererTelNo: orderData.ordererTelNo || "N/A",
        productName: orderData.productName || "N/A",
        quantity: orderData.quantity || 1,
        totalPaymentAmount: orderData.totalPaymentAmount || 0,
        baseAddress: orderData.baseAddress || "",
        detailedAddress: orderData.detailedAddress || "",
        syncedAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp(),
        status: "New",
        // Default status for new webhook orders
        source: "make_webhook"
      };
      await dbAdmin.collection("naverOrders").doc(orderData.productOrderId).set(docData, { merge: true });
      res.status(200).json({ status: "ok", message: "Order processed successfully" });
    } catch (error) {
      console.error("[Webhook Error]:", error.message);
      res.status(500).json({ error: "INTERNAL_ERROR", message: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
