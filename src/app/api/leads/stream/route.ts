import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// 🚀 BULLETPROOF PRISMA INITIALIZATION
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Declare interval outside so both start() and cancel() can access it
  let intervalId: NodeJS.Timeout;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // 🚀 SAFE PUSH HELPER
      const push = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data));
        } catch (e) {
          // If enqueue fails (e.g., Next.js already destroyed the controller), kill the loop instantly
          clearInterval(intervalId);
        }
      };

      // Initial connection handshake
      push(`event: connected\ndata: {"status": "Stream Open"}\n\n`);

      let lastSnapshot = "";

      // 🚀 DETACHED DATABASE CHECK
      // This runs independently and does not block the stream's main thread
      const fetchUpdates = async () => {
        try {
          const leads = await prisma.lead.findMany({
            orderBy: { createdAt: 'desc' }
          });

          // Create a lightweight hash
          const currentSnapshot = JSON.stringify(
            leads.map(l => ({
              id: l.id, status: l.status, updatedAt: l.updatedAt, 
              chatSummary: l.chatSummary, reminderDate: l.reminderDate, score: l.score
            }))
          );

          // Push update if changed
          if (currentSnapshot !== lastSnapshot) {
            push(`event: update\ndata: ${JSON.stringify(leads)}\n\n`);
            lastSnapshot = currentSnapshot;
          }
        } catch (error) {
          // Silently ignore DB fetch errors so the stream doesn't crash
        }
      };

      // Run the check every 5 seconds
      intervalId = setInterval(fetchUpdates, 5000);
    },
    
    // 🚀 THE MAGIC FIX
    // This native method is instantly triggered by Next.js when the user navigates away
    cancel() {
      clearInterval(intervalId);
      // Notice there is NO controller.close() here. Next.js handles it.
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', 
    },
  });
}