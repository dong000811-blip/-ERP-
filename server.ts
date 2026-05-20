import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import axios from "axios";
import admin from "firebase-admin";

dotenv.config();

// Initialize firebase-admin for Firestore access in webhook
// This uses Application Default Credentials in the cloud environment
if (!admin.apps.length) {
  admin.initializeApp();
}
const dbAdmin = admin.firestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Naver Webhook Receiver (Make.com)
  app.post("/api/naver/orders", async (req, res) => {
    try {
      const orderData = req.body;
      
      if (!orderData || !orderData.productOrderId) {
        console.warn("[Webhook] Invalid or empty order data received:", orderData);
        return res.status(400).json({ error: "INVALID_DATA", message: "productOrderId is required" });
      }

      console.log(`[Webhook] Received order: ${orderData.productOrderId} for ${orderData.ordererName}`);

      // Data Mapping for Firestore 'naverOrders' collection
      const docData = {
        productOrderId: orderData.productOrderId,
        ordererName: orderData.ordererName || "N/A",
        ordererTelNo: orderData.ordererTelNo || "N/A",
        productName: orderData.productName || "N/A",
        quantity: orderData.quantity || 1,
        totalPaymentAmount: orderData.totalPaymentAmount || 0,
        baseAddress: orderData.baseAddress || "",
        detailedAddress: orderData.detailedAddress || "",
        syncedAt: admin.firestore.FieldValue.serverTimestamp(),
        status: "New", // Default status for new webhook orders
        source: "make_webhook"
      };

      // Upsert to naverOrders collection using productOrderId as Document ID
      await dbAdmin.collection("naverOrders").doc(orderData.productOrderId).set(docData, { merge: true });

      res.status(200).json({ status: "ok", message: "Order processed successfully" });
    } catch (error: any) {
      console.error("[Webhook Error]:", error.message);
      res.status(500).json({ error: "INTERNAL_ERROR", message: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
